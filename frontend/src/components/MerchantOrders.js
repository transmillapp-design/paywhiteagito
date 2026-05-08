import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ShoppingBag, Package, Clock, CheckCircle, XCircle, 
  Truck, MapPin, Phone, MessageSquare, RefreshCw,
  ChevronDown, ChevronUp, User
} from 'lucide-react';
import axios from 'axios';

const MerchantOrders = () => {
  const { API } = useAuth();
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
        fetchOrders(); // Recarregar lista
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
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-purple-500', icon: Package },
      ready: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle },
      delivering: { label: 'Em entrega', color: 'bg-indigo-500', icon: Truck },
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
        { status: 'confirmed', label: '✓ Confirmar', color: 'from-blue-500 to-blue-600' },
        { status: 'cancelled', label: '✕ Cancelar', color: 'from-red-500 to-red-600' }
      ],
      confirmed: [
        { status: 'preparing', label: '👨‍🍳 Preparando', color: 'from-purple-500 to-purple-600' },
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
    { value: 'all', label: 'Todos', count: orders.length },
    { value: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmados', count: orders.filter(o => o.status === 'confirmed').length },
    { value: 'preparing', label: 'Preparando', count: orders.filter(o => o.status === 'preparing').length },
    { value: 'ready', label: 'Prontos', count: orders.filter(o => o.status === 'ready').length },
    { value: 'completed', label: 'Concluídos', count: orders.filter(o => o.status === 'completed').length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-3 text-purple-400 animate-pulse" />
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="text-purple-600" />
              Meus Pedidos
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} no total
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedStatus === option.value
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {option.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  selectedStatus === option.value ? 'bg-white/30' : 'bg-gray-200'
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <ShoppingBag size={40} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum pedido ainda</h3>
          <p className="text-gray-600">
            {selectedStatus === 'all' 
              ? 'Você ainda não recebeu pedidos.'
              : `Nenhum pedido com status "${filterOptions.find(f => f.value === selectedStatus)?.label}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedOrder === order.order_id;

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Header do Pedido */}
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-500">#{order.order_id.slice(0, 8)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
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
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3">
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
                              <p className="font-bold text-gray-900">R$ {item.total_price.toFixed(2)}</p>
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
                        <div className="bg-white rounded-lg p-3 text-sm text-gray-700">
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
                        <div className="bg-white rounded-lg p-3">
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
                          Observações do Cliente
                        </h4>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm text-gray-700">{order.customer_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Resumo de Pagamento */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Resumo</h4>
                      <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">R$ {order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between">
                            <span>Taxa de Entrega:</span>
                            <span className="font-medium">R$ {order.delivery_fee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-bold text-base">
                          <span>Total:</span>
                          <span className="text-purple-600">R$ {order.total.toFixed(2)}</span>
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
                              onClick={() => updateOrderStatus(order.order_id, action.status)}
                              disabled={updatingStatus === order.order_id}
                              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r ${action.color}`}
                            >
                              {updatingStatus === order.order_id ? 'Atualizando...' : action.label}
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
  );
};

export default MerchantOrders;
