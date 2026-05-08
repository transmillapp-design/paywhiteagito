import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { X, Building2, User, DollarSign, Percent, Warehouse } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const Input = ({ ...props }) => (
  <input className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" {...props} />
);

const Label = ({ children }) => (
  <label className="block text-sm font-bold text-[#1a59ad] mb-1">{children}</label>
);

const FornecedorFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [tiposFornecedor, setTiposFornecedor] = useState([]);
  const [natureza, setNatureza] = useState(''); // 'fisica' ou 'juridica'

  const [formData, setFormData] = useState({
    // Comum
    unidade_id: '',
    regional_id: '',
    tipo_servico_id: '',
    area_atendimento: '',
    nome_exibicao: '',
    telefone_contato: '',
    observacao: '',
    
    // Pessoa Física
    nome: '',
    cpf: '',
    rg: '',
    orgao_expedidor: '',
    data_expedicao: '',
    sexo: '',
    data_nascimento: '',
    nacionalidade: '',
    naturalidade_uf: '',
    nome_mae: '',
    nome_pai: '',
    estado_civil: '',
    conjuge: '',
    numero_cnh: '',
    categoria_cnh: '',
    validade_cnh: '',
    
    // Pessoa Jurídica
    razao_social: '',
    cnpj: '',
    nome_fantasia: '',
    inscricao_municipal: '',
    inscricao_estadual: '',
    responsavel: '',
    data_fundacao: '',
    
    // Comissionamento
    comissao_adesao_tipo: 'valor', // 'valor' ou 'percentual'
    comissao_adesao_valor: '',
    pagamento_adesao: 'avista', // 'avista' ou 'parcelado'
    comissao_mensalidade_tipo: 'valor', // 'valor' ou 'percentual'
    comissao_mensalidade_valor: ''
  });

  // Buscar unidades, regionais e tipos de fornecedor
  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
      fetchRegionais();
      fetchTiposFornecedor();
    }
  }, [isOpen]);

  const fetchUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/labelview/unidades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnidades(response.data.unidades);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      toast.error('Erro ao carregar unidades');
    }
  };

  const fetchRegionais = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/labelview/regionais`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setRegionais(response.data.regionais);
      }
    } catch (error) {
      console.error('Erro ao buscar regionais:', error);
      toast.error('Erro ao carregar regionais');
    }
  };

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

  // Aplicar máscara CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
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

  // Aplicar máscara Telefone
  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.unidade_id) {
      toast.error('Selecione uma unidade');
      return;
    }

    if (!natureza) {
      toast.error('Selecione a natureza (Física ou Jurídica)');
      return;
    }

    if (natureza === 'fisica' && (!formData.nome || !formData.cpf)) {
      toast.error('Preencha os dados obrigatórios (Nome e CPF)');
      return;
    }

    if (natureza === 'juridica' && (!formData.razao_social || !formData.cnpj)) {
      toast.error('Preencha os dados obrigatórios (Razão Social e CNPJ)');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        natureza,
        user_type: 'labelview_fornecedor',
        is_labelview_fornecedor: true
      };
      
      const response = await axios.post(`${API}/labelview/fornecedores`, dataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Fornecedor cadastrado com sucesso!');
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c]">
          <div className="flex items-center gap-3">
            <Warehouse size={32} />
            <div>
              <h2 className="text-2xl font-bold">Novo Fornecedor</h2>
              <p className="text-sm opacity-90">Cadastro de Fornecedor - Pessoa Física ou Jurídica</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Unidade e Regional */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad]">Unidade e Regional *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Selecione a Unidade</Label>
                <select
                  value={formData.unidade_id}
                  onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]"
                  required
                >
                  <option value="">Selecione uma unidade</option>
                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome_fantasia || unidade.razao_social}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Selecione a Regional (opcional)</Label>
                <select
                  value={formData.regional_id}
                  onChange={(e) => setFormData({...formData, regional_id: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]"
                >
                  <option value="">Nenhuma regional</option>
                  {regionais.map((regional) => (
                    <option key={regional.id} value={regional.id}>
                      {regional.nome_fantasia || regional.razao_social || regional.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tipo de Serviço e Área de Atendimento */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c]">Informações do Fornecedor *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Serviço *</Label>
                <select
                  value={formData.tipo_servico_id}
                  onChange={(e) => setFormData({...formData, tipo_servico_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2fa31c]"
                  required
                >
                  <option value="">Selecione o tipo de serviço</option>
                  {tiposFornecedor.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.tipo_servico}
                    </option>
                  ))}
                </select>
                {tiposFornecedor.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Nenhum tipo cadastrado. Cadastre tipos primeiro.
                  </p>
                )}
              </div>
              <div>
                <Label>Área de Atendimento *</Label>
                <Input
                  type="text"
                  value={formData.area_atendimento}
                  onChange={(e) => setFormData({...formData, area_atendimento: e.target.value})}
                  placeholder="Ex: São Paulo, Nacional, Regional..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Seleção de Natureza */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c]">Natureza *</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="natureza"
                  value="fisica"
                  checked={natureza === 'fisica'}
                  onChange={(e) => setNatureza(e.target.value)}
                  className="w-5 h-5 text-[#1a59ad]"
                />
                <User size={20} className="text-[#1a59ad]" />
                <span className="font-semibold">Pessoa Física</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="natureza"
                  value="juridica"
                  checked={natureza === 'juridica'}
                  onChange={(e) => setNatureza(e.target.value)}
                  className="w-5 h-5 text-[#1a59ad]"
                />
                <Building2 size={20} className="text-[#1a59ad]" />
                <span className="font-semibold">Pessoa Jurídica</span>
              </label>
            </div>
          </div>

          {/* Formulário Pessoa Física */}
          {natureza === 'fisica' && (
            <>
              <div className="border-t-4 border-[#1a59ad] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#1a59ad]">Dados Pessoais *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label>CPF *</Label>
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
                      placeholder="Número do RG"
                    />
                  </div>
                  <div>
                    <Label>Órgão Expedidor</Label>
                    <Input
                      value={formData.orgao_expedidor}
                      onChange={(e) => setFormData({...formData, orgao_expedidor: e.target.value})}
                      placeholder="Ex: SSP"
                    />
                  </div>
                  <div>
                    <Label>Data de Expedição</Label>
                    <Input
                      type="date"
                      value={formData.data_expedicao}
                      onChange={(e) => setFormData({...formData, data_expedicao: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <select
                      value={formData.sexo}
                      onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]"
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
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
                    <Label>Nacionalidade</Label>
                    <Input
                      value={formData.nacionalidade}
                      onChange={(e) => setFormData({...formData, nacionalidade: e.target.value})}
                      placeholder="Ex: Brasileira"
                    />
                  </div>
                  <div>
                    <Label>Naturalidade (UF)</Label>
                    <Input
                      value={formData.naturalidade_uf}
                      onChange={(e) => setFormData({...formData, naturalidade_uf: e.target.value.toUpperCase()})}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>Nome da Mãe</Label>
                    <Input
                      value={formData.nome_mae}
                      onChange={(e) => setFormData({...formData, nome_mae: e.target.value})}
                      placeholder="Nome completo da mãe"
                    />
                  </div>
                  <div>
                    <Label>Nome do Pai</Label>
                    <Input
                      value={formData.nome_pai}
                      onChange={(e) => setFormData({...formData, nome_pai: e.target.value})}
                      placeholder="Nome completo do pai"
                    />
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <select
                      value={formData.estado_civil}
                      onChange={(e) => setFormData({...formData, estado_civil: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]"
                    >
                      <option value="">Selecione</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Cônjuge</Label>
                    <Input
                      value={formData.conjuge}
                      onChange={(e) => setFormData({...formData, conjuge: e.target.value})}
                      placeholder="Nome do cônjuge"
                    />
                  </div>
                  <div>
                    <Label>Número da CNH</Label>
                    <Input
                      value={formData.numero_cnh}
                      onChange={(e) => setFormData({...formData, numero_cnh: e.target.value})}
                      placeholder="Número da CNH"
                    />
                  </div>
                  <div>
                    <Label>Categoria CNH</Label>
                    <Input
                      value={formData.categoria_cnh}
                      onChange={(e) => setFormData({...formData, categoria_cnh: e.target.value})}
                      placeholder="A, B, C, D, E"
                    />
                  </div>
                  <div>
                    <Label>Validade CNH</Label>
                    <Input
                      type="date"
                      value={formData.validade_cnh}
                      onChange={(e) => setFormData({...formData, validade_cnh: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Formulário Pessoa Jurídica */}
          {natureza === 'juridica' && (
            <div className="border-t-4 border-[#1a59ad] pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#1a59ad]">Dados da Empresa *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social *</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                    placeholder="Razão social da empresa"
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
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                    placeholder="Nome fantasia"
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
                  <Label>Responsável</Label>
                  <Input
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <Label>Data de Fundação</Label>
                  <Input
                    type="date"
                    value={formData.data_fundacao}
                    onChange={(e) => setFormData({...formData, data_fundacao: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos Comuns (quando natureza for selecionada) */}
          {natureza && (
            <>
              <div className="border-t-4 border-[#2fa31c] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#2fa31c]">Informações de Exibição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome de Exibição</Label>
                    <Input
                      value={formData.nome_exibicao}
                      onChange={(e) => setFormData({...formData, nome_exibicao: e.target.value})}
                      placeholder="Nome para exibição no sistema"
                    />
                  </div>
                  <div>
                    <Label>Telefone de Contato</Label>
                    <Input
                      value={formData.telefone_contato}
                      onChange={(e) => setFormData({...formData, telefone_contato: formatPhone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <textarea
                      value={formData.observacao}
                      onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                      placeholder="Observações gerais"
                      className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Comissionamento */}
              <div className="border-t-4 border-[#1a59ad] pt-4">
                <h3 className="text-xl font-bold mb-4 text-[#1a59ad]">Comissionamento</h3>
                
                {/* Comissão Adesão */}
                <div className="mb-6 p-4 bg-[#e3dcda] rounded-lg">
                  <h4 className="font-bold mb-3 text-[#1a59ad]">Comissão de Adesão</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Comissão</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="comissao_adesao_tipo"
                            value="valor"
                            checked={formData.comissao_adesao_tipo === 'valor'}
                            onChange={(e) => setFormData({...formData, comissao_adesao_tipo: e.target.value})}
                            className="w-4 h-4"
                          />
                          <DollarSign size={16} className="text-[#2fa31c]" />
                          <span>R$ (Valor)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="comissao_adesao_tipo"
                            value="percentual"
                            checked={formData.comissao_adesao_tipo === 'percentual'}
                            onChange={(e) => setFormData({...formData, comissao_adesao_tipo: e.target.value})}
                            className="w-4 h-4"
                          />
                          <Percent size={16} className="text-[#2fa31c]" />
                          <span>% (Percentual)</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label>Valor {formData.comissao_adesao_tipo === 'percentual' ? '(%)' : '(R$)'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.comissao_adesao_valor}
                        onChange={(e) => setFormData({...formData, comissao_adesao_valor: e.target.value})}
                        placeholder={formData.comissao_adesao_tipo === 'percentual' ? '0.00' : '0,00'}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Pagamento da Adesão</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pagamento_adesao"
                          value="avista"
                          checked={formData.pagamento_adesao === 'avista'}
                          onChange={(e) => setFormData({...formData, pagamento_adesao: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span>À Vista</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pagamento_adesao"
                          value="parcelado"
                          checked={formData.pagamento_adesao === 'parcelado'}
                          onChange={(e) => setFormData({...formData, pagamento_adesao: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span>Parcelado</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Comissão Mensalidade */}
                <div className="p-4 bg-[#e3dcda] rounded-lg">
                  <h4 className="font-bold mb-3 text-[#1a59ad]">Comissão de Mensalidade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Comissão</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="comissao_mensalidade_tipo"
                            value="valor"
                            checked={formData.comissao_mensalidade_tipo === 'valor'}
                            onChange={(e) => setFormData({...formData, comissao_mensalidade_tipo: e.target.value})}
                            className="w-4 h-4"
                          />
                          <DollarSign size={16} className="text-[#2fa31c]" />
                          <span>R$ (Valor)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="comissao_mensalidade_tipo"
                            value="percentual"
                            checked={formData.comissao_mensalidade_tipo === 'percentual'}
                            onChange={(e) => setFormData({...formData, comissao_mensalidade_tipo: e.target.value})}
                            className="w-4 h-4"
                          />
                          <Percent size={16} className="text-[#2fa31c]" />
                          <span>% (Percentual)</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label>Valor {formData.comissao_mensalidade_tipo === 'percentual' ? '(%)' : '(R$)'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.comissao_mensalidade_valor}
                        onChange={(e) => setFormData({...formData, comissao_mensalidade_valor: e.target.value})}
                        placeholder={formData.comissao_mensalidade_tipo === 'percentual' ? '0.00' : '0,00'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
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
              disabled={loading || !natureza}
              className="px-6 py-3 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center gap-2 border-2 border-[#2fa31c] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Cadastrando...
                </>
              ) : (
                <>
                  <Warehouse size={20} />
                  Cadastrar Fornecedor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FornecedorFormModal;
