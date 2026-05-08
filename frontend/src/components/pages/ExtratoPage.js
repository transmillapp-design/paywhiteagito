import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Receipt,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Download
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../hooks/useTheme';

const ExtratoPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // últimos 30 dias
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTransactions();
    fetchUserBalance();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let response;
      if (user?.user_type === 'cliente') {
        response = await axios.get(`${API}/client/transactions`, { headers });
      } else if (user?.user_type === 'lojista') {
        response = await axios.get(`${API}/merchant/transactions`, { headers });
      } else if (user?.user_type === 'service_provider') {
        response = await axios.get(`${API}/service-provider/transactions`, { headers });
      }

      if (response?.data?.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, { headers });
      
      if (response?.data) {
        const userData = response.data;
        setBalance({
          brl: (userData.balance || 0) + (userData.cashback_balance || 0),
          usdt: userData.usdt_balance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Mock data for demonstration
  const mockTransactions = [
    {
      id: '1',
      type: 'deposit',
      amount: 250.00,
      currency: 'BRL',
      description: 'Depósito via PIX',
      status: 'completed',
      created_at: '2024-10-09T14:30:00Z',
      fee: 0
    },
    {
      id: '2',
      type: 'purchase',
      amount: -45.50,
      currency: 'BRL',
      description: 'Compra - Restaurante Sabor & Arte',
      status: 'completed',
      created_at: '2024-10-09T12:15:00Z',
      cashback: 3.64
    },
    {
      id: '3',
      type: 'conversion',
      amount: -100.00,
      currency: 'BRL',
      description: 'Conversão BRL → USDT',
      status: 'completed',
      created_at: '2024-10-08T16:45:00Z',
      converted_amount: 18.18,
      converted_currency: 'USDT'
    },
    {
      id: '4',
      type: 'cashback',
      amount: 12.50,
      currency: 'BRL',
      description: 'Cashback - Farmácia Vida Saudável',
      status: 'completed',
      created_at: '2024-10-07T09:20:00Z'
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: -75.00,
      currency: 'BRL',
      description: 'Saque via PIX',
      status: 'pending',
      created_at: '2024-10-06T18:10:00Z',
      fee: 2.50
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;

  const filteredTransactions = displayTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    // Filter by date range
    const transactionDate = new Date(transaction.created_at);
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const matchesDate = transactionDate >= cutoffDate;

    return matchesSearch && matchesType && matchesDate;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-green-600" size={20} />;
      case 'withdrawal':
        return <ArrowUpRight className="text-red-600" size={20} />;
      case 'purchase':
        return <Receipt className="text-blue-600" size={20} />;
      case 'cashback':
        return <TrendingUp className="text-emerald-600" size={20} />;
      case 'conversion':
        return <ArrowUpRight className="text-purple-600" size={20} />;
      default:
        return <Receipt className="text-gray-600" size={20} />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'cashback' || (type === 'deposit' && amount > 0)) {
      return 'text-green-600';
    } else if (type === 'withdrawal' || type === 'purchase' || amount < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatCurrency = (value, currency = 'BRL') => {
    if (currency === 'USDT') {
      return `${value.toFixed(6)} USDT`;
    }
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

  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Extrato</h1>
          <Button variant="ghost" size="sm" className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <Download size={20} />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Balance Summary */}
        <Card className={`border-2 ${
          isDarkMode 
            ? 'bg-[#6B6B4B] border-[#005B9C] text-white' 
            : 'bg-[#F5F5F5] border-[#005B9C] text-[#333333]'
        }`}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Receipt className="mr-2" size={20} />
              Saldo Atual
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-3 border ${
                isDarkMode 
                  ? 'bg-[#3F5123] border-[#005B9C]' 
                  : 'bg-[#FFFFFF] border-[#005B9C]'
              }`}>
                <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>Saldo BRL</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>{formatCurrency(balance.brl)}</p>
              </div>
              <div className={`rounded-lg p-3 border ${
                isDarkMode 
                  ? 'bg-[#3F5123] border-[#005B9C]' 
                  : 'bg-[#FFFFFF] border-[#005B9C]'
              }`}>
                <p className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>Saldo USDT</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>{balance.usdt.toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-green-600 text-sm font-medium">Entradas</p>
              <p className="text-green-800 text-xl font-bold">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-red-600 text-sm font-medium">Saídas</p>
              <p className="text-red-800 text-xl font-bold">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'deposit', label: 'Depósitos' },
                { value: 'withdrawal', label: 'Saques' },
                { value: 'purchase', label: 'Compras' },
                { value: 'cashback', label: 'Cashback' },
                { value: 'conversion', label: 'Conversões' }
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={filterType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type.value)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Período:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 3 meses</option>
                <option value="365">Último ano</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Transações</h3>
            <span className="text-sm text-gray-600">{filteredTransactions.length} resultados</span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Carregando transações...</p>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma transação encontrada</h3>
                <p className="text-gray-600">Ajuste os filtros ou realize uma transação</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{transaction.description}</h4>
                        <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                        {transaction.cashback && (
                          <p className="text-xs text-green-600">Cashback: +{formatCurrency(transaction.cashback)}</p>
                        )}
                        {transaction.fee > 0 && (
                          <p className="text-xs text-gray-500">Taxa: {formatCurrency(transaction.fee)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className={`font-bold text-sm ${getTransactionColor(transaction.type, transaction.amount)}`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          {transaction.converted_amount && (
                            <p className="text-xs text-gray-500">
                              +{formatCurrency(transaction.converted_amount, transaction.converted_currency)}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-purple-800 mb-3">Ações Rápidas</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                onClick={() => navigate('/deposito')}
              >
                💰 Depositar
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                onClick={() => navigate('/client-dashboard?tab=withdrawal')}
              >
                📤 Sacar
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                onClick={() => navigate('/usdt')}
              >
                ₿ Converter
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                onClick={() => navigate('/prestadores')}
              >
                🔧 Prestadores
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExtratoPage;