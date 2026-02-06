import * as React from "react";
import { cn } from "@/lib/utils";

interface ModuleIconProps {
    icon: React.ComponentType<{ className?: string }>;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Ícone linear no estilo Pro Industrial - sem fundos coloridos com gradientes,
 * apenas stroke em cor de acento com borda sutil.
 */
export function ModuleIcon({ icon: Icon, size = "md", className }: ModuleIconProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };

    const iconSizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    return (
        <div
            className={cn(
                "rounded-xl flex items-center justify-center",
                "border border-primary/30 bg-primary/5",
                "transition-colors duration-200",
                sizeClasses[size],
                className
            )}
        >
            <Icon className={cn("text-primary", iconSizeClasses[size])} />
        </div>
    );
}

export default ModuleIcon;
