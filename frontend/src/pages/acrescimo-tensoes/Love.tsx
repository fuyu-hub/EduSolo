import { useEffect, useRef } from "react";
import LoveAnalise from "@/components/acrescimo-tensoes/LoveAnalise";
import { useNavigate } from "react-router-dom";
import { useTour, TourStep } from "@/contexts/TourContext";
import { useToursEnabled } from "@/components/WelcomeDialog";

export default function LovePage() {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const toursEnabled = useToursEnabled();
  const loadExampleRef = useRef<(() => void) | null>(null);
  
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='header']",
      title: "⭕ Método de Love - Carga Circular",
      content: "Este método calcula tensões sob cargas uniformemente distribuídas em áreas circulares. Ideal para tanques, silos e fundações circulares com simetria axial! Vamos explorar com um exemplo!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "🎯 Visualização 2D (Corte Transversal)",
      content: "Visualize a sapata circular em corte transversal (aparece como uma área rosa). A simetria axial permite análise 2D. Você já pode ver 3 pontos de análise no exemplo.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='carga-config']",
      title: "⚙️ Configurar a Sapata",
      content: "Clique UMA VEZ na sapata rosa para configurar: carga distribuída q (kPa) e raio R (m). O exemplo já tem q=100 kPa e R=2.5m.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "➕ Adicionar Pontos de Análise",
      content: "Clique duas vezes no canvas para adicionar mais pontos no eixo central (X=0), dentro ou fora da sapata. A simetria axial significa que X representa a distância radial!",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "🧮 Calcular Tensões",
      content: "Clique aqui para calcular as tensões usando a solução de Love para cargas circulares.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📊 Resultados da Análise",
      content: "Veja as tensões! Pontos no eixo central (X=0) sob o centro da sapata geralmente apresentam as maiores tensões. Os pontos no canvas mudam de cor após serem calculados.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve suas análises ou exporte. Útil para documentação de projetos de tanques, silos e fundações circulares!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  useEffect(() => {
    // Verificar se tours estão globalmente desabilitados
    if (!toursEnabled) return;
    
    const hasSeenTour = localStorage.getItem('tour-seen-love');
    if (hasSeenTour !== 'true') {
      setTimeout(() => {
        if (loadExampleRef.current) {
          loadExampleRef.current();
        }
        setTimeout(() => startTour(tourSteps, "love"), 300);
      }, 800);
    }
  }, [toursEnabled]);
  
  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };
  
  const handleStartTour = () => {
    if (loadExampleRef.current) {
      loadExampleRef.current();
    }
    setTimeout(() => startTour(tourSteps, "love", true), 300);
  };
  
  return <LoveAnalise onVoltar={handleVoltar} onStartTour={handleStartTour} onLoadExampleRef={loadExampleRef} />;
}

