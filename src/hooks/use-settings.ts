import { useContext } from "react";
import { SettingsContext } from "@/contexts/SettingsContext";

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Hook utilitário para formatar números de acordo com as configurações
export const useNumberFormatter = () => {
  const { settings } = useSettings();

  const formatNumber = (value: number): string => {
    if (settings.scientificNotation && (Math.abs(value) >= 10000 || (Math.abs(value) < 0.001 && value !== 0))) {
      return value.toExponential(settings.decimalPlaces);
    }
    return value.toFixed(settings.decimalPlaces);
  };

  return { formatNumber };
};

