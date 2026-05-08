import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Shield, 
  FileText, 
  Headphones, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus,
  Car,
  Phone,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  User,
  LogOut,
  Home,
  Settings,
  Wrench,
  Key,
  Fuel,
  Battery,
  Bell,
  BellOff,
  Download,
  X,
  Smartphone,
  Share,
  Camera,
  Navigation,
  Upload,
  Check,
  ShieldAlert,
  Truck,
  Loader2,
  Mail,
  Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const API = process.env.REACT_APP_BACKEND_URL;

// ===== PUSH NOTIFICATIONS HELPER =====
const pushNotificationHelper = {
  // Verificar se push é suportado
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Registrar service worker do PWA
  registerServiceWorker: async () => {
    if (!pushNotificationHelper.isSupported()) return null;
    
    try {
      const registration = await navigator.serviceWorker.register('/pwa-sw.js', {
        scope: '/'
      });
      console.log('[PWA] Service Worker registrado:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[PWA] Erro ao registrar SW:', error);
      return null;
    }
  },

  // Verificar permissão atual
  getPermission: () => {
    if (!pushNotificationHelper.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  // Solicitar permissão
  requestPermission: async () => {
    if (!pushNotificationHelper.isSupported()) return 'unsupported';
    
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[PWA] Erro ao solicitar permissão:', error);
      return 'denied';
    }
  },

  // Converter base64 para Uint8Array (necessário para VAPID)
  urlBase64ToUint8Array: (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // Inscrever para push notifications
  subscribe: async (token, unidadeSlug) => {
    if (!pushNotificationHelper.isSupported()) return null;

    try {
      // Buscar chave pública VAPID
      const vapidResponse = await axios.get(`${API}/api/pwa/vapid-public-key`);
      if (!vapidResponse.data.success) {
        throw new Error('Não foi possível obter chave VAPID');
      }
      const vapidPublicKey = vapidResponse.data.public_key;

      // Obter registration do service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: pushNotificationHelper.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Enviar subscription para o backend
      const subscriptionJSON = subscription.toJSON();
      await axios.post(`${API}/api/pwa/push/subscribe`, {
        subscription: subscriptionJSON,
        unidade_slug: unidadeSlug
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[PWA] Push subscription ativada');
      return subscription;
    } catch (error) {
      console.error('[PWA] Erro ao inscrever push:', error);
      throw error;
    }
  },

  // Cancelar inscrição
  unsubscribe: async (token) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await axios.post(`${API}/api/pwa/push/unsubscribe`, {
          endpoint: subscription.endpoint
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log('[PWA] Push subscription cancelada');
      return true;
    } catch (error) {
      console.error('[PWA] Erro ao cancelar push:', error);
      return false;
    }
  }
};

const PWAUnidadeLabelview = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [unidade, setUnidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Push Notifications
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Form de login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Dados do cliente
  const [protecaoData, setProtecaoData] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  
  // Modal de solicitação de serviço
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [servicePhoto, setServicePhoto] = useState(null);
  const [servicePhotoPreview, setServicePhotoPreview] = useState(null);
  const [serviceLocation, setServiceLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [sendingService, setSendingService] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');

  // Cores padrão (serão substituídas pelas cores da unidade)
  const [cores, setCores] = useState({
    primaria: '#1a1a2e',
    secundaria: '#2fa31c'
  });

  // PWA Install - Detectar se pode instalar
  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      } else if (window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };
    checkIfInstalled();

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      toast.success('App instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Função para instalar o PWA
  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Mostrar instruções manuais para iOS ou navegadores sem suporte
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.info('Para instalar: toque no ícone de compartilhar e depois em "Adicionar à Tela de Início"', {
          duration: 6000
        });
      } else {
        toast.info('Para instalar: acesse o menu do navegador e selecione "Instalar app" ou "Adicionar à tela inicial"', {
          duration: 6000
        });
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Buscar dados da unidade pelo slug
  useEffect(() => {
    const carregarUnidade = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/api/pwa/unidade/${slug}`);
        
        if (response.data.success && response.data.unidade) {
          const unidadeData = response.data.unidade;
          setUnidade(unidadeData);
          
          // Definir cores da unidade
          setCores({
            primaria: unidadeData.cor_primaria || '#1a1a2e',
            secundaria: unidadeData.cor_secundaria || '#2fa31c'
          });
        } else {
          toast.error('Unidade não encontrada');
        }
      } catch (error) {
        console.error('Erro ao carregar unidade:', error);
        toast.error('Erro ao carregar dados da unidade');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      carregarUnidade();
    }
  }, [slug]);

  // Verificar se já está logado
  useEffect(() => {
    const token = localStorage.getItem(`pwa_token_${slug}`);
    const savedUser = localStorage.getItem(`pwa_user_${slug}`);
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      carregarDadosCliente(token);
      
      // Verificar status das push notifications
      checkPushNotificationStatus();
    }
  }, [slug]);

  // Verificar status das push notifications
  const checkPushNotificationStatus = async () => {
    if (!pushNotificationHelper.isSupported()) {
      setPushEnabled(false);
      return;
    }

    try {
      const permission = pushNotificationHelper.getPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } else {
        setPushEnabled(false);
      }
    } catch (error) {
      console.error('[PWA] Erro ao verificar push status:', error);
      setPushEnabled(false);
    }
  };

  // Ativar/Desativar Push Notifications
  const togglePushNotifications = async () => {
    const token = localStorage.getItem(`pwa_token_${slug}`);
    if (!token) {
      toast.error('Faça login para ativar notificações');
      return;
    }

    setPushLoading(true);

    try {
      if (pushEnabled) {
        // Desativar
        await pushNotificationHelper.unsubscribe(token);
        setPushEnabled(false);
        toast.success('Notificações desativadas');
      } else {
        // Ativar - primeiro registrar service worker
        await pushNotificationHelper.registerServiceWorker();
        
        // Solicitar permissão
        const permission = await pushNotificationHelper.requestPermission();
        
        if (permission !== 'granted') {
          toast.error('Permissão para notificações negada');
          return;
        }
        
        // Inscrever
        await pushNotificationHelper.subscribe(token, slug);
        setPushEnabled(true);
        toast.success('Notificações ativadas! Você receberá avisos da unidade.');
      }
    } catch (error) {
      console.error('[PWA] Erro ao alternar push:', error);
      toast.error('Erro ao configurar notificações');
    } finally {
      setPushLoading(false);
    }
  };

  // Carregar dados do cliente logado
  const carregarDadosCliente = async (token) => {
    try {
      // Buscar dados da proteção
      const protecaoResponse = await axios.get(`${API}/api/pwa/minha-protecao`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (protecaoResponse.data.success) {
        setProtecaoData(protecaoResponse.data.protecao);
      }
      
      // Buscar solicitações
      const solicitacoesResponse = await axios.get(`${API}/api/pwa/minhas-solicitacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (solicitacoesResponse.data.success) {
        setSolicitacoes(solicitacoesResponse.data.solicitacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  };

  // Fazer login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error('Preencha email e senha');
      return;
    }
    
    try {
      setLoginLoading(true);
      
      const response = await axios.post(`${API}/api/pwa/login`, {
        email: loginData.email,
        password: loginData.password,
        unidade_slug: slug
      });
      
      if (response.data.success && response.data.access_token) {
        const token = response.data.access_token;
        const userData = response.data.user;
        
        // Salvar no localStorage (específico por unidade)
        localStorage.setItem(`pwa_token_${slug}`, token);
        localStorage.setItem(`pwa_user_${slug}`, JSON.stringify(userData));
        
        setUser(userData);
        setIsLoggedIn(true);
        
        // Carregar dados do cliente
        carregarDadosCliente(token);
        
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fazer logout
  const handleLogout = () => {
    localStorage.removeItem(`pwa_token_${slug}`);
    localStorage.removeItem(`pwa_user_${slug}`);
    setUser(null);
    setIsLoggedIn(false);
    setProtecaoData(null);
    setSolicitacoes([]);
    setActiveTab('home');
    toast.success('Logout realizado');
  };

  // Navegar para nova cotação (vinculada à unidade)
  const handleNovaCotacao = () => {
    if (unidade?.id) {
      navigate(`/cotacao/${unidade.id}`);
    } else {
      toast.error('Unidade não encontrada');
    }
  };

  // Primeiro acesso = Nova Cotação
  const handlePrimeiroAcesso = () => {
    handleNovaCotacao();
  };

  // Serviços de Assistência 24h (conforme solicitado pelo usuário)
  const servicosAssistencia = [
    { id: 1, nome: 'Roubo/Furto', descricao: 'Comunicar roubo ou furto do veículo', icon: ShieldAlert },
    { id: 2, nome: 'Guincho', descricao: 'Reboque do veículo', icon: Truck },
    { id: 3, nome: 'Pane Seca', descricao: 'Combustível emergencial', icon: Fuel },
    { id: 4, nome: 'Pane Elétrica', descricao: 'Bateria descarregada', icon: Battery },
    { id: 5, nome: 'Troca de Pneu', descricao: 'Substituição de pneu furado', icon: Wrench },
    { id: 6, nome: 'Chaveiro', descricao: 'Abertura de veículo', icon: Key }
  ];

  // Abrir modal de solicitação de serviço
  const handleOpenServiceModal = (servico) => {
    const token = localStorage.getItem(`pwa_token_${slug}`);
    
    if (!token) {
      toast.error('Faça login para solicitar assistência');
      return;
    }
    
    setSelectedService(servico);
    setServicePhoto(null);
    setServicePhotoPreview(null);
    setServiceLocation(null);
    setServiceDescription('');
    setShowServiceModal(true);
    
    // Obter localização automaticamente
    getLocation();
  };
  
  // Obter localização atual
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste dispositivo');
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setServiceLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationLoading(false);
        toast.success('Localização obtida com sucesso!');
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        setLocationLoading(false);
        toast.error('Não foi possível obter sua localização. Verifique as permissões.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  // Selecionar foto do veículo
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Imagem muito grande. Máximo 10MB.');
        return;
      }
      
      setServicePhoto(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setServicePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Enviar solicitação de serviço com foto e localização
  const handleEnviarSolicitacao = async () => {
    const token = localStorage.getItem(`pwa_token_${slug}`);
    
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    
    if (!serviceLocation) {
      toast.error('Localização é obrigatória. Clique em "Obter Localização".');
      return;
    }
    
    setSendingService(true);
    
    try {
      // Criar FormData para enviar foto
      const formData = new FormData();
      formData.append('tipo_servico', selectedService.nome);
      formData.append('descricao', serviceDescription || selectedService.descricao);
      formData.append('latitude', serviceLocation.latitude);
      formData.append('longitude', serviceLocation.longitude);
      formData.append('unidade_id', unidade?.id || '');
      formData.append('placa', protecaoData?.placa || '');
      formData.append('veiculo', protecaoData?.veiculo || '');
      
      if (servicePhoto) {
        formData.append('foto', servicePhoto);
      }
      
      const response = await axios.post(`${API}/api/pwa/solicitar-assistencia-v2`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(`Solicitação de ${selectedService.nome} enviada! Em breve entraremos em contato.`);
        setShowServiceModal(false);
        // Recarregar solicitações
        carregarDadosCliente(token);
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar solicitação');
    } finally {
      setSendingService(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: cores.primaria }}
      >
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Unidade não encontrada
  if (!unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-white text-center px-6">
          <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-bold mb-2">Unidade não encontrada</h2>
          <p className="text-gray-400">Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  // Estilos inline para inputs do PWA (placeholder cinza, texto branco)
  const inputStyles = {
    color: '#ffffff',
    caretColor: '#ffffff'
  };

  // ==========================================
  // TELA DE LOGIN (Seguindo layout da imagem)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: cores.primaria }}
        data-testid="pwa-login-screen"
      >
        {/* Banner Grande de Instalação - SEMPRE visível se não instalado */}
        {!isInstalled && (
          <div 
            className="p-4 text-center"
            style={{ backgroundColor: cores.secundaria }}
            data-testid="pwa-install-banner"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Smartphone size={24} className="text-white" />
              <span className="text-white font-bold text-lg">Baixe o App!</span>
            </div>
            <p className="text-white/90 text-sm mb-3">
              Tenha acesso rápido aos serviços direto do seu celular
            </p>
            <button
              onClick={handleInstallApp}
              className="bg-white text-gray-800 px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
              data-testid="pwa-btn-install"
            >
              <Download size={18} />
              Instalar Agora
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Logo e Nome da Unidade */}
          <div className="mb-12 text-center">
            {unidade.logo_url && (
              <img 
                src={unidade.logo_url} 
                alt={unidade.nome_fantasia || unidade.name}
                className="h-20 w-auto mx-auto mb-4"
                data-testid="pwa-logo"
              />
            )}
            <h1 
              className="text-2xl font-bold"
              style={{ color: cores.secundaria }}
              data-testid="pwa-nome-unidade"
            >
              {unidade.nome_fantasia || unidade.name}
            </h1>
          </div>

          {/* Form de Login */}
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
            {/* Campo Email */}
            <div>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                placeholder="Email"
                className="w-full h-14 px-4 bg-[#2d2d44] border border-[#3d3d5c] rounded-lg text-base outline-none focus:border-[#4d4d6c] transition-colors placeholder-gray-400"
                style={{ 
                  color: 'white', 
                  caretColor: 'white',
                  WebkitTextFillColor: 'white'
                }}
                data-testid="pwa-email-input"
              />
            </div>

            {/* Campo Senha */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Senha"
                className="w-full h-14 px-4 pr-12 bg-[#2d2d44] border border-[#3d3d5c] rounded-lg text-base outline-none focus:border-[#4d4d6c] transition-colors placeholder-gray-400"
                style={{ 
                  color: 'white', 
                  caretColor: 'white',
                  WebkitTextFillColor: 'white'
                }}
                data-testid="pwa-senha-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                data-testid="pwa-toggle-senha"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Esqueceu a senha */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white italic"
                onClick={() => toast.info('Entre em contato com a unidade para recuperar sua senha')}
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Botão ENTRAR */}
            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full h-14 text-lg font-bold rounded-full mt-6"
              style={{ backgroundColor: cores.secundaria }}
              data-testid="pwa-btn-entrar"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Entrando...
                </span>
              ) : (
                'ENTRAR'
              )}
            </Button>
          </form>

          {/* Botões inferiores */}
          <div className="w-full max-w-sm mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrimeiroAcesso}
              className="flex-1 h-14 bg-white text-gray-800 hover:bg-gray-100 border-0 rounded-full font-bold text-sm"
              data-testid="pwa-btn-primeiro-acesso"
            >
              PRIMEIRO ACESSO
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNovaCotacao}
              className="flex-1 h-14 bg-white text-gray-800 hover:bg-gray-100 border-0 rounded-full font-bold text-sm"
              data-testid="pwa-btn-quero-contratar"
            >
              QUERO CONTRATAR
            </Button>
          </div>

          {/* Botão de Instalar App (quando banner foi fechado) */}
          {!showInstallBanner && !isInstalled && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-2 mt-6 text-gray-400 hover:text-white text-sm"
            >
              <Smartphone size={16} />
              <span>Instalar aplicativo</span>
            </button>
          )}

          {/* Versão */}
          <p className="text-gray-500 text-xs mt-8">
            v1.0.1
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL (Logado)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 pb-20" data-testid="pwa-dashboard">
      {/* Banner de Instalação no Dashboard (se não instalado) */}
      {!isInstalled && (
        <div 
          className="p-3 flex items-center justify-between"
          style={{ backgroundColor: cores.secundaria }}
          data-testid="pwa-install-reminder"
        >
          <div className="flex items-center gap-2 text-white">
            <Smartphone size={18} />
            <span className="text-sm font-medium">Instale o app para acesso rápido!</span>
          </div>
          <button
            onClick={handleInstallApp}
            className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold"
          >
            Instalar
          </button>
        </div>
      )}
      
      {/* Header */}
      <div 
        className="px-4 py-4 text-white"
        style={{ backgroundColor: cores.primaria }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {unidade.logo_url ? (
              <img 
                src={unidade.logo_url} 
                alt={unidade.nome_fantasia}
                className="h-10 w-auto"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: cores.secundaria }}
              >
                <span className="text-white font-bold">
                  {(unidade.nome_fantasia || 'U').charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm opacity-80">Olá, {unidade.nome_fantasia?.split(' ')[0] || user?.full_name?.split(' ')[0]}</p>
              <p className="font-semibold text-sm">{unidade.nome_fantasia}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de Notificações Push */}
            <button 
              onClick={togglePushNotifications}
              disabled={pushLoading}
              className={`p-2 rounded-full transition-colors ${
                pushEnabled 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'hover:bg-white/10'
              }`}
              title={pushEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
              data-testid="pwa-btn-notifications"
            >
              {pushLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : pushEnabled ? (
                <Bell size={20} />
              ) : (
                <BellOff size={20} className="opacity-60" />
              )}
            </button>
            
            {/* Botão de Logout */}
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-white/10 rounded-full"
              data-testid="pwa-btn-logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-6 space-y-4">
        
        {/* Card Nova Cotação */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-0"
          onClick={handleNovaCotacao}
          data-testid="pwa-card-nova-cotacao"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: cores.secundaria }}
            >
              <Shield size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Nova Cotação</h3>
              <p className="text-gray-500 text-sm">Faça uma nova cotação de proteção</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </CardContent>
        </Card>

        {/* Card Minha Proteção */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-0"
          onClick={() => setActiveTab('protecao')}
          data-testid="pwa-card-minha-protecao"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: cores.primaria }}
            >
              <FileText size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Minha Proteção</h3>
              <p className="text-gray-500 text-sm">
                {protecaoData ? 'Ver dados da proteção' : 'Nenhuma proteção ativa'}
              </p>
            </div>
            <ChevronRight className="text-gray-400" />
          </CardContent>
        </Card>

        {/* Card Solicitações / Assistência 24h */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-0"
          onClick={() => setActiveTab('solicitacoes')}
          data-testid="pwa-card-solicitacoes"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-500">
              <Headphones size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Solicitações</h3>
              <p className="text-gray-500 text-sm">Assistência 24 horas</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </CardContent>
        </Card>

        {/* Seção de Assistência 24h (se tab ativa) */}
        {activeTab === 'solicitacoes' && (
          <div className="mt-6" data-testid="pwa-assistencia-24h">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
              <Headphones size={20} style={{ color: cores.primaria }} />
              Serviços
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {servicosAssistencia.map((servico) => (
                <Card 
                  key={servico.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-white"
                  onClick={() => handleOpenServiceModal(servico)}
                  data-testid={`pwa-servico-${servico.id}`}
                >
                  <CardContent className="p-4 text-center">
                    <servico.icon 
                      size={32} 
                      className="mx-auto mb-2"
                      style={{ color: cores.primaria }}
                    />
                    <h4 className="font-medium text-sm text-gray-800">{servico.nome}</h4>
                    <p className="text-xs text-gray-500 mt-1">{servico.descricao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Botão de emergência */}
            <Button
              className="w-full mt-4 py-6 text-lg bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (unidade?.whatsapp || unidade?.phone) {
                  const phone = (unidade.whatsapp || unidade.phone).replace(/\D/g, '');
                  window.open(`tel:${phone}`, '_self');
                } else {
                  toast.info('Entre em contato com a unidade');
                }
              }}
              data-testid="pwa-btn-emergencia"
            >
              <Phone size={20} className="mr-2" />
              LIGAR PARA EMERGÊNCIA
            </Button>
          </div>
        )}

        {/* Seção Minha Proteção (se tab ativa) */}
        {activeTab === 'protecao' && (
          <div className="mt-6" data-testid="pwa-detalhes-protecao">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Shield size={20} style={{ color: cores.primaria }} />
              Dados da Proteção
            </h3>
            {protecaoData ? (
              <Card className="border-0">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Veículo</span>
                    <span className="font-medium">{protecaoData.veiculo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Placa</span>
                    <span className="font-medium">{protecaoData.placa || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano</span>
                    <span className="font-medium">{protecaoData.plano || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor Mensal</span>
                    <span className="font-medium">
                      {protecaoData.valor_mensal 
                        ? `R$ ${Number(protecaoData.valor_mensal).toFixed(2)}` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span 
                      className="font-medium px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: protecaoData.status === 'ativo' ? '#dcfce7' : '#fee2e2',
                        color: protecaoData.status === 'ativo' ? '#166534' : '#991b1b'
                      }}
                    >
                      {(protecaoData.status || 'PENDENTE').toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0">
                <CardContent className="p-6 text-center">
                  <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Você ainda não possui proteção ativa.</p>
                  <Button
                    className="mt-4"
                    style={{ backgroundColor: cores.secundaria }}
                    onClick={handleNovaCotacao}
                  >
                    Fazer Cotação
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Seção Perfil (se tab ativa) */}
        {activeTab === 'perfil' && (
          <div className="mt-6" data-testid="pwa-perfil">
            {/* Dados Pessoais */}
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
              <User size={20} style={{ color: cores.primaria }} />
              Meus Dados
            </h3>
            <Card className="border-0 mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nome</span>
                  <span className="font-medium text-gray-800">{user?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800 text-sm">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CPF</span>
                  <span className="font-medium text-gray-800">{user?.cpf || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefone</span>
                  <span className="font-medium text-gray-800">{user?.phone || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Resumo da Proteção */}
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
              <Shield size={20} style={{ color: cores.primaria }} />
              Minha Proteção
            </h3>
            {protecaoData ? (
              <Card className="border-0">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Veículo</span>
                    <span className="font-medium text-gray-800">{protecaoData.veiculo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Placa</span>
                    <span className="font-medium text-gray-800">{protecaoData.placa || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano</span>
                    <span className="font-medium text-gray-800">{protecaoData.plano || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor Mensal</span>
                    <span className="font-medium text-gray-800">
                      {protecaoData.valor_mensal 
                        ? `R$ ${Number(protecaoData.valor_mensal).toFixed(2)}` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span 
                      className="font-medium px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: protecaoData.status === 'ativo' ? '#dcfce7' : '#fee2e2',
                        color: protecaoData.status === 'ativo' ? '#166534' : '#991b1b'
                      }}
                    >
                      {(protecaoData.status || 'PENDENTE').toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0">
                <CardContent className="p-6 text-center">
                  <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Você ainda não possui proteção ativa.</p>
                  <Button
                    className="mt-4 text-white"
                    style={{ backgroundColor: cores.secundaria }}
                    onClick={handleNovaCotacao}
                  >
                    Fazer Cotação
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Botão de Sair */}
            <Button
              variant="outline"
              className="w-full mt-6 border-red-500 text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Sair da Conta
            </Button>
          </div>
        )}
      </div>
      
      {/* Modal de Solicitação de Serviço */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
          <div 
            className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
            data-testid="pwa-service-modal"
          >
            {/* Header do Modal */}
            <div 
              className="sticky top-0 p-4 border-b flex items-center justify-between"
              style={{ backgroundColor: cores.primaria }}
            >
              <div className="flex items-center gap-3">
                <selectedService.icon size={24} className="text-white" />
                <h3 className="font-bold text-lg text-white">{selectedService.nome}</h3>
              </div>
              <button 
                onClick={() => setShowServiceModal(false)}
                className="text-white p-1 hover:bg-white/20 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Informações do Veículo */}
              {protecaoData && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Veículo:</p>
                  <p className="text-gray-800">{protecaoData.veiculo || 'N/A'} - {protecaoData.placa || 'N/A'}</p>
                </div>
              )}
              
              {/* Foto do Veículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera size={18} className="inline mr-2" />
                  Foto do Veículo (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {servicePhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={servicePhotoPreview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setServicePhoto(null);
                          setServicePhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center py-4">
                        <Camera size={40} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Tirar foto ou escolher da galeria</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              
              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={18} className="inline mr-2" />
                  Localização Atual *
                </label>
                {serviceLocation ? (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                    <Check size={24} className="text-green-600" />
                    <div className="flex-1">
                      <p className="text-green-800 font-medium text-sm">Localização obtida!</p>
                      <p className="text-green-600 text-xs">
                        Lat: {serviceLocation.latitude.toFixed(6)}, 
                        Lng: {serviceLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                    <button 
                      onClick={getLocation}
                      className="text-green-600 text-sm underline"
                    >
                      Atualizar
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={getLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Obtendo localização...
                      </>
                    ) : (
                      <>
                        <Navigation size={18} className="mr-2" />
                        Obter Minha Localização
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Descrição adicional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Descreva a situação..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none text-gray-800"
                  rows={3}
                />
              </div>
              
              {/* Botão Enviar */}
              <Button
                className="w-full py-6 text-lg font-bold text-white"
                style={{ backgroundColor: cores.secundaria }}
                onClick={handleEnviarSolicitacao}
                disabled={sendingService || !serviceLocation}
              >
                {sendingService ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check size={20} className="mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-0 left-0 right-0 flex justify-around py-3 border-t"
        style={{ backgroundColor: cores.primaria }}
      >
        <button 
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center"
          style={{ color: activeTab === 'home' ? cores.secundaria : 'rgba(255,255,255,0.6)' }}
          data-testid="pwa-nav-home"
        >
          <Home size={24} />
          <span className="text-xs mt-1">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('protecao')}
          className="flex flex-col items-center"
          style={{ color: activeTab === 'protecao' ? cores.secundaria : 'rgba(255,255,255,0.6)' }}
          data-testid="pwa-nav-protecao"
        >
          <Shield size={24} />
          <span className="text-xs mt-1">Proteção</span>
        </button>
        <button 
          onClick={() => setActiveTab('solicitacoes')}
          className="flex flex-col items-center"
          style={{ color: activeTab === 'solicitacoes' ? cores.secundaria : 'rgba(255,255,255,0.6)' }}
          data-testid="pwa-nav-servicos"
        >
          <Headphones size={24} />
          <span className="text-xs mt-1">Serviços</span>
        </button>
        <button 
          onClick={() => setActiveTab('perfil')}
          className="flex flex-col items-center"
          style={{ color: activeTab === 'perfil' ? cores.secundaria : 'rgba(255,255,255,0.6)' }}
          data-testid="pwa-nav-perfil"
        >
          <User size={24} />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default PWAUnidadeLabelview;
