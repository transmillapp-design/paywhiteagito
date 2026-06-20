import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';
import { usePWA } from '../hooks/usePWA';
import { GoogleMap, useGoogleMaps } from '../components/mobility/GoogleMapsIntegration';
import {
  Search, Car, Store, Wrench, DollarSign,
  ArrowRight, User, Menu, Sun, Moon, LogOut, MapPin, Clock,
  Wallet, Eye, EyeOff, CreditCard, Download, LayoutDashboard,
  MessageCircle, ShoppingBag, Users, Star, Navigation,
  Loader2, ChevronRight, Phone, Utensils, Briefcase,
  Bell, Settings, Home, Package
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

  const accent = franquiaContext?.cor_primaria || '#005B9C';
  const accentSecondary = franquiaContext?.cor_secundaria || '#EEEEEE';
  const brandName = franquiaContext?.nome || 'Transmill';
  const logoUrl = franquiaContext?.logo_url;

  const displayName = (user?.nome_fantasia || user?.company_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário').split(' ')[0];

  const pageBg = isDarkMode ? '#0a0e1a' : '#f5f5f5';
  const cardBg = isDarkMode ? '#1a1f35' : '#ffffff';
  const textPrimary = isDarkMode ? '#f0f0f0' : '#1a1a1a';
  const textSecondary = isDarkMode ? '#8a8a9a' : '#666666';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: pageBg }} data-testid="homepage">
      {/* ====== HEADER (estilo 99) ====== */}
      <header
        className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between z-30"
        style={{ backgroundColor: accent }}
        data-testid="app-header"
      >
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          )}
          <span className="text-white font-semibold text-base" data-testid="user-greeting">
            Olá, {displayName}!
          </span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => navigate('/wallet')}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white"
            data-testid="header-pix-btn"
          >
            Pix
          </button>
          <NotificationBell token={token} API={API} isDarkMode={false} accent="#ffffff" />
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15"
            data-testid="profile-menu-btn"
          >
            <Menu size={16} className="text-white" />
          </button>
          {showProfileMenu && (
            <ProfileMenu user={user} isDarkMode={isDarkMode} navigate={navigate} franquiaContext={franquiaContext} onClose={() => setShowProfileMenu(false)} accent={accent} />
          )}
        </div>
      </header>

      {/* ====== CONTENT SCROLL ====== */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: '90px' }}>
        {activeTab === TAB_MOBILITY && (
          <MobilityTab
            accent={accent} isDarkMode={isDarkMode} cardBg={cardBg}
            textPrimary={textPrimary} textSecondary={textSecondary}
            navigate={navigate} user={user} API={API} headers={headers}
            brandName={brandName}
          />
        )}
        {activeTab === TAB_MARKETPLACE && (
          <MarketplaceTab
            accent={accent} isDarkMode={isDarkMode} cardBg={cardBg}
            textPrimary={textPrimary} textSecondary={textSecondary}
            navigate={navigate} API={API} headers={headers}
          />
        )}
        {activeTab === TAB_SERVICES && (
          <ServicesTab
            accent={accent} isDarkMode={isDarkMode} cardBg={cardBg}
            textPrimary={textPrimary} textSecondary={textSecondary}
            navigate={navigate}
          />
        )}
        {activeTab === TAB_FINANCE && (
          <FinanceTab
            accent={accent} isDarkMode={isDarkMode} cardBg={cardBg}
            textPrimary={textPrimary} textSecondary={textSecondary}
            navigate={navigate} user={user} API={API} headers={headers}
          />
        )}
      </main>

      {/* ====== FLOATING BOTTOM NAV (estilo 99) ====== */}
      <BottomNav
        activeTab={activeTab} setActiveTab={setActiveTab}
        isDarkMode={isDarkMode} accent={accent} textPrimary={textPrimary}
      />
    </div>
  );
};

