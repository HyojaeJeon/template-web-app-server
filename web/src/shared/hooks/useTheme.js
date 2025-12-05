/**
 * Theme and dark mode management Hook
 * WCAG 2.1 compliant, automatic system settings detection
 */
import { useState, useEffect, useCallback } from 'react';

export const BRAND_COLORS = {
  mint: {
    DEFAULT: '#2AC1BC',
    light: '#5ED4D0',
    dark: '#1F9D98',
    pale: '#E8FAF9',
  },
  green: {
    DEFAULT: '#00B14F',
    light: '#00D25B',
    dark: '#007A36',
    pale: '#E8F8F0',
  },
  error: {
    DEFAULT: '#DA020E',
    light: '#FF3333',
    dark: '#B30109',
  },
  warning: {
    DEFAULT: '#FFDD00',
    light: '#FFE633',
    dark: '#CCAF00',
  },
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const useTheme = () => {
  const [themeMode, setThemeMode] = useState(THEME_MODES.SYSTEM);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Detect system dark mode settings
  useEffect(() => {
    const checkSystemTheme = () => {
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemPrefersDark(prefersDark);
        
        if (themeMode === THEME_MODES.SYSTEM) {
          setIsDarkMode(prefersDark);
        }
      }
    };

    checkSystemTheme();

    // Detect system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
      if (themeMode === THEME_MODES.SYSTEM) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [themeMode]);

  // Load theme settings from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
        setThemeMode(savedTheme);

        if (savedTheme === THEME_MODES.LIGHT) {
          setIsDarkMode(false);
        } else if (savedTheme === THEME_MODES.DARK) {
          setIsDarkMode(true);
        } else {
          setIsDarkMode(systemPrefersDark);
        }
      }
    }
  }, [systemPrefersDark]);

  // Update HTML class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      
      if (isDarkMode) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
      } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Theme change function
  const changeTheme = useCallback((mode) => {
    setThemeMode(mode);

    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', mode);
    }

    switch (mode) {
      case THEME_MODES.LIGHT:
        setIsDarkMode(false);
        break;
      case THEME_MODES.DARK:
        setIsDarkMode(true);
        break;
      case THEME_MODES.SYSTEM:
        setIsDarkMode(systemPrefersDark);
        break;
    }
  }, [systemPrefersDark]);

  // Toggle dark mode
  const toggleTheme = useCallback(() => {
    const newMode = isDarkMode ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    changeTheme(newMode);
  }, [isDarkMode, changeTheme]);

  // Return colors based on current theme
  const getThemeColors = useCallback(() => {
    return {
      ...BRAND_COLORS,
      background: isDarkMode ? '#1F2937' : '#FFFFFF',
      surface: isDarkMode ? '#374151' : '#F9FAFB',
      text: {
        primary: isDarkMode ? '#F9FAFB' : '#111827',
        secondary: isDarkMode ? '#D1D5DB' : '#6B7280',
        disabled: isDarkMode ? '#9CA3AF' : '#D1D5DB',
      },
      border: isDarkMode ? '#4B5563' : '#E5E7EB',
    };
  }, [isDarkMode]);

  // WCAG contrast ratio check
  const checkContrast = useCallback((foreground, background) => {
    const getLuminance = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const [rs, gs, bs] = [r, g, b].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      aa: ratio >= 4.5, // WCAG AA standard
      aaa: ratio >= 7,   // WCAG AAA standard
    };
  }, []);

  // Accessibility settings
  const accessibilitySettings = {
    reduceMotion: typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: typeof window !== 'undefined' && 
      window.matchMedia('(prefers-contrast: high)').matches,
  };

  return {
    // State
    themeMode,
    isDarkMode,
    systemPrefersDark,
    colors: getThemeColors(),
    accessibilitySettings,

    // Functions
    changeTheme,
    toggleTheme,
    checkContrast,

    // Constants
    THEME_MODES,
    BRAND_COLORS,
  };
};

export default useTheme;