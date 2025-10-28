/**
 * Card otimizado com React.memo
 * Evita re-renders desnecessários quando props não mudam
 */

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OptimizedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const OptimizedCard = memo<OptimizedCardProps>(
  ({ title, description, children, className, loading = false }) => {
    return (
      <Card className={cn("transition-all duration-200", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            )}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.className === nextProps.className &&
      prevProps.loading === nextProps.loading &&
      prevProps.children === nextProps.children
    );
  }
);

OptimizedCard.displayName = "OptimizedCard";

