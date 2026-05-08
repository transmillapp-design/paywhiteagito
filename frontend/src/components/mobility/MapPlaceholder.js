/**
 * MapPlaceholder - Transmill Mobility
 * Componente de mapa placeholder que simula um mapa interativo
 * Pode ser substituído por Google Maps quando a API key estiver disponível
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Car, User, Circle } from 'lucide-react';

// Simulação de um mapa com visual realista
const MapPlaceholder = ({
  origin,
  destination,
  driverLocation,
  showRoute = false,
  showDriver = false,
  showPickup = true,
  height = 'h-64',
  className = '',
  isDarkMode = false,
  onMapClick,
  animated = true
}) => {
  const [driverPosition, setDriverPosition] = useState({ x: 20, y: 80 });
  const canvasRef = useRef(null);

  // Cores do tema
  const colors = isDarkMode ? {
    bg: '#293618',
    road: '#4a5240',
    roadLight: '#5a6250',
    building: '#3d4a2d',
    water: '#1a4a5e',
    park: '#2d4a1e',
    text: '#CEAE31',
    origin: '#22c55e',
    destination: '#ef4444',
    driver: '#CEAE31',
    route: '#CEAE31'
  } : {
    bg: '#e8e8e8',
    road: '#ffffff',
    roadLight: '#f5f5f5',
    building: '#d4d4d4',
    water: '#a3d4f7',
    park: '#c8e6c9',
    text: '#005B9C',
    origin: '#22c55e',
    destination: '#ef4444',
    driver: '#005B9C',
    route: '#005B9C'
  };

  // Animação do motorista se movendo
  useEffect(() => {
    if (!animated || !showDriver) return;

    const interval = setInterval(() => {
      setDriverPosition(prev => {
        // Movimento suave em direção ao destino
        const targetX = showRoute ? 50 : prev.x;
        const targetY = showRoute ? 50 : prev.y;
        
        const newX = prev.x + (targetX - prev.x) * 0.02 + (Math.random() - 0.5) * 2;
        const newY = prev.y + (targetY - prev.y) * 0.02 + (Math.random() - 0.5) * 2;
        
        return {
          x: Math.max(10, Math.min(90, newX)),
          y: Math.max(10, Math.min(90, newY))
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [animated, showDriver, showRoute]);

  // Desenhar mapa no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpar canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Desenhar grid de ruas
    ctx.strokeStyle = colors.road;
    ctx.lineWidth = 3;

    // Ruas horizontais
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height * i / 5);
      ctx.lineTo(width, height * i / 5);
      ctx.stroke();
    }

    // Ruas verticais
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(width * i / 5, 0);
      ctx.lineTo(width * i / 5, height);
      ctx.stroke();
    }

    // Desenhar alguns blocos/prédios
    ctx.fillStyle = colors.building;
    const blocks = [
      [0.05, 0.05, 0.15, 0.15],
      [0.25, 0.05, 0.12, 0.12],
      [0.45, 0.08, 0.1, 0.1],
      [0.65, 0.05, 0.14, 0.12],
      [0.85, 0.08, 0.1, 0.1],
      [0.05, 0.28, 0.12, 0.1],
      [0.25, 0.25, 0.1, 0.12],
      [0.45, 0.28, 0.15, 0.1],
      [0.68, 0.25, 0.1, 0.1],
      [0.05, 0.48, 0.1, 0.1],
      [0.28, 0.45, 0.12, 0.12],
      [0.48, 0.48, 0.1, 0.1],
      [0.68, 0.45, 0.12, 0.12],
      [0.85, 0.48, 0.1, 0.1],
      [0.08, 0.68, 0.12, 0.1],
      [0.28, 0.65, 0.1, 0.12],
      [0.48, 0.68, 0.12, 0.1],
      [0.68, 0.68, 0.1, 0.1],
      [0.08, 0.85, 0.1, 0.1],
      [0.28, 0.85, 0.12, 0.1],
      [0.48, 0.88, 0.1, 0.08],
      [0.68, 0.85, 0.1, 0.1],
      [0.85, 0.85, 0.1, 0.1],
    ];

    blocks.forEach(([x, y, w, h]) => {
      ctx.fillRect(x * width, y * height, w * width, h * height);
    });

    // Parque (área verde)
    ctx.fillStyle = colors.park;
    ctx.beginPath();
    ctx.ellipse(width * 0.75, height * 0.35, width * 0.08, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rota se tiver origem e destino
    if (showRoute && origin && destination) {
      ctx.strokeStyle = colors.route;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height * 0.8);
      ctx.quadraticCurveTo(width * 0.5, height * 0.3, width * 0.8, height * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [colors, showRoute, origin, destination]);

  return (
    <div 
      className={`relative ${height} ${className} overflow-hidden rounded-lg`}
      onClick={onMapClick}
    >
      {/* Canvas do mapa */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Overlay com elementos do mapa */}
      <div className="absolute inset-0">
        {/* Marcador de Origem */}
        {showPickup && origin && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{ left: '20%', top: '80%' }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <MapPin size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45"></div>
            </div>
            {origin.address && (
              <div className={`mt-1 px-2 py-1 rounded text-xs whitespace-nowrap ${isDarkMode ? 'bg-[#293618] text-white' : 'bg-white text-gray-800'} shadow-md`}>
                {origin.address.substring(0, 20)}...
              </div>
            )}
          </div>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{ left: '80%', top: '20%' }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Navigation size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
            </div>
            {destination.address && (
              <div className={`mt-1 px-2 py-1 rounded text-xs whitespace-nowrap ${isDarkMode ? 'bg-[#293618] text-white' : 'bg-white text-gray-800'} shadow-md`}>
                {destination.address.substring(0, 20)}...
              </div>
            )}
          </div>
        )}

        {/* Marcador do Motorista */}
        {showDriver && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
            style={{ left: `${driverPosition.x}%`, top: `${driverPosition.y}%` }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
              <Car size={22} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
            </div>
            {/* Pulse effect */}
            <div className={`absolute inset-0 w-10 h-10 rounded-full animate-ping opacity-30 ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}></div>
          </div>
        )}

        {/* Labels de ruas (decorativo) */}
        <div className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-[#293618]/80 text-[#CEAE31]' : 'bg-white/80 text-gray-600'}`}>
          Av. Transmill
        </div>
        <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-[#293618]/80 text-[#CEAE31]' : 'bg-white/80 text-gray-600'}`}>
          R. Mobilidade
        </div>

        {/* Indicador de zoom (decorativo) */}
        <div className={`absolute bottom-2 right-2 flex flex-col space-y-1`}>
          <button className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-[#6B6A4B] text-white' : 'bg-white text-gray-600'} shadow`}>
            +
          </button>
          <button className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-[#6B6A4B] text-white' : 'bg-white text-gray-600'} shadow`}>
            −
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente simplificado para mostrar apenas localização atual
export const CurrentLocationMap = ({ isDarkMode = false, height = 'h-48' }) => {
  return (
    <MapPlaceholder
      showPickup={false}
      showDriver={true}
      showRoute={false}
      height={height}
      isDarkMode={isDarkMode}
      animated={true}
    />
  );
};

// Componente para mostrar rota entre dois pontos
export const RouteMap = ({ origin, destination, driverLocation, isDarkMode = false, height = 'h-64' }) => {
  return (
    <MapPlaceholder
      origin={origin}
      destination={destination}
      driverLocation={driverLocation}
      showRoute={true}
      showDriver={!!driverLocation}
      showPickup={true}
      height={height}
      isDarkMode={isDarkMode}
      animated={true}
    />
  );
};

// Componente para tracking em tempo real
export const TrackingMap = ({ origin, destination, driverLocation, status, isDarkMode = false, height = 'h-64' }) => {
  const showDriver = ['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'].includes(status);
  
  return (
    <div className="relative">
      <MapPlaceholder
        origin={origin}
        destination={destination}
        driverLocation={driverLocation}
        showRoute={true}
        showDriver={showDriver}
        showPickup={true}
        height={height}
        isDarkMode={isDarkMode}
        animated={true}
      />
      
      {/* Status overlay */}
      {status && (
        <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg ${
          isDarkMode ? 'bg-[#293618] text-[#CEAE31]' : 'bg-white text-[#005B9C]'
        }`}>
          <div className="flex items-center space-x-2">
            {status === 'driver_arriving' && (
              <>
                <Car size={16} className="animate-bounce" />
                <span className="text-sm font-medium">Motorista a caminho</span>
              </>
            )}
            {status === 'driver_arrived' && (
              <>
                <Circle size={16} className="text-green-500 fill-green-500" />
                <span className="text-sm font-medium">Motorista chegou!</span>
              </>
            )}
            {status === 'in_progress' && (
              <>
                <Navigation size={16} className="animate-pulse" />
                <span className="text-sm font-medium">Em viagem</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPlaceholder;
