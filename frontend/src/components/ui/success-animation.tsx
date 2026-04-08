import * as React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  title?: string;
  message?: string;
  className?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ 
  title = "Sucesso!", 
  message = "Operação concluída com sucesso",
  className,
  onComplete 
}: SuccessAnimationProps) {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 pointer-events-none",
        className
      )}
    >
      {/* Confetti Effect */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${50 + (Math.random() - 0.5) * 20}%`,
              top: `${50 + (Math.random() - 0.5) * 20}%`,
              backgroundColor: ['#00D07A', '#FFD400', '#FF6B9D', '#00B4FF', '#9D4EDD'][i % 5],
              animationDelay: `${i * 30}ms`,
              animationDuration: `${800 + Math.random() * 400}ms`,
            }}
          />
        ))}
      </div>

      {/* Success Card */}
      <div className="relative pointer-events-auto animate-in zoom-in-50 fade-in duration-300">
        <div className="bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-2xl p-8 max-w-sm">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>

          {/* Sparkles */}
          <div className="absolute top-4 right-4">
            <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Sparkles className="w-4 h-4 text-blue-500 animate-bounce" style={{ animationDelay: '100ms' }} />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
              {title}
            </h3>
            <p className="text-muted-foreground text-sm animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS para confetti (adicionar ao index.css)
// @keyframes confetti {
//   0% {
//     transform: translateY(0) rotate(0deg);
//     opacity: 1;
//   }
//   100% {
//     transform: translateY(100vh) rotate(720deg);
//     opacity: 0;
//   }
// }

