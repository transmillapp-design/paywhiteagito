import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../App';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const isMaster = (u) => Boolean(u?.is_master_account || u?.user_type === 'master');

const MasterLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Preencha todos os campos'); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/login`, form);
      if (res.data.access_token) {
        const user = res.data.user;
        if (!isMaster(user)) {
          toast.error('Acesso restrito à conta Master Admin');
          return;
        }
        authLogin(user, res.data.access_token);
        toast.success('Bem-vindo, Master Admin');
        navigate('/master');
      } else {
        toast.error(res.data.detail || 'Erro ao fazer login');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0d2847 0%, #1a59ad 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Transmill</h1>
          <p className="text-sm text-white/70">Painel Master Admin</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Acesso Master</CardTitle>
            <CardDescription>Entre com sua conta master</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="master@transmill.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="master-login-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="master-login-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" style={{ backgroundColor: '#1a59ad' }} disabled={loading} data-testid="master-login-submit">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : <><LogIn className="h-4 w-4" /> Entrar</>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-white/50 mt-6">Acesso exclusivo da administração Transmill</p>
      </div>
    </div>
  );
};

export default MasterLogin;
