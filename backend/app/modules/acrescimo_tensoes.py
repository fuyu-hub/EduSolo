# backend/app/modules/acrescimo_tensoes.py
import numpy as np
from typing import Optional
# Importa os modelos Pydantic do ficheiro centralizado
from app.models import (
    PontoInteresse, CargaPontual, CargaFaixa, CargaCircular, CargaRetangular,
    AcrescimoTensoesInput, AcrescimoTensoesOutput
)

PI = np.pi
EPSILON = 1e-9

# --- Funções de Cálculo Específicas ---

def calcular_acrescimo_boussinesq_pontual(carga: CargaPontual, ponto: PontoInteresse) -> float:
    """ (Código inalterado) """
    P = carga.P
    z = ponto.z
    r_quadrado = (ponto.x - carga.x)**2 + (ponto.y - carga.y)**2
    denominador_raiz = r_quadrado + z**2
    if denominador_raiz <= EPSILON: return float('nan')
    delta_sigma_v = (3 * P * (z**3)) / (2 * PI * (denominador_raiz**2.5)) #
    return delta_sigma_v

def calcular_acrescimo_carothers_faixa(carga: CargaFaixa, ponto: PontoInteresse) -> float:
    """
    Calcula o acréscimo de tensão vertical (Δσv) num ponto (x, z)
    devido a uma carga em faixa de largura 'b' (largura = 2 * semi_largura 'a') e intensidade 'p'.
    Assume que a faixa é infinita na direção y e o ponto está no plano xz.

    Fórmula usada (consistente com várias fontes):
    Δσv = (p / π) * [ α + sin(α) * cos(α + 2β) ]
    Onde α e β são os ângulos (rad) formados pelas linhas que unem o ponto às bordas da faixa
    com a vertical passando pelo ponto.

    Alternativamente, usando os ângulos 2α e 2β definidos no PDF:
    Δσv = (p / π) * (2α + sin(2α) * cos(2β)) onde 2α e 2β são ângulos subentendidos.

    Args:
        carga: Objeto CargaFaixa com largura (b) e intensidade (p).
        ponto: Ponto de interesse com x (dist. horizontal do centro) e z (profundidade).

    Referências:
    - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 15) - Cuidado com a definição dos ângulos.
    - Outras fontes de Mecânica dos Solos (ex: Das, Coduto)
    """
    p = carga.intensidade
    b = carga.largura # Largura total da faixa
    x = ponto.x # Distância horizontal do ponto ao centro da faixa
    z = ponto.z

    if z <= EPSILON: return p if abs(x) < b/2 else 0.0 # Na superfície

    # Usando a formulação com ângulos das bordas α1 e α2
    # α1: ângulo com a borda direita (x = b/2)
    # α2: ângulo com a borda esquerda (x = -b/2)
    alpha1 = np.arctan((b/2 - x) / z)
    alpha2 = np.arctan((-b/2 - x) / z)

    # Ângulo subentendido pela faixa no ponto P: delta_alpha = alpha1 - alpha2 (equivale a 2α do PDF)
    delta_alpha = alpha1 - alpha2
    # Ângulo relacionado à posição horizontal: sum_alpha = alpha1 + alpha2 (equivale a 2β do PDF)
    sum_alpha = alpha1 + alpha2

    # Aplicando a fórmula do PDF - Confirmar a convenção dos ângulos beta e alpha
    # Δσv = (p / π) * (sen(2α) * cos(2β) + 2α)
    # No PDF, 2α parece ser o ângulo subentendido e 2β o ângulo da bissetriz com a vertical
    # Na nossa dedução: delta_alpha = 2α do PDF, sum_alpha = 2β do PDF
    delta_sigma_v = (p / PI) * (delta_alpha + np.sin(delta_alpha) * np.cos(sum_alpha))

    return delta_sigma_v


def calcular_acrescimo_love_circular_centro(carga: CargaCircular, ponto: PontoInteresse) -> float:
    """
    Calcula o acréscimo de tensão vertical (Δσv) num ponto sob o CENTRO
    de uma área circular de raio R carregada uniformemente com intensidade p.

    Fórmula: Δσv = p * [1 - (1 / (1 + (R/z)²))^(3/2)]

    Args:
        carga: Objeto CargaCircular com raio (R) e intensidade (p).
        ponto: Ponto de interesse com profundidade z.

    Referências:
    - PDF: 9. Tensões_devido_a_Sobrecarga-MAIO_2022.pdf (Pág. 17)
    """
    p = carga.intensidade
    R = carga.raio
    z = ponto.z

    if z <= EPSILON: return p # Na superfície
    if R <= EPSILON: return 0.0 # Raio zero

    rz_ratio_sq = (R / z)**2
    termo_base = 1 / (1 + rz_ratio_sq)
    # Verifica se a base da potência é muito pequena para evitar underflow ou NaN
    if termo_base < EPSILON and 1.5 > 0: # Base quase zero e expoente positivo
        delta_sigma_v = p * (1.0 - 0.0)
    else:
        delta_sigma_v = p * (1 - termo_base**1.5)

    return delta_sigma_v

# Função para usar o Ábaco de Love (simplificado)
def calcular_acrescimo_love_circular_abaco(carga: CargaCircular, ponto: PontoInteresse) -> Optional[float]:
    """
    Estima o acréscimo de tensão vertical (Δσv) usando uma
    aproximação digital do ábaco de Love (Fig. Pág 18 do PDF 9).
    """
    p = carga.intensidade
    R = carga.raio
    z = ponto.z
    r = np.sqrt(ponto.x**2 + ponto.y**2) # Distância radial do centro

    if z <= EPSILON: return p if r < R else 0.0
    if R <= EPSILON: return 0.0

    z_R = z / R
    r_R = r / R

    # Dados do ábaco de Love (valores corrigidos para maior precisão)
    # Formato: { z/R: [(r/R, sigma_z/p), ...], ... }
    abaco_data = {
        0.5: [(0, 0.91), (0.5, 0.85), (0.75, 0.75), (1.0, 0.50), (1.25, 0.23), (1.5, 0.10)],
        1.0: [(0, 0.6465), (0.5, 0.60), (0.75, 0.52), (1.0, 0.365), (1.25, 0.22), (1.5, 0.12)],
        1.5: [(0, 0.42), (0.5, 0.40), (0.75, 0.36), (1.0, 0.29), (1.25, 0.20), (1.5, 0.13)],
        2.0: [(0, 0.29), (0.5, 0.28), (0.75, 0.26), (1.0, 0.22), (1.25, 0.17), (1.5, 0.12)],
        3.0: [(0, 0.14), (0.5, 0.14), (0.75, 0.13), (1.0, 0.12), (1.25, 0.10), (1.5, 0.08)],
        # Adicionar mais pontos ou usar interpolação mais sofisticada
    }

    # Interpolação Bilinear Simples
    z_R_keys = sorted(abaco_data.keys())
    # Encontra z/R inferior e superior no ábaco
    z_R_inf = max([k for k in z_R_keys if k <= z_R], default=min(z_R_keys))
    z_R_sup = min([k for k in z_R_keys if k >= z_R], default=max(z_R_keys))

    if z_R_inf == z_R_sup: # z/R exato no ábaco
        curva = abaco_data[z_R_inf]
    else: # Interpola linearmente entre as curvas z/R
        curva_inf = abaco_data[z_R_inf]
        curva_sup = abaco_data[z_R_sup]
        # Pondera pela distância relativa a z/R
        peso_sup = (z_R - z_R_inf) / (z_R_sup - z_R_inf)
        peso_inf = 1.0 - peso_sup
        # Interpola os valores de sigma_z/p para cada r/R
        # Assume que ambas as curvas têm os mesmos pontos r/R (pode precisar de ajuste)
        curva = []
        for i in range(len(curva_inf)):
            r_R_val = curva_inf[i][0]
            sigma_p_inf = curva_inf[i][1]
            # Encontra o ponto correspondente na curva superior
            sigma_p_sup = next((p[1] for p in curva_sup if np.isclose(p[0], r_R_val)), sigma_p_inf) # Usa valor inf se não achar
            sigma_p_interp = peso_inf * sigma_p_inf + peso_sup * sigma_p_sup
            curva.append((r_R_val, sigma_p_interp))

    # Agora, interpola linearmente na curva resultante para o r/R do ponto
    r_R_vals = [p[0] for p in curva]
    sigma_p_vals = [p[1] for p in curva]

    if r_R >= r_R_vals[-1]: # Fora do ábaco (à direita)
        # Pode extrapolar ou retornar o último valor/zero? Retornar o último valor por segurança.
        fator_I = sigma_p_vals[-1]
    elif r_R <= r_R_vals[0]: # Fora do ábaco (à esquerda - centro)
        fator_I = sigma_p_vals[0]
    else: # Interpola linearmente
        fator_I = np.interp(r_R, r_R_vals, sigma_p_vals)

    if fator_I < 0: fator_I = 0.0 # Garante não-negativo

    delta_sigma_v = p * fator_I
    return delta_sigma_v

