import { useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';

// Cores primárias de cada tema para a barra de status
const THEME_COLORS = {
  indigo: {
    light: '#5B65F0',
    dark: '#6B7BFF'
  },
  soil: {
    light: '#7D4F1D',
    dark: '#B97A4C'
  },
  green: {
    light: '#10B981',
    dark: '#34D399'
  },
  amber: {
    light: '#F59E0B',
    dark: '#FBBF24'
  },
  red: {
    light: '#EF4444',
    dark: '#F87171'
  },
  slate: {
    light: '#64748B',
    dark: '#94A3B8'
  }
};

/**
 * Componente que atualiza dinamicamente a cor da barra de status do navegador
 * baseado no tema selecionado pelo usuário
 */
export function ThemeColorUpdater() {
  const { theme } = useTheme();

  useEffect(() => {
    // Pega a cor baseada no tema e modo (claro/escuro)
    const themeColor = THEME_COLORS[theme.color];
    const color = theme.mode === 'dark' ? themeColor.dark : themeColor.light;

    // Atualiza ou cria o meta tag theme-color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', color);

    // Atualiza também os meta tags específicos de light/dark se existirem
    const metaThemeColorLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    if (metaThemeColorLight) {
      metaThemeColorLight.setAttribute('content', themeColor.light);
    }

    const metaThemeColorDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    if (metaThemeColorDark) {
      metaThemeColorDark.setAttribute('content', themeColor.dark);
    }

    // Log para debug
    console.log(`Theme color atualizado: ${color} (${theme.color} - ${theme.mode})`);
  }, [theme.color, theme.mode]);

  // Este componente não renderiza nada
  return null;
}

