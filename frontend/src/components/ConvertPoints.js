import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  ArrowLeft,
  Award,
  DollarSign,
  TrendingUp,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

const ConvertPoints = () => {
  const navigate = useNavigate();
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();

  const [userPoints, setUserPoints] = useState(0);
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [pointsToConvert, setPointsToConvert] = useState('');
  const [converting, setConverting] = useState(false);
  const [conversionRate, setConversionRate] = useState(0.01); // 100 pts = R$ 1

  useEffect(() => {
    fetchUserData();
    fetchSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPoints(response.data.social_points || 0);
      setCashbackBalance(parseFloat(response.data.cashback_balance || 0));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/master/social/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversionRate(response.data.settings?.points_to_brl_rate || 0.01);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleConvert = async () => {
    const points = parseInt(pointsToConvert);

    if (!points || points <= 0) {
      toast.error('Digite uma quantidade válida de pontos');
      return;
    }

    if (points > userPoints) {
      toast.error('Pontos insuficientes');
      return;
    }

    if (points < 100) {
      toast.error('Mínimo de 100 pontos para conversão');
      return;
    }

    try {
      setConverting(true);

      const response = await axios.post(
        `${API}/social/points/convert`,
        { points },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ Conversão realizada!', {
        description: `${points} pontos → R$ ${response.data.cashback_earned.toFixed(2)}`
      });

      // Update local state
      setUserPoints(response.data.new_points_balance);
      setCashbackBalance(response.data.new_cashback_balance);
      setPointsToConvert('');
    } catch (error) {
      console.error('Error converting points:', error);
      toast.error(error.response?.data?.detail || 'Erro ao converter pontos');
    } finally {
      setConverting(false);
    }
  };

  const calculateCashback = (points) => {
    return (parseInt(points) || 0) * conversionRate;
  };

  const quickConvert = (percentage) => {
    const points = Math.floor(userPoints * percentage);
    setPointsToConvert(points.toString());
  };

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#3F5123]' : 'bg-[#FFFFFF]'} shadow-md`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-[#E5D5C3]'
              }`}
            >
              <ArrowLeft className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={24} />
            </button>

            <div className="flex items-center gap-2">
              <TrendingUp className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                Converter Pontos
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Balances */}
        <div className="grid grid-cols-2 gap-4">
          <Card className={`${isDark ? 'bg-[#556B2F] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Award className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                Pontos
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              {userPoints}
            </p>
          </Card>

          <Card className={`${isDark ? 'bg-[#556B2F] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                Cashback
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              R$ {cashbackBalance.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Info Card */}
        <Card className={`${isDark ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
              Como funciona?
            </h3>
          </div>
          <ul className={`text-sm space-y-2 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
            <li>• 100 pontos = R$ 1,00 em cashback</li>
            <li>• Mínimo de 100 pontos para conversão</li>
            <li>• Cashback vai direto para sua carteira</li>
            <li>• Pode usar para compras e saques</li>
          </ul>
        </Card>

        {/* Conversion Form */}
        <Card className={`${isDark ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
            Quantidade de Pontos
          </h3>

          <Input
            type="number"
            value={pointsToConvert}
            onChange={(e) => setPointsToConvert(e.target.value)}
            placeholder="Digite a quantidade"
            className={`mb-3 ${isDark ? 'bg-[#2A3618] border-[#556B2F] text-white' : ''}`}
            min="100"
            max={userPoints}
          />

          {/* Quick buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0.25, 0.5, 0.75, 1].map((percentage) => (
              <button
                key={percentage}
                onClick={() => quickConvert(percentage)}
                className={`py-2 rounded-lg text-sm font-medium ${
                  isDark
                    ? 'bg-[#556B2F] text-[#E5C34A] hover:bg-[#6B8239]'
                    : 'bg-[#E5D5C3] text-[#005B9C] hover:bg-[#D4C5B3]'
                }`}
              >
                {percentage === 1 ? 'Tudo' : `${percentage * 100}%`}
              </button>
            ))}
          </div>

          {/* Preview */}
          {pointsToConvert && parseInt(pointsToConvert) >= 100 && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                  Você receberá:
                </span>
                <Badge className="bg-green-500 text-white font-bold">
                  R$ {calculateCashback(pointsToConvert).toFixed(2)}
                </Badge>
              </div>
            </div>
          )}

          {/* Warning */}
          {pointsToConvert && parseInt(pointsToConvert) < 100 && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-500 font-semibold">
                Mínimo: 100 pontos
              </p>
            </div>
          )}

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            disabled={converting || !pointsToConvert || parseInt(pointsToConvert) < 100 || parseInt(pointsToConvert) > userPoints}
            className={`w-full ${
              isDark
                ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
            }`}
          >
            {converting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Convertendo...
              </>
            ) : (
              <>
                <Check size={20} className="mr-2" />
                Converter Agora
              </>
            )}
          </Button>
        </Card>

        {/* How to earn points */}
        <Card className={`${isDark ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-white border-[#005B9C]'} p-4`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
            Como ganhar pontos?
          </h3>
          <ul className={`text-sm space-y-2 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
            <li className="flex items-center gap-2">
              <Badge className="bg-purple-500 text-white">+50</Badge>
              Postar um vídeo
            </li>
            <li className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white">+10</Badge>
              Comentar em um vídeo
            </li>
            <li className="flex items-center gap-2">
              <Badge className="bg-pink-500 text-white">+5</Badge>
              Curtir um vídeo
            </li>
            <li className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white">+2</Badge>
              Assistir um vídeo
            </li>
            <li className="flex items-center gap-2">
              <Badge className="bg-yellow-500 text-black">+5</Badge>
              Assistir até o final (bônus)
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default ConvertPoints;
