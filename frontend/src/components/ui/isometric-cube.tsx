import { cn } from "@/lib/utils";

interface IsometricCubeProps {
  className?: string;
  size?: number;
}

export function IsometricCube({ className, size = 24 }: IsometricCubeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
    >
      {/* Face superior (top) - mais clara */}
      <path
        d="M12 2L22 8L12 14L2 8L12 2Z"
        fill="currentColor"
        opacity="1"
      />
      
      {/* Face esquerda (left) - escura */}
      <path
        d="M2 8L2 18L12 24L12 14L2 8Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Face direita (right) - média */}
      <path
        d="M12 14L12 24L22 18L22 8L12 14Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

