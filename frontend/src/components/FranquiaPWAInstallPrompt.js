/**
 * FranquiaPWAInstallPrompt - Prompt de instalação PWA para franquias
 * Usa a identidade visual (logo, cores) da franquia
 */

import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useFranquiaPWA } from '../hooks/useFranquiaPWA';
import { Download, X, Smartphone, Shield } from 'lucide-react';

const FranquiaPWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { franquiaData, pwaType, isFranquiaContext, loading } = useFranquiaPWA();
  
  // Verificar localStorage para não mostrar se já foi dispensado recentemente
  const checkDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (dismissedTime > oneDayAgo) {
        return true;
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
    return false;
  };
  
  const [isDismissed, setIsDismissed] = useState(checkDismissed);

  // Não mostrar se:
  // - Não está em contexto de franquia
  // - Ainda está carregando
  // - Já está instalado
  // - Não é instalável
  // - Foi dispensado
  if (!isFranquiaContext || loading || isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (!installed) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Cores da franquia ou padrão
  const primaryColor = franquiaData?.cor_primaria || '#1a59ad';
  const secondaryColor = franquiaData?.cor_secundaria || '#ffffff';
  const textColor = franquiaData?.cor_texto || '#ffffff';
  const franquiaNome = franquiaData?.nome || 'Transmill';
  const franquiaLogo = franquiaData?.logo_url;

  // Nome e descrição baseados no tipo de PWA
  const pwaName = pwaType === 'protecao' 
    ? `${franquiaNome} - Proteção` 
    : `${franquiaNome}`;
  
  const pwaDescription = pwaType === 'protecao'
    ? 'Instale para acessar seu contrato, solicitar assistência 24h e muito mais!'
    : 'Instale para acesso rápido a todos os serviços!';

  const Icon = pwaType === 'protecao' ? Shield : Smartphone;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div 
        className="p-4 rounded-lg shadow-lg border-2"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          color: textColor,
          borderColor: secondaryColor
        }}
      >
        <div className="flex items-start space-x-3">
          {/* Logo ou ícone */}
          <div className="flex-shrink-0">
            {franquiaLogo ? (
              <img 
                src={franquiaLogo} 
                alt={franquiaNome}
                className="h-10 w-10 rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: secondaryColor }}
              >
                <Icon className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">
              Instalar {pwaName}
            </h3>
            <p className="text-xs mt-1 opacity-90">
              {pwaDescription}
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: secondaryColor, 
                  color: primaryColor 
                }}
              >
                <Download className="h-3 w-3" />
                <span>Instalar App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ 
                  color: `${textColor}cc`,
                  ':hover': { color: textColor }
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = `${textColor}20`}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Agora não
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 transition-colors"
            style={{ color: `${textColor}99` }}
            onMouseOver={(e) => e.target.style.color = textColor}
            onMouseOut={(e) => e.target.style.color = `${textColor}99`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Badge do tipo de PWA */}
        <div className="mt-3 pt-2 border-t" style={{ borderColor: `${textColor}33` }}>
          <div className="flex items-center justify-between text-xs" style={{ color: `${textColor}cc` }}>
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {pwaType === 'protecao' ? 'PWA Proteção Veicular' : 'PWA Sistema'}
            </span>
            <span>{franquiaNome}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranquiaPWAInstallPrompt;
