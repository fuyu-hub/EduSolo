import { useEffect, useRef } from "react";
import CarothersAnalise from "@/components/acrescimo-tensoes/CarothersAnalise";
import { useNavigate } from "react-router-dom";
import { useTour, TourStep } from "@/contexts/TourContext";

export default function CarothersPage() {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const loadExampleRef = useRef<(() => void) | null>(null);
  
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='header']",
      title: "📏 Método de Carothers - Carga em Faixa",
      content: "Este método calcula tensões induzidas por cargas distribuídas em faixa de largura finita. Perfeito para fundações corridas, muros de arrimo e aterros lineares! Vamos explorar com um exemplo!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "🎯 Visualização 2D da Sapata",
      content: "A sapata corrida aparece como um retângulo verde na superfície. O eixo X é horizontal e Z é a profundidade. Você já pode ver 3 pontos de análise no exemplo.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='carga-config']",
      title: "📐 Configurar a Sapata",
      content: "Clique UMA VEZ na sapata verde para configurar: carga distribuída q (kPa) e largura B (m). O exemplo já tem q=50 kPa e B=3m.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "➕ Adicionar Pontos de Análise",
      content: "Clique duas vezes no canvas para adicionar mais pontos em diferentes posições (dentro, fora ou nas bordas da sapata) e ver como a tensão varia!",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "🧮 Calcular Tensões",
      content: "Clique aqui para calcular as tensões usando o método de Carothers para cargas em faixa.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📊 Resultados da Análise",
      content: "Veja as tensões calculadas! Note como pontos sob o centro da sapata tendem a ter tensões maiores. Os pontos no canvas mudam de cor após serem calculados.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve suas análises ou exporte os resultados. Perfeito para documentar projetos de fundações corridas e muros!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tour-seen-carothers');
    if (hasSeenTour !== 'true') {
      setTimeout(() => {
        if (loadExampleRef.current) {
          loadExampleRef.current();
        }
        setTimeout(() => startTour(tourSteps, "carothers"), 300);
      }, 800);
    }
  }, []);
  
  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };
  
  const handleStartTour = () => {
    if (loadExampleRef.current) {
      loadExampleRef.current();
    }
    setTimeout(() => startTour(tourSteps, "carothers", true), 300);
  };
  
  return <CarothersAnalise onVoltar={handleVoltar} onStartTour={handleStartTour} onLoadExampleRef={loadExampleRef} />;
}
