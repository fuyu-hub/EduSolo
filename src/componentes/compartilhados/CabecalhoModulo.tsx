/**
 * CabecalhoModulo — Cabeçalho padronizado para todas as páginas de módulo.
 * Garante consistência visual: ícone + título + subtítulo + slot de ações.
 */
import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { UI_STANDARDS } from "@/lib/ui-standards";

interface CabecalhoModuloProps {
  /** Ícone do módulo (ex: <Beaker className={UI_STANDARDS.header.icon} />) */
  icone: ReactNode;
  /** Título principal do módulo */
  titulo: string;
  /** Subtítulo descritivo */
  subtitulo: string;
  /** Ações extras renderizadas à direita (DialogExemplos, BotaoLimpar, etc). Separadores são inseridos automaticamente entre os filhos. */
  acoes?: ReactNode[];
  /** data-tour attribute para onboarding */
  dataTour?: string;
}

export function CabecalhoModulo({
  icone,
  titulo,
  subtitulo,
  acoes,
  dataTour = "module-header",
}: CabecalhoModuloProps) {
  return (
    <div className={UI_STANDARDS.header.container} data-tour={dataTour}>
      <div className="flex items-center gap-3">
        <div className={UI_STANDARDS.header.iconContainer}>{icone}</div>
        <div>
          <h1 className={UI_STANDARDS.header.title}>{titulo}</h1>
          <p className={UI_STANDARDS.header.subtitle}>{subtitulo}</p>
        </div>
      </div>

      {acoes && acoes.length > 0 && (
        <div className={UI_STANDARDS.header.actionsContainer}>
          {acoes.map((acao, i) => (
            <div key={i} className="contents">
              {i === 0 && (
                <Separator
                  orientation="vertical"
                  className="h-6 mx-1 bg-border"
                />
              )}
              {acao}
              {i < acoes.length - 1 && (
                <Separator
                  orientation="vertical"
                  className="h-6 mx-1 bg-border"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
