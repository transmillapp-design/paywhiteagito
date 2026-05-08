import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import MasterLabelviewDashboard from './MasterLabelviewDashboard';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * FranquiaLabelviewPanel
 * 
 * Painel de Proteção Veicular (Labelview) para a franquia
 * - Cadastro de Regionais
 * - Cadastro de Consultores
 * - Gestão de Clientes
 * - Gestão de Vistorias
 */
const FranquiaLabelviewPanel = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarFranquia = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Sessão expirada. Faça login novamente.');
          navigate(`/franquia/${slug}/login`);
          return;
        }

        // Carregar dados da franquia
        const franquiaResponse = await axios.get(`${API_URL}/api/franquias/${slug}`);
        
        if (franquiaResponse.data.success) {
          setFranquia(franquiaResponse.data.franquia);
        } else {
          toast.error('Franquia não encontrada');
          navigate('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar franquia:', error);
        toast.error('Erro ao carregar painel de proteção');
        navigate(`/franquia/${slug}/login`);
      }
    };
    
    carregarFranquia();
  }, [slug, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel de proteção...</p>
        </div>
      </div>
    );
  }

  // Criar contexto da franquia para passar ao MasterLabelviewDashboard
  const franquiaContext = {
    id: franquia?._id || franquia?.id,
    nome: franquia?.nome,
    slug: franquia?.slug,
    cor_primaria: franquia?.cor_primaria || '#1a59ad',
    cor_secundaria: franquia?.cor_secundaria || '#ffffff',
    logo_url: franquia?.logo_url
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: franquiaContext.cor_secundaria }}>
      {/* Header com botão voltar */}
      <div 
        className="sticky top-0 z-50 shadow-sm border-b"
        style={{ 
          backgroundColor: franquiaContext.cor_primaria,
          borderColor: franquiaContext.cor_primaria 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/franquia/${slug}/home`)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          
          {franquiaContext.logo_url ? (
            <img 
              src={franquiaContext.logo_url} 
              alt={franquiaContext.nome} 
              className="h-8 w-auto object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold text-white">
              {franquiaContext.nome}
            </h1>
          )}
          
          <span className="text-white/80 text-sm">| Painel Proteção</span>
        </div>
      </div>

      {/* MasterLabelviewDashboard com contexto da franquia */}
      <MasterLabelviewDashboard franquiaContext={franquiaContext} />
    </div>
  );
};

export default FranquiaLabelviewPanel;
