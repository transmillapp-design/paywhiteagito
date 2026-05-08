import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Wifi,
  Check,
  Smartphone,
  Zap,
  Clock,
  Database,
  Star,
  CreditCard,
  Loader2,
  Gift,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';

const InternetPlansPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [myPlans, setMyPlans] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPlans();
    fetchMyPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API}/internet-plans`, { headers });
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPlans = async () => {
    try {
      const response = await fetch(`${API}/my-internet-plans`, { headers });
      const data = await response.json();
      if (data.success) {
        setMyPlans(data.purchases);
      }
    } catch (error) {
      console.error('Erro ao carregar meus planos:', error);
    }
  };

  const handlePurchase = async (planId) => {
    setPurchasing(planId);
    
    try {
      const response = await fetch(`${API}/internet-plans/${planId}/purchase`, {
        method: 'POST',
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchMyPlans(); // Atualizar lista de planos do usuário
        
        // Atualizar saldo do usuário no contexto se disponível
        if (window.location.reload) {
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        toast.error(data.detail || 'Erro ao comprar plano');
      }
    } catch (error) {
      console.error('Erro ao comprar plano:', error);
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
        <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Internet Móvel</h1>
            <div></div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <Card className={isDarkMode ? 'bg-[#3F5123]' : 'bg-white'}>
            <CardContent className="p-8 text-center">
              <div className={`animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4 ${
                isDarkMode ? 'border-[#005B9C]' : 'border-[#005B9C]'
              }`}></div>
              <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Carregando planos...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Internet Móvel</h1>
          <Badge variant="secondary" className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
            {plans.length} planos
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <Card className={`text-white ${
          isDarkMode 
            ? 'bg-[#556B2F] border border-[#005B9C]' 
            : 'bg-[#005B9C] border border-[#005B9C]'
        }`}>
          <CardContent className="p-6 text-center">
            <Wifi className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`} />
            <h2 className="text-2xl font-bold mb-2">Internet Móvel Transmill</h2>
            <p className={`mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>
              Conecte-se com qualidade e ganhe cashback
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-white/90 text-[#005B9C]'}>
                🎁 Cashback em todas as recargas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Disponível */}
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Saldo disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(user?.balance || 0)}
                </p>
              </div>
              <div className="text-right">
                <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-xs text-gray-500">Pague com seu saldo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meus Planos Ativos */}
        {myPlans.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="text-orange-600" size={20} />
                Meus Planos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myPlans.filter(plan => !plan.is_expired).slice(0, 2).map((plan) => (
                <div key={plan.id} className="p-3 bg-transmill-gold/10 rounded-lg border border-transmill-gold">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-transmill-olive">{plan.plan_name}</h4>
                    <Badge className="bg-transmill-gold/20 text-transmill-olive-dark">
                      {plan.days_remaining} dias
                    </Badge>
                  </div>
                  <div className="text-sm text-orange-700">
                    {plan.data_limit_gb && (
                      <div>📊 {plan.data_used_gb}/{plan.data_limit_gb} GB usados</div>
                    )}
                    <div>⏱️ Expira em {new Date(plan.expiry_date).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Lista de Planos Disponíveis */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <Zap className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={20} />
            Planos Disponíveis
          </h3>

          {plans.length === 0 ? (
            <Card className={isDarkMode ? 'bg-[#3F5123]' : 'bg-white'}>
              <CardContent className="p-8 text-center">
                <Wifi className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Nenhum plano disponível</h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Em breve teremos planos de internet móvel para você!</p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`border-2 transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#3F5123] border-[#556B2F] hover:border-[#005B9C]' 
                    : 'bg-white border-transparent hover:border-[#005B9C]'
                }`}
              >
                <CardContent className="p-0">
                  {/* Imagem do plano */}
                  {plan.image_url && (
                    <div className={`w-full h-32 rounded-t-lg overflow-hidden ${
                      isDarkMode ? 'bg-[#556B2F]' : 'bg-[#005B9C]'
                    }`}>
                      <img 
                        src={plan.image_url} 
                        alt={plan.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          parent.classList.add('flex', 'items-center', 'justify-center');
                          parent.innerHTML = '<div class="text-white text-5xl">📱</div>';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header do plano */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{plan.name}</h3>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`}>
                            {plan.formatted_price}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>por {plan.validity_days} dias</div>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{plan.description}</p>
                    </div>

                    {/* Características principais */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Database className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={16} />
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.formatted_data}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={16} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{plan.formatted_validity}</span>
                      </div>

                      {plan.speed_mbps && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={16} />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{plan.speed_mbps}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-4">
                        <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Incluso:</h4>
                        <div className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <div key={index} className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <Check className="text-green-500" size={14} />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefícios Transmill */}
                    <div className={`p-3 rounded-lg mb-4 ${
                      isDarkMode ? 'bg-[#556B2F]' : 'bg-orange-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="text-orange-600" size={16} />
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-[#E5C34A]' : 'text-orange-800'}`}>Benefícios Transmill</span>
                      </div>
                      <div className={`space-y-1 text-xs ${isDarkMode ? 'text-white' : 'text-orange-700'}`}>
                        <div className="flex items-center gap-1">
                          <Star className="text-orange-500" size={12} />
                          <span>Cashback em todas as recargas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="text-orange-500" size={12} />
                          <span>Pagamento com saldo da carteira</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="text-orange-500" size={12} />
                          <span>Ativação instantânea</span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de compra */}
                    <Button 
                      className={`w-full py-3 ${
                        isDarkMode 
                          ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                          : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
                      }`}
                      onClick={() => handlePurchase(plan.id)}
                      disabled={purchasing === plan.id || (user?.balance || 0) < plan.price}
                    >
                      {purchasing === plan.id ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Processando...
                        </>
                      ) : (user?.balance || 0) < plan.price ? (
                        <>
                          <CreditCard className="mr-2" size={16} />
                          Saldo insuficiente
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2" size={16} />
                          Comprar por {plan.formatted_price}
                        </>
                      )}
                    </Button>

                    {(user?.balance || 0) < plan.price && (
                      <p className="text-xs text-red-600 text-center mt-2">
                        Adicione mais R$ {(plan.price - (user?.balance || 0)).toFixed(2)} ao seu saldo
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Informações importantes */}
        <Card className={
          isDarkMode 
            ? 'bg-[#3F5123] border-[#005B9C]' 
            : 'bg-[#FFFFFF] border-[#005B9C]'
        }>
          <CardContent className="p-4">
            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>📱 Como funciona?</h4>
            <div className={`space-y-2 text-sm ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
              <div>• Escolha o plano ideal para você</div>
              <div>• Pague com o saldo da sua conta Transmill</div>
              <div>• Receba as instruções de ativação por SMS</div>
              <div>• Ganhe cashback em todas as recargas</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternetPlansPage;