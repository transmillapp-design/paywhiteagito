import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ShoppingBag, Package, Clock, CheckCircle, XCircle, 
  Truck, MapPin, Phone, MessageSquare, RefreshCw,
  ChevronDown, ChevronUp, User, ArrowLeft, Home
} from 'lucide-react';
import axios from 'axios';

const MinimalistMerchantOrders = () => {
  const { API, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = selectedStatus === 'all' 
        ? `${API}/orders/merchant/list`
        : `${API}/orders/merchant/list?status=${selectedStatus}`;
      
      console.log('🏪 Buscando pedidos do lojista:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Pedidos recebidos:', response.data);

      if (response.data.success) {
        setOrders(response.data.orders);
        console.log(`✅ Total de pedidos: ${response.data.orders.length}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      console.error('Detalhes:', error.response?.data);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      const response = await axios.put(
        `${API}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Pedido ${newStatus === 'confirmed' ? 'confirmado' : 'atualizado'}!`);
        fetchOrders();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar pedido');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-[#005B9C]', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-[#666666]', icon: Package },
      ready: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle },
      delivering: { label: 'Em entrega', color: 'bg-[#9A7B4F]', icon: Truck },
      completed: { label: 'Concluído', color: 'bg-green-600', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextActions = (currentStatus) => {
    const actions = {
      pending: [
        { status: 'confirmed', label: '✓ Confirmar', color: 'from-[#005B9C] to-[#005B9C]' },
        { status: 'cancelled', label: '✕ Cancelar', color: 'from-red-500 to-red-600' }
      ],
      confirmed: [
        { status: 'preparing', label: '👨‍🍳 Preparando', color: 'from-[#666666] to-[#005B9C]' },
        { status: 'cancelled', label: '✕ Cancelar', color: 'from-red-500 to-red-600' }
      ],
      preparing: [
        { status: 'ready', label: '✓ Pronto', color: 'from-green-500 to-green-600' }
      ],
      ready: [
        { status: 'delivering', label: '🚚 Em Entrega', color: 'from-indigo-500 to-indigo-600' },
        { status: 'completed', label: '✓ Entregue', color: 'from-green-600 to-green-700' }
      ],
      delivering: [
        { status: 'completed', label: '✓ Entregue', color: 'from-green-600 to-green-700' }
      ]
    };
    return actions[currentStatus] || [];
  };

  const filterOptions = [
    { value: 'all', label: '🍽️ Todos' },
    { value: 'pending', label: '⏳ Pendentes' },
    { value: 'confirmed', label: '✅ Confirmados' },
    { value: 'preparing', label: '👨‍🍳 Preparando' },
    { value: 'ready', label: '✔️ Prontos' },
    { value: 'completed', label: '🎉 Concluídos' }
  ];

  const getFilteredCount = (value) => {
    if (value === 'all') return orders.length;
    return orders.filter(o => o.status === value).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <Package size={40} className="text-purple-600" />
          </div>
          <p className="text-gray-600 font-medium">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex-1 text-center mx-3">
              <h1 className="text-lg font-bold flex items-center justify-center gap-2">
                <ShoppingBag size={20} />
                Pedidos
              </h1>
            </div>

            <button
              onClick={fetchOrders}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw size={24} />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filterOptions.map(option => {
              const count = getFilteredCount(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedStatus === option.value
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {option.label}
                  {count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      selectedStatus === option.value ? 'bg-purple-100' : 'bg-white/30'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="max-w-md mx-auto px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <ShoppingBag size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Nenhum pedido ainda</h3>
            <p className="text-gray-600 text-sm">
              {selectedStatus === 'all' 
                ? 'Você ainda não recebeu pedidos.'
                : `Nenhum pedido com esse status.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Header do Pedido */}
                  <div
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">#{order.id?.slice(0, 8) || order.order_id?.slice(0, 8)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color} flex items-center gap-1`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">R$ {order.total?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} itens</p>
                      </div>
                    </div>

                    {/* Info do Cliente */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.order_type === 'delivery' 
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {order.order_type === 'delivery' ? '🚚 Delivery' : '🏪 Retirada'}
                        </span>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      {/* Items do Pedido */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Package size={16} />
                          Items do Pedido
                        </h4>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-3">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {item.quantity}x {item.product_name}
                                  </p>
                                  {item.selected_variation && (
                                    <p className="text-xs text-purple-600">• {item.selected_variation.name}</p>
                                  )}
                                  {item.selected_complements?.length > 0 && (
                                    <p className="text-xs text-blue-600">
                                      • {item.selected_complements.map(c => c.name).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold text-gray-900">R$ {item.total_price?.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Endereço de Entrega */}
                      {order.order_type === 'delivery' && order.delivery_address && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin size={16} />
                            Endereço de Entrega
                          </h4>
                          <div className="bg-white rounded-xl p-3 text-sm text-gray-700">
                            <p>{order.delivery_address.street}, {order.delivery_address.number}</p>
                            {order.delivery_address.complement && <p>{order.delivery_address.complement}</p>}
                            <p>{order.delivery_address.neighborhood}</p>
                            <p>{order.delivery_address.city} - {order.delivery_address.state}</p>
                            <p>CEP: {order.delivery_address.cep}</p>
                          </div>
                        </div>
                      )}

                      {/* Contato do Cliente */}
                      {order.customer_phone && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Phone size={16} />
                            Contato
                          </h4>
                          <div className="bg-white rounded-xl p-3">
                            <a 
                              href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
                            >
                              <Phone size={16} />
                              {order.customer_phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {order.customer_notes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} />
                            Observações
                          </h4>
                          <div className="bg-white rounded-xl p-3">
                            <p className="text-sm text-gray-700">{order.customer_notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Resumo */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Resumo</h4>
                        <div className="bg-white rounded-xl p-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-medium">R$ {order.subtotal?.toFixed(2)}</span>
                          </div>
                          {order.delivery_fee > 0 && (
                            <div className="flex justify-between">
                              <span>Taxa de Entrega:</span>
                              <span className="font-medium">R$ {order.delivery_fee?.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-bold text-base">
                            <span>Total:</span>
                            <span className="text-purple-600">R$ {order.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Ações</h4>
                          <div className="flex flex-wrap gap-2">
                            {getNextActions(order.status).map((action) => (
                              <button
                                key={action.status}
                                onClick={() => updateOrderStatus(order.id || order.order_id, action.status)}
                                disabled={updatingStatus === (order.id || order.order_id)}
                                className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r ${action.color}`}
                              >
                                {updatingStatus === (order.id || order.order_id) ? 'Atualizando...' : action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalistMerchantOrders;
