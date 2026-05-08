import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// AuthContext is defined in App.js
import { API_URL } from '../config/api';

const API = API_URL;
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Briefcase, 
  Clock, 
  Shield, 
  Eye, 
  EyeOff,
  ArrowLeft,
  CheckCircle,
  UserPlus,
  Building2
} from 'lucide-react';
import axios from 'axios';
import TransmillLogoCompact from './TransmillLogoCompact';

const ServiceProviderRegister = () => {
  const navigate = useNavigate();

  // States
  const [formData, setFormData] = useState({
    full_name: '',
    fantasy_name: '',
    document: '',
    document_type: 'cpf',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    provider_type_id: '',
    profile_description: '',
    working_hours: JSON.stringify({
      monday: { start: '08:00', end: '18:00', active: true },
      tuesday: { start: '08:00', end: '18:00', active: true },
      wednesday: { start: '08:00', end: '18:00', active: true },
      thursday: { start: '08:00', end: '18:00', active: true },
      friday: { start: '08:00', end: '18:00', active: true },
      saturday: { start: '08:00', end: '12:00', active: false },
      sunday: { start: '08:00', end: '12:00', active: false }
    }),
    accepts_emergency: false
  });

  const [providerTypes, setProviderTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Load provider types
  useEffect(() => {
    fetchProviderTypes();
  }, []);

  const fetchProviderTypes = async () => {
    try {
      const response = await axios.get(`${API}/public/service-provider-types`);
      if (response.data.success) {
        // Os tipos já vêm filtrados (apenas ativos) do backend
        setProviderTypes(response.data.data.types);
      }
    } catch (error) {
      console.error('Error fetching provider types:', error);
      toast.error('Erro ao carregar tipos de prestadores');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    const required = ['full_name', 'email', 'password', 'phone', 'document'];
    for (let field of required) {
      if (!formData[field]) {
        toast.error('Preencha todos os campos obrigatórios');
        return false;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const required = ['address_street', 'address_number', 'address_neighborhood', 'address_city', 'address_state', 'address_zipcode'];
    for (let field of required) {
      if (!formData[field]) {
        toast.error('Preencha todos os campos de endereço');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.provider_type_id) {
      toast.error('Selecione um tipo de prestador');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading(true);

    try {
      const submitData = { ...formData };
      delete submitData.confirmPassword;

      const response = await axios.post(`${API}/auth/register-service-provider`, submitData);

      if (response.data.success) {
        toast.success('Cadastro realizado com sucesso! Aguarde a aprovação.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Erro no cadastro');
    } finally {
      setLoading(false);
    }
  };

  const selectedProviderType = providerTypes.find(type => type.id === formData.provider_type_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-[#005B9C] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <TransmillLogoCompact width={150} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cadastro de Prestador
          </h1>
          <p className="text-gray-600">
            Junte-se à nossa rede de prestadores de serviço
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle size={20} /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 && <User size={20} />}
              {currentStep === 2 && <MapPin size={20} />}
              {currentStep === 3 && <Briefcase size={20} />}
              <span>
                {currentStep === 1 && 'Dados Pessoais'}
                {currentStep === 2 && 'Endereço'}
                {currentStep === 3 && 'Informações Profissionais'}
              </span>
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Informe seus dados pessoais e de acesso'}
              {currentStep === 2 && 'Informe seu endereço completo'}
              {currentStep === 3 && 'Escolha seu tipo de serviço e complete o perfil'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              
              {/* Step 1: Personal Data */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                      <Input
                        id="fantasy_name"
                        value={formData.fantasy_name}
                        onChange={(e) => handleInputChange('fantasy_name', e.target.value)}
                        placeholder="Nome do seu negócio (opcional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="document_type">Tipo de Documento</Label>
                      <Select value={formData.document_type} onValueChange={(value) => handleInputChange('document_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="document">{formData.document_type.toUpperCase()} *</Label>
                      <Input
                        id="document"
                        value={formData.document}
                        onChange={(e) => handleInputChange('document', e.target.value)}
                        placeholder={`Digite o ${formData.document_type.toUpperCase()}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repita a senha"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address_street">Rua/Avenida *</Label>
                      <Input
                        id="address_street"
                        value={formData.address_street}
                        onChange={(e) => handleInputChange('address_street', e.target.value)}
                        placeholder="Nome da rua"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address_number">Número *</Label>
                      <Input
                        id="address_number"
                        value={formData.address_number}
                        onChange={(e) => handleInputChange('address_number', e.target.value)}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={formData.address_complement}
                      onChange={(e) => handleInputChange('address_complement', e.target.value)}
                      placeholder="Apartamento, sala, etc. (opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address_neighborhood">Bairro *</Label>
                      <Input
                        id="address_neighborhood"
                        value={formData.address_neighborhood}
                        onChange={(e) => handleInputChange('address_neighborhood', e.target.value)}
                        placeholder="Nome do bairro"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address_city">Cidade *</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => handleInputChange('address_city', e.target.value)}
                        placeholder="Nome da cidade"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address_state">Estado *</Label>
                      <Select value={formData.address_state} onValueChange={(value) => handleInputChange('address_state', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AC">Acre</SelectItem>
                          <SelectItem value="AL">Alagoas</SelectItem>
                          <SelectItem value="AP">Amapá</SelectItem>
                          <SelectItem value="AM">Amazonas</SelectItem>
                          <SelectItem value="BA">Bahia</SelectItem>
                          <SelectItem value="CE">Ceará</SelectItem>
                          <SelectItem value="DF">Distrito Federal</SelectItem>
                          <SelectItem value="ES">Espírito Santo</SelectItem>
                          <SelectItem value="GO">Goiás</SelectItem>
                          <SelectItem value="MA">Maranhão</SelectItem>
                          <SelectItem value="MT">Mato Grosso</SelectItem>
                          <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          <SelectItem value="PA">Pará</SelectItem>
                          <SelectItem value="PB">Paraíba</SelectItem>
                          <SelectItem value="PR">Paraná</SelectItem>
                          <SelectItem value="PE">Pernambuco</SelectItem>
                          <SelectItem value="PI">Piauí</SelectItem>
                          <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                          <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                          <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                          <SelectItem value="RO">Rondônia</SelectItem>
                          <SelectItem value="RR">Roraima</SelectItem>
                          <SelectItem value="SC">Santa Catarina</SelectItem>
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="SE">Sergipe</SelectItem>
                          <SelectItem value="TO">Tocantins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="address_zipcode">CEP *</Label>
                      <Input
                        id="address_zipcode"
                        value={formData.address_zipcode}
                        onChange={(e) => handleInputChange('address_zipcode', e.target.value)}
                        placeholder="00000-000"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Professional Info */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider_type_id">Tipo de Prestador *</Label>
                    <Select value={formData.provider_type_id} onValueChange={(value) => handleInputChange('provider_type_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de serviço que você oferece" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center space-x-2">
                              <span>{type.icon}</span>
                              <span>{type.name}</span>
                              <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">
                                {type.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedProviderType && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>{selectedProviderType.name}</strong>
                          {selectedProviderType.description && (
                            <span> - {selectedProviderType.description}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="profile_description">Descrição do seu trabalho</Label>
                    <textarea
                      id="profile_description"
                      value={formData.profile_description}
                      onChange={(e) => handleInputChange('profile_description', e.target.value)}
                      placeholder="Descreva sua experiência, especialidades e diferenciais..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accepts_emergency"
                      checked={formData.accepts_emergency}
                      onChange={(e) => handleInputChange('accepts_emergency', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="accepts_emergency" className="flex items-center">
                      <Shield className="mr-2" size={16} />
                      Aceito chamadas de emergência
                    </Label>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Próximos passos:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Seu cadastro será analisado pela nossa equipe</li>
                      <li>• Você receberá um e-mail com o resultado em até 24 horas</li>
                      <li>• Após a aprovação, poderá configurar seus serviços e horários</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <div>
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2" size={16} />
                      Voltar
                    </Button>
                  ) : (
                    <Link to="/login">
                      <Button type="button" variant="outline">
                        <ArrowLeft className="mr-2" size={16} />
                        Fazer Login
                      </Button>
                    </Link>
                  )}
                </div>

                <div>
                  {currentStep < 3 ? (
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Próximo
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2" size={16} />
                          Finalizar Cadastro
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Já tem uma conta? {' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderRegister;