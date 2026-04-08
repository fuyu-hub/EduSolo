import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que força o scroll para o topo em cada mudança de rota.
 * Isso resolve o problema de navegar para uma nova página e ela iniciar
 * com o scroll da página anterior, ou problemas de "pulo" no carregamento.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Força o scroll para o topo imediatamente
    window.scrollTo(0, 0);
    
    // Pequeno delay para garantir que o scroll ocorra após a renderização do conteúdo
    // especialmente útil quando há Suspense ou carregamento de dados
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
