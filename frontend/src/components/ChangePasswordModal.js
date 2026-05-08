import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config/api';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecial: false
  });

  // Validar força da senha
  const validatePassword = (password) => {
    const strength = {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordStrength(strength);
    return Object.values(strength).every(v => v);
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setFormData({...formData, newPassword: password});
    validatePassword(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 handleSubmit chamado');
    // Log sem dados sensíveis - apenas indicador de força
    console.log('Password strength:', passwordStrength);

    // Validações
    if (!formData.currentPassword) {
      toast.error('Digite a senha provisória atual');
      return;
    }

    if (!formData.newPassword) {
      toast.error('Digite a nova senha');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      toast.error('A senha não atende aos requisitos de segurança');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('A nova senha deve ser diferente da senha provisória');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const API = typeof API_URL === 'function' ? API_URL() : API_URL;
      
      // Log sem dados sensíveis
      console.log('🔐 Alterando senha...');
      
      const response = await axios.post(
        `${API}/auth/change-password`,
        {
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Resposta recebida:', response.data);

      if (response.data.success) {
        toast.success('✅ Senha alterada com sucesso!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onSuccess && onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isPasswordStrong = Object.values(passwordStrength).every(v => v);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;
  const isButtonDisabled = loading || !isPasswordStrong || !passwordsMatch;
  
  // Debug log
  if (formData.newPassword || formData.confirmPassword) {
    console.log('🔍 Estado do botão:', {
      loading,
      isPasswordStrong,
      passwordsMatch,
      isButtonDisabled,
      passwordStrength
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Não pode fechar - obrigatório trocar senha */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            🔐 Troca de Senha Obrigatória
          </h2>
          <p className="text-gray-600 text-sm">
            Por segurança, você precisa alterar sua senha provisória antes de acessar o sistema.
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">⚠️ Primeira Acesso Detectado</h3>
              <p className="text-sm text-yellow-800">
                Esta é a sua senha provisória. Por motivos de segurança, crie uma nova senha forte que só você saiba.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Senha Atual (Provisória) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Senha Provisória Atual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12 text-sm"
                placeholder="Digite a senha provisória"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleNewPasswordChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12 text-sm"
                placeholder="Digite sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Requisitos da Senha */}
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700">Requisitos da senha:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center gap-2 text-sm ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordStrength.length ? <Check size={16} /> : <X size={16} />}
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordStrength.hasNumber ? <Check size={16} /> : <X size={16} />}
                  <span>Pelo menos 1 número</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${passwordStrength.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordStrength.hasLetter ? <Check size={16} /> : <X size={16} />}
                  <span>Pelo menos 1 letra</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordStrength.hasSpecial ? <Check size={16} /> : <X size={16} />}
                  <span>Pelo menos 1 especial (!@#$...)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12 text-sm"
                placeholder="Digite a nova senha novamente"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <X size={16} /> As senhas não coincidem
              </p>
            )}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <Check size={16} /> As senhas coincidem
              </p>
            )}
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isButtonDisabled}
            onClick={(e) => {
              console.log('🖱️ Botão clicado!');
              console.log('Botão desabilitado?', isButtonDisabled);
              if (isButtonDisabled) {
                e.preventDefault();
                console.log('❌ Botão está desabilitado, submit cancelado');
                if (!isPasswordStrong) {
                  toast.error('A senha não atende aos requisitos de segurança');
                } else if (!passwordsMatch) {
                  toast.error('As senhas não coincidem');
                }
              }
            }}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Alterando Senha...
              </>
            ) : (
              <>
                <Lock size={20} />
                Alterar Senha e Continuar
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Sua senha é criptografada e armazenada com segurança
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
