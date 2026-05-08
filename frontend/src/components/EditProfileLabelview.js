import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { X, Upload, Eye, EyeOff, Save, User, Building2, MapPin, CreditCard, FileText, Settings, Share2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const EditProfileLabelview = ({ isOpen, onClose, userProfile, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados-basicos');

  const [formData, setFormData] = useState({
    // Dados Básicos
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    
    // Dados Empresa (PJ) - Master/Unidade/Regional/Consultor PJ
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    inscricao_municipal: '',
    inscricao_estadual: '',
    
    // Responsável/Sócio (para PJ)
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_email: '',
    responsavel_whatsapp: '',
    
    // Pessoa Física (apenas Consultor PF)
    cpf: '',
    rg: '',
    
    // Dados PIX (NOVO)
    pix_key: '',
    pix_key_type: 'cpf', // cpf, email, phone, random
    
    // Link Personalizado de Indicação
    referral_slug: '',
    
    // Endereço
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    // Documentos
    rg_front: null,
    rg_front_preview: null,
    rg_back: null,
    rg_back_preview: null,
    
    // Identidade Visual (para Unidade)
    logo: null,
    logo_preview: null,
    cor_primaria: '#1a59ad',
    cor_secundaria: '#2fa31c',
    
    // Configurações de Pagamento (para Unidade)
    taxa_adesao: '',
    vencimento_inicio: '1',
    vencimento_fim: '15'
  });

  // Carregar dados do perfil quando abrir
  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        full_name: userProfile.full_name || userProfile.responsavel_nome || userProfile.nome || '',
        email: userProfile.email || '',
        phone: userProfile.phone || userProfile.telefone || '',
        whatsapp: userProfile.whatsapp || '',
        
        // Dados Empresa (PJ)
        nome_fantasia: userProfile.nome_fantasia || '',
        razao_social: userProfile.razao_social || '',
        cnpj: userProfile.cnpj || '',
        inscricao_municipal: userProfile.inscricao_municipal || '',
        inscricao_estadual: userProfile.inscricao_estadual || '',
        
        // Responsável (PJ)
        responsavel_nome: userProfile.responsavel_nome || '',
        responsavel_cpf: userProfile.responsavel_cpf || '',
        responsavel_email: userProfile.responsavel_email || '',
        responsavel_whatsapp: userProfile.responsavel_whatsapp || '',
        
        // Pessoa Física
        cpf: userProfile.cpf || '',
        rg: userProfile.rg || '',
        
        pix_key: userProfile.pix_key || '',
        pix_key_type: userProfile.pix_key_type || 'cpf',
        referral_slug: userProfile.referral_slug || '',
        
        cep: userProfile.cep || '',
        street: userProfile.street || userProfile.address || '',
        number: userProfile.number || '',
        complement: userProfile.complement || '',
        neighborhood: userProfile.neighborhood || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        
        rg_front: null,
        rg_front_preview: userProfile.rg_front_url || null,
        rg_back: null,
        rg_back_preview: userProfile.rg_back_url || null,
        
        logo: null,
        logo_preview: userProfile.logo_url || null,
        cor_primaria: userProfile.cor_primaria || '#1a59ad',
        cor_secundaria: userProfile.cor_secundaria || '#2fa31c',
        
        // Configurações de Pagamento
        taxa_adesao: userProfile.taxa_adesao || '',
        vencimento_inicio: userProfile.vencimento_inicio || '1',
        vencimento_fim: userProfile.vencimento_fim || '15'
      });
      
      console.log('🔄 EditProfileLabelview - userProfile carregado:');
      console.log('  - user_type:', userProfile.user_type);
      console.log('  - is_labelview_unidade:', userProfile.is_labelview_unidade);
      console.log('  - logo_url existente:', userProfile.logo_url);
    }
  }, [isOpen, userProfile]);

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
            street: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf
          });
          toast.success('CEP encontrado!');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      }
    }
  };

  // Upload de imagem
  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    console.log(`📷 Arquivo selecionado para ${fieldName}:`, file?.name, file?.size);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`✅ Preview gerado para ${fieldName}`);
        // Usar callback do setState para garantir estado atualizado
        setFormData(prevData => ({
          ...prevData,
          [fieldName]: file,
          [`${fieldName}_preview`]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Máscaras
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Validar chave PIX (apenas se preenchida)
  const validatePixKey = () => {
    const { pix_key, pix_key_type } = formData;
    
    // Se não preencheu PIX, permite salvar (pode preencher depois)
    if (!pix_key || pix_key.trim() === '') {
      return true;
    }

    // Se preencheu, valida o formato
    switch (pix_key_type) {
      case 'cpf':
        if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(pix_key)) {
          toast.error('CPF inválido no formato PIX. Use: 000.000.000-00');
          return false;
        }
        break;
      case 'cnpj':
        if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(pix_key)) {
          toast.error('CNPJ inválido no formato PIX. Use: 00.000.000/0000-00');
          return false;
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pix_key)) {
          toast.error('Email inválido');
          return false;
        }
        break;
      case 'phone':
        if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(pix_key)) {
          toast.error('Telefone inválido no formato PIX. Use: (00) 00000-0000');
          return false;
        }
        break;
      case 'random':
        if (pix_key.length < 32) {
          toast.error('Chave aleatória deve ter pelo menos 32 caracteres');
          return false;
        }
        break;
    }

    return true;
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('='.repeat(80));
    console.log('🔍 INICIANDO EDIÇÃO DE PERFIL');
    console.log('📊 Estado do formData.logo:', formData.logo ? `File: ${formData.logo.name} (${formData.logo.size} bytes)` : 'NULL/UNDEFINED');
    console.log('📊 Estado do formData.logo_preview:', formData.logo_preview ? 'Presente' : 'NULL');
    console.log('Dados atuais do formulário:', {
      taxa_adesao: formData.taxa_adesao,
      vencimento_inicio: formData.vencimento_inicio,
      vencimento_fim: formData.vencimento_fim,
      pix_key: formData.pix_key ? '***' : 'vazio'
    });
    
    // Validar PIX (opcional na edição)
    if (!validatePixKey()) {
      console.log('❌ Validação PIX falhou');
      return;
    }
    
    console.log('✅ Validação PIX OK');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token obtido:', token ? 'Presente' : 'Ausente');
      
      const formDataToSend = new FormData();
      
      // Dados básicos
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('whatsapp', formData.whatsapp);
      
      // Dados PIX
      formDataToSend.append('pix_key', formData.pix_key);
      formDataToSend.append('pix_key_type', formData.pix_key_type);
      
      // Link Personalizado
      if (formData.referral_slug) {
        formDataToSend.append('referral_slug', formData.referral_slug);
      }
      
      // Dados Empresa (se PJ)
      if (formData.cnpj) {
        formDataToSend.append('nome_fantasia', formData.nome_fantasia);
        formDataToSend.append('razao_social', formData.razao_social);
        formDataToSend.append('cnpj', formData.cnpj);
        formDataToSend.append('inscricao_municipal', formData.inscricao_municipal || '');
        formDataToSend.append('inscricao_estadual', formData.inscricao_estadual || '');
      }
      
      // Responsável (PJ)
      if (formData.responsavel_nome) {
        formDataToSend.append('responsavel_nome', formData.responsavel_nome);
        formDataToSend.append('responsavel_cpf', formData.responsavel_cpf);
        formDataToSend.append('responsavel_email', formData.responsavel_email);
        formDataToSend.append('responsavel_whatsapp', formData.responsavel_whatsapp || '');
      }
      
      // Pessoa Física (Consultor PF)
      if (formData.cpf) {
        formDataToSend.append('cpf', formData.cpf);
      }
      if (formData.rg) {
        formDataToSend.append('rg', formData.rg);
      }
      
      // Endereço
      formDataToSend.append('cep', formData.cep);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('number', formData.number);
      formDataToSend.append('complement', formData.complement || '');
      formDataToSend.append('neighborhood', formData.neighborhood);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      
      // Documentos (apenas se novos uploads)
      if (formData.rg_front) formDataToSend.append('rg_front', formData.rg_front);
      if (formData.rg_back) formDataToSend.append('rg_back', formData.rg_back);
      
      // Logo e Cores (apenas para Unidade)
      console.log('🔍 Verificando tipo de usuário:', userProfile?.user_type);
      console.log('🔍 is_labelview_unidade:', userProfile?.is_labelview_unidade);
      
      if (userProfile?.user_type === 'labelview_unidade' || userProfile?.is_labelview_unidade) {
        console.log('✅ Usuário é unidade Labelview - processando logo');
        
        // Logo (se alterado)
        if (formData.logo) {
          console.log('📷 Logo sendo enviada:', formData.logo.name, formData.logo.size, 'bytes');
          console.log('📷 Logo type:', formData.logo.type);
          formDataToSend.append('logo', formData.logo);
        } else {
          console.log('⚠️ Nenhuma logo nova selecionada - formData.logo:', formData.logo);
        }
        
        // Cores - sempre enviar para manter sincronizadas
        if (formData.cor_primaria) {
          console.log('🎨 Cor primária:', formData.cor_primaria);
          formDataToSend.append('cor_primaria', formData.cor_primaria);
        }
        if (formData.cor_secundaria) {
          console.log('🎨 Cor secundária:', formData.cor_secundaria);
          formDataToSend.append('cor_secundaria', formData.cor_secundaria);
        }
      } else {
        console.log('⚠️ Usuário NÃO é unidade Labelview - pulando logo');
      }
      
      // Configurações de Pagamento (apenas para Unidade)
      if (userProfile?.user_type === 'labelview_unidade' || userProfile?.is_labelview_unidade) {
        if (formData.taxa_adesao) {
          formDataToSend.append('taxa_adesao', formData.taxa_adesao);
        }
        if (formData.vencimento_inicio) {
          formDataToSend.append('vencimento_inicio', formData.vencimento_inicio);
        }
        if (formData.vencimento_fim) {
          formDataToSend.append('vencimento_fim', formData.vencimento_fim);
        }
      }
      
      // Log seguro - apenas contagem de campos
      console.log('📤 Enviando perfil Labelview...');
      
      // Debug: mostrar todos os campos no FormData
      console.log('📋 Campos no FormData:');
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  - ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`  - ${pair[0]}: ${pair[1]}`);
        }
      }
      
      const response = await axios.patch(`${API}/labelview/profile`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('📥 Perfil atualizado com sucesso');
      
      if (response.data.success) {
        toast.success('✅ Perfil atualizado com sucesso!');
        console.log('✅ Perfil atualizado com sucesso');
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        toast.error('Erro ao atualizar perfil');
        console.error('❌ Resposta sem success=true');
      }
    } catch (error) {
      console.error('='.repeat(80));
      console.error('❌ ERRO AO ATUALIZAR PERFIL');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Resposta do servidor:', error.response?.data);
      console.error('Erro completo:', error);
      console.error('='.repeat(80));
      
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao atualizar perfil';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log('🔚 handleSubmit finalizado');
      console.log('='.repeat(80));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#1a59ad] to-[#2fa31c]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User size={24} />
            Editar Perfil
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('dados-basicos')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dados-basicos'
                ? 'text-[#1a59ad] border-b-2 border-[#1a59ad] bg-white'
                : 'text-gray-500 hover:text-[#1a59ad]'
            }`}
          >
            <div className="flex items-center gap-2">
              <User size={18} />
              Dados Básicos
            </div>
          </button>
          {formData.cnpj && (
            <button
              onClick={() => setActiveTab('empresa')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'empresa'
                  ? 'text-[#1a59ad] border-b-2 border-[#1a59ad] bg-white'
                  : 'text-gray-500 hover:text-[#1a59ad]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 size={18} />
                Empresa
              </div>
            </button>
          )}
          <button
            onClick={() => setActiveTab('pix-endereco')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'pix-endereco'
                ? 'text-[#1a59ad] border-b-2 border-[#1a59ad] bg-white'
                : 'text-gray-500 hover:text-[#1a59ad]'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              PIX & Endereço
            </div>
          </button>
          {userProfile?.user_type === 'labelview_unidade' && (
            <button
              data-tab="configuracoes"
              onClick={() => setActiveTab('configuracoes')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'configuracoes'
                  ? 'text-[#1a59ad] border-b-2 border-[#1a59ad] bg-white'
                  : 'text-gray-500 hover:text-[#1a59ad]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={18} />
                Configurações
              </div>
            </button>
          )}
          <button
            onClick={() => setActiveTab('documentos')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'documentos'
                ? 'text-[#1a59ad] border-b-2 border-[#1a59ad] bg-white'
                : 'text-gray-500 hover:text-[#1a59ad]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              Documentos
            </div>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Dados Básicos */}
          {activeTab === 'dados-basicos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: formatPhone(e.target.value)})}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                  />
                </div>
              </div>

              {/* Dados Pessoa Física (Consultor PF) */}
              {!formData.cnpj && userProfile?.user_type === 'labelview_consultor' && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-[#1a59ad] mb-4">Dados Pessoa Física</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF *
                      </label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RG
                      </label>
                      <input
                        type="text"
                        value={formData.rg}
                        onChange={(e) => setFormData({...formData, rg: e.target.value})}
                        placeholder="00.000.000-0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Responsável/Sócio */}
              {formData.cnpj && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-[#1a59ad] mb-4">Responsável / Sócio Administrador</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Responsável *
                      </label>
                      <input
                        type="text"
                        value={formData.responsavel_nome}
                        onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF do Responsável *
                      </label>
                      <input
                        type="text"
                        value={formData.responsavel_cpf}
                        onChange={(e) => setFormData({...formData, responsavel_cpf: formatCPF(e.target.value)})}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email do Responsável *
                      </label>
                      <input
                        type="email"
                        value={formData.responsavel_email}
                        onChange={(e) => setFormData({...formData, responsavel_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp do Responsável
                      </label>
                      <input
                        type="text"
                        value={formData.responsavel_whatsapp}
                        onChange={(e) => setFormData({...formData, responsavel_whatsapp: formatPhone(e.target.value)})}
                        placeholder="(11) 98765-4321"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Empresa */}
          {activeTab === 'empresa' && formData.cnpj && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inscrição Municipal
                  </label>
                  <input
                    type="text"
                    value={formData.inscricao_municipal}
                    onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={formData.inscricao_estadual}
                    onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                  />
                </div>
              </div>

              {/* Identidade Visual (apenas Unidade) */}
              {userProfile?.user_type === 'labelview_unidade' && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-[#1a59ad] mb-4">Identidade Visual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo da Unidade
                      </label>
                      <label 
                        htmlFor="logo-upload"
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a59ad] transition-colors cursor-pointer block"
                      >
                        {formData.logo_preview ? (
                          <img src={formData.logo_preview} alt="Logo" className="w-full h-32 object-contain mb-2" />
                        ) : (
                          <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'logo')}
                          className="hidden"
                          id="logo-upload"
                        />
                        <span className="text-sm text-[#1a59ad] hover:underline cursor-pointer">
                          Clique para escolher uma logo
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor Primária
                      </label>
                      <input
                        type="color"
                        value={formData.cor_primaria}
                        onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                        className="w-full h-12 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.cor_primaria}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor Secundária
                      </label>
                      <input
                        type="color"
                        value={formData.cor_secundaria}
                        onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                        className="w-full h-12 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.cor_secundaria}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: PIX & Endereço */}
          {activeTab === 'pix-endereco' && (
            <div className="space-y-6">
              {/* Dados PIX */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a59ad] mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Dados PIX (Obrigatório)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ Seus pagamentos e comissões serão enviados para esta chave PIX
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Chave PIX *
                    </label>
                    <select
                      value={formData.pix_key_type}
                      onChange={(e) => setFormData({...formData, pix_key_type: e.target.value, pix_key: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave PIX *
                    </label>
                    <input
                      type="text"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Link Personalizado de Indicação - Apenas para Consultor, Regional e Fornecedor */}
              {userProfile?.user_type !== 'labelview_master' && userProfile?.user_type !== 'labelview_unidade' && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-[#2fa31c] mb-4 flex items-center gap-2">
                  <Share2 size={20} />
                  Link Personalizado de Indicação
                </h3>
                <div className="bg-[#e3dcda] p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug Personalizado (opcional)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">https://app.transmill.com.br/cotacao/</span>
                      <input
                        type="text"
                        value={formData.referral_slug}
                        onChange={(e) => {
                          // Remover espaços e caracteres especiais, permitir apenas letras, números e underscore
                          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setFormData({...formData, referral_slug: slug});
                        }}
                        placeholder="consultor_rafael"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2fa31c]"
                        maxLength="30"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      📌 Crie um link personalizado para compartilhar com seus clientes. Exemplo: consultor_rafael, joao_silva, etc.
                    </p>
                    {formData.referral_slug && (
                      <div className="mt-3 p-3 bg-[#2fa31c]/10 border border-[#2fa31c] rounded">
                        <p className="text-xs font-medium text-[#2fa31c] mb-1">Seu link será:</p>
                        <p className="text-sm font-mono text-[#1a59ad] break-all">
                          https://app.transmill.com.br/cotacao/{formData.referral_slug}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Endereço */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-[#1a59ad] mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Endereço Completo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => {
                        const cep = formatCEP(e.target.value);
                        setFormData({...formData, cep});
                        if (cep.replace(/\D/g, '').length === 8) {
                          buscarCEP(cep);
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua/Avenida *
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => setFormData({...formData, complement: e.target.value})}
                      placeholder="Apto, Bloco, etc"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Configurações (apenas Unidade) */}
          {activeTab === 'configuracoes' && userProfile?.user_type === 'labelview_unidade' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1a59ad] mb-4 flex items-center gap-2">
                <Settings size={20} />
                Configurações de Pagamento
              </h3>
              
              {/* Taxa de Adesão */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CreditCard size={18} />
                  Taxa de Adesão
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  💰 Valor único pago à vista na primeira mensalidade. 100% do valor fica com quem vende.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa de Adesão (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxa_adesao}
                      onChange={(e) => {
                        console.log('💰 Taxa de Adesão alterada:', e.target.value);
                        setFormData({...formData, taxa_adesao: e.target.value});
                      }}
                      placeholder="100.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor fixo aplicado a todos os planos
                    </p>
                  </div>
                </div>
              </div>

              {/* Intervalo de Vencimento */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  📅 Intervalo de Vencimento das Mensalidades
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  O cliente poderá escolher uma data dentro deste intervalo para pagar as mensalidades.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dia Início *
                    </label>
                    <select
                      value={formData.vencimento_inicio}
                      onChange={(e) => {
                        console.log('📅 Vencimento Início alterado:', e.target.value);
                        setFormData({...formData, vencimento_inicio: e.target.value});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    >
                      {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dia Fim *
                    </label>
                    <select
                      value={formData.vencimento_fim}
                      onChange={(e) => {
                        console.log('📅 Vencimento Fim alterado:', e.target.value);
                        setFormData({...formData, vencimento_fim: e.target.value});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]"
                      required
                    >
                      {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Exemplo: Dia {formData.vencimento_inicio} a {formData.vencimento_fim} - Cliente poderá escolher qualquer dia entre {formData.vencimento_inicio} e {formData.vencimento_fim} para vencimento
                </p>
              </div>
            </div>
          )}

          {/* Tab: Documentos */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Envie apenas se precisar atualizar os documentos. Os documentos atuais serão mantidos se não enviar novos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG/CNH - Frente
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a59ad] transition-colors cursor-pointer">
                    {formData.rg_front_preview ? (
                      <img src={formData.rg_front_preview} alt="RG Frente" className="w-full h-48 object-contain mb-2" />
                    ) : (
                      <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'rg_front')}
                      className="hidden"
                      id="rg-front-upload"
                    />
                    <label htmlFor="rg-front-upload" className="text-sm text-[#1a59ad] hover:underline cursor-pointer">
                      {formData.rg_front_preview ? 'Trocar documento' : 'Escolher arquivo'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG/CNH - Verso
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a59ad] transition-colors cursor-pointer">
                    {formData.rg_back_preview ? (
                      <img src={formData.rg_back_preview} alt="RG Verso" className="w-full h-48 object-contain mb-2" />
                    ) : (
                      <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'rg_back')}
                      className="hidden"
                      id="rg-back-upload"
                    />
                    <label htmlFor="rg-back-upload" className="text-sm text-[#1a59ad] hover:underline cursor-pointer">
                      {formData.rg_back_preview ? 'Trocar documento' : 'Escolher arquivo'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileLabelview;
