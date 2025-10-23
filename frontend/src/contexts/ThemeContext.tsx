import React, { createContext, useEffect, useState } from "react";

export type ThemeColor = "blue" | "green" | "purple" | "pink";
export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  color: ThemeColor;
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const defaultTheme: ThemeConfig = {
  color: "blue",
  mode: "dark",
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Carregar tema salvo do localStorage
    const savedTheme = localStorage.getItem("edusolo-theme");
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme) as ThemeConfig;
      } catch {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  // Aplicar tema ao root element
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover classes anteriores
    root.classList.remove("light", "dark", "theme-blue", "theme-green", "theme-purple", "theme-pink");
    
    // Adicionar novas classes
    root.classList.add(theme.mode);
    root.classList.add(`theme-${theme.color}`);
    
    // Salvar no localStorage
    localStorage.setItem("edusolo-theme", JSON.stringify(theme));
  }, [theme]);

  const setThemeColor = (color: ThemeColor) => {
    setTheme((prev) => ({ ...prev, color }));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  };

  const toggleMode = () => {
    setTheme((prev) => ({ ...prev, mode: prev.mode === "dark" ? "light" : "dark" }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeColor, setThemeMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

