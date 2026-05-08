import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, ArrowRight, Wallet, ExternalLink } from 'lucide-react';

const USDTTransfer = ({ userBalance = 0, onTransferSuccess }) => {
  const [formData, setFormData] = useState({
    amount_usdt: '',
    wallet_address: '',
    wallet_name: ''
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usdtRate, setUsdtRate] = useState(0);

  useEffect(() => {
    fetchUSDTRate();
  }, []);

  useEffect(() => {
    if (formData.amount_usdt && parseFloat(formData.amount_usdt) > 0) {
      calculateTransferFee();
    } else {
      setCalculation(null);
    }
  }, [formData.amount_usdt, usdtRate]);

  const fetchUSDTRate = async () => {
    try {
      const response = await fetch(`${API_URL}/usdt/rate`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsdtRate(data.data.rate);
      }
    } catch (err) {
      console.error('Erro ao obter cotação USDT:', err);
    }
  };

  const calculateTransferFee = async () => {
    try {
      const amountUSDT = parseFloat(formData.amount_usdt);
      if (amountUSDT <= 0 || !usdtRate) return;

      const amountBRL = amountUSDT * usdtRate;
      const feeAmount = amountBRL * 0.0399; // 3.99%
      const netAmountBRL = amountBRL - feeAmount;
      const netUSDT = amountUSDT - (feeAmount / usdtRate);

      setCalculation({
        amount_brl: amountBRL,
        amount_usdt: amountUSDT,
        fee_amount: feeAmount,
        net_amount_brl: netAmountBRL,
        net_usdt: netUSDT,
        usdt_rate: usdtRate
      });

      // Verificar saldo USDT
      const userUSDTBalance = userBalance / usdtRate;
      if (amountUSDT > userUSDTBalance) {
        setError('Saldo USDT insuficiente para esta transferência');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Erro ao calcular taxa:', err);
    }
  };

  const validateWalletAddress = (address) => {
    // TRC20 addresses start with 'T' and are 34 characters
    if (address.startsWith('T') && address.length === 34) {
      return { valid: true, network: 'TRC20' };
    }
    // ERC20 addresses start with '0x' and are 42 characters
    if (address.startsWith('0x') && address.length === 42) {
      return { valid: true, network: 'ERC20' };
    }
    return { valid: false, network: null };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount_usdt || !formData.wallet_address) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    const walletValidation = validateWalletAddress(formData.wallet_address);
    if (!walletValidation.valid) {
      setError('Endereço de carteira inválido. Use formato TRC20 (T...) ou ERC20 (0x...)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/usdt/transfer-external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount_usdt: parseFloat(formData.amount_usdt),
          wallet_address: formData.wallet_address.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Transferência solicitada com sucesso! Aguardando aprovação do master.');
        setFormData({ amount_usdt: '', wallet_address: '', wallet_name: '' });
        setCalculation(null);
        
        if (onTransferSuccess) {
          onTransferSuccess(data.data);
        }
      } else {
        setError(data.error || 'Erro ao criar transferência');
      }
    } catch (err) {
      console.error('Erro na transferência:', err);
      setError('Erro ao processar transferência');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatUSDT = (value) => {
    return `${value.toFixed(6)} USDT`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Wallet className="h-6 w-6 text-blue-600" />
          <span>Transferência USDT Externa</span>
        </CardTitle>
        <CardDescription>
          Transfira USDT para sua carteira de auto custódia
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Saldo USDT disponível */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Saldo USDT disponível:
              </span>
              <span className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                {usdtRate > 0 ? formatUSDT((userBalance || 0) / usdtRate) : '0.000000 USDT'}
              </span>
            </div>
            {usdtRate > 0 && userBalance > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400">Equivalente BRL:</span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ≈ {formatCurrency(userBalance || 0)}
                </span>
              </div>
            )}
          </div>

          {/* Valor USDT */}
          <div>
            <Label htmlFor="amount_usdt">Valor da Transferência (USDT) *</Label>
            <Input
              id="amount_usdt"
              type="number"
              value={formData.amount_usdt}
              onChange={(e) => setFormData({...formData, amount_usdt: e.target.value})}
              placeholder="0.000000"
              min="0.000001"
              step="0.000001"
              className="mt-2"
              required
            />
          </div>

          {/* Endereço da carteira */}
          <div>
            <Label htmlFor="wallet_address">Endereço da Carteira USDT *</Label>
            <Input
              id="wallet_address"
              type="text"
              value={formData.wallet_address}
              onChange={(e) => setFormData({...formData, wallet_address: e.target.value})}
              placeholder="TRC20: T... ou ERC20: 0x..."
              className="mt-2 font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Suporte para redes TRC20 (Tron) e ERC20 (Ethereum)
            </p>
          </div>

          {/* Nome da carteira (opcional) */}
          <div>
            <Label htmlFor="wallet_name">Nome da Carteira (opcional)</Label>
            <Input
              id="wallet_name"
              type="text"
              value={formData.wallet_name}
              onChange={(e) => setFormData({...formData, wallet_name: e.target.value})}
              placeholder="Ex: Minha Carteira Principal"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome para identificar esta carteira (apenas para referência)
            </p>
          </div>

          {/* Calculadora */}
          {calculation && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                Resumo da Transferência
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Valor solicitado:</span>
                  <span>{formatUSDT(calculation.amount_usdt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Equivalente BRL:</span>
                  <span>{formatCurrency(calculation.amount_brl)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxa (3,99%):</span>
                  <span className="text-red-600 dark:text-red-400">
                    -{formatCurrency(calculation.fee_amount)}
                  </span>
                </div>
                
                <hr className="border-yellow-200 dark:border-yellow-800" />
                
                <div className="flex justify-between font-semibold">
                  <span className="text-green-600 dark:text-green-400">USDT enviado:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatUSDT(calculation.net_usdt)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cotação USDT/BRL:</span>
                  <span>{formatCurrency(calculation.usdt_rate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mensagens */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Aviso de aprovação */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">⚠️ Aprovação Necessária</p>
                <p>
                  Transferências para carteiras externas requerem aprovação do master. 
                  Você será notificado quando a transferência for processada.
                </p>
              </div>
            </div>
          </div>

          {/* Botão submit */}
          <Button 
            type="submit" 
            disabled={loading || !!error || !calculation}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>Solicitar Transferência</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default USDTTransfer;