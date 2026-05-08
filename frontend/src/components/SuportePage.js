import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  MessageCircle,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Building2,
  Filter,
  RefreshCw,
  HelpCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';

const SuportePage = ({ franquiaContext = null }) => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chamados, setChamados] = useState([]);
  const [stats, setStats] = useState({ total: 0, abertos: 0, em_andamento: 0, resolvidos: 0 });
  const [filtroStatus, setFiltroStatus] = useState('');
  const [showNovoChamado, setShowNovoChamado] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [novoChamado, setNovoChamado] = useState({
    titulo: '',
    categoria: 'geral',
    descricao: '',
    prioridade: 'media'
  });
  const [criandoChamado, setCriandoChamado] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  // Cores da franquia
  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';

  useEffect(() => {
    carregarChamados();
  }, [filtroStatus]);

  const carregarChamados = async () => {
    try {
      setLoading(true);
      let url = `${API}/suporte/chamados`;
      if (filtroStatus) {
        url += `?status=${filtroStatus}`;
      }
      
      const response = await axios.get(url, { headers });
      
      if (response.data.success) {
        setChamados(response.data.chamados || []);
        setStats(response.data.stats || { total: 0, abertos: 0, em_andamento: 0, resolvidos: 0 });
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      toast.error('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  };

  const criarChamado = async () => {
    if (!novoChamado.titulo.trim()) {
      toast.error('Digite um título para o chamado');
      return;
    }
    if (!novoChamado.descricao.trim()) {
      toast.error('Digite uma descrição para o chamado');
      return;
    }

    try {
      setCriandoChamado(true);
      const response = await axios.post(`${API}/suporte/chamados`, novoChamado, { headers });
      
      if (response.data.success) {
        toast.success('Chamado criado com sucesso!');
        setShowNovoChamado(false);
        setNovoChamado({ titulo: '', categoria: 'geral', descricao: '', prioridade: 'media' });
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar chamado');
    } finally {
      setCriandoChamado(false);
    }
  };

  const abrirChamado = async (chamadoId) => {
    try {
      const response = await axios.get(`${API}/suporte/chamados/${chamadoId}`, { headers });
      
      if (response.data.success) {
        setChamadoSelecionado(response.data.chamado);
      }
    } catch (error) {
      console.error('Erro ao abrir chamado:', error);
      toast.error('Erro ao carregar detalhes do chamado');
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    try {
      setEnviandoMensagem(true);
      const response = await axios.post(
        `${API}/suporte/chamados/${chamadoSelecionado.id}/mensagens`,
        { chamado_id: chamadoSelecionado.id, conteudo: novaMensagem },
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Mensagem enviada!');
        setNovaMensagem('');
        // Atualizar chamado com nova mensagem
        setChamadoSelecionado(prev => ({
          ...prev,
          mensagens: [...(prev.mensagens || []), response.data.nova_mensagem],
          status: response.data.novo_status
        }));
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'aberto': { label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
      'em_andamento': { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
      'aguardando_resposta': { label: 'Aguardando Resposta', color: 'bg-purple-100 text-purple-800' },
      'resolvido': { label: 'Resolvido', color: 'bg-green-100 text-green-800' },
      'fechado': { label: 'Fechado', color: 'bg-gray-100 text-gray-800' }
    };
    const config = statusConfig[status] || statusConfig['aberto'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade) => {
    const config = {
      'baixa': { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
      'media': { label: 'Média', color: 'bg-blue-100 text-blue-600' },
      'alta': { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
      'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-600' }
    };
    const c = config[prioridade] || config['media'];
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Visualização de Conversa do Chamado
  if (chamadoSelecionado) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setChamadoSelecionado(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{chamadoSelecionado.titulo}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(chamadoSelecionado.status)}
                {getPrioridadeBadge(chamadoSelecionado.prioridade)}
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-32">
          {(chamadoSelecionado.mensagens || []).map((msg, idx) => (
            <div 
              key={msg.id || idx}
              className={`flex ${msg.autor_tipo === 'master' ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.autor_tipo === 'master' 
                    ? 'bg-white border border-gray-200' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className={`flex items-center gap-2 mb-2 text-sm ${
                  msg.autor_tipo === 'master' ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {msg.autor_tipo === 'master' ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="font-medium">{msg.autor_nome}</span>
                  <span>•</span>
                  <span>{formatDate(msg.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.conteudo}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input de Nova Mensagem */}
        {chamadoSelecionado.status !== 'fechado' && chamadoSelecionado.status !== 'resolvido' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="max-w-3xl mx-auto flex gap-3">
              <Textarea
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 min-h-[50px] max-h-[150px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensagem();
                  }
                }}
              />
              <Button 
                onClick={enviarMensagem} 
                disabled={enviandoMensagem || !novaMensagem.trim()}
                style={{ backgroundColor: corPrimaria }}
              >
                {enviandoMensagem ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lista de Chamados
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" style={{ color: corPrimaria }} />
                  Suporte
                </h1>
                <p className="text-sm text-gray-500">Central de atendimento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={carregarChamados}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowNovoChamado(true)}
                style={{ backgroundColor: corPrimaria }}
                data-testid="novo-chamado-btn"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Chamado
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${filtroStatus === '' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroStatus('')}
          >
            <CardContent className="pt-4 text-center">
              <MessageCircle className="h-6 w-6 mx-auto text-gray-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filtroStatus === 'aberto' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroStatus('aberto')}
          >
            <CardContent className="pt-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.abertos}</p>
              <p className="text-xs text-gray-500">Abertos</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filtroStatus === 'em_andamento' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroStatus('em_andamento')}
          >
            <CardContent className="pt-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.em_andamento}</p>
              <p className="text-xs text-gray-500">Em Andamento</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filtroStatus === 'resolvido' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroStatus('resolvido')}
          >
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.resolvidos}</p>
              <p className="text-xs text-gray-500">Resolvidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Chamados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meus Chamados</CardTitle>
            <CardDescription>
              {filtroStatus ? `Filtrando por: ${filtroStatus.replace('_', ' ')}` : 'Todos os chamados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : chamados.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhum chamado encontrado</p>
                <Button onClick={() => setShowNovoChamado(true)} style={{ backgroundColor: corPrimaria }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Abrir Primeiro Chamado
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {chamados.map((chamado) => (
                  <div 
                    key={chamado.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => abrirChamado(chamado.id)}
                    data-testid={`chamado-${chamado.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{chamado.titulo}</h3>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {chamado.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {getStatusBadge(chamado.status)}
                          {getPrioridadeBadge(chamado.prioridade)}
                          <span className="text-xs text-gray-400">
                            {formatDate(chamado.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Novo Chamado */}
      <Dialog open={showNovoChamado} onOpenChange={setShowNovoChamado}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Chamado de Suporte</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={novoChamado.titulo}
                onChange={(e) => setNovoChamado(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Resumo do problema"
                data-testid="chamado-titulo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={novoChamado.categoria} 
                  onValueChange={(v) => setNovoChamado(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger data-testid="chamado-categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Prioridade</Label>
                <Select 
                  value={novoChamado.prioridade} 
                  onValueChange={(v) => setNovoChamado(prev => ({ ...prev, prioridade: v }))}
                >
                  <SelectTrigger data-testid="chamado-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novoChamado.descricao}
                onChange={(e) => setNovoChamado(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                rows={5}
                data-testid="chamado-descricao"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoChamado(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={criarChamado} 
              disabled={criandoChamado}
              style={{ backgroundColor: corPrimaria }}
              data-testid="criar-chamado-btn"
            >
              {criandoChamado ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Chamado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuportePage;
