import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import NotificationBell from '../components/NotificationBell';
import { usePWA } from '../hooks/usePWA';
import { GoogleMap, useGoogleMaps } from '../components/mobility/GoogleMapsIntegration';
import {
  Search, Car, Shield, Wifi, Heart, Store, Wrench, DollarSign,
  ArrowRight, User, Menu, Sun, Moon, LogOut, MapPin, Clock,
  Wallet, Eye, EyeOff, CreditCard, Download, LayoutDashboard,
  MessageCircle, ShoppingBag, Users, Calendar, Star, Navigation,
  Loader2, ChevronRight, Phone, Utensils, Briefcase, ArrowLeft,
  Bell, Settings
} from 'lucide-react';

const TAB_MOBILITY = 'mobility';
const TAB_MARKETPLACE = 'marketplace';
const TAB_SERVICES = 'services';
const TAB_FINANCE = 'finance';

const HomePage = ({ franquiaContext = null }) => {
  const { user, API, updateUser } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, installPWA } = usePWA();
  const [activeTab, setActiveTab] = useState(TAB_MOBILITY);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('transmill-theme');
    return saved === 'dark';
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';
  const corSecundaria = franquiaContext?.cor_secundaria || '#EEEEEE';
  const nomeFranquia = franquiaContext?.nome || 'Transmill';
  const logoFranquia = franquiaContext?.logo_url;

  const displayName = (user?.nome_fantasia || user?.company_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário').split(' ')[0];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('transmill-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // Colors helper
  const bg = isDarkMode ? '#1a1a2e' : '#f5f5f5';
  const cardBg = isDarkMode ? '#16213e' : '#ffffff';
  const textPrimary = isDarkMode ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDarkMode ? '#a0a0a0' : '#666666';
  const accent = corPrimaria;
  const accentLight = isDarkMode ? 'rgba(0,91,156,0.2)' : 'rgba(0,91,156,0.08)';

  return (
    <div className="min-h-[100dvh] h-[100dvh] flex flex-col" style={{ backgroundColor: bg }}>
      {/* Header */}
      <header
        className="flex-shrink-0 z-40"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          backgroundColor: isDarkMode ? '#16213e' : '#ffffff',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: accent }}
              data-testid="user-avatar-btn"
            >
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                  <span className="text-white text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </button>
            <div>
              <p className="text-xs" style={{ color: textSecondary }}>Olá,</p>
              <p className="text-sm font-semibold leading-tight" style={{ color: textPrimary }}>{displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            {isInstallable && (
              <Button variant="ghost" size="sm" onClick={installPWA} className="p-2" data-testid="install-pwa-btn">
                <Download size={18} style={{ color: accent }} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2" data-testid="theme-toggle-btn">
              {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} style={{ color: accent }} />}
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2" onClick={() => setShowProfileMenu(!showProfileMenu)} data-testid="menu-btn">
                <Menu size={20} style={{ color: textPrimary }} />
              </Button>
              {showProfileMenu && <ProfileMenu user={user} isDarkMode={isDarkMode} navigate={navigate} franquiaContext={franquiaContext} onClose={() => setShowProfileMenu(false)} accent={accent} />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === TAB_MOBILITY && <MobilityTab isDarkMode={isDarkMode} accent={accent} navigate={navigate} API={API} headers={headers} user={user} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} bg={bg} />}
        {activeTab === TAB_MARKETPLACE && <MarketplaceTab isDarkMode={isDarkMode} accent={accent} navigate={navigate} API={API} headers={headers} user={user} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} bg={bg} />}
        {activeTab === TAB_SERVICES && <ServicesTab isDarkMode={isDarkMode} accent={accent} navigate={navigate} API={API} headers={headers} user={user} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} bg={bg} />}
        {activeTab === TAB_FINANCE && <FinanceTab isDarkMode={isDarkMode} accent={accent} navigate={navigate} API={API} headers={headers} user={user} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} bg={bg} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} accent={accent} textPrimary={textPrimary} />
    </div>
  );
};

