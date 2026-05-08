import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import TransmillLogo from './TransmillLogo';
import axios from 'axios';

const ForgotPassword = () => {
  const { API } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      
      if (response.status === 200) {
        setCodeSent(true);
        toast.success('Código enviado para seu email!');
        // Redirecionar para tela de redefinição com email
        navigate('/reset-password', { state: { email } });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao enviar código';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3 mb-8">
          <TransmillLogo width={280} />
        </div>

        {/* Forgot Password Form */}
        <Card className="glass-effect border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-gray-600">
              Digite seu email para receber o código de recuperação
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-12"
                    data-testid="forgot-email-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full btn-primary"
                data-testid="send-code-btn"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send size={18} />
                    <span>Enviar Código</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                data-testid="back-login-link"
              >
                <ArrowLeft size={18} />
                <span>Voltar para Login</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-semibold">📧 Sobre o código:</p>
              <p>• O código tem 6 dígitos numéricos</p>
              <p>• Válido por 15 minutos</p>
              <p>• Máximo de 2 tentativas por mês</p>
              <p>• Verifique também sua caixa de spam</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;