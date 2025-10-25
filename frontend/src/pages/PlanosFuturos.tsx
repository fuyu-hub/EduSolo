import { Rocket, CheckCircle2, Circle, Clock, Sparkles, Target, Zap, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PlanosFuturos() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Planos Futuros</h1>
            <p className="text-muted-foreground">Roadmap e funcionalidades planejadas</p>
          </div>
        </div>
      </div>

      {/* Visão Geral */}
      <Card className="glass p-6 border-l-4 border-l-violet-500">
        <p className="text-sm text-foreground font-semibold leading-relaxed">
          O EduSolo está em constante evolução! Nosso objetivo é tornar a ferramenta cada vez mais completa, 
          abrangendo todos os principais tópicos da Mecânica dos Solos e oferecendo uma experiência educacional 
          excepcional para estudantes e profissionais.
        </p>
      </Card>

      {/* Destaque Especial - Funcionalidades Prioritárias */}
      <Card className="glass p-6 border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent shadow-lg">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">Foco Atual de Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Antes de adicionar novos módulos, estamos priorizando melhorar a experiência dos módulos existentes 
                e adicionar funcionalidades que tornarão o EduSolo ainda mais prático e educacional:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Melhorias Contínuas:</strong>
                <span className="text-muted-foreground"> Aprimorando UX/UI, validações e performance</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Exportações Personalizadas:</strong>
                <span className="text-muted-foreground"> Relatórios customizáveis e multi-cálculos</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Modo Ensaio:</strong>
                <span className="text-muted-foreground"> Simulação interativa de procedimentos laboratoriais</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <strong className="text-foreground">Integração Entre Módulos:</strong>
                <span className="text-muted-foreground"> Reutilizar dados entre diferentes ensaios</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progresso Geral */}
      <Card className="glass p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Progresso Geral do Projeto
            </h2>
            <Badge variant="secondary" className="text-base">
              60%
            </Badge>
          </div>
          <Progress value={60} className="h-3" />
          <p className="text-sm text-muted-foreground">
            6 de 10 módulos principais implementados
          </p>
        </div>
      </Card>

      {/* Prioridades Imediatas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <h2 className="text-2xl font-semibold text-foreground">Prioridades Imediatas</h2>
          <Badge variant="destructive" className="ml-2">Alta Prioridade</Badge>
        </div>

        <div className="space-y-3">
          <FeatureCard
            status="em-desenvolvimento"
            title="Melhorias nos Módulos Atuais"
            description="Aprimoramento contínuo dos módulos existentes: validações mais robustas, feedback visual aprimorado, otimização de performance e correção de bugs."
            tags={["UX/UI", "Performance", "Validações", "Feedback"]}
            progress={70}
          />
          
          <FeatureCard
            status="em-desenvolvimento"
            title="Exportações Personalizadas"
            description="Sistema avançado de exportação permitindo escolher quais dados incluir, personalizar layout, adicionar logos e notas, e selecionar múltiplos cálculos para exportar em um único documento."
            tags={["PDF Customizado", "Excel Avançado", "Templates", "Multi-cálculos"]}
            progress={25}
          />
          
          <FeatureCard
            status="em-desenvolvimento"
            title="Modo Ensaio"
            description="Modo especial que simula ensaios laboratoriais passo a passo, com guias interativos, dicas educacionais em tempo real e validação pedagógica dos procedimentos."
            tags={["Educacional", "Passo-a-passo", "Simulação", "Guias"]}
            progress={15}
          />
          
          <FeatureCard
            status="em-desenvolvimento"
            title="Integração Entre Módulos"
            description="Possibilidade de aproveitar dados de um ensaio/módulo em outro. Por exemplo: usar Gs e umidade dos Índices Físicos direto na Compactação, ou granulometria no cálculo de permeabilidade."
            tags={["Workflow", "Dados Compartilhados", "Produtividade", "Integração"]}
            progress={10}
          />
        </div>
      </section>

      {/* Módulos em Desenvolvimento */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-semibold text-foreground">Novos Módulos em Desenvolvimento</h2>
        </div>

        <div className="space-y-3">
          <FeatureCard
            status="em-desenvolvimento"
            title="Análise de Fluxo Hidráulico"
            description="Cálculo de permeabilidade, redes de fluxo e análise de percolação em solos."
            tags={["Permeabilidade", "Redes de Fluxo", "Lei de Darcy"]}
            progress={45}
          />
          
          <FeatureCard
            status="em-desenvolvimento"
            title="Teoria do Adensamento"
            description="Cálculo de recalques, tempo de adensamento e análise de consolidação."
            tags={["Recalques", "Cv", "Terzaghi"]}
            progress={30}
          />
        </div>
      </section>

      {/* Módulos Planejados */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-semibold text-foreground">Planejados</h2>
        </div>

        <div className="space-y-3">
          <FeatureCard
            status="planejado"
            title="Estabilidade de Taludes"
            description="Análise de estabilidade usando métodos de Bishop, Fellenius e outros."
            tags={["Bishop", "Fellenius", "Fator de Segurança"]}
          />
          
          <FeatureCard
            status="planejado"
            title="Capacidade de Carga"
            description="Cálculo de capacidade de carga de fundações rasas e profundas."
            tags={["Terzaghi", "Meyerhof", "Fundações"]}
          />
          
          <FeatureCard
            status="planejado"
            title="Empuxos de Terra"
            description="Cálculo de empuxos ativos, passivos e em repouso para estruturas de contenção."
            tags={["Rankine", "Coulomb", "Muros de Arrimo"]}
          />
          
          <FeatureCard
            status="planejado"
            title="Ensaios de Cisalhamento"
            description="Análise de ensaios triaxiais, cisalhamento direto e envoltória de ruptura."
            tags={["Triaxial", "Mohr-Coulomb", "Resistência"]}
          />
        </div>
      </section>

      {/* Melhorias Futuras */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-semibold text-foreground">Funcionalidades Complementares</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            title="Modo Offline Completo"
            description="Uso total da aplicação sem conexão, com sincronização automática"
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
            title="Colaboração em Equipe"
            description="Compartilhar cálculos, comentar e trabalhar em equipe em tempo real"
            status="futuro"
          />
          
          <ImprovementCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="App Mobile Nativo"
            description="Versão nativa para Android e iOS com suporte a câmera para OCR"
            status="futuro"
          />
        </div>
      </section>

      {/* Convite para Feedback */}
      <Card className="glass p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-semibold text-foreground">Contribua com Ideias!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tem alguma sugestão de funcionalidade ou módulo que gostaria de ver no EduSolo? 
              Entre em contato através do e-mail <a href="mailto:contactsamsantos@gmail.com" className="text-primary hover:underline font-medium">contactsamsantos@gmail.com</a> ou 
              abra uma issue no <a href="https://github.com/fuyu-hub" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">GitHub</a>.
            </p>
          </div>
        </div>
      </Card>

      {/* Versão e Última Atualização */}
      <div className="text-center text-sm text-muted-foreground pb-4 space-y-1">
        <p>Roadmap atualizado em Outubro/2025</p>
        <p className="text-xs">As datas e prioridades podem ser ajustadas conforme o desenvolvimento evolui</p>
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
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      badge: "Em Desenvolvimento",
      badgeVariant: "default" as const,
      borderColor: "border-l-amber-500",
    },
    planejado: {
      icon: <Circle className="w-5 h-5 text-blue-500" />,
      badge: "Planejado",
      badgeVariant: "secondary" as const,
      borderColor: "border-l-blue-500",
    },
    concluido: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      badge: "Concluído",
      badgeVariant: "default" as const,
      borderColor: "border-l-emerald-500",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={`glass p-5 border-l-4 ${config.borderColor} hover:shadow-md transition-all`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {config.icon}
            <div className="space-y-1 flex-1">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="flex-shrink-0">
            {config.badge}
          </Badge>
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
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
    <Card className="glass p-4 hover:shadow-md transition-all hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${status === "planejado" ? "text-blue-500" : "text-muted-foreground"}`}>
          {icon}
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="font-medium text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <Badge variant="outline" className="text-xs mt-2">
            {status === "planejado" ? "Curto Prazo" : "Longo Prazo"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

