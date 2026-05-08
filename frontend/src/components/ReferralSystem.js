import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { 
  Users, 
  Share, 
  Copy, 
  Gift, 
  TrendingUp,
  MessageCircle,
  Award,
  User,
  Target,
  Zap,
  Heart,
  CheckCircle,
  Star
} from 'lucide-react';
import axios from 'axios';

const ReferralSystem = () => {
  const { token, API } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState('');
  const isDarkMode = useTheme();
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchReferralData();
    fetchNetworkData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await axios.get(`${API}/referral/my-code`, { headers });
      setReferralData(response.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Erro ao carregar dados de indicação');
    }
  };

  const fetchNetworkData = async () => {
    try {
      const response = await axios.get(`${API}/referral/my-network`, { headers });
      setNetworkData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching network data:', error);
      toast.error('Erro ao carregar rede de indicações');
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedItem(type);
      toast.success(`${type} copiado! 🎉`);
      setTimeout(() => setCopiedItem(''), 2000);
      
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  const shareOnWhatsApp = () => {
    if (referralData?.whatsapp_link) {
      window.open(referralData.whatsapp_link, '_blank');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className={`max-w-md mx-auto px-4 py-6 min-h-screen ${isDarkMode ? 'bg-[#293618]' : 'bg-[#EEEEEE]'}`}>
        <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31] text-white' : 'bg-white border-[#005B9C] text-[#333333]'}`}>
          <CardContent className="p-6 text-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4 ${isDarkMode ? 'border-[#CEAE31]' : 'border-[#005B9C]'}`}></div>
            <p className={isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}>Carregando sistema de indicações...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto px-4 py-6 space-y-6 min-h-screen ${isDarkMode ? 'bg-[#293618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header de Indicação */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31] text-white' : 'bg-white border-[#005B9C] text-[#333333]'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
                <Users size={24} className={isDarkMode ? 'text-[#293618]' : 'text-white'} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Indicar & Ganhar</h2>
                <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>Compartilhe e lucre</p>
              </div>
            </div>
            <Badge className={isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}>
              10% Cashback
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-lg p-3 text-center ${isDarkMode ? 'bg-[#293618] border-[#CEAE31]' : 'bg-[#F5F5F5] border-[#005B9C]'}`}>
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>Indicações</p>
              <p className="text-2xl font-bold">{referralData?.referral_count || 0}</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${isDarkMode ? 'bg-[#293618] border-[#CEAE31]' : 'bg-[#F5F5F5] border-[#005B9C]'}`}>
              <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>Ganhos</p>
              <p className="text-2xl font-bold">{formatCurrency(networkData?.earnings?.total || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como Funciona */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDarkMode ? 'bg-[#CEAE31]' : 'bg-[#005B9C]'}`}>
              <Zap className={isDarkMode ? 'text-[#293618]' : 'text-white'} size={24} />
            </div>
            <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Como Funciona?</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}`}>1</div>
              <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#666666]'}`}>Compartilhe seu código ou link com amigos</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}`}>2</div>
              <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#666666]'}`}>Eles se cadastram usando seu código</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}`}>3</div>
              <p className={`text-sm ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#666666]'}`}>Você ganha 10% do cashback de cada compra!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seu Código de Indicação */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center justify-center space-x-2 text-center ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <Award size={20} className={isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'} />
            <span>Seu Código Exclusivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`border-2 p-6 rounded-xl text-center ${isDarkMode ? 'bg-[#293618] border-[#CEAE31]' : 'bg-[#F5F5F5] border-[#005B9C]'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>Código de Indicação</p>
            <p className={`text-3xl font-bold tracking-wider mb-3 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
              {referralData?.referral_code || 'CARREGANDO...'}
            </p>
            <Button
              onClick={() => copyToClipboard(referralData?.referral_code, 'Código')}
              className={isDarkMode ? 'bg-[#CEAE31] text-[#293618] hover:bg-[#E5C34A]' : 'bg-[#005B9C] text-white hover:bg-[#0077CC]'}
              disabled={!referralData?.referral_code}
            >
              {copiedItem === 'Código' ? (
                <CheckCircle size={16} className="mr-2" />
              ) : (
                <Copy size={16} className="mr-2" />
              )}
              {copiedItem === 'Código' ? 'Copiado!' : 'Copiar Código'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link de Compartilhamento */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <Share size={20} className={isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'} />
            <span>Link de Compartilhamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={referralData?.referral_link || 'Carregando...'}
              readOnly
              className={`flex-1 text-sm ${
                isDarkMode 
                  ? 'bg-[#293618] border-[#CEAE31] text-white' 
                  : 'bg-white border-[#CCCCCC] text-[#333333]'
              }`}
            />
            <Button
              onClick={() => copyToClipboard(referralData?.referral_link, 'Link')}
              variant="outline"
              className={isDarkMode ? 'border-[#CEAE31] text-white hover:bg-[#293618]' : 'border-[#005B9C] text-[#333333] hover:bg-[#F5F5F5]'}
              disabled={!referralData?.referral_link}
            >
              {copiedItem === 'Link' ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </Button>
          </div>

          <Button
            onClick={shareOnWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
            disabled={!referralData?.whatsapp_link}
          >
            <MessageCircle size={20} className="mr-2" />
            Compartilhar no WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Pessoas Indicadas */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6A4B] border-[#CEAE31]' : 'bg-white border-[#005B9C]'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <Target size={20} className={isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'} />
            <span>Sua Rede</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!networkData?.referrals?.length ? (
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-[#293618]' : 'bg-gray-100'}`}>
                <Users className={isDarkMode ? 'text-[#CEAE31]' : 'text-gray-400'} size={32} />
              </div>
              <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Nenhuma indicação ainda</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-[#CEAE31]' : 'text-gray-500'}`}>Comece compartilhando seu código!</p>
              <Badge className={isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}>
                Primeira indicação ganha bônus extra! 🎁
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              {networkData.referrals.slice(0, 3).map((referral, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-[#293618] border-[#CEAE31]' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-full w-10 h-10 flex items-center justify-center ${isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-green-500 text-white'}`}>
                      <User size={16} />
                    </div>
                    <div>
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>{referral.name}</p>
                      <p className={`text-sm flex items-center ${isDarkMode ? 'text-[#CEAE31]' : 'text-green-600'}`}>
                        <Star size={12} className="mr-1" />
                        {referral.user_type === 'cliente' ? 'Cliente' : 'Lojista'} 
                        • {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-green-500 text-white'}>
                    <Heart size={12} className="mr-1" />
                    Ativo
                  </Badge>
                </div>
              ))}
              
              {networkData?.referrals?.length > 3 && (
                <div className="text-center">
                  <Badge className={isDarkMode ? 'bg-[#CEAE31] text-[#293618]' : 'bg-[#005B9C] text-white'}>
                    +{networkData.referrals.length - 3} indicações
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;
