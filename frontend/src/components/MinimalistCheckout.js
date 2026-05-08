import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, MapPin, MessageSquare, ShoppingBag, 
  Truck, Store, Package, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

const MinimalistCheckout = () => {
  const { API } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useTheme();
  const { 
    merchantId, 
    merchantName, 
    items, 
    subtotal, 
    deliveryFee: merchantDeliveryFee,
    acceptsPickup,
    acceptsDelivery
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState(acceptsPickup ? 'pickup' : 'delivery');
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
  const [deliveryFee, setDeliveryFee] = useState(merchantDeliveryFee || 0);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet ou usdt
  const [merchantPaymentMethods, setMerchantPaymentMethods] = useState({
    accept_wallet_payment: true,
    accept_usdt_payment: false
  });
  const [usdtRate, setUsdtRate] = useState(5.45); // Taxa USDT
  const [userBalances, setUserBalances] = useState({ brl: 0, usdt: 0 });
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!merchantId || !items || items.length === 0) {
      toast.error('Carrinho vazio');
      navigate('/lojas');
      return;
    }

    fetchMerchantPaymentMethods();
    fetchUsdtRate();
    fetchUserBalances();

    // Carregar endereço do usuário se for delivery
    if (orderType === 'delivery') {
      loadUserAddress();
    }
  }, []);

  useEffect(() => {
    // Atualizar taxa ao mudar tipo de pedido
    if (orderType === 'pickup') {
      setDeliveryFee(0);
    } else {
      setDeliveryFee(merchantDeliveryFee || 5); // Taxa do merchant ou padrão
    }
  }, [orderType, merchantDeliveryFee]);

  const fetchMerchantPaymentMethods = async () => {
    try {
      // Buscar diretamente do perfil do lojista
      const response = await axios.get(`${API}/user/${merchantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setMerchantPaymentMethods({
          accept_wallet_payment: response.data.accept_wallet_payment !== false,
          accept_usdt_payment: response.data.accept_usdt_payment === true
        });
      }
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento do lojista:', error);
    }
  };

  const fetchUsdtRate = async () => {
    try {
      const response = await axios.get(`${API}/usdt/rate`);
      if (response.data.success) {
        setUsdtRate(response.data.rate);
      }
    } catch (error) {
      console.error('Erro ao buscar taxa USDT:', error);
    }
  };

  const fetchUserBalances = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setUserBalances({
          brl: (response.data.balance || 0) + (response.data.cashback_balance || 0),
          usdt: response.data.usdt_balance || 0
        });
      }
    } catch (error) {
      console.error('Erro ao buscar saldos:', error);
    }
  };

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

      const total = subtotal + deliveryFee;

      // Validar saldo
      if (paymentMethod === 'wallet') {
        if (userBalances.brl < total) {
          toast.error(`Saldo insuficiente. Necessário: R$ ${total.toFixed(2)}, Disponível: R$ ${userBalances.brl.toFixed(2)}`);
          return;
        }
      } else if (paymentMethod === 'usdt') {
        const usdtAmount = total / usdtRate;
        if (userBalances.usdt < usdtAmount) {
          toast.error(`Saldo USDT insuficiente. Necessário: ${usdtAmount.toFixed(6)} USDT, Disponível: ${userBalances.usdt.toFixed(6)} USDT`);
          return;
        }
      }
      
      const orderData = {
        merchant_id: merchantId,
        order_type: orderType,
        items: items,
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        customer_notes: customerNotes || null,
        payment_method: paymentMethod
      };

      console.log('🛒 Criando pedido com merchant_id:', merchantId);
      console.log('📦 Dados completos do pedido:', JSON.stringify(orderData, null, 2));

      const response = await axios.post(`${API}/orders/create`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Pedido criado com sucesso!');
      console.log('📋 Resposta do servidor:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        toast.success('Pedido criado com sucesso! 🎉');
        
        // Redirecionar para Meus Pedidos
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

  const calculateTotal = () => {
    return subtotal + (orderType === 'delivery' ? deliveryFee : 0);
  };

  if (!merchantId || !items) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
        <div className={`rounded-3xl shadow-xl p-8 max-w-sm w-full text-center ${isDarkMode ? 'bg-[#556B2F]' : 'bg-white'}`}>
          <Package size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-[#005B9C]' : 'text-gray-400'}`} />
          <p className={`mb-4 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Carrinho vazio</p>
          <button
            onClick={() => navigate('/lojas')}
            className={`w-full py-3 rounded-xl font-semibold ${
              isDarkMode 
                ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
            }`}
          >
            Ver Lojas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-8 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`text-white sticky top-0 z-40 shadow-lg ${
        isDarkMode ? 'bg-[#556B2F]' : 'bg-[#005B9C]'
      }`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Finalizar Pedido</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Merchant Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
              <Store size={24} className="text-[#005B9C]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{merchantName}</h2>
              <p className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
        </div>

        {/* Tipo de Pedido */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">Tipo de Pedido</h3>
          <div className={`grid ${acceptsPickup && acceptsDelivery ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {acceptsPickup && (
              <button
                onClick={() => setOrderType('pickup')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  orderType === 'pickup'
                    ? 'border-[#005B9C] bg-[#FFFFFF]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <ShoppingBag size={24} className={`mx-auto mb-2 ${orderType === 'pickup' ? 'text-[#005B9C]' : 'text-gray-400'}`} />
                <p className={`text-sm font-semibold ${orderType === 'pickup' ? 'text-[#005B9C]' : 'text-gray-600'}`}>
                  Retirada
                </p>
                <p className="text-xs text-gray-500 mt-1">No local</p>
              </button>
            )}
            {acceptsDelivery && (
              <button
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  orderType === 'delivery'
                    ? 'border-[#005B9C] bg-[#FFFFFF]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Truck size={24} className={`mx-auto mb-2 ${orderType === 'delivery' ? 'text-[#005B9C]' : 'text-gray-400'}`} />
                <p className={`text-sm font-semibold ${orderType === 'delivery' ? 'text-[#005B9C]' : 'text-gray-600'}`}>
                  Delivery
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Endereço de Entrega */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-[#005B9C]" />
              Endereço de Entrega
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">CEP *</label>
                <input
                  type="text"
                  value={deliveryAddress.cep}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, cep: e.target.value })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Rua *</label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  placeholder="Nome da rua"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Número *</label>
                  <input
                    type="text"
                    value={deliveryAddress.number}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, number: e.target.value })}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Complemento</label>
                  <input
                    type="text"
                    value={deliveryAddress.complement}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, complement: e.target.value })}
                    placeholder="Apto 101"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bairro *</label>
                <input
                  type="text"
                  value={deliveryAddress.neighborhood}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, neighborhood: e.target.value })}
                  placeholder="Bairro"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade *</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Estado *</label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-[#005B9C]" />
            Observações (Opcional)
          </h3>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Ex: Sem cebola, ponto da carne bem passado, troco para R$ 100..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {customerNotes.length}/500 caracteres
          </p>
        </div>

        {/* Forma de Pagamento */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#005B9C]" />
            Forma de Pagamento
          </h3>
          
          <div className="space-y-3">
            {/* Saldo da Carteira */}
            {merchantPaymentMethods.accept_wallet_payment && (
              <label className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'wallet' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">💵 Saldo da Carteira</p>
                    <p className="text-xs text-gray-500">Disponível: R$ {userBalances.brl.toFixed(2)}</p>
                  </div>
                </div>
                {userBalances.brl < calculateTotal() && (
                  <span className="text-xs text-red-600 font-medium">Insuficiente</span>
                )}
              </label>
            )}

            {/* USDT */}
            {merchantPaymentMethods.accept_usdt_payment && (
              <label className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'usdt' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="usdt"
                    checked={paymentMethod === 'usdt'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">🪙 USDT (Criptomoeda)</p>
                    <p className="text-xs text-gray-500">
                      Disponível: {userBalances.usdt.toFixed(6)} USDT
                    </p>
                    {paymentMethod === 'usdt' && (
                      <p className="text-xs text-purple-600 font-medium mt-1">
                        ≈ {(calculateTotal() / usdtRate).toFixed(6)} USDT serão debitados
                      </p>
                    )}
                  </div>
                </div>
                {userBalances.usdt < (calculateTotal() / usdtRate) && (
                  <span className="text-xs text-red-600 font-medium">Insuficiente</span>
                )}
              </label>
            )}
          </div>

          {/* Conversão USDT */}
          {paymentMethod === 'usdt' && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700">
                <strong>Taxa de conversão:</strong> 1 USDT = R$ {usdtRate.toFixed(2)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                <strong>Total em USDT:</strong> {(calculateTotal() / usdtRate).toFixed(6)} USDT
              </p>
            </div>
          )}
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={18} className="text-[#005B9C]" />
            Resumo do Pedido
          </h3>
          
          {/* Items */}
          <div className="space-y-2 mb-4 pb-4 border-b">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.quantity}x {item.product_name}
                  </p>
                  {item.selected_variation && (
                    <p className="text-xs text-[#005B9C]">• {item.selected_variation.name}</p>
                  )}
                  {item.selected_complements?.length > 0 && (
                    <p className="text-xs text-blue-600">
                      • {item.selected_complements.map(c => c.name).join(', ')}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">R$ {item.total_price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>
            {orderType === 'delivery' && deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Truck size={14} />
                  Taxa de Entrega:
                </span>
                <span className="font-medium">R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-[#005B9C]">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão Confirmar */}
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#005B9C] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processando...
            </>
          ) : (
            <>
              <CheckCircle size={22} />
              Confirmar Pedido
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Ao confirmar, você concorda com os termos de uso
        </p>
      </div>
    </div>
  );
};

export default MinimalistCheckout;
