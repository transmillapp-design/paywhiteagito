/**
 * Passenger Flow - Transmill Mobility
 * Fluxo completo do passageiro: origem/destino -> motoristas -> corrida
 * Versão com mapas placeholder (sem dependência do Google Maps)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  ArrowLeft, MapPin, Navigation, Search, Car, Star, 
  Clock, User, Phone, MessageCircle, X, Check, Loader2,
  Wallet, Gift
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { GoogleMap, GooglePlacesAutocomplete, useGoogleMaps } from './GoogleMapsIntegration';
import AddressInput from './AddressInput';
import { RouteMap, TrackingMap } from './MapPlaceholder';

const PassengerFlow = () => {
  const navigate = useNavigate();
  const { token, user, API } = useAuth();
  const [step, setStep] = useState('address'); // address, drivers, waiting, tracking, payment, rating
  const [origin, setOrigin] = useState({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null });
  const [estimate, setEstimate] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const pollingInterval = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Opções de geolocalização para melhor precisão
  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  };

  useEffect(() => {
    const theme = localStorage.getItem('transmill-theme');
    setIsDarkMode(theme === 'dark');
    checkActiveRide();
    
    // Tentar obter localização automaticamente ao carregar
    handleGetCurrentLocation();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const checkActiveRide = async () => {
    try {
      const response = await axios.get(`${API}/mobility/client/active-ride`, { headers });
      if (response.data.has_active_ride) {
        setCurrentRide(response.data.ride);
        setDriverLocation(response.data.driver_location);
        
        const status = response.data.ride.status;
        if (status === 'pending') setStep('waiting');
        else if (['accepted', 'driver_arriving'].includes(status)) setStep('tracking');
        else if (status === 'driver_arrived') setStep('tracking');
        else if (status === 'in_progress') setStep('tracking');
        else if (status === 'completed') setStep('payment');
        else if (status === 'paid') setStep('rating');
        
        startPolling(response.data.ride.id);
      }
    } catch (error) {
      console.log('Sem corrida ativa');
    }
  };

  const startPolling = (rideId) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/mobility/ride/${rideId}`, { headers });
        setCurrentRide(response.data.ride);
        setDriverLocation(response.data.driver_location);
        
        const status = response.data.ride.status;
        if (status === 'pending') setStep('waiting');
        else if (['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'].includes(status)) setStep('tracking');
        else if (status === 'completed') setStep('payment');
        else if (status === 'paid') {
          setStep('rating');
          clearInterval(pollingInterval.current);
        } else if (status === 'cancelled') {
          toast.error('Corrida cancelada');
          setStep('address');
          setCurrentRide(null);
          clearInterval(pollingInterval.current);
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }, 3000);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      console.log('[Mobility] Solicitando geolocalização...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`[Mobility] Localização obtida: ${latitude}, ${longitude} (precisão: ${accuracy}m)`);
          
          // Usar reverse geocoding para obter endereço
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === 'OK' && results[0]) {
                  setOrigin({
                    address: results[0].formatted_address,
                    lat: latitude,
                    lng: longitude
                  });
                  toast.success('Localização obtida!');
                } else {
                  setOrigin({
                    address: `Minha localização (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                    lat: latitude,
                    lng: longitude
                  });
                  toast.success('Localização obtida!');
                }
              }
            );
          } else {
            setOrigin({
              address: `Minha localização (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude
            });
            toast.success('Localização obtida!');
          }
        },
        (error) => {
          console.error('[Mobility] Erro de geolocalização:', error.code, error.message);
          let errorMessage = 'Não foi possível obter sua localização';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada. Ative nas configurações do navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível. Verifique o GPS.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
              break;
          }
          
          toast.error(errorMessage);
          
          // Usar localização padrão de São Paulo como fallback
          setOrigin({
            address: 'Centro - São Paulo, SP',
            lat: -23.5505,
            lng: -46.6333
          });
        },
        geoOptions
      );
    } else {
      console.error('[Mobility] Geolocalização não suportada');
      toast.error('Geolocalização não suportada neste navegador');
    }
  };

  const handleSearchDrivers = async () => {
    if (!origin.lat || !destination.lat) {
      toast.error('Por favor, selecione origem e destino');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/estimate`, {
        origin: { lat: origin.lat, lng: origin.lng, address: origin.address },
        destination: { lat: destination.lat, lng: destination.lng, address: destination.address }
      }, { headers });

      setEstimate(response.data);
      setStep('drivers');
    } catch (error) {
      toast.error('Erro ao buscar motoristas');
    }
    setLoading(false);
  };

  const handleSelectDriver = async (driver) => {
    setSelectedDriver(driver);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/mobility/ride/request`, {
        origin: { lat: origin.lat, lng: origin.lng, address: origin.address },
        destination: { lat: destination.lat, lng: destination.lng, address: destination.address },
        driver_id: driver.driver_id
      }, { headers });

      setCurrentRide(response.data.ride);
      setStep('waiting');
      startPolling(response.data.ride.id);
      toast.success('Corrida solicitada!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao solicitar corrida');
    }
    setLoading(false);
  };

  const handleCancelRide = async () => {
    if (!currentRide) return;

    try {
      await axios.post(`${API}/mobility/ride/${currentRide.id}/cancel`, {}, { headers });
      toast.success('Corrida cancelada');
      setStep('address');
      setCurrentRide(null);
      setSelectedDriver(null);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cancelar corrida');
    }
  };

  const handlePayRide = async () => {
    if (!currentRide) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/mobility/ride/${currentRide.id}/pay`, {}, { headers });
      setCurrentRide(response.data.ride);
      setStep('rating');
      toast.success('Pagamento realizado com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar pagamento');
    }
    setLoading(false);
  };

  const handleRateRide = async () => {
    if (!currentRide) return;

    setLoading(true);
    try {
      await axios.post(`${API}/mobility/ride/${currentRide.id}/rate/client`, {
        rating,
        comment
      }, { headers });
      
      toast.success('Avaliação enviada!');
      navigate('/mobility');
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
    danger: 'bg-red-500 text-white',
    border: 'border-[#CEAE31]',
    input: 'bg-[#293618] border-[#CEAE31] text-white'
  } : {
    bg: 'bg-[#F5F5F5]',
    card: 'bg-white',
    text: 'text-[#333333]',
    textSecondary: 'text-[#005B9C]',
    textMuted: 'text-gray-500',
    primary: 'bg-[#005B9C] text-white',
    secondary: 'bg-transparent border-2 border-[#005B9C] text-[#005B9C]',
    danger: 'bg-red-500 text-white',
    border: 'border-[#005B9C]',
    input: 'bg-white border-gray-300 text-[#333333]'
  };

  // Função para calcular distância
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // STEP 1: Inserir Endereços
  const renderAddressStep = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/mobility')} className={colors.text}>
              <ArrowLeft size={24} />
            </Button>
            <h1 className={`ml-3 text-xl font-bold ${colors.text}`}>Para onde vamos?</h1>
          </div>
        </div>
      </header>

      {/* Mapa Preview - Google Maps quando disponível */}
      <div className="px-4 pt-4">
        <GoogleMap 
          origin={origin.lat ? origin : null}
          destination={destination.lat ? destination : null}
          showRoute={origin.lat && destination.lat}
          isDarkMode={isDarkMode}
          height="h-48"
        />
      </div>

      <main className="max-w-md mx-auto px-4 py-4">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-4 space-y-4">
            {/* Origem - Google Places Autocomplete */}
            <GooglePlacesAutocomplete
              value={origin}
              onChange={setOrigin}
              placeholder="De onde você está?"
              icon={MapPin}
              isDarkMode={isDarkMode}
              label="Origem"
              showCurrentLocation={true}
              onUseCurrentLocation={() => toast.success('Localização obtida!')}
            />

            {/* Linha de conexão */}
            <div className="flex items-center px-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className={`w-0.5 h-8 ${isDarkMode ? 'bg-[#CEAE31]/50' : 'bg-gray-300'}`}></div>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
            </div>

            {/* Destino - Google Places Autocomplete */}
            <GooglePlacesAutocomplete
              value={destination}
              onChange={setDestination}
              placeholder="Para onde você vai?"
              icon={Navigation}
              isDarkMode={isDarkMode}
              label="Destino"
            />

            {/* Distância Estimada */}
            {origin.lat && destination.lat && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={colors.textMuted}>Distância estimada</span>
                  <span className={`font-bold ${colors.text}`}>
                    {calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng).toFixed(1)} km
                  </span>
                </div>
              </div>
            )}

            {/* Botão Confirmar */}
            <Button
              onClick={handleSearchDrivers}
              disabled={!origin.lat || !destination.lat || loading}
              className={`w-full h-12 ${colors.primary}`}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Search className="mr-2" size={20} />
              )}
              Buscar Motoristas
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // STEP 2: Lista de Motoristas
  const renderDriversStep = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setStep('address')} className={colors.text}>
                <ArrowLeft size={24} />
              </Button>
              <h1 className={`ml-3 text-xl font-bold ${colors.text}`}>Motoristas Disponíveis</h1>
            </div>
            <span className={`text-sm ${colors.textSecondary}`}>{estimate?.drivers_count || 0} encontrados</span>
          </div>
        </div>
      </header>

      {/* Info do Trajeto */}
      <div className={`${colors.card} border-b ${colors.border}`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className={colors.textSecondary} />
              <span className={colors.textMuted}>{estimate?.distance_km?.toFixed(1)} km</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={16} className={colors.textSecondary} />
              <span className={colors.textMuted}>~{estimate?.duration_min} min</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {estimate?.drivers?.length === 0 ? (
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardContent className="p-8 text-center">
              <Car size={48} className={`mx-auto mb-4 ${colors.textSecondary}`} />
              <p className={colors.text}>Nenhum motorista disponível no momento</p>
              <p className={`text-sm ${colors.textMuted} mt-2`}>Tente novamente em alguns minutos</p>
            </CardContent>
          </Card>
        ) : (
          estimate?.drivers?.map((driver) => (
            <Card 
              key={driver.driver_profile_id} 
              className={`${colors.card} border ${colors.border} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => handleSelectDriver(driver)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                      {driver.profile_image ? (
                        <img src={driver.profile_image} alt="" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <User size={28} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold ${colors.text}`}>{driver.full_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{driver.rating?.toFixed(1)}</span>
                        <span className={`text-sm ${colors.textMuted}`}>•</span>
                        <span className={`text-sm ${colors.textMuted}`}>{driver.total_rides} corridas</span>
                      </div>
                      <p className={`text-sm ${colors.textMuted} mt-1`}>
                        {driver.vehicle?.modelo} • {driver.vehicle?.cor}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${colors.textSecondary}`}>
                      R$ {driver.calculated_price?.toFixed(2)}
                    </p>
                    {driver.cashback_amount > 0 && (
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <Gift size={12} className="text-green-500" />
                        <span className="text-xs text-green-500">
                          +R$ {driver.cashback_amount?.toFixed(2)} cashback
                        </span>
                      </div>
                    )}
                    <p className={`text-xs ${colors.textMuted} mt-1`}>
                      ~{driver.estimated_arrival_min} min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );

  // STEP 3: Aguardando Aceite
  const renderWaitingStep = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Aguardando Motorista</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className={`absolute inset-0 rounded-full border-4 ${colors.border} opacity-20`}></div>
              <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${colors.border} animate-spin`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Car size={32} className={colors.textSecondary} />
              </div>
            </div>

            <h2 className={`text-xl font-bold ${colors.text} mb-2`}>
              Aguardando o motorista aceitar
            </h2>
            <p className={`${colors.textMuted} mb-6`}>
              {currentRide?.driver_name} está analisando sua solicitação
            </p>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'} mb-6`}>
              <div className="flex items-center justify-center space-x-4">
                <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                  <User size={24} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${colors.text}`}>{currentRide?.driver_name}</p>
                  <p className={`text-sm ${colors.textMuted}`}>
                    {currentRide?.driver_vehicle?.modelo} • {currentRide?.driver_vehicle?.placa}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleCancelRide} className={`${colors.danger} border-none`}>
              <X className="mr-2" size={20} />
              Cancelar Solicitação
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // STEP 4: Acompanhamento da Corrida
  const renderTrackingStep = () => {
    const status = currentRide?.status;
    let statusText = '';

    switch (status) {
      case 'accepted':
      case 'driver_arriving':
        statusText = 'Motorista a caminho';
        break;
      case 'driver_arrived':
        statusText = 'Motorista chegou!';
        break;
      case 'in_progress':
        statusText = 'Corrida em andamento';
        break;
      default:
        statusText = 'Acompanhando corrida';
    }

    return (
      <div className={`min-h-screen ${colors.bg}`}>
        {/* Mapa - Google Maps com tracking em tempo real */}
        <GoogleMap
          origin={currentRide?.origin}
          destination={currentRide?.destination}
          driverLocation={driverLocation}
          showRoute={true}
          showDriver={['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'].includes(status)}
          isDarkMode={isDarkMode}
          height="h-64"
        />

        {/* Bottom Sheet */}
        <div className={`${colors.card} rounded-t-3xl -mt-6 relative z-10 min-h-[50vh]`}>
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
          
          <div className="p-4">
            {/* Status */}
            <div className={`flex items-center justify-center space-x-2 mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-[#005B9C]/10'}`}>
              {status === 'driver_arriving' && <Car size={24} className={`${colors.textSecondary} animate-pulse`} />}
              {status === 'driver_arrived' && <Check size={24} className="text-green-500" />}
              {status === 'in_progress' && <Navigation size={24} className={colors.textSecondary} />}
              <span className={`font-bold ${colors.text}`}>{statusText}</span>
            </div>

            {/* Info do Motorista */}
            <Card className={`${colors.card} border ${colors.border} mb-4`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center`}>
                      <User size={28} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                    </div>
                    <div>
                      <p className={`font-bold ${colors.text}`}>{currentRide?.driver_name}</p>
                      <div className="flex items-center space-x-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{currentRide?.driver_rating?.toFixed(1)}</span>
                      </div>
                      <p className={`text-sm ${colors.textMuted}`}>
                        {currentRide?.driver_vehicle?.modelo} • {currentRide?.driver_vehicle?.placa}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleWhatsApp(currentRide?.driver_phone)}
                    className={colors.secondary}
                  >
                    <MessageCircle size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info da Corrida */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin size={20} className="text-green-500 mt-1" />
                <div>
                  <p className={`text-sm ${colors.textMuted}`}>Origem</p>
                  <p className={colors.text}>{currentRide?.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Navigation size={20} className="text-red-500 mt-1" />
                <div>
                  <p className={`text-sm ${colors.textMuted}`}>Destino</p>
                  <p className={colors.text}>{currentRide?.destination?.address}</p>
                </div>
              </div>
            </div>

            {/* Valor */}
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={colors.textMuted}>Valor da corrida</span>
                <span className={`text-2xl font-bold ${colors.textSecondary}`}>
                  R$ {currentRide?.pricing?.total?.toFixed(2)}
                </span>
              </div>
              {currentRide?.pricing?.cashback_amount > 0 && (
                <div className="flex items-center justify-end mt-1">
                  <Gift size={14} className="text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    +R$ {currentRide?.pricing?.cashback_amount?.toFixed(2)} cashback
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // STEP 5: Pagamento
  const renderPaymentStep = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Finalizar Pagamento</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-6">
            <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-green-100'} flex items-center justify-center mx-auto mb-6`}>
              <Check size={40} className={isDarkMode ? 'text-[#CEAE31]' : 'text-green-500'} />
            </div>

            <h2 className={`text-xl font-bold ${colors.text} text-center mb-2`}>
              Corrida Finalizada!
            </h2>
            <p className={`${colors.textMuted} text-center mb-6`}>
              Seu motorista encerrou a corrida
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className={`text-xs ${colors.textMuted}`}>Origem</p>
                  <p className={`text-sm ${colors.text}`}>{currentRide?.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Navigation size={18} className="text-red-500 mt-1" />
                <div className="flex-1">
                  <p className={`text-xs ${colors.textMuted}`}>Destino</p>
                  <p className={`text-sm ${colors.text}`}>{currentRide?.destination?.address}</p>
                </div>
              </div>
              <div className={`h-px ${isDarkMode ? 'bg-[#CEAE31]/30' : 'bg-gray-200'}`}></div>
              <div className="flex justify-between">
                <span className={colors.textMuted}>Distância</span>
                <span className={colors.text}>{currentRide?.distance_km?.toFixed(1)} km</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-50'} mb-6`}>
              <div className="flex items-center justify-between">
                <span className={`text-lg ${colors.text}`}>Total a pagar</span>
                <span className={`text-3xl font-bold ${colors.textSecondary}`}>
                  R$ {currentRide?.pricing?.total?.toFixed(2)}
                </span>
              </div>
              {currentRide?.pricing?.cashback_amount > 0 && (
                <div className="flex items-center justify-end mt-2">
                  <Gift size={16} className="text-green-500 mr-1" />
                  <span className="text-green-500">
                    Você receberá R$ {currentRide?.pricing?.cashback_amount?.toFixed(2)} de cashback
                  </span>
                </div>
              )}
            </div>

            <div className={`flex items-center justify-between mb-6 p-3 rounded-lg ${isDarkMode ? 'bg-[#6B6A4B]' : 'bg-blue-50'}`}>
              <div className="flex items-center space-x-2">
                <Wallet size={20} className={colors.textSecondary} />
                <span className={colors.text}>Saldo Transmill</span>
              </div>
              <span className={`font-bold ${colors.textSecondary}`}>
                R$ {((user?.balance || 0) + (user?.cashback_balance || 0)).toFixed(2)}
              </span>
            </div>

            <Button
              onClick={handlePayRide}
              disabled={loading}
              className={`w-full h-14 text-lg ${colors.primary}`}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={24} />
              ) : (
                <Wallet className="mr-2" size={24} />
              )}
              Pagar com Saldo Transmill
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // STEP 6: Avaliação
  const renderRatingStep = () => (
    <div className={`min-h-screen ${colors.bg}`}>
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className={`text-xl font-bold ${colors.text} text-center`}>Avaliar Corrida</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Card className={`${colors.card} border ${colors.border}`}>
          <CardContent className="p-6 text-center">
            <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'} flex items-center justify-center mx-auto mb-4`}>
              <User size={40} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
            </div>

            <h2 className={`text-xl font-bold ${colors.text} mb-1`}>
              {currentRide?.driver_name}
            </h2>
            <p className={`${colors.textMuted} mb-6`}>
              Como foi sua viagem?
            </p>

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

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              className={`w-full p-3 rounded-lg border ${colors.input} resize-none mb-6`}
            />

            <Button
              onClick={handleRateRide}
              disabled={loading}
              className={`w-full h-12 ${colors.primary}`}
            >
              {loading && <Loader2 className="animate-spin mr-2" size={20} />}
              Enviar Avaliação
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/mobility')}
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
    case 'drivers':
      return renderDriversStep();
    case 'waiting':
      return renderWaitingStep();
    case 'tracking':
      return renderTrackingStep();
    case 'payment':
      return renderPaymentStep();
    case 'rating':
      return renderRatingStep();
    default:
      return renderAddressStep();
  }
};

export default PassengerFlow;
