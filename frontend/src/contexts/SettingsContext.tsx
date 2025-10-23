import React, { createContext, useEffect, useState } from "react";

export type UnitSystem = "SI" | "CGS" | "Imperial";
export type InterfaceDensity = "compact" | "normal" | "comfortable";

export interface AppSettings {
  // Cálculos
  decimalPlaces: number;
  unitSystem: UnitSystem;
  scientificNotation: boolean;
  
  // Interface
  interfaceDensity: InterfaceDensity;
  reduceMotion: boolean;
  
  // Exibição
  showEducationalTips: boolean;
  showFormulas: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  clearAllCalculations: () => void;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<void>;
}

const defaultSettings: AppSettings = {
  decimalPlaces: 3,
  unitSystem: "SI",
  scientificNotation: false,
  interfaceDensity: "normal",
  reduceMotion: false,
  showEducationalTips: true,
  showFormulas: true,
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Carregar configurações salvas do localStorage
    const savedSettings = localStorage.getItem("edusolo-settings");
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem("edusolo-settings", JSON.stringify(settings));
    
    // Aplicar classe de densidade na interface
    const root = document.documentElement;
    root.classList.remove("density-compact", "density-normal", "density-comfortable");
    root.classList.add(`density-${settings.interfaceDensity}`);
    
    // Aplicar redução de movimento
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const clearAllCalculations = () => {
    // Limpar todos os cálculos salvos
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("saved-calc-") || key === "saved-calculations") {
        localStorage.removeItem(key);
      }
    });
    // Disparar evento customizado para notificar componentes
    window.dispatchEvent(new CustomEvent("calculations-cleared"));
  };

  const exportSettings = () => {
    const data = {
      settings,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edusolo-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (data.settings) {
            setSettings({ ...defaultSettings, ...data.settings });
            resolve();
          } else {
            reject(new Error("Arquivo de configuração inválido"));
          }
        } catch (error) {
          reject(new Error("Erro ao ler arquivo de configuração"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo"));
      };
      
      reader.readAsText(file);
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        clearAllCalculations,
        exportSettings,
        importSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

