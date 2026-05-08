import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Register from './Register';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * FranquiaRegister - Wrapper do Register.js que aplica as cores da franquia
 * Redireciona para o formulário de cadastro existente, passando o contexto da franquia
 */
const FranquiaRegister = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    carregarFranquia();
  }, [slug]);

  const carregarFranquia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/franquias/${slug}`);
      
      if (response.data.success && response.data.franquia) {
        setFranquia(response.data.franquia);
        
        // Aplicar cores da franquia como variáveis CSS
        const corPrimaria = response.data.franquia.cor_primaria || '#1a59ad';
        const corSecundaria = response.data.franquia.cor_secundaria || '#ffffff';
        
        document.documentElement.style.setProperty('--franquia-cor-primaria', corPrimaria);
        document.documentElement.style.setProperty('--franquia-cor-secundaria', corSecundaria);
        
        // Substituir cores padrão do Register
        document.documentElement.style.setProperty('--color-primary', corPrimaria);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao carregar franquia:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup das variáveis CSS ao desmontar
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--franquia-cor-primaria');
      document.documentElement.style.removeProperty('--franquia-cor-secundaria');
      document.documentElement.style.removeProperty('--color-primary');
    };
  }, []);

  if (loading) {
    const corPrimaria = '#1a59ad';
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: corPrimaria }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Franquia não encontrada</h1>
          <p className="text-gray-500 mb-4">
            A franquia "{slug}" não existe ou está inativa.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // Renderiza o Register com contexto da franquia
  return (
    <div 
      className="min-h-screen"
      style={{
        '--primary-color': franquia?.cor_primaria || '#1a59ad'
      }}
    >
      {/* Header com logo da franquia */}
      <div 
        className="py-4 px-6"
        style={{ backgroundColor: franquia?.cor_primaria || '#1a59ad' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {franquia?.logo_url ? (
              <img 
                src={franquia.logo_url} 
                alt={franquia.nome}
                className="h-10 object-contain"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                {franquia?.nome?.charAt(0) || 'F'}
              </div>
            )}
            <span className="text-white font-semibold">{franquia?.nome}</span>
          </div>
          <button
            onClick={() => navigate(`/franquia/${slug}/login`)}
            className="text-white/80 hover:text-white text-sm"
          >
            Voltar ao Login
          </button>
        </div>
      </div>

      {/* Formulário de cadastro existente */}
      <Register franquiaContext={franquia} />
    </div>
  );
};

export default FranquiaRegister;
