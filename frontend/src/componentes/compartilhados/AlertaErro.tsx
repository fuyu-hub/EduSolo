/**
 * AlertaErro — Componente padronizado para exibição de erros de cálculo/validação.
 * Substitui os blocos <Alert variant="destructive"> repetidos nas páginas.
 */
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface AlertaErroProps {
  /** Mensagem de erro. Se null/undefined/vazio, o componente não renderiza. */
  erro: string | null | undefined;
  /** Título opcional (default: "Erro") */
  titulo?: string;
  /** Classes CSS extras */
  className?: string;
}

export function AlertaErro({ erro, titulo = "Erro", className }: AlertaErroProps) {
  if (!erro) return null;

  return (
    <Alert variant="destructive" className={cn("p-2", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-sm">{titulo}</AlertTitle>
      <AlertDescription className="text-xs">{erro}</AlertDescription>
    </Alert>
  );
}
