import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
  Delete,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  Copy,
  Check,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const POSPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  // Estados removidos: customerInfo e showCustomerForm não são mais necessários
  const [paymentMethod, setPaymentMethod] = useState('');
  const [purchasing, setPurchasing] = useState(null);
  const [paymentCode, setPaymentCode] = useState('');
  const [qrData, setQrData] = useState('');
  const [chargeDetails, setChargeDetails] = useState(null);
  const [showPaymentCode, setShowPaymentCode] = useState(false);
  
  // Estados para interface do QR Code e código digitável
  const [qrCodeString, setQrCodeString] = useState('');
  const [digitalCode, setDigitalCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [showQrDetails, setShowQrDetails] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const resetCharge = () => {
    setPaymentCode('');
    setQrData('');
    setChargeDetails(null);
    setShowPaymentCode(false);
    setQrCodeString('');
    setDigitalCode('');
    setCodeCopied(false);
    setQrCopied(false);
    setShowQrDetails(true);
    setTimeRemaining(0);
    clearDisplay();
  };

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperator = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperator);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case 'x':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const deleteLastDigit = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const generatePaymentCode = async () => {
    const amount = parseFloat(display);
    
    if (amount <= 0) {
      toast.error('Valor inválido para cobrança');
      return;
    }

    setPurchasing('generating');

    try {
      const token = localStorage.getItem('token');
      
      // Primeiro gerar QR Code com valor usando endpoint merchant/qr-code
      const qrResponse = await fetch(`${API}/merchant/qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!qrResponse.ok) {
        const errorData = await qrResponse.json();
        throw new Error(errorData.detail || 'Erro ao gerar QR Code');
      }

      const qrResult = await qrResponse.json();
      
      // Também gerar cobrança POS para compatibilidade
      const posResponse = await fetch(`${API}/pos/generate-charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          description: `Cobrança ${user?.company_name || user?.full_name || 'POS'}`,
          customer_info: {}
        })
      });

      const posData = await posResponse.json();
      
      if (posData.success) {
        // Configurar dados do QR Code e código digitável
        setQrCodeString(qrResult.qr_code);
        setDigitalCode(qrResult.digital_code);
        setPaymentCode(posData.payment_code);
        setQrData(JSON.stringify(posData.qr_data));
        setChargeDetails({
          ...posData,
          qr_code: qrResult.qr_code,
          digital_code: qrResult.digital_code,
          merchant_name: qrResult.merchant_name,
          cashback_rate: qrResult.cashback_rate
        });
        setShowPaymentCode(true);
        
        // Configurar timer de expiração (30 minutos = 1800 segundos)
        setTimeRemaining(1800);
        
        toast.success('QR Code e código de pagamento gerados!');
      } else {
        toast.error(posData.message || 'Erro ao gerar código de pagamento');
      }
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      toast.error('Erro ao conectar com o servidor: ' + error.message);
    } finally {
      setPurchasing(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para copiar código digitável
  const copyDigitalCode = async () => {
    try {
      await navigator.clipboard.writeText(digitalCode);
      setCodeCopied(true);
      toast.success('Código digitável copiado!');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  // Função para copiar QR Code (string)
  const copyQrCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeString);
      setQrCopied(true);
      toast.success('QR Code copiado!');
      setTimeout(() => setQrCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar QR Code');
    }
  };

  // Função para formatar tempo restante
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer para contagem regressiva
  React.useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            toast.warning('Código de pagamento expirado!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const CalculatorButton = ({ onClick, className = "", children, variant = "outline" }) => (
    <Button
      onClick={onClick}
      variant={variant}
      className={`h-14 text-lg font-semibold ${className}`}
    >
      {children}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calculator size={20} />
            POS - Ponto de Venda
          </h1>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {user?.user_type === 'lojista' ? 'Lojista' : 'Prestador'}
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Display */}
        <Card>
          <CardContent className="p-6">
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Valor da Cobrança</div>
              <div className="text-3xl font-bold text-gray-800 break-words">
                {formatCurrency(parseFloat(display) || 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Display: {display}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculator Grid */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {/* Row 1 */}
              <CalculatorButton onClick={clearDisplay} className="bg-red-100 text-red-700 hover:bg-red-200">
                C
              </CalculatorButton>
              <CalculatorButton onClick={deleteLastDigit} className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                <Delete size={18} />
              </CalculatorButton>
              <CalculatorButton onClick={() => inputOperator('÷')} className="bg-[#F5F5F5] text-[#005B9C] hover:bg-[#005B9C]">
                <Divide size={18} />
              </CalculatorButton>
              <CalculatorButton onClick={() => inputOperator('x')} className="bg-[#F5F5F5] text-[#005B9C] hover:bg-[#005B9C]">
                <X size={18} />
              </CalculatorButton>

              {/* Row 2 */}
              <CalculatorButton onClick={() => inputNumber(7)}>7</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(8)}>8</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(9)}>9</CalculatorButton>
              <CalculatorButton onClick={() => inputOperator('-')} className="bg-[#F5F5F5] text-[#005B9C] hover:bg-[#005B9C]">
                <Minus size={18} />
              </CalculatorButton>

              {/* Row 3 */}
              <CalculatorButton onClick={() => inputNumber(4)}>4</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(5)}>5</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(6)}>6</CalculatorButton>
              <CalculatorButton onClick={() => inputOperator('+')} className="bg-[#F5F5F5] text-[#005B9C] hover:bg-[#005B9C]">
                <Plus size={18} />
              </CalculatorButton>

              {/* Row 4 */}
              <CalculatorButton onClick={() => inputNumber(1)}>1</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(2)}>2</CalculatorButton>
              <CalculatorButton onClick={() => inputNumber(3)}>3</CalculatorButton>
              <CalculatorButton 
                onClick={performCalculation} 
                className="row-span-2 bg-green-100 text-green-700 hover:bg-green-200"
                variant="outline"
              >
                <Equal size={18} />
              </CalculatorButton>

              {/* Row 5 */}
              <CalculatorButton onClick={() => inputNumber(0)} className="col-span-2">
                0
              </CalculatorButton>
              <CalculatorButton onClick={inputDecimal}>.</CalculatorButton>
            </div>
          </CardContent>
        </Card>

        {/* Quick Amount Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Valores Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 50, 100, 200, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDisplay(amount.toString())}
                  className="text-sm"
                >
                  R$ {amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard size={16} />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button
              onClick={generatePaymentCode}
              className="w-full bg-[#005B9C] hover:bg-[#005B9C]"
              disabled={parseFloat(display) <= 0 || purchasing === 'generating'}
            >
              <QrCode className="mr-2" size={18} />
              {purchasing === 'generating' ? 'Gerando...' : 'Gerar Código de Pagamento'}
            </Button>
            
            {/* Other payment methods removed - now using universal payment code */}
          </CardContent>
        </Card>

        {/* QR Code Display */}
        {showPaymentCode && qrCodeString && (
          <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-emerald-600" />
                  <span className="text-emerald-800">Pagamento Gerado</span>
                </div>
                <div className="flex items-center gap-2">
                  {timeRemaining > 0 && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      <Clock size={12} className="mr-1" />
                      {formatTimeRemaining(timeRemaining)}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQrDetails(!showQrDetails)}
                  >
                    {showQrDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            {showQrDetails && (
              <CardContent className="space-y-4">
                {/* Valor e Lojista */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(chargeDetails?.amount || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {chargeDetails?.merchant_name}
                  </div>
                  {chargeDetails?.cashback_rate && (
                    <div className="text-xs text-emerald-600 font-medium">
                      Cashback: {chargeDetails.cashback_rate}%
                    </div>
                  )}
                </div>

                {/* QR Code Visual */}
                <div className="bg-white p-4 rounded-lg shadow-inner flex justify-center">
                  <QRCodeSVG
                    value={qrCodeString}
                    size={200}
                    level="M"
                    includeMargin={true}
                    className="border border-gray-200 rounded"
                  />
                </div>

                {/* Código Digitável */}
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Código Digitável:
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-lg tracking-wide text-center">
                      {digitalCode}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={copyDigitalCode}
                      variant="outline"
                      className="text-sm"
                      disabled={!digitalCode}
                    >
                      {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                      <span>
                        {codeCopied ? 'Copiado!' : 'Copiar Código'}
                      </span>
                    </Button>
                    
                    <Button
                      onClick={copyQrCode}
                      variant="outline"
                      className="text-sm"
                      disabled={!qrCodeString}
                    >
                      {qrCopied ? <Check size={16} /> : <Copy size={16} />}
                      <span>
                        {qrCopied ? 'Copiado!' : 'Copiar QR'}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Instruções */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>📱 Para o cliente pagar:</strong>
                  </div>
                  <div className="text-xs text-blue-700 mt-1 space-y-1">
                    <div>• Escaneie o QR Code com a câmera do app Transmill</div>
                    <div>• OU digite o código no app: <span className="font-mono">{digitalCode}</span></div>
                    <div>• OU copie e cole o código inteiro</div>
                  </div>
                </div>

                {/* Botões de Controle */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={resetCharge}
                    variant="outline"
                    className="flex-1"
                  >
                    <Receipt size={16} />
                    <span>Nova Cobrança</span>
                  </Button>
                  
                  <Button
                    onClick={() => setShowPaymentCode(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X size={16} />
                    <span>Fechar</span>
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Como gerar cobrança de venda</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div>1️⃣ Digite o valor da venda na calculadora</div>
              <div>2️⃣ Clique em "Gerar Código de Pagamento"</div>
              <div>3️⃣ Mostre o QR Code para o cliente escanear</div>
              <div>4️⃣ OU forneça o código digitável para inserir manualmente</div>
              <div>5️⃣ Cliente confirma pagamento no app Transmill</div>
              <div>6️⃣ Receba confirmação e consulte seu extrato</div>
              <div className="pt-1 text-emerald-700">✨ Cashback distribuído automaticamente!</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSPage;