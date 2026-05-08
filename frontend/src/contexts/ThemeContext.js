import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Inicializar tema IMEDIATAMENTE do localStorage com padrão LIGHT
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('transmill-theme');
    const themeVersion = localStorage.getItem('transmill-theme-version');
    
    // Forçar tema claro se versão for diferente de 2.35.6
    if (themeVersion !== '2.35.6') {
      localStorage.setItem('transmill-theme', 'light');
      localStorage.setItem('transmill-theme-version', '2.35.6');
      return 'light';
    }
    
    // Se não houver tema salvo ou for inválido, define light como padrão
    if (!savedTheme || (savedTheme !== 'dark' && savedTheme !== 'light')) {
      localStorage.setItem('transmill-theme', 'light');
      return 'light';
    }
    return savedTheme;
  });
  
  const [loading, setLoading] = useState(false);
  const { user, updateUser, token, API } = useAuth();

  // Aplicar tema IMEDIATAMENTE ao inicializar
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // NÃO sincronizar tema do usuário automaticamente após versão 2.35.6
  // O localStorage tem prioridade sobre o tema salvo no banco
  // O usuário pode mudar o tema manualmente se quiser

  const applyTheme = (themeName) => {
    const html = document.documentElement;
    if (themeName === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    if (loading) return;

    setLoading(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    try {
      // Aplicar tema imediatamente na UI
      setTheme(newTheme);
      applyTheme(newTheme);
      
      // Salvar no localStorage
      localStorage.setItem('transmill-theme', newTheme);
      
      // Se usuário está logado, salvar no backend
      if (user && token) {
        const headers = { Authorization: `Bearer ${token}` };
        
        await axios.post(`${API}/user/update-profile`, 
          { theme: newTheme },
          { headers }
        );
        
        // Atualizar contexto do usuário
        const updatedUser = { ...user, theme: newTheme };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      // Reverter tema se falhou
      setTheme(theme);
      applyTheme(theme);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    theme,
    toggleTheme,
    loading,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};