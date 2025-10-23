import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackMessageProps {
  type: FeedbackType;
  title?: string;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    title: "Sucesso",
    className: "border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100",
    iconClassName: "text-green-500",
  },
  error: {
    icon: XCircle,
    title: "Erro",
    className: "border-red-500/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100",
    iconClassName: "text-red-500",
  },
  warning: {
    icon: AlertCircle,
    title: "Atenção",
    className: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-100",
    iconClassName: "text-yellow-500",
  },
  info: {
    icon: Info,
    title: "Informação",
    className: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100",
    iconClassName: "text-blue-500",
  },
};

/**
 * Componente para exibir mensagens de feedback ao usuário.
 * 
 * Fornece feedback visual consistente para diferentes tipos de mensagens
 * (sucesso, erro, aviso, informação) com ícones e cores apropriadas.
 */
export function FeedbackMessage({
  type,
  title,
  message,
  className,
  onDismiss,
}: FeedbackMessageProps) {
  const config = feedbackConfig[type];
  const Icon = config.icon;

  return (
    <Alert 
      className={cn(config.className, className)}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("h-4 w-4", config.iconClassName)} aria-hidden="true" />
      <AlertTitle>{title || config.title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
            aria-label="Fechar mensagem"
          >
            Fechar
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

