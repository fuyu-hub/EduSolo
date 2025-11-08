# Manual do Módulo: Recalque por Adensamento

## 📋 Visão Geral

O módulo **Recalque por Adensamento** é uma ferramenta especializada para calcular o recalque (afundamento) que ocorre em camadas de solo argiloso quando são submetidas a carregamentos. Este módulo ajuda engenheiros e estudantes a:

- Prever quanto uma camada de argila vai recalcar ao longo do tempo
- Entender como o solo se comporta sob diferentes tensões
- Visualizar a evolução do adensamento ao longo dos anos
- Analisar três períodos diferentes: passado, presente e futuro

---

## 🎯 Objetivo Principal

O objetivo principal é calcular o **recalque primário** que ocorrerá em uma camada de argila compressível quando uma carga adicional (como um aterro ou construção) é aplicada sobre ela. O programa também mostra:

- Quanto tempo leva para o solo atingir diferentes graus de adensamento
- Qual a porcentagem de recalque que já ocorreu em um determinado tempo
- Como as tensões no solo variam ao longo da profundidade

---

## 🔧 Componentes Principais do Programa

### 1. **Configuração do Perfil Geotécnico**

**O que faz:**
Permite definir a estrutura do solo no local, incluindo todas as camadas que compõem o perfil.

**Funcionalidades:**
- **Camadas de Aterro**: Permite adicionar, editar e remover camadas de material acima da argila (como aterros de construção)
- **Camada de Argila**: A camada principal que vai recalcar (sempre presente no cálculo)
- **Camada Base**: Camada abaixo da argila que pode ser drenante (areia) ou não drenante (pedregulho)
- **Nível d'Água (NA)**: Define onde está o nível freático, importante para cálculos de tensões

**Períodos de Análise:**
- **Passado**: Mostra a condição histórica do solo (antes de qualquer carregamento adicional)
- **Presente**: Condição atual do solo (com carregamentos já aplicados)
- **Futuro**: Projeta como será o solo após aplicação de novos carregamentos

**Objetivo:** Criar um modelo visual e preciso do perfil de solo para que o programa possa calcular as tensões corretamente.

---

### 2. **Parâmetros da Camada de Argila**

**O que faz:**
Configura as propriedades físicas e de compressibilidade da camada de argila, que são essenciais para o cálculo do recalque.

**Parâmetros necessários:**
- **Espessura (H₀)**: Espessura total da camada de argila em metros
- **Índice de Vazios Inicial (e₀)**: Mede a quantidade de vazios no solo (quanto maior, mais compressível)
- **Índice de Compressão (Cc)**: Indica quanto o solo comprime quando a tensão aumenta (para compressão virgem)
- **Índice de Recompressão (Cr)**: Indica quanto o solo comprime quando a tensão aumenta mas não ultrapassa a tensão de pré-adensamento
- **Coeficiente de Adensamento (Cv)**: Indica a velocidade com que o solo adensa (em m²/ano)
  - *Opcional*: Se fornecido, permite calcular a evolução temporal do adensamento
- **Peso Específico Natural (γnat)**: Peso do solo quando não saturado (kN/m³)
- **Peso Específico Saturado (γsat)**: Peso do solo quando completamente saturado (kN/m³)
- **Nível d'Água Relativo**: Posição do nível freático em relação ao topo da argila

**Objetivo:** Fornecer todas as propriedades do solo necessárias para calcular tanto a magnitude quanto a velocidade do recalque.

---

### 3. **Cálculo de Tensões**

**O que faz:**
Calcula automaticamente as tensões efetivas atuantes no centro da camada de argila em cada período.

**Tensões calculadas:**
- **σ'vm (Tensão de Pré-Adensamento - Passado)**: Maior tensão que o solo já suportou no passado
- **σ'v0 (Tensão Efetiva Inicial - Presente)**: Tensão atual no solo no momento presente
- **σ'vf (Tensão Efetiva Final - Futuro)**: Tensão que o solo terá após aplicação de novos carregamentos
- **Δσ' (Acréscimo de Tensão)**: Diferença entre a tensão futura e a presente (σ'vf - σ'v0)

**Como funciona:**
- O programa soma o peso de todas as camadas acima do centro da argila
- Considera se as camadas estão acima ou abaixo do nível d'água
- Usa pesos específicos diferentes para solo seco e saturado
- Calcula automaticamente quando você adiciona ou modifica camadas

