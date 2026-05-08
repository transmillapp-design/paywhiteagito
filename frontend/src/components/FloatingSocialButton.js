import React, { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../App';
import axios from 'axios';

const FloatingSocialButton = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { token, API } = useAuth();

  const [showPulse, setShowPulse] = useState(true);
  const [stats, setStats] = useState({
    newVideos: 0,
    availablePoints: 0
  });

  useEffect(() => {
    // Parar animação após 5 segundos
    const timer = setTimeout(() => setShowPulse(false), 5000);

    // Buscar estatísticas
    fetchStats();

    return () => clearTimeout(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/social/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  const handleClick = () => {
    navigate('/social');
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Botão principal */}
      <button
        onClick={handleClick}
        className={`
          relative
          w-16 h-16 rounded-full
          ${isDark
            ? 'bg-gradient-to-br from-[#005B9C] to-[#E5C34A]'
            : 'bg-gradient-to-br from-[#005B9C] to-[#005B9C]'
          }
          shadow-2xl hover:shadow-3xl
          flex items-center justify-center
          transition-all duration-300 hover:scale-110 active:scale-95
          ${showPulse ? 'animate-pulse-slow' : ''}
        `}
        style={{
          boxShadow: isDark
            ? '0 8px 32px rgba(212, 175, 55, 0.5)'
            : '0 8px 32px rgba(139, 111, 71, 0.5)',
        }}
        aria-label="Transmill Social"
      >
        <Video
          className={`w-8 h-8 ${isDark ? 'text-[#2A3618]' : 'text-white'}`}
        />

        {/* Badge de novos vídeos */}
        {stats.newVideos > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce">
            {stats.newVideos}
          </div>
        )}

        {/* Pontos disponíveis */}
        {stats.availablePoints > 0 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            +{stats.availablePoints}
          </div>
        )}

        {/* Efeito de onda pulsante */}
        {showPulse && (
          <span
            className={`
              absolute inset-0 rounded-full
              ${isDark ? 'bg-[#005B9C]' : 'bg-[#005B9C]'}
              opacity-75 animate-ping
            `}
          ></span>
        )}
      </button>

      {/* Tooltip ao hover */}
      <div className="absolute right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div
          className={`
            px-3 py-2 rounded-lg shadow-lg whitespace-nowrap
            ${isDark ? 'bg-[#3F5123] text-white' : 'bg-white text-[#333333]'}
          `}
        >
          <div className="flex items-center gap-2">
            <Video size={16} className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} />
            <span className="font-semibold">Transmill Social</span>
          </div>
          {stats.availablePoints > 0 && (
            <div className={`text-xs mt-1 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              🏆 {stats.availablePoints} pontos disponíveis
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingSocialButton;
