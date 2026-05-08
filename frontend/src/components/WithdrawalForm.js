import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_URL } from '../config/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, ArrowUpRight, DollarSign, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';

const WithdrawalForm = ({ userBalance = 0, onWithdrawalSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount_brl: ''
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Carregar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('transmill-theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    if (formData.amount_brl && parseFloat(formData.amount_brl) > 0) {
      calculateWithdrawalFee();
    } else {
      setCalculation(null);
      setError('');
    }
  }, [formData.amount_brl]);

  const calculateWithdrawalFee = () => {
    try {
      const amountBRL = parseFloat(formData.amount_brl);
      if (amountBRL <= 0) return;

      // Verificar saldo
      if (amountBRL > userBalance) {
        setError('Saldo insuficiente para este saque');
        setCalculation(null);
        return;
      } else {
        setError('');
      }

      const feePercentage = amountBRL * 0.0399; // 3.99%
      const feeAmount = Math.max(feePercentage, 3.00); // Mínimo R$ 3,00
      const netAmountBRL = amountBRL - feeAmount;

      setCalculation({
        amount_brl: amountBRL,
        fee_amount: feeAmount,
        net_amount_brl: netAmountBRL
      });
    } catch (err) {
      console.error('Erro ao calcular taxa de saque:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount_brl) {
      setError('Digite o valor do saque');
      return;
    }

    const amountBRL = parseFloat(formData.amount_brl);
    if (amountBRL <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    if (amountBRL > userBalance) {
      setError('Saldo insuficiente');
      return;
    }

    if (!user?.pix_key) {
      setError('Você precisa cadastrar uma chave PIX no seu perfil antes de fazer saques');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/usdt/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount_brl: amountBRL,
          currency: 'BRL'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Saque solicitado com sucesso! 🎉');
        setFormData({ amount_brl: '' });
        setCalculation(null);
        
        if (onWithdrawalSuccess) {
          onWithdrawalSuccess(data.data);
        }
      } else {
        setError(data.error || 'Erro ao processar saque');
      }
    } catch (err) {
      console.error('Erro no saque:', err);
      setError('Erro ao processar saque');
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

  const setQuickAmount = (percentage) => {
    const amount = (userBalance * percentage / 100).toFixed(2);
    setFormData({ amount_brl: amount });
  };

  if (success) {
    return (
      <div className={`max-w-md mx-auto px-4 py-6 space-y-6 min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
        <Card className={`border-2 ${isDarkMode ? 'bg-[#556B2F] border-[#005B9C] text-white' : 'bg-[#F5F5F5] border-[#005B9C] text-[#333333]'}`}>
          <CardContent className="p-6 text-center">
            <CheckCircle size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`} />
            <h3 className="text-xl font-bold mb-2">Saque Solicitado!</h3>
            <p className={`mb-4 ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>{success}</p>
            <Badge className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
              Processamento em até 1 hora útil
            </Badge>
          </CardContent>
        </Card>

        <Button 
          onClick={() => {
            setSuccess('');
            setFormData({ amount_brl: '' });
            setCalculation(null);
          }}
          className={`w-full ${isDarkMode ? 'border-[#005B9C] text-white hover:bg-[#556B2F]' : 'border-[#005B9C] text-[#333333] hover:bg-[#F5F5F5]'}`}
          variant="outline"
        >
          Fazer Outro Saque
        </Button>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto px-4 py-6 space-y-6 min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header do Saque */}
      <Card className={`border-2 ${isDarkMode ? 'bg-[#6B6B4B] border-[#005B9C] text-white' : 'bg-[#F5F5F5] border-[#005B9C] text-[#333333]'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-[#005B9C]' : 'bg-[#005B9C]'}`}>
                <ArrowUpRight size={24} className={isDarkMode ? 'text-[#2A3618]' : 'text-white'} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Saque PIX</h2>
                <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>Disponível 24h</p>
              </div>
            </div>
            <Badge className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
              Taxa 3,99%
            </Badge>
          </div>

          <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>Saldo disponível</span>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>{formatCurrency(userBalance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Saque */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campo de Valor */}
        <Card className={`border-2 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
              <DollarSign size={20} className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} />
              <span>Quanto você quer sacar?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-lg ${isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                R$
              </span>
              <Input
                type="number"
                value={formData.amount_brl}
                onChange={(e) => setFormData({...formData, amount_brl: e.target.value})}
                placeholder="0,00"
                min="0.01"
                max={userBalance}
                step="0.01"
                className={`pl-12 text-lg font-bold h-14 ${
                  isDarkMode 
                    ? 'bg-[#2A3618] border-[#556B2F] text-white' 
                    : 'bg-white border-[#CCCCCC] text-[#333333]'
                }`}
                required
              />
            </div>

            {/* Botões de Valor Rápido */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map(percentage => (
                <Button
                  key={percentage}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(percentage)}
                  className={`text-xs ${
                    isDarkMode 
                      ? 'border-[#005B9C] text-white hover:bg-[#556B2F]' 
                      : 'border-[#005B9C] text-[#333333] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conta PIX de Destino */}
        <Card className={`border-2 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard size={20} className={isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Conta PIX de Destino</h3>
            </div>

            {user?.pix_key ? (
              <div className={`rounded-lg p-4 border ${
                isDarkMode 
                  ? 'bg-[#2A3618] border-[#005B9C]' 
                  : 'bg-white border-[#005B9C]'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={isDarkMode ? 'text-[#E5C34A]' : 'text-[#005B9C]'}>Chave PIX</span>
                  <Badge className={isDarkMode ? 'bg-[#556B2F] text-white' : 'bg-[#005B9C] text-white'}>
                    <CheckCircle size={12} className="mr-1" />
                    Configurado
                  </Badge>
                </div>
                <p className={`font-mono break-all ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>{user.pix_key}</p>
              </div>
            ) : (
              <div className={`border rounded-lg p-4 text-center ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-500' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <AlertCircle className={`mx-auto mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} size={24} />
                <p className={`font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Chave PIX não cadastrada</p>
                <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Configure sua chave PIX no perfil para realizar saques.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calculadora de Taxa */}
        {calculation && (
          <Card className="border-[#005B9C] border-2 bg-[#3F5123]">
            <CardContent className="p-4">
              <h4 className="font-bold text-white mb-3 flex items-center">
                <Clock size={16} className="mr-2" />
                Resumo do Saque
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#E5C34A]">Valor solicitado</span>
                  <span className="font-bold text-white">{formatCurrency(calculation.amount_brl)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[#E5C34A]">Taxa PIX (3,99% - mín. R$ 3,00)</span>
                  <span className="font-bold text-red-400">-{formatCurrency(calculation.fee_amount)}</span>
                </div>
                
                <hr className="border-[#005B9C]" />
                
                <div className="flex justify-between items-center bg-[#556B2F] rounded-lg p-3 border border-[#005B9C]">
                  <span className="font-bold text-white">Você receberá</span>
                  <span className="text-xl font-bold text-[#005B9C]">
                    {formatCurrency(calculation.net_amount_brl)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagens de Erro */}
        {error && (
          <Card className="border-red-500 border-2 bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle size={20} />
                <p className="font-semibold">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações Importantes */}
        <Card className="border-[#005B9C] border-2 bg-[#3F5123]">
          <CardContent className="p-4">
            <h4 className="font-bold text-white mb-3 flex items-center">
              <AlertCircle size={16} className="mr-2 text-[#005B9C]" />
              Informações Importantes
            </h4>
            <ul className="space-y-2 text-[#E5C34A] text-sm">
              <li>• Valor mínimo de saque: R$ 10,00</li>
              <li>• Taxa fixa de 3,99% por transação (mínimo R$ 3,00)</li>
              <li>• Processamento em até 1 hora útil</li>
              <li>• Certifique-se de que sua chave PIX está correta</li>
            </ul>
          </CardContent>
        </Card>

        {/* Botão de Saque */}
        <Button 
          type="submit" 
          disabled={loading || !!error || !calculation || !user?.pix_key}
          className="w-full h-14 text-lg font-bold bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618] disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processando Saque...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ArrowUpRight size={20} />
              <span>Solicitar Saque PIX</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
};

export default WithdrawalForm;