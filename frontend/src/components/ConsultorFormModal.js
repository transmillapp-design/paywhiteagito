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

const ConsultorFormModal = ({ isOpen, onClose, onSuccess, editingConsultor, unidades, regionais, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ email: '', password: '' });

  const [natureza, setNatureza] = useState('cpf'); // 'cpf' ou 'cnpj'
  
  // Detectar se é Unidade ou Regional cadastrando
  const isUnidadeCadastro = currentUser?.user_type === 'labelview_unidade';
  const isRegionalCadastro = currentUser?.user_type === 'labelview_regional';
  
  const [formData, setFormData] = useState({
    // Hierarquia (preenchido automaticamente se for Unidade/Regional)
    unidade_id: isUnidadeCadastro ? currentUser?.id : '',
    regional_id: isRegionalCadastro ? currentUser?.id : '',
    
    // Campos PF (CPF)
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone_pf: '',
    
    // Campos PJ (CNPJ)
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    inscricao_municipal: '',
    inscricao_estadual: '',
    telefone: '',
    whatsapp: '',
    
    // Responsável (apenas PJ)
    responsavel_nome: '',
    responsavel_cpf: '',
    
    // PIX (ambos)
    pix_key: '',
    pix_key_type: 'cpf',
    
    // Identidade Visual - REMOVIDO: Consultor herda da Unidade
    
    // Endereço (ambos)
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    // Configurações REMOVIDAS: definidas pela Unidade
    
    // Documentos
    contrato_social: null,
    contrato_social_name: '',
    doc_cnpj: null,
    doc_cnpj_name: '',
    rg_front: null,
    rg_front_name: '',
    rg_front_preview: null,
    rg_back: null,
    rg_back_name: '',
    rg_back_preview: null,
    
    // Comissão (ambos)
    comissao_mensalidade_tipo: 'valor',
    comissao_mensalidade_valor: '',
    
    // Acesso
    email: '',
    password: ''
  });

  // Resetar formulário quando o modal fechar ou abrir
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        unidade_id: isUnidadeCadastro ? currentUser?.id : '',
        regional_id: isRegionalCadastro ? currentUser?.id : '',
        nome: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        telefone_pf: '',
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
        pix_key_type: 'cpf',
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        contrato_social: null,
        contrato_social_name: '',
        doc_cnpj: null,
        doc_cnpj_name: '',
        rg_front: null,
        rg_front_name: '',
        rg_front_preview: null,
        rg_back: null,
        rg_back_name: '',
        rg_back_preview: null,
        comissao_mensalidade_tipo: 'valor',
        comissao_mensalidade_valor: '',
        email: '',
        password: ''
      });
      setNatureza('cpf');
    }
  }, [isOpen]);

  // 🔧 CORREÇÃO CRÍTICA: Popular formulário quando estiver editando consultor
  useEffect(() => {
    if (isOpen && editingConsultor) {
      console.log('📝 Populando formulário com dados do consultor para edição:', editingConsultor);
      
      // Detectar natureza do consultor (CPF ou CNPJ)
      const naturezaConsultor = editingConsultor.natureza || 'cpf';
      setNatureza(naturezaConsultor);
      
      // Popular formData com todos os dados do consultor
      setFormData({
        // Hierarquia
        unidade_id: editingConsultor.unidade_id || '',
        regional_id: editingConsultor.regional_id || '',
        
        // Campos PF (CPF)
        nome: editingConsultor.nome || '',
        cpf: editingConsultor.cpf || '',
        rg: editingConsultor.rg || '',
        data_nascimento: editingConsultor.data_nascimento || '',
        telefone_pf: editingConsultor.telefone || editingConsultor.phone || '',
        
        // Campos PJ (CNPJ)
        nome_fantasia: editingConsultor.nome_fantasia || '',
        razao_social: editingConsultor.razao_social || '',
        cnpj: editingConsultor.cnpj || '',
        inscricao_municipal: editingConsultor.inscricao_municipal || '',
        inscricao_estadual: editingConsultor.inscricao_estadual || '',
        telefone: editingConsultor.telefone || editingConsultor.phone || '',
        whatsapp: editingConsultor.whatsapp || '',
        
        // Responsável (apenas PJ)
        responsavel_nome: editingConsultor.responsavel_nome || '',
        responsavel_cpf: editingConsultor.responsavel_cpf || '',
        
        // PIX
        pix_key: editingConsultor.pix_key || '',
        pix_key_type: editingConsultor.pix_key_type || 'cpf',
        
        // Endereço
        cep: editingConsultor.cep || '',
        address: editingConsultor.address || editingConsultor.street || '',
        number: editingConsultor.number || '',
        complement: editingConsultor.complement || '',
        neighborhood: editingConsultor.neighborhood || '',
        city: editingConsultor.city || '',
        state: editingConsultor.state || '',
        
        // Documentos - não carregamos arquivos ao editar
        contrato_social: null,
        contrato_social_name: editingConsultor.contrato_social_url ? 'Arquivo existente' : '',
        doc_cnpj: null,
        doc_cnpj_name: editingConsultor.doc_cnpj_url ? 'Arquivo existente' : '',
        rg_front: null,
        rg_front_name: editingConsultor.rg_front_url ? 'Arquivo existente' : '',
        rg_front_preview: editingConsultor.rg_front_url || null,
        rg_back: null,
        rg_back_name: editingConsultor.rg_back_url ? 'Arquivo existente' : '',
        rg_back_preview: editingConsultor.rg_back_url || null,
        
        // Comissão
        comissao_mensalidade_tipo: editingConsultor.comissao_mensalidade_tipo || 'valor',
        comissao_mensalidade_valor: editingConsultor.comissao_mensalidade_valor || '',
        
        // Acesso - não exibimos ao editar por segurança
        email: editingConsultor.email || '',
        password: '' // Nunca popular senha ao editar
      });
      
      console.log('✅ Formulário populado com sucesso');
    }
  }, [isOpen, editingConsultor]);

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
    console.log('🔍 Buscando CEP:', cepLimpo);
    
    if (cepLimpo.length === 8) {
      try {
        console.log('📡 Chamando ViaCEP API...');
        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        console.log('✅ Resposta ViaCEP:', response.data);
        
        if (!response.data.erro) {
          const newData = {
            cep,
            address: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf
          };
          console.log('📝 Atualizando formulário com:', newData);
          
          setFormData(prev => ({
            ...prev,
            ...newData
          }));
          toast.success('✅ CEP encontrado! Endereço preenchido automaticamente.');
        } else {
          console.warn('⚠️ CEP não encontrado na base do ViaCEP');
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        console.error('Detalhes do erro:', error.response?.data || error.message);
        toast.error('Erro ao buscar CEP. Verifique a conexão.');
      }
    } else {
      console.log('⚠️ CEP incompleto:', cepLimpo, '(precisa ter 8 dígitos)');
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
    
    // Lista de campos obrigatórios faltando
    const camposFaltando = [];
    
    // Validações baseadas no tipo de pessoa
    if (natureza === 'cpf') {
      // Campos obrigatórios para Pessoa Física
      if (!formData.nome) camposFaltando.push('Nome Completo');
      if (!formData.cpf) camposFaltando.push('CPF');
      if (!formData.telefone_pf) camposFaltando.push('Telefone');
    } else {
      // Campos obrigatórios para Pessoa Jurídica
      if (!formData.nome_fantasia) camposFaltando.push('Nome Fantasia');
      if (!formData.razao_social) camposFaltando.push('Razão Social');
      if (!formData.cnpj) camposFaltando.push('CNPJ');
      
      // Dados do Responsável (apenas PJ)
      if (!formData.responsavel_nome) camposFaltando.push('Nome do Responsável');
      if (!formData.responsavel_cpf) camposFaltando.push('CPF do Responsável');
    }
    
    // Hierarquia (ambos) - não valida se Unidade/Regional está cadastrando (já vem preenchido)
    if (!isUnidadeCadastro && !isRegionalCadastro && !formData.unidade_id) {
      camposFaltando.push('Unidade');
    }
    
    // Dados PIX (ambos)
    if (!formData.pix_key) camposFaltando.push('Chave PIX');
    if (!formData.pix_key_type) camposFaltando.push('Tipo de Chave PIX');
    
    // Endereço (ambos)
    if (!formData.address) camposFaltando.push('Endereço');
    if (!formData.city) camposFaltando.push('Cidade');
    if (!formData.state) camposFaltando.push('Estado');
    
    // Email e senha obrigatórios apenas ao criar
    if (!editingConsultor) {
      if (!formData.email) camposFaltando.push('E-mail de Acesso');
      if (!formData.password) camposFaltando.push('Senha de Acesso');
    }
    
    // Se há campos faltando, mostrar mensagem clara
    if (camposFaltando.length > 0) {
      const mensagem = camposFaltando.length === 1 
        ? `⚠️ Campo obrigatório não preenchido:\n• ${camposFaltando[0]}`
        : `⚠️ ${camposFaltando.length} campos obrigatórios não preenchidos:\n${camposFaltando.map(c => `• ${c}`).join('\n')}`;
      
      toast.error(mensagem, {
        duration: 6000,
        style: {
          whiteSpace: 'pre-line',
          minWidth: '400px'
        }
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Tipo de pessoa (OBRIGATÓRIO)
      formDataToSend.append('natureza', natureza);
      
      // Hierarquia (preenchido automaticamente se for Unidade/Regional)
      const unidade_to_send = isUnidadeCadastro ? currentUser?.id : formData.unidade_id;
      const regional_to_send = isRegionalCadastro ? currentUser?.id : formData.regional_id;
      
      formDataToSend.append('unidade_id', unidade_to_send);
      if (regional_to_send) {
        formDataToSend.append('regional_id', regional_to_send);
      }
      
      // Campos específicos por tipo
      if (natureza === 'cpf') {
        // ========== PESSOA FÍSICA ==========
        formDataToSend.append('nome', formData.nome);
        formDataToSend.append('cpf', formData.cpf);
        if (formData.rg) formDataToSend.append('rg', formData.rg);
        if (formData.data_nascimento) formDataToSend.append('data_nascimento', formData.data_nascimento);
        formDataToSend.append('telefone_pf', formData.telefone_pf);
        
        // Documentos PF (RG próprio)
        if (formData.rg_front) formDataToSend.append('rg_front', formData.rg_front);
        if (formData.rg_back) formDataToSend.append('rg_back', formData.rg_back);
      } else {
        // ========== PESSOA JURÍDICA ==========
        formDataToSend.append('nome_fantasia', formData.nome_fantasia);
        formDataToSend.append('razao_social', formData.razao_social);
        formDataToSend.append('cnpj', formData.cnpj);
        if (formData.inscricao_municipal) formDataToSend.append('inscricao_municipal', formData.inscricao_municipal);
        if (formData.inscricao_estadual) formDataToSend.append('inscricao_estadual', formData.inscricao_estadual);
        if (formData.telefone) formDataToSend.append('telefone', formData.telefone);
        if (formData.whatsapp) formDataToSend.append('whatsapp', formData.whatsapp);
        
        // Dados do Responsável (apenas PJ)
        formDataToSend.append('responsavel_nome', formData.responsavel_nome);
        formDataToSend.append('responsavel_cpf', formData.responsavel_cpf);
        
        // Configurações de Pagamento (apenas PJ)
        // Taxa de Adesão e Vencimento REMOVIDOS: definidos pela Unidade
        
        // Documentos PJ
        if (formData.contrato_social) formDataToSend.append('contrato_social', formData.contrato_social);
        if (formData.doc_cnpj) formDataToSend.append('doc_cnpj', formData.doc_cnpj);
        if (formData.rg_front) formDataToSend.append('rg_front', formData.rg_front);
        if (formData.rg_back) formDataToSend.append('rg_back', formData.rg_back);
      }
      
      // Dados PIX (ambos)
      formDataToSend.append('pix_key', formData.pix_key);
      formDataToSend.append('pix_key_type', formData.pix_key_type);
      
      // Endereço (ambos)
      if (formData.cep) formDataToSend.append('cep', formData.cep);
      formDataToSend.append('address', formData.address);
      if (formData.number) formDataToSend.append('number', formData.number);
      if (formData.complement) formDataToSend.append('complement', formData.complement);
      if (formData.neighborhood) formDataToSend.append('neighborhood', formData.neighborhood);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      
      // Comissionamento (ambos)
      formDataToSend.append('comissao_mensalidade_tipo', formData.comissao_mensalidade_tipo);
      formDataToSend.append('comissao_mensalidade_valor', formData.comissao_mensalidade_valor || '0');
      
      // Dados de Acesso (apenas se não for edição ou se informados)
      if (formData.email) formDataToSend.append('email_consultor', formData.email);
      if (formData.password) formDataToSend.append('password_consultor', formData.password);
      
      let response;
      if (editingConsultor) {
        // Atualizar consultor existente
        response = await axios.put(`${API}/labelview/consultores/${editingConsultor.id}`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Criar novo consultor
        console.log('🚀 Enviando requisição POST para criar consultor...');
        console.log('URL:', `${API}/labelview/consultores`);
        console.log('Token presente:', !!token);
        console.log('Natureza:', natureza);
        
        response = await axios.post(`${API}/labelview/consultores`, formDataToSend, {
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
        if (editingConsultor) {
          // Se for edição, só mostra toast e fecha
          toast.success('Consultor atualizado com sucesso!');
          onSuccess && onSuccess(response.data);
          onClose();
        } else {
          // 🔧 CORREÇÃO CRÍTICA: Chamar onSuccess IMEDIATAMENTE após criação bem-sucedida
          // Isso garante que fetchConsultores() seja chamado antes do usuário fechar o modal
          onSuccess && onSuccess(response.data);
          
          // Se for criação, mostra modal com credenciais
          setCreatedCredentials({
            email: formData.email,
            password: formData.password
          });
          setShowSuccessModal(true);
          toast.success('Consultor cadastrado com sucesso!');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar consultor:', error);
      console.error('Erro completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Erro ao cadastrar consultor';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tempo esgotado. Verifique sua conexão e tente novamente.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Modal de sucesso com credenciais
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={48} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">✅ Consultor Cadastrado!</h2>
            <p className="text-gray-600">O consultor foi criado com sucesso. Guarde estas credenciais:</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-yellow-400 text-yellow-900 rounded-full p-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 text-lg mb-1">⚠️ IMPORTANTE - Salve estas informações!</h3>
                <p className="text-yellow-800 text-sm">Esta senha provisória só será exibida agora. Copie e guarde em local seguro.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email de Acesso:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdCredentials.email}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      toast.success('Email copiado!');
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Copiar email"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <label className="block text-sm font-bold text-gray-700 mb-2">🔐 Senha Provisória:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdCredentials.password}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg font-bold text-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      toast.success('Senha copiada!');
                    }}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Copiar senha"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Instruções para o usuário:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Acesse o sistema com o email e senha fornecidos</li>
              <li>No primeiro acesso, altere a senha provisória</li>
              <li>Guarde suas novas credenciais em local seguro</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const text = `
🔐 CREDENCIAIS DE ACESSO - CONSULTOR LABELVIEW

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
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Copy size={20} />
              Copiar Tudo
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials({ email: '', password: '' });
                // 🔧 CORREÇÃO: Removido onSuccess daqui para evitar duplicação
                // onSuccess já foi chamado após o cadastro bem-sucedido
                onClose();
              }}
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
            <User size={32} />
            <div>
              <h2 className="text-2xl font-bold">{editingConsultor ? 'Editar Consultor' : 'Novo Consultor'}</h2>
              <p className="text-sm opacity-90">{editingConsultor ? 'Atualizar dados do consultor' : 'Cadastro completo do consultor'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Toggle CPF/CNPJ */}
          <div className="mb-6 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] p-1 rounded-lg">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🆔 Tipo de Cadastro
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNatureza('cpf')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    natureza === 'cpf'
                      ? 'bg-[#1a59ad] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <User className="inline mr-2" size={20} />
                  Pessoa Física (CPF)
                </button>
                <button
                  type="button"
                  onClick={() => setNatureza('cnpj')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    natureza === 'cnpj'
                      ? 'bg-[#2fa31c] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="inline mr-2" size={20} />
                  Pessoa Jurídica (CNPJ)
                </button>
              </div>
            </div>
          </div>

          {/* Hierarquia - Oculto se Unidade/Regional estiver cadastrando */}
          {!isUnidadeCadastro && !isRegionalCadastro && (
            <div className="mb-6 border-t-4 border-[#1a59ad] pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
                <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                Hierarquia *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Unidade</Label>
                  <select
                    value={formData.unidade_id}
                    onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
                    required
                    className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white"
                  >
                    <option value="">Selecione uma unidade...</option>
                    {unidades && unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome_fantasia || unidade.razao_social || unidade.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Regional (Opcional)</Label>
                  <select
                    value={formData.regional_id}
                    onChange={(e) => setFormData({...formData, regional_id: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white"
                  >
                    <option value="">Nenhuma (opcional)</option>
                    {regionais && regionais.map((regional) => (
                      <option key={regional.id} value={regional.id}>
                        {regional.nome_fantasia || regional.razao_social || regional.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Se vinculado a uma regional, a comissão será distribuída entre regional e consultor
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========== CAMPOS CONDICIONAIS ========== */}
          {natureza === 'cpf' ? (
            /* ========== PESSOA FÍSICA (CPF) ========== */
            <>
              {/* Dados Pessoais */}
              <div className="border-t-4 border-[#1a59ad] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
                  <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                  Dados Pessoais *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label required>Nome Completo</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo do consultor"
                      required
                    />
                  </div>
                  <div>
                    <Label required>CPF</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={formData.rg}
                      onChange={(e) => setFormData({...formData, rg: e.target.value})}
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label required>Telefone</Label>
                    <Input
                      value={formData.telefone_pf}
                      onChange={(e) => setFormData({...formData, telefone_pf: formatPhone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Upload de RG (PF) */}
              <div className="border-t-4 border-[#2fa31c] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
                  <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                  <Upload size={24} />
                  Documentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>RG - Frente</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_front', true)}
                        className="hidden"
                        id="rg_front"
                      />
                      <label htmlFor="rg_front" className="cursor-pointer flex flex-col items-center gap-2">
                        {formData.rg_front_preview ? (
                          <img src={formData.rg_front_preview} alt="RG Frente" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-sm text-gray-600">Clique para enviar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>RG - Verso</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_back', true)}
                        className="hidden"
                        id="rg_back"
                      />
                      <label htmlFor="rg_back" className="cursor-pointer flex flex-col items-center gap-2">
                        {formData.rg_back_preview ? (
                          <img src={formData.rg_back_preview} alt="RG Verso" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-sm text-gray-600">Clique para enviar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ========== PESSOA JURÍDICA (CNPJ) ========== */
            <>
              {/* Dados da Empresa */}
              <div className="border-t-4 border-[#1a59ad] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
                  <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                  Dados da Empresa *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label required>Nome Fantasia</Label>
                    <Input
                      value={formData.nome_fantasia}
                      onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                      placeholder="Nome comercial"
                      required
                    />
                  </div>
                  <div>
                    <Label required>Razão Social</Label>
                    <Input
                      value={formData.razao_social}
                      onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                      placeholder="Razão social registrada"
                      required
                    />
                  </div>
                  <div>
                    <Label required>CNPJ</Label>
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

              {/* Dados do Responsável */}
              <div className="border-t-4 border-[#2fa31c] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
                  <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                  Dados do Responsável *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label required>Nome Completo</Label>
                    <Input
                      value={formData.responsavel_nome}
                      onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
                      placeholder="Nome do responsável legal"
                      required
                    />
                  </div>
                  <div>
                    <Label required>CPF</Label>
                    <Input
                      value={formData.responsavel_cpf}
                      onChange={(e) => setFormData({...formData, responsavel_cpf: formatCPF(e.target.value)})}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO REMOVIDA: Configurações de Pagamento definidas pela Unidade */}

              {/* Upload de Documentos (PJ) */}
              <div className="border-t-4 border-[#1a59ad] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
                  <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                  <Upload size={24} />
                  Documentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Contrato Social</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'contrato_social')}
                        className="hidden"
                        id="contrato_social"
                      />
                      <label htmlFor="contrato_social" className="cursor-pointer flex flex-col items-center gap-2">
                        <FileText className="text-gray-400" size={32} />
                        <span className="text-sm text-gray-600">
                          {formData.contrato_social_name || 'Clique para enviar'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Documento CNPJ</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'doc_cnpj')}
                        className="hidden"
                        id="doc_cnpj"
                      />
                      <label htmlFor="doc_cnpj" className="cursor-pointer flex flex-col items-center gap-2">
                        <FileText className="text-gray-400" size={32} />
                        <span className="text-sm text-gray-600">
                          {formData.doc_cnpj_name || 'Clique para enviar'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>RG Sócio - Frente</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_front', true)}
                        className="hidden"
                        id="rg_front_pj"
                      />
                      <label htmlFor="rg_front_pj" className="cursor-pointer flex flex-col items-center gap-2">
                        {formData.rg_front_preview ? (
                          <img src={formData.rg_front_preview} alt="RG Frente" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-sm text-gray-600">Clique para enviar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>RG Sócio - Verso</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a59ad] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'rg_back', true)}
                        className="hidden"
                        id="rg_back_pj"
                      />
                      <label htmlFor="rg_back_pj" className="cursor-pointer flex flex-col items-center gap-2">
                        {formData.rg_back_preview ? (
                          <img src={formData.rg_back_preview} alt="RG Verso" className="w-full h-32 object-cover rounded" />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-sm text-gray-600">Clique para enviar</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== SEÇÕES COMUNS (AMBOS) ========== */}

          {/* Dados PIX */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">{natureza === 'cpf' ? '4' : '7'}</span>
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
                <Label required>Tipo de Chave PIX</Label>
                <select
                  value={formData.pix_key_type}
                  onChange={(e) => setFormData({...formData, pix_key_type: e.target.value, pix_key: ''})}
                  className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white"
                  required
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <Label required>Chave PIX</Label>
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
                    formData.pix_key_type === 'phone' ? '(00) 00000-0000' :
                    'Cole aqui a chave aleatória'
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">{natureza === 'cpf' ? '5' : '8'}</span>
              <MapPin size={24} />
              Endereço *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep || ''}
                  onChange={(e) => {
                    const cep = formatCEP(e.target.value);
                    setFormData(prev => ({...prev, cep}));
                  }}
                  onBlur={(e) => {
                    console.log('🎯 onBlur disparado no campo CEP');
                    buscarCEP(e.target.value);
                  }}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label required>Rua/Avenida</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Nome da rua"
                  required
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="123"
                />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={(e) => setFormData({...formData, complement: e.target.value})}
                  placeholder="Apto, sala, etc"
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  placeholder="Nome do bairro"
                />
              </div>
              <div>
                <Label required>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Nome da cidade"
                  required
                />
              </div>
              <div>
                <Label required>Estado</Label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comissionamento */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">{natureza === 'cpf' ? '6' : '9'}</span>
              <DollarSign size={24} />
              Comissionamento
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Defina a comissão de mensalidade que o consultor receberá
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Comissão</Label>
                <select
                  value={formData.comissao_mensalidade_tipo}
                  onChange={(e) => setFormData({...formData, comissao_mensalidade_tipo: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white"
                >
                  <option value="valor">Valor Fixo (R$)</option>
                  <option value="percentual">Percentual (%)</option>
                </select>
              </div>
              <div>
                <Label>Valor da Comissão</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.comissao_mensalidade_valor}
                  onChange={(e) => setFormData({...formData, comissao_mensalidade_valor: e.target.value})}
                  placeholder={formData.comissao_mensalidade_tipo === 'percentual' ? '0.00%' : 'R$ 0.00'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.comissao_mensalidade_tipo === 'percentual' 
                    ? 'Ex: 10 para 10% da mensalidade'
                    : 'Ex: 50.00 para R$ 50,00 fixo'}
                </p>
              </div>
            </div>
          </div>

          {/* ========== SENHA PROVISÓRIA (Apenas ao editar E senha não foi trocada) ========== */}
          {editingConsultor && editingConsultor.must_change_password && editingConsultor.temporary_password && (
            <div className="border-t-4 border-yellow-500 pt-4">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-yellow-400 text-yellow-900 rounded-full p-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 text-lg mb-1">🔐 Dados de Acesso</h3>
                    <p className="text-yellow-800 text-sm">Usuário ainda não fez o primeiro acesso. Senha provisória disponível abaixo.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-yellow-300">
                    <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email de Acesso:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingConsultor.email}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingConsultor.email);
                          toast.success('Email copiado!');
                        }}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Copiar email"
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-yellow-300">
                    <label className="block text-sm font-bold text-gray-700 mb-2">🔑 Senha Provisória:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingConsultor.temporary_password}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg font-bold text-red-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingConsultor.temporary_password);
                          toast.success('Senha copiada!');
                        }}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Copiar senha"
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>📝 Instruções:</strong> Esta senha será automaticamente removida após o primeiro acesso e troca de senha pelo usuário.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dados de Acesso */}
          {!editingConsultor && (
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">{natureza === 'cpf' ? '7' : '10'}</span>
              Dados de Acesso *
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Estes dados serão usados para acessar o sistema. A senha é provisória e deverá ser alterada no primeiro acesso.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Email de Acesso</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div>
                <Label required>Senha Provisória</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Senha provisória"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a59ad] hover:text-[#2fa31c]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 bg-[#2fa31c] text-white rounded-md hover:bg-[#258a17] transition-colors whitespace-nowrap"
                  >
                    Gerar
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    disabled={!formData.password}
                    className="px-4 py-2 bg-[#1a59ad] text-white rounded-md hover:bg-[#144a8f] transition-colors disabled:bg-gray-300"
                  >
                    {copiedPassword ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-6 border-t-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : editingConsultor ? 'Atualizar Consultor' : 'Cadastrar Consultor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultorFormModal;
