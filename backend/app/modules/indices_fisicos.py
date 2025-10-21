import numpy as np
from app.models import IndicesFisicosInput, IndicesFisicosOutput
from typing import Optional

# Definindo uma pequena tolerância para evitar divisão por zero em alguns casos
EPSILON = 1e-9

def calcular_indices_fisicos(dados: IndicesFisicosInput) -> IndicesFisicosOutput:
    """
    Calcula as propriedades e índices físicos do solo a partir de diferentes
    combinações de dados de entrada, utilizando as relações fundamentais.
    Prioriza cálculos mais diretos e tenta derivar o máximo de informações.
    Retorna os resultados em unidades consistentes (kN/m³, adimensional ou %).
    Inclui cálculo de Compacidade Relativa (Dr) se emax e emin forem fornecidos.
    Calcula volumes e massas reais (não normalizados) para o diagrama.

    Referências Principais:
    - PDF: 4. Indices_Fisicos_2022-Maro.pdf
    """
    try:
        # Inicializa variáveis a partir dos dados de entrada
        w: Optional[float] = dados.umidade / 100 if dados.umidade is not None else None
        n: Optional[float] = dados.porosidade / 100 if dados.porosidade is not None else None
        S: Optional[float] = dados.grau_saturacao / 100 if dados.grau_saturacao is not None else None
        e: Optional[float] = dados.indice_vazios
        gs: Optional[float] = dados.Gs
        gama_s: Optional[float] = dados.peso_especifico_solidos
        gama_nat: Optional[float] = dados.peso_especifico_natural
        gama_d: Optional[float] = dados.peso_especifico_seco
        gama_w: float = dados.peso_especifico_agua
        mu_in: Optional[float] = dados.peso_total # Massa úmida em 'g' (assumido)
        ms_in: Optional[float] = dados.peso_solido # Massa seca em 'g' (assumido)
        v_in: Optional[float] = dados.volume_total # Volume total em 'cm³' (assumido)
        emax: Optional[float] = dados.indice_vazios_max
        emin: Optional[float] = dados.indice_vazios_min

        # Variáveis calculadas (índices)
        gama_sat: Optional[float] = None
        gama_sub: Optional[float] = None
        Dr: Optional[float] = None
        classificacao_compacidade: Optional[str] = None

        # Variáveis calculadas (volumes/massas reais - cm³/g)
        v_calc: Optional[float] = v_in # Volume total
        vs_calc: Optional[float] = None # Volume sólidos
        vv_calc: Optional[float] = None # Volume vazios
        vw_calc: Optional[float] = None # Volume água
        va_calc: Optional[float] = None # Volume ar
        mt_calc: Optional[float] = mu_in # Massa total
        ms_calc: Optional[float] = ms_in # Massa sólidos
        mw_calc: Optional[float] = None # Massa água

        # γw em g/cm³ (aproximação comum)
        # Se precisar de alta precisão, usar γw = 9.81 kN/m³ => ~0.999 g/cm³ a 4°C
        gama_w_gcm3 = 1.0 if np.isclose(gama_w, 10.0, rtol=1e-2) else gama_w / 9.81

        # --- CÁLCULOS DIRETOS PRIORITÁRIOS (mantidos) ---
        if w is None and mu_in is not None and ms_in is not None:
            if ms_in <= EPSILON: raise ValueError("Massa/Peso seco não pode ser zero para calcular umidade.")
            if mu_in < ms_in - EPSILON: raise ValueError("Massa/Peso úmido menor que seco.")
            w = (mu_in - ms_in) / ms_in
            mw_calc = mu_in - ms_in # Calcula massa de água
        elif mw_calc is None and mu_in is not None and ms_in is not None:
             mw_calc = mu_in - ms_in

        if gama_nat is None and mu_in is not None and v_in is not None:
             if v_in <= EPSILON: raise ValueError("Volume total não pode ser zero.")
             gama_nat_gcm3 = mu_in / v_in
             gama_nat = gama_nat_gcm3 * gama_w / gama_w_gcm3
        if gama_d is None and ms_in is not None and v_in is not None:
            if v_in <= EPSILON: raise ValueError("Volume total não pode ser zero.")
            gama_d_gcm3 = ms_in / v_in
            gama_d = gama_d_gcm3 * gama_w / gama_w_gcm3
        if gama_d is None and gama_nat is not None and w is not None:
             if 1 + w <= EPSILON: raise ValueError("Umidade (w) inválida (-100% ou menos)")
             gama_d = gama_nat / (1 + w)

        # --- Lógica de Cálculo em Cascata (mantida para índices) ---
        # ... (cálculos de Gs, gama_s, e, n como antes) ...
        if gs is None and gama_s is not None:
            if gama_w <= EPSILON: raise ValueError("Peso específico da água não pode ser zero.")
            gs = gama_s / gama_w
        elif gama_s is None and gs is not None:
            gama_s = gs * gama_w
        elif gs is not None and gama_s is not None:
             if not np.isclose(gama_s, gs * gama_w, rtol=1e-3):
                 return IndicesFisicosOutput(erro=f"Gs ({gs}) e Peso Específico dos Sólidos ({gama_s} kN/m³) são inconsistentes para γw={gama_w} kN/m³.")

        if e is None and n is not None:
            if abs(1 - n) <= EPSILON: raise ValueError("Porosidade (n) não pode ser 100%")
            e = n / (1 - n)
        elif n is None and e is not None:
            if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
            n = e / (1 + e)

        if e is None and gama_d is not None:
            if gs is not None:
                if gama_d <= EPSILON: e = float('inf') if gs > EPSILON else None
                else:
                    e = (gs * gama_w) / gama_d - 1
                    if e < -EPSILON: raise ValueError(f"Cálculo resultou em índice de vazios negativo ({e:.4f}). Verifique γd ({gama_d}) e Gs ({gs}).")
                    elif e < 0: e = 0.0
            elif gama_s is not None:
                 if gama_d <= EPSILON: e = float('inf') if gama_s > EPSILON else None
                 else:
                     e = gama_s / gama_d - 1
                     if e < -EPSILON: raise ValueError(f"Cálculo resultou em índice de vazios negativo ({e:.4f}). Verifique γd ({gama_d}) e γs ({gama_s}).")
                     elif e < 0: e = 0.0

        if n is None and e is not None:
             if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
             n = e / (1 + e)

        if gs is None and gama_d is not None and e is not None:
            if abs(gama_w) > EPSILON:
                 gs = gama_d * (1 + e) / gama_w
                 if gs < 0: raise ValueError("Cálculo resultou em Gs negativo.")
                 if gama_s is None: gama_s = gs * gama_w

        # (Lógica para Dr mantida)
        if e is not None and emax is not None and emin is not None:
            if e < emin - EPSILON or e > emax + EPSILON:
                classificacao_compacidade = "Índice de vazios (e) fora da faixa [emin, emax]"
            else:
                denominador_dr = emax - emin
                Dr = ((emax - e) / denominador_dr) * 100
                Dr = max(0, min(Dr, 100))
                if Dr <= 15: classificacao_compacidade = "Muito Fofa"
                elif Dr <= 35: classificacao_compacidade = "Fofa"
                elif Dr <= 65: classificacao_compacidade = "Média"
                elif Dr <= 85: classificacao_compacidade = "Compacta"
                else: classificacao_compacidade = "Muito Compacta"

        # (Lógica Se=wGs mantida)
        if S is None and w is not None and gs is not None and e is not None:
             if e <= EPSILON: S = 0.0
             else: S = (w * gs) / e
             S = max(0.0, min(S, 1.0))
        elif w is None and S is not None and e is not None and gs is not None:
             if gs <= EPSILON: w = 0.0 if S * e <= EPSILON else float('inf')
             else: w = (S * e) / gs
             if w < 0: w = 0.0
        elif e is None and w is not None and gs is not None and S is not None:
            if S <= EPSILON:
                if w > EPSILON: raise ValueError("Saturação (S) não pode ser 0 se a umidade (w) for maior que 0.")
            else:
                e = (w * gs) / S
                if e < 0: raise ValueError("Cálculo resultou em índice de vazios negativo.")

        if n is None and e is not None:
             if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
             n = e / (1 + e)

        # (Lógica γnat, γd, γsat, γsub mantida)
        if gama_nat is None:
            if gama_d is not None and w is not None: gama_nat = gama_d * (1 + w)
            elif gs is not None and e is not None and S is not None:
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_nat = gama_w * (gs + S * e) / (1 + e)
        if gama_d is None:
             if gama_nat is not None and w is not None:
                  if abs(1 + w) <= EPSILON: raise ValueError("Umidade (w) inválida")
                  gama_d = gama_nat / (1 + w)
             elif gs is not None and e is not None:
                  if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                  gama_d = (gs * gama_w) / (1 + e)
        if gama_sat is None:
             if gs is not None and e is not None:
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_sat = gama_w * (gs + e) / (1 + e)
             elif gama_d is not None and e is not None:
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_sat = gama_d + (e * gama_w / (1 + e))
        if gama_sub is None and gama_sat is not None:
            gama_sub = gama_sat - gama_w
            if gama_sub < 0: gama_sub = 0.0

        # --- CÁLCULO DOS VOLUMES E MASSAS REAIS (cm³/g) ---
        # Prioridade: Usar V e Ms/Mu se disponíveis, senão derivar de e, Gs, w, S
        if v_calc is None and mt_calc is not None and gama_nat is not None and gama_w > EPSILON and gama_w_gcm3 > EPSILON:
            # Calcula V a partir de Mt e γnat (convertido para g/cm³)
            gama_nat_gcm3_calc = gama_nat * gama_w_gcm3 / gama_w
            if gama_nat_gcm3_calc > EPSILON:
                v_calc = mt_calc / gama_nat_gcm3_calc

        if ms_calc is None and mt_calc is not None and w is not None:
             if 1 + w > EPSILON:
                 ms_calc = mt_calc / (1 + w)
                 if mw_calc is None: mw_calc = mt_calc - ms_calc
        elif mw_calc is None and mt_calc is not None and ms_calc is not None:
             mw_calc = mt_calc - ms_calc

        # Calcular Vs
        if vs_calc is None and ms_calc is not None and gs is not None and gama_w_gcm3 > EPSILON:
            vs_calc = ms_calc / (gs * gama_w_gcm3) # V = M / (Gs * rho_w)
        elif vs_calc is None and v_calc is not None and e is not None:
             if 1 + e > EPSILON:
                 vs_calc = v_calc / (1 + e)
        elif vs_calc is None and v_calc is not None and n is not None:
             vs_calc = v_calc * (1 - n)

        # Calcular Vv
        if vv_calc is None and v_calc is not None and vs_calc is not None:
            vv_calc = v_calc - vs_calc
        elif vv_calc is None and vs_calc is not None and e is not None:
             vv_calc = vs_calc * e

        # Calcular Vw
        if vw_calc is None and mw_calc is not None and gama_w_gcm3 > EPSILON:
            vw_calc = mw_calc / gama_w_gcm3
        elif vw_calc is None and vv_calc is not None and S is not None:
             vw_calc = vv_calc * S

        # Calcular Va
        if va_calc is None and vv_calc is not None and vw_calc is not None:
            va_calc = vv_calc - vw_calc

        # Recalcular V total se não foi dado inicialmente
        if v_calc is None and vs_calc is not None and vv_calc is not None:
            v_calc = vs_calc + vv_calc
        # Recalcular M total se não foi dado inicialmente
        if mt_calc is None and ms_calc is not None and mw_calc is not None:
            mt_calc = ms_calc + mw_calc


        # --- Verificações Finais e Preparação da Saída ---
        precisao_gama = 3
        precisao_indice = 4
        precisao_perc = 2
        precisao_vol = 3 # Precisão para volumes calculados (cm³)
        precisao_massa = 2 # Precisão para massas calculadas (g)

        # Arredondamentos (mantidos)
        gama_nat = round(gama_nat, precisao_gama) if gama_nat is not None else None
        gama_d = round(gama_d, precisao_gama) if gama_d is not None else None
        gama_sat = round(gama_sat, precisao_gama) if gama_sat is not None else None
        gama_sub = round(gama_sub, precisao_gama) if gama_sub is not None else None
        gama_s = round(gama_s, precisao_gama) if gama_s is not None else None
        gs = round(gs, precisao_indice) if gs is not None else None
        e = round(e, precisao_indice) if e is not None else None
        w_out = round(w * 100, precisao_perc) if w is not None else None
        n_out = round(n * 100, precisao_perc) if n is not None else None
        S_out = round(S * 100, precisao_perc) if S is not None else None
        Dr_out = round(Dr, precisao_perc) if Dr is not None else None

        # Arredondamentos para volumes/massas calculados
        v_calc_out = round(v_calc, precisao_vol) if v_calc is not None else None
        vs_calc_out = round(vs_calc, precisao_vol) if vs_calc is not None else None
        vw_calc_out = round(vw_calc, precisao_vol) if vw_calc is not None else None
        va_calc_out = round(va_calc, precisao_vol) if va_calc is not None else None
        mt_calc_out = round(mt_calc, precisao_massa) if mt_calc is not None else None
        ms_calc_out = round(ms_calc, precisao_massa) if ms_calc is not None else None
        mw_calc_out = round(mw_calc, precisao_massa) if mw_calc is not None else None

        # Dados para Diagrama de Fases Normalizado (Vs=1) (mantidos)
        vol_s_norm = 1.0
        peso_s_norm: Optional[float] = None
        vol_v_norm: Optional[float] = None
        vol_w_norm: Optional[float] = None
        peso_w_norm: Optional[float] = None
        vol_a_norm: Optional[float] = None

        if gs is not None:
             peso_s_norm = round(gs * gama_w_gcm3 * vol_s_norm, 2)
        if e is not None:
            vol_v_norm = round(e * vol_s_norm, precisao_indice)
            if S is not None:
                 vol_w_norm = round(S * vol_v_norm, precisao_indice)
                 vol_a_norm = round(vol_v_norm - vol_w_norm, precisao_indice)
                 if vol_a_norm < 0: vol_a_norm = 0.0
                 if vol_w_norm is not None:
                     peso_w_norm = round(vol_w_norm * gama_w_gcm3, 2)
            elif w is not None and peso_s_norm is not None:
                 peso_w_norm = round(w * peso_s_norm, 2)
                 if gama_w_gcm3 > EPSILON:
                     vol_w_norm = round(peso_w_norm / gama_w_gcm3, precisao_indice)
                     vol_a_norm = round(vol_v_norm - vol_w_norm, precisao_indice)
                     if vol_a_norm < 0: vol_a_norm = 0.0

        return IndicesFisicosOutput(
            peso_especifico_natural=gama_nat,
            peso_especifico_seco=gama_d,
            peso_especifico_saturado=gama_sat,
            peso_especifico_submerso=gama_sub,
            peso_especifico_solidos=gama_s,
            Gs=gs,
            indice_vazios=e,
            porosidade=n_out,
            grau_saturacao=S_out,
            umidade=w_out,
            # Normalizados
            volume_solidos_norm=vol_s_norm,
            volume_agua_norm=vol_w_norm,
            volume_ar_norm=vol_a_norm,
            peso_solidos_norm=peso_s_norm,
            peso_agua_norm=peso_w_norm,
            # Compacidade
            compacidade_relativa=Dr_out,
            classificacao_compacidade=classificacao_compacidade,
            # Calculados (Reais)
            volume_total_calc=v_calc_out,
            volume_solidos_calc=vs_calc_out,
            volume_agua_calc=vw_calc_out,
            volume_ar_calc=va_calc_out,
            massa_total_calc=mt_calc_out,
            massa_solidos_calc=ms_calc_out,
            massa_agua_calc=mw_calc_out,
        )

    except ValueError as ve:
         return IndicesFisicosOutput(erro=str(ve))
    except Exception as e:
        import traceback
        print(f"Erro inesperado no cálculo de índices físicos: {e}\n{traceback.format_exc()}")
        return IndicesFisicosOutput(erro=f"Erro interno no servidor durante o cálculo: {type(e).__name__}")