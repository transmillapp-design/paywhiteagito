import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, CreditCard, User, Building2, Briefcase } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const { login, API } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: '',
    // Campo para clientes
    cpf: '',
    // Campos para lojistas
    company_name: '',
    cnpj: '',
    address: '',
    whatsapp: '',
    // Sistema de indicações
    referral_code_used: '',
    // Imagem de perfil
    profile_image: ''
  });
  
  // Verificar se há código de indicação na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code_used: refCode }));
      // Buscar informações do indicador
      fetchReferrerInfo(refCode);
    }
  }, []);

  const fetchReferrerInfo = async (refCode) => {
    try {
      const response = await axios.get(`${API}/referral/validate/${refCode}`);
      if (response.status === 200) {
        setReferrerInfo(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar informações do indicador:', error);
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData(prev => ({ ...prev, profile_image: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      
      if (response.data.access_token) {
        login(response.data.user, response.data.access_token);
        toast.success('Conta criada com sucesso!');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação do CPF
    if (name === 'cpf') {
      // Remove todos os caracteres não numéricos
      const numbersOnly = value.replace(/\D/g, '');
      // Aplica a máscara XXX.XXX.XXX-XX
      const formatted = numbersOnly
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      user_type: value
    });
  };

  const isLojista = formData.user_type === 'lojista';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="agito-logo justify-center">
            <div className="agito-logo-icon">
              <CreditCard size={24} />
            </div>
            <span>Transmill</span>
          </div>
          <p className="text-gray-600">Crie sua conta e comece a usar</p>
        </div>

        {/* Register Form */}
        <Card className="glass-effect border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            {referrerInfo ? (
              <>
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border-2 border-blue-200">
                  <div className="text-2xl mb-2">🎉</div>
                  <h3 className="text-lg font-bold text-blue-800 mb-1">
                    {referrerInfo.referrer_name} está te indicando!
                  </h3>
                  <p className="text-sm text-blue-700">
                    Você foi convidado para fazer parte da melhor plataforma de consumo com cashback do Brasil
                  </p>
                  <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Código: {formData.referral_code_used}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Complete seu Cadastro</CardTitle>
                <CardDescription className="text-gray-600">
                  Preencha os dados abaixo e ganhe bônus na primeira compra!
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-bold text-gray-900">Criar Conta</CardTitle>
                <CardDescription className="text-gray-600">
                  Preencha os dados para criar sua conta Transmill
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de usuário */}
              <div className="space-y-2">
                <Label htmlFor="user_type" className="text-sm font-medium text-gray-700">
                  Tipo de Conta
                </Label>
                <Select onValueChange={handleSelectChange} required>
                  <SelectTrigger className="input-field" data-testid="user-type-select">
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">
                      <div className="flex items-center space-x-2">
                        <User size={16} />
                        <span>Cliente - Para fazer compras</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lojista">
                      <div className="flex items-center space-x-2">
                        <Building2 size={16} />
                        <span>Lojista - Para receber vendas</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="service_provider">
                      <div className="flex items-center space-x-2">
                        <Briefcase size={16} />
                        <span>Prestador - Para oferecer serviços</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aviso para prestadores */}
              {formData.user_type === 'service_provider' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Briefcase className="text-blue-600 mt-1" size={20} />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Cadastro de Prestador</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Para se cadastrar como prestador de serviço, você precisa preencher informações adicionais.
                      </p>
                      <Link 
                        to="/register/prestador" 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Briefcase size={16} className="mr-2" />
                        Ir para Cadastro Completo
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    {isLojista ? 'Nome do Responsável' : 'Nome Completo'}
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder={isLojista ? 'Nome do responsável' : 'Seu nome completo'}
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    data-testid="full-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field"
                    data-testid="phone-input"
                  />
                </div>

                {/* CPF - obrigatório apenas para clientes */}
                {!isLojista && (
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      required={!isLojista}
                      className="input-field"
                      data-testid="cpf-input"
                      maxLength={14}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field pr-12"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    data-testid="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Código de Indicação */}
              <div className="space-y-2">
                <Label htmlFor="referral_code_used" className="text-sm font-medium text-gray-700">
                  Código de Indicação (opcional)
                </Label>
                <Input
                  id="referral_code_used"
                  name="referral_code_used"
                  type="text"
                  placeholder="Digite o código de quem te indicou"
                  value={formData.referral_code_used}
                  onChange={handleChange}
                  className="input-field"
                  data-testid="referral-code-input"
                />
                {formData.referral_code_used && (
                  <p className="text-sm text-green-600">
                    🎉 Ótimo! Você ganhará bônus na primeira compra
                  </p>
                )}
              </div>

              {/* Upload de Imagem de Perfil */}
              <div className="space-y-2">
                <Label htmlFor="profile_image" className="text-sm font-medium text-gray-700">
                  {isLojista ? 'Logo da Empresa (opcional)' : 'Foto de Perfil (opcional)'}
                </Label>
                
                <div className="flex flex-col space-y-3">
                  <Input
                    id="profile_image"
                    name="profile_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="input-field"
                    data-testid="profile-image-input"
                  />
                  
                  {imagePreview && (
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt={isLojista ? "Preview do logo" : "Preview da foto"}
                          className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, profile_image: '' }));
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {isLojista 
                      ? 'Envie o logo da sua empresa (JPG, PNG - máx. 2MB)'
                      : 'Envie sua foto de perfil (JPG, PNG - máx. 2MB)'
                    }
                  </p>
                </div>
              </div>

              {/* Campos específicos para lojistas */}
              {isLojista && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 flex items-center space-x-2">
                    <Building2 size={18} />
                    <span>Dados da Empresa</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                        Nome da Empresa *
                      </Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        type="text"
                        placeholder="Nome da sua empresa"
                        value={formData.company_name}
                        onChange={handleChange}
                        required={isLojista}
                        className="input-field"
                        data-testid="company-name-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                        CNPJ *
                      </Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        type="text"
                        placeholder="00.000.000/0001-00"
                        value={formData.cnpj}
                        onChange={handleChange}
                        required={isLojista}
                        className="input-field"
                        data-testid="cnpj-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Endereço
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="Endereço completo"
                        value={formData.address}
                        onChange={handleChange}
                        className="input-field"
                        data-testid="address-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                        WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="input-field"
                        data-testid="whatsapp-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !formData.user_type}
                className="w-full btn-primary"
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Criando conta...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus size={18} />
                    <span>Criar Conta</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                  data-testid="login-link"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;