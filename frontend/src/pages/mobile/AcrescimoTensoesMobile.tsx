import { Target, MapPin, Layers, Circle, Square, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    disponivel: false,
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
    disponivel: false,
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
    disponivel: false,
  },
];

export default function AcrescimoTensoesMobile() {
  const navigate = useNavigate();

  const handleMetodoClick = (metodo: typeof metodos[0]) => {
    if (metodo.disponivel) {
      navigate(metodo.path);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Acréscimo de Tensões</h1>
            <p className="text-xs text-muted-foreground">
              Análise 2D de tensões no solo
            </p>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este módulo permite analisar a distribuição de tensões no solo em um plano 2D (eixos X e Z) 
            devido a diferentes tipos de carregamentos superficiais.
          </p>
        </CardContent>
      </Card>

      {/* Métodos de Análise */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Selecione o Método
          </h2>
          <Badge variant="secondary" className="text-xs">
            {metodos.filter(m => m.disponivel).length} disponíveis
          </Badge>
        </div>

        <div className="space-y-3">
          {metodos.map((metodo) => {
            const Icon = metodo.icon;
            const isDisponivel = metodo.disponivel;
            
            return (
              <Card
                key={metodo.id}
                className={`transition-all ${
                  isDisponivel 
                    ? "cursor-pointer active:scale-[0.98] hover:shadow-md hover:border-primary/30" 
                    : "opacity-60"
                }`}
                onClick={() => handleMetodoClick(metodo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metodo.color} flex items-center justify-center shadow-lg flex-shrink-0 relative ${isDisponivel ? 'active:scale-95' : ''} transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                      {!isDisponivel && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xs font-bold">🔒</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base">
                          {metodo.name}
                        </h3>
                        {!isDisponivel && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Em breve
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {metodo.description}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                        {metodo.detalhes}
                      </p>
                      
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Aplicações: </span>
                        <span className="text-muted-foreground">{metodo.aplicacoes}</span>
                      </div>
                    </div>

                    {isDisponivel && (
                      <div className="flex-shrink-0 self-center">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Card Informativo */}
      <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <h3 className="font-semibold text-foreground text-sm">Sobre a Análise 2D</h3>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>Adicione múltiplos pontos de análise</li>
                <li>Visualize a distribuição das tensões</li>
                <li>Compare resultados em diferentes posições</li>
                <li>Analise distribuição horizontal e em profundidade</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

