import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle, Package, Clock, Home, ShoppingBag, Truck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { order, merchantName } = location.state || {};

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p>Pedido não encontrado</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Ir para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (order.order_type === 'delivery') {
      return {
        icon: Truck,
        title: 'Pedido de Entrega Confirmado!',
        description: 'Seu pedido foi enviado para a loja. Aguarde a confirmação do estabelecimento.',
        steps: [
          'Aguardando aceitação da loja',
          'Preparação do pedido',
          'Saiu para entrega',
          'Entregador realiza o pagamento via POS',
          'Pedido finalizado'
        ]
      };
    } else {
      return {
        icon: ShoppingBag,
        title: 'Pedido para Retirada Confirmado!',
        description: 'Seu pedido foi enviado para a loja. Aguarde a confirmação para retirar no balcão.',
        steps: [
          'Aguardando aceitação da loja',
          'Preparação do pedido',
          'Pronto para retirada',
          'Pagamento via POS no balcão',
          'Pedido finalizado'
        ]
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center border-b">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            {statusInfo.title}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {statusInfo.description}
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-[#FFFFFF] border border-[#005B9C] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Número do Pedido:</span>
              <span className="font-bold text-lg">
                #{order.order_id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Loja:</span>
              <span className="font-semibold">{merchantName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tipo:</span>
              <Badge className={
                order.order_type === 'delivery'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }>
                <StatusIcon size={14} className="mr-1" />
                {order.order_type === 'delivery' ? 'Entrega' : 'Retirada'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-bold text-xl text-green-600">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <Clock size={18} className="mr-2" />
              Pagamento Pendente
            </h3>
            <p className="text-sm text-yellow-800">
              {order.order_type === 'delivery'
                ? 'O pagamento será realizado pelo entregador via POS no momento da entrega. O valor será debitado automaticamente do seu saldo Transmill.'
                : 'O pagamento será realizado no balcão via POS no momento da retirada. O valor será debitado automaticamente do seu saldo Transmill.'
              }
            </p>
          </div>

          {/* Steps */}
          <div>
            <h3 className="font-semibold mb-3">Próximos Passos:</h3>
            <div className="space-y-2">
              {statusInfo.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-[#F5F5F5] text-[#005B9C]' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {index + 1}
                  </div>
                  <span className={`text-sm ${index === 0 ? 'font-semibold' : 'text-gray-600'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => navigate('/orders/my-orders')}
              className="w-full btn-primary"
            >
              <Package size={18} />
              <span>Ver Meus Pedidos</span>
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <Home size={18} />
              <span>Voltar para Início</span>
            </Button>
          </div>

          {/* Help */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>
              Dúvidas? Entre em contato com a loja ou acesse o suporte Transmill
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmation;