/* ============ MOBILITY TAB ============ */
const MobilityTab = ({ isDarkMode, accent, navigate, API, headers, user, cardBg, textPrimary, textSecondary, bg }) => {
  const [driverMode, setDriverMode] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: -22.9068, lng: -43.1729 }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: -22.9068, lng: -43.1729 });
    }
  }, []);

  /* ---------- DRIVER MODE ---------- */
  if (driverMode) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Map */}
        <div className="relative" style={{ height: '45vh', minHeight: '280px' }}>
          {googleMapsLoaded && userLocation ? (
            <GoogleMap origin={userLocation} center={userLocation} zoom={15} height="h-full" className="w-full" isDarkMode={isDarkMode} />
          ) : (
            <MiniMap isDarkMode={isDarkMode} accent={accent} />
          )}
          {/* Toggle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex rounded-full overflow-hidden shadow-lg z-10" style={{ backgroundColor: cardBg }}>
            <button onClick={() => setDriverMode(false)} className="px-5 py-2 text-xs font-semibold transition-all" style={{ backgroundColor: 'transparent', color: textSecondary }} data-testid="passenger-mode-btn">
              <User size={14} className="inline mr-1.5 -mt-0.5" />Passageiro
            </button>
            <button className="px-5 py-2 text-xs font-semibold transition-all" style={{ backgroundColor: accent, color: '#fff' }} data-testid="driver-mode-btn">
              <Car size={14} className="inline mr-1.5 -mt-0.5" />Motorista
            </button>
          </div>
        </div>

        {/* Online / Offline Button */}
        <div className="px-4 -mt-6 relative z-10 space-y-3 pb-6">
          <button
            onClick={() => setIsOnline(prev => !prev)}
            className="w-full py-4 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.97]"
            style={{
              background: isOnline
                ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                : `linear-gradient(135deg, ${accent} 0%, #003060 100%)`,
              color: '#fff',
            }}
            data-testid="driver-online-btn"
          >
            {isOnline ? 'ONLINE — Recebendo corridas' : 'FICAR ONLINE'}
          </button>

          {/* Driver Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Hoje', value: 'R$ 0,00', sub: '0 corridas' },
              { label: 'Avaliação', value: '5.0', sub: 'Nota média' },
              { label: 'Aceitação', value: '100%', sub: 'Taxa' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl py-3 px-2 text-center" style={{ backgroundColor: cardBg }}>
                <p className="text-xs font-bold" style={{ color: textPrimary }}>{stat.value}</p>
                <p className="text-[10px]" style={{ color: textSecondary }}>{stat.label}</p>
                <p className="text-[9px] mt-0.5" style={{ color: textSecondary }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Driver Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Wallet, label: 'Ganhos', action: () => navigate('/extrato'), testId: 'driver-earnings' },
              { icon: Star, label: 'Avaliações', action: () => navigate('/profile'), testId: 'driver-ratings' },
              { icon: Settings, label: 'Configurações', action: () => navigate('/profile'), testId: 'driver-settings' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                style={{ backgroundColor: cardBg }}
                data-testid={item.testId}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                  <item.icon size={18} style={{ color: accent }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: textPrimary }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- PASSENGER MODE ---------- */
  return (
    <div className="max-w-lg mx-auto">
      {/* Map Area */}
      <div className="relative" style={{ height: '40vh', minHeight: '260px' }}>
        {googleMapsLoaded && userLocation ? (
          <GoogleMap origin={userLocation} center={userLocation} zoom={15} height="h-full" className="w-full" isDarkMode={isDarkMode} />
        ) : (
          <MiniMap isDarkMode={isDarkMode} accent={accent} />
        )}
        {/* Passenger/Driver Toggle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex rounded-full overflow-hidden shadow-lg z-10" style={{ backgroundColor: cardBg }}>
          <button className="px-5 py-2 text-xs font-semibold transition-all" style={{ backgroundColor: accent, color: '#fff' }} data-testid="passenger-mode-btn">
            <User size={14} className="inline mr-1.5 -mt-0.5" />Passageiro
          </button>
          <button onClick={() => setDriverMode(true)} className="px-5 py-2 text-xs font-semibold transition-all" style={{ backgroundColor: 'transparent', color: textSecondary }} data-testid="driver-mode-btn">
            <Car size={14} className="inline mr-1.5 -mt-0.5" />Motorista
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10 space-y-3 pb-6">
        <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: cardBg }}>
          <button
            onClick={() => navigate('/mobility/passenger')}
            className="w-full flex items-center gap-3 p-4 text-left"
            data-testid="destination-search-btn"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent }}>
              <Search size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: textPrimary }}>Para onde vamos?</p>
              <p className="text-xs" style={{ color: textSecondary }}>Busque um destino ou endereço</p>
            </div>
            <ChevronRight size={20} style={{ color: textSecondary }} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Car, label: 'Corrida', action: () => navigate('/mobility/passenger'), testId: 'quick-ride-btn' },
            { icon: Shield, label: 'Proteção', action: () => navigate('/protecao-veicular'), testId: 'quick-protection-btn' },
            { icon: Wifi, label: 'Internet', action: () => navigate('/internet-movel'), testId: 'quick-internet-btn' },
            { icon: Heart, label: 'Saúde', action: () => navigate('/telemedicina'), testId: 'quick-health-btn' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
              style={{ backgroundColor: cardBg }}
              data-testid={item.testId}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                <item.icon size={18} style={{ color: accent }} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: textPrimary }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Promotional Rotating Banner */}
        <PromoBanner accent={accent} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} navigate={navigate} isDarkMode={isDarkMode} />

        {/* Quick Access */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: cardBg }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Acesso rápido</h3>
          </div>
          <div className="space-y-2">
            {[
              { icon: Clock, label: 'Última corrida', desc: 'Repita sua última viagem', action: () => navigate('/mobility/passenger') },
              { icon: Calendar, label: 'Meus pedidos', desc: 'Acompanhar pedidos', action: () => navigate('/meus-pedidos') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:opacity-80 active:scale-[0.98]" data-testid={`quick-access-${i}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}12` }}>
                  <item.icon size={16} style={{ color: accent }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium" style={{ color: textPrimary }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: textSecondary }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: textSecondary }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============ PROMO ROTATING BANNER ============ */
const PromoBanner = ({ accent, cardBg, textPrimary, textSecondary, navigate, isDarkMode }) => {
  const [current, setCurrent] = useState(0);

  const promos = [
    {
      title: 'Proteção Veicular',
      desc: 'Proteja seu veículo com os melhores planos a partir de R$ 89/mês',
      cta: 'Cotar agora',
      action: () => navigate('/protecao-veicular'),
      gradient: 'linear-gradient(135deg, #0062B8 0%, #003D72 100%)',
      icon: Shield,
    },
    {
      title: 'Internet Móvel',
      desc: 'Planos de dados com cobertura nacional e preços exclusivos',
      cta: 'Ver planos',
      action: () => navigate('/internet-movel'),
      gradient: 'linear-gradient(135deg, #00897B 0%, #004D40 100%)',
      icon: Wifi,
    },
    {
      title: 'Telemedicina 24h',
      desc: 'Consultas médicas online, a qualquer hora, sem sair de casa',
      cta: 'Agendar consulta',
      action: () => navigate('/telemedicina'),
      gradient: 'linear-gradient(135deg, #C62828 0%, #7B1414 100%)',
      icon: Heart,
    },
    {
      title: 'Mobilidade Transmill',
      desc: 'Peça uma corrida P2P com motoristas parceiros da sua região',
      cta: 'Pedir corrida',
      action: () => navigate('/mobility/passenger'),
      gradient: `linear-gradient(135deg, ${accent} 0%, ${isDarkMode ? '#001a3a' : '#003060'} 100%)`,
      icon: Car,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  const promo = promos[current];
  const PromoIcon = promo.icon;

  return (
    <div data-testid="promo-banner">
      <button
        onClick={promo.action}
        className="w-full rounded-2xl p-4 text-left relative overflow-hidden transition-all active:scale-[0.98]"
        style={{ background: promo.gradient, minHeight: '100px' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15" style={{ backgroundColor: '#fff' }} />
        <div className="absolute -bottom-4 -right-12 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />

        <div className="relative z-10 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <PromoIcon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{promo.title}</p>
            <p className="text-[11px] text-white/75 mt-0.5 leading-snug">{promo.desc}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/20 text-white">
              {promo.cta}
            </span>
          </div>
        </div>
      </button>
      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              backgroundColor: i === current ? accent : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
              width: i === current ? '12px' : '6px',
            }}
            data-testid={`promo-dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ============ MINI MAP COMPONENT ============ */
const MiniMap = ({ isDarkMode, accent }) => {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    // Generate random car positions
    const initial = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      rotation: Math.random() * 360,
    }));
    setCars(initial);

    const interval = setInterval(() => {
      setCars(prev => prev.map(c => ({
        ...c,
        x: Math.max(5, Math.min(95, c.x + (Math.random() - 0.5) * 3)),
        y: Math.max(5, Math.min(95, c.y + (Math.random() - 0.5) * 3)),
        rotation: c.rotation + (Math.random() - 0.5) * 30,
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const roadColor = isDarkMode ? '#2a2a4a' : '#e0e0e0';
  const bgColor = isDarkMode ? '#0f0f23' : '#eef2f5';
  const buildingColor = isDarkMode ? '#1a1a3e' : '#d8dde3';
  const parkColor = isDarkMode ? '#1a2e1a' : '#c8e6c9';

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Grid streets */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Horizontal roads */}
        {[20, 40, 60, 80].map(y => (
          <rect key={`h${y}`} x="0" y={`${y}%`} width="100%" height="2" fill={roadColor} opacity="0.6" />
        ))}
        {/* Vertical roads */}
        {[25, 50, 75].map(x => (
          <rect key={`v${x}`} x={`${x}%`} y="0" width="2" height="100%" fill={roadColor} opacity="0.6" />
        ))}
        {/* Buildings */}
        {[
          { x: 5, y: 5, w: 15, h: 12 }, { x: 30, y: 8, w: 12, h: 10 },
          { x: 55, y: 3, w: 18, h: 14 }, { x: 80, y: 5, w: 14, h: 11 },
          { x: 8, y: 45, w: 13, h: 10 }, { x: 55, y: 45, w: 16, h: 12 },
          { x: 28, y: 65, w: 18, h: 10 }, { x: 78, y: 68, w: 15, h: 9 },
          { x: 5, y: 82, w: 16, h: 12 }, { x: 60, y: 82, w: 12, h: 11 },
        ].map((b, i) => (
          <rect key={`b${i}`} x={`${b.x}%`} y={`${b.y}%`} width={`${b.w}%`} height={`${b.h}%`} rx="4" fill={buildingColor} opacity="0.5" />
        ))}
        {/* Park */}
        <rect x="30%" y="22%" width="16%" height="14%" rx="8" fill={parkColor} opacity="0.4" />
      </svg>

      {/* Street labels */}
      <span className="absolute text-[8px] font-medium opacity-40 left-2 bottom-[22%]" style={{ color: isDarkMode ? '#888' : '#888' }}>
        Av. Transmill
      </span>
      <span className="absolute text-[8px] font-medium opacity-40 right-2 top-[42%] -rotate-90 origin-right" style={{ color: isDarkMode ? '#888' : '#888' }}>
        R. Mobilidade
      </span>

      {/* Cars */}
      {cars.map(car => (
        <div
          key={car.id}
          className="absolute transition-all duration-[2000ms] ease-in-out"
          style={{ left: `${car.x}%`, top: `${car.y}%`, transform: `translate(-50%, -50%) rotate(${car.rotation}deg)` }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: accent }}>
            <Car size={12} className="text-white" />
          </div>
        </div>
      ))}

      {/* User location pulse */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: accent }}>
          <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: accent }} />
        </div>
      </div>
    </div>
  );
};

/* ============ MARKETPLACE TAB ============ */
const MarketplaceTab = ({ isDarkMode, accent, navigate, API, headers, cardBg, textPrimary, textSecondary, bg }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get(`${API}/stores`, { headers });
        setStores(res.data?.stores || res.data?.merchants || []);
      } catch (e) {
        console.error('Erro ao buscar lojas:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [API]);

  const filtered = stores.filter(s =>
    !searchQuery || (s.nome_fantasia || s.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-6">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textSecondary }} />
        <Input
          placeholder="Buscar lojas e produtos..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 text-sm rounded-xl border"
          style={{ backgroundColor: cardBg, color: textPrimary, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          data-testid="marketplace-search"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['Todas', 'Alimentação', 'Moda', 'Eletrônicos', 'Saúde'].map((cat, i) => (
          <button
            key={cat}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: i === 0 ? accent : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              color: i === 0 ? '#fff' : textSecondary
            }}
            data-testid={`category-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Store Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: accent }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Store size={40} className="mx-auto mb-3 opacity-30" style={{ color: textSecondary }} />
          <p className="text-sm" style={{ color: textSecondary }}>
            {searchQuery ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível no momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 12).map((store) => (
            <button
              key={store._id || store.id}
              onClick={() => {
                const slug = store.slug || store._id || store.id;
                navigate(`/${slug}`);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: cardBg }}
              data-testid={`store-${store.slug || 'item'}`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${accent}10` }}>
                {store.logo_url || store.profile_image ? (
                  <img src={store.logo_url || store.profile_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store size={22} style={{ color: accent }} />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                  {store.nome_fantasia || store.company_name || 'Loja'}
                </p>
                <p className="text-[10px] truncate" style={{ color: textSecondary }}>
                  {store.category || store.segmento || 'Marketplace'}
                </p>
                {store.distance_km && (
                  <p className="text-[10px]" style={{ color: accent }}>
                    <MapPin size={10} className="inline -mt-0.5 mr-0.5" />
                    {store.distance_km.toFixed(1)} km
                  </p>
                )}
              </div>
              <ChevronRight size={18} style={{ color: textSecondary }} />
            </button>
          ))}
        </div>
      )}

      {/* View All */}
      <button
        onClick={() => navigate('/lojas')}
        className="w-full py-3 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
        style={{ backgroundColor: `${accent}10`, color: accent }}
        data-testid="view-all-stores-btn"
      >
        Ver todas as lojas
      </button>
    </div>
  );
};

/* ============ SERVICES TAB ============ */
const ServicesTab = ({ isDarkMode, accent, navigate, API, headers, cardBg, textPrimary, textSecondary, bg }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await axios.get(`${API}/prestadores`, { headers });
        setProviders(res.data?.prestadores || res.data?.providers || []);
      } catch (e) {
        console.error('Erro ao buscar prestadores:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [API]);

  const serviceCategories = [
    { icon: Wrench, label: 'Manutenção', desc: 'Reparo e manutenção' },
    { icon: Briefcase, label: 'Profissionais', desc: 'Serviços diversos' },
    { icon: Shield, label: 'Proteção', desc: 'Segurança veicular' },
    { icon: Heart, label: 'Saúde', desc: 'Telemedicina' },
    { icon: Wifi, label: 'Tecnologia', desc: 'Internet e TI' },
    { icon: Phone, label: 'Suporte', desc: 'Atendimento 24h' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-6">
      <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Categorias de Serviços</h2>

      {/* Category Grid */}
      <div className="grid grid-cols-3 gap-3">
        {serviceCategories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => navigate('/prestadores')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95"
            style={{ backgroundColor: cardBg }}
            data-testid={`service-cat-${cat.label.toLowerCase()}`}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}12` }}>
              <cat.icon size={20} style={{ color: accent }} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: textPrimary }}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Provider Listings */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Prestadores próximos</h2>
        <button onClick={() => navigate('/prestadores')} className="text-xs font-medium" style={{ color: accent }} data-testid="view-all-providers-btn">
          Ver todos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: accent }} />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" style={{ color: textSecondary }} />
          <p className="text-sm" style={{ color: textSecondary }}>Nenhum prestador disponível</p>
          <Button onClick={() => navigate('/prestadores')} className="mt-3" size="sm" style={{ backgroundColor: accent }}>
            Explorar prestadores
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.slice(0, 8).map((prov) => (
            <div
              key={prov._id || prov.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: cardBg }}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${accent}10` }}>
                {prov.profile_image ? (
                  <img src={prov.profile_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} style={{ color: accent }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                  {prov.full_name || prov.nome_fantasia || 'Prestador'}
                </p>
                <p className="text-[10px]" style={{ color: textSecondary }}>
                  {prov.specialty || prov.segmento || 'Serviços gerais'}
                </p>
              </div>
              {prov.rating && (
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium" style={{ color: textPrimary }}>{prov.rating}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============ FINANCE TAB ============ */
const FinanceTab = ({ isDarkMode, accent, navigate, API, headers, user, cardBg, textPrimary, textSecondary, bg }) => {
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${API}/user/profile`, { headers });
        if (res.data) {
          setBalance({
            brl: (res.data.balance || 0) + (res.data.cashback_balance || 0),
            usdt: res.data.usdt_balance || 0,
          });
        }
      } catch (e) {
        console.error('Erro ao buscar saldo:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [API]);

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const quickActions = [
    { icon: DollarSign, label: 'Depositar', action: () => navigate('/deposito'), testId: 'fin-deposit-btn' },
    { icon: ArrowRight, label: 'Sacar', action: () => navigate('/sacar'), testId: 'fin-withdraw-btn' },
    { icon: CreditCard, label: 'Pagar', action: () => navigate('/payment'), testId: 'fin-pay-btn' },
    { icon: DollarSign, label: 'USDT', action: () => navigate('/usdt'), testId: 'fin-usdt-btn' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-6">
      {/* Balance Card */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: accent }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-white/70">Saldo disponível</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? '...' : showBalance ? formatCurrency(balance.brl) : 'R$ ••••••'}
              </p>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/80 p-1" data-testid="toggle-balance-btn">
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              USDT: {loading ? '...' : showBalance ? balance.usdt.toFixed(4) : '••••'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
            style={{ backgroundColor: cardBg }}
            data-testid={item.testId}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
              <item.icon size={18} style={{ color: accent }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: textPrimary }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Finance Sections */}
      <div className="space-y-2">
        {[
          { icon: Wallet, label: 'Carteira', desc: 'Gerenciar saldo e cashback', action: () => navigate('/extrato'), testId: 'fin-wallet-btn' },
          { icon: User, label: 'Indicar amigos', desc: 'Ganhe bônus por indicações', action: () => navigate('/indicar'), testId: 'fin-refer-btn' },
          { icon: Shield, label: 'Proteção veicular', desc: 'Cotações e planos de proteção', action: () => navigate('/protecao-veicular'), testId: 'fin-protection-btn' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: cardBg }}
            data-testid={item.testId}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}12` }}>
              <item.icon size={18} style={{ color: accent }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: textPrimary }}>{item.label}</p>
              <p className="text-[10px]" style={{ color: textSecondary }}>{item.desc}</p>
            </div>
            <ChevronRight size={18} style={{ color: textSecondary }} />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ============ PROFILE MENU ============ */
const ProfileMenu = ({ user, isDarkMode, navigate, franquiaContext, onClose, accent }) => {
  const menuBg = isDarkMode ? '#1e1e3a' : '#ffffff';
  const menuText = isDarkMode ? '#e0e0e0' : '#333333';
  const menuHover = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const items = [];

  items.push({ icon: User, label: 'Perfil', action: () => navigate('/profile') });

  // Master admin
  if ((user?.user_type === 'master' || user?.user_type === 'transmill_master' || user?.is_master_account) && !user?.franquia_slug && !franquiaContext) {
    items.push({ icon: LayoutDashboard, label: 'Painel Admin', action: () => navigate('/master') });
  }

  // Franchise/Unidade
  if (user?.user_type === 'labelview_unidade' || user?.franquia_slug || franquiaContext?.slug) {
    const slug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
    items.push({ icon: LayoutDashboard, label: 'Painel Admin', action: () => navigate(slug ? `/franquia/${slug}/admin` : '/master') });
    items.push({ icon: Shield, label: 'Painel Proteção', action: () => navigate(slug ? `/franquia/${slug}/labelview` : '/labelview/dashboard') });
    items.push({ icon: MessageCircle, label: 'Suporte', action: () => navigate('/suporte') });
  }

  // Labelview roles
  if (['labelview_master', 'labelview_regional', 'labelview_consultor'].includes(user?.user_type) && !user?.franquia_slug) {
    items.push({ icon: Shield, label: 'Labelview', action: () => navigate('/labelview/dashboard') });
  }

  // Cliente
  if (user?.user_type === 'cliente') {
    items.push({ icon: Shield, label: 'Minha Proteção', action: () => navigate('/minha-protecao') });
    items.push({ icon: Bell, label: 'Minhas Solicitações', action: () => navigate('/minhas-solicitacoes') });
    items.push({ icon: ShoppingBag, label: 'Meus Pedidos', action: () => navigate('/meus-pedidos') });
  }

  // Lojista
  if (user?.user_type === 'lojista') {
    items.push({ icon: Store, label: 'Meu Negócio', action: () => navigate('/meu-negocio') });
    items.push({ icon: Users, label: 'Equipe', action: () => navigate('/equipe') });
  }

  const handleLogout = () => {
    const slug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = slug ? `/franquia/${slug}/login` : '/login';
  };

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl border py-1.5 z-20" style={{ backgroundColor: menuBg, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-sm transition-colors"
            style={{ color: menuText }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = menuHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            data-testid={`menu-${item.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <item.icon size={16} style={{ color: accent }} />
            {item.label}
          </button>
        ))}
        <div className="mx-3 my-1 border-t" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-sm text-red-500 transition-colors"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          data-testid="menu-logout"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  );
};

/* ============ BOTTOM NAVIGATION ============ */
const BottomNav = ({ activeTab, setActiveTab, isDarkMode, accent, textPrimary }) => {
  const tabs = [
    { id: TAB_MOBILITY, icon: Car, label: 'Mobilidade' },
    { id: TAB_MARKETPLACE, icon: Utensils, label: 'Lojas' },
    { id: TAB_SERVICES, icon: Wrench, label: 'Serviços' },
    { id: TAB_FINANCE, icon: DollarSign, label: 'Finanças' },
  ];

  const navBg = isDarkMode ? '#16213e' : '#ffffff';
  const inactiveColor = isDarkMode ? '#666' : '#999';

  return (
    <nav
      className="flex-shrink-0 z-40"
      style={{
        backgroundColor: navBg,
        borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      data-testid="bottom-nav"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all relative"
              data-testid={`nav-${tab.id}`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
              )}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? `${accent}18` : 'transparent',
                }}
              >
                <tab.icon size={18} style={{ color: isActive ? accent : inactiveColor }} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: isActive ? accent : inactiveColor }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default HomePage;
