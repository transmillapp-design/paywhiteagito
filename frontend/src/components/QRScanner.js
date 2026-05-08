import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Camera, CameraOff, QrCode, X, Check, Settings, Smartphone } from 'lucide-react';
import jsQR from 'jsqr';

const QRScanner = ({ onScanResult, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionTested, setPermissionTested] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    setDebugLogs(prev => [...prev.slice(-10), logEntry]); // Keep last 10 logs
    console.log('DEBUG:', logEntry);
  };

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      stopScanning();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Force camera permission request
  const testCameraPermissions = async () => {
    try {
      setError('');
      setPermissionTested(true);
      addDebugLog('Iniciando teste de permissões');
      
      console.log('Testing camera permissions...');
      toast.info('🔍 Testando acesso à câmera...', { duration: 3000 });
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices não disponível');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não disponível');
      }
      
      addDebugLog('APIs de mídia disponíveis');
      
      // Force permission request with user interaction
      const constraints = {
        video: {
          facingMode: 'environment'
        },
        audio: false
      };
      
      addDebugLog(`Solicitando getUserMedia: ${JSON.stringify(constraints)}`);
      console.log('Requesting getUserMedia with:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      addDebugLog(`Stream obtido: ${stream.getTracks().length} tracks`);
      console.log('Permission granted! Stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      
      // Get detailed info about the camera
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        const settings = track.getSettings();
        addDebugLog(`Câmera: ${settings.width}x${settings.height}, ${track.label}`);
      }
      
      // Stop stream immediately
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label, track.kind);
        addDebugLog(`Parando track: ${track.label}`);
        track.stop();
      });
      
      setHasPermission(true);
      toast.success('✅ PERMISSÃO CONCEDIDA! Agora clique em "Iniciar Scanner"', { 
        duration: 5000 
      });
      
    } catch (err) {
      console.error('Permission test failed:', err);
      addDebugLog(`ERRO no teste: ${err.name} - ${err.message}`);
      setHasPermission(false);
      
      let message = '';
      if (err.name === 'NotAllowedError') {
        message = `🚫 ACESSO À CÂMERA NEGADO!\n\n${isMobile ? '📱 NO CELULAR:' : '🖥️ NO DESKTOP:'}\n\n${isMobile ? 
          '1. Verifique o ícone 🔒 ou 📷 na barra de endereço\n' +
          '2. Toque nele e selecione "Permitir câmera"\n' + 
          '3. OU vá em Configurações do navegador > Permissões\n' +
          '4. Recarregue a página e tente novamente' :
          '1. Clique no ícone da câmera na barra de endereço\n' +
          '2. Selecione "Sempre permitir neste site"\n' +
          '3. Recarregue a página'}`;
      } else if (err.name === 'NotFoundError') {
        message = '📷 Nenhuma câmera encontrada neste dispositivo.\n\nVerifique se:\n• O dispositivo tem câmera\n• A câmera não está em uso por outro app';
      } else if (err.name === 'NotSupportedError') {
        message = `❌ Navegador não suporta acesso à câmera.\n\n${isMobile ? 
          'Tente usar:\n• Chrome para Android\n• Safari no iOS\n• Firefox Mobile' :
          'Tente usar:\n• Google Chrome\n• Mozilla Firefox\n• Safari'}`;
      } else {
        message = `⚠️ Erro técnico: ${err.message}\n\nTente:\n1. Recarregar a página\n2. Usar outro navegador\n3. Verificar se a câmera funciona em outros sites`;
      }
      
      setError(message);
      toast.error('❌ Falha no teste de permissões');
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setPermissionTested(true);
      setHasPermission(true); // Marcar como tendo permissão ao tentar iniciar
      addDebugLog('Iniciando processo de scanner');
      console.log('Starting camera scanning...');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia não disponível neste navegador');
      }

      toast.info('📷 Solicitando acesso à câmera...', { duration: 2000 });
      addDebugLog('Configurando constraints');

      // Android-specific constraints
      if (isMobile) {
        // Try multiple constraint configurations for Android
        const androidConstraints = [
          // First try: Modern Android approach
          {
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15, max: 30 }
            },
            audio: false
          },
          // Fallback 1: Less restrictive
          {
            video: {
              facingMode: 'environment',
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 }
            },
            audio: false
          },
          // Fallback 2: Very basic
          {
            video: {
              facingMode: 'environment'
            },
            audio: false
          },
          // Fallback 3: Any camera
          {
            video: true,
            audio: false
          }
        ];

        let stream = null;
        let constraintUsed = null;

        for (let i = 0; i < androidConstraints.length; i++) {
          try {
            addDebugLog(`Tentando configuração ${i + 1}/4`);
            console.log(`Trying Android constraint ${i + 1}:`, androidConstraints[i]);
            stream = await navigator.mediaDevices.getUserMedia(androidConstraints[i]);
            constraintUsed = i + 1;
            addDebugLog(`SUCESSO com configuração ${i + 1}!`);
            console.log(`Success with constraint ${i + 1}!`);
            break;
          } catch (err) {
            addDebugLog(`Config ${i + 1} falhou: ${err.name}`);
            console.log(`Constraint ${i + 1} failed:`, err.name);
            if (i === androidConstraints.length - 1) {
              throw err;
            }
          }
        }

        if (!stream) {
          throw new Error('Nenhuma configuração de câmera funcionou');
        }

        console.log(`Using constraint configuration ${constraintUsed}`);
        setStream(stream);
        setDebugInfo(`Câmera conectada (config ${constraintUsed})`);
        addDebugLog(`Stream obtido com config ${constraintUsed}`);

      } else {
        // Desktop constraints
        addDebugLog('Configurando para desktop');
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(stream);
      }
      
      // Attach stream to video element
      if (videoRef.current && stream) {
        addDebugLog('🎯 Conectando stream ao elemento de vídeo');
        console.log('Attaching stream to video element...');
        
        const video = videoRef.current;
        
        // Stop existing streams
        if (video.srcObject) {
          const existingStream = video.srcObject;
          existingStream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
        
        // Configure video element
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;
        video.style.display = 'block';
        
        addDebugLog('📹 Configurando elemento de vídeo');
        
        // Attach stream to video
        video.srcObject = stream;
        
        // Force video to load and play
        addDebugLog('▶️ Forçando reprodução do vídeo');
        try {
          await video.load();
          await video.play();
          addDebugLog('✅ Video.play() executado com sucesso');
        } catch (playError) {
          addDebugLog(`⚠️ Erro no play: ${playError.message}`);
          // Continuar mesmo com erro
        }
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 20;
          
          const checkVideo = () => {
            attempts++;
            addDebugLog(`⏳ Verificando vídeo: tentativa ${attempts}/${maxAttempts}`);
            
            if (video.readyState >= video.HAVE_ENOUGH_DATA) {
              addDebugLog(`✅ Vídeo pronto: ${video.videoWidth}x${video.videoHeight}`);
              setDebugInfo(`✅ Câmera ativa: ${video.videoWidth}x${video.videoHeight}`);
              resolve(true);
            } else if (attempts < maxAttempts) {
              setTimeout(checkVideo, 200);
            } else {
              addDebugLog('❌ Timeout aguardando vídeo');
              reject(new Error('Video timeout'));
            }
          };
          
          // Listen to video events
          video.addEventListener('loadedmetadata', () => {
            addDebugLog(`📡 Video: loadedmetadata - ${video.videoWidth}x${video.videoHeight}`);
            checkVideo();
          });
          
          video.addEventListener('loadeddata', () => {
            addDebugLog(`📡 Video: loadeddata - readyState: ${video.readyState}`);
            checkVideo();
          });
          
          video.addEventListener('canplay', () => {
            addDebugLog('📡 Video: canplay - vídeo pode ser reproduzido');
            checkVideo();
          });
          
          video.addEventListener('playing', () => {
            addDebugLog('📡 Video: playing - vídeo está tocando!');
            checkVideo();
          });
          
          // Log video element state
          addDebugLog(`📊 Estado inicial: readyState=${video.readyState}, networkState=${video.networkState}`);
          addDebugLog(`📊 Dimensões: ${video.videoWidth}x${video.videoHeight}`);
          
          // Start checking immediately
          setTimeout(checkVideo, 100);
        });
      }
      
      setIsScanning(true);
      addDebugLog('✅ Scanner ativado - iniciando detecção');
      toast.success('📷 Câmera ativa! Aponte para o QR Code', { duration: 3000 });
      
      // Start QR scanning
      scanForQRCode();
      
    } catch (err) {
      console.error('Error starting Android camera:', err);
      addDebugLog(`ERRO FATAL: ${err.name} - ${err.message}`);
      let errorMessage = '';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '🚫 Permissão negada. Recarregue a página e teste as permissões novamente.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '📷 Câmera não encontrada no Android';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '📷 Câmera em uso. Feche outros apps que usam câmera e tente novamente.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '⚙️ Configuração de câmera não suportada neste Android';
      } else {
        errorMessage = `❌ Erro Android: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsScanning(false);
      toast.error('Erro na câmera Android');
    }
  };

  const stopScanning = () => {
    console.log('Stopping camera...');
    addDebugLog('🛑 Parando scanner');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label);
        addDebugLog(`Parando track: ${track.label}`);
        track.stop();
      });
      setStream(null);
    }
    
    // Clean up hidden video if exists
    if (window.cleanupHiddenVideo) {
      window.cleanupHiddenVideo();
      window.cleanupHiddenVideo = null;
    }
    
    // Reset canvas if used
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.style.display = 'none';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Show video element again
    if (videoRef.current) {
      videoRef.current.style.display = 'block';
    }
    
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && isScanning) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width > 0 && canvas.height > 0) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            console.log("QR Code detected:", code.data);
            stopScanning();
            onScanResult(code.data);
            toast.success('✅ QR Code escaneado!');
            return;
          }
        }
        
        requestAnimationFrame(scan);
      } else if (isScanning) {
        requestAnimationFrame(scan);
      }
    };
    
    requestAnimationFrame(scan);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanResult(manualCode.trim());
      toast.success('Código inserido manualmente!');
    }
  };

  const handleTestQRCode = () => {
    const testCode = 'transmill_' + btoa(JSON.stringify({
      merchant_id: 'test-merchant',
      merchant_name: 'Loja Teste',
      amount: 50.00,
      cashback_rate: 5.0,
      timestamp: Date.now()
    }));
    onScanResult(testCode);
    toast.success('QR Code de teste usado!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <QrCode size={20} />
              <span>Scanner QR Code</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-qr-scanner"
            >
              <X size={16} />
            </Button>
          </div>
          <CardDescription>
            Escaneie o QR Code do lojista para pagamento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm whitespace-pre-line">
              <strong>❌ Erro:</strong>
              <br />
              {error}
            </div>
          )}

          {/* Device Info */}
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-700">
              <Smartphone className="inline mr-1" size={16} />
              {isMobile ? 'Android 14 detectado' : 'Desktop detectado'}
            </p>
            {hasPermission && (
              <p className="text-xs text-green-600 mt-1">✅ Permissão concedida</p>
            )}
            {debugInfo && (
              <p className="text-xs text-blue-600 mt-1">{debugInfo}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="mt-2 text-xs"
            >
              {showDebug ? 'Ocultar' : 'Mostrar'} Debug
            </Button>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <p className="font-bold text-yellow-800 mb-2">🔧 Logs de Debug (Android):</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {debugLogs.map((log, index) => (
                  <p key={index} className="text-yellow-700 font-mono text-xs">
                    {log}
                  </p>
                ))}
                {debugLogs.length === 0 && (
                  <p className="text-yellow-600">Nenhum log ainda...</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugLogs([])}
                className="mt-2 text-xs"
              >
                Limpar Logs
              </Button>
            </div>
          )}

          {/* Camera Section */}
          <div className="space-y-4">
            {!isScanning ? (
              <>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>📷 COMO USAR:</strong>
                  </p>
                  <div className="text-xs text-blue-700 space-y-2">
                    <p><strong>1.</strong> Clique "Escanear Agora"</p>
                    <p><strong>2.</strong> Permita acesso à câmera quando solicitado</p>
                    <p><strong>3.</strong> Aponte para o QR Code</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={startScanning}
                    className="w-full btn-primary text-lg py-6"
                    data-testid="start-camera-btn"
                  >
                    <Camera size={24} />
                    <span>📱 Escanear Agora</span>
                  </Button>
                  
                  {isMobile && (
                    <div className="text-xs text-center text-gray-600 px-4">
                      <p>💡 Dica: Se a câmera não abrir, toque no ícone 🔒 na barra de endereço e permita o acesso</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-medium text-green-800">
                      📷 Câmera Ativa - Aponte para o QR Code
                    </p>
                  </div>
                  
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      style={{ display: 'block', width: '100%', height: '16rem' }}
                      playsInline
                      webkit-playsinline="true"
                      muted
                      autoPlay
                    />
                    <canvas 
                      ref={canvasRef} 
                      className="absolute top-0 left-0 w-full h-64 bg-gray-900 rounded-lg object-cover hidden"
                    />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="w-full"
                  >
                    <CameraOff size={16} />
                    <span>Parar Scanner</span>
                  </Button>
                  
                  {debugInfo.includes('sem dimensões') && (
                    <Button
                      onClick={() => {
                        addDebugLog('🔄 Tentando corrigir renderização');
                        if (videoRef.current && stream) {
                          const video = videoRef.current;
                          video.srcObject = null;
                          setTimeout(() => {
                            video.srcObject = stream;
                            video.load();
                            video.play().catch(console.error);
                            addDebugLog('Stream reaplicado ao vídeo');
                          }, 500);
                        }
                      }}
                      className="w-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                      🔧 Corrigir Renderização
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Manual Input */}
          <div className="border-t pt-4 space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowManual(!showManual)}
              className="w-full"
            >
              {showManual ? 'Ocultar' : 'Inserir'} Código Manual
            </Button>

            {showManual && (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-qr">Código QR ou Digitável</Label>
                  <Input
                    id="manual-qr"
                    placeholder="Cole ou digite o código aqui"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="input-field"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full btn-primary"
                >
                  <Check size={16} />
                  <span>Confirmar Código</span>
                </Button>
              </form>
            )}
          </div>

          {/* Test QR */}
          <div className="border-t pt-4">
            <Button
              onClick={handleTestQRCode}
              variant="outline"
              className="w-full"
            >
              <QrCode size={16} />
              <span>Usar QR de Teste (R$ 50,00)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;