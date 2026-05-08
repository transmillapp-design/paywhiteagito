import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import TransmillLogo from './TransmillLogo';
import axios from 'axios';

const ResetPassword = () => {
  const { API } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Verificar código, 2: Nova senha
  const [codeVerified, setCodeVerified] = useState(false);

  useEffect(() => {
    // Se não tem email na navegação, redirecionar para forgot-password
    if (!formData.email) {
      navigate('/forgot-password');
    }
  }, [formData.email, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/verify-reset-code`, {
        email: formData.email,
        reset_code: formData.resetCode
      });
      
      if (response.status === 200) {
        setCodeVerified(true);
        setStep(2);
        toast.success('Código verificado! Agora defina sua nova senha.');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      const errorMessage = error.response?.data?.detail || 'Código inválido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    
    // Validações
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/reset-password`, {
        email: formData.email,
        reset_code: formData.resetCode,
        new_password: formData.newPassword
      });
      
      if (response.status === 200) {
        toast.success('Senha alterada com sucesso!');
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao redefinir senha';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (code) => {
    // Formatação visual do código (123456 -> 123 456)
    return code.replace(/(\d{3})(\d{3})/, '$1 $2');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3 mb-8">
          <TransmillLogo width={280} />
        </div>

        {/* Reset Password Form */}
        <Card className="glass-effect border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Verificar Código' : 'Nova Senha'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1 ? 
                `Código enviado para ${formData.email}` : 
                'Defina sua nova senha de acesso'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 ? (
              // Etapa 1: Verificar código
              <form onSubmit={verifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetCode" className="text-sm font-medium text-gray-700">
                    Código de Verificação
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="resetCode"
                      name="resetCode"
                      type="text"
                      placeholder="123456"
                      value={formData.resetCode}
                      onChange={handleChange}
                      required
                      maxLength={6}
                      className="input-field pl-12 text-center text-lg font-mono tracking-wider"
                      data-testid="reset-code-input"
                      autoComplete="off"
                    />
                  </div>
                  {formData.resetCode && (
                    <div className="text-center text-sm text-gray-500">
                      {formatCode(formData.resetCode)}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || formData.resetCode.length !== 6}
                  className="w-full btn-primary"
                  data-testid="verify-code-btn"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={18} />
                      <span>Verificar Código</span>
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              // Etapa 2: Nova senha
              <form onSubmit={resetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua nova senha"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="input-field pr-12"
                      data-testid="new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua nova senha"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="input-field pr-12"
                      data-testid="confirm-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {formData.newPassword && formData.confirmPassword && (
                  <div className={`text-sm ${formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.newPassword === formData.confirmPassword ? '✓ Senhas conferem' : '✗ Senhas não conferem'}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || formData.newPassword !== formData.confirmPassword || formData.newPassword.length < 6}
                  className="w-full btn-primary"
                  data-testid="reset-password-btn"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Alterando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Key size={18} />
                      <span>Alterar Senha</span>
                    </div>
                  )}
                </Button>
              </form>
            )}

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

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2">
          <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
          <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
        </div>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">💡 Dicas:</p>
              {step === 1 ? (
                <>
                  <p>• Digite apenas os 6 números recebidos por email</p>
                  <p>• Código válido por 15 minutos</p>
                  <p>• Verifique a caixa de spam se não recebeu</p>
                </>
              ) : (
                <>
                  <p>• Use pelo menos 6 caracteres</p>
                  <p>• Combine letras e números</p>
                  <p>• Evite senhas muito simples</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;