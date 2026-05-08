import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Users, TrendingUp, Clock, CheckCircle, XCircle, ArrowLeft,
  Search, Car, Mail, Phone, Calendar, Eye, Edit, Trash2
} from 'lucide-react';

const ProtecaoLeadsPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    carregarLeads();
  }, [filtroStatus]);

  const carregarLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filtroStatus
        ? `${API}/labelview/leads/por-status?status=${filtroStatus}`
        : `${API}/labelview/leads/por-status`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setLeads(response.data.leads);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
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
      'interesse': {
        label: 'Interesse',
        className: 'bg-yellow-500 text-white',
        icon: Users,
        description: 'Dados iniciais preenchidos'
      },
      'negociacao': {
        label: 'Negociação',
        className: 'bg-blue-500 text-white',
        icon: TrendingUp,
        description: 'Veículo e plano em análise'
      },
      'aguardando_aprovacao': {
        label: 'Aguardando Aprovação',
        className: 'bg-orange-500 text-white',
        icon: Clock,
        description: 'Vistoria concluída, aguardando aprovação'
      },
      'ativo': {
        label: 'Ativo',
        className: 'bg-green-500 text-white',
        icon: CheckCircle,
        description: 'Proteção ativa'
      },
      'perdido': {
        label: 'Perdido',
        className: 'bg-red-500 text-white',
        icon: XCircle,
        description: 'Lead perdido'
      }
    };

    return configs[status] || configs['interesse'];
  };

  const getStepLabel = (step) => {
    const labels = {
      0: 'Dados do Cliente',
      1: 'Dados do Veículo',
      2: 'Seleção do Plano',
      3: 'Vistoria',
      4: 'Dados do Condutor',
      5: 'Resumo'
    };
    return labels[step] || 'Em Andamento';
  };

  // 🔧 Função para deletar lead
  const handleDeleteLead = async (leadId, leadNome) => {
    // Confirmação
    if (!window.confirm(`Tem certeza que deseja excluir o lead "${leadNome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      setDeletingId(leadId);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API}/labelview/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Lead excluído com sucesso!');
      
      // Remover da lista local
      setLeads(leads.filter(l => l.id !== leadId));
      
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir lead');
    } finally {
      setDeletingId(null);
    }
  };

  // Verificar se usuário pode deletar o lead
  const podeExcluirLead = (lead) => {
    // Master pode excluir qualquer lead
    if (user.user_type === 'labelview_master' || user.is_labelview_master) {
      return true;
    }
    // Consultor pode excluir seus próprios leads
    if (user.user_type === 'labelview_consultor' && lead.consultor_id === user.id) {
      return true;
    }
    // Regional pode excluir leads de sua regional
    if (user.user_type === 'labelview_regional' && lead.regional_id === user.id) {
      return true;
    }
    // Unidade pode excluir leads de sua unidade
    if (user.user_type === 'labelview_unidade' && lead.unidade_id === user.id) {
      return true;
    }
    return false;
  };

  const filtrarLeads = () => {
    if (!searchTerm) return leads;

    return leads.filter(lead =>
      lead.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const leadsFiltrados = filtrarLeads();

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
          <h1 className="text-xl font-bold text-white">Proteção - Leads/CRM</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-shadow ${filtroStatus === '' ? 'ring-2 ring-transmill-olive' : 'hover:shadow-lg'}`}
            onClick={() => setFiltroStatus('')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.interesse + stats.negociacao + stats.aguardando_aprovacao + stats.ativo + stats.perdido || 0}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${filtroStatus === 'interesse' ? 'ring-2 ring-yellow-500' : 'hover:shadow-lg'}`}
            onClick={() => setFiltroStatus('interesse')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.interesse || 0}</p>
              <p className="text-xs text-gray-600">Interesse</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${filtroStatus === 'negociacao' ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
            onClick={() => setFiltroStatus('negociacao')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.negociacao || 0}</p>
              <p className="text-xs text-gray-600">Negociação</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${filtroStatus === 'aguardando_aprovacao' ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'}`}
            onClick={() => setFiltroStatus('aguardando_aprovacao')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.aguardando_aprovacao || 0}</p>
              <p className="text-xs text-gray-600">Aguardando</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${filtroStatus === 'ativo' ? 'ring-2 ring-green-500' : 'hover:shadow-lg'}`}
            onClick={() => setFiltroStatus('ativo')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.ativo || 0}</p>
              <p className="text-xs text-gray-600">Ativo</p>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, email ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando leads...</p>
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum Lead
              </p>
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum lead encontrado.' : 'Ainda não há leads cadastrados.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leadsFiltrados.map((lead) => {
              const statusConfig = getStatusConfig(lead.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {lead.cliente?.nome?.charAt(0) || 'L'}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{lead.cliente?.nome || 'Cliente não identificado'}</h3>
                            <Badge className={statusConfig.className}>
                              <StatusIcon size={14} className="mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                            {lead.cliente?.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>{lead.cliente.email}</span>
                              </div>
                            )}
                            {lead.cliente?.telefone && (
                              <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>{lead.cliente.telefone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              <span>{formatarData(lead.updated_at)}</span>
                            </div>
                          </div>

                          {/* Veículo */}
                          {lead.veiculo?.marca && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Car size={16} className="text-blue-600" />
                                <span className="font-semibold text-sm">
                                  {lead.veiculo.marca} {lead.veiculo.modelo}
                                </span>
                                {lead.veiculo.placa && (
                                  <span className="text-sm text-gray-600">
                                    • Placa: {lead.veiculo.placa}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Plano */}
                          {lead.plano && (
                            <div className="bg-green-50 p-3 rounded-lg mb-3">
                              <p className="font-semibold text-sm text-green-700">
                                Plano: {lead.plano.nome_plano}
                              </p>
                              {lead.complementos && lead.complementos.length > 0 && (
                                <p className="text-xs text-gray-600">
                                  + {lead.complementos.length} complemento(s)
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progresso */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-transmill-olive h-2 rounded-full transition-all"
                                style={{ width: `${((lead.step_atual + 1) / 6) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {getStepLabel(lead.step_atual)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-transmill-olive text-transmill-olive"
                        >
                          <Eye className="mr-2" size={16} />
                          Ver Detalhes
                        </Button>
                        
                        {/* Botão Excluir - apenas se usuário pode excluir */}
                        {podeExcluirLead(lead) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteLead(lead.id, lead.cliente?.nome || 'Lead')}
                            disabled={deletingId === lead.id}
                          >
                            {deletingId === lead.id ? (
                              <>
                                <Clock className="mr-2 animate-spin" size={16} />
                                Excluindo...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2" size={16} />
                                Excluir
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Consultor */}
                    {lead.consultor_nome && (
                      <div className="border-t pt-3 mt-3 text-sm text-gray-600">
                        <p>
                          Consultor: <strong>{lead.consultor_nome}</strong>
                          {lead.origem && <span className="ml-2">• Origem: {lead.origem === 'labelview' ? 'Labelview' : 'Transmill'}</span>}
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

export default ProtecaoLeadsPage;
