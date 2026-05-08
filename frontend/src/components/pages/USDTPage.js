import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ArrowLeft,
  Bitcoin,
  ArrowUpDown,
  Send,
  Wallet,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const USDTPage = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [balance, setBalance] = useState({ brl: 0, usdt: 0 });
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertData, setConvertData] = useState({
    amount: '',
    from: 'BRL',
    to: 'USDT'
  });
  const [transferData, setTransferData] = useState({
    external_wallet: '',
    amount: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchExchangeRate();
    fetchUserBalance();
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

  const handleConvert = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(convertData.amount);
      let response;

      if (convertData.from === 'BRL' && convertData.to === 'USDT') {
        response = await axios.post(`${API}/xgate/convert-brl-usdt`, 
          { brl_amount: amount },
          { headers }
        );
      } else if (convertData.from === 'USDT' && convertData.to === 'BRL') {
        response = await axios.post(`${API}/xgate/convert-usdt-brl`, 
          { usdt_amount: amount },
          { headers }
        );
      }

      if (response.data.success) {
        alert('Conversão realizada com sucesso!');
        setConvertData({ amount: '', from: 'BRL', to: 'USDT' });
        fetchUserBalance();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Convert error:', error);
      alert('Erro na conversão: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/xgate/transfer-usdt`, transferData, { headers });

      if (response.data.success) {
        alert('Transferência USDT realizada com sucesso!');
        setTransferData({ external_wallet: '', amount: '', password: '' });
        fetchUserBalance();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Erro na transferência: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversion = () => {
    if (!convertData.amount || !exchangeRate) return { result: 0, fee: 0, net: 0 };

    const amount = parseFloat(convertData.amount);
    const fee = amount * 0.0399; // Taxa de 3,99%
    const net = amount - fee;

    if (convertData.from === 'BRL' && convertData.to === 'USDT') {
      const result = net / exchangeRate;
      return { result: result.toFixed(6), fee: fee.toFixed(2), net: net.toFixed(2) };
    } else if (convertData.from === 'USDT' && convertData.to === 'BRL') {
      const result = net * exchangeRate;
      return { result: result.toFixed(2), fee: fee.toFixed(6), net: net.toFixed(6) };
    }

    return { result: 0, fee: 0, net: 0 };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const conversion = calculateConversion();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={isDarkMode ? 'text-white' : 'text-[#333333]'}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>USDT & Criptoativos</h1>
          <Badge variant="secondary" className={isDarkMode ? 'bg-[#005B9C] text-[#2A3618]' : 'bg-[#005B9C] text-white'}>
            Cripto
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Balance */}
        <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Bitcoin className="mr-2" size={20} />
              Saldo em Criptoativos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-yellow-100 text-xs uppercase tracking-wide">Saldo BRL</p>
                <p className="text-white text-xl font-bold">{formatCurrency(balance.brl)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-yellow-100 text-xs uppercase tracking-wide">Saldo USDT</p>
                <p className="text-white text-xl font-bold">{balance.usdt.toFixed(6)}</p>
              </div>
            </div>

            {exchangeRate && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-100 text-sm">Taxa atual USD/BRL:</span>
                  <span className="text-white font-bold">R$ {exchangeRate.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* USDT Functions Tabs */}
        <Tabs defaultValue="convert" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="convert">Converter</TabsTrigger>
            <TabsTrigger value="transfer">Transferir</TabsTrigger>
          </TabsList>

          {/* Convert Tab */}
          <TabsContent value="convert">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpDown size={20} />
                  <span>Conversão de Moedas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConvert} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>De:</Label>
                      <select
                        value={convertData.from}
                        onChange={(e) => setConvertData({ 
                          ...convertData, 
                          from: e.target.value,
                          to: e.target.value === 'BRL' ? 'USDT' : 'BRL'
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="BRL">BRL (Reais)</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                    <div>
                      <Label>Para:</Label>
                      <select
                        value={convertData.to}
                        disabled
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      >
                        <option value={convertData.to}>
                          {convertData.to === 'BRL' ? 'BRL (Reais)' : 'USDT'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Valor a converter:</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={convertData.amount}
                      onChange={(e) => setConvertData({ ...convertData, amount: e.target.value })}
                      placeholder={convertData.from === 'BRL' ? '0,00' : '0.000000'}
                      required
                    />
                  </div>

                  {/* Conversion Preview */}
                  {convertData.amount && exchangeRate && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Valor bruto:</span>
                          <strong>
                            {convertData.from === 'BRL' 
                              ? formatCurrency(parseFloat(convertData.amount))
                              : `${parseFloat(convertData.amount).toFixed(6)} USDT`
                            }
                          </strong>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Taxa (3,99%):</span>
                          <strong>
                            -{convertData.from === 'BRL' 
                              ? `R$ ${conversion.fee}`
                              : `${conversion.fee} USDT`
                            }
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor líquido:</span>
                          <strong>
                            {convertData.from === 'BRL' 
                              ? `R$ ${conversion.net}`
                              : `${conversion.net} USDT`
                            }
                          </strong>
                        </div>
                        <div className="flex justify-between text-green-600 text-base pt-2 border-t">
                          <span>Receberá:</span>
                          <strong>
                            {convertData.to === 'BRL' 
                              ? `R$ ${conversion.result}`
                              : `${conversion.result} USDT`
                            }
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading || !convertData.amount}
                    className="w-full"
                  >
                    {loading ? 'Convertendo...' : 'Converter Agora'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send size={20} />
                  <span>Transferir USDT</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <Label>Carteira Externa (Endereço):</Label>
                    <Input
                      type="text"
                      value={transferData.external_wallet}
                      onChange={(e) => setTransferData({ ...transferData, external_wallet: e.target.value })}
                      placeholder="0x... (Endereço da carteira destino)"
                      required
                    />
                  </div>

                  <div>
                    <Label>Quantidade USDT:</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      max={balance.usdt}
                      value={transferData.amount}
                      onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      placeholder="0.000000"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Disponível: {balance.usdt.toFixed(6)} USDT
                    </p>
                  </div>

                  <div>
                    <Label>Senha de Confirmação:</Label>
                    <Input
                      type="password"
                      value={transferData.password}
                      onChange={(e) => setTransferData({ ...transferData, password: e.target.value })}
                      placeholder="Sua senha Transmill"
                      required
                    />
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="text-yellow-600" size={16} />
                      <span className="text-yellow-800 font-medium text-sm">Importante:</span>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Verifique o endereço da carteira antes de confirmar</li>
                      <li>• Transferências não podem ser canceladas</li>
                      <li>• Taxa de rede pode ser aplicada</li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !transferData.external_wallet || !transferData.amount || !transferData.password}
                    className="w-full"
                  >
                    {loading ? 'Transferindo...' : 'Transferir USDT'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-orange-800 mb-3">Ações Rápidas</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/deposito')}
              >
                💰 Depositar e Converter para USDT
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/extrato')}
              >
                📊 Ver Histórico de Transações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default USDTPage;