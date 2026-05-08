import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFranquiaRoute, setIsFranquiaRoute] = useState(false);

  // Verificar se é rota de franquia (onde PWA é permitido)
  useEffect(() => {
    const checkRoute = () => {
      const pathname = window.location.pathname;
      const isFranquia = pathname.includes('/franquia/') || 
                         pathname.includes('/pwa/') ||
                         pathname.includes('/cliente/');
      setIsFranquiaRoute(isFranquia);
    };
    
    checkRoute();
    
    // Listener para mudanças de rota
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);
  
  // PWA só deve aparecer em rotas de franquias/unidades, NÃO no admin
  if (!isFranquiaRoute) {
    return null;
  }

  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (!installed) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-[#005B9C] to-[#0077CC] text-white p-4 rounded-lg shadow-lg border-2 border-[#EEEEEE]">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">
              Instalar Transmill
            </h3>
            <p className="text-xs mt-1 opacity-90">
              Instale nosso app para uma experiência mais rápida e acesso offline!
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center space-x-1 bg-white text-[#005B9C] px-3 py-1 rounded text-xs font-medium hover:bg-[#EEEEEE] transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Instalar</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;