def calcular_acrescimo_newmark_retangular_abaco(carga: CargaRetangular, ponto: PontoInteresse) -> float:
    """
    Calcula o acréscimo de tensão vertical usando o ÁBACO DE NEWMARK (tabela).
    
    Args:
        carga: Objeto CargaRetangular com largura (B), comprimento (L) e intensidade (p).
        ponto: Ponto de interesse com coordenadas (x, y, z).
    
    Returns:
        Acréscimo de tensão vertical (kPa)
    """
    p = carga.intensidade
    B = carga.largura
    L = carga.comprimento
    z = ponto.z
    
    # Posição relativa ao centro
    x_rel = ponto.x - carga.centro_x
    y_rel = ponto.y - carga.centro_y
    
    if z <= EPSILON:
        if abs(x_rel) <= B/2 and abs(y_rel) <= L/2:
            return p
        else:
            return 0.0
    
    # Ábaco de Newmark - Valores exatos da literatura (sem interpolação)
    # Fonte: Tabela clássica de Newmark para carga uniforme retangular
    # Formato: {n: {m: valor, ...}, ...} onde n = a/z e m = b/z
    abaco_newmark = {
        0.1: {0.1: 0.005, 0.2: 0.009, 0.3: 0.013, 0.4: 0.017, 0.5: 0.020, 0.6: 0.022, 0.7: 0.024, 0.8: 0.026, 0.9: 0.027, 1.0: 0.028, 1.2: 0.029, 1.5: 0.030, 2.0: 0.031, 2.5: 0.031, 3.0: 0.032, 5.0: 0.032, 10.0: 0.032, float('inf'): 0.032},
        0.2: {0.1: 0.009, 0.2: 0.018, 0.3: 0.026, 0.4: 0.033, 0.5: 0.039, 0.6: 0.043, 0.7: 0.047, 0.8: 0.050, 0.9: 0.053, 1.0: 0.055, 1.2: 0.057, 1.5: 0.059, 2.0: 0.061, 2.5: 0.062, 3.0: 0.062, 5.0: 0.062, 10.0: 0.062, float('inf'): 0.062},
        0.3: {0.1: 0.013, 0.2: 0.026, 0.3: 0.037, 0.4: 0.047, 0.5: 0.056, 0.6: 0.063, 0.7: 0.069, 0.8: 0.073, 0.9: 0.077, 1.0: 0.079, 1.2: 0.083, 1.5: 0.086, 2.0: 0.089, 2.5: 0.090, 3.0: 0.090, 5.0: 0.090, 10.0: 0.090, float('inf'): 0.090},
        0.4: {0.1: 0.017, 0.2: 0.033, 0.3: 0.047, 0.4: 0.060, 0.5: 0.071, 0.6: 0.080, 0.7: 0.087, 0.8: 0.093, 0.9: 0.098, 1.0: 0.101, 1.2: 0.106, 1.5: 0.110, 2.0: 0.113, 2.5: 0.115, 3.0: 0.115, 5.0: 0.115, 10.0: 0.115, float('inf'): 0.115},
        0.5: {0.1: 0.020, 0.2: 0.039, 0.3: 0.056, 0.4: 0.071, 0.5: 0.084, 0.6: 0.095, 0.7: 0.103, 0.8: 0.110, 0.9: 0.116, 1.0: 0.120, 1.2: 0.126, 1.5: 0.131, 2.0: 0.135, 2.5: 0.137, 3.0: 0.137, 5.0: 0.137, 10.0: 0.137, float('inf'): 0.137},
        0.6: {0.1: 0.022, 0.2: 0.043, 0.3: 0.063, 0.4: 0.080, 0.5: 0.095, 0.6: 0.107, 0.7: 0.117, 0.8: 0.125, 0.9: 0.131, 1.0: 0.136, 1.2: 0.143, 1.5: 0.149, 2.0: 0.153, 2.5: 0.155, 3.0: 0.156, 5.0: 0.156, 10.0: 0.156, float('inf'): 0.156},
        0.7: {0.1: 0.024, 0.2: 0.047, 0.3: 0.069, 0.4: 0.087, 0.5: 0.103, 0.6: 0.117, 0.7: 0.128, 0.8: 0.137, 0.9: 0.144, 1.0: 0.149, 1.2: 0.157, 1.5: 0.164, 2.0: 0.169, 2.5: 0.170, 3.0: 0.171, 5.0: 0.172, 10.0: 0.172, float('inf'): 0.172},
        0.8: {0.1: 0.026, 0.2: 0.050, 0.3: 0.073, 0.4: 0.093, 0.5: 0.110, 0.6: 0.125, 0.7: 0.137, 0.8: 0.146, 0.9: 0.154, 1.0: 0.160, 1.2: 0.168, 1.5: 0.176, 2.0: 0.181, 2.5: 0.183, 3.0: 0.184, 5.0: 0.185, 10.0: 0.185, float('inf'): 0.185},
        0.9: {0.1: 0.027, 0.2: 0.053, 0.3: 0.077, 0.4: 0.098, 0.5: 0.116, 0.6: 0.131, 0.7: 0.144, 0.8: 0.154, 0.9: 0.162, 1.0: 0.168, 1.2: 0.178, 1.5: 0.186, 2.0: 0.192, 2.5: 0.194, 3.0: 0.195, 5.0: 0.196, 10.0: 0.196, float('inf'): 0.196},
        1.0: {0.1: 0.028, 0.2: 0.055, 0.3: 0.079, 0.4: 0.101, 0.5: 0.120, 0.6: 0.136, 0.7: 0.149, 0.8: 0.160, 0.9: 0.168, 1.0: 0.175, 1.2: 0.185, 1.5: 0.193, 2.0: 0.200, 2.5: 0.202, 3.0: 0.203, 5.0: 0.204, 10.0: 0.205, float('inf'): 0.205},
        1.2: {0.1: 0.029, 0.2: 0.057, 0.3: 0.083, 0.4: 0.106, 0.5: 0.126, 0.6: 0.143, 0.7: 0.157, 0.8: 0.168, 0.9: 0.178, 1.0: 0.185, 1.2: 0.196, 1.5: 0.205, 2.0: 0.212, 2.5: 0.215, 3.0: 0.216, 5.0: 0.217, 10.0: 0.218, float('inf'): 0.218},
        1.5: {0.1: 0.030, 0.2: 0.059, 0.3: 0.086, 0.4: 0.110, 0.5: 0.131, 0.6: 0.149, 0.7: 0.164, 0.8: 0.176, 0.9: 0.186, 1.0: 0.193, 1.2: 0.205, 1.5: 0.215, 2.0: 0.223, 2.5: 0.226, 3.0: 0.228, 5.0: 0.229, 10.0: 0.230, float('inf'): 0.230},
        2.0: {0.1: 0.031, 0.2: 0.061, 0.3: 0.089, 0.4: 0.113, 0.5: 0.135, 0.6: 0.153, 0.7: 0.169, 0.8: 0.181, 0.9: 0.192, 1.0: 0.200, 1.2: 0.212, 1.5: 0.223, 2.0: 0.232, 2.5: 0.236, 3.0: 0.238, 5.0: 0.239, 10.0: 0.240, float('inf'): 0.240},
        2.5: {0.1: 0.031, 0.2: 0.062, 0.3: 0.090, 0.4: 0.115, 0.5: 0.137, 0.6: 0.155, 0.7: 0.170, 0.8: 0.183, 0.9: 0.194, 1.0: 0.202, 1.2: 0.215, 1.5: 0.226, 2.0: 0.236, 2.5: 0.240, 3.0: 0.242, 5.0: 0.244, 10.0: 0.244, float('inf'): 0.244},
        3.0: {0.1: 0.032, 0.2: 0.062, 0.3: 0.090, 0.4: 0.115, 0.5: 0.137, 0.6: 0.156, 0.7: 0.171, 0.8: 0.184, 0.9: 0.195, 1.0: 0.203, 1.2: 0.216, 1.5: 0.228, 2.0: 0.238, 2.5: 0.242, 3.0: 0.244, 5.0: 0.246, 10.0: 0.247, float('inf'): 0.247},
        5.0: {0.1: 0.032, 0.2: 0.062, 0.3: 0.090, 0.4: 0.115, 0.5: 0.137, 0.6: 0.156, 0.7: 0.172, 0.8: 0.185, 0.9: 0.196, 1.0: 0.204, 1.2: 0.217, 1.5: 0.229, 2.0: 0.239, 2.5: 0.244, 3.0: 0.246, 5.0: 0.249, 10.0: 0.249, float('inf'): 0.249},
        10.0: {0.1: 0.032, 0.2: 0.062, 0.3: 0.090, 0.4: 0.115, 0.5: 0.137, 0.6: 0.156, 0.7: 0.172, 0.8: 0.185, 0.9: 0.196, 1.0: 0.205, 1.2: 0.218, 1.5: 0.230, 2.0: 0.240, 2.5: 0.244, 3.0: 0.247, 5.0: 0.250, 10.0: 0.250, float('inf'): 0.250},
        float('inf'): {0.1: 0.032, 0.2: 0.062, 0.3: 0.090, 0.4: 0.115, 0.5: 0.137, 0.6: 0.156, 0.7: 0.172, 0.8: 0.185, 0.9: 0.196, 1.0: 0.205, 1.2: 0.218, 1.5: 0.230, 2.0: 0.240, 2.5: 0.244, 3.0: 0.247, 5.0: 0.250, 10.0: 0.250, float('inf'): 0.250}
    }
    
    def pegar_valor_mais_proximo_abaco(n: float, m: float) -> float:
        """
        Pega o valor mais próximo no ábaco de Newmark (SEM interpolação).
        Simula o uso manual do ábaco - resultado bate com cálculo à mão.
        """
        # Valores disponíveis de n e m na tabela
        n_vals = sorted([k for k in abaco_newmark.keys() if k != float('inf')])
        m_vals_primeira_linha = sorted([k for k in abaco_newmark[0.1].keys() if k != float('inf')])
        
        # Se n ou m for maior que 10, usa infinito
        if n > 10.0:
            n_mais_proximo = float('inf')
        else:
            # Encontra o n mais próximo
            n_mais_proximo = min(n_vals, key=lambda x: abs(x - n))
        
        if m > 10.0:
            m_mais_proximo = float('inf')
        else:
            # Encontra o m mais próximo
            m_mais_proximo = min(m_vals_primeira_linha, key=lambda x: abs(x - m))
        
        # Retorna o valor da tabela para (n, m) mais próximos
        return abaco_newmark[n_mais_proximo][m_mais_proximo]
    
    # Calcula usando superposição de 4 quadrantes
    dist_direita = B/2 - x_rel
    dist_esquerda = B/2 + x_rel
    dist_frente = L/2 - y_rel
    dist_tras = L/2 + y_rel
    
    I_total = 0.0
    
    # Determina o sinal de cada quadrante (positivo se dentro, negativo se fora)
    sinal_x_dir = 1.0 if dist_direita > EPSILON else -1.0
    sinal_x_esq = 1.0 if dist_esquerda > EPSILON else -1.0
    sinal_y_frente = 1.0 if dist_frente > EPSILON else -1.0
    sinal_y_tras = 1.0 if dist_tras > EPSILON else -1.0
    
    # Quadrante 1: direita + frente
    n1 = abs(dist_direita) / z
    m1 = abs(dist_frente) / z
    I_1 = sinal_x_dir * sinal_y_frente * pegar_valor_mais_proximo_abaco(n1, m1)
    I_total += I_1
    
    # Quadrante 2: direita + trás
    n2 = abs(dist_direita) / z
    m2 = abs(dist_tras) / z
    I_2 = sinal_x_dir * sinal_y_tras * pegar_valor_mais_proximo_abaco(n2, m2)
    I_total += I_2
    
    # Quadrante 3: esquerda + frente
    n3 = abs(dist_esquerda) / z
    m3 = abs(dist_frente) / z
    I_3 = sinal_x_esq * sinal_y_frente * pegar_valor_mais_proximo_abaco(n3, m3)
    I_total += I_3
    
    # Quadrante 4: esquerda + trás
    n4 = abs(dist_esquerda) / z
    m4 = abs(dist_tras) / z
    I_4 = sinal_x_esq * sinal_y_tras * pegar_valor_mais_proximo_abaco(n4, m4)
    I_total += I_4
    
    delta_sigma_v = p * I_total
    return max(0.0, delta_sigma_v)


