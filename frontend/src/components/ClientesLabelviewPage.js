import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Users, Building, MapPin, UserCheck, ChevronRight, ArrowLeft,
  Search, Filter, Mail, Phone, Calendar, TrendingUp, Trash2, Clock,
  FileText, DollarSign, CalendarClock, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

const ClientesLabelviewPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('inicial'); // inicial, unidades, regionais, consultores, clientes
  const [breadcrumb, setBreadcrumb] = useState([]);
  
  // Dados hierárquicos
  const [unidades, setUnidades] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Seleções
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(null);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [consultorSelecionado, setConsultorSelecionado] = useState(null);
  
  // Busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para deletar
  const [deletingId, setDeletingId] = useState(null);
  
  // Filtros para Unidade (na tela de clientes)
  const [filtroRegional, setFiltroRegional] = useState('');
  const [filtroConsultor, setFiltroConsultor] = useState('');
  const [listaRegionaisParaFiltro, setListaRegionaisParaFiltro] = useState([]);
  const [listaConsultoresParaFiltro, setListaConsultoresParaFiltro] = useState([]);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = () => {
    // Determinar view inicial baseado no tipo de usuário
    if (user.user_type === 'labelview_master') {
      setView('unidades');
      setBreadcrumb([{ label: 'Unidades', action: () => voltarPara('unidades') }]);
      carregarUnidades();
    } else if (user.user_type === 'labelview_unidade') {
      // Unidade vai direto para clientes com filtros
      setView('clientes');
      setBreadcrumb([{ label: 'Meus Clientes', action: null }]);
      carregarClientes();
      carregarDadosFiltros(); // Carregar regionais e consultores para filtros
    } else if (user.user_type === 'labelview_regional') {
      setView('consultores');
      setBreadcrumb([{ label: 'Consultores', action: () => voltarPara('consultores') }]);
      carregarConsultores();
    } else if (user.user_type === 'labelview_consultor') {
      setView('clientes');
      setBreadcrumb([{ label: 'Meus Clientes', action: null }]);
      carregarClientes();
    }
  };

  const carregarUnidades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/unidades/com-contadores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setUnidades(response.data.unidades);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  const carregarRegionais = async (unidadeId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = unidadeId 
        ? `${API}/labelview/regionais/com-contadores?unidade_id=${unidadeId}`
        : `${API}/labelview/regionais/com-contadores`;
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        setRegionais(response.data.regionais);
      }
    } catch (error) {
      console.error('Erro ao carregar regionais:', error);
      toast.error('Erro ao carregar regionais');
    } finally {
      setLoading(false);
    }
  };

  const carregarConsultores = async (unidadeId = null, regionalId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API}/labelview/consultores/com-contadores`;
      const params = [];
      if (unidadeId) params.push(`unidade_id=${unidadeId}`);
      if (regionalId) params.push(`regional_id=${regionalId}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        setConsultores(response.data.consultores);
      }
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast.error('Erro ao carregar consultores');
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async (unidadeId = null, regionalId = null, consultorId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API}/labelview/clientes/hierarquia`;
      const params = [];
      if (unidadeId) params.push(`unidade_id=${unidadeId}`);
      if (regionalId) params.push(`regional_id=${regionalId}`);
      if (consultorId) params.push(`consultor_id=${consultorId}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        setClientes(response.data.clientes);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Carregar dados para filtros (usado pela Unidade)
  const carregarDadosFiltros = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar regionais da unidade
      const resRegionais = await axios.get(
        `${API}/labelview/regionais/com-contadores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resRegionais.data.success) {
        setListaRegionaisParaFiltro(resRegionais.data.regionais || []);
      }
      
      // Carregar todos os consultores da unidade
      const resConsultores = await axios.get(
        `${API}/labelview/consultores/com-contadores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resConsultores.data.success) {
        setListaConsultoresParaFiltro(resConsultores.data.consultores || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados para filtros:', error);
    }
  };

  // Aplicar filtros de Regional/Consultor (para Unidade)
  const aplicarFiltrosUnidade = () => {
    carregarClientes(null, filtroRegional || null, filtroConsultor || null);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroRegional('');
    setFiltroConsultor('');
    carregarClientes();
  };

  const selecionarUnidade = (unidade) => {
    setUnidadeSelecionada(unidade);
    setView('regionais');
    setBreadcrumb([
      { label: 'Unidades', action: () => voltarPara('unidades') },
      { label: unidade.full_name, action: () => voltarPara('regionais') }
    ]);
    carregarRegionais(unidade.id);
  };

  const selecionarRegional = (regional) => {
    setRegionalSelecionada(regional);
    
    // Oferecer opção de ver clientes da regional ou consultores
    setView('opcao-regional');
  };

  const verClientesRegional = () => {
    setView('clientes');
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.push({ 
      label: `${regionalSelecionada.full_name} - Clientes`, 
      action: () => voltarPara('clientes') 
    });
    setBreadcrumb(newBreadcrumb);
    carregarClientes(unidadeSelecionada?.id, regionalSelecionada.id);
  };

  const verConsultoresRegional = () => {
    setView('consultores');
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.push({ 
      label: `${regionalSelecionada.full_name} - Consultores`, 
      action: () => voltarPara('consultores') 
    });
    setBreadcrumb(newBreadcrumb);
    carregarConsultores(unidadeSelecionada?.id, regionalSelecionada.id);
  };

  const selecionarConsultor = (consultor) => {
    setConsultorSelecionado(consultor);
    setView('clientes');
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.push({ 
      label: `${consultor.full_name} - Clientes`, 
      action: null 
    });
    setBreadcrumb(newBreadcrumb);
    carregarClientes(unidadeSelecionada?.id, regionalSelecionada?.id, consultor.id);
  };

  const voltarPara = (viewName) => {
    setView(viewName);
    
    if (viewName === 'unidades') {
      setBreadcrumb([{ label: 'Unidades', action: null }]);
      setUnidadeSelecionada(null);
      setRegionalSelecionada(null);
      setConsultorSelecionado(null);
      carregarUnidades();
    } else if (viewName === 'regionais') {
      setBreadcrumb([
        { label: 'Unidades', action: () => voltarPara('unidades') },
        { label: unidadeSelecionada?.full_name, action: null }
      ]);
      setRegionalSelecionada(null);
      setConsultorSelecionado(null);
      carregarRegionais(unidadeSelecionada?.id);
    } else if (viewName === 'consultores') {
      const newBreadcrumb = [...breadcrumb.slice(0, -1)];
      setBreadcrumb(newBreadcrumb);
      setConsultorSelecionado(null);
      carregarConsultores(unidadeSelecionada?.id, regionalSelecionada?.id);
    } else if (viewName === 'clientes') {
      const newBreadcrumb = [...breadcrumb.slice(0, -1)];
      setBreadcrumb(newBreadcrumb);
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  const filtrarDados = (dados, campo = 'full_name') => {
    if (!searchTerm) return dados;
    return dados.filter(item => 
      item[campo]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 🔧 Função para deletar cliente
  const handleDeleteCliente = async (clienteId, clienteNome) => {
    // Confirmação
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${clienteNome}"?\n\nEsta ação não pode ser desfeita e o cliente será removido de toda a hierarquia.`)) {
      return;
    }
    
    try {
      setDeletingId(clienteId);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API}/labelview/clientes/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cliente excluído com sucesso!');
      
      // Remover da lista local
      setClientes(clientes.filter(c => c.id !== clienteId));
      
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao excluir cliente';
      if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para excluir este cliente.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // Verificar se usuário pode deletar o cliente
  const podeExcluirCliente = (cliente) => {
    // Master pode excluir qualquer cliente
    if (user.user_type === 'labelview_master' || user.is_labelview_master) {
      return true;
    }
    // Consultor pode excluir seus próprios clientes
    if (user.user_type === 'labelview_consultor' && cliente.consultor_id === user.id) {
      return true;
    }
    // Regional pode excluir clientes de sua regional
    if (user.user_type === 'labelview_regional' && cliente.regional_id === user.id) {
      return true;
    }
    // Unidade pode excluir clientes de sua unidade
    if (user.user_type === 'labelview_unidade' && cliente.unidade_id === user.id) {
      return true;
    }
    return false;
  };

  // Renderizações por view
  const renderUnidades = () => {
    const unidadesFiltradas = filtrarDados(unidades);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
            />
          </div>
          <Badge className="bg-transmill-olive text-white px-4 py-2">
            {unidadesFiltradas.length} Unidades
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unidadesFiltradas.map((unidade) => (
            <Card 
              key={unidade.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selecionarUnidade(unidade)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{unidade.full_name}</h3>
                    <p className="text-sm text-gray-600">{unidade.email}</p>
                  </div>
                  <Building className="text-transmill-olive" size={32} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{unidade.total_regionais}</p>
                    <p className="text-xs text-gray-600">Regionais</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{unidade.total_consultores}</p>
                    <p className="text-xs text-gray-600">Consultores</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{unidade.total_clientes}</p>
                    <p className="text-xs text-gray-600">Clientes</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 border-transmill-olive text-transmill-olive">
                  Ver Detalhes <ChevronRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderRegionais = () => {
    const regionaisFiltradas = filtrarDados(regionais);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar regional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
            />
          </div>
          <Badge className="bg-transmill-olive text-white px-4 py-2">
            {regionaisFiltradas.length} Regionais
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionaisFiltradas.map((regional) => (
            <Card 
              key={regional.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selecionarRegional(regional)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{regional.full_name}</h3>
                    <p className="text-sm text-gray-600">{regional.email}</p>
                  </div>
                  <MapPin className="text-blue-600" size={32} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{regional.total_consultores}</p>
                    <p className="text-xs text-gray-600">Consultores</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{regional.total_clientes}</p>
                    <p className="text-xs text-gray-600">Clientes</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 border-transmill-olive text-transmill-olive">
                  Ver Detalhes <ChevronRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderOpcaoRegional = () => {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <CardTitle className="text-center">
              {regionalSelecionada?.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-center text-gray-600 mb-8">
              Como você deseja visualizar os dados?
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-transmill-olive"
                onClick={verClientesRegional}
              >
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto mb-4 text-purple-600" size={64} />
                  <h3 className="font-bold text-lg mb-2">Ver Todos os Clientes</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualizar todos os clientes desta regional
                  </p>
                  <Badge className="bg-purple-500 text-white">
                    {regionalSelecionada?.total_clientes} clientes
                  </Badge>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-transmill-olive"
                onClick={verConsultoresRegional}
              >
                <CardContent className="p-6 text-center">
                  <UserCheck className="mx-auto mb-4 text-green-600" size={64} />
                  <h3 className="font-bold text-lg mb-2">Ver Por Consultor</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualizar clientes agrupados por consultor
                  </p>
                  <Badge className="bg-green-500 text-white">
                    {regionalSelecionada?.total_consultores} consultores
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConsultores = () => {
    const consultoresFiltrados = filtrarDados(consultores);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar consultor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
            />
          </div>
          <Badge className="bg-transmill-olive text-white px-4 py-2">
            {consultoresFiltrados.length} Consultores
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultoresFiltrados.map((consultor) => (
            <Card 
              key={consultor.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selecionarConsultor(consultor)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{consultor.full_name}</h3>
                    <p className="text-sm text-gray-600">{consultor.email}</p>
                    {consultor.regional_nome && (
                      <p className="text-xs text-gray-500 mt-1">
                        <MapPin size={12} className="inline mr-1" />
                        {consultor.regional_nome}
                      </p>
                    )}
                  </div>
                  <UserCheck className="text-green-600" size={32} />
                </div>

                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-600">{consultor.total_clientes}</p>
                  <p className="text-sm text-gray-600">Clientes Cadastrados</p>
                </div>

                <Button variant="outline" className="w-full mt-4 border-transmill-olive text-transmill-olive">
                  Ver Clientes <ChevronRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderClientes = () => {
    const clientesFiltrados = filtrarDados(clientes);
    const isUnidade = user.user_type === 'labelview_unidade';
    
    return (
      <div className="space-y-4">
        {/* Filtros para Unidade */}
        {isUnidade && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={18} className="text-blue-600" />
                <span className="font-semibold text-blue-800">Filtros</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro Regional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regional</label>
                  <select
                    value={filtroRegional}
                    onChange={(e) => setFiltroRegional(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos os Regionais</option>
                    {listaRegionaisParaFiltro.map((regional) => (
                      <option key={regional.id} value={regional.id}>
                        {regional.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro Consultor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultor</label>
                  <select
                    value={filtroConsultor}
                    onChange={(e) => setFiltroConsultor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos os Consultores</option>
                    {listaConsultoresParaFiltro.map((consultor) => (
                      <option key={consultor.id} value={consultor.id}>
                        {consultor.full_name} {consultor.regional_nome ? `(${consultor.regional_nome})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Botões */}
                <div className="flex items-end gap-2">
                  <Button
                    onClick={aplicarFiltrosUnidade}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Search size={16} className="mr-2" />
                    Filtrar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={limparFiltros}
                    className="border-gray-300"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
            />
          </div>
          <Badge className="bg-transmill-olive text-white px-4 py-2">
            {clientesFiltrados.length} Clientes
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {clientesFiltrados.map((cliente) => {
            // Determinar cor e ícone do status
            const getStatusInfo = (status) => {
              switch(status?.toLowerCase()) {
                case 'ativo':
                  return { color: 'bg-green-500', icon: CheckCircle, label: 'Ativo' };
                case 'devedor':
                  return { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Devedor' };
                case 'inativo':
                  return { color: 'bg-red-500', icon: XCircle, label: 'Inativo' };
                case 'pendente':
                  return { color: 'bg-blue-500', icon: Clock, label: 'Pendente' };
                default:
                  return { color: 'bg-gray-500', icon: Clock, label: status || 'N/A' };
              }
            };
            
            const statusInfo = getStatusInfo(cliente.status_geral || cliente.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {cliente.full_name?.charAt(0) || cliente.nome?.charAt(0) || 'C'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-lg">{cliente.full_name || cliente.nome}</h4>
                          <Badge className={`${statusInfo.color} text-white text-xs`}>
                            <StatusIcon size={12} className="inline mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        {/* Informações de contato */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {cliente.email}
                          </span>
                          {(cliente.phone || cliente.telefone) && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {cliente.phone || cliente.telefone}
                            </span>
                          )}
                        </div>
                        
                        {/* Dados do Contrato */}
                        {(cliente.plano_nome || cliente.plano_valor || cliente.contrato?.numero) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {/* Plano */}
                              {cliente.plano_nome && (
                                <div className="flex items-center gap-1">
                                  <FileText size={14} className="text-purple-500" />
                                  <span className="text-gray-600">{cliente.plano_nome}</span>
                                </div>
                              )}
                              
                              {/* Valor */}
                              {cliente.plano_valor !== undefined && cliente.plano_valor !== null && (
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} className="text-green-500" />
                                  <span className="font-semibold text-green-600">
                                    R$ {Number(cliente.plano_valor).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Vencimento */}
                              {cliente.data_vencimento && (
                                <div className="flex items-center gap-1">
                                  <CalendarClock size={14} className="text-blue-500" />
                                  <span className="text-gray-600">Venc. dia {cliente.data_vencimento}</span>
                                </div>
                              )}
                              
                              {/* Número do Contrato */}
                              {cliente.contrato?.numero && (
                                <div className="flex items-center gap-1">
                                  <FileText size={14} className="text-gray-500" />
                                  <span className="text-gray-500 text-xs">{cliente.contrato.numero}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Informações adicionais */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Desde {formatarData(cliente.created_at)}
                          </span>
                          {cliente.consultor_nome && (
                            <span className="flex items-center gap-1">
                              <UserCheck size={12} />
                              Consultor: {cliente.consultor_nome}
                            </span>
                          )}
                          {cliente.regional_nome && (
                            <span className="flex items-center gap-1">
                              <Building size={12} />
                              Regional: {cliente.regional_nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {/* Botão Excluir - apenas se usuário pode excluir */}
                      {podeExcluirCliente(cliente) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCliente(cliente.id, cliente.full_name || cliente.nome || 'Cliente');
                          }}
                          disabled={deletingId === cliente.id}
                        >
                          {deletingId === cliente.id ? (
                            <Clock className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {clientesFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum Cliente Encontrado
              </p>
              <p className="text-gray-600">
                {searchTerm ? 'Tente ajustar sua busca' : 'Ainda não há clientes cadastrados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a59ad] p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-white">Área de Clientes</h1>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
                  {item.action ? (
                    <button
                      onClick={item.action}
                      className="text-transmill-olive hover:underline font-medium"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-gray-600 font-medium">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin mx-auto mb-4 text-transmill-olive">
              <Filter size={48} />
            </div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        ) : (
          <>
            {view === 'unidades' && renderUnidades()}
            {view === 'regionais' && renderRegionais()}
            {view === 'opcao-regional' && renderOpcaoRegional()}
            {view === 'consultores' && renderConsultores()}
            {view === 'clientes' && renderClientes()}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientesLabelviewPage;
