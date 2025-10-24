/**
 * Exemplo de formulário otimizado com todas as melhorias implementadas:
 * - Undo/Redo
 * - Debounce
 * - React.memo
 * - useCallback otimizado
 * - Integração com Zustand store
 */

import { useState, useCallback, useMemo, memo } from "react";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useDebounce } from "@/hooks/use-debounce";
import { useEventCallback } from "@/hooks/use-optimized-callback";
import { useCalculationStore } from "@/stores/calculationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UndoRedoToolbar } from "./UndoRedoToolbar";

// Tipo do formulário
interface FormData {
  valor1: string;
  valor2: string;
  valor3: string;
}

// Componente otimizado de campo de entrada
const OptimizedField = memo<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}>(({ label, value, onChange, placeholder }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
});

OptimizedField.displayName = "OptimizedField";

export const OptimizedFormExample = () => {
  const [formData, setFormData] = useState<FormData>({
    valor1: "",
    valor2: "",
    valor3: "",
  });

  const [result, setResult] = useState<number | null>(null);

  // Debounce dos valores do formulário para validação
  const debouncedFormData = useDebounce(formData, 500);

  // Histórico Undo/Redo
  const { undo, redo, canUndo, canRedo, clear } = useCalculationHistory(
    debouncedFormData,
    true
  );

  // Store para cálculos recentes
  const { addCalculation } = useCalculationStore();

  // Handler otimizado para mudanças de campo
  const handleFieldChange = useEventCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  });

  // Cálculo memoizado
  const calculatedValue = useMemo(() => {
    const v1 = parseFloat(formData.valor1) || 0;
    const v2 = parseFloat(formData.valor2) || 0;
    const v3 = parseFloat(formData.valor3) || 0;
    return v1 + v2 + v3;
  }, [formData]);

  // Handler de cálculo otimizado
  const handleCalculate = useCallback(() => {
    const newResult = calculatedValue;
    setResult(newResult);

    // Salvar no histórico
    addCalculation({
      type: "exemplo",
      moduleName: "Exemplo Otimizado",
      inputs: formData,
      outputs: { resultado: newResult },
      title: `Cálculo: ${newResult}`,
    });
  }, [calculatedValue, formData, addCalculation]);

  // Reset do formulário
  const handleReset = useCallback(() => {
    setFormData({
      valor1: "",
      valor2: "",
      valor3: "",
    });
    setResult(null);
    clear();
  }, [clear]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exemplo de Formulário Otimizado</CardTitle>
          <UndoRedoToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onReset={handleReset}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <OptimizedField
          label="Valor 1"
          value={formData.valor1}
          onChange={(value) => handleFieldChange("valor1", value)}
          placeholder="Digite o primeiro valor"
        />

        <OptimizedField
          label="Valor 2"
          value={formData.valor2}
          onChange={(value) => handleFieldChange("valor2", value)}
          placeholder="Digite o segundo valor"
        />

        <OptimizedField
          label="Valor 3"
          value={formData.valor3}
          onChange={(value) => handleFieldChange("valor3", value)}
          placeholder="Digite o terceiro valor"
        />

        <div className="flex gap-2">
          <Button onClick={handleCalculate} className="flex-1">
            Calcular
          </Button>
          <Button onClick={handleReset} variant="outline">
            Limpar
          </Button>
        </div>

        {result !== null && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Resultado:</p>
            <p className="text-2xl font-bold text-primary">{result.toFixed(2)}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          <p>💡 Dicas:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Use Ctrl+Z para desfazer</li>
            <li>Use Ctrl+Shift+Z para refazer</li>
            <li>Valores são validados com debounce de 500ms</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

