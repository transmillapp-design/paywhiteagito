import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../App';

const UserProfileModal = ({ user, userProfile, onClose, navigate }) => {
  const { logout } = useAuth();

  const handleProfileClick = () => {
    onClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const formatUserType = (type) => {
    switch (type) {
      case 'cliente': return 'Cliente';
      case 'lojista': return 'Lojista';
      case 'service_provider': return 'Prestador de Serviços';
      case 'master': return 'Master';
      default: return type;
    }
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* Header com Avatar e Info */}
      <div className="flex items-center space-x-4 pb-4 border-b">
        <Avatar className="w-16 h-16">
          <AvatarImage src={userProfile?.profile_image || user?.profile_image} alt={user?.full_name} />
          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-medium">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {user?.full_name || 'Usuário'}
          </h3>
          <p className="text-sm text-gray-600">
            {formatUserType(user?.user_type)}
          </p>
          <p className="text-xs text-gray-500">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Opções do Menu */}
      <div className="space-y-2">
        
        <Button
          variant="ghost"
          className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-gray-50"
          onClick={handleProfileClick}
        >
          <User className="w-5 h-5 mr-3 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">Meu Perfil</div>
            <div className="text-sm text-gray-500">Ver e editar informações pessoais</div>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-red-50 text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <div>
            <div className="font-medium">Sair</div>
            <div className="text-sm text-red-500">Fazer logout da conta</div>
          </div>
        </Button>
        
      </div>

      {/* Rodapé */}
      <div className="pt-4 border-t text-center">
        <p className="text-xs text-gray-400">
          Transmill v2.0 • {new Date().getFullYear()}
        </p>
      </div>

    </div>
  );
};

export default UserProfileModal;