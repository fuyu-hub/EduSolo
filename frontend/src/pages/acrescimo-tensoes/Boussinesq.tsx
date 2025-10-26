import { useEffect, useRef } from "react";
import BoussinesqAnalise from "@/components/acrescimo-tensoes/BoussinesqAnalise";
import { useNavigate } from "react-router-dom";
import { useTour, TourStep } from "@/contexts/TourContext";
import { MobileModuleWrapper } from "@/components/mobile";
import BoussinesqMobile from "../mobile/BoussinesqMobile";

function BoussinesqPageDesktop() {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const loadExampleRef = useRef<(() => void) | null>(null);
  
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='header']",
      title: "📍 Método de Boussinesq - Carga Pontual",
      content: "Este método calcula tensões induzidas por uma carga pontual vertical. Ideal para estacas, torres e cargas concentradas. Vamos explorar com um exemplo!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "🎯 Canvas 2D Interativo",
      content: "Visualize a distribuição de tensões em 2D! O eixo X é horizontal e Z é a profundidade. A seta azul representa a carga pontual aplicada na superfície.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='carga-config']",
      title: "⚡ Configurar a Carga",
      content: "Clique UMA VEZ na seta azul para editar o valor da carga pontual P (kN). O exemplo já tem uma carga de 1500 kN configurada.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='canvas-2d']",
      title: "➕ Adicionar Pontos de Análise",
      content: "Clique duas vezes em qualquer local do canvas para adicionar pontos de análise! No exemplo, já existem 3 pontos em diferentes posições.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "🧮 Calcular Tensões",
      content: "Clique aqui para calcular as tensões induzidas pela carga em cada ponto usando o método de Boussinesq.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📊 Resultados da Análise",
      content: "Veja os resultados calculados! A tabela mostra as coordenadas X e Z de cada ponto e a tensão vertical Δσz. Os pontos no canvas mudam de cor após serem calculados.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve suas análises completas (carga + pontos + resultados) ou exporte em PDF/Excel. Útil para documentação de projetos!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tour-seen-boussinesq');
    if (hasSeenTour !== 'true') {
      setTimeout(() => {
        if (loadExampleRef.current) {
          loadExampleRef.current();
        }
        setTimeout(() => startTour(tourSteps, "boussinesq"), 300);
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
    setTimeout(() => startTour(tourSteps, "boussinesq", true), 300);
  };
  
  return <BoussinesqAnalise onVoltar={handleVoltar} onStartTour={handleStartTour} onLoadExampleRef={loadExampleRef} />;
}

// Wrapper principal que escolhe versão mobile ou desktop
export default function BoussinesqPage() {
  return (
    <MobileModuleWrapper mobileVersion={<BoussinesqMobile />}>
      <BoussinesqPageDesktop />
    </MobileModuleWrapper>
  );
}

