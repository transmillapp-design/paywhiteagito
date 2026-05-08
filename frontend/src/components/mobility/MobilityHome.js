/**
 * Mobility Home - Transmill
 * Tela inicial do sistema de mobilidade - escolha entre Passageiro e Motorista
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, User, Car, MapPin, Star, Clock, Wallet, Shield, Gift, ThumbsUp } from 'lucide-react';
import axios from 'axios';
import { CurrentLocationMap } from './MapPlaceholder';

const MobilityHome = ({ embedded = false, franquiaContext = null }) => {
  const navigate = useNavigate();
  const { token, user, API } = useAuth();
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };
  
  // Cores da franquia (se aplicável)
  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';

  useEffect(() => {
    const theme = localStorage.getItem('transmill-theme');
    setIsDarkMode(theme === 'dark');
    checkDriverStatus();
    checkActiveRide();
  }, []);

  const checkDriverStatus = async () => {
    try {
      const response = await axios.get(`${API}/mobility/driver/profile`, { headers });
      if (response.data.exists) {
        setDriverProfile(response.data.profile);
      }
    } catch (error) {
      console.log('Usuário não é motorista cadastrado');
    }
  };

  const checkActiveRide = async () => {
    try {
      // Verificar como cliente
      const clientResponse = await axios.get(`${API}/mobility/client/active-ride`, { headers });
      if (clientResponse.data.has_active_ride) {
        setActiveRide({ ...clientResponse.data.ride, role: 'client' });
        setLoading(false);
        return;
      }

      // Verificar como motorista
      const driverResponse = await axios.get(`${API}/mobility/driver/active-ride`, { headers });
      if (driverResponse.data.has_active_ride) {
        setActiveRide({ ...driverResponse.data.ride, role: 'driver' });
      }
    } catch (error) {
      console.log('Sem corrida ativa');
    }
    setLoading(false);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handlePassenger = () => {
    if (activeRide && activeRide.role === 'client') {
      navigate(`/mobility/ride/${activeRide.id}`);
    } else {
      navigate('/mobility/passenger');
    }
  };

  const handleDriver = () => {
    if (!driverProfile) {
      navigate('/mobility/driver/register');
    } else if (activeRide && activeRide.role === 'driver') {
      navigate(`/mobility/driver/ride/${activeRide.id}`);
    } else {
      navigate('/mobility/driver');
    }
  };

  // Cores do tema
  const colors = isDarkMode ? {
    bg: 'bg-[#293618]',
    card: 'bg-[#6B6A4B]',
    text: 'text-white',
    textSecondary: 'text-[#CEAE31]',
    primary: 'bg-[#CEAE31] text-[#293618]',
    secondary: 'bg-transparent border-2 border-[#CEAE31] text-[#CEAE31]',
    border: 'border-[#CEAE31]'
  } : {
    bg: 'bg-[#F5F5F5]',
    card: 'bg-white',
    text: 'text-[#333333]',
    textSecondary: 'text-[#005B9C]',
    primary: 'bg-[#005B9C] text-white',
    secondary: 'bg-transparent border-2 border-[#005B9C] text-[#005B9C]',
    border: 'border-[#005B9C]'
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${colors.border}`}></div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} ${colors.bg}`}>
      {/* Header - ocultar quando embutido */}
      {!embedded && (
        <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoBack}
                className={colors.text}
              >
                <ArrowLeft size={24} />
              </Button>
              <div className="ml-3">
                <h1 className={`text-xl font-bold ${colors.text}`}>
                  {franquiaContext?.nome ? `${franquiaContext.nome} Mobility` : 'Transmill Mobility'}
                </h1>
                <p className={`text-sm ${colors.textSecondary}`}>Mobilidade urbana P2P</p>
              </div>
            </div>
          </div>
        </header>
      )}
      
      {/* Header embutido */}
      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mobilidade Urbana</h2>
            <p className="text-gray-600">Serviço de transporte P2P {franquiaContext?.nome || 'Transmill'}</p>
          </div>
        </div>
      )}

      {/* Mapa de fundo */}
      <div className="relative">
        <CurrentLocationMap isDarkMode={isDarkMode} height="h-40" />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-transparent to-[#293618]' : 'from-transparent to-[#F5F5F5]'}`}></div>
      </div>

      {/* Conteúdo Principal */}
      <main className={`${embedded ? '' : 'max-w-md mx-auto'} px-4 py-6 -mt-8 relative z-10`}>
        {/* Header Centralizado */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>
            Como você quer usar?
          </h2>
          <p className={`${colors.textSecondary} text-sm`}>
            Selecione como deseja utilizar o serviço
          </p>
        </div>

        {/* Corrida Ativa - Alerta */}
        {activeRide && (
          <Card className={`mb-6 ${colors.card} border-2 ${colors.border}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
                    <MapPin size={20} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
                  </div>
                  <div>
                    <p className={`font-semibold ${colors.text}`}>Corrida em andamento</p>
                    <p className={`text-sm ${colors.textSecondary}`}>
                      {activeRide.role === 'client' ? 'Você é o passageiro' : 'Você é o motorista'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className={colors.primary}
                  onClick={() => {
                    if (activeRide.role === 'client') {
                      navigate(`/mobility/ride/${activeRide.id}`);
                    } else {
                      navigate(`/mobility/driver/ride/${activeRide.id}`);
                    }
                  }}
                >
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Escolha */}
        <div className="space-y-4">
          {/* Botão Passageiro */}
          <Button
            onClick={handlePassenger}
            className={`w-full h-20 ${colors.primary} rounded-2xl shadow-lg hover:opacity-90 transition-all`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#293618]/30' : 'bg-white/20'}`}>
                <User size={28} />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold">Sou Passageiro</p>
                <p className="text-sm opacity-80">Solicitar uma corrida</p>
              </div>
            </div>
          </Button>

          {/* Botão Motorista */}
          <Button
            onClick={handleDriver}
            variant="outline"
            className={`w-full h-20 ${colors.secondary} rounded-2xl hover:opacity-80 transition-all`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-[#005B9C]/10'}`}>
                <Car size={28} />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold">Sou Motorista</p>
                <p className="text-sm opacity-80">
                  {driverProfile ? 'Receber corridas' : 'Cadastrar-se como motorista'}
                </p>
              </div>
            </div>
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardContent className="p-3 text-center">
              <MapPin size={20} className={`mx-auto mb-1 ${colors.textSecondary}`} />
              <p className={`text-xs ${colors.text}`}>Rotas</p>
              <p className={`text-xs ${colors.textSecondary}`}>Otimizadas</p>
            </CardContent>
          </Card>
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardContent className="p-3 text-center">
              <Wallet size={20} className={`mx-auto mb-1 ${colors.textSecondary}`} />
              <p className={`text-xs ${colors.text}`}>Cashback</p>
              <p className={`text-xs ${colors.textSecondary}`}>Garantido</p>
            </CardContent>
          </Card>
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardContent className="p-3 text-center">
              <Star size={20} className={`mx-auto mb-1 ${colors.textSecondary}`} />
              <p className={`text-xs ${colors.text}`}>Avaliação</p>
              <p className={`text-xs ${colors.textSecondary}`}>Mútua</p>
            </CardContent>
          </Card>
        </div>

        {/* Saldo do Usuário */}
        <Card className={`mt-6 ${colors.card} border ${colors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet size={24} className={colors.textSecondary} />
                <div>
                  <p className={`text-sm ${colors.textSecondary}`}>Seu saldo Transmill</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    R$ {((user?.balance || 0) + (user?.cashback_balance || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={colors.secondary}
                onClick={() => navigate('/depositar')}
              >
                Depositar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Texto de Demonstração */}
        <p className={`text-center text-sm ${colors.textSecondary} mt-8`}>
          Versão de demonstração - Navegue pelos fluxos
        </p>
      </main>
    </div>
  );
};

export default MobilityHome;
