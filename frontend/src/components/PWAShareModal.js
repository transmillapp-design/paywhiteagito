import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink,
  Download,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { toast } from 'sonner';

/**
 * Componente para compartilhar o link do PWA da unidade com clientes
 * Exibe QR Code e link para download
 */
const PWAShareModal = ({ isOpen, onClose, unidade }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  // Gerar slug da unidade
  const getSlug = () => {
    if (!unidade) return '';
    const nome = unidade.nome_fantasia || unidade.company_name || unidade.full_name || '';
    return nome.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  };

  // URL do PWA
  const pwaUrl = `https://app.transmill.com.br/unidade/${getSlug()}/pwa-clientes`;

  // Gerar QR Code usando API gratuita (QRServer)
  useEffect(() => {
    if (isOpen && unidade) {
      setQrLoading(true);
      setQrError(false);
      const slug = getSlug();
      const url = `https://app.transmill.com.br/unidade/${slug}/pwa-clientes`;
      // Usando API do QRServer (gratuita e funcional)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&format=png&margin=10`;
      setQrCodeUrl(qrApiUrl);
    }
  }, [isOpen, unidade]);

  // Copiar link
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pwaUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  // Compartilhar via Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${unidade?.nome_fantasia || 'Unidade'} - Proteção Veicular`,
          text: 'Acesse nosso app de proteção veicular!',
          url: pwaUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Abrir PWA em nova aba
  const handleOpen = () => {
    window.open(pwaUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">PWA para Clientes</CardTitle>
              <CardDescription>
                Compartilhe o app com seus clientes
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-inner border">
              {qrCodeUrl && !qrError ? (
                <>
                  {qrLoading && (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code do PWA"
                    className={`w-48 h-48 ${qrLoading ? 'hidden' : 'block'}`}
                    data-testid="pwa-qrcode"
                    onLoad={() => setQrLoading(false)}
                    onError={() => {
                      setQrLoading(false);
                      setQrError(true);
                    }}
                  />
                </>
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-100 rounded">
                  <QrCode size={48} className="text-gray-400" />
                  {qrError && (
                    <p className="text-xs text-red-500 mt-2">Erro ao carregar QR</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instruções */}
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">Seus clientes podem:</p>
            <p>1. Escanear o QR Code com a câmera</p>
            <p>2. Acessar o link e adicionar à tela inicial</p>
          </div>

          {/* Link */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
            <input
              type="text"
              value={pwaUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
              data-testid="pwa-url-input"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="shrink-0"
              data-testid="pwa-copy-btn"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} />
              )}
            </Button>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleOpen}
              className="flex items-center gap-2"
              data-testid="pwa-open-btn"
            >
              <ExternalLink size={16} />
              Abrir PWA
            </Button>
            <Button
              onClick={handleShare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              data-testid="pwa-share-btn"
            >
              <Share2 size={16} />
              Compartilhar
            </Button>
          </div>

          {/* Dica */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium flex items-center gap-2">
              <Download size={16} />
              Dica para instalação:
            </p>
            <p className="mt-1 text-blue-600">
              Ao abrir o link no celular, o cliente pode clicar em "Adicionar à tela inicial" 
              para instalar o app como um aplicativo nativo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAShareModal;
