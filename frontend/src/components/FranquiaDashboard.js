import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';

// A franquia tem acesso ao sistema COMPLETO (Transmill + Labelview)
// Importar ambos os dashboards
import MasterDashboard from './MasterDashboard';
import MasterLabelviewDashboard from './MasterLabelviewDashboard';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const FranquiaDashboard = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSystem, setActiveSystem] = useState('labelview'); // 'transmill' ou 'labelview'

  useEffect(() => {
    verificarAcesso();
  }, [slug]);

  const verificarAcesso = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate(`/franquia/${slug}/login`);
        return;
      }

      // Carregar dados da franquia
      const franquiaResponse = await axios.get(`${API_URL}/api/franquias/${slug}`);
      
      if (franquiaResponse.data.success) {
        setFranquia(franquiaResponse.data.franquia);
        
        // Aplicar cores da franquia
        const fr = franquiaResponse.data.franquia;
        document.documentElement.style.setProperty('--franquia-primary', fr.cor_primaria || '#1a59ad');
        document.documentElement.style.setProperty('--franquia-secondary', fr.cor_secundaria || '#ffffff');
      } else {
        toast.error('Franquia não encontrada');
        navigate('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      toast.error('Erro ao carregar dashboard');
      navigate(`/franquia/${slug}/login`);
    }
  };

  // Verificar se ainda está carregando OU se o user não está disponível
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Contexto da franquia para passar aos componentes
  const franquiaContext = {
    slug: slug,
    id: franquia?.id,
    nome: franquia?.nome,
    logo_url: franquia?.logo_url,
    cor_primaria: franquia?.cor_primaria,
    cor_secundaria: franquia?.cor_secundaria,
    cor_texto: franquia?.cor_texto,
    is_franquia: true
  };

  return (
    <div className="min-h-screen">
      {/* Seletor de Sistema - Transmill ou Labelview */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4"
        style={{ backgroundColor: franquia?.cor_primaria || '#1a59ad' }}
      >
        {franquia?.logo_url && (
          <img 
            src={franquia.logo_url} 
            alt={franquia.nome} 
            className="h-8 object-contain mr-4"
          />
        )}
        <span className="text-white font-semibold mr-4">{franquia?.nome}</span>
        
        <div className="flex bg-white/20 rounded-lg p-1">
          <button
            onClick={() => setActiveSystem('transmill')}
            className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
              activeSystem === 'transmill' 
                ? 'bg-white text-gray-800' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            🏢 Transmill
          </button>
          <button
            onClick={() => setActiveSystem('labelview')}
            className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
              activeSystem === 'labelview' 
                ? 'bg-white text-gray-800' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            📋 Labelview
          </button>
        </div>
        
        <button
          onClick={() => {
            localStorage.clear();
            navigate(`/franquia/${slug}/login`);
          }}
          className="ml-auto text-white/80 hover:text-white text-sm"
        >
          Sair
        </button>
      </div>

      {/* Dashboard ativo - com padding top para não ficar atrás do header */}
      <div className="pt-12">
        {activeSystem === 'transmill' ? (
          <MasterDashboard franquiaContext={franquiaContext} hideHeader={true} />
        ) : (
          <MasterLabelviewDashboard franquiaContext={franquiaContext} />
        )}
      </div>
    </div>
  );
};

export default FranquiaDashboard;
