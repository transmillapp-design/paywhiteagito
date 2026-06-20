/**
 * AddressInput - Transmill Mobility
 * Componente de entrada de endereço com sugestões simuladas
 * (Substitui Google Places Autocomplete)
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, X, History, Star } from 'lucide-react';
import { Input } from '../ui/input';

// Endereços populares simulados (em produção, viriam de uma API)
const popularAddresses = [
  { address: 'Av. Paulista, 1000 - São Paulo, SP', lat: -23.5629, lng: -46.6544 },
  { address: 'Pinheiros - São Paulo, SP', lat: -23.5667, lng: -46.6917 },
  { address: 'Consolação - São Paulo, SP', lat: -23.5519, lng: -46.6589 },
  { address: 'Vila Madalena - São Paulo, SP', lat: -23.5500, lng: -46.6900 },
  { address: 'Itaim Bibi - São Paulo, SP', lat: -23.5847, lng: -46.6764 },
  { address: 'Moema - São Paulo, SP', lat: -23.6008, lng: -46.6650 },
  { address: 'Brooklin - São Paulo, SP', lat: -23.6167, lng: -46.6833 },
  { address: 'Centro - São Paulo, SP', lat: -23.5505, lng: -46.6333 },
  { address: 'Jardins - São Paulo, SP', lat: -23.5700, lng: -46.6600 },
  { address: 'Higienópolis - São Paulo, SP', lat: -23.5450, lng: -46.6567 },
  { address: 'Liberdade - São Paulo, SP', lat: -23.5567, lng: -46.6344 },
  { address: 'Bela Vista - São Paulo, SP', lat: -23.5600, lng: -46.6450 },
];

// Histórico recente simulado
const recentAddresses = [
  { address: 'Casa - Rua das Flores, 123', lat: -23.5500, lng: -46.6400 },
  { address: 'Trabalho - Av. Brasil, 500', lat: -23.5600, lng: -46.6500 },
];

// Favoritos simulados
const favoriteAddresses = [
  { address: 'Academia - Rua Fitness, 50', lat: -23.5550, lng: -46.6550 },
  { address: 'Shopping - Av. Comercial, 1000', lat: -23.5700, lng: -46.6700 },
];

const AddressInput = ({ 
  value = { address: '', lat: null, lng: null }, 
  onChange, 
  placeholder = 'Digite um endereço',
  icon: Icon = MapPin,
  isDarkMode = false,
  showCurrentLocation = false,
  onUseCurrentLocation,
  label
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // all, recent, favorites
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Atualiza o valor do input quando o value externo muda
  useEffect(() => {
    if (value?.address !== inputValue) {
      setInputValue(value?.address || '');
    }
  }, [value?.address]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar sugestões baseado no input
  const filterSuggestions = (query) => {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    
    return popularAddresses.filter(addr => 
      addr.address.toLowerCase().includes(queryLower)
    ).slice(0, 5);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Atualizar sugestões
    const filtered = filterSuggestions(newValue);
    setSuggestions(filtered);
    setShowSuggestions(true);
    
    // Notificar mudança (sem coordenadas até selecionar)
    onChange({ address: newValue, lat: null, lng: null });
  };

  const handleSelectAddress = (addr) => {
    setInputValue(addr.address);
    onChange({
      address: addr.address,
      lat: addr.lat,
      lng: addr.lng
    });
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange({ address: '', lat: null, lng: null });
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (!inputValue) {
      setSuggestions([]);
    }
  };

  // Cores do tema
  const colors = isDarkMode ? {
    bg: 'bg-[#1a59ad]',
    input: 'bg-[#1a59ad] border-[#CEAE31] text-white placeholder:text-gray-400',
    dropdown: 'bg-[#6B6A4B] border-[#CEAE31]',
    item: 'hover:bg-[#CEAE31]/20 text-white',
    icon: 'text-[#CEAE31]',
    textMuted: 'text-gray-300',
    category: 'bg-[#1a59ad] text-[#CEAE31]',
    categoryActive: 'bg-[#CEAE31] text-[#1a59ad]'
  } : {
    bg: 'bg-white',
    input: 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500',
    dropdown: 'bg-white border-gray-200',
    item: 'hover:bg-[#005B9C]/10 text-gray-900',
    icon: 'text-[#005B9C]',
    textMuted: 'text-gray-500',
    category: 'bg-gray-100 text-gray-600',
    categoryActive: 'bg-[#005B9C] text-white'
  };

  const showDropdown = showSuggestions && (
    suggestions.length > 0 || 
    !inputValue || 
    activeCategory !== 'all'
  );

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className={`text-sm font-medium mb-1.5 block ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <Icon size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.icon}`} />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`pl-10 pr-10 h-12 ${colors.input}`}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${isDarkMode ? 'hover:bg-[#CEAE31]/20' : 'hover:bg-gray-100'}`}
          >
            <X size={16} className={colors.textMuted} />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {showDropdown && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg border overflow-hidden ${colors.dropdown}`}>
          {/* Categorias */}
          {!inputValue && (
            <div className="flex p-2 space-x-2 border-b border-gray-200/20">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === 'all' ? colors.categoryActive : colors.category
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategory('recent')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === 'recent' ? colors.categoryActive : colors.category
                }`}
              >
                Recentes
              </button>
              <button
                onClick={() => setActiveCategory('favorites')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === 'favorites' ? colors.categoryActive : colors.category
                }`}
              >
                Favoritos
              </button>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {/* Usar localização atual */}
            {showCurrentLocation && onUseCurrentLocation && !inputValue && (
              <button
                onClick={() => {
                  onUseCurrentLocation();
                  setShowSuggestions(false);
                }}
                className={`w-full px-4 py-3 flex items-center space-x-3 ${colors.item} border-b border-gray-200/20`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
                  <Navigation size={16} className={isDarkMode ? 'text-[#1a59ad]' : 'text-white'} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Usar localização atual</p>
                  <p className={`text-xs ${colors.textMuted}`}>GPS</p>
                </div>
              </button>
            )}

            {/* Resultados da busca */}
            {inputValue && suggestions.length > 0 && suggestions.map((addr, index) => (
              <button
                key={index}
                onClick={() => handleSelectAddress(addr)}
                className={`w-full px-4 py-3 flex items-center space-x-3 text-left ${colors.item}`}
              >
                <MapPin size={18} className={colors.icon} />
                <span className="truncate">{addr.address}</span>
              </button>
            ))}

            {/* Sem resultados */}
            {inputValue && suggestions.length === 0 && (
              <div className={`px-4 py-6 text-center ${colors.textMuted}`}>
                <p className="text-sm">Nenhum endereço encontrado</p>
                <p className="text-xs mt-1">Tente outro termo de busca</p>
              </div>
            )}

            {/* Recentes */}
            {!inputValue && (activeCategory === 'all' || activeCategory === 'recent') && (
              <>
                {activeCategory === 'all' && (
                  <div className={`px-4 py-2 text-xs font-medium ${colors.textMuted}`}>
                    RECENTES
                  </div>
                )}
                {recentAddresses.map((addr, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 text-left ${colors.item}`}
                  >
                    <History size={18} className={colors.textMuted} />
                    <span className="truncate">{addr.address}</span>
                  </button>
                ))}
              </>
            )}

            {/* Favoritos */}
            {!inputValue && (activeCategory === 'all' || activeCategory === 'favorites') && (
              <>
                {activeCategory === 'all' && (
                  <div className={`px-4 py-2 text-xs font-medium ${colors.textMuted}`}>
                    FAVORITOS
                  </div>
                )}
                {favoriteAddresses.map((addr, index) => (
                  <button
                    key={`fav-${index}`}
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 text-left ${colors.item}`}
                  >
                    <Star size={18} className="text-yellow-500" />
                    <span className="truncate">{addr.address}</span>
                  </button>
                ))}
              </>
            )}

            {/* Populares */}
            {!inputValue && activeCategory === 'all' && (
              <>
                <div className={`px-4 py-2 text-xs font-medium ${colors.textMuted}`}>
                  POPULARES
                </div>
                {popularAddresses.slice(0, 4).map((addr, index) => (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 text-left ${colors.item}`}
                  >
                    <MapPin size={18} className={colors.icon} />
                    <span className="truncate">{addr.address}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
