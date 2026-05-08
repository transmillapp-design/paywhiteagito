import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Smartphone,
  Zap,
  DollarSign,
  User,
  Store,
  Wifi,
  Phone,
  MapPin,
  Search,
  Plus,
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  Camera,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import QRScannerNew from './QRScannerNew';
import { useTheme } from '../hooks/useTheme';

const PaymentPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  // Estados para QR Code e pagamento
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showDigitalInput, setShowDigitalInput] = useState(false);
  const [digitalCode, setDigitalCode] = useState('');
  const [qrMerchantInfo, setQrMerchantInfo] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('scan'); // 'scan', 'confirm', 'success'
  
  // Estados adicionais para busca e pagamentos
  const [recentPayments, setRecentPayments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [recipientType, setRecipientType] = useState('');
  const [amount, setAmount] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      // Simulação de pagamentos recentes - pode ser substituído por endpoint real
      const mockPayments = [
        {
          id: 1,
          recipient: 'Padaria Central',
          type: 'merchant',
          amount: 25.50,
          date: '2024-10-10',
          icon: Store
        },
        {
          id: 2,
          recipient: 'Internet Móvel - Plano 5GB',
          type: 'service',
          amount: 35.90,
          date: '2024-10-09',
          icon: Wifi
        },
        {
          id: 3,
          recipient: 'Dr. João Silva',
          type: 'service_provider',
          amount: 150.00,
          date: '2024-10-08',
          icon: User
        }
      ];
      setRecentPayments(mockPayments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos recentes:', error);
    }
  };

  const searchRecipients = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Buscar lojistas
      const merchantsResponse = await fetch(`${API}/stores?limit=5`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Buscar prestadores
      const providersResponse = await fetch(`${API}/prestadores?limit=5`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const merchants = await merchantsResponse.json();
      const providers = await providersResponse.json();

      const results = [
        ...(merchants.stores || []).filter(store => 
          store.name.toLowerCase().includes(query.toLowerCase())
        ).map(store => ({
          ...store,
          type: 'merchant',
          icon: Store
        })),
        ...(providers.prestadores || []).filter(provider => 
          provider.name.toLowerCase().includes(query.toLowerCase())
        ).map(provider => ({
          ...provider,
          type: 'service_provider', 
          icon: User
        }))
      ];

      setSearchResults(results.slice(0, 8));
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchRecipients(query);
  };

  const selectRecipient = (selectedRecipient) => {
    setRecipient(selectedRecipient);
    setRecipientType(selectedRecipient.type);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Função para lidar com QR Code escaneado
  const handleQRScan = (qrCode) => {
    setShowQRScanner(false);
    
    try {
      if (qrCode.startsWith('transmill_')) {
        // Decodificar QR Code Transmill
        const encoded = qrCode.replace('transmill_', '');
        const decoded = JSON.parse(atob(encoded));
        
        setQrMerchantInfo(decoded);
        setPaymentStep('confirm');
        
        toast.success(`QR Code escaneado! ${decoded.merchant_name}`);
        
      } else {
        toast.error('QR Code inválido. Use apenas QR Codes do Transmill.');
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      toast.error('QR Code inválido');
    }
  };

  // Função para lidar com código digitável
  const handleDigitalCodeInput = async (e) => {
    e.preventDefault();
    
    if (!digitalCode.trim()) {
      toast.error('Digite o código digitável');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/transactions/validate-digital-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ digital_code: digitalCode.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.valid && data.qr_code) {
          setShowDigitalInput(false);
          setDigitalCode('');
          handleQRScan(data.qr_code);
        } else {
          toast.error('Código digitável inválido ou expirado');
        }
      } else {
        toast.error('Erro ao validar código digitável');
      }
    } catch (error) {
      console.error('Erro ao validar código:', error);
      toast.error('Erro ao conectar com servidor');
    }
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    
    if (!qrMerchantInfo) {
      toast.error('Dados de pagamento não encontrados');
      setPaymentProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/transactions/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: qrMerchantInfo.amount,
          payment_method: 'qr_code',
          qr_code: `transmill_${btoa(JSON.stringify(qrMerchantInfo))}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Pagamento realizado com sucesso! R$ ${qrMerchantInfo.amount.toFixed(2)}`);
        setPaymentStep('success');
        
        // Reset após alguns segundos
        setTimeout(() => {
          setPaymentStep('scan');
          setQrMerchantInfo(null);
        }, 3000);
        
      } else {
        toast.error(data.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
            <CreditCard size={20} />
            Pagar
          </h1>
          <Badge variant="secondary" className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
            Cliente
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {paymentStep === 'scan' && (
          <>
            {/* Saldo Disponível */}
            <Card className={`text-white ${
              isDarkMode 
                ? 'bg-[#556B2F] border border-[#005B9C]' 
                : 'bg-[#005B9C] border border-[#005B9C]'
            }`}>
              <CardContent className="p-6 text-center">
                <Wallet className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`} />
                <h2 className="text-xl font-bold mb-2">Seu Saldo</h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-3xl font-bold">{formatCurrency(user?.balance || 0)}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Saldo Principal</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{formatCurrency(user?.cashback_balance || 0)}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#FFFFFF]'}`}>Saldo Cashback</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Scanner */}
            <Card className={isDarkMode ? 'bg-[#3F5123] border border-[#005B9C]' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={`text-lg flex items-center justify-center gap-3 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                  <QrCode size={24} />
                  Como você quer pagar?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg"
                >
                  <Camera size={24} />
                  <span>Escanear QR Code</span>
                </Button>
                
                <Button
                  onClick={() => setShowDigitalInput(true)}
                  variant="outline"
                  className="w-full border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-14 text-lg"
                >
                  <span className="text-2xl">⌨️</span>
                  <span>Digitar Código</span>
                </Button>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card className={
              isDarkMode 
                ? 'bg-[#3F5123] border-[#005B9C]' 
                : 'bg-[#FFFFFF] border-[#005B9C]'
            }>
              <CardContent className="p-4">
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>💡 Como pagar</h4>
                <div className={`space-y-1 text-sm ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                  <div>• Escaneie o QR Code mostrado pelo lojista</div>
                  <div>• OU digite o código informado pelo lojista</div>
                  <div>• O valor será preenchido automaticamente</div>
                  <div>• Confirme o pagamento para finalizar</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {paymentStep === 'confirm' && qrMerchantInfo && (
          <>
            {/* Dados da Venda */}
            <Card className="border-2 border-emerald-200">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="text-lg flex items-center justify-center gap-2 text-emerald-800">
                  <CheckCircle size={24} />
                  Confirmar Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(qrMerchantInfo.amount)}
                    </p>
                    <p className="text-sm text-gray-600">Valor da compra</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-800">{qrMerchantInfo.merchant_name}</p>
                    <p className="text-sm text-emerald-600">Cashback: {qrMerchantInfo.cashback_rate}%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={processPayment}
                    disabled={paymentProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg"
                  >
                    {paymentProcessing ? 'Processando...' : 'Confirmar Pagamento'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setPaymentStep('scan');
                      setQrMerchantInfo(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal de Código Digitável */}
        {showDigitalInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <QrCode size={20} />
                Digite o Código Digitável
              </h3>
              
              <form onSubmit={handleDigitalCodeInput} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Código (formato: AGITO-XXXX-XXXX-XXXX)
                  </label>
                  <Input
                    type="text"
                    placeholder="AGITO-1234-5678-9ABC"
                    value={digitalCode}
                    onChange={(e) => setDigitalCode(e.target.value.toUpperCase())}
                    className="font-mono text-center"
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
                    <X size={16} />
                    <span>Cancelar</span>
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!digitalCode.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check size={16} />
                    <span>Validar</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerNew
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default PaymentPage;