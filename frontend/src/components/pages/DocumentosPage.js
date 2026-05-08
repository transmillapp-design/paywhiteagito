import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import TransmillLogoCompact from '../TransmillLogoCompact';
import ThemeToggle from '../ThemeToggle';
import DocumentUpload from '../DocumentUpload';

const DocumentosPage = () => {
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

  // Determinar o tipo de usuário para o componente
  const getUserType = () => {
    switch (user.user_type) {
      case 'cliente':
        return 'cliente';
      case 'lojista':
        return 'lojista';
      case 'service_provider':
        return 'prestador';
      default:
        return 'cliente';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className={isDarkMode ? 'text-white' : 'text-[#333333]'}
                className="text-gray-600"
              >
                <ArrowLeft size={16} />
              </Button>
              <TransmillLogoCompact className="h-8 w-8" />
              <div>
                <p className="font-bold text-gray-900">Documentos</p>
                <p className="text-xs text-gray-500">Compliance Obrigatório</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <DocumentUpload userType={getUserType()} />
      </main>
    </div>
  );
};

export default DocumentosPage;