import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';

const QRScannerNew = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startScanning = async () => {
    try {
      console.log('Iniciando scanner...');
      
      // Criar instância Html5Qrcode
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Configuração da câmera
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      // Callback de sucesso
      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code detectado: ${decodedText}`, decodedResult);
        toast.success('✅ QR Code lido!');
        
        // Parar scanner
        html5QrCode.stop().then(() => {
          console.log('Scanner parado');
        }).catch(err => {
          console.error('Erro ao parar:', err);
        });
        
        // Chamar callback
        onScan(decodedText);
      };

      console.log('Solicitando câmera...');
      toast.loading('Solicitando acesso à câmera...', { id: 'camera-request' });
      
      // Iniciar câmera - isso vai solicitar permissão
      await html5QrCode.start(
        { facingMode: "environment" }, // Câmera traseira em mobile
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Ignorar erros de scanning contínuo
        }
      );

      console.log('Câmera iniciada com sucesso!');
      setCameraStarted(true);
      setIsScanning(true);
      toast.success('📷 Câmera ativa! Aponte para o QR Code', { id: 'camera-request' });
      
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      setError(err.message || err.toString());
      toast.error(`Erro: ${err.message}`, { id: 'camera-request' });
    }
  };

  useEffect(() => {
    // Iniciar automaticamente quando componente montar
    startScanning();

    // Cleanup
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(err => {
          console.error('Erro ao limpar:', err);
        });
      }
    };
  }, []);

  const handleTestQR = () => {
    const testQRData = JSON.stringify({
      type: 'payment',
      amount: 50.00,
      merchant_id: 'test_merchant_123',
      merchant_name: 'Loja Teste'
    });
    onScan(testQRData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Camera className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Scanner QR Code</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Instruções */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">📱 Como usar:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Permita acesso à câmera quando solicitado</li>
              <li>2. Aponte a câmera para o QR Code do lojista</li>
              <li>3. Aguarde a leitura automática</li>
            </ol>
          </div>

          {/* Scanner Area */}
          <div className="relative">
            {error ? (
              <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="mx-auto mb-2 text-red-600" size={48} />
                <p className="text-red-800 font-semibold mb-2">Erro ao iniciar câmera</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button onClick={startScanning} className="w-full">
                    🔄 Tentar Novamente
                  </Button>
                  <p className="text-xs text-gray-600">
                    Verifique se você concedeu permissão para a câmera no seu navegador
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div 
                  id="qr-reader" 
                  className="w-full min-h-[300px] bg-black rounded-lg"
                  style={{ 
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                />
                {!cameraStarted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-white text-center">
                      <Camera size={48} className="mx-auto mb-2 animate-pulse" />
                      <p>Aguardando permissão...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dica */}
          {!error && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>📱 Importante:</strong> Quando o navegador solicitar, clique em "Permitir" para usar a câmera.
              </p>
            </div>
          )}

          {/* Botão de teste */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTestQR}
              className="w-full"
            >
              🧪 Usar QR de Teste (R$ 50,00)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QRScannerNew;
