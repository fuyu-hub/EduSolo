import { BookOpen, CheckCircle2, AlertTriangle, HelpCircle, Target, Zap, Info, FileText, Settings, Download, Save, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Manual() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto px-4 md:px-0 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Manual Geral do EduSolo</h1>
            <p className="text-sm md:text-base text-muted-foreground">Guia completo de uso e funcionalidades</p>
          </div>
        </div>
      </div>

      {/* Visão Geral */}
      <section className="space-y-4">
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Visão Geral do Sistema
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">EduSolo</strong> é uma plataforma educacional completa para análise e aprendizado em 
              <strong className="text-foreground"> Mecânica dos Solos</strong>. É uma suíte de ferramentas interativas desenvolvida para 
              estudantes, professores e profissionais de engenharia civil e geotecnia.
            </p>
            
            <div className="space-y-2 pt-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Objetivos do Sistema</h3>
              <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Educação</strong>: Facilitar o aprendizado de conceitos fundamentais de mecânica dos solos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Cálculos Precisos</strong>: Fornecer ferramentas confiáveis para análises geotécnicas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Visualização</strong>: Apresentar resultados de forma gráfica e intuitiva</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Acessibilidade</strong>: 100% gratuito e funciona completamente offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Rigor Técnico</strong>: Baseado em normas técnicas e métodos consolidados (NBR, ASTM)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Características Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "100% Offline - Todos os cálculos no navegador",
                  "Interface Moderna - Design intuitivo e responsivo",
                  "Exportação de Resultados - PDF e Excel",
                  "Salvamento de Cálculos - Retome trabalhos depois",
                  "Exemplos Práticos - Aprenda com exemplos",
                  "Tutoriais Interativos - Guias passo a passo",
                  "Temas Personalizáveis - Escolha sua paleta",
                  "Modo Claro/Escuro - Adapte às preferências"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Estrutura do Sistema */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Estrutura do Sistema
        </h2>
        
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Módulos Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { num: "1", name: "Índices Físicos", desc: "Propriedades básicas do solo" },
                { num: "2", name: "Limites de Consistência", desc: "Limites de Atterberg" },
                { num: "3", name: "Granulometria e Classificação", desc: "Análise de tamanho de partículas" },
                { num: "4", name: "Compactação", desc: "Ensaios Proctor e curvas de compactação" },
                { num: "5", name: "Tensões Geostáticas", desc: "Tensões no solo devido ao peso próprio" },
                { num: "6", name: "Acréscimo de Tensões", desc: "Tensões devido a carregamentos externos" },
                { num: "7", name: "Recalque por Adensamento", desc: "Cálculo de recalques em solos compressíveis" }
              ].map((module) => (
                <div key={module.num} className="p-3 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">{module.num}</Badge>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{module.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Funcionalidades Gerais</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">📱 Dashboard (Página Inicial)</h4>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Visão geral de todos os módulos disponíveis</li>
                  <li>• Acesso rápido a cada funcionalidade</li>
                  <li>• Cards informativos com descrição de cada módulo</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">⚙️ Configurações</h4>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Temas de Cores: Escolha entre diferentes paletas</li>
                  <li>• Modo Claro/Escuro: Alterne conforme sua preferência</li>
                  <li>• Precisão de Cálculos: Configure casas decimais</li>
                  <li>• Exportação de PDF: Configure layout, margens, orientação</li>
                  <li>• Tutoriais: Ative ou desative guias interativos</li>
                  <li>• Dicas Educacionais: Mostrar ou ocultar explicações</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">📊 Relatórios</h4>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Visualize todos os relatórios gerados</li>
                  <li>• Filtre por módulo ou busque por nome</li>
                  <li>• Visualize, baixe ou regenere relatórios PDF</li>
                  <li>• Gerencie seu histórico de cálculos</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">💾 Salvamento e Carregamento</h4>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Salve configurações de cálculos para uso posterior</li>
                  <li>• Carregue cálculos salvos rapidamente</li>
                  <li>• Renomeie ou exclua cálculos antigos</li>
                  <li>• Organize seus trabalhos</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Módulos Detalhados */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Módulos Disponíveis
        </h2>

        {/* Índices Físicos */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>1</Badge>
              <h3 className="text-lg font-semibold text-foreground">📐 Índices Físicos</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Calcula as propriedades fundamentais do solo, essenciais para entender seu comportamento.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Pesos Específicos: Natural, seco, saturado e submerso</li>
                <li>• Índice de Vazios (e): Relação entre volume de vazios e volume de sólidos</li>
                <li>• Porosidade (n): Percentual de vazios no volume total</li>
                <li>• Grau de Saturação (S): Percentual de vazios preenchidos com água</li>
                <li>• Umidade (w): Percentual de água em relação ao peso seco</li>
                <li>• Densidade Relativa dos Grãos (Gs): Relação entre densidade dos sólidos e densidade da água</li>
                <li>• Compacidade Relativa (Dr): Estado de compactação de solos granulares</li>
                <li>• Diagrama de Fases: Visualização interativa das relações volumétricas</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Limites de Consistência */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>2</Badge>
              <h3 className="text-lg font-semibold text-foreground">💧 Limites de Consistência</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Caracteriza o comportamento de solos finos (argilosos e siltosos) em diferentes estados de umidade.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Limite de Liquidez (LL): Método de Casagrande com curva de fluxo</li>
                <li>• Limite de Plasticidade (LP): Umidade na qual o solo perde plasticidade</li>
                <li>• Índice de Plasticidade (IP): IP = LL - LP</li>
                <li>• Índice de Consistência (IC): Estado atual do solo</li>
                <li>• Atividade da Argila (Ia): Relação entre IP e percentual de argila</li>
                <li>• Carta de Plasticidade de Casagrande: Classificação visual</li>
                <li>• Classificação Geotécnica: Identificação automática (CH, CL, MH, ML, etc.)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Granulometria */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>3</Badge>
              <h3 className="text-lg font-semibold text-foreground">🔬 Granulometria e Classificação</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Determina a distribuição dos tamanhos de partículas no solo, essencial para classificação.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Análise Granulométrica Completa: Entrada de dados de peneiramento</li>
                <li>• Parâmetros Característicos: D10, D30, D60, Cu, Cc</li>
                <li>• Classificação USCS: Sistema Unificado (GW, GP, SW, SP, ML, CL, CH, MH, etc.)</li>
                <li>• Classificação HRB/AASHTO: Para pavimentação (A-1, A-2, A-3, A-4, A-5, A-6, A-7)</li>
                <li>• Curva Granulométrica Interativa: Visualização gráfica</li>
                <li>• Composição Granulométrica: Percentuais de pedregulho, areia e finos</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Compactação */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>4</Badge>
              <h3 className="text-lg font-semibold text-foreground">🔨 Compactação</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Determina a relação entre umidade e densidade seca, essencial para projetos de aterros.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Curva de Compactação: Relação entre umidade e peso específico seco</li>
                <li>• Parâmetros Ótimos: Umidade Ótima (wₒₜ) e Peso Específico Seco Máximo (γd,max)</li>
                <li>• Curva de Saturação (S=100%): Curva teórica de saturação completa</li>
                <li>• Análise de Energia Proctor: Suporte para Proctor Normal e Modificado</li>
                <li>• Ajuste Polinomial Automático: Dos pontos de ensaio</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Tensões Geostáticas */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>5</Badge>
              <h3 className="text-lg font-semibold text-foreground">📊 Tensões Geostáticas</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Calcula tensões que existem no solo devido ao peso próprio das camadas sobrepostas.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Tensões Totais (σᵥ): Tensão vertical total em qualquer profundidade</li>
                <li>• Pressões Neutras (u): Pressão da água nos vazios do solo</li>
                <li>• Tensões Efetivas (σ'): Tensão que comprime os grãos (σ' = σ - u)</li>
                <li>• Tensões Horizontais (σₕ'): Coeficiente de empuxo em repouso (K₀)</li>
                <li>• Análise Multicamadas: Múltiplas camadas com propriedades diferentes</li>
                <li>• Diagrama Visual: Perfil de solo colorido com gráficos de tensões</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Acréscimo de Tensões */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>6</Badge>
              <h3 className="text-lg font-semibold text-foreground">🎯 Acréscimo de Tensões</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Calcula tensões adicionais no solo causadas por carregamentos externos.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Métodos Disponíveis:</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <strong className="text-xs md:text-sm text-foreground">• Boussinesq (Carga Pontual):</strong>
                  <span className="text-xs md:text-sm text-muted-foreground"> Cargas concentradas (postes, pilares)</span>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-foreground">• Carothers (Carga em Faixa):</strong>
                  <span className="text-xs md:text-sm text-muted-foreground"> Aterros lineares, estradas</span>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-foreground">• Love (Carga Circular):</strong>
                  <span className="text-xs md:text-sm text-muted-foreground"> Tanques, reservatórios, fundações circulares</span>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-foreground">• Newmark (Carga Retangular):</strong>
                  <span className="text-xs md:text-sm text-muted-foreground"> Edifícios, fundações retangulares</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong className="text-foreground">✨ Diferencial:</strong> Canvas 2D interativo, múltiplas cargas, visualização de distribuição de tensões.
              </p>
            </div>
          </div>
        </Card>

        {/* Recalque por Adensamento */}
        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>7</Badge>
              <h3 className="text-lg font-semibold text-foreground">⏱️ Recalque por Adensamento</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">O que é:</strong> Calcula o afundamento (recalque) que ocorre em camadas de solo argiloso quando submetidas a carregamentos.
            </p>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Funcionalidades:</h4>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Cálculo de Recalque Primário: Baseado na Teoria de Terzaghi</li>
                <li>• Evolução Temporal: Grau de adensamento ao longo do tempo</li>
                <li>• Análise de Três Períodos: Passado, Presente e Futuro</li>
                <li>• Visualização do Perfil: Diagrama visual do perfil de solo</li>
                <li>• Configuração de Drenagem: Drenagem simples ou dupla</li>
                <li>• Estados de Adensamento: Normalmente adensado ou pré-adensado</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Funcionalidades Gerais */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Funcionalidades Gerais do Sistema
        </h2>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Exportação de Resultados
              </h3>
              <div className="space-y-2 ml-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">PDF</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Todos os dados de entrada e resultados</li>
                    <li>• Fórmulas utilizadas (se configurado)</li>
                    <li>• Gráficos e diagramas</li>
                    <li>• Personalização de layout, tema, margens</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Excel</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Planilha com múltiplas abas</li>
                    <li>• Dados organizados em formato tabular</li>
                    <li>• Fácil manipulação e análise</li>
                  </ul>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <Save className="w-4 h-4 text-primary" />
                Salvamento e Carregamento
              </h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Salve configurações completas de qualquer cálculo</li>
                <li>• Carregue cálculos rapidamente</li>
                <li>• Renomeie ou exclua cálculos</li>
                <li>• Organize seu trabalho</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Configurações do Sistema
              </h3>
              <div className="space-y-2 ml-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Aparência</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Temas de Cores (Terra Natural, Índigo, Verde, etc.)</li>
                    <li>• Modo Claro/Escuro</li>
                    <li>• Redução de Animações</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Cálculos</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Precisão (2, 3, 4 ou 5 casas decimais)</li>
                    <li>• Notação Científica</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Interface</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Dicas Educacionais</li>
                    <li>• Fórmulas nos resultados</li>
                    <li>• Tutoriais Interativos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Guia de Uso Rápido */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          Guia de Uso Rápido
        </h2>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Primeiros Passos</h3>
              <ol className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Acesse o Sistema: Abra o EduSolo no seu navegador</li>
                <li>Explore o Dashboard: Veja todos os módulos disponíveis</li>
                <li>Escolha um Módulo: Clique no módulo que deseja usar</li>
                <li>Siga o Tutorial: Se ativado, o tutorial guiará você</li>
                <li>Carregue um Exemplo: Use exemplos para entender o funcionamento</li>
                <li>Faça Seu Cálculo: Insira seus dados</li>
                <li>Visualize Resultados: Analise gráficos e tabelas</li>
                <li>Exporte: Gere relatório em PDF ou Excel</li>
              </ol>
            </div>
            <Separator />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Fluxo Típico de Trabalho</h3>
              <ol className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li><strong className="text-foreground">Entrada de Dados</strong>: Insira dados do ensaio ou projeto</li>
                <li><strong className="text-foreground">Cálculo</strong>: Clique em "Calcular" e aguarde processamento</li>
                <li><strong className="text-foreground">Análise de Resultados</strong>: Visualize gráficos e tabelas</li>
                <li><strong className="text-foreground">Exportação</strong>: Gere relatório em PDF</li>
                <li><strong className="text-foreground">Documentação</strong>: Use relatórios em seus trabalhos</li>
              </ol>
            </div>
          </div>
        </Card>
      </section>

      {/* Dicas e Boas Práticas */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Dicas e Boas Práticas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">Para Estudantes</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Comece pelos Exemplos</li>
              <li>• Ative Tutoriais</li>
              <li>• Experimente modificando parâmetros</li>
              <li>• Compare Métodos</li>
              <li>• Documente seus cálculos</li>
            </ul>
          </Card>
          <Card className="glass p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">Para Professores</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use em Aulas</li>
              <li>• Crie Exercícios</li>
              <li>• Valide Resultados</li>
              <li>• Explore Visualizações</li>
              <li>• Compartilhe Exemplos</li>
            </ul>
          </Card>
          <Card className="glass p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">Para Profissionais</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Valide Dados</li>
              <li>• Compare Métodos</li>
              <li>• Documente Premissas</li>
              <li>• Mantenha Histórico</li>
              <li>• Use Relatórios</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Resolução de Problemas */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Resolução de Problemas
        </h2>

        <Card className="glass p-4 md:p-6 border-l-4 border-l-amber-500">
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Problemas Comuns
              </h3>
              <div className="space-y-3 text-xs md:text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">Cálculo não funciona</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Verifique se todos os campos obrigatórios estão preenchidos</li>
                    <li>• Verifique se os valores estão dentro dos limites esperados</li>
                    <li>• Veja mensagens de erro para orientação específica</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-foreground">Resultados parecem incorretos</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Verifique unidades (m, cm, kN/m³, etc.)</li>
                    <li>• Confirme se os dados de entrada estão corretos</li>
                    <li>• Compare com cálculos manuais ou outros métodos</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-foreground">Exportação não funciona</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Verifique se há resultados calculados</li>
                    <li>• Tente em outro navegador</li>
                    <li>• Verifique espaço em disco</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Referências */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Referências e Base Teórica
        </h2>

        <Card className="glass p-4 md:p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Normas Técnicas</h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• NBR 6459: Limite de Liquidez</li>
                <li>• NBR 7180: Limite de Plasticidade</li>
                <li>• NBR 7181: Análise Granulométrica</li>
                <li>• NBR 12007: Ensaio de Compactação</li>
                <li>• ASTM D2487: Classificação USCS</li>
                <li>• AASHTO M 145: Classificação HRB</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Teorias Utilizadas</h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Teoria de Terzaghi: Adensamento unidimensional</li>
                <li>• Solução de Boussinesq: Carga pontual</li>
                <li>• Método de Newmark: Carga retangular</li>
                <li>• Método de Love: Carga circular</li>
                <li>• Método de Carothers: Carga em faixa</li>
                <li>• Princípio de Tensões Efetivas: Terzaghi</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Conclusão */}
      <Card className="glass p-4 md:p-6 border-l-4 border-l-primary">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Principais Benefícios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              "Completo: Cobre todos os aspectos fundamentais",
              "Preciso: Baseado em teorias consolidadas",
              "Intuitivo: Interface moderna e fácil de usar",
              "Educacional: Tutoriais, dicas e exemplos",
              "Profissional: Relatórios de qualidade",
              "Acessível: Gratuito, offline e open source"
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Versão */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        <p>Manual v1.0 • Sistema EduSolo • 2025</p>
      </div>
    </div>
  );
}

