import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  FileText, Clock, CheckCircle, AlertCircle, ArrowLeft,
  Car, Calendar, Phone, Wrench, User, Mail, Filter, Search
} from 'lucide-react';

const SolicitacoesLabelviewPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para filtros hierárquicos
  const [unidades, setUnidades] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroRegional, setFiltroRegional] = useState('');
  const [filtroConsultor, setFiltroConsultor] = useState('');

  useEffect(() => {
    if (user) {
      carregarFiltrosHierarquicos();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      carregarSolicitacoes();
    }
  }, [user, filtroStatus, filtroUnidade, filtroRegional, filtroConsultor]);

  const carregarFiltrosHierarquicos = async () => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    
    try {
      // Master carrega unidades
      if (user?.is_labelview_master || user?.user_type === 'labelview_master') {
        const unidadesRes = await axios.get(`${API}/labelview/filtros/unidades`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (unidadesRes.data?.success) {
          setUnidades(unidadesRes.data.unidades || []);
        }
      }
      
      // Unidade e Master carregam regionais
      if (user?.user_type === 'labelview_unidade' || user?.is_labelview_master || user?.user_type === 'labelview_master') {
        const regionaisRes = await axios.get(`${API}/labelview/filtros/regionais`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (regionaisRes.data?.success) {
          setRegionais(regionaisRes.data.regionais || []);
        }
      }
      
      // Regional, Unidade e Master carregam consultores
      if (user?.user_type !== 'labelview_consultor') {
        const consultoresRes = await axios.get(`${API}/labelview/filtros/consultores`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (consultoresRes.data?.success) {
          setConsultores(consultoresRes.data.consultores || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    }
  };

  const carregarSolicitacoes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir URL com filtros - usando endpoint correto
      let url = `${API}/labelview/solicitacoes-servico?`;
      const params = [];
      
      if (filtroStatus) params.push(`status=${filtroStatus}`);
      if (filtroUnidade) params.push(`unidade_id=${filtroUnidade}`);
      if (filtroRegional) params.push(`regional_id=${filtroRegional}`);
      if (filtroConsultor) params.push(`consultor_id=${filtroConsultor}`);
      
      url += params.join('&');

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSolicitacoes(response.data.solicitacoes || []);
      } else {
        setSolicitacoes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      setSolicitacoes([]);
      // Não mostrar erro se for 404 (endpoint pode não existir ainda)
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar solicitações');
      }
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (solicitacaoId, novoStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/labelview/solicitacoes-servico/${solicitacaoId}/status`,
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Status atualizado com sucesso');
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pendente': {
        label: 'Pendente',
        className: 'bg-yellow-500 text-white',
        icon: Clock
      },
      'em_atendimento': {
        label: 'Em Atendimento',
        className: 'bg-blue-500 text-white',
        icon: Wrench
      },
      'concluido': {
        label: 'Concluído',
        className: 'bg-green-500 text-white',
        icon: CheckCircle
      },
      'cancelado': {
        label: 'Cancelado',
        className: 'bg-red-500 text-white',
        icon: AlertCircle
      }
    };

    return configs[status] || configs['pendente'];
  };

  const filtrarSolicitacoes = () => {
    // Garantir que solicitacoes seja sempre um array
    const solicitacoesArray = Array.isArray(solicitacoes) ? solicitacoes : [];
    
    if (!searchTerm) return solicitacoesArray;

    return solicitacoesArray.filter(sol =>
      sol.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.numero_solicitacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const solicitacoesFiltradas = filtrarSolicitacoes();

  // Estatísticas - garantir que solicitacoes seja sempre um array
  const solicitacoesArray = Array.isArray(solicitacoes) ? solicitacoes : [];
  const stats = {
    total: solicitacoesArray.length,
    pendentes: solicitacoesArray.filter(s => s.status === 'pendente').length,
    emAtendimento: solicitacoesArray.filter(s => s.status === 'em_atendimento').length,
    concluidas: solicitacoesArray.filter(s => s.status === 'concluido').length
  };

  // Se user não estiver carregado ainda, mostrar loading
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a59ad] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-white">Solicitações de Atendimento</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pendentes}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.emAtendimento}</p>
              <p className="text-sm text-gray-600">Em Atendimento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.concluidas}</p>
              <p className="text-sm text-gray-600">Concluídas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {/* Filtros Hierárquicos */}
            {(user.is_labelview_master || user.user_type !== 'labelview_consultor') && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={18} className="text-[#1a59ad]" />
                  <span className="font-medium text-gray-700">Filtros de Hierarquia</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Filtro Unidade (só Master) */}
                  {(user.is_labelview_master || user.user_type === 'labelview_master') && (
                    <select
                      value={filtroUnidade}
                      onChange={(e) => {
                        setFiltroUnidade(e.target.value);
                        setFiltroRegional('');
                        setFiltroConsultor('');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad]"
                    >
                      <option value="">Todas as Unidades</option>
                      {unidades.length === 0 && (
                        <option disabled>Nenhuma unidade cadastrada</option>
                      )}
                      {unidades.map(unidade => (
                        <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Filtro Regional (Master e Unidade) */}
                  {(user.is_labelview_master || user.user_type === 'labelview_master' || user.user_type === 'labelview_unidade') && (
                    <select
                      value={filtroRegional}
                      onChange={(e) => {
                        setFiltroRegional(e.target.value);
                        setFiltroConsultor('');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad]"
                    >
                      <option value="">Todos os Regionais</option>
                      {regionais.length === 0 && (
                        <option disabled>Nenhuma regional cadastrada</option>
                      )}
                      {regionais.map(regional => (
                        <option key={regional.id} value={regional.id}>{regional.nome}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Filtro Consultor (Master, Unidade e Regional) */}
                  {user.user_type !== 'labelview_consultor' && (
                    <select
                      value={filtroConsultor}
                      onChange={(e) => setFiltroConsultor(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad]"
                    >
                      <option value="">Todos os Consultores</option>
                      {consultores.length === 0 && (
                        <option disabled>Nenhum consultor cadastrado</option>
                      )}
                      {consultores.map(consultor => (
                        <option key={consultor.id} value={consultor.id}>{consultor.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
            
            {/* Busca e Filtros de Status */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por cliente, número ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filtroStatus === '' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('')}
                  className={filtroStatus === '' ? 'bg-[#1a59ad]' : ''}
                >
                  Todas
                </Button>
                <Button
                  variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('pendente')}
                  className={filtroStatus === 'pendente' ? 'bg-yellow-500' : ''}
                >
                  Pendentes
                </Button>
                <Button
                  variant={filtroStatus === 'em_atendimento' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('em_atendimento')}
                  className={filtroStatus === 'em_atendimento' ? 'bg-blue-500' : ''}
                >
                  Em Atendimento
                </Button>
                <Button
                  variant={filtroStatus === 'concluido' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('concluido')}
                  className={filtroStatus === 'concluido' ? 'bg-green-500' : ''}
                >
                  Concluídas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Solicitações */}
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando solicitações...</p>
          </div>
        ) : solicitacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma Solicitação
              </p>
              <p className="text-gray-600">
                {searchTerm ? 'Nenhuma solicitação encontrada com esses critérios.' : 'Ainda não há solicitações de atendimento.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitacoesFiltradas.map((solicitacao) => {
              const statusConfig = getStatusConfig(solicitacao.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={solicitacao.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {solicitacao.cliente_nome?.charAt(0) || 'C'}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{solicitacao.numero_solicitacao || solicitacao.id || 'N/A'}</h3>
                            <Badge className={statusConfig.className}>
                              <StatusIcon size={14} className="mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span className="font-medium">{solicitacao.cliente_nome || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={16} />
                              <span>{solicitacao.cliente_email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={16} />
                              <span>{solicitacao.cliente_telefone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              <span>{formatarData(solicitacao.data_solicitacao)}</span>
                            </div>
                          </div>

                          {/* Veículo */}
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Car size={16} className="text-blue-600" />
                              <span className="font-semibold text-sm">
                                {solicitacao.veiculo?.marca || 'N/A'} {solicitacao.veiculo?.modelo || ''}
                              </span>
                              <span className="text-sm text-gray-600">
                                • Placa: {solicitacao.veiculo?.placa || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 pl-6">
                              Contrato: {solicitacao.numero_contrato || 'N/A'} • Plano: {solicitacao.plano_nome || 'N/A'}
                            </p>
                          </div>

                          {/* Serviços */}
                          <div className="mb-3">
                            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Wrench size={16} />
                              Serviços Solicitados:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(solicitacao.servicos_solicitados || []).map((servico, index) => (
                                <Badge key={index} variant="outline" className="bg-transmill-gold/10">
                                  {servico?.nome || 'Serviço'}
                                </Badge>
                              ))}
                              {(!solicitacao.servicos_solicitados || solicitacao.servicos_solicitados.length === 0) && (
                                <span className="text-gray-400 text-sm">Nenhum serviço especificado</span>
                              )}
                            </div>
                          </div>

                          {/* Observações */}
                          {solicitacao.observacoes && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                              <p className="font-semibold mb-1">Observações:</p>
                              <p className="text-gray-700">{solicitacao.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 ml-4">
                        {solicitacao.status === 'pendente' && (
                          <Button
                            size="sm"
                            onClick={() => atualizarStatus(solicitacao.id, 'em_atendimento')}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Iniciar Atendimento
                          </Button>
                        )}
                        {solicitacao.status === 'em_atendimento' && (
                          <Button
                            size="sm"
                            onClick={() => atualizarStatus(solicitacao.id, 'concluido')}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Marcar como Concluído
                          </Button>
                        )}
                        {(solicitacao.status === 'pendente' || solicitacao.status === 'em_atendimento') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarStatus(solicitacao.id, 'cancelado')}
                            className="border-red-500 text-red-500 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Informações de Atendimento */}
                    {solicitacao.atendido_por_nome && (
                      <div className="border-t pt-3 mt-3 text-sm text-gray-600">
                        <p>
                          Atendido por: <strong>{solicitacao.atendido_por_nome}</strong>
                          {solicitacao.data_atendimento && (
                            <span className="ml-2">• {formatarData(solicitacao.data_atendimento)}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolicitacoesLabelviewPage;
