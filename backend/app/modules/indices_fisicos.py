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

    Referências Principais:
    - PDF: 4. Indices_Fisicos_2022-Maro.pdf
    """
    try:
        # Inicializa variáveis a partir dos dados de entrada
        # Converte percentagens para decimais para cálculos
        w: Optional[float] = dados.umidade / 100 if dados.umidade is not None else None
        n: Optional[float] = dados.porosidade / 100 if dados.porosidade is not None else None
        S: Optional[float] = dados.grau_saturacao / 100 if dados.grau_saturacao is not None else None

        # Dados diretos
        e: Optional[float] = dados.indice_vazios
        gs: Optional[float] = dados.Gs
        gama_s: Optional[float] = dados.peso_especifico_solidos
        gama_nat: Optional[float] = dados.peso_especifico_natural
        gama_d: Optional[float] = dados.peso_especifico_seco
        gama_w: float = dados.peso_especifico_agua # Peso específico da água (ex: 10 kN/m³)

        # Dados de massa/volume (se fornecidos)
        mu: Optional[float] = dados.peso_total # Massa úmida em 'g'
        ms: Optional[float] = dados.peso_solido # Massa seca em 'g'
        v: Optional[float] = dados.volume_total # Volume total em 'cm³'

        # Variáveis calculadas
        gama_sat: Optional[float] = None
        gama_sub: Optional[float] = None

        # γw em g/cm³ para consistência com massas em g e volume em cm³
        gama_w_gcm3 = gama_w / 9.81 if np.isclose(gama_w, 9.81, rtol=1e-2) else gama_w / 10.0 # Aproximação se γw=10

        # --- CÁLCULOS DIRETOS PRIORITÁRIOS ---
        # Calcular w diretamente se possível
        if w is None and mu is not None and ms is not None:
            if ms <= EPSILON: raise ValueError("Massa/Peso seco não pode ser zero para calcular umidade.")
            if mu < ms - EPSILON: raise ValueError("Massa/Peso úmido menor que seco.") # Adiciona tolerância
            w = (mu - ms) / ms

        # Calcular gama_nat diretamente se possível (e converter para kN/m³)
        if gama_nat is None and mu is not None and v is not None:
             if v <= EPSILON: raise ValueError("Volume total não pode ser zero.")
             gama_nat_gcm3 = mu / v
             gama_nat = gama_nat_gcm3 * gama_w / gama_w_gcm3 # Converte para kN/m³

        # Calcular gama_d diretamente se possível (e converter para kN/m³)
        if gama_d is None and ms is not None and v is not None:
            if v <= EPSILON: raise ValueError("Volume total não pode ser zero.")
            gama_d_gcm3 = ms / v
            gama_d = gama_d_gcm3 * gama_w / gama_w_gcm3 # Converte para kN/m³

        # Tentar calcular gama_d a partir de gama_nat e w (se gama_d ainda for None)
        if gama_d is None and gama_nat is not None and w is not None:
             if 1 + w <= EPSILON: raise ValueError("Umidade (w) inválida (-100% ou menos)")
             gama_d = gama_nat / (1 + w) #

        # --- Lógica de Cálculo em Cascata ---

        # 0. Consistência entre Gs e gama_s
        if gs is None and gama_s is not None:
            if gama_w <= EPSILON: raise ValueError("Peso específico da água não pode ser zero.")
            gs = gama_s / gama_w #
        elif gama_s is None and gs is not None:
            gama_s = gs * gama_w #
        elif gs is not None and gama_s is not None:
             if not np.isclose(gama_s, gs * gama_w, rtol=1e-3):
                 return IndicesFisicosOutput(erro=f"Gs ({gs}) e Peso Específico dos Sólidos ({gama_s} kN/m³) são inconsistentes para γw={gama_w} kN/m³.")
        # Se Gs ainda é None mas temos gama_d e 'e', podemos calcular Gs (ver abaixo)

        # 1. Relações básicas entre e e n
        if e is None and n is not None:
            if abs(1 - n) <= EPSILON: raise ValueError("Porosidade (n) não pode ser 100%")
            e = n / (1 - n) #
        elif n is None and e is not None:
            if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
            n = e / (1 + e) #

        # Tentar calcular 'e' a partir de gama_d e Gs/gama_s (se 'e' ainda for None)
        if e is None and gama_d is not None:
            if gs is not None:
                if gama_d <= EPSILON:
                    e = float('inf') if gs > EPSILON else None
                else:
                    e = (gs * gama_w) / gama_d - 1 #
                    if e < -EPSILON: # Permitir e ligeiramente negativo devido a arredondamento
                         raise ValueError(f"Cálculo resultou em índice de vazios negativo ({e:.4f}). Verifique γd ({gama_d}) e Gs ({gs}).")
                    elif e < 0:
                         e = 0.0 # Corrigir para zero se for muito pequeno e negativo
            elif gama_s is not None: # Se não tem Gs mas tem gama_s
                 if gama_d <= EPSILON:
                     e = float('inf') if gama_s > EPSILON else None
                 else:
                     # Derivação: gama_d = Ws / V = (Vs * gama_s) / (Vs + Vv) = (Vs * gama_s) / (Vs * (1 + e)) = gama_s / (1 + e)
                     e = gama_s / gama_d - 1
                     if e < -EPSILON:
                          raise ValueError(f"Cálculo resultou em índice de vazios negativo ({e:.4f}). Verifique γd ({gama_d}) e γs ({gama_s}).")
                     elif e < 0:
                          e = 0.0

        # Se 'e' foi calculado agora, calcular 'n'
        if n is None and e is not None:
             if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
             n = e / (1 + e) #

        # Se Gs ainda é None, tentar calcular a partir de gama_d e 'e'
        if gs is None and gama_d is not None and e is not None:
            if abs(gama_w) > EPSILON:
                 gs = gama_d * (1 + e) / gama_w
                 if gs < 0: raise ValueError("Cálculo resultou em Gs negativo.")
                 # Atualiza gama_s se ainda não definido
                 if gama_s is None:
                      gama_s = gs * gama_w

        # 2. Relação fundamental: Se = w * Gs
        # Tenta calcular S (se ainda for None)
        if S is None and w is not None and gs is not None and e is not None:
             if e <= EPSILON: S = 0.0 # Se não há vazios, não há saturação (ou w seria 0)
             else: S = (w * gs) / e #
             if S > 1.0 + EPSILON: S = 1.0 # Limita a 100%
             elif S < 0.0: S = 0.0 # Limita a 0%
        # Tenta calcular w (se ainda for None)
        elif w is None and S is not None and e is not None and gs is not None:
             if gs <= EPSILON:
                 w = 0.0 if S * e <= EPSILON else float('inf') # Se Gs=0, w=0 só se S*e=0, senão infinito
             else:
                 w = (S * e) / gs #
                 if w < 0: w = 0.0 # Umidade não pode ser negativa

        # Tentar calcular 'e' a partir de S, w, Gs (se ainda for None)
        elif e is None and w is not None and gs is not None and S is not None:
            if S <= EPSILON:
                if w > EPSILON: raise ValueError("Saturação (S) não pode ser 0 se a umidade (w) for maior que 0.")
                # Se w=0 e S=0, 'e' é indeterminado aqui.
            else:
                e = (w * gs) / S #
                if e < 0: raise ValueError("Cálculo resultou em índice de vazios negativo.")

        # Recalcula 'n' se 'e' foi calculado agora
        if n is None and e is not None:
             if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
             n = e / (1 + e) #

        # 3. Relações com Pesos Específicos (Verificações e Cálculos Finais)
        # Recalcular gama_nat se ainda for None
        if gama_nat is None:
            if gama_d is not None and w is not None:
                 gama_nat = gama_d * (1 + w) #
            elif gs is not None and e is not None and S is not None:
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_nat = gama_w * (gs + S * e) / (1 + e) #

        # Recalcular gama_d se ainda for None
        if gama_d is None:
             if gama_nat is not None and w is not None:
                  if abs(1 + w) <= EPSILON: raise ValueError("Umidade (w) inválida")
                  gama_d = gama_nat / (1 + w) #
             elif gs is not None and e is not None:
                  if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                  gama_d = (gs * gama_w) / (1 + e) #

        # 4. Cálculo de γsat e γsub
        if gama_sat is None:
             if gs is not None and e is not None:
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_sat = gama_w * (gs + e) / (1 + e) #
             elif gama_d is not None and e is not None: # Usando S=1 na eq. γnat (derivada na versão anterior)
                 if abs(1 + e) <= EPSILON: raise ValueError("Índice de Vazios (e) inválido")
                 gama_sat = gama_d + (e * gama_w / (1 + e))

        if gama_sub is None and gama_sat is not None:
            gama_sub = gama_sat - gama_w #
            if gama_sub < 0: gama_sub = 0.0 # Não pode ser negativo

        # --- Verificações Finais e Preparação da Saída ---

        # Arredondamento
        precisao_gama = 3 # Aumentar precisão para pesos específicos
        precisao_indice = 4 # Aumentar precisão para índices adimensionais
        precisao_perc = 2   # Aumentar precisão para percentagens

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


        # Dados para Diagrama de Fases (Vs=1)
        vol_s_norm = 1.0
        peso_s_norm: Optional[float] = None
        vol_v_norm: Optional[float] = None
        vol_w_norm: Optional[float] = None
        peso_w_norm: Optional[float] = None
        vol_a_norm: Optional[float] = None

        if gs is not None:
             peso_s_norm = round(gs * gama_w_gcm3 * vol_s_norm, 2) # Peso = Gs * γw * Vs

        if e is not None:
            vol_v_norm = round(e * vol_s_norm, precisao_indice)

            if S is not None:
                 vol_w_norm = round(S * vol_v_norm, precisao_indice) # Vw = S * Vv
                 vol_a_norm = round(vol_v_norm - vol_w_norm, precisao_indice) # Va = Vv - Vw
                 if vol_a_norm < 0: vol_a_norm = 0.0 # Corrige pequenas imprecisões

                 if vol_w_norm is not None:
                     peso_w_norm = round(vol_w_norm * gama_w_gcm3, 2) # Peso = Vw * γw

            # Tenta calcular Vw a partir de w e Ws
            elif w is not None and peso_s_norm is not None:
                 peso_w_norm = round(w * peso_s_norm, 2) # Pw = w * Ps
                 if gama_w_gcm3 > EPSILON:
                     vol_w_norm = round(peso_w_norm / gama_w_gcm3, precisao_indice) # Vw = Pw / γw
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
            # Diagrama de fases normalizado
            volume_solidos_norm=vol_s_norm,
            volume_agua_norm=vol_w_norm,
            volume_ar_norm=vol_a_norm,
            peso_solidos_norm=peso_s_norm,
            peso_agua_norm=peso_w_norm
        )

    except ValueError as ve: # Captura erros de lógica/dados inconsistentes
         return IndicesFisicosOutput(erro=str(ve))
    except Exception as e: # Captura outros erros inesperados
        # Logar o erro completo no servidor seria ideal aqui
        import traceback
        print(f"Erro inesperado no cálculo de índices físicos: {e}\n{traceback.format_exc()}")
        return IndicesFisicosOutput(erro=f"Erro interno no servidor durante o cálculo: {type(e).__name__}")