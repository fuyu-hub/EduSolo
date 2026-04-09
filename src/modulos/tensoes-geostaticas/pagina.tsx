/**
 * Página: Tensões Geostáticas
 * modulos/tensoes-geostaticas/pagina.tsx
 *
 * Cálculo de tensões totais, efetivas e pressões neutras em perfis
 * de solo estratificados. Orquestra componentes, estado e cálculos.
 */
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Mountain, LineChart as LineChartIcon, Table2, Calculator as CalcIcon } from "lucide-react";
import { Helmet } from 'react-helmet-async';

import { useTensoesStore } from "./store";
import { calcularTensoesGeostaticas } from "./calculos";
import { UI_STANDARDS } from "@/lib/ui-standards";
import { handleArrowNavigation } from "@/lib/navigation";
import PrintHeader from "@/componentes/base/CabecalhoImpressao";

import { LayoutDividido } from "@/componentes/compartilhados/LayoutDividido";
import { CabecalhoModulo } from "@/componentes/compartilhados/CabecalhoModulo";
import { BotaoLimpar } from "@/componentes/compartilhados/BotaoLimpar";
import { AlertaErro } from "@/componentes/compartilhados/AlertaErro";
import { LinhaResultado } from "@/componentes/compartilhados/LinhaResultado";
import { useAutoCalculo } from "@/hooks/useAutoCalculo";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DiagramaPerfil from "./componentes/DiagramaPerfil";
import TabelaResultados from "./componentes/TabelaResultados";
import PerfilTensoes from "./componentes/PerfilTensoes";
import DialogExemplos from "./componentes/DialogExemplos";
import DialogConfiguracoes from "./componentes/DialogConfiguracoes";

export default function TensoesGeostaticasPagina() {
  const {
    camadas,
    configuracoes,
    resultado,
    addCamada,
    updateCamada,
    removeCamada,
    updateConfiguracoes,
    carregarExemplo,
    setResultado,
    setCalculating,
    reset
  } = useTensoesStore();

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleLimpar = () => {
    reset();
    toast.info("Dados limpos.");
  };

  const handleSelecionarExemplo = (id: string) => {
    import("./exemplos").then(({ exemplosTensoes }) => {
      const ex = exemplosTensoes.find(e => e.id === id);
      if (ex) {
        carregarExemplo(ex.camadas, ex.configuracoes);
        toast.success(`Exemplo carregado: ${ex.nome}`);
      }
    });
  };

  // M19: Lógica de cálculo na página (store é puro state container)
  const handleCalculate = () => {
    if (camadas.length === 0) {
      setResultado(null);
      return;
    }
    setCalculating(true);
    try {
      const res = calcularTensoesGeostaticas({ camadas, configuracoes });
      setResultado(res);
    } catch (err: any) {
      setResultado({ pontosCalculo: [], erro: err.message });
    } finally {
      setCalculating(false);
    }
  };

  // M7 + M15: Auto-cálculo com debounce ao alterar camadas ou configurações
  useAutoCalculo(handleCalculate, [camadas, configuracoes], 300);

  // Avisos não-bloqueantes via toast
  useEffect(() => {
    if (resultado?.avisos && resultado.avisos.length > 0) {
      toast.warning("Avisos Físicos Detectados", {
        description: resultado.avisos[0]
      });
    }
  }, [resultado]);

  // M5: Valores resumo derivados do resultado
  const resumo = useMemo(() => {
    if (!resultado?.pontosCalculo || resultado.pontosCalculo.length === 0) return null;
    const pontos = resultado.pontosCalculo;
    const maxSigmaV = Math.max(...pontos.map(p => p.tensaoEfetivaVertical));
    const maxU = Math.max(...pontos.map(p => p.pressaoNeutra));
    const maxSigmaTotalV = Math.max(...pontos.map(p => p.tensaoTotalVertical));
    const profMax = Math.max(...pontos.map(p => p.profundidade));
    return { maxSigmaV, maxU, maxSigmaTotalV, profMax };
  }, [resultado]);

  return (
    <div className={UI_STANDARDS.pageContainer} onKeyDown={handleArrowNavigation}>
      <Helmet>
        <title>Tensões Geostáticas | EduSolos</title>
        <meta name="description" content="Cálculo de tensões totais, efetivas e pressões neutras em perfis de solo estratificados." />
      </Helmet>

      <PrintHeader moduleTitle="Tensões Geostáticas" moduleName="tensoes-geostaticas" />

      <CabecalhoModulo
        titulo="Tensões Geostáticas"
        subtitulo="Cálculo de tensões totais, efetivas e pressões neutras"
        icone={<Mountain className={UI_STANDARDS.header.icon} />}
        acoes={[
          <DialogConfiguracoes
            key="config"
            config={configuracoes}
            onSalvar={(data) => {
              updateConfiguracoes(data);
              toast.success("Configurações atualizadas");
            }}
          />,
          <DialogExemplos key="exemplos" onSelecionarExemplo={handleSelecionarExemplo} />,
          <BotaoLimpar key="limpar" onLimpar={handleLimpar} />,
        ]}
      />

      <LayoutDividido
        proporcao="1fr 1fr"
        sticky={true}
        className="lg:items-stretch"
        classNameEsquerdo="self-stretch flex flex-col"
        classNameDireito="self-stretch flex flex-col"
        painelEsquerdo={
          <div className="flex-1 flex flex-col">
            <DiagramaPerfil
              camadas={camadas}
              interactive={true}
              onAddCamada={(camada) => addCamada(camada)}
              onEditCamada={(idx, camada) => updateCamada(idx, camada)}
              onRemoveCamada={(idx) => removeCamada(idx)}
            />
          </div>
        }
        painelDireito={
          <div className="h-full flex flex-col space-y-4">
            {/* M4: AlertaErro para erros persistentes */}
            <AlertaErro erro={resultado?.erro} />

            {/* Placeholder quando sem resultado */}
            {!resultado || resultado.pontosCalculo.length === 0 ? (
              <Card className="glass flex items-center justify-center p-12 text-center text-muted-foreground border-dashed h-full flex-1">
                <div>
                  <CalcIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">Nenhum resultado ainda</p>
                  <p className="text-sm">Adicione camadas ao perfil para calcular automaticamente.</p>
                </div>
              </Card>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Tabs: Tabela / Gráfico */}
                <Tabs defaultValue="tabela" className="w-full flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 mb-4 rounded-lg p-1 shrink-0">
                    <TabsTrigger value="tabela" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                      <Table2 className="w-4 h-4" />
                      Tabela de Tensões
                    </TabsTrigger>
                    <TabsTrigger value="grafico" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                      <LineChartIcon className="w-4 h-4" />
                      Gráfico do Perfil
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tabela" className="mt-0 flex-1 overflow-auto animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <TabelaResultados pontos={resultado?.pontosCalculo || []} camadas={camadas} />
                  </TabsContent>

                  <TabsContent value="grafico" className="mt-0 flex-1 animate-in fade-in-50 slide-in-from-right-2 duration-300">
                    <div ref={chartContainerRef}>
                      <PerfilTensoes pontos={resultado?.pontosCalculo || []} camadas={camadas} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
