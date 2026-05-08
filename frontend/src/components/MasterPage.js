import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import MasterDashboard from './MasterDashboard';

/**
 * Componente wrapper que renderiza funcionalidades específicas do MasterDashboard
 * de forma isolada em URLs separadas
 */
const MasterPage = ({ tab, title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.user_type !== 'master' && !user?.is_master_account) {
      toast.error('Acesso restrito a administradores');
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto" style={{ paddingBottom: '100px' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/master')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Renderizar MasterDashboard com aba específica */}
        <div className="master-page-content">
          <MasterDashboard initialTab={tab} hideHeader={true} />
        </div>
      </div>
    </div>
  );
};

export default MasterPage;
