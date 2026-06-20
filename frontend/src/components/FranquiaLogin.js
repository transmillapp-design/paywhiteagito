import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, LogIn, Loader2, ChevronRight, Download, Smartphone } from 'lucide-react';
import { useAuth } from '../App';
import { useFranquiaPWA } from '../hooks/useFranquiaPWA';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const FranquiaLogin = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { isInstallable, installPWA } = useFranquiaPWA(slug);
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    carregarFranquia();
  }, [slug]);

  const carregarFranquia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/franquias/${slug}`);
      
      if (response.data.success && response.data.franquia) {
        setFranquia(response.data.franquia);
        
        // Aplicar cores da franquia no documento
        document.documentElement.style.setProperty('--franquia-primary', response.data.franquia.cor_primaria || '#1a59ad');
        document.documentElement.style.setProperty('--franquia-secondary', response.data.franquia.cor_secundaria || '#ffffff');
        document.documentElement.style.setProperty('--franquia-text', response.data.franquia.cor_texto || '#ffffff');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setLoginLoading(true);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.access_token) {
        const user = response.data.user;
        
        // Verificar se o usuário pertence a esta franquia
        if (user.franquia_slug && user.franquia_slug !== slug) {
          toast.error('Este usuário não pertence a este White Label');
          return;
        }
        
        // Garantir que o franquia_slug está no objeto user
        const userWithSlug = {
          ...user,
          franquia_slug: user.franquia_slug || slug
        };
        
        // Usar o login do contexto Auth para atualizar o estado global
        authLogin(userWithSlug, response.data.access_token);
        
        // Salvar dados adicionais da franquia
        localStorage.setItem('user', JSON.stringify(userWithSlug));
        localStorage.setItem('franquia_slug', slug);
        
        toast.success(`Bem-vindo à ${franquia?.nome || 'White Label'}!`);
        
        // Redirecionar para o home minimalista da franquia
        navigate(`/franquia/${slug}/home`);
      } else {
        toast.error(response.data.detail || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1a59ad' }}
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">White Label não encontrado</h1>
            <p className="text-gray-500 mb-4">
              O White Label "{slug}" não existe ou está inativo.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const corPrimaria = franquia?.cor_primaria || '#1a59ad';
  const corTexto = franquia?.cor_texto || '#ffffff';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: corPrimaria,
        backgroundImage: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%)`
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo e Nome da Franquia */}
        <div className="text-center mb-8">
          {franquia?.logo_url ? (
            <img 
              src={franquia.logo_url} 
              alt={franquia.nome}
              className="h-20 mx-auto mb-4 object-contain"
            />
          ) : (
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: corTexto }}
            >
              {franquia?.nome?.charAt(0) || 'F'}
            </div>
          )}
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: corTexto }}
          >
            {franquia?.nome || 'White Label'}
          </h1>
          <p 
            className="text-sm opacity-80"
            style={{ color: corTexto }}
          >
            Ecossistema de Serviços
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  data-testid="franquia-login-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    data-testid="franquia-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Link Esqueceu a senha */}
              <div className="text-right">
                <Link
                  to={`/franquia/${slug}/recuperar-senha`}
                  className="text-sm hover:underline"
                  style={{ color: corPrimaria }}
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                style={{ backgroundColor: corPrimaria }}
                disabled={loginLoading}
                data-testid="franquia-login-submit"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Seção de Cadastro */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-center text-sm text-gray-600 mb-3">
                Não tem uma conta?
              </p>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/franquia/${slug}/cadastro`)}
                style={{ borderColor: corPrimaria, color: corPrimaria }}
              >
                Cadastre-se
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {/* Botão Instalar App - PWA */}
            <div className="mt-4 pt-4 border-t">
              {isInstallable ? (
                // Browser suporta instalação automática (Chrome, Edge, etc.)
                <>
                  <Button
                    type="button"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={installPWA}
                    style={{ backgroundColor: corPrimaria }}
                  >
                    <Smartphone className="h-4 w-4" />
                    Instalar App
                    <Download className="h-4 w-4" />
                  </Button>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Instale o app para acesso rápido
                  </p>
                </>
              ) : (
                // iOS Safari ou app já instalado
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    <Smartphone className="inline h-4 w-4 mr-1" />
                    Adicione à Tela Inicial
                  </p>
                  <p className="text-xs text-gray-500">
                    No Safari: toque em <span className="font-semibold">Compartilhar</span> e depois em <span className="font-semibold">"Adicionar à Tela Inicial"</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <p 
            className="text-xs opacity-60"
            style={{ color: corTexto }}
          >
            {franquia?.estado && franquia?.cidades?.length > 0 && (
              <span>{franquia.cidades.join(', ')} - {franquia.estado}</span>
            )}
          </p>
          <p 
            className="text-xs opacity-40 mt-2"
            style={{ color: corTexto }}
          >
            Powered by Transmill
          </p>
        </div>
      </div>
    </div>
  );
};

export default FranquiaLogin;
