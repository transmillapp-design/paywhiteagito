import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, DollarSign, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';

const TabelaValoresForm = ({ tipoCobertura, titulo, icon: Icon, readOnly = false }) => {
  const { API, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabelas, setTabelas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipoVeiculo, setFiltroTipoVeiculo] = useState(''); // Filtro por tipo de veículo
  const [filtroLimiteCobertura, setFiltroLimiteCobertura] = useState(''); // Filtro por limite de cobertura (Danos Materiais)
  const [showDescricaoModal, setShowDescricaoModal] = useState(false); // Modal para editar descrição da cobertura
  const [descricaoCobertura, setDescricaoCobertura] = useState({
    titulo: '',
    servicos: [''],
    observacoes: ''
  });
  
  // Serviços que têm tipo de veículo
  const servicosComTipoVeiculo = [
    'Assistencia 24hs',
    'Roubo/Furto',
    'Perda Total',
    'Vidros, Farois e Lanternas',
    'Carro Reserva',
    'Colisão',
    'Danos materiais e Terceiros'
  ];
  
  const temTipoVeiculo = servicosComTipoVeiculo.includes(tipoCobertura);
  
  const [formData, setFormData] = useState({
    valor_servico: '',
    valor_fipe_min: '',
    valor_fipe_max: '',
    descricao: '',
    tipo_veiculo_assistencia: '', // Novo campo para Assistência 24hs
    limite_cobertura_dmt: '' // Novo campo para Danos Materiais e Terceiros
  });

  useEffect(() => {
    carregarTabelas();
    carregarDescricaoCobertura();
  }, [tipoCobertura]);

  const carregarDescricaoCobertura = async () => {
    try {
      // Buscar a primeira tabela para pegar a descrição global
      const token = localStorage.getItem('token');
      const tipoEncoded = tipoCobertura.replace(/\//g, '_');
      
      const response = await axios.get(
        `${API}/labelview/tabelas/${tipoEncoded}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.tabelas && response.data.tabelas.length > 0) {
        const primeiraTabela = response.data.tabelas[0];
        if (primeiraTabela.servicos_inclusos) {
          setDescricaoCobertura({
            titulo: primeiraTabela.servicos_inclusos.titulo || '',
            servicos: primeiraTabela.servicos_inclusos.servicos && primeiraTabela.servicos_inclusos.servicos.length > 0 
              ? primeiraTabela.servicos_inclusos.servicos 
              : [''],
            observacoes: primeiraTabela.servicos_inclusos.observacoes || ''
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar descrição da cobertura:', error);
    }
  };

  const carregarTabelas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Encode o tipo para URL
      const tipoEncoded = tipoCobertura.replace(/\//g, '_');
      
      console.log('🔍 TabelaValoresForm - Carregando:', {
        tipoCobertura,
        tipoEncoded,
        url: `${API}/labelview/tabelas/${tipoEncoded}`
      });
      
      const response = await axios.get(
        `${API}/labelview/tabelas/${tipoEncoded}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ TabelaValoresForm - Resposta:', {
        success: response.data.success,
        total: response.data.total,
        quantidadeTabelas: response.data.tabelas?.length
      });

      if (response.data.success) {
        setTabelas(response.data.tabelas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
      toast.error('Erro ao carregar tabelas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.valor_servico || !formData.valor_fipe_min || !formData.valor_fipe_max) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valorServico = parseFloat(formData.valor_servico);
    const valorFipeMin = parseFloat(formData.valor_fipe_min);
    const valorFipeMax = parseFloat(formData.valor_fipe_max);

    if (valorFipeMin >= valorFipeMax) {
      toast.error('Valor FIPE máximo deve ser maior que o mínimo');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (editando) {
        // Atualizar
        await axios.put(
          `${API}/labelview/tabelas/${editando}`,
          {
            valor_servico: valorServico,
            valor_fipe_min: valorFipeMin,
            valor_fipe_max: valorFipeMax,
            descricao: formData.descricao,
            tipo_veiculo_assistencia: formData.tipo_veiculo_assistencia || null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tabela atualizada com sucesso!');
      } else {
        // Criar
        await axios.post(
          `${API}/labelview/tabelas/criar`,
          {
            tipo_cobertura: tipoCobertura,
            valor_servico: valorServico,
            valor_fipe_min: valorFipeMin,
            valor_fipe_max: valorFipeMax,
            descricao: formData.descricao,
            tipo_veiculo_assistencia: formData.tipo_veiculo_assistencia || null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Tabela criada com sucesso!');
      }

      // Resetar form e recarregar
      setFormData({
        valor_servico: '',
        valor_fipe_min: '',
        valor_fipe_max: '',
        descricao: '',
        tipo_veiculo_assistencia: ''
      });
      setShowForm(false);
      setEditando(null);
      carregarTabelas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar tabela');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (tabela) => {
    setFormData({
      valor_servico: tabela.valor_servico.toString(),
      valor_fipe_min: tabela.valor_fipe_min.toString(),
      valor_fipe_max: tabela.valor_fipe_max.toString(),
      descricao: tabela.descricao || '',
      tipo_veiculo_assistencia: tabela.tipo_veiculo_assistencia || '',
      limite_cobertura_dmt: tabela.limite_cobertura_dmt || ''
    });
    setEditando(tabela.id);
    setShowForm(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta tabela?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.delete(
        `${API}/labelview/tabelas/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Tabela excluída com sucesso!');
      carregarTabelas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir tabela');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setFormData({
      valor_servico: '',
      valor_fipe_min: '',
      valor_fipe_max: '',
      descricao: '',
      tipo_veiculo_assistencia: '',
      limite_cobertura_dmt: ''
    });
    setShowForm(false);
    setEditando(null);
  };

  const handleSalvarDescricaoCobertura = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Validar se há pelo menos um serviço preenchido
      const servicosValidos = descricaoCobertura.servicos.filter(s => s.trim() !== '');
      if (servicosValidos.length === 0) {
        toast.error('Adicione pelo menos um serviço incluso');
        return;
      }

      const response = await axios.put(
        `${API}/labelview/tabelas/descricao-cobertura`,
        {
          tipo_cobertura: tipoCobertura,
          servicos_inclusos: {
            titulo: descricaoCobertura.titulo,
            servicos: servicosValidos,
            observacoes: descricaoCobertura.observacoes
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Descrição atualizada em ${response.data.registros_atualizados} tabelas!`);
        setShowDescricaoModal(false);
        carregarTabelas();
      }
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      toast.error('Erro ao salvar descrição da cobertura');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white border-[#2fa31c]">
        <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && <Icon size={28} />}
              <div>
                <CardTitle className="text-2xl">{titulo}</CardTitle>
                <p className="text-sm text-white/80 mt-1">
                  Gerencie os valores da Labelview para esta cobertura
                </p>
              </div>
            </div>
            {!showForm && !readOnly && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDescricaoModal(true)}
                  className="bg-white/20 text-white hover:bg-white/30 border border-white/30"
                >
                  <FileText size={18} className="mr-2" />
                  Editar Descrição da Cobertura
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-[#1a59ad] hover:bg-white/90"
                >
                  <Plus size={18} className="mr-2" />
                  Novo Valor
                </Button>
              </div>
            )}
            {readOnly && (
              <div className="text-white/80 text-sm bg-white/20 px-4 py-2 rounded-lg">
                🔒 Modo Visualização
              </div>
            )}
          </div>
        </CardHeader>

        {showForm && !readOnly && (
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tipo de Veículo - Para serviços com tipos de veículos */}
              {temTipoVeiculo && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Veículo {!editando && '*'}
                  </label>
                  <select
                    value={formData.tipo_veiculo_assistencia}
                    onChange={(e) => setFormData({ ...formData, tipo_veiculo_assistencia: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                    required={!editando}
                  >
                    <option value="">Selecione o tipo de veículo</option>
                    <option value="Carros Leves">Carros Leves</option>
                    <option value="Aplicativos">Aplicativos</option>
                    <option value="Moto">Moto</option>
                    <option value="SUV, Pickup, Van">SUV, Pickup, Van</option>
                    <option value="Caminhão">Caminhão</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editando 
                      ? 'Opcional: Você pode adicionar ou atualizar o tipo de veículo'
                      : 'Selecione o tipo de veículo para esta faixa de valores'
                    }
                  </p>
                </div>
              )}
              
              {/* Limite de Cobertura - Para Danos Materiais e Terceiros */}
              {tipoCobertura === 'Danos materiais e Terceiros' && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite de Cobertura {!editando && '*'}
                  </label>
                  <select
                    value={formData.limite_cobertura_dmt}
                    onChange={(e) => setFormData({ ...formData, limite_cobertura_dmt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                    required={!editando}
                  >
                    <option value="">Selecione o limite de cobertura</option>
                    <option value="30000">R$ 30.000,00 - R$ 17,90</option>
                    <option value="60000">R$ 60.000,00 - R$ 25,00</option>
                    <option value="100000">R$ 100.000,00 - R$ 30,00</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editando 
                      ? 'Opcional: Você pode alterar o limite de cobertura'
                      : 'Escolha o limite de cobertura de danos materiais'
                    }
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Valor do Serviço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Serviço Labelview *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_servico}
                      onChange={(e) => setFormData({ ...formData, valor_servico: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor que a Labelview cobra
                  </p>
                </div>

                {/* Valor FIPE Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor FIPE Mínimo *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_fipe_min}
                      onChange={(e) => setFormData({ ...formData, valor_fipe_min: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor mínimo da faixa FIPE
                  </p>
                </div>

                {/* Valor FIPE Máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor FIPE Máximo *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_fipe_max}
                      onChange={(e) => setFormData({ ...formData, valor_fipe_max: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor máximo da faixa FIPE
                  </p>
                </div>
              </div>

              {/* Descrição Simples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                  placeholder="Detalhes sobre esta faixa de valores..."
                  rows="3"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelar}
                  disabled={loading}
                >
                  <X size={18} className="mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#2fa31c] hover:bg-[#258517] text-white"
                >
                  <Save size={18} className="mr-2" />
                  {editando ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Lista de Tabelas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={20} />
              Tabelas Cadastradas ({tabelas.filter(t => !filtroTipoVeiculo || t.tipo_veiculo_assistencia === filtroTipoVeiculo).length})
            </CardTitle>
            
            {/* Filtro por Tipo de Veículo - apenas para tabelas que possuem esse campo */}
            {temTipoVeiculo && tabelas.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Filtrar por tipo:</label>
                <select
                  value={filtroTipoVeiculo}
                  onChange={(e) => setFiltroTipoVeiculo(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  <option value="Carros Leves">Carros Leves</option>
                  <option value="Aplicativos">Aplicativos</option>
                  <option value="Moto">Moto</option>
                  <option value="SUV, Pickup, Van">SUV, Pickup, Van</option>
                  <option value="Caminhão">Caminhão</option>
                </select>
              </div>
            )}
            
            {/* Filtro por Limite de Cobertura - apenas para Danos Materiais e Terceiros */}
            {tipoCobertura === 'Danos materiais e Terceiros' && tabelas.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Filtrar por limite:</label>
                <select
                  value={filtroLimiteCobertura}
                  onChange={(e) => setFiltroLimiteCobertura(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                >
                  <option value="">Todos os limites</option>
                  <option value="30000">R$ 30.000 - R$ 17,90</option>
                  <option value="60000">R$ 60.000 - R$ 25,00</option>
                  <option value="100000">R$ 100.000 - R$ 30,00</option>
                </select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : tabelas.filter(t => 
              (!filtroTipoVeiculo || t.tipo_veiculo_assistencia === filtroTipoVeiculo) &&
              (!filtroLimiteCobertura || t.limite_cobertura_dmt == filtroLimiteCobertura)
            ).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              {filtroTipoVeiculo ? (
                <>
                  <p className="text-lg font-medium">Nenhuma tabela encontrada para "{filtroTipoVeiculo}"</p>
                  <p className="text-sm mt-2">
                    Altere o filtro ou cadastre uma nova faixa para este tipo de veículo
                  </p>
                  <Button
                    onClick={() => setFiltroTipoVeiculo('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Limpar Filtro
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">Nenhuma tabela cadastrada</p>
                  <p className="text-sm mt-2">
                    Clique em "Novo Valor" para cadastrar a primeira faixa
                  </p>
                  
                  {/* Botão de importação automática para Roubo/Furto */}
                  {tipoCobertura === 'Roubo/Furto' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                      <p className="text-sm text-blue-800 font-medium mb-3">
                        💡 Importar valores padrão automaticamente
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-roubo-furto`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.total_inseridos} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Dados já foram importados anteriormente');
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar 60 Registros Automáticos'}
                      </Button>
                      <p className="text-xs text-gray-600 mt-2">
                        Importa 12 faixas para cada tipo de veículo (60 registros total)
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Perda Total */}
                  {tipoCobertura === 'Perda Total' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200 max-w-md mx-auto">
                      <p className="text-sm text-purple-800 font-medium mb-3">
                        💡 Importar valores padrão automaticamente
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-perda-total`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.total_inseridos} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Dados já foram importados anteriormente');
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar 60 Registros Automáticos'}
                      </Button>
                      <p className="text-xs text-gray-600 mt-2">
                        Importa 12 faixas para cada tipo de veículo (60 registros total)
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Assistência 24hs */}
                  {tipoCobertura === 'Assistencia 24hs' && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 max-w-md mx-auto">
                      <p className="text-sm text-green-800 font-medium mb-3">
                        💡 Importar valores fixos por tipo de veículo
                      </p>
                      <div className="mb-3 text-xs text-gray-700 bg-white p-3 rounded border">
                        <p className="font-medium mb-2">Valores que serão importados:</p>
                        <ul className="space-y-1">
                          <li>• Carros Leves: R$ 9,90</li>
                          <li>• Aplicativos: R$ 9,90</li>
                          <li>• Moto: R$ 9,90</li>
                          <li>• SUV, Pickup, Van: R$ 15,90</li>
                          <li>• Caminhão: R$ 49,90</li>
                        </ul>
                        <p className="mt-2 text-gray-600">
                          12 faixas de R$ 10.000 para cada tipo = 60 registros
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-assistencia-24h`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.registros_criados} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Erro ao importar: ' + (error.response?.data?.detail || 'Dados podem já ter sido importados'));
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white w-full"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar Assistência 24h (60 Registros)'}
                      </Button>
                      <p className="text-xs text-green-700 mt-2 font-medium">
                        ⚠️ Esta ação irá substituir todos os registros existentes de Assistência 24h
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Vidros, Faróis e Lanternas */}
                  {tipoCobertura === 'Vidros, Farois e Lanternas' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                      <p className="text-sm text-blue-800 font-medium mb-3">
                        💡 Importar valores fixos para todos os tipos
                      </p>
                      <div className="mb-3 text-xs text-gray-700 bg-white p-3 rounded border">
                        <p className="font-medium mb-2">Valor único que será importado:</p>
                        <div className="text-center py-2 bg-blue-50 rounded">
                          <p className="text-2xl font-bold text-blue-600">R$ 5,00</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Para TODOS os tipos de veículos
                          </p>
                        </div>
                        <p className="mt-2 text-gray-600">
                          12 faixas de R$ 10.000 × 5 tipos = 60 registros
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-vidros-farois-lanternas`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.registros_criados} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Erro ao importar: ' + (error.response?.data?.detail || 'Dados podem já ter sido importados'));
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar Vidros, Faróis e Lanternas (60 Registros)'}
                      </Button>
                      <p className="text-xs text-blue-700 mt-2 font-medium">
                        ⚠️ Esta ação irá substituir todos os registros existentes
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Carro Reserva */}
                  {tipoCobertura === 'Carro Reserva' && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200 max-w-md mx-auto">
                      <p className="text-sm text-orange-800 font-medium mb-3">
                        💡 Importar valores fixos para tipos disponíveis
                      </p>
                      <div className="mb-3 text-xs text-gray-700 bg-white p-3 rounded border">
                        <p className="font-medium mb-2">Valor único que será importado:</p>
                        <div className="text-center py-2 bg-orange-50 rounded">
                          <p className="text-2xl font-bold text-orange-600">R$ 3,50</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Para Carros Leves, Aplicativos e SUV/Pickup/Van
                          </p>
                        </div>
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-xs font-semibold text-gray-700 mb-1">✅ Atende:</p>
                          <p className="text-xs text-gray-600">• Carros Leves</p>
                          <p className="text-xs text-gray-600">• Aplicativos</p>
                          <p className="text-xs text-gray-600">• SUV, Pickup, Van</p>
                          <p className="text-xs font-semibold text-red-600 mt-2 mb-1">❌ Não atende:</p>
                          <p className="text-xs text-red-600">• Moto</p>
                          <p className="text-xs text-red-600">• Caminhão</p>
                        </div>
                        <p className="mt-2 text-gray-600">
                          12 faixas de R$ 10.000 × 3 tipos = 36 registros
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-carro-reserva`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.registros_criados} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Erro ao importar: ' + (error.response?.data?.detail || 'Dados podem já ter sido importados'));
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar Carro Reserva (36 Registros)'}
                      </Button>
                      <p className="text-xs text-orange-700 mt-2 font-medium">
                        ⚠️ Esta ação irá substituir todos os registros existentes
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Colisão */}
                  {tipoCobertura === 'Colisão' && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 max-w-md mx-auto">
                      <p className="text-sm text-red-800 font-medium mb-3">
                        💡 Importar valores fixos para todos os tipos
                      </p>
                      <div className="mb-3 text-xs text-gray-700 bg-white p-3 rounded border">
                        <p className="font-medium mb-2">Valor único que será importado:</p>
                        <div className="text-center py-2 bg-red-50 rounded">
                          <p className="text-2xl font-bold text-red-600">R$ 3,50</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Para TODOS os tipos de veículos
                          </p>
                        </div>
                        <p className="mt-2 text-gray-600">
                          12 faixas de R$ 10.000 × 5 tipos = 60 registros
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-colisao`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.registros_criados} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Erro ao importar: ' + (error.response?.data?.detail || 'Dados podem já ter sido importados'));
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white w-full"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar Colisão (60 Registros)'}
                      </Button>
                      <p className="text-xs text-red-700 mt-2 font-medium">
                        ⚠️ Esta ação irá substituir todos os registros existentes
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de importação automática para Danos Materiais e Terceiros */}
                  {tipoCobertura === 'Danos materiais e Terceiros' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200 max-w-md mx-auto">
                      <p className="text-sm text-purple-800 font-medium mb-3">
                        💡 Importar valores com 3 limites de cobertura
                      </p>
                      <div className="mb-3 text-xs text-gray-700 bg-white p-3 rounded border">
                        <p className="font-medium mb-2">Valores que serão importados:</p>
                        <div className="space-y-2">
                          <div className="p-2 bg-purple-50 rounded flex justify-between items-center">
                            <span className="font-semibold">Limite R$ 30.000</span>
                            <span className="text-purple-700 font-bold">R$ 17,90</span>
                          </div>
                          <div className="p-2 bg-purple-50 rounded flex justify-between items-center">
                            <span className="font-semibold">Limite R$ 60.000</span>
                            <span className="text-purple-700 font-bold">R$ 25,00</span>
                          </div>
                          <div className="p-2 bg-purple-50 rounded flex justify-between items-center">
                            <span className="font-semibold">Limite R$ 100.000</span>
                            <span className="text-purple-700 font-bold">R$ 30,00</span>
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600">
                          3 limites × 5 tipos × 12 faixas = 180 registros
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            const response = await axios.post(
                              `${API}/labelview/tabelas/importar-danos-materiais-terceiros`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.message}\n${response.data.registros_criados} registros importados!`);
                              await carregarTabelas();
                            }
                          } catch (error) {
                            if (error.response?.status === 400) {
                              toast.error('Erro ao importar: ' + (error.response?.data?.detail || 'Dados podem já ter sido importados'));
                            } else {
                              toast.error('Erro ao importar dados: ' + (error.response?.data?.detail || error.message));
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                        disabled={loading}
                      >
                        {loading ? 'Importando...' : '📥 Importar Danos Materiais (180 Registros)'}
                      </Button>
                      <p className="text-xs text-purple-700 mt-2 font-medium">
                        ⚠️ Esta ação irá substituir todos os registros existentes
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Faixa FIPE
                    </th>
                    {temTipoVeiculo && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Tipo de Veículo
                      </th>
                    )}
                    {tipoCobertura === 'Danos materiais e Terceiros' && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Limite de Cobertura
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Valor Serviço Labelview
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Descrição
                    </th>
                    {!readOnly && (
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tabelas
                    .filter(t => 
                      (!filtroTipoVeiculo || t.tipo_veiculo_assistencia === filtroTipoVeiculo) &&
                      (!filtroLimiteCobertura || t.limite_cobertura_dmt == filtroLimiteCobertura)
                    )
                    .map((tabela) => (
                    <tr key={tabela.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {formatarMoeda(tabela.valor_fipe_min)} - {formatarMoeda(tabela.valor_fipe_max)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Faixa de valores FIPE
                          </span>
                        </div>
                      </td>
                      {temTipoVeiculo && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {tabela.tipo_veiculo_assistencia || 'Não especificado'}
                            </span>
                          </div>
                        </td>
                      )}
                      {tipoCobertura === 'Danos materiais e Terceiros' && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {tabela.limite_cobertura_dmt ? `R$ ${(tabela.limite_cobertura_dmt).toLocaleString('pt-BR')}` : 'Não especificado'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-[#2fa31c]">
                          {formatarMoeda(tabela.valor_servico)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tabela.servicos_inclusos ? (
                          <div className="text-sm">
                            <p className="font-semibold text-gray-800">{tabela.servicos_inclusos.titulo}</p>
                            <p className="text-gray-600 text-xs mt-1">
                              {tabela.servicos_inclusos.servicos?.length || 0} serviços inclusos
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {tabela.descricao || 'Sem descrição'}
                          </p>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditar(tabela)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExcluir(tabela.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Editar Descrição Global da Cobertura */}
      {showDescricaoModal && !readOnly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white sticky top-0 z-10">
              <CardTitle className="text-2xl flex items-center gap-3">
                <FileText size={28} />
                Editar Descrição da Cobertura: {titulo}
              </CardTitle>
              <p className="text-sm text-white/80 mt-2">
                ℹ️ Estas informações serão aplicadas a <strong>TODAS</strong> as tabelas desta cobertura e exibidas na cotação para o cliente
              </p>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {/* Título da Cobertura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Cobertura *
                </label>
                <input
                  type="text"
                  value={descricaoCobertura.titulo}
                  onChange={(e) => setDescricaoCobertura({
                    ...descricaoCobertura,
                    titulo: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent text-lg"
                  placeholder="Ex: Assistência 24 Horas Completa"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nome exibido para o cliente na cotação
                </p>
              </div>

              {/* Lista de Serviços Inclusos */}
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Serviços Inclusos na Cobertura *
                </label>
                <div className="space-y-3">
                  {descricaoCobertura.servicos.map((servico, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-none w-8 h-10 bg-[#2fa31c] text-white rounded-lg flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={servico}
                        onChange={(e) => {
                          const novosServicos = [...descricaoCobertura.servicos];
                          novosServicos[index] = e.target.value;
                          setDescricaoCobertura({
                            ...descricaoCobertura,
                            servicos: novosServicos
                          });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                        placeholder={index === 0 ? "Ex: 02 Reboques de até 400 KM" : `Serviço ${index + 1}`}
                      />
                      {descricaoCobertura.servicos.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const novosServicos = descricaoCobertura.servicos.filter((_, i) => i !== index);
                            setDescricaoCobertura({
                              ...descricaoCobertura,
                              servicos: novosServicos
                            });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDescricaoCobertura({
                        ...descricaoCobertura,
                        servicos: [...descricaoCobertura.servicos, '']
                      });
                    }}
                    className="w-full text-[#2fa31c] hover:bg-[#2fa31c] hover:text-white border-2 border-[#2fa31c]"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar Serviço
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Dica: Seja específico nos serviços. Ex: "02 Reboques de até 400 KM" ao invés de apenas "Reboque"
                </p>
              </div>

              {/* Observações / Condições */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações / Condições
                </label>
                <textarea
                  value={descricaoCobertura.observacoes}
                  onChange={(e) => setDescricaoCobertura({
                    ...descricaoCobertura,
                    observacoes: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                  placeholder="Ex: Disponível 24h/7 dias por semana em todo território nacional"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informações adicionais como carência, condições especiais, etc.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDescricaoModal(false);
                    carregarDescricaoCobertura(); // Recarregar para descartar mudanças
                  }}
                  disabled={loading}
                  className="px-6"
                >
                  <X size={18} className="mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSalvarDescricaoCobertura}
                  disabled={loading}
                  className="bg-[#2fa31c] hover:bg-[#258517] text-white px-6"
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Descrição'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TabelaValoresForm;
