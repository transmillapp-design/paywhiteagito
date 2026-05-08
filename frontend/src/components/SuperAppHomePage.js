import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import WalletModal from './WalletModal';
import NotificationBell from './NotificationBell';
import {
  Search,
  Car,
  MapPin,
  Clock,
  ChevronRight,
  QrCode,
  DollarSign,
  Utensils,
  Briefcase,
  ShoppingCart,
  User,
  Navigation,
  Star,
  Percent,
  Loader2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const SuperAppHomePage = ({ franquiaContext = null }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState('mobility'); // mobility, food, services, pay
  const [userMode, setUserMode] = useState('passenger'); // passenger ou driver
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAddress, setCurrentAddress] = useState('Carregando localização...');
  const [showWallet, setShowWallet] = useState(false);
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });
  const [stores, setStores] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Cores da franquia (white-label)
  const primaryColor = franquiaContext?.cores?.primaria || user?.cor_primaria || '#FFD700';
  const secondaryColor = franquiaContext?.cores?.secundaria || user?.cor_secundaria || '#1a1a1a';
  const logoUrl = franquiaContext?.logo || user?.logo_url || null;
  const franquiaName = franquiaContext?.nome || user?.nome_fantasia || 'Transmill';

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocoding para obter endereço
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              const { road, house_number, suburb, city } = data.address;
              setCurrentAddress(`${road || ''} ${house_number || ''}, ${suburb || city || ''}`);
            }
          } catch (error) {
            setCurrentAddress('Localização disponível');
          }
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
          setCurrentAddress('Ative a localização');
        }
      );
    }
  }, []);

  // Carregar saldo
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/user/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setBalance({
            brl: response.data.balance || 0,
            usdt: response.data.usdt_balance || 0
          });
        }
      } catch (error) {
        console.log('Erro ao carregar saldo:', error);
      }
    };
    fetchBalance();
  }, []);

  // Carregar lojas
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const response = await axios.get(`${API}/api/stores?limit=10`);
        if (response.data.stores) {
          setStores(response.data.stores);
        }
      } catch (error) {
        console.log('Erro ao carregar lojas:', error);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Carregar prestadores
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/prestadores/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setServices(response.data.prestadores || []);
        }
      } catch (error) {
        console.log('Erro ao carregar prestadores:', error);
      }
    };
    fetchServices();
  }, []);

  // Navegar para solicitar corrida
  const handleRequestRide = () => {
    if (userMode === 'passenger') {
      navigate('/mobility/request');
    } else {
      navigate('/mobility/driver');
    }
  };

  // Renderizar mapa placeholder
  const renderMap = () => (
    <div 
      className="relative w-full h-48 rounded-2xl overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)'
      }}
    >
      {/* Simulação de mapa com ruas */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#666" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Marcadores de carros */}
      <div className="absolute top-8 left-12 bg-black p-1 rounded">
        <Car className="h-3 w-3 text-white" />
      </div>
      <div className="absolute top-16 right-20 bg-black p-1 rounded">
        <Car className="h-3 w-3 text-white" />
      </div>
      <div className="absolute bottom-20 left-24 bg-black p-1 rounded">
        <Car className="h-3 w-3 text-white" />
      </div>
      
      {/* Localização do usuário */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div 
            className="w-4 h-4 rounded-full animate-ping absolute"
            style={{ backgroundColor: primaryColor, opacity: 0.3 }}
          />
          <div 
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: '#2196F3' }}
          />
        </div>
      </div>

      {/* Toggle Passageiro/Motorista */}
      <div className="absolute top-3 left-3 flex gap-1 bg-white/90 rounded-full p-1 shadow-lg">
        <button
          onClick={() => setUserMode('passenger')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            userMode === 'passenger' 
              ? 'text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: userMode === 'passenger' ? primaryColor : 'transparent' }}
        >
          Passageiro
        </button>
        <button
          onClick={() => setUserMode('driver')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            userMode === 'driver' 
              ? 'text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: userMode === 'driver' ? primaryColor : 'transparent' }}
        >
          Motorista
        </button>
      </div>
    </div>
  );

  // Renderizar barra de busca de destino
  const renderSearchBar = () => (
    <div className="bg-white rounded-2xl shadow-lg p-4 -mt-6 relative z-10 mx-4">
      <div 
        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleRequestRide}
      >
        <Search className="h-5 w-5 text-gray-400" />
        <span className="text-gray-800 font-medium">Para onde vamos?</span>
      </div>
      
      <div className="flex items-center gap-3 mt-3 px-1">
        <div className="p-2 bg-gray-100 rounded-full">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">{currentAddress}</p>
        </div>
        <Navigation className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );

  // Renderizar banner promocional
  const renderPromoBanner = () => (
    <div className="px-4 mt-4">
      <div 
        className="relative rounded-2xl overflow-hidden p-4"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-orange-500 text-white text-xs">PROMOÇÃO</Badge>
          <Badge className="bg-red-500 text-white text-xs">CASHBACK</Badge>
        </div>
        
        <h3 className="text-white font-bold text-lg mb-1">
          Ganhe até 10% de volta
        </h3>
        <p className="text-white/80 text-sm mb-3">
          Em corridas e compras no {franquiaName}
        </p>
        
        <Button 
          size="sm"
          className="bg-white text-gray-900 hover:bg-gray-100"
        >
          Saiba mais
        </Button>
        
        {/* Decoração */}
        <div className="absolute top-2 right-2 opacity-20">
          <Percent className="h-20 w-20 text-white" />
        </div>
      </div>
    </div>
  );

  // Renderizar seção de lojas (Marketplace)
  const renderStoresSection = () => (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Lojas recomendadas</h2>
        <button 
          className="text-sm flex items-center gap-1 hover:opacity-80"
          style={{ color: primaryColor }}
          onClick={() => navigate('/stores')}
        >
          Mais <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {loadingStores ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Nenhuma loja disponível</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {stores.slice(0, 6).map((store, index) => (
            <div 
              key={store.id || index}
              className="flex-shrink-0 w-36 cursor-pointer"
              onClick={() => navigate(`/stores/${store.id}`)}
            >
              <div className="relative rounded-xl overflow-hidden h-28 bg-gray-200">
                {store.profile_image ? (
                  <img 
                    src={store.profile_image} 
                    alt={store.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Store className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                {store.cashback_rate > 0 && (
                  <div 
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs text-white font-medium"
                    style={{ backgroundColor: '#2E7D32' }}
                  >
                    {store.cashback_rate}% cashback
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                {store.full_name || store.company_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {store.business_segment || 'Loja'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar seção de serviços (Prestadores)
  const renderServicesSection = () => (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Serviços disponíveis</h2>
        <button 
          className="text-sm flex items-center gap-1 hover:opacity-80"
          style={{ color: primaryColor }}
          onClick={() => navigate('/services')}
        >
          Mais <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {services.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum serviço disponível</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {services.slice(0, 6).map((service, index) => (
            <div 
              key={service.id || index}
              className="flex-shrink-0 w-36 cursor-pointer"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <div className="relative rounded-xl overflow-hidden h-28 bg-gray-200">
                {service.profile_image ? (
                  <img 
                    src={service.profile_image} 
                    alt={service.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                    <Briefcase className="h-8 w-8 text-blue-400" />
                  </div>
                )}
                
                {service.rating && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{service.rating}</span>
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                {service.full_name || service.company_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {service.service_type || 'Prestador'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar barra de navegação inferior
  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {/* Mobilidade */}
        <button
          onClick={() => setActiveTab('mobility')}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <div 
            className={`p-2 rounded-full transition-all ${
              activeTab === 'mobility' ? 'shadow-lg scale-110' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'mobility' ? primaryColor : 'transparent'
            }}
          >
            <Car 
              className={`h-6 w-6 ${activeTab === 'mobility' ? 'text-white' : 'text-gray-500'}`}
            />
          </div>
          {activeTab !== 'mobility' && (
            <span className="text-xs text-gray-500 mt-1">Mobilidade</span>
          )}
        </button>

        {/* Food/Lojas */}
        <button
          onClick={() => {
            setActiveTab('food');
            navigate('/stores');
          }}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <div 
            className={`p-2 rounded-full transition-all ${
              activeTab === 'food' ? 'shadow-lg scale-110' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'food' ? primaryColor : 'transparent'
            }}
          >
            <Utensils 
              className={`h-6 w-6 ${activeTab === 'food' ? 'text-white' : 'text-gray-500'}`}
            />
          </div>
          {activeTab !== 'food' && (
            <span className="text-xs text-gray-500 mt-1">Food</span>
          )}
        </button>

        {/* Serviços/Prestadores */}
        <button
          onClick={() => {
            setActiveTab('services');
            navigate('/services');
          }}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <div 
            className={`p-2 rounded-full transition-all ${
              activeTab === 'services' ? 'shadow-lg scale-110' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'services' ? primaryColor : 'transparent'
            }}
          >
            <Briefcase 
              className={`h-6 w-6 ${activeTab === 'services' ? 'text-white' : 'text-gray-500'}`}
            />
          </div>
          {activeTab !== 'services' && (
            <span className="text-xs text-gray-500 mt-1">Serviços</span>
          )}
        </button>

        {/* Pay/Financeiro */}
        <button
          onClick={() => {
            setActiveTab('pay');
            setShowWallet(true);
          }}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <div 
            className={`p-2 rounded-full transition-all ${
              activeTab === 'pay' ? 'shadow-lg scale-110' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'pay' ? primaryColor : 'transparent'
            }}
          >
            <DollarSign 
              className={`h-6 w-6 ${activeTab === 'pay' ? 'text-white' : 'text-gray-500'}`}
            />
          </div>
          {activeTab !== 'pay' && (
            <span className="text-xs text-gray-500 mt-1">Pay</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Logo e Saudação */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={franquiaName} className="h-10 w-10 rounded-full object-cover bg-white" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-white/80 text-xs">Olá,</p>
            <p className="text-white font-semibold">
              {user?.full_name?.split(' ')[0] || 'Usuário'}!
            </p>
          </div>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-2">
          {/* Badge PIX */}
          <button 
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium"
          >
            Pix
            <QrCode className="h-4 w-4" />
          </button>
          
          {/* Notificações */}
          <NotificationBell />
          
          {/* Perfil */}
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 bg-white/20 rounded-full"
          >
            <User className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 pt-4">
        {/* Mapa */}
        {renderMap()}
      </div>

      {/* Barra de Busca */}
      {renderSearchBar()}

      {/* Banner Promocional */}
      {renderPromoBanner()}

      {/* Seções de Conteúdo baseado na tab ativa */}
      {activeTab === 'mobility' && (
        <>
          {renderStoresSection()}
          {renderServicesSection()}
        </>
      )}

      {/* Navegação Inferior */}
      {renderBottomNav()}

      {/* Modal da Carteira */}
      {showWallet && (
        <WalletModal 
          isOpen={showWallet} 
          onClose={() => {
            setShowWallet(false);
            setActiveTab('mobility');
          }} 
        />
      )}

      {/* Espaçamento para a navbar */}
      <div className="h-20" />
    </div>
  );
};

// Componente Store para fallback
const Store = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default SuperAppHomePage;
