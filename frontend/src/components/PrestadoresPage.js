import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import BookAppointment from './BookAppointment';
import {
  ArrowLeft,
  Wrench,
  Search,
  MapPin,
  Star,
  Clock,
  Calendar,
  Filter,
  Grid3X3,
  List,
  Phone,
  Navigation,
  Loader2,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';

const PrestadoresPage = ({ embedded = false, franquiaContext = null }) => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [locationError, setLocationError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  // Cores da franquia (se aplicável)
  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';

  // Categorias dinâmicas baseadas nos dados reais
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', count: 0 },
    { id: 'beleza', name: 'Beleza & Estética', count: 0 },
    { id: 'manutencao', name: 'Casa & Manutenção', count: 0 },
    { id: 'saude', name: 'Saúde & Bem-estar', count: 0 },
    { id: 'educacao', name: 'Educação', count: 0 },
    { id: 'tecnologia', name: 'Tecnologia', count: 0 },
    { id: 'outros', name: 'Outros', count: 0 }
  ]);

  useEffect(() => {
    fetchPrestadores();
    requestLocation();
  }, []);

  // Calcular distância entre dois pontos (fórmula Haversine)
  const calculateDistance = (pos1, pos2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  // Buscar prestadores do backend
  const fetchPrestadores = async (location = null) => {
    setLoading(true);
    try {
      let url = `${API}/prestadores`;
      const params = new URLSearchParams();
      
      if (location) {
        params.append('lat', location.latitude);
        params.append('lng', location.longitude);
        params.append('radius', '50'); // 50km de raio
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, { headers });
      
      if (response.data.prestadores) {
        const prestadoresWithDistance = response.data.prestadores.map(prestador => ({
          ...prestador,
          distance: location ? calculateDistance(location, {
            latitude: prestador.latitude,
            longitude: prestador.longitude
          }) : null,
          tags: prestador.tags || ['Prestador Transmill'],
          cashback: prestador.cashback_rate || 8,
          price: prestador.price_from ? `A partir de R$ ${prestador.price_from}` : 'Consultar preços',
          available: prestador.available !== false,
          nextSlot: 'Consultar agenda'
        }));
        
        // Ordenar por distância se houver localização
        if (location) {
          prestadoresWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        setPrestadores(prestadoresWithDistance);
        updateCategories(prestadoresWithDistance);
      }
    } catch (error) {
      console.error('Error fetching prestadores:', error);
      // Fallback para dados vazios se API falhar
      setPrestadores([]);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar contadores de categoria
  const updateCategories = (prestadoresList) => {
    const categoryCounts = prestadoresList.reduce((acc, prestador) => {
      const category = prestador.category || 'outros';
      const categoryKey = category.toLowerCase();
      acc[categoryKey] = (acc[categoryKey] || 0) + 1;
      acc.all += 1;
      return acc;
    }, { all: 0 });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: categoryCounts[cat.id] || 0
    })));
  };

  // Solicitar localização atual
  const requestLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);
        fetchPrestadores(location);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Não foi possível obter sua localização');
        setLocationLoading(false);
        // Buscar prestadores sem filtro de localização
        fetchPrestadores();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  // Buscar por endereço manualmente
  const searchByAddress = async () => {
    if (!manualAddress.trim()) return;
    
    setLocationLoading(true);
    try {
      // Simular coordenadas (São Paulo centro)
      const location = {
        latitude: -23.5505,
        longitude: -46.6333
      };
      
      setUserLocation(location);
      await fetchPrestadores(location);
      setShowAddressInput(false);
    } catch (error) {
      setLocationError('Endereço não encontrado');
    } finally {
      setLocationLoading(false);
    }
  };

  const filteredPrestadores = prestadores.filter(prestador => {
    const prestadorCategory = prestador.category || 'outros';
    const matchesCategory = selectedCategory === 'all' || prestadorCategory.toLowerCase() === selectedCategory;
    const matchesSearch = (prestador.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (prestador.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (prestador.service_provider_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrestadorClick = (prestador) => {
    console.log('Prestador selecionado:', prestador.name);
  };

  const [showBooking, setShowBooking] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const handleBookService = (prestador) => {
    setSelectedProvider(prestador);
    setShowBooking(true);
  };

  const handleWhatsApp = (prestador) => {
    const whatsapp = prestador.whatsapp || prestador.phone;
    if (whatsapp) {
      const number = whatsapp.replace(/\D/g, ''); // Remove non-numeric characters
      const message = `Olá! Vi seu perfil na Transmill e gostaria de contratar seus serviços.`;
      const whatsappUrl = `https://wa.me/55${number}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('WhatsApp não disponível para este prestador');
    }
  };

  const handleDirections = (prestador) => {
    if (prestador.google_maps_url) {
      window.open(prestador.google_maps_url, '_blank');
    } else {
      // Fallback: usar coordenadas para abrir Google Maps
      const lat = prestador.latitude;
      const lng = prestador.longitude;
      if (lat && lng) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(mapsUrl, '_blank');
      } else {
        alert('Localização não disponível para este prestador');
      }
    }
  };

  // Se está na tela de agendamento, mostrar o componente BookAppointment
  if (showBooking && selectedProvider) {
    return (
      <BookAppointment 
        providerId={selectedProvider.id}
        onBack={() => {
          setShowBooking(false);
          setSelectedProvider(null);
        }}
      />
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header - ocultar quando embutido */}
      {!embedded && (
        <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
              {franquiaContext?.nome ? `${franquiaContext.nome} Prestadores` : 'Transmill Prestadores'}
            </h1>
            <Badge variant="secondary" className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
              {filteredPrestadores.length} prestadores
            </Badge>
          </div>
        </div>
      )}
      
      {/* Header embutido */}
      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Prestadores de Serviço</h2>
            <p className="text-gray-600">Encontre prestadores {franquiaContext?.nome || 'Transmill'}</p>
          </div>
          <Badge style={{ backgroundColor: corPrimaria }} className="text-white">
            {filteredPrestadores.length} prestadores
          </Badge>
        </div>
      )}

      <div className={`${embedded ? '' : 'max-w-md mx-auto px-4 py-6'} space-y-6`}>
        {/* Location Section */}
        <Card className={`border-2 ${
          isDarkMode 
            ? 'bg-[#3F5123] border-[#005B9C]' 
            : 'bg-[#FFFFFF] border-[#005B9C]'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                <MapPin className={`mr-2 ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`} size={18} />
                Sua Localização
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddressInput(!showAddressInput)}
              >
                <Search size={14} className="mr-1" />
                Buscar endereço
              </Button>
            </div>

            {showAddressInput && (
              <div className="mb-3 space-y-2">
                <Input
                  type="text"
                  placeholder="Digite seu endereço (ex: Rua das Flores, 123, São Paulo)"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchByAddress()}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={searchByAddress}
                    disabled={!manualAddress.trim() || locationLoading}
                    className="flex-1"
                  >
                    {locationLoading ? <Loader2 className="animate-spin" size={14} /> : 'Buscar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressInput(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${userLocation ? (isDarkMode ? 'bg-[#005B9C]' : 'bg-[#005B9C]') : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {userLocation ? 'Localização obtida' : 'Localização não disponível'}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocation}
                disabled={locationLoading}
                className={isDarkMode ? 'border-[#005B9C] text-[#005B9C]' : 'border-[#005B9C] text-[#005B9C]'}
              >
                {locationLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Navigation size={14} />
                )}
                <span className="ml-1">Usar GPS</span>
              </Button>
            </div>

            {locationError && (
              <div className={`mt-3 p-2 rounded-lg flex items-center ${
                isDarkMode ? 'bg-[#556B2F] border border-[#005B9C]' : 'bg-transmill-gold/10 border border-transmill-gold'
              }`}>
                <AlertCircle className="text-yellow-600 mr-2" size={16} />
                <span className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-yellow-700'}`}>{locationError}</span>
              </div>
            )}

            {userLocation && (
              <div className={`mt-3 p-2 rounded-lg ${
                isDarkMode ? 'bg-[#556B2F] border border-[#005B9C]' : 'bg-[#FFFFFF] border border-[#005B9C]'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                  ✓ Mostrando prestadores próximos à sua localização
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card className={`border-2 text-white ${
          isDarkMode 
            ? 'bg-[#556B2F] border-[#005B9C]' 
            : 'bg-[#005B9C] border-[#005B9C]'
        }`}>
          <CardContent className="p-6 text-center">
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`} />
            <h2 className="text-2xl font-bold mb-2">Prestadores Transmill</h2>
            <p className={`mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>
              Contrate profissionais e ganhe cashback
            </p>
            <Badge className="bg-white/20 text-white">
              🎁 Cashback de até 15%
            </Badge>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className={isDarkMode ? 'bg-[#3F5123] border border-[#005B9C]' : 'bg-white'}>
          <CardContent className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-[#005B9C]' : 'text-gray-400'
              }`} size={20} />
              <Input
                type="text"
                placeholder="Buscar prestadores ou profissionais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${
                  isDarkMode 
                    ? 'bg-[#2A3618] border-[#556B2F] text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            {/* Categories Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? (isDarkMode 
                          ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]' 
                          : 'bg-[#005B9C] text-white hover:bg-[#005B9C]')
                      : (isDarkMode
                          ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]'
                          : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]')
                  }`}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {filteredPrestadores.length} profissionais disponíveis
              </span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={
                    viewMode === 'grid'
                      ? (isDarkMode 
                          ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]' 
                          : 'bg-[#005B9C] text-white hover:bg-[#005B9C]')
                      : (isDarkMode
                          ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]'
                          : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]')
                  }
                >
                  <Grid3X3 size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={
                    viewMode === 'list'
                      ? (isDarkMode 
                          ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]' 
                          : 'bg-[#005B9C] text-white hover:bg-[#005B9C]')
                      : (isDarkMode
                          ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]'
                          : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]')
                  }
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prestadores List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
          {filteredPrestadores.map((prestador) => (
            <Card 
              key={prestador.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-95 ${
                isDarkMode ? 'bg-[#3F5123] border border-[#556B2F]' : 'bg-white'
              }`}
              onClick={() => handlePrestadorClick(prestador)}
            >
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  {/* Prestador Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {prestador.profile_image ? (
                      <img
                        src={prestador.profile_image}
                        alt={prestador.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Wrench className="text-gray-400" size={32} />
                  </div>

                  {/* Prestador Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold truncate pr-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {prestador.name || prestador.full_name || 'Prestador'}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${prestador.available ? (isDarkMode ? 'bg-[#005B9C]' : 'bg-[#005B9C]') : 'bg-transmill-gray'}`}></div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {prestador.available ? 'Disponível' : 'Ocupado'}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {prestador.description || prestador.service_provider_type || 'Prestador de serviços'}
                    </p>

                    {/* Rating, Distance and Services */}
                    <div className="flex items-center space-x-4 mb-2 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <Star className="text-yellow-500" size={14} fill="currentColor" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{prestador.rating}</span>
                      </div>
                      {prestador.distance && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="text-gray-400" size={14} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{prestador.distance.toFixed(1)} km</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Badge className={`text-xs ${
                          isDarkMode ? 'bg-[#556B2F] text-[#E5C34A]' : 'bg-[#FFFFFF] text-[#005B9C]'
                        }`}>
                          {prestador.cashback_percentage || 5.0}% cashback
                        </Badge>
                      </div>
                    </div>

                    {/* Address */}
                    {prestador.city && (
                      <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        📍 {prestador.neighborhood ? `${prestador.neighborhood}, ` : ''}{prestador.city} - {prestador.state}
                      </p>
                    )}

                    {/* Price and Services Count */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`}>{prestador.price}</span>
                      <div className="flex items-center space-x-1">
                        <Wrench className="text-gray-400" size={14} />
                        <span className="text-xs text-gray-600">{prestador.services_count || 0} serviços</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap mb-3">
                      {prestador.tags && prestador.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className={`text-xs ${
                          isDarkMode ? 'border-[#005B9C] text-[#005B9C]' : 'border-gray-300 text-gray-700'
                        }`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`text-xs ${
                          isDarkMode 
                            ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]' 
                            : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirections(prestador);
                        }}
                      >
                        <Navigation size={12} className="mr-1" />
                        Como Chegar
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`text-xs ${
                          isDarkMode 
                            ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]' 
                            : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(prestador);
                        }}
                      >
                        <MessageCircle size={12} className="mr-1" />
                        WhatsApp
                      </Button>
                      
                      <Button 
                        size="sm" 
                        className={`text-xs ${
                          isDarkMode 
                            ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                            : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookService(prestador);
                        }}
                      >
                        <Calendar size={12} className="mr-1" />
                        Agenda
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrestadores.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum prestador encontrado</h3>
              <p className="text-gray-600 mb-4">Tente ajustar sua busca ou filtros</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className={`border-2 ${
          isDarkMode 
            ? 'bg-[#3F5123] border-[#005B9C]' 
            : 'bg-[#FFFFFF] border-[#005B9C]'
        }`}>
          <CardContent className="p-4">
            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Quer ser um prestador?</h4>
            <div className="space-y-2">
              <Button className={`w-full ${
                isDarkMode 
                  ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                  : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
              }`}>
                Cadastrar Como Prestador
              </Button>
              <Button variant="outline" className="w-full">
                Saiba Como Funciona
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrestadoresPage;