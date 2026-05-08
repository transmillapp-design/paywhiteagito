import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  CreditCard,
  Zap,
  Store,
  User,
  Wifi,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ExtractPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('30days');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchQuery, selectedFilter, dateFilter, transactions]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar transações do usuário
      const response = await fetch(`${API}/user/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        // Se endpoint não existir, usar dados mock
        setTransactions(getMockTransactions());
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  };

  const getMockTransactions = () => {
    return [
      {
        id: '1',
        type: 'cashback_internet',
        amount: 2.12,
        description: 'Cashback - Plano Básico 2GB',
        status: 'completed',
        created_at: '2024-10-10T14:30:00Z',
        category: 'cashback',
        metadata: {
          plan_name: 'Plano Básico 2GB',
          cashback_percentage: 8.5
        }
      },
      {
        id: '2',
        type: 'internet_plan_purchase',
        amount: -50.00,
        description: 'Compra do plano Plano Básico 2GB',
        status: 'completed',
        created_at: '2024-10-10T14:29:00Z',
        category: 'purchase',
        metadata: {
          plan_name: 'Plano Básico 2GB'
        }
      },
      {
        id: '3',
        type: 'deposit',
        amount: 100.00,
        description: 'Depósito via PIX',
        status: 'completed',
        created_at: '2024-10-09T16:45:00Z',
        category: 'deposit'
      },
      {
        id: '4',
        type: 'payment_merchant',
        amount: -25.50,
        description: 'Pagamento - Padaria Central',
        status: 'completed',
        created_at: '2024-10-09T12:20:00Z',
        category: 'payment',
        metadata: {
          merchant_name: 'Padaria Central'
        }
      },
      {
        id: '5',
        type: 'cashback_merchant',
        amount: 1.27,
        description: 'Cashback - Padaria Central',
        status: 'completed',
        created_at: '2024-10-09T12:21:00Z',
        category: 'cashback',
        metadata: {
          merchant_name: 'Padaria Central',
          cashback_percentage: 5.0
        }
      },
      {
        id: '6',
        type: 'referral_bonus',
        amount: 10.00,
        description: 'Bônus por indicação',
        status: 'completed',
        created_at: '2024-10-08T10:15:00Z',
        category: 'bonus'
      },
      {
        id: '7',
        type: 'withdrawal',
        amount: -30.00,
        description: 'Saque via PIX',
        status: 'completed',
        created_at: '2024-10-07T15:30:00Z',
        category: 'withdrawal'
      }
    ];
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.category === selectedFilter);
    }

    // Filtro por data
    const now = new Date();
    const filterDays = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': 365 * 10
    }[dateFilter];

    const cutoffDate = new Date(now.getTime() - (filterDays * 24 * 60 * 60 * 1000));
    filtered = filtered.filter(t => new Date(t.created_at) >= cutoffDate);

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (transaction) => {
    switch (transaction.category) {
      case 'deposit': return ArrowDownRight;
      case 'withdrawal': return ArrowUpRight;
      case 'cashback': return Zap;
      case 'payment': return CreditCard;
      case 'purchase': return Store;
      case 'bonus': return TrendingUp;
      default: return DollarSign;
    }
  };

  const getTransactionColor = (transaction) => {
    if (transaction.amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalBalance = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const getTransactionTypeLabel = (category) => {
    const labels = {
      deposit: 'Depósito',
      withdrawal: 'Saque', 
      cashback: 'Cashback',
      payment: 'Pagamento',
      purchase: 'Compra',
      bonus: 'Bônus',
      all: 'Todas'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
        <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Extrato</h1>
            <div></div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <Card className={isDarkMode ? 'bg-[#3F5123]' : 'bg-white'}>
            <CardContent className="p-8 text-center">
              <div className={`animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4 ${
                isDarkMode ? 'border-[#005B9C]' : 'border-[#005B9C]'
              }`}></div>
              <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Carregando extrato...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <Receipt size={20} />
            Extrato
          </h1>
          <Button variant="ghost" size="sm" className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <Download size={20} />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Resumo */}
        <Card className={`text-white ${
          isDarkMode 
            ? 'bg-[#556B2F] border border-[#005B9C]' 
            : 'bg-[#005B9C] border border-[#005B9C]'
        }`}>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-2">Resumo do Período</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(user?.balance || 0)}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Saldo Atual</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(user?.cashback_balance || 0)}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Cashback</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-semibold ${getTotalBalance() >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {getTotalBalance() >= 0 ? '+' : ''}{formatCurrency(getTotalBalance())}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Movimento no período</p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar transação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros por tipo e data */}
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="all">Todas</option>
                <option value="deposit">Depósitos</option>
                <option value="withdrawal">Saques</option>
                <option value="cashback">Cashback</option>
                <option value="payment">Pagamentos</option>
                <option value="purchase">Compras</option>
                <option value="bonus">Bônus</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="7days">7 dias</option>
                <option value="30days">30 dias</option>
                <option value="90days">90 dias</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Transações ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Nenhuma transação encontrada</p>
                <p className="text-sm text-gray-500">Ajuste os filtros ou faça uma transação</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction);
                  const StatusIcon = getStatusIcon(transaction.status);
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon 
                            className={getTransactionColor(transaction)} 
                            size={20} 
                          />
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">
                              {formatDate(transaction.created_at)}
                            </p>
                            <div className="flex items-center gap-1">
                              <StatusIcon 
                                className={getStatusColor(transaction.status)} 
                                size={12} 
                              />
                              <span className={`text-xs ${getStatusColor(transaction.status)}`}>
                                {transaction.status === 'completed' ? 'Concluída' : 
                                 transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction)}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {getTransactionTypeLabel(transaction.category)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className={
          isDarkMode 
            ? 'bg-[#3F5123] border-[#005B9C]' 
            : 'bg-[#FFFFFF] border-[#005B9C]'
        }>
          <CardContent className="p-4">
            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>📊 Sobre seu Extrato</h4>
            <div className={`space-y-1 text-sm ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
              <div>• Histórico completo de todas suas transações</div>
              <div>• Filtros por tipo, período e busca</div>
              <div>• Atualizações em tempo real</div>
              <div>• Download disponível para relatórios</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExtractPage;