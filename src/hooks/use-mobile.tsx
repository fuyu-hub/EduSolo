import * as React from "react";

/**
 * Detecta se o dispositivo é mobile usando uma abordagem Client-Side real,
 * baseada em User-Agent e capacidades do dispositivo, ao invés de largura da tela.
 *
 * Estratégia em camadas:
 * 1. navigator.userAgentData.mobile (API moderna, Chrome 90+)
 * 2. Regex no User-Agent string (fallback amplo)
 * 3. navigator.maxTouchPoints > 0 com tela pequena (último recurso)
 */
function detectMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & {
    userAgentData?: { mobile: boolean };
  };

  // 1. API moderna — mais confiável quando disponível
  if (nav.userAgentData?.mobile !== undefined) {
    return nav.userAgentData.mobile;
  }

  // 2. User-Agent string — cobre a maioria dos navegadores
  const ua = navigator.userAgent || "";
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      ua
    )
  ) {
    return true;
  }

  // 3. Fallback: touchscreen + tela estreita (ex: iPadOS mascarado como macOS)
  if (navigator.maxTouchPoints > 0 && window.innerWidth < 1024) {
    return true;
  }

  return false;
}

export function useIsMobile() {
  // Detecta imediatamente no primeiro render para evitar flash
  const [isMobile] = React.useState<boolean>(() => detectMobileDevice());

  return isMobile;
}