**Objetivo:** Determinar as tensões corretas para que o cálculo de recalque seja preciso.

---

### 4. **Cálculo do Recalque**

**O que faz:**
Calcula quanto a camada de argila vai recalcar baseado nas tensões e propriedades do solo.

**Tipos de Solo Considerados:**
- **Normalmente Adensado (NA)**: Solo que nunca foi submetido a tensões maiores que a atual
  - RPA ≈ 1 (Razão de Pré-Adensamento próxima de 1)
  - Usa apenas o índice de compressão (Cc)
  
- **Pré-Adensado (PA)**: Solo que já foi submetido a tensões maiores no passado
  - RPA > 1
  - Se a tensão futura não ultrapassar a tensão de pré-adensamento: usa apenas Cr (recompressão)
  - Se a tensão futura ultrapassar: usa Cr até a tensão de pré-adensamento, depois Cc (compressão virgem)

- **Sub-Adensado**: Solo em estado intermediário (calculado como normalmente adensado)

**Fórmulas Utilizadas:**
- **Deformação Volumétrica (εv)**:
  - Normalmente adensado: `εv = (Cc / (1 + e₀)) × log₁₀(σ'vf / σ'v0)`
  - Pré-adensado (sem ultrapassar): `εv = (Cr / (1 + e₀)) × log₁₀(σ'vf / σ'v0)`
  - Pré-adensado (ultrapassando): `εv = (Cr / (1 + e₀)) × log₁₀(σ'vm / σ'v0) + (Cc / (1 + e₀)) × log₁₀(σ'vf / σ'vm)`

- **Recalque Total**: `Recalque = εv × H₀`

**Resultados fornecidos:**
- Recalque total primário (em metros e milímetros)
- Porcentagem de recalque em relação à espessura da camada
- Estado de adensamento identificado
- Razão de Pré-Adensamento (RPA) calculada
- Deformação volumétrica

**Objetivo:** Prever com precisão quanto o solo vai recalcar quando a carga for aplicada.

---

### 5. **Evolução Temporal do Adensamento**

**O que faz:**
Se o coeficiente de adensamento (Cv) for fornecido, calcula como o recalque evolui ao longo do tempo.

**Funcionalidades:**
- **Tabela por Percentual**: Mostra quanto tempo leva para atingir 0%, 10%, 20%, ... 99% de adensamento
- **Tabela por Tempo**: Mostra o grau de adensamento e recalque em intervalos de tempo regulares
- **Visualização Interativa**: Slider para selecionar um tempo específico e ver:
  - Grau de adensamento (solução exata e aproximada)
  - Recalque ocorrido até aquele momento
  - Tempo em anos e meses

**Parâmetros de Drenagem:**
- **Drenagem Simples**: Água drena apenas por uma face (topo ou base)
  - Altura de drenagem (Hd) = espessura da camada
- **Drenagem Dupla**: Água drena por ambas as faces (topo e base)
  - Altura de drenagem (Hd) = metade da espessura da camada
  - Adensamento ocorre mais rápido

**Conceitos Utilizados:**
- **Fator de Tempo (Tv)**: Parâmetro adimensional que relaciona tempo, coeficiente de adensamento e altura de drenagem
- **Grau de Adensamento (U)**: Porcentagem do recalque total que já ocorreu (0% = início, 100% = completo)
- **Solução Exata**: Cálculo usando série matemática completa (mais preciso)
- **Solução Aproximada**: Cálculo usando fórmulas simplificadas (mais rápido, levemente menos preciso)

**Objetivo:** Entender quando o recalque vai ocorrer e quanto tempo levará para se completar, ajudando no planejamento de obras.

---

### 6. **Visualização Gráfica do Perfil**

**O que faz:**
Mostra uma representação visual colorida do perfil de solo configurado.

**Características:**
- **Cores diferentes** para cada tipo de solo:
  - Aterro: tons de bege/marrom claro
  - Argila: marrom argiloso
  - Base drenante (areia): bege claro
  - Base não drenante (pedregulho): cinza
- **Escala de profundidade** ao lado do diagrama
- **Indicador de nível d'água** (linha azul tracejada)
- **Informações exibidas** em cada camada:
  - Nome da camada
  - Espessura
  - Peso específico (se configurado)
  - Parâmetros da argila (Cc, Cr, Cv, e₀)

