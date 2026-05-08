import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  Building2, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Settings,
  Search,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CreditCard,
  BarChart3,
  FileText,
  Shield,
  Plus,
  Edit,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  ArrowLeft,
  Copy,
  ExternalLink,
  MapPin,
  Bell,
  Send,
  Upload,
  Image,
  Link,
  FileCheck,
  Building,
  MessageCircle,
  Bitcoin,
  Clock,
  Loader2,
  User,
  Tag,
  Sparkles,
  Heart
} from 'lucide-react';

// Componente de Suporte Master - Gestão de Chamados
const SuporteMasterPanel = ({ API }) => {
  const [loading, setLoading] = useState(true);
  const [chamados, setChamados] = useState([]);
  const [stats, setStats] = useState({ total: 0, abertos: 0, em_andamento: 0, resolvidos: 0 });
  const [filtroStatus, setFiltroStatus] = useState('');
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [novoStatus, setNovoStatus] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

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

  const abrirChamado = async (chamadoId) => {
    try {
      const response = await axios.get(`${API}/suporte/chamados/${chamadoId}`, { headers });
      
      if (response.data.success) {
        setChamadoSelecionado(response.data.chamado);
        setNovoStatus(response.data.chamado.status);
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
        toast.success('Resposta enviada!');
        setNovaMensagem('');
        setChamadoSelecionado(prev => ({
          ...prev,
          mensagens: [...(prev.mensagens || []), response.data.nova_mensagem],
          status: response.data.novo_status
        }));
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const atualizarStatus = async (status) => {
    try {
      const response = await axios.patch(
        `${API}/suporte/chamados/${chamadoSelecionado.id}/status`,
        { status },
        { headers }
      );
      
      if (response.data.success) {
        toast.success(`Status alterado para ${status}`);
        setChamadoSelecionado(prev => ({ ...prev, status }));
        setNovoStatus(status);
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${filtroStatus === '' ? 'ring-2 ring-[#293618]' : ''}`}
          onClick={() => setFiltroStatus('')}
        >
          <CardContent className="pt-4 text-center">
            <MessageCircle className="h-6 w-6 mx-auto text-gray-500 mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filtroStatus === 'aberto' ? 'ring-2 ring-[#293618]' : ''}`}
          onClick={() => setFiltroStatus('aberto')}
        >
          <CardContent className="pt-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.abertos}</p>
            <p className="text-xs text-gray-500">Abertos</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filtroStatus === 'em_andamento' ? 'ring-2 ring-[#293618]' : ''}`}
          onClick={() => setFiltroStatus('em_andamento')}
        >
          <CardContent className="pt-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.em_andamento}</p>
            <p className="text-xs text-gray-500">Em Andamento</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filtroStatus === 'resolvido' ? 'ring-2 ring-[#293618]' : ''}`}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Chamados de Suporte</CardTitle>
            <CardDescription>
              {filtroStatus ? `Filtrando por: ${filtroStatus.replace('_', ' ')}` : 'Todos os chamados de todas as franquias'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={carregarChamados}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : chamados.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum chamado encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chamados.map((chamado) => (
                <div 
                  key={chamado.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => abrirChamado(chamado.id)}
                  data-testid={`master-chamado-${chamado.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{chamado.titulo}</h3>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {chamado.descricao}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getStatusBadge(chamado.status)}
                        {getPrioridadeBadge(chamado.prioridade)}
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {chamado.franquia_nome || 'Sem franquia'}
                        </Badge>
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

      {/* Modal de Detalhes do Chamado */}
      <Dialog open={!!chamadoSelecionado} onOpenChange={() => setChamadoSelecionado(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{chamadoSelecionado?.titulo}</span>
            </DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(chamadoSelecionado?.status)}
              {getPrioridadeBadge(chamadoSelecionado?.prioridade)}
              <Badge variant="outline">
                <Building2 className="h-3 w-3 mr-1" />
                {chamadoSelecionado?.franquia_nome}
              </Badge>
            </div>
          </DialogHeader>
          
          {/* Ações de Status */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 mr-2">Alterar status:</span>
            <Select value={novoStatus} onValueChange={(v) => atualizarStatus(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando_resposta">Aguardando Resposta</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[40vh]">
            {(chamadoSelecionado?.mensagens || []).map((msg, idx) => (
              <div 
                key={msg.id || idx}
                className={`flex ${msg.autor_tipo === 'master' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.autor_tipo === 'master' 
                      ? 'bg-[#293618] text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-1 text-xs ${
                    msg.autor_tipo === 'master' ? 'text-green-200' : 'text-gray-500'
                  }`}>
                    {msg.autor_tipo === 'master' ? (
                      <Building2 className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="font-medium">{msg.autor_nome}</span>
                    <span>•</span>
                    <span>{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.conteudo}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input de Resposta */}
          {chamadoSelecionado?.status !== 'fechado' && (
            <div className="flex gap-2 pt-4 border-t">
              <Textarea
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua resposta..."
                className="flex-1 min-h-[60px] max-h-[100px] resize-none"
              />
              <Button 
                onClick={enviarMensagem} 
                disabled={enviandoMensagem || !novaMensagem.trim()}
                className="bg-[#293618] self-end"
              >
                {enviandoMensagem ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente principal do Painel Admin de Franquias
const AdminFranquiasPanel = () => {
  const { API, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [franquias, setFranquias] = useState([]);
  const [stats, setStats] = useState({
    totalFranquias: 0,
    franquiasAtivas: 0,
    totalClientes: 0,
    saldoBolsao: 0,
    movimentacoesMes: 0,
    receitaMes: 0,
    entradasMes: 0,
    saidasMes: 0
  });
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [franquiasSaldos, setFranquiasSaldos] = useState([]);
  const [franquiaSelecionada, setFranquiaSelecionada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [taxas, setTaxas] = useState({
    taxa_pix: 0.5,
    taxa_cartao: 2.5,
    taxa_boleto: 3.50,
    repasse_franquia: 80,
    taxa_plataforma: 20
  });
  const [editandoTaxas, setEditandoTaxas] = useState(false);
  const [showNovaMovimentacao, setShowNovaMovimentacao] = useState(false);
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: 'entrada',
    valor: '',
    descricao: '',
    franquia_id: '',
    origem: 'manual'
  });
  const [buscaSuporte, setBuscaSuporte] = useState({ cpf: '', transacao: '' });
  
  // Estados para Notificações
  const [notificacaoLoading, setNotificacaoLoading] = useState(false);
  const [searchDocument, setSearchDocument] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [tipoEnvio, setTipoEnvio] = useState('individual'); // 'individual', 'broadcast' ou 'franquias'
  const [franquiasSelecionadas, setFranquiasSelecionadas] = useState([]); // IDs das franquias selecionadas
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [notificacao, setNotificacao] = useState({
    title: '',
    message: '',
    priority: 'media',
    attachment_type: null,
    attachment_data: null,
    recipient_id: null
  });

  // Templates de notificação pré-definidos
  const templatesNotificacao = [
    {
      id: 'promocao',
      nome: 'Promoção',
      icon: 'Tag',
      cor: 'bg-green-100 text-green-700 border-green-300',
      title: 'Promoção Especial!',
      message: 'Aproveite nossa promoção exclusiva! Condições imperdíveis por tempo limitado.',
      priority: 'alta'
    },
    {
      id: 'aviso',
      nome: 'Aviso de Sistema',
      icon: 'AlertCircle',
      cor: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      title: 'Aviso Importante',
      message: 'Informamos que haverá manutenção programada no sistema. Pedimos desculpas pelo inconveniente.',
      priority: 'alta'
    },
    {
      id: 'novidade',
      nome: 'Novidade',
      icon: 'Sparkles',
      cor: 'bg-blue-100 text-blue-700 border-blue-300',
      title: 'Novidade no App!',
      message: 'Temos novidades para você! Confira as novas funcionalidades disponíveis no aplicativo.',
      priority: 'media'
    },
    {
      id: 'lembrete',
      nome: 'Lembrete',
      icon: 'Bell',
      cor: 'bg-purple-100 text-purple-700 border-purple-300',
      title: 'Lembrete',
      message: 'Não esqueça! Verifique suas pendências e mantenha tudo em dia.',
      priority: 'media'
    },
    {
      id: 'boas_vindas',
      nome: 'Boas-vindas',
      icon: 'Heart',
      cor: 'bg-pink-100 text-pink-700 border-pink-300',
      title: 'Bem-vindo à família!',
      message: 'É um prazer ter você conosco! Explore todos os benefícios disponíveis para você.',
      priority: 'baixa'
    },
    {
      id: 'custom',
      nome: 'Personalizado',
      icon: 'Edit',
      cor: 'bg-gray-100 text-gray-700 border-gray-300',
      title: '',
      message: '',
      priority: 'media'
    }
  ];

  // Função para aplicar template
  const aplicarTemplate = (template) => {
    setTemplateSelecionado(template.id);
    if (template.id !== 'custom') {
      setNotificacao(prev => ({
        ...prev,
        title: template.title,
        message: template.message,
        priority: template.priority
      }));
    }
  };

  // Estados para USDT
  const [showUsdtModal, setShowUsdtModal] = useState(false);
  const [usdtModalType, setUsdtModalType] = useState('movimentacao'); // 'movimentacao' ou 'conversao'
  const [cotacaoUsdt, setCotacaoUsdt] = useState({ valor: 5.50, fonte: 'Estimativa', loading: false });
  const [usdtMovimentacoes, setUsdtMovimentacoes] = useState([]);
  const [usdtConversoes, setUsdtConversoes] = useState([]);
  const [loadingUsdt, setLoadingUsdt] = useState(false);
  const [novaMovimentacaoUsdt, setNovaMovimentacaoUsdt] = useState({
    tipo: 'entrada',
    valor: '',
    descricao: '',
    origem: 'deposito_xgate',
    wallet_externa: '',
    tx_hash: ''
  });
  const [novaConversaoUsdt, setNovaConversaoUsdt] = useState({
    tipo: 'conversao_usdt_brl',
    valor_usdt: '',
    valor_brl: '',
    cotacao: 5.50,
    descricao: ''
  });
  const [salvandoUsdt, setSalvandoUsdt] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [notificacoesEnviadas, setNotificacoesEnviadas] = useState([]);
  
  // Estados para Taxas Personalizadas por Franquia
  const [showTaxaPersonalizada, setShowTaxaPersonalizada] = useState(false);
  const [taxasPersonalizadas, setTaxasPersonalizadas] = useState([]);
  const [taxaFranquiaForm, setTaxaFranquiaForm] = useState({
    franquia_id: '',
    taxa_pix: '',
    taxa_cartao: '',
    taxa_boleto: '',
    repasse_franquia: '',
    taxa_plataforma: ''
  });
  const [salvandoTaxaPersonalizada, setSalvandoTaxaPersonalizada] = useState(false);

  // Estados para Edição de Franquia com Upload de Logo
  const [showEditFranquia, setShowEditFranquia] = useState(false);
  const [editingFranquia, setEditingFranquia] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  // Estados para Cadastro de Nova Franquia
  const [showNovaFranquia, setShowNovaFranquia] = useState(false);
  const [novaFranquia, setNovaFranquia] = useState({
    nome: '',
    slug: '',
    estado: '',
    cidades: '',
    email_contato: '',
    telefone_contato: '',
    cnpj: '',
    razao_social: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    cor_primaria: '#1a59ad',
    cor_secundaria: '#ffffff',
    cor_texto: '#ffffff',
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_telefone: ''
  });
  const [salvandoNovaFranquia, setSalvandoNovaFranquia] = useState(false);
  const [novaFranquiaLogoFile, setNovaFranquiaLogoFile] = useState(null);
  const [novaFranquiaLogoPreview, setNovaFranquiaLogoPreview] = useState(null);
  const [novaFranquiaDocs, setNovaFranquiaDocs] = useState({
    contrato_social: null,
    comprovante_endereco: null,
    documento_responsavel: null
  });
  const [novaFranquiaDocPreviews, setNovaFranquiaDocPreviews] = useState({});
  const [showLinkCadastro, setShowLinkCadastro] = useState(false);
  const [linkCadastro, setLinkCadastro] = useState('');

  useEffect(() => {
    if (user?.is_labelview_master || user?.user_type === 'labelview_master' || user?.user_type === 'master') {
      carregarDados();
      carregarCotacaoUsdt();
    }
  }, [user]);

  // Carregar cotação USDT em tempo real
  const carregarCotacaoUsdt = async () => {
    try {
      setCotacaoUsdt(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/franquias/usdt/cotacao`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCotacaoUsdt({
          valor: response.data.cotacao?.usdt_brl || 5.50,
          fonte: response.data.cotacao?.fonte || 'Estimativa',
          loading: false,
          atualizado_em: response.data.cotacao?.atualizado_em
        });
        // Atualizar cotação nos formulários
        setNovaConversaoUsdt(prev => ({
          ...prev,
          cotacao: response.data.cotacao?.usdt_brl || 5.50
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar cotação USDT:', error);
      setCotacaoUsdt(prev => ({ ...prev, loading: false }));
    }
  };

  // Carregar histórico USDT quando modal abrir
  const carregarHistoricoUsdt = async () => {
    try {
      setLoadingUsdt(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar movimentações USDT
      const movRes = await axios.get(`${API}/admin/franquias/usdt/movimentacoes?limit=50`, { headers });
      if (movRes.data.success) {
        setUsdtMovimentacoes(movRes.data.movimentacoes || []);
      }
      
      // Buscar conversões USDT
      const convRes = await axios.get(`${API}/admin/franquias/usdt/conversoes?limit=50`, { headers });
      if (convRes.data.success) {
        setUsdtConversoes(convRes.data.conversoes || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar histórico USDT:', error);
      toast.error('Erro ao carregar histórico USDT');
    } finally {
      setLoadingUsdt(false);
    }
  };

  // Registrar movimentação USDT (entrada/saída)
  const registrarMovimentacaoUsdt = async () => {
    try {
      if (!novaMovimentacaoUsdt.valor || parseFloat(novaMovimentacaoUsdt.valor) <= 0) {
        toast.error('Informe um valor válido');
        return;
      }
      
      setSalvandoUsdt(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API}/admin/franquias/usdt/registrar-movimentacao`, novaMovimentacaoUsdt, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Movimentação registrada!');
        setNovaMovimentacaoUsdt({
          tipo: 'entrada',
          valor: '',
          descricao: '',
          origem: 'deposito_xgate',
          wallet_externa: '',
          tx_hash: ''
        });
        carregarHistoricoUsdt();
        carregarDados(); // Atualizar stats
      } else {
        toast.error(response.data.error || 'Erro ao registrar');
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação USDT:', error);
      toast.error(error.response?.data?.detail || 'Erro ao registrar movimentação');
    } finally {
      setSalvandoUsdt(false);
    }
  };

  // Registrar conversão USDT↔BRL
  const registrarConversaoUsdt = async () => {
    try {
      if (!novaConversaoUsdt.valor_usdt || parseFloat(novaConversaoUsdt.valor_usdt) <= 0) {
        toast.error('Informe um valor USDT válido');
        return;
      }
      
      setSalvandoUsdt(true);
      const token = localStorage.getItem('token');
      
      // Calcular valor BRL baseado na cotação
      const valorUsdt = parseFloat(novaConversaoUsdt.valor_usdt);
      const cotacao = parseFloat(novaConversaoUsdt.cotacao) || cotacaoUsdt.valor;
      const valorBrl = valorUsdt * cotacao;
      
      const payload = {
        ...novaConversaoUsdt,
        valor_usdt: valorUsdt,
        valor_brl: valorBrl,
        cotacao: cotacao
      };
      
      const response = await axios.post(`${API}/admin/franquias/usdt/registrar-conversao`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Conversão registrada!');
        setNovaConversaoUsdt({
          tipo: 'conversao_usdt_brl',
          valor_usdt: '',
          valor_brl: '',
          cotacao: cotacaoUsdt.valor,
          descricao: ''
        });
        carregarHistoricoUsdt();
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao registrar conversão');
      }
    } catch (error) {
      console.error('Erro ao registrar conversão USDT:', error);
      toast.error(error.response?.data?.detail || 'Erro ao registrar conversão');
    } finally {
      setSalvandoUsdt(false);
    }
  };

  // Abrir modal USDT
  const abrirModalUsdt = (tipo = 'movimentacao') => {
    setUsdtModalType(tipo);
    setShowUsdtModal(true);
    carregarHistoricoUsdt();
    carregarCotacaoUsdt();
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Carregar franquias
      const franquiasRes = await axios.get(`${API}/franquias`, { headers });
      
      if (franquiasRes.data.success) {
        setFranquias(franquiasRes.data.franquias || []);
      }

      // Carregar estatísticas do bolsão
      try {
        const statsRes = await axios.get(`${API}/admin/franquias/stats`, { headers });
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
      } catch (e) {
        console.log('Stats endpoint erro:', e.message);
      }

      // Carregar movimentações recentes
      try {
        const movRes = await axios.get(`${API}/admin/franquias/movimentacoes?limit=50`, { headers });
        if (movRes.data.success) {
          setMovimentacoes(movRes.data.movimentacoes || []);
        }
      } catch (e) {
        console.log('Movimentações endpoint erro:', e.message);
      }

      // Carregar saldos por franquia
      try {
        const saldosRes = await axios.get(`${API}/admin/franquias/saldos`, { headers });
        if (saldosRes.data.success) {
          setFranquiasSaldos(saldosRes.data.franquias_saldos || []);
        }
      } catch (e) {
        console.log('Saldos endpoint erro:', e.message);
      }

      // Carregar taxas configuradas
      try {
        const taxasRes = await axios.get(`${API}/admin/franquias/taxas`, { headers });
        if (taxasRes.data.success) {
          setTaxas(taxasRes.data.taxas);
        }
      } catch (e) {
        console.log('Taxas endpoint erro:', e.message);
      }

      // Carregar taxas personalizadas por franquia
      try {
        const taxasPersonalizadasRes = await axios.get(`${API}/admin/franquias/taxas-personalizadas`, { headers });
        if (taxasPersonalizadasRes.data.success) {
          setTaxasPersonalizadas(taxasPersonalizadasRes.data.taxas_personalizadas || []);
        }
      } catch (e) {
        console.log('Taxas personalizadas endpoint erro:', e.message);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const salvarTaxas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/admin/franquias/taxas`, taxas, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Taxas atualizadas com sucesso!');
        setEditandoTaxas(false);
      } else {
        toast.error(response.data.error || 'Erro ao salvar taxas');
      }
    } catch (error) {
      console.error('Erro ao salvar taxas:', error);
      toast.error('Erro ao salvar taxas');
    }
  };

  const salvarTaxaPersonalizada = async () => {
    try {
      if (!taxaFranquiaForm.franquia_id) {
        toast.error('Selecione uma franquia');
        return;
      }

      setSalvandoTaxaPersonalizada(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API}/admin/franquias/taxas-personalizadas`, taxaFranquiaForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Taxa personalizada salva com sucesso!');
        setShowTaxaPersonalizada(false);
        setTaxaFranquiaForm({
          franquia_id: '',
          taxa_pix: '',
          taxa_cartao: '',
          taxa_boleto: '',
          repasse_franquia: '',
          taxa_plataforma: ''
        });
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao salvar taxa personalizada');
      }
    } catch (error) {
      console.error('Erro ao salvar taxa personalizada:', error);
      toast.error('Erro ao salvar taxa personalizada');
    } finally {
      setSalvandoTaxaPersonalizada(false);
    }
  };

  const excluirTaxaPersonalizada = async (franquiaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/admin/franquias/taxas-personalizadas/${franquiaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Taxa personalizada removida');
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao remover');
      }
    } catch (error) {
      console.error('Erro ao excluir taxa personalizada:', error);
      toast.error('Erro ao excluir taxa personalizada');
    }
  };

  // ===== FUNÇÕES DE EDIÇÃO DE FRANQUIA =====
  
  const abrirEditarFranquia = (franquia) => {
    setEditingFranquia({ ...franquia });
    setLogoPreview(franquia.logo_url || null);
    setShowEditFranquia(true);
  };

  // ===== FUNÇÕES DE NOVA FRANQUIA =====

  const gerarSlug = (nome) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNovaFranquiaChange = (field, value) => {
    setNovaFranquia(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-gerar slug baseado no nome
      if (field === 'nome') {
        updated.slug = gerarSlug(value);
      }
      return updated;
    });
  };

  const handleEnderecoChange = (field, value) => {
    setNovaFranquia(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }));
  };

  const handleNovaFranquiaLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou SVG');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }
    
    setNovaFranquiaLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setNovaFranquiaLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleNovaFranquiaDocChange = (docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tamanho (máximo 10MB para documentos)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }
    
    // Verificar tipo (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, JPG, PNG ou WEBP');
      return;
    }
    
    setNovaFranquiaDocs(prev => ({
      ...prev,
      [docType]: file
    }));
    
    // Preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNovaFranquiaDocPreviews(prev => ({
          ...prev,
          [docType]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Para PDF, mostrar nome do arquivo
      setNovaFranquiaDocPreviews(prev => ({
        ...prev,
        [docType]: file.name
      }));
    }
  };

  const criarNovaFranquia = async () => {
    try {
      if (!novaFranquia.nome || !novaFranquia.slug || !novaFranquia.estado) {
        toast.error('Preencha nome, slug e estado');
        return;
      }

      setSalvandoNovaFranquia(true);
      const token = localStorage.getItem('token');
      
      // Criar franquia
      const franquiaData = {
        ...novaFranquia,
        cidades: novaFranquia.cidades.split(',').map(c => c.trim()).filter(c => c)
      };
      
      const response = await axios.post(`${API}/franquias`, franquiaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const franquiaId = response.data.franquia.id;
        
        // Se tiver logo, fazer upload
        if (novaFranquiaLogoFile) {
          const formData = new FormData();
          formData.append('file', novaFranquiaLogoFile);
          
          await axios.post(`${API}/franquias/${franquiaId}/logo`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
        
        toast.success('Franquia criada com sucesso!');
        setShowNovaFranquia(false);
        resetNovaFranquiaForm();
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao criar franquia');
      }
    } catch (error) {
      console.error('Erro ao criar franquia:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar franquia');
    } finally {
      setSalvandoNovaFranquia(false);
    }
  };

  const resetNovaFranquiaForm = () => {
    setNovaFranquia({
      nome: '',
      slug: '',
      estado: '',
      cidades: '',
      email_contato: '',
      telefone_contato: '',
      cnpj: '',
      razao_social: '',
      endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      cor_primaria: '#1a59ad',
      cor_secundaria: '#ffffff',
      cor_texto: '#ffffff',
      responsavel_nome: '',
      responsavel_cpf: '',
      responsavel_telefone: ''
    });
    setNovaFranquiaLogoFile(null);
    setNovaFranquiaLogoPreview(null);
    setNovaFranquiaDocs({
      contrato_social: null,
      comprovante_endereco: null,
      documento_responsavel: null
    });
    setNovaFranquiaDocPreviews({});
  };

  const gerarLinkCadastro = () => {
    // Gerar token único para o link de cadastro
    const token = btoa(JSON.stringify({
      t: Date.now(),
      r: Math.random().toString(36).substring(7)
    }));
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/cadastro-franquia?ref=${token}`;
    setLinkCadastro(link);
    setShowLinkCadastro(true);
  };

  const copiarLinkCadastro = () => {
    navigator.clipboard.writeText(linkCadastro);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou SVG');
      return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Fazer upload
    uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    if (!editingFranquia?.id) return;
    
    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API}/franquias/${editingFranquia.id}/logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Logo atualizada com sucesso!');
        setEditingFranquia(prev => ({ ...prev, logo_url: response.data.logo_url }));
        setLogoPreview(response.data.logo_url);
        carregarDados(); // Atualizar lista
      } else {
        toast.error(response.data.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro ao fazer upload de logo:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removerLogo = async () => {
    if (!editingFranquia?.id) return;
    
    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${API}/franquias/${editingFranquia.id}/logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Logo removida');
        setEditingFranquia(prev => ({ ...prev, logo_url: '' }));
        setLogoPreview(null);
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao remover logo');
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const salvarFranquia = async () => {
    if (!editingFranquia?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `${API}/franquias/${editingFranquia.id}`,
        {
          nome: editingFranquia.nome,
          estado: editingFranquia.estado,
          cidades: editingFranquia.cidades,
          cor_primaria: editingFranquia.cor_primaria,
          cor_secundaria: editingFranquia.cor_secundaria,
          cor_texto: editingFranquia.cor_texto,
          email_contato: editingFranquia.email_contato,
          telefone_contato: editingFranquia.telefone_contato,
          ativo: editingFranquia.ativo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Franquia atualizada com sucesso!');
        setShowEditFranquia(false);
        setEditingFranquia(null);
        carregarDados();
      } else {
        toast.error(response.data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar franquia:', error);
      toast.error('Erro ao salvar franquia');
    }
  };

  const registrarMovimentacao = async () => {
    try {
      if (!novaMovimentacao.valor || parseFloat(novaMovimentacao.valor) <= 0) {
        toast.error('Informe um valor válido');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/admin/franquias/movimentacao`, novaMovimentacao, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Movimentação registrada!');
        setShowNovaMovimentacao(false);
        setNovaMovimentacao({
          tipo: 'entrada',
          valor: '',
          descricao: '',
          franquia_id: '',
          origem: 'manual'
        });
        carregarDados(); // Recarregar dados
      } else {
        toast.error(response.data.error || 'Erro ao registrar');
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    }
  };

  // ===== FUNÇÕES DE NOTIFICAÇÃO =====
  
  // Formatar CPF/CNPJ durante digitação
  const handleDocumentChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.substring(0, 14);
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    setSearchDocument(value);
  };

  // Buscar usuário por CPF/CNPJ
  const searchUserByDocument = async () => {
    if (!searchDocument || searchDocument.replace(/[^\d]/g, '').length < 11) {
      toast.error('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido');
      return;
    }

    try {
      setSearchingUser(true);
      const token = localStorage.getItem('token');
      const cleanDocument = searchDocument.replace(/[^\d]/g, '');
      
      const response = await axios.get(`${API}/users/search-by-document/${cleanDocument}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.user) {
        setFoundUser(response.data.user);
        setNotificacao(prev => ({ ...prev, recipient_id: response.data.user.id }));
        toast.success(`Usuário encontrado: ${response.data.user.full_name}`);
      } else {
        setFoundUser(null);
        toast.error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setFoundUser(null);
      toast.error('Erro ao buscar usuário. Verifique o CPF/CNPJ');
    } finally {
      setSearchingUser(false);
    }
  };

  // Upload de anexo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      toast.error('Apenas imagens (PNG, JPG) ou PDF são permitidos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAttachmentFile(file);
      setAttachmentPreview(base64);
      setNotificacao(prev => ({
        ...prev,
        attachment_type: isPDF ? 'pdf' : 'image',
        attachment_data: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setNotificacao(prev => ({
      ...prev,
      attachment_type: null,
      attachment_data: null
    }));
  };

  // Enviar notificação
  const enviarNotificacao = async () => {
    if (!notificacao.title.trim()) {
      toast.error('Digite um título');
      return;
    }
    if (!notificacao.message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    if (tipoEnvio === 'individual' && !foundUser) {
      toast.error('Busque e selecione um destinatário');
      return;
    }
    if (tipoEnvio === 'franquias' && franquiasSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma franquia');
      return;
    }

    try {
      setNotificacaoLoading(true);
      const token = localStorage.getItem('token');

      let endpoint = `${API}/labelview/notifications`;
      let payload = notificacao;

      if (tipoEnvio === 'broadcast') {
        endpoint = `${API}/master/notifications/broadcast`;
        payload = { title: notificacao.title, message: notificacao.message, priority: notificacao.priority };
      } else if (tipoEnvio === 'franquias') {
        endpoint = `${API}/master/notifications/franquias`;
        payload = { 
          title: notificacao.title, 
          message: notificacao.message, 
          priority: notificacao.priority,
          franquia_ids: franquiasSelecionadas
        };
      }

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        let successMsg = '';
        if (tipoEnvio === 'broadcast') {
          successMsg = `Notificação enviada para ${response.data.recipients_count || 'todos os'} usuários!`;
        } else if (tipoEnvio === 'franquias') {
          successMsg = `Notificação enviada para ${response.data.recipients_count || 0} usuários de ${franquiasSelecionadas.length} franquia(s)!`;
        } else {
          successMsg = `Notificação enviada para ${foundUser?.full_name}!`;
        }
        toast.success(successMsg);
        
        // Resetar formulário
        setNotificacao({
          title: '',
          message: '',
          priority: 'media',
          attachment_type: null,
          attachment_data: null,
          recipient_id: null
        });
        setFoundUser(null);
        setSearchDocument('');
        setAttachmentFile(null);
        setAttachmentPreview(null);
        setFranquiasSelecionadas([]);
        setTemplateSelecionado(null);
      } else {
        toast.error(response.data.error || 'Erro ao enviar notificação');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar notificação');
    } finally {
      setNotificacaoLoading(false);
    }
  };

  // Verificar permissão
  if (!user?.is_labelview_master && user?.user_type !== 'labelview_master') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
            <p className="text-gray-500">Este painel é exclusivo para administradores da plataforma Transmill.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const franquiasFiltradas = franquias.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#293618] to-[#3d4f24] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                Painel Admin - Transmill Plataforma
              </h1>
              <p className="text-white/80 mt-1">Gestão centralizada de todas as franquias</p>
            </div>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10"
              onClick={carregarDados}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-14 bg-transparent rounded-none border-0 p-0">
              <TabsTrigger 
                value="dashboard" 
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="franquias"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Franquias
              </TabsTrigger>
              <TabsTrigger 
                value="financeiro"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger 
                value="taxas"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Taxas
              </TabsTrigger>
              <TabsTrigger 
                value="notificacoes"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger 
                value="suporte"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <Shield className="h-4 w-4 mr-2" />
                Suporte
              </TabsTrigger>
              <TabsTrigger 
                value="configuracoes"
                className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#293618] data-[state=active]:bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#293618] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Franquias Ativas</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.franquiasAtivas}</p>
                          <p className="text-xs text-gray-400 mt-1">de {stats.totalFranquias} total</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Saldo Bolsão</p>
                          <p className="text-3xl font-bold text-green-600">
                            R$ {(stats.saldoBolsao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">XGate Master</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <PiggyBank className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Clientes</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.totalClientes || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">em todas franquias</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Receita do Mês</p>
                          <p className="text-3xl font-bold text-gray-800">
                            R$ {(stats.receitaMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12% vs mês anterior
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Franquias Resumo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Franquias por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {franquias.slice(0, 5).map((franquia) => (
                          <div key={franquia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: franquia.cor_primaria || '#1a59ad' }}
                              />
                              <div>
                                <p className="font-medium">{franquia.nome}</p>
                                <p className="text-xs text-gray-500">{franquia.estado} - {(franquia.cidades || []).join(', ')}</p>
                              </div>
                            </div>
                            <Badge variant={franquia.ativo ? 'default' : 'secondary'}>
                              {franquia.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {franquias.length > 5 && (
                        <Button 
                          variant="ghost" 
                          className="w-full mt-3"
                          onClick={() => setActiveTab('franquias')}
                        >
                          Ver todas ({franquias.length})
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Movimentações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {movimentacoes.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Nenhuma movimentação recente</p>
                        ) : (
                          movimentacoes.slice(0, 5).map((mov, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                                  {mov.tipo === 'entrada' ? (
                                    <ArrowDownRight className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{mov.descricao}</p>
                                  <p className="text-xs text-gray-500">{mov.franquia_nome}</p>
                                </div>
                              </div>
                              <span className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                {mov.tipo === 'entrada' ? '+' : '-'}R$ {mov.valor?.toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full mt-3"
                        onClick={() => setActiveTab('financeiro')}
                      >
                        Ver todas movimentações
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Franquias */}
            {activeTab === 'franquias' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Buscar franquias por nome, estado ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={gerarLinkCadastro}
                      className="border-[#293618] text-[#293618] hover:bg-[#293618] hover:text-white"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Gerar Link de Cadastro
                    </Button>
                    <Button className="bg-[#293618]" onClick={() => setShowNovaFranquia(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Franquia
                    </Button>
                  </div>
                </div>

                {/* Agrupar por Estado */}
                {(() => {
                  // Agrupar franquias por estado
                  const franquiasPorEstado = franquiasFiltradas.reduce((acc, franquia) => {
                    const estado = franquia.estado || 'Sem Estado';
                    if (!acc[estado]) acc[estado] = [];
                    acc[estado].push(franquia);
                    return acc;
                  }, {});

                  const estados = Object.keys(franquiasPorEstado).sort();

                  if (estados.length === 0) {
                    return (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhuma franquia encontrada</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return estados.map((estado) => (
                    <div key={estado} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#293618]" />
                        <h3 className="text-lg font-semibold text-gray-800">{estado}</h3>
                        <Badge variant="outline">{franquiasPorEstado[estado].length} franquia(s)</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {franquiasPorEstado[estado].map((franquia) => {
                          const urlAcesso = `${window.location.origin}/franquia/${franquia.slug}/login`;
                          
                          return (
                            <Card key={franquia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                              <div 
                                className="h-2" 
                                style={{ backgroundColor: franquia.cor_primaria || '#1a59ad' }}
                              />
                              <CardContent className="p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                  {/* Info Principal */}
                                  <div className="flex items-start gap-4">
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0"
                                      style={{ backgroundColor: franquia.cor_primaria || '#1a59ad' }}
                                    >
                                      {franquia.nome?.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-800">{franquia.nome}</h4>
                                        <Badge variant={franquia.ativo ? 'default' : 'secondary'} className="text-xs">
                                          {franquia.ativo ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {(franquia.cidades || []).join(', ') || 'Todas as cidades'} - {franquia.estado}
                                      </p>
                                      {franquia.email_contato && (
                                        <p className="text-sm text-gray-500">
                                          📧 {franquia.email_contato}
                                        </p>
                                      )}
                                      {franquia.telefone_contato && (
                                        <p className="text-sm text-gray-500">
                                          📱 {franquia.telefone_contato}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* URL de Acesso */}
                                  <div className="flex-1 lg:max-w-md">
                                    <Label className="text-xs text-gray-500 mb-1 block">URL de Acesso da Franquia:</Label>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate border">
                                        {urlAcesso}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => {
                                          navigator.clipboard.writeText(urlAcesso);
                                          toast.success('URL copiada!');
                                        }}
                                        data-testid={`copy-url-${franquia.slug}`}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Ações */}
                                  <div className="flex gap-2 shrink-0">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => window.open(`/franquia/${franquia.slug}/login`, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Abrir
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => abrirEditarFranquia(franquia)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Editar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Financeiro */}
            {activeTab === 'financeiro' && (
              <div className="space-y-6">
                {/* Resumo Financeiro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Saldo Bolsão XGate</p>
                          <p className="text-3xl font-bold mt-1">
                            R$ {(stats.saldoBolsao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <PiggyBank className="h-10 w-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500">Entradas (Mês)</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(stats.entradasMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <ArrowDownRight className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500">Saídas (Mês)</p>
                          <p className="text-2xl font-bold text-red-600">
                            R$ {(stats.saidasMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <ArrowUpRight className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* USDT - Resumo Cripto */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Saldo USDT</p>
                          <p className="text-2xl font-bold mt-1">
                            {(stats.saldoUsdt || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                          </p>
                        </div>
                        <Bitcoin className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500">Depósitos USDT (Mês)</p>
                          <p className="text-xl font-bold text-green-600">
                            +{(stats.entradasUsdtMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                          </p>
                        </div>
                        <ArrowDownRight className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500">Saídas USDT (Mês)</p>
                          <p className="text-xl font-bold text-red-600">
                            -{(stats.saidasUsdtMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                          </p>
                        </div>
                        <ArrowUpRight className="h-6 w-6 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500">Conversões (Mês)</p>
                          <p className="text-sm font-medium text-gray-700">
                            USDT→BRL: {stats.conversoesUsdtMes?.usdt_para_brl?.quantidade || 0}
                          </p>
                          <p className="text-sm font-medium text-gray-700">
                            BRL→USDT: {stats.conversoesUsdtMes?.brl_para_usdt?.quantidade || 0}
                          </p>
                        </div>
                        <RefreshCw className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Botões de Ação - BRL e USDT */}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={() => setShowNovaMovimentacao(true)} className="bg-[#293618]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Movimentação BRL
                  </Button>
                  <Button onClick={() => abrirModalUsdt('movimentacao')} className="bg-blue-600 hover:bg-blue-700">
                    <Bitcoin className="h-4 w-4 mr-2" />
                    Gerenciar USDT
                  </Button>
                </div>

                {/* Card de Cotação USDT em Tempo Real */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Bitcoin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cotação USDT/BRL</p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-blue-600">
                              R$ {cotacaoUsdt.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {cotacaoUsdt.fonte}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={carregarCotacaoUsdt}
                        disabled={cotacaoUsdt.loading}
                        className="border-blue-300 text-blue-600"
                      >
                        <RefreshCw className={`h-4 w-4 ${cotacaoUsdt.loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Saldos por Franquia */}
                <Card>
                  <CardHeader>
                    <CardTitle>Saldos por Franquia</CardTitle>
                    <CardDescription>Carteira digital de cada franquia no bolsão</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {franquiasSaldos.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhuma franquia cadastrada</p>
                      ) : (
                        franquiasSaldos.map((franquia) => (
                          <div key={franquia.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: franquia.cor_primaria || '#1a59ad' }}
                              >
                                {franquia.nome?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{franquia.nome}</p>
                                <p className="text-sm text-gray-500">{franquia.slug}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-lg ${franquia.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                R$ {(franquia.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">Saldo disponível</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setFranquiaSelecionada(franquia)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Movimentações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                    <CardDescription>Todas as transações do bolsão</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {movimentacoes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma movimentação encontrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {movimentacoes.map((mov, index) => (
                          <div key={mov.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {mov.tipo === 'entrada' ? (
                                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{mov.descricao || 'Movimentação'}</p>
                                <p className="text-xs text-gray-500">
                                  {mov.franquia_nome || 'Geral'} • {mov.data} • {mov.origem}
                                </p>
                              </div>
                            </div>
                            <span className={`font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'entrada' ? '+' : '-'}R$ {(mov.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Taxas */}
            {activeTab === 'taxas' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Configuração de Taxas</CardTitle>
                        <CardDescription>Defina as taxas padrão para as franquias</CardDescription>
                      </div>
                      {!editandoTaxas ? (
                        <Button onClick={() => setEditandoTaxas(true)} className="bg-[#293618]">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Taxas
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditandoTaxas(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={salvarTaxas} className="bg-green-600">
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Taxas de Transação</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Taxa PIX</span>
                            {editandoTaxas ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-right"
                                  value={taxas.taxa_pix}
                                  onChange={(e) => setTaxas({...taxas, taxa_pix: parseFloat(e.target.value) || 0})}
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span className="font-medium">{taxas.taxa_pix}%</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Taxa Cartão Crédito</span>
                            {editandoTaxas ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-right"
                                  value={taxas.taxa_cartao}
                                  onChange={(e) => setTaxas({...taxas, taxa_cartao: parseFloat(e.target.value) || 0})}
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span className="font-medium">{taxas.taxa_cartao}%</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Taxa Boleto</span>
                            {editandoTaxas ? (
                              <div className="flex items-center gap-2">
                                <span>R$</span>
                                <Input
                                  type="number"
                                  step="0.50"
                                  className="w-20 text-right"
                                  value={taxas.taxa_boleto}
                                  onChange={(e) => setTaxas({...taxas, taxa_boleto: parseFloat(e.target.value) || 0})}
                                />
                              </div>
                            ) : (
                              <span className="font-medium">R$ {taxas.taxa_boleto?.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Repasses</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Repasse Franquia</span>
                            {editandoTaxas ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="1"
                                  className="w-20 text-right"
                                  value={taxas.repasse_franquia}
                                  onChange={(e) => setTaxas({...taxas, repasse_franquia: parseFloat(e.target.value) || 0})}
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span className="font-medium">{taxas.repasse_franquia}%</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Taxa Plataforma</span>
                            {editandoTaxas ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="1"
                                  className="w-20 text-right"
                                  value={taxas.taxa_plataforma}
                                  onChange={(e) => setTaxas({...taxas, taxa_plataforma: parseFloat(e.target.value) || 0})}
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span className="font-medium">{taxas.taxa_plataforma}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Taxas por Franquia */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Taxas Personalizadas por Franquia</CardTitle>
                        <CardDescription>Franquias com taxas diferentes do padrão</CardDescription>
                      </div>
                      <Button onClick={() => setShowTaxaPersonalizada(true)} className="bg-[#293618]">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Taxa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {taxasPersonalizadas.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhuma franquia com taxas personalizadas
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {taxasPersonalizadas.map((taxa) => (
                          <div key={taxa.franquia_id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-800">{taxa.franquia_nome}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">PIX:</span>
                                    <span className="ml-1 font-medium">{taxa.taxa_pix}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Cartão:</span>
                                    <span className="ml-1 font-medium">{taxa.taxa_cartao}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Boleto:</span>
                                    <span className="ml-1 font-medium">R$ {taxa.taxa_boleto?.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Repasse:</span>
                                    <span className="ml-1 font-medium">{taxa.repasse_franquia}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Plataforma:</span>
                                    <span className="ml-1 font-medium">{taxa.taxa_plataforma}%</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => excluirTaxaPersonalizada(taxa.franquia_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notificações */}
            {activeTab === 'notificacoes' && (
              <div className="space-y-6">
                {/* Tipo de Envio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Central de Notificações
                    </CardTitle>
                    <CardDescription>
                      Envie notificações push para usuários da plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Seletor de Tipo */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                      <Button
                        variant={tipoEnvio === 'individual' ? 'default' : 'outline'}
                        className={tipoEnvio === 'individual' ? 'bg-[#293618]' : ''}
                        onClick={() => setTipoEnvio('individual')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Individual
                      </Button>
                      <Button
                        variant={tipoEnvio === 'franquias' ? 'default' : 'outline'}
                        className={tipoEnvio === 'franquias' ? 'bg-[#293618]' : ''}
                        onClick={() => setTipoEnvio('franquias')}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Por Franquia
                      </Button>
                      <Button
                        variant={tipoEnvio === 'broadcast' ? 'default' : 'outline'}
                        className={tipoEnvio === 'broadcast' ? 'bg-[#293618]' : ''}
                        onClick={() => setTipoEnvio('broadcast')}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Todos
                      </Button>
                    </div>

                    {/* Templates de Notificação */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4" />
                        Templates Rápidos
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {templatesNotificacao.map((template) => {
                          const IconComponent = {
                            'Tag': Tag,
                            'AlertCircle': AlertCircle,
                            'Sparkles': Sparkles,
                            'Bell': Bell,
                            'Heart': Heart,
                            'Edit': Edit
                          }[template.icon] || FileText;
                          
                          return (
                            <button
                              key={template.id}
                              onClick={() => aplicarTemplate(template)}
                              className={`p-3 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                                templateSelecionado === template.id
                                  ? 'border-[#293618] bg-[#293618]/10 ring-2 ring-[#293618]/20'
                                  : `${template.cor} border-transparent hover:border-gray-300`
                              }`}
                            >
                              <IconComponent className="h-5 w-5 mx-auto mb-1" />
                              <span className="text-xs font-medium">{template.nome}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seletor de Franquias */}
                    {tipoEnvio === 'franquias' && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4" />
                          Selecione as Franquias Destinatárias
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {franquias.map((franquia) => (
                            <label 
                              key={franquia.id} 
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                franquiasSelecionadas.includes(franquia.id) 
                                  ? 'bg-blue-100 border border-blue-300' 
                                  : 'bg-white border border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={franquiasSelecionadas.includes(franquia.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFranquiasSelecionadas([...franquiasSelecionadas, franquia.id]);
                                  } else {
                                    setFranquiasSelecionadas(franquiasSelecionadas.filter(id => id !== franquia.id));
                                  }
                                }}
                                className="rounded text-[#293618]"
                              />
                              <span className="text-sm truncate">{franquia.nome}</span>
                            </label>
                          ))}
                        </div>
                        {franquiasSelecionadas.length > 0 && (
                          <p className="text-sm text-blue-600 mt-2">
                            {franquiasSelecionadas.length} franquia(s) selecionada(s)
                          </p>
                        )}
                        {franquias.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Nenhuma franquia cadastrada</p>
                        )}
                      </div>
                    )}

                    {/* Busca de Usuário - Individual */}
                    {tipoEnvio === 'individual' && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium">Buscar Destinatário por CPF/CNPJ</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Digite o CPF ou CNPJ"
                            value={searchDocument}
                            onChange={handleDocumentChange}
                            className="flex-1"
                            maxLength={18}
                          />
                          <Button 
                            onClick={searchUserByDocument}
                            disabled={searchingUser}
                            className="bg-[#293618]"
                          >
                            {searchingUser ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {foundUser && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-green-800">{foundUser.full_name}</p>
                              <p className="text-sm text-green-600">{foundUser.email}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setFoundUser(null); setSearchDocument(''); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Broadcast Warning */}
                    {tipoEnvio === 'broadcast' && (
                      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">Envio em Massa</p>
                          <p className="text-sm text-yellow-700">
                            Esta notificação será enviada para TODOS os usuários da plataforma que possuem push habilitado.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Formulário de Notificação */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título da Notificação *</Label>
                        <Input
                          placeholder="Ex: Novidade na plataforma!"
                          value={notificacao.title}
                          onChange={(e) => setNotificacao({...notificacao, title: e.target.value})}
                          maxLength={50}
                        />
                        <p className="text-xs text-gray-500">{notificacao.title.length}/50 caracteres</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem *</Label>
                        <textarea
                          className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:ring-2 focus:ring-[#293618] focus:border-transparent"
                          placeholder="Digite a mensagem da notificação..."
                          value={notificacao.message}
                          onChange={(e) => setNotificacao({...notificacao, message: e.target.value})}
                          maxLength={200}
                        />
                        <p className="text-xs text-gray-500">{notificacao.message.length}/200 caracteres</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <div className="flex gap-2">
                          {['baixa', 'media', 'alta'].map((p) => (
                            <Button
                              key={p}
                              type="button"
                              variant={notificacao.priority === p ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNotificacao({...notificacao, priority: p})}
                              className={notificacao.priority === p ? (
                                p === 'alta' ? 'bg-red-600' : p === 'media' ? 'bg-yellow-600' : 'bg-green-600'
                              ) : ''}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Anexo - Apenas Individual */}
                      {tipoEnvio === 'individual' && (
                        <div className="space-y-2">
                          <Label>Anexo (opcional)</Label>
                          {!attachmentPreview ? (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                              />
                              <label 
                                htmlFor="file-upload" 
                                className="cursor-pointer flex flex-col items-center gap-2"
                              >
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Clique para enviar imagem ou PDF (máx. 5MB)
                                </span>
                              </label>
                            </div>
                          ) : (
                            <div className="relative p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {notificacao.attachment_type === 'image' ? (
                                  <img 
                                    src={attachmentPreview} 
                                    alt="Preview" 
                                    className="h-16 w-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-16 w-16 bg-red-100 rounded flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-red-600" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{attachmentFile?.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(attachmentFile?.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={removeAttachment}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão Enviar */}
                      <Button
                        className="w-full bg-[#293618] hover:bg-[#3d4f24]"
                        onClick={enviarNotificacao}
                        disabled={notificacaoLoading || !notificacao.title || !notificacao.message || (tipoEnvio === 'individual' && !foundUser)}
                      >
                        {notificacaoLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {tipoEnvio === 'broadcast' ? 'Enviar para Todos' : 'Enviar Notificação'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Suporte - Sistema de Chamados */}
            {activeTab === 'suporte' && (
              <SuporteMasterPanel API={API} />
            )}

            {/* Configurações */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Globais</CardTitle>
                    <CardDescription>Configurações que afetam todas as franquias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Modo de Manutenção</p>
                          <p className="text-sm text-gray-500">Desativa acesso de franquias</p>
                        </div>
                        <Badge variant="secondary">Desativado</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Cadastro de Novas Franquias</p>
                          <p className="text-sm text-gray-500">Permite criar novas franquias</p>
                        </div>
                        <Badge variant="default">Ativado</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Integração XGate</p>
                          <p className="text-sm text-gray-500">Gateway de pagamentos PIX</p>
                        </div>
                        <Badge variant="default" className="bg-green-500">Conectado</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Nova Movimentação */}
      {showNovaMovimentacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Nova Movimentação</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNovaMovimentacao(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Registre uma entrada ou saída no bolsão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={novaMovimentacao.tipo === 'entrada' ? 'default' : 'outline'}
                      className={novaMovimentacao.tipo === 'entrada' ? 'bg-green-600 flex-1' : 'flex-1'}
                      onClick={() => setNovaMovimentacao({...novaMovimentacao, tipo: 'entrada'})}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      Entrada
                    </Button>
                    <Button
                      type="button"
                      variant={novaMovimentacao.tipo === 'saida' ? 'default' : 'outline'}
                      className={novaMovimentacao.tipo === 'saida' ? 'bg-red-600 flex-1' : 'flex-1'}
                      onClick={() => setNovaMovimentacao({...novaMovimentacao, tipo: 'saida'})}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Saída
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novaMovimentacao.valor}
                    onChange={(e) => setNovaMovimentacao({...novaMovimentacao, valor: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição da movimentação"
                    value={novaMovimentacao.descricao}
                    onChange={(e) => setNovaMovimentacao({...novaMovimentacao, descricao: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Franquia (opcional)</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={novaMovimentacao.franquia_id}
                    onChange={(e) => setNovaMovimentacao({...novaMovimentacao, franquia_id: e.target.value})}
                  >
                    <option value="">Geral (Plataforma)</option>
                    {franquias.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Origem</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={novaMovimentacao.origem}
                    onChange={(e) => setNovaMovimentacao({...novaMovimentacao, origem: e.target.value})}
                  >
                    <option value="manual">Manual</option>
                    <option value="pagamento_pix">Pagamento PIX</option>
                    <option value="pagamento_cartao">Pagamento Cartão</option>
                    <option value="pagamento_boleto">Pagamento Boleto</option>
                    <option value="repasse">Repasse</option>
                    <option value="taxa">Taxa</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNovaMovimentacao(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className={`flex-1 ${novaMovimentacao.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}
                    onClick={registrarMovimentacao}
                  >
                    Registrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Taxa Personalizada */}
      {showTaxaPersonalizada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Nova Taxa Personalizada</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowTaxaPersonalizada(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Defina taxas específicas para uma franquia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Franquia *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={taxaFranquiaForm.franquia_id}
                    onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, franquia_id: e.target.value})}
                  >
                    <option value="">Selecione uma franquia</option>
                    {franquias
                      .filter(f => !taxasPersonalizadas.find(t => t.franquia_id === f.id))
                      .map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa PIX (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={`Padrão: ${taxas.taxa_pix}%`}
                      value={taxaFranquiaForm.taxa_pix}
                      onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, taxa_pix: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa Cartão (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={`Padrão: ${taxas.taxa_cartao}%`}
                      value={taxaFranquiaForm.taxa_cartao}
                      onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, taxa_cartao: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa Boleto (R$)</Label>
                    <Input
                      type="number"
                      step="0.50"
                      placeholder={`Padrão: ${taxas.taxa_boleto}`}
                      value={taxaFranquiaForm.taxa_boleto}
                      onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, taxa_boleto: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repasse (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder={`Padrão: ${taxas.repasse_franquia}%`}
                      value={taxaFranquiaForm.repasse_franquia}
                      onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, repasse_franquia: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plataforma (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder={`Padrão: ${taxas.taxa_plataforma}%`}
                      value={taxaFranquiaForm.taxa_plataforma}
                      onChange={(e) => setTaxaFranquiaForm({...taxaFranquiaForm, taxa_plataforma: e.target.value})}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Deixe em branco para usar o valor padrão configurado nas taxas globais.
                </p>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowTaxaPersonalizada(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 bg-[#293618]"
                    onClick={salvarTaxaPersonalizada}
                    disabled={salvandoTaxaPersonalizada || !taxaFranquiaForm.franquia_id}
                  >
                    {salvandoTaxaPersonalizada ? 'Salvando...' : 'Salvar Taxa'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edição de Franquia com Upload de Logo */}
      {showEditFranquia && editingFranquia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Editar Franquia
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowEditFranquia(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Atualize os dados e a identidade visual da franquia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload de Logo */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Logo da Franquia</Label>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div 
                      className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: editingFranquia.cor_primaria || '#1a59ad' }}
                    >
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo" 
                          className="w-full h-full object-contain p-2 bg-white rounded-lg"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {editingFranquia.nome?.charAt(0)}
                        </span>
                      )}
                    </div>
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <RefreshCw className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-500">
                      Faça upload de uma logo para personalizar a franquia. 
                      Formatos aceitos: JPG, PNG, WEBP, SVG. Tamanho máximo: 5MB.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        disabled={uploadingLogo}
                        onClick={() => document.getElementById('logo-upload').click()}
                      >
                        <Upload className="h-4 w-4" />
                        {logoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                      </Button>
                      {logoPreview && (
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          disabled={uploadingLogo}
                          onClick={removerLogo}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Franquia</Label>
                  <Input 
                    value={editingFranquia.nome || ''}
                    onChange={(e) => setEditingFranquia(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input 
                    value={editingFranquia.estado || ''}
                    onChange={(e) => setEditingFranquia(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                    maxLength={2}
                    placeholder="UF"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email de Contato</Label>
                  <Input 
                    type="email"
                    value={editingFranquia.email_contato || ''}
                    onChange={(e) => setEditingFranquia(prev => ({ ...prev, email_contato: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone de Contato</Label>
                  <Input 
                    value={editingFranquia.telefone_contato || ''}
                    onChange={(e) => setEditingFranquia(prev => ({ ...prev, telefone_contato: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <hr />

              {/* Cores */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Identidade Visual</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={editingFranquia.cor_primaria || '#1a59ad'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_primaria: e.target.value }))}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={editingFranquia.cor_primaria || '#1a59ad'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_primaria: e.target.value }))}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={editingFranquia.cor_secundaria || '#ffffff'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={editingFranquia.cor_secundaria || '#ffffff'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={editingFranquia.cor_texto || '#ffffff'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_texto: e.target.value }))}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={editingFranquia.cor_texto || '#ffffff'}
                        onChange={(e) => setEditingFranquia(prev => ({ ...prev, cor_texto: e.target.value }))}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview das cores */}
                <div className="mt-4">
                  <Label className="text-sm text-gray-500 mb-2 block">Preview:</Label>
                  <div 
                    className="p-4 rounded-lg flex items-center gap-4"
                    style={{ backgroundColor: editingFranquia.cor_primaria || '#1a59ad' }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl"
                        style={{ 
                          backgroundColor: editingFranquia.cor_secundaria || '#ffffff',
                          color: editingFranquia.cor_primaria || '#1a59ad'
                        }}
                      >
                        {editingFranquia.nome?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: editingFranquia.cor_texto || '#ffffff' }}
                      >
                        {editingFranquia.nome || 'Nome da Franquia'}
                      </h3>
                      <p 
                        className="text-sm opacity-80"
                        style={{ color: editingFranquia.cor_texto || '#ffffff' }}
                      >
                        Ecossistema de Serviços
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Status da Franquia</Label>
                  <p className="text-sm text-gray-500">Franquias inativas não aparecem para os usuários</p>
                </div>
                <Button
                  variant={editingFranquia.ativo ? 'default' : 'outline'}
                  className={editingFranquia.ativo ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setEditingFranquia(prev => ({ ...prev, ativo: !prev.ativo }))}
                >
                  {editingFranquia.ativo ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ativa
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Inativa
                    </>
                  )}
                </Button>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditFranquia(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-[#293618]" onClick={salvarFranquia}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Nova Franquia */}
      {showNovaFranquia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Cadastrar Nova Franquia
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowNovaFranquia(false); resetNovaFranquiaForm(); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Preencha todos os dados para cadastrar uma nova franquia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seção 1: Dados da Empresa */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#293618]" />
                  Dados da Empresa
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Fantasia *</Label>
                    <Input 
                      value={novaFranquia.nome}
                      onChange={(e) => handleNovaFranquiaChange('nome', e.target.value)}
                      placeholder="Ex: Transmill São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL) *</Label>
                    <Input 
                      value={novaFranquia.slug}
                      onChange={(e) => handleNovaFranquiaChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="transmill-sp"
                    />
                    <p className="text-xs text-gray-500">URL: /franquia/{novaFranquia.slug || 'slug'}/login</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input 
                      value={novaFranquia.razao_social}
                      onChange={(e) => handleNovaFranquiaChange('razao_social', e.target.value)}
                      placeholder="Nome completo da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input 
                      value={novaFranquia.cnpj}
                      onChange={(e) => handleNovaFranquiaChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Input 
                      value={novaFranquia.estado}
                      onChange={(e) => handleNovaFranquiaChange('estado', e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="UF"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Cidades de Atuação</Label>
                    <Input 
                      value={novaFranquia.cidades}
                      onChange={(e) => handleNovaFranquiaChange('cidades', e.target.value)}
                      placeholder="São Paulo, Campinas, Santos (separadas por vírgula)"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Seção 2: Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#293618]" />
                  Endereço
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label>Rua</Label>
                    <Input 
                      value={novaFranquia.endereco.rua}
                      onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input 
                      value={novaFranquia.endereco.numero}
                      onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input 
                      value={novaFranquia.endereco.complemento}
                      onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                      placeholder="Sala 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input 
                      value={novaFranquia.endereco.bairro}
                      onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                      placeholder="Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input 
                      value={novaFranquia.endereco.cep}
                      onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Seção 3: Responsável */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#293618]" />
                  Responsável pela Franquia
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={novaFranquia.responsavel_nome}
                      onChange={(e) => handleNovaFranquiaChange('responsavel_nome', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input 
                      value={novaFranquia.responsavel_cpf}
                      onChange={(e) => handleNovaFranquiaChange('responsavel_cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={novaFranquia.responsavel_telefone}
                      onChange={(e) => handleNovaFranquiaChange('responsavel_telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email de Contato</Label>
                    <Input 
                      type="email"
                      value={novaFranquia.email_contato}
                      onChange={(e) => handleNovaFranquiaChange('email_contato', e.target.value)}
                      placeholder="contato@franquia.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone Comercial</Label>
                    <Input 
                      value={novaFranquia.telefone_contato}
                      onChange={(e) => handleNovaFranquiaChange('telefone_contato', e.target.value)}
                      placeholder="(11) 3333-3333"
                    />
                  </div>
                </div>
              </div>

              <hr />

              {/* Seção 4: Identidade Visual */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Image className="h-5 w-5 text-[#293618]" />
                  Identidade Visual
                </h3>
                
                {/* Logo */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: novaFranquia.cor_primaria }}
                    >
                      {novaFranquiaLogoPreview ? (
                        <img 
                          src={novaFranquiaLogoPreview} 
                          alt="Logo" 
                          className="w-full h-full object-contain p-2 bg-white rounded-lg"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {novaFranquia.nome?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-500">Upload da logo (JPG, PNG, WEBP, SVG - máx. 5MB)</p>
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('nova-franquia-logo').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {novaFranquiaLogoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                    </Button>
                    <input
                      id="nova-franquia-logo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleNovaFranquiaLogoChange}
                    />
                  </div>
                </div>

                {/* Cores */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={novaFranquia.cor_primaria}
                        onChange={(e) => handleNovaFranquiaChange('cor_primaria', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={novaFranquia.cor_primaria}
                        onChange={(e) => handleNovaFranquiaChange('cor_primaria', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={novaFranquia.cor_secundaria}
                        onChange={(e) => handleNovaFranquiaChange('cor_secundaria', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={novaFranquia.cor_secundaria}
                        onChange={(e) => handleNovaFranquiaChange('cor_secundaria', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={novaFranquia.cor_texto}
                        onChange={(e) => handleNovaFranquiaChange('cor_texto', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={novaFranquia.cor_texto}
                        onChange={(e) => handleNovaFranquiaChange('cor_texto', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4">
                  <Label className="text-sm text-gray-500 mb-2 block">Preview:</Label>
                  <div 
                    className="p-4 rounded-lg flex items-center gap-4"
                    style={{ backgroundColor: novaFranquia.cor_primaria }}
                  >
                    {novaFranquiaLogoPreview ? (
                      <img src={novaFranquiaLogoPreview} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl"
                        style={{ 
                          backgroundColor: novaFranquia.cor_secundaria,
                          color: novaFranquia.cor_primaria
                        }}
                      >
                        {novaFranquia.nome?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: novaFranquia.cor_texto }}
                      >
                        {novaFranquia.nome || 'Nome da Franquia'}
                      </h3>
                      <p 
                        className="text-sm opacity-80"
                        style={{ color: novaFranquia.cor_texto }}
                      >
                        Ecossistema de Serviços
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Seção 5: Documentos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#293618]" />
                  Documentos
                </h3>
                <p className="text-sm text-gray-500">
                  Envie os documentos necessários para cadastro da franquia (PDF, JPG, PNG - máx. 10MB cada)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Contrato Social */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-blue-600" />
                      <Label className="font-medium">Contrato Social *</Label>
                    </div>
                    <p className="text-xs text-gray-500">Última alteração consolidada</p>
                    {novaFranquiaDocPreviews.contrato_social ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {typeof novaFranquiaDocPreviews.contrato_social === 'string' && novaFranquiaDocPreviews.contrato_social.startsWith('data:') 
                          ? 'Imagem enviada' 
                          : novaFranquiaDocPreviews.contrato_social}
                      </div>
                    ) : null}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => document.getElementById('doc-contrato-social').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {novaFranquiaDocs.contrato_social ? 'Alterar' : 'Enviar'}
                    </Button>
                    <input
                      id="doc-contrato-social"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleNovaFranquiaDocChange('contrato_social', e)}
                    />
                  </div>

                  {/* Comprovante de Endereço */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <Label className="font-medium">Comprovante de Endereço *</Label>
                    </div>
                    <p className="text-xs text-gray-500">Conta de luz, água ou telefone</p>
                    {novaFranquiaDocPreviews.comprovante_endereco ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {typeof novaFranquiaDocPreviews.comprovante_endereco === 'string' && novaFranquiaDocPreviews.comprovante_endereco.startsWith('data:') 
                          ? 'Imagem enviada' 
                          : novaFranquiaDocPreviews.comprovante_endereco}
                      </div>
                    ) : null}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => document.getElementById('doc-comprovante-endereco').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {novaFranquiaDocs.comprovante_endereco ? 'Alterar' : 'Enviar'}
                    </Button>
                    <input
                      id="doc-comprovante-endereco"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleNovaFranquiaDocChange('comprovante_endereco', e)}
                    />
                  </div>

                  {/* Documento do Responsável */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <Label className="font-medium">Documento do Responsável *</Label>
                    </div>
                    <p className="text-xs text-gray-500">RG, CNH ou Passaporte</p>
                    {novaFranquiaDocPreviews.documento_responsavel ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {typeof novaFranquiaDocPreviews.documento_responsavel === 'string' && novaFranquiaDocPreviews.documento_responsavel.startsWith('data:') 
                          ? 'Imagem enviada' 
                          : novaFranquiaDocPreviews.documento_responsavel}
                      </div>
                    ) : null}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => document.getElementById('doc-responsavel').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {novaFranquiaDocs.documento_responsavel ? 'Alterar' : 'Enviar'}
                    </Button>
                    <input
                      id="doc-responsavel"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleNovaFranquiaDocChange('documento_responsavel', e)}
                    />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowNovaFranquia(false); resetNovaFranquiaForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-[#293618]" 
                  onClick={criarNovaFranquia}
                  disabled={salvandoNovaFranquia || !novaFranquia.nome || !novaFranquia.slug || !novaFranquia.estado}
                >
                  {salvandoNovaFranquia ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Cadastrar Franquia
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Link de Cadastro */}
      {showLinkCadastro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Link de Cadastro de Franquia
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowLinkCadastro(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Envie este link para o interessado em abrir uma franquia. 
                Ele poderá preencher todos os dados necessários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm text-gray-500 mb-2 block">Link para compartilhar:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={linkCadastro}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copiarLinkCadastro}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-2">O que o interessado poderá fazer:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Preencher dados da empresa (CNPJ, Razão Social)</li>
                  <li>Informar endereço completo</li>
                  <li>Enviar documentos necessários</li>
                  <li>Fazer upload da logo</li>
                  <li>Escolher paleta de cores</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowLinkCadastro(false)}>
                  Fechar
                </Button>
                <Button 
                  className="flex-1 bg-[#293618]"
                  onClick={() => {
                    const text = `Olá! Segue o link para cadastro de franquia Transmill:\n\n${linkCadastro}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Gerenciamento USDT */}
      {showUsdtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-blue-600" />
                  Gerenciamento USDT
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowUsdtModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Registre depósitos, saques e conversões de USDT
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Cotação Atual */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Cotação Atual USDT/BRL</p>
                    <p className="text-3xl font-bold">
                      R$ {cotacaoUsdt.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-200">
                      Fonte: {cotacaoUsdt.fonte} {cotacaoUsdt.atualizado_em && `• ${new Date(cotacaoUsdt.atualizado_em).toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={carregarCotacaoUsdt}
                    className="text-white hover:bg-blue-400"
                    disabled={cotacaoUsdt.loading}
                  >
                    <RefreshCw className={`h-5 w-5 ${cotacaoUsdt.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Tabs para tipo de operação */}
              <Tabs value={usdtModalType} onValueChange={setUsdtModalType} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="movimentacao" className="gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Movimentação
                  </TabsTrigger>
                  <TabsTrigger value="conversao" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Conversão
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                {/* Tab Movimentação (Entrada/Saída) */}
                <TabsContent value="movimentacao" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Registrar Movimentação USDT</CardTitle>
                      <CardDescription>Registre depósitos ou saques de USDT</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Movimentação</Label>
                          <Select 
                            value={novaMovimentacaoUsdt.tipo} 
                            onValueChange={(v) => setNovaMovimentacaoUsdt(prev => ({ ...prev, tipo: v }))}
                          >
                            <SelectTrigger data-testid="usdt-tipo-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada (Depósito)</SelectItem>
                              <SelectItem value="saida">Saída (Saque/Transferência)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Origem</Label>
                          <Select 
                            value={novaMovimentacaoUsdt.origem} 
                            onValueChange={(v) => setNovaMovimentacaoUsdt(prev => ({ ...prev, origem: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposito_xgate">Depósito XGate</SelectItem>
                              <SelectItem value="transferencia_externa">Transferência Externa</SelectItem>
                              <SelectItem value="compra">Compra Direta</SelectItem>
                              <SelectItem value="conversao">Conversão BRL→USDT</SelectItem>
                              <SelectItem value="ajuste">Ajuste Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor (USDT)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={novaMovimentacaoUsdt.valor}
                            onChange={(e) => setNovaMovimentacaoUsdt(prev => ({ ...prev, valor: e.target.value }))}
                            data-testid="usdt-valor-input"
                          />
                          {novaMovimentacaoUsdt.valor && (
                            <p className="text-xs text-gray-500">
                              ≈ R$ {(parseFloat(novaMovimentacaoUsdt.valor) * cotacaoUsdt.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input
                            placeholder="Ex: Depósito via XGate"
                            value={novaMovimentacaoUsdt.descricao}
                            onChange={(e) => setNovaMovimentacaoUsdt(prev => ({ ...prev, descricao: e.target.value }))}
                          />
                        </div>
                      </div>

                      {(novaMovimentacaoUsdt.tipo === 'saida' || novaMovimentacaoUsdt.origem === 'transferencia_externa') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Wallet Externa (opcional)</Label>
                            <Input
                              placeholder="0x... ou TRC20..."
                              value={novaMovimentacaoUsdt.wallet_externa}
                              onChange={(e) => setNovaMovimentacaoUsdt(prev => ({ ...prev, wallet_externa: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>TX Hash (opcional)</Label>
                            <Input
                              placeholder="Hash da transação"
                              value={novaMovimentacaoUsdt.tx_hash}
                              onChange={(e) => setNovaMovimentacaoUsdt(prev => ({ ...prev, tx_hash: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}

                      <Button 
                        className={`w-full ${novaMovimentacaoUsdt.tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        onClick={registrarMovimentacaoUsdt}
                        disabled={salvandoUsdt || !novaMovimentacaoUsdt.valor}
                        data-testid="usdt-registrar-btn"
                      >
                        {salvandoUsdt ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            {novaMovimentacaoUsdt.tipo === 'entrada' ? (
                              <ArrowDownRight className="h-4 w-4 mr-2" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                            )}
                            Registrar {novaMovimentacaoUsdt.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Conversão USDT↔BRL */}
                <TabsContent value="conversao" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Conversão USDT ↔ BRL</CardTitle>
                      <CardDescription>Registre conversões entre USDT e Real</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Conversão</Label>
                          <Select 
                            value={novaConversaoUsdt.tipo} 
                            onValueChange={(v) => setNovaConversaoUsdt(prev => ({ ...prev, tipo: v }))}
                          >
                            <SelectTrigger data-testid="conversao-tipo-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conversao_usdt_brl">USDT → BRL</SelectItem>
                              <SelectItem value="conversao_brl_usdt">BRL → USDT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cotação Utilizada</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={novaConversaoUsdt.cotacao}
                            onChange={(e) => setNovaConversaoUsdt(prev => ({ ...prev, cotacao: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">
                              {novaConversaoUsdt.tipo === 'conversao_usdt_brl' ? 'Valor USDT' : 'Valor BRL'}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={novaConversaoUsdt.valor_usdt}
                              onChange={(e) => {
                                const valor = e.target.value;
                                const cotacao = parseFloat(novaConversaoUsdt.cotacao) || cotacaoUsdt.valor;
                                setNovaConversaoUsdt(prev => ({
                                  ...prev,
                                  valor_usdt: valor,
                                  valor_brl: valor ? (parseFloat(valor) * cotacao).toFixed(2) : ''
                                }));
                              }}
                              data-testid="conversao-valor-input"
                            />
                          </div>
                          <div className="flex justify-center">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <RefreshCw className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">
                              {novaConversaoUsdt.tipo === 'conversao_usdt_brl' ? 'Valor BRL' : 'Valor USDT'}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={novaConversaoUsdt.valor_brl}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Input
                          placeholder="Ex: Conversão para pagamento de fornecedor"
                          value={novaConversaoUsdt.descricao}
                          onChange={(e) => setNovaConversaoUsdt(prev => ({ ...prev, descricao: e.target.value }))}
                        />
                      </div>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={registrarConversaoUsdt}
                        disabled={salvandoUsdt || !novaConversaoUsdt.valor_usdt}
                        data-testid="conversao-registrar-btn"
                      >
                        {salvandoUsdt ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Registrar Conversão
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Histórico */}
                <TabsContent value="historico" className="mt-4 space-y-4">
                  {loadingUsdt ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {/* Gráficos de Evolução */}
                      {usdtMovimentacoes.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Gráfico de Linha - Evolução do Saldo */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                Evolução de Movimentações
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={(() => {
                                      // Processar movimentações para o gráfico
                                      const sorted = [...usdtMovimentacoes].reverse();
                                      let saldoAcumulado = 0;
                                      return sorted.map((mov, idx) => {
                                        if (mov.tipo === 'entrada') {
                                          saldoAcumulado += mov.valor || 0;
                                        } else {
                                          saldoAcumulado -= mov.valor || 0;
                                        }
                                        return {
                                          nome: `#${idx + 1}`,
                                          data: mov.data?.split(' ')[0] || '',
                                          saldo: saldoAcumulado,
                                          entrada: mov.tipo === 'entrada' ? mov.valor : 0,
                                          saida: mov.tipo === 'saida' ? mov.valor : 0
                                        };
                                      });
                                    })()}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                      }}
                                      formatter={(value) => [`${value.toFixed(2)} USDT`, 'Saldo']}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="saldo" 
                                      stroke="#3b82f6" 
                                      fillOpacity={1}
                                      fill="url(#colorSaldo)"
                                      strokeWidth={2}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Gráfico de Barras - Entradas vs Saídas */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                Entradas vs Saídas
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={(() => {
                                      // Agrupar por tipo
                                      const entradas = usdtMovimentacoes
                                        .filter(m => m.tipo === 'entrada')
                                        .reduce((acc, m) => acc + (m.valor || 0), 0);
                                      const saidas = usdtMovimentacoes
                                        .filter(m => m.tipo === 'saida')
                                        .reduce((acc, m) => acc + (m.valor || 0), 0);
                                      return [
                                        { tipo: 'Entradas', valor: entradas, fill: '#22c55e' },
                                        { tipo: 'Saídas', valor: saidas, fill: '#ef4444' }
                                      ];
                                    })()}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                      }}
                                      formatter={(value) => [`${value.toFixed(2)} USDT`]}
                                    />
                                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                                      {[
                                        { tipo: 'Entradas', fill: '#22c55e' },
                                        { tipo: 'Saídas', fill: '#ef4444' }
                                      ].map((entry, index) => (
                                        <rect key={`bar-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Movimentações USDT */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                            Movimentações USDT
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {usdtMovimentacoes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Bitcoin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p>Nenhuma movimentação USDT registrada</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                              {usdtMovimentacoes.map((mov, idx) => (
                                <div key={mov.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                                      {mov.tipo === 'entrada' ? (
                                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{mov.descricao || 'Movimentação USDT'}</p>
                                      <p className="text-xs text-gray-500">
                                        {mov.origem} • {mov.data}
                                      </p>
                                      {mov.tx_hash && (
                                        <p className="text-xs text-blue-500 font-mono truncate max-w-[200px]">
                                          TX: {mov.tx_hash}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                    {mov.tipo === 'entrada' ? '+' : '-'}{(mov.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Conversões USDT */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                            Conversões USDT ↔ BRL
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {usdtConversoes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <RefreshCw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p>Nenhuma conversão registrada</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {usdtConversoes.map((conv, idx) => (
                                <div key={conv.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-blue-100">
                                      <RefreshCw className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {conv.tipo === 'conversao_usdt_brl' ? 'USDT → BRL' : 'BRL → USDT'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Cotação: R$ {(conv.cotacao || 0).toFixed(2)} • {conv.data}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-blue-600">
                                      {(conv.valor_usdt || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      R$ {(conv.valor_brl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminFranquiasPanel;
