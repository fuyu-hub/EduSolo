import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileModuleWrapperProps {
  children: ReactNode;
  mobileVersion: ReactNode;
}

/**
 * Wrapper que renderiza versão mobile ou desktop do módulo
 * Use este componente para facilitar a transição entre layouts
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

  return <>{isMobile ? mobileVersion : children}</>;
}

