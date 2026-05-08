import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingBag, Package, Clock, CheckCircle, XCircle, 
  Truck, MapPin, Phone, MessageSquare, Eye
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const { API } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-purple-500', icon: Package },
      ready: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle },
      delivering: { label: 'Em entrega', color: 'bg-indigo-500', icon: Truck },
      completed: { label: 'Concluído', color: 'bg-green-600', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    const Icon = statusInfo.icon;

    return (
      <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
        <Icon size={14} />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <ShoppingBag size={64} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-bold mb-2">Nenhum pedido ainda</h3>
        <p className="text-gray-600 mb-6 text-center">
          Você ainda não fez nenhum pedido. Explore nossos parceiros!
        </p>
        <Button onClick={() => navigate('/lojas')} className="btn-primary">
          <ShoppingBag className="mr-2" size={18} />
          Ver Lojas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Meus Pedidos</h2>
        <Badge variant="outline" className="text-sm">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </Badge>
      </div>

      {orders.map((order) => (
        <Card key={order.order_id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{order.merchant_name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Pedido #{order.order_id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="font-semibold text-purple-600">{item.quantity}x</span>
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    {item.selected_variation && (
                      <p className="text-xs text-gray-500">• {item.selected_variation.name}</p>
                    )}
                    {item.selected_complements && item.selected_complements.length > 0 && (
                      <p className="text-xs text-gray-500">
                        • {item.selected_complements.map(c => c.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Order Type & Address */}
            <div className="border-t pt-3 mb-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                {order.order_type === 'delivery' ? (
                  <>
                    <Truck size={16} />
                    <span>Entrega</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Retirada</span>
                  </>
                )}
              </div>
              
              {order.order_type === 'delivery' && order.delivery_address && (
                <div className="flex items-start gap-2 mt-2 text-gray-600">
                  <MapPin size={16} className="mt-0.5" />
                  <div className="text-xs">
                    <p>{order.delivery_address.street}, {order.delivery_address.number}</p>
                    {order.delivery_address.complement && (
                      <p>{order.delivery_address.complement}</p>
                    )}
                    <p>{order.delivery_address.neighborhood} - {order.delivery_address.city}/{order.delivery_address.state}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Taxa de entrega:</span>
                  <span>R$ {order.delivery_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-1">
                <span>Total:</span>
                <span className="text-green-600">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-start gap-2">
                  <MessageSquare size={14} className="mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700">Observações:</p>
                    <p className="text-gray-600">{order.customer_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(order)}
                className="flex-1"
              >
                <Eye size={16} className="mr-1" />
                Ver Detalhes
              </Button>
              
              {order.status === 'completed' && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/catalog/${order.merchant_id}`)}
                  className="btn-primary"
                >
                  Pedir Novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes do Pedido</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <p className="text-sm text-gray-600">Pedido: #{selectedOrder.order_id}</p>
                  <p className="text-sm text-gray-600">Loja: {selectedOrder.merchant_name}</p>
                  <p className="text-sm text-gray-600">Data: {formatDate(selectedOrder.created_at)}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                    Status: {getStatusBadge(selectedOrder.status)}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{item.quantity}x {item.product_name}</p>
                        {item.selected_variation && (
                          <p className="text-xs text-gray-500">• {item.selected_variation.name}</p>
                        )}
                        {item.selected_complements && item.selected_complements.length > 0 && (
                          <p className="text-xs text-gray-500">
                            • {item.selected_complements.map(c => c.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
                  <div>
                    <h4 className="font-semibold mb-2">Endereço de Entrega</h4>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.delivery_address.street}, {selectedOrder.delivery_address.number}</p>
                      {selectedOrder.delivery_address.complement && <p>{selectedOrder.delivery_address.complement}</p>}
                      <p>{selectedOrder.delivery_address.neighborhood}</p>
                      <p>{selectedOrder.delivery_address.city}/{selectedOrder.delivery_address.state}</p>
                      <p>CEP: {selectedOrder.delivery_address.cep}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Resumo do Pagamento</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span>Taxa de entrega:</span>
                        <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
