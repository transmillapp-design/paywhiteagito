import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const FranquiaRecuperarSenha = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    carregarFranquia();
  }, [slug]);

  const carregarFranquia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/franquias/${slug}`);
      
      if (response.data.success && response.data.franquia) {
        setFranquia(response.data.franquia);
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
    
    if (!email) {
      toast.error('Informe seu e-mail');
      return;
    }

    try {
      setSubmitLoading(true);
      
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email,
        franquia_slug: slug
      });

      if (response.data.success) {
        setEmailSent(true);
        toast.success('E-mail de recuperação enviado!');
      } else {
        toast.error(response.data.message || 'Erro ao enviar e-mail');
      }
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      // Mesmo em caso de erro, mostramos sucesso por segurança
      setEmailSent(true);
      toast.success('Se o e-mail existir, você receberá as instruções.');
    } finally {
      setSubmitLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Franquia não encontrada</h1>
            <p className="text-gray-500 mb-4">
              A franquia "{slug}" não existe ou está inativa.
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
            {franquia?.nome || 'Franquia'}
          </h1>
          <p 
            className="text-sm opacity-80"
            style={{ color: corTexto }}
          >
            Recuperação de Senha
          </p>
        </div>

        {/* Card de Recuperação */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {emailSent ? 'E-mail Enviado!' : 'Recuperar Senha'}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Verifique sua caixa de entrada' 
                : 'Informe seu e-mail para receber as instruções'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center py-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: corPrimaria + '15' }}
                >
                  <CheckCircle className="h-8 w-8" style={{ color: corPrimaria }} />
                </div>
                <p className="text-gray-600 mb-6">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá as instruções para redefinir sua senha.
                </p>
                <Button
                  onClick={() => navigate(`/franquia/${slug}/login`)}
                  className="w-full"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                      data-testid="recuperar-senha-email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  style={{ backgroundColor: corPrimaria }}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Instruções'
                  )}
                </Button>

                <Link
                  to={`/franquia/${slug}/login`}
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Login
                </Link>
              </form>
            )}
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

export default FranquiaRecuperarSenha;
