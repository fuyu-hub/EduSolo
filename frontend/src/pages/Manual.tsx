import { BookOpen, CheckCircle2, AlertTriangle, HelpCircle, Target, Zap, Info, FileText, Settings, Download, Save, Rocket, Layers, Calculator } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Manual() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto px-4 md:px-0 pb-8">
      <Helmet>
        <title>Manual do Usuário | EduSolos</title>
        <meta name="description" content="Acesse o manual completo do EduSolos. Aprenda a utilizar os módulos de índices físicos, limites de consistência, granulometria, compactação e recalque." />
      </Helmet>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Manual do Usuário</h1>
            <p className="text-sm md:text-base text-muted-foreground">Sistema EduSolos - Ferramentas de Mecânica dos Solos</p>
          </div>
        </div>
      </div>

      {/* Visão Geral */}
      <section className="space-y-4">
        <Card className="glass p-5 md:p-7 border-l-4 border-l-primary">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Sobre o Sistema</h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">EduSolos</strong> é uma plataforma educacional completa para análise geotécnica,
              desenvolvida para estudantes, professores e profissionais de engenharia civil.
              Oferece ferramentas interativas para cálculos de mecânica dos solos com visualizações modernas e relatórios profissionais.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { icon: CheckCircle2, text: "100% Gratuito e Offline" },
                { icon: CheckCircle2, text: "Interface Moderna e Intuitiva" },
                { icon: CheckCircle2, text: "Baseado em Normas Técnicas" },
                { icon: CheckCircle2, text: "Exportação PDF e Excel" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Módulos Disponíveis */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Módulos Disponíveis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              num: "1",
              name: "Índices Físicos",
              desc: "Propriedades fundamentais do solo",
              features: ["Pesos específicos", "Índice de vazios", "Porosidade", "Grau de saturação", "Diagrama de fases"]
            },
            {
              num: "2",
              name: "Limites de Consistência",
              desc: "Limites de Atterberg",
              features: ["Limite de liquidez (LL)", "Limite de plasticidade (LP)", "Índice de plasticidade (IP)", "Carta de Casagrande"]
            },
            {
              num: "3",
              name: "Granulometria",
              desc: "Distribuição de tamanhos de partículas",
              features: ["Curva granulométrica", "Parâmetros D10, D30, D60", "Classificação USCS", "Classificação HRB/AASHTO"]
            },
            {
              num: "4",
              name: "Compactação",
              desc: "Ensaios Proctor",
              features: ["Curva de compactação", "Umidade ótima", "Peso específico seco máximo", "Curva de saturação"]
            },
            {
              num: "5",
              name: "Tensões Geostáticas",
              desc: "Tensões devido ao peso próprio",
              features: ["Tensões totais", "Pressões neutras", "Tensões efetivas", "Análise multicamadas"]
            },
            {
              num: "6",
              name: "Acréscimo de Tensões",
              desc: "Tensões por carregamentos externos",
              features: ["Boussinesq (pontual)", "Newmark (retangular)", "Love (circular)", "Carothers (faixa)"]
            },
            {
              num: "7",
              name: "Recalque por Adensamento",
              desc: "Cálculo de recalques",
              features: ["Teoria de Terzaghi", "Evolução temporal", "Grau de adensamento", "Análise de períodos"]
            }
          ].map((module) => (
            <Card key={module.num} className="glass p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-sm font-bold">{module.num}</Badge>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">{module.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 ml-9">
                  {module.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Funcionalidades Principais */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Funcionalidades Principais</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass p-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Exportação</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Relatórios em PDF profissionais</li>
                <li>• Planilhas Excel editáveis</li>
                <li>• Gráficos e diagramas</li>
                <li>• Personalização de layout</li>
              </ul>
            </div>
          </Card>

          <Card className="glass p-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Save className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Salvamento</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Salve cálculos completos</li>
                <li>• Carregue trabalhos salvos</li>
                <li>• Organize por projetos</li>
                <li>• Histórico de cálculos</li>
              </ul>
            </div>
          </Card>

          <Card className="glass p-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Configurações</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Temas de cores personalizáveis</li>
                <li>• Modo claro/escuro</li>
                <li>• Precisão de cálculos</li>
                <li>• Tutoriais interativos</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* Guia de Uso Rápido */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Guia de Uso Rápido</h2>
        </div>

        <Card className="glass p-5 md:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Fluxo de Trabalho
              </h3>
              <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
                <li>Escolha o módulo desejado no Dashboard</li>
                <li>Insira os dados do ensaio ou projeto</li>
                <li>Clique em "Calcular" ou "Analisar"</li>
                <li>Visualize resultados e gráficos</li>
                <li>Exporte relatório em PDF ou Excel</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Dicas Importantes
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Use exemplos para aprender o funcionamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Ative tutoriais nas configurações</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Verifique unidades antes de calcular</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Salve trabalhos importantes</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Resolução de Problemas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Resolução de Problemas</h2>
        </div>

        <Card className="glass p-5 md:p-7 border-l-4 border-l-amber-500">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-semibold text-foreground">Problemas Comuns</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <strong className="text-sm text-foreground">Cálculo não funciona</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Verifique campos obrigatórios</li>
                  <li>• Confirme valores dentro dos limites</li>
                  <li>• Leia mensagens de erro</li>
                </ul>
              </div>

              <div className="space-y-2">
                <strong className="text-sm text-foreground">Resultados incorretos</strong>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Verifique unidades de medida</li>
                  <li>• Confirme dados de entrada</li>
                  <li>• Compare com cálculo manual</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Referências Técnicas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Base Técnica</h2>
        </div>

        <Card className="glass p-5 md:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Normas Técnicas</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• NBR 6459 - Limite de Liquidez</li>
                <li>• NBR 7180 - Limite de Plasticidade</li>
                <li>• NBR 7181 - Análise Granulométrica</li>
                <li>• NBR 12007 - Ensaio de Compactação</li>
                <li>• ASTM D2487 - Classificação USCS</li>
                <li>• AASHTO M 145 - Classificação HRB</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Métodos e Teorias</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Teoria de Terzaghi (Adensamento)</li>
                <li>• Solução de Boussinesq (Carga pontual)</li>
                <li>• Método de Newmark (Carga retangular)</li>
                <li>• Método de Love (Carga circular)</li>
                <li>• Método de Carothers (Carga em faixa)</li>
                <li>• Princípio de Tensões Efetivas</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 pb-4">
        <Separator className="mb-4" />
        <p>Manual do Usuário v1.0 • Sistema EduSolos • 2025</p>
        <p className="mt-1">Desenvolvido para educação e prática profissional em Mecânica dos Solos</p>
      </div>
    </div>
  );
}

