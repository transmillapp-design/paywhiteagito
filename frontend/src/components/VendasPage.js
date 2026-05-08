import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { 
  ArrowLeft, History, Store, Gift, TrendingUp, DollarSign, 
  Calendar, Search, Filter, Download 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const VendasPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    balance: 0,
    usdt_balance: 0
  });

  useEffect(() => {
    if (user?.user_type === 'lojista') {
      fetchTransactions();
      fetchBalance();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        toast.error('Erro ao carregar transações');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/user/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  if (user?.user_type !== 'lojista') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Esta página é apenas para lojistas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const salesTransactions = transactions.filter(t => t.transaction_type === 'sale');
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2 text-emerald-600" />
                    Extrato de Vendas
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Histórico detalhado de vendas e cashback oferecido</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Resumo das Vendas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-2">Vendas Hoje</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalSales)}
                  </p>
                </div>
                <TrendingUp className="text-emerald-200" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card className={`text-white ${
            isDarkMode ? 'bg-[#556B2F]' : 'bg-[#005B9C]'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Total de Vendas</p>
                  <p className="text-2xl font-bold text-white">
                    {salesTransactions.length}
                  </p>
                </div>
                <Store className={isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'} size={28} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-2">Cashback Distribuído</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalSales * ((user?.cashback_rate || 5) / 100))}
                  </p>
                </div>
                <Gift className="text-orange-200" size={28} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History size={20} />
              <span>Histórico Detalhado</span>
            </CardTitle>
            <CardDescription>
              Detalhes de cada venda realizada com breakdown do cashback oferecido
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando vendas...</p>
              </div>
            ) : salesTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Store className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma venda encontrada</h3>
                <p className="text-sm text-gray-500 mb-4">Gere um QR Code para começar a vender</p>
                <Button 
                  onClick={() => navigate('/pos')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Ir para POS
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {salesTransactions.map((sale) => {
                  const clientName = sale.description?.replace('Venda para ', '') || 'Cliente';
                  const currentCashbackRate = user?.cashback_rate || 5;
                  
                  // Calcular cashback baseado no valor da venda
                  const totalSaleAmount = sale.amount; // Valor que o lojista recebeu
                  const fullSaleAmount = totalSaleAmount / (1 - (currentCashbackRate / 100));
                  const cashbackAmount = fullSaleAmount - totalSaleAmount;

                  return (
                    <div 
                      key={sale.id} 
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      {/* Header da venda */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Store className="text-emerald-600" size={16} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{clientName}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(sale.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800">Concluída</Badge>
                      </div>

                      {/* Detalhes financeiros */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Valor Total da Venda</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(fullSaleAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-orange-600 mb-1">Cashback Oferecido ({currentCashbackRate}%)</p>
                          <p className="text-lg font-bold text-orange-600">-{formatCurrency(cashbackAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-emerald-600 mb-1">Você Recebeu</p>
                          <p className="text-lg font-bold text-emerald-600">+{formatCurrency(totalSaleAmount)}</p>
                        </div>
                      </div>

                      {/* Resumo */}
                      <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                          <Gift className="inline w-4 h-4 mr-1" />
                          Cliente ganhou {formatCurrency(cashbackAmount)} de volta • Você lucrou {formatCurrency(totalSaleAmount)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Saldo atual */}
                <div className="p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <h3 className="text-emerald-800 text-lg font-bold mb-3">SALDOS ATUAIS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-emerald-700 font-medium">BRL:</span>
                      <span className="text-emerald-600 text-xl font-bold">{formatCurrency(balance.balance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-yellow-700 font-medium">USDT:</span>
                      <span className="text-yellow-600 text-lg font-bold">{(balance.usdt_balance || 0).toFixed(6)} USDT</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default VendasPage;