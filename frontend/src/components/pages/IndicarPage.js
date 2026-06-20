import React from 'react';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import ReferralSystem from '../ReferralSystem';

const IndicarPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();

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
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#1a59ad]' : 'bg-[#EEEEEE]'}`}>
      {/* Header Limpo */}
      <header className={`border-b sticky top-0 z-50 ${
        isDarkMode 
          ? 'bg-[#1a59ad] border-[#CEAE31]' 
          : 'bg-white border-[#005B9C]'
      }`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Voltar + Título */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className={`p-1 ${isDarkMode ? 'text-white hover:text-[#CEAE31]' : 'text-[#005B9C] hover:text-[#0077CC]'}`}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-[#CEAE31]' : 'text-[#005B9C]'}`}>Indicar & Ganhar</h1>
              </div>
            </div>
            
            {/* Lado Direito - Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`p-1 ${isDarkMode ? 'text-white hover:text-[#CEAE31]' : 'text-[#005B9C] hover:text-[#0077CC]'}`}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <ReferralSystem />
      </main>
    </div>
  );
};

export default IndicarPage;
