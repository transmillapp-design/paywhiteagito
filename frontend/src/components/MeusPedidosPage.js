import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingBag, Package, Clock, CheckCircle, XCircle, 
  Truck, MapPin, MessageSquare, Eye, ChevronLeft, 
  Bell, Menu, User, LogOut, Store, Sun, Moon
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

const MeusPedidosPage = () => {
  const { API, user } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
      confirmed: { label: 'Confirmado', color: 'bg-[#556B2F]', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-[#6B8239]', icon: Package },
      ready: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle },
      delivering: { label: 'Em entrega', color: 'bg-[#005B9C]', icon: Truck },
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
      <div className="min-h-screen bg-[#EEEEEE] pb-20">
        {/* Header igual à homepage */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-0"
            >
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Meus Pedidos</h1>
            <div className="w-6"></div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Package size={48} className="mx-auto mb-3 text-gray-400 animate-pulse" />
              <p className="text-gray-600">Carregando pedidos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header igual à homepage */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className={`p-0 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Meus Pedidos</h1>
          
          {/* Profile Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Menu size={24} className="text-gray-700" />
            </Button>
            
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                  >
                    <User size={16} />
                    Perfil
                  </button>
                  {user?.user_type === 'cliente' && (
                    <button
                      onClick={() => {
                        navigate('/meus-pedidos');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 bg-gray-50"
                    >
                      <ShoppingBag size={16} />
                      Meus Pedidos
                    </button>
                  )}
                  {user?.user_type === 'lojista' && (
                    <button
                      onClick={() => {
                        navigate('/meu-negocio');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Store size={16} />
                      Meu Negócio
                    </button>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-4">
        {orders.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <ShoppingBag size={64} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold mb-2">Nenhum pedido ainda</h3>
              <p className="text-gray-600 mb-6 text-center">
                Você ainda não fez nenhum pedido. Explore nossas lojas parceiras!
              </p>
              <Button onClick={() => navigate('/lojas')} className={
                isDarkMode 
                  ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                  : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
              }>
                <ShoppingBag className="mr-2" size={18} />
                Ver Lojas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.order_id} className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{order.merchant_name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        #{order.order_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Items */}
                  <div className="space-y-2 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-purple-600 text-xs">{item.quantity}x</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          {item.selected_variation && (
                            <p className="text-xs text-gray-500">• {item.selected_variation.name}</p>
                          )}
                          {item.selected_complements && item.selected_complements.length > 0 && (
                            <p className="text-xs text-gray-500">
                              • {item.selected_complements.map(c => c.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-medium text-sm">R$ {item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Type */}
                  <div className="border-t pt-2 mb-2">
                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      {order.order_type === 'delivery' ? (
                        <>
                          <Truck size={14} />
                          <span>Entrega</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>Retirada</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-bold text-sm">Total:</span>
                    <span className="font-bold text-lg text-green-600">R$ {order.total.toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 text-xs"
                    >
                      <Eye size={14} className="mr-1" />
                      Detalhes
                    </Button>
                    
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/catalog/${order.merchant_id}`)}
                        className={`text-xs ${
                          isDarkMode 
                            ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                            : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
                        }`}
                      >
                        Pedir Novamente
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <Card 
            className="max-w-md w-full max-h-[85vh] overflow-y-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Detalhes do Pedido</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="h-8 w-8 p-0">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Informações</h4>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p>Pedido: #{selectedOrder.order_id}</p>
                    <p>Loja: {selectedOrder.merchant_name}</p>
                    <p>Data: {formatDate(selectedOrder.created_at)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      Status: {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Itens do Pedido</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b text-sm">
                      <div className="flex-1">
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
                    <h4 className="font-semibold text-sm mb-2">Endereço de Entrega</h4>
                    <div className="text-xs text-gray-600">
                      <p>{selectedOrder.delivery_address.street}, {selectedOrder.delivery_address.number}</p>
                      {selectedOrder.delivery_address.complement && <p>{selectedOrder.delivery_address.complement}</p>}
                      <p>{selectedOrder.delivery_address.neighborhood}</p>
                      <p>{selectedOrder.delivery_address.city}/{selectedOrder.delivery_address.state}</p>
                      <p>CEP: {selectedOrder.delivery_address.cep}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-2">Resumo do Pagamento</h4>
                  <div className="space-y-1 text-xs">
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
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
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

export default MeusPedidosPage;
