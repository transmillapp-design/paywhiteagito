import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  ArrowLeft, Download, Filter, Search, RefreshCw, 
  TrendingUp, TrendingDown, Users, DollarSign, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';

const MasterExtractPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalsByType, setTotalsByType] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    transaction_type: '',
    limit: 100,
    skip: 0
  });

  useEffect(() => {
    if (user?.user_type !== 'master' && !user?.is_master_account) {
      toast.error('Acesso restrito a administradores');
      navigate('/');
      return;
    }
    loadTransactions();
  }, [filters.limit, filters.skip, filters.transaction_type]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let url = `${API}/master/all-transactions?limit=${filters.limit}&skip=${filters.skip}`;
      if (filters.transaction_type) {
        url += `&transaction_type=${filters.transaction_type}`;
      }
      
      const response = await axios.get(url, { headers });
      
      if (response.data.success) {
        setTransactions(response.data.transactions);
        setTotal(response.data.total);
        setTotalAmount(response.data.total_amount);
        setTotalsByType(response.data.totals_by_type);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar extrato');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'deposit': 'Depósito',
      'withdrawal': 'Saque',
      'withdrawal_fee': 'Taxa de Saque',
      'conversion_fee': 'Taxa de Conversão',
      'cashback': 'Cashback',
      'referral_bonus': 'Bônus de Indicação',
      'hierarchical_commission': 'Comissão Hierárquica',
      'purchase': 'Compra',
      'payment': 'Pagamento',
      'transfer': 'Transferência',
      'refund': 'Reembolso'
    };
    return labels[type] || type;
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      'cliente': 'Cliente',
      'lojista': 'Lojista',
      'service_provider': 'Prestador',
      'master': 'Master'
    };
    return labels[type] || type;
  };

  const getUserTypeBadgeColor = (type) => {
    const colors = {
      'cliente': 'bg-blue-100 text-blue-800',
      'lojista': 'bg-purple-100 text-purple-800',
      'service_provider': 'bg-green-100 text-green-800',
      'master': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredTransactions = transactions.filter(trans => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      trans.user_name?.toLowerCase().includes(searchLower) ||
      trans.user_email?.toLowerCase().includes(searchLower) ||
      trans.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/master')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Extrato Completo da Plataforma
              </h1>
              <p className="text-sm text-gray-600">
                Todas as movimentações de todos os usuários
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Transações</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Volume Total</p>
                  <p className="text-2xl font-bold">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tipos de Transação</p>
                  <p className="text-2xl font-bold">{totalsByType.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exibindo</p>
                  <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar por nome, email ou descrição..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>

              <select
                value={filters.transaction_type}
                onChange={(e) => setFilters({...filters, transaction_type: e.target.value, skip: 0})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                <option value="deposit">Depósito</option>
                <option value="withdrawal">Saque</option>
                <option value="withdrawal_fee">Taxa de Saque</option>
                <option value="conversion_fee">Taxa de Conversão</option>
                <option value="cashback">Cashback</option>
                <option value="referral_bonus">Bônus de Indicação</option>
                <option value="purchase">Compra</option>
                <option value="payment">Pagamento</option>
              </select>

              <select
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value), skip: 0})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="50">50 por página</option>
                <option value="100">100 por página</option>
                <option value="200">200 por página</option>
                <option value="500">500 por página</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Transações ({filteredTransactions.length} de {total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                <p className="text-gray-600">Carregando transações...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((trans, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {trans.user_name || 'Usuário'}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getUserTypeBadgeColor(trans.user_type)}`}>
                          {getUserTypeLabel(trans.user_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{trans.user_email || ''}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {trans.description || getTransactionTypeLabel(trans.transaction_type)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(trans.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold text-lg ${trans.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.amount >= 0 ? '+' : ''}R$ {Math.abs(trans.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTransactionTypeLabel(trans.transaction_type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {total > filters.limit && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({...filters, skip: Math.max(0, filters.skip - filters.limit)})}
                  disabled={filters.skip === 0}
                >
                  Anterior
                </Button>
                
                <span className="text-sm text-gray-600">
                  Mostrando {filters.skip + 1} - {Math.min(filters.skip + filters.limit, total)} de {total}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({...filters, skip: filters.skip + filters.limit})}
                  disabled={filters.skip + filters.limit >= total}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterExtractPage;
