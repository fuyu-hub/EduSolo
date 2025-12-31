import React, { createContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const defaultTheme: ThemeConfig = {
  mode: "dark",
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Carregar modo salvo do localStorage
    const savedTheme = localStorage.getItem("edusolo-theme");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        return { mode: parsed.mode || "dark" };
      } catch {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  // Aplicar tema ao root element
  useEffect(() => {
    const root = document.documentElement;

    // Remover TODAS as classes de tema anteriores (incluindo cores antigas)
    root.classList.remove(
      "light", "dark",
      "theme-blue", "theme-indigo", "theme-soil", "theme-green", "theme-amber", "theme-red", "theme-slate"
    );

    // Adicionar modo e sempre tema indigo fixo
    root.classList.add(theme.mode);
    root.classList.add("theme-indigo");

    // Salvar no localStorage
    localStorage.setItem("edusolo-theme", JSON.stringify(theme));
  }, [theme]);

  const setThemeMode = (mode: ThemeMode) => {
    setTheme({ mode });
  };

  const toggleMode = () => {
    setTheme((prev) => ({ mode: prev.mode === "dark" ? "light" : "dark" }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

