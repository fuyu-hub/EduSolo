# backend/app/modules/classificacao_uscs.py
from typing import Dict, Optional, Tuple
# Importa os modelos Pydantic definidos em app/models.py
from app.models import ClassificacaoUSCSInput, ClassificacaoUSCSOutput


def classificar_uscs(dados: ClassificacaoUSCSInput) -> ClassificacaoUSCSOutput:
    """
    Classifica um solo de acordo com o Sistema Unificado de Classificação de Solos (USCS).
    
    Baseado na ASTM D2487 - Standard Practice for Classification of Soils for Engineering Purposes.
    
    Args:
        dados: Objeto contendo dados granulométricos e limites de Atterberg
        
    Returns:
        ClassificacaoUSCSOutput: Objeto com classificação, descrição e explicação
    """
    try:
        # Calcular porcentagens a partir dos dados das peneiras
        # pass_peneira_200 = % finos (silte + argila)
        # pass_peneira_4 = % finos + % areia
        # 100 - pass_peneira_4 = % pedregulho
        
        finos = dados.pass_peneira_200  # % passando na #200 (finos)
        pedregulho = 100.0 - dados.pass_peneira_4  # % retido na #4 (pedregulho)
        areia = dados.pass_peneira_4 - dados.pass_peneira_200  # % entre #4 e #200 (areia)
        
        # Validação básica
        if finos < 0 or pedregulho < 0 or areia < 0:
            return ClassificacaoUSCSOutput(
                erro="Dados granulométricos inconsistentes"
            )
        
        # Verificar solo altamente orgânico (Turfa)
        if dados.is_altamente_organico:
            return ClassificacaoUSCSOutput(
                classificacao="Pt",
                descricao="Turfa e outros solos altamente orgânicos"
            )
        
        # Decisão principal: Solo grosso (< 50% finos) ou fino (>= 50% finos)
        if finos < 50.0:
            # SOLO GROSSO
            return _classificar_solo_grosso(pedregulho, areia, finos, dados)
        else:
            # SOLO FINO
            return _classificar_solo_fino(dados)
            
    except Exception as e:
        return ClassificacaoUSCSOutput(erro=f"Erro na classificação: {str(e)}")


def _classificar_solo_grosso(pedregulho: float, areia: float, finos: float, 
                              dados: ClassificacaoUSCSInput) -> ClassificacaoUSCSOutput:
    """Classifica solos grossos (<50% de finos)."""
    
    # Determinar se é pedregulho (G) ou areia (S)
    if pedregulho > areia:
        prefixo = "G"  # Pedregulho
        tipo_solo = "Pedregulho"
    else:
        prefixo = "S"  # Areia
        tipo_solo = "Areia"
    
    # Analisar os finos
    if finos < 5.0:
        # Menos de 5% finos - classificação baseada em graduação (Cu e Cc)
        if dados.Cu is None or dados.Cc is None:
            return ClassificacaoUSCSOutput(
                erro=f"Para solos grossos com menos de 5% de finos, Cu e Cc são obrigatórios"
            )
        
        Cu = dados.Cu
        Cc = dados.Cc
        
        # Critérios de graduação
        if prefixo == "G":  # Pedregulho
            bem_graduado = Cu >= 4.0 and 1.0 <= Cc <= 3.0
        else:  # Areia
            bem_graduado = Cu >= 6.0 and 1.0 <= Cc <= 3.0
        
        if bem_graduado:
            classificacao = f"{prefixo}W"  # Well-graded
            descricao = f"{tipo_solo} bem graduado"
        else:
            classificacao = f"{prefixo}P"  # Poorly-graded
            descricao = f"{tipo_solo} mal graduado"
    
    elif 5.0 <= finos <= 12.0:
        # Entre 5-12% finos - classificação dupla ou borderline
        if dados.Cu is not None and dados.Cc is not None:
            Cu = dados.Cu
            Cc = dados.Cc
            
            if prefixo == "G":
                bem_graduado = Cu >= 4.0 and 1.0 <= Cc <= 3.0
            else:
                bem_graduado = Cu >= 6.0 and 1.0 <= Cc <= 3.0
            
            # Determinar símbolo dos finos
            sufixo_finos = _determinar_sufixo_finos(dados)
            
            if bem_graduado:
                classificacao = f"{prefixo}W-{prefixo}{sufixo_finos}"
                descricao = f"{tipo_solo} bem graduado com finos"
            else:
                classificacao = f"{prefixo}P-{prefixo}{sufixo_finos}"
                descricao = f"{tipo_solo} mal graduado com finos"
        else:
            # Sem Cu e Cc, usa apenas os finos
            sufixo_finos = _determinar_sufixo_finos(dados)
            classificacao = f"{prefixo}{sufixo_finos}"
            descricao = f"{tipo_solo} com finos"
    
    else:  # finos > 12%
        # Mais de 12% finos - classificação baseada em plasticidade dos finos
        sufixo_finos = _determinar_sufixo_finos(dados)
        classificacao = f"{prefixo}{sufixo_finos}"
        
        if sufixo_finos == "M":
            descricao = f"{tipo_solo} siltoso"
        elif sufixo_finos == "C":
            descricao = f"{tipo_solo} argiloso"
        else:
            descricao = f"{tipo_solo} com finos"
    
    return ClassificacaoUSCSOutput(
        classificacao=classificacao,
        descricao=descricao
    )


