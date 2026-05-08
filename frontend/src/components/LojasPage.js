import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Store,
  Search,
  MapPin,
  Star,
  Heart,
  ShoppingCart,
  Filter,
  Grid3X3,
  List,
  Navigation,
  Loader2,
  AlertCircle,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import axios from 'axios';

const LojasPage = ({ embedded = false, franquiaContext = null }) => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stores, setStores] = useState([]);
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
    { id: 'all', name: 'Todas', count: 0 },
    { id: 'alimentacao', name: 'Alimentação', count: 0 },
    { id: 'moda', name: 'Moda & Beleza', count: 0 },
    { id: 'casa', name: 'Casa & Jardim', count: 0 },
    { id: 'eletronicos', name: 'Eletrônicos', count: 0 },
    { id: 'saude', name: 'Saúde & Bem-estar', count: 0 },
    { id: 'outros', name: 'Outros', count: 0 }
  ]);

  useEffect(() => {
    fetchStores();
    requestLocation();
  }, []);

  // Buscar lojas do backend
  const fetchStores = async (location = null) => {
    setLoading(true);
    try {
      let url = `${API}/stores`;
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
      
      if (response.data.stores) {
        const storesWithDistance = response.data.stores.map(store => ({
          ...store,
          distance: location ? calculateDistance(location, {
            latitude: store.latitude,
            longitude: store.longitude
          }) : null,
          tags: store.tags || ['Parceiro Transmill'],
          cashback: store.cashback_percentage || 5,
          rating: store.rating || 4.5,
          isPartner: true
        }));
        
        // Ordenar por distância se houver localização
        if (location) {
          storesWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        setStores(storesWithDistance);
        updateCategories(storesWithDistance);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      // Fallback para dados mock se API falhar
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar contadores de categoria
  const updateCategories = (storesList) => {
    const categoryCounts = storesList.reduce((acc, store) => {
      const category = store.business_segment || store.category || 'outros';
      acc[category] = (acc[category] || 0) + 1;
      acc.all += 1;
      return acc;
    }, { all: 0 });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: categoryCounts[cat.id] || 0
    })));
  };

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
        fetchStores(location);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Não foi possível obter sua localização');
        setLocationLoading(false);
        // Buscar lojas sem filtro de localização
        fetchStores();
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
      // Aqui você pode integrar com Google Maps Geocoding API
      // Por ora, vamos simular uma busca
      console.log('Buscando por endereço:', manualAddress);
      
      // Simular coordenadas (São Paulo centro)
      const location = {
        latitude: -23.5505,
        longitude: -46.6333
      };
      
      setUserLocation(location);
      await fetchStores(location);
      setShowAddressInput(false);
    } catch (error) {
      setLocationError('Endereço não encontrado');
    } finally {
      setLocationLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const storeCategory = store.business_segment || store.category || 'outros';
    const matchesCategory = selectedCategory === 'all' || storeCategory === selectedCategory;
    const matchesSearch = (store.company_name || store.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (store.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStoreClick = (store) => {
    // Navegar para o catálogo da loja
    navigate(`/catalog/${store.id}`);
  };

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
              {franquiaContext?.nome ? `${franquiaContext.nome} Lojas` : 'Transmill Lojas'}
            </h1>
            <Badge variant="secondary" className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
              {filteredStores.length} lojas
            </Badge>
          </div>
        </div>
      )}
      
      {/* Header embutido */}
      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Lojas Parceiras</h2>
            <p className="text-gray-600">Encontre lojas parceiras {franquiaContext?.nome || 'Transmill'}</p>
          </div>
          <Badge style={{ backgroundColor: corPrimaria }} className="text-white">
            {filteredStores.length} lojas
          </Badge>
        </div>
      )}

      <div className={`${embedded ? '' : 'max-w-md mx-auto px-4 py-6'} space-y-6`}>
        {/* Location Section */}
        <Card className={`border-2 ${isDarkMode ? "bg-[#3F5123] border-[#005B9C]" : "bg-[#FFFFFF] border-[#005B9C]"}`}>
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
                  ✓ Mostrando lojas próximas à sua localização
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
            <Store className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`} />
            <h2 className="text-2xl font-bold mb-2">Marketplace Transmill</h2>
            <p className="text-orange-100 mb-4">
              Compre em lojas parceiras e ganhe cashback
            </p>
            <Badge className="bg-white/20 text-white">
              🎁 Cashback de até 12%
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
                placeholder="Buscar lojas, produtos ou serviços..."
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
                {filteredStores.length} lojas encontradas
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

        {/* Stores List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
          {filteredStores.map((store) => (
            <Card 
              key={store.id}
              className={`hover:shadow-lg transition-all duration-200 ${
                isDarkMode ? 'bg-[#3F5123] border border-[#556B2F]' : 'bg-white'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  {/* Store Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {store.profile_image ? (
                      <img
                        src={store.profile_image}
                        alt={store.company_name || store.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Store className="text-gray-400" size={32} />
                  </div>

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold truncate pr-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {store.company_name || store.name || 'Loja Parceira'}
                      </h3>
                      {store.isPartner && (
                        <Badge className={`text-xs ${
                          isDarkMode ? 'bg-[#556B2F] text-[#E5C34A]' : 'bg-[#FFFFFF] text-[#005B9C]'
                        }`}>
                          Parceiro
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {store.description || store.business_segment || 'Loja parceira Transmill'}
                    </p>

                    {/* Rating and Cashback */}
                    <div className="flex items-center space-x-4 mb-2 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <Star className="text-yellow-500" size={14} fill="currentColor" />
                        <span className="text-sm font-medium">{store.rating}</span>
                      </div>
                      <Badge className={`text-xs ${
                        isDarkMode 
                          ? 'bg-[#005B9C] text-[#2A3618]' 
                          : 'bg-[#005B9C] text-white'
                      }`}>
                        {(store.cashback_rate * 100 || store.cashback || 0).toFixed(2)}% cashback
                      </Badge>
                    </div>

                    {/* Address */}
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      📍 {store.street || store.address}, {store.number} - {store.neighborhood}, {store.city}
                    </p>

                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap mb-3">
                      {store.tags && store.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className={`text-xs ${
                          isDarkMode ? 'border-[#005B9C] text-[#005B9C]' : 'border-gray-300 text-gray-700'
                        }`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* WhatsApp Button */}
                      {store.whatsapp && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const phone = store.whatsapp.replace(/\D/g, '');
                            window.open(`https://wa.me/55${phone}`, '_blank');
                          }}
                          className={`flex-1 min-w-[100px] ${
                            isDarkMode 
                              ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]' 
                              : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]'
                          }`}
                        >
                          <MessageCircle size={14} className="mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      
                      {/* Como Chegar Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const address = `${store.street || store.address}, ${store.number} - ${store.neighborhood}, ${store.city}, ${store.state}`;
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        className={`flex-1 min-w-[100px] ${
                          isDarkMode 
                            ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]' 
                            : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        <MapPin size={14} className="mr-1" />
                        Como Chegar
                      </Button>
                      
                      {/* Catálogo Button */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStoreClick(store);
                        }}
                        className={`flex-1 min-w-[100px] ${
                          isDarkMode 
                            ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                            : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
                        }`}
                      >
                        <ShoppingBag size={14} className="mr-1" />
                        Catálogo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma loja encontrada</h3>
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
            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Quer ser um parceiro?</h4>
            <div className="space-y-2">
              <Button className={`w-full ${
                isDarkMode 
                  ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                  : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
              }`}>
                Cadastrar Minha Loja
              </Button>
              <Button variant="outline" className="w-full">
                Saiba Mais Sobre Parcerias
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LojasPage;