/* ============ MOBILITY TAB (estilo 99) ============ */
const MobilityTab = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate, user, API, headers, brandName }) => {
  const { isLoaded } = useGoogleMaps();
  const [isDriverMode, setIsDriverMode] = useState(false);

  // Driver state
  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkDriver = async () => {
      try {
        const res = await axios.get(`${API}/api/mobility/driver/profile`, { headers });
        if (res.data?.exists) {
          setDriverProfile(res.data.profile);
          setIsOnline(res.data.profile?.is_online || false);
        }
      } catch (e) { /* not a driver */ }
    };
    checkDriver();
  }, []);

  const promos = [
    {
      title: `${brandName} Pay`,
      desc: 'Ganhe cashback em todas as corridas e compras na plataforma',
      cta: 'Saiba mais',
      action: () => navigate('/wallet'),
      gradient: `linear-gradient(135deg, ${accent} 0%, ${isDarkMode ? '#001a3a' : '#003060'} 100%)`,
      icon: Wallet,
    },
    {
      title: 'Lojas Parceiras',
      desc: 'Encontre produtos e serviços com cashback na sua região',
      cta: 'Explorar lojas',
      action: () => navigate('/stores'),
      gradient: 'linear-gradient(135deg, #00897B 0%, #004D40 100%)',
      icon: ShoppingBag,
    },
  ];

  if (isDriverMode) {
    return <DriverModeView accent={accent} isDarkMode={isDarkMode} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} navigate={navigate} user={user} API={API} headers={headers} driverProfile={driverProfile} isOnline={isOnline} setIsOnline={setIsOnline} setIsDriverMode={setIsDriverMode} isLoaded={isLoaded} />;
  }

  return (
    <div data-testid="mobility-tab">
      {/* MAP (estilo 99 - ocupa ~40% da tela) */}
      <div className="w-full relative" style={{ height: '240px' }}>
        {isLoaded ? (
          <GoogleMap
            center={{ lat: -22.9068, lng: -43.1729 }}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? '#1a2235' : '#e8f0fe' }}>
            <Loader2 className="animate-spin" size={28} style={{ color: accent }} />
          </div>
        )}
      </div>

      {/* SEARCH BAR "Para onde vamos?" (estilo 99) */}
      <div className="px-4 -mt-5 relative z-10">
        <button
          onClick={() => navigate('/mobility/passenger')}
          className="w-full rounded-2xl shadow-lg px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: cardBg }}
          data-testid="search-destination-btn"
        >
          <Search size={20} style={{ color: textSecondary }} />
          <span className="font-semibold text-base" style={{ color: textPrimary }}>
            Para onde vamos?
          </span>
        </button>

        {/* Recent location */}
        <div className="flex items-center gap-3 mt-3 px-1">
          <Clock size={16} style={{ color: textSecondary }} />
          <span className="text-sm" style={{ color: textSecondary }}>
            {user?.last_address || 'Escolha seu destino'}
          </span>
        </div>
      </div>

      {/* BANNER PROMOCIONAL (estilo 99) */}
      <div className="px-4 mt-4">
        <BannerCarousel promos={promos} accent={accent} isDarkMode={isDarkMode} cardBg={cardBg} textPrimary={textPrimary} />
      </div>

      {/* LOJAS RECOMENDADAS (estilo 99) */}
      <StoresPreview accent={accent} isDarkMode={isDarkMode} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} navigate={navigate} API={API} headers={headers} />

      {/* Toggle Motorista (pequeno link) */}
      {driverProfile && (
        <div className="px-4 mt-4 mb-4">
          <button
            onClick={() => setIsDriverMode(true)}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: `${accent}12`, color: accent, border: `1px solid ${accent}30` }}
            data-testid="switch-to-driver-btn"
          >
            <Car size={16} />
            Alternar para modo Motorista
          </button>
        </div>
      )}
    </div>
  );
};

/* ============ DRIVER MODE ============ */
const DriverModeView = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate, user, API, headers, driverProfile, isOnline, setIsOnline, setIsDriverMode, isLoaded }) => {
  const toggleOnline = async () => {
    try {
      await axios.put(`${API}/api/mobility/driver/availability?is_online=${!isOnline}`, {}, { headers });
      setIsOnline(!isOnline);
    } catch (e) { console.error(e); }
  };

  return (
    <div data-testid="driver-mode">
      {/* Map fullwidth */}
      <div className="w-full relative" style={{ height: '300px' }}>
        {isLoaded ? (
          <GoogleMap center={{ lat: -22.9068, lng: -43.1729 }} zoom={14} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? '#1a2235' : '#e8f0fe' }}>
            <Loader2 className="animate-spin" size={28} style={{ color: accent }} />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-10 space-y-3">
        {/* Online toggle */}
        <button
          onClick={toggleOnline}
          className="w-full rounded-2xl shadow-lg py-4 font-bold text-white text-center active:scale-[0.98] transition-all"
          style={{ backgroundColor: isOnline ? '#16a34a' : accent }}
          data-testid="toggle-online-btn"
        >
          {isOnline ? 'Você está Online - Aceitando corridas' : 'Ficar Online'}
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ganhos hoje', value: 'R$ 0,00', icon: DollarSign },
            { label: 'Avaliação', value: driverProfile?.rating?.toFixed(1) || '5.0', icon: Star },
            { label: 'Corridas', value: driverProfile?.total_rides || '0', icon: Navigation },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: cardBg }}>
              <s.icon size={16} className="mx-auto mb-1" style={{ color: accent }} />
              <p className="text-sm font-bold" style={{ color: textPrimary }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: textSecondary }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Back to passenger */}
        <button
          onClick={() => setIsDriverMode(false)}
          className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: `${accent}12`, color: accent }}
          data-testid="switch-to-passenger-btn"
        >
          <User size={16} />
          Voltar para modo Passageiro
        </button>
      </div>
    </div>
  );
};

/* ============ STORES PREVIEW (horizontal scroll estilo 99) ============ */
const StoresPreview = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate, API, headers }) => {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get(`${API}/api/stores?limit=10`, { headers });
        setStores(res.data?.stores || []);
      } catch (e) { /* no stores */ }
    };
    fetchStores();
  }, []);

  return (
    <div className="mt-5 mb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="font-bold text-sm" style={{ color: textPrimary }}>
          Lojas recomendadas na região
        </h3>
        <button onClick={() => navigate('/stores')} className="text-xs font-medium flex items-center gap-1" style={{ color: accent }} data-testid="stores-see-more">
          Mais <ChevronRight size={14} />
        </button>
      </div>

      {stores.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => navigate(`/store/${store.slug || store.id}`)}
              className="flex-shrink-0 w-40 rounded-xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform"
              style={{ backgroundColor: cardBg }}
              data-testid={`store-card-${store.id}`}
            >
              <div className="w-full h-24 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative" style={{ backgroundColor: isDarkMode ? '#2a2f48' : '#f0f0f0' }}>
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.nome_fantasia} className="w-full h-full object-cover" />
                ) : (
                  <Store size={24} style={{ color: textSecondary }} />
                )}
                {store.rating && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-white/90 rounded-full px-1.5 py-0.5">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-bold text-gray-800">{store.rating}</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{store.nome_fantasia || store.name}</p>
                <p className="text-[10px] truncate" style={{ color: textSecondary }}>{store.business_segment || 'Loja parceira'}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: cardBg }}>
            <Store size={24} className="mx-auto mb-2" style={{ color: textSecondary }} />
            <p className="text-sm" style={{ color: textSecondary }}>Nenhuma loja disponível na região</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============ MARKETPLACE TAB ============ */