**Modos de Visualização:**
- **Modo Normal**: Diagrama compacto dentro do card
- **Modo Ampliado**: Visualização em tela cheia comparando os três períodos (passado, presente, futuro) lado a lado

**Interatividade:**
- Clicar em uma camada abre o diálogo de edição
- Botão para adicionar novas camadas de aterro
- Switch para alternar entre períodos

**Objetivo:** Facilitar a compreensão visual da configuração do perfil e verificar se está correta.

---

### 7. **Exportação de Resultados**

**O que faz:**
Permite salvar os resultados dos cálculos em formatos que podem ser usados em relatórios e apresentações.

**Formatos disponíveis:**
- **PDF**: Relatório completo com:
  - Todos os dados de entrada
  - Resultados dos cálculos
  - Fórmulas utilizadas
  - Configurações personalizáveis (título, logo, etc.)
- **Excel**: Planilha com duas abas:
  - Dados de Entrada: Todos os parâmetros informados
  - Resultados: Todos os resultados calculados

**Funcionalidades do PDF:**
- Título personalizado do relatório
- Data e hora da exportação
- Formatação profissional
- Possibilidade de incluir/excluir seções
- Salvamento automático na seção de Relatórios

**Objetivo:** Gerar documentação técnica completa para uso em projetos, relatórios e apresentações.

---

### 8. **Salvamento e Carregamento de Cálculos**

**O que faz:**
Permite salvar configurações de cálculos para uso posterior sem precisar reentrar todos os dados.

**Funcionalidades:**
- **Salvar Cálculo**: Guarda toda a configuração atual (perfil, parâmetros, períodos)
- **Carregar Cálculo**: Recupera uma configuração salva anteriormente
- **Renomear**: Altera o nome de um cálculo salvo
- **Excluir**: Remove cálculos que não são mais necessários
- **Lista de Cálculos**: Visualiza todos os cálculos salvos

**Objetivo:** Economizar tempo ao trabalhar com perfis similares ou reutilizar configurações de projetos anteriores.

---

### 9. **Exemplos Práticos**

**O que faz:**
Fornece exemplos pré-configurados de cálculos típicos para aprendizado e referência.

**Funcionalidades:**
- Carrega automaticamente um perfil de solo completo
- Configura todos os parâmetros necessários
- Serve como base para novos cálculos
- Útil para aprendizado e testes

**Objetivo:** Ajudar usuários a entender como usar o módulo e fornecer pontos de partida para seus próprios cálculos.

---

## 📊 Fluxo de Trabalho Típico

### Passo 1: Configurar o Perfil
1. Abra o módulo Recalque por Adensamento
2. Use o switch para selecionar o período inicial (geralmente "Presente")
3. Clique na camada de argila para configurar:
   - Espessura
   - Peso específico natural e saturado
   - Parâmetros de compressão (e₀, Cc, Cr, Cv)
   - Nível d'água relativo
4. Configure a camada base (drenante ou não drenante)
5. Adicione camadas de aterro se necessário

