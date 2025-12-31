import React, { createContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const STORAGE_KEY = "edusolo-theme";
const defaultTheme: ThemeConfig = {
  mode: "dark",
};

// Função para validar e limpar dados do localStorage
const getValidTheme = (): ThemeConfig => {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      // Validar se o mode é válido
      if (parsed.mode === "light" || parsed.mode === "dark") {
        return { mode: parsed.mode };
      }
    }
  } catch {
    // Se houver erro, limpar localStorage corrompido
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultTheme;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(getValidTheme);

  // Aplicar tema ao root element
  useEffect(() => {
    const root = document.documentElement;

    // Remover TODAS as classes de tema anteriores
    root.classList.remove(
      "light", "dark",
      "theme-blue", "theme-indigo", "theme-soil", "theme-green", "theme-amber", "theme-red", "theme-slate"
    );

    // Validar mode antes de aplicar
    const validMode = theme.mode === "light" || theme.mode === "dark" ? theme.mode : "dark";

    // Adicionar modo e tema indigo fixo
    root.classList.add(validMode);
    root.classList.add("theme-indigo");

    // Salvar no localStorage apenas se válido
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: validMode }));
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme({ mode });
  }, []);

  const toggleMode = useCallback(() => {
    setTheme((prev) => {
      const currentMode = prev.mode === "light" || prev.mode === "dark" ? prev.mode : "dark";
      return { mode: currentMode === "dark" ? "light" : "dark" };
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