const MarketplaceTab = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate, API, headers }) => {
  const [stores, setStores] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/stores`, { headers });
        setStores(res.data?.stores || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStores();
  }, []);

  const filtered = selectedCat === 'Todas' ? stores : stores.filter(s => s.business_segment === selectedCat);

  return (
    <div className="px-4 py-4 space-y-4" data-testid="marketplace-tab">
      <h2 className="font-bold text-lg" style={{ color: textPrimary }}>Lojas e Produtos</h2>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {['Todas', 'Alimentação', 'Moda', 'Eletrônicos', 'Serviços'].map((cat, i) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: selectedCat === cat ? accent : (isDarkMode ? '#1e2340' : '#f0f0f0'),
              color: selectedCat === cat ? '#fff' : textSecondary,
            }}
            data-testid={`cat-filter-${i}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} style={{ color: accent }} /></div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((store) => (
            <button
              key={store.id}
              onClick={() => navigate(`/store/${store.slug || store.id}`)}
              className="rounded-xl overflow-hidden shadow-sm text-left active:scale-[0.97] transition-transform"
              style={{ backgroundColor: cardBg }}
              data-testid={`marketplace-store-${store.id}`}
            >
              <div className="w-full h-28 flex items-center justify-center" style={{ backgroundColor: isDarkMode ? '#2a2f48' : '#f0f0f0' }}>
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.nome_fantasia} className="w-full h-full object-cover" />
                ) : (
                  <Store size={28} style={{ color: textSecondary }} />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{store.nome_fantasia || store.name}</p>
                <p className="text-[10px]" style={{ color: textSecondary }}>{store.business_segment || 'Parceiro'}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: cardBg }}>
          <Store size={28} className="mx-auto mb-2" style={{ color: textSecondary }} />
          <p className="text-sm" style={{ color: textSecondary }}>Nenhuma loja encontrada</p>
        </div>
      )}
    </div>
  );
};

