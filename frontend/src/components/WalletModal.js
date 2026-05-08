import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../App';
import { 
  Wallet, 
  Plus, 
  FileText, 
  Bitcoin, 
  ArrowUpRight, 
  X, 
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

const WalletModal = ({ isOpen, onClose }) => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [balance, setBalance] = useState({
    brl: 0,
    balance: 0,
    cashback: 0,
    usdt: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API}/user/profile`, { headers });
      
      if (response?.data) {
        const userData = response.data;
        setBalance({
          brl: (userData.balance || 0) + (userData.cashback_balance || 0),
          balance: userData.balance || 0,
          cashback: userData.cashback_balance || 0,
          usdt: userData.usdt_balance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDeposit = () => {
    onClose();
    // Navegar para página de depósito
    navigate('/deposito');
  };

  const handleExtract = () => {
    onClose();
    // Navegar para página de extrato
    navigate('/extrato');
  };

  const handleCrypto = () => {
    onClose();
    // Navegar para página de criptoativos
    navigate('/usdt');
  };

  const handleWithdraw = () => {
    onClose();
    // Navegar para página dedicada de saque
    navigate('/sacar');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-[#2A3618]' : 'bg-white'
      }`}>
        <Card className={`border-0 shadow-none ${isDarkMode ? 'bg-[#2A3618]' : 'bg-white'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Wallet className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`} />
                <span className={isDarkMode ? 'text-white' : 'text-[#333333]'}>Minha Carteira</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Saldos */}
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-[#E5C34A]' : 'text-gray-700'}`}>Seus Saldos</h3>
              
              {/* Saldo BRL (Balance + Cashback) */}
              <div className={`rounded-lg p-4 ${
                isDarkMode ? 'bg-[#3F5123] border border-[#005B9C]' : 'bg-[#FFFFFF] border border-[#005B9C]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      isDarkMode ? 'bg-[#556B2F]' : 'bg-[#F5F5F5]'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-[#005B9C]' : 'text-[#005B9C]'}`} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-gray-600'}`}>Saldo BRL</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {loading ? 'Carregando...' : `R$ ${balance.brl.toFixed(2)}`}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        (Saldo: R$ {balance.balance.toFixed(2)} + Cashback: R$ {balance.cashback.toFixed(2)})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* USDT */}
              <div className={`rounded-lg p-4 ${
                isDarkMode ? 'bg-[#3F5123] border border-[#005B9C]' : 'bg-[#FFFFFF] border border-[#005B9C]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-2 rounded-lg mr-3">
                      <Bitcoin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-[#E5C34A]' : 'text-gray-600'}`}>USDT</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {loading ? 'Carregando...' : `$${balance.usdt.toFixed(6)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações da Carteira */}
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-[#E5C34A]' : 'text-gray-700'}`}>Ações</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Depósito */}
                <Button
                  onClick={handleDeposit}
                  className={`flex flex-col items-center p-4 h-auto ${
                    isDarkMode 
                      ? 'bg-[#005B9C] hover:bg-[#E5C34A] text-[#2A3618]' 
                      : 'bg-[#005B9C] hover:bg-[#005B9C] text-white'
                  }`}
                >
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Depósito</span>
                </Button>

                {/* Extrato */}
                <Button
                  onClick={handleExtract}
                  variant="outline"
                  className={`flex flex-col items-center p-4 h-auto ${
                    isDarkMode 
                      ? 'border-[#005B9C] text-[#005B9C] hover:bg-[#556B2F]' 
                      : 'border-[#005B9C] text-[#005B9C] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Extrato</span>
                </Button>

                {/* Criptoativos - USDT */}
                <Button
                  onClick={handleCrypto}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <Bitcoin className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">USDT</span>
                </Button>

                {/* Saque */}
                <Button
                  onClick={handleWithdraw}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto border-green-200 text-green-600 hover:bg-green-50"
                >
                  <ArrowUpRight className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Saque</span>
                </Button>
              </div>
            </div>

            {/* Resumo Rápido */}
            <div className={`rounded-lg p-4 ${
              isDarkMode ? 'bg-[#3F5123]' : 'bg-gray-50'
            }`}>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-[#E5C34A]' : 'text-gray-700'}`}>Resumo da Conta</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Total em BRL:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    R$ {balance.brl.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>USDT:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${balance.usdt.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Tipo de conta:</span>
                  <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.user_type === 'cliente' ? 'Cliente' : 
                     user?.user_type === 'lojista' ? 'Lojista' : 
                     user?.user_type === 'service_provider' ? 'Prestador' : user?.user_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="border-t pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Fechar
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletModal;