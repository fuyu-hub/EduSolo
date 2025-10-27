import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que força o scroll para o topo sempre que a rota mudar
 * Útil para garantir que páginas mobile sempre iniciem do topo
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