/* ============ SERVICES TAB ============ */
const ServicesTab = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate }) => {
  const categories = [
    { icon: Wrench, label: 'Manutenção', desc: 'Reparos e consertos' },
    { icon: Car, label: 'Automotivo', desc: 'Serviços veiculares' },
    { icon: Home, label: 'Casa', desc: 'Serviços residenciais' },
    { icon: Phone, label: 'Suporte', desc: 'Atendimento 24h' },
  ];

  return (
    <div className="px-4 py-4 space-y-4" data-testid="services-tab">
      <h2 className="font-bold text-lg" style={{ color: textPrimary }}>Serviços</h2>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => navigate(`/services?category=${cat.label}`)}
            className="rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-[0.97] transition-transform"
            style={{ backgroundColor: cardBg }}
            data-testid={`service-${cat.label.toLowerCase()}`}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
              <cat.icon size={22} style={{ color: accent }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: textPrimary }}>{cat.label}</p>
            <p className="text-[10px]" style={{ color: textSecondary }}>{cat.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ============ FINANCE TAB ============ */
const FinanceTab = ({ accent, isDarkMode, cardBg, textPrimary, textSecondary, navigate, user, API, headers }) => {
  const [balance, setBalance] = useState({ brl: 0, usdt: 0, cashback: 0 });
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${API}/api/wallet/balance`, { headers });
        setBalance({
          brl: res.data?.balance || 0,
          usdt: res.data?.usdt_balance || 0,
          cashback: res.data?.cashback_balance || 0,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchBalance();
  }, []);

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="px-4 py-4 space-y-4" data-testid="finance-tab">
      {/* Balance Card */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: accent }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-white/70">Saldo disponível</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? '...' : showBalance ? fmt(balance.brl) : 'R$ ••••••'}
              </p>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/80 p-1" data-testid="toggle-balance-btn">
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-medium bg-white/20 text-white">
              USDT: {loading ? '...' : showBalance ? balance.usdt.toFixed(4) : '••••'}
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-medium bg-white/20 text-white">
              Cashback: {loading ? '...' : showBalance ? fmt(balance.cashback) : '••••'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: 'Depositar', action: () => navigate('/deposito'), testId: 'fin-deposit-btn' },
          { icon: ArrowRight, label: 'Sacar', action: () => navigate('/sacar'), testId: 'fin-withdraw-btn' },
          { icon: CreditCard, label: 'Pagar', action: () => navigate('/payment'), testId: 'fin-pay-btn' },
          { icon: DollarSign, label: 'USDT', action: () => navigate('/usdt'), testId: 'fin-usdt-btn' },
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

      {/* Quick Links */}
      <div className="space-y-2">
        {[
          { icon: Wallet, label: 'Extrato completo', desc: 'Histórico de transações', action: () => navigate('/extrato'), testId: 'fin-wallet-btn' },
          { icon: User, label: 'Indicar amigos', desc: 'Ganhe bônus por indicações', action: () => navigate('/indicar'), testId: 'fin-refer-btn' },
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
            <div className="text-left flex-1">
              <p className="text-sm font-medium" style={{ color: textPrimary }}>{item.label}</p>
              <p className="text-[10px]" style={{ color: textSecondary }}>{item.desc}</p>
            </div>
            <ChevronRight size={16} style={{ color: textSecondary }} />
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

  if ((user?.user_type === 'master' || user?.user_type === 'transmill_master' || user?.is_master_account) && !user?.franquia_slug && !franquiaContext) {
    items.push({ icon: LayoutDashboard, label: 'Painel Admin', action: () => navigate('/master') });
  }

  if (user?.user_type === 'labelview_unidade' || user?.franquia_slug || franquiaContext?.slug) {
    const slug = user?.franquia_slug || franquiaContext?.slug || localStorage.getItem('franquia_slug');
    items.push({ icon: LayoutDashboard, label: 'Painel Admin', action: () => navigate(slug ? `/franquia/${slug}/admin` : '/master') });
  }

  if (user?.user_type === 'cliente') {
    items.push({ icon: ShoppingBag, label: 'Meus Pedidos', action: () => navigate('/meus-pedidos') });
  }

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
          <button key={i} onClick={() => { item.action(); onClose(); }}
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
        <button onClick={handleLogout}
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

/* ============ BANNER CAROUSEL ============ */
const BannerCarousel = ({ promos, accent, isDarkMode, cardBg, textPrimary }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promos.length]);

  if (!promos.length) return null;
  const promo = promos[currentSlide];

  return (
    <div className="relative">
      <button
        onClick={promo.action}
        className="w-full rounded-2xl p-4 relative overflow-hidden active:scale-[0.98] transition-transform"
        style={{ background: promo.gradient, minHeight: '90px' }}
        data-testid="promo-banner"
      >
        <div className="absolute top-2 right-3 opacity-10">
          {promo.icon && <promo.icon size={60} className="text-white" />}
        </div>
        <div className="relative z-10">
          <p className="text-white font-bold text-sm">{promo.title}</p>
          <p className="text-white/80 text-xs mt-1 max-w-[80%]">{promo.desc}</p>
          <span className="inline-block mt-2 text-[11px] font-semibold text-white bg-white/20 px-3 py-1 rounded-full">
            {promo.cta}
          </span>
        </div>
      </button>
      {/* Dots */}
      {promos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {promos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ backgroundColor: i === currentSlide ? accent : (isDarkMode ? '#444' : '#ccc'), transform: i === currentSlide ? 'scale(1.3)' : 'scale(1)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ============ FLOATING BOTTOM NAV (estilo 99 - flutuante, arredondado) ============ */
const BottomNav = ({ activeTab, setActiveTab, isDarkMode, accent, textPrimary }) => {
  const tabs = [
    { id: TAB_MOBILITY, icon: Car, label: 'Mobilidade' },
    { id: TAB_MARKETPLACE, icon: Utensils, label: 'Lojas' },
    { id: TAB_SERVICES, icon: Package, label: 'Serviços' },
    { id: TAB_FINANCE, icon: DollarSign, label: 'Carteira' },
  ];

  const navBg = isDarkMode ? '#1a1f35' : '#ffffff';
  const inactiveColor = isDarkMode ? '#555' : '#aaa';

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
    >
      <div
        className="flex items-center rounded-full shadow-2xl"
        style={{
          backgroundColor: navBg,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all relative"
              data-testid={`nav-${tab.id}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? accent : 'transparent',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <tab.icon
                  size={isActive ? 20 : 18}
                  style={{ color: isActive ? '#ffffff' : inactiveColor }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-all"
                style={{ color: isActive ? accent : inactiveColor }}
              >
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
