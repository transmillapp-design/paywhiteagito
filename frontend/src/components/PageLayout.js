import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../App';
import { useTheme } from '../hooks/useTheme';

const PageLayout = ({ title, children, showBack = true, showLogout = true }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 ${
        isDarkMode 
          ? 'bg-[#3F5123] border-[#005B9C]' 
          : 'bg-[#FFFFFF] border-[#005B9C]'
      }`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo */}
            <div className="flex items-center space-x-3">
              {showBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className={`p-1 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}
                >
                  <ArrowLeft size={20} />
                </Button>
              )}
              <div>
                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}>
                  {title}
                </h1>
              </div>
            </div>
            
            {/* Lado Direito */}
            {showLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={`p-1 ${isDarkMode ? 'text-white' : 'text-[#333333]'}`}
              >
                <LogOut size={20} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