def calcular_acrescimo_newmark_retangular(carga: CargaRetangular, ponto: PontoInteresse, usar_abaco: bool = False) -> float:
    """
    Calcula o acréscimo de tensão vertical (Δσv) num ponto sob uma área retangular.
    
    Args:
        carga: CargaRetangular com dimensões e intensidade
        ponto: Ponto de interesse  
        usar_abaco: Se True, usa ábaco tabelado. Se False, usa fórmula analítica.
    
    Fórmula de Newmark (integração da equação de Boussinesq):
    σv = (σ₀/(4π)) * [ [2mn(m²+n²+1)^0.5](m²+n²+2) / [(m²+n²+1+m²n²)(m²+n²+1)] + arctg(2mn(m²+n²+1)^0.5 / (m²+n²+1-m²n²)) ]
    
    Onde:
    - m = a/z (largura / profundidade)
    - n = b/z (comprimento / profundidade)  
    - σ₀ = p (pressão uniforme)
    
    Args:
        carga: Objeto CargaRetangular com largura (B), comprimento (L) e intensidade (p).
        ponto: Ponto de interesse com coordenadas (x, y, z).
    
    Referências:
    - Newmark, N.M. (1942)
    - Das, B.M. - Fundamentos de Engenharia Geotécnica
    """
    # Escolhe entre ábaco (tabela) ou fórmula analítica
    if usar_abaco:
        return calcular_acrescimo_newmark_retangular_abaco(carga, ponto)
    
    # Caso contrário, usa a fórmula analítica (implementação atual)
    p = carga.intensidade
    B = carga.largura
    L = carga.comprimento
    z = ponto.z
    
    # Posição relativa ao centro da área retangular
    x_rel = ponto.x - carga.centro_x
    y_rel = ponto.y - carga.centro_y
    
    if z <= EPSILON:
        # Na superfície: retorna p se está dentro da área, 0 caso contrário
        if abs(x_rel) <= B/2 and abs(y_rel) <= L/2:
            return p
        else:
            return 0.0
    
    def calcular_fator_influencia(a: float, b: float, profundidade: float) -> float:
        """
        Calcula o fator de influência usando a fórmula de Newmark.
        
        Args:
            a: dimensão na direção x (largura do quadrante)
            b: dimensão na direção y (comprimento do quadrante)
        profundidade: profundidade z
        
        Returns:
            Fator de influência I
        """
        if a <= EPSILON or b <= EPSILON or profundidade <= EPSILON:
            return 0.0
        
        # Razões adimensionais
        m = a / profundidade
        n = b / profundidade
        
        # Termos auxiliares
        m2 = m * m
        n2 = n * n
        m2n2 = m2 * n2
        termo_base = m2 + n2 + 1.0  # m² + n² + 1
        raiz = np.sqrt(termo_base)   # √(m² + n² + 1)
        
        # Primeiro termo: [2mn√(m²+n²+1)](m²+n²+2) / [(m²+n²+1+m²n²)(m²+n²+1)]
        numerador_1 = 2 * m * n * raiz * (m2 + n2 + 2.0)
        denominador_1 = (termo_base + m2n2) * termo_base
        
        if abs(denominador_1) < EPSILON:
            termo_1 = 0.0
        else:
            termo_1 = numerador_1 / denominador_1
        
        # Segundo termo: arctg[2mn√(m²+n²+1) / (m²+n²+1-m²n²)]
        numerador_arctan = 2 * m * n * raiz
        denominador_arctan = termo_base - m2n2
        
        if abs(denominador_arctan) < EPSILON:
            # Quando denominador é zero, arctan tende a ±π/2
            if numerador_arctan > EPSILON:
                termo_2 = PI / 2.0
            elif numerador_arctan < -EPSILON:
                termo_2 = -PI / 2.0
            else:
                termo_2 = 0.0
        else:
            termo_2 = np.arctan(numerador_arctan / denominador_arctan)
            # Ajusta o quadrante do arctan se necessário
            if denominador_arctan < 0:
                if numerador_arctan >= 0:
                    termo_2 += PI
                else:
                    termo_2 -= PI
        
        # Fator de influência: I = (1/(4π)) * [termo_1 + termo_2]
        fator_I = (1.0 / (4.0 * PI)) * (termo_1 + termo_2)
        
        return fator_I
    
    # Usa superposição: divide o retângulo em 4 sub-retângulos com vértice no ponto
    # A fórmula de Newmark funciona para um canto do retângulo na origem.
    # Para pontos FORA, usamos subtração de áreas fictícias.
    
    # Distâncias do ponto aos 4 lados do retângulo
    dist_direita = B/2 - x_rel   # Distância para o lado direito
    dist_esquerda = B/2 + x_rel  # Distância para o lado esquerdo
    dist_frente = L/2 - y_rel    # Distância para frente
    dist_tras = L/2 + y_rel      # Distância para trás
    
    # Calcula a influência total usando superposição com sinais corretos
    # Cada quadrante contribui positivamente se está dentro, ou negativamente se precisa subtrair
    I_total = 0.0
    
    # Determina o sinal de cada quadrante baseado se as distâncias são positivas ou negativas
    sinal_x_dir = 1.0 if dist_direita > EPSILON else -1.0
    sinal_x_esq = 1.0 if dist_esquerda > EPSILON else -1.0
    sinal_y_frente = 1.0 if dist_frente > EPSILON else -1.0
    sinal_y_tras = 1.0 if dist_tras > EPSILON else -1.0
    
    # Quadrante 1: direita + frente (usa abs para calcular, mas aplica o sinal correto)
    I_1 = sinal_x_dir * sinal_y_frente * calcular_fator_influencia(abs(dist_direita), abs(dist_frente), z)
    
    # Quadrante 2: direita + trás
    I_2 = sinal_x_dir * sinal_y_tras * calcular_fator_influencia(abs(dist_direita), abs(dist_tras), z)
    
    # Quadrante 3: esquerda + frente
    I_3 = sinal_x_esq * sinal_y_frente * calcular_fator_influencia(abs(dist_esquerda), abs(dist_frente), z)
    
    # Quadrante 4: esquerda + trás
    I_4 = sinal_x_esq * sinal_y_tras * calcular_fator_influencia(abs(dist_esquerda), abs(dist_tras), z)
    
    # Soma algébrica: positivo para áreas dentro, negativo para subtrair áreas fictícias
    I_total = I_1 + I_2 + I_3 + I_4
    
    # Acréscimo de tensão
    delta_sigma_v = p * I_total
    
    # Prepara detalhes técnicos do cálculo
    detalhes = {
        "x_rel": round(x_rel, 3),
        "y_rel": round(y_rel, 3),
        "z": round(z, 3),
        "distancias": {
            "dist_direita": round(dist_direita, 3),
            "dist_esquerda": round(dist_esquerda, 3),
            "dist_frente": round(dist_frente, 3),
            "dist_tras": round(dist_tras, 3)
        },
        "quadrantes": [
            {
                "nome": "Q1 (dir+frente)",
                "a": round(abs(dist_direita), 3),
                "b": round(abs(dist_frente), 3),
                "m": round(abs(dist_direita) / z, 4) if z > EPSILON else 0,
                "n": round(abs(dist_frente) / z, 4) if z > EPSILON else 0,
                "I": round(abs(calcular_fator_influencia(abs(dist_direita), abs(dist_frente), z)), 6),
                "I_com_sinal": round(I_1, 6),
                "sinal": "+" if sinal_x_dir * sinal_y_frente > 0 else "-"
            },
            {
                "nome": "Q2 (dir+trás)",
                "a": round(abs(dist_direita), 3),
                "b": round(abs(dist_tras), 3),
                "m": round(abs(dist_direita) / z, 4) if z > EPSILON else 0,
                "n": round(abs(dist_tras) / z, 4) if z > EPSILON else 0,
                "I": round(abs(calcular_fator_influencia(abs(dist_direita), abs(dist_tras), z)), 6),
                "I_com_sinal": round(I_2, 6),
                "sinal": "+" if sinal_x_dir * sinal_y_tras > 0 else "-"
            },
            {
                "nome": "Q3 (esq+frente)",
                "a": round(abs(dist_esquerda), 3),
                "b": round(abs(dist_frente), 3),
                "m": round(abs(dist_esquerda) / z, 4) if z > EPSILON else 0,
                "n": round(abs(dist_frente) / z, 4) if z > EPSILON else 0,
                "I": round(abs(calcular_fator_influencia(abs(dist_esquerda), abs(dist_frente), z)), 6),
                "I_com_sinal": round(I_3, 6),
                "sinal": "+" if sinal_x_esq * sinal_y_frente > 0 else "-"
            },
            {
                "nome": "Q4 (esq+trás)",
                "a": round(abs(dist_esquerda), 3),
                "b": round(abs(dist_tras), 3),
                "m": round(abs(dist_esquerda) / z, 4) if z > EPSILON else 0,
                "n": round(abs(dist_tras) / z, 4) if z > EPSILON else 0,
                "I": round(abs(calcular_fator_influencia(abs(dist_esquerda), abs(dist_tras), z)), 6),
                "I_com_sinal": round(I_4, 6),
                "sinal": "+" if sinal_x_esq * sinal_y_tras > 0 else "-"
            }
        ],
        "I_total": round(I_total, 6),
        "p": round(p, 2),
        "delta_sigma_v": round(max(0.0, delta_sigma_v), 4)
    }
    
    return max(0.0, delta_sigma_v), detalhes

