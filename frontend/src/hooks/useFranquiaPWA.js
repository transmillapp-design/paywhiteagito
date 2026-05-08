/**
 * Hook para gerenciar PWA dinâmico por franquia
 * Carrega manifest e tema baseado na franquia atual
 */

import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

export const useFranquiaPWA = (slugParam = null) => {
  const [franquiaSlug, setFranquiaSlug] = useState(slugParam);
  const [franquiaData, setFranquiaData] = useState(null);
  const [pwaType, setPwaType] = useState(null); // 'transmill' ou 'protecao'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detectar slug da franquia e tipo de PWA a partir da URL
  const detectFranquiaFromURL = useCallback(() => {
    const pathname = window.location.pathname;
    
    // Padrões de URL:
    // /franquia/{slug}/login
    // /franquia/{slug}/app (PWA Sistema)
    // /franquia/{slug}/cliente (PWA Cliente)
    // /franquia/{slug}/protecao (PWA Proteção)
    
    const franquiaMatch = pathname.match(/\/franquia\/([^\/]+)/);
    
    if (franquiaMatch) {
      const slug = franquiaMatch[1];
      setFranquiaSlug(slug);
      
      // Determinar tipo de PWA
      if (pathname.includes('/cliente') || pathname.includes('/protecao')) {
        setPwaType('protecao');
      } else {
        setPwaType('transmill');
      }
      
      return slug;
    }
    
    return null;
  }, []);

  // Listener para evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir o prompt automático
      e.preventDefault();
      // Salvar o evento para usar depois
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[FranquiaPWA] App instalável detectado');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
      console.log('[FranquiaPWA] App já está instalado');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função para instalar o PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[FranquiaPWA] Prompt de instalação não disponível');
      return false;
    }

    try {
      // Mostrar o prompt de instalação
      deferredPrompt.prompt();
      
      // Esperar pela escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[FranquiaPWA] Usuário escolheu: ${outcome}`);
      
      // Limpar o prompt
      setDeferredPrompt(null);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[FranquiaPWA] Erro ao instalar:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Carregar dados da franquia
  const loadFranquiaData = useCallback(async (slug) => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/franquias/${slug}`);
      const data = await response.json();
      
      if (data.success && data.franquia) {
        setFranquiaData(data.franquia);
        setError(null);
      } else {
        setError('Franquia não encontrada');
      }
    } catch (err) {
      console.error('[FranquiaPWA] Erro ao carregar franquia:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar manifest link dinamicamente
  const updateManifestLink = useCallback((slug, type) => {
    if (!slug) return;
    
    // Remover manifest antigo
    const oldManifest = document.querySelector('link[rel="manifest"]');
    if (oldManifest) {
      oldManifest.remove();
    }
    
    // Criar novo manifest link
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    
    if (type === 'protecao') {
      manifestLink.href = `${API}/api/franquia/${slug}/manifest-protecao.json`;
    } else {
      manifestLink.href = `${API}/api/franquia/${slug}/manifest-transmill.json`;
    }
    
    document.head.appendChild(manifestLink);
    console.log(`[FranquiaPWA] Manifest atualizado: ${manifestLink.href}`);
  }, []);

  // Atualizar tema (cores) baseado na franquia
  const updateTheme = useCallback((franquia) => {
    if (!franquia) return;
    
    const root = document.documentElement;
    
    // Definir variáveis CSS para cores da franquia
    root.style.setProperty('--franquia-primary', franquia.cor_primaria || '#1a59ad');
    root.style.setProperty('--franquia-secondary', franquia.cor_secundaria || '#ffffff');
    root.style.setProperty('--franquia-text', franquia.cor_texto || '#ffffff');
    
    // Atualizar meta theme-color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = franquia.cor_primaria || '#1a59ad';
    }
    
    console.log('[FranquiaPWA] Tema atualizado:', {
      primary: franquia.cor_primaria,
      secondary: franquia.cor_secundaria
    });
  }, []);

  // Efeito inicial - detectar franquia
  useEffect(() => {
    // Se foi passado slug como parâmetro, usar ele
    if (slugParam) {
      setFranquiaSlug(slugParam);
      loadFranquiaData(slugParam);
      setPwaType('transmill');
    } else {
      const slug = detectFranquiaFromURL();
      if (slug) {
        loadFranquiaData(slug);
      } else {
        setLoading(false);
      }
    }
    
    // Listener para mudanças de rota (SPA)
    const handlePopState = () => {
      const newSlug = detectFranquiaFromURL();
      if (newSlug && newSlug !== franquiaSlug) {
        loadFranquiaData(newSlug);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [detectFranquiaFromURL, loadFranquiaData, franquiaSlug, slugParam]);

  // Efeito para atualizar manifest e tema quando dados carregam
  useEffect(() => {
    if (franquiaSlug && pwaType) {
      updateManifestLink(franquiaSlug, pwaType);
    }
  }, [franquiaSlug, pwaType, updateManifestLink]);

  useEffect(() => {
    if (franquiaData) {
      updateTheme(franquiaData);
    }
  }, [franquiaData, updateTheme]);

  // Verificar se estamos em contexto de franquia
  const isFranquiaContext = Boolean(franquiaSlug);

  return {
    // Estado
    franquiaSlug,
    franquiaData,
    pwaType,
    loading,
    error,
    isFranquiaContext,
    isInstallable,
    
    // Métodos
    installPWA,
    updateManifestLink,
    updateTheme,
    detectFranquiaFromURL
  };
};

export default useFranquiaPWA;
