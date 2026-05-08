import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingCart, Plus, Minus, Package, ArrowLeft, 
  Store, MapPin, Clock, Phone, DollarSign, Truck, ShoppingBag, Trash2
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';

const MerchantCatalogView = () => {
  const { API } = useAuth();
  const params = useParams();
  const merchantId = params.merchantId || params.storeSlug; // Pode ser ID ou slug
  const navigate = useNavigate();
  
  // Detect dark mode from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('transmill-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [merchant, setMerchant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState('pickup'); // pickup ou delivery
  
  // Estados para o modal de produto
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [productQuantity, setProductQuantity] = useState(1);

  const token = localStorage.getItem('token');

  // Debug: monitorar selectedProduct
  useEffect(() => {
    console.log('🔄 selectedProduct mudou:', selectedProduct ? selectedProduct.name : 'null');
  }, [selectedProduct]);

  useEffect(() => {
    fetchCatalog();
  }, [merchantId]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      
      // Detectar se é UUID ou slug/id
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(merchantId);
      
      // Primeiro tentar como ID direto (se não for UUID)
      let url = isUUID 
        ? `${API}/catalog/${merchantId}`
        : `${API}/catalog/${merchantId}`;
      
      console.log('🔍 Buscando catálogo:', {
        merchantId,
        isUUID,
        url,
        API
      });
      
      let response;
      try {
        response = await axios.get(url);
      } catch (firstError) {
        // Se falhar, tentar como slug
        if (!isUUID && firstError.response?.status === 404) {
          console.log('🔄 Tentando como slug...');
          url = `${API}/catalog/slug/${merchantId}`;
          response = await axios.get(url);
        } else {
          throw firstError;
        }
      }
      
      console.log('✅ Catálogo recebido:', {
        success: response.data.success,
        merchant: response.data.merchant?.fantasy_name,
        products: response.data.products?.length,
        categories: response.data.categories?.length
      });
      
      if (response.data.success) {
        setMerchant(response.data.merchant);
        setCategories(response.data.categories);
        setProducts(response.data.products);
      } else {
        throw new Error('Resposta sem success=true');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar catálogo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Loja não encontrada ou catálogo indisponível');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Função para resetar o modal de produto
  const resetProductModal = () => {
    setSelectedProduct(null);
    setSelectedVariation(null);
    setSelectedComplements([]);
    setProductQuantity(1);
  };

  // Função para calcular o preço unitário do produto no modal
  const calculateModalUnitPrice = () => {
    if (!selectedProduct) return 0;
    
    const basePrice = selectedProduct.has_promotion ? selectedProduct.promotion_price : selectedProduct.price;
    let totalPrice = basePrice;
    
    if (selectedVariation) {
      totalPrice += selectedVariation.price_adjustment;
    }
    
    selectedComplements.forEach(c => {
      totalPrice += c.price;
    });
    
    return totalPrice;
  };

  // Função para calcular o preço total do produto no modal (unitário × quantidade)
  const calculateModalTotalPrice = () => {
    return calculateModalUnitPrice() * productQuantity;
  };

  const addToCart = (product, variation = null, complements = [], quantity = 1) => {
    const basePrice = product.has_promotion ? product.promotion_price : product.price;
    let unitPrice = basePrice;
    
    if (variation) {
      unitPrice += variation.price_adjustment;
    }
    
    complements.forEach(c => {
      unitPrice += c.price;
    });

    const cartItem = {
      product_id: product.product_id,
      product_name: product.name,
      product_image: product.images?.[0],
      base_price: basePrice,
      quantity: quantity,
      selected_variation: variation,
      selected_complements: complements,
      notes: '',
      total_price: unitPrice * quantity
    };

    // Verificar se já existe no carrinho
    const existingIndex = cart.findIndex(
      item => item.product_id === product.product_id &&
              JSON.stringify(item.selected_variation) === JSON.stringify(variation) &&
              JSON.stringify(item.selected_complements) === JSON.stringify(complements)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      const itemUnitPrice = newCart[existingIndex].total_price / (newCart[existingIndex].quantity - quantity);
      newCart[existingIndex].total_price = itemUnitPrice * newCart[existingIndex].quantity;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    toast.success('Produto adicionado ao carrinho!');
    resetProductModal();
  };
  
  // Função para adicionar produto do modal ao carrinho
  const handleAddToCartFromModal = () => {
    if (!selectedProduct) return;
    
    // Validar se variação é obrigatória
    if (selectedProduct.variations && selectedProduct.variations.length > 0 && !selectedVariation) {
      toast.error('Por favor, selecione um tamanho');
      return;
    }
    
    addToCart(selectedProduct, selectedVariation, selectedComplements, productQuantity);
  };

  // Função para alternar complemento
  const toggleComplement = (complement) => {
    const isSelected = selectedComplements.find(c => c.complement_id === complement.complement_id);
    
    if (isSelected) {
      setSelectedComplements(selectedComplements.filter(c => c.complement_id !== complement.complement_id));
    } else {
      setSelectedComplements([...selectedComplements, complement]);
    }
  };

  const removeFromCart = (index) => {
    const item = cart[index];
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    toast.success(`${item.product_name} removido do carrinho`);
  };

  const updateCartQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const unitPrice = item.total_price / item.quantity;
    item.quantity = newQuantity;
    item.total_price = unitPrice * newQuantity;
    
    setCart(newCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = orderType === 'delivery' ? (merchant?.delivery_fee || 0) : 0;
    return subtotal + deliveryFee;
  };

  const handleCheckout = () => {
    if (!token) {
      toast.error('Faça login para finalizar o pedido');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    // Navegar para página de checkout com dados do carrinho
    navigate('/checkout', {
      state: {
        merchantId,
        merchantName: merchant?.fantasy_name,
        items: cart,
        subtotal: calculateSubtotal(),
        deliveryFee: merchant?.delivery_fee || 0, // Passar taxa do merchant
        acceptsPickup: merchant?.accepts_pickup,
        acceptsDelivery: merchant?.accepts_delivery
      }
    });
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'} flex items-center justify-center px-4`}>
        <div className={`${isDark ? 'bg-[#3F5123]' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-sm w-full text-center`}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#005B9C] mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-white' : 'text-gray-600'} font-medium`}>Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'} flex items-center justify-center px-4`}>
        <div className={`${isDark ? 'bg-[#3F5123]' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-sm w-full text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <Store size={40} className="text-red-600" />
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Loja não encontrada</h2>
          <p className={`${isDark ? 'text-[#E5C34A]' : 'text-gray-600'} text-sm mb-6`}>A loja que você procura não está disponível no momento.</p>
          <button
            onClick={() => navigate('/lojas')}
            className={`w-full py-3 rounded-xl ${isDark ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'} font-semibold shadow-lg hover:shadow-xl transition-all`}
          >
            Ver Todas as Lojas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'} pb-24`}>
      {/* Header Minimalista Mobile-First com Nome da Loja */}
      <div className={`${isDark ? 'bg-[#3F5123]' : 'bg-[#005B9C]'} text-white sticky top-0 z-40 shadow-lg`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex-1 text-center mx-3">
              <div className="flex items-center justify-center gap-2">
                <Store size={20} />
                <h1 className="text-lg font-bold truncate">{merchant.fantasy_name || merchant.company_name || 'Catálogo'}</h1>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Merchant Info Compacto */}
          <div className="mt-3 space-y-1.5 text-xs text-white/90">
            {merchant.city && (
              <div className="flex items-center">
                <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{merchant.city}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              {merchant.estimated_delivery_time && (
                <div className="flex items-center">
                  <Clock size={14} className="mr-1.5" />
                  <span>{merchant.estimated_delivery_time} min</span>
                </div>
              )}
              {merchant.delivery_fee >= 0 && (
                <div className="flex items-center">
                  <Truck size={14} className="mr-1.5" />
                  <span>{merchant.delivery_fee === 0 ? 'Grátis' : `R$ ${merchant.delivery_fee.toFixed(2)}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories - Estilo Minimalista com Scroll Visível */}
      {categories.length > 0 && (
        <div className={`${isDark ? 'bg-[#556B2F]/90' : 'bg-white/90'} backdrop-blur-sm shadow-md border-b ${isDark ? 'border-[#005B9C]/20' : 'border-gray-200'}`}>
          <div className="max-w-md mx-auto px-4 py-3">
            <div 
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" 
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? '#005B9C #556B2F' : '#9333ea #e5e7eb'
              }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory 
                    ? isDark
                      ? 'bg-[#005B9C] text-[#2A3618] shadow-md'
                      : 'bg-[#005B9C] text-white shadow-md'
                    : isDark
                      ? 'bg-[#556B2F] text-[#E5C34A] hover:bg-[#3F5123]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🍽️ Todos
              </button>
              {categories.map(category => (
                <button
                  key={category.category_id}
                  onClick={() => setSelectedCategory(category.category_id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.category_id 
                      ? isDark
                        ? 'bg-[#005B9C] text-[#2A3618] shadow-md'
                        : 'bg-[#005B9C] text-white shadow-md'
                      : isDark
                        ? 'bg-[#556B2F] text-[#E5C34A] hover:bg-[#3F5123]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products - Layout Minimalista Mobile-First */}
      <div className="max-w-md mx-auto px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? 'bg-[#556B2F]' : 'bg-gradient-to-br from-amber-50 to-orange-50'} flex items-center justify-center`}>
              <Package size={40} className={isDark ? 'text-[#005B9C]' : 'text-purple-600'} />
            </div>
            <p className={`${isDark ? 'text-white' : 'text-gray-600'} font-medium`}>Nenhum produto disponível</p>
            <p className={`${isDark ? 'text-[#E5C34A]' : 'text-gray-400'} text-sm mt-1`}>Tente outra categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <div 
                key={product.product_id} 
                className={`${isDark ? 'bg-[#3F5123]' : 'bg-white'} rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden`}
                onClick={() => {
                  if (product.variations?.length > 0 || product.complements?.length > 0) {
                    setSelectedProduct(product);
                  }
                }}
              >
                <div className="flex gap-3 p-3">
                  {/* Imagem do Produto - Padrão iFood (Quadrada 1:1) */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package size={32} className={isDark ? 'text-[#005B9C]' : 'text-purple-300'} />
                      </div>
                    )}
                  </div>
                  
                  {/* Info do Produto */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>{product.name}</h3>
                    {product.description && (
                      <p className={`text-xs ${isDark ? 'text-[#E5C34A]' : 'text-gray-500'} mb-2 line-clamp-2`}>
                        {product.description}
                      </p>
                    )}
                    
                    {/* Preço e Botão */}
                    <div className="flex items-center justify-between mt-auto">
                      {product.has_promotion ? (
                        <div className="flex flex-col">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-400'} line-through text-xs`}>
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-bold text-lg">
                            R$ {product.promotion_price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className={`font-bold text-lg ${isDark ? 'text-[#005B9C]' : 'text-purple-600'}`}>
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.variations?.length > 0 || product.complements?.length > 0) {
                            setSelectedProduct(product);
                          } else {
                            addToCart(product);
                          }
                        }}
                        className={`w-10 h-10 rounded-full ${isDark ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'} flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105`}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal - Estilo Minimalista */}
      {showCart && cartItemCount > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowCart(false)}>
          <div 
            className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Carrinho */}
            <div className="bg-[#005B9C] text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={24} />
                  <h2 className="text-xl font-bold">Seu Carrinho</h2>
                </div>
                <button 
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</p>
            </div>

            {/* Items do Carrinho */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-3">
                  <div className="flex gap-3">
                    {/* Imagem do Produto no Carrinho - Padrão iFood (Quadrada 1:1) */}
                    {item.product_image && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-1">{item.product_name}</h4>
                      {item.selected_variation && (
                        <p className="text-xs text-purple-600 mb-0.5">
                          <span className="font-medium">• {item.selected_variation.name}</span>
                        </p>
                      )}
                      {item.selected_complements?.length > 0 && (
                        <p className="text-xs text-blue-600 mb-2">
                          • {item.selected_complements.map(c => c.name).join(', ')}
                        </p>
                      )}
                      
                      {/* Controles de Quantidade */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-white rounded-full px-1 py-1 shadow-sm">
                            <button
                              onClick={() => updateCartQuantity(index, -1)}
                              className="w-7 h-7 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-gray-900 w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(index, 1)}
                              className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          {/* Botão Remover Item */}
                          <button
                            onClick={() => removeFromCart(index)}
                            className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center hover:scale-105 transition-all"
                            title="Remover item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <span className="font-bold text-lg text-purple-600">
                          R$ {item.total_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer do Carrinho */}
            <div className="border-t bg-white p-4 space-y-4">
              {/* Resumo de Valores */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && merchant.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck size={14} />
                      Taxa de Entrega:
                    </span>
                    <span className="font-medium">R$ {merchant.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-[#005B9C]">
                    R$ {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Botão Finalizar */}
              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-2xl bg-[#005B9C] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <ShoppingBag size={22} />
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {!showCart && cartItemCount > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={() => setShowCart(true)}
            className="btn-primary rounded-full h-16 w-16 shadow-lg relative"
          >
            <ShoppingCart size={24} />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center p-0">
              {cartItemCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Product Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={resetProductModal}>
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
              <Button variant="ghost" onClick={resetProductModal} className="h-8 w-8 p-0">
                <Plus size={24} className="rotate-45" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Image - Padrão iFood (Retangular no modal) */}
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package size={60} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  {selectedProduct.has_promotion ? (
                    <div>
                      <span className="text-gray-500 line-through text-lg">
                        R$ {selectedProduct.price.toFixed(2)}
                      </span>
                      <span className="text-green-600 font-bold text-2xl ml-2">
                        R$ {selectedProduct.promotion_price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-2xl">
                      R$ {selectedProduct.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>
              )}

              {/* Variations Section */}
              {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center">
                    Tamanho <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <p className="text-sm text-gray-500">Obrigatório</p>
                  <div className="space-y-2">
                    {selectedProduct.variations.map((variation) => {
                      const variationPrice = variation.price_adjustment;
                      const isSelected = selectedVariation?.variation_id === variation.variation_id;
                      
                      return (
                        <div
                          key={variation.variation_id}
                          onClick={() => setSelectedVariation(variation)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600' 
                              : 'border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-purple-600' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">{variation.name}</p>
                                {variation.description && (
                                  <p className="text-sm text-gray-500">{variation.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {variationPrice > 0 ? (
                                <span className="font-semibold text-green-600">
                                  + R$ {variationPrice.toFixed(2)}
                                </span>
                              ) : variationPrice < 0 ? (
                                <span className="font-semibold text-red-600">
                                  - R$ {Math.abs(variationPrice).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">Sem custo adicional</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Complements Section */}
              {selectedProduct.complements && selectedProduct.complements.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">Complementos</h3>
                  <p className="text-sm text-gray-500">Opcional</p>
                  <div className="space-y-2">
                    {selectedProduct.complements.map((complement) => {
                      const isSelected = selectedComplements.find(c => c.complement_id === complement.complement_id);
                      
                      return (
                        <div
                          key={complement.complement_id}
                          onClick={() => toggleComplement(complement)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600' 
                              : 'border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">{complement.name}</p>
                                {complement.description && (
                                  <p className="text-sm text-gray-500">{complement.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-green-600">
                              + R$ {complement.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Quantidade</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                    className="h-12 w-12 p-0"
                    disabled={productQuantity <= 1}
                  >
                    <Minus size={20} />
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center">{productQuantity}</span>
                  <Button
                    variant="outline"
                    onClick={() => setProductQuantity(productQuantity + 1)}
                    className="h-12 w-12 p-0"
                  >
                    <Plus size={20} />
                  </Button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-lg mb-3">Resumo</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Preço base:</span>
                    <span>R$ {(selectedProduct.has_promotion ? selectedProduct.promotion_price : selectedProduct.price).toFixed(2)}</span>
                  </div>
                  {selectedVariation && selectedVariation.price_adjustment !== 0 && (
                    <div className="flex justify-between">
                      <span>{selectedVariation.name}:</span>
                      <span className={selectedVariation.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                        {selectedVariation.price_adjustment > 0 ? '+' : ''} R$ {selectedVariation.price_adjustment.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedComplements.map((complement) => (
                    <div key={complement.complement_id} className="flex justify-between">
                      <span>{complement.name}:</span>
                      <span className="text-green-600">+ R$ {complement.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Subtotal (x {productQuantity}):</span>
                    <span className="font-semibold">R$ {calculateModalUnitPrice().toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-green-600">
                    R$ {calculateModalTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <Button
                onClick={handleAddToCartFromModal}
                className="w-full btn-primary h-12 text-lg"
                size="lg"
              >
                <ShoppingCart className="mr-2" size={20} />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantCatalogView;
