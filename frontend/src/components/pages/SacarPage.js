import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../hooks/useTheme';
import WithdrawalForm from '../WithdrawalForm';

const SacarPage = () => {
  const { user, logout, fetchUserBalance } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState({ total: 0, balance: 0, usdt_balance: 0, cashback: 0 });
  const [loading, setLoading] = useState(true);
  const isDarkMode = useTheme();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userBalance = await fetchUserBalance();
      setBalance(userBalance);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header Limpo */}
      <header className={`border-b sticky top-0 z-50 ${
        isDarkMode 
          ? 'bg-[#3F5123] border-[#005B9C]' 
          : 'bg-[#FFFFFF] border-[#005B9C]'
      }`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Voltar + Título */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className={`p-1 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>Sacar</h1>
              </div>
            </div>
            
            {/* Lado Direito - Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`p-1 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <WithdrawalForm 
          userBalance={balance.total || 0}
          onWithdrawalSuccess={(data) => {
            toast.success(data.message || 'Saque solicitado com sucesso!');
            fetchUserData();
          }}
        />
      </main>
    </div>
  );
};

export default SacarPage;