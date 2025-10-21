import React from "react";
import { cn } from "@/lib/utils"; // Importa a função utilitária para classes condicionais

// Define as propriedades que o componente receberá
interface DiagramaFasesProps {
  volumeSolidosNorm: number;
  volumeAguaNorm: number;
  volumeArNorm: number;
  // Opcional: Adicionar pesos se quiser mostrá-los também
  // pesoSolidosNorm?: number;
  // pesoAguaNorm?: number;
  className?: string; // Para permitir estilização adicional
}

// Estilos base para cada fase (pode ajustar as cores)
const basePhaseStyle = "w-full flex items-center justify-center text-xs font-medium text-center p-1";
const solidColor = "bg-yellow-800/70 text-white"; // Cor para Sólidos
const waterColor = "bg-blue-500/70 text-white"; // Cor para Água
const airColor = "bg-gray-300/50 text-gray-800"; // Cor para Ar

export function DiagramaFases({
  volumeSolidosNorm,
  volumeAguaNorm,
  volumeArNorm,
  className,
}: DiagramaFasesProps) {
  // Calcula a altura total para normalização (geralmente será 1 se os valores já são normalizados para 1)
  // Mas fazemos isso para garantir caso a soma não seja exatamente 1 devido a arredondamentos.
  const volumeTotalNorm = volumeSolidosNorm + volumeAguaNorm + volumeArNorm;

  // Evita divisão por zero se o volume total for 0
  if (volumeTotalNorm === 0) {
    return (
      <div className={cn("w-32 h-48 border border-border rounded flex items-center justify-center text-muted-foreground text-sm", className)}>
        Dados insuficientes
      </div>
    );
  }

  // Calcula a porcentagem de altura para cada fase
  const alturaSolidos = `${((volumeSolidosNorm / volumeTotalNorm) * 100).toFixed(1)}%`;
  const alturaAgua = `${((volumeAguaNorm / volumeTotalNorm) * 100).toFixed(1)}%`;
  const alturaAr = `${((volumeArNorm / volumeTotalNorm) * 100).toFixed(1)}%`;

  return (
    // Container principal do diagrama
    <div
      className={cn(
        "w-32 h-48 border border-border rounded flex flex-col overflow-hidden shadow-inner bg-background/30",
        className,
      )}
      aria-label="Diagrama Trifásico do Solo"
    >
      {/* Fase Ar (se houver) */}
      {volumeArNorm > 0 && (
        <div
          className={cn(basePhaseStyle, airColor)}
          style={{ height: alturaAr }}
          title={`Volume de Ar: ${volumeArNorm.toFixed(3)}`}
        >
          Ar <br/> (Va={volumeArNorm.toFixed(3)})
        </div>
      )}

      {/* Fase Água (se houver) */}
      {volumeAguaNorm > 0 && (
        <div
          className={cn(basePhaseStyle, waterColor)}
          style={{ height: alturaAgua }}
          title={`Volume de Água: ${volumeAguaNorm.toFixed(3)}`}
        >
          Água <br/> (Vw={volumeAguaNorm.toFixed(3)})
        </div>
      )}

      {/* Fase Sólidos */}
      <div
        className={cn(basePhaseStyle, solidColor)}
        style={{ height: alturaSolidos }}
        title={`Volume de Sólidos: ${volumeSolidosNorm.toFixed(3)}`}
      >
        Sólido <br/> (Vs={volumeSolidosNorm.toFixed(3)})
      </div>
    </div>
  );
}

export default DiagramaFases;