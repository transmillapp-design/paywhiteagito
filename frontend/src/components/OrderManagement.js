import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingBag, Clock, Check, Package, Truck, 
  Printer, User, Phone, MapPin, DollarSign, Eye
} from 'lucide-react';
import axios from 'axios';

const OrderManagement = ({ API, token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = filterStatus 
        ? `${API}/merchant/orders?status=${filterStatus}`
        : `${API}/merchant/orders`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `${API}/merchant/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Status atualizado!');
        fetchOrders();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const printOrder = (order) => {
    // Criar conteúdo de impressão otimizado para impressora térmica 80mm
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${order.order_id.substring(0, 8)}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 2px 0;
            font-size: 11px;
          }
          .section {
            margin: 5mm 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 3mm;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 13px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 2mm 0;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 20mm;
            text-align: center;
          }
          .item-price {
            width: 20mm;
            text-align: right;
          }
          .total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 3mm;
          }
          .footer {
            text-align: center;
            margin-top: 5mm;
            font-size: 11px;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #000;
            border-radius: 3px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PEDIDO</h1>
          <p>Nº ${order.order_id.substring(0, 8).toUpperCase()}</p>
          <p>${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          <p class="badge">${order.order_type === 'delivery' ? 'DELIVERY' : 'RETIRADA'}</p>
        </div>

        <div class="section">
          <div class="section-title">CLIENTE</div>
          <p><strong>${order.customer_name || 'Cliente'}</strong></p>
          ${order.customer_phone ? `<p>Tel: ${order.customer_phone}</p>` : ''}
          ${order.order_type === 'delivery' && order.delivery_address ? `
            <p style="font-size: 10px;">
              ${order.delivery_address.street || ''}, ${order.delivery_address.number || ''}<br>
              ${order.delivery_address.neighborhood || ''}<br>
              ${order.delivery_address.city || ''} - ${order.delivery_address.state || ''}
            </p>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">ITENS DO PEDIDO</div>
          ${order.items.map(item => `
            <div class="item">
              <div class="item-name">
                <strong>${item.product_name}</strong>
                ${item.selected_variation ? `<br><small>• ${item.selected_variation.name}</small>` : ''}
                ${item.selected_complements?.length > 0 ? `<br><small>• ${item.selected_complements.map(c => c.name).join(', ')}</small>` : ''}
                ${item.notes ? `<br><small>Obs: ${item.notes}</small>` : ''}
              </div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">R$ ${item.total_price.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="item">
            <div>Subtotal:</div>
            <div>R$ ${order.subtotal.toFixed(2)}</div>
          </div>
          ${order.delivery_fee > 0 ? `
            <div class="item">
              <div>Taxa de Entrega:</div>
              <div>R$ ${order.delivery_fee.toFixed(2)}</div>
            </div>
          ` : ''}
          <div class="item total">
            <div>TOTAL:</div>
            <div>R$ ${order.total.toFixed(2)}</div>
          </div>
        </div>

        ${order.customer_notes ? `
          <div class="section">
            <div class="section-title">OBSERVAÇÕES</div>
            <p>${order.customer_notes}</p>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">PAGAMENTO</div>
          <p><strong>STATUS:</strong> ${order.payment_status === 'paid' ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}</p>
          <p style="font-size: 10px;">
            ${order.payment_status === 'pending' ? 
              'Pagamento via POS no momento da entrega/retirada' : 
              'Pagamento já efetuado'}
          </p>
        </div>

        <div class="footer">
          <p>━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
          <p>Obrigado pela preferência!</p>
          <p>Transmill</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          }
        </script>
      </body>
      </html>
    `;

    // Abrir em nova janela e imprimir
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Novo Pedido', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'accepted': { label: 'Aceito', color: 'bg-blue-100 text-blue-800', icon: Check },
      'preparing': { label: 'Em Preparação', color: 'bg-purple-100 text-purple-800', icon: Package },
      'ready_pickup': { label: 'Pronto p/ Retirada', color: 'bg-green-100 text-green-800', icon: Check },
      'out_for_delivery': { label: 'Saiu p/ Entrega', color: 'bg-orange-100 text-orange-800', icon: Truck },
      'completed': { label: 'Finalizado', color: 'bg-gray-100 text-gray-800', icon: Check },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: Clock }
    };
    
    return statusConfig[status] || statusConfig['pending'];
  };

  const getNextStatus = (currentStatus, orderType) => {
    const flowPickup = {
      'pending': 'accepted',
      'accepted': 'preparing',
      'preparing': 'ready_pickup',
      'ready_pickup': 'completed'
    };
    
    const flowDelivery = {
      'pending': 'accepted',
      'accepted': 'preparing',
      'preparing': 'out_for_delivery',
      'out_for_delivery': 'completed'
    };
    
    const flow = orderType === 'delivery' ? flowDelivery : flowPickup;
    return flow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus, orderType) => {
    const labels = {
      'accepted': 'Aceitar Pedido',
      'preparing': 'Iniciar Preparação',
      'ready_pickup': 'Marcar Pronto',
      'out_for_delivery': 'Saiu para Entrega',
      'completed': 'Finalizar'
    };
    
    const nextStatus = getNextStatus(currentStatus, orderType);
    return labels[nextStatus] || 'Avançar';
  };

  const filteredOrders = filterStatus 
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const activeCount = orders.filter(o => ['accepted', 'preparing', 'ready_pickup', 'out_for_delivery'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-orange-900">
              <ShoppingBag className="mr-3 text-orange-600" size={28} />
              <span>Gestão de Pedidos</span>
            </span>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
                  {pendingCount} Novo(s)
                </Badge>
              )}
              <Badge className="bg-blue-500 text-white text-lg px-3 py-1">
                {activeCount} Em Andamento
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterStatus === '' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('')}
          size="sm"
        >
          Todos ({orders.length})
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('pending')}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Novos ({orders.filter(o => o.status === 'pending').length})
        </Button>
        <Button
          variant={filterStatus === 'preparing' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('preparing')}
          size="sm"
        >
          Em Preparação
        </Button>
        <Button
          variant={filterStatus === 'ready_pickup' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('ready_pickup')}
          size="sm"
        >
          Pronto p/ Retirada
        </Button>
        <Button
          variant={filterStatus === 'out_for_delivery' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('out_for_delivery')}
          size="sm"
        >
          Em Entrega
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('completed')}
          size="sm"
        >
          Finalizados
        </Button>
      </div>

      {/* Orders List */}
      {loading ? (
        <p className="text-center py-8">Carregando pedidos...</p>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingBag size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">Nenhum pedido encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={order.order_id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">
                        Pedido #{order.order_id.substring(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={statusInfo.color}>
                        <StatusIcon size={14} className="mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="outline" className={
                        order.order_type === 'delivery' 
                          ? 'border-orange-300 text-orange-700'
                          : 'border-green-300 text-green-700'
                      }>
                        {order.order_type === 'delivery' ? '🚚 Delivery' : '🏪 Retirada'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Cliente */}
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <User size={18} className="text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{order.customer_name || 'Cliente'}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone size={14} />
                          {order.customer_phone}
                        </p>
                      )}
                      {order.order_type === 'delivery' && order.delivery_address && (
                        <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                          <MapPin size={14} className="mt-0.5" />
                          <span>
                            {order.delivery_address.street}, {order.delivery_address.number} - 
                            {order.delivery_address.neighborhood}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x {item.product_name}</span>
                          {item.selected_variation && (
                            <p className="text-xs text-gray-600">• {item.selected_variation.name}</p>
                          )}
                          {item.selected_complements?.length > 0 && (
                            <p className="text-xs text-gray-600">
                              • {item.selected_complements.map(c => c.name).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-blue-600">Obs: {item.notes}</p>
                          )}
                        </div>
                        <span className="font-medium">
                          R$ {item.total_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Subtotal:</span>
                      <span>R$ {order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de Entrega:</span>
                        <span>R$ {order.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL:</span>
                      <span className="text-green-600">R$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <Badge className={
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }>
                        {order.payment_status === 'paid' ? '✓ Pago' : '⏳ Aguardando Pagamento'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    {/* Imprimir */}
                    <Button
                      onClick={() => printOrder(order)}
                      variant="outline"
                      className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Printer size={18} />
                      <span>Imprimir</span>
                    </Button>

                    {/* Próximo Status */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <Button
                        onClick={() => updateOrderStatus(order.order_id, getNextStatus(order.status, order.order_type))}
                        className="flex-1 btn-primary"
                      >
                        <Check size={18} />
                        <span>{getNextStatusLabel(order.status, order.order_type)}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
