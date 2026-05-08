import { useState, useEffect } from 'react';

export const useTheme = () => {
  // Inicializa verificando localStorage - padrão é LIGHT
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('transmill-theme');
    // Se não houver preferência salva, define LIGHT como padrão
    if (savedTheme === null) {
      localStorage.setItem('transmill-theme', 'light');
      return false;
    }
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // Aplica a classe dark no body para evitar flash
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return isDarkMode;
};

// Cores do tema
export const themeColors = {
  dark: {
    bg: 'bg-[#2A3618]',
    bgCard: 'bg-[#3F5123]',
    bgCardAlt: 'bg-[#6B6B4B]',
    bgInput: 'bg-[#2A3618]',
    border: 'border-[#D4AF37]',
    borderAlt: 'border-[#556B2F]',
    text: 'text-white',
    textSecondary: 'text-[#E5C34A]',
    textMuted: 'text-[#6B6B6B]',
    button: 'bg-[#D4AF37] hover:bg-[#E5C34A] text-[#2A3618]',
    buttonOutline: 'border-[#D4AF37] text-white hover:bg-[#556B2F]',
    buttonCircle: 'bg-[#B89B2F] border-[#D4AF37]',
    badge: 'bg-[#D4AF37] text-[#2A3618]',
    icon: 'text-[#D4AF37]',
  },
  light: {
    bg: 'bg-[#F5E6D3]',
    bgCard: 'bg-[#FAF0E6]',
    bgCardAlt: 'bg-[#E8D5C4]',
    bgInput: 'bg-white',
    border: 'border-[#8B6F47]',
    borderAlt: 'border-[#C9B896]',
    text: 'text-[#4A3728]',
    textSecondary: 'text-[#8B6F47]',
    textMuted: 'text-[#A0826D]',
    button: 'bg-[#8B6F47] hover:bg-[#6B4423] text-white',
    buttonOutline: 'border-[#8B6F47] text-[#4A3728] hover:bg-[#E8D5C4]',
    buttonCircle: 'bg-[#6B4423] border-[#8B6F47]',
    badge: 'bg-[#8B6F47] text-white',
    icon: 'text-[#8B6F47]',
  }
};

export const getThemeClasses = (isDarkMode) => {
  return isDarkMode ? themeColors.dark : themeColors.light;
};
