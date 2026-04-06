/**
 * LayoutDividido — Layout de tela dividida com rolagem sticky opcional.
 * Extrai o comportamento "side-by-side" da Granulometria para uso universal.
 *
 * No modo 'side-by-side', o painel direito fica fixado na viewport (sticky)
 * enquanto o esquerdo rola livremente — ideal para formulários longos + resultados.
 */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutDivididoProps {
  /** Conteúdo do painel esquerdo (formulários/entradas) */
  painelEsquerdo: ReactNode;
  /** Conteúdo do painel direito (resultados/gráficos) */
  painelDireito: ReactNode;
  /** Modo de exibição */
  modo?: "default" | "side-by-side";
  /** Proporção do grid (default: "1fr 1fr"). Aceita qualquer definição CSS grid-template-columns. */
  proporcao?: string;
  /** Quando true, ambas as colunas recebem o comportamento sticky; a menor ou mais curta fixará na tela acompanhando a maior na rolagem. */
  sticky?: boolean;
  /** Classes extras no container raiz */
  className?: string;
  /** Classes extras para o painel esquerdo */
  classNameEsquerdo?: string;
  /** Classes extras para o painel direito */
  classNameDireito?: string;
}

export function LayoutDividido({
  painelEsquerdo,
  painelDireito,
  modo = "side-by-side",
  proporcao = "1fr 1fr",
  sticky = true,
  className,
  classNameEsquerdo,
  classNameDireito,
}: LayoutDivididoProps) {
  const isSideBySide = modo === "side-by-side";

  if (!isSideBySide) {
    // Modo padrão: empilhado
    return (
      <div className={cn("space-y-6", className)}>
        <div className={cn("animate-in fade-in slide-in-from-left-4 duration-500", classNameEsquerdo)}>
          {painelEsquerdo}
        </div>
        <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500", classNameDireito)}>
          {painelDireito}
        </div>
      </div>
    );
  }

  // Mapeamento estático para o Tailwind poder compilar as classes
  const propClasses: Record<string, string> = {
    "1fr 1fr": "lg:grid-cols-2",
    "6fr 4fr": "lg:grid-cols-[6fr_4fr]",
    "2fr 1fr": "lg:grid-cols-[2fr_1fr]",
    "1fr 2fr": "lg:grid-cols-[1fr_2fr]",
    "7fr 5fr": "lg:grid-cols-[7fr_5fr]",
  };

  const gridClass = propClasses[proporcao] || "lg:grid-cols-2";

  // Modo side-by-side com sticky duplo
  return (
    <div
      className={cn(
        "flex flex-col lg:grid gap-6 items-start",
        gridClass,
        className
      )}
    >
      <div className={cn(
        "animate-in slide-in-from-left-5 duration-300",
        sticky && "md:sticky md:top-4 self-start",
        classNameEsquerdo
      )}>
        {painelEsquerdo}
      </div>
      <div className={cn(
        "animate-in slide-in-from-right-5 duration-300",
        sticky && "md:sticky md:top-4 self-start",
        classNameDireito
      )}>
        {painelDireito}
      </div>
    </div>
  );
}
