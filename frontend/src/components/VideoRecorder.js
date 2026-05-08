import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  ArrowLeft,
  Video,
  Camera,
  RefreshCw,
  Square,
  Play,
  Check,
  X,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

const VideoRecorder = () => {
  const navigate = useNavigate();
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [error, setError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Form data
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [productId, setProductId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    free_video_max_duration: 30,
    paid_video_min_duration: 30,
    paid_video_max_duration: 60,
    paid_video_price: 5.0
  });

  useEffect(() => {
    fetchSettings();
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);
  
  // Update video src when previewing
  useEffect(() => {
    if (isPreviewing && recordedVideo && videoRef.current) {
      console.log('Setting video src for preview:', recordedVideo.url);
      setVideoLoading(true);
      
      const videoElement = videoRef.current;
      
      // Clear previous sources
      videoElement.srcObject = null;
      videoElement.src = recordedVideo.url;
      
      // Add event listeners
      const handleLoadedData = () => {
        console.log('Video loaded successfully');
        setVideoLoading(false);
      };
      
      const handleError = (e) => {
        console.error('Error loading video:', e);
        setVideoLoading(false);
        toast.error('Erro ao carregar preview do vídeo');
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleError);
      
      videoElement.load();
      videoElement.play().catch(err => {
        console.error('Error playing preview:', err);
      });
      
      // Cleanup
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
      };
    } else if (!isPreviewing && stream && videoRef.current) {
      console.log('Setting video srcObject for live camera');
      setVideoLoading(false);
      videoRef.current.src = '';
      videoRef.current.srcObject = stream;
    }
  }, [isPreviewing, recordedVideo, stream]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/master/social/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access with facingMode:', facingMode);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted. Stream:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      console.log('Audio tracks:', mediaStream.getAudioTracks());
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Stream assigned to video element');
      }
      
      setError(null);
      toast.success('Câmera conectada!');
    } catch (err) {
      console.error('Error accessing camera:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Não foi possível acessar a câmera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada neste dispositivo.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Câmera não suporta as configurações solicitadas.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'HTTPS é necessário para acessar a câmera.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const startRecording = () => {
    if (!stream) {
      toast.error('Câmera não disponível');
      return;
    }

    chunksRef.current = [];
    
    // Try different codec options for better mobile compatibility
    let options;
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options = { mimeType: 'video/webm;codecs=vp9' };
      console.log('Using VP9 codec');
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options = { mimeType: 'video/webm;codecs=vp8' };
      console.log('Using VP8 codec');
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      options = { mimeType: 'video/webm' };
      console.log('Using default WebM');
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/mp4' };
      console.log('Using MP4');
    } else {
      options = {};
      console.log('Using browser default codec');
    }
    
    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      console.log('MediaRecorder created successfully');
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
      toast.error('Erro ao iniciar gravação: ' + error.message);
      return;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log('Data chunk received:', event.data.size, 'bytes');
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      console.log('Recording stopped, total chunks:', chunksRef.current.length);
      const blob = new Blob(chunksRef.current, { type: options.mimeType || 'video/webm' });
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
      
      if (blob.size === 0) {
        console.error('Blob is empty!');
        toast.error('Erro: vídeo gravado está vazio');
        return;
      }
      
      const videoUrl = URL.createObjectURL(blob);
      console.log('Blob URL created:', videoUrl);
      setRecordedVideo({ blob, url: videoUrl });
      setIsPreviewing(true);
      stopCamera();
    };
    
    mediaRecorderRef.current.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      toast.error('Erro durante gravação');
      setIsRecording(false);
    };

    try {
      mediaRecorderRef.current.start();
      console.log('Recording started');
      setIsRecording(true);
      setDuration(0);

      // Timer
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        // Auto stop at max duration
        if (elapsed >= settings.paid_video_max_duration) {
          stopRecording();
          clearInterval(interval);
        }
      }, 100);

      // Store interval for cleanup
      mediaRecorderRef.current.intervalId = interval;
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Erro ao iniciar gravação: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (mediaRecorderRef.current.intervalId) {
        clearInterval(mediaRecorderRef.current.intervalId);
      }
    }
  };

  const retake = () => {
    setRecordedVideo(null);
    setIsPreviewing(false);
    setDuration(0);
    setDescription('');
    setHashtags('');
    startCamera();
  };

  const handleUpload = async () => {
    if (!recordedVideo) {
      toast.error('Nenhum vídeo gravado');
      return;
    }

    if (duration < 7) {
      toast.error('Vídeo muito curto! Mínimo: 7 segundos');
      return;
    }
    
    // Check blob size before converting
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (recordedVideo.blob.size > maxSize) {
      toast.error(`Vídeo muito grande! Máximo: 50MB. Seu vídeo: ${(recordedVideo.blob.size / 1024 / 1024).toFixed(1)}MB`);
      console.error('Video too large:', recordedVideo.blob.size, 'bytes');
      return;
    }
    
    console.log('Starting upload. Video size:', recordedVideo.blob.size, 'bytes');

    try {
      setUploading(true);

      // Convert blob to base64
      const reader = new FileReader();
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error('Erro ao processar vídeo');
        setUploading(false);
      };
      
      reader.onloadend = async () => {
        try {
          const base64Video = reader.result;
          console.log('Base64 conversion complete. Length:', base64Video.length);
          
          const hashtagsArray = hashtags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

          const requestData = {
            video_data: base64Video,
            duration: duration,
            description: description || undefined,
            hashtags: hashtagsArray,
            product_id: user.user_type === 'lojista' && productId ? productId : undefined,
            service_id: user.user_type === 'service_provider' && serviceId ? serviceId : undefined
          };
          
          console.log('Sending request to backend...');
          console.log('Request data:', {
            ...requestData,
            video_data: `[BASE64 DATA ${base64Video.length} chars]`
          });

          const response = await axios.post(
            `${API}/social/videos`,
            requestData,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000, // 2 minutes timeout
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );
          
          console.log('Backend response:', response.data);

          toast.success(`✅ ${response.data.message}`, {
            description: `+${response.data.points_awarded} pontos ganhos!`
          });

          // Navigate to social feed after short delay
          setTimeout(() => {
            console.log('Navigating to social feed...');
            navigate('/social', { state: { reload: true } });
          }, 1000);
        } catch (error) {
          console.error('Upload error:', error);
          console.error('Error response:', error.response);
          
          if (error.response?.status === 502) {
            toast.error('Servidor temporariamente indisponível. Tente novamente em alguns segundos.');
          } else if (error.response?.data?.detail) {
            toast.error(error.response.data.detail);
          } else if (error.code === 'ECONNABORTED') {
            toast.error('Tempo limite excedido. Vídeo muito grande?');
          } else if (error.code === 'ERR_NETWORK') {
            toast.error('Erro de conexão. Verifique sua internet.');
          } else {
            toast.error('Erro ao publicar vídeo: ' + error.message);
          }
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsDataURL(recordedVideo.blob);
    } catch (error) {
      console.error('Error in handleUpload:', error);
      toast.error('Erro ao preparar vídeo para upload');
      setUploading(false);
    }
  };

  const getVideoCost = () => {
    if (duration <= settings.free_video_max_duration) {
      return 0;
    } else if (duration <= settings.paid_video_max_duration) {
      return settings.paid_video_price;
    }
    return 0;
  };

  const isVideoPaid = duration > settings.free_video_max_duration;
  const videoCost = getVideoCost();
  const canPostPaidVideo = user.user_type !== 'cliente';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#3F5123]' : 'bg-[#FFFFFF]'} shadow-md`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-[#E5D5C3]'
              }`}
              disabled={isRecording}
            >
              <ArrowLeft className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={24} />
            </button>

            <div className="flex items-center gap-2">
              <Camera className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                Gravar Vídeo
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Duration Info */}
        <Card className={`${isDark ? 'bg-[#556B2F] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                  Duração: {duration}s
                </p>
                <p className={`text-xs ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                  {duration <= settings.free_video_max_duration 
                    ? `Grátis até ${settings.free_video_max_duration}s`
                    : `Vídeo pago: R$ ${videoCost.toFixed(2)}`
                  }
                </p>
              </div>
            </div>
            
            {isVideoPaid && !canPostPaidVideo && (
              <Badge className="bg-red-500 text-white">
                <AlertCircle size={14} className="mr-1" />
                Apenas lojistas/prestadores
              </Badge>
            )}
            
            {isVideoPaid && canPostPaidVideo && (
              <Badge className="bg-yellow-500 text-black">
                <DollarSign size={14} />
                R$ {videoCost.toFixed(2)}
              </Badge>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500 border-red-600 p-4 mb-4">
            <div className="flex items-center gap-2 text-white">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Video/Camera View */}
        <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!isPreviewing}
            controls={isPreviewing}
            className="w-full h-full object-cover"
          />

          {/* Video Loading Indicator */}
          {videoLoading && isPreviewing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
              <p className="text-white text-sm">Carregando preview...</p>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-bold">REC {duration}s</span>
            </div>
          )}

          {/* Duration Timer (Large) */}
          {isRecording && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white opacity-30">
              {duration}s
            </div>
          )}

          {/* Max Duration Warning */}
          {isRecording && duration >= settings.paid_video_max_duration - 5 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full animate-bounce">
              Encerrando em {settings.paid_video_max_duration - duration}s
            </div>
          )}
        </div>

        {/* Controls */}
        {!isPreviewing ? (
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              disabled={isRecording}
              className={`p-4 rounded-full ${
                isDark ? 'bg-[#556B2F]' : 'bg-white'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
            </button>

            {/* Record/Stop Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!error}
              className={`p-6 rounded-full ${
                isRecording
                  ? 'bg-red-500'
                  : isDark
                    ? 'bg-gradient-to-br from-[#005B9C] to-[#E5C34A]'
                    : 'bg-gradient-to-br from-[#005B9C] to-[#005B9C]'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 transition-transform`}
            >
              {isRecording ? (
                <Square className="text-white" size={32} />
              ) : (
                <Video className={isDark ? 'text-[#2A3618]' : 'text-white'} size={32} />
              )}
            </button>

            {/* Placeholder for symmetry */}
            <div className="w-16"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Form */}
            <Card className={`${isDark ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                    Descrição (opcional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte sobre seu vídeo..."
                    rows={3}
                    className={isDark ? 'bg-[#2A3618] border-[#556B2F] text-white' : ''}
                    maxLength={500}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                    {description.length}/500 caracteres
                  </p>
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                    Hashtags (separadas por vírgula)
                  </label>
                  <Input
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#transmill, #video, #exemplo"
                    className={isDark ? 'bg-[#2A3618] border-[#556B2F] text-white' : ''}
                  />
                </div>

                {user.user_type === 'lojista' && (
                  <div>
                    <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                      ID do Produto (opcional)
                    </label>
                    <Input
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="ID do produto para link"
                      className={isDark ? 'bg-[#2A3618] border-[#556B2F] text-white' : ''}
                    />
                  </div>
                )}

                {user.user_type === 'service_provider' && (
                  <div>
                    <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                      ID do Serviço (opcional)
                    </label>
                    <Input
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      placeholder="ID do serviço para agendamento"
                      className={isDark ? 'bg-[#2A3618] border-[#556B2F] text-white' : ''}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={retake}
                variant="outline"
                className={`flex-1 ${
                  isDark
                    ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]'
                    : 'border-[#005B9C] text-[#005B9C]'
                }`}
                disabled={uploading}
              >
                <X size={20} className="mr-2" />
                Regravar
              </Button>

              <Button
                onClick={handleUpload}
                className={`flex-1 ${
                  isDark
                    ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                    : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
                }`}
                disabled={uploading || (isVideoPaid && !canPostPaidVideo)}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <Check size={20} className="mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>

            {/* Cost Info */}
            {videoCost > 0 && canPostPaidVideo && (
              <Card className="bg-yellow-500 border-yellow-600 p-3">
                <div className="flex items-center gap-2 text-black">
                  <DollarSign size={20} />
                  <p className="text-sm font-semibold">
                    Este vídeo custará R$ {videoCost.toFixed(2)}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
