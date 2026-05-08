import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { X, Building2, User, MapPin, Upload, CreditCard, Palette } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const Input = ({ ...props }) => (
  <input className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" {...props} />
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-[#1a59ad] mb-1">
    {children}
    {required && <span className="text-red-600 ml-1">*</span>}
  </label>
);

const Select = ({ children, ...props }) => (
  <select className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" {...props}>
    {children}
  </select>
);

const FornecedorFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tiposFornecedor, setTiposFornecedor] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ email: '', temporary_password: '' });

  const [formData, setFormData] = useState({
    // Dados da Empresa (PJ)
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    email: '',
    
    // Tipo de Serviço e Área
    tipo_servico_id: '',
    area_atendimento: 'nacional',
    area_atendimento_estado: '',
    area_atendimento_cidade: '',
    
    // Responsável
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_email: '',
    responsavel_telefone: '',
    
    // Endereço
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    
    // PIX
    pix_key: '',
    pix_key_type: 'cnpj',
    
    // 🔧 CORREÇÃO: Removidas cores e logo - fornecedor usa identidade da unidade
    
    // Documentos
    contrato_social: null,
    contrato_social_name: '',
    doc_cnpj: null,
    doc_cnpj_name: ''
  });

  // Buscar tipos de fornecedor
  useEffect(() => {
    if (isOpen) {
      fetchTiposFornecedor();
    }
  }, [isOpen]);

  const fetchTiposFornecedor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/labelview/tipos-fornecedor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setTiposFornecedor(response.data.tipos);
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de fornecedor:', error);
      toast.error('Erro ao carregar tipos de fornecedor');
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
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Buscar CEP
  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.data.erro) {
          setFormData({
            ...formData,
            street: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  // Upload de arquivos
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // 🔧 CORREÇÃO: Logo removido - fornecedor usa logo da unidade
      setFormData({
        ...formData,
        [fieldName]: file,
        [`${fieldName}_name`]: file.name
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Validações
      const camposFaltando = [];
      if (!formData.nome_fantasia) camposFaltando.push('Nome Fantasia');
      if (!formData.razao_social) camposFaltando.push('Razão Social');
      if (!formData.cnpj) camposFaltando.push('CNPJ');
      if (!formData.telefone) camposFaltando.push('Telefone');
      if (!formData.email) camposFaltando.push('Email');
      if (!formData.tipo_servico_id) camposFaltando.push('Tipo de Serviço');
      if (!formData.area_atendimento) camposFaltando.push('Área de Atendimento');
      if (!formData.responsavel_nome) camposFaltando.push('Nome do Responsável');
      if (!formData.responsavel_cpf) camposFaltando.push('CPF do Responsável');
      if (!formData.responsavel_email) camposFaltando.push('Email do Responsável');
      if (!formData.responsavel_telefone) camposFaltando.push('Telefone do Responsável');
      if (!formData.cep) camposFaltando.push('CEP');
      if (!formData.street) camposFaltando.push('Endereço');
      if (!formData.number) camposFaltando.push('Número');
      if (!formData.pix_key) camposFaltando.push('Chave PIX');

      if (camposFaltando.length > 0) {
        toast.error(`Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
        setLoading(false);
        return;
      }

      // Criar FormData
      const formDataToSend = new FormData();
      
      // Dados da Empresa
      formDataToSend.append('nome_fantasia', formData.nome_fantasia);
      formDataToSend.append('razao_social', formData.razao_social);
      formDataToSend.append('cnpj', formData.cnpj);
      formDataToSend.append('telefone', formData.telefone);
      formDataToSend.append('email', formData.email);
      
      // Tipo e Área
      formDataToSend.append('tipo_servico_id', formData.tipo_servico_id);
      formDataToSend.append('area_atendimento', formData.area_atendimento);
      if (formData.area_atendimento_estado) formDataToSend.append('area_atendimento_estado', formData.area_atendimento_estado);
      if (formData.area_atendimento_cidade) formDataToSend.append('area_atendimento_cidade', formData.area_atendimento_cidade);
      
      // Responsável
      formDataToSend.append('responsavel_nome', formData.responsavel_nome);
      formDataToSend.append('responsavel_cpf', formData.responsavel_cpf);
      formDataToSend.append('responsavel_email', formData.responsavel_email);
      formDataToSend.append('responsavel_telefone', formData.responsavel_telefone);
      
      // Endereço
      formDataToSend.append('cep', formData.cep);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('number', formData.number);
      formDataToSend.append('neighborhood', formData.neighborhood);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      if (formData.complement) formDataToSend.append('complement', formData.complement);
      
      // PIX
      formDataToSend.append('pix_key', formData.pix_key);
      formDataToSend.append('pix_key_type', formData.pix_key_type);
      
      // 🔧 CORREÇÃO: Cores e logo removidos - fornecedor usa identidade da unidade
      
      // Arquivos
      if (formData.contrato_social) formDataToSend.append('contrato_social', formData.contrato_social);
      if (formData.doc_cnpj) formDataToSend.append('doc_cnpj', formData.doc_cnpj);

      const response = await axios.post(
        `${API}/labelview/fornecedores`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Fornecedor cadastrado com sucesso!');
        
        // Mostrar credenciais
        if (response.data.credentials) {
          setCreatedCredentials(response.data.credentials);
          setShowSuccessModal(true);
        }
        
        if (onSuccess) onSuccess();
        
        // Resetar formulário
        setFormData({
          nome_fantasia: '',
          razao_social: '',
          cnpj: '',
          telefone: '',
          email: '',
          tipo_servico_id: '',
          area_atendimento: 'nacional',
          area_atendimento_estado: '',
          area_atendimento_cidade: '',
          responsavel_nome: '',
          responsavel_cpf: '',
          responsavel_email: '',
          responsavel_telefone: '',
          cep: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          complement: '',
          pix_key: '',
          pix_key_type: 'cnpj',
          cor_primaria: '#1a59ad',
          cor_secundaria: '#2fa31c',
          logo: null,
          logo_preview: null,
          contrato_social: null,
          contrato_social_name: '',
          doc_cnpj: null,
          doc_cnpj_name: ''
        });
        
        if (!response.data.credentials) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !showSuccessModal) return null;

  // Modal de Sucesso com Credenciais
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1a59ad] mb-2">Fornecedor Criado com Sucesso!</h3>
            <p className="text-sm text-gray-600 mb-4">Credenciais de acesso:</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
              <div className="mb-2">
                <Label>Email:</Label>
                <div className="font-mono text-sm bg-white p-2 rounded border">{createdCredentials.email}</div>
              </div>
              <div>
                <Label>Senha Provisória:</Label>
                <div className="font-mono text-sm bg-white p-2 rounded border">{createdCredentials.temporary_password}</div>
              </div>
            </div>
            
            <p className="text-xs text-red-600 mb-4">⚠️ Guarde essas credenciais! O fornecedor precisará trocar a senha no primeiro acesso.</p>
            
            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
              className="w-full bg-[#2fa31c] text-white py-2 px-4 rounded-md hover:bg-[#258517] transition-colors font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b-4 border-[#1a59ad]">
          <h2 className="text-2xl font-bold text-[#1a59ad]">Cadastrar Novo Fornecedor</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          
          {/* 1. DADOS DA EMPRESA */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <Building2 size={24} />
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
                <Label required>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@empresa.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. TIPO DE SERVIÇO E ÁREA */}
          <div className="mb-6 border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c]">Tipo de Serviço e Área de Atendimento *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Tipo de Serviço</Label>
                <Select
                  value={formData.tipo_servico_id}
                  onChange={(e) => setFormData({...formData, tipo_servico_id: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposFornecedor.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.tipo_servico}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label required>Área de Atendimento</Label>
                <Select
                  value={formData.area_atendimento}
                  onChange={(e) => setFormData({...formData, area_atendimento: e.target.value})}
                  required
                >
                  <option value="nacional">Nacional</option>
                  <option value="estadual">Estadual</option>
                  <option value="cidade">Cidade</option>
                </Select>
              </div>
              
              {formData.area_atendimento === 'estadual' && (
                <div>
                  <Label required>Estado</Label>
                  <Input
                    value={formData.area_atendimento_estado}
                    onChange={(e) => setFormData({...formData, area_atendimento_estado: e.target.value})}
                    placeholder="Ex: RJ"
                    maxLength="2"
                    required
                  />
                </div>
              )}
              
              {formData.area_atendimento === 'cidade' && (
                <>
                  <div>
                    <Label required>Estado</Label>
                    <Input
                      value={formData.area_atendimento_estado}
                      onChange={(e) => setFormData({...formData, area_atendimento_estado: e.target.value})}
                      placeholder="Ex: RJ"
                      maxLength="2"
                      required
                    />
                  </div>
                  <div>
                    <Label required>Cidade</Label>
                    <Input
                      value={formData.area_atendimento_cidade}
                      onChange={(e) => setFormData({...formData, area_atendimento_cidade: e.target.value})}
                      placeholder="Ex: Rio de Janeiro"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. DADOS DO RESPONSÁVEL */}
          <div className="mb-6 border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <User size={24} />
              Dados do Responsável *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Nome Completo</Label>
                <Input
                  value={formData.responsavel_nome}
                  onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
                  placeholder="Nome do responsável"
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
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={formData.responsavel_email}
                  onChange={(e) => setFormData({...formData, responsavel_email: e.target.value})}
                  placeholder="email@responsavel.com"
                  required
                />
              </div>
              <div>
                <Label required>Telefone</Label>
                <Input
                  value={formData.responsavel_telefone}
                  onChange={(e) => setFormData({...formData, responsavel_telefone: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. ENDEREÇO */}
          <div className="mb-6 border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <MapPin size={24} />
              Endereço *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label required>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: formatCEP(e.target.value)})}
                  onBlur={handleCEPBlur}
                  placeholder="00000-000"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label required>Rua/Avenida</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  placeholder="Nome da rua"
                  required
                />
              </div>
              <div>
                <Label required>Número</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="123"
                  required
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
                <Label required>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  placeholder="Bairro"
                  required
                />
              </div>
              <div>
                <Label required>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Cidade"
                  required
                />
              </div>
              <div>
                <Label required>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="UF"
                  maxLength="2"
                  required
                />
              </div>
            </div>
          </div>

          {/* 5. PIX */}
          <div className="mb-6 border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <CreditCard size={24} />
              Dados PIX *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Tipo de Chave</Label>
                <Select
                  value={formData.pix_key_type}
                  onChange={(e) => setFormData({...formData, pix_key_type: e.target.value})}
                  required
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                  <option value="email">Email</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </Select>
              </div>
              <div>
                <Label required>Chave PIX</Label>
                <Input
                  value={formData.pix_key}
                  onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                  placeholder="Digite a chave PIX"
                  required
                />
              </div>
            </div>
          </div>

          {/* 🔧 CORREÇÃO: Identidade Visual removida - fornecedor usa logo e cores da unidade */}

          {/* 6. DOCUMENTOS */}
          <div className="mb-6 border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <Upload size={24} />
              Documentos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contrato Social</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'contrato_social')}
                  className="w-full text-sm"
                />
                {formData.contrato_social_name && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.contrato_social_name}</p>
                )}
              </div>
              <div>
                <Label>Documento CNPJ</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'doc_cnpj')}
                  className="w-full text-sm"
                />
                {formData.doc_cnpj_name && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.doc_cnpj_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-[#1a59ad] text-[#1a59ad] rounded-md hover:bg-gray-50 font-bold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2fa31c] text-white rounded-md hover:bg-[#258517] font-bold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FornecedorFormModal;