### Passo 2: Configurar Períodos
1. **Passado**: Adicione camadas de aterro que existiam no passado (para calcular σ'vm)
2. **Presente**: Configure as camadas atuais (para calcular σ'v0)
3. **Futuro**: Adicione ou modifique camadas para simular futuros carregamentos (para calcular σ'vf)

### Passo 3: Verificar Tensões
1. Observe as tensões calculadas automaticamente:
   - No período "Passado": veja σ'vm (tensão de pré-adensamento)
   - No período "Presente": veja σ'v0 (tensão efetiva inicial)
   - No período "Futuro": veja σ'vf (tensão efetiva final) e Δσ' (acréscimo)

### Passo 4: Calcular Recalque
1. Verifique se todos os dados necessários estão preenchidos:
   - Espessura da argila
   - e₀, Cc, Cr
   - Tensões calculadas (σ'v0, σ'vm)
   - Se no futuro: Δσ' deve ser maior que zero
2. Clique em "Calcular Recalque"
3. Aguarde o processamento

### Passo 5: Analisar Resultados
1. **Recalque Total**: Veja quanto o solo vai recalcar
2. **Estado de Adensamento**: Verifique se o solo é normalmente adensado ou pré-adensado
3. **Evolução Temporal** (se Cv fornecido):
   - Use o slider para ver a evolução ao longo do tempo
   - Observe tabelas de tempo para diferentes graus de adensamento
   - Verifique quanto tempo leva para 50%, 70%, 90% de adensamento

### Passo 6: Exportar Resultados
1. Clique no botão de exportação PDF ou Excel
2. Personalize o nome do arquivo (opcional)
3. Adicione título personalizado (opcional)
4. Confirme a exportação
5. O arquivo será salvo e disponibilizado na seção de Relatórios

---

## 🔍 Entendendo os Resultados

### Recalque Total Primário
- **O que é**: Quantidade total de afundamento que a camada de argila sofrerá
- **Unidade**: Metros (m) ou Milímetros (mm)
- **Significado**: Este é o recalque que ocorrerá quando o adensamento estiver completo (100%)
- **Importância**: Usado para dimensionar estruturas e prever danos potenciais

### Porcentagem de Recalque
- **O que é**: Quanto o recalque representa em relação à espessura original da camada
- **Exemplo**: Se a camada tem 10m e recalque de 0.5m, a porcentagem é 5%
- **Significado**: Ajuda a entender a magnitude do recalque em relação ao tamanho da camada

### Estado de Adensamento
- **Normalmente Adensado**: Solo que nunca sofreu tensões maiores. Recalque ocorre principalmente por compressão virgem.
- **Pré-Adensado**: Solo que já sofreu tensões maiores no passado. Recalque inicial é menor (recompressão), mas pode aumentar se a tensão ultrapassar o limite histórico.

### Razão de Pré-Adensamento (RPA)
- **O que é**: Relação entre a tensão de pré-adensamento e a tensão atual
- **RPA = 1**: Solo normalmente adensado
- **RPA > 1**: Solo pré-adensado (quanto maior, mais pré-adensado)
- **Significado**: Indica o histórico de carregamento do solo

### Deformação Volumétrica (εv)
- **O que é**: Quanto o volume do solo muda em relação ao volume original
- **Unidade**: Adimensional (geralmente expresso como fração decimal)
- **Significado**: Mede a compressibilidade do solo sob as tensões aplicadas

### Grau de Adensamento (U)
- **O que é**: Porcentagem do recalque total que já ocorreu
- **0%**: Nenhum recalque ocorreu ainda
- **50%**: Metade do recalque total já ocorreu
- **100%**: Todo o recalque possível já ocorreu
- **Significado**: Mostra o progresso do adensamento ao longo do tempo

### Tempo de Adensamento
- **O que é**: Quanto tempo leva para atingir um determinado grau de adensamento
- **Unidade**: Anos ou Meses
- **Exemplos comuns**:
  - **U50**: Tempo para 50% de adensamento (geralmente usado como referência)
  - **U90**: Tempo para 90% de adensamento (considerado prático para maioria das aplicações)
- **Significado**: Ajuda a planejar prazos de construção e quando estruturas podem ser utilizadas com segurança

---

## ⚠️ Validações e Limitações

### Dados Obrigatórios
Para calcular o recalque, você **deve** fornecer:
- Espessura da camada de argila
- Índice de vazios inicial (e₀)
- Índice de compressão (Cc)
- Índice de recompressão (Cr)
- Tensões efetivas calculadas (σ'v0, σ'vm)
- Se no período futuro: acréscimo de tensão (Δσ') maior que zero

### Dados Opcionais (mas Recomendados)
- Coeficiente de adensamento (Cv): Permite calcular evolução temporal
- Pesos específicos: Necessários para cálculo preciso de tensões
- Nível d'água: Importante para cálculos corretos de tensões efetivas

### Limitações do Modelo
- **Teoria de Terzaghi**: O cálculo baseia-se na teoria clássica de adensamento unidimensional
- **Camada Homogênea**: Assume que a argila tem propriedades uniformes em toda sua espessura
- **Carregamento Instantâneo**: Assume que o carregamento é aplicado instantaneamente
- **Drenagem Unidimensional**: Considera apenas drenagem vertical (topo e/ou base)

### Quando Usar com Cautela
- Solos muito heterogêneos (propriedades variam muito com a profundidade)
- Carregamentos que variam ao longo do tempo
- Condições de drenagem complexas (drenagem radial, por exemplo)
- Solos com comportamento não linear acentuado

---

## 💡 Dicas de Uso

### Para Estudantes
1. Comece carregando um exemplo prático para entender o fluxo
2. Experimente modificar parâmetros e veja como os resultados mudam
3. Compare resultados entre solo normalmente adensado e pré-adensado
4. Use a visualização temporal para entender como o adensamento progride

### Para Profissionais
1. Sempre verifique as tensões calculadas antes de confiar nos resultados
2. Compare resultados com outros métodos de cálculo quando possível
3. Use a exportação PDF para documentar seus cálculos
4. Salve configurações de projetos similares para reutilização
5. Verifique se os parâmetros do solo (Cc, Cr, e₀) são representativos para o tipo de argila em questão

### Boas Práticas
1. **Sempre configure os três períodos** (passado, presente, futuro) para ter uma análise completa
2. **Verifique o nível d'água** - erros aqui afetam significativamente as tensões
3. **Use valores de Cv representativos** - obtenha de ensaios de laboratório quando possível
4. **Documente suas premissas** - anote de onde vieram os parâmetros usados
5. **Valide resultados** - compare com valores esperados para o tipo de solo

---

## 🎓 Conceitos Técnicos Explicados

### Tensão Efetiva
- **O que é**: Tensão que realmente comprime os grãos do solo (tensão total menos pressão da água)
- **Por que importa**: É a tensão efetiva que causa o recalque, não a tensão total
- **Como calcular**: σ' = σ - u (onde σ é tensão total e u é pressão da água)

### Pré-Adensamento
- **O que é**: Situação onde o solo já foi submetido a tensões maiores no passado (por exemplo, por camadas de solo que foram erodidas)
- **Efeito**: Solo pré-adensado recalca menos porque já passou por compressão
- **Identificação**: Quando RPA > 1, o solo é pré-adensado

### Adensamento Primário
- **O que é**: Recalque que ocorre pela expulsão de água dos vazios do solo
- **Duração**: Pode levar de meses a décadas, dependendo da permeabilidade do solo
- **Diferente de**: Adensamento secundário (que ocorre por rearranjo dos grãos, muito mais lento)

### Altura de Drenagem
- **O que é**: Distância que a água precisa percorrer para sair do solo
- **Drenagem simples**: Hd = espessura da camada (água sai por uma face apenas)
- **Drenagem dupla**: Hd = metade da espessura (água sai por ambas as faces, mais rápido)

---

## 📚 Referências e Base Teórica

O módulo implementa a **Teoria de Adensamento Unidimensional de Terzaghi**, que é a base da mecânica dos solos para cálculo de recalques por adensamento. Os cálculos seguem as equações clássicas:

- Equação de adensamento de Terzaghi
- Relações tensão-deformação para solos compressíveis
- Solução da equação diferencial de adensamento (série de Fourier)
- Aproximações práticas para grau de adensamento

---

## 🆘 Resolução de Problemas

### "Preencha todos os dados necessários"
- **Causa**: Faltam parâmetros obrigatórios (e₀, Cc, Cr, ou tensões)
- **Solução**: Verifique se todos os campos da camada de argila estão preenchidos e se há camadas de aterro configuradas

### Tensões aparecem como zero
- **Causa**: Não há camadas de aterro configuradas ou pesos específicos não foram informados
- **Solução**: Adicione camadas de aterro e configure os pesos específicos (γnat ou γsat)

### Recalque parece muito alto ou muito baixo
- **Causa**: Parâmetros do solo (Cc, Cr, e₀) podem estar incorretos
- **Solução**: Verifique se os valores são representativos para o tipo de argila. Consulte tabelas de referência ou resultados de ensaios de laboratório

### Evolução temporal não aparece
- **Causa**: Coeficiente de adensamento (Cv) não foi fornecido
- **Solução**: Adicione o valor de Cv na configuração da camada de argila

### Resultados parecem inconsistentes
- **Causa**: Possível erro na configuração dos períodos (passado, presente, futuro)
- **Solução**: Verifique se as camadas estão configuradas corretamente em cada período e se as tensões calculadas fazem sentido

---

## 📞 Suporte Adicional

Para mais informações sobre:
- Conceitos teóricos de adensamento
- Interpretação de resultados
- Validação de parâmetros do solo
- Aplicações práticas

Consulte bibliografias de mecânica dos solos ou entre em contato com um engenheiro geotécnico qualificado.

---

**Versão do Documento**: 1.0  
**Data**: 2024  
**Módulo**: Recalque por Adensamento - EduSolo

