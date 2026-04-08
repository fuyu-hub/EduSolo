import { UnitSystem } from "@/contexts/SettingsContext";

/**
 * Fatores de conversão de diferentes sistemas de unidades para SI
 */
export const UNIT_CONVERSIONS = {
  // Densidade (para kg/m³)
  density: {
    SI: 1, // kg/m³
    CGS: 1000, // g/cm³ → kg/m³
    Imperial: 16.0185, // lb/ft³ → kg/m³
  },
  // Pressão/Tensão (para kPa)
  pressure: {
    SI: 1, // kPa
    CGS: 98.0665, // kgf/cm² → kPa
    Imperial: 6.89476, // psi → kPa
  },
  // Comprimento (para metros)
  length: {
    SI: 1, // m
    CGS: 0.01, // cm → m
    Imperial: 0.3048, // ft → m
  },
  // Força (para kN)
  force: {
    SI: 1, // kN
    CGS: 0.00980665, // kgf → kN
    Imperial: 0.00444822, // lbf → kN
  },
};

/**
 * Símbolos de unidades para cada sistema
 */
export const UNIT_SYMBOLS = {
  density: {
    SI: "kN/m³",
    CGS: "g/cm³",
    Imperial: "lb/ft³",
  },
  pressure: {
    SI: "kPa",
    CGS: "kgf/cm²",
    Imperial: "psi",
  },
  length: {
    SI: "m",
    CGS: "cm",
    Imperial: "ft",
  },
  force: {
    SI: "kN",
    CGS: "kgf",
    Imperial: "lbf",
  },
  dimensionless: {
    SI: "",
    CGS: "",
    Imperial: "",
  },
};

export type UnitType = keyof typeof UNIT_SYMBOLS;

/**
 * Converte um valor de um sistema de unidades para outro
 */
export function convertUnit(
  value: number,
  unitType: UnitType,
  fromSystem: UnitSystem,
  toSystem: UnitSystem
): number {
  if (unitType === "dimensionless") return value;
  if (fromSystem === toSystem) return value;

  const conversions = UNIT_CONVERSIONS[unitType];
  if (!conversions) return value;

  // Converter para SI primeiro, depois para o sistema alvo
  const valueInSI = value * conversions[fromSystem];
  const valueInTarget = valueInSI / conversions[toSystem];

  return valueInTarget;
}

/**
 * Retorna o símbolo da unidade para um tipo e sistema específicos
 */
export function getUnitSymbol(unitType: UnitType, system: UnitSystem): string {
  return UNIT_SYMBOLS[unitType][system];
}

/**
 * Formata um valor com a unidade apropriada
 */
export function formatWithUnit(
  value: number,
  unitType: UnitType,
  system: UnitSystem,
  decimalPlaces: number = 3
): string {
  const symbol = getUnitSymbol(unitType, system);
  const formattedValue = value.toFixed(decimalPlaces);
  return symbol ? `${formattedValue} ${symbol}` : formattedValue;
}

