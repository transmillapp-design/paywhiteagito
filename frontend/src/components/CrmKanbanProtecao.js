import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  User,
  Car,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Loader2,
  GripVertical,
  MessageSquare,
  Bell,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Timer,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL;

// Colunas do Kanban com cores e ícones
const KANBAN_COLUMNS = [
  { 
    id: 'novo', 
    title: 'Novos Leads', 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50',
    icon: Users,
    description: 'Leads recém-captados'
  },
  { 
    id: 'interesse', 
    title: 'Interesse', 
    color: 'bg-yellow-500', 
    bgColor: 'bg-yellow-50',
    icon: Eye,
    description: 'Demonstraram interesse'
  },
  { 
    id: 'negociacao', 
    title: 'Negociação', 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50',
    icon: MessageSquare,
    description: 'Em negociação de valores'
  },
  { 
    id: 'aguardando_docs', 
    title: 'Aguardando Docs', 
    color: 'bg-purple-500', 
    bgColor: 'bg-purple-50',
    icon: FileText,
    description: 'Aguardando documentação'
  },
  { 
    id: 'aprovado', 
    title: 'Aprovado', 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50',
    icon: CheckCircle,
    description: 'Vistoria aprovada'
  },
  { 
    id: 'cancelado', 
    title: 'Cancelado', 
    color: 'bg-red-500', 
    bgColor: 'bg-red-50',
    icon: XCircle,
    description: 'Processo cancelado'
  }
];

