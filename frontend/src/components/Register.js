import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Eye, EyeOff, UserPlus, CreditCard, User, Building2, Briefcase,
  ArrowLeft, ArrowRight, CheckCircle, MapPin, Clock, FileText, Truck
} from 'lucide-react';
import axios from 'axios';
import TransmillLogoCompact from './TransmillLogoCompact';

const RegisterUnified = ({ franquiaContext }) => {
  const { login, API } = useAuth();
  const navigate = useNavigate();
  
  // Cores da franquia (se houver contexto)
  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';
  const corSecundaria = franquiaContext?.cor_secundaria || '#EEEEEE';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Campos básicos (todos os tipos)
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    user_type: '',
    military_status: '', // Status militar (para tipos militares)
    
    // === NOVOS CAMPOS OBRIGATÓRIOS (TODOS OS TIPOS) ===
    
    // Dados PIX para saque (obrigatório)
    pix_key: '',
    pix_key_type: '',
    
    // Endereço completo (obrigatório)
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    
    // Documentos obrigatórios (RG frente e verso)
    rg_front: '',
    rg_back: '',
    
    // === CAMPOS ESPECÍFICOS POR TIPO ===
    
    // Cliente
    cpf: '',
    tipo_pessoa: 'fisica', // fisica ou juridica (para clientes)
    
    // Militar
    rg_militar: '',
    
    // Lojista/Empresa
    company_name: '',
    cnpj: '',
    whatsapp: '',
    business_segment: '',
    google_maps_url: '',
    
    // Dados do sócio administrador (obrigatório para CNPJ)
    admin_name: '',
    admin_cpf: '',
    admin_email: '',
    admin_whatsapp: '',
    admin_rg_front: '',
    admin_rg_back: '',
    
    // === CAMPOS LEGADOS (PRESTADOR) ===
    fantasy_name: '',
    document: '',
    document_type: 'cpf',
    provider_type_id: '',
    profile_description: '',
    working_hours: '',
    accepts_emergency: false,
    google_maps_url: '', // Link do Google Maps para prestadores
    
    // Endereço (campos legados para compatibilidade)
    address: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    
    // Sistema de indicações
    referral_code_used: '',
    profile_image: '',
    
    // Taxa de cashback (obrigatório para lojista e prestador)
    cashback_rate: '5.0', // Default 5%
    
    // Configurações de entrega (lojista)
    accepts_pickup: true,      // Padrão: aceita retirada
    accepts_delivery: false,   // Padrão: não aceita delivery
    preparation_time: '30'     // Padrão: 30 minutos
  });
  
  const [providerTypes, setProviderTypes] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  
  // === FUNÇÕES AUXILIARES ===
  
  // Função para tratar erros estruturados do backend
  const handleApiError = (error, defaultMessage = 'Erro na operação') => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      if (Array.isArray(detail)) {
        // Erro de validação estruturado do Pydantic - extrair mensagens relevantes
        const errorMessages = detail
          .map(err => {
            // Mapear campos para nomes mais amigáveis
            const fieldMap = {
              'pix_key': 'Chave PIX',
              'pix_key_type': 'Tipo da Chave PIX',
              'full_name': 'Nome Completo',
              'email': 'E-mail',
              'phone': 'Telefone',
              'cpf': 'CPF',
              'cnpj': 'CNPJ',
              'cep': 'CEP',
              'street': 'Rua',
              'number': 'Número',
              'neighborhood': 'Bairro',
              'city': 'Cidade',
              'state': 'Estado',
              'rg_front': 'RG Frente',
              'rg_back': 'RG Verso',
              'admin_cpf': 'CPF do Sócio',
              'admin_name': 'Nome do Sócio'
            };
            
            const fieldName = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : 'campo';
            const friendlyFieldName = fieldMap[fieldName] || fieldName;
            
            if (err.type === 'missing') {
              return `${friendlyFieldName} é obrigatório`;
            } else if (err.type === 'value_error') {
              return `${friendlyFieldName}: ${err.msg}`;
            } else {
              return `${friendlyFieldName}: ${err.msg}`;
            }
          })
          .slice(0, 3); // Limitar a 3 mensagens para não sobrecarregar
          
        const message = errorMessages.join('; ');
        return `${message}${detail.length > 3 ? ' (e outros erros)' : ''}`;
      } else if (typeof detail === 'string') {
        // Erro simples de string
        return detail;
      } else {
        // Outro tipo de erro estruturado
        return 'Erro de validação nos dados informados';
      }
    } else {
      return defaultMessage;
    }
  };
  
  // Função para validar CPF
  const validateCPF = (cpf) => {
    // Remove formatação
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  // Função para converter arquivo para base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = () => {
          try {
            resolve(reader.result);
          } catch (err) {
            reject(new Error('Erro ao processar resultado: ' + err.message));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Erro ao ler arquivo: ' + reader.error?.message || 'Desconhecido'));
        };
        
        reader.onabort = () => {
          reject(new Error('Leitura do arquivo foi abortada'));
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        reject(new Error('Erro ao iniciar leitura: ' + error.message));
      }
    });
  };
  
  // Validar formato e tamanho de arquivo
  const validateFile = (file) => {
    const maxSize = 3 * 1024 * 1024; // 3MB (reduzido para evitar problemas de memória)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG ou PDF');
      console.error('Invalid file type:', file.type);
      return false;
    }
    
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`Arquivo muito grande (${sizeMB}MB). Máximo 3MB`);
      console.error('File too large:', file.size);
      return false;
    }
    
    if (file.size === 0) {
      toast.error('Arquivo vazio ou corrompido');
      console.error('Empty file');
      return false;
    }
    
    console.log('File validation passed');
    return true;
  };
  
  // Função para upload de documento
  const handleFileUpload = async (event, fieldName) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log(`Uploading ${fieldName}:`, file.name, file.size, file.type);
    
    if (!validateFile(file)) {
      event.target.value = ''; // Limpar input
      return;
    }
    
    // Mostrar loading
    toast.loading(`Processando ${fieldName === 'rg_front' ? 'RG Frente' : fieldName === 'rg_back' ? 'RG Verso' : 'documento'}...`, { id: fieldName });
    
    try {
      const base64 = await convertToBase64(file);
      console.log(`Base64 converted for ${fieldName}, length:`, base64.length);
      
      // Usar callback para garantir que o estado não seja perdido
      setFormData(prev => {
        const newData = {
          ...prev,
          [fieldName]: base64
        };
        console.log('FormData updated with', fieldName);
        return newData;
      });
      
      toast.success(`✅ ${fieldName === 'rg_front' ? 'RG Frente' : fieldName === 'rg_back' ? 'RG Verso' : 'Documento'} carregado!`, { id: fieldName });
    } catch (error) {
      console.error('Erro upload:', error);
      toast.error(`Erro ao processar ${fieldName}: ${error.message}`, { id: fieldName });
      event.target.value = ''; // Limpar input em caso de erro
    }
  };
  
  // Validar chave PIX - formato básico apenas
  // Nota: Não validamos se a chave pertence ao CPF/CNPJ - isso seria responsabilidade do banco
  const validatePixKey = (key, type) => {
    if (!key || !type) return false;
    
    const trimmedKey = key.trim();
    
    switch (type) {
      case 'cpf':
        // CPF: pode ser formatado (000.000.000-00) ou apenas números (00000000000)
        const cpfClean = trimmedKey.replace(/\D/g, '');
        return cpfClean.length === 11 && /^\d+$/.test(cpfClean);
      case 'cnpj':
        // CNPJ: pode ser formatado (00.000.000/0000-00) ou apenas números
        const cnpjClean = trimmedKey.replace(/\D/g, '');
        return cnpjClean.length === 14 && /^\d+$/.test(cnpjClean);
      case 'email':
        // Email: validação mais permissiva
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedKey);
      case 'phone':
        // Telefone: 10 ou 11 dígitos (com ou sem formatação)
        const phoneClean = trimmedKey.replace(/\D/g, '');
        return phoneClean.length >= 10 && phoneClean.length <= 11;
      case 'random':
        // Chave aleatória: formato UUID ou 32 caracteres alfanuméricos
        const randomClean = trimmedKey.replace(/[-\s]/g, '');
        return (randomClean.length === 32 || randomClean.length === 36) && /^[a-zA-Z0-9]+$/.test(randomClean);
      default:
        return false;
    }
  };
  
  // Validar CEP
  const validateCEP = (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  };
  
  // === FUNÇÕES DE FORMATAÇÃO ===
  
  // Formatar CPF
  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };
  
  // Formatar CNPJ  
  const formatCNPJ = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };
  
  // Formatar Telefone
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };
  
  // Formatar CEP
  const formatCEP = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };
  
  // Handlers com formatação
  const handleCPFChange = (e, fieldName = 'cpf') => {
    const formatted = formatCPF(e.target.value);
    setFormData({...formData, [fieldName]: formatted});
  };
  
  const handleCNPJChange = (e) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData({...formData, cnpj: formatted});
  };
  
  const handlePhoneChange = (e, fieldName = 'phone') => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, [fieldName]: formatted});
  };
  
  const handleCEPChange = async (e) => {
    const formatted = formatCEP(e.target.value);
    setFormData({...formData, cep: formatted});
    
    // Buscar endereço automaticamente quando CEP tiver 9 caracteres (00000-000)
    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cep: formatted,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success('Endereço encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };
  
  // Handler para CEP de prestador de serviço
  const handleProviderCEPChange = async (e) => {
    const formatted = formatCEP(e.target.value);
    setFormData({...formData, address_zipcode: formatted});
    
    // Buscar endereço automaticamente quando CEP tiver 9 caracteres (00000-000)
    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address_zipcode: formatted,
            address_street: data.logradouro || prev.address_street,
            address_neighborhood: data.bairro || prev.address_neighborhood,
            address_city: data.localidade || prev.address_city,
            address_state: data.uf || prev.address_state
          }));
          toast.success('Endereço encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };
  
  // Verificar código de indicação na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      // Quando há código de indicação, define automaticamente como cliente
      setFormData(prev => ({ 
        ...prev, 
        referral_code_used: refCode,
        user_type: 'cliente' // Define automaticamente como cliente quando indicado
      }));
      fetchReferrerInfo(refCode);
    }
  }, []);
  
  // Carregar tipos de prestador quando selecionar esse tipo
  useEffect(() => {
    if (formData.user_type === 'service_provider') {
      fetchProviderTypes();
    }
  }, [formData.user_type]);
  
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
  
  const fetchProviderTypes = async () => {
    try {
      const response = await axios.get(`${API}/public/service-provider-types`);
      if (response.data.success) {
        setProviderTypes(response.data.data.types);
      }
    } catch (error) {
      console.error('Error fetching provider types:', error);
      toast.error('Erro ao carregar tipos de prestadores');
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Se mudar o tipo de usuário ou documento, limpar pix_key_type se ele não for mais válido
      if (name === 'user_type' || name === 'document_type') {
        const currentPixType = prev.pix_key_type;
        
        // Se o PIX type atual for CNPJ e mudou para cliente, limpar
        if (currentPixType === 'cnpj' && newData.user_type === 'cliente') {
          newData.pix_key_type = '';
          newData.pix_key = '';
        }
      }
      
      return newData;
    });
  };
  
  // Validações por step
  const validateStep1 = () => {
    // Log sem dados sensíveis
    console.log('Validating Step 1...');
    
    // Se não há referral, exigir seleção de tipo
    if (!formData.referral_code_used && !formData.user_type) {
      toast.error('Selecione o tipo de conta');
      return false;
    }
    
    // Validar status militar e CPF se for tipo militar
    if (formData.user_type === 'militar_exercito' || 
        formData.user_type === 'militar_marinha' || 
        formData.user_type === 'militar_aeronautica') {
      if (!formData.military_status) {
        toast.error('Selecione o status militar');
        return false;
      }
      
      // CPF obrigatório para militares
      if (!formData.cpf) {
        toast.error('CPF é obrigatório');
        return false;
      }
      
      // Validar CPF
      if (!validateCPF(formData.cpf)) {
        toast.error('CPF inválido. Verifique os números digitados.');
        return false;
      }
      
      // RG Militar obrigatório para militares
      if (!formData.rg_militar || formData.rg_militar.trim().length < 5) {
        toast.error('RG Militar é obrigatório (mínimo 5 caracteres)');
        return false;
      }
    }
    
    const basicFields = ['email', 'password', 'confirmPassword', 'full_name', 'phone'];
    for (let field of basicFields) {
      if (!formData[field]) {
        // Log sem expor valor do campo sensível
        console.log(`Missing required field: ${field}`);
        toast.error(`Campo obrigatório: ${field === 'confirmPassword' ? 'Confirmar Senha' : field}`);
        return false;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    console.log('Step 1 validation passed');
    return true;
  };
  
  const validateStep2 = () => {
    // Step 2: Validar PIX, Endereço e Documentos (obrigatórios para todos)
    const commonRequired = ['pix_key', 'pix_key_type', 'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'rg_front', 'rg_back'];
    for (let field of commonRequired) {
      if (!formData[field]) {
        toast.error('Preencha todos os campos obrigatórios');
        return false;
      }
    }
    
    // Validar chave PIX
    if (!validatePixKey(formData.pix_key, formData.pix_key_type)) {
      const typeNames = {
        'cpf': 'CPF (000.000.000-00)',
        'cnpj': 'CNPJ (00.000.000/0000-00)', 
        'email': 'e-mail (usuario@exemplo.com)',
        'phone': 'telefone ((11) 99999-9999)',
        'random': 'chave aleatória (32 caracteres)'
      };
      const typeName = typeNames[formData.pix_key_type] || 'chave PIX';
      toast.error(`Formato de ${typeName} inválido`);
      return false;
    }
    
    // Validar CEP
    if (!validateCEP(formData.cep)) {
      toast.error('CEP inválido');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    // Step 3: Validar campos específicos por tipo de usuário
    if (formData.user_type === 'cliente') {
      if (!formData.cpf) {
        toast.error('CPF é obrigatório');
        return false;
      }
      
      if (!validateCPF(formData.cpf)) {
        toast.error('CPF inválido');
        return false;
      }
      
      return true;
    }
    
    // Validação para tipos militares - tratados como clientes com CPF
    if (formData.user_type === 'militar_exercito' || 
        formData.user_type === 'militar_marinha' || 
        formData.user_type === 'militar_aeronautica') {
      if (!formData.cpf) {
        toast.error('CPF é obrigatório');
        return false;
      }
      
      if (!validateCPF(formData.cpf)) {
        toast.error('CPF inválido');
        return false;
      }
      
      return true;
    }
    
    if (formData.user_type === 'lojista') {
      // Validar dados da empresa
      const required = ['company_name', 'cnpj', 'whatsapp', 'business_segment', 'google_maps_url', 'cashback_rate'];
      for (let field of required) {
        if (!formData[field]) {
          toast.error('Preencha todos os campos da empresa');
          return false;
        }
      }
      
      // Validar taxa de cashback
      const cashbackRate = parseFloat(formData.cashback_rate);
      if (isNaN(cashbackRate) || cashbackRate < 1 || cashbackRate > 10) {
        toast.error('Taxa de cashback deve estar entre 1% e 10%');
        return false;
      }
      
      // Validar configurações de entrega
      if (!formData.accepts_pickup && !formData.accepts_delivery) {
        toast.error('Selecione pelo menos um tipo de entrega (Retirada ou Delivery)');
        return false;
      }
      
      // Validar tempo de preparo
      const prepTime = parseInt(formData.preparation_time);
      if (!formData.preparation_time || isNaN(prepTime) || prepTime < 10 || prepTime > 180) {
        toast.error('Tempo de preparo deve estar entre 10 e 180 minutos');
        return false;
      }
      
      // Validar dados do sócio administrador (obrigatório para CNPJ)
      const adminRequired = ['admin_name', 'admin_cpf', 'admin_email', 'admin_whatsapp', 'admin_rg_front', 'admin_rg_back'];
      for (let field of adminRequired) {
        if (!formData[field]) {
          toast.error('Preencha todos os dados do sócio administrador');
          return false;
        }
      }
      
      if (!validateCPF(formData.admin_cpf)) {
        toast.error('CPF do sócio administrador inválido');
        return false;
      }
      
      return true;
    }
    
    if (formData.user_type === 'service_provider') {
      // Para prestador, validar dados básicos
      const required = ['fantasy_name', 'document', 'provider_type_id'];
      for (let field of required) {
        if (!formData[field]) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
      }
      
      // Validar endereço para prestador (campos legados)
      const addressRequired = ['address_street', 'address_number', 'address_neighborhood', 'address_city', 'address_state', 'address_zipcode'];
      for (let field of addressRequired) {
        if (!formData[field]) {
          toast.error('Preencha todos os campos de endereço');
          return false;
        }
      }
      
      return true;
    }
    
    return true;
  };

  const validateStep4 = () => {
    // Step 4: Validação específica para prestadores (informações profissionais)
    if (formData.user_type === 'service_provider') {
      const required = ['google_maps_url', 'cashback_rate'];
      for (let field of required) {
        if (!formData[field]) {
          toast.error(`Preencha ${field === 'google_maps_url' ? 'o link do Google Maps' : 'a taxa de cashback'}`);
          return false;
        }
      }
      
      // Validar se é uma URL válida
      try {
        new URL(formData.google_maps_url);
      } catch {
        toast.error('Digite um link válido do Google Maps');
        return false;
      }
      
      // Validar taxa de cashback
      const cashbackRate = parseFloat(formData.cashback_rate);
      if (isNaN(cashbackRate) || cashbackRate < 1 || cashbackRate > 10) {
        toast.error('Taxa de cashback deve estar entre 1% e 10%');
        return false;
      }
    }
    return true;
  };
  
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar o step final baseado no tipo de usuário
    if (formData.user_type === 'service_provider') {
      // Para prestador, tem 4 steps, validar step 4
      if (!validateStep4()) return;
    } else {
      // Para cliente e lojista, tem 3 steps, validar step 3
      if (!validateStep3()) return;
    }
    
    setLoading(true);
    
    try {
      let endpoint = `${API}/auth/register`;
      let payload = { ...formData };
      
      // Converter cashback_rate para float com valor default
      if (payload.cashback_rate) {
        const parsed = parseFloat(payload.cashback_rate);
        payload.cashback_rate = isNaN(parsed) ? 5.0 : parsed;
      } else {
        payload.cashback_rate = 5.0; // Default se não informado
      }
      
      // Mapear preparation_time para estimated_delivery_time (campo do backend)
      if (payload.preparation_time) {
        payload.estimated_delivery_time = parseInt(payload.preparation_time);
        delete payload.preparation_time; // Remover campo temporário
      }
      
      // Mapear tipos militares para 'cliente' com campos adicionais
      if (payload.user_type === 'militar_exercito' || 
          payload.user_type === 'militar_marinha' || 
          payload.user_type === 'militar_aeronautica') {
        // Salvar o ramo militar antes de converter
        payload.military_branch = payload.user_type.replace('militar_', ''); // 'exercito', 'marinha', 'aeronautica'
        // Converter user_type para 'cliente'
        payload.user_type = 'cliente';
        // military_status já está no payload
      }
      
      // Se for prestador, usar endpoint específico
      if (formData.user_type === 'service_provider') {
        endpoint = `${API}/auth/register-provider`;
        // Preparar payload do prestador
        payload = {
          full_name: formData.full_name,
          fantasy_name: formData.fantasy_name,
          document: formData.document,
          document_type: formData.document_type,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_city: formData.address_city,
          address_state: formData.address_state,
          address_zipcode: formData.address_zipcode,
          provider_type_id: formData.provider_type_id,
          profile_description: formData.profile_description,
          working_hours: formData.working_hours || JSON.stringify({
            monday: { start: '08:00', end: '18:00', active: true },
            tuesday: { start: '08:00', end: '18:00', active: true },
            wednesday: { start: '08:00', end: '18:00', active: true },
            thursday: { start: '08:00', end: '18:00', active: true },
            friday: { start: '08:00', end: '18:00', active: true },
            saturday: { start: '08:00', end: '12:00', active: false },
            sunday: { start: '08:00', end: '12:00', active: false }
          }),
          accepts_emergency: formData.accepts_emergency,
          cashback_rate: parseFloat(formData.cashback_rate) || 5.0,
          referral_code_used: formData.referral_code_used,
          // Documentos obrigatórios
          rg_front: formData.rg_front,
          rg_back: formData.rg_back,
          admin_rg_front: formData.admin_rg_front,
          admin_rg_back: formData.admin_rg_back,
          // PIX
          pix_key: formData.pix_key,
          pix_key_type: formData.pix_key_type,
          // Dados do sócio
          admin_name: formData.admin_name,
          admin_cpf: formData.admin_cpf,
          admin_email: formData.admin_email,
          admin_whatsapp: formData.admin_whatsapp
        };
      }
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data.access_token) {
        login(response.data.user, response.data.access_token);
        toast.success('Conta criada com sucesso!');
      }
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = handleApiError(error, 'Erro ao criar conta');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Número total de steps baseado no tipo
  const getTotalSteps = () => {
    if (formData.user_type === 'cliente') return 3;        // Step 1: Básico, Step 2: PIX/Endereço/Docs, Step 3: CPF
    if (formData.user_type === 'militar_exercito' || 
        formData.user_type === 'militar_marinha' || 
        formData.user_type === 'militar_aeronautica') return 3; // Step 1: Básico, Step 2: PIX/Endereço/Docs, Step 3: CPF
    if (formData.user_type === 'lojista') return 3;        // Step 1: Básico, Step 2: PIX/Endereço/Docs, Step 3: Empresa/Sócio
    if (formData.user_type === 'service_provider') return 4; // Step 1: Básico, Step 2: PIX/Endereço/Docs, Step 3: Empresa/Sócio, Step 4: Profissional
    return 3;
  };
  
  const totalSteps = getTotalSteps();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFFFFF] dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <TransmillLogoCompact />
          <p className="text-[#005B9C] dark:text-gray-300 mt-2 font-medium">Plataforma exclusiva para a família militar</p>
        </div>
        
        {/* Progress Indicator */}
        {formData.user_type && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[...Array(totalSteps)].map((_, index) => (
                <React.Fragment key={index}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep > index + 1 ? 'bg-green-500 text-white' :
                    currentStep === index + 1 ? 'bg-transmill-gold-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > index + 1 ? <CheckCircle size={20} /> : index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div className={`h-1 w-12 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              Passo {currentStep} de {totalSteps}
            </div>
          </div>
        )}
        
        {/* Form Card */}
        <Card className="shadow-2xl">
          <CardHeader>
            {referrerInfo ? (
              <>
                <div className="mb-4 p-4 bg-gradient-to-r from-transmill-gold/20 to-[#FFFFFF] rounded-lg border-2 border-transmill-olive">
                  <div className="text-2xl mb-2">🎉</div>
                  <h3 className="text-lg font-bold text-transmill-olive mb-1">
                    {referrerInfo.referrer_name} está te indicando para abrir sua conta na Transmill
                  </h3>
                  <p className="text-sm text-transmill-olive-dark">
                    Plataforma exclusiva para a família militar
                  </p>
                  <div className="mt-3 inline-flex items-center px-3 py-1 bg-transmill-olive text-white text-xs font-medium rounded-full">
                    Código de Indicação: {formData.referral_code_used}
                  </div>
                </div>
                <CardTitle>Complete seu Cadastro na Transmill</CardTitle>
              </>
            ) : (
              <>
                <CardTitle>Criar Conta na Transmill</CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Escolha seu tipo de conta e preencha seus dados básicos'}
                  {currentStep === 2 && 'Dados PIX, endereço completo e documentos obrigatórios'}
                  {currentStep === 3 && 'Informações específicas do seu tipo de conta'}
                  {currentStep === 4 && 'Finalize seu cadastro com dados profissionais'}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Dados Básicos e Tipo de Conta */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Tipo de Conta - Ocultar quando há código de referral */}
                  {!formData.referral_code_used && (
                    <div>
                      <Label>Tipo de Conta *</Label>
                      <Select 
                        value={formData.user_type} 
                        onValueChange={(value) => handleSelectChange('user_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clube_associacao">
                            <div className="flex items-center space-x-2">
                              <Building2 size={16} />
                              <span>🏛️ Clube/Associações Militares</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="militar_exercito">
                            <div className="flex items-center space-x-2">
                              <User size={16} />
                              <span>🎖️ Militar Exército</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="militar_marinha">
                          <div className="flex items-center space-x-2">
                            <User size={16} />
                            <span>⚓ Militar Marinha</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="militar_aeronautica">
                          <div className="flex items-center space-x-2">
                            <User size={16} />
                            <span>✈️ Militar Aeronáutica</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="lojista">
                          <div className="flex items-center space-x-2">
                            <Building2 size={16} />
                            <span>🏪 Lojista</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="service_provider">
                          <div className="flex items-center space-x-2">
                            <Briefcase size={16} />
                            <span>🔧 Prestador de Serviços</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  )}
                  
                  {/* Mensagem quando há código de referral */}
                  {formData.referral_code_used && (
                    <div className="bg-transmill-gold/10 border border-transmill-olive rounded-lg p-4">
                      <p className="text-sm text-transmill-olive font-medium">
                        ✅ Cadastro via indicação - Você será registrado como <strong>Cliente</strong>
                      </p>
                    </div>
                  )}
                  
                  {/* Status Militar - Aparece apenas se selecionou tipo militar */}
                  {(formData.user_type === 'militar_exercito' || 
                    formData.user_type === 'militar_marinha' || 
                    formData.user_type === 'militar_aeronautica') && (
                    <>
                      <div>
                        <Label>Status Militar *</Label>
                        <Select 
                          value={formData.military_status || ''} 
                          onValueChange={(value) => handleSelectChange('military_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">✅ Ativo</SelectItem>
                            <SelectItem value="inativo">❌ Inativo</SelectItem>
                            <SelectItem value="pensionista">👥 Pensionista</SelectItem>
                            <SelectItem value="reservista">📋 Reservista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* CPF e RG Militar - OBRIGATÓRIOS para militares */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CPF */}
                        <div>
                          <Label htmlFor="cpf">CPF *</Label>
                          <Input
                            id="cpf"
                            name="cpf"
                            value={formData.cpf}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                // Formatar CPF: 000.000.000-00
                                if (value.length > 9) {
                                  value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                } else if (value.length > 6) {
                                  value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                                } else if (value.length > 3) {
                                  value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                                }
                                setFormData({...formData, cpf: value});
                              }
                            }}
                            placeholder="000.000.000-00"
                            required
                            maxLength={14}
                            className="font-mono"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            CPF para identificação
                          </p>
                        </div>
                        
                        {/* RG Militar */}
                        <div>
                          <Label htmlFor="rg_militar">RG Militar *</Label>
                          <Input
                            id="rg_militar"
                            name="rg_militar"
                            value={formData.rg_militar}
                            onChange={(e) => {
                              // Aceita letras e números
                              const value = e.target.value.toUpperCase();
                              setFormData({...formData, rg_militar: value});
                            }}
                            placeholder="Ex: 123456789-0"
                            required
                            maxLength={20}
                            className="font-mono uppercase"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Identidade militar
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Nome Completo */}
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  {/* Foto de Perfil (Opcional) */}
                  <div className="space-y-2">
                    <Label htmlFor="profile_image">Foto de Perfil (Opcional)</Label>
                    <div className="flex items-center space-x-4">
                      {formData.profile_image && (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
                          <img 
                            src={formData.profile_image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="profile_image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Validar tamanho (máx 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Imagem muito grande. Máximo 5MB.');
                                e.target.value = '';
                                return;
                              }
                              
                              // Validar tipo
                              if (!file.type.startsWith('image/')) {
                                toast.error('Apenas imagens são permitidas.');
                                e.target.value = '';
                                return;
                              }
                              
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData({...formData, profile_image: event.target.result});
                                toast.success('Foto adicionada!');
                              };
                              reader.onerror = () => {
                                toast.error('Erro ao ler imagem');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos: JPG, PNG. Máx: 5MB
                        </p>
                      </div>
                      {formData.profile_image && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({...formData, profile_image: ''});
                            const input = document.getElementById('profile_image');
                            if (input) input.value = '';
                            toast.info('Foto removida');
                          }}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  
                  {/* Telefone */}
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                  
                  {/* Senha */}
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Confirmar Senha */}
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repita a senha"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* STEP 2: Dados PIX, Endereço e Documentos (OBRIGATÓRIOS) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* === DADOS PIX === */}
                  <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                    <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                      <CreditCard size={20} className="mr-2" />
                      Dados PIX para Saque
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pix_key_type">Tipo da Chave PIX *</Label>
                        <Select 
                          value={formData.pix_key_type} 
                          onValueChange={(value) => setFormData({...formData, pix_key_type: value, pix_key: ''})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de chave" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            {/* CNPJ para lojistas sempre, e prestadores com CNPJ */}
                            {formData.user_type === 'lojista' && (
                              <SelectItem value="cnpj">CNPJ</SelectItem>
                            )}
                            {formData.user_type === 'service_provider' && formData.document_type === 'cnpj' && (
                              <SelectItem value="cnpj">CNPJ</SelectItem>  
                            )}
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="pix_key">Chave PIX *</Label>
                        <Input
                          id="pix_key"
                          type="text"
                          placeholder={(() => {
                            const pixType = formData.pix_key_type;
                            if (pixType === 'cpf') return '000.000.000-00';
                            if (pixType === 'cnpj') return '00.000.000/0000-00';
                            if (pixType === 'email') return 'email@exemplo.com';
                            if (pixType === 'phone') return '(11) 99999-9999';
                            if (pixType === 'random') return 'sua-chave-aleatoria-32-caracteres';
                            return 'Selecione o tipo primeiro';
                          })()}
                          value={formData.pix_key}
                          onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                          disabled={!formData.pix_key_type}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>💡 <strong>Importante:</strong> Esta chave PIX será usada para receber seus saques.</p>
                      {formData.user_type === 'lojista' && (
                        <p>🏢 <strong>Lojistas:</strong> Podem usar CPF (pessoa física) ou CNPJ da empresa.</p>
                      )}
                      {formData.user_type === 'service_provider' && (
                        <p>⚡ <strong>Prestadores:</strong> CPF para pessoa física, CNPJ se cadastrado como empresa.</p>
                      )}
                      {formData.user_type === 'cliente' && (
                        <p>👤 <strong>Clientes:</strong> Use CPF, e-mail, telefone ou chave aleatória.</p>
                      )}
                    </div>
                  </div>

                  {/* === ENDEREÇO COMPLETO === */}
                  <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                    <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                      <MapPin size={20} className="mr-2" />
                      Endereço Completo
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cep">CEP *</Label>
                        <Input
                          id="cep"
                          type="text"
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={handleCEPChange}
                          maxLength={9}
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="street">Rua *</Label>
                        <Input
                          id="street"
                          type="text"
                          placeholder="Nome da rua"
                          value={formData.street}
                          onChange={(e) => setFormData({...formData, street: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="number">Número *</Label>
                        <Input
                          id="number"
                          type="text"
                          placeholder="123"
                          value={formData.number}
                          onChange={(e) => setFormData({...formData, number: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="neighborhood">Bairro *</Label>
                        <Input
                          id="neighborhood"
                          type="text"
                          placeholder="Nome do bairro"
                          value={formData.neighborhood}
                          onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          type="text"
                          placeholder="Apto, casa, etc."
                          value={formData.complement}
                          onChange={(e) => setFormData({...formData, complement: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="Nome da cidade"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">Estado *</Label>
                        <Input
                          id="state"
                          type="text"
                          placeholder="SP, RJ, MG..."
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* === DOCUMENTOS === */}
                  <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                    <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                      <FileText size={20} className="mr-2" />
                      Documentos Obrigatórios
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rg_front">RG - Frente *</Label>
                        <Input
                          id="rg_front"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'rg_front')}
                          required
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-transmill-gold/20 file:text-transmill-olive hover:file:bg-transmill-gold/30"
                        />
                        {formData.rg_front && (
                          <div className="mt-2 text-sm text-transmill-olive flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            Documento carregado
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="rg_back">RG - Verso *</Label>
                        <Input
                          id="rg_back"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'rg_back')}
                          required
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-transmill-gold/20 file:text-transmill-olive hover:file:bg-transmill-gold/30"
                        />
                        {formData.rg_back && (
                          <div className="mt-2 text-sm text-transmill-olive flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            Documento carregado
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>• Formatos aceitos: JPG, PNG ou PDF</p>
                      <p>• Tamanho máximo: 5MB por arquivo</p>
                      <p>• Documentos serão analisados para verificação</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Campos Específicos por Tipo */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* === CLIENTE === */}
                  {formData.user_type === 'cliente' && (
                    <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                      <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                        <User size={20} className="mr-2" />
                        Dados do Cliente
                      </h3>
                      
                      {/* Escolher entre Pessoa Física e Jurídica */}
                      <div className="mb-4">
                        <Label>Tipo de Pessoa *</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              tipo_pessoa: 'fisica',
                              document_type: 'cpf',
                              cnpj: '',
                              company_name: ''
                            })}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              formData.tipo_pessoa === 'fisica'
                                ? 'border-transmill-olive bg-transmill-olive text-white'
                                : 'border-gray-300 hover:border-transmill-olive'
                            }`}
                          >
                            <div className="text-2xl mb-2">👤</div>
                            <div className="font-semibold">Pessoa Física</div>
                            <div className="text-xs mt-1 opacity-80">CPF</div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              tipo_pessoa: 'juridica',
                              document_type: 'cnpj',
                              cpf: ''
                            })}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              formData.tipo_pessoa === 'juridica'
                                ? 'border-transmill-olive bg-transmill-olive text-white'
                                : 'border-gray-300 hover:border-transmill-olive'
                            }`}
                          >
                            <div className="text-2xl mb-2">🏢</div>
                            <div className="font-semibold">Pessoa Jurídica</div>
                            <div className="text-xs mt-1 opacity-80">CNPJ - Clubes/Associações</div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Se Pessoa Física */}
                      {formData.tipo_pessoa === 'fisica' && (
                        <div>
                          <Label htmlFor="cpf">CPF *</Label>
                          <Input
                            id="cpf"
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={handleCPFChange}
                            maxLength={14}
                            required
                          />
                        </div>
                      )}
                      
                      {/* Se Pessoa Jurídica (Clube/Associação) */}
                      {formData.tipo_pessoa === 'juridica' && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="company_name">Nome do Clube/Associação *</Label>
                            <Input
                              id="company_name"
                              type="text"
                              placeholder="Ex: Clube Militar de São Paulo"
                              value={formData.company_name}
                              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input
                              id="cnpj"
                              type="text"
                              placeholder="00.000.000/0000-00"
                              value={formData.cnpj}
                              onChange={handleCNPJChange}
                              maxLength={18}
                              required
                            />
                          </div>
                          
                          <div className="bg-transmill-gold/10 p-3 rounded-lg border border-transmill-gold">
                            <p className="text-sm text-transmill-olive-dark">
                              <strong>💡 Dica:</strong> Clubes e Associações devem se cadastrar como Pessoa Jurídica para ter acesso a benefícios corporativos.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* === CLUBE/ASSOCIAÇÃO === */}
                  {formData.user_type === 'clube_associacao' && (
                    <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                      <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                        <Building2 size={20} className="mr-2" />
                        🏛️ Dados do Clube/Associação Militar
                      </h3>
                      
                      {/* Escolher entre Pessoa Física e Jurídica */}
                      <div className="mb-4">
                        <Label>Tipo de Pessoa *</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              tipo_pessoa: 'fisica',
                              document_type: 'cpf',
                              cnpj: '',
                              company_name: ''
                            })}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              formData.tipo_pessoa === 'fisica'
                                ? 'border-transmill-olive bg-transmill-olive text-white'
                                : 'border-gray-300 hover:border-transmill-olive'
                            }`}
                          >
                            <div className="text-2xl mb-2">👤</div>
                            <div className="font-semibold">Pessoa Física</div>
                            <div className="text-xs mt-1 opacity-80">CPF</div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              tipo_pessoa: 'juridica',
                              document_type: 'cnpj',
                              cpf: ''
                            })}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              formData.tipo_pessoa === 'juridica'
                                ? 'border-transmill-olive bg-transmill-olive text-white'
                                : 'border-gray-300 hover:border-transmill-olive'
                            }`}
                          >
                            <div className="text-2xl mb-2">🏢</div>
                            <div className="font-semibold">Pessoa Jurídica</div>
                            <div className="text-xs mt-1 opacity-80">CNPJ - Recomendado</div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Se Pessoa Física */}
                      {formData.tipo_pessoa === 'fisica' && (
                        <div>
                          <Label htmlFor="cpf">CPF *</Label>
                          <Input
                            id="cpf"
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={handleCPFChange}
                            maxLength={14}
                            required
                          />
                        </div>
                      )}
                      
                      {/* Se Pessoa Jurídica (Clube/Associação) */}
                      {formData.tipo_pessoa === 'juridica' && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="company_name">Nome do Clube/Associação *</Label>
                            <Input
                              id="company_name"
                              type="text"
                              placeholder="Ex: Clube Militar de São Paulo"
                              value={formData.company_name}
                              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input
                              id="cnpj"
                              type="text"
                              placeholder="00.000.000/0000-00"
                              value={formData.cnpj}
                              onChange={handleCNPJChange}
                              maxLength={18}
                              required
                            />
                          </div>
                          
                          <div className="bg-transmill-gold/10 p-3 rounded-lg border border-transmill-gold">
                            <p className="text-sm text-transmill-olive-dark">
                              <strong>💡 Dica:</strong> Clubes e Associações devem se cadastrar como Pessoa Jurídica para ter acesso a benefícios corporativos e institucionales.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* === MILITAR === */}
                  {(formData.user_type === 'militar_exercito' || 
                    formData.user_type === 'militar_marinha' || 
                    formData.user_type === 'militar_aeronautica') && (
                    <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                      <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                        <User size={20} className="mr-2" />
                        {formData.user_type === 'militar_exercito' && '🎖️ Dados do Militar - Exército'}
                        {formData.user_type === 'militar_marinha' && '⚓ Dados do Militar - Marinha'}
                        {formData.user_type === 'militar_aeronautica' && '✈️ Dados do Militar - Força Aérea'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-transmill-gold/10 p-3 rounded-lg border border-transmill-gold">
                          <p className="text-sm text-transmill-olive-dark">
                            <strong>CPF:</strong> {formData.cpf}
                          </p>
                          <p className="text-sm text-transmill-olive-dark mt-2">
                            <strong>Status Militar:</strong> {
                              formData.military_status === 'ativo' ? '✅ Ativo' :
                              formData.military_status === 'inativo' ? '❌ Inativo' :
                              formData.military_status === 'pensionista' ? '👥 Pensionista' :
                              formData.military_status === 'reservista' ? '📋 Reservista' : 'Não informado'
                            }
                          </p>
                          <p className="text-xs text-transmill-olive mt-1">
                            Você terá acesso a benefícios exclusivos para militares
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* === LOJISTA === */}
                  {formData.user_type === 'lojista' && (
                    <>
                      {/* Dados da Empresa */}
                      <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                        <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                          <Building2 size={20} className="mr-2" />
                          Dados da Empresa
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company_name">Nome da Empresa *</Label>
                            <Input
                              id="company_name"
                              type="text"
                              placeholder="Nome da sua empresa"
                              value={formData.company_name}
                              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input
                              id="cnpj"
                              type="text"
                              placeholder="00.000.000/0000-00"
                              value={formData.cnpj}
                              onChange={handleCNPJChange}
                              maxLength={18}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="whatsapp">WhatsApp da Empresa *</Label>
                            <Input
                              id="whatsapp"
                              type="tel"
                              placeholder="(11) 99999-9999"
                              value={formData.whatsapp}
                              onChange={(e) => handlePhoneChange(e, 'whatsapp')}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="business_segment">Segmento de Negócio *</Label>
                            <Input
                              id="business_segment"
                              type="text"
                              placeholder="Ex: Restaurante, Loja, Serviços..."
                              value={formData.business_segment}
                              onChange={(e) => setFormData({...formData, business_segment: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label htmlFor="google_maps_url">Link do Google Maps *</Label>
                            <Input
                              id="google_maps_url"
                              type="url"
                              placeholder="https://maps.google.com/..."
                              value={formData.google_maps_url}
                              onChange={(e) => setFormData({...formData, google_maps_url: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2 bg-transmill-gold/10 p-4 border-2 border-transmill-gold">
                            <Label htmlFor="cashback_rate" className="text-lg font-bold text-transmill-olive">Taxa de Cashback (%) * OBRIGATÓRIO</Label>
                            <Input
                              id="cashback_rate"
                              type="number"
                              min="1"
                              max="10"
                              step="0.1"
                              placeholder="Ex: 5"
                              value={formData.cashback_rate}
                              onChange={(e) => {
                                console.log('Cashback onChange:', e.target.value);
                                const value = parseFloat(e.target.value);
                                if (value >= 1 && value <= 10) {
                                  setFormData({...formData, cashback_rate: e.target.value});
                                } else if (e.target.value === '') {
                                  setFormData({...formData, cashback_rate: ''});
                                }
                              }}
                              required
                              className="border-2 border-transmill-olive"
                            />
                            <p className="text-sm text-transmill-olive-dark mt-2 font-semibold">
                              ⚠️ Percentual de cashback que você oferece aos clientes (entre 1% e 10%)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Configurações de Entrega */}
                      <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                        <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                          <Truck size={20} className="mr-2" />
                          Configurações de Entrega
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Tipos de Entrega */}
                          <div>
                            <Label className="text-base font-semibold mb-2 block">Tipos de Entrega Oferecidos *</Label>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2 cursor-pointer p-3 border border-transmill-olive/30 rounded-lg hover:bg-transmill-gold/10 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.accepts_pickup || false}
                                  onChange={(e) => setFormData({...formData, accepts_pickup: e.target.checked})}
                                  className="w-4 h-4 accent-transmill-olive"
                                />
                                <span className="font-medium">🏪 Retirada no Local (Balcão)</span>
                              </label>
                              
                              <label className="flex items-center space-x-2 cursor-pointer p-3 border border-transmill-olive/30 rounded-lg hover:bg-transmill-gold/10 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.accepts_delivery || false}
                                  onChange={(e) => setFormData({...formData, accepts_delivery: e.target.checked})}
                                  className="w-4 h-4 accent-transmill-olive"
                                />
                                <span className="font-medium">🚚 Delivery (Entrega)</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Selecione pelo menos uma opção
                            </p>
                          </div>

                          {/* Tempo de Preparo */}
                          <div>
                            <Label htmlFor="preparation_time">Tempo de Preparo/Entrega (minutos) *</Label>
                            <Input
                              id="preparation_time"
                              type="number"
                              min="10"
                              max="180"
                              placeholder="Ex: 30"
                              value={formData.preparation_time || ''}
                              onChange={(e) => setFormData({...formData, preparation_time: e.target.value})}
                              required
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Tempo médio para preparar o pedido (10 a 180 minutos)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dados do Sócio Administrador */}
                      <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
                        <h3 className="text-lg font-semibold text-transmill-olive mb-3 flex items-center">
                          <User size={20} className="mr-2" />
                          Sócio Administrador (Obrigatório)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="admin_name">Nome Completo *</Label>
                            <Input
                              id="admin_name"
                              type="text"
                              placeholder="Nome completo do sócio"
                              value={formData.admin_name}
                              onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="admin_cpf">CPF *</Label>
                            <Input
                              id="admin_cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={formData.admin_cpf}
                              onChange={(e) => handleCPFChange(e, 'admin_cpf')}
                              maxLength={14}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="admin_email">E-mail *</Label>
                            <Input
                              id="admin_email"
                              type="email"
                              placeholder="email@exemplo.com"
                              value={formData.admin_email}
                              onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="admin_whatsapp">WhatsApp *</Label>
                            <Input
                              id="admin_whatsapp"
                              type="tel"
                              placeholder="(11) 99999-9999"
                              value={formData.admin_whatsapp}
                              onChange={(e) => handlePhoneChange(e, 'admin_whatsapp')}
                              required
                            />
                          </div>
                        </div>
                        
                        {/* Documentos do Sócio */}
                        <div className="mt-4">
                          <Label className="text-sm font-medium">RG do Sócio Administrador *</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label htmlFor="admin_rg_front">RG - Frente *</Label>
                              <Input
                                id="admin_rg_front"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, 'admin_rg_front')}
                                required
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-transmill-gold/20 file:text-transmill-olive hover:file:bg-transmill-gold/30"
                              />
                              {formData.admin_rg_front && (
                                <div className="mt-2 text-sm text-transmill-olive flex items-center">
                                  <CheckCircle size={16} className="mr-1" />
                                  Documento carregado
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <Label htmlFor="admin_rg_back">RG - Verso *</Label>
                              <Input
                                id="admin_rg_back"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, 'admin_rg_back')}
                                required
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-transmill-gold/20 file:text-transmill-olive hover:file:bg-transmill-gold/30"
                              />
                              {formData.admin_rg_back && (
                                <div className="mt-2 text-sm text-transmill-olive flex items-center">
                                  <CheckCircle size={16} className="mr-1" />
                                  Documento carregado
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* PRESTADOR - Parte 1 */}
                  {formData.user_type === 'service_provider' && (
                    <>
                      <div>
                        <Label htmlFor="fantasy_name">Nome Fantasia *</Label>
                        <Input
                          id="fantasy_name"
                          name="fantasy_name"
                          value={formData.fantasy_name}
                          onChange={handleChange}
                          placeholder="Como você quer ser conhecido"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="document_type">Tipo de Documento *</Label>
                          <Select 
                            value={formData.document_type} 
                            onValueChange={(value) => handleSelectChange('document_type', value)}
                          >
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
                          <Label htmlFor="document">{formData.document_type === 'cpf' ? 'CPF' : 'CNPJ'} *</Label>
                          <Input
                            id="document"
                            name="document"
                            value={formData.document}
                            onChange={handleChange}
                            placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="provider_type_id">Tipo de Prestador *</Label>
                        <Select 
                          value={formData.provider_type_id} 
                          onValueChange={(value) => handleSelectChange('provider_type_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.icon} {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Endereço Completo */}
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-4 flex items-center">
                          <MapPin size={18} className="mr-2" />
                          Endereço de Atendimento
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="address_street">Rua *</Label>
                            <Input
                              id="address_street"
                              name="address_street"
                              value={formData.address_street}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_number">Número *</Label>
                            <Input
                              id="address_number"
                              name="address_number"
                              value={formData.address_number}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_complement">Complemento</Label>
                            <Input
                              id="address_complement"
                              name="address_complement"
                              value={formData.address_complement}
                              onChange={handleChange}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_neighborhood">Bairro *</Label>
                            <Input
                              id="address_neighborhood"
                              name="address_neighborhood"
                              value={formData.address_neighborhood}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_city">Cidade *</Label>
                            <Input
                              id="address_city"
                              name="address_city"
                              value={formData.address_city}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_state">Estado *</Label>
                            <Input
                              id="address_state"
                              name="address_state"
                              value={formData.address_state}
                              onChange={handleChange}
                              placeholder="SP"
                              maxLength={2}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="address_zipcode">CEP *</Label>
                            <Input
                              id="address_zipcode"
                              name="address_zipcode"
                              value={formData.address_zipcode}
                              onChange={handleChange}
                              placeholder="00000-000"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* STEP 4: Informações Profissionais (apenas prestador) */}
              {currentStep === 4 && formData.user_type === 'service_provider' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile_description">Descrição do seu trabalho</Label>
                    <textarea
                      id="profile_description"
                      name="profile_description"
                      value={formData.profile_description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Descreva sua experiência, especialidades e diferenciais..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="google_maps_url">Link do Google Maps *</Label>
                    <Input
                      id="google_maps_url"
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={formData.google_maps_url}
                      onChange={(e) => setFormData({...formData, google_maps_url: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Link do Google Maps do seu endereço para que clientes possam encontrar você
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="cashback_rate">Taxa de Cashback (%) *</Label>
                    <Input
                      id="cashback_rate"
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      placeholder="Ex: 5"
                      value={formData.cashback_rate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 1 && value <= 10) {
                          setFormData({...formData, cashback_rate: e.target.value});
                        } else if (e.target.value === '') {
                          setFormData({...formData, cashback_rate: ''});
                        }
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Percentual de cashback que você oferece aos clientes (entre 1% e 10%)
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accepts_emergency"
                      name="accepts_emergency"
                      checked={formData.accepts_emergency}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <Label htmlFor="accepts_emergency" className="cursor-pointer">
                      Aceito chamadas de emergência
                    </Label>
                  </div>
                  
                  <div className="bg-transmill-gold/10 border border-transmill-gold rounded-lg p-4">
                    <h4 className="font-semibold text-transmill-olive mb-2">Próximos passos</h4>
                    <ul className="text-sm text-transmill-olive-dark space-y-1">
                      <li>• Você receberá um e-mail de confirmação</li>
                      <li>• Após o cadastro, você poderá configurar seus horários de trabalho</li>
                      <li>• Adicione seus serviços e comece a receber chamados!</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Botões de Navegação */}
              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto"
                    disabled={!formData.user_type && currentStep === 1}
                  >
                    Próximo
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="ml-auto bg-transmill-olive hover:bg-transmill-olive-dark text-white"
                  >
                    {loading ? 'Criando conta...' : 'Finalizar Cadastro'}
                    <CheckCircle size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            </form>
            
            {/* Link para Login */}
            <div className="text-center mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-transmill-gold-600 hover:text-transmill-gold-700 font-medium">
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

export default RegisterUnified;
