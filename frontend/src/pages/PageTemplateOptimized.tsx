/**
 * TEMPLATE DE PÁGINA OTIMIZADA
 * 
 * Use este arquivo como base para adicionar otimizações em outras páginas
 * Inclui:
 * - React.memo para componentes
 * - useCallback para funções
 * - Undo/Redo com histórico
 * - Integração com store de cálculos
 * - RecentCalculations
 * - Debounce
 */

import { useState, useCallback, useMemo } from "react";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useDebounce } from "@/hooks/use-debounce";
import { useCalculationStore } from "@/stores/calculationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UndoRedoToolbar } from "@/components/UndoRedoToolbar";
import { RecentCalculations } from "@/components/RecentCalculations";
import { Calculator } from "lucide-react";

// Tipos do formulário (ajuste conforme sua necessidade)
interface FormData {
  campo1: string;
  campo2: string;
  campo3: string;
}

// Tipos do resultado (ajuste conforme sua necessidade)
interface ResultData {
  resultado1: number;
  resultado2: number;
}

export default function PageTemplateOptimized() {
  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    campo1: "",
    campo2: "",
    campo3: "",
  });

  // Estado dos resultados
  const [result, setResult] = useState<ResultData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Debounce dos valores para validação (evita validar a cada tecla)
  const debouncedFormData = useDebounce(formData, 500);

  // Histórico Undo/Redo
  const { undo, redo, canUndo, canRedo, clear: clearHistory } = useCalculationHistory(
    debouncedFormData,
    true // enabled
  );

  // Store para cálculos recentes
  const { addCalculation } = useCalculationStore();

  // Handler otimizado para mudanças de campo
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validação dos dados (com debounce)
  const isValid = useMemo(() => {
    const v1 = parseFloat(debouncedFormData.campo1);
    const v2 = parseFloat(debouncedFormData.campo2);
    const v3 = parseFloat(debouncedFormData.campo3);

    return !isNaN(v1) && !isNaN(v2) && !isNaN(v3) && v1 > 0 && v2 > 0 && v3 > 0;
  }, [debouncedFormData]);

  // Função de cálculo (simulação - substitua pela sua lógica real)
  const performCalculation = useCallback(async (data: FormData): Promise<ResultData> => {
    // Simula chamada à API
    return new Promise((resolve) => {
      setTimeout(() => {
        const v1 = parseFloat(data.campo1);
        const v2 = parseFloat(data.campo2);
        const v3 = parseFloat(data.campo3);

        resolve({
          resultado1: v1 + v2 + v3,
          resultado2: (v1 * v2) / v3,
        });
      }, 500);
    });
  }, []);

  // Handler de cálculo otimizado
  const handleCalculate = useCallback(async () => {
    if (!isValid) return;

    setIsCalculating(true);

    try {
      const newResult = await performCalculation(formData);
      setResult(newResult);

      // Salvar no histórico de cálculos
      addCalculation({
        type: "template-example",
        moduleName: "Template Otimizado",
        inputs: formData,
        outputs: newResult,
        title: `Cálculo: ${newResult.resultado1.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Erro ao calcular:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [isValid, formData, performCalculation, addCalculation]);

  // Reset do formulário
  const handleReset = useCallback(() => {
    setFormData({
      campo1: "",
      campo2: "",
      campo3: "",
    });
    setResult(null);
    clearHistory();
  }, [clearHistory]);

  // Carregar cálculo do histórico
  const handleLoadCalculation = useCallback((calculation: any) => {
    if (calculation.inputs) {
      setFormData(calculation.inputs);
      if (calculation.outputs) {
        setResult(calculation.outputs);
      }
    }
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Página Template Otimizada
          </h1>
          <p className="text-muted-foreground mt-1">
            Exemplo de página com todas as otimizações implementadas
          </p>
        </div>

        <UndoRedoToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onReset={handleReset}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Formulário e Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Entrada */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campo1">Campo 1</Label>
                <Input
                  id="campo1"
                  type="number"
                  value={formData.campo1}
                  onChange={(e) => handleFieldChange("campo1", e.target.value)}
                  placeholder="Digite o valor"
                />
              </div>

              <div>
                <Label htmlFor="campo2">Campo 2</Label>
                <Input
                  id="campo2"
                  type="number"
                  value={formData.campo2}
                  onChange={(e) => handleFieldChange("campo2", e.target.value)}
                  placeholder="Digite o valor"
                />
              </div>

              <div>
                <Label htmlFor="campo3">Campo 3</Label>
                <Input
                  id="campo3"
                  type="number"
                  value={formData.campo3}
                  onChange={(e) => handleFieldChange("campo3", e.target.value)}
                  placeholder="Digite o valor"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCalculate}
                  disabled={!isValid || isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? "Calculando..." : "Calcular"}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Resultados */}
          {result && (
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground mb-1">Resultado 1</p>
                    <p className="text-2xl font-bold text-primary">
                      {result.resultado1.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground mb-1">Resultado 2</p>
                    <p className="text-2xl font-bold text-primary">
                      {result.resultado2.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Dicas de Otimização</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Use <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+Z</kbd> para desfazer</li>
                <li>Use <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+Shift+Z</kbd> para refazer</li>
                <li>Validações ocorrem 500ms após parar de digitar (debounce)</li>
                <li>Seus cálculos são salvos automaticamente</li>
                <li>Clique em um cálculo recente para carregá-lo</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Cálculos Recentes */}
        <div className="lg:col-span-1">
          <RecentCalculations
            moduleName="Template Otimizado"
            maxItems={10}
          />
        </div>
      </div>
    </div>
  );
}

