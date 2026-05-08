import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingBag, MapPin, User, Phone, MessageSquare,
  CreditCard, ArrowLeft, Check, Truck
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const Checkout = () => {
  const { API } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { merchantId, merchantName, orderType, items, subtotal, deliveryFee, total } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [customerNotes, setCustomerNotes] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!merchantId || !items || items.length === 0) {
      toast.error('Carrinho vazio');
      navigate('/lojas');
      return;
    }

    // Carregar endereço do usuário se for delivery
    if (orderType === 'delivery') {
      loadUserAddress();
    }
  }, []);

  const loadUserAddress = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.user) {
        const user = response.data.user;
        setDeliveryAddress({
          cep: user.cep || '',
          street: user.street || '',
          number: user.number || '',
          complement: user.complement || '',
          neighborhood: user.neighborhood || '',
          city: user.city || '',
          state: user.state || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar endereço:', error);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      
      // Validar dados obrigatórios
      if (!merchantId || !items || items.length === 0) {
        toast.error('Carrinho vazio');
        return;
      }

      // Validar endereço se for delivery
      if (orderType === 'delivery') {
        if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.cep) {
          toast.error('Preencha o endereço de entrega completo');
          return;
        }
      }
      
      const orderData = {
        merchant_id: merchantId,
        order_type: orderType,
        items: items,
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        customer_notes: customerNotes || null
      };

      console.log('🛒 Criando pedido:', orderData);

      const response = await axios.post(`${API}/orders/create`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Pedido criado:', response.data);

      if (response.data.success) {
        toast.success('Pedido criado com sucesso! 🎉');
        
        // Redirecionar para Meus Pedidos para acompanhar o status
        setTimeout(() => {
          navigate('/meus-pedidos');
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      console.error('Detalhes:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCepBlur = async () => {
    const cep = deliveryAddress.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setDeliveryAddress({
          ...deliveryAddress,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  if (!merchantId || !items) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p>Carrinho vazio</p>
            <Button onClick={() => navigate('/lojas')} className="mt-4">
              Voltar para Lojas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Finalizar Pedido</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="mr-2 text-purple-600" size={20} />
                  {merchantName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={
                  orderType === 'delivery' 
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }>
                  {orderType === 'delivery' ? (
                    <>
                      <Truck size={14} className="mr-1" />
                      Entrega
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} className="mr-1" />
                      Retirada no Local
                    </>
                  )}
                </Badge>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 text-blue-600" size={20} />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CEP *</Label>
                      <Input
                        value={deliveryAddress.cep}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, cep: e.target.value })}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Rua *</Label>
                    <Input
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Número *</Label>
                      <Input
                        value={deliveryAddress.number}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, number: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={deliveryAddress.complement}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, complement: e.target.value })}
                        placeholder="Apto, bloco..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bairro *</Label>
                    <Input
                      value={deliveryAddress.neighborhood}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cidade *</Label>
                      <Input
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label>Estado *</Label>
                      <Input
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 text-green-600" size={20} />
                  Observações (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, ponto da carne bem passado, troco para R$ 100..."
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customerNotes.length}/500 caracteres
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.quantity}x {item.product_name}
                        </span>
                        {item.selected_variation && (
                          <p className="text-xs text-gray-600">
                            • {item.selected_variation.name}
                          </p>
                        )}
                        {item.selected_complements?.length > 0 && (
                          <p className="text-xs text-gray-600">
                            • {item.selected_complements.map(c => c.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span>R$ {item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Entrega:</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CreditCard size={18} className="text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-semibold mb-1">Pagamento na Entrega/Retirada</p>
                      <p>
                        {orderType === 'delivery' 
                          ? 'O entregador cobrará via POS no momento da entrega. O valor será debitado do seu saldo Transmill.'
                          : 'Pague no balcão via POS. O valor será debitado do seu saldo Transmill.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="w-full btn-primary"
                  size="lg"
                >
                  {loading ? (
                    'Processando...'
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Confirmar Pedido</span>
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Ao confirmar, você concorda com os termos de uso e política de privacidade
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
