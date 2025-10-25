import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NewmarkAnalise from "@/components/acrescimo-tensoes/NewmarkAnalise";
import { useTour, TourStep } from "@/contexts/TourContext";

export default function NewmarkPage() {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const loadExampleRef = useRef<(() => void) | null>(null);
  
  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='header']",
      title: "⬛ Método de Newmark - Carga Retangular",
      content: "Este método calcula tensões sob cargas uniformemente distribuídas em áreas retangulares. Perfeito para sapatas, fundações rasas e edifícios! Possui visualização dupla: lateral e superior. Vamos explorar com um exemplo!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      target: "[data-tour='canvas-lateral']",
      title: "🎯 Vista Lateral (Corte X-Z)",
      content: "A vista lateral mostra a sapata laranja em corte transversal. O eixo X é horizontal e Z é a profundidade. Você já pode ver 3 pontos de análise no exemplo.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='carga-config']",
      title: "📐 Configurar a Sapata",
      content: "Clique UMA VEZ na sapata laranja para configurar: carga distribuída q (kPa), comprimento L e largura B (m). O exemplo já tem q=200 kPa, L=4m, B=3m.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='vista-superior-btn']",
      title: "🔄 Mudar para Vista Superior",
      content: "Agora vamos mudar para a vista superior! Clique no botão 'Superior' destacado para ver a sapata de cima (planta X-Y).",
      placement: "bottom",
      spotlightPadding: 12,
      disableBeacon: true,
    },
    {
      target: "[data-tour='canvas-superior']",
      title: "🗺️ Vista Superior (Planta X-Y)",
      content: "Esta vista mostra a sapata retangular laranja de cima! Você pode ver a área carregada completa (L × B) e a posição dos 3 pontos de análise em planta.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='canvas-superior']",
      title: "🖱️ Movendo o Plano de Coordenadas",
      content: "INTERATIVIDADE ESPECIAL: Na vista superior, clique e arraste o PLANO (o grid) para reposicionar! Isso permite analisar pontos mais afastados da sapata sem precisar reconfigurá-la.",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='canvas-lateral']",
      title: "➕ Adicionar Pontos de Análise",
      content: "Clique duas vezes em qualquer canvas (lateral ou superior) para adicionar pontos com coordenadas (X, Y, Z). A coordenada Y permite análise 3D completa!",
      placement: "right",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='btn-calcular']",
      title: "🧮 Calcular Tensões",
      content: "Clique aqui para calcular usando o método de Newmark com fator de influência. O método subdivide a sapata e integra numericamente para precisão.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "📊 Resultados da Análise",
      content: "Veja as tensões calculadas! A tabela mostra X, Y e Z de cada ponto. Note que pontos sob o centro da sapata têm tensões maiores. Os pontos mudam de cor após serem calculados.",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='resultados']",
      title: "ℹ️ Detalhes do Cálculo",
      content: "Passe o mouse sobre os cards dos pontos e clique no ícone 'ℹ️' para ver detalhes técnicos: fator de influência, subdivisões e a fórmula Δσz = q·I utilizada!",
      placement: "left",
      spotlightPadding: 12,
    },
    {
      target: "[data-tour='actions']",
      title: "💾 Salvar e Exportar",
      content: "Salve suas análises completas ou exporte. As vistas lateral e superior são incluídas nos relatórios PDF!",
      placement: "bottom",
      spotlightPadding: 12,
    },
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tour-seen-newmark');
    if (hasSeenTour !== 'true') {
      setTimeout(() => {
        if (loadExampleRef.current) {
          loadExampleRef.current();
        }
        setTimeout(() => {
          startTour(tourSteps, "newmark");
          setupTourAutoActions();
        }, 300);
      }, 800);
    }
  }, []);

  // Função para configurar ações automáticas durante o tour
  const setupTourAutoActions = () => {
    let vistaAlreadyChanged = false;
    
    // Observer para detectar quando o tooltip do tour muda
    const observer = new MutationObserver(() => {
      const tourTooltip = document.querySelector('[class*="react-joyride__tooltip"]');
      if (tourTooltip && !vistaAlreadyChanged) {
        const content = tourTooltip.textContent || '';
        
        // Se o step é sobre mudar para vista superior, clica no botão
        if (content.includes('Agora vamos mudar para a vista superior') || content.includes('Clique no botão')) {
          vistaAlreadyChanged = true;
          setTimeout(() => {
            const btnVistaSuperior = document.querySelector('[data-tour="vista-superior-btn"]') as HTMLButtonElement;
            if (btnVistaSuperior) {
              btnVistaSuperior.click();
            }
          }, 800);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Limpar observer após 60 segundos (tempo máximo do tour)
    setTimeout(() => observer.disconnect(), 60000);
  };
  
  const handleVoltar = () => {
    navigate('/acrescimo-tensoes');
  };
  
  const handleStartTour = () => {
    if (loadExampleRef.current) {
      loadExampleRef.current();
    }
    setTimeout(() => {
      startTour(tourSteps, "newmark", true);
      setupTourAutoActions();
    }, 300);
  };
  
  return <NewmarkAnalise onVoltar={handleVoltar} onStartTour={handleStartTour} onLoadExampleRef={loadExampleRef} />;
}

