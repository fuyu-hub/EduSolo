import { ReactNode, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

interface MobileModuleWrapperProps {
  children: ReactNode;
  mobileVersion: ReactNode;
}

/**
 * Wrapper que renderiza versão mobile ou desktop do módulo
 * Use este componente para facilitar a transição entre layouts
 * Otimizado para evitar flash de conteúdo durante detecção de dispositivo
 * 
 * @example
 * ```tsx
 * <MobileModuleWrapper
 *   mobileVersion={<IndicesFisicosMobile />}
 * >
 *   <IndicesFisicosDesktop />
 * </MobileModuleWrapper>
 * ```
 */
export function MobileModuleWrapper({
  children,
  mobileVersion,
}: MobileModuleWrapperProps) {
  const isMobile = useIsMobile();
  
  // Força scroll para o topo ao mudar de página
  useScrollToTop();

  // Usa useMemo para evitar renderizações desnecessárias durante a troca
  // A detecção inicial no hook garante que isMobile já tenha o valor correto
  const content = useMemo(() => {
    return isMobile ? mobileVersion : children;
  }, [isMobile, mobileVersion, children]);

  return <>{content}</>;
}

