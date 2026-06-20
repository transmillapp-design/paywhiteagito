import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import WalletModal from './WalletModal';
import UserProfileModal from './UserProfileModal';
import NotificationBell from './NotificationBell';
import FloatingSocialButton from './FloatingSocialButton';
import { usePWA } from '../hooks/usePWA';
import {
  Search,
  Car,
  Shield,
  Wifi,
  Heart,
  Store,
  Wrench,
  Bitcoin,
  ArrowRight,
  User,
  Users,
  Bell,
  Menu,
  Calculator,
  Sun,
  Moon,
  Edit,
  Settings,
  LogOut,
  X,
  Camera,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Wallet,
  ShoppingBag,
  Eye,
  EyeOff,
  Bot,
  LayoutGrid,
  Download,
  LayoutDashboard,
  FileText,
  MessageCircle
} from 'lucide-react';

const MinimalistHomePage = ({ franquiaContext = null }) => {
  const { user, API, updateUser } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, installPWA } = usePWA();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // SEMPRE iniciar com tema claro (light) por padrão
    // Usuário pode alternar manualmente se desejar
    const savedTheme = localStorage.getItem('transmill-theme');
    // Forçar tema claro se não houver tema salvo ou se for primeira visita
    if (!savedTheme || savedTheme !== 'dark') {
      localStorage.setItem('transmill-theme', 'light');
      return false; // false = modo claro
    }
    return savedTheme === 'dark';
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });
  const [userProfile, setUserProfile] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [filteredServices, setFilteredServices] = useState([]);
  const [chatbotResponse, setChatbotResponse] = useState(null);
  const [showChatbotResponse, setShowChatbotResponse] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  // Cores da franquia (se aplicável)
  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';
  const corSecundaria = franquiaContext?.cor_secundaria || '#EEEEEE';
  const nomeFranquia = franquiaContext?.nome || 'Transmill';
  const logoFranquia = franquiaContext?.logo_url;

  // Fetch user balance and profile
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchBalance();
      loadNotifications();
      loadTheme();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Simulação de notificações - pode ser substituído por endpoint real
      const mockNotifications = [
        {
          id: 1,
          title: 'Cashback Recebido',
          message: 'Você recebeu R$ 2,50 de cashback na compra do Plano Básico',
          time: '2 min atrás',
          read: false,
          type: 'cashback'
        },
        {
          id: 2,
          title: 'Promoção Especial',
          message: 'Nova promoção de Internet Móvel com 15% de desconto!',
          time: '1 hora atrás',
          read: false,
          type: 'promo'
        },
        {
          id: 3,
          title: 'Pagamento Aprovado',
          message: 'Seu pagamento foi processado com sucesso',
          time: '2 horas atrás',
          read: true,
          type: 'payment'
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('transmill-theme');
    // Default para light se não houver tema salvo
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    
    // Garantir que o tema light seja o padrão
    if (!savedTheme) {
      localStorage.setItem('transmill-theme', 'light');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('transmill-theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
    
    // Atualizar no backend também
    updateUserTheme(newTheme ? 'dark' : 'light');
  };

  const updateUserTheme = async (theme) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/user/profile-data`, 
        { theme },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMobilityClick = () => {
    // Usar o novo sistema de mobilidade interno do Transmill
    navigate('/mobility');
  };

  const fetchUserProfile = async () => {
    try {
      let response;
      // Use the standard user/profile endpoint for all user types
      response = await axios.get(`${API}/user/profile`, { headers });
      
      if (response?.data) {
        const userData = response.data;
        // Usar nome_fantasia ou company_name para empresas, senão full_name
        const displayName = userData.nome_fantasia || userData.company_name || userData.full_name;
        setUserProfile({
          profile_image: userData.profile_image,
          full_name: displayName,
          nome_fantasia: userData.nome_fantasia,
          company_name: userData.company_name,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, { headers });
      
      if (response?.data) {
        const userData = response.data;
        setBalance({
          brl: (userData.balance || 0) + (userData.cashback_balance || 0),
          usdt: userData.usdt_balance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Services configuration
  const services = [
    {
      id: 'mobility',
      title: 'Mobilidade',
      icon: Car,
      color: 'bg-transmill-olive',
      description: 'Corridas P2P com motoristas parceiros',
      action: handleMobilityClick
    },
    {
      id: 'vehicle-protection',
      title: 'Proteção Veicular',
      icon: Shield,
      color: 'bg-transmill-gold',
      description: 'Proteção Veicular Labelview',
      action: () => navigate('/protecao-veicular')
    },
    {
      id: 'mobile-internet',
      title: 'Internet Móvel',
      icon: Wifi,
      color: 'bg-transmill-gray',
      description: 'Planos de dados e conectividade',
      action: () => navigate('/internet-movel')
    },
    {
      id: 'telemedicine',
      title: 'Telemedicina',
      icon: Heart,
      color: 'bg-transmill-olive',
      description: 'Consultas médicas online',
      action: () => navigate('/telemedicina')
    },
    {
      id: 'events',
      title: 'Eventos',
      icon: Calendar,
      color: 'bg-transmill-gold',
      description: 'Ingressos e experiências',
      action: () => window.open('https://agitoticket.com.br', '_blank')
    },
    {
      id: 'stores',
      title: 'Lojas',
      icon: Store,
      color: 'bg-transmill-olive',
      description: 'Marketplace e compras',
      action: () => navigate('/lojas')
    },
    {
      id: 'services',
      title: 'Prestadores',
      icon: Wrench,
      color: 'bg-transmill-gray',
      description: 'Prestadores de serviços',
      action: () => navigate('/prestadores')
    },
    {
      id: 'crypto',
      title: 'Criptoativos',
      icon: Bitcoin,
      color: 'bg-transmill-gold',
      description: 'Gestão de criptomoedas',
      action: () => navigate('/usdt')
    }
  ];

  // Smart search suggestions
  const suggestions = [
    { text: 'depositar dinheiro', action: () => navigate('/client-dashboard') },
    { text: 'sacar para minha conta', action: () => navigate('/client-dashboard') },
    { text: 'converter para USDT', action: () => navigate('/client-dashboard') },
    { text: 'ver meu extrato', action: () => navigate('/client-dashboard') },
    { text: 'indicar amigo', action: () => navigate('/client-dashboard') },
    { text: 'configurar perfil', action: () => navigate('/client-dashboard') },
    { text: 'fazer uma compra', action: () => navigate('/client-dashboard') },
    { text: 'pagar conta', action: () => navigate('/client-dashboard') }
  ];

  // Mapeamento inteligente de palavras-chave para serviços
  const serviceKeywords = {
    'mobility': ['motorista', 'uber', 'taxi', 'corrida', 'transporte', 'viagem', 'carro', 'mobilidade', 'moby'],
    'vehicle-protection': ['seguro', 'proteção', 'veicular', 'auto', 'proteção veicular', 'acidentes'],
    'mobile-internet': ['internet', 'dados', 'chip', 'celular', 'wifi', 'conectividade', '4g', '5g', 'plano'],
    'telemedicine': ['médico', 'consulta', 'saúde', 'telemedicina', 'doutor', 'medicina', 'hospital', 'clinica'],
    'events': ['evento', 'ingresso', 'show', 'festival', 'festa', 'concerto', 'ticket'],
    'stores': ['loja', 'compra', 'produto', 'marketplace', 'shopping'],
    'services': ['prestador', 'serviço', 'profissional', 'técnico', 'eletricista', 'encanador'],
    'crypto': ['cripto', 'usdt', 'bitcoin', 'criptomoeda', 'blockchain', 'crypto']
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      setFilteredServices([]);
      setShowChatbotResponse(false);
      return;
    }
    
    // Primeiro, tentar consultar o chatbot treinado
    try {
      const response = await axios.post(`${API}/chatbot/query`, {
        query: query
      });
      
      if (response.data.success && response.data.found) {
        // Chatbot encontrou uma resposta
        setChatbotResponse(response.data);
        setShowChatbotResponse(true);
        setFilteredServices([]);
        return;
      }
    } catch (error) {
      console.error('Erro ao consultar chatbot:', error);
      // Se falhar, continuar com busca normal
    }
    
    // Busca normal nos serviços (fallback)
    const matches = services.filter(service => {
      // Verificar se o título corresponde
      if (service.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Verificar se a descrição corresponde
      if (service.description.toLowerCase().includes(query)) {
        return true;
      }
      
      // Verificar palavras-chave específicas do serviço
      const keywords = serviceKeywords[service.id] || [];
      return keywords.some(keyword => keyword.includes(query) || query.includes(keyword));
    });
    
    setFilteredServices(matches);
    setShowChatbotResponse(false);
    
    // Se houver apenas 1 resultado, executar a ação diretamente
    if (matches.length === 1) {
      setTimeout(() => {
        matches[0].action();
        setSearchQuery('');
        setFilteredServices([]);
      }, 500);
    }
  };
  
  // Atualizar filtro em tempo real
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 1) {
      const query = value.toLowerCase().trim();
      const matches = services.filter(service => {
        if (service.title.toLowerCase().includes(query)) return true;
        if (service.description.toLowerCase().includes(query)) return true;
        const keywords = serviceKeywords[service.id] || [];
        return keywords.some(keyword => keyword.includes(query) || query.includes(keyword));
      });
      setFilteredServices(matches);
      setShowSuggestions(false);
    } else {
      setFilteredServices([]);
      setShowSuggestions(value.length > 0);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`min-h-[100dvh] h-[100dvh] flex flex-col`} style={{ backgroundColor: isDarkMode ? '#1a59ad' : (franquiaContext ? corSecundaria : '#EEEEEE') }}>
      {/* Header - Sticky no topo com safe area */}
      <header 
        className={`sticky top-0 z-40 shadow-sm border-b flex-shrink-0`}
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          backgroundColor: isDarkMode ? '#1a59ad' : 'white',
          borderColor: isDarkMode ? '#CEAE31' : corPrimaria
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo ou Nome */}
          {logoFranquia ? (
            <img src={logoFranquia} alt={nomeFranquia} className="h-8 w-auto object-contain" />
          ) : (
            <h1 className="text-xl font-bold" style={{ color: isDarkMode ? '#CEAE31' : corPrimaria }}>
              {nomeFranquia}
            </h1>
          )}
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationBell />

            {/* PWA Install Button */}
            {isInstallable && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={installPWA}
                title="Instalar App"
                style={{ color: isDarkMode ? 'white' : corPrimaria }}
              >
                <Download size={20} />
              </Button>
            )}

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              title={isDarkMode ? "Alternar para tema claro" : "Alternar para tema escuro"}
              style={{ color: isDarkMode ? 'white' : corPrimaria }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            {/* Profile Menu - Ícone de Menu (três barras) para todos */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <Menu size={24} className={isDarkMode ? 'text-white' : 'text-[#005B9C]'} />
              </Button>
              
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-2 z-20 ${
                    isDarkMode 
                      ? 'bg-[#FFFFFF] border-[#005B9C]' 
                      : 'bg-[#FFFFFF] border-[#005B9C]'
                  }`}>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                        isDarkMode 
                          ? 'hover:bg-[#005B9C] text-white' 
                          : 'hover:bg-[#F5F5F5] text-[#333333]'
                      }`}
                    >
                      <User size={16} />
                      Perfil
                    </button>
                    
                    {/* Botão Painel Admin - Para Master Transmill (sem franquia) */}
                    {((user?.user_type === 'master' || user?.user_type === 'transmill_master' || user?.is_master_account === true) && !user?.franquia_slug && !franquiaContext) && (
                      <button
                        onClick={() => {
                          navigate('/master');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                          isDarkMode 
                            ? 'hover:bg-[#005B9C] text-white' 
                            : 'hover:bg-[#F5F5F5] text-[#333333]'
                        }`}
                      >
                        <LayoutDashboard size={16} />
                        Painel Admin
                      </button>
                    )}
                    
                    {/* Botões para Franquia/Unidade - Painel Admin e Proteção */}
                    {(user?.user_type === 'labelview_unidade' || user?.franquia_slug || franquiaContext?.slug) && (
                      <>
                        <button
                          onClick={() => {
                            const slug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
                            navigate(slug ? `/franquia/${slug}/admin` : '/master');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <LayoutDashboard size={16} />
                          Painel Admin
                        </button>
                        <button
                          onClick={() => {
                            const slug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
                            navigate(slug ? `/franquia/${slug}/labelview` : '/labelview/dashboard');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <Shield size={16} />
                          Painel Proteção
                        </button>
                        <button
                          onClick={() => {
                            navigate('/suporte');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                          data-testid="menu-suporte-btn"
                        >
                          <MessageCircle size={16} />
                          Suporte
                        </button>
                      </>
                    )}
                    
                    {/* Botão Labelview - Para regionais e consultores (sem franquia) */}
                    {(user?.user_type === 'labelview_master' || 
                      user?.user_type === 'labelview_regional' ||
                      user?.user_type === 'labelview_consultor') && !user?.franquia_slug && (
                      <button
                        onClick={() => {
                          navigate('/labelview/dashboard');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                          isDarkMode 
                            ? 'hover:bg-[#005B9C] text-white' 
                            : 'hover:bg-[#F5F5F5] text-[#333333]'
                        }`}
                      >
                        <Shield size={16} />
                        Labelview
                      </button>
                    )}
                    
                    {user?.user_type === 'cliente' && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/minha-protecao');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <Shield size={16} />
                          Labelview (Proteção)
                        </button>
                        <button
                          onClick={() => {
                            navigate('/minhas-solicitacoes');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <Bell size={16} />
                          Minhas Solicitações
                        </button>
                        <button
                          onClick={() => {
                            navigate('/meus-pedidos');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <ShoppingBag size={16} />
                          Meus Pedidos
                        </button>
                      </>
                    )}
                    {user?.user_type === 'lojista' && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/meu-negocio');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <Store size={16} />
                          Meu Negócio
                        </button>
                        <button
                          onClick={() => {
                            navigate('/equipe');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                            isDarkMode 
                              ? 'hover:bg-[#005B9C] text-white' 
                              : 'hover:bg-[#F5F5F5] text-[#333333]'
                          }`}
                        >
                          <Users size={16} />
                          Equipe
                        </button>
                      </>
                    )}
                    <hr className={`my-2 ${isDarkMode ? 'border-[#005B9C]' : 'border-[#005B9C]'}`} />
                    <button
                      onClick={() => {
                        // Salvar o slug da franquia antes de limpar
                        const franquiaSlug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
                        
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Redirecionar para login da franquia ou login principal
                        if (franquiaSlug) {
                          window.location.href = `/franquia/${franquiaSlug}/login`;
                        } else {
                          window.location.href = '/login';
                        }
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                        isDarkMode 
                          ? 'hover:bg-red-900 text-red-400' 
                          : 'hover:bg-red-100 text-red-600'
                      }`}
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal - Área Scrollável */}
      <main className="flex-1 overflow-y-auto">
        <div className={`max-w-md mx-auto px-4 py-6 space-y-6 ${isDarkMode ? 'bg-[#1a59ad]' : 'bg-[#EEEEEE]'}`}>
        {/* Banner Area - Com suporte para modo claro e escuro */}
        <Card className={`border-2 overflow-hidden relative ${
          isDarkMode 
            ? 'bg-[#6B6A4B] border-[#CEAE31] text-white' 
            : 'bg-white border-[#005B9C] text-[#333333]'
        }`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {/* Foto do Cliente/Lojista/Prestador - Clicável */}
                <button
                  onClick={() => navigate('/profile')}
                  className={`w-16 h-16 rounded-full overflow-hidden border-3 shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer ${
                    isDarkMode 
                      ? 'border-[#CEAE31] bg-[#CEAE31]/20' 
                      : 'border-[#005B9C] bg-[#CCCCCC]/20'
                  }`}
                >
                  {userProfile?.profile_image ? (
                    <img
                      src={userProfile.profile_image}
                      alt="Foto do perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'
                    }`}>
                      <span className="text-white text-2xl font-bold">
                        {(user?.nome_fantasia || user?.company_name || user?.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>
                    Olá, {(userProfile?.full_name || user?.nome_fantasia || user?.company_name || user?.full_name || user?.email?.split('@')[0])?.split(' ')[0]}
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                    {user?.user_type === 'cliente' ? 'Ecossistema de Consumo Militar' :
                     user?.user_type === 'lojista' ? 'Gerencie seu negócio' :
                     'Seus serviços e agendamentos'}
                  </p>
                </div>
              </div>
              <Badge className={`${
                isDarkMode 
                  ? 'bg-[#CEAE31] text-[#1a59ad] border-[#CEAE31]' 
                  : 'bg-[#005B9C] text-white border-[#005B9C]'
              }`}>
                {user?.user_type === 'cliente' ? 'Cliente' : 
                 user?.user_type === 'lojista' ? 'Lojista' : 'Prestador'}
              </Badge>
            </div>
            
            {/* Botão de mostrar/ocultar saldo */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className={`transition-colors p-2 ${
                  isDarkMode 
                    ? 'text-white/80 hover:text-white' 
                    : 'text-[#005B9C]/80 hover:text-[#005B9C]'
                }`}
                title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-lg p-3 ${
                isDarkMode 
                  ? 'bg-[#CEAE31] border-[#1a59ad]' 
                  : 'bg-white border-[#005B9C]'
              }`}>
                <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#1a59ad]' : 'text-[#005B9C]'}`}>
                  Saldo disponível
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-[#1a59ad]' : 'text-[#333333]'}`}>
                  {showBalance ? formatCurrency(balance.brl) : '••••••'}
                </p>
              </div>
              <div className={`border rounded-lg p-3 ${
                isDarkMode 
                  ? 'bg-[#CEAE31] border-[#1a59ad]' 
                  : 'bg-white border-[#005B9C]'
              }`}>
                <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#1a59ad]' : 'text-[#005B9C]'}`}>
                  Ganhos acumulados
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-[#1a59ad]' : 'text-[#333333]'}`}>
                  {showBalance ? balance.usdt.toFixed(6) : '••••••'}
                </p>
              </div>
            </div>

            {/* Decorative circles com cores da paleta */}
            <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${
              isDarkMode ? 'bg-[#CEAE31]/10' : 'bg-[#005B9C]/10'
            }`}></div>
            <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full ${
              isDarkMode ? 'bg-[#CEAE31]/10' : 'bg-[#CCCCCC]/10'
            }`}></div>
          </CardContent>
        </Card>

        {/* Smart Search Field */}
        <Card className={`border ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'
                }`} size={20} />
                <Input
                  type="text"
                  placeholder="O que você precisa hoje? 🔍"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`pl-10 pr-12 py-3 text-base border ${
                    isDarkMode 
                      ? 'bg-[#1a59ad] border-[#CEAE31] text-white placeholder-[#9CA38F]' 
                      : 'bg-white border-[#CCCCCC] text-[#333333] placeholder-[#666666]'
                  }`}
                  onFocus={() => setShowSuggestions(searchQuery.length > 0 && filteredServices.length === 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <Button 
                  type="submit"
                  size="sm" 
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode 
                      ? 'bg-[#CEAE31] hover:bg-[#E5C34A] text-[#1a59ad]' 
                      : 'bg-[#005B9C] hover:bg-[#0077CC] text-white'
                  }`}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>

              {/* Search Suggestions */}
              {showSuggestions && (
                <div className={`border rounded-lg shadow-lg max-h-48 overflow-y-auto ${
                  isDarkMode 
                    ? 'bg-[#6B6A4B] border-[#CEAE31]' 
                    : 'bg-white border-[#005B9C]'
                }`}>
                  {suggestions
                    .filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={suggestion.action}
                        className={`w-full text-left px-4 py-2 text-sm border-b last:border-b-0 ${
                          isDarkMode 
                            ? 'hover:bg-[#CEAE31] text-white border-[#CEAE31] hover:text-[#1a59ad]' 
                            : 'hover:bg-[#F5F5F5] text-[#333333] border-[#CCCCCC]'
                        }`}
                      >
                        {suggestion.text}
                      </button>
                    ))
                  }
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Resposta do Chatbot IA */}
        {showChatbotResponse && chatbotResponse && (
          <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className={`rounded-full p-2 ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
                  <Bot className={isDarkMode ? 'text-[#1a59ad]' : 'text-white'} size={20} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 flex items-center ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                    Assistente Transmill
                    <Badge className={`ml-2 text-xs ${isDarkMode ? 'bg-[#CEAE31] text-[#1a59ad]' : 'bg-[#005B9C] text-white'}`}>IA</Badge>
                  </h3>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-[#666666]'}`}>
                    {chatbotResponse.response}
                  </p>
                </div>
              </div>
              
              {/* Botão de ação se houver */}
              {chatbotResponse.action && chatbotResponse.action.type === 'navigate' && chatbotResponse.action.target && (
                <div className="mt-4">
                  <Button
                    className={`w-full ${isDarkMode ? 'bg-[#CEAE31] hover:bg-[#E5C34A] text-[#1a59ad]' : 'bg-[#005B9C] hover:bg-[#0077CC] text-white'}`}
                    onClick={() => {
                      const target = chatbotResponse.action.target;
                      
                      // Verificar se é link externo
                      if (target.startsWith('EXTERNAL:')) {
                        const externalPath = target.replace('EXTERNAL:', '');
                        
                        // Caso especial para mobilidade - usar sistema interno
                        if (externalPath === 'mobility') {
                          navigate('/mobility');
                        } else {
                          // Outros links externos (abre em nova aba)
                          window.open(externalPath, '_blank');
                        }
                      } else {
                        // Navegação interna normal
                        navigate(target);
                      }
                      
                      setSearchQuery('');
                      setShowChatbotResponse(false);
                    }}
                  >
                    <ArrowRight size={18} className="mr-2" />
                    {chatbotResponse.action.label || 'Ir para esta área'}
                  </Button>
                </div>
              )}
              
              {/* Botão para nova busca */}
              <Button
                variant="outline"
                size="sm"
                className={`w-full mt-2 ${isDarkMode ? 'border-[#CEAE31] text-white hover:bg-[#CEAE31] hover:text-[#1a59ad]' : 'border-[#005B9C] text-[#005B9C] hover:bg-[#005B9C] hover:text-white'}`}
                onClick={() => {
                  setSearchQuery('');
                  setShowChatbotResponse(false);
                }}
              >
                Nova busca
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Pesquisa */}
        {filteredServices.length > 0 && searchQuery.length > 1 && (
          <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
            <CardContent className="p-4">
              <h3 className={`font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                <Search className={`mr-2 ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`} size={18} />
                Resultados para "{searchQuery}" ({filteredServices.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {filteredServices.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Card 
                      key={service.id}
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-95 border-2 ${isDarkMode ? 'border-[#CEAE31] bg-[#CEAE31]' : 'border-[#005B9C] bg-[#005B9C]'}`}
                      onClick={() => {
                        service.action();
                        setSearchQuery('');
                        setFilteredServices([]);
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${isDarkMode ? 'bg-[#1a59ad]' : 'bg-white'}`}>
                          <IconComponent className={isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'} size={20} />
                        </div>
                        <h3 className="font-semibold text-white text-xs mb-1">{service.title}</h3>
                        <p className="text-xs text-[#0077CC] leading-tight line-clamp-2">{service.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há resultados */}
        {filteredServices.length === 0 && searchQuery.length > 1 && !showChatbotResponse && (
          <Card className="bg-[#FFFFFF] border-[#005B9C] border-2">
            <CardContent className="p-6 text-center">
              <Search className="mx-auto mb-3 text-[#005B9C]" size={40} />
              <h3 className="font-semibold text-white mb-2">Nenhum resultado encontrado</h3>
              <p className="text-sm text-[#0077CC] mb-3">
                Não encontramos serviços para "{searchQuery}"
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#005B9C] text-white hover:bg-[#005B9C]"
                onClick={() => {
                  setSearchQuery('');
                  setFilteredServices([]);
                }}
              >
                Limpar busca
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Services Grid - Estilo da Referência com suporte a tema */}
        {(!searchQuery || searchQuery.length <= 1) && (
          <div className="grid grid-cols-4 gap-4">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div 
                  key={service.id}
                  className="cursor-pointer hover:scale-105 transition-all duration-200 active:scale-95 text-center"
                  onClick={service.action}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg border-2 ${
                    isDarkMode 
                      ? 'bg-[#CEAE31] border-[#1a59ad]' 
                      : 'bg-[#EEEEEE] border-[#005B9C]'
                  }`}>
                    <IconComponent className={isDarkMode ? 'text-[#1a59ad]' : 'text-[#005B9C]'} size={28} />
                  </div>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                    {service.title}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Sua última atividade */}
        <Card className={`border ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Sua última atividade</h3>
              <button className={`text-sm flex items-center ${isDarkMode ? 'text-[#CEAE31] hover:text-white' : 'text-[#005B9C] hover:text-[#0077CC]'}`}>
                Ver tudo <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
            <div className="text-center py-8">
              <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#666666]'}`}>
                Você ainda não possui nenhuma transação em sua conta 😕
              </p>
            </div>
          </CardContent>
        </Card>

        </div>
      </main>

      {/* Bottom Navigation Bar - Footer Fixo */}
      <BottomNavBar user={user} navigate={navigate} setShowWallet={setShowWallet} isDarkMode={isDarkMode} />

      {/* Wallet Modal */}
      {showWallet && (
        <WalletModal 
          isOpen={showWallet} 
          onClose={() => setShowWallet(false)} 
          user={user}
          balance={balance}
        />
      )}
    </div>
  );
};

// UserProfileModal is imported from separate file

// Componente da Barra de Navegação Inferior
const BottomNavBar = ({ user, navigate, setShowWallet, isDarkMode = false }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const getPaymentButtonConfig = () => {
    if (user?.user_type === 'cliente') {
      return {
        icon: CreditCard,
        label: 'Pagar',
        action: () => navigate('/payment'),
        color: 'text-[#005B9C]'
      };
    } else if (user?.user_type === 'lojista' || user?.user_type === 'service_provider') {
      return {
        icon: Calculator,
        label: 'Cobrar', 
        action: () => navigate('/pos'),
        color: 'text-green-600'
      };
    } else if (user?.user_type?.includes('labelview') || 
               user?.user_type === 'master' || 
               user?.user_type === 'transmill_master' ||
               user?.is_master_account === true) {
      // Usuários Labelview e Master - botão Pagar igual aos clientes
      // O acesso ao Painel é feito pelo menu superior
      return {
        icon: CreditCard,
        label: 'Pagar',
        action: () => navigate('/payment'),
        color: 'text-[#005B9C]'
      };
    }
    // Fallback para qualquer outro tipo de usuário - também mostra Pagar
    return {
      icon: CreditCard,
      label: 'Pagar',
      action: () => navigate('/payment'),
      color: 'text-[#005B9C]'
    };
  };

  const getExtratoButtonConfig = () => {
    if (user?.user_type === 'service_provider') {
      return {
        icon: Calendar,
        label: 'Agenda',
        path: '/provider-schedule',
        action: () => navigate('/provider-schedule'),
        color: 'text-[#005B9C]'
      };
    } else if (user?.user_type === 'lojista') {
      return {
        icon: ShoppingBag,
        label: 'Pedidos',
        path: '/pedidos-lojista',
        action: () => navigate('/pedidos-lojista'),
        color: 'text-[#666666]'
      };
    } else {
      // TODOS os outros tipos (incluindo labelview) - botão Indicar
      return {
        icon: User,
        label: 'Indicar',
        path: '/indicar',
        action: () => navigate('/indicar'),
        color: 'text-[#005B9C]'
      };
    }
  };

  const paymentConfig = getPaymentButtonConfig();
  const extratoConfig = getExtratoButtonConfig();
  
  const navItems = [
    {
      icon: Wallet,
      label: 'Carteira',
      path: null, // Não tem path pois abre modal
      action: () => setShowWallet(true)
    },
    {
      icon: extratoConfig.icon,
      label: extratoConfig.label,
      path: extratoConfig.path,
      action: extratoConfig.action,
      color: extratoConfig.color
    }
  ];

  if (paymentConfig) {
    navItems.push({
      icon: paymentConfig.icon,
      label: paymentConfig.label,
      path: paymentConfig.label === 'Pagar' ? '/payment' : '/pos',
      action: paymentConfig.action,
      isPayment: true,
      color: paymentConfig.color
    });
  }

  navItems.push(
    {
      icon: Store,
      label: 'Lojas',
      path: '/lojas',
      action: () => navigate('/lojas')
    },
    {
      icon: Wrench,
      label: 'Serviços',
      path: '/prestadores',
      action: () => navigate('/prestadores')
    }
  );

  return (
    <nav className={`flex-shrink-0 border-t z-40 ${
      isDarkMode 
        ? 'bg-[#6B6A4B] border-[#CEAE31]' 
        : 'bg-[#EEEEEE] border-[#005B9C] shadow-lg'
    }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-5 py-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.path && (
                           currentPath === item.path || 
                           (item.label === 'Serviços' && currentPath.includes('/prestadores')) ||
                           (item.label === 'Agenda' && currentPath.includes('/provider-schedule')) ||
                           (item.label === 'Pedidos' && currentPath.includes('/pedidos-lojista')) ||
                           (item.label === 'Indicar' && (currentPath.includes('/client-dashboard') && currentPath.includes('tab=referral')))
                         );
            
            return (
              <button
                key={index}
                onClick={item.action}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200 ${
                  isDarkMode 
                    ? (isActive ? 'text-[#CEAE31] font-bold' : 'text-white hover:text-[#CEAE31]')
                    : (isActive ? 'text-[#005B9C] font-bold' : 'text-[#333333] hover:text-[#005B9C]')
                }`}
              >
                {typeof Icon === 'function' ? (
                  <Icon className="mb-1" size={20} />
                ) : (
                  <Icon 
                    size={20} 
                    className="mb-1" 
                  />
                )}
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MinimalistHomePage;