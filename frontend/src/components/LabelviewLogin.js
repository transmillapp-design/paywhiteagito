import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Truck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';

const LabelviewLogin = () => {
  const navigate = useNavigate();
  const { API, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log sem dados sensíveis
      console.log('=== LABELVIEW LOGIN ===');
      console.log('API URL:', API);
      
      const response = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data.access_token) {
        const userData = response.data.user;
        
        console.log('User data:', userData);
        console.log('user_type:', userData.user_type);
        
        // Verificar se o usuário faz parte da hierarquia Labelview
        const labelviewTypes = [
          'labelview_master',
          'labelview_unidade', 
          'labelview_regional',
          'labelview_consultor'
        ];
        
        const isLabelviewUser = labelviewTypes.includes(userData.user_type) || 
                                userData.is_labelview_master ||
                                userData.is_labelview_unidade ||
                                userData.is_labelview_regional ||
                                userData.is_labelview_consultor;
        
        if (!isLabelviewUser) {
          console.error('Acesso negado - não pertence à hierarquia Labelview');
          toast.error('Acesso negado. Este sistema é exclusivo para a rede Labelview.');
          setLoading(false);
          return;
        }

        // Salvar dados usando o context (atualiza state + localStorage)
        login(userData, response.data.access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Login bem-sucedido! Redirecionando...');
        toast.success('Login realizado com sucesso!');
        
        // Redirecionar usando navigate (sem reload)
        setTimeout(() => {
          navigate('/labelview/dashboard');
        }, 500);
      }
    } catch (error) {
      console.error('=== ERRO NO LOGIN ===');
      console.error('Error object:', error);
      console.error('Response:', error.response);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      // Extrair mensagem de erro de forma segura
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Se detail for um array de erros de validação
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } 
        // Se detail for uma string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Se detail for um objeto
        else if (typeof detail === 'object') {
          errorMessage = JSON.stringify(detail);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e3dcda] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1a59ad] rounded-full shadow-lg mb-4 border-4 border-[#2fa31c]">
            <Truck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1a59ad] mb-2">Labelview</h1>
          <p className="text-gray-700 text-lg">Gestão de Proteção Veicular</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Acesso Master</CardTitle>
            <p className="text-sm text-gray-500 text-center">
              Faça login para acessar o painel administrativo
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a59ad] hover:bg-[#2fa31c] text-white py-6 text-lg font-semibold border-2 border-[#2fa31c]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>

            {/* Credenciais de Demo */}
            <div className="mt-6 p-4 bg-[#2fa31c]/10 rounded-lg border-2 border-[#2fa31c]">
              <p className="text-xs font-semibold text-[#1a59ad] mb-2">
                📋 Credenciais de Acesso:
              </p>
              <div className="space-y-1 text-xs text-gray-700">
                <p><strong>Email:</strong> protecao@transmill.com</p>
                <p><strong>Senha:</strong> demo123</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2fa31c]">
                <p className="text-xs text-gray-600">
                  🔍 Debug Info: API = {API}
                </p>
              </div>
            </div>

            {/* Link para Transmill */}
            <div className="mt-4 text-center">
              <a
                href="/"
                className="text-sm text-[#1a59ad] hover:text-[#2fa31c] hover:underline font-semibold"
              >
                ← Voltar para Transmill
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Labelview - Proteção Veicular</p>
          <p className="mt-1 text-gray-500">Powered by Transmill</p>
        </div>
      </div>
    </div>
  );
};

export default LabelviewLogin;
