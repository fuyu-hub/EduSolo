import numpy as np
from typing import List, Optional
# Importa os modelos Pydantic do ficheiro centralizado
from app.models import CamadaSolo, TensaoPonto, TensoesGeostaticasInput, TensoesGeostaticasOutput

def calcular_tensoes_geostaticas(dados: TensoesGeostaticasInput) -> TensoesGeostaticasOutput:
    """
    Calcula os perfis de tensão total vertical (σv), pressão neutra (u) e
    tensão efetiva vertical (σ'v) e horizontal (σ'h) para um perfil de solo estratificado.

    Considera a posição do Nível d'Água (NA) e a franja capilar.

    Referências:
    - PDF: 8. Tenses_no_Solo-Maio_2022-1.pdf (Págs. 3-13, 27-32)
    """
    pontos_calculo: List[TensaoPonto] = []
    profundidade_atual: float = 0.0
    tensao_total_atual: float = 0.0
    gama_w = dados.peso_especifico_agua

    try:
        if not dados.camadas:
             raise ValueError("A lista de camadas não pode estar vazia.")
        
        # Constrói lista de NAs por camada (prioriza NA da camada, senão usa global)
        nas_camadas = []
        for i, camada in enumerate(dados.camadas):
            if camada.profundidade_na_camada is not None:
                nas_camadas.append(camada.profundidade_na_camada)
            else:
                nas_camadas.append(None)
        
        # Se nenhuma camada tem NA específico, usa o NA global
        tem_na_especifico = any(na is not None for na in nas_camadas)
        
        # Verifica se o NA global é válido (não é o valor padrão 999 ou similar)
        profundidade_total = sum(c.espessura for c in dados.camadas)
        na_global_valido = dados.profundidade_na > 0 and dados.profundidade_na < profundidade_total * 2

        # Ponto inicial na superfície
        # Calcula pressão neutra inicial considerando capilaridade
        u_inicial = 0.0
        if dados.profundidade_na <= 0 and dados.altura_capilar > 0: # NA na superfície ou acima
            # Considera apenas a parte da capilaridade acima da superfície (se houver)
            # Neste caso simplificado, se NA=0, a pressão na superfície é negativa pela capilaridade
             u_inicial = -min(dados.altura_capilar, 0) * gama_w # Será 0 se NA=0, mas pode ser negativa se NA < 0
             # Para o caso NA=0 exato, a pressão é -altura_capilar*gama_w, mas só se z<altura_capilar
             # Na superfície (z=0), se NA=0, u = -altura_capilar*gama_w *apenas* se h_capilar > 0
             u_inicial = -dados.altura_capilar * gama_w if dados.altura_capilar > 0 else 0.0


        sigma_ef_v_inicial = 0.0 - u_inicial
        sigma_ef_h_inicial = sigma_ef_v_inicial * dados.camadas[0].Ko # Usa Ko da primeira camada

        pontos_calculo.append(TensaoPonto(
            profundidade=0.0,
            tensao_total_vertical=0.0,
            pressao_neutra=u_inicial,
            tensao_efetiva_vertical=sigma_ef_v_inicial,
            tensao_efetiva_horizontal=sigma_ef_h_inicial
        ))


        for i, camada in enumerate(dados.camadas):
            profundidade_base_camada = profundidade_atual + camada.espessura
            z_topo = profundidade_atual
            z_base = profundidade_base_camada
            
            # Profundidade do início da capilaridade
            prof_inicio_capilaridade = max(0, dados.profundidade_na - dados.altura_capilar)

            # --- Adicionar ponto no NA específico da camada se estiver dentro dela ---
            if camada.profundidade_na_camada is not None:
                na_camada_val = camada.profundidade_na_camada
                # Verifica se o NA da camada está dentro dela
                if z_topo <= na_camada_val <= z_base:
                    # Calcula tensão total até o NA da camada
                    espessura_ate_na = na_camada_val - z_topo
                    gama_ate_na = camada.gama_nat
                    if gama_ate_na is None:
                        gama_ate_na = camada.gama_sat  # Fallback
                    
                    if gama_ate_na is not None:
                        sigma_v_na_camada = tensao_total_atual + gama_ate_na * espessura_ate_na
                        
                        # Pressão neutra no NA = 0 por definição
                        u_na_camada = 0.0
                        
                        sigma_ef_v_na_camada = sigma_v_na_camada - u_na_camada
                        sigma_ef_h_na_camada = sigma_ef_v_na_camada * camada.Ko
                        
                        # Evita duplicar se já existe ponto próximo
                        if not any(np.isclose(p.profundidade, na_camada_val, atol=0.01) for p in pontos_calculo):
                            pontos_calculo.append(TensaoPonto(
                                profundidade=round(na_camada_val, 4),
                                tensao_total_vertical=round(sigma_v_na_camada, 4),
                                pressao_neutra=round(u_na_camada, 4),
                                tensao_efetiva_vertical=round(sigma_ef_v_na_camada, 4),
                                tensao_efetiva_horizontal=round(sigma_ef_h_na_camada, 4)
                            ))
            
            # --- Adicionar ponto no início da capilaridade se estiver dentro desta camada ---
            altura_cap_usar = camada.altura_capilar_camada if camada.altura_capilar_camada is not None else dados.altura_capilar
            na_usar = camada.profundidade_na_camada if camada.profundidade_na_camada is not None else dados.profundidade_na
            prof_inicio_capilaridade_camada = max(0, na_usar - altura_cap_usar)
            
            if altura_cap_usar > 0 and prof_inicio_capilaridade_camada > 0:
                # Verifica se o início da capilaridade está dentro desta camada
                if z_topo < prof_inicio_capilaridade_camada <= z_base:
                    # Calcula tensão total até o início da capilaridade
                    espessura_ate_capilar = prof_inicio_capilaridade_camada - z_topo
                    gama_ate_capilar = camada.gama_nat
                    if gama_ate_capilar is None:
                        gama_ate_capilar = camada.gama_sat  # Fallback
                    
                    if gama_ate_capilar is not None:
                        sigma_v_capilar = tensao_total_atual + gama_ate_capilar * espessura_ate_capilar
                        
                        # Pressão neutra no início da capilaridade (negativa)
                        u_capilar = -altura_cap_usar * gama_w
                        
                        sigma_ef_v_capilar = sigma_v_capilar - u_capilar
                        sigma_ef_h_capilar = sigma_ef_v_capilar * camada.Ko
                        
                        # Evita duplicar se já existe ponto próximo
                        if not any(np.isclose(p.profundidade, prof_inicio_capilaridade_camada, atol=0.01) for p in pontos_calculo):
                            pontos_calculo.append(TensaoPonto(
                                profundidade=round(prof_inicio_capilaridade_camada, 4),
                                tensao_total_vertical=round(sigma_v_capilar, 4),
                                pressao_neutra=round(u_capilar, 4),
                                tensao_efetiva_vertical=round(sigma_ef_v_capilar, 4),
                                tensao_efetiva_horizontal=round(sigma_ef_h_capilar, 4)
                            ))

            # --- Calcular Tensão Total na Base da Camada ---
            # Se não há NA válido, usa γnat se disponível, senão γsat
            if not na_global_valido and not tem_na_especifico:
                gama_camada = camada.gama_nat if camada.gama_nat is not None else camada.gama_sat
                if gama_camada is None:
                    raise ValueError(f"Peso específico (γnat ou γsat) não definido para a camada {i+1}. Defina pelo menos um deles.")
                tensao_total_atual += gama_camada * camada.espessura
            
            elif z_base <= dados.profundidade_na: # Camada inteira acima do NA
                gama_camada = camada.gama_nat
                if gama_camada is None:
                    raise ValueError(f"Peso específico natural (γnat) não definido para a camada {i+1} (ID: {i}) que está acima do NA (Prof: {z_topo:.2f}-{z_base:.2f} m, NA: {dados.profundidade_na:.2f} m).")
                tensao_total_atual += gama_camada * camada.espessura

            elif z_topo >= dados.profundidade_na: # Camada inteira abaixo do NA
                gama_camada = camada.gama_sat
                if gama_camada is None:
                    raise ValueError(f"Peso específico saturado (γsat) não definido para a camada {i+1} (ID: {i}) que está abaixo do NA (Prof: {z_topo:.2f}-{z_base:.2f} m, NA: {dados.profundidade_na:.2f} m).")
                tensao_total_atual += gama_camada * camada.espessura

            else: # Camada atravessada pelo NA
                espessura_acima_na = dados.profundidade_na - z_topo
                espessura_abaixo_na = z_base - dados.profundidade_na

                gama_nat_camada = camada.gama_nat
                gama_sat_camada = camada.gama_sat

                if gama_nat_camada is None:
                     raise ValueError(f"Peso específico natural (γnat) não definido para a camada {i+1} (ID: {i}) que é atravessada pelo NA (NA: {dados.profundidade_na:.2f} m).")
                if gama_sat_camada is None:
                     raise ValueError(f"Peso específico saturado (γsat) não definido para a camada {i+1} (ID: {i}) que é atravessada pelo NA (NA: {dados.profundidade_na:.2f} m).")

                # Adiciona contribuição da parte acima do NA
                tensao_total_na_interface = tensao_total_atual + gama_nat_camada * espessura_acima_na

                # Adiciona ponto de cálculo exatamente no NA se ele corta a camada
                u_no_na = 0.0 # Por definição
                sigma_v_no_na = tensao_total_na_interface
                sigma_ef_v_no_na = sigma_v_no_na - u_no_na
                sigma_ef_h_no_na = sigma_ef_v_no_na * camada.Ko
                # Evita duplicar se o NA coincide com interface de camadas
                if not any(np.isclose(p.profundidade, dados.profundidade_na) for p in pontos_calculo):
                    pontos_calculo.append(TensaoPonto(
                        profundidade=dados.profundidade_na,
                        tensao_total_vertical=round(sigma_v_no_na, 4),
                        pressao_neutra=round(u_no_na, 4),
                        tensao_efetiva_vertical=round(sigma_ef_v_no_na, 4),
                        tensao_efetiva_horizontal=round(sigma_ef_h_no_na, 4)
                    ))

                # Adiciona contribuição da parte abaixo do NA para chegar na base da camada
                tensao_total_atual = tensao_total_na_interface + gama_sat_camada * espessura_abaixo_na

            # --- Calcular Pressão Neutra e Tensão Efetiva na Base da Camada ---
            # Determina qual NA usar para esta camada
            na_relevante = None
            altura_capilar_relevante = 0.0
            
            # Regra 1: Se a camada é impermeável e não tem NA próprio, poropressão = 0
            if camada.impermeavel and camada.profundidade_na_camada is None:
                na_relevante = None
            # Regra 2: Se a camada tem NA específico, usa ele
            elif camada.profundidade_na_camada is not None:
                na_relevante = camada.profundidade_na_camada
                altura_capilar_relevante = camada.altura_capilar_camada if camada.altura_capilar_camada is not None else 0.0
            # Regra 3: Se nenhuma camada tem NA específico E o NA global é válido, usa o global
            elif not tem_na_especifico and na_global_valido:
                na_relevante = dados.profundidade_na
                altura_capilar_relevante = dados.altura_capilar
            # Regra 4: Tem NAs específicos mas esta camada não tem
            else:
                # Se o NA global não é válido, não há NA para esta camada
                if not na_global_valido:
                    na_relevante = None
                else:
                    # Verifica se há camada impermeável entre esta camada e o NA global
                    tem_impermeavel_entre_na = False
                    prof_na_global = dados.profundidade_na
                    
                    # Procura camadas impermeáveis entre o NA global e esta camada
                    for j in range(i):
                        camada_j = dados.camadas[j]
                        prof_topo_j = sum(dados.camadas[k].espessura for k in range(j))
                        prof_base_j = prof_topo_j + camada_j.espessura
                        
                        # Se a camada j é impermeável e está entre o NA e a camada atual
                        if camada_j.impermeavel:
                            # Verifica se está entre o NA e esta camada
                            if (prof_na_global <= prof_base_j and prof_topo_j <= z_topo) or \
                               (prof_topo_j <= prof_na_global <= prof_base_j):
                                tem_impermeavel_entre_na = True
                                break
                    
                    if not tem_impermeavel_entre_na:
                        # Não há impermeável entre o NA e esta camada, usa NA global
                        na_relevante = dados.profundidade_na
                        altura_capilar_relevante = dados.altura_capilar
                    else:
                        # Há impermeável entre o NA e esta camada, sem NA próprio
                        # Poropressão é zero
                        na_relevante = None
            
            # Calcula pressão neutra
            if na_relevante is None:
                # Sem NA relevante (camada isolada sem NA próprio ou impermeável)
                pressao_neutra = 0.0
            else:
                # Distância vertical da base da camada até o NA relevante
                distancia_vertical_na = z_base - na_relevante

                # Considera capilaridade
                if distancia_vertical_na >= 0: # Abaixo ou no NA
                    pressao_neutra = distancia_vertical_na * gama_w
                elif abs(distancia_vertical_na) <= altura_capilar_relevante: # Dentro da franja capilar
                     # u = -γw * h (onde h é a altura acima do NA, que é -distancia_vertical_na)
                     pressao_neutra = distancia_vertical_na * gama_w # Já é negativo
                else: # Acima da franja capilar
                    pressao_neutra = 0.0

            tensao_efetiva_vertical = tensao_total_atual - pressao_neutra
            # Garante que não seja negativa devido a erros de precisão ou capilaridade muito alta
            if tensao_efetiva_vertical < -1e-9: # Pequena tolerância para zero
                 # Isso pode acontecer se a capilaridade for muito alta ou γnat baixo
                 # Pode ser um aviso, mas para cálculo, limitamos a zero
                 # print(f"Aviso: Tensão efetiva vertical calculada negativa ({tensao_efetiva_vertical:.4f}) na profundidade {z_base:.2f} m. Limitando a 0.")
                 tensao_efetiva_vertical = 0.0

            tensao_efetiva_horizontal = tensao_efetiva_vertical * camada.Ko

            # Adiciona ponto de cálculo na base da camada
            pontos_calculo.append(TensaoPonto(
                profundidade=round(profundidade_base_camada, 4),
                tensao_total_vertical=round(tensao_total_atual, 4),
                pressao_neutra=round(pressao_neutra, 4),
                tensao_efetiva_vertical=round(tensao_efetiva_vertical, 4),
                tensao_efetiva_horizontal=round(tensao_efetiva_horizontal, 4)
            ))

            profundidade_atual = profundidade_base_camada

        # Ordena os pontos por profundidade para garantir a ordem correta para plotagem
        pontos_calculo.sort(key=lambda p: p.profundidade)

        # Remove pontos duplicados de profundidade (pode ocorrer se NA = interface)
        pontos_unicos = []
        profundidades_vistas = set()
        for ponto in pontos_calculo:
            if round(ponto.profundidade, 4) not in profundidades_vistas:
                pontos_unicos.append(ponto)
                profundidades_vistas.add(round(ponto.profundidade, 4))

        return TensoesGeostaticasOutput(pontos_calculo=pontos_unicos)

    except ValueError as ve:
        return TensoesGeostaticasOutput(pontos_calculo=[], erro=str(ve))
    except Exception as e:
        import traceback
        print(f"Erro inesperado no cálculo de tensões geostáticas: {e}\n{traceback.format_exc()}")
        return TensoesGeostaticasOutput(pontos_calculo=[], erro=f"Erro interno no servidor: {type(e).__name__}")