# --- Função Principal do Módulo ---

def calcular_acrescimo_tensoes(dados: AcrescimoTensoesInput) -> AcrescimoTensoesOutput:
    """
    Calcula o acréscimo de tensão vertical com base no tipo de carga especificado.
    Suporta: 'pontual', 'faixa', 'circular', 'retangular'.
    """
    try:
        tipo = dados.tipo_carga.lower()
        ponto = dados.ponto_interesse

        if ponto.z <= EPSILON:
             raise ValueError("Profundidade (z) do ponto de interesse deve ser maior que zero.")

        delta_sigma: Optional[float] = None
        metodo: Optional[str] = None
        detalhes_calculo: Optional[dict] = None

        if tipo == "pontual":
            if dados.carga_pontual is None: raise ValueError("Dados de 'carga_pontual' necessários.")
            delta_sigma = calcular_acrescimo_boussinesq_pontual(dados.carga_pontual, ponto)
            metodo = "Boussinesq (Pontual)"

        elif tipo == "faixa":
            if dados.carga_faixa is None: raise ValueError("Dados de 'carga_faixa' necessários.")
            delta_sigma = calcular_acrescimo_carothers_faixa(dados.carga_faixa, ponto)
            metodo = "Carothers (Faixa)"

        elif tipo == "circular":
            if dados.carga_circular is None: raise ValueError("Dados de 'carga_circular' necessários.")
            # Usar ábaco para pontos fora do centro
            delta_sigma = calcular_acrescimo_love_circular_abaco(dados.carga_circular, ponto)
            metodo = "Love (Circular - Ábaco)"

        elif tipo == "retangular":
            if dados.carga_retangular is None: raise ValueError("Dados de 'carga_retangular' necessários.")
            usar_abaco = dados.usar_abaco_newmark if hasattr(dados, 'usar_abaco_newmark') else False
            resultado = calcular_acrescimo_newmark_retangular(dados.carga_retangular, ponto, usar_abaco)
            # Newmark agora retorna tupla (delta_sigma, detalhes)
            if isinstance(resultado, tuple):
                delta_sigma, detalhes_calculo = resultado
            else:
                delta_sigma = resultado
            metodo_tipo = "Ábaco" if usar_abaco else "Fórmula"
            metodo = f"Newmark (Retangular - {metodo_tipo})"

        else:
            return AcrescimoTensoesOutput(erro=f"Tipo de carga '{dados.tipo_carga}' não suportado.")

        # --- Processamento do Resultado ---
        if delta_sigma is None:
             return AcrescimoTensoesOutput(metodo=metodo, erro="Falha no cálculo interno.")
        elif np.isnan(delta_sigma):
             return AcrescimoTensoesOutput(metodo=metodo, erro="Cálculo resultou em valor indefinido (NaN). Verifique os dados.")
        else:
            return AcrescimoTensoesOutput(
                delta_sigma_v=round(delta_sigma, 4),
                metodo=metodo,
                detalhes=detalhes_calculo
            )

    except ValueError as ve:
        return AcrescimoTensoesOutput(erro=str(ve))
    except Exception as e:
        import traceback
        print(f"Erro inesperado no cálculo de acréscimo de tensões: {e}\n{traceback.format_exc()}")
        return AcrescimoTensoesOutput(erro=f"Erro interno no servidor: {type(e).__name__}")