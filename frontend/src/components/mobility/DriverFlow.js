/**
 * Driver Flow - Transmill Mobility
 * Fluxo completo do motorista: disponibilidade, aceitar corridas, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { 
  ArrowLeft, MapPin, Navigation, Car, Star, Clock, 
  User, Phone, MessageCircle, Check, Loader2, Power,
  DollarSign, ChevronRight, X, QrCode, Wallet, Gift
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { GoogleMap } from './GoogleMapsIntegration';
import { CurrentLocationMap, RouteMap } from './MapPlaceholder';

const DriverFlow = () => {
  const navigate = useNavigate();
  const { token, user, API } = useAuth();
  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [step, setStep] = useState('home'); // home, new_ride, to_pickup, arrived, in_progress, completed, rating
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [earnings, setEarnings] = useState({ today: 0, total_rides: 0 });
  const [currentLocation, setCurrentLocation] = useState({ lat: -23.5505, lng: -46.6333 }); // Default São Paulo
  const pollingInterval = useRef(null);
  const locationInterval = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const theme = localStorage.getItem('transmill-theme');
    setIsDarkMode(theme === 'dark');
    loadDriverProfile();

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, []);

  const loadDriverProfile = async () => {
    try {
      const response = await axios.get(`${API}/mobility/driver/profile`, { headers });
      if (response.data.exists) {
        setDriverProfile(response.data.profile);
        setIsOnline(response.data.profile.is_online);
        
        if (response.data.profile.is_online) {
          startPollingRides();
          startLocationUpdates();
        }
        
        // Verificar corrida ativa
        const activeResponse = await axios.get(`${API}/mobility/driver/active-ride`, { headers });
        if (activeResponse.data.has_active_ride) {
          setCurrentRide(activeResponse.data.ride);
          determineStep(activeResponse.data.ride.status);
        }
        
        // Carregar ganhos
        loadEarnings();
      } else {
        navigate('/mobility/driver/register');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil de motorista');
    }
    setLoading(false);
  };

  const loadEarnings = async () => {
    try {
      const response = await axios.get(`${API}/mobility/driver/earnings?period=today`, { headers });
      setEarnings({
        today: response.data.total_earnings,
        total_rides: response.data.total_rides
      });
    } catch (error) {
      console.log('Erro ao carregar ganhos');
    }
  };

  const determineStep = (status) => {
    switch (status) {
      case 'pending':
        setStep('new_ride');
        break;
      case 'accepted':
      case 'driver_arriving':
        setStep('to_pickup');
        break;
      case 'driver_arrived':
        setStep('arrived');
        break;
      case 'in_progress':
        setStep('in_progress');
        break;
      case 'completed':
        setStep('completed');
        generateQRCode();
        break;
      case 'paid':
        setStep('rating');
        break;
      default:
        setStep('home');
    }
  };

  const startPollingRides = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    
    pollingInterval.current = setInterval(async () => {
      try {
        // Verificar corrida ativa
        const activeResponse = await axios.get(`${API}/mobility/driver/active-ride`, { headers });
        if (activeResponse.data.has_active_ride) {
          setCurrentRide(activeResponse.data.ride);
          determineStep(activeResponse.data.ride.status);
        } else {
          // Verificar novas corridas disponíveis
          const ridesResponse = await axios.get(`${API}/mobility/driver/available-rides`, { headers });
          setAvailableRides(ridesResponse.data.rides || []);
          
          if (ridesResponse.data.rides?.length > 0 && step === 'home') {
            setCurrentRide(ridesResponse.data.rides[0]);
            setStep('new_ride');
            // Tocar som de notificação
            playNotificationSound();
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 3000);
  };

  const startLocationUpdates = () => {
    if (locationInterval.current) clearInterval(locationInterval.current);
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            console.log(`[Driver] Localização atualizada: ${newLocation.lat}, ${newLocation.lng}`);
            
            // Atualizar estado local
            setCurrentLocation(newLocation);
            
            try {
              await axios.put(`${API}/mobility/driver/location`, newLocation, { headers });
            } catch (error) {
              console.log('Erro ao atualizar localização no servidor');
            }
          },
          (error) => {
            console.error('[Driver] Erro GPS:', error.code, error.message);
          },
          geoOptions
        );
      }
    };

    updateLocation(); // Atualizar imediatamente
    locationInterval.current = setInterval(updateLocation, 15000); // A cada 15 segundos
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await axios.put(`${API}/mobility/driver/availability?is_online=${newStatus}`, {}, { headers });
      setIsOnline(newStatus);
      
      if (newStatus) {
        startPollingRides();
        startLocationUpdates();
        toast.success('Você está online!');
      } else {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        if (locationInterval.current) clearInterval(locationInterval.current);
        toast.info('Você está offline');
      }
    } catch (error) {
      toast.error('Erro ao alterar disponibilidade');
    }
  };

  const handleAcceptRide = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/ride/${currentRide.id}/accept`, {}, { headers });
      setCurrentRide(response.data.ride);
      setStep('to_pickup');
      toast.success('Corrida aceita!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao aceitar corrida');
    }
    setLoading(false);
  };

  const handleRejectRide = async () => {
    if (!currentRide) return;
    
    try {
      await axios.post(`${API}/mobility/ride/${currentRide.id}/reject`, {}, { headers });
      setCurrentRide(null);
      setStep('home');
      toast.info('Corrida recusada');
    } catch (error) {
      toast.error('Erro ao recusar corrida');
    }
  };

  const handleArrived = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/ride/${currentRide.id}/arrived`, {}, { headers });
      setCurrentRide(response.data.ride);
      setStep('arrived');
      toast.success('Chegada registrada!');
    } catch (error) {
      toast.error('Erro ao registrar chegada');
    }
    setLoading(false);
  };

  const handleStartRide = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/ride/${currentRide.id}/start`, {}, { headers });
      setCurrentRide(response.data.ride);
      setStep('in_progress');
      toast.success('Corrida iniciada!');
    } catch (error) {
      toast.error('Erro ao iniciar corrida');
    }
    setLoading(false);
  };

  const handleCompleteRide = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/ride/${currentRide.id}/complete`, {}, { headers });
      setCurrentRide(response.data.ride);
      setStep('completed');
      generateQRCode();
      toast.success('Corrida finalizada! Aguarde o pagamento.');
    } catch (error) {
      toast.error('Erro ao finalizar corrida');
    }
    setLoading(false);
  };

  const generateQRCode = async () => {
    if (!currentRide) return;
    
    const paymentData = {
      type: 'mobility_payment',
      ride_id: currentRide.id,
      amount: currentRide.pricing?.total,
      driver_name: driverProfile?.full_name
    };
    
    try {
      const url = await QRCode.toDataURL(JSON.stringify(paymentData), {
        width: 256,
        margin: 2,
        color: {
          dark: isDarkMode ? '#CEAE31' : '#005B9C',
          light: isDarkMode ? '#293618' : '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const handleRateClient = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/mobility/ride/${currentRide.id}/rate/driver`, {
        rating,
        comment
      }, { headers });
      
      toast.success('Avaliação enviada!');
      setCurrentRide(null);
      setStep('home');
      loadEarnings();
    } catch (error) {
      toast.error('Erro ao enviar avaliação');
    }
    setLoading(false);
  };

  const handleWhatsApp = (phone) => {
    if (phone) {
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
    } else {
      toast.error('Telefone não disponível');
    }
  };

  // Cores do tema
  const colors = isDarkMode ? {
    bg: 'bg-[#293618]',
    card: 'bg-[#6B6A4B]',
    text: 'text-white',
    textSecondary: 'text-[#CEAE31]',
    textMuted: 'text-gray-300',
    primary: 'bg-[#CEAE31] text-[#293618]',
    secondary: 'bg-transparent border-2 border-[#CEAE31] text-[#CEAE31]',
    success: 'bg-green-500 text-white',
    danger: 'bg-red-500 text-white',
    border: 'border-[#CEAE31]'
  } : {
    bg: 'bg-[#F5F5F5]',
    card: 'bg-white',
    text: 'text-[#333333]',
    textSecondary: 'text-[#005B9C]',
    textMuted: 'text-gray-500',
    primary: 'bg-[#005B9C] text-white',
    secondary: 'bg-transparent border-2 border-[#005B9C] text-[#005B9C]',
    success: 'bg-green-500 text-white',
    danger: 'bg-red-500 text-white',
    border: 'border-[#005B9C]'
  };

  if (loading && !driverProfile) {
    return (
      <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
        <Loader2 className={`animate-spin ${colors.textSecondary}`} size={48} />
      </div>
    );
  }

  // HOME - Tela de Disponibilidade
  const renderHome = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      {/* Header */}
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate('/mobility')} className={colors.text}>
                <ArrowLeft size={24} />
              </Button>
              <h1 className={`ml-3 text-xl font-bold ${colors.text}`}>Modo Motorista</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobility/driver/profile')}
              className={colors.text}
            >
              <User size={24} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Toggle Online/Offline */}
        <Card className={`${colors.card} border-2 ${isOnline ? 'border-green-500' : colors.border}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-green-500' : isDarkMode ? 'bg-[#293618]' : 'bg-gray-200'}`}>
                  <Power size={28} className={isOnline ? 'text-white' : colors.textMuted} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {isOnline ? 'Você está Online' : 'Você está Offline'}
                  </p>
                  <p className={`text-sm ${colors.textMuted}`}>
                    {isOnline ? 'Recebendo corridas' : 'Ative para receber corridas'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={handleToggleOnline}
                className="scale-125"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ganhos do Dia */}
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${colors.textMuted}`}>Ganhos de Hoje</p>
                <p className={`text-3xl font-bold ${colors.textSecondary}`}>
                  R$ {earnings.today?.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${colors.textMuted}`}>Corridas</p>
                <p className={`text-2xl font-bold ${colors.text}`}>{earnings.total_rides}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info do Veículo */}
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-[#005B9C]/10'}`}>
                <Car size={24} className={colors.textSecondary} />
              </div>
              <div className="flex-1">
                <p className={`font-bold ${colors.text}`}>
                  {driverProfile?.vehicle?.modelo}
                </p>
                <p className={`text-sm ${colors.textMuted}`}>
                  {driverProfile?.vehicle?.cor} • {driverProfile?.vehicle?.placa}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mobility/driver/profile')}
                className={colors.textSecondary}
              >
                <ChevronRight size={24} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarifas */}
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-4">
            <p className={`text-sm ${colors.textMuted} mb-3`}>Suas Tarifas</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-lg font-bold ${colors.text}`}>
                  R$ {driverProfile?.pricing?.taxa_minima?.toFixed(2)}
                </p>
                <p className={`text-xs ${colors.textMuted}`}>Taxa Mínima</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${colors.text}`}>
                  R$ {driverProfile?.pricing?.valor_por_km?.toFixed(2)}
                </p>
                <p className={`text-xs ${colors.textMuted}`}>Por Km</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${colors.text}`}>
                  {driverProfile?.pricing?.cashback_percentage?.toFixed(0)}%
                </p>
                <p className={`text-xs ${colors.textMuted}`}>Cashback</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapa com posição atual - Google Maps */}
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <GoogleMap 
              center={currentLocation}
              showDriver={true}
              driverLocation={currentLocation}
              isDarkMode={isDarkMode} 
              height="h-48" 
              zoom={15}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // NOVA CORRIDA DISPONÍVEL
  const renderNewRide = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Nova Corrida!</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Card className={`${colors.card} border-2 ${colors.border} animate-pulse-slow`}>
          <CardContent className="p-6">
            {/* Info do Cliente */}
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                <User size={32} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
              </div>
              <div>
                <p className={`text-xl font-bold ${colors.text}`}>{currentRide?.client_name}</p>
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className={colors.textMuted}>Cliente</span>
                </div>
              </div>
            </div>

            {/* Endereços */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-white" />
                </div>
                <div>
                  <p className={`text-sm ${colors.textMuted}`}>Embarque</p>
                  <p className={colors.text}>{currentRide?.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-white" />
                </div>
                <div>
                  <p className={`text-sm ${colors.textMuted}`}>Destino</p>
                  <p className={colors.text}>{currentRide?.destination?.address}</p>
                </div>
              </div>
            </div>

            {/* Info da Corrida */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'} mb-6`}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className={`text-lg font-bold ${colors.text}`}>{currentRide?.distance_km?.toFixed(1)}</p>
                  <p className={`text-xs ${colors.textMuted}`}>km</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${colors.text}`}>~{currentRide?.duration_min}</p>
                  <p className={`text-xs ${colors.textMuted}`}>minutos</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${colors.textSecondary}`}>
                    R$ {currentRide?.pricing?.total?.toFixed(2)}
                  </p>
                  <p className={`text-xs ${colors.textMuted}`}>valor</p>
                </div>
              </div>
            </div>

            {/* Seu Ganho */}
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-green-50'} mb-6`}>
              <div className="flex items-center justify-between">
                <span className={colors.text}>Seu ganho</span>
                <span className={`text-xl font-bold ${isDarkMode ? 'text-[#CEAE31]' : 'text-green-600'}`}>
                  R$ {currentRide?.pricing?.driver_earnings?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleRejectRide}
                className={`h-14 ${colors.danger}`}
              >
                <X className="mr-2" size={20} />
                Recusar
              </Button>
              <Button
                onClick={handleAcceptRide}
                disabled={loading}
                className={`h-14 ${colors.success}`}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={20} />
                ) : (
                  <Check className="mr-2" size={20} />
                )}
                Aceitar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // INDO ATÉ O EMBARQUE
  const renderToPickup = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      {/* Mapa - Google Maps */}
      <GoogleMap
        origin={currentRide?.origin}
        destination={currentRide?.destination}
        driverLocation={currentLocation}
        showRoute={true}
        showDriver={true}
        isDarkMode={isDarkMode}
        height="h-64"
      />

      {/* Bottom Sheet */}
      <div className={`${colors.card} rounded-t-3xl -mt-6 relative z-10 min-h-[50vh]`}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        <div className="p-4">
          <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-[#005B9C]/10'} mb-4`}>
            <p className={`font-bold ${colors.text}`}>Indo buscar o passageiro</p>
          </div>

          {/* Info do Cliente */}
          <Card className={`${colors.card} border ${colors.border} mb-4`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                    <User size={24} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                  </div>
                  <div>
                    <p className={`font-bold ${colors.text}`}>{currentRide?.client_name}</p>
                    <p className={`text-sm ${colors.textMuted}`}>Passageiro</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleWhatsApp(currentRide?.client_phone)}
                  className={colors.secondary}
                >
                  <MessageCircle size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Endereço de Embarque */}
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <p className={`text-sm ${colors.textMuted}`}>Ponto de embarque</p>
              <p className={`font-medium ${colors.text}`}>{currentRide?.origin?.address}</p>
            </div>
          </div>

          {/* Botão Cheguei */}
          <Button
            onClick={handleArrived}
            disabled={loading}
            className={`w-full h-14 ${colors.primary}`}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <MapPin className="mr-2" size={20} />
            )}
            Cheguei ao Local
          </Button>
        </div>
      </div>
    </div>
  );

  // CHEGOU AO EMBARQUE
  const renderArrived = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <div className="relative">
        <GoogleMap
          origin={currentRide?.origin}
          destination={currentRide?.destination}
          driverLocation={currentLocation}
          showRoute={true}
          showDriver={true}
          isDarkMode={isDarkMode}
          height="h-64"
        />
        {/* Overlay de chegada */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4`}>
              <Check size={40} className="text-white" />
            </div>
            <p className="text-lg font-bold text-white">Você chegou!</p>
          </div>
        </div>
      </div>

      <div className={`${colors.card} rounded-t-3xl -mt-6 relative z-10 min-h-[50vh]`}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        <div className="p-4">
          <div className={`text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/30 mb-4`}>
            <p className="font-bold text-green-600">Aguardando o passageiro</p>
          </div>

          {/* Info do Cliente */}
          <Card className={`${colors.card} border ${colors.border} mb-4`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                    <User size={24} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                  </div>
                  <div>
                    <p className={`font-bold ${colors.text}`}>{currentRide?.client_name}</p>
                    <p className={`text-sm ${colors.textMuted}`}>Passageiro</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleWhatsApp(currentRide?.client_phone)}
                  className={colors.secondary}
                >
                  <Phone size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botão Iniciar Corrida */}
          <Button
            onClick={handleStartRide}
            disabled={loading}
            className={`w-full h-14 ${colors.success}`}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Car className="mr-2" size={20} />
            )}
            Iniciar Corrida
          </Button>
        </div>
      </div>
    </div>
  );

  // CORRIDA EM ANDAMENTO
  const renderInProgress = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <div className="relative">
        <GoogleMap
          origin={currentRide?.origin}
          destination={currentRide?.destination}
          driverLocation={currentLocation}
          showRoute={true}
          showDriver={true}
          isDarkMode={isDarkMode}
          height="h-64"
        />
        {/* Overlay de em andamento */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className={`px-4 py-2 rounded-full shadow-lg ${isDarkMode ? 'bg-[#293618] text-[#CEAE31]' : 'bg-white text-[#005B9C]'}`}>
            <div className="flex items-center space-x-2">
              <Navigation size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Corrida em andamento</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${colors.card} rounded-t-3xl -mt-6 relative z-10 min-h-[50vh]`}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        <div className="p-4">
          {/* Destino */}
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <Navigation size={20} className="text-white" />
            </div>
            <div>
              <p className={`text-sm ${colors.textMuted}`}>Destino</p>
              <p className={`font-medium ${colors.text}`}>{currentRide?.destination?.address}</p>
            </div>
          </div>

          {/* Info */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'} mb-6`}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${colors.text}`}>{currentRide?.distance_km?.toFixed(1)} km</p>
                <p className={`text-sm ${colors.textMuted}`}>distância</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${colors.textSecondary}`}>
                  R$ {currentRide?.pricing?.total?.toFixed(2)}
                </p>
                <p className={`text-sm ${colors.textMuted}`}>valor</p>
              </div>
            </div>
          </div>

          {/* Botão Encerrar */}
          <Button
            onClick={handleCompleteRide}
            disabled={loading}
            className={`w-full h-14 ${colors.primary}`}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Check className="mr-2" size={20} />
            )}
            Encerrar Corrida
          </Button>
        </div>
      </div>
    </div>
  );

  // CORRIDA FINALIZADA - QR CODE
  const renderCompleted = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Aguardando Pagamento</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-6 text-center">
            {/* QR Code */}
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#293618]' : 'bg-white'} inline-block mb-6`}>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code para pagamento" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <Loader2 className={`animate-spin ${colors.textSecondary}`} size={48} />
                </div>
              )}
            </div>

            <h2 className={`text-xl font-bold ${colors.text} mb-2`}>
              Mostre ao passageiro
            </h2>
            <p className={`${colors.textMuted} mb-6`}>
              O cliente deve escanear o QR Code para pagar
            </p>

            {/* Valor */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'}`}>
              <p className={`text-sm ${colors.textMuted}`}>Valor da corrida</p>
              <p className={`text-4xl font-bold ${colors.textSecondary}`}>
                R$ {currentRide?.pricing?.total?.toFixed(2)}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200/20">
                <p className={`text-sm ${colors.textMuted}`}>Você receberá</p>
                <p className={`text-2xl font-bold text-green-500`}>
                  R$ {currentRide?.pricing?.driver_earnings?.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // AVALIAÇÃO DO CLIENTE
  const renderRating = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Avaliar Passageiro</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-6 text-center">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center mx-auto mb-4`}>
              <User size={40} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
            </div>

            <h2 className={`text-xl font-bold ${colors.text} mb-1`}>
              {currentRide?.client_name}
            </h2>
            <p className={`${colors.textMuted} mb-6`}>Como foi o passageiro?</p>

            {/* Estrelas */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>

            {/* Comentário */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-[#293618] border-[#CEAE31] text-white' : 'bg-white border-gray-300'} resize-none mb-6`}
            />

            {/* Ganho */}
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'} mb-6`}>
              <div className="flex items-center justify-center space-x-2">
                <Wallet size={20} className="text-green-500" />
                <span className={colors.text}>Você ganhou</span>
                <span className="text-xl font-bold text-green-500">
                  R$ {currentRide?.pricing?.driver_earnings?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botão */}
            <Button
              onClick={handleRateClient}
              disabled={loading}
              className={`w-full h-12 ${colors.primary}`}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              Enviar Avaliação
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setCurrentRide(null);
                setStep('home');
                loadEarnings();
              }}
              className={`w-full mt-2 ${colors.textMuted}`}
            >
              Pular
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // Renderizar tela baseado no step
  switch (step) {
    case 'new_ride':
      return renderNewRide();
    case 'to_pickup':
      return renderToPickup();
    case 'arrived':
      return renderArrived();
    case 'in_progress':
      return renderInProgress();
    case 'completed':
      return renderCompleted();
    case 'rating':
      return renderRating();
    default:
      return renderHome();
  }
};

export default DriverFlow;
