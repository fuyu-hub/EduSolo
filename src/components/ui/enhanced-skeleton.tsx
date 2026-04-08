import * as React from "react";
import { cn } from "@/lib/utils";

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "circle" | "button";
  count?: number;
  spacing?: "sm" | "md" | "lg";
  shimmer?: boolean;
}

export function EnhancedSkeleton({
  className,
  variant = "default",
  count = 1,
  spacing = "md",
  shimmer = true,
  ...props
}: EnhancedSkeletonProps) {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  };

  const variantClasses = {
    default: "h-4 w-full rounded",
    card: "h-32 w-full rounded-lg",
    text: "h-3 w-full rounded",
    circle: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-md",
  };

  const baseClasses = cn(
    "bg-muted/50 relative overflow-hidden",
    shimmer && "animate-pulse",
    variantClasses[variant]
  );

  if (count === 1) {
    return (
      <div className={cn(baseClasses, className)} {...props}>
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}
      </div>
    );
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={baseClasses} {...props}>
          {shimmer && (
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
        </div>
      ))}
    </div>
  );
}

// Skeleton compositions for common patterns
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border p-6 space-y-4">
      <EnhancedSkeleton variant="circle" className="mx-auto" />
      <EnhancedSkeleton count={2} variant="text" />
      <EnhancedSkeleton variant="button" className="mx-auto" />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton variant="text" className="w-24 h-3" />
          <EnhancedSkeleton variant="default" className="h-10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      <EnhancedSkeleton variant="default" className="h-12" />
      <EnhancedSkeleton count={5} variant="default" className="h-16" />
    </div>
  );
}

