import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, ShoppingBag, Package, 
  Clock, CheckCircle, XCircle, TrendingUp, DollarSign, Users,
  Camera, Upload, X, ChevronDown, ChevronUp, Filter, Search,
  MoreVertical, Image as ImageIcon, AlertCircle, Store, Loader2, Printer, Shield, Truck, Settings
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const MeuNegocio = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const { merchantId } = useParams(); // ID do lojista quando master acessa
  const [activeTab, setActiveTab] = useState('catalogo');
  const [loading, setLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null); // Dados do lojista sendo visualizado
  
  // Determinar se é modo suporte (master acessando outro lojista)
  const isSupportMode = user?.user_type === 'master' && merchantId;
  const effectiveMerchantId = isSupportMode ? merchantId : user?.id;
  
  // Estados do Catálogo
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Estados dos Pedidos
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all'); // all, pending, preparing, ready, delivered
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'list'
  const [newOrdersCount, setNewOrdersCount] = useState(0); // Contador de novos pedidos
  
  // Estados das Estatísticas
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalOrders: 0,
    avgTicket: 0,
    topProducts: [],
    cashbackDistributed: 0
  });

  
  // Estados das Configurações da Loja
  const [storeSettings, setStoreSettings] = useState({
    is_open: true,
    delivery_fee: 0,
    delivery_radius: 5,
    accept_wallet_payment: true,
    accept_usdt_payment: false
  });


  useEffect(() => {
    // Carregar dados do lojista se for modo suporte
    if (isSupportMode) {
      fetchMerchantData();
    }
    
    if (user?.user_type !== 'lojista' && !isSupportMode) {
      toast.error('Acesso restrito a lojistas');
      navigate('/');
      return;
    }
    
    // Carregar configurações da loja
    if (activeTab === 'configuracoes') {
      // Carregar configurações do usuário
      setStoreSettings({
        is_open: user?.is_open !== false, // Default true
        delivery_fee: user?.delivery_fee || 0,
        delivery_radius: user?.delivery_radius || 5,
        accept_wallet_payment: user?.accept_wallet_payment !== false,
        accept_usdt_payment: user?.accept_usdt_payment === true
      });
    }
    
    if (activeTab === 'catalogo') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'pedidos') {
      fetchOrders();
    } else if (activeTab === 'estatisticas') {
      fetchStats();
    }
  }, [activeTab, user, merchantId]);
  // Polling para contador de novos pedidos (a cada 30s)
  useEffect(() => {
    if (effectiveMerchantId) {
      fetchNewOrdersCount(); // Buscar imediatamente
      
      const interval = setInterval(() => {
        fetchNewOrdersCount();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [effectiveMerchantId]);

  // Resetar contador quando abrir aba de pedidos
  useEffect(() => {
    if (activeTab === 'pedidos') {
      setNewOrdersCount(0);
    }
  }, [activeTab]);

  const fetchMerchantData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/master/users/${merchantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMerchantData(response.data.user);
    } catch (error) {
      console.error('Erro ao buscar dados do lojista:', error);
      toast.error('Erro ao carregar dados do lojista');
      navigate('/master');
    }
  };

  // ============================================
  // FUNÇÕES DO CATÁLOGO
  // ============================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = isSupportMode 
        ? `${API}/merchant/products?merchant_id=${effectiveMerchantId}`
        : `${API}/merchant/products`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = isSupportMode 
        ? `${API}/merchant/categories?merchant_id=${effectiveMerchantId}`
        : `${API}/merchant/categories`;
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setCategories([]);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const url = isSupportMode 
        ? `${API}/merchant/products/${productId}?merchant_id=${effectiveMerchantId}`
        : `${API}/merchant/products/${productId}`;
        
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Produto excluído com sucesso!');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  // ============================================
  // Buscar contagem de novos pedidos (notificações)
  const fetchNewOrdersCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Contar notificações de tipo "new_order" não lidas
        const newOrderNotifications = response.data.notifications.filter(
          n => n.type === 'new_order' && !n.is_read
        );
        setNewOrdersCount(newOrderNotifications.length);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de novos pedidos:', error);
    }
  };

  // FUNÇÕES DOS PEDIDOS
  // ============================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/orders/merchant/list`;
        
      console.log('🏪 [MeuNegocio] Buscando pedidos:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 [MeuNegocio] Pedidos recebidos:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        console.log(`✅ [MeuNegocio] Total de pedidos: ${response.data.orders.length}`);
      }
    } catch (error) {
      console.error('❌ [MeuNegocio] Erro ao buscar pedidos:', error);
      console.error('Detalhes:', error.response?.data);
      toast.error('Erro ao carregar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API}/orders/${orderId}/status`;
        
      await axios.put(
        url,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status atualizado com sucesso!');
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Funções de Drag and Drop
  const handleDragStart = (order) => {
    setDraggedOrder(order);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus) => {
    if (draggedOrder && draggedOrder.status !== newStatus) {
      const orderId = draggedOrder.id || draggedOrder.order_id;
      updateOrderStatus(orderId, newStatus);
    }
    setDraggedOrder(null);
  };

  // Função de Impressão
  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const orderDate = new Date(order.created_at).toLocaleString('pt-BR');
    
    let itemsHTML = '';
    order.items?.forEach((item, index) => {
      itemsHTML += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}x</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>${item.product_name}</strong>
            ${item.selected_variation ? 
              `<br><small>• ${item.selected_variation.name}</small>` : ''}
            ${item.selected_complements && item.selected_complements.length > 0 ? 
              `<br><small>• ${item.selected_complements.map(c => c.name).join(', ')}</small>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${(item.total_price || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    // Formatar endereço se for delivery
    let addressHTML = '';
    if (order.delivery_address && typeof order.delivery_address === 'object') {
      const addr = order.delivery_address;
      addressHTML = `${addr.street}, ${addr.number}${addr.complement ? ' - ' + addr.complement : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.cep}`;
    } else if (order.delivery_address) {
      addressHTML = order.delivery_address;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido #${order.order_number || (order.id || order.order_id)?.slice(0, 8)}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #333;
            color: white;
            padding: 10px;
            text-align: left;
          }
          .total {
            font-size: 20px;
            font-weight: bold;
            text-align: right;
            margin-top: 20px;
            padding: 10px;
            background: #f0f0f0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${user?.fantasy_name || user?.company_name || 'Transmill'}</h1>
          <h2>Pedido #${order.order_number || (order.id || order.order_id)?.slice(0, 8)}</h2>
        </div>

        <div class="info-section">
          <p><strong>Data:</strong> ${orderDate}</p>
          <p><strong>Cliente:</strong> ${order.customer_name}</p>
          ${order.customer_phone ? `<p><strong>Telefone:</strong> ${order.customer_phone}</p>` : ''}
          ${order.order_type ? `<p><strong>Tipo:</strong> ${order.order_type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}</p>` : ''}
          ${addressHTML ? `<p><strong>Endereço:</strong> ${addressHTML}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Qtd</th>
              <th>Item</th>
              <th style="width: 100px; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        ${order.delivery_fee > 0 ? `
          <div style="text-align: right; padding: 5px 8px;">
            <strong>Taxa de Entrega:</strong> R$ ${order.delivery_fee.toFixed(2)}
          </div>
        ` : ''}

        <div class="total">
          TOTAL: R$ ${(order.total || 0).toFixed(2)}
        </div>

        ${order.customer_notes ? `
          <div class="info-section">
            <strong>📝 Observações:</strong><br>
            ${order.customer_notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>Obrigado pela preferência!</p>
          ${user?.whatsapp ? `<p>WhatsApp: ${user.whatsapp}</p>` : ''}
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 5px;">
            🖨️ Imprimir
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px; background: #f44336; color: white; border: none; border-radius: 5px;">
            ✕ Fechar
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar carregamento e abrir janela de impressão automaticamente
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  // ============================================
  // FUNÇÕES DAS ESTATÍSTICAS
  // ============================================

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = isSupportMode 
        ? `${API}/merchant/stats?merchant_id=${effectiveMerchantId}`
        : `${API}/merchant/stats`;
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDERIZAÇÃO DAS TABS
  // ============================================

  const renderCatalogo = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2>
          <p className="text-sm text-gray-600">Gerencie seus produtos e categorias</p>
        </div>
        <Button 
          onClick={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className={isDarkMode ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-800">{products.length}</p>
              </div>
              <div className="p-3 bg-transmill-olive-100 rounded-lg">
                <Package className="w-6 h-6 text-transmill-olive-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
              </div>
              <div className="p-3 bg-transmill-gold-100 rounded-lg">
                <Package className="w-6 h-6 text-transmill-gold-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-transmill-olive-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link do Catálogo */}
      <Card className={`border-2 border-dashed ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-transmill-olive-800 mb-1">Link do seu Catálogo Online</p>
              <p className="text-xs text-transmill-olive-600 font-mono break-all">
                {user?.store_slug 
                  ? `transmill.com.br/${user.store_slug}`
                  : `${window.location.origin}/catalog/${user?.id}`
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.store_slug 
                  ? 'URL personalizada da sua loja' 
                  : 'Configure um nome personalizado no seu perfil'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                const url = user?.store_slug 
                  ? `https://transmill.com.br/${user.store_slug}`
                  : `${window.location.origin}/catalog/${user?.id}`;
                
                try {
                  // Tentar usar Clipboard API
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                    toast.success('Link copiado para a área de transferência!');
                  } else {
                    // Fallback para ambientes sem Clipboard API
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      toast.success('Link copiado para a área de transferência!');
                    } catch (err) {
                      toast.error('Link: ' + url, { duration: 5000 });
                    }
                    document.body.removeChild(textArea);
                  }
                } catch (error) {
                  console.error('Erro ao copiar:', error);
                  // Mostrar o link em um toast se não conseguir copiar
                  toast.info('Link: ' + url, { duration: 8000 });
                }
              }}
              className="bg-transmill-olive-600 hover:bg-transmill-olive-700"
            >
              Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botão Categorias */}
      <Button
        variant="outline"
        onClick={() => setShowCategoryModal(true)}
        className="w-full sm:w-auto"
      >
        <Package className="w-4 h-4 mr-2" />
        Gerenciar Categorias
      </Button>

      {/* Lista de Produtos */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Loader2 size={64} className="mx-auto mb-4 opacity-50 animate-spin" />
              <p className="text-sm">Carregando produtos...</p>
            </div>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package size={64} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
              <p className="text-sm mb-4">Comece adicionando produtos ao seu catálogo</p>
              <Button onClick={() => setShowProductModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagem do Produto - Padrão iFood (Quadrada 1:1) */}
              <div className="relative w-full pb-[100%] bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={48} className="text-white400" />
                  </div>
                )}
                {product.has_promotion && (
                  <Badge className="absolute top-2 right-2 bg-red-500">Promoção</Badge>
                )}
                {!product.is_active && (
                  <Badge className="absolute top-2 left-2 bg-gray-500">Inativo</Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.has_promotion ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          R$ {product.promotion_price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-green-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {product.has_stock_control && (
                    <Badge variant="outline" className="text-xs">
                      Estoque: {product.stock_quantity}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setEditingProduct(product);
                      setShowProductModal(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteProduct(product.product_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPedidos = () => {
    // Filtrar pedidos por status (BACKEND USA: pending, confirmed, preparing, ready, delivering, completed, cancelled)
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const confirmedOrders = orders.filter(o => o.status === 'confirmed');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');
    const deliveringOrders = orders.filter(o => o.status === 'delivering');
    const completedOrders = orders.filter(o => o.status === 'completed');

    const columns = [
      { 
        id: 'pending', 
        title: 'Pendentes', 
        orders: pendingOrders,
        color: 'bg-yellow-500',
        icon: AlertCircle 
      },
      { 
        id: 'confirmed', 
        title: 'Confirmados', 
        orders: confirmedOrders,
        color: 'bg-transmill-olive-500',
        icon: CheckCircle 
      },
      { 
        id: 'preparing', 
        title: 'Preparando', 
        orders: preparingOrders,
        color: 'bg-orange-500',
        icon: Clock 
      },
      { 
        id: 'ready', 
        title: 'Prontos', 
        orders: readyOrders,
        color: 'bg-transmill-olive-500',
        icon: CheckCircle 
      },
      { 
        id: 'delivering', 
        title: 'Saiu p/ Entrega', 
        orders: deliveringOrders,
        color: 'bg-transmill-gold-500',
        icon: Truck 
      },
      { 
        id: 'completed', 
        title: 'Entregues', 
        orders: completedOrders,
        color: 'bg-gray-600',
        icon: Package 
      }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pedidos Recebidos</h2>
            <p className="text-sm text-gray-600">Arraste os cards para mudar o status</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Lista
            </Button>
          </div>
        </div>

        {/* Resumo Rápido */}
        {/* Estatísticas das Colunas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {columns.map(col => (
            <div key={col.id} className={`${col.color} text-white p-3 rounded-lg text-center`}>
              <col.icon className="w-5 h-5 mx-auto mb-1" />
              <p className="text-2xl font-bold">{col.orders.length}</p>
              <p className="text-xs opacity-90">{col.title}</p>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Loader2 size={64} className="mx-auto mb-4 opacity-50 animate-spin" />
                <p className="text-sm">Carregando pedidos...</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {columns.map(column => (
                <div
                  key={column.id}
                  className="bg-gray-100 rounded-lg p-4 min-h-[600px] w-80 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {/* Column Header */}
                  <div className={`${column.color} text-white p-3 rounded-lg mb-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <column.icon className="w-5 h-5" />
                      <span className="font-semibold text-sm">{column.title}</span>
                    </div>
                    <Badge className="bg-white/20 border-white/30">
                      {column.orders.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {column.orders.map(order => (
                      <KanbanOrderCard
                        key={order.id || order.order_id}
                        order={order}
                        onDragStart={() => handleDragStart(order)}
                        onUpdateStatus={updateOrderStatus}
                        onPrint={printOrder}
                      />
                    ))}
                    {column.orders.length === 0 && (
                      <div className="text-center py-8 text-white400">
                        <p className="text-sm">Nenhum pedido</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Lista (modo antigo)
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard 
                key={order.order_id} 
                order={order} 
                onUpdateStatus={updateOrderStatus}
                onPrint={printOrder}
              />
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderConfiguracoes = () => {
    const handleUpdateSettings = async (field, value) => {
      try {
        const token = localStorage.getItem('token');
        const payload = { [field]: value };
        
        const response = await axios.put(
          `${API}/merchant/store-settings`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: payload
          }
        );
        
        if (response.data.success) {
          setStoreSettings(prev => ({ ...prev, [field]: value }));
          toast.success(response.data.message);
        }
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        toast.error(error.response?.data?.detail || 'Erro ao atualizar configuração');
      }
    };

    const handleUpdatePaymentMethods = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Validação: pelo menos uma forma deve estar ativa
        if (!storeSettings.accept_wallet_payment && !storeSettings.accept_usdt_payment) {
          toast.error('Pelo menos uma forma de pagamento deve estar ativa');
          return;
        }
        
        const response = await axios.patch(
          `${API}/user/payment-methods`,
          {
            accept_wallet_payment: storeSettings.accept_wallet_payment,
            accept_usdt_payment: storeSettings.accept_usdt_payment
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success('Formas de pagamento atualizadas com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao atualizar formas de pagamento:', error);
        toast.error(error.response?.data?.detail || 'Erro ao atualizar formas de pagamento');
      }
    };

    const handleClearCompletedOrders = async () => {
      if (!window.confirm('Deseja arquivar todos os pedidos entregues? Eles serão movidos para o histórico.')) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API}/merchant/clear-completed-orders`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success(response.data.message);
          fetchOrders(); // Recarregar pedidos
        }
      } catch (error) {
        console.error('Erro ao arquivar pedidos:', error);
        toast.error('Erro ao arquivar pedidos');
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configurações da Loja</h2>
          <p className="text-sm text-gray-600">Gerencie as configurações operacionais</p>
        </div>

        {/* Card: Status da Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store size={20} />
              Status da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">
                  Loja {storeSettings.is_open ? 'Aberta' : 'Fechada'}
                </h3>
                <p className="text-sm text-gray-600">
                  {storeSettings.is_open 
                    ? 'Clientes podem fazer pedidos' 
                    : 'Pedidos temporariamente desabilitados'}
                </p>
              </div>
              <button
                onClick={() => handleUpdateSettings('is_open', !storeSettings.is_open)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  storeSettings.is_open ? 'bg-transmill-olive-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    storeSettings.is_open ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Configurações de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck size={20} />
              Configurações de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Taxa de Entrega */}
            <div>
              <Label htmlFor="delivery_fee" className="text-base font-semibold mb-2 block">
                Taxa de Entrega (R$)
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Valor cobrado por entrega. Use 0 para entrega grátis.
              </p>
              <div className="flex gap-3">
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.50"
                  min="0"
                  value={storeSettings.delivery_fee}
                  onChange={(e) => setStoreSettings(prev => ({ 
                    ...prev, 
                    delivery_fee: parseFloat(e.target.value) || 0 
                  }))}
                  className="max-w-xs"
                />
                <Button
                  onClick={() => handleUpdateSettings('delivery_fee', storeSettings.delivery_fee)}
                >
                  Salvar
                </Button>
              </div>
            </div>

            {/* Raio de Entrega */}
            <div>
              <Label htmlFor="delivery_radius" className="text-base font-semibold mb-2 block">
                Raio de Entrega (km)
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Distância máxima que você atende a partir da sua loja.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    id="delivery_radius"
                    type="number"
                    step="1"
                    min="1"
                    value={storeSettings.delivery_radius}
                    onChange={(e) => setStoreSettings(prev => ({ 
                      ...prev, 
                      delivery_radius: parseFloat(e.target.value) || 1 
                    }))}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => handleUpdateSettings('delivery_radius', storeSettings.delivery_radius)}
                  >
                    Salvar
                  </Button>
                </div>
                
                {/* Botões rápidos */}
                <div className="flex gap-2">
                  <span className="text-sm text-gray-600 mr-2">Rápido:</span>
                  {[1, 2, 3, 5, 10, 15].map(km => (
                    <Button
                      key={km}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStoreSettings(prev => ({ ...prev, delivery_radius: km }));
                        handleUpdateSettings('delivery_radius', km);
                      }}
                      className={storeSettings.delivery_radius === km ? 'bg-transmill-olive-100 border-[#005B9C]' : ''}
                    >
                      {km} km
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Formas de Recebimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} />
              Formas de Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Escolha quais formas de pagamento você aceita para receber pelos seus produtos/serviços.
              É necessário ter pelo menos uma forma ativa.
            </p>
            
            <div className="space-y-3">
              {/* Wallet Payment */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Saldo da Carteira</h4>
                    <p className="text-xs text-gray-500">Pagamento via saldo BRL do cliente</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.accept_wallet_payment !== false}
                    onChange={(e) => setStoreSettings(prev => ({ 
                      ...prev, 
                      accept_wallet_payment: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* USDT Payment */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">USDT (Criptomoeda)</h4>
                    <p className="text-xs text-gray-500">Pagamento via USDT do cliente</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.accept_usdt_payment === true}
                    onChange={(e) => setStoreSettings(prev => ({ 
                      ...prev, 
                      accept_usdt_payment: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <Button
              onClick={() => handleUpdatePaymentMethods()}
              className="w-full"
            >
              Salvar Formas de Recebimento
            </Button>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>Dica:</strong> Ao aceitar USDT, você amplia suas opções de pagamento e pode receber de clientes que preferem criptomoedas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card: Gerenciar Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Gerenciar Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={20} />
                Limpar Pedidos Entregues
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Arquiva todos os pedidos já entregues, limpando sua visualização no Kanban. 
                Útil ao final do expediente.
              </p>
              <Button
                onClick={handleClearCompletedOrders}
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Arquivar Pedidos Entregues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEstatisticas = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Estatísticas e Resumo</h2>
        <p className="text-sm text-gray-600">Acompanhe o desempenho do seu negócio</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-transmill-olive-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Vendas Hoje</p>
            <p className="text-2xl font-bold text-gray-800">
              R$ {stats.todaySales.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-transmill-olive-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-transmill-olive-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Vendas Semana</p>
            <p className="text-2xl font-bold text-gray-800">
              R$ {stats.weekSales.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-transmill-gold-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-transmill-gold-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
            <p className="text-2xl font-bold text-gray-800">
              R$ {stats.avgTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendas do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            R$ {stats.monthSales.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600">
            Cashback Distribuído: R$ {stats.cashbackDistributed.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Produtos Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-transmill-olive-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} vendidos</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    R$ {product.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Verificar permissão
  if (user?.user_type !== 'lojista') {
    return (
      <div className="min-h-screen bg-transmill-olive-darker flex items-center justify-center bg-gray-100">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Store size={64} className="mx-auto mb-4 text-white400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">Esta área é exclusiva para lojistas.</p>
            <Button onClick={() => navigate('/')}>
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b sticky top-0 z-10 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">Meu Negócio</h1>
                  {isSupportMode && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                      <Shield className="w-3 h-3 mr-1" />
                      Modo Suporte
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {isSupportMode 
                    ? (merchantData?.fantasy_name || merchantData?.company_name || `Lojista ID: ${merchantId}`)
                    : (user?.fantasy_name || user?.company_name || 'Sua Loja')
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/catalog/${user?.id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Catálogo Público
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'catalogo', label: 'Catálogo', icon: Package },
              { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
              { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp },
              { id: 'configuracoes', label: 'Configurações', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-transmill-olive-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                
                {/* Badge para novos pedidos */}
                {tab.id === 'pedidos' && newOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
                    {newOrdersCount > 99 ? '99+' : newOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'catalogo' && renderCatalogo()}
        {activeTab === 'pedidos' && renderPedidos()}
        {activeTab === 'estatisticas' && renderEstatisticas()}
        {activeTab === 'configuracoes' && renderConfiguracoes()}
      </div>

      {/* Modals */}
      <ProductModal
        open={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSave={() => {
          fetchProducts();
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        API={API}
        isSupportMode={isSupportMode}
        merchantId={effectiveMerchantId}
      />

      <CategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onSave={() => {
          fetchCategories();
          setShowCategoryModal(false);
        }}
        API={API}
        isSupportMode={isSupportMode}
        merchantId={effectiveMerchantId}
      />
    </div>
  );
};

// ============================================
// COMPONENTE KanbanOrderCard
// ============================================

const KanbanOrderCard = ({ order, onDragStart, onUpdateStatus, onPrint }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-move hover:shadow-lg transition-all bg-white"
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-bold text-sm">#{order.order_number || (order.id || order.order_id)?.slice(0, 8)}</h4>
            <p className="text-xs text-gray-600">
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPrint(order)}
            className="h-8 w-8 p-0"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>

        {/* Cliente */}
        <div className="mb-2 p-2 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
          {order.customer_phone && (
            <p className="text-xs text-gray-600">{order.customer_phone}</p>
          )}
        </div>

        {/* Items Resumo */}
        <div className="mb-2">
          <p className="text-xs text-gray-600 mb-1">
            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
          </p>
          {!showDetails && order.items?.slice(0, 2).map((item, idx) => (
            <p key={idx} className="text-xs text-gray-700 truncate">
              {item.quantity}x {item.product_name}
            </p>
          ))}
          {order.items?.length > 2 && !showDetails && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2 text-transmill-olive-600"
              onClick={() => setShowDetails(true)}
            >
              + {order.items.length - 2} itens
            </Button>
          )}
        </div>

        {/* Detalhes Expandidos */}
        {showDetails && (
          <div className="mb-2 space-y-1 max-h-40 overflow-y-auto">
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                <p className="font-medium">{item.quantity}x {item.product_name}</p>
                {item.selected_variation && (
                  <p className="text-gray-600">• {item.selected_variation.name}</p>
                )}
                {item.selected_complements?.length > 0 && (
                  <p className="text-gray-600">• {item.selected_complements.map(c => c.name).join(', ')}</p>
                )}
                <p className="text-gray-700 font-semibold">R$ {item.total_price?.toFixed(2) || '0.00'}</p>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2 text-transmill-olive-600 w-full"
              onClick={() => setShowDetails(false)}
            >
              Ocultar
            </Button>
          </div>
        )}

        {/* Endereço de entrega */}
        {order.delivery_address && (
          <div className="mb-2 p-2 bg-transmill-olive-50 rounded">
            <p className="text-xs font-medium text-transmill-olive-800">🚚 Entrega</p>
            <p className="text-xs text-transmill-olive-700">
              {order.delivery_address.street}, {order.delivery_address.number}
              {order.delivery_address.neighborhood && ` - ${order.delivery_address.neighborhood}`}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total:</span>
            <span className="text-lg font-bold text-green-600">
              R$ {order.total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Observações */}
        {order.customer_notes && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs font-medium text-yellow-800">📝 Obs:</p>
            <p className="text-xs text-yellow-700">{order.customer_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// COMPONENTE OrderCard (modo lista)
// ============================================

const OrderCard = ({ order, onUpdateStatus, onPrint }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing': return 'bg-[#6B8239] text-white border-[#005B9C]';
      case 'ready': return 'bg-transmill-olive-100 text-green-800 border-green-300';
      case 'out_for_delivery': return 'bg-transmill-gold-100 text-transmill-gold-800 border-purple-300';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Novo Pedido';
      case 'preparing': return 'Em Preparo';
      case 'ready': return 'Pronto';
      case 'out_for_delivery': return 'Saiu para Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header do Pedido */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">Pedido #{order.order_number || order.order_id?.slice(0, 8)}</h3>
              <Badge className={`${getStatusColor(order.status)} border`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(order.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(order)}
              title="Imprimir Pedido"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>

        {/* Info do Cliente */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Cliente: {order.customer_name}</p>
          {order.customer_phone && (
            <p className="text-sm text-gray-600">Tel: {order.customer_phone}</p>
          )}
          {order.delivery_address && (
            <p className="text-sm text-gray-600 mt-1">
              Entrega: {order.delivery_address}
            </p>
          )}
        </div>

        {/* Items do Pedido */}
        {expanded && (
          <div className="mb-4 space-y-2">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-2 bg-white border rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  {item.variations && item.variations.length > 0 && (
                    <p className="text-xs text-gray-600">
                      {item.variations.map(v => `${v.name}: ${v.option}`).join(', ')}
                    </p>
                  )}
                  {item.complements && item.complements.length > 0 && (
                    <p className="text-xs text-gray-600">
                      + {item.complements.map(c => c.name).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                </div>
                <p className="font-bold text-sm">R$ {item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center mb-4 p-3 bg-transmill-olive-50 rounded-lg border border-green-200">
          <span className="font-bold text-gray-700">Total do Pedido</span>
          <span className="text-2xl font-bold text-green-600">
            R$ {order.total_amount.toFixed(2)}
          </span>
        </div>

        {/* Botões de Ação */}
        {order.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-transmill-olive-600 hover:bg-transmill-olive-700"
              onClick={() => onUpdateStatus(order.order_id, 'preparing')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aceitar Pedido
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => onUpdateStatus(order.order_id, 'cancelled')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Recusar
            </Button>
          </div>
        )}

        {order.status === 'preparing' && (
          <Button
            className="w-full bg-transmill-olive-600 hover:bg-transmill-olive-700"
            onClick={() => onUpdateStatus(order.order_id, 'ready')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Pronto
          </Button>
        )}

        {order.status === 'ready' && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-transmill-gold-600 hover:bg-transmill-gold-700"
              onClick={() => onUpdateStatus(order.order_id, 'out_for_delivery')}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Saiu para Entrega
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateStatus(order.order_id, 'delivered')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Entregue (Retirada)
            </Button>
          </div>
        )}

        {order.status === 'out_for_delivery' && (
          <Button
            className="w-full bg-transmill-olive-600 hover:bg-transmill-olive-700"
            onClick={() => onUpdateStatus(order.order_id, 'delivered')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar Entrega
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MeuNegocio;
