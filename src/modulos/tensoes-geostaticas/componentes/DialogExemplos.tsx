/**
 * DialogExemplos — Seletor de exemplos pré-configurados
 * modulos/tensoes-geostaticas/componentes/DialogExemplos.tsx
 *
 * Wrapper sobre o BaseDialogExemplos compartilhado, adaptando os exemplos
 * de tensões geostáticas para a interface padronizada.
 */
import { BaseDialogExemplos, BaseExample } from "@/componentes/compartilhados/exemplos/BaseDialogoExemplos";
import { exemplosTensoes, ExemploTensoes } from "../exemplos";

interface DialogExemplosProps {
  onSelecionarExemplo: (exemploId: string) => void;
}

export default function DialogExemplos({ onSelecionarExemplo }: DialogExemplosProps) {
  // Convertendo do array local para a interface Base
  const exemplosFormatados: BaseExample[] = exemplosTensoes.map(ex => ({
    id: ex.id,
    nome: ex.nome,
    descricao: ex.descricao,
    iconName: ex.icone
  }));

  return (
    <BaseDialogExemplos
      title="Exemplos Geostáticos Prontos"
      description="Carregue perfis de solo clássicos para entender a distribuição de tensões"
      builtInExamples={exemplosFormatados}
      onSelectExample={(ex: BaseExample) => onSelecionarExemplo(ex.id || "")}
      storageKey="tensoes-custom-examples"
      getFormStateFromStore={() => ({
        nome: "",
        descricao: "",
        iconName: "mountain",
        colorName: "blue"
      })}
      renderExtraFields={(_state, _update) => null}
      renderExampleTags={(_ex) => null}
    />
  );
}
