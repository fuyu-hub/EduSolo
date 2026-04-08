import React, { useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

export interface NotificationOptions {
  title?: string;
  description: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Hook customizado para notificações com UI melhorada.
 * 
 * Fornece métodos para exibir diferentes tipos de notificações
 * com ícones e estilos consistentes.
 */
export function useNotification() {
  const success = useCallback((options: NotificationOptions) => {
    toast.success(options.title || "Sucesso", {
      description: options.description,
      duration: options.duration,
      icon: React.createElement(CheckCircle2, { className: "h-5 w-5 text-green-500" }),
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  }, []);

  const error = useCallback((options: NotificationOptions) => {
    toast.error(options.title || "Erro", {
      description: options.description,
      duration: options.duration,
      icon: React.createElement(XCircle, { className: "h-5 w-5 text-red-500" }),
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  }, []);

  const warning = useCallback((options: NotificationOptions) => {
    toast.warning(options.title || "Atenção", {
      description: options.description,
      duration: options.duration,
      icon: React.createElement(AlertCircle, { className: "h-5 w-5 text-yellow-500" }),
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  }, []);

  const info = useCallback((options: NotificationOptions) => {
    toast.info(options.title || "Informação", {
      description: options.description,
      duration: options.duration,
      icon: React.createElement(Info, { className: "h-5 w-5 text-blue-500" }),
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  }, []);

  const loading = useCallback((options: NotificationOptions & { id?: string }) => {
    const id = options.id || `loading-${Date.now()}`;
    
    toast.loading(options.title || "Carregando...", {
      id,
      description: options.description,
      icon: React.createElement(Loader2, { className: "h-5 w-5 animate-spin" }),
    });

    return id;
  }, []);

  const dismiss = useCallback((id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  }, []);

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  }, []);

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
  };
}

