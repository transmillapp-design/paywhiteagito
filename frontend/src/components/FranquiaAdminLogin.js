import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, LogIn, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../App';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const isMaster = (u) => Boolean(u?.is_master_account || u?.user_type === 'master');

const FranquiaAdminLogin = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [whiteLabel, setWhiteLabel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/franquias/${slug}`);
        if (res.data.success && res.data.franquia) setWhiteLabel(res.data.franquia);
        else setNotFound(true);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Preencha todos os campos'); return; }
    try {
      setLoginLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/login`, form);
      if (res.data.access_token) {
        const user = res.data.user;
        // Admin do white label = master OU gestor da própria unidade
        const belongs = isMaster(user) || user.franquia_slug === slug;
        if (!belongs) {
          toast.error('Este usuário não é administrador desta unidade');
          return;
        }
        const userWithSlug = { ...user, franquia_slug: user.franquia_slug || slug };
        authLogin(userWithSlug, res.data.access_token);
        localStorage.setItem('franquia_slug', slug);
        toast.success('Bem-vindo ao painel administrativo');
        navigate(`/franquia/${slug}/admin`);
      } else {
        toast.error(res.data.detail || 'Erro ao fazer login');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a59ad' }}>
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">White Label não encontrado</h1>
            <p className="text-gray-500 mb-4">A unidade "{slug}" não existe ou está inativa.</p>
            <Button onClick={() => navigate('/')} variant="outline">Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const corPrimaria = whiteLabel?.cor_primaria || '#1a59ad';
  const corTexto = whiteLabel?.cor_texto || '#ffffff';

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundImage: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%)` }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {whiteLabel?.logo_url ? (
            <img src={whiteLabel.logo_url} alt={whiteLabel.nome} className="h-20 mx-auto mb-4 object-contain" />
          ) : (
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <KeyRound size={36} style={{ color: corTexto }} />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-1" style={{ color: corTexto }}>{whiteLabel?.nome || 'White Label'}</h1>
          <p className="text-sm opacity-80" style={{ color: corTexto }}>Painel Administrativo</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Acesso do Administrador</CardTitle>
            <CardDescription>Entre com sua conta de gestor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="admin@empresa.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="wl-admin-login-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="wl-admin-login-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" style={{ backgroundColor: corPrimaria }} disabled={loginLoading} data-testid="wl-admin-login-submit">
                {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : <><LogIn className="h-4 w-4" /> Entrar</>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs opacity-50 mt-6" style={{ color: corTexto }}>Powered by Transmill</p>
      </div>
    </div>
  );
};

export default FranquiaAdminLogin;
