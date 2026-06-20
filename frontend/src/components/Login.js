import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const { login, API } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Paleta de cores - Admin Transmill Plataforma (Azul)
  const theme = {
    bg: '#0d2847',           // Azul escuro - fundo principal
    card: '#FFFFFF',         // Card branco para contraste
    cardBorder: '#1a59ad',   // Azul - borda
    text: '#1a59ad',         // Azul - texto principal
    textLight: '#4a7bc4',    // Azul mais claro - texto secundário
    input: '#FFFFFF',        // Fundo input branco
    inputBorder: '#1a59ad',  // Borda input azul
    button: '#1a59ad',       // Botão azul
    buttonHover: '#14478a',  // Botão hover
    buttonText: '#FFFFFF',   // Texto botão branco
    link: '#1a59ad',         // Links azul
    icon: '#FFFFFF',         // Ícone branco
    iconBg: '#1a59ad',       // Fundo ícone azul
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      
      // Log sem dados sensíveis
      console.log('📝 Login response received');
      
      if (response.data.access_token) {
        const mustChangePassword = response.data.must_change_password || false;
        const userData = response.data.user;
        
        console.log('🔐 Must change password:', mustChangePassword);
        console.log('👤 User type:', userData?.user_type);
        
        login(userData, response.data.access_token, mustChangePassword);
        
        if (mustChangePassword) {
          toast.info('Por favor, altere sua senha provisória');
        } else {
          toast.success('Login realizado com sucesso!');
        }
        
        // Redirecionar baseado no tipo de usuário
        // Admin Transmill Plataforma vai para o painel admin
        if (userData?.user_type === 'master' && userData?.is_labelview_master) {
          navigate('/admin/franquias');
        } else if (userData?.user_type?.startsWith('labelview_') || 
            userData?.is_labelview_unidade) {
          navigate('/labelview/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Logo branca sobre o fundo verde */}
      <div className="mb-6">
        <img 
          src="/T-Transmill-Branco.png"
          alt="Transmill Logo"
          className="h-24 w-auto object-contain drop-shadow-lg"
        />
      </div>

      <Card 
        className="w-full max-w-md shadow-2xl border-2"
        style={{ 
          backgroundColor: theme.card,
          borderColor: theme.cardBorder
        }}
      >
        <CardHeader className="text-center pb-2">
          <CardTitle 
            className="text-3xl font-bold"
            style={{ color: theme.text }}
          >
            Transmill
          </CardTitle>
          <CardDescription 
            className="text-base"
            style={{ color: theme.textLight }}
          >
            Plataforma de Gestão de White Labels
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="email"
                style={{ color: theme.text }}
              >
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="text-gray-800"
                style={{ 
                  backgroundColor: theme.input,
                  borderColor: theme.inputBorder
                }}
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password"
                style={{ color: theme.text }}
              >
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pr-10 text-gray-800"
                  style={{ 
                    backgroundColor: theme.input,
                    borderColor: theme.inputBorder
                  }}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: theme.link }}
                  data-testid="password-toggle-btn"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link 
                to="/forgot-password" 
                className="underline hover:opacity-80"
                style={{ color: theme.link }}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-6 text-lg shadow-lg hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: theme.button,
                color: theme.buttonText
              }}
              data-testid="login-submit-btn"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