def _classificar_solo_fino(dados: ClassificacaoUSCSInput) -> ClassificacaoUSCSOutput:
    """Classifica solos finos (>=50% de finos)."""
    
    # Requer limites de Atterberg
    if dados.ll is None:
        return ClassificacaoUSCSOutput(
            erro="Para solos finos (>=50% finos), o Limite de Liquidez (LL) é obrigatório"
        )
    
    LL = dados.ll
    IP = dados.ip if dados.ip is not None else 0.0
    
    # Determinar se é solo de alta ou baixa plasticidade
    if LL < 50.0:
        # Baixa plasticidade (L)
        if IP > 7.0 and IP >= 0.73 * (LL - 20.0):
            # Acima da linha A
            classificacao = "CL"
            descricao = "Argila de baixa plasticidade"
        elif IP < 4.0:
            # Abaixo da linha A, baixa plasticidade
            classificacao = "ML"
            descricao = "Silte de baixa plasticidade"
        else:
            # Zona intermediária (CL-ML)
            classificacao = "CL-ML"
            descricao = "Silte argiloso de baixa plasticidade"
    
    else:
        # Alta plasticidade (H)
        if IP >= 0.73 * (LL - 20.0):
            # Acima da linha A
            classificacao = "CH"
            descricao = "Argila de alta plasticidade"
        else:
            # Abaixo da linha A
            classificacao = "MH"
            descricao = "Silte de alta plasticidade"
    
    # Verificar se é solo orgânico
    if dados.is_organico_fino:
        if LL < 50.0:
            classificacao = "OL"
            descricao = "Silte/argila orgânico de baixa plasticidade"
        else:
            classificacao = "OH"
            descricao = "Silte/argila orgânico de alta plasticidade"
    
    return ClassificacaoUSCSOutput(
        classificacao=classificacao,
        descricao=descricao
    )


def _determinar_sufixo_finos(dados: ClassificacaoUSCSInput) -> str:
    """
    Determina o sufixo para finos em solos grossos (M=siltoso, C=argiloso).
    """
    if dados.ll is None or dados.ip is None:
        return "M"  # Padrão: assume siltoso se não há dados de plasticidade
    
    LL = dados.ll
    IP = dados.ip
    
    # Critério da linha A
    if IP >= 4.0 and IP >= 0.73 * (LL - 20.0):
        return "C"  # Argiloso (acima da linha A)
    else:
        return "M"  # Siltoso (abaixo da linha A)
