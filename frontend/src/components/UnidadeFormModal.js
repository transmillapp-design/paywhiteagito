import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { X, Eye, EyeOff, Copy, Check, Building2, User, Palette, MapPin, FileText, Upload, CreditCard, DollarSign } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const Input = ({ ...props }) => (
  <input 
    className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" 
    {...props} 
  />
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-[#1a59ad] mb-1">
    {children}
    {required && <span className="text-red-600 ml-1">*</span>}
  </label>
);

const UnidadeFormModal = ({ isOpen, onClose, onSuccess, editingUnidade }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ email: '', password: '' });

  const [formData, setFormData] = useState({
    // Dados da Empresa
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    inscricao_municipal: '',
    inscricao_estadual: '',
    telefone: '',
    whatsapp: '',
    
    // Dados do Responsável
    responsavel_nome: '',
    responsavel_cpf: '',
    
    // Dados PIX (NOVO)
    pix_key: '',
    pix_key_type: 'cnpj',
    
    // Identidade Visual
    logo: null,
    logo_preview: null,
    cor_primaria: '#1a59ad',
    cor_secundaria: '#2fa31c',
    
    // Endereço
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    // Configurações de Vencimento
    vencimento_inicio: '1',
    vencimento_fim: '15',
    
    // Documentos
    contrato_social: null,
    contrato_social_name: '',
    contrato_social_url: null,
    doc_cnpj: null,
    doc_cnpj_name: '',
    doc_cnpj_url: null,
    rg_front: null,
    rg_front_preview: null,
    rg_front_url: null,
    rg_back: null,
    rg_back_preview: null,
    rg_back_url: null,
    
    // Dados de Acesso
    email: '',
    password: ''
  });

  // Função para validar e corrigir formato de cor hexadecimal
  const validateHexColor = (color, defaultColor = '#1a59ad') => {
    if (!color) return defaultColor;
    
    // Remove espaços e converte para minúsculas
    color = String(color).trim().toLowerCase();
    
    // Se não começa com #, adiciona
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    
    // Remove o # para verificar o conteúdo
    const hex = color.substring(1);
    
    // Verifica se tem exatamente 6 caracteres hexadecimais válidos
    const validHexRegex = /^[0-9a-f]{6}$/;
    if (validHexRegex.test(hex)) {
      return '#' + hex;
    }
    
    // Se o valor está incompleto ou inválido, retorna cor padrão
    console.warn(`⚠️ Cor inválida detectada: "${color}". Usando cor padrão: ${defaultColor}`);
    return defaultColor;
  };

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (editingUnidade) {
      setFormData({
        nome_fantasia: editingUnidade.name || '',
        razao_social: editingUnidade.razao_social || '',
        cnpj: editingUnidade.cnpj || '',
        inscricao_municipal: editingUnidade.inscricao_municipal || '',
        inscricao_estadual: editingUnidade.inscricao_estadual || '',
        telefone: editingUnidade.phone || '',
        whatsapp: editingUnidade.whatsapp || '',
        responsavel_nome: editingUnidade.responsavel_nome || '',
        responsavel_cpf: editingUnidade.responsavel_cpf || '',
        pix_key: editingUnidade.pix_key || '',
        pix_key_type: editingUnidade.pix_key_type || 'cnpj',
        logo: null,
        logo_preview: editingUnidade.logo_url || null,
        cor_primaria: validateHexColor(editingUnidade.cor_primaria, '#1a59ad'),
        cor_secundaria: validateHexColor(editingUnidade.cor_secundaria, '#2fa31c'),
        cep: editingUnidade.cep || '',
        address: editingUnidade.address || '',
        number: editingUnidade.number || '',
        complement: editingUnidade.complement || '',
        neighborhood: editingUnidade.neighborhood || '',
        city: editingUnidade.city || '',
        state: editingUnidade.state || '',
        vencimento_inicio: editingUnidade.vencimento_inicio || '1',
        vencimento_fim: editingUnidade.vencimento_fim || '15',
        // Documentos - carregar URLs existentes
        contrato_social: null,
        contrato_social_name: editingUnidade.contrato_social_url ? 'Arquivo enviado' : '',
        contrato_social_url: editingUnidade.contrato_social_url || null,
        doc_cnpj: null,
        doc_cnpj_name: editingUnidade.doc_cnpj_url ? 'Arquivo enviado' : '',
        doc_cnpj_url: editingUnidade.doc_cnpj_url || null,
        rg_front: null,
        rg_front_preview: editingUnidade.rg_front_url || null,
        rg_front_url: editingUnidade.rg_front_url || null,
        rg_back: null,
        rg_back_preview: editingUnidade.rg_back_url || null,
        rg_back_url: editingUnidade.rg_back_url || null,
        email: editingUnidade.email || '',
        password: '' // Não preencher senha ao editar
      });
    } else {
      // Resetar formulário quando não estiver editando
      setFormData({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        inscricao_municipal: '',
        inscricao_estadual: '',
        telefone: '',
        whatsapp: '',
        responsavel_nome: '',
        responsavel_cpf: '',
        pix_key: '',
        pix_key_type: 'cnpj',
        logo: null,
        logo_preview: null,
        cor_primaria: '#1a59ad',
        cor_secundaria: '#2fa31c',
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        vencimento_inicio: '1',
        vencimento_fim: '15',
        contrato_social: null,
        contrato_social_name: '',
        contrato_social_url: null,
        doc_cnpj: null,
        doc_cnpj_name: '',
        doc_cnpj_url: null,
        rg_front: null,
        rg_front_preview: null,
        rg_front_url: null,
        rg_back: null,
        rg_back_preview: null,
        rg_back_url: null,
        email: '',
        password: ''
      });
    }
  }, [editingUnidade]);

  // Gerar senha provisória
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({...formData, password});
  };

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!response.data.erro) {
          setFormData({
            ...formData,
            cep,
            address: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf
          });
          toast.success('CEP encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      }
    }
  };

  // Upload de arquivo
  const handleFileUpload = (e, fieldName, isImage = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validações
    if (isImage) {
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [fieldName]: file,
          [`${fieldName}_preview`]: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo deve ter no máximo 10MB');
        return;
      }
      setFormData({
        ...formData,
        [fieldName]: file,
        [`${fieldName}_name`]: file.name
      });
    }
  };

  // Copiar senha
  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    toast.success('Senha copiada!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Aplicar máscara CNPJ
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  // Aplicar máscara CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  // Aplicar máscara Telefone/WhatsApp
  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  // Aplicar máscara CEP
  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Log sem dados sensíveis
    console.log('🚀 INICIANDO CADASTRO DE UNIDADE');
    
    // Lista de campos obrigatórios faltando
    const camposFaltando = [];
    
    // Validações - Dados da Empresa
    if (!formData.nome_fantasia) camposFaltando.push('Nome Fantasia');
    if (!formData.razao_social) camposFaltando.push('Razão Social');
    if (!formData.cnpj) camposFaltando.push('CNPJ');
    
    // Dados do Responsável
    if (!formData.responsavel_nome) camposFaltando.push('Nome do Responsável');
    if (!formData.responsavel_cpf) camposFaltando.push('CPF do Responsável');
    
    // Dados PIX
    if (!formData.pix_key) camposFaltando.push('Chave PIX');
    if (!formData.pix_key_type) camposFaltando.push('Tipo de Chave PIX');
    
    // Configurações - Taxa de Adesão é opcional (pode ser 0)
    // Não validar taxa_adesao como obrigatória
    
    // Logo obrigatório para identidade visual da unidade
    if (!editingUnidade && !formData.logo) {
      console.warn('⚠️ Logo não fornecido - campo obrigatório');
      camposFaltando.push('Logo da Unidade (upload de imagem)');
    }
    
    // Email e senha obrigatórios para credenciais de acesso
    if (!editingUnidade) {
      if (!formData.email) camposFaltando.push('E-mail de Acesso da Unidade');
      if (!formData.password) camposFaltando.push('Senha de Acesso da Unidade');
    }
    
    console.log('📊 Campos faltando:', camposFaltando.length, camposFaltando)
    
    // Se há campos faltando, mostrar mensagem clara
    if (camposFaltando.length > 0) {
      console.error('❌ VALIDAÇÃO FALHOU - Campos obrigatórios faltando:', camposFaltando);
      const mensagem = camposFaltando.length === 1 
        ? `⚠️ Campo obrigatório não preenchido:\n• ${camposFaltando[0]}`
        : `⚠️ ${camposFaltando.length} campos obrigatórios não preenchidos:\n${camposFaltando.map(c => `• ${c}`).join('\n')}`;
      
      // Alert para garantir que usuário veja
      alert(mensagem);
      
      toast.error(mensagem, {
        duration: 10000,
        style: {
          whiteSpace: 'pre-line',
          minWidth: '400px',
          fontSize: '16px',
          padding: '20px'
        }
      });
      return;
    }
    
    console.log('✅ Validação de campos obrigatórios passou');
    
    // Validações adicionais
    if (!formData.vencimento_inicio || !formData.vencimento_fim) {
      console.error('❌ Vencimento não definido');
      toast.error('⚠️ Defina o intervalo de vencimento das mensalidades');
      return;
    }
    
    if (parseInt(formData.vencimento_inicio) > parseInt(formData.vencimento_fim)) {
      console.error('❌ Intervalo de vencimento inválido');
      toast.error('⚠️ O dia início deve ser menor ou igual ao dia fim');
      return;
    }
    
    console.log('✅ Todas as validações passaram - Iniciando envio...')
    
    // ✅ VALIDAÇÃO CRÍTICA: Garantir cores válidas antes de enviar
    const corPrimariaValida = validateHexColor(formData.cor_primaria, '#1a59ad');
    const corSecundariaValida = validateHexColor(formData.cor_secundaria, '#2fa31c');
    
    // Atualizar formData com cores validadas
    setFormData(prev => ({
      ...prev,
      cor_primaria: corPrimariaValida,
      cor_secundaria: corSecundariaValida
    }));
    
    console.log('🔄 Definindo loading=true');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token recuperado:', token ? 'OK' : 'FALTANDO');
      
      if (!token) {
        console.error('❌ Token não encontrado - usuário não autenticado');
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      console.log('📦 Criando FormData para envio...');
      const formDataToSend = new FormData();
      
      // Dados da Empresa
      formDataToSend.append('nome_fantasia', formData.nome_fantasia);
      formDataToSend.append('razao_social', formData.razao_social);
      formDataToSend.append('cnpj', formData.cnpj);
      formDataToSend.append('inscricao_municipal', formData.inscricao_municipal || '');
      formDataToSend.append('inscricao_estadual', formData.inscricao_estadual || '');
      formDataToSend.append('telefone', formData.telefone || '');
      formDataToSend.append('whatsapp', formData.whatsapp || '');
      
      // Dados do Responsável
      formDataToSend.append('responsavel_nome', formData.responsavel_nome);
      formDataToSend.append('responsavel_cpf', formData.responsavel_cpf);
      
      // Dados PIX
      formDataToSend.append('pix_key', formData.pix_key);
      formDataToSend.append('pix_key_type', formData.pix_key_type);
      
      // Identidade Visual - usar cores validadas
      if (formData.logo) formDataToSend.append('logo', formData.logo);
      formDataToSend.append('cor_primaria', corPrimariaValida);
      formDataToSend.append('cor_secundaria', corSecundariaValida);
      
      // Endereço
      formDataToSend.append('cep', formData.cep || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('number', formData.number || '');
      formDataToSend.append('complement', formData.complement || '');
      formDataToSend.append('neighborhood', formData.neighborhood || '');
      formDataToSend.append('city', formData.city || '');
      formDataToSend.append('state', formData.state || '');
      
      // Documentos
      if (formData.contrato_social) formDataToSend.append('contrato_social', formData.contrato_social);
      if (formData.doc_cnpj) formDataToSend.append('doc_cnpj', formData.doc_cnpj);
      if (formData.rg_front) formDataToSend.append('rg_front', formData.rg_front);
      if (formData.rg_back) formDataToSend.append('rg_back', formData.rg_back);
      
      // Dados de Acesso (apenas se não for edição ou se informados)
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.password) formDataToSend.append('password', formData.password);
      
      let response;
      if (editingUnidade) {
        // Atualizar unidade existente
        response = await axios.put(`${API}/labelview/unidades/${editingUnidade.id}`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Criar nova unidade
        console.log('🚀 Enviando requisição POST para criar unidade...');
        console.log('URL:', `${API}/labelview/unidades`);
        console.log('Token presente:', !!token);
        
        response = await axios.post(`${API}/labelview/unidades`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000, // 60 segundos
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Upload progress: ${percentCompleted}%`);
          }
        });
        
        console.log('✅ Resposta recebida:', response.data);
      }
      
      if (response.data.success) {
        if (editingUnidade) {
          // Se for edição, só mostra toast e fecha
          toast.success('Unidade atualizada com sucesso!');
          onSuccess && onSuccess(response.data);
          onClose();
        } else {
          // Se for criação, mostra modal com credenciais DO BACKEND
          console.log('✅ Unidade criada! Credenciais recebidas:', response.data.credentials);
          
          if (response.data.credentials) {
            setCreatedCredentials({
              email: response.data.credentials.email,
              password: response.data.credentials.password
            });
            
            // Alert para garantir que veja
            alert(`✅ UNIDADE CADASTRADA COM SUCESSO!\n\n📧 Email: ${response.data.credentials.email}\n🔑 Senha: ${response.data.credentials.password}\n\n⚠️ GUARDE ESTAS CREDENCIAIS!`);
            
            setShowSuccessModal(true);
            console.log('✅ Modal de sucesso será exibido com credenciais');
          } else {
            console.error('⚠️  Backend não retornou credenciais!');
            alert('❌ ERRO: Backend não retornou credenciais! Contate o suporte.');
            toast.error('Erro: Credenciais não geradas. Contate o suporte.');
            onSuccess && onSuccess(response.data);
            onClose();
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar unidade:', error);
      console.error('Erro completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Erro ao cadastrar unidade';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tempo esgotado. Verifique sua conexão e tente novamente.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Alert para garantir que usuário veja o erro
      alert(`❌ ERRO AO CADASTRAR UNIDADE:\n\n${errorMessage}\n\nVerifique os dados e tente novamente.`);
      
      toast.error(errorMessage, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Modal de sucesso com credenciais
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">✅ Unidade Cadastrada!</h2>
            <p className="text-gray-600 text-sm">A unidade foi criada com sucesso. Guarde estas credenciais:</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-3">
              <div className="bg-yellow-400 text-yellow-900 rounded-full p-1.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-1">⚠️ IMPORTANTE - Salve estas informações!</h3>
                <p className="text-yellow-800 text-xs">Esta senha provisória só será exibida agora. Copie e guarde em local seguro.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <label className="block text-xs font-bold text-gray-700 mb-2">📧 Email de Acesso:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdCredentials.email}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      toast.success('Email copiado!');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Copiar email"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <label className="block text-xs font-bold text-gray-700 mb-2">🔐 Senha Provisória:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdCredentials.password}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-sm font-bold text-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      toast.success('Senha copiada!');
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Copiar senha"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-blue-900 mb-1 text-sm">📝 Instruções para o usuário:</h4>
            <ol className="list-decimal list-inside text-xs text-blue-800 space-y-0.5">
              <li>Acesse o sistema com o email e senha fornecidos</li>
              <li>No primeiro acesso, altere a senha provisória</li>
              <li>Guarde suas novas credenciais em local seguro</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const text = `
🔐 CREDENCIAIS DE ACESSO - UNIDADE LABELVIEW

📧 Email: ${createdCredentials.email}
🔑 Senha Provisória: ${createdCredentials.password}

⚠️ IMPORTANTE:
- Altere esta senha no primeiro acesso
- Não compartilhe estas credenciais
- Guarde em local seguro

Acesse: ${window.location.origin}/labelview
                `.trim();
                
                navigator.clipboard.writeText(text);
                toast.success('Credenciais copiadas para área de transferência!');
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 text-sm"
            >
              <Copy size={18} />
              Copiar Tudo
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials({ email: '', password: '' });
                onSuccess && onSuccess();
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
            >
              ✅ Entendi, Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c]">
          <div className="flex items-center gap-3">
            <Building2 size={32} />
            <div>
              <h2 className="text-2xl font-bold">{editingUnidade ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <p className="text-sm opacity-90">{editingUnidade ? 'Atualizar dados da unidade' : 'Cadastro completo da unidade'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ========== 1. DADOS DA EMPRESA ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Dados da Empresa *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Fantasia *</Label>
                <Input
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                  placeholder="Nome comercial da unidade"
                  required
                />
              </div>
              <div>
                <Label>Razão Social *</Label>
                <Input
                  value={formData.razao_social}
                  onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                  placeholder="Razão social registrada"
                  required
                />
              </div>
              <div>
                <Label>CNPJ *</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div>
                <Label>Inscrição Municipal</Label>
                <Input
                  value={formData.inscricao_municipal}
                  onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                  placeholder="Número da inscrição"
                />
              </div>
              <div>
                <Label>Inscrição Estadual</Label>
                <Input
                  value={formData.inscricao_estadual}
                  onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                  placeholder="Número da inscrição"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* ========== 2. DADOS DO RESPONSÁVEL ========== */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Dados do Responsável *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.responsavel_nome}
                  onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
                  placeholder="Nome do responsável legal"
                  required
                />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={formData.responsavel_cpf}
                  onChange={(e) => setFormData({...formData, responsavel_cpf: formatCPF(e.target.value)})}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
          </div>

          {/* ========== 3. DADOS PIX ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              <CreditCard size={24} />
              Dados PIX *
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Informe a chave PIX para recebimento de pagamentos e comissões
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Chave PIX *</Label>
                <select
                  value={formData.pix_key_type}
                  onChange={(e) => setFormData({...formData, pix_key_type: e.target.value, pix_key: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                  required
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <Label>Chave PIX *</Label>
                <Input
                  value={formData.pix_key}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (formData.pix_key_type === 'cpf') value = formatCPF(value);
                    if (formData.pix_key_type === 'cnpj') value = formatCNPJ(value);
                    if (formData.pix_key_type === 'phone') value = formatPhone(value);
                    setFormData({...formData, pix_key: value});
                  }}
                  placeholder={
                    formData.pix_key_type === 'cpf' ? '000.000.000-00' :
                    formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                    formData.pix_key_type === 'email' ? 'email@exemplo.com' :
                    formData.pix_key_type === 'phone' ? '(11) 98765-4321' :
                    'Cole sua chave aleatória'
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* ========== 4. IDENTIDADE VISUAL ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Identidade Visual *
            </h3>
            
            {/* Logo Upload */}
            <div className="mb-4">
              <Label>Logo da Unidade (PNG 510x510px) *</Label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1a59ad] transition-colors">
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => handleFileUpload(e, 'logo', true)}
                      className="hidden"
                    />
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <span className="text-sm text-gray-500">Clique para enviar o logo</span>
                    <span className="text-xs text-gray-400 mt-1">PNG • Máx 5MB • 510x510px</span>
                  </label>
                </div>
                {formData.logo_preview && (
                  <div className="w-40 h-40 border-2 border-[#2fa31c] rounded-lg overflow-hidden">
                    <img src={formData.logo_preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Paleta de Cores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={validateHexColor(formData.cor_primaria, '#1a59ad')}
                    onChange={(e) => {
                      const validColor = validateHexColor(e.target.value, '#1a59ad');
                      setFormData({...formData, cor_primaria: validColor});
                    }}
                    className="w-20 h-12 border-2 border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded text-gray-700 font-mono">
                      {validateHexColor(formData.cor_primaria, '#1a59ad')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use o seletor de cor ao lado</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Cor Secundária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={validateHexColor(formData.cor_secundaria, '#2fa31c')}
                    onChange={(e) => {
                      const validColor = validateHexColor(e.target.value, '#2fa31c');
                      setFormData({...formData, cor_secundaria: validColor});
                    }}
                    className="w-20 h-12 border-2 border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded text-gray-700 font-mono">
                      {validateHexColor(formData.cor_secundaria, '#2fa31c')}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use o seletor de cor ao lado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== 5. ENDEREÇO ========== */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => {
                    const cep = formatCEP(e.target.value);
                    setFormData({...formData, cep});
                  }}
                  onBlur={(e) => buscarCEP(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Rua</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Nome da rua"
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="Nº"
                />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={(e) => setFormData({...formData, complement: e.target.value})}
                  placeholder="Apto, Sala..."
                />
              </div>
              <div>
                <Label>Bairro/Distrito</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* ========== 6. DOCUMENTOS ========== */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-2 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">6</span>
              Documentos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              📄 Envie os documentos da unidade em formato PDF ou imagem (PNG, JPG)
            </p>
            
            <div className="space-y-4">
              {/* Contrato Social */}
              <div>
                <Label>Contrato Social</Label>
                <label className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2fa31c] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, 'contrato_social')}
                    className="hidden"
                  />
                  <FileText size={20} className="mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.contrato_social_name || 'Clique para enviar'}
                  </span>
                </label>
              </div>

              {/* CNPJ */}
              <div>
                <Label>Documento CNPJ</Label>
                <label className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2fa31c] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, 'doc_cnpj')}
                    className="hidden"
                  />
                  <FileText size={20} className="mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.doc_cnpj_name || 'Clique para enviar'}
                  </span>
                </label>
              </div>

              {/* RG/CNH Responsável */}
              <div>
                <Label>RG/CNH do Responsável - Frente e Verso</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2fa31c] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_front', true)}
                        className="hidden"
                      />
                      {formData.rg_front_preview ? (
                        <img src={formData.rg_front_preview} alt="Frente" className="w-full h-full object-cover rounded" />
                      ) : (
                        <>
                          <Upload className="text-gray-400 mb-2" size={24} />
                          <span className="text-xs text-gray-500">FRENTE</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2fa31c] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_back', true)}
                        className="hidden"
                      />
                      {formData.rg_back_preview ? (
                        <img src={formData.rg_back_preview} alt="Verso" className="w-full h-full object-cover rounded" />
                      ) : (
                        <>
                          <Upload className="text-gray-400 mb-2" size={24} />
                          <span className="text-xs text-gray-500">VERSO</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Senha Provisória - Exibir se ainda não trocou */}
          {editingUnidade && editingUnidade.must_change_password && editingUnidade.temporary_password ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <div className="mb-3">
                <span className="font-bold text-yellow-900">Dados de Acesso</span>
                <span className="text-yellow-800 text-sm ml-2">(Senha provisória disponível)</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">Email:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingUnidade.email || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingUnidade.email || '');
                        toast.success('Email copiado!');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Senha Provisória:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingUnidade.temporary_password || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border rounded font-mono font-bold text-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingUnidade.temporary_password || '');
                        toast.success('Senha copiada!');
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-blue-800">
                Esta senha será removida após o primeiro login.
              </div>
            </div>
          ) : null}

          {/* ========== 7. DADOS DE ACESSO (Apenas ao criar) ========== */}
          {!editingUnidade && (
            <div className="border-t-4 border-[#1a59ad] pt-4">
              <h3 className="text-xl font-bold mb-2 text-[#1a59ad] flex items-center gap-2">
                <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">7</span>
                Dados de Acesso *
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                🔐 Credenciais para acesso ao sistema (senha provisória, deve ser alterada no primeiro acesso)
              </p>
            
            <div className="space-y-4">
              <div>
                <Label>Email de Acesso *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@unidade.com"
                  required
                />
              </div>

              <div>
                <Label>Senha Provisória *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Senha provisória visível"
                      required
                      className="font-mono font-bold text-red-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 bg-[#2fa31c] text-white rounded-lg hover:bg-[#1a59ad] transition-colors"
                  >
                    Gerar
                  </button>
                  {formData.password && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="px-4 py-2 bg-[#1a59ad] text-white rounded-lg hover:bg-[#2fa31c] transition-colors"
                    >
                      {copiedPassword ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
              </div>

              {formData.password && (
                <div className="bg-[#2fa31c]/10 border-2 border-[#2fa31c] rounded-lg p-4">
                  <p className="text-sm text-[#2fa31c] font-semibold mb-2">
                    ✅ Senha gerada com sucesso!
                  </p>
                  <p className="text-xs text-gray-600">
                    A unidade deverá alterar esta senha no primeiro acesso ao sistema.
                  </p>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center gap-2 border-2 border-[#2fa31c]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Cadastrando...
                </>
              ) : (
                <>
                  <Building2 size={20} />
                  Cadastrar Unidade
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnidadeFormModal;
