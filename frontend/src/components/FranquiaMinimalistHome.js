import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import HomePage from '../pages/HomePage';
import FranquiaPWAInstallPrompt from './FranquiaPWAInstallPrompt';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * FranquiaMinimalistHome
 * 
 * Wrapper do HomePage que:
 * 1. Carrega dados da franquia (logo, cores)
 * 2. Passa o contexto da franquia para personalização
 * 3. Exibe prompt de instalação do PWA da franquia
 */
const FranquiaMinimalistHome = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarFranquia = async () => {
      try {
        // Carregar dados da franquia (não precisa de autenticação)
        const franquiaResponse = await axios.get(`${API_URL}/api/franquias/${slug}`);
        
        if (franquiaResponse.data.success) {
          const fr = franquiaResponse.data.franquia;
          setFranquia(fr);
          
          // Aplicar cores da franquia como variáveis CSS
          document.documentElement.style.setProperty('--franquia-primary', fr.cor_primaria || '#1a59ad');
          document.documentElement.style.setProperty('--franquia-secondary', fr.cor_secundaria || '#ffffff');
          
          // Salvar slug no localStorage para navegação
          localStorage.setItem('franquia_slug', slug);
        } else {
          toast.error('Franquia não encontrada');
          navigate('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar franquia:', error);
        toast.error('Erro ao carregar dados da franquia');
        navigate(`/franquia/${slug}/login`);
      }
    };
    
    carregarFranquia();
  }, [slug, navigate]);

  // Se não tem franquia carregada, mostra loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Se não tem usuário logado, redireciona para login
  if (!user) {
    navigate(`/franquia/${slug}/login`);
    return null;
  }

  // Criar contexto da franquia
  const franquiaContext = {
    id: franquia?._id || franquia?.id,
    nome: franquia?.nome,
    slug: franquia?.slug,
    cor_primaria: franquia?.cor_primaria || '#1a59ad',
    cor_secundaria: franquia?.cor_secundaria || '#ffffff',
    logo_url: franquia?.logo_url
  };

  return (
    <>
      {/* HomePage com contexto da franquia */}
      <HomePage franquiaContext={franquiaContext} />
      
      {/* PWA Install Prompt específico da franquia */}
      <FranquiaPWAInstallPrompt slug={slug} />
    </>
  );
};

export default FranquiaMinimalistHome;