const CrmKanbanProtecao = ({ userType, userId, unidadeId, regionalId }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [draggingLead, setDraggingLead] = useState(null);
  const [activeView, setActiveView] = useState('kanban'); // 'kanban' ou 'relatorios'
  const [relatorios, setRelatorios] = useState(null);
  const [loadingRelatorios, setLoadingRelatorios] = useState(false);
  const [newLead, setNewLead] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    observacoes: ''
  });

  // Cores para gráficos
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Carregar leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/labelview/crm/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLeads(response.data.leads || []);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar relatórios
  const fetchRelatorios = useCallback(async () => {
    try {
      setLoadingRelatorios(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/labelview/crm/relatorios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRelatorios(response.data.relatorios);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoadingRelatorios(false);
    }
  }, []);

  // Exportar Excel
  const exportExcel = async () => {
    try {
      toast.info('Gerando Excel...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/exports/crm/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crm_leads_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  // Exportar PDF
  const exportPDF = async () => {
    try {
      toast.info('Gerando PDF...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/exports/crm/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_crm_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Carregar relatórios quando mudar para aba de relatórios
  useEffect(() => {
    if (activeView === 'relatorios' && !relatorios) {
      fetchRelatorios();
    }
  }, [activeView, relatorios, fetchRelatorios]);

  // Criar novo lead
  const handleCreateLead = async () => {
    if (!newLead.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/labelview/crm/lead`,
        newLead,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Lead criado com sucesso!');
        setNewLead({ nome: '', cpf: '', email: '', telefone: '', observacoes: '' });
        setShowNewLeadForm(false);
        fetchLeads();
      }
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  // Atualizar status do lead (drag & drop)
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // Atualizar localmente primeiro para feedback imediato
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      const response = await axios.put(
        `${API}/api/labelview/crm/lead/${leadId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Status atualizado para "${KANBAN_COLUMNS.find(c => c.id === newStatus)?.title}"`);
        
        // Notificação será enviada pelo backend
        if (response.data.notifications_sent) {
          toast.info(`${response.data.notifications_sent} notificações enviadas`);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
      fetchLeads(); // Reverter em caso de erro
    }
  };

  // Drag handlers
  const handleDragStart = (e, lead) => {
    setDraggingLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggingLead && draggingLead.status !== columnId) {
      handleStatusChange(draggingLead.id, columnId);
    }
    setDraggingLead(null);
  };

  // Filtrar leads por busca
  const filteredLeads = leads.filter(lead => 
    lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cpf?.includes(searchTerm) ||
    lead.telefone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar leads por status
  const leadsByStatus = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredLeads.filter(lead => lead.status === col.id);
    return acc;
  }, {});

  // Card do Lead
  const LeadCard = ({ lead }) => {
    const Icon = lead.tipo === 'cotacao_protecao' ? Car : User;
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, lead)}
        onClick={() => setSelectedLead(lead)}
        className={`bg-white rounded-lg shadow-sm border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
          draggingLead?.id === lead.id ? 'opacity-50 scale-95' : ''
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-blue-100">
            <Icon className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">{lead.nome}</h4>
            <p className="text-xs text-gray-500 truncate">{lead.email || 'Sem email'}</p>
          </div>
          <GripVertical className="h-4 w-4 text-gray-300" />
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          {lead.telefone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.telefone}</span>
            </div>
          )}
          {lead.cpf && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{lead.cpf}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <span className="text-xs text-gray-400">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
          {lead.consultor_email && (
            <Badge variant="outline" className="text-xs py-0">
              {lead.consultor_email.split('@')[0]}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Modal de detalhes do lead
  const LeadDetailsModal = () => {
    if (!selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Detalhes do Lead</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Nome</Label>
                <p className="font-medium">{selectedLead.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <Badge className={`${KANBAN_COLUMNS.find(c => c.id === selectedLead.status)?.color} text-white`}>
                  {KANBAN_COLUMNS.find(c => c.id === selectedLead.status)?.title}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">CPF</Label>
                <p>{selectedLead.cpf || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Telefone</Label>
                <p>{selectedLead.telefone || '-'}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p>{selectedLead.email || '-'}</p>
            </div>

            {/* Responsáveis */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-gray-500 mb-2 block">Responsáveis</Label>
              <div className="space-y-1 text-sm">
                {selectedLead.consultor_email && (
                  <p><span className="text-gray-500">Consultor:</span> {selectedLead.consultor_email}</p>
                )}
                {selectedLead.regional_id && (
                  <p><span className="text-gray-500">Regional:</span> {selectedLead.regional_id}</p>
                )}
                {selectedLead.unidade_id && (
                  <p><span className="text-gray-500">Unidade:</span> {selectedLead.unidade_id}</p>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Datas</Label>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Criado em:</span> {new Date(selectedLead.created_at).toLocaleString('pt-BR')}</p>
                {selectedLead.updated_at && (
                  <p><span className="text-gray-500">Atualizado:</span> {new Date(selectedLead.updated_at).toLocaleString('pt-BR')}</p>
                )}
              </div>
            </div>

            {/* Ações rápidas de status */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Mover para</Label>
              <div className="flex flex-wrap gap-2">
                {KANBAN_COLUMNS.filter(c => c.id !== selectedLead.status).map(col => (
                  <Button
                    key={col.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStatusChange(selectedLead.id, col.id);
                      setSelectedLead({ ...selectedLead, status: col.id });
                    }}
                    className="text-xs"
                  >
                    <col.icon className="h-3 w-3 mr-1" />
                    {col.title}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">CRM Proteção Veicular</h2>
          <p className="text-sm text-gray-500">
            {activeView === 'kanban' ? 'Gerencie seus leads no formato Kanban' : 'Métricas e performance da equipe'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle Kanban / Relatórios */}
          <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
            <Button
              variant={activeView === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('kanban')}
              className={activeView === 'kanban' ? 'bg-[#0d47a1]' : ''}
            >
              <Users className="h-4 w-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant={activeView === 'relatorios' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('relatorios')}
              className={activeView === 'relatorios' ? 'bg-[#0d47a1]' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Relatórios
            </Button>
          </div>
          
          {activeView === 'kanban' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchLeads}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowNewLeadForm(true)} className="bg-[#0d47a1]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </>
          )}
          
          {activeView === 'relatorios' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportExcel}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportPDF}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setRelatorios(null); fetchRelatorios(); }}>
                <RefreshCw className={`h-4 w-4 ${loadingRelatorios ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== KANBAN VIEW ==================== */}
      {activeView === 'kanban' && (
        <>
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.id} className={`${col.bgColor} rounded-lg p-2 text-center`}>
                <p className="text-lg font-bold">{leadsByStatus[col.id]?.length || 0}</p>
                <p className="text-xs text-gray-600 truncate">{col.title}</p>
              </div>
            ))}
          </div>

          {/* Kanban Board */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max h-full">
                {KANBAN_COLUMNS.map(column => {
                  const ColumnIcon = column.icon;
                  const columnLeads = leadsByStatus[column.id] || [];
                  
                  return (
                    <div
                      key={column.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                      className={`w-72 flex-shrink-0 rounded-lg ${column.bgColor} p-3 flex flex-col`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded-lg ${column.color}`}>
                          <ColumnIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
                          <p className="text-xs text-gray-500">{column.description}</p>
                        </div>
                        <Badge variant="secondary" className="font-bold">
                          {columnLeads.length}
                        </Badge>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-350px)]">
                        {columnLeads.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <ColumnIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Nenhum lead</p>
                          </div>
                        ) : (
                          columnLeads.map(lead => (
                            <LeadCard key={lead.id} lead={lead} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== RELATÓRIOS VIEW ==================== */}
      {activeView === 'relatorios' && (
        <div className="flex-1 overflow-y-auto">
          {loadingRelatorios ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : relatorios ? (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total de Leads</p>
                        <p className="text-3xl font-bold">{relatorios.resumo.total_leads}</p>
                      </div>
                      <Users className="h-10 w-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Taxa de Conversão</p>
                        <p className="text-3xl font-bold">{relatorios.resumo.taxa_conversao_geral}%</p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-green-200" />
                    </div>
                    <p className="text-green-100 text-xs mt-1">{relatorios.resumo.leads_aprovados} aprovados</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Tempo Médio Funil</p>
                        <p className="text-3xl font-bold">{relatorios.resumo.tempo_medio_funil_dias}</p>
                      </div>
                      <Timer className="h-10 w-10 text-orange-200" />
                    </div>
                    <p className="text-orange-100 text-xs mt-1">dias até aprovação</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Últimos 30 dias</p>
                        <p className="text-3xl font-bold">{relatorios.resumo.leads_ultimos_30_dias}</p>
                      </div>
                      <Calendar className="h-10 w-10 text-purple-200" />
                    </div>
                    <p className="text-purple-100 text-xs mt-1">novos leads</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funil de Vendas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Funil de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={relatorios.funil} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="label" type="category" width={100} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                            {relatorios.funil.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Evolução Semanal */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Evolução Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={relatorios.evolucao_semanal.labels.map((label, i) => ({
                          semana: label,
                          leads: relatorios.evolucao_semanal.values[i]
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="leads" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabelas de Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance por Regional */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      Performance por Regional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatorios.por_regional.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Nenhum dado de regional</p>
                    ) : (
                      <div className="space-y-3">
                        {relatorios.por_regional.map((regional, idx) => (
                          <div key={regional.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{regional.nome}</p>
                              <p className="text-xs text-gray-500">{regional.total} leads | {regional.aprovados} aprovados</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${regional.taxa_conversao >= 50 ? 'text-green-600' : regional.taxa_conversao >= 25 ? 'text-orange-500' : 'text-red-500'}`}>
                                {regional.taxa_conversao.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500">conversão</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance por Consultor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-500" />
                      Performance por Consultor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatorios.por_consultor.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Nenhum dado de consultor</p>
                    ) : (
                      <div className="space-y-3">
                        {relatorios.por_consultor.map((consultor, idx) => (
                          <div key={consultor.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{consultor.nome}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{consultor.total} leads</span>
                                <span>•</span>
                                <span className="text-green-600">{consultor.aprovados} ✓</span>
                                <span>•</span>
                                <span className="text-red-500">{consultor.cancelados} ✗</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${consultor.taxa_conversao >= 50 ? 'text-green-600' : consultor.taxa_conversao >= 25 ? 'text-orange-500' : 'text-red-500'}`}>
                                {consultor.taxa_conversao.toFixed(1)}%
                              </p>
                              {consultor.tempo_medio > 0 && (
                                <p className="text-xs text-gray-500">{consultor.tempo_medio.toFixed(0)}d médio</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição por Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {relatorios.funil.map((item, idx) => (
                      <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '20' }}
                        >
                          <span 
                            className="text-xl font-bold"
                            style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                          >
                            {item.count}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        <p className="text-xs text-gray-500">
                          {relatorios.resumo.total_leads > 0 
                            ? ((item.count / relatorios.resumo.total_leads) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Erro ao carregar relatórios</p>
              <Button variant="outline" onClick={fetchRelatorios} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Novo Lead */}
      {showNewLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Novo Lead</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewLeadForm(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome completo"
                  value={newLead.nome}
                  onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={newLead.cpf}
                    onChange={(e) => setNewLead({ ...newLead, cpf: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={newLead.telefone}
                    onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Informações adicionais..."
                  value={newLead.observacoes}
                  onChange={(e) => setNewLead({ ...newLead, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowNewLeadForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateLead} className="flex-1 bg-[#0d47a1]">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes */}
      <LeadDetailsModal />
    </div>
  );
};

export default CrmKanbanProtecao;
