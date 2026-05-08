import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import TransmillLogoCompact from './TransmillLogoCompact';
import ThemeToggle from './ThemeToggle';
import USDTCalculator from './USDTCalculator';
import USDTTransfer from './USDTTransfer';
import WithdrawalForm from './WithdrawalForm';
import { 
  Wallet, 
  QrCode, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  History, 
  LogOut,
  DollarSign,
  Smartphone,
  Building2,
  Calendar,
  TrendingUp,
  Camera,
  Users,
  Coins,
  Banknote,
  ExternalLink,
  User,
  Settings,
  Eye,
  EyeOff,
  MapPin,
  Search,
  Phone,
  Navigation,
  Star,
  X,
  ShoppingCart,
  Bell,
  BellRing,
  Briefcase,
  Clock as ClockIcon
} from 'lucide-react';
import axios from 'axios';
import QRScanner from './QRScanner';
import ReferralSystem from './ReferralSystem';

// Create Clock alias to ensure it's available
const Clock = ClockIcon;

const ClientDashboard = () => {
  const { user, logout, updateUser, token, API } = useAuth();
  const [balance, setBalance] = useState({ 
    balance: 0, 
    cashback_balance: 0, 
    usdt_balance: 0,
    total: 0 
  });
  const [transactions, setTransactions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState({ balance: true, transactions: true, merchants: true });
  
  // Função para tratar erros estruturados do backend
  const handleApiError = (error, defaultMessage = 'Erro na operação') => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      if (Array.isArray(detail)) {
        const errorMessages = detail.map(err => err.msg).slice(0, 2);
        return errorMessages.join('; ');
      } else if (typeof detail === 'string') {
        return detail;
      } else {
        return 'Erro de validação nos dados';
      }
    } else {
      return defaultMessage;
    }
  };
  
  // Deposit states
  const [depositData, setDepositData] = useState({ 
    amount: '', 
    method: 'pix',
    currency: 'BRL' // BRL ou USDT
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  
  // Payment states
  const [paymentData, setPaymentData] = useState({ amount: '', qr_code: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedQR, setScannedQR] = useState('');
  const [qrMerchantInfo, setQrMerchantInfo] = useState(null);
  const [readyToAuthorize, setReadyToAuthorize] = useState(false);
  const [digitalCode, setDigitalCode] = useState('');
  const [showDigitalInput, setShowDigitalInput] = useState(false);
  
  // Profile states
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    email: '',
    cpf: '',
    // Dados PIX
    pix_key: '',
    pix_key_type: '',
    // Endereço completo
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    // Dados empresariais (para lojistas)
    company_name: '',
    cnpj: '',
    whatsapp: '',
    business_segment: '',
    google_maps_url: '',
    // Dados do sócio administrador (para lojistas)
    admin_name: '',
    admin_cpf: '',
    admin_email: '',
    admin_whatsapp: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Store search states
  const [searchFilters, setSearchFilters] = useState({
    state: '',
    city: '',
    neighborhood: '',
    business_segment: ''
  });
  const [stores, setStores] = useState([]);
  const [storeFilters, setStoreFilters] = useState({
    states: [],
    cities: [],
    neighborhoods: [],
    business_segments: []
  });
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  // Withdrawal states - Now handled by WithdrawalForm component
  
  // USDT conversion states
  const [usdtData, setUsdtData] = useState({ brl_amount: '', usdt_amount: '' });
  const [usdtLoading, setUsdtLoading] = useState(false);
  
  // USDT deposit states
  const [usdtDepositAmount, setUsdtDepositAmount] = useState('');
  
  // Tabs state management
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchParams] = useSearchParams();
  
  // Debug function for tabs
  const handleTabChange = (value) => {
    console.log('Tab changing from', activeTab, 'to', value);
    setActiveTab(value);
  };

  // Ler parâmetro tab da URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      console.log('Setting active tab from URL:', tabParam);
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // PIX QR Code states
  const [pixDetails, setPixDetails] = useState(null);
  const [showPixModal, setShowPixModal] = useState(false);
  
  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Services/Providers states
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceFilters, setServiceFilters] = useState({
    query: '',
    category: ''
  });
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    service_id: '',
    appointment_datetime: '',
    client_notes: ''
  });
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
    loadStoreFilters(); // Carregar filtros de lojas
    fetchExchangeRate(); // Load exchange rate
    // Preencher dados do perfil com informações atuais do usuário
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        cpf: user.cpf || '',
        // Dados PIX
        pix_key: user.pix_key || '',
        pix_key_type: user.pix_key_type || '',
        // Endereço completo
        cep: user.cep || '',
        street: user.street || '',
        number: user.number || '',
        neighborhood: user.neighborhood || '',
        city: user.city || '',
        state: user.state || '',
        complement: user.complement || '',
        // Dados empresariais
        company_name: user.company_name || '',
        cnpj: user.cnpj || '',
        whatsapp: user.whatsapp || '',
        business_segment: user.business_segment || '',
        google_maps_url: user.google_maps_url || '',
        // Dados do sócio administrador
        admin_name: user.admin_name || '',
        admin_cpf: user.admin_cpf || '',
        admin_email: user.admin_email || '',
        admin_whatsapp: user.admin_whatsapp || ''
      });
      setImagePreview(user.profile_image || null);
    }
  }, [user]);

  // PIX copy function
  const copyPixCode = async () => {
    if (!pixDetails?.pix_copy_paste) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pixDetails.pix_copy_paste);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = pixDetails.pix_copy_paste;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Código PIX copiado para área de transferência!');
    } catch (error) {
      console.error('Error copying PIX code:', error);
      toast.error('Erro ao copiar código PIX');
    }
  };

  // Função para formatar CPF
  const formatCPF = (value) => {
    // Remove tudo que não for dígito
    const cleanValue = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return value;
  };

  // Função para lidar com mudança do CPF
  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setProfileData({ ...profileData, cpf: formatted });
  };

  const fetchUserData = async () => {
    try {
      // Fetch balance
      const balanceResponse = await axios.get(`${API}/user/balance`, { headers });
      setBalance(balanceResponse.data);
      setLoading(prev => ({ ...prev, balance: false }));

      // Fetch transactions
      const transactionsResponse = await axios.get(`${API}/transactions/history`, { headers });
      setTransactions(transactionsResponse.data);
      setLoading(prev => ({ ...prev, transactions: false }));

      // Fetch merchants
      const merchantsResponse = await axios.get(`${API}/merchants`, { headers });
      setMerchants(merchantsResponse.data);
      setLoading(prev => ({ ...prev, merchants: false }));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  // Função para buscar taxa de câmbio
  const fetchExchangeRate = async () => {
    try {
      const response = await axios.get(`${API}/xgate/exchange-rate`, { headers });
      if (response.data.success) {
        setExchangeRate(response.data.data.rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  // Buscar taxa de câmbio quando montar o componente
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositLoading(true);

    try {
      let response;
      const amount = parseFloat(depositData.amount);
      
      if (depositData.method === 'pix') {
        // Depósito direto em BRL via XGate PIX
        response = await axios.post(`${API}/xgate/pix-deposit`, 
          { 
            amount: amount,
            description: `Depósito Transmill via PIX - R$ ${amount.toFixed(2)}`
          },
          { headers }
        );
      } else if (depositData.method === 'pix-usdt') {
        // Depósito convertido para USDT via XGate
        response = await axios.post(`${API}/xgate/convert-brl-usdt`, 
          { 
            brl_amount: amount
          },
          { headers }
        );
      }
      
      if (response.data.success) {
        const pixData = response.data.data;
        
        // Store PIX details and show modal
        setPixDetails({
          ...pixData,
          currency: depositData.method === 'pix-usdt' ? 'USDT' : 'BRL',
          original_amount: amount
        });
        setShowPixModal(true);
        
        const currency = depositData.method === 'pix-usdt' ? 'USDT' : 'BRL';
        toast.success(`PIX gerado com sucesso para depósito em ${currency}! Use o QR Code para pagar.`);
      } else {
        throw new Error(response.data.error);
      }
      
      setDepositData({ amount: '', method: 'pix', currency: 'BRL' });
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Deposit error:', error);
      const errorMessage = handleApiError(error, 'Erro ao realizar depósito');
      toast.error(errorMessage);
    } finally {
      setDepositLoading(false);
    }
  };

  const handlePreparePayment = (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Digite um valor válido para o pagamento');
      return;
    }
    
    if (!qrMerchantInfo) {
      toast.error('Escaneie um QR Code válido primeiro');
      return;
    }
    
    setReadyToAuthorize(true);
    toast.success('Revise os dados e autorize o pagamento');
  };

  const handleDigitalCodeInput = async (e) => {
    e.preventDefault();
    
    if (!digitalCode.trim()) {
      toast.error('Digite o código digitável');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/transactions/validate-digital-code`, 
        { digital_code: digitalCode.trim() },
        { headers }
      );
      
      if (response.data.valid) {
        setQrMerchantInfo({
          merchant_name: response.data.merchant_name,
          cashback_rate: response.data.cashback_rate,
          amount: response.data.amount || 0,
          timestamp: new Date().toISOString()
        });
        
        // Preencher automaticamente o valor e QR code
        setPaymentData({
          amount: response.data.amount?.toString() || '',
          qr_code: response.data.qr_code
        });
        
        setScannedQR(response.data.qr_code);
        setShowDigitalInput(false);
        
        if (response.data.amount > 0) {
          setReadyToAuthorize(true);
          toast.success(`Código válido! Loja: ${response.data.merchant_name} - Valor: R$ ${response.data.amount.toFixed(2)}`);
        } else {
          toast.success(`Código válido! Loja: ${response.data.merchant_name} - Digite o valor do pagamento`);
        }
      }
    } catch (error) {
      console.error('Digital code error:', error);
      toast.error(error.response?.data?.detail || 'Código digitável inválido');
    }
  };

  const resetPaymentFlow = () => {
    setPaymentData({ amount: '', qr_code: '' });
    setScannedQR('');
    setQrMerchantInfo(null);
    setReadyToAuthorize(false);
    setDigitalCode('');
    setShowDigitalInput(false);
  };

  // Profile management functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target.result;
        setImagePreview(base64String);
        
        // Atualizar imagem automaticamente
        try {
          await axios.put(`${API}/user/profile-image`, 
            { profile_image: base64String },
            { headers }
          );
          
          // Buscar dados do usuário atualizados para atualizar o header
          const profileResponse = await axios.get(`${API}/user/profile`, { headers });
          updateUser(profileResponse.data);
          
          toast.success('Foto de perfil atualizada!');
        } catch (error) {
          console.error('Error updating image:', error);
          toast.error('Erro ao atualizar foto de perfil');
          setImagePreview(user?.profile_image || null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      await axios.put(`${API}/user/profile-data`, profileData, { headers });
      toast.success('Dados pessoais atualizados com sucesso!');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = handleApiError(error, 'Erro ao atualizar dados');
      toast.error(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('A confirmação de senha não confere');
      return;
    }

    setProfileLoading(true);

    try {
      await axios.put(`${API}/user/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, { headers });
      
      toast.success('Senha atualizada com sucesso!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar senha');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAuthorizePayment = async () => {
    setPaymentLoading(true);

    try {
      const response = await axios.post(`${API}/transactions/payment`,
        { 
          amount: parseFloat(paymentData.amount),
          qr_code: scannedQR || paymentData.qr_code
        },
        { headers }
      );
      
      toast.success(`Pagamento autorizado e processado! Loja: ${response.data.merchant_info.name} | Cashback: R$ ${response.data.cashback_earned.toFixed(2)}`);
      resetPaymentFlow();
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao processar pagamento');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleQRScan = (qrCode) => {
    setScannedQR(qrCode);
    setShowQRScanner(false);
    
    // Tentar decodificar o QR Code para extrair informações do lojista
    try {
      if (qrCode.startsWith('transmill_')) {
        // Decodificar QR Code real do Transmill
        const encoded = qrCode.replace('transmill_', '');
        const decoded = JSON.parse(atob(encoded));
        
        setQrMerchantInfo({
          merchant_name: decoded.merchant_name,
          cashback_rate: decoded.cashback_rate,
          amount: decoded.amount || 0,
          timestamp: decoded.timestamp
        });
        
        // Preencher automaticamente o valor se disponível no QR Code
        if (decoded.amount && decoded.amount > 0) {
          setPaymentData(prev => ({ 
            ...prev, 
            amount: decoded.amount.toString(),
            qr_code: qrCode 
          }));
          
          setReadyToAuthorize(true); // Pronto para autorizar
          
          toast.success(`QR Code escaneado! Loja: ${decoded.merchant_name} - Valor: R$ ${decoded.amount.toFixed(2)}`);
        } else {
          setPaymentData(prev => ({ 
            ...prev, 
            qr_code: qrCode 
          }));
          
          setReadyToAuthorize(false); // Precisa inserir valor manualmente
          
          toast.success(`QR Code escaneado! Loja: ${decoded.merchant_name} - Digite o valor do pagamento`);
        }
      } else {
        // QR Code de teste ou simulado
        setQrMerchantInfo({
          merchant_name: 'Loja Demo (QR Teste)',
          cashback_rate: 5,
          amount: 0,
          timestamp: new Date().toISOString()
        });
        
        setPaymentData(prev => ({ 
          ...prev, 
          qr_code: qrCode 
        }));
        
        setReadyToAuthorize(false); // Precisa inserir valor manualmente
        
        toast.success('QR Code de teste escaneado! Digite o valor do pagamento.');
      }
      
    } catch (error) {
      console.error('Erro ao decodificar QR Code:', error);
      // Para QR codes de teste ou inválidos
      setQrMerchantInfo({
        merchant_name: 'Loja Demo',
        cashback_rate: 5,
        amount: 0,
        timestamp: new Date().toISOString()
      });
      
      setPaymentData(prev => ({ 
        ...prev, 
        qr_code: qrCode 
      }));
      
      setReadyToAuthorize(false); // Precisa inserir valor manualmente
      
      toast.success('QR Code escaneado! Digite o valor do pagamento.');
    }
  };

  // handleWithdrawal function removed - Now handled by WithdrawalForm component

  const handleUsdtConversion = async (e) => {
    e.preventDefault();
    setUsdtLoading(true);

    try {
      const response = await axios.post(`${API}/usdt/convert-to-brl`, 
        { amount_usdt: parseFloat(usdtData.usdt_amount) },
        { headers }
      );
      
      if (response.data.success) {
        const { new_balance_brl, new_balance_usdt, net_amount_brl } = response.data.data;
        toast.success(`Conversão realizada! Recebido: ${formatCurrency(net_amount_brl)}`);
        setUsdtData({ brl_amount: '', usdt_amount: '' });
        
        // Atualizar saldos localmente
        setBalance(prev => ({
          ...prev,
          balance: new_balance_brl,
          usdt_balance: new_balance_usdt,
          total: new_balance_brl + prev.cashback_balance
        }));
        
        fetchUserData(); // Refetch para garantir sincronização
      }
    } catch (error) {
      console.error('Erro na conversão USDT:', error);
      toast.error(error.response?.data?.detail || 'Erro na conversão USDT');
    } finally {
      setUsdtLoading(false);
    }
  };

  const handleUsdtDeposit = async () => {
    if (!usdtDepositAmount || parseFloat(usdtDepositAmount) <= 0) {
      toast.error('Digite um valor válido para depósito');
      return;
    }

    setUsdtLoading(true);
    try {
      const response = await axios.post(`${API}/xgate/pix-deposit`, 
        { 
          amount: parseFloat(usdtDepositAmount),
          description: `Depósito USDT via PIX - R$ ${parseFloat(usdtDepositAmount).toFixed(2)}`,
          convert_to_usdt: true
        },
        { headers }
      );
      
      if (response.data.success) {
        const pixData = response.data.data;
        
        // Store PIX details and show modal
        setPixDetails({
          ...pixData,
          currency: 'USDT',
          original_amount: parseFloat(usdtDepositAmount)
        });
        setShowPixModal(true);
        
        toast.success('PIX gerado com sucesso para depósito USDT! Use o QR Code para pagar.');
        setUsdtDepositAmount('');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('USDT deposit error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar depósito USDT');
    } finally {
      setUsdtLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Store search functions
  const loadStoreFilters = async () => {
    try {
      setFiltersLoading(true);
      const response = await fetch(`${API}/api/stores/filters`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setStoreFilters(data);
      } else {
        console.error('Erro ao carregar filtros:', data);
        toast.error('Erro ao carregar filtros de busca');
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
      toast.error('Erro ao carregar filtros de busca');
    } finally {
      setFiltersLoading(false);
    }
  };

  // Função para buscar cidades de um estado específico na busca de lojas
  const fetchCitiesForStoreSearch = async (state) => {
    if (!state) {
      setFilteredCities([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/api/stores/cities/${encodeURIComponent(state)}`);
      setFilteredCities(response.data.cities || []);
    } catch (error) {
      console.error('Error fetching cities for store search:', error);
      toast.error('Erro ao carregar cidades do estado');
      setFilteredCities([]);
    }
  };

  // Função para lidar com mudança de estado na busca de lojas
  const handleStoreSearchStateChange = (selectedState) => {
    setSearchFilters({ ...searchFilters, state: selectedState, city: '' });
    fetchCitiesForStoreSearch(selectedState);
  };

  const searchStores = async () => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key]) {
          params.append(key, searchFilters[key]);
        }
      });
      
      const response = await fetch(`${API}/api/stores/search?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setStores(data.stores);
        toast.success(`Encontradas ${data.total} lojas`);
      } else {
        console.error('Erro na busca:', data);
        toast.error('Erro na busca de lojas');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro na busca de lojas');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      state: '',
      city: '',
      neighborhood: '',
      business_segment: ''
    });
    setStores([]);
  };

  const openWhatsApp = (whatsapp, storeName) => {
    if (!whatsapp) {
      toast.error('WhatsApp não disponível');
      return;
    }
    
    const message = encodeURIComponent(`Olá! Vi vocês no Transmill e gostaria de saber mais sobre ${storeName}.`);
    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanWhatsApp}?text=${message}`, '_blank');
  };

  const openMaps = (googleMapsUrl, storeName) => {
    if (!googleMapsUrl) {
      toast.error('Localização não disponível');
      return;
    }
    
    // Try to open the provided URL, fallback to search if invalid
    if (googleMapsUrl.includes('google.com/maps') || googleMapsUrl.includes('maps.app.goo.gl')) {
      window.open(googleMapsUrl, '_blank');
    } else {
      // Fallback to search
      const searchQuery = encodeURIComponent(storeName);
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
    }
  };

  const openMenu = (menuUrl, storeName) => {
    if (!menuUrl) {
      toast.error('Cardápio não disponível');
      return;
    }
    
    window.open(menuUrl, '_blank');
    toast.success(`Abrindo cardápio de ${storeName}`);
  };

  // Notifications functions
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, { headers });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, { headers });
      await fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Services/Providers functions
  const fetchServices = async (filters = {}) => {
    try {
      setServicesLoading(true);
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      
      const response = await fetch(`${API}/api/servicos?${params.toString()}`);
      const data = await response.json();
      
      if (data.services) {
        setServices(data.services || []);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao buscar serviços');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const searchServices = () => {
    fetchServices(serviceFilters);
  };

  const clearServiceFilters = () => {
    setServiceFilters({ query: '', category: '' });
    setServices([]);
  };

  const viewServiceDetails = async (serviceId) => {
    try {
      const response = await fetch(`${API}/servicos/${serviceId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedService(data.data);
        setShowServiceModal(true);
        setAppointmentData({
          service_id: serviceId,
          appointment_datetime: '',
          client_notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error('Erro ao carregar detalhes do serviço');
    }
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    
    if (!appointmentData.appointment_datetime) {
      toast.error('Por favor, selecione data e hora');
      return;
    }
    
    try {
      setAppointmentLoading(true);
      const response = await fetch(`${API}/agendamentos`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Agendamento criado com sucesso! Aguarde confirmação do prestador.');
        setShowServiceModal(false);
        setSelectedService(null);
        setAppointmentData({
          service_id: '',
          appointment_datetime: '',
          client_notes: ''
        });
      } else {
        toast.error(data.message || 'Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTimeShort = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Mobile-optimized container */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-4 shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {/* Profile Picture - Smaller on mobile */}
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt="Foto de perfil"
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-emerald-200 shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-200 shadow-md flex-shrink-0">
                <span className="text-emerald-600 font-bold text-xs sm:text-sm lg:text-lg">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                Olá, {user?.full_name?.split(' ')[0]}! 👋
              </h1>
              <div className="hidden sm:flex items-center space-x-2 mt-1">
                <TransmillLogoCompact width={120} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 sm:p-2 h-8 sm:h-9"
              >
                {unreadCount > 0 ? <BellRing size={14} className="text-blue-600 sm:w-4 sm:h-4" /> : <Bell size={14} className="sm:w-4 sm:h-4" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold">Notificações {unreadCount > 0 && `(${unreadCount} não lidas)`}</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                          onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                          {notification.image && (
                            <img src={notification.image} alt="" className="w-12 h-12 object-cover rounded mt-1 mb-1" />
                          )}
                          <p className="text-xs text-gray-400">{formatDateTime(notification.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => handleTabChange('services')}
              variant="outline"
              className="p-1.5 sm:p-2 h-8 sm:h-9 text-xs sm:text-sm"
              data-testid="services-btn"
            >
              <Briefcase size={14} className="sm:w-4 sm:h-4" />
              <span className="ml-1 sm:ml-2 hidden sm:inline">Serviços</span>
              <span className="ml-1 sm:hidden">Serviços</span>
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Balance BRL */}
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between h-full min-h-[70px]">
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Saldo BRL</p>
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight" data-testid="main-balance">
                    {formatCurrency(balance.balance)}
                  </p>
                </div>
                <div className="flex items-center justify-center ml-3">
                  <Wallet className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USDT Balance */}
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between h-full min-h-[70px]">
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Saldo USDT</p>
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight" data-testid="usdt-balance">
                    {(balance.usdt_balance || 0).toFixed(6)} USDT
                  </p>
                </div>
                <div className="flex items-center justify-center ml-3">
                  <DollarSign className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cashback Balance */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between h-full min-h-[70px]">
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Cashback</p>
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight" data-testid="cashback-balance">
                    {formatCurrency(balance.cashback_balance)}
                  </p>
                </div>
                <div className="flex items-center justify-center ml-3">
                  <Gift className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Balance BRL */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between h-full min-h-[70px]">
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">Total BRL</p>
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight" data-testid="total-balance">
                    {formatCurrency(balance.total)}
                  </p>
                </div>
                <div className="flex items-center justify-center ml-3">
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Mobile Optimized Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          {/* Mobile-friendly tab navigation */}
          <div className="w-full">
            {/* Mobile: Scrollable horizontal tabs with better spacing */}
            <div className="block sm:hidden">
              <div className="overflow-x-auto pb-2">
                <TabsList className="flex w-max bg-white rounded-xl shadow-sm p-2 gap-2 min-w-full">
                  <TabsTrigger value="transactions" data-testid="transactions-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[90px]" onClick={() => handleTabChange('transactions')}>
                    <History className="mr-2" size={16} />
                    <span>Histórico</span>
                  </TabsTrigger>
                  <TabsTrigger value="deposit" data-testid="deposit-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[90px]" onClick={() => handleTabChange('deposit')}>
                    <ArrowDownLeft className="mr-2" size={16} />
                    <span>Depositar</span>
                  </TabsTrigger>
                  <TabsTrigger value="payment" data-testid="payment-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[80px]" onClick={() => handleTabChange('payment')}>
                    <QrCode className="mr-2" size={16} />
                    <span>Pagar</span>
                  </TabsTrigger>
                  <TabsTrigger value="usdt" data-testid="usdt-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[80px]" onClick={() => handleTabChange('usdt')}>
                    <DollarSign className="mr-2" size={16} />
                    <span>USDT</span>
                  </TabsTrigger>
                  <TabsTrigger value="stores" data-testid="stores-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[80px]" onClick={() => handleTabChange('stores')}>
                    <MapPin className="mr-2" size={16} />
                    <span>Lojas</span>
                  </TabsTrigger>
                  <TabsTrigger value="services" data-testid="services-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[100px]" onClick={() => handleTabChange('services')}>
                    <Briefcase className="mr-2" size={16} />
                    <span>Prestadores</span>
                  </TabsTrigger>
                  <TabsTrigger value="withdrawal" data-testid="withdrawal-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[80px]" onClick={() => handleTabChange('withdrawal')}>
                    <ArrowUpRight className="mr-2" size={16} />
                    <span>Sacar</span>
                  </TabsTrigger>
                  <TabsTrigger value="referral" data-testid="referral-tab" className="flex items-center justify-center px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[80px]" onClick={() => handleTabChange('referral')}>
                    <Users className="mr-2" size={16} />
                    <span>Indicar</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden sm:block">
              <TabsList className="grid w-full grid-cols-8 bg-white rounded-xl shadow-sm">
                <TabsTrigger value="transactions" data-testid="transactions-tab" className="text-sm" onClick={() => handleTabChange('transactions')}>
                  <History className="mr-2" size={16} />
                  <span>Transações</span>
                </TabsTrigger>
                <TabsTrigger value="deposit" data-testid="deposit-tab" className="text-sm" onClick={() => handleTabChange('deposit')}>
                  <ArrowDownLeft className="mr-2" size={16} />
                  <span>Depósito</span>
                </TabsTrigger>
                <TabsTrigger value="payment" data-testid="payment-tab" className="text-sm" onClick={() => handleTabChange('payment')}>
                  <QrCode className="mr-2" size={16} />
                  <span>Pagar</span>
                </TabsTrigger>
                <TabsTrigger value="usdt" data-testid="usdt-tab" className="text-sm" onClick={() => handleTabChange('usdt')}>
                  <DollarSign className="mr-2" size={16} />
                  <span>USDT</span>
                </TabsTrigger>
                <TabsTrigger value="stores" data-testid="stores-tab" className="text-sm" onClick={() => handleTabChange('stores')}>
                  <MapPin className="mr-2" size={16} />
                  <span>Lojas</span>
                </TabsTrigger>
                <TabsTrigger value="services" data-testid="services-tab" className="text-sm" onClick={() => handleTabChange('services')}>
                  <Briefcase className="mr-2" size={16} />
                  <span>Prestadores</span>
                </TabsTrigger>
                <TabsTrigger value="withdrawal" data-testid="withdrawal-tab" className="text-sm" onClick={() => handleTabChange('withdrawal')}>
                  <ArrowUpRight className="mr-2" size={16} />
                  <span>Sacar</span>
                </TabsTrigger>
                <TabsTrigger value="referral" data-testid="referral-tab" className="text-sm" onClick={() => handleTabChange('referral')}>
                  <Users className="mr-2" size={16} />
                  <span>Indicar</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Transactions Tab - Mobile Optimized */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <History size={18} />
                  <span>Histórico de Transações</span>
                </CardTitle>
                <CardDescription className="text-sm">Suas últimas movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.transactions ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-2 text-sm">Carregando transações...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto text-gray-400 mb-4" size={40} />
                    <p className="text-gray-600 text-sm">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {/* Mobile-optimized transaction list */}
                      <div className="hidden sm:grid sm:grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 border-b-2 border-gray-200">
                        <div>Data/Hora</div>
                        <div>Descrição</div>
                        <div className="text-center">Tipo</div>
                        <div className="text-right">Valor</div>
                        <div className="text-right">Saldo</div>
                      </div>

                      {/* Transactions optimized for mobile */}
                      {(() => {
                        const expandedTransactions = [];
                        let runningBalance = balance.total;
                        
                        const sortedTransactions = [...transactions].sort((a, b) => 
                          new Date(b.created_at) - new Date(a.created_at)
                        );

                        sortedTransactions.forEach((transaction) => {
                          if (transaction.transaction_type === 'payment' && transaction.cashback_amount > 0) {
                            const cashbackEntry = {
                              ...transaction,
                              id: transaction.id + '_cashback',
                              transaction_type: 'cashback',
                              amount: transaction.cashback_amount,
                              description: `Cashback - ${transaction.description}`,
                              is_credit: true
                            };
                            
                            const paymentEntry = {
                              ...transaction,
                              description: `Pagamento - ${transaction.description}`,
                              is_credit: false
                            };
                            
                            expandedTransactions.push(cashbackEntry);
                            expandedTransactions.push(paymentEntry);
                          } else {
                            expandedTransactions.push({
                              ...transaction,
                              is_credit: transaction.transaction_type === 'deposit' || transaction.transaction_type === 'cashback' || transaction.transaction_type === 'hierarchical_cashback'
                            });
                          }
                        });

                        let currentBalance = 0;
                        
                        const transactionsWithBalance = expandedTransactions.reverse().map((transaction) => {
                          if (transaction.is_credit) {
                            currentBalance += transaction.amount;
                          } else {
                            currentBalance -= transaction.amount;
                          }
                          
                          return { ...transaction, balanceAfter: currentBalance };
                        }).reverse();

                        return transactionsWithBalance.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-shadow sm:grid sm:grid-cols-5 sm:gap-4 sm:p-3 sm:hover:bg-gray-50 sm:border-0"
                            data-testid={`transaction-${transaction.id}`}
                          >
                            {/* Mobile Layout */}
                            <div className="sm:hidden space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {transaction.description}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                                    {transaction.transaction_type === 'deposit' && <><ArrowDownLeft size={10} /> <span>Depósito</span></>}
                                    {transaction.transaction_type === 'payment' && <><QrCode size={10} /> <span>Pagamento</span></>}
                                    {transaction.transaction_type === 'withdrawal' && <><ArrowUpRight size={10} /> <span>Saque PIX</span></>}
                                    {transaction.transaction_type === 'withdrawal_fee' && <><DollarSign size={10} /> <span>Taxa Saque</span></>}
                                    {transaction.transaction_type === 'cashback' && <><Gift size={10} /> <span>Cashback</span></>}
                                    {transaction.transaction_type === 'hierarchical_cashback' && <><Gift size={10} className="text-purple-600" /> <span className="text-purple-600">Cashback Extra</span></>}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold text-sm ${
                                    transaction.is_credit ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.is_credit ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                  <Badge 
                                    className={`text-xs mt-1 ${
                                      transaction.is_credit 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {transaction.is_credit ? 'CRÉDITO' : 'DÉBITO'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <span>{new Date(transaction.created_at).toLocaleDateString('pt-BR')} {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="font-medium text-gray-900">Saldo: {formatCurrency(transaction.balanceAfter)}</span>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:contents">
                              <div className="text-gray-600 text-sm">
                                <div className="font-medium">
                                  {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>

                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {transaction.description}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center space-x-1">
                                  {transaction.transaction_type === 'deposit' && <><ArrowDownLeft size={12} /> <span>Depósito</span></>}
                                  {transaction.transaction_type === 'payment' && <><QrCode size={12} /> <span>Pagamento</span></>}
                                  {transaction.transaction_type === 'withdrawal' && <><ArrowUpRight size={12} /> <span>Saque PIX</span></>}
                                  {transaction.transaction_type === 'withdrawal_fee' && <><DollarSign size={12} /> <span>Taxa Saque</span></>}
                                  {transaction.transaction_type === 'cashback' && <><Gift size={12} /> <span>Cashback</span></>}
                                  {transaction.transaction_type === 'hierarchical_cashback' && <><Gift size={12} className="text-purple-600" /> <span className="text-purple-600">Cashback Extra</span></>}
                                </div>
                              </div>

                              <div className="text-center">
                                <Badge 
                                  className={`text-xs ${
                                    transaction.is_credit 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {transaction.is_credit ? 'CRÉDITO' : 'DÉBITO'}
                                </Badge>
                              </div>

                              <div className={`text-right font-bold text-sm ${
                                transaction.is_credit ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.is_credit ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </div>

                              <div className="text-right font-medium text-gray-900 text-sm">
                                {formatCurrency(transaction.balanceAfter)}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}

                      {/* Current balance */}
                      <div className="bg-emerald-50 rounded-lg border-2 border-emerald-200 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-800 font-bold text-sm sm:text-base">SALDOS ATUAIS</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-700 font-medium text-sm">Total BRL:</span>
                            <span className="text-emerald-600 font-bold text-lg">
                              {formatCurrency(balance.total)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-700 font-medium text-sm">Saldo USDT:</span>
                            <span className="text-yellow-600 font-bold text-base">
                              {(balance.usdt_balance || 0).toFixed(6)} USDT
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Tab - Mobile Optimized */}
          <TabsContent value="deposit">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <ArrowDownLeft size={18} />
                  <span>Adicionar Saldo</span>
                </CardTitle>
                <CardDescription className="text-sm">Deposite dinheiro na sua conta Transmill</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount" className="text-sm font-medium">Valor (R$)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={depositData.amount}
                      onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                      required
                      className="input-field text-base"
                      data-testid="deposit-amount-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit-method" className="text-sm font-medium">Método de Depósito</Label>
                    <Select 
                      value={depositData.method} 
                      onValueChange={(value) => {
                        const currency = value === 'pix-usdt' ? 'USDT' : 'BRL';
                        setDepositData({ ...depositData, method: value, currency });
                      }}
                    >
                      <SelectTrigger className="input-field" data-testid="deposit-method-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">
                          <div className="flex items-center space-x-2">
                            <Smartphone size={16} />
                            <span className="text-green-600">💰</span>
                            <span>PIX → Real Brasileiro (BRL)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pix-usdt">
                          <div className="flex items-center space-x-2">
                            <Smartphone size={16} />
                            <span className="text-yellow-600">₮</span>
                            <span>PIX → USDT (com conversão)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mostrar informações de conversão se PIX-USDT selecionado */}
                  {depositData.method === 'pix-usdt' && depositData.amount && exchangeRate && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-yellow-600">ℹ️</span>
                        <span className="text-yellow-800 font-medium text-sm">Conversão BRL → USDT</span>
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p>Valor bruto: <strong>R$ {parseFloat(depositData.amount).toFixed(2)}</strong></p>
                        <p>Taxa conversão USDT (3,99%): <strong className="text-red-600">-R$ {(parseFloat(depositData.amount) * 0.0399).toFixed(2)}</strong></p>
                        <p>Valor líquido: <strong>R$ {(parseFloat(depositData.amount) * 0.9601).toFixed(2)}</strong></p>
                        <p>Receberá aproximadamente: <strong className="text-green-600">{((parseFloat(depositData.amount) * 0.9601) / exchangeRate).toFixed(6)} USDT</strong></p>
                        <p>Taxa atual: 1 USD = R$ {exchangeRate.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={depositLoading || !depositData.amount}
                    className="w-full btn-primary"
                    data-testid="deposit-submit-btn"
                  >
                    {depositLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <DollarSign size={16} />
                        <span>Depositar {depositData.amount ? formatCurrency(parseFloat(depositData.amount)) : 'R$ 0,00'}</span>
                      </div>
                    )}
                  </Button>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      🏦 <strong>Integração XGate:</strong> PIX real integrado via XGate API.
                      Gera QR Code visual e código copia e cola para pagamento instantâneo.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode size={20} />
                  <span>Pagar com QR Code</span>
                </CardTitle>
                <CardDescription>Escaneie o QR Code do lojista para efetuar pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code Scanner Section */}
                <div className="text-center space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setShowQRScanner(true)}
                      className="btn-primary w-full"
                      data-testid="scan-qr-btn"
                    >
                      <Camera size={20} />
                      <span>Escanear QR Code</span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowDigitalInput(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="digital-code-btn"
                    >
                      <span>⌨️</span>
                      <span>Código Digitável</span>
                    </Button>
                  </div>
                  
                  {(scannedQR || qrMerchantInfo) && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="space-y-2 text-green-800">
                        <div className="flex items-center justify-center space-x-2">
                          <QrCode size={16} />
                          <span className="font-medium">Código Escaneado/Inserido!</span>
                        </div>
                        {qrMerchantInfo && (
                          <div className="text-sm space-y-1">
                            <div><strong>Loja:</strong> {qrMerchantInfo.merchant_name}</div>
                            <div><strong>Cashback:</strong> {qrMerchantInfo.cashback_rate}%</div>
                            {qrMerchantInfo.amount > 0 && (
                              <div className="text-emerald-600 font-semibold">
                                <strong>Valor:</strong> {formatCurrency(qrMerchantInfo.amount)} (preenchido automaticamente)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Digital Code Input Modal */}
                {showDigitalInput && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-bold mb-4">Digite o Código Digitável</h3>
                      
                      <form onSubmit={handleDigitalCodeInput} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="digital-code">Código (formato: AGITO-XXXX-XXXX-XXXX)</Label>
                          <Input
                            id="digital-code"
                            type="text"
                            placeholder="AGITO-1234-5678-9ABC"
                            value={digitalCode}
                            onChange={(e) => setDigitalCode(e.target.value.toUpperCase())}
                            className="input-field font-mono text-center"
                            data-testid="digital-code-input"
                            maxLength={20}
                          />
                          <p className="text-xs text-gray-500">
                            Digite o código mostrado na tela do lojista
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            onClick={() => {
                              setShowDigitalInput(false);
                              setDigitalCode('');
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Cancelar
                          </Button>
                          
                          <Button
                            type="submit"
                            disabled={!digitalCode.trim()}
                            className="w-full btn-primary"
                            data-testid="validate-digital-code-btn"
                          >
                            <div className="flex items-center space-x-2">
                              <span>⌨️</span>
                              <span>Validar</span>
                            </div>
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {!readyToAuthorize ? (
                  <form onSubmit={handlePreparePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Valor (R$)</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={paymentData.amount}
                        onChange={(e) => {
                          setPaymentData({ ...paymentData, amount: e.target.value });
                          setReadyToAuthorize(false); // Reset authorization if amount changes
                        }}
                        required
                        className="input-field"
                        data-testid="payment-amount-input"
                        readOnly={qrMerchantInfo && qrMerchantInfo.amount > 0}
                      />
                      {qrMerchantInfo && qrMerchantInfo.amount > 0 && (
                        <p className="text-xs text-emerald-600">
                          ✓ Valor preenchido automaticamente pelo QR Code
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!scannedQR || !paymentData.amount || !qrMerchantInfo}
                      className="w-full btn-secondary"
                      data-testid="prepare-payment-btn"
                    >
                      <div className="flex items-center space-x-2">
                        <QrCode size={16} />
                        <span>Revisar Pagamento {paymentData.amount ? `- ${formatCurrency(parseFloat(paymentData.amount))}` : ''}</span>
                      </div>
                    </Button>
                  </form>
                ) : (
                  // Authorization Step
                  <div className="space-y-4">
                    {/* Payment Review */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                        <QrCode className="mr-2" size={20} />
                        Autorizar Pagamento
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-600">Loja:</span>
                          <span className="font-semibold text-gray-900">{qrMerchantInfo.merchant_name}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-600">Valor do Pagamento:</span>
                          <span className="font-bold text-2xl text-blue-600">
                            {formatCurrency(parseFloat(paymentData.amount))}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <span className="text-orange-800">Você receberá de cashback:</span>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(parseFloat(paymentData.amount) * (qrMerchantInfo.cashback_rate / 100) * 0.50)} ({(qrMerchantInfo.cashback_rate * 0.50).toFixed(1)}%)
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Saldo atual:</span>
                          <span className="font-semibold">{formatCurrency(balance.balance)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-red-800">Saldo após pagamento:</span>
                          <span className="font-bold text-red-600">
                            {formatCurrency(balance.balance - parseFloat(paymentData.amount) + (parseFloat(paymentData.amount) * (qrMerchantInfo.cashback_rate / 100) * 0.50))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Authorization Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setReadyToAuthorize(false)}
                        variant="outline"
                        className="w-full"
                        data-testid="cancel-payment-btn"
                      >
                        <ArrowDownLeft size={16} />
                        <span>Voltar</span>
                      </Button>
                      
                      <Button
                        onClick={handleAuthorizePayment}
                        disabled={paymentLoading || balance.balance < parseFloat(paymentData.amount)}
                        className="w-full btn-primary"
                        data-testid="authorize-payment-btn"
                      >
                        {paymentLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <DollarSign size={16} />
                            <span>Autorizar Pagamento</span>
                          </div>
                        )}
                      </Button>
                    </div>
                    
                    {balance.balance < parseFloat(paymentData.amount) && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800">
                          ❌ <strong>Saldo insuficiente.</strong> Você precisa adicionar mais R$ {formatCurrency(parseFloat(paymentData.amount) - balance.balance)} à sua conta.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {qrMerchantInfo && paymentData.amount && !readyToAuthorize && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    {(() => {
                      const cashbackAmount = paymentData.amount ? (parseFloat(paymentData.amount) * (qrMerchantInfo.cashback_rate / 100)) : 0;
                      return (
                        <div className="text-sm text-green-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Loja:</span>
                            <span className="font-medium">{qrMerchantInfo.merchant_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Cashback a receber:</span>
                            <span className="font-bold text-orange-600">
                              {formatCurrency(cashbackAmount)} ({qrMerchantInfo.cashback_rate}%)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Como pagar:</strong>
                  </p>
                  <div className="text-xs text-blue-700 mt-2 space-y-1">
                    <p>📱 <strong>Opção 1:</strong> Escaneie o QR Code gerado pelo lojista</p>
                    <p>⌨️ <strong>Opção 2:</strong> Digite o código digitável (AGITO-XXXX-XXXX-XXXX)</p>
                    <p>✅ Ambas as opções preenchem automaticamente os dados da loja e valor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Search Tab - Mobile Optimized */}
          <TabsContent value="stores">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <MapPin size={18} />
                    <span>Buscar Lojas</span>
                  </CardTitle>
                  <CardDescription className="text-sm">Encontre lojas parceiras Transmill na sua região</CardDescription>
                </CardHeader>
                <CardContent>
                  {filtersLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm">Carregando filtros...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search Filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="search-state" className="text-sm font-medium">Estado</Label>
                          <select
                            id="search-state"
                            value={searchFilters.state}
                            onChange={(e) => handleStoreSearchStateChange(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="">Todos os estados</option>
                            {storeFilters.states?.map((state) => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="search-city" className="text-sm font-medium">Cidade</Label>
                          <select
                            id="search-city"
                            value={searchFilters.city}
                            onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                            disabled={!searchFilters.state}
                          >
                            <option value="">{searchFilters.state ? "Todas as cidades" : "Selecione um estado primeiro"}</option>
                            {filteredCities.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="search-neighborhood" className="text-sm font-medium">Bairro</Label>
                          <input
                            id="search-neighborhood"
                            type="text"
                            value={searchFilters.neighborhood}
                            onChange={(e) => setSearchFilters({ ...searchFilters, neighborhood: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                            placeholder="Digite o bairro (opcional)"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="search-segment" className="text-sm font-medium">Segmento</Label>
                          <select
                            id="search-segment"
                            value={searchFilters.business_segment}
                            onChange={(e) => setSearchFilters({ ...searchFilters, business_segment: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="">Todos os segmentos</option>
                            {storeFilters.business_segments?.map((segment) => (
                              <option key={segment} value={segment}>{segment}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Search Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          onClick={searchStores}
                          disabled={searchLoading}
                          className="w-full btn-primary"
                        >
                          {searchLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Buscando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Search size={16} />
                              <span>Buscar Lojas</span>
                            </div>
                          )}
                        </Button>
                        
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="w-full btn-secondary"
                        >
                          <X size={16} />
                          <span>Limpar</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Results */}
              {stores.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 text-center p-2 bg-emerald-50 rounded-lg">
                    📍 Encontradas <strong>{stores.length}</strong> lojas parceiras
                  </div>
                  
                  {stores.map((store) => (
                    <Card key={store.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {store.profile_image ? (
                                <img
                                  src={store.profile_image}
                                  alt={`Logo ${store.company_name}`}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
                                  <Building2 className="text-emerald-600" size={20} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                {store.company_name || store.full_name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {store.address}
                              </p>
                              {store.business_segment && (
                                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {store.business_segment}
                                </span>
                              )}
                              {store.cashback_rate > 0 && (
                                <div className="mt-1">
                                  <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                                    {store.cashback_rate}% Cashback
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            {store.neighborhood && store.city && store.state && (
                              <p>📍 {store.neighborhood}, {store.city} - {store.state}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {store.whatsapp && (
                              <Button
                                onClick={() => openWhatsApp(store.whatsapp, store.company_name || store.full_name)}
                                variant="outline"
                                className="btn-secondary text-xs sm:text-sm"
                              >
                                <Phone size={14} />
                                <span className="ml-1">WhatsApp</span>
                              </Button>
                            )}
                            
                            {store.menu_catalog_url && (
                              <Button
                                onClick={() => openMenu(store.menu_catalog_url, store.company_name || store.full_name)}
                                variant="outline"
                                className="btn-secondary text-xs sm:text-sm bg-orange-50 hover:bg-orange-100 border-orange-200"
                              >
                                <ShoppingCart size={14} />
                                <span className="ml-1">Cardápio</span>
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => openMaps(store.google_maps_url, store.company_name || store.full_name)}
                              variant="outline"
                              className="btn-secondary text-xs sm:text-sm"
                            >
                              <Navigation size={14} />
                              <span className="ml-1">Como Chegar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {stores.length === 0 && !searchLoading && (
                <Card className="text-center py-8">
                  <CardContent>
                    <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Encontre lojas parceiras</h3>
                    <p className="text-gray-600 mb-4">
                      Use os filtros acima para buscar lojas na sua região.
                    </p>
                    <Button onClick={searchStores} className="btn-primary">
                      <Search size={16} />
                      <span className="ml-2">Buscar Todas as Lojas</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Service Providers Tab */}
          <TabsContent value="services">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Briefcase size={18} />
                    <span>Buscar Serviços</span>
                  </CardTitle>
                  <CardDescription className="text-sm">Encontre prestadores de serviço parceiros Transmill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="service-search">Buscar por tipo de serviço</Label>
                        <Input
                          id="service-search"
                          placeholder="Ex: Instalação Elétrica, Encanador..."
                          className="mt-1"
                          value={serviceFilters.query}
                          onChange={(e) => setServiceFilters({...serviceFilters, query: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-category">Categoria</Label>
                        <Select value={serviceFilters.category} onValueChange={(value) => setServiceFilters({...serviceFilters, category: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Todas as categorias" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            <SelectItem value="geral">Geral</SelectItem>
                            <SelectItem value="eletrica">Elétrica</SelectItem>
                            <SelectItem value="hidraulica">Hidráulica</SelectItem>
                            <SelectItem value="saude">Saúde</SelectItem>
                            <SelectItem value="domestico">Doméstico</SelectItem>
                            <SelectItem value="automotivo">Automotivo</SelectItem>
                            <SelectItem value="beleza">Beleza & Estética</SelectItem>
                            <SelectItem value="educacao">Educação</SelectItem>
                            <SelectItem value="tecnologia">Tecnologia</SelectItem>
                            <SelectItem value="construcao">Construção</SelectItem>
                            <SelectItem value="eventos">Eventos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={searchServices} disabled={servicesLoading} className="flex-1 sm:flex-initial">
                        <Search size={16} className="mr-2" />
                        {servicesLoading ? 'Buscando...' : 'Buscar Serviços'}
                      </Button>
                      <Button variant="outline" onClick={clearServiceFilters} className="flex-1 sm:flex-initial">
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services List */}
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3 text-sm">
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign size={16} />
                            <span>R$ {service.price?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock size={14} className="mr-1" />
                            <span>{service.estimated_duration} min</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {service.category}
                          </span>
                        </div>

                        <div className="border-t pt-3 mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                              {service.provider?.name?.charAt(0) || 'P'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{service.provider?.name}</p>
                              <div className="flex items-center space-x-1">
                                <Star className="text-yellow-400 fill-yellow-400" size={12} />
                                <span className="text-sm text-gray-600">
                                  {service.provider?.rating_average?.toFixed(1) || '0.0'} ({service.provider?.rating_count || 0})
                                </span>
                              </div>
                            </div>
                          </div>
                          {service.provider?.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin size={14} className="mr-1" />
                              <span>{service.provider.address.city}/{service.provider.address.state}</span>
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {service.provider?.whatsapp && (
                            <Button
                              onClick={() => openWhatsApp(service.provider.whatsapp, service.provider.name)}
                              variant="outline"
                              className="text-xs sm:text-sm"
                            >
                              <Phone size={14} />
                              <span className="ml-1">WhatsApp</span>
                            </Button>
                          )}
                          
                          {service.provider?.google_maps_url && (
                            <Button
                              onClick={() => openMaps(service.provider.google_maps_url, service.provider.name)}
                              variant="outline"
                              className="text-xs sm:text-sm"
                            >
                              <Navigation size={14} />
                              <span className="ml-1">Como Chegar</span>
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => viewServiceDetails(service.id)} 
                            className="col-span-2 sm:col-span-1 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                          >
                            <Calendar size={14} className="mr-1" />
                            <span>Agendar</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : servicesLoading ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Buscando serviços disponíveis...</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Busque serviços disponíveis</h3>
                    <p className="text-gray-600 mb-4">
                      Use os filtros acima para buscar prestadores de serviço na sua região.
                    </p>
                    <Button onClick={() => fetchServices()} className="btn-primary">
                      <Search size={16} />
                      <span className="ml-2">Ver Todos os Serviços</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Service Details Modal */}
            {showServiceModal && selectedService && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{selectedService.name}</CardTitle>
                        <CardDescription>{selectedService.description}</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setShowServiceModal(false);
                          setSelectedService(null);
                        }}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Service Details */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-gray-600">Preço</Label>
                        <p className="text-xl font-bold text-green-600">R$ {selectedService.price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Duração</Label>
                        <p className="text-xl font-bold text-blue-600">{selectedService.estimated_duration} min</p>
                      </div>
                    </div>

                    {/* Provider Info */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Sobre o Prestador</h4>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {selectedService.provider?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedService.provider?.name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="text-yellow-400 fill-yellow-400" size={14} />
                            <span className="text-sm text-gray-600">
                              {selectedService.provider?.rating_average?.toFixed(1)} ({selectedService.provider?.rating_count} avaliações)
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedService.provider?.profile_description && (
                        <p className="text-sm text-gray-600 mb-3">{selectedService.provider.profile_description}</p>
                      )}
                      {selectedService.provider?.working_hours && (
                        <div className="flex items-start space-x-2 text-sm">
                          <Clock size={14} className="mt-0.5 text-gray-400" />
                          <span className="text-gray-600">{selectedService.provider.working_hours}</span>
                        </div>
                      )}
                      {selectedService.provider?.address && (
                        <div className="flex items-start space-x-2 text-sm mt-2">
                          <MapPin size={14} className="mt-0.5 text-gray-400" />
                          <span className="text-gray-600">
                            {selectedService.provider.address.neighborhood}, {selectedService.provider.address.city}/{selectedService.provider.address.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Appointment Form */}
                    <form onSubmit={createAppointment} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Agendar Serviço</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="appointment-datetime">Data e Hora*</Label>
                          <Input
                            id="appointment-datetime"
                            type="datetime-local"
                            value={appointmentData.appointment_datetime}
                            onChange={(e) => setAppointmentData({...appointmentData, appointment_datetime: e.target.value})}
                            min={new Date().toISOString().slice(0, 16)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="client-notes">Observações</Label>
                          <textarea
                            id="client-notes"
                            value={appointmentData.client_notes}
                            onChange={(e) => setAppointmentData({...appointmentData, client_notes: e.target.value})}
                            placeholder="Descreva detalhes importantes do serviço..."
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows="3"
                          />
                        </div>
                        <Button type="submit" disabled={appointmentLoading} className="w-full">
                          {appointmentLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Agendando...
                            </>
                          ) : (
                            <>
                              <Calendar size={16} className="mr-2" />
                              Confirmar Agendamento
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* USDT Operations Tab */}
          <TabsContent value="usdt">
            <div className="space-y-6">
              {/* Saldo USDT */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins size={20} className="text-blue-600" />
                    <span>Saldo USDT</span>
                  </CardTitle>
                  <CardDescription>
                    Sua carteira digital USDT no Transmill
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Saldo Atual USDT</p>
                      <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                        {balance.usdt_balance?.toFixed(6) || '0.000000'} USDT
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        ≈ {formatCurrency((balance.usdt_balance || 0) * (exchangeRate || 5.50))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Cotação atual</p>
                      <p className="font-semibold">1 USDT = R$ {exchangeRate?.toFixed(2) || '5,50'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Última atualização</p>
                      <p className="font-semibold text-xs">{new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>💡 Como adquirir USDT:</strong> Use a aba "Depósito" e selecione "PIX → USDT (com conversão)" para converter reais em USDT.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="convert-usdt" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="convert-usdt" className="flex items-center space-x-2">
                    <ArrowUpRight size={16} />
                    <span>Converter para BRL</span>
                  </TabsTrigger>
                  <TabsTrigger value="transfer-external" className="flex items-center space-x-2">
                    <ExternalLink size={16} />
                    <span>Transferir Externa</span>
                  </TabsTrigger>
                </TabsList>

                {/* Conversão USDT → BRL */}
                <TabsContent value="convert-usdt" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign size={20} className="text-green-600" />
                        <span>Converter USDT → BRL</span>
                      </CardTitle>
                      <CardDescription>
                        Converta seu USDT para reais com taxa de 3,99%
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUsdtConversion} className="space-y-6">
                        {/* Saldo USDT disponível */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                              Saldo USDT disponível:
                            </span>
                            <span className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                              {(balance.usdt_balance || 0).toFixed(6)} USDT
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            ≈ {formatCurrency((balance.usdt_balance || 0) * (exchangeRate || 5.50))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="usdt-convert-amount">Valor em USDT a converter</Label>
                          <Input
                            id="usdt-convert-amount"
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            max={balance.usdt_balance || 0}
                            placeholder="0.000000"
                            value={usdtData.usdt_amount}
                            onChange={(e) => {
                              const usdtAmount = parseFloat(e.target.value) || 0;
                              const brlAmount = usdtAmount * (exchangeRate || 5.50);
                              setUsdtData({
                                usdt_amount: e.target.value,
                                brl_amount: brlAmount.toFixed(2)
                              });
                            }}
                            required
                            className="font-mono"
                          />
                        </div>

                        {/* Calculadora de conversão */}
                        {usdtData.usdt_amount && parseFloat(usdtData.usdt_amount) > 0 && exchangeRate && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                              💰 Resumo da Conversão
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Valor em USDT:</span>
                                <span>{parseFloat(usdtData.usdt_amount).toFixed(6)} USDT</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Valor bruto em BRL:</span>
                                <span>R$ {(parseFloat(usdtData.usdt_amount) * exchangeRate).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Taxa conversão (3,99%):</span>
                                <span className="text-red-600">-R$ {((parseFloat(usdtData.usdt_amount) * exchangeRate) * 0.0399).toFixed(2)}</span>
                              </div>
                              <hr className="border-green-200 dark:border-green-800" />
                              <div className="flex justify-between font-semibold">
                                <span className="text-green-600 dark:text-green-400">Receberá em BRL:</span>
                                <span className="text-green-600 dark:text-green-400">
                                  R$ {((parseFloat(usdtData.usdt_amount) * exchangeRate) * 0.9601).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Cotação USDT/BRL:</span>
                                <span>R$ {exchangeRate.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={usdtLoading || !usdtData.usdt_amount || parseFloat(usdtData.usdt_amount) <= 0 || parseFloat(usdtData.usdt_amount) > (balance.usdt_balance || 0)}
                        >
                          {usdtLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Convertendo...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <DollarSign size={16} />
                              <span>Converter {usdtData.usdt_amount ? parseFloat(usdtData.usdt_amount).toFixed(6) : '0.000000'} USDT para BRL</span>
                            </div>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Transferência Externa USDT */}
                <TabsContent value="transfer-external" className="mt-6">
                  <USDTTransfer 
                    userBalance={balance.usdt_balance || 0}
                    onTransferSuccess={(data) => {
                      toast.success(data.message);
                      fetchUserData();
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Withdrawal Tab */}
          <TabsContent value="withdrawal">
            <WithdrawalForm 
              userBalance={balance.total || 0}
              onWithdrawalSuccess={(data) => {
                toast.success(data.message || 'Saque solicitado com sucesso!');
                fetchUserData();
              }}
            />
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <ReferralSystem />
          </TabsContent>
        </Tabs>
        
        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScanResult={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User size={20} />
                <span>Meu Perfil</span>
              </DialogTitle>
              <DialogDescription>
                Gerencie suas informações pessoais e configurações de conta
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User size={20} />
                    <span>Dados Pessoais</span>
                  </CardTitle>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload de Foto */}
                  <div className="text-center space-y-4">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Foto de perfil"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 mx-auto">
                        <User className="text-gray-400" size={32} />
                      </div>
                    )}
                    
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG - máx. 2MB
                      </p>
                    </div>
                  </div>

                  {/* Formulário de Dados */}
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Nome Completo</Label>
                      <Input
                        id="profile-name"
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Telefone</Label>
                      <Input
                        id="profile-phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="input-field"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-cpf">CPF</Label>
                      <Input
                        id="profile-cpf"
                        type="text"
                        value={profileData.cpf}
                        onChange={handleCPFChange}
                        className="input-field"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    {/* === SEÇÃO DADOS PIX === */}
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                        <CreditCard className="mr-2" size={16} />
                        Dados PIX para Saque
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-pix-type">Tipo da Chave PIX</Label>
                          <Select 
                            value={profileData.pix_key_type} 
                            onValueChange={(value) => setProfileData({...profileData, pix_key_type: value})}
                          >
                            <SelectTrigger className="input-field">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cpf">CPF</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="random">Chave Aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-pix-key">Chave PIX</Label>
                          <Input
                            id="profile-pix-key"
                            type="text"
                            value={profileData.pix_key}
                            onChange={(e) => setProfileData({ ...profileData, pix_key: e.target.value })}
                            className="input-field"
                            placeholder={
                              profileData.pix_key_type === 'cpf' ? '000.000.000-00' :
                              profileData.pix_key_type === 'email' ? 'email@exemplo.com' :
                              profileData.pix_key_type === 'phone' ? '(11) 99999-9999' :
                              'Chave PIX'
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* === SEÇÃO ENDEREÇO === */}
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                        <MapPin className="mr-2" size={16} />
                        Endereço Completo
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-cep">CEP</Label>
                          <Input
                            id="profile-cep"
                            type="text"
                            value={profileData.cep}
                            onChange={(e) => setProfileData({ ...profileData, cep: e.target.value })}
                            className="input-field"
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="profile-street">Rua</Label>
                          <Input
                            id="profile-street"
                            type="text"
                            value={profileData.street}
                            onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                            className="input-field"
                            placeholder="Nome da rua"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-number">Número</Label>
                          <Input
                            id="profile-number"
                            type="text"
                            value={profileData.number}
                            onChange={(e) => setProfileData({ ...profileData, number: e.target.value })}
                            className="input-field"
                            placeholder="123"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-neighborhood">Bairro</Label>
                          <Input
                            id="profile-neighborhood"
                            type="text"
                            value={profileData.neighborhood}
                            onChange={(e) => setProfileData({ ...profileData, neighborhood: e.target.value })}
                            className="input-field"
                            placeholder="Nome do bairro"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-complement">Complemento</Label>
                          <Input
                            id="profile-complement"
                            type="text"
                            value={profileData.complement}
                            onChange={(e) => setProfileData({ ...profileData, complement: e.target.value })}
                            className="input-field"
                            placeholder="Apto, casa, etc."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-city">Cidade</Label>
                          <Input
                            id="profile-city"
                            type="text"
                            value={profileData.city}
                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                            className="input-field"
                            placeholder="Nome da cidade"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profile-state">Estado</Label>
                          <Input
                            id="profile-state"
                            type="text"
                            value={profileData.state}
                            onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                            className="input-field"
                            placeholder="SP, RJ, MG..."
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* === SEÇÃO EMPRESA (APENAS LOJISTAS) === */}
                    {user?.user_type === 'lojista' && (
                      <>
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                            <Building2 className="mr-2" size={16} />
                            Dados da Empresa
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="profile-company">Nome da Empresa</Label>
                              <Input
                                id="profile-company"
                                type="text"
                                value={profileData.company_name}
                                onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                                className="input-field"
                                placeholder="Nome da sua empresa"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-cnpj">CNPJ</Label>
                              <Input
                                id="profile-cnpj"
                                type="text"
                                value={profileData.cnpj}
                                onChange={(e) => setProfileData({ ...profileData, cnpj: e.target.value })}
                                className="input-field"
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-whatsapp">WhatsApp da Empresa</Label>
                              <Input
                                id="profile-whatsapp"
                                type="tel"
                                value={profileData.whatsapp}
                                onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                                className="input-field"
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-segment">Segmento de Negócio</Label>
                              <Input
                                id="profile-segment"
                                type="text"
                                value={profileData.business_segment}
                                onChange={(e) => setProfileData({ ...profileData, business_segment: e.target.value })}
                                className="input-field"
                                placeholder="Ex: Restaurante, Loja..."
                              />
                            </div>
                            
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="profile-maps">Link do Google Maps</Label>
                              <Input
                                id="profile-maps"
                                type="url"
                                value={profileData.google_maps_url}
                                onChange={(e) => setProfileData({ ...profileData, google_maps_url: e.target.value })}
                                className="input-field"
                                placeholder="https://maps.google.com/..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* === SÓCIO ADMINISTRADOR === */}
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                            <User className="mr-2" size={16} />
                            Sócio Administrador
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="profile-admin-name">Nome Completo</Label>
                              <Input
                                id="profile-admin-name"
                                type="text"
                                value={profileData.admin_name}
                                onChange={(e) => setProfileData({ ...profileData, admin_name: e.target.value })}
                                className="input-field"
                                placeholder="Nome do sócio"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-admin-cpf">CPF do Sócio</Label>
                              <Input
                                id="profile-admin-cpf"
                                type="text"
                                value={profileData.admin_cpf}
                                onChange={(e) => setProfileData({ ...profileData, admin_cpf: e.target.value })}
                                className="input-field"
                                placeholder="000.000.000-00"
                                maxLength={14}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-admin-email">E-mail do Sócio</Label>
                              <Input
                                id="profile-admin-email"
                                type="email"
                                value={profileData.admin_email}
                                onChange={(e) => setProfileData({ ...profileData, admin_email: e.target.value })}
                                className="input-field"
                                placeholder="email@exemplo.com"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="profile-admin-whatsapp">WhatsApp do Sócio</Label>
                              <Input
                                id="profile-admin-whatsapp"
                                type="tel"
                                value={profileData.admin_whatsapp}
                                onChange={(e) => setProfileData({ ...profileData, admin_whatsapp: e.target.value })}
                                className="input-field"
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full btn-primary"
                    >
                      {profileLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Salvando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Settings size={16} />
                          <span>Salvar Dados</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Alterar Senha */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings size={20} />
                    <span>Alterar Senha</span>
                  </CardTitle>
                  <CardDescription>Atualize sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          className="input-field pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="input-field pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="input-field"
                        required
                      />
                      {passwordData.new_password && passwordData.confirm_password && 
                       passwordData.new_password !== passwordData.confirm_password && (
                        <p className="text-xs text-red-500">As senhas não conferem</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={profileLoading || !passwordData.current_password || !passwordData.new_password || 
                               passwordData.new_password !== passwordData.confirm_password}
                      className="w-full btn-primary"
                    >
                      {profileLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Atualizando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Settings size={16} />
                          <span>Alterar Senha</span>
                        </div>
                      )}
                    </Button>
                  </form>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Dica de Segurança:</strong> Use uma senha forte com pelo menos 6 caracteres, incluindo números e letras.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* PIX QR Code Modal */}
        <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <QrCode size={20} />
                <span>PIX Gerado - Depósito {pixDetails?.currency || 'BRL'}</span>
              </DialogTitle>
              <DialogDescription>
                {pixDetails?.currency === 'USDT' 
                  ? 'Pague o PIX em BRL e receba o valor convertido em USDT na sua conta'
                  : 'Escaneie o QR Code ou use o código copia e cola para finalizar o pagamento'
                }
              </DialogDescription>
            </DialogHeader>
            
            {pixDetails && (
              <div className="space-y-6">
                {/* Payment Info */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium">Valor a Pagar (PIX):</p>
                      <p className="text-lg font-bold text-green-800">R$ {pixDetails.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">
                        {pixDetails?.currency === 'USDT' ? 'Receberá em USDT:' : 'Status:'}
                      </p>
                      <p className="text-green-800">
                        {pixDetails?.currency === 'USDT' 
                          ? `${pixDetails.usdt_amount?.toFixed(6)} USDT` 
                          : 'Aguardando pagamento'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {pixDetails?.currency === 'USDT' && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-blue-700 font-medium text-xs">Taxa de Conversão:</p>
                      <p className="text-blue-800 text-xs">1 USD = R$ {pixDetails.exchange_rate?.toFixed(2)}</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-green-700 font-medium text-xs">Chave PIX:</p>
                    <p className="text-green-800 text-xs break-all">{pixDetails.pix_key}</p>
                  </div>
                </div>

                {/* QR Code Display */}
                {pixDetails.qr_code_image && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                      <img 
                        src={pixDetails.qr_code_image} 
                        alt="QR Code PIX" 
                        className="mx-auto max-w-full h-auto"
                        style={{ maxWidth: '300px', maxHeight: '300px' }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Escaneie este código com o app do seu banco
                    </p>
                  </div>
                )}

                {/* Copy and Paste Code */}
                {pixDetails.pix_copy_paste && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Código Copia e Cola:</Label>
                      <Button 
                        onClick={copyPixCode}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        <span className="mr-1">📋</span> Copiar
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                        {pixDetails.pix_copy_paste}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Cole este código na área PIX do seu banco
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Abra o app do seu banco</li>
                    <li>2. Vá na área PIX</li>
                    <li>3. Escaneie o QR Code OU cole o código acima</li>
                    <li>4. Confirme o valor (R$ {pixDetails.amount?.toFixed(2)}) e finalize</li>
                    <li>5. Seu saldo será creditado automaticamente</li>
                  </ol>
                </div>

                {/* Timer */}
                {pixDetails.expires_at && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Este PIX expira em 30 minutos
                    </p>
                    <p className="text-xs text-gray-400">
                      Expira às: {new Date(pixDetails.expires_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setShowPixModal(false)}
                    variant="outline" 
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={copyPixCode}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <span className="mr-2">📋</span>
                    Copiar Código PIX
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClientDashboard;