import { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    nombre_cafeteria: "Cafetería",
    logo_url: "",
    moneda: "S/",
    tema_color: "amber"
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const applyTheme = (colorName) => {
    const root = document.documentElement;
    // Base themes
    const themes = {
      amber: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
        400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        800: '#92400e', 900: '#78350f'
      },
      blue: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
        400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
        800: '#1e40af', 900: '#1e3a8a'
      },
      green: {
        50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
        400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        800: '#166534', 900: '#14532d'
      },
      rose: {
        50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
        400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
        800: '#9f1239', 900: '#881337'
      },
      purple: {
        50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
        400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
        800: '#6b21a8', 900: '#581c87'
      }
    };

    const selectedTheme = themes[colorName] || themes.amber;
    
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
    };
    
    Object.keys(selectedTheme).forEach(shade => {
      root.style.setProperty(`--color-primary-${shade}`, hexToRgb(selectedTheme[shade]));
    });
  };

  const fetchSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      setSettings(res.data);
      applyTheme(res.data.tema_color);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback
      applyTheme('amber');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      const res = await settingsService.updateSettings(newSettings);
      setSettings(res.data.settings);
      applyTheme(res.data.settings.tema_color);
      return res;
    } catch (error) {
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
