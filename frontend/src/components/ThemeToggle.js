import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';

const ThemeToggle = ({ size = 'sm', showLabel = false, className = '' }) => {
  const { theme, toggleTheme, loading, isDark } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      disabled={loading}
      variant="outline"
      size={size}
      className={`flex items-center space-x-2 ${className}`}
      title={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isDark ? (
        <Sun size={16} />
      ) : (
        <Moon size={16} />
      )}
      {showLabel && (
        <span className="text-sm">
          {isDark ? 'Claro' : 'Escuro'}
        </span>
      )}
    </Button>
  );
};

export default ThemeToggle;