import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  QrCode,
  Copy,
  CheckCircle
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { useTheme } from '../../hooks/useTheme';

const DepositoPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [depositData, setDepositData] = useState({
    amount: '',
    method: 'pix',
    currency: 'BRL'
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [pixDetails, setPixDetails] = useState(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });
  
  // Credit Card states
  const [cardData, setCardData] = useState({
    card_number: '',
    card_holder: '',
    card_expiry: '',
    card_cvv: '',
    installments: 1
  });
  const [creditCardFees, setCreditCardFees] = useState({});
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchExchangeRate();
    fetchUserBalance();
    fetchCreditCardFees();
  }, []);

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

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, { headers });
      
      if (response?.data) {
        const userData = response.data;
        setBalance({
          brl: (userData.balance || 0) + (userData.cashback_balance || 0),
          usdt: userData.usdt_balance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchCreditCardFees = async () => {
    try {
      const response = await axios.get(`${API}/master/credit-card-fees`, { headers });
      if (response.data.success) {
        setCreditCardFees(response.data.fees);
      }
    } catch (error) {
      console.error('Error fetching credit card fees:', error);
    }
  };

  const handleCreditCardDeposit = async (e) => {
    e.preventDefault();
    setDepositLoading(true);

    try {
      const amount = parseFloat(depositData.amount);
      
      // Validate amount
      if (amount < 100) {
        alert('Valor mínimo para depósito via cartão: R$ 100,00');
        setDepositLoading(false);
        return;
      }
      
      const response = await axios.post(
        `${API}/deposit/credit-card`,
        {
          amount: amount,
          installments: parseInt(cardData.installments),
          card_number: cardData.card_number.replace(/\s/g, ''),
          card_holder: cardData.card_holder,
          card_expiry: cardData.card_expiry,
          card_cvv: cardData.card_cvv
        },
        { headers }
      );
      
      if (response.data.success) {
        alert(`✅ Depósito aprovado!\n\nValor depositado: R$ ${response.data.amount_deposited.toFixed(2)}\nValor total cobrado: R$ ${response.data.amount_charged.toFixed(2)}\nParcelas: ${response.data.installments}x de R$ ${response.data.installment_value.toFixed(2)}`);
        
        // Reset form
        setDepositData({ amount: '', method: 'pix', currency: 'BRL' });
        setCardData({
          card_number: '',
          card_holder: '',
          card_expiry: '',
          card_cvv: '',
          installments: 1
        });
        setShowCreditCardForm(false);
        
        // Refresh balance
        fetchUserBalance();
      }
    } catch (error) {
      console.error('Error processing credit card deposit:', error);
      alert(error.response?.data?.detail || 'Erro ao processar pagamento com cartão');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    // Se for cartão de crédito, mostrar formulário
    if (depositData.method === 'credit-card') {
      const amount = parseFloat(depositData.amount);
      if (amount < 100) {
        alert('Valor mínimo para depósito via cartão: R$ 100,00');
        return;
      }
      setShowCreditCardForm(true);
      return;
    }
    
    setDepositLoading(true);

    try {
      let response;
      const amount = parseFloat(depositData.amount);
      
      if (depositData.method === 'pix') {
        response = await axios.post(`${API}/xgate/pix-deposit`, 
          { 
            amount: amount,
            description: `Depósito Transmill via PIX - R$ ${amount.toFixed(2)}`
          },
          { headers }
        );
      } else if (depositData.method === 'pix-usdt') {
        response = await axios.post(`${API}/xgate/convert-brl-usdt`, 
          { 
            brl_amount: amount
          },
          { headers }
        );
      }
      
      if (response.data.success) {
        const pixData = response.data.data;
        
        setPixDetails({
          ...pixData,
          currency: depositData.method === 'pix-usdt' ? 'USDT' : 'BRL',
          original_amount: amount
        });
        setShowPixModal(true);
        
        setDepositData({ amount: '', method: 'pix', currency: 'BRL' });
      } else {
        throw new Error(response.data.error);
      }
      
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Erro ao realizar depósito: ' + error.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Fazer Depósito</h1>
          <Badge variant="secondary" className={isDarkMode ? 'bg-[#556B2F] text-white' : 'bg-[#005B9C] text-white'}>
            PIX Instantâneo
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="mr-2" size={20} />
              Saldo Atual
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-green-100 text-xs uppercase tracking-wide">Saldo BRL</p>
                <p className="text-white text-xl font-bold">{formatCurrency(balance.brl)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-green-100 text-xs uppercase tracking-wide">Saldo USDT</p>
                <p className="text-white text-xl font-bold">{balance.usdt.toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowDownLeft size={20} />
              <span>Fazer Depósito via PIX</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Valor do Depósito (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <Label>Tipo de Depósito</Label>
                  <select
                    value={depositData.method}
                    onChange={(e) => setDepositData({ ...depositData, method: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="pix">PIX → BRL (direto em reais)</option>
                    <option value="pix-usdt">PIX → USDT (com conversão)</option>
                    <option value="credit-card">PIX → Cartão de Crédito</option>
                  </select>
                </div>
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

              {/* Aviso mínimo cartão de crédito */}
              {depositData.method === 'credit-card' && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="text-orange-600" size={16} />
                    <span className="text-orange-800 font-medium text-sm">Depósito via Cartão de Crédito</span>
                  </div>
                  <div className="text-xs text-orange-700 space-y-1">
                    <p>✅ Valor mínimo: <strong>R$ 100,00</strong></p>
                    <p>💳 Parcele em até 12x</p>
                    <p>🔒 Pagamento 100% seguro (MOCK)</p>
                    {depositData.amount >= 100 && (
                      <p className="text-green-700 mt-2">
                        ✨ Pronto! Clique em continuar para preencher os dados do cartão
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={depositLoading || !depositData.amount || parseFloat(depositData.amount) <= 0}
                className="w-full"
              >
                {depositLoading ? 
                  'Processando...' : 
                  depositData.method === 'credit-card' ? 
                    'Continuar para Pagamento' : 
                    'Gerar PIX para Depósito'
                }
              </Button>
            </form>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>PIX → BRL:</strong> Valor depositado diretamente em reais na sua conta</li>
                <li>• <strong>PIX → USDT:</strong> Valor convertido automaticamente para USDT com taxa de 3,99%</li>
                <li>• <strong>PIX → Cartão de Crédito:</strong> Deposite usando seu cartão, parcele em até 12x com taxas configuráveis. Valor mínimo R$ 100,00. Saldo creditado instantaneamente!</li>
                <li>• PIX é gerado instantaneamente após confirmar (exceto cartão)</li>
                <li>• Saldo é creditado automaticamente após pagamento</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* PIX Modal */}
        {showPixModal && pixDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode size={20} />
                  <span>PIX Gerado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border">
                    {/* Usar QR Code base64 se disponível, senão gerar do código PIX */}
                    {pixDetails.qr_code_image ? (
                      <img 
                        src={pixDetails.qr_code_image.startsWith('data:') ? pixDetails.qr_code_image : `data:image/png;base64,${pixDetails.qr_code_base64 || pixDetails.qr_code_image}`}
                        alt="QR Code PIX"
                        className="mx-auto"
                        style={{ width: 200, height: 200 }}
                      />
                    ) : (
                      <QRCodeCanvas
                        value={pixDetails.pix_copy_paste || pixDetails.qr_code || pixDetails.pix_key || 'ERRO'}
                        size={200}
                        level="M"
                        includeMargin
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Valor:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(pixDetails.original_amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Moeda:</span>
                    <Badge variant={pixDetails.currency === 'USDT' ? 'secondary' : 'default'}>
                      {pixDetails.currency}
                    </Badge>
                  </div>

                  {pixDetails.currency === 'USDT' && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">USDT Estimado:</span>
                      <span className="font-bold text-blue-600">
                        {pixDetails.usdt_amount} USDT
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Código PIX:</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={pixDetails.pix_copy_paste || pixDetails.qr_code || pixDetails.pix_key || 'Código não disponível'}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pixCode = pixDetails.pix_copy_paste || pixDetails.qr_code || pixDetails.pix_key;
                        if (pixCode) {
                          navigator.clipboard?.writeText(pixCode);
                          alert('Código PIX copiado!');
                        }
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowPixModal(false);
                    setPixDetails(null);
                    fetchUserBalance(); // Atualizar saldo
                  }}
                  className="w-full"
                >
                  Fechar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Credit Card Modal */}
        {showCreditCardForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-md my-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard size={20} />
                    <span>Pagamento com Cartão</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreditCardForm(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Valor do depósito:</strong> R$ {parseFloat(depositData.amount).toFixed(2)}
                  </p>
                </div>

                <form onSubmit={handleCreditCardDeposit} className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <Label>Número do Cartão</Label>
                    <Input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.card_number}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\s/g, '');
                        if (value.length <= 16 && /^\d*$/.test(value)) {
                          value = value.match(/.{1,4}/g)?.join(' ') || value;
                          setCardData({ ...cardData, card_number: value });
                        }
                      }}
                      maxLength={19}
                      required
                    />
                  </div>

                  {/* Card Holder */}
                  <div>
                    <Label>Nome no Cartão</Label>
                    <Input
                      type="text"
                      placeholder="NOME COMPLETO"
                      value={cardData.card_holder}
                      onChange={(e) => setCardData({ ...cardData, card_holder: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade</Label>
                      <Input
                        type="text"
                        placeholder="MM/AA"
                        value={cardData.card_expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) {
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2);
                            }
                            setCardData({ ...cardData, card_expiry: value });
                          }
                        }}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={cardData.card_cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) {
                            setCardData({ ...cardData, card_cvv: value });
                          }
                        }}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  {/* Installments */}
                  <div>
                    <Label>Número de Parcelas</Label>
                    <select
                      value={cardData.installments}
                      onChange={(e) => setCardData({ ...cardData, installments: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                        const fee = creditCardFees[`installment_${i}`] || 0;
                        const amount = parseFloat(depositData.amount);
                        const feeAmount = amount * (fee / 100);
                        const total = amount + feeAmount;
                        const installmentValue = total / i;
                        
                        return (
                          <option key={i} value={i}>
                            {i}x de R$ {installmentValue.toFixed(2)} 
                            {fee > 0 ? ` (taxa ${fee}% = +R$ ${feeAmount.toFixed(2)})` : ' (sem juros)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-gray-800">Resumo do Pagamento</h4>
                    {(() => {
                      const amount = parseFloat(depositData.amount);
                      const fee = creditCardFees[`installment_${cardData.installments}`] || 0;
                      const feeAmount = amount * (fee / 100);
                      const total = amount + feeAmount;
                      const installmentValue = total / cardData.installments;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Valor do depósito:</span>
                            <span className="font-medium">R$ {amount.toFixed(2)}</span>
                          </div>
                          {fee > 0 && (
                            <div className="flex justify-between text-sm text-orange-600">
                              <span>Taxa ({fee}%):</span>
                              <span className="font-medium">+ R$ {feeAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-bold pt-2 border-t">
                            <span>Total a pagar:</span>
                            <span className="text-green-600">R$ {total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{cardData.installments}x no cartão:</span>
                            <span>R$ {installmentValue.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreditCardForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={depositLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {depositLoading ? 'Processando...' : 'Confirmar Pagamento'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositoPage;