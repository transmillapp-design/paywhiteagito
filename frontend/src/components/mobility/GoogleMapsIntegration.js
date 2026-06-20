/**
 * GoogleMapsIntegration - Transmill Mobility
 * Componentes de mapa usando Google Maps API
 * Usa o novo padrão de carregamento assíncrono recomendado pelo Google
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Car, Loader2 } from 'lucide-react';

// Verificar se Google Maps está carregado
const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && 
         window.google && 
         window.google.maps && 
         window.google.maps.Map;
};

// Carregar bibliotecas do Google Maps de forma assíncrona
const loadGoogleMapsLibraries = async () => {
  if (!window.google?.maps?.importLibrary) {
    return false;
  }
  
  try {
    await window.google.maps.importLibrary("maps");
    await window.google.maps.importLibrary("places");
    await window.google.maps.importLibrary("geometry");
    return true;
  } catch (error) {
    console.error("Erro ao carregar bibliotecas do Google Maps:", error);
    return false;
  }
};

// Hook para carregar Google Maps
export const useGoogleMaps = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Verificar se já está carregado
    if (isGoogleMapsLoaded()) {
      setLoaded(true);
      return;
    }

    // Tentar carregar as bibliotecas
    const tryLoad = async () => {
      // Aguardar o script principal carregar
      let attempts = 0;
      const maxAttempts = 50; // 10 segundos máximo
      
      while (attempts < maxAttempts) {
        if (window.google?.maps?.importLibrary) {
          const success = await loadGoogleMapsLibraries();
          if (success && isGoogleMapsLoaded()) {
            setLoaded(true);
            return;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    };

    tryLoad();
  }, []);

  return loaded;
};

// Componente de Mapa Google Maps
export const GoogleMap = ({
  origin,
  destination,
  driverLocation,
  showRoute = false,
  showDriver = false,
  height = 'h-64',
  className = '',
  isDarkMode = false,
  onMapClick,
  center,
  zoom = 15
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const directionsRenderer = useRef(null);
  const googleMapsLoaded = useGoogleMaps();

  // Estilo do mapa para modo escuro
  const darkModeStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  ];

  // Inicializar mapa
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;
    
    // Evitar recriar o mapa se já existe
    if (mapInstance.current) return;

    const defaultCenter = center || 
      (origin?.lat ? { lat: origin.lat, lng: origin.lng } : { lat: -23.5505, lng: -46.6333 });

    try {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: zoom,
        styles: isDarkMode ? darkModeStyle : [],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Directions renderer para rotas
      directionsRenderer.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: isDarkMode ? '#CEAE31' : '#005B9C',
          strokeWeight: 5,
        },
      });
      directionsRenderer.current.setMap(mapInstance.current);

      // Click handler
      if (onMapClick) {
        mapInstance.current.addListener('click', (e) => {
          onMapClick({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        });
      }
    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  }, [googleMapsLoaded, isDarkMode]);

  // Atualizar marcadores
  useEffect(() => {
    if (!mapInstance.current || !googleMapsLoaded) return;

    // Limpar marcadores antigos
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    // Marcador de origem - Ícone de pessoa/usuário
    if (origin?.lat) {
      // SVG de uma pessoa (boneco)
      const personSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
          <!-- Sombra -->
          <ellipse cx="20" cy="47" rx="10" ry="3" fill="rgba(0,0,0,0.3)"/>
          <!-- Círculo de fundo -->
          <circle cx="20" cy="22" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
          <!-- Cabeça -->
          <circle cx="20" cy="16" r="6" fill="#ffffff"/>
          <!-- Corpo -->
          <path d="M12 28 Q12 22 20 22 Q28 22 28 28 L28 34 Q28 36 26 36 L14 36 Q12 36 12 34 Z" fill="#ffffff"/>
        </svg>
      `;
      
      markersRef.current.origin = new window.google.maps.Marker({
        position: { lat: origin.lat, lng: origin.lng },
        map: mapInstance.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(personSvg),
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 47),
        },
        title: 'Você está aqui',
        zIndex: 999,
      });
    }

    // Marcador de destino - Pin de localização
    if (destination?.lat) {
      // SVG de pin de destino
      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
          <!-- Sombra -->
          <ellipse cx="18" cy="46" rx="8" ry="2" fill="rgba(0,0,0,0.3)"/>
          <!-- Pin -->
          <path d="M18 0 C8 0 0 8 0 18 C0 32 18 46 18 46 C18 46 36 32 36 18 C36 8 28 0 18 0 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <!-- Círculo interno -->
          <circle cx="18" cy="18" r="8" fill="#ffffff"/>
          <!-- Bandeira/marca -->
          <circle cx="18" cy="18" r="4" fill="#ef4444"/>
        </svg>
      `;
      
      markersRef.current.destination = new window.google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: mapInstance.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg),
          scaledSize: new window.google.maps.Size(36, 48),
          anchor: new window.google.maps.Point(18, 46),
        },
        title: 'Destino',
        zIndex: 998,
      });
    }

    // Marcador do motorista - Carro animado
    if (showDriver && driverLocation?.lat) {
      // SVG de um carro visto de cima (mais realista)
      const carColor = isDarkMode ? '#CEAE31' : '#005B9C';
      const carSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <!-- Sombra -->
          <ellipse cx="24" cy="42" rx="14" ry="4" fill="rgba(0,0,0,0.2)"/>
          <!-- Corpo do carro -->
          <rect x="10" y="12" width="28" height="24" rx="6" fill="${carColor}"/>
          <!-- Teto/Cabine -->
          <rect x="14" y="16" width="20" height="12" rx="3" fill="${isDarkMode ? '#3d4a2d' : '#003d6b'}"/>
          <!-- Para-brisa frontal -->
          <rect x="16" y="10" width="16" height="6" rx="2" fill="${isDarkMode ? '#6B6A4B' : '#87CEEB'}"/>
          <!-- Para-brisa traseiro -->
          <rect x="16" y="30" width="16" height="5" rx="2" fill="${isDarkMode ? '#6B6A4B' : '#87CEEB'}"/>
          <!-- Faróis frontais -->
          <circle cx="14" cy="12" r="2" fill="#FFD700"/>
          <circle cx="34" cy="12" r="2" fill="#FFD700"/>
          <!-- Lanternas traseiras -->
          <circle cx="14" cy="34" r="2" fill="#FF4444"/>
          <circle cx="34" cy="34" r="2" fill="#FF4444"/>
          <!-- Rodas -->
          <ellipse cx="14" cy="18" rx="4" ry="3" fill="#333"/>
          <ellipse cx="34" cy="18" rx="4" ry="3" fill="#333"/>
          <ellipse cx="14" cy="30" rx="4" ry="3" fill="#333"/>
          <ellipse cx="34" cy="30" rx="4" ry="3" fill="#333"/>
          <!-- Detalhes das rodas -->
          <ellipse cx="14" cy="18" rx="2" ry="1.5" fill="#666"/>
          <ellipse cx="34" cy="18" rx="2" ry="1.5" fill="#666"/>
          <ellipse cx="14" cy="30" rx="2" ry="1.5" fill="#666"/>
          <ellipse cx="34" cy="30" rx="2" ry="1.5" fill="#666"/>
        </svg>
      `;
      
      markersRef.current.driver = new window.google.maps.Marker({
        position: { lat: driverLocation.lat, lng: driverLocation.lng },
        map: mapInstance.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carSvg),
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 24),
        },
        title: 'Motorista',
        optimized: false, // Permite animações mais suaves
        zIndex: 1000, // Fica acima de outros marcadores
      });
    }

    // Ajustar bounds para mostrar todos os marcadores
    if (origin?.lat || destination?.lat) {
      const bounds = new window.google.maps.LatLngBounds();
      if (origin?.lat) bounds.extend({ lat: origin.lat, lng: origin.lng });
      if (destination?.lat) bounds.extend({ lat: destination.lat, lng: destination.lng });
      if (driverLocation?.lat) bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
      
      if (!bounds.isEmpty()) {
        mapInstance.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [origin, destination, driverLocation, showDriver, googleMapsLoaded]);

  // Desenhar rota
  useEffect(() => {
    if (!showRoute || !origin?.lat || !destination?.lat || !googleMapsLoaded || !directionsRenderer.current) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && directionsRenderer.current) {
          directionsRenderer.current.setDirections(result);
        }
      }
    );
  }, [origin, destination, showRoute, googleMapsLoaded]);

  // Atualizar posição do motorista de forma animada (sem recriar o marcador)
  useEffect(() => {
    if (!showDriver || !driverLocation?.lat || !markersRef.current.driver) return;
    
    const marker = markersRef.current.driver;
    const newPosition = new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng);
    
    // Animação suave para nova posição
    const currentPosition = marker.getPosition();
    if (currentPosition) {
      const startLat = currentPosition.lat();
      const startLng = currentPosition.lng();
      const endLat = driverLocation.lat;
      const endLng = driverLocation.lng;
      
      // Só animar se a distância for significativa
      const distance = Math.sqrt(
        Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
      );
      
      if (distance > 0.00001) {
        let step = 0;
        const numSteps = 30;
        const interval = setInterval(() => {
          step++;
          const progress = step / numSteps;
          const lat = startLat + (endLat - startLat) * progress;
          const lng = startLng + (endLng - startLng) * progress;
          marker.setPosition(new window.google.maps.LatLng(lat, lng));
          
          if (step >= numSteps) {
            clearInterval(interval);
          }
        }, 50);
        
        return () => clearInterval(interval);
      }
    } else {
      marker.setPosition(newPosition);
    }
  }, [driverLocation?.lat, driverLocation?.lng, showDriver]);

  // Loading state
  if (!googleMapsLoaded) {
    return (
      <div className={`${height} ${className} flex items-center justify-center ${isDarkMode ? 'bg-[#1a59ad]' : 'bg-gray-100'} rounded-lg`}>
        <div className="text-center">
          <Loader2 className={`animate-spin mx-auto mb-2 ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`} size={32} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`${height} ${className} rounded-lg`}
      style={{ minHeight: '200px' }}
    />
  );
};

// Componente de Autocomplete de Endereço com Google Places
export const GooglePlacesAutocomplete = ({
  value = { address: '', lat: null, lng: null },
  onChange,
  placeholder = 'Digite um endereço',
  icon: Icon = MapPin,
  isDarkMode = false,
  showCurrentLocation = false,
  onUseCurrentLocation,
  label
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const googleMapsLoaded = useGoogleMaps();
  const [inputValue, setInputValue] = useState(value?.address || '');

  useEffect(() => {
    if (value?.address !== inputValue) {
      setInputValue(value?.address || '');
    }
  }, [value?.address]);

  useEffect(() => {
    if (!googleMapsLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['geocode', 'establishment'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry) {
        const newValue = {
          address: place.formatted_address || place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setInputValue(newValue.address);
        onChange(newValue);
      }
    });
  }, [googleMapsLoaded, onChange]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange({ address: newValue, lat: null, lng: null });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      console.log('[GoogleMaps] Solicitando geolocalização...');
      
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`[GoogleMaps] Localização obtida: ${latitude}, ${longitude} (precisão: ${accuracy}m)`);
          
          // Reverse geocoding para obter endereço
          if (googleMapsLoaded) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === 'OK' && results[0]) {
                  const newValue = {
                    address: results[0].formatted_address,
                    lat: latitude,
                    lng: longitude,
                  };
                  setInputValue(newValue.address);
                  onChange(newValue);
                } else {
                  const newValue = {
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    lat: latitude,
                    lng: longitude,
                  };
                  setInputValue(newValue.address);
                  onChange(newValue);
                }
              }
            );
          } else {
            const newValue = {
              address: `Localização atual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude,
            };
            setInputValue(newValue.address);
            onChange(newValue);
          }
          
          if (onUseCurrentLocation) onUseCurrentLocation();
        },
        (error) => {
          console.error('[GoogleMaps] Erro ao obter localização:', error.code, error.message);
          let errorMessage = 'Erro ao obter localização';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado';
              break;
          }
          
          console.warn('[GoogleMaps]', errorMessage);
        },
        geoOptions
      );
    } else {
      console.error('[GoogleMaps] Geolocalização não suportada');
    }
  };

  const colors = isDarkMode ? {
    bg: 'bg-[#1a59ad]',
    input: 'bg-[#1a59ad] border-[#CEAE31] text-white placeholder:text-gray-400',
    icon: 'text-[#CEAE31]',
    label: 'text-[#CEAE31]',
    button: 'bg-[#CEAE31] text-[#1a59ad]',
  } : {
    bg: 'bg-white',
    input: 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500',
    icon: 'text-[#005B9C]',
    label: 'text-[#005B9C]',
    button: 'bg-[#005B9C] text-white',
  };

  return (
    <div className="relative">
      {label && (
        <label className={`text-sm font-medium mb-1.5 block ${colors.label}`}>
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        <Icon size={20} className={`absolute left-3 ${colors.icon} z-10`} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 h-12 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? 'focus:ring-[#CEAE31]' : 'focus:ring-[#005B9C]'}`}
        />
        
        {showCurrentLocation && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            className={`absolute right-2 p-2 rounded-full ${colors.button} hover:opacity-80 transition-opacity`}
            title="Usar localização atual"
          >
            <Navigation size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleMap;
