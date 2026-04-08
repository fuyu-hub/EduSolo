/**
 * Hook para preload de rotas
 * Carrega componentes de forma antecipada para melhorar a performance
 */

import { useEffect, useCallback } from 'react';

type PreloadableComponent = () => Promise<{ default: React.ComponentType<any> }>;

interface PreloadConfig {
  routes: Record<string, PreloadableComponent>;
  delay?: number;
  onIdle?: boolean;
}

/**
 * Hook para preload de rotas específicas
 */
export const useRoutePreload = (config: PreloadConfig) => {
  const { routes, delay = 2000, onIdle = true } = config;

  const preloadRoutes = useCallback(() => {
    Object.values(routes).forEach((loadComponent) => {
      loadComponent().catch((err) => {
        console.warn('Failed to preload route:', err);
      });
    });
  }, [routes]);

  useEffect(() => {
    if (onIdle && 'requestIdleCallback' in window) {
      // Usar requestIdleCallback se disponível
      const handle = window.requestIdleCallback(
        () => {
          setTimeout(preloadRoutes, delay);
        },
        { timeout: delay + 1000 }
      );

      return () => window.cancelIdleCallback(handle);
    } else {
      // Fallback para setTimeout
      const timer = setTimeout(preloadRoutes, delay);
      return () => clearTimeout(timer);
    }
  }, [preloadRoutes, delay, onIdle]);

  return { preloadRoutes };
};

/**
 * Hook para preload sob demanda (hover, etc.)
 */
export const usePreloadOnHover = (
  loadComponent: PreloadableComponent,
  enabled: boolean = true
) => {
  const preload = useCallback(() => {
    if (enabled) {
      loadComponent().catch((err) => {
        console.warn('Failed to preload component:', err);
      });
    }
  }, [loadComponent, enabled]);

  return {
    onMouseEnter: preload,
    onTouchStart: preload,
  };
};

/**
 * Utilitário para preload manual
 */
export const preloadComponent = (
  loadComponent: PreloadableComponent
): Promise<void> => {
  return loadComponent()
    .then(() => {
      console.log('Component preloaded successfully');
    })
    .catch((err) => {
      console.warn('Failed to preload component:', err);
    });
};

