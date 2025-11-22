import { Rocket, CheckCircle2, Circle, Clock, Sparkles, Target, Zap, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PlanosFuturos() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Rocket className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planos Futuros</h1>
            <p className="text-sm md:text-base text-muted-foreground">Roadmap e funcionalidades planejadas</p>
          </div>
        </div>
      </div>

      {/* Visão Geral */}
      <Card className="glass p-4 md:p-6 border-l-4 border-l-violet-500">
        <div className="space-y-2">
          <p className="text-xs md:text-sm text-foreground font-semibold leading-relaxed">
            O EduSolos está em constante evolução! Com <span className="text-primary font-bold">7 módulos principais já implementados</span> e funcionalidades
            profissionais como exportação PDF/Excel, salvamento de cálculos e tutoriais interativos, nossa plataforma oferece
            uma experiência completa para análise e aprendizado em Mecânica dos Solos.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Nosso objetivo é continuar expandindo a ferramenta, abrangendo todos os principais tópicos da Mecânica dos Solos
            e oferecendo uma experiência educacional excepcional para estudantes, professores e profissionais.
          </p>
        </div>
      </Card>

      {/* Destaque Especial - Conquistas Recentes */}
      <Card className="glass p-4 md:p-6 border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Conquistas Recentes</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Funcionalidades implementadas recentemente que tornam o EduSolos uma ferramenta ainda mais completa e profissional:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 pt-2">
            <div className="flex items-start gap-2 text-xs md:text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">✅ Sistema de Exportação:</strong>
                <span className="text-muted-foreground"> Relatórios PDF e Excel profissionais com personalização completa</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">✅ Salvamento de Cálculos:</strong>
                <span className="text-muted-foreground"> Sistema completo de salvamento e carregamento funcional</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">✅ Tutoriais Interativos:</strong>
                <span className="text-muted-foreground"> Guias passo a passo em todos os módulos</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">✅ Módulo Recalque:</strong>
                <span className="text-muted-foreground"> Implementação completa com análise temporal e visualização interativa</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progresso Geral */}
      <Card className="glass p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base md:text-xl font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="truncate">Progresso Geral do Projeto</span>
            </h2>
            <Badge variant="secondary" className="text-sm md:text-base flex-shrink-0">
              85%
            </Badge>
          </div>
          <Progress value={85} className="h-2 md:h-3" />
          <p className="text-xs md:text-sm text-muted-foreground">
            7 módulos principais completos • Sistema de exportação PDF/Excel • Salvamento de cálculos • Tutoriais interativos • Interface responsiva
          </p>
        </div>
      </Card>

      {/* Prioridades Imediatas */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Em Desenvolvimento</h2>
          <Badge variant="destructive" className="text-xs md:text-sm">Alta Prioridade</Badge>
        </div>

        <div className="space-y-3">
          <FeatureCard
            status="em-desenvolvimento"
            title="Resistência ao Cisalhamento"
            description="Análise de ensaios triaxiais (UU, CU, CD) e cisalhamento direto. Cálculo de parâmetros de resistência (c, φ), círculo de Mohr e análise de tensões efetivas."
            tags={["Triaxial", "Cisalhamento Direto", "Mohr-Coulomb", "Resistência"]}
            progress={0}
          />

          <FeatureCard
            status="em-desenvolvimento"
            title="Empuxo de Terra"
            description="Cálculo de empuxo em repouso (K₀), empuxo ativo (Ka) e passivo (Kp) usando teorias de Rankine e Coulomb. Análise de muros de contenção e estabilidade."
            tags={["Rankine", "Coulomb", "Muros de Arrimo", "Estabilidade"]}
            progress={0}
          />

          <FeatureCard
            status="em-desenvolvimento"
            title="Capacidade de Carga"
            description="Cálculo de capacidade de carga de fundações rasas e profundas usando fórmulas clássicas (Terzaghi, Meyerhof, Hansen). Fatores de capacidade, influência da forma e profundidade."
            tags={["Terzaghi", "Meyerhof", "Hansen", "Fundações"]}
            progress={0}
          />

          <FeatureCard
            status="em-desenvolvimento"
            title="Estabilidade de Taludes"
            description="Análise de estabilidade usando métodos de equilíbrio limite: Fellenius, Bishop, Janbu. Superfície de ruptura circular e cálculo de fator de segurança."
            tags={["Bishop", "Fellenius", "Janbu", "Fator de Segurança"]}
            progress={0}
          />

          <FeatureCard
            status="em-desenvolvimento"
            title="Melhorias Contínuas"
            description="Aprimoramento contínuo dos módulos existentes: validações mais robustas, feedback visual aprimorado, otimização de performance, correção de bugs e melhorias de UX/UI."
            tags={["UX/UI", "Performance", "Validações", "Feedback"]}
            progress={75}
          />
        </div>
      </section>

      {/* Módulos Concluídos Recentemente */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Módulos Concluídos Recentemente</h2>
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm">✅ Completo</Badge>
        </div>

        <Card className="glass p-3 md:p-4 border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <p className="text-xs md:text-sm text-muted-foreground">
            <strong className="text-foreground">Estes módulos foram finalizados e estão disponíveis para uso:</strong> Recalque por Adensamento foi recentemente implementado com todas as funcionalidades, incluindo análise temporal e visualização interativa do perfil.
          </p>
        </Card>

        <div className="space-y-3">
          <FeatureCard
            status="concluido"
            title="Recalque por Adensamento"
            description="Cálculo completo de recalques em solos argilosos com análise de três períodos (passado, presente, futuro). Implementa teoria de Terzaghi com solução exata e aproximada, evolução temporal, configuração de drenagem simples e dupla, e visualização interativa do perfil geotécnico."
            tags={["Recalques", "Terzaghi", "Cc", "Cr", "Evolução Temporal", "Drenagem"]}
            progress={100}
          />

          <FeatureCard
            status="concluido"
            title="Sistema de Exportação"
            description="Geração completa de relatórios profissionais em PDF e Excel com personalização de layout, temas, margens, orientação e elementos. Sistema de gerenciamento de relatórios com visualização, download e regeneração."
            tags={["PDF", "Excel", "Relatórios", "Exportação"]}
            progress={100}
          />

          <FeatureCard
            status="concluido"
            title="Salvamento e Carregamento"
            description="Sistema completo de salvamento e carregamento de cálculos, permitindo retomar trabalhos posteriormente. Organização por nome, renomeação e exclusão de cálculos salvos."
            tags={["Salvamento", "Carregamento", "Persistência", "Organização"]}
            progress={100}
          />
        </div>
      </section>

      {/* Módulos Planejados */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Planejados para Médio Prazo</h2>
        </div>

        <div className="space-y-3">
          <FeatureCard
            status="planejado"
            title="Fluxo Hidráulico"
            description="Análise de permeabilidade equivalente (horizontal e vertical), velocidades de descarga e percolação, gradiente crítico, fator de segurança contra liquefação e análise de tensões sob fluxo. Redes de fluxo e lei de Darcy."
            tags={["Permeabilidade", "Redes de Fluxo", "Lei de Darcy", "Gradiente Crítico"]}
          />

          <FeatureCard
            status="planejado"
            title="Melhorias nos Módulos Existentes"
            description="Análise avançada de recalques (recalque secundário), múltiplos métodos de classificação, melhorias na integração entre módulos e validações adicionais."
            tags={["Recalque Secundário", "Classificação", "Integração", "Validações"]}
          />
        </div>
      </section>

      {/* Funcionalidades Complementares */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Funcionalidades Complementares</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Templates de Exportação"
            description="Biblioteca de templates prontos para diferentes tipos de relatórios e normas técnicas"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Histórico de Ensaios"
            description="Visualizar evolução temporal dos ensaios e comparar resultados ao longo do tempo"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Banco de Dados de Solos"
            description="Biblioteca com propriedades de solos brasileiros típicos por região"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Sistema de Projetos"
            description="Organizar múltiplos cálculos e ensaios por projeto/obra com estrutura hierárquica"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Integração Entre Módulos"
            description="Reutilizar dados entre diferentes ensaios (ex: usar Gs dos Índices Físicos na Compactação)"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Validação por Normas"
            description="Verificação automática de conformidade com NBR e outras normas técnicas"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Material Educacional"
            description="Seção com conteúdo teórico, vídeos explicativos, exercícios práticos e banco de questões"
            status="planejado"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Modo Ensaio Interativo"
            description="Simulação passo a passo de ensaios laboratoriais com guias educacionais em tempo real"
            status="planejado"
          />
        </div>
      </section>

      {/* Funcionalidades Futuras */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Funcionalidades Futuras (Longo Prazo)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Sistema de Autenticação"
            description="Autenticação de usuários e sincronização de cálculos na nuvem"
            status="futuro"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Colaboração em Equipe"
            description="Compartilhar cálculos, comentar e trabalhar em equipe em tempo real"
            status="futuro"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="App Mobile Nativo"
            description="Versão nativa para Android e iOS com sincronização e suporte a câmera para OCR"
            status="futuro"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Integração com CAD"
            description="Exportação e importação de dados para software CAD (AutoCAD, etc.)"
            status="futuro"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Inteligência Artificial"
            description="Machine Learning para predições, sugestões automáticas de parâmetros e validação inteligente"
            status="futuro"
          />

          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Análises Avançadas"
            description="Análise de elementos finitos (FEM), análise probabilística, análise de sensibilidade e otimização"
            status="futuro"
          />
        </div>
      </section>

      {/* Convite para Feedback */}
      <Card className="glass p-4 md:p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="space-y-2 md:space-y-3 flex-1">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Contribua com Ideias!</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Tem alguma sugestão de funcionalidade ou módulo que gostaria de ver no EduSolos?
              Entre em contato através do e-mail <a href="mailto:contactsamsantos@gmail.com" className="text-primary hover:underline font-medium">contactsamsantos@gmail.com</a>.
            </p>
          </div>
        </div>
      </Card>

      {/* Destaque Especial - Módulos Completos */}
      <Card className="glass p-4 md:p-6 border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Módulos Destaque - Totalmente Implementados!</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-2 md:mb-3">
                Alguns dos módulos mais completos e robustos do EduSolos, com funcionalidades avançadas e visualizações interativas:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            <div className="flex items-start gap-2 text-xs md:text-sm bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Acréscimo de Tensões:</strong>
                <span className="text-muted-foreground"> 4 métodos (Boussinesq, Carothers, Love, Newmark) com canvas 2D interativo</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Recalque por Adensamento:</strong>
                <span className="text-muted-foreground"> Teoria de Terzaghi completa com análise temporal e 3 períodos</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Granulometria:</strong>
                <span className="text-muted-foreground"> Classificação USCS e HRB com curvas granulométricas interativas</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs md:text-sm bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Tensões Geostáticas:</strong>
                <span className="text-muted-foreground"> Análise multicamadas com visualização do perfil e gráficos de tensões</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">✨ Diferenciais:</strong> Todos os módulos incluem exportação profissional (PDF/Excel), salvamento de cálculos, tutoriais interativos, exemplos práticos e visualizações gráficas avançadas para melhor compreensão dos resultados.
            </p>
          </div>
        </div>
      </Card>

      {/* Versão e Última Atualização */}
      <div className="text-center text-xs md:text-sm text-muted-foreground pb-4 space-y-1">
        <p>Roadmap atualizado em 2025</p>
        <p className="text-xs">As prioridades podem ser ajustadas conforme o desenvolvimento evolui e novas necessidades surgem</p>
        <p className="text-xs mt-2">
          <strong className="text-foreground">Status Atual:</strong> 7 módulos principais completos • Sistema de exportação implementado • Salvamento de cálculos funcional • Interface responsiva completa
        </p>
      </div>
    </div>
  );
}

// Componente para Card de Feature
interface FeatureCardProps {
  status: "em-desenvolvimento" | "planejado" | "concluido";
  title: string;
  description: string;
  tags: string[];
  progress?: number;
}

function FeatureCard({ status, title, description, tags, progress }: FeatureCardProps) {
  const statusConfig = {
    "em-desenvolvimento": {
      icon: <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />,
      badge: "Em Desenvolvimento",
      badgeVariant: "default" as const,
      borderColor: "border-l-amber-500",
    },
    planejado: {
      icon: <Circle className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />,
      badge: "Planejado",
      badgeVariant: "secondary" as const,
      borderColor: "border-l-blue-500",
    },
    concluido: {
      icon: <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />,
      badge: "Concluído",
      badgeVariant: "default" as const,
      borderColor: "border-l-emerald-500",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={`glass p-4 md:p-5 border-l-4 ${config.borderColor} hover:shadow-md transition-all`}>
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex items-start gap-2 md:gap-3 flex-1">
            {config.icon}
            <div className="space-y-1 flex-1">
              <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="flex-shrink-0 text-xs">
            {config.badge}
          </Badge>
        </div>

        {progress !== undefined && (
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 md:h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1 md:pt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Componente para Card de Melhoria
interface ImprovementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "planejado" | "futuro";
}

function ImprovementCard({ icon, title, description, status }: ImprovementCardProps) {
  return (
    <Card className="glass p-3 md:p-4 hover:shadow-md transition-all hover:border-primary/30">
      <div className="flex items-start gap-2 md:gap-3">
        <div className={`flex-shrink-0 ${status === "planejado" ? "text-blue-500" : "text-muted-foreground"}`}>
          {icon}
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="font-medium text-foreground text-xs md:text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <Badge variant="outline" className="text-xs mt-1 md:mt-2">
            {status === "planejado" ? "Curto Prazo" : "Longo Prazo"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

