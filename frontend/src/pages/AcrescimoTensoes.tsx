import { useEffect } from "react";
import { TrendingDown, Layers, Circle, Square, MapPin, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PrintHeader from "@/components/PrintHeader";
import { useNavigate } from "react-router-dom";
import { useTour, TourStep } from "@/contexts/TourContext";

const metodos = [
  {
    id: "boussinesq",
    name: "Boussinesq",
    description: "Carga Pontual",
    detalhes: "Solução clássica para carga pontual vertical aplicada na superfície de um meio semi-infinito elástico.",
    aplicacoes: "Fundações por estacas, cargas concentradas, torres, postes",
    icon: MapPin,
    color: "from-blue-500 to-cyan-600",
    path: "/acrescimo-tensoes/boussinesq",
    disponivel: true,
  },
  {
    id: "carothers",
    name: "Carothers",
    description: "Carga em Faixa",
    detalhes: "Distribuição de tensões para carregamento uniformemente distribuído em faixa de largura finita.",
    aplicacoes: "Fundações corridas, muros de arrimo, aterros lineares",
    icon: Layers,
    color: "from-green-500 to-emerald-600",
    path: "/acrescimo-tensoes/carothers",
    disponivel: true,
  },
  {
    id: "love",
    name: "Love",
    description: "Carga Circular",
    detalhes: "Solução para carregamento uniformemente distribuído sobre área circular com simetria axial.",
    aplicacoes: "Tanques circulares, silos, fundações circulares",
    icon: Circle,
    color: "from-purple-500 to-pink-600",
    path: "/acrescimo-tensoes/love",
    disponivel: true,
  },
  {
    id: "newmark",
    name: "Newmark",
    description: "Carga Retangular",
    detalhes: "Método para carregamento uniformemente distribuído em área retangular utilizando fator de influência.",
    aplicacoes: "Fundações rasas, sapatas, edifícios, galpões",
    icon: Square,
    color: "from-orange-500 to-red-600",
    path: "/acrescimo-tensoes/newmark",
    disponivel: true,
  },
];

export default function AcrescimoTensoes() {
  const navigate = useNavigate();
  const { startTour } = useTour();

  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='header']",
      title: "🎯 Bem-vindo ao Acréscimo de Tensões!",
      content: "Este módulo permite analisar a distribuição de tensões no solo devido a diferentes tipos de carregamentos superficiais. Escolha o método adequado ao seu caso!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='metodos-grid']",
      title: "📐 Métodos Disponíveis",
      content: "Cada método é adequado para um tipo específico de carregamento. Clique em qualquer card para acessar o módulo correspondente.",
      placement: "bottom",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='metodo-boussinesq']",
      title: "📍 Boussinesq - Carga Pontual",
      content: "Para cargas concentradas como estacas, postes e torres. Solução clássica para carga pontual vertical.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='metodo-carothers']",
      title: "📏 Carothers - Carga em Faixa",
      content: "Para cargas distribuídas em faixas como fundações corridas, muros de arrimo e aterros lineares.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='metodo-love']",
      title: "⭕ Love - Carga Circular",
      content: "Para cargas circulares como tanques, silos e fundações circulares. Utiliza simetria axial.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='metodo-newmark']",
      title: "⬛ Newmark - Carga Retangular",
      content: "Para sapatas e fundações rasas retangulares. Método do fator de influência para áreas retangulares.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='info-card']",
      title: "ℹ️ Análise 2D Interativa",
      content: "Todos os métodos incluem visualização 2D interativa, permitindo adicionar múltiplos pontos de análise e comparar resultados!",
      placement: "top",
      spotlightPadding: 12,
    },
  ];

  useEffect(() => {
    const initTour = () => {
      const hasSeenTour = localStorage.getItem('tour-seen-acrescimo-tensoes');
      if (hasSeenTour !== 'true') {
        setTimeout(() => startTour(tourSteps, "acrescimo-tensoes"), 800);
      }
    };
    initTour();
  }, []);

  const handleStartTour = () => {
    startTour(tourSteps, "acrescimo-tensoes", true);
  };

  const handleMetodoClick = (metodo: typeof metodos[0]) => {
    if (metodo.disponivel) {
      navigate(metodo.path);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PrintHeader moduleTitle="Acréscimo de Tensões" moduleName="acrescimo-tensoes" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500" data-tour="header">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Acréscimo de Tensões</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Distribuição de tensões no solo devido a carregamentos superficiais - Análise 2D
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleStartTour}
                className="h-10 w-10"
              >
                <GraduationCap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Iniciar tour guiado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Seleção de Método */}
      <Card className="p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <CardHeader className="px-0">
          <CardTitle className="text-lg sm:text-xl">Selecione o Método de Análise</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Escolha o método mais adequado para o tipo de carregamento que deseja analisar
          </p>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" data-tour="metodos-grid">
            {metodos.map((metodo) => {
              const Icon = metodo.icon;
              const isDisponivel = metodo.disponivel;
              const tourId = `metodo-${metodo.id}`;
              return (
                <Card
                  key={metodo.id}
                  data-tour={tourId}
                  className={`transition-all ${
                    isDisponivel 
                      ? "cursor-pointer hover:shadow-lg hover:border-primary group" 
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => handleMetodoClick(metodo)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metodo.color} flex items-center justify-center shadow-lg ${isDisponivel ? 'group-hover:scale-110' : ''} transition-transform flex-shrink-0 relative`}>
                        <Icon className="w-6 h-6 text-white" />
                        {!isDisponivel && (
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xs font-bold">🔒</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-base ${isDisponivel ? 'group-hover:text-primary' : ''} transition-colors`}>
                            {metodo.name}
                          </h3>
                          {!isDisponivel && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                              Em breve
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {metodo.description}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {metodo.detalhes}
                        </p>
                        
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">Aplicações: </span>
                          <span className="text-muted-foreground">{metodo.aplicacoes}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card Informativo */}
      <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }} data-tour="info-card">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Sobre a Análise 2D Interativa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Este módulo permite analisar a distribuição de tensões no solo em um plano 2D (eixos X e Z). 
                Você pode adicionar múltiplos pontos de análise e visualizar graficamente como as tensões se distribuem 
                no subsolo devido ao carregamento aplicado na superfície.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Adicione quantos pontos de análise desejar</li>
                <li>Visualize a carga e os pontos no diagrama 2D</li>
                <li>Compare resultados em diferentes posições</li>
                <li>Analise a distribuição horizontal e em profundidade</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
