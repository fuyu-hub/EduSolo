/**
 * Componente para preload de rotas ao fazer hover em links
 * Melhora a experiência do usuário com navegação mais rápida
 */

import { memo, ReactNode } from "react";
import { Link, LinkProps } from "react-router-dom";
import { usePreloadOnHover } from "@/hooks/use-route-preload";

interface PreloaderLinkProps extends LinkProps {
  preload?: () => Promise<{ default: React.ComponentType<any> }>;
  children: ReactNode;
}

export const PreloaderLink = memo<PreloaderLinkProps>(
  ({ preload, children, ...linkProps }) => {
    const preloadHandlers = usePreloadOnHover(
      preload || (() => Promise.resolve({ default: () => null })),
      !!preload
    );

    return (
      <Link {...linkProps} {...preloadHandlers}>
        {children}
      </Link>
    );
  }
);

PreloaderLink.displayName = "PreloaderLink";

