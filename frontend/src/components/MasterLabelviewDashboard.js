import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
// import ClientesLabelview from './ClientesLabelview'; // Comentado - usando nova tabela em "clientes"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
  UserCircle,
  AlertCircle,
  Truck,
  FileText,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  List,
  ArrowLeft,
  UserPlus,
  HandshakeIcon,
  ChevronDown,
  Warehouse,
  Store,
  RefreshCw,
  User,
  Package,
  Shield,
  Handshake,
  Wrench,
  Users2,
  LogOut,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  Settings,
  Share2,
  Copy,
  Send,
  Bell,
  Car,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Lock,
  Unlock,
  Upload,
  PenTool,
  Gift
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import ColaboradorFormModal from './ColaboradorFormModal';
import UnidadeFormModal from './UnidadeFormModal';
import RegionalFormModal from './RegionalFormModal';
import ConsultorFormModal from './ConsultorFormModal';
import TecnicoFormModal from './TecnicoFormModal';
import TipoFornecedorModal from './TipoFornecedorModal';
import FornecedorFormModal from './FornecedorFormModal';
import EquipamentoFormModal from './EquipamentoFormModal';
import CriarPlanoUnidade from './CriarPlanoUnidade';
import EditarPlanoModal from './EditarPlanoModal';
import TipoVeiculoModal from './TipoVeiculoModal';
import HierarchyVisualization from './HierarchyVisualization';
import LabelviewNotificationBell from './LabelviewNotificationBell';
import SendNotificationModal from './SendNotificationModal';
import TabelaFIPE from './TabelaFIPE';
import TabelaValoresForm from './TabelaValoresForm';
import CotacaoConsultorLabelview from './CotacaoConsultorLabelview';
import ConsultorMenu from './ConsultorMenu';
import RegionalMenu from './RegionalMenu';
import UnidadeMenu from './UnidadeMenu';
import FornecedorMenu from './FornecedorMenu';
import EditProfileLabelview from './EditProfileLabelview';
import MinhaRede from './MinhaRede';
import PWAShareModal from './PWAShareModal';
import CrmKanbanProtecao from './CrmKanbanProtecao';

// 🔔 Componente de Formulário de Notificações
const NotificacaoForm = ({ user, API, headers, unidades, regionais, consultores, fetchUnidades, fetchRegionais, fetchConsultores }) => {
  const [tipoDestinatario, setTipoDestinatario] = useState('');
  const [destinatarioSelecionado, setDestinatarioSelecionado] = useState('');
  const [enviarParaTodos, setEnviarParaTodos] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [clienteCpf, setClienteCpf] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  
  // Push Notifications
  const [enviarPush, setEnviarPush] = useState(false);
  const [pushSubscribersCount, setPushSubscribersCount] = useState(0);
  
  // Buscar quantidade de inscritos no PWA
  useEffect(() => {
    const fetchPushCount = async () => {
      if (user.user_type === 'labelview_unidade') {
        try {
          const response = await axios.get(`${API}/pwa/push/subscribers-count`, { headers });
          if (response.data.success) {
            setPushSubscribersCount(response.data.count);
          }
        } catch (error) {
          console.error('Erro ao buscar inscritos push:', error);
        }
      }
    };
    fetchPushCount();
  }, [user, API, headers]);

  // Determinar opções de destinatário baseado no tipo de usuário
  const getOpcoesDestinatario = () => {
    if (user.is_labelview_master || user.user_type === 'labelview_master') {
      return [
        { value: 'unidade', label: '🏢 Unidades' },
        { value: 'regional', label: '👥 Regionais' },
        { value: 'consultor', label: '👤 Consultores' },
        { value: 'cliente', label: '🧑 Clientes' }
      ];
    }
    if (user.user_type === 'labelview_unidade') {
      return [
        { value: 'regional', label: '👥 Regionais' },
        { value: 'consultor', label: '👤 Consultores' },
        { value: 'cliente', label: '🧑 Clientes' }
      ];
    }
    if (user.user_type === 'labelview_regional') {
      return [
        { value: 'consultor', label: '👤 Consultores' },
        { value: 'cliente', label: '🧑 Clientes' }
      ];
    }
    if (user.user_type === 'labelview_consultor') {
      return [
        { value: 'cliente', label: '🧑 Clientes' }
      ];
    }
    return [];
  };

  // Buscar lista de destinatários quando tipo muda
  useEffect(() => {
    if (tipoDestinatario === 'unidade' && unidades.length === 0) {
      fetchUnidades?.();
    }
    if (tipoDestinatario === 'regional' && regionais.length === 0) {
      fetchRegionais?.();
    }
    if (tipoDestinatario === 'consultor' && consultores.length === 0) {
      fetchConsultores?.();
    }
  }, [tipoDestinatario]);

  // Upload de imagem para Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'notificacoes');

      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.url) {
        setImagemUrl(response.data.url);
        toast.success('Imagem carregada!');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  // Buscar cliente por CPF
  const buscarCliente = async () => {
    if (!clienteCpf || clienteCpf.replace(/\D/g, '').length < 11) {
      toast.error('Digite um CPF válido');
      return;
    }

    setBuscandoCliente(true);
    try {
      const cpfLimpo = clienteCpf.replace(/\D/g, '');
      const response = await axios.get(`${API}/labelview/clientes/buscar-cpf/${cpfLimpo}`, { headers });
      
      if (response.data.success && response.data.cliente) {
        setClienteEncontrado(response.data.cliente);
        setDestinatarioSelecionado(response.data.cliente.id);
        toast.success(`Cliente encontrado: ${response.data.cliente.nome}`);
      } else {
        setClienteEncontrado(null);
        toast.error('Cliente não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      toast.error('Cliente não encontrado');
      setClienteEncontrado(null);
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Enviar notificação
  const enviarNotificacao = async () => {
    if (!titulo.trim()) {
      toast.error('Digite um título');
      return;
    }
    if (!conteudo.trim()) {
      toast.error('Digite o conteúdo');
      return;
    }
    if (!tipoDestinatario && !enviarPush) {
      toast.error('Selecione o tipo de destinatário ou ative Push Notification');
      return;
    }
    if (tipoDestinatario && !enviarParaTodos && !destinatarioSelecionado && tipoDestinatario !== 'cliente') {
      toast.error('Selecione um destinatário ou marque "Enviar para todos"');
      return;
    }
    if (tipoDestinatario === 'cliente' && !clienteEncontrado) {
      toast.error('Busque e selecione um cliente pelo CPF');
      return;
    }

    setEnviando(true);
    let sucessoNotificacao = false;
    let sucessoPush = false;
    
    try {
      // Enviar notificação normal (sistema interno)
      if (tipoDestinatario) {
        const response = await axios.post(`${API}/labelview/notificacoes/enviar`, {
          titulo,
          conteudo,
          imagem_url: imagemUrl,
          tipo_destinatario: tipoDestinatario,
          destinatario_id: enviarParaTodos ? null : destinatarioSelecionado,
          enviar_para_todos: enviarParaTodos
        }, { headers });

        if (response.data.success) {
          sucessoNotificacao = true;
        }
      }
      
      // Enviar Push Notification (apenas para unidades)
      if (enviarPush && user.user_type === 'labelview_unidade') {
        try {
          const pushResponse = await axios.post(`${API}/pwa/push/send`, {
            titulo,
            mensagem: conteudo,
            imagem_url: imagemUrl,
            url_destino: null,
            destinatario_tipo: 'todos'
          }, { headers });
          
          if (pushResponse.data.success) {
            sucessoPush = true;
            toast.success(`📲 Push enviado para ${pushResponse.data.enviadas} clientes do PWA`);
          }
        } catch (pushError) {
          console.error('Erro ao enviar push:', pushError);
          toast.error('Erro ao enviar push notification');
        }
      }

      if (sucessoNotificacao || sucessoPush) {
        if (sucessoNotificacao) {
          toast.success(`✅ Notificação enviada com sucesso!`);
        }
        // Limpar formulário
        setTitulo('');
        setConteudo('');
        setImagemUrl('');
        setTipoDestinatario('');
        setDestinatarioSelecionado('');
        setEnviarParaTodos(false);
        setEnviarPush(false);
        setClienteCpf('');
        setClienteEncontrado(null);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setEnviando(false);
    }
  };

  const getListaDestinatarios = () => {
    if (tipoDestinatario === 'unidade') return unidades;
    if (tipoDestinatario === 'regional') return regionais;
    if (tipoDestinatario === 'consultor') return consultores;
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Push Notification para Clientes do PWA (apenas para Unidades) */}
      {user.user_type === 'labelview_unidade' && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📲</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Push Notification (PWA)</h4>
                <p className="text-sm text-gray-600">
                  {pushSubscribersCount > 0 
                    ? `${pushSubscribersCount} cliente(s) inscrito(s) para receber notificações`
                    : 'Nenhum cliente inscrito ainda'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enviarPush}
                onChange={(e) => setEnviarPush(e.target.checked)}
                className="sr-only peer"
                disabled={pushSubscribersCount === 0}
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${pushSubscribersCount > 0 ? 'peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600' : 'opacity-50 cursor-not-allowed'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
          {enviarPush && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              ✓ Notificação será enviada para os smartphones dos clientes do PWA
            </p>
          )}
        </div>
      )}

      {/* Tipo de Destinatário */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📬 Para quem deseja enviar? (Sistema interno)
        </label>
        <select
          value={tipoDestinatario}
          onChange={(e) => {
            setTipoDestinatario(e.target.value);
            setDestinatarioSelecionado('');
            setEnviarParaTodos(false);
            setClienteEncontrado(null);
          }}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none text-lg"
        >
          <option value="">Selecione o tipo de destinatário</option>
          {getOpcoesDestinatario().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Seleção de Destinatário Específico */}
      {tipoDestinatario && tipoDestinatario !== 'cliente' && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enviarParaTodos}
                onChange={(e) => {
                  setEnviarParaTodos(e.target.checked);
                  if (e.target.checked) setDestinatarioSelecionado('');
                }}
                className="w-5 h-5 rounded border-gray-300 text-[#2fa31c] focus:ring-[#2fa31c]"
              />
              <span className="font-medium">Enviar para TODOS os {tipoDestinatario}s</span>
            </label>
          </div>

          {!enviarParaTodos && (
            <select
              value={destinatarioSelecionado}
              onChange={(e) => setDestinatarioSelecionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none"
            >
              <option value="">Selecione um {tipoDestinatario}</option>
              {getListaDestinatarios().map(item => (
                <option key={item.id} value={item.id}>
                  {item.nome_fantasia || item.full_name || item.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Busca de Cliente por CPF */}
      {tipoDestinatario === 'cliente' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            🔍 Buscar cliente por CPF
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={clienteCpf}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                }
                setClienteCpf(value);
              }}
              placeholder="000.000.000-00"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none"
            />
            <Button
              onClick={buscarCliente}
              disabled={buscandoCliente}
              className="bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)]/80 text-white px-6"
            >
              {buscandoCliente ? '⏳' : '🔍 Buscar'}
            </Button>
          </div>

          {clienteEncontrado && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <p className="font-semibold text-green-800">✅ Cliente encontrado:</p>
              <p className="text-green-700">{clienteEncontrado.nome}</p>
              <p className="text-green-600 text-sm">{clienteEncontrado.email} | {clienteEncontrado.telefone}</p>
            </div>
          )}
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Título da Notificação *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Promoção Especial de Dezembro!"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none"
        />
      </div>

      {/* Conteúdo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          💬 Conteúdo da Mensagem *
        </label>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Digite aqui o conteúdo completo da notificação..."
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none resize-none"
        />
      </div>

      {/* Upload de Imagem */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🖼️ Imagem (opcional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {imagemUrl ? (
            <div className="space-y-3">
              <img src={imagemUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
              <Button
                onClick={() => setImagemUrl('')}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                🗑️ Remover Imagem
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="py-6">
                <Upload size={40} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {uploadingImage ? '⏳ Carregando...' : 'Clique para enviar uma imagem'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Botão Enviar */}
      <Button
        onClick={enviarNotificacao}
        disabled={enviando}
        className="w-full bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] hover:opacity-90 text-white py-4 text-lg font-semibold"
      >
        {enviando ? (
          <>⏳ Enviando...</>
        ) : (
          <>📤 Enviar Notificação</>
        )}
      </Button>
    </div>
  );
};

// 🎁 Componente de Formulário de Cupons de Desconto
const CuponsForm = ({ user, API, headers }) => {
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [percentualDesconto, setPercentualDesconto] = useState(10);
  const [criandoCupom, setCriandoCupom] = useState(false);
  const [cupons, setCupons] = useState([]);
  const [loadingCupons, setLoadingCupons] = useState(true);

  // Carregar cupons ao montar
  useEffect(() => {
    carregarCupons();
  }, []);

  const carregarCupons = async () => {
    try {
      const response = await axios.get(`${API}/labelview/cupons`, { headers });
      if (response.data.success) {
        setCupons(response.data.cupons || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoadingCupons(false);
    }
  };

  const criarCupom = async () => {
    if (!nomeCliente.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }

    setCriandoCupom(true);
    try {
      const response = await axios.post(`${API}/labelview/cupons/criar`, {
        nome_cliente: nomeCliente,
        cpf_cliente: cpfCliente.replace(/\D/g, ''),
        percentual: percentualDesconto
      }, { headers });

      if (response.data.success) {
        toast.success(`✅ Cupom criado: ${response.data.cupom.codigo}`);
        setNomeCliente('');
        setCpfCliente('');
        setPercentualDesconto(10);
        carregarCupons();
      }
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      toast.error('Erro ao criar cupom');
    } finally {
      setCriandoCupom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Criação */}
      <div className="bg-purple-50 p-6 rounded-xl space-y-4">
        <h3 className="text-lg font-bold text-purple-800">🎁 Criar Novo Cupom</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Cliente (opcional)</label>
            <input
              type="text"
              value={cpfCliente}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d)/, '$1.$2');
                  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                }
                setCpfCliente(value);
              }}
              placeholder="000.000.000-00"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Se informado, cupom será válido apenas para este CPF</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Percentual de Desconto: <span className="text-2xl font-bold text-purple-600">{percentualDesconto}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percentualDesconto}
            onChange={(e) => setPercentualDesconto(parseInt(e.target.value))}
            className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100% (Gratuito)</span>
          </div>
        </div>

        <Button
          onClick={criarCupom}
          disabled={criandoCupom}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
        >
          {criandoCupom ? '⏳ Criando...' : '🎁 Gerar Código do Cupom'}
        </Button>
      </div>

      {/* Lista de Cupons */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Meus Cupons</h3>
        
        {loadingCupons ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : cupons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gift size={48} className="mx-auto mb-2 opacity-50" />
            <p>Nenhum cupom criado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Desconto</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {cupons.map(cupom => (
                  <tr key={cupom.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono font-bold">
                        {cupom.codigo}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(cupom.codigo);
                          toast.success('Código copiado!');
                        }}
                      >
                        📋
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-sm">{cupom.nome_cliente || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cupom.percentual === 100 ? 'bg-green-500' : 'bg-purple-500'}>
                        {cupom.percentual}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cupom.usado ? (
                        <Badge className="bg-gray-400">Usado</Badge>
                      ) : (
                        <Badge className="bg-green-500">Disponível</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {new Date(cupom.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MasterLabelviewDashboard = ({ franquiaContext }) => {
  const { user, API, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  // Fix: v2.32.1 - Correção erro removeChild na aba tipo-veiculo
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [systemVersion, setSystemVersion] = useState('Carregando...');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);
  const [showTipoVeiculoDropdown, setShowTipoVeiculoDropdown] = useState(false);
  const [showColaboradoresDropdown, setShowColaboradoresDropdown] = useState(false);
  const [showUnidadesDropdown, setShowUnidadesDropdown] = useState(false);
  const [showRegionaisDropdown, setShowRegionaisDropdown] = useState(false);
  const [showConsultoresDropdown, setShowConsultoresDropdown] = useState(false);
  const [showFornecedoresDropdown, setShowFornecedoresDropdown] = useState(false);
  const [showFornecedorSubDropdown, setShowFornecedorSubDropdown] = useState(false);
  const [showParceirosDropdown, setShowParceirosDropdown] = useState(false);
  const [showTecnicosDropdown, setShowTecnicosDropdown] = useState(false);
  const [showTerceirosDropdown, setShowTerceirosDropdown] = useState(false);
  const [showRastreadoresDropdown, setShowRastreadoresDropdown] = useState(false);
  const [showTabelaDropdown, setShowTabelaDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Estado para modal do PWA de Clientes
  const [showPWAModal, setShowPWAModal] = useState(false);
  
  // Estado para identidade visual da Unidade (Regional/Consultor herdam)
  const [unidadeIdentidade, setUnidadeIdentidade] = useState(null);

  // Cor primária - usa do contexto da franquia OU da unidade OU padrão
  const getCorPrimaria = () => {
    if (franquiaContext?.cor_primaria) return franquiaContext.cor_primaria;
    if (unidadeIdentidade?.cor_primaria) return unidadeIdentidade.cor_primaria;
    if (user?.cor_primaria) return user.cor_primaria;
    return '#1a59ad';
  };
  
  const corPrimaria = getCorPrimaria();

  // Aplicar cor como variável CSS global para uso em todo o dashboard
  useEffect(() => {
    document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
    return () => {
      document.documentElement.style.removeProperty('--cor-primaria');
    };
  }, [corPrimaria]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);
  
  // Buscar versão do sistema
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await axios.get(`${API}/labelview/version-check`);
        setSystemVersion(response.data.version || 'v2.0');
      } catch (error) {
        console.error('Erro ao buscar versão:', error);
        setSystemVersion('v2.0');
      }
    };
    fetchVersion();
  }, [API]);
  
  // States
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [commissionRules, setCommissionRules] = useState({});
  const [clients, setClients] = useState([]);
  
  // Estados locais para URLs dos modelos de documentos
  const [modeloCnhFrenteUrl, setModeloCnhFrenteUrl] = useState(user?.modelo_cnh_frente_url || null);
  const [modeloCnhVersoUrl, setModeloCnhVersoUrl] = useState(user?.modelo_cnh_verso_url || null);
  const [modeloComprovanteUrl, setModeloComprovanteUrl] = useState(user?.modelo_comprovante_url || null);
  const [modeloDutUrl, setModeloDutUrl] = useState(user?.modelo_dut_url || null);
  
  // Sincronizar estados locais quando user mudar
  useEffect(() => {
    if (user) {
      setModeloCnhFrenteUrl(user.modelo_cnh_frente_url || null);
      setModeloCnhVersoUrl(user.modelo_cnh_verso_url || null);
      setModeloComprovanteUrl(user.modelo_comprovante_url || null);
      setModeloDutUrl(user.modelo_dut_url || null);
      
      // Carregar modelos salvos do backend
      const carregarModelos = async () => {
        try {
          const response = await axios.get(`${API}/labelview/modelos-documentos`, { headers });
          if (response.data.success && response.data.modelos) {
            console.log('📄 Modelos carregados:', response.data.modelos);
            response.data.modelos.forEach(modelo => {
              console.log(`🔍 Processando modelo tipo: ${modelo.tipo}`);
              if (modelo.tipo === 'cnh_frente') {
                setModeloCnhFrenteUrl(modelo.url);
                console.log('✅ CNH Frente setada:', modelo.url);
              } else if (modelo.tipo === 'cnh_verso') {
                setModeloCnhVersoUrl(modelo.url);
                console.log('✅ CNH Verso setada:', modelo.url);
              } else if (modelo.tipo === 'comprovante' || modelo.tipo === 'comprovante_endereco') {
                setModeloComprovanteUrl(modelo.url);
                console.log('✅ Comprovante setado:', modelo.url);
              } else if (modelo.tipo === 'dut') {
                setModeloDutUrl(modelo.url);
                console.log('✅ DUT setado:', modelo.url);
              }
            });
          }
        } catch (error) {
          console.error('Erro ao carregar modelos:', error);
        }
      };
      
      carregarModelos();
    }
  }, [user]);
  
  // Buscar identidade visual da Unidade (para Regional e Consultor)
  useEffect(() => {
    const fetchUnidadeIdentidade = async () => {
      // 🔧 CORREÇÃO: Regional, Consultor E Fornecedor usam identidade da unidade
      if ((user.user_type === 'labelview_regional' || user.user_type === 'labelview_consultor' || user.user_type === 'labelview_fornecedor') && user.unidade_id) {
        try {
          console.log('🔍 [DEBUG LAYOUT] Buscando identidade da unidade...');
          console.log('🔍 [DEBUG LAYOUT] user.unidade_id:', user.unidade_id);
          console.log('🔍 [DEBUG LAYOUT] user.user_type:', user.user_type);
          
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API}/labelview/unidades/${user.unidade_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ [DEBUG LAYOUT] Resposta completa da API:', response.data);
          
          if (response.data) {
            const identidade = {
              logo_url: response.data.logo_url,
              nome_fantasia: response.data.nome_fantasia || response.data.name,
              cor_primaria: response.data.cor_primaria || '#1a59ad',
              cor_secundaria: response.data.cor_secundaria || '#2fa31c'
            };
            
            console.log('🎨 [DEBUG LAYOUT] Identidade aplicada:', identidade);
            setUnidadeIdentidade(identidade);
          }
        } catch (error) {
          console.error('❌ [DEBUG LAYOUT] Erro ao buscar identidade da Unidade:', error);
          console.error('❌ [DEBUG LAYOUT] Error details:', error.response?.data);
        }
      } else {
        console.log('⚠️ [DEBUG LAYOUT] Não é Regional/Consultor/Fornecedor ou não tem unidade_id');
        console.log('⚠️ [DEBUG LAYOUT] user_type:', user.user_type);
        console.log('⚠️ [DEBUG LAYOUT] unidade_id:', user.unidade_id);
      }
    };
    
    if (user) {
      fetchUnidadeIdentidade();
    }
  }, [user, API]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [contractTemplates, setContractTemplates] = useState([]);
  const [providers, setProviders] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [filtroConsultores, setFiltroConsultores] = useState('todos'); // 'todos', 'indicados', 'regional'
  const [filtroRegionalConsultores, setFiltroRegionalConsultores] = useState('');
  const [filtroUnidadeConsultores, setFiltroUnidadeConsultores] = useState(''); // 🔧 NOVO: Filtro de unidade para Master
  
  // 🔧 NOVO: Filtros hierárquicos globais para Master (CRM, Clientes, Solicitações)
  const [filtroHierarquicoUnidade, setFiltroHierarquicoUnidade] = useState('');
  const [filtroHierarquicoRegional, setFiltroHierarquicoRegional] = useState('');
  const [filtroHierarquicoConsultor, setFiltroHierarquicoConsultor] = useState('');
  const [fornecedores, setFornecedores] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [terceiros, setTerceiros] = useState([]);
  
  // Clientes Indicados States
  const [clientesIndicados, setClientesIndicados] = useState([]);
  const [clientesIndicadosFiltrados, setClientesIndicadosFiltrados] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [filtroUnidadeClientes, setFiltroUnidadeClientes] = useState('');
  
  // 🔧 NOVO: Modal de Vistoria para aprovar/reprovar
  const [showVistoriaModal, setShowVistoriaModal] = useState(false);
  const [clienteSelecionadoVistoria, setClienteSelecionadoVistoria] = useState(null);
  const [loadingVistoria, setLoadingVistoria] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  
  // 🔔 NOVO: Notificações recebidas
  const [notificacoesRecebidas, setNotificacoesRecebidas] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  
  // CRM States
  const [crmView, setCrmView] = useState('kanban'); // 'kanban' ou 'leads'
  const [crmLeads, setCrmLeads] = useState([]);
  const [activeLeadStatus, setActiveLeadStatus] = useState('ativos'); // 'ativos', 'inativos', 'ambos'
  const [crmProtecoes, setCrmProtecoes] = useState({
    interesse: [],
    negociacao: [],
    aguardando_aprovacao: []
  });
  
  // Filtros Hierárquicos CRM (REMOVIDOS - agora usa filtros globais)
  // ✅ Unificados em: filtroHierarquicoUnidade, filtroHierarquicoRegional, filtroHierarquicoConsultor
  
  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showConsultantModal, setShowConsultantModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showUnidadeModal, setShowUnidadeModal] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showConsultorModal, setShowConsultorModal] = useState(false);
  const [editingConsultor, setEditingConsultor] = useState(null);
  const [showTecnicoModal, setShowTecnicoModal] = useState(false);
  const [showTipoFornecedorModal, setShowTipoFornecedorModal] = useState(false);
  const [showFornecedorModal, setShowFornecedorModal] = useState(false);
  const [showEquipamentoModal, setShowEquipamentoModal] = useState(false);
  const [showTipoVeiculoModal, setShowTipoVeiculoModal] = useState(false);
  const [editTipoFornecedor, setEditTipoFornecedor] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editEquipamento, setEditEquipamento] = useState(null);
  const [editTipoVeiculo, setEditTipoVeiculo] = useState(null);
  const [tiposFornecedor, setTiposFornecedor] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [showCriarPlanoUnidade, setShowCriarPlanoUnidade] = useState(false);
  const [meusPlanos, setMeusPlanos] = useState([]);
  const [tiposVeiculo, setTiposVeiculo] = useState([]); // Sempre inicializar como array vazio
  const [tiposVeiculoLoaded, setTiposVeiculoLoaded] = useState(false); // Flag para saber se já carregou
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [filtroTipoVeiculo, setFiltroTipoVeiculo] = useState('todos');
  const [planoParaEditar, setPlanoParaEditar] = useState(null);
  const [showEditarPlanoModal, setShowEditarPlanoModal] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showPlanosListModal, setShowPlanosListModal] = useState(false);
  const [showFornecedoresListModal, setShowFornecedoresListModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [fornecedorForm, setFornecedorForm] = useState({
    nome_razao_social: '',
    endereco_completo: '',
    cnpj_cpf: '',
    whatsapp: '',
    email: '',
    nome_representante: '',
    servico_oferecido: 'contabilidade'
  });
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, [activeTab]);
  
  // 🔔 NOVO: Carregar notificações ao iniciar e a cada 30 segundos
  useEffect(() => {
    fetchNotificacoesRecebidas();
    const interval = setInterval(fetchNotificacoesRecebidas, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);
  
  // 🔔 Função para buscar notificações recebidas
  const fetchNotificacoesRecebidas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/labelview/notificacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotificacoesRecebidas(response.data.notificacoes || []);
        setNotificacoesNaoLidas(response.data.nao_lidas || 0);
        
        // Se houver notificações não lidas, mostrar toast
        if (response.data.nao_lidas > 0) {
          console.log(`🔔 ${response.data.nao_lidas} notificações não lidas`);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };
  
  // 🔔 Função para marcar notificação como lida
  const marcarNotificacaoComoLida = async (notificacaoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/labelview/notificacoes/${notificacaoId}/lida`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotificacoesRecebidas(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };
  
  // ✅ REMOVIDO: useEffect de carregarFiltrosHierarquicosCRM - usa estados globais
  
  useEffect(() => {
    if (activeTab === 'crm' && crmView === 'leads') {
      fetchCRMData();
    }
  }, [activeLeadStatus]); // ✅ Filtros aplicados via crmLeadsFiltrados (cliente-side)


  const loadData = async () => {
    console.log('🔄 [LOAD DATA] Iniciando - activeTab:', activeTab);
    setLoading(true);
    try {
      console.log('🔄 [LOAD DATA] Processando tab:', activeTab);
      switch (activeTab) {
        case 'dashboard':
          await fetchStats();
          break;
        case 'employees':
          await fetchEmployees();
          break;
        case 'managers':
          await fetchManagers();
          break;
        case 'consultants':
          await fetchConsultants();
          break;
        case 'consultores':
          // 🔧 Aba Consultores (Pessoas > Consultor) - Transmill/Labelview
          console.log('🎯 [TAB CHANGE] Mudando para aba CONSULTORES');
          
          // Apenas Master busca unidades e regionais (Unidade não precisa)
          if (user?.is_labelview_master) {
            await fetchUnidades();
            console.log('🎯 [TAB CHANGE] fetchUnidades concluído');
            await fetchRegionais();
            console.log('🎯 [TAB CHANGE] fetchRegionais concluído');
          } else {
            console.log('🎯 [TAB CHANGE] Unidade não precisa buscar unidades/regionais - pulando');
          }
          
          await fetchConsultores();
          console.log('🎯 [TAB CHANGE] fetchConsultores concluído');
          break;
        case 'commission':
          await fetchCommissionRules();
          break;
        case 'clients':
          await fetchClients();
          break;
        case 'clientes':
          await fetchClientesIndicados();
          break;
        case 'service-requests':
          await fetchServiceRequests();
          break;
        case 'trackers':
          await fetchTrackers();
          break;
        case 'contracts':
          await fetchContractTemplates();
          break;
        case 'providers':
          await fetchProviders();
          break;
        case 'unidades':
          await fetchUnidades();
          break;
        case 'fornecedor-tipos':
          await fetchTiposFornecedor();
          break;
        case 'fornecedores':
          await fetchFornecedores();
          break;
        case 'tecnicos':
          await fetchTecnicos();
          break;
        case 'tipo-veiculo':
          await fetchTiposVeiculo();
          break;
        case 'crm':
          // 🔧 Carregar unidades para filtros se for Master
          if (user?.is_labelview_master && unidades.length === 0) {
            await fetchUnidades();
            await fetchRegionais();
            await fetchConsultores();
          }
          await fetchCRMData();
          break;
        case 'planos-automaticos':
          await fetchMeusPlanos();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('❌ [LOAD DATA] Erro capturado:', error);
      console.error('❌ [LOAD DATA] Error.message:', error.message);
      console.error('❌ [LOAD DATA] Error.stack:', error.stack);
      console.error('❌ [LOAD DATA] activeTab que causou erro:', activeTab);
      toast.error('Erro ao carregar dados');
    } finally {
      console.log('✅ [LOAD DATA] Finally - setLoading(false)');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const response = await axios.get(`${API}/labelview/dashboard/stats`, { headers });
    if (response.data.success) {
      setStats(response.data.stats);
    }
  };

  const fetchEmployees = async () => {
    const response = await axios.get(`${API}/labelview/employees`, { headers });
    if (response.data.success) {
      setEmployees(response.data.employees);
    }
  };

  const fetchManagers = async () => {
    const response = await axios.get(`${API}/labelview/regional-managers`, { headers });
    if (response.data.success) {
      setManagers(response.data.managers);
    }
  };

  const fetchConsultants = async () => {
    const response = await axios.get(`${API}/labelview/consultants`, { headers });
    if (response.data.success) {
      setConsultants(response.data.consultants);
    }
  };

  const fetchCommissionRules = async () => {
    const response = await axios.get(`${API}/labelview/commission-rules`, { headers });
    if (response.data.success) {
      setCommissionRules(response.data.rules);
    }
  };

  const fetchClients = async () => {
    const response = await axios.get(`${API}/labelview/clients`, { headers });
    if (response.data.success) {
      setClients(response.data.clients);
    }
  };

  const fetchClientesIndicados = async () => {
    console.log('🔵 Carregando clientes da proteção veicular...');
    setLoadingClientes(true);
    try {
      // 🔧 Usar novo endpoint que retorna clientes com vistoria/contrato
      const response = await axios.get(`${API}/labelview/clientes`, { headers });
      console.log('📊 Resposta do backend:', response.data);
      if (response.data.success) {
        setClientesIndicados(response.data.clientes || []);
        setClientesIndicadosFiltrados(response.data.clientes || []); // Inicializar filtrados
        console.log('✅ Clientes carregados:', response.data.clientes?.length || 0);
      } else {
        console.log('⚠️ Success = false');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      // Tentar endpoint antigo como fallback
      try {
        const fallbackResponse = await axios.get(`${API}/labelview/meus-clientes-indicados`, { headers });
        if (fallbackResponse.data.success) {
          setClientesIndicados(fallbackResponse.data.clientes || []);
          setClientesIndicadosFiltrados(fallbackResponse.data.clientes || []);
        }
      } catch (fallbackError) {
        toast.error('Erro ao carregar lista de clientes');
      }
    } finally {
      setLoadingClientes(false);
    }
  };

  // 🔧 NOVO: Filtros hierárquicos para clientes (Master)
  useEffect(() => {
    let clientesFiltrados = [...(clientesIndicados || [])];
    
    // Filtro por unidade
    if (filtroHierarquicoUnidade) {
      clientesFiltrados = clientesFiltrados.filter(c => c.unidade_id === filtroHierarquicoUnidade);
    }
    
    // Filtro por regional
    if (filtroHierarquicoRegional) {
      clientesFiltrados = clientesFiltrados.filter(c => c.regional_id === filtroHierarquicoRegional);
    }
    
    // Filtro por consultor
    if (filtroHierarquicoConsultor) {
      clientesFiltrados = clientesFiltrados.filter(c => c.consultor_id === filtroHierarquicoConsultor);
    }
    
    setClientesIndicadosFiltrados(clientesFiltrados);
  }, [filtroHierarquicoUnidade, filtroHierarquicoRegional, filtroHierarquicoConsultor, clientesIndicados]);
  
  // 🔧 FUNÇÕES DE VISTORIA - Aprovar/Reprovar
  const abrirModalVistoria = async (cliente) => {
    setClienteSelecionadoVistoria(cliente);
    setShowVistoriaModal(true);
    setMotivoReprovacao('');
  };

  const aprovarVistoria = async () => {
    if (!clienteSelecionadoVistoria?.vistoria_id) {
      toast.error('Vistoria não encontrada');
      return;
    }
    
    setLoadingVistoria(true);
    try {
      const response = await axios.patch(
        `${API}/labelview/vistorias/${clienteSelecionadoVistoria.vistoria_id}/aprovar`,
        {},
        { headers }
      );
      
      if (response.data.success) {
        toast.success('✅ Vistoria aprovada com sucesso!');
        setShowVistoriaModal(false);
        fetchClientesIndicados(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao aprovar vistoria:', error);
      toast.error('Erro ao aprovar vistoria');
    } finally {
      setLoadingVistoria(false);
    }
  };

  const reprovarVistoria = async () => {
    if (!clienteSelecionadoVistoria?.vistoria_id) {
      toast.error('Vistoria não encontrada');
      return;
    }
    
    if (!motivoReprovacao.trim()) {
      toast.error('Informe o motivo da reprovação');
      return;
    }
    
    setLoadingVistoria(true);
    try {
      const response = await axios.patch(
        `${API}/labelview/vistorias/${clienteSelecionadoVistoria.vistoria_id}/reprovar`,
        { motivo: motivoReprovacao },
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Vistoria reprovada');
        setShowVistoriaModal(false);
        setMotivoReprovacao('');
        fetchClientesIndicados(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao reprovar vistoria:', error);
      toast.error('Erro ao reprovar vistoria');
    } finally {
      setLoadingVistoria(false);
    }
  };

  // 🔧 NOVO: Aplicar mesmos filtros ao CRM
  const crmLeadsFiltrados = (crmLeads || []).filter(lead => {
    if (filtroHierarquicoUnidade && lead.unidade_id !== filtroHierarquicoUnidade) return false;
    if (filtroHierarquicoRegional && lead.regional_id !== filtroHierarquicoRegional) return false;
    if (filtroHierarquicoConsultor && lead.consultor_id !== filtroHierarquicoConsultor) return false;
    return true;
  });

  // 🔧 NOVO: Aplicar mesmos filtros às Solicitações
  const solicitacoesFiltradas = (serviceRequests || []).filter(solicitacao => {
    if (filtroHierarquicoUnidade && solicitacao.unidade_id !== filtroHierarquicoUnidade) return false;
    if (filtroHierarquicoRegional && solicitacao.regional_id !== filtroHierarquicoRegional) return false;
    if (filtroHierarquicoConsultor && solicitacao.consultor_id !== filtroHierarquicoConsultor) return false;
    return true;
  });

  const fetchServiceRequests = async () => {
    const response = await axios.get(`${API}/labelview/service-requests`, { headers });
    if (response.data.success) {
      setServiceRequests(response.data.requests);
    }
  };

  const fetchTrackers = async () => {
    const response = await axios.get(`${API}/labelview/trackers`, { headers });
    if (response.data.success) {
      setTrackers(response.data.trackers);
    }
  };

  const fetchContractTemplates = async () => {
    const response = await axios.get(`${API}/labelview/contract-templates`, { headers });
    if (response.data.success) {
      setContractTemplates(response.data.templates);
    }
  };

  const fetchProviders = async () => {
    const response = await axios.get(`${API}/labelview/providers`, { headers });
    if (response.data.success) {
      setProviders(response.data.providers);
    }
  };

  const fetchUnidades = async () => {
    try {
      const response = await axios.get(`${API}/labelview/unidades`, { headers });
      if (response.data.success) {
        setUnidades(response.data.unidades);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const fetchRegionais = async () => {
    try {
      const response = await axios.get(`${API}/labelview/regionais`, { headers });
      if (response.data.success) {
        setRegionais(response.data.regionais);
      }
    } catch (error) {
      console.error('Erro ao buscar regionais:', error);
    }
  };

  const fetchConsultores = async () => {
    try {
      console.log('🔍 [FETCH CONSULTORES] Iniciando...', { 
        user_email: user?.email, 
        user_type: user?.user_type,
        user_id: user?.id,
        api_url: API
      });
      
      const url = `${API}/labelview/consultores`;
      console.log('🔍 [FETCH CONSULTORES] URL completa:', url);
      console.log('🔍 [FETCH CONSULTORES] Headers:', headers);
      
      const response = await axios.get(url, { headers });
      console.log('📦 [FETCH CONSULTORES] Response completa:', response);
      console.log('📦 [FETCH CONSULTORES] Response data:', response.data);
      console.log('📦 [FETCH CONSULTORES] Response status:', response.status);
      
      if (response.data.success && Array.isArray(response.data.consultores)) {
        setConsultores(response.data.consultores);
        console.log(`✅ [FETCH CONSULTORES] ${response.data.consultores.length} consultores carregados com sucesso`);
        console.log('✅ [FETCH CONSULTORES] Consultores:', response.data.consultores);
      } else {
        console.warn('⚠️ [FETCH CONSULTORES] Resposta inválida ou consultores não é array:', response.data);
        setConsultores([]); // Garantir array vazio se resposta for inválida
      }
    } catch (error) {
      console.error('❌ [FETCH CONSULTORES] Erro capturado:', error);
      console.error('❌ [FETCH CONSULTORES] Error.message:', error.message);
      console.error('❌ [FETCH CONSULTORES] Error.response:', error.response);
      console.error('❌ [FETCH CONSULTORES] Error.response?.status:', error.response?.status);
      console.error('❌ [FETCH CONSULTORES] Error.response?.data:', error.response?.data);
      
      setConsultores([]); // Garantir array vazio em caso de erro
      
      // Mostrar toast com detalhes do erro
      if (error.response?.status === 403) {
        toast.error('Sem permissão para ver consultores');
      } else if (error.response?.status === 500) {
        toast.error('Erro no servidor ao carregar consultores');
      } else if (error.response) {
        toast.error(`Erro ${error.response.status}: ${error.response.data?.detail || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro de conexão ao buscar consultores');
      }
    }
  };

  const fetchTiposFornecedor = async () => {
    try {
      const response = await axios.get(`${API}/labelview/tipos-fornecedor`, { headers });
      if (response.data.success) {
        setTiposFornecedor(response.data.tipos);
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de fornecedor:', error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const response = await axios.get(`${API}/labelview/fornecedores`, { headers });
      if (response.data.success) {
        setFornecedores(response.data.fornecedores);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const fetchEquipamentos = async () => {
    try {
      const response = await axios.get(`${API}/labelview/equipamentos`, { headers });
      if (response.data.success) {
        setEquipamentos(response.data.equipamentos);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  };

  const fetchTecnicos = async () => {
    try {
      const response = await axios.get(`${API}/labelview/tecnicos`, { headers });
      if (response.data.success) {
        setTecnicos(response.data.tecnicos);
      }
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
    }
  };

  const fetchMeusPlanos = async () => {
    try {
      const response = await axios.get(`${API}/labelview/planos/meus-planos`, { headers });
      if (response.data.success) {
        setMeusPlanos(response.data.planos || []);
      }
    } catch (error) {
      // Não mostrar erro se usuário não é unidade
    }
  };

  const fetchTiposVeiculo = async () => {
    try {
      setTiposVeiculoLoaded(false); // Marcar como não carregado
      const response = await axios.get(`${API}/labelview/tipos-veiculo`, { headers });
      if (response.data.success) {
        // Garantir que sempre seja um array válido
        const tipos = Array.isArray(response.data.tipos) ? response.data.tipos : [];
        const tiposValidos = tipos.filter(t => t && t.id); // Filtrar itens válidos com ID
        setTiposVeiculo(tiposValidos);
        setTiposVeiculoLoaded(true); // Marcar como carregado
      } else {
        setTiposVeiculo([]);
        setTiposVeiculoLoaded(true);
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de veículo:', error);
      toast.error('Erro ao buscar tipos de veículo');
      setTiposVeiculo([]); // Garantir array vazio em caso de erro
      setTiposVeiculoLoaded(true);
    }
  };

  const handleEditarPlano = (plano) => {
    setPlanoParaEditar(plano);
    setShowEditarPlanoModal(true);
  };

  const handleBloquearPlano = async (planoId, ativo) => {
    try {
      const acao = ativo ? 'bloquear' : 'desbloquear';
      if (!window.confirm(`Tem certeza que deseja ${acao} este plano?`)) {
        return;
      }

      const response = await axios.patch(
        `${API}/labelview/planos/${planoId}/toggle-status`,
        {},
        { headers }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchMeusPlanos();
      }
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar status do plano');
    }
  };

  const handleDeletarPlano = async (planoId, tipoVeiculo) => {
    try {
      console.log('🔍 DEBUG - Tentando deletar plano:', {
        planoId,
        tipoVeiculo,
        userType: user.user_type,
        userEmail: user.email
      });

      const confirmacao = window.confirm(
        `⚠️ ATENÇÃO!\n\nVocê está prestes a deletar UM plano de ${tipoVeiculo}.\n\n` +
        `Deseja realmente deletar este plano?`
      );

      if (!confirmacao) {
        return;
      }

      const response = await axios.delete(
        `${API}/labelview/planos/${planoId}`,
        { headers }
      );

      if (response.data.success) {
        toast.success('Plano deletado com sucesso');
        fetchMeusPlanos();
      }
    } catch (error) {
      console.error('❌ Erro ao deletar plano:', error);
      console.error('❌ Resposta do servidor:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 'Erro ao deletar plano';
      toast.error(errorMessage, { duration: 5000 });
      
      alert(`ERRO DETALHADO:\n\n${errorMessage}\n\nSeu tipo de usuário: ${user.user_type}\nEmail: ${user.email}`);
    }
  };

  const handleDeletarTodosTipoVeiculo = async (tipoVeiculo) => {
    try {
      const confirmacao = window.confirm(
        `🚨 ATENÇÃO! AÇÃO IRREVERSÍVEL!\n\n` +
        `Você está prestes a deletar TODOS os planos de "${tipoVeiculo}".\n\n` +
        `Deseja realmente continuar?`
      );

      if (!confirmacao) {
        return;
      }

      const response = await axios.delete(
        `${API}/labelview/planos/tipo-veiculo/${encodeURIComponent(tipoVeiculo)}`,
        { headers }
      );

      if (response.data.success) {
        toast.success(`${response.data.total_deletados} planos de ${tipoVeiculo} foram deletados`);
        fetchMeusPlanos();
      }
    } catch (error) {
      console.error('Erro ao deletar planos:', error);
      toast.error(error.response?.data?.detail || 'Erro ao deletar planos');
    }
  };


  // Helper para comprimir imagem
  const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar se necessário
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper para upload de modelos de documentos
  const handleModeloDocumentoUpload = async (file, tipo, tipoNome) => {
    console.log('🔍 handleModeloDocumentoUpload chamado:', { file, tipo, tipoNome });
    
    if (!file) {
      console.log('❌ Sem arquivo');
      return false;
    }
    
    console.log('📁 Arquivo original:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    });
    
    // Validar tamanho inicial (máx 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ Arquivo muito grande:', file.size);
      toast.error('Arquivo muito grande! Máximo 10MB');
      return false;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      console.log('❌ Tipo inválido:', file.type);
      toast.error('Arquivo deve ser uma imagem');
      return false;
    }
    
    try {
      // Comprimir imagem
      console.log('🔄 Comprimindo imagem...');
      toast.loading('Processando imagem...', { id: `compress-${tipo}` });
      const compressedFile = await compressImage(file);
      
      console.log('✅ Imagem comprimida:', {
        name: compressedFile.name,
        size: compressedFile.size,
        sizeMB: (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        reduction: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
      });
      
      toast.success('Imagem processada!', { id: `compress-${tipo}` });
      
      console.log('✅ Validações passaram, criando FormData...');
      const formData = new FormData();
      formData.append('imagem', compressedFile);
      formData.append('tipo', tipo);
      
      console.log('📤 Preparando envio para:', `${API}/labelview/modelos-documentos/upload`);
      
      toast.loading(`Enviando ${tipoNome}...`, { id: `upload-${tipo}` });
      const token = localStorage.getItem('token');
      
      console.log('🚀 Enviando requisição...');
      const response = await axios.post(`${API}/labelview/modelos-documentos/upload`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000, // 60 segundos (aumentado)
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Upload progress: ${percentCompleted}%`);
        }
      });
      
      console.log('✅ Upload sucesso:', response.data);
      
      // Atualizar estado local com a nova URL imediatamente
      const novaUrl = response.data.url;
      console.log('📸 Atualizando imagem local:', novaUrl);
      
      if (tipo === 'cnh_frente') {
        setModeloCnhFrenteUrl(novaUrl);
      } else if (tipo === 'cnh_verso') {
        setModeloCnhVersoUrl(novaUrl);
      } else if (tipo === 'comprovante') {
        setModeloComprovanteUrl(novaUrl);
      } else if (tipo === 'dut') {
        setModeloDutUrl(novaUrl);
      }
      
      toast.success(`✅ ${tipoNome} atualizado com sucesso!`, { id: `upload-${tipo}` });
      console.log('🎉 Imagem atualizada na tela!');
      
      return true;
    } catch (error) {
      console.error(`❌ Erro upload ${tipo}:`, error);
      console.error('Erro completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let msg = 'Erro ao fazer upload';
      if (error.code === 'ECONNABORTED') {
        msg = 'Upload demorou muito. Tente uma imagem menor.';
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      } else if (error.message) {
        msg = error.message;
      }
      
      toast.error(msg, { id: `upload-${tipo}` });
      return false;
    }
  };

  const handleBlockTipoFornecedor = async (tipoId) => {
    try {
      const response = await axios.patch(`${API}/labelview/tipos-fornecedor/${tipoId}/block`, {}, { headers });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchTiposFornecedor();
      }
    } catch (error) {
      toast.error('Erro ao bloquear/desbloquear tipo');
    }
  };

  const handleDeleteTipoFornecedor = async (tipoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este tipo?')) return;
    
    try {
      const response = await axios.delete(`${API}/labelview/tipos-fornecedor/${tipoId}`, { headers });
      if (response.data.success) {
        toast.success('Tipo deletado com sucesso!');
        fetchTiposFornecedor();
      }
    } catch (error) {
      toast.error('Erro ao deletar tipo');
    }
  };

  const handleEditTipoFornecedor = (tipo) => {
    setEditTipoFornecedor(tipo);
    setShowTipoFornecedorModal(true);
  };

  const fetchCRMData = async () => {
    try {
      // Usar novo endpoint /labelview/crm/leads (v2.34.9)
      const params = new URLSearchParams();
      
      // Filtros hierárquicos
      if (filtroHierarquicoUnidade) {
        params.append('unidade_id', filtroHierarquicoUnidade);
      }
      if (filtroHierarquicoRegional) {
        params.append('regional_id', filtroHierarquicoRegional);
      }
      if (filtroHierarquicoConsultor) {
        params.append('consultor_id', filtroHierarquicoConsultor);
      }
      
      const queryString = params.toString();
      const url = `${API}/labelview/crm/leads${queryString ? '?' + queryString : ''}`;
      
      const leadsResponse = await axios.get(url, { headers });
      if (leadsResponse.data.success) {
        // Filtrar por status no cliente (ativo/inativo/ambos)
        let leads = leadsResponse.data.leads || [];
        if (activeLeadStatus === 'ativos') {
          leads = leads.filter(l => l.status === 'ativo');
        } else if (activeLeadStatus === 'inativos') {
          leads = leads.filter(l => l.status !== 'ativo');
        }
        setCrmLeads(leads);
      }
      
      // Buscar proteções por status
      const protecoesResponse = await axios.get(`${API}/labelview/crm/protecoes`, { headers });
      if (protecoesResponse.data.success) {
        setCrmProtecoes({
          interesse: protecoesResponse.data.interesse || [],
          negociacao: protecoesResponse.data.negociacao || [],
          aguardando_aprovacao: protecoesResponse.data.aguardando_aprovacao || []
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados CRM:', error);
    }
  };

  // 🔧 NOVO: Recarregar CRM quando filtros hierárquicos mudam
  useEffect(() => {
    if (activeTab === 'crm') {
      fetchCRMData();
    }
  }, [filtroHierarquicoUnidade, filtroHierarquicoRegional, filtroHierarquicoConsultor]);

  // ============================================
  // FUNÇÕES DE GERENCIAMENTO DE LEADS
  // ============================================

  const handleAtivarLead = async (leadId) => {
    try {
      await axios.patch(
        `${API}/labelview/leads/${leadId}/status`,
        { status: 'ativo' },
        { headers }
      );
      toast.success('Lead ativado com sucesso');
      fetchCRMData();
    } catch (error) {
      toast.error('Erro ao ativar lead');
      console.error(error);
    }
  };

  const handleInativarLead = async (leadId) => {
    try {
      await axios.patch(
        `${API}/labelview/leads/${leadId}/status`,
        { status: 'inativo' },
        { headers }
      );
      toast.success('Lead inativado com sucesso');
      fetchCRMData();
    } catch (error) {
      toast.error('Erro ao inativar lead');
      console.error(error);
    }
  };

  const handleDeletarLead = async (leadId) => {
    if (!window.confirm('Tem certeza que deseja deletar este lead? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await axios.delete(`${API}/labelview/leads/${leadId}`, { headers });
      toast.success('Lead deletado com sucesso');
      fetchCRMData();
    } catch (error) {
      toast.error('Erro ao deletar lead');
      console.error(error);
    }
  };

  // ✅ REMOVIDO: carregarFiltrosHierarquicosCRM - agora usa unidades/regionais/consultores globais

  // Função para recarregar dados do usuário sem recarregar a página inteira
  const recarregarDadosUsuario = async () => {
    try {
      console.log('🔄 Recarregando dados do usuário...');
      
      // Recarregar dados do usuário (incluindo logo_url)
      const userResponse = await axios.get(`${API}/user/profile`, { headers });
      if (userResponse.data) {
        console.log('👤 Dados do usuário recarregados:', userResponse.data.logo_url);
        // Atualizar o contexto de autenticação
        if (typeof updateUser === 'function') {
          updateUser(userResponse.data);
        }
        toast.success('✅ Perfil atualizado!');
        // Forçar reload para atualizar todas as referências ao usuário
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error);
      toast.error('Erro ao atualizar. Recarregando página...');
      // Fallback: reload da página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };




  // ============================================
  // FUNÇÕES DE TIPO DE VEÍCULO
  // ============================================

  const handleBlockTipoVeiculo = async (tipoId) => {
    try {
      await axios.patch(`${API}/labelview/tipos-veiculo/${tipoId}/block`, {}, { headers });
      toast.success('Status atualizado com sucesso');
      fetchTiposVeiculo();
    } catch (error) {
      toast.error('Erro ao atualizar status do tipo de veículo');
    }
  };

  const handleDeleteTipoVeiculo = async (tipoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de veículo?')) {
      return;
    }

    try {
      await axios.delete(`${API}/labelview/tipos-veiculo/${tipoId}`, { headers });
      toast.success('Tipo de veículo excluído com sucesso');
      fetchTiposVeiculo();
    } catch (error) {
      toast.error('Erro ao excluir tipo de veículo');
    }
  };

  // ============================================
  // FUNÇÕES DE FORNECEDORES (ANTIGO SISTEMA)
  // ============================================
  // NOTA: Usar o novo sistema com FornecedorFormModal

  const handleSaveFornecedor = async () => {
    try {
      // Validações
      if (!fornecedorForm.nome_razao_social.trim()) {
        toast.error('Digite o nome/razão social');
        return;
      }
      if (!fornecedorForm.cnpj_cpf.trim()) {
        toast.error('Digite o CNPJ/CPF');
        return;
      }
      if (!fornecedorForm.email.trim()) {
        toast.error('Digite o e-mail');
        return;
      }

      if (editingFornecedor) {
        // Editar
        await axios.put(
          `${API}/labelview/fornecedores/${editingFornecedor.id}`,
          fornecedorForm,
          { headers }
        );
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        // Criar
        await axios.post(
          `${API}/labelview/fornecedores`,
          fornecedorForm,
          { headers }
        );
        toast.success('Fornecedor criado com sucesso');
      }

      setShowFornecedorModal(false);
      setFornecedorForm({
        nome_razao_social: '',
        endereco_completo: '',
        cnpj_cpf: '',
        whatsapp: '',
        email: '',
        nome_representante: '',
        servico_oferecido: 'contabilidade'
      });
      setEditingFornecedor(null);
      fetchFornecedores();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar fornecedor');
    }
  };

  const handleEditFornecedor = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFornecedorForm({
      nome_razao_social: fornecedor.nome_razao_social,
      endereco_completo: fornecedor.endereco_completo,
      cnpj_cpf: fornecedor.cnpj_cpf,
      whatsapp: fornecedor.whatsapp,
      email: fornecedor.email,
      nome_representante: fornecedor.nome_representante,
      servico_oferecido: fornecedor.servico_oferecido
    });
    setShowFornecedorModal(true);
  };

  const handleToggleBlockFornecedor = async (fornecedorId) => {
    try {
      await axios.patch(`${API}/labelview/fornecedores/${fornecedorId}/block`, {}, { headers });
      toast.success('Status do fornecedor atualizado');
      fetchFornecedores();
    } catch (error) {
      toast.error('Erro ao alterar status do fornecedor');
    }
  };

  const handleDeleteFornecedor = async (fornecedorId) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      await axios.delete(`${API}/labelview/fornecedores/${fornecedorId}`, { headers });
      toast.success('Fornecedor excluído com sucesso');
      fetchFornecedores();
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  // ============= FUNÇÕES PARA UNIDADES =============
  const handleEditUnidade = (unidade) => {
    setEditingUnidade(unidade);
    setShowUnidadeModal(true);
  };

  const handleBlockUnidade = async (unidadeId, currentStatus) => {
    const action = currentStatus ? 'bloquear' : 'desbloquear';
    if (!window.confirm(`Tem certeza que deseja ${action} esta unidade?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `${API}/labelview/unidades/${unidadeId}/block`, 
        {}, 
        { headers }
      );
      if (response.data.success) {
        toast.success(response.data.message || `Unidade ${action}da com sucesso!`);
        fetchUnidades();
      }
    } catch (error) {
      console.error('Erro ao alterar status da unidade:', error);
      toast.error(error.response?.data?.message || 'Erro ao alterar status da unidade');
    }
  };

  const handleDeleteUnidade = async (unidadeId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta unidade? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API}/labelview/unidades/${unidadeId}`, { headers });
      if (response.data.success) {
        toast.success('Unidade deletada com sucesso!');
        fetchUnidades();
      }
    } catch (error) {
      console.error('Erro ao deletar unidade:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar unidade');
    }
  };
  // ============= FIM FUNÇÕES UNIDADES =============

  // ============= FUNÇÕES CONSULTORES =============
  const handleToggleBlockConsultor = async (consultor) => {
    try {
      const response = await axios.patch(
        `${API}/labelview/consultores/${consultor.id}/block`, 
        {}, 
        { headers }
      );
      if (response.data.success) {
        toast.success(consultor.is_blocked ? 'Consultor desbloqueado!' : 'Consultor bloqueado!');
        fetchConsultores();
      }
    } catch (error) {
      console.error('Erro ao alterar status do consultor:', error);
      toast.error(error.response?.data?.message || 'Erro ao alterar status do consultor');
    }
  };

  const handleDeleteConsultor = async (consultor) => {
    if (!window.confirm(`Tem certeza que deseja deletar o consultor ${consultor.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API}/labelview/consultores/${consultor.id}`, { headers });
      if (response.data.success) {
        toast.success('Consultor deletado com sucesso!');
        fetchConsultores();
      }
    } catch (error) {
      console.error('Erro ao deletar consultor:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar consultor');
    }
  };
  // ============= FIM FUNÇÕES CONSULTORES =============

  // ============= FUNÇÃO DELETAR CLIENTE =============
  const handleDeleteCliente = async (cliente) => {
    const clienteNome = cliente.nome || cliente.full_name || 'Cliente';
    if (!window.confirm(`Tem certeza que deseja deletar o cliente "${clienteNome}"?\n\nEsta ação não pode ser desfeita e todos os leads, proteções e vistorias relacionados também serão removidos.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API}/labelview/clientes/${cliente.id}`, { headers });
      if (response.data.success) {
        toast.success('Cliente deletado com sucesso!');
        // Recarregar lista de clientes
        fetchClientesIndicados();
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao deletar cliente';
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
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Verificar se usuário pode deletar cliente
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
  // ============= FIM FUNÇÃO DELETAR CLIENTE =============

  const handleEditEquipamento = (equipamento) => {
    setEditEquipamento(equipamento);
    setShowEquipamentoModal(true);
  };

  const handleBlockEquipamento = async (equipamentoId) => {
    try {
      const response = await axios.patch(`${API}/labelview/equipamentos/${equipamentoId}/block`, {}, { headers });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchEquipamentos();
      }
    } catch (error) {
      toast.error('Erro ao alterar status do equipamento');
    }
  };

  const handleDeleteEquipamento = async (equipamentoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este equipamento?')) return;
    
    try {
      const response = await axios.delete(`${API}/labelview/equipamentos/${equipamentoId}`, { headers });
      if (response.data.success) {
        toast.success('Equipamento deletado com sucesso!');
        fetchEquipamentos();
      }
    } catch (error) {
      toast.error('Erro ao deletar equipamento');
    }
  };


  const handleSaveCommissionRules = async () => {
    try {
      const response = await axios.post(
        `${API}/labelview/commission-rules`,
        commissionRules,
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Regras de comissão atualizadas!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar');
    }
  };

  return (
    <div className="min-h-screen bg-[#e3dcda] flex flex-col lg:flex-row">
      {/* Sidebar Vertical à Esquerda - Responsiva */}
      <div 
        className={`
          ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
        `}
        style={{
          backgroundColor: corPrimaria
        }}
      >
        {/* Header da Sidebar */}
        <div 
          className="p-4 border-b"
          style={{
            borderColor: (user.user_type === 'labelview_regional' || user.user_type === 'labelview_consultor' || user.user_type === 'labelview_fornecedor') && unidadeIdentidade 
              ? unidadeIdentidade.cor_secundaria 
              : user.user_type === 'labelview_unidade' && user.cor_secundaria 
              ? user.cor_secundaria 
              : '#2fa31c'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            {/* Logo - Master/Unidade ou Logo da Unidade (Regional/Consultor) */}
            {(user.user_type === 'labelview_regional' || user.user_type === 'labelview_consultor') && unidadeIdentidade?.logo_url ? (
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                <img 
                  src={unidadeIdentidade.logo_url} 
                  alt="Logo Unidade" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : user.user_type === 'labelview_unidade' && user.logo_url ? (
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                <img 
                  src={user.logo_url} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-[#2fa31c] rounded-lg flex items-center justify-center">
                <Truck size={28} className="text-white" />
              </div>
            )}
            
            <div>
              {/* 🔧 CORREÇÃO: Sempre mostrar NOME DA UNIDADE no header (não o nome do usuário) */}
              <h1 className="text-lg font-bold text-white">
                {user.user_type === 'labelview_master' || user.is_labelview_master ? 'Master Labelview' : 
                 user.user_type === 'labelview_unidade' ? (user.nome_fantasia || user.full_name || 'Unidade') :
                 (user.user_type === 'labelview_regional' || user.user_type === 'labelview_consultor' || user.user_type === 'labelview_fornecedor') && unidadeIdentidade ? 
                   unidadeIdentidade.nome_fantasia :
                 'Labelview'}
              </h1>
              <p className="text-xs text-white/80">
                {user.user_type === 'labelview_regional' ? 'Regional' :
                 user.user_type === 'labelview_consultor' ? 'Consultor' :
                 user.user_type === 'labelview_fornecedor' ? 'Fornecedor' : 'Labelview'}
              </p>
            </div>
          </div>
          
          {/* 🔔 BADGE DE NOTIFICAÇÕES */}
          {notificacoesNaoLidas > 0 && (
            <div 
              onClick={() => setActiveTab('notificacoes')}
              className="w-full flex items-center justify-between px-3 py-2.5 mb-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg cursor-pointer transition-colors border border-red-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <span className="text-white text-sm font-medium">
                  {notificacoesNaoLidas} {notificacoesNaoLidas === 1 ? 'Notificação' : 'Notificações'}
                </span>
              </div>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                NOVO
              </span>
            </div>
          )}
          
          {/* 🔧 MANUTENÇÃO - Apenas Master */}
          {(user.is_labelview_master || user.user_type === 'labelview_master') && (
            <button
              onClick={() => setActiveTab('manutencao')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors mb-2 ${
                activeTab === 'manutencao'
                  ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Settings size={16} />
              <span className="text-sm font-medium">🔧 Manutenção</span>
            </button>
          )}
          
          {/* 🏢 FRANQUIAS - Apenas Master */}
          {(user.is_labelview_master || user.user_type === 'labelview_master') && (
            <button
              onClick={() => window.location.href = '/franquias'}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors mb-2 text-white hover:bg-white/10"
            >
              <Building size={16} />
              <span className="text-sm font-medium">🏢 Franquias</span>
            </button>
          )}
          
          {/* Versão do Sistema */}
          <div className="px-3 py-2 mb-2 bg-white/5 rounded-lg border border-white/10">
            <div className="text-white/60 text-xs mb-1">Versão do Sistema</div>
            <div className="text-white font-semibold text-sm">{systemVersion}</div>
          </div>
          
          <button
            onClick={() => {
              // Logout - limpar dados e voltar para login do Transmill
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Sair do Sistema</span>
          </button>
        </div>

        {/* Menu Vertical */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* ========== MENUS PERSONALIZADOS POR HIERARQUIA ========== */}
          {(user.user_type === 'labelview_consultor' || user.user_type === 'consultor') && (
            <ConsultorMenu 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              crmView={crmView}
              setCrmView={setCrmView}
              setMenuOpen={setMenuOpen}
            />
          )}
          
          {user.user_type === 'labelview_regional' && (
            <RegionalMenu 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              setMenuOpen={setMenuOpen}
            />
          )}
          
          {user.user_type === 'labelview_unidade' && (
            <UnidadeMenu 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              setMenuOpen={setMenuOpen}
              onOpenPWAModal={() => setShowPWAModal(true)}
            />
          )}
          
          {/* 🔧 NOVO: Menu do Fornecedor */}
          {user.user_type === 'labelview_fornecedor' && (
            <FornecedorMenu 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              user={user}
            />
          )}

          {/* ========== TABELA DE VALORES - DROPDOWN (APENAS MASTER) ========== */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
            <>
            {/* 🔧 DASHBOARD - Primeiro item para Master */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            
            {/* 🔔 NOTIFICAÇÕES - Enviar notificações para hierarquia */}
            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'notificacoes'
                  ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Bell size={20} />
              <span className="font-medium">Enviar Notificações</span>
            </button>
            </>
          )}
          
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
            <div className="py-2">
              <button
                onClick={() => setShowTabelaDropdown(!showTabelaDropdown)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  showTabelaDropdown ? 'text-white border-l-4 border-[#2fa31c] bg-white/10' : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} />
                  <span className="font-medium">Tabela</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showTabelaDropdown ? 'rotate-180' : ''}`} />
              </button>
            
            {showTabelaDropdown && (
              <div className="mt-2 ml-4 space-y-1 border-l-2 border-white/30 pl-3">
                <button
                  onClick={() => {
                    setActiveTab('tabela-roubo-furto');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Shield size={16} />
                  <span>Roubo/Furto</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-perda-total');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Shield size={16} />
                  <span>Perda Total</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-assistencia');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Handshake size={16} />
                  <span>Assistência 24hs</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-vidros');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Car size={16} />
                  <span>Vidros, Faróis, Lanternas</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-carro-reserva');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Truck size={16} />
                  <span>Carro Reserva</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-colisao');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <AlertCircle size={16} />
                  <span>Colisão</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('tabela-danos');
                    setShowTabelaDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <DollarSign size={16} />
                  <span>Danos Materiais e Terceiros</span>
                </button>
              </div>
            )}
            </div>
          )}

          {/* ========== HIERARQUIA DO SISTEMA (APENAS MASTER) ========== */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'hierarchy'
                ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Shield size={20} />
            <span className="font-medium">Hierarquia do Sistema</span>
          </button>
          )}

          {/* ========== MODELOS DE DOCUMENTOS (APENAS MASTER) ========== */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
          <button
            onClick={() => setActiveTab('modelos-documentos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'modelos-documentos'
                ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <FileText size={20} />
            <span className="font-medium">Modelos de Documentos</span>
          </button>
          )}
          {/* ========== PESSOAS DROPDOWN - VERSÃO NOVA DO ZERO (APENAS MASTER E REGIONAL) ========== */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master || user.user_type === 'labelview_regional') && (
          <div className="py-2 user-dropdown-container">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                showUserDropdown ? 'text-white border-l-4 border-[#2fa31c] bg-white/10' : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} />
                <span className="font-medium">Pessoas</span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showUserDropdown && (
              <div className="mt-2 ml-4 space-y-1 border-l-2 border-white/30 pl-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('employees');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Users size={16} />
                  <span>Colaboradores</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('unidades');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Building size={16} />
                  <span>Unidades</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('regionais');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <Store size={16} />
                  <span>Regional</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('consultores');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <User size={16} />
                  <span>Consultor</span>
                </button>

                {/* Cliente removido daqui - já existe como item "Clientes" no menu principal */}

                {/* Fornecedor Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowFornecedorSubDropdown(!showFornecedorSubDropdown);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Warehouse size={16} />
                      <span>Fornecedor</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${showFornecedorSubDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFornecedorSubDropdown && (
                    <div className="mt-1 ml-4 space-y-1 border-l-2 border-white/30 pl-3">
                      {/* Tipo */}
                      <div className="space-y-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveTab('fornecedor-tipos');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                        >
                          <List size={14} />
                          <span>Tipo</span>
                        </button>
                      </div>
                      
                      {/* Cadastro */}
                      <div className="space-y-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveTab('fornecedores');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                        >
                          <Package size={14} />
                          <span>Cadastro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Rastreadores Dropdown (Movido para dentro de Pessoas) */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRastreadoresDropdown(!showRastreadoresDropdown);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span>Rastreadores</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${showRastreadoresDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showRastreadoresDropdown && (
                    <div className="mt-1 ml-4 space-y-1 border-l-2 border-white/30 pl-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab('trackers');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                      >
                        <Package size={14} />
                        <span>Equipamento</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab('tecnicos');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                      >
                        <Wrench size={14} />
                        <span>Técnico</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tipo de Veículo com Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTipoVeiculoDropdown(!showTipoVeiculoDropdown);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg text-left transition-colors ${
                      showTipoVeiculoDropdown || activeTab === 'tipo-veiculo' || activeTab === 'fipe'
                        ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Car size={16} />
                      <span>Tipo de Veículo</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${showTipoVeiculoDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showTipoVeiculoDropdown && (
                    <div className="ml-4 mt-1 space-y-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab('tipo-veiculo');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                      >
                        <Car size={14} />
                        <span>Tipo</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab('fipe');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white hover:bg-white/20 rounded-lg text-left transition-colors"
                      >
                        <FileText size={14} />
                        <span>Tabela FIPE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
          {/* ========== FIM PESSOAS DROPDOWN ========== */}

          {/* CRM - Dropdown com Lead e Proteção (TODOS EXCETO CONSULTOR, REGIONAL E UNIDADE QUE TÊM NO PRÓPRIO MENU) */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
          <div>
            <button
              onClick={() => setShowCrmDropdown(!showCrmDropdown)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                showCrmDropdown || crmView === 'leads' || crmView === 'kanban'
                  ? 'bg-white/20 text-white shadow-lg border-l-4 border-[#2fa31c]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase size={20} />
                <span className="font-medium">CRM</span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${showCrmDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showCrmDropdown && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-white/20 pl-2">
                <button
                  onClick={() => { 
                    setActiveTab('crm'); 
                    setCrmView('kanban');
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    crmView === 'kanban' 
                      ? 'bg-white/20 text-white font-medium' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <LayoutGrid size={16} />
                  Kanban
                </button>
                <button
                  onClick={() => { 
                    setActiveTab('crm'); 
                    setCrmView('leads');
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    crmView === 'leads' 
                      ? 'bg-white/20 text-white font-medium' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <List size={16} />
                  Lista
                </button>
              </div>
            )}
          </div>
          )}

          {/* Clientes - APENAS PARA MASTER (Unidade, Regional e Consultor têm no próprio menu) */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
          <button
            onClick={() => setActiveTab('clientes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'clientes'
                ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <UserCheck size={20} />
            <span className="font-medium">Clientes</span>
          </button>
          )}

          {/* Solicitações (APENAS MASTER - Unidade, Regional e Consultor têm no próprio menu) */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
          <button
            onClick={() => window.location.href = '/labelview/solicitacoes'}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-white hover:bg-white/10"
          >
            <AlertCircle size={20} />
            <span className="font-medium">Solicitações</span>
          </button>
          )}
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-[#2fa31c]">
          <button
            onClick={() => loadData()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span className="text-sm">Atualizar Dados</span>
          </button>
        </div>
      </div>

      {/* Overlay para mobile quando menu aberto */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Área Principal - Cards no Centro */}
      <div className="flex-1 overflow-y-auto w-full">
        {/* Header Fixo */}
        <div className="bg-white border-b border-[var(--cor-primaria)] shadow-sm sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-2">
            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-[var(--cor-primaria)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h2 className="text-lg lg:text-2xl font-bold text-[var(--cor-primaria)] truncate flex-1">
              {activeTab === 'perfil' && 'Meu Perfil'}
              {activeTab === 'hierarchy' && 'Hierarquia do Sistema Labelview'}
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'notificacoes' && '🔔 Enviar Notificações'}
              {activeTab === 'crm' && 'CRM - Gestão de Leads'}
              {activeTab === 'comissoes' && 'Comissões'}
              {activeTab === 'cotacao' && 'Nova Cotação - Proteção Veicular'}
              {activeTab === 'minha-rede' && 'Minha Rede de Indicados'}
              {activeTab === 'clientes' && 'Clientes'}
              {activeTab === 'solicitacoes' && 'Solicitações dos Clientes'}
              {activeTab === 'fipe' && 'Relações De Veículos - Tabela FIPE'}
              {activeTab.includes('pessoas') && 'Gestão de Pessoas'}
              {activeTab === 'tabela-roubo-furto' && 'Tabela de Valores - Roubo/Furto'}
              {activeTab === 'tabela-perda-total' && 'Tabela de Valores - Perda Total'}
              {activeTab === 'tabela-assistencia' && 'Tabela de Valores - Assistência 24hs'}
              {activeTab === 'tabela-vidros' && 'Tabela de Valores - Vidros, Faróis, Lanternas'}
              {activeTab === 'tabela-carro-reserva' && 'Tabela de Valores - Carro Reserva'}
              {activeTab === 'tabela-colisao' && 'Tabela de Valores - Colisão'}
              {activeTab === 'tabela-danos' && 'Tabela de Valores - Danos Materiais e Terceiros'}
            </h2>
            
            {/* Notificações e Menu de Perfil */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Sino de Notificações */}
              <LabelviewNotificationBell />
              
              {/* Botão de Mensagem Interna (Master e Unidade) */}
              {(user.is_labelview_master || user.is_labelview_unidade) && (
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="relative p-2 hover:bg-[#e3dcda] rounded-lg transition-colors group"
                  title="Enviar mensagem interna"
                >
                  <Send size={20} className="text-[var(--cor-primaria)] group-hover:text-[#2fa31c] transition-colors" />
                </button>
              )}
              
              {/* Menu de Perfil - Responsivo */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 hover:bg-white rounded-lg transition-colors text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  <UserCircle size={20} className="lg:w-6 lg:h-6" />
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold">{user.nome_fantasia || user.company_name || user.nome || user.full_name || 'Usuário'}</p>
                    <p className="text-xs opacity-80">{user.email}</p>
                  </div>
                  <ChevronDown size={16} className={`transition-transform hidden md:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[var(--cor-primaria)] overflow-hidden z-50">
                  {/* Perfil */}
                  <button
                    onClick={() => {
                      setActiveTab('perfil');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#e3dcda] transition-colors text-left"
                  >
                    <User size={20} className="text-[var(--cor-primaria)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--cor-primaria)]">Meu Perfil</p>
                      <p className="text-xs text-[var(--cor-primaria)]">Ver e editar dados da conta</p>
                    </div>
                  </button>

                  {/* Link de Indicação */}
                  <button
                    onClick={() => {
                      const referralLink = `https://app.transmill.com.br/cotacao/${user.id}`;
                      navigator.clipboard.writeText(referralLink);
                      toast.success('Link de indicação copiado!');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#e3dcda] transition-colors text-left border-t"
                  >
                    <Share2 size={20} className="text-[#2fa31c]" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--cor-primaria)]">Link de Indicação</p>
                      <p className="text-xs text-[var(--cor-primaria)]">Indique clientes e ganhe</p>
                    </div>
                    <Copy size={16} className="text-[var(--cor-primaria)]" />
                  </button>

                  {/* Sair */}
                  <button
                    onClick={() => {
                      // Logout - limpar dados e voltar para login do Transmill
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#e3dcda] transition-colors text-left border-t"
                  >
                    <LogOut size={20} className="text-[var(--cor-primaria)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--cor-primaria)]">Sair do Sistema</p>
                      <p className="text-xs text-[var(--cor-primaria)]">Fazer logout</p>
                    </div>
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo dos Cards - Responsivo */}
        <div className="p-3 lg:p-6">
          {/* Dashboard cards e todo o conteúdo original do dashboard */}
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* HIERARQUIA DO SISTEMA */}
          <TabsContent value="hierarchy" className="space-y-6">
            <HierarchyVisualization />
          </TabsContent>

          {/* TABELA FIPE */}
          <TabsContent value="fipe" className="space-y-6">
            <TabelaFIPE />
          </TabsContent>

          {/* ========== COTAÇÃO PARA CONSULTORES ========== */}
          <TabsContent value="cotacao" className="space-y-6">
            <CotacaoConsultorLabelview />
          </TabsContent>

          {/* ========== MINHA REDE DE INDICADOS ========== */}
          <TabsContent value="minha-rede" className="space-y-6">
            <MinhaRede user={user} />
          </TabsContent>

          {/* ========== CLIENTES DO CONSULTOR ========== */}
          <TabsContent value="clientes" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck size={24} />
                    Gestão de Clientes Labelview
                  </div>
                  <Badge className="bg-white/20 text-white">
                    {clientesIndicadosFiltrados.length} cliente(s) {filtroUnidadeClientes && `(Filtrado)`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              {/* 🔧 CORREÇÃO: Filtros Hierárquicos Completos (APENAS MASTER) */}
              {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
                <div className="p-4 bg-gray-50 border-b space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Filtro Unidade */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700">🏢 Unidade:</label>
                      <select
                        value={filtroHierarquicoUnidade}
                        onChange={(e) => {
                          setFiltroHierarquicoUnidade(e.target.value);
                          setFiltroHierarquicoRegional(''); // Limpar regional
                          setFiltroHierarquicoConsultor(''); // Limpar consultor
                        }}
                        className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                      >
                        <option value="">Todas</option>
                        {(unidades || []).map(unidade => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.nome_fantasia}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Regional (se unidade selecionada) */}
                    {filtroHierarquicoUnidade && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">📍 Regional:</label>
                        <select
                          value={filtroHierarquicoRegional}
                          onChange={(e) => {
                            setFiltroHierarquicoRegional(e.target.value);
                            setFiltroHierarquicoConsultor(''); // Limpar consultor
                          }}
                          className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                        >
                          <option value="">Todas</option>
                          {regionais
                            .filter(r => r.unidade_id === filtroHierarquicoUnidade)
                            .map(regional => (
                              <option key={regional.id} value={regional.id}>
                                {regional.nome_fantasia}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Filtro Consultor (se regional ou unidade selecionada) */}
                    {(filtroHierarquicoUnidade || filtroHierarquicoRegional) && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">👤 Consultor:</label>
                        <select
                          value={filtroHierarquicoConsultor}
                          onChange={(e) => setFiltroHierarquicoConsultor(e.target.value)}
                          className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                        >
                          <option value="">Todos</option>
                          {consultores
                            .filter(c => {
                              if (filtroHierarquicoRegional) return c.regional_id === filtroHierarquicoRegional;
                              if (filtroHierarquicoUnidade) return c.unidade_id === filtroHierarquicoUnidade;
                              return true;
                            })
                            .map(consultor => (
                              <option key={consultor.id} value={consultor.id}>
                                {consultor.nome}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Botão Limpar */}
                    {(filtroHierarquicoUnidade || filtroHierarquicoRegional || filtroHierarquicoConsultor) && (
                      <button
                        onClick={() => {
                          setFiltroHierarquicoUnidade('');
                          setFiltroHierarquicoRegional('');
                          setFiltroHierarquicoConsultor('');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                      >
                        ✖ Limpar Filtros
                      </button>
                    )}

                    <div className="ml-auto text-sm text-gray-600">
                      Mostrando: <strong>{clientesIndicadosFiltrados.length}</strong> de <strong>{clientesIndicados.length}</strong>
                    </div>
                  </div>
                </div>
              )}
              
              <CardContent className="p-0">
                {loadingClientes ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cor-primaria)]"></div>
                    <p className="text-gray-600 mt-4">Carregando clientes...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#e3dcda] border-b-2 border-[var(--cor-primaria)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Veículo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Vistoria
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Contrato
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Vencimento & Valor
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Solicitações
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--cor-primaria)] uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientesIndicadosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-12 text-center">
                              <UserCheck size={64} className="mx-auto text-gray-300 mb-4" />
                              <p className="text-xl font-semibold text-gray-600">
                                {filtroUnidadeClientes ? 'Nenhum cliente encontrado nesta unidade' : 'Nenhum cliente cadastrado'}
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                {filtroUnidadeClientes 
                                  ? 'Tente selecionar outra unidade ou limpe o filtro.'
                                  : 'Os clientes que contratarem proteção veicular aparecerão aqui.'}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          clientesIndicadosFiltrados.map((cliente, idx) => (
                          <tr key={cliente.id || idx} className="hover:bg-[#e3dcda]/50 transition-colors">
                            {/* Dados do Cliente */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--cor-primaria)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[var(--cor-primaria)] truncate">{cliente.nome || 'Não informado'}</p>
                                  <p className="text-xs text-gray-600">CPF: {cliente.cpf || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{cliente.email || 'Sem email'}</p>
                                  <p className="text-xs text-gray-500">{cliente.telefone || 'Sem telefone'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Dados do Veículo */}
                            <td className="px-4 py-4">
                              {cliente.veiculo_marca && cliente.veiculo_modelo ? (
                                <div>
                                  <p className="font-medium text-gray-900">{cliente.veiculo_marca} {cliente.veiculo_modelo}</p>
                                  <p className="text-xs text-gray-600">Ano: {cliente.veiculo_ano || 'N/A'}</p>
                                  <p className="text-xs text-gray-600">Placa: {cliente.veiculo_placa || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">Valor FIPE: R$ {cliente.veiculo_valor_fipe || '0,00'}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Não informado</span>
                              )}
                            </td>

                            {/* Vistoria */}
                            <td className="px-4 py-4 text-center">
                              {cliente.vistoria_status ? (
                                <div>
                                  {cliente.vistoria_status === 'aprovada' && (
                                    <>
                                      <Badge className="bg-[#2fa31c] text-white">✓ Aprovada</Badge>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="mt-1 text-xs text-[var(--cor-primaria)] hover:bg-[#e3dcda]"
                                        onClick={() => abrirModalVistoria(cliente)}
                                      >
                                        👁️ Ver Fotos
                                      </Button>
                                    </>
                                  )}
                                  {cliente.vistoria_status === 'reprovada' && (
                                    <>
                                      <Badge className="bg-red-600 text-white">✗ Reprovada</Badge>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="mt-1 text-xs text-red-600 hover:bg-red-50"
                                        onClick={() => abrirModalVistoria(cliente)}
                                      >
                                        👁️ Ver Fotos
                                      </Button>
                                    </>
                                  )}
                                  {(cliente.vistoria_status === 'pendente' || cliente.vistoria_status === 'aguardando_aprovacao') && (
                                    <>
                                      <Badge className="bg-yellow-500 text-white">⏳ Aguardando</Badge>
                                      <Button 
                                        size="sm" 
                                        className="mt-2 bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)]/80 text-white px-3 py-1 text-xs"
                                        onClick={() => abrirModalVistoria(cliente)}
                                      >
                                        {user.is_labelview_master ? '📋 Analisar' : '👁️ Ver Fotos'}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Sem vistoria</span>
                              )}
                            </td>

                            {/* Contrato e Assinatura */}
                            <td className="px-4 py-4 text-center">
                              {(cliente.contrato_status === 'assinado' || cliente.contrato_assinado || cliente.contrato?.data_assinatura) ? (
                                <div>
                                  <Badge className="bg-[#2fa31c] text-white">✓ Assinado</Badge>
                                  {(cliente.contrato_assinado_em || cliente.contrato?.data_assinatura) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(cliente.contrato_assinado_em || cliente.contrato?.data_assinatura).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                  <Button size="sm" variant="ghost" className="mt-1 text-xs text-[var(--cor-primaria)] hover:bg-[#e3dcda]">
                                    Ver Contrato
                                  </Button>
                                </div>
                              ) : (
                                <Badge className="bg-yellow-500 text-white">⏳ Pendente</Badge>
                              )}
                            </td>

                            {/* Plano, Vencimento & Valor */}
                            <td className="px-4 py-4">
                              {(cliente.plano_nome || cliente.plano_valor) ? (
                                <div>
                                  {cliente.plano_nome && (
                                    <p className="font-medium text-gray-900 text-sm">{cliente.plano_nome}</p>
                                  )}
                                  <p className="font-semibold text-[#2fa31c]">
                                    R$ {parseFloat(cliente.plano_valor || 0).toFixed(2).replace('.', ',')}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Venc: dia {cliente.data_vencimento || '10'}
                                  </p>
                                  {cliente.contrato?.numero && (
                                    <p className="text-xs text-gray-500">
                                      {cliente.contrato.numero}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Sem plano</span>
                              )}
                            </td>

                            {/* Solicitações */}
                            <td className="px-4 py-4 text-center">
                              {cliente.total_solicitacoes ? (
                                <div>
                                  <Badge className="bg-[var(--cor-primaria)] text-white">
                                    {cliente.total_solicitacoes} nova(s)
                                  </Badge>
                                  <Button size="sm" variant="ghost" className="mt-1 text-xs text-[var(--cor-primaria)] hover:bg-[#e3dcda]">
                                    Ver Todas
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Nenhuma</span>
                              )}
                            </td>

                            {/* Status (Ativo/Vencido/Inativo/Suspenso) */}
                            <td className="px-4 py-4 text-center">
                              {(() => {
                                const status = cliente.status_geral || cliente.status_conta || cliente.status;
                                switch(status?.toLowerCase()) {
                                  case 'ativo':
                                    return <Badge className="bg-[#2fa31c] text-white">✓ Ativo</Badge>;
                                  case 'vencido':
                                    return <Badge className="bg-red-500 text-white">⚠ Vencido</Badge>;
                                  case 'inativo':
                                    return <Badge className="bg-gray-500 text-white">○ Inativo</Badge>;
                                  case 'suspenso':
                                    return <Badge className="bg-yellow-600 text-white">⏸ Suspenso</Badge>;
                                  case 'pendente':
                                    return <Badge className="bg-blue-500 text-white">⏳ Pendente</Badge>;
                                  default:
                                    return <Badge className="bg-gray-400 text-white">{status || 'N/A'}</Badge>;
                                }
                              })()}
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {/* Editar */}
                                <Button
                                  size="sm"
                                  className="bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)]/90 text-white"
                                  title="Editar dados"
                                >
                                  <PenTool size={16} />
                                </Button>

                                {/* Bloquear/Desbloquear */}
                                {cliente.status_conta === 'ativo' ? (
                                  <Button
                                    size="sm"
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    title="Bloquear conta"
                                  >
                                    🔒
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-[#2fa31c] hover:bg-[#2fa31c]/90 text-white"
                                    title="Desbloquear conta"
                                  >
                                    🔓
                                  </Button>
                                )}

                                {/* Deletar - apenas se usuário pode excluir */}
                                {podeExcluirCliente(cliente) && (
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    title="Deletar cliente"
                                    onClick={() => handleDeleteCliente(cliente)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== SOLICITAÇÕES DOS CLIENTES ========== */}
          <TabsContent value="solicitacoes" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase size={24} />
                  Solicitações dos Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* 🔧 Filtros Hierárquicos Unificados (Apenas Master) */}
                {(user.is_labelview_master || user.user_type === 'labelview_master') && (
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Filtro Unidade */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">🏢 Unidade:</label>
                        <select
                          value={filtroHierarquicoUnidade}
                          onChange={(e) => {
                            setFiltroHierarquicoUnidade(e.target.value);
                            setFiltroHierarquicoRegional('');
                            setFiltroHierarquicoConsultor('');
                          }}
                          className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                        >
                          <option value="">Todas</option>
                          {(unidades || []).map(unidade => (
                            <option key={unidade.id} value={unidade.id}>{unidade.nome_fantasia}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro Regional */}
                      {filtroHierarquicoUnidade && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-gray-700">📍 Regional:</label>
                          <select
                            value={filtroHierarquicoRegional}
                            onChange={(e) => {
                              setFiltroHierarquicoRegional(e.target.value);
                              setFiltroHierarquicoConsultor('');
                            }}
                            className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                          >
                            <option value="">Todas</option>
                            {regionais
                              .filter(r => r.unidade_id === filtroHierarquicoUnidade)
                              .map(regional => (
                                <option key={regional.id} value={regional.id}>{regional.nome_fantasia}</option>
                              ))}
                          </select>
                        </div>
                      )}

                      {/* Filtro Consultor */}
                      {(filtroHierarquicoUnidade || filtroHierarquicoRegional) && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-gray-700">👤 Consultor:</label>
                          <select
                            value={filtroHierarquicoConsultor}
                            onChange={(e) => setFiltroHierarquicoConsultor(e.target.value)}
                            className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                          >
                            <option value="">Todos</option>
                            {consultores
                              .filter(c => {
                                if (filtroHierarquicoRegional) return c.regional_id === filtroHierarquicoRegional;
                                if (filtroHierarquicoUnidade) return c.unidade_id === filtroHierarquicoUnidade;
                                return true;
                              })
                              .map(consultor => (
                                <option key={consultor.id} value={consultor.id}>
                                  {consultor.nome || consultor.nome_fantasia || consultor.email}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Solicitações */}
                {solicitacoesFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Nenhuma solicitação encontrada</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {user.user_type === 'labelview_consultor' && 'As solicitações dos seus clientes aparecerão aqui.'}
                      {user.user_type === 'labelview_regional' && 'As solicitações da sua regional aparecerão aqui.'}
                      {user.user_type === 'labelview_unidade' && 'As solicitações da sua unidade aparecerão aqui.'}
                      {(user.is_labelview_master || user.user_type === 'labelview_master') && 'Selecione os filtros acima para visualizar solicitações.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">#</th>
                          <th className="p-3 text-left">Cliente</th>
                          <th className="p-3 text-left">Tipo</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Data</th>
                          <th className="p-3 text-left">Unidade</th>
                          <th className="p-3 text-left">Consultor</th>
                          <th className="p-3 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitacoesFiltradas.map((solicitacao, index) => (
                          <tr key={solicitacao.id} className="border-b hover:bg-[#e3dcda]">
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-medium">{solicitacao.cliente_nome || 'N/A'}</td>
                            <td className="p-3">{solicitacao.tipo || 'Geral'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                solicitacao.status === 'pendente' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : solicitacao.status === 'em_andamento'
                                  ? 'bg-blue-100 text-blue-800'
                                  : solicitacao.status === 'concluida'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {solicitacao.status === 'pendente' ? 'Pendente' 
                                  : solicitacao.status === 'em_andamento' ? 'Em Andamento'
                                  : solicitacao.status === 'concluida' ? 'Concluída'
                                  : solicitacao.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {solicitacao.created_at ? new Date(solicitacao.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </td>
                            <td className="p-3">{solicitacao.unidade_nome || 'N/A'}</td>
                            <td className="p-3">{solicitacao.consultor_nome || 'N/A'}</td>
                            <td className="p-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-[var(--cor-primaria)] border-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)]/10"
                              >
                                Ver Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TABELAS DE VALORES ========== */}
          <TabsContent value="tabela-roubo-furto" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Roubo/Furto" 
              titulo="Roubo e Furto"
              icon={Shield}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-perda-total" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Perda Total" 
              titulo="Perda Total"
              icon={Shield}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-assistencia" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Assistencia 24hs" 
              titulo="Assistência 24 Horas"
              icon={Handshake}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-vidros" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Vidros, Farois e Lanternas" 
              titulo="Vidros, Faróis e Lanternas"
              icon={Car}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-carro-reserva" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Carro Reserva" 
              titulo="Carro Reserva"
              icon={Truck}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-colisao" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Colisão" 
              titulo="Colisão"
              icon={AlertCircle}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          <TabsContent value="tabela-danos" className="space-y-6">
            <TabelaValoresForm 
              tipoCobertura="Danos materiais e Terceiros" 
              titulo="Danos Materiais e Terceiros"
              icon={DollarSign}
              readOnly={user.user_type === 'labelview_unidade'}
            />
          </TabsContent>

          {/* PERFIL */}
          {/* VENCIMENTOS - Configurar intervalo de datas */}
          <TabsContent value="vencimentos" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Calendar size={32} />
                  Configuração de Vencimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    📅 <strong>Defina o intervalo de dias</strong> em que o cliente poderá escolher o vencimento das mensalidades do plano.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const vencimentoInicio = formData.get('vencimento_inicio');
                  const vencimentoFim = formData.get('vencimento_fim');
                  
                  try {
                    const token = localStorage.getItem('token');
                    const payload = new FormData();
                    payload.append('vencimento_inicio', vencimentoInicio);
                    payload.append('vencimento_fim', vencimentoFim);
                    
                    const response = await axios.patch(`${API}/labelview/profile`, payload, {
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                      }
                    });
                    
                    if (response.data.success) {
                      toast.success('✅ Vencimentos atualizados com sucesso!');
                      // Forçar reload completo da página para buscar dados atualizados
                      setTimeout(() => {
                        window.location.href = window.location.href;
                      }, 2000);
                    }
                  } catch (error) {
                    console.error('Erro ao atualizar vencimentos:', error);
                    toast.error('❌ Erro ao atualizar. Tente novamente.');
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dia Início *
                      </label>
                      <select
                        name="vencimento_inicio"
                        defaultValue={user?.vencimento_inicio || 1}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                        required
                      >
                        {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dia Fim *
                      </label>
                      <select
                        name="vencimento_fim"
                        defaultValue={user?.vencimento_fim || 15}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                        required
                      >
                        {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
                    >
                      💾 Salvar Configuração
                    </button>
                  </div>
                </form>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold mb-2">
                    ✅ Configuração Atual:
                  </p>
                  <p className="text-lg text-green-900">
                    Clientes poderão escolher vencimento entre <strong>dia {user?.vencimento_inicio || 1}</strong> e <strong>dia {user?.vencimento_fim || 15}</strong> de cada mês.
                  </p>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Importante:</strong> Esta configuração afeta todas as cotações. O cliente escolherá o dia específico dentro deste intervalo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODELOS DE DOCUMENTOS - Upload de CNH e Comprovante (APENAS MASTER) */}
          {(user.user_type === 'labelview_master' || user.is_labelview_master) && (
            <TabsContent value="modelos-documentos" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <FileText size={28} />
                    Modelos de Documentos para Vistoria
                  </CardTitle>
                  <p className="text-white/90 mt-2 text-sm">
                    Configure as imagens de exemplo que os clientes verão durante o processo de vistoria
                  </p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Modelo CNH - FRENTE */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[var(--cor-primaria)] mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Modelo de CNH - FRENTE
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta imagem será exibida como exemplo para o cliente ao enviar a foto da FRENTE da CNH
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {modeloCnhFrenteUrl ? (
                          <div className="relative">
                            <img 
                              src={modeloCnhFrenteUrl} 
                              alt="Modelo CNH Frente"
                              className="w-full h-48 object-contain border-2 border-blue-300 rounded-lg bg-white p-2"
                            />
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(`${API}/labelview/modelos-documentos/cnh_frente`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  setModeloCnhFrenteUrl(null);
                                  toast.success('Modelo de CNH (Frente) removido');
                                } catch (error) {
                                  toast.error('Erro ao remover modelo');
                                }
                              }}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-48 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center text-gray-400">
                              <FileText size={48} className="mx-auto mb-2" />
                              <p className="text-sm">Nenhum modelo cadastrado</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block">
                          <div className="border-2 border-dashed border-blue-400 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors">
                            <Upload className="mx-auto text-blue-600 mb-2" size={32} />
                            <p className="text-sm font-medium text-blue-600 mb-1">
                              {modeloCnhFrenteUrl ? 'Trocar' : 'Upload'} Modelo CNH Frente
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG até 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              
                              // Validar tamanho (máx 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Arquivo muito grande! Máximo 5MB');
                                e.target.value = '';
                                return;
                              }
                              
                              // Validar tipo
                              if (!file.type.startsWith('image/')) {
                                toast.error('Arquivo deve ser uma imagem');
                                e.target.value = '';
                                return;
                              }
                              
                              const formData = new FormData();
                              formData.append('imagem', file);
                              formData.append('tipo', 'cnh_frente');
                              
                              try {
                                toast.loading('Enviando imagem...', { id: 'upload-cnh-frente' });
                                const token = localStorage.getItem('token');
                                const response = await axios.post(`${API}/labelview/modelos-documentos/upload`, formData, {
                                  headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'multipart/form-data'
                                  },
                                  timeout: 30000 // 30 segundos
                                });
                                toast.success('Modelo de CNH (Frente) atualizado!', { id: 'upload-cnh-frente' });
                                await recarregarDadosUsuario();
                                e.target.value = '';
                              } catch (error) {
                                console.error('Erro upload CNH frente:', error);
                                const msg = error.response?.data?.detail || 'Erro ao fazer upload';
                                toast.error(msg, { id: 'upload-cnh-frente' });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        
                        <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-800">
                          <strong>Dica:</strong> Use uma imagem clara mostrando a FRENTE da CNH (com foto e dados principais)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modelo CNH - VERSO */}
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Modelo de CNH - VERSO
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta imagem será exibida como exemplo para o cliente ao enviar a foto do VERSO da CNH
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {modeloCnhVersoUrl ? (
                          <div className="relative">
                            <img 
                              src={modeloCnhVersoUrl} 
                              alt="Modelo CNH Verso"
                              className="w-full h-48 object-contain border-2 border-indigo-300 rounded-lg bg-white p-2"
                            />
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(`${API}/labelview/modelos-documentos/cnh_verso`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  setModeloCnhVersoUrl(null);
                                  toast.success('Modelo de CNH (Verso) removido');
                                } catch (error) {
                                  toast.error('Erro ao remover modelo');
                                }
                              }}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-48 border-2 border-dashed border-indigo-300 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center text-gray-400">
                              <FileText size={48} className="mx-auto mb-2" />
                              <p className="text-sm">Nenhum modelo cadastrado</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block">
                          <div className="border-2 border-dashed border-indigo-400 rounded-lg p-6 text-center cursor-pointer hover:bg-indigo-100 transition-colors">
                            <Upload className="mx-auto text-indigo-600 mb-2" size={32} />
                            <p className="text-sm font-medium text-indigo-600 mb-1">
                              {modeloCnhVersoUrl ? 'Trocar' : 'Upload'} Modelo CNH Verso
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG até 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              const success = await handleModeloDocumentoUpload(file, 'cnh_verso', 'Modelo CNH (Verso)');
                              if (success || !file) e.target.value = '';
                            }}
                          />
                        </label>
                        
                        <div className="mt-4 p-3 bg-indigo-100 rounded text-xs text-indigo-800">
                          <strong>Dica:</strong> Use uma imagem clara mostrando o VERSO da CNH (com categoria e observações)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modelo Comprovante de Endereço */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#2fa31c] mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Modelo de Comprovante de Endereço
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta imagem será exibida como exemplo para o cliente ao enviar o comprovante de endereço
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {modeloComprovanteUrl ? (
                          <div className="relative">
                            <img 
                              src={modeloComprovanteUrl} 
                              alt="Modelo Comprovante"
                              className="w-full h-48 object-contain border-2 border-green-300 rounded-lg bg-white p-2"
                            />
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(`${API}/labelview/modelos-documentos/comprovante`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  setModeloComprovanteUrl(null);
                                  toast.success('Modelo de comprovante removido');
                                } catch (error) {
                                  toast.error('Erro ao remover modelo');
                                }
                              }}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-48 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center text-gray-400">
                              <FileText size={48} className="mx-auto mb-2" />
                              <p className="text-sm">Nenhum modelo cadastrado</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block">
                          <div className="border-2 border-dashed border-green-400 rounded-lg p-6 text-center cursor-pointer hover:bg-green-100 transition-colors">
                            <Upload className="mx-auto text-green-600 mb-2" size={32} />
                            <p className="text-sm font-medium text-green-600 mb-1">
                              {modeloComprovanteUrl ? 'Trocar' : 'Upload'} Modelo Comprovante
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG até 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              const success = await handleModeloDocumentoUpload(file, 'comprovante', 'Modelo de Comprovante');
                              if (success || !file) e.target.value = '';
                            }}
                          />
                        </label>
                        
                        <div className="mt-4 p-3 bg-green-100 rounded text-xs text-green-800">
                          <strong>Dica:</strong> Use uma imagem de exemplo de conta de luz, água ou internet com nome e endereço visíveis
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modelo DUT */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Modelo de DUT (Documento Único de Transferência)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta imagem será exibida como exemplo para o cliente ao enviar o DUT do veículo durante a vistoria
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {modeloDutUrl ? (
                          <div className="relative">
                            <img 
                              src={modeloDutUrl} 
                              alt="Modelo DUT"
                              className="w-full h-48 object-contain border-2 border-purple-300 rounded-lg bg-white p-2"
                            />
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(`${API}/labelview/modelos-documentos/dut`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  setModeloDutUrl(null);
                                  toast.success('Modelo de DUT removido');
                                } catch (error) {
                                  toast.error('Erro ao remover modelo');
                                }
                              }}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-48 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center text-gray-400">
                              <FileText size={48} className="mx-auto mb-2" />
                              <p className="text-sm">Nenhum modelo cadastrado</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block">
                          <div className="border-2 border-dashed border-purple-400 rounded-lg p-6 text-center cursor-pointer hover:bg-purple-100 transition-colors">
                            <Upload className="mx-auto text-purple-600 mb-2" size={32} />
                            <p className="text-sm font-medium text-purple-600 mb-1">
                              {modeloDutUrl ? 'Trocar' : 'Upload'} Modelo DUT
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG até 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              const success = await handleModeloDocumentoUpload(file, 'dut', 'Modelo de DUT');
                              if (success || !file) e.target.value = '';
                            }}
                          />
                        </label>
                        
                        <div className="mt-4 p-3 bg-purple-100 rounded text-xs text-purple-800">
                          <strong>Dica:</strong> Use uma imagem clara do DUT mostrando os dados do veículo e proprietário
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Importante:</strong> Estas imagens são apenas modelos de referência. Os clientes verão estas imagens ao lado da câmera durante a vistoria para saberem como tirar as fotos corretamente.
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ============================================ */}
          {/* 🎁 TELA DE CUPONS DE DESCONTO */}
          {/* ============================================ */}
          <TabsContent value="cupons" className="space-y-6">
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Gift size={24} />
                  Cupons de Desconto
                </CardTitle>
                <p className="text-white/80 text-sm mt-1">
                  Crie cupons de desconto para seus clientes na taxa de adesão
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <CuponsForm 
                  user={user}
                  API={API}
                  headers={headers}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perfil" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <UserCircle size={32} />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações da Conta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--cor-primaria)] mb-4">Informações da Conta</h3>
                    <div>
                      <label className="text-sm font-medium text-[var(--cor-primaria)]">Nome</label>
                      <p className="text-base font-semibold text-[var(--cor-primaria)]">{user.full_name || 'Usuário'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--cor-primaria)]">Email</label>
                      <p className="text-base font-semibold text-[var(--cor-primaria)]">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--cor-primaria)]">Tipo de Conta</label>
                      <p className="text-base font-semibold text-[#2fa31c]">
                        {user.user_type === 'labelview_master' || user.is_labelview_master ? 'Master Labelview' :
                         user.user_type === 'labelview_unidade' ? 'Unidade' :
                         user.user_type === 'labelview_regional' ? 'Regional' :
                         user.user_type === 'labelview_consultor' ? 'Consultor' : 'Usuário'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--cor-primaria)]">Status</label>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#2fa31c]/20 text-[#2fa31c] rounded-full text-sm font-semibold">
                        ✓ {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Link de Indicação */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--cor-primaria)] mb-4">Link de Indicação</h3>
                    <div className="bg-[#e3dcda] p-4 rounded-lg border-2 border-[#2fa31c]">
                      <label className="text-sm font-medium text-[var(--cor-primaria)] mb-2 block">Seu Link Personalizado de Indicação</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={`https://app.transmill.com.br/cotacao/${user.id}`}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-[var(--cor-primaria)] rounded text-sm font-mono"
                        />
                        <button
                          onClick={() => {
                            const referralLink = `https://app.transmill.com.br/cotacao/${user.id}`;
                            navigator.clipboard.writeText(referralLink);
                            toast.success('Link copiado para a área de transferência!');
                          }}
                          className="px-4 py-2 bg-[#2fa31c] hover:bg-[#2fa31c]/80 text-white rounded transition-colors flex items-center gap-2"
                        >
                          <Copy size={16} />
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-[var(--cor-primaria)] mt-2">
                        💡 Compartilhe este link personalizado para indicar clientes e ganhar comissões
                      </p>
                    </div>

                    {/* Estatísticas de Indicação */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs opacity-80">Indicações</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-2xl font-bold">R$ 0</p>
                        <p className="text-xs opacity-80">Comissões</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                  <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="px-6 py-3 bg-[#2fa31c] hover:bg-[#2fa31c]/80 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User size={20} />
                    Editar Perfil
                  </button>
                  <button className="px-6 py-3 bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)]/80 text-white rounded-lg transition-colors flex items-center gap-2">
                    <Settings size={20} />
                    Alterar Senha
                  </button>
                  <button
                    onClick={() => {
                      // Logout - limpar dados e voltar para login do Transmill
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut size={20} />
                    Sair do Sistema
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🔔 TELA DE NOTIFICAÇÕES - Enviar para hierarquia e clientes */}
          <TabsContent value="notificacoes" className="space-y-6">
            {/* 🔔 NOTIFICAÇÕES RECEBIDAS */}
            <Card className="border-2 border-orange-400/50">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-2">
                    <Bell size={24} />
                    Notificações Recebidas
                    {notificacoesNaoLidas > 0 && (
                      <span className="bg-white text-red-500 text-xs px-2 py-0.5 rounded-full font-bold">
                        {notificacoesNaoLidas} não lidas
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={fetchNotificacoesRecebidas}
                    className="text-white/80 hover:text-white text-sm flex items-center gap-1"
                  >
                    🔄 Atualizar
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {notificacoesRecebidas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhuma notificação recebida</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notificacoesRecebidas.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-4 rounded-lg border-2 ${
                          notif.lida 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-orange-50 border-orange-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {notif.tipo === 'vistoria_pendente' ? '📋' : 
                               notif.tipo === 'vistoria_aprovada' ? '✅' : '🔔'}
                            </span>
                            <div>
                              <h4 className="font-bold text-gray-800">{notif.titulo}</h4>
                              <p className="text-xs text-gray-500">
                                De: {notif.remetente_nome || 'Sistema'} • {new Date(notif.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          {!notif.lida && (
                            <button
                              onClick={() => marcarNotificacaoComoLida(notif.id)}
                              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{notif.mensagem}</p>
                        {notif.cliente_nome && (
                          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                            <strong>Cliente:</strong> {notif.cliente_nome} 
                            {notif.cliente_telefone && ` • Tel: ${notif.cliente_telefone}`}
                          </div>
                        )}
                        {notif.tipo === 'vistoria_pendente' && (
                          <button
                            onClick={() => setActiveTab('clientes')}
                            className="mt-2 w-full bg-[#2fa31c] text-white py-2 rounded-lg text-sm hover:bg-[#258517]"
                          >
                            Ver Vistoria para Aprovar →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ENVIAR NOTIFICAÇÕES (existente) */}
            <Card className="border-2 border-[var(--cor-primaria)]/20">
              <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bell size={24} />
                  Enviar Notificações
                </CardTitle>
                <p className="text-white/80 text-sm mt-1">
                  Envie notificações para sua rede de usuários e clientes
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <NotificacaoForm 
                  user={user}
                  API={API}
                  headers={headers}
                  unidades={unidades}
                  regionais={regionais}
                  consultores={consultores}
                  fetchUnidades={fetchUnidades}
                  fetchRegionais={fetchRegionais}
                  fetchConsultores={fetchConsultores}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Unidades - Apenas Master */}
              {user.user_type === 'labelview_master' && (
                <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-l-8 border-[var(--cor-primaria)]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Store size={32} className="text-[var(--cor-primaria)]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                      Unidades Ativas
                    </h3>
                    <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                      {stats.total_unidades || 0}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Card Regionais - Master e Unidade */}
              {(user.user_type === 'labelview_master' || user.user_type === 'labelview_unidade') && (
                <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-l-8 border-[#2fa31c]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Building size={32} className="text-[#2fa31c]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                      Regionais Ativas
                    </h3>
                    <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                      {stats.total_regionais || 0}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Card Consultores - Apenas para Master, Unidade e Regional (NÃO para Consultor) */}
              {user.user_type !== 'labelview_consultor' && (
                <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-l-8 border-[#2fa31c]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Briefcase size={32} className="text-[#2fa31c]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                      Consultores Ativos
                    </h3>
                    <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                      {stats.total_consultores || 0}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Card 1: Clientes Ativos */}
              <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-l-8 border-[var(--cor-primaria)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <UserCircle size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                    Clientes Ativos
                  </h3>
                  <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                    {stats.total_clients || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Solicitações Pendentes */}
              <Card className="bg-white border-l-8 border-[#2fa31c] hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <AlertCircle size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                    Solicitações Pendentes
                  </h3>
                  <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                    {stats.pending_requests || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Rastreadores Disponíveis */}
              <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Truck size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                    Rastreadores Disponíveis
                  </h3>
                  <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                    {stats.available_trackers || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Fornecedores Ativos */}
              <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-l-8 border-[var(--cor-primaria)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Warehouse size={32} className="text-[var(--cor-primaria)]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                    Fornecedores Ativos
                  </h3>
                  <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                    {stats.total_fornecedores || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Card 6: Receita do Mês */}
              <Card className="bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign size={32} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[var(--cor-primaria)] opacity-90">
                    Receita do Mês
                  </h3>
                  <div className="text-4xl font-bold text-[var(--cor-primaria)]">
                    R$ {(stats.month_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm mt-2 opacity-80">{stats.total_payments || 0} pagamentos</p>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* COLABORADORES */}
          <TabsContent value="employees" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Colaboradores ({employees.length})</CardTitle>
                  <Button onClick={() => setShowEmployeeModal(true)} className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]">
                    <Plus size={16} className="mr-2" />
                    Novo Colaborador
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#e3dcda]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">CPF</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Cargo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Regional</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Comissão</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-[#e3dcda]">
                          <td className="px-4 py-3 text-sm">{emp.full_name}</td>
                          <td className="px-4 py-3 text-sm">{emp.cpf}</td>
                          <td className="px-4 py-3 text-sm">{emp.role}</td>
                          <td className="px-4 py-3 text-sm">{emp.regional || '-'}</td>
                          <td className="px-4 py-3 text-sm">{emp.commission_percentage}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${emp.is_active ? 'bg-[#2fa31c]/20 text-[#2fa31c]' : 'bg-gray-200 text-[var(--cor-primaria)]'}`}>
                              {emp.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {employees.length === 0 && (
                    <div className="text-center py-8 text-[var(--cor-primaria)]">
                      Nenhum colaborador cadastrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GERENTES */}
          <TabsContent value="managers" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerentes Regionais ({managers.length})</CardTitle>
                  <Button onClick={() => setShowManagerModal(true)} className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]">
                    <Plus size={16} className="mr-2" />
                    Novo Gerente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#e3dcda]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Regional</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Cidades</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Comissão</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {managers.map(mgr => (
                        <tr key={mgr.id} className="hover:bg-[#e3dcda]">
                          <td className="px-4 py-3 text-sm">{mgr.full_name}</td>
                          <td className="px-4 py-3 text-sm">{mgr.email}</td>
                          <td className="px-4 py-3 text-sm">{mgr.regional}</td>
                          <td className="px-4 py-3 text-sm">{mgr.cities?.length || 0} cidade(s)</td>
                          <td className="px-4 py-3 text-sm">{mgr.commission_percentage}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${mgr.is_active ? 'bg-[#2fa31c]/20 text-[#2fa31c]' : 'bg-gray-200 text-[var(--cor-primaria)]'}`}>
                              {mgr.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {managers.length === 0 && (
                    <div className="text-center py-8 text-[var(--cor-primaria)]">
                      Nenhum gerente cadastrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSULTORES */}
          <TabsContent value="consultants" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Consultores ({consultants.length})</CardTitle>
                  {/* Botão Novo Consultor - para Franquia/Unidade/Regional */}
                  {(user?.user_type === 'labelview_unidade' || user?.user_type === 'labelview_regional' || user?.user_type === 'franquia_admin') && (
                    <Button onClick={() => setShowConsultorModal(true)}>
                      <Plus size={16} className="mr-2" />
                      Novo Consultor
                    </Button>
                  )}
                  {/* Mensagem para Master */}
                  {(user?.is_labelview_master || user?.user_type === 'labelview_master') && (
                    <div className="text-sm text-gray-500">
                      Visualização dos consultores cadastrados pelas franquias
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#e3dcda]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">CPF</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Regional</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Vendas</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Comissão</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {consultants.map(cons => (
                        <tr key={cons.id} className="hover:bg-[#e3dcda]">
                          <td className="px-4 py-3 text-sm">{cons.full_name}</td>
                          <td className="px-4 py-3 text-sm">{cons.cpf}</td>
                          <td className="px-4 py-3 text-sm">{cons.email}</td>
                          <td className="px-4 py-3 text-sm">{cons.regional || '-'}</td>
                          <td className="px-4 py-3 text-sm">{cons.total_sales}</td>
                          <td className="px-4 py-3 text-sm">{cons.commission_percentage}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${cons.is_active ? 'bg-[#2fa31c]/20 text-[#2fa31c]' : 'bg-gray-200 text-[var(--cor-primaria)]'}`}>
                              {cons.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {consultants.length === 0 && (
                    <div className="text-center py-8 text-[var(--cor-primaria)]">
                      Nenhum consultor cadastrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMISSÕES - continuação no próximo arquivo */}
          <TabsContent value="commission" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Comissão e Distribuição</CardTitle>
                <p className="text-sm text-[var(--cor-primaria)] mt-2">
                  Configure os percentuais de distribuição. A soma deve ser 100%.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--cor-primaria)] mb-2">
                      LabelView (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionRules.labelview_percentage || 0}
                      onChange={(e) => setCommissionRules({...commissionRules, labelview_percentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-[var(--cor-primaria)] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--cor-primaria)] mb-2">
                      Proteção Veicular (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionRules.agitoauto_percentage || 0}
                      onChange={(e) => setCommissionRules({...commissionRules, agitoauto_percentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-[var(--cor-primaria)] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--cor-primaria)] mb-2">
                      Mini Agência (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionRules.mini_agency_percentage || 0}
                      onChange={(e) => setCommissionRules({...commissionRules, mini_agency_percentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-[var(--cor-primaria)] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--cor-primaria)] mb-2">
                      Consultor (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionRules.consultant_percentage || 0}
                      onChange={(e) => setCommissionRules({...commissionRules, consultant_percentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-[var(--cor-primaria)] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--cor-primaria)] mb-2">
                      Cashback (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionRules.cashback_percentage || 0}
                      onChange={(e) => setCommissionRules({...commissionRules, cashback_percentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-[var(--cor-primaria)] rounded-lg"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#e3dcda] rounded-lg">
                  <p className="text-sm font-medium text-[var(--cor-primaria)]">
                    Total: {(
                      (commissionRules.labelview_percentage || 0) +
                      (commissionRules.agitoauto_percentage || 0) +
                      (commissionRules.mini_agency_percentage || 0) +
                      (commissionRules.consultant_percentage || 0) +
                      (commissionRules.cashback_percentage || 0)
                    ).toFixed(2)}%
                  </p>
                  <p className="text-xs text-[var(--cor-primaria)] mt-1">
                    {Math.abs((
                      (commissionRules.labelview_percentage || 0) +
                      (commissionRules.agitoauto_percentage || 0) +
                      (commissionRules.mini_agency_percentage || 0) +
                      (commissionRules.consultant_percentage || 0) +
                      (commissionRules.cashback_percentage || 0)
                    ) - 100) < 0.01 ? '✓ Soma correta!' : '⚠ A soma deve ser 100%'}
                  </p>
                </div>

                <Button onClick={handleSaveCommissionRules} className="w-full">
                  Salvar Regras de Comissão
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outras abas serão renderizadas similarmente... */}
          {/* Por questão de espaço, vou adicionar placeholders para as outras */}
          
          <TabsContent value="clients">
            {/* ClientesLabelview removido - usando tabela nova em value="clientes" */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
                <CardTitle>Clientes (Legado)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600">Use a aba "Clientes" (com ícone UserCheck) para ver a lista completa.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service-requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Serviço ({serviceRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[var(--cor-primaria)]">
                  {serviceRequests.length} solicitações
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Contrato ({contractTemplates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[var(--cor-primaria)]">
                  {contractTemplates.length} modelos cadastrados
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Fornecedores ({providers.length})</CardTitle>
                  <Button onClick={() => setShowProviderModal(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo Fornecedor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#e3dcda]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Tipo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Telefone</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Cidade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {providers.map(prov => (
                        <tr key={prov.id} className="hover:bg-[#e3dcda]">
                          <td className="px-4 py-3 text-sm">{prov.name}</td>
                          <td className="px-4 py-3 text-sm">{prov.type}</td>
                          <td className="px-4 py-3 text-sm">{prov.phone}</td>
                          <td className="px-4 py-3 text-sm">{prov.city || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${prov.is_active ? 'bg-[#2fa31c]/20 text-[#2fa31c]' : 'bg-gray-200 text-[var(--cor-primaria)]'}`}>
                              {prov.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {providers.length === 0 && (
                    <div className="text-center py-8 text-[var(--cor-primaria)]">
                      Nenhum fornecedor cadastrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM */}
          <TabsContent value="crm" className="space-y-6">
            {/* Toggle entre Kanban e Lista */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={() => setCrmView('kanban')}
                className={`flex items-center gap-2 ${
                  crmView === 'kanban'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white text-[var(--cor-primaria)] border-2 border-[var(--cor-primaria)]'
                }`}
              >
                <LayoutGrid size={20} />
                Kanban
              </Button>
              <Button
                onClick={() => setCrmView('leads')}
                className={`flex items-center gap-2 ${
                  crmView === 'leads'
                    ? 'bg-[var(--cor-primaria)] border-l-4 border-[#2fa31c] text-white'
                    : 'bg-white text-[var(--cor-primaria)] border-2 border-[var(--cor-primaria)]'
                }`}
              >
                <List size={20} />
                Lista
              </Button>
            </div>

            {/* Área do CRM Kanban */}
            {crmView === 'kanban' && (
              <div className="h-[calc(100vh-250px)]">
                <CrmKanbanProtecao 
                  userType={user.user_type}
                  userId={user.id}
                  unidadeId={user.unidade_id || user.id}
                  regionalId={user.regional_id}
                />
              </div>
            )}

            {/* Área de Leads (Lista) */}
            {crmView === 'leads' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl">Lista de Lead</CardTitle>
                    <div className="flex gap-2">
                      <Button className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]">
                        <Search size={16} className="mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="outline" className="border-[var(--cor-primaria)] text-[var(--cor-primaria)] hover:bg-[#e3dcda]">
                        Exportar
                      </Button>
                      <Button className="bg-[#2fa31c] hover:bg-[#2fa31c]">
                        <Plus size={16} className="mr-2" />
                        Novo
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-[var(--cor-primaria)] hover:bg-[#e3dcda]">
                        Encaminhar
                      </Button>
                    </div>
                  </div>

                  {/* Tabs de Status */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={activeLeadStatus === 'ativos' ? 'default' : 'outline'}
                      onClick={() => setActiveLeadStatus('ativos')}
                      className={activeLeadStatus === 'ativos' ? 'bg-gray-700' : ''}
                    >
                      Ativos
                    </Button>
                    <Button
                      variant={activeLeadStatus === 'inativos' ? 'default' : 'outline'}
                      onClick={() => setActiveLeadStatus('inativos')}
                    >
                      Inativos
                    </Button>
                    <Button
                      variant={activeLeadStatus === 'ambos' ? 'default' : 'outline'}
                      onClick={() => setActiveLeadStatus('ambos')}
                    >
                      Ambos
                    </Button>
                  </div>

                  {/* 🔧 Filtros Hierárquicos Unificados (Master) */}
                  {(user.is_labelview_master || user.user_type === 'labelview_master') && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtro Unidade */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-gray-700">🏢 Unidade:</label>
                          <select
                            value={filtroHierarquicoUnidade}
                            onChange={(e) => {
                              setFiltroHierarquicoUnidade(e.target.value);
                              setFiltroHierarquicoRegional('');
                              setFiltroHierarquicoConsultor('');
                            }}
                            className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                          >
                            <option value="">Todas</option>
                            {(unidades || []).map(unidade => (
                              <option key={unidade.id} value={unidade.id}>{unidade.nome_fantasia}</option>
                            ))}
                          </select>
                        </div>

                        {/* Filtro Regional */}
                        {filtroHierarquicoUnidade && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-700">📍 Regional:</label>
                            <select
                              value={filtroHierarquicoRegional}
                              onChange={(e) => {
                                setFiltroHierarquicoRegional(e.target.value);
                                setFiltroHierarquicoConsultor('');
                              }}
                              className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                            >
                              <option value="">Todas</option>
                              {regionais
                                .filter(r => r.unidade_id === filtroHierarquicoUnidade)
                                .map(regional => (
                                  <option key={regional.id} value={regional.id}>{regional.nome_fantasia}</option>
                                ))}
                            </select>
                          </div>
                        )}

                        {/* Filtro Consultor */}
                        {(filtroHierarquicoUnidade || filtroHierarquicoRegional) && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-700">👤 Consultor:</label>
                            <select
                              value={filtroHierarquicoConsultor}
                              onChange={(e) => setFiltroHierarquicoConsultor(e.target.value)}
                              className="px-3 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:border-[#2fa31c] focus:outline-none bg-white text-sm"
                            >
                              <option value="">Todos</option>
                              {consultores
                                .filter(c => {
                                  if (filtroHierarquicoRegional) return c.regional_id === filtroHierarquicoRegional;
                                  if (filtroHierarquicoUnidade) return c.unidade_id === filtroHierarquicoUnidade;
                                  return true;
                                })
                                .map(consultor => (
                                  <option key={consultor.id} value={consultor.id}>{consultor.nome}</option>
                                ))}
                            </select>
                          </div>
                        )}

                        {/* Botão Limpar */}
                        {(filtroHierarquicoUnidade || filtroHierarquicoRegional || filtroHierarquicoConsultor) && (
                          <button
                            onClick={() => {
                              setFiltroHierarquicoUnidade('');
                              setFiltroHierarquicoRegional('');
                              setFiltroHierarquicoConsultor('');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                          >
                            ✖ Limpar Filtros
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Filtros e Busca */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select className="border rounded-lg px-3 py-2 bg-white">
                      <option>Todos responsáveis</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Período (de - até)"
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="nome, cpf, cnpj, telefone, email..."
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Tabela de Leads */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-[#e3dcda]">
                          <th className="p-3 text-left">
                            <input type="checkbox" />
                          </th>
                          <th className="p-3 text-left cursor-pointer hover:bg-[#e3dcda]">
                            # <span className="text-xs">↑</span>
                          </th>
                          <th className="p-3 text-left cursor-pointer hover:bg-[#e3dcda]">
                            Nome <span className="text-xs">↑</span>
                          </th>
                          <th className="p-3 text-left cursor-pointer hover:bg-[#e3dcda]">
                            CPF <span className="text-xs">↑</span>
                          </th>
                          <th className="p-3 text-left cursor-pointer hover:bg-[#e3dcda]">
                            Telefone <span className="text-xs">↑</span>
                          </th>
                          <th className="p-3 text-left cursor-pointer hover:bg-[#e3dcda]">
                            Data do Cadastro <span className="text-xs">↑</span>
                          </th>
                          <th className="p-3 text-left">Situação</th>
                          <th className="p-3 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crmLeadsFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-8 text-[var(--cor-primaria)]">
                              Nenhum lead cadastrado
                            </td>
                          </tr>
                        ) : (
                          crmLeadsFiltrados.map((lead, index) => (
                            <tr key={lead.id} className="border-b hover:bg-[#e3dcda]">
                              <td className="p-3">
                                <input type="checkbox" />
                              </td>
                              <td className="p-3">{index + 1}</td>
                              <td className="p-3 font-medium">{lead.nome || lead.name || lead.cliente?.nome || 'N/A'}</td>
                              <td className="p-3">{lead.cpf || lead.cliente?.cpf || 'N/A'}</td>
                              <td className="p-3">{lead.telefone || lead.cliente?.telefone || 'N/A'}</td>
                              <td className="p-3">
                                {new Date(lead.created_at).toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  lead.status === 'ativo' || lead.status === 'novo'
                                    ? 'bg-[#2fa31c]/20 text-[#2fa31c]' 
                                    : lead.status === 'negociacao'
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-300 text-gray-600'
                                }`}>
                                  {lead.status === 'novo' ? 'Novo' : 
                                   lead.status === 'negociacao' ? 'Em Negociação' :
                                   lead.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  {lead.status === 'inativo' ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-[#2fa31c] border-[#2fa31c] hover:bg-[#2fa31c]/10"
                                      onClick={() => handleAtivarLead(lead.id)}
                                    >
                                      Ativar
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-gray-600 border-gray-400 hover:bg-gray-100"
                                      onClick={() => handleInativarLead(lead.id)}
                                    >
                                      Inativar
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-400 hover:bg-red-50"
                                    onClick={() => handleDeletarLead(lead.id)}
                                  >
                                    Deletar
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* UNIDADES */}
          <TabsContent value="unidades" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Unidades/Franquias ({unidades.length})</CardTitle>
                  <div className="text-sm text-gray-500">
                    {(user?.is_labelview_master || user?.user_type === 'labelview_master') 
                      ? 'Unidades são criadas quando franquias se cadastram pelo Admin Transmill'
                      : 'Sua rede de unidades vinculadas'
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {unidades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Nenhuma unidade vinculada</p>
                    <p className="text-sm">
                      {(user?.is_labelview_master || user?.user_type === 'labelview_master')
                        ? 'Quando uma franquia se cadastrar pelo link do Admin, ela aparecerá aqui automaticamente'
                        : 'Suas unidades vinculadas aparecerão aqui'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-[#e3dcda]">
                          <th className="p-3 text-left">ID</th>
                          <th className="p-3 text-left">Nome da Unidade</th>
                          <th className="p-3 text-left">CNPJ</th>
                          <th className="p-3 text-left">Cidade</th>
                          <th className="p-3 text-left">Estado</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(unidades || []).map((unidade) => (
                          <tr key={unidade.id} className="border-b hover:bg-[#e3dcda]">
                            <td className="p-3 font-mono text-sm">
                              {unidade.id.substring(0, 8)}
                            </td>
                            <td className="p-3 font-medium">{unidade.name}</td>
                            <td className="p-3">{unidade.cnpj || '-'}</td>
                            <td className="p-3">{unidade.city || '-'}</td>
                            <td className="p-3">{unidade.state || '-'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                unidade.is_active
                                  ? 'bg-[#2fa31c]/20 text-[#2fa31c]'
                                  : 'bg-[#e3dcda] text-[var(--cor-primaria)]'
                              }`}>
                                {unidade.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditUnidade(unidade)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Editar Unidade"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleBlockUnidade(unidade.id, unidade.is_active)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title={unidade.is_active ? "Bloquear Unidade" : "Desbloquear Unidade"}
                                >
                                  {unidade.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUnidade(unidade.id)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Deletar Unidade"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REGIONAIS */}
          <TabsContent value="regionais" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Regional (Mini Agência)</CardTitle>
                  {/* Botão Nova Regional - apenas para Franquia/Unidade */}
                  {(user?.user_type === 'labelview_unidade' || user?.user_type === 'franquia_admin') && (
                    <Button 
                      className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                      onClick={() => setShowRegionalModal(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Nova Regional
                    </Button>
                  )}
                  {/* Mensagem para Master - apenas visualização */}
                  {(user?.is_labelview_master || user?.user_type === 'labelview_master') && (
                    <div className="text-sm text-gray-500">
                      Visualização das regionais cadastradas pelas franquias
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {regionais && regionais.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-[#e3dcda]">
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome da Regional</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Unidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">CNPJ</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Cidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Estado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(regionais || []).map((regional) => (
                          <tr key={regional.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{regional.id ? regional.id.substring(0, 8) : '-'}</td>
                            <td className="px-4 py-3">{regional.name || '-'}</td>
                            <td className="px-4 py-3">{regional.unidade_nome || regional.unidade_id || '-'}</td>
                            <td className="px-4 py-3">{regional.cnpj || '-'}</td>
                            <td className="px-4 py-3">{regional.city || '-'}</td>
                            <td className="px-4 py-3">{regional.state || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                regional.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {regional.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <Store size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhuma regional cadastrada</p>
                    <p className="text-sm">Gerencie as mini agências do sistema</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSULTORES - Transmill/Labelview */}
          <TabsContent value="consultores" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Consultores</CardTitle>
                  <div className="flex gap-2">
                    {/* 🔧 Botão para corrigir hierarquia - apenas Master */}
                    {(user?.is_labelview_master || user?.user_type === 'labelview_master') && (
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={async () => {
                          if (window.confirm('Isso vai corrigir todos os consultores que não têm unidade vinculada. Deseja continuar?')) {
                            try {
                              const response = await axios.post(`${API}/labelview/corrigir-hierarquia-consultores`, {}, { headers });
                              if (response.data.success) {
                                toast.success(`${response.data.message}`);
                                if (response.data.corrigidos?.length > 0) {
                                  response.data.corrigidos.forEach(c => {
                                    toast.info(`Corrigido: ${c.consultor_nome || c.consultor_email}`);
                                  });
                                }
                                // Recarregar consultores
                                fetchConsultores();
                              }
                            } catch (error) {
                              toast.error('Erro ao corrigir hierarquia');
                              console.error(error);
                            }
                          }
                        }}
                      >
                        🔧 Corrigir Hierarquia
                      </Button>
                    )}
                    {/* Botão Novo Consultor - para Franquia/Unidade/Regional */}
                    {(user?.user_type === 'labelview_unidade' || user?.user_type === 'labelview_regional' || user?.user_type === 'franquia_admin') && (
                      <Button 
                        className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                        onClick={() => setShowConsultorModal(true)}
                      >
                        <Plus size={16} className="mr-2" />
                        Novo Consultor
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 🔧 CORREÇÃO: Filtros para Master E Unidade */}
                <div className="mb-6 space-y-3">
                  {/* Master tem filtros diferentes: por Unidade */}
                  {(user?.user_type === 'labelview_master' || user?.is_labelview_master) && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-[var(--cor-primaria)]">Filtrar por Unidade:</label>
                      <select
                        value={filtroUnidadeConsultores || ''}
                        onChange={(e) => {
                          setFiltroUnidadeConsultores(e.target.value);
                          setFiltroRegionalConsultores(''); // Limpar filtro de regional
                        }}
                        className="px-4 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:outline-none focus:border-[#2fa31c] min-w-[250px]"
                      >
                        <option value="">📋 Todas as Unidades ({(consultores || []).length})</option>
                        {(unidades || []).map(unidade => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.nome_fantasia || unidade.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Filtro de Regional (opcional, depois de selecionar unidade) */}
                      {filtroUnidadeConsultores && (
                        <>
                          <label className="text-sm font-semibold text-[var(--cor-primaria)]">Regional:</label>
                          <select
                            value={filtroRegionalConsultores}
                            onChange={(e) => setFiltroRegionalConsultores(e.target.value)}
                            className="px-4 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:outline-none focus:border-[#2fa31c] min-w-[200px]"
                          >
                            <option value="">🏢 Todas as Regionais</option>
                            {regionais
                              .filter(r => r.unidade_id === filtroUnidadeConsultores)
                              .map(regional => (
                                <option key={regional.id} value={regional.id}>
                                  {regional.nome_fantasia || regional.name}
                                </option>
                              ))}
                          </select>
                        </>
                      )}
                      
                      {(filtroUnidadeConsultores || filtroRegionalConsultores) && (
                        <button
                          onClick={() => {
                            setFiltroUnidadeConsultores('');
                            setFiltroRegionalConsultores('');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                        >
                          ✖ Limpar Filtros
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Unidade tem filtros por Regional */}
                  {user?.user_type === 'labelview_unidade' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setFiltroConsultores('todos');
                          setFiltroRegionalConsultores('');
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          filtroConsultores === 'todos'
                            ? 'bg-[var(--cor-primaria)] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        📊 Todos ({(consultores || []).length})
                      </button>
                      <button
                        onClick={() => {
                          setFiltroConsultores('indicados');
                          setFiltroRegionalConsultores('');
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          filtroConsultores === 'indicados'
                            ? 'bg-[#2fa31c] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        👤 Indicados Direto ({(consultores || []).filter(c => !c.regional_id).length})
                      </button>
                      <button
                        onClick={() => setFiltroConsultores('regional')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          filtroConsultores === 'regional'
                            ? 'bg-[var(--cor-primaria)] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        🏢 Por Regional ({(consultores || []).filter(c => c.regional_id).length})
                      </button>
                      
                      {/* Select de Regional - aparece apenas quando filtro 'regional' está ativo */}
                      {filtroConsultores === 'regional' && (
                        <div className="flex items-center gap-3 mt-2 w-full">
                          <label className="text-sm font-semibold text-[var(--cor-primaria)]">Selecione a Regional:</label>
                          <select
                            value={filtroRegionalConsultores}
                            onChange={(e) => setFiltroRegionalConsultores(e.target.value)}
                            className="px-4 py-2 border-2 border-[var(--cor-primaria)] rounded-lg focus:outline-none focus:border-[#2fa31c]"
                          >
                            <option value="">-- Todas as Regionais --</option>
                            {(regionais || []).map(regional => (
                              <option key={regional.id} value={regional.id}>
                                {regional.nome_fantasia || regional.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {Array.isArray(consultores) && consultores.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-[#e3dcda]">
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Nome do Consultor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Unidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Regional</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">CPF</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Cidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Estado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Status</th>
                          {/* ✅ Master apenas visualiza, não tem ações */}
                          {!user?.is_labelview_master && user?.user_type !== 'labelview_master' && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--cor-primaria)]">Ações</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(consultores || [])
                          .filter((consultor) => {
                            // 🔧 CORREÇÃO: Filtros para Master
                            if (user?.user_type === 'labelview_master' || user?.is_labelview_master) {
                              // Filtrar por unidade
                              if (filtroUnidadeConsultores && consultor.unidade_id !== filtroUnidadeConsultores) {
                                return false;
                              }
                              // Filtrar por regional (opcional, após selecionar unidade)
                              if (filtroRegionalConsultores && consultor.regional_id !== filtroRegionalConsultores) {
                                return false;
                              }
                              return true;
                            }
                            
                            // Filtros da Unidade
                            if (user?.user_type === 'labelview_unidade') {
                              // Filtro "Todos"
                              if (filtroConsultores === 'todos') {
                                return true;
                              }
                              
                              // Filtro "Indicados Direto" - consultores sem regional
                              if (filtroConsultores === 'indicados') {
                                return !consultor.regional_id;
                              }
                              
                              // Filtro "Por Regional"
                              if (filtroConsultores === 'regional') {
                                // Se não selecionou regional específica, mostra todos com regional
                                if (!filtroRegionalConsultores) {
                                  return !!consultor.regional_id;
                                }
                                // Se selecionou, filtra por regional específica
                                return consultor.regional_id === filtroRegionalConsultores;
                              }
                            }
                            
                            return true;
                          })
                          .map((consultor) => (
                          <tr key={consultor.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{consultor.id ? consultor.id.substring(0, 8) : '-'}</td>
                            <td className="px-4 py-3">{consultor.name || '-'}</td>
                            <td className="px-4 py-3">{consultor.unidade_nome || '-'}</td>
                            <td className="px-4 py-3">{consultor.regional_nome || '-'}</td>
                            <td className="px-4 py-3">{consultor.cpf || '-'}</td>
                            <td className="px-4 py-3">{consultor.city || '-'}</td>
                            <td className="px-4 py-3">{consultor.state || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                consultor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {consultor.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            {/* ✅ Master apenas visualiza, Unidades gerenciam seus Consultores */}
                            {!user?.is_labelview_master && user?.user_type !== 'labelview_master' && (
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setEditingConsultor(consultor);
                                      setShowConsultorModal(true);
                                    }}
                                    className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors p-1"
                                    title="Editar"
                                  >
                                    <Edit size={20} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBlockConsultor(consultor)}
                                    className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors p-1"
                                    title={consultor.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                  >
                                    {consultor.is_blocked ? <Unlock size={20} strokeWidth={2.5} /> : <Lock size={20} strokeWidth={2.5} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConsultor(consultor)}
                                    className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors p-1"
                                    title="Deletar"
                                  >
                                    <Trash2 size={20} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <User size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhum consultor cadastrado</p>
                    <p className="text-sm">Gerencie os consultores da rede Labelview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORNECEDOR - TIPO */}
          <TabsContent value="fornecedor-tipos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tipo de Fornecedor ({tiposFornecedor.length})</CardTitle>
                  <Button 
                    className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                    onClick={() => {
                      setEditTipoFornecedor(null);
                      setShowTipoFornecedorModal(true);
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Tipo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tiposFornecedor.length === 0 ? (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <List size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhum tipo cadastrado</p>
                    <p className="text-sm">Crie categorias para organizar seus fornecedores</p>
                    <p className="text-xs mt-2 text-[var(--cor-primaria)]">Ex: Rastreadores, Peças, Serviços, etc.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#e3dcda] border-b-2 border-[var(--cor-primaria)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Tipo de Serviço</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--cor-primaria)]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposFornecedor.map((tipo) => (
                          <tr 
                            key={tipo.id}
                            className={`border-b hover:bg-[#e3dcda] transition-colors ${
                              tipo.is_blocked ? 'bg-[#e3dcda]' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <List size={20} className="text-[var(--cor-primaria)]" />
                                <span className="font-medium text-lg">{tipo.tipo_servico}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditTipoFornecedor(tipo)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleBlockTipoFornecedor(tipo.id)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title={tipo.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                >
                                  {tipo.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteTipoFornecedor(tipo.id)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Deletar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* EQUIPAMENTOS (RASTREADORES) */}
          <TabsContent value="trackers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Equipamentos de Rastreamento ({equipamentos.length})</CardTitle>
                  <Button 
                    className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                    onClick={() => {
                      setEditEquipamento(null);
                      setShowEquipamentoModal(true);
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Equipamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {equipamentos.length === 0 ? (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <Truck size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhum equipamento cadastrado</p>
                    <p className="text-sm">Cadastre equipamentos de rastreamento GPS</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#e3dcda] border-b-2 border-[var(--cor-primaria)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Empresa</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Nº Série</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">IMEI</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Telefone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Operadora</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Tipo</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--cor-primaria)]">Situação</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--cor-primaria)]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipamentos.map((equipamento) => (
                          <tr 
                            key={equipamento.id}
                            className={`border-b hover:bg-[#e3dcda] transition-colors ${
                              equipamento.is_blocked ? 'bg-[#e3dcda]' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Truck size={18} className="text-[var(--cor-primaria)]" />
                                <span className="font-medium">{equipamento.empresa}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--cor-primaria)]">{equipamento.numero_serie}</td>
                            <td className="px-4 py-3 text-sm text-[var(--cor-primaria)]">{equipamento.numero_imei || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[var(--cor-primaria)]">{equipamento.telefone || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-[#e3dcda] text-[var(--cor-primaria)] rounded text-xs font-medium">
                                {equipamento.operadora}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--cor-primaria)]">{equipamento.tipo}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                equipamento.situacao === 'Disponível' 
                                  ? 'bg-[#e3dcda] text-[#2fa31c]' 
                                  : equipamento.situacao === 'Instalado'
                                  ? 'bg-[#e3dcda] text-[var(--cor-primaria)]'
                                  : 'bg-[#e3dcda] text-[var(--cor-primaria)]'
                              }`}>
                                {equipamento.situacao}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditEquipamento(equipamento)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleBlockEquipamento(equipamento.id)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title={equipamento.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                >
                                  {equipamento.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteEquipamento(equipamento.id)}
                                  className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                  title="Deletar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* TÉCNICOS */}
          <TabsContent value="tecnicos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Técnicos ({tecnicos.length})</CardTitle>
                  <Button 
                    className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                    onClick={() => setShowTecnicoModal(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Técnico
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-center text-[var(--cor-primaria)] py-8">Lista de técnicos em construção</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIPO DE VEÍCULO */}
          <TabsContent value="tipo-veiculo" className="space-y-6">
            {activeTab === 'tipo-veiculo' && tiposVeiculoLoaded && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">Tipos de Veículo ({Array.isArray(tiposVeiculo) ? tiposVeiculo.length : 0})</div>
                  {user.user_type === 'labelview_master' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="border-[#2fa31c] text-[#2fa31c] hover:bg-[#2fa31c] hover:text-white"
                        onClick={async () => {
                          if (!window.confirm('Executar migração para adicionar Valor Máximo FIPE (R$ 120.000) em TODOS os tipos de veículos existentes?')) return;
                          
                          try {
                            const token = localStorage.getItem('token');
                            const response = await axios.post(`${API}/labelview/migrar-valor-fipe-maximo`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            
                            if (response.data.success) {
                              toast.success(`Migração concluída! ${response.data.tipos_atualizados} tipos atualizados.`);
                              await loadData();
                            }
                          } catch (error) {
                            toast.error('Erro na migração');
                            console.error(error);
                          }
                        }}
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Migrar Valor FIPE
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={async () => {
                          if (!window.confirm('LIMPAR todas as imagens dos tipos de veículos? Os campos ficarão vazios para você adicionar fotos corretas manualmente. Esta ação não pode ser desfeita.')) return;
                          
                          try {
                            const token = localStorage.getItem('token');
                            toast.info('Limpando imagens... aguarde.');
                            
                            // Chamar endpoint para limpar
                            const response = await axios.post(`${API}/setup/clear-vehicle-images`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            
                            if (response.data.success) {
                              toast.success(`✅ ${response.data.limpos} tipos limpos! Campos vazios agora. Recarregando...`);
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            } else {
                              toast.error(`Erro: ${response.data.error || 'Erro desconhecido'}`);
                            }
                          } catch (error) {
                            toast.error('Erro ao limpar imagens');
                            console.error(error);
                          }
                        }}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Limpar Imagens
                      </Button>
                      <Button 
                        className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c]"
                        onClick={() => {
                          setEditTipoVeiculo(null);
                          setShowTipoVeiculoModal(true);
                        }}
                      >
                        <Plus size={16} className="mr-2" />
                        Novo Tipo
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!Array.isArray(tiposVeiculo) || tiposVeiculo.length === 0 ? (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <Car size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhum tipo de veículo cadastrado</p>
                    <p className="text-sm">Cadastre os tipos de veículos disponíveis</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#e3dcda] border-b-2 border-[var(--cor-primaria)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Categoria</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--cor-primaria)]">Situação</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--cor-primaria)]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiposVeiculo && tiposVeiculo.map((tipo) => tipo && tipo.id && (
                          <tr 
                            key={`tipo-veiculo-${tipo.id}`}
                            className={`border-b hover:bg-[#e3dcda] transition-colors ${
                              tipo.is_blocked ? 'bg-[#e3dcda]' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Car size={18} className="text-[var(--cor-primaria)]" />
                                <span className="font-medium">{tipo.nome}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--cor-primaria)]">{tipo.categoria}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                tipo.ativo
                                  ? 'bg-[#e3dcda] text-[#2fa31c]'
                                  : 'bg-[#e3dcda] text-[var(--cor-primaria)]'
                              }`}>
                                {tipo.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {user.user_type === 'labelview_master' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditTipoVeiculo(tipo);
                                        setShowTipoVeiculoModal(true);
                                      }}
                                      className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                      title="Editar"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleBlockTipoVeiculo(tipo.id)}
                                      className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                      title={tipo.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                    >
                                      {tipo.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTipoVeiculo(tipo.id)}
                                      className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                                      title="Deletar"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500 italic">Somente visualização</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>



          {/* FORNECEDORES - CADASTRO */}
          <TabsContent value="fornecedores" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cadastro de Fornecedores ({fornecedores.length})</CardTitle>
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => setShowFornecedorModal(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Cadastro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fornecedores.length === 0 ? (
                  <div className="text-center py-8 text-[var(--cor-primaria)]">
                    <Warehouse size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                    <p className="text-lg font-medium">Nenhum fornecedor cadastrado</p>
                    <p className="text-sm">Gerencie os fornecedores de serviços e produtos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#e3dcda] border-b-2 border-amber-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Tipo de Serviço</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Natureza</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Contato</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--cor-primaria)]">Área de Atendimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fornecedores.map((fornecedor) => (
                          <tr key={fornecedor.id} className="border-b hover:bg-[#e3dcda] transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">
                                  {fornecedor.nome_exibicao || fornecedor.nome_fantasia || fornecedor.nome || fornecedor.razao_social}
                                </p>
                                <p className="text-xs text-[var(--cor-primaria)]">
                                  {fornecedor.natureza === 'fisica' ? fornecedor.cpf : fornecedor.cnpj}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                {fornecedor.tipo_servico_nome || 'Não definido'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {fornecedor.natureza === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {fornecedor.telefone_contato || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {fornecedor.area_atendimento || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARCEIROS */}
          <TabsContent value="parceiros" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Parceiros</CardTitle>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus size={16} className="mr-2" />
                    Novo Parceiro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[var(--cor-primaria)]">
                  <Handshake size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                  <p className="text-lg font-medium">Nenhum parceiro cadastrado</p>
                  <p className="text-sm">Gerencie os parceiros de negócio</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TERCEIROS */}
          <TabsContent value="terceiros" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Terceiros</CardTitle>
                  <Button className="bg-gray-600 hover:bg-gray-700">
                    <Plus size={16} className="mr-2" />
                    Novo Terceiro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[var(--cor-primaria)]">
                  <Users2 size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                  <p className="text-lg font-medium">Nenhum terceiro cadastrado</p>
                  <p className="text-sm">Gerencie usuários terceiros do sistema</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Planos Automáticos - Unidades */}
          <TabsContent value="planos-automaticos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield size={20} className="text-[#2fa31c]" />
                      Meus Planos Automáticos ({meusPlanos.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Planos criados automaticamente com base nas tabelas do Master
                    </p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] hover:opacity-90"
                    onClick={() => setShowCriarPlanoUnidade(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Criar Novos Planos
                  </Button>
                </div>

                {/* Filtro por Tipo de Veículo */}
                {meusPlanos.length > 0 && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">
                        Filtrar por tipo:
                      </label>
                      <select
                        value={filtroTipoVeiculo}
                        onChange={(e) => setFiltroTipoVeiculo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent text-sm"
                      >
                        <option value="todos">Todos os Tipos</option>
                        {Array.from(new Set(meusPlanos.map(p => p.tipo_veiculo))).map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                      {filtroTipoVeiculo !== 'todos' && (
                        <span className="text-sm text-gray-600">
                          ({meusPlanos.filter(p => p.tipo_veiculo === filtroTipoVeiculo).length} planos)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Tem certeza que deseja deletar TODOS os ${meusPlanos.length} planos?\n\nEsta ação não pode ser desfeita!`)) {
                          return;
                        }
                        try {
                          const response = await axios.post(`${API}/labelview/planos/limpar-todos`, {}, { headers });
                          if (response.data.success) {
                            toast.success(`✅ ${response.data.deleted_count} planos deletados!`);
                            await fetchMeusPlanos();
                          }
                        } catch (error) {
                          toast.error('Erro ao deletar planos: ' + (error.response?.data?.detail || error.message));
                        }
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                      🗑️ Limpar Todos os Planos
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {meusPlanos.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-medium text-gray-700 mb-2">Nenhum plano criado</p>
                    <p className="text-sm text-gray-600 mb-6">
                      Crie planos automaticamente definindo os percentuais sobre as tabelas do Master
                    </p>
                    <div className="max-w-2xl mx-auto bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-left">
                      <p className="font-semibold text-blue-800 mb-2">Como funciona:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Escolha o tipo de veículo (Carros Leves, Moto, etc)</li>
                        <li>• Defina o percentual para cada cobertura que deseja oferecer</li>
                        <li>• Sistema cria automaticamente 12 planos (uma para cada faixa FIPE)</li>
                        <li>• Seus clientes verão apenas os valores finais calculados</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Agrupar planos por tipo de veículo */}
                    {Object.entries(
                      meusPlanos
                        .filter(plano => filtroTipoVeiculo === 'todos' || plano.tipo_veiculo === filtroTipoVeiculo)
                        .reduce((acc, plano) => {
                          const tipo = plano.tipo_veiculo;
                          if (!acc[tipo]) acc[tipo] = [];
                          acc[tipo].push(plano);
                          return acc;
                        }, {})
                    ).map(([tipoVeiculo, planosDoTipo]) => (
                      <div key={tipoVeiculo} className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Car size={20} className="text-[#2fa31c]" />
                            {tipoVeiculo}
                            <span className="text-sm font-normal text-gray-600">
                              ({planosDoTipo.length} planos)
                            </span>
                          </h3>
                          <button
                            onClick={() => handleDeletarTodosTipoVeiculo(tipoVeiculo)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            <Trash2 size={16} />
                            Deletar Todos
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {planosDoTipo.slice(0, 12).map((plano, idx) => (
                            <div 
                              key={plano.id}
                              className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-600">
                                  Faixa {idx + 1}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  plano.ativo 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {plano.ativo ? 'Ativo' : 'Bloqueado'}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-700 mb-2">
                                <span className="font-medium">FIPE:</span>{' '}
                                R$ {(plano.valor_fipe_min / 1000).toFixed(0)}k - {(plano.valor_fipe_max / 1000).toFixed(0)}k
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-2">
                                <strong>
                                  {(plano.coberturas_principais?.length || plano.coberturas?.length || 0)} principais
                                  {plano.adicionais?.length > 0 && ` + ${plano.adicionais.length} adicionais`}
                                </strong>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-200 mb-2">
                                <div className="text-xl font-bold text-[#2fa31c]">
                                  R$ {plano.valor_total_mensal?.toFixed(2) || '0.00'}
                                  <span className="text-xs font-normal text-gray-600">/mês</span>
                                </div>
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                                <button
                                  onClick={() => handleEditarPlano(plano)}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[var(--cor-primaria)] text-white rounded hover:opacity-90 transition-opacity text-xs font-medium"
                                  title="Editar percentuais"
                                >
                                  <Edit2 size={14} />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleBloquearPlano(plano.id, plano.ativo)}
                                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded transition-opacity text-xs font-medium text-white ${
                                    plano.ativo
                                      ? 'bg-orange-600 hover:opacity-90'
                                      : 'bg-[#2fa31c] hover:opacity-90'
                                  }`}
                                  title={plano.ativo ? 'Bloquear' : 'Desbloquear'}
                                >
                                  {plano.ativo ? <Lock size={14} /> : <Unlock size={14} />}
                                  {plano.ativo ? 'Bloquear' : 'Ativar'}
                                </button>
                                <button
                                  onClick={() => handleDeletarPlano(plano.id, plano.tipo_veiculo)}
                                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:opacity-90 transition-opacity text-xs font-medium"
                                  title="Deletar plano"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🔧 MANUTENÇÃO - APENAS MASTER */}
          <TabsContent value="manutencao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="text-[var(--cor-primaria)]" />
                  Ferramentas de Manutenção
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Ferramentas administrativas para corrigir problemas no sistema
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Corrigir Unidade_ID */}
                <div className="border-2 border-[var(--cor-primaria)]/20 rounded-lg p-6 bg-gradient-to-br from-white to-[#f0f9ff]">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[var(--cor-primaria)] rounded-lg">
                      <Users className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[var(--cor-primaria)] mb-2">
                        🔧 Correção Completa de Vínculos Labelview
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Corrige automaticamente os vínculos de <strong>TODOS</strong> os usuários do sistema Labelview: Unidades, Regionais, Consultores e Clientes.
                      </p>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ Problemas que resolve:</strong><br/>
                          • Tela em branco em &quot;Pessoas &gt; Consultor&quot;<br/>
                          • Usuários sem vínculo com unidade/regional<br/>
                          • Clientes sem rastreamento de indicação<br/>
                          • Hierarquia quebrada no sistema
                        </p>
                      </div>
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                        <p className="text-sm text-green-800">
                          <strong>✅ O que faz:</strong><br/>
                          🏢 <strong>Unidades:</strong> Seta unidade_id (próprio ID)<br/>
                          📍 <strong>Regionais:</strong> Vincula com unidade + seta regional_id<br/>
                          👤 <strong>Consultores:</strong> Vincula com unidade + regional + seta consultor_id<br/>
                          👥 <strong>Clientes:</strong> Herda unidade_id do consultor que indicou
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            toast.info('Executando correção...');
                            
                            // Garantir que temos o token atualizado
                            const currentToken = localStorage.getItem('token') || token;
                            const authHeaders = {
                              'Authorization': `Bearer ${currentToken}`,
                              'Content-Type': 'application/json'
                            };
                            
                            console.log('🔧 Executando correção de unidade_id...');
                            console.log('📡 Endpoint:', `${API}/admin/fix-unidade-user`);
                            
                            const response = await axios.post(
                              `${API}/admin/fix-all-labelview-users`,
                              {},
                              { headers: authHeaders }
                            );
                            
                            console.log('✅ Resposta completa:', response.data);
                            
                            if (response.data.success) {
                              const detalhes = response.data.detalhes;
                              
                              console.log('📊 RESULTADO DETALHADO:');
                              console.log(`🏢 Unidades: ${detalhes.unidades.corrigidos}/${detalhes.unidades.total}`);
                              console.log(`📍 Regionais: ${detalhes.regionais.corrigidos}/${detalhes.regionais.total}`);
                              console.log(`👤 Consultores: ${detalhes.consultores.corrigidos}/${detalhes.consultores.total}`);
                              console.log(`👥 Clientes: ${detalhes.clientes.corrigidos}/${detalhes.clientes.total}`);
                              
                              // Mostrar erros se houver
                              if (detalhes.unidades.erros.length > 0) console.warn('⚠️ Erros Unidades:', detalhes.unidades.erros);
                              if (detalhes.regionais.erros.length > 0) console.warn('⚠️ Erros Regionais:', detalhes.regionais.erros);
                              if (detalhes.consultores.erros.length > 0) console.warn('⚠️ Erros Consultores:', detalhes.consultores.erros);
                              if (detalhes.clientes.erros.length > 0) console.warn('⚠️ Erros Clientes:', detalhes.clientes.erros);
                              
                              toast.success(
                                `✅ Correção COMPLETA concluída!\n\n` +
                                `🏢 Unidades: ${detalhes.unidades.corrigidos} corrigidos\n` +
                                `📍 Regionais: ${detalhes.regionais.corrigidos} corrigidos\n` +
                                `👤 Consultores: ${detalhes.consultores.corrigidos} corrigidos\n` +
                                `👥 Clientes: ${detalhes.clientes.corrigidos} corrigidos\n\n` +
                                `Total: ${response.data.total_corrigidos} usuários corrigidos!`,
                                { duration: 8000 }
                              );
                              
                              if (response.data.total_erros > 0) {
                                toast.warning(
                                  `⚠️ ${response.data.total_erros} erros encontrados.\n` +
                                  `Veja o console (F12) para detalhes.`,
                                  { duration: 5000 }
                                );
                              }
                            }
                          } catch (error) {
                            console.error('❌ Erro ao executar correção:', error);
                            console.error('❌ Detalhes:', error.response?.data);
                            
                            if (error.response?.status === 401) {
                              toast.error(
                                '🔒 Sessão expirada. Faça logout e login novamente.',
                                { duration: 5000 }
                              );
                            } else {
                              toast.error(
                                error.response?.data?.detail || 
                                'Erro ao executar correção. Verifique o console.'
                              );
                            }
                          }
                        }}
                        className="bg-[var(--cor-primaria)] hover:bg-[#2fa31c] text-white font-bold"
                      >
                        <RefreshCw size={18} className="mr-2" />
                        Executar Correção Agora
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico de Unidades e Usuários */}
                <div className="border-2 border-[#2fa31c]/20 rounded-lg p-6 bg-gradient-to-br from-white to-[#f0fff0]">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#2fa31c] rounded-lg">
                      <Search className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#2fa31c] mb-2">
                        🔍 Diagnóstico: Unidades & Usuários
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Verifica quantas unidades e usuários tipo unidade existem no sistema e mostra detalhes para debug.
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            toast.info('Buscando dados...');
                            
                            const currentToken = localStorage.getItem('token') || token;
                            const authHeaders = {
                              'Authorization': `Bearer ${currentToken}`,
                              'Content-Type': 'application/json'
                            };
                            
                            console.log('🔍 Buscando unidades e usuários...');
                            
                            // Buscar unidades
                            const unidadesRes = await axios.get(
                              `${API}/labelview/unidades`,
                              { headers: authHeaders }
                            );
                            
                            // Buscar usuários tipo unidade
                            const usersRes = await axios.get(
                              `${API}/labelview/usuarios`,
                              { headers: authHeaders }
                            );
                            
                            const unidades = unidadesRes.data.unidades || [];
                            const usuarios = usersRes.data.usuarios || [];
                            const usuariosUnidade = usuarios.filter(u => u.user_type === 'labelview_unidade');
                            
                            console.log('📊 DIAGNÓSTICO:');
                            console.log(`📋 Total de unidades: ${unidades.length}`);
                            console.log(`👤 Total de usuários tipo unidade: ${usuariosUnidade.length}`);
                            
                            if (unidades.length === 0) {
                              console.warn('⚠️ PROBLEMA: Nenhuma unidade cadastrada!');
                              console.log('💡 SOLUÇÃO: Cadastre unidades primeiro em "Configurações > Unidades"');
                              
                              toast.error(
                                '⚠️ Nenhuma unidade cadastrada!\n\n' +
                                'Você precisa cadastrar as unidades primeiro:\n' +
                                '1. Vá em "Configurações > Unidades"\n' +
                                '2. Cadastre a unidade\n' +
                                '3. Depois volte aqui e execute a correção',
                                { duration: 10000 }
                              );
                            } else {
                              // Log seguro - apenas contagens, sem dados pessoais
                              console.log(`✅ Diagnóstico: ${unidades.length} unidades, ${usuariosUnidade.length} usuários`);
                              
                              // Verificar vínculos
                              const semVinculo = usuariosUnidade.filter(u => !u.unidade_id);
                              
                              if (semVinculo.length > 0) {
                                console.warn(`⚠️ ${semVinculo.length} usuário(s) SEM unidade_id!`);
                              }
                              
                              toast.success(
                                `✅ Diagnóstico completo!\n\n` +
                                `📋 Unidades: ${unidades.length}\n` +
                                `👤 Usuários tipo unidade: ${usuariosUnidade.length}\n` +
                                `⚠️ Sem vínculo: ${semVinculo.length}\n\n` +
                                `Veja o console (F12) para detalhes completos`,
                                { duration: 8000 }
                              );
                            }
                            
                          } catch (error) {
                            console.error('❌ Erro ao buscar dados:', error);
                            toast.error('Erro ao buscar dados. Verifique o console.');
                          }
                        }}
                        className="bg-[#2fa31c] hover:bg-[var(--cor-primaria)] text-white font-bold"
                      >
                        <Search size={18} className="mr-2" />
                        Executar Diagnóstico
                      </Button>
                      
                      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Dica:</strong> Execute este diagnóstico ANTES da correção automática para ver o estado atual do sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DELETAR Dados Antigos */}
                <div className="border-2 border-red-500/20 rounded-lg p-6 bg-gradient-to-br from-white to-red-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500 rounded-lg">
                      <Trash2 className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-600 mb-2">
                        🗑️ Deletar Dados Antigos
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">
                        <strong>⚠️ ATENÇÃO:</strong> Esta ação irá <strong>DELETAR PERMANENTEMENTE</strong> todos os registros com emails contendo "@transmill", "@transmill" ou "@demo.com" (dados de teste).
                      </p>
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                        <p className="text-sm text-red-800">
                          <strong>⚠️ Esta ação NÃO pode ser desfeita!</strong><br/>
                          • Remove regionais antigos<br/>
                          • Remove clientes de teste<br/>
                          • Remove qualquer usuário com email antigo<br/>
                          • Limpa o banco de dados definitivamente
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          // Confirmar ação
                          if (!window.confirm(
                            '⚠️ ATENÇÃO! Esta ação irá DELETAR PERMANENTEMENTE todos os dados com emails @transmill, @transmill e @demo.com.\n\n' +
                            'Esta ação NÃO PODE SER DESFEITA!\n\n' +
                            'Tem certeza que deseja continuar?'
                          )) {
                            return;
                          }
                          
                          try {
                            toast.info('Deletando dados antigos...');
                            
                            const currentToken = localStorage.getItem('token') || token;
                            const authHeaders = {
                              'Authorization': `Bearer ${currentToken}`,
                              'Content-Type': 'application/json'
                            };
                            
                            console.log('🗑️ Executando limpeza de dados antigos...');
                            
                            const response = await axios.post(
                              `${API}/admin/cleanup-invalid-users`,
                              {},
                              { headers: authHeaders }
                            );
                            
                            console.log('✅ Resposta:', response.data);
                            
                            if (response.data.success) {
                              const deletados = response.data.deletados || [];
                              
                              console.log('🗑️ DELETADOS:');
                              deletados.forEach(d => console.log(`   ❌ ${d}`));
                              
                              toast.success(
                                `✅ Limpeza concluída!\n\n` +
                                `🗑️ Deletados: ${response.data.total_deletados} usuários\n\n` +
                                `Veja o console para detalhes`,
                                { duration: 6000 }
                              );
                              
                              if (response.data.erros && response.data.erros.length > 0) {
                                console.warn('⚠️ Erros:', response.data.erros);
                                toast.warning(`⚠️ ${response.data.erros.length} erros. Veja o console.`);
                              }
                            }
                          } catch (error) {
                            console.error('❌ Erro ao deletar:', error);
                            toast.error(
                              error.response?.data?.detail || 
                              'Erro ao deletar dados. Verifique o console.'
                            );
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold"
                      >
                        <Trash2 size={18} className="mr-2" />
                        DELETAR Dados Antigos
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* 🔴 NOVO: RESET COMPLETO DE PRODUÇÃO */}
                <div className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <RefreshCw className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-600 mb-2">
                        🔄 RESET COMPLETO DE PRODUÇÃO
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">
                        <strong>✨ SOLUÇÃO AUTOMÁTICA:</strong> Este botão faz a limpeza COMPLETA do sistema e recria as 4 contas de produção com os IDs corretos.
                      </p>
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4">
                        <p className="text-sm text-purple-800">
                          <strong>O que este botão faz:</strong><br/>
                          ✅ Deleta TODAS as contas de teste (@demo.com, @transmill.com, etc)<br/>
                          ✅ Mantém as 4 contas de produção<br/>
                          ✅ Recria o Rafael com o ID correto da unidade<br/>
                          ✅ Limpa todas as coleções de dados de teste<br/>
                          ✅ Resolve o problema do "Consultores: 0/1"
                        </p>
                      </div>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ IMPORTANTE:</strong> Execute este botão APÓS o deploy para garantir que os IDs da unidade em produção sejam usados corretamente!
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!window.confirm(
                            '🔄 RESET COMPLETO DE PRODUÇÃO\n\n' +
                            'Esta ação irá:\n' +
                            '• Deletar TODOS os dados de teste\n' +
                            '• Manter apenas as 4 contas de produção\n' +
                            '• Recriar o Rafael com ID correto\n\n' +
                            'Deseja continuar?'
                          )) {
                            return;
                          }
                          
                          try {
                            console.log('🔄 Executando RESET COMPLETO DE PRODUÇÃO...');
                            
                            const currentToken = localStorage.getItem('token') || token;
                            const authHeaders = {
                              'Authorization': `Bearer ${currentToken}`,
                              'Content-Type': 'application/json'
                            };
                            
                            const response = await axios.post(
                              `${API}/production/reset-to-clean-state`,
                              { secret_key: 'transmill-production-reset-2025' },
                              { headers: authHeaders }
                            );
                            
                            console.log('✅ Resposta:', response.data);
                            
                            if (response.data.success) {
                              toast.success(
                                `✅ RESET COMPLETO!\n\n` +
                                `Total de usuários: ${response.data.usuarios_finais}\n` +
                                `Usuários deletados: ${response.data.usuarios_deletados}\n\n` +
                                `✅ Rafael recriado com unidade_id correto!\n` +
                                `🎉 Sistema pronto para uso!`,
                                { duration: 8000 }
                              );
                              
                              // Mostrar detalhes no console
                              console.log('📊 DETALHES DO RESET:');
                              console.log(`   Usuários finais: ${response.data.usuarios_finais}`);
                              console.log(`   Usuários deletados: ${response.data.usuarios_deletados}`);
                              console.log(`   Rafael unidade_id: ${response.data.rafael_unidade_id}`);
                              console.log('   Contas mantidas:', response.data.contas_produção);
                              
                              // Recarregar dados após reset
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            }
                          } catch (error) {
                            console.error('❌ Erro ao executar reset:', error);
                            toast.error(
                              error.response?.data?.detail || 
                              'Erro ao executar reset. Verifique o console.'
                            );
                          }
                        }}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                      >
                        <RefreshCw size={18} className="mr-2" />
                        🔄 EXECUTAR RESET COMPLETO
                      </Button>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM duplicado removido - mantida apenas a versão principal nas linhas anteriores */}
        </Tabs>
          </div>
        </div>
      </div>

      {/* Modal Cadastrar/Editar Plano */}

      {/* Modal Listar Planos */}
      {showPlanosListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--cor-primaria)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Tipos de Planos</h2>
              <button
                onClick={() => setShowPlanosListModal(false)}
                className="text-[var(--cor-primaria)] hover:text-[var(--cor-primaria)]"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {planos.length === 0 ? (
                <div className="text-center py-12 text-[var(--cor-primaria)]">
                  <FileText size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                  <p className="text-lg font-medium">Nenhum plano cadastrado</p>
                  <p className="text-sm">Clique em "Cadastrar Plano" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planos.map((plano) => (
                    <div
                      key={plano.id}
                      className={`p-4 rounded-lg border-2 ${
                        plano.is_blocked
                          ? 'bg-[#e3dcda] border-[var(--cor-primaria)]'
                          : 'bg-white border-[var(--cor-primaria)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{plano.nome}</h3>
                          <p className="text-sm text-[var(--cor-primaria)]">
                            Status: {plano.is_blocked ? '🔴 Bloqueado' : '🟢 Ativo'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlano(plano)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleBlockPlano(plano.id)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title={plano.is_blocked ? 'Desbloquear' : 'Bloquear'}
                          >
                            {plano.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeletePlano(plano.id)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Listar Fornecedores */}
      {showFornecedoresListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--cor-primaria)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Fornecedores</h2>
              <button
                onClick={() => setShowFornecedoresListModal(false)}
                className="text-[var(--cor-primaria)] hover:text-[var(--cor-primaria)]"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {fornecedores.length === 0 ? (
                <div className="text-center py-12 text-[var(--cor-primaria)]">
                  <Warehouse size={48} className="mx-auto mb-4 text-[var(--cor-primaria)]" />
                  <p className="text-lg font-medium">Nenhum fornecedor cadastrado</p>
                  <p className="text-sm">Clique em "Cadastrar" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fornecedores.map((fornecedor) => (
                    <div
                      key={fornecedor.id}
                      className={`p-4 rounded-lg border-2 ${
                        fornecedor.is_blocked
                          ? 'bg-[#e3dcda] border-[var(--cor-primaria)]'
                          : 'bg-white border-[var(--cor-primaria)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {fornecedor.nome_razao_social}
                          </h3>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--cor-primaria)]">
                            <p>
                              <strong>Serviço:</strong> {
                                fornecedor.servico_oferecido === 'contabilidade' ? 'Contabilidade' :
                                fornecedor.servico_oferecido === 'grafica' ? 'Gráfica' :
                                fornecedor.servico_oferecido === 'oficina' ? 'Oficina' :
                                fornecedor.servico_oferecido === 'eletricista' ? 'Eletricista' :
                                'Outros'
                              }
                            </p>
                            <p><strong>CNPJ/CPF:</strong> {fornecedor.cnpj_cpf}</p>
                            <p><strong>Email:</strong> {fornecedor.email}</p>
                            <p><strong>WhatsApp:</strong> {fornecedor.whatsapp}</p>
                            <p><strong>Representante:</strong> {fornecedor.nome_representante}</p>
                            <p className="md:col-span-2"><strong>Endereço:</strong> {fornecedor.endereco_completo}</p>
                          </div>
                          <p className="text-sm text-[var(--cor-primaria)] mt-2">
                            Status: {fornecedor.is_blocked ? '🔴 Bloqueado' : '🟢 Ativo'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditFornecedor(fornecedor)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleBlockFornecedor(fornecedor.id)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title={fornecedor.is_blocked ? 'Desbloquear' : 'Bloquear'}
                          >
                            {fornecedor.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeleteFornecedor(fornecedor.id)}
                            className="text-[var(--cor-primaria)] hover:text-[#2fa31c] active:text-[#2fa31c] transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals simplificados serão adicionados em seguida */}
      
      {/* Modal de Colaborador */}
      <ColaboradorFormModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSuccess={fetchEmployees}
        API={API}
        token={token}
      />

      {/* Modal de Unidade - apenas para visualização, não permite criar novas */}
      {/* Unidades são criadas automaticamente quando franquias se cadastram */}

      {/* Modal de Regional - disponível para Franquia/Unidade cadastrar suas regionais */}
      {(user?.user_type === 'labelview_unidade' || user?.user_type === 'franquia_admin') && (
        <RegionalFormModal
          isOpen={showRegionalModal}
          onClose={() => setShowRegionalModal(false)}
          onSuccess={() => {
            fetchRegionais();
            setShowRegionalModal(false);
            toast.success('Regional cadastrada com sucesso!');
          }}
        />
      )}

      {/* Modal de Consultor - disponível para Franquia/Unidade/Regional cadastrar consultores */}
      {(user?.user_type === 'labelview_unidade' || user?.user_type === 'labelview_regional' || user?.user_type === 'franquia_admin') && (
        <ConsultorFormModal
          isOpen={showConsultorModal}
          onClose={() => {
            setShowConsultorModal(false);
            setEditingConsultor(null);
          }}
          onSuccess={() => {
            fetchConsultores();
            setShowConsultorModal(false);
            setEditingConsultor(null);
            toast.success(editingConsultor ? 'Consultor atualizado com sucesso!' : 'Consultor cadastrado com sucesso!');
          }}
          editingConsultor={editingConsultor}
          unidades={unidades}
          regionais={regionais}
          currentUser={user}
        />
      )}

      {/* Modal de Editar Perfil */}
      <EditProfileLabelview
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        userProfile={user}
        onSuccess={async (responseData) => {
          console.log('📥 EditProfileLabelview onSuccess chamado:', responseData);
          // Atualizar dados do usuário no contexto
          if (responseData?.user) {
            console.log('👤 Atualizando usuário com logo_url:', responseData.user.logo_url);
            updateUser(responseData.user);
          }
          // Recarregar dados para garantir sincronização
          await recarregarDadosUsuario();
        }}
      />

      {/* Modal de Técnico */}
      <TecnicoFormModal
        isOpen={showTecnicoModal}
        onClose={() => setShowTecnicoModal(false)}
        onSuccess={() => {
          fetchTecnicos();
          setShowTecnicoModal(false);
          toast.success('Técnico cadastrado com sucesso!');
        }}
      />


      {/* Modal de Tipo Fornecedor */}
      <TipoFornecedorModal
        isOpen={showTipoFornecedorModal}
        onClose={() => {
          setShowTipoFornecedorModal(false);
          setEditTipoFornecedor(null);
        }}
        editData={editTipoFornecedor}
        onSuccess={() => {
          fetchTiposFornecedor();
          setShowTipoFornecedorModal(false);
          setEditTipoFornecedor(null);
        }}
      />

      {/* Modal de Tipo de Veículo */}
      <TipoVeiculoModal
        isOpen={showTipoVeiculoModal}
        onClose={() => {
          setShowTipoVeiculoModal(false);
          setEditTipoVeiculo(null);
        }}
        editData={editTipoVeiculo}
        onSuccess={() => {
          fetchTiposVeiculo();
          setShowTipoVeiculoModal(false);
          setEditTipoVeiculo(null);
        }}
      />

      {/* Modal de Equipamento */}
      <EquipamentoFormModal
        isOpen={showEquipamentoModal}
        onClose={() => {
          setShowEquipamentoModal(false);
          setEditEquipamento(null);
        }}
        editData={editEquipamento}
        onSuccess={() => {
          fetchEquipamentos();
          setShowEquipamentoModal(false);
          setEditEquipamento(null);
        }}
      />





      {/* Modal de Fornecedor */}
      <FornecedorFormModal
        isOpen={showFornecedorModal}
        onClose={() => setShowFornecedorModal(false)}
        onSuccess={() => {
          fetchFornecedores();
          setShowFornecedorModal(false);
          toast.success('Fornecedor cadastrado com sucesso!');
        }}
      />

      {/* Modal de Enviar Notificação */}
      <SendNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      {/* Modal de Criar Planos Automáticos - Unidade */}
      <CriarPlanoUnidade
        isOpen={showCriarPlanoUnidade}
        onClose={() => setShowCriarPlanoUnidade(false)}
        onSuccess={() => {
          fetchMeusPlanos();
          setShowCriarPlanoUnidade(false);
        }}
      />

      {/* Modal de Editar Plano */}
      <EditarPlanoModal
        isOpen={showEditarPlanoModal}
        onClose={() => {
          setShowEditarPlanoModal(false);
          setPlanoParaEditar(null);
        }}
        plano={planoParaEditar}
        onSuccess={() => {
          fetchMeusPlanos();
        }}
      />

      {/* 🔧 MODAL DE VISTORIA - Visualizar e Aprovar/Reprovar */}
      {showVistoriaModal && clienteSelecionadoVistoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">📋 Vistoria do Cliente</h2>
                  <p className="text-white/80 mt-1">{clienteSelecionadoVistoria.nome}</p>
                </div>
                <button
                  onClick={() => setShowVistoriaModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Status Atual */}
              <div className="text-center">
                {clienteSelecionadoVistoria.vistoria_status === 'aprovada' && (
                  <Badge className="bg-[#2fa31c] text-white text-lg px-6 py-2">✅ APROVADA</Badge>
                )}
                {clienteSelecionadoVistoria.vistoria_status === 'reprovada' && (
                  <Badge className="bg-red-600 text-white text-lg px-6 py-2">❌ REPROVADA</Badge>
                )}
                {(clienteSelecionadoVistoria.vistoria_status === 'pendente' || clienteSelecionadoVistoria.vistoria_status === 'aguardando_aprovacao') && (
                  <Badge className="bg-yellow-500 text-white text-lg px-6 py-2">⏳ AGUARDANDO APROVAÇÃO</Badge>
                )}
              </div>

              {/* Dados do Cliente */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">👤 Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
                  <p><strong className="text-blue-700">Nome:</strong> {clienteSelecionadoVistoria.nome || clienteSelecionadoVistoria.full_name || 'N/A'}</p>
                  <p><strong className="text-blue-700">CPF:</strong> {clienteSelecionadoVistoria.cpf || 'N/A'}</p>
                  <p><strong className="text-blue-700">Email:</strong> {clienteSelecionadoVistoria.email || 'N/A'}</p>
                  <p><strong className="text-blue-700">Telefone:</strong> {clienteSelecionadoVistoria.telefone || clienteSelecionadoVistoria.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">🚗 Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
                  <p><strong className="text-green-700">Tipo:</strong> {clienteSelecionadoVistoria.veiculo_tipo || 'N/A'}</p>
                  <p><strong className="text-green-700">Marca:</strong> {clienteSelecionadoVistoria.veiculo_marca || 'N/A'}</p>
                  <p><strong className="text-green-700">Modelo:</strong> {clienteSelecionadoVistoria.veiculo_modelo || 'N/A'}</p>
                  <p><strong className="text-green-700">Ano:</strong> {clienteSelecionadoVistoria.veiculo_ano || 'N/A'}</p>
                  <p><strong className="text-green-700">Placa:</strong> {clienteSelecionadoVistoria.veiculo_placa || 'N/A'}</p>
                  <p><strong className="text-green-700">Valor FIPE:</strong> R$ {clienteSelecionadoVistoria.veiculo_valor_fipe || '0,00'}</p>
                </div>
              </div>

              {/* Plano Escolhido */}
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                <h3 className="font-bold text-yellow-800 mb-3">📦 Plano Escolhido</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-500 text-xs">Plano</p>
                    <p className="font-bold text-yellow-800">{clienteSelecionadoVistoria.plano_nome || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-500 text-xs">Taxa de Adesão</p>
                    <p className="font-bold text-green-600">R$ {Number(clienteSelecionadoVistoria.taxa_adesao || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-500 text-xs">Parcelas</p>
                    <p className="font-bold text-gray-800">12x</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-green-200 p-2 rounded">
                    <p className="text-gray-600 text-xs">Valor da Parcela</p>
                    <p className="font-bold text-xl text-green-700">R$ {Number(clienteSelecionadoVistoria.plano_valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
                {/* Adicionais se houver */}
                {clienteSelecionadoVistoria.adicionais && Object.keys(clienteSelecionadoVistoria.adicionais).filter(k => clienteSelecionadoVistoria.adicionais[k]).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-xs text-yellow-700 font-semibold mb-2">➕ Adicionais Contratados:</p>
                    <div className="flex flex-wrap gap-1">
                      {clienteSelecionadoVistoria.adicionais.roubo_furto && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">🔒 Roubo/Furto</span>}
                      {clienteSelecionadoVistoria.adicionais.carro_reserva && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">🚗 Carro Reserva</span>}
                      {clienteSelecionadoVistoria.adicionais.assistencia_24h && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">🚑 Assistência 24h</span>}
                      {clienteSelecionadoVistoria.adicionais.vidros && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">🪟 Vidros</span>}
                      {clienteSelecionadoVistoria.adicionais.terceiros && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">🛡️ Terceiros</span>}
                      {clienteSelecionadoVistoria.adicionais.colisao && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">💥 Colisão</span>}
                      {clienteSelecionadoVistoria.adicionais.incendio && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">🔥 Incêndio</span>}
                    </div>
                  </div>
                )}
                
                {/* Tipo de Cobertura Principal */}
                {clienteSelecionadoVistoria.tipo_cobertura && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-xs text-yellow-700 font-semibold mb-2">🛡️ Cobertura Principal:</p>
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                      {clienteSelecionadoVistoria.tipo_cobertura}
                    </span>
                  </div>
                )}
              </div>

              {/* Fotos da Vistoria */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">📷 Fotos da Vistoria</h3>
                
                {/* Verificar se há fotos disponíveis */}
                {(clienteSelecionadoVistoria.fotos_vistoria && Object.keys(clienteSelecionadoVistoria.fotos_vistoria).length > 0) || 
                 clienteSelecionadoVistoria.cnh_frente || clienteSelecionadoVistoria.cnh_verso || 
                 clienteSelecionadoVistoria.dut || clienteSelecionadoVistoria.veiculo_frente ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* CNH Frente */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.cnh_frente || clienteSelecionadoVistoria.cnh_frente) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">📄 CNH Frente</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.cnh_frente || clienteSelecionadoVistoria.cnh_frente} 
                          alt="CNH Frente" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.cnh_frente || clienteSelecionadoVistoria.cnh_frente, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* CNH Verso */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.cnh_verso || clienteSelecionadoVistoria.cnh_verso) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">📄 CNH Verso</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.cnh_verso || clienteSelecionadoVistoria.cnh_verso} 
                          alt="CNH Verso" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.cnh_verso || clienteSelecionadoVistoria.cnh_verso, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* DUT */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.dut || clienteSelecionadoVistoria.dut) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">📄 DUT</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.dut || clienteSelecionadoVistoria.dut} 
                          alt="DUT" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.dut || clienteSelecionadoVistoria.dut, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Comprovante */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.comprovante || clienteSelecionadoVistoria.comprovante) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">📄 Comprovante</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.comprovante || clienteSelecionadoVistoria.comprovante} 
                          alt="Comprovante" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.comprovante || clienteSelecionadoVistoria.comprovante, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Veículo Frente */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_frente || clienteSelecionadoVistoria.veiculo_frente) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🚗 Frente</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.veiculo_frente || clienteSelecionadoVistoria.veiculo_frente} 
                          alt="Veículo Frente" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_frente || clienteSelecionadoVistoria.veiculo_frente, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Veículo Traseira */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_traseira || clienteSelecionadoVistoria.veiculo_traseira) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🚗 Traseira</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.veiculo_traseira || clienteSelecionadoVistoria.veiculo_traseira} 
                          alt="Veículo Traseira" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_traseira || clienteSelecionadoVistoria.veiculo_traseira, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Veículo Lateral Esquerda */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_esquerda || clienteSelecionadoVistoria.veiculo_lateral_esquerda) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🚗 Lateral Esq.</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_esquerda || clienteSelecionadoVistoria.veiculo_lateral_esquerda} 
                          alt="Veículo Lateral Esquerda" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_esquerda || clienteSelecionadoVistoria.veiculo_lateral_esquerda, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Veículo Lateral Direita */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_direita || clienteSelecionadoVistoria.veiculo_lateral_direita) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🚗 Lateral Dir.</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_direita || clienteSelecionadoVistoria.veiculo_lateral_direita} 
                          alt="Veículo Lateral Direita" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.veiculo_lateral_direita || clienteSelecionadoVistoria.veiculo_lateral_direita, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Painel */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.painel || clienteSelecionadoVistoria.painel) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🚗 Painel</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.painel || clienteSelecionadoVistoria.painel} 
                          alt="Painel" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.painel || clienteSelecionadoVistoria.painel, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Hodômetro */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.hodometro || clienteSelecionadoVistoria.hodometro) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🔢 Hodômetro</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.hodometro || clienteSelecionadoVistoria.hodometro} 
                          alt="Hodômetro" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.hodometro || clienteSelecionadoVistoria.hodometro, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Motor */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.motor || clienteSelecionadoVistoria.motor) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">⚙️ Motor</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.motor || clienteSelecionadoVistoria.motor} 
                          alt="Motor" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.motor || clienteSelecionadoVistoria.motor, '_blank')}
                        />
                      </div>
                    )}
                    
                    {/* Chassi */}
                    {(clienteSelecionadoVistoria.fotos_vistoria?.chassi || clienteSelecionadoVistoria.chassi) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 text-center">🔧 Chassi</p>
                        <img 
                          src={clienteSelecionadoVistoria.fotos_vistoria?.chassi || clienteSelecionadoVistoria.chassi} 
                          alt="Chassi" 
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(clienteSelecionadoVistoria.fotos_vistoria?.chassi || clienteSelecionadoVistoria.chassi, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">
                      📭 As fotos da vistoria ainda não foram enviadas ou processadas.
                    </p>
                    <p className="text-xs text-gray-400">
                      Quando o cliente completar a vistoria, as fotos aparecerão aqui.
                    </p>
                  </div>
                )}
              </div>

              {/* Ações - Apenas Master */}
              {user.is_labelview_master && (clienteSelecionadoVistoria.vistoria_status === 'pendente' || clienteSelecionadoVistoria.vistoria_status === 'aguardando_aprovacao') && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-bold text-gray-700 text-center">⚡ Ação do Master</h3>
                  
                  {/* Campo de motivo para reprovação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Reprovação (opcional se aprovar):
                    </label>
                    <textarea
                      value={motivoReprovacao}
                      onChange={(e) => setMotivoReprovacao(e.target.value)}
                      placeholder="Ex: Fotos estão desfocadas, CNH ilegível..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--cor-primaria)] focus:outline-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={aprovarVistoria}
                      disabled={loadingVistoria}
                      className="flex-1 bg-[#2fa31c] hover:bg-[#2fa31c]/80 text-white py-4 text-lg"
                    >
                      {loadingVistoria ? '⏳ Processando...' : '✅ APROVAR VISTORIA'}
                    </Button>
                    <Button
                      onClick={reprovarVistoria}
                      disabled={loadingVistoria || !motivoReprovacao.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 text-lg"
                    >
                      {loadingVistoria ? '⏳ Processando...' : '❌ REPROVAR'}
                    </Button>
                  </div>
                </div>
              )}

              {/* URL de Continuação (se aprovada) */}
              {clienteSelecionadoVistoria.vistoria_status === 'aprovada' && clienteSelecionadoVistoria.url_continuacao && (
                <div className="bg-green-100 border-2 border-green-400 p-4 rounded-lg">
                  <h3 className="font-bold text-green-700 mb-2">🔗 URL para Cliente Continuar</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/continuar-contratacao/${clienteSelecionadoVistoria.url_continuacao}`}
                      className="flex-1 px-3 py-2 border rounded bg-white text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/continuar-contratacao/${clienteSelecionadoVistoria.url_continuacao}`);
                        toast.success('URL copiada!');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      📋 Copiar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end">
              <Button
                onClick={() => setShowVistoriaModal(false)}
                variant="outline"
                className="border-[var(--cor-primaria)] text-[var(--cor-primaria)] hover:bg-[#e3dcda]"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento do PWA */}
      {user.user_type === 'labelview_unidade' && (
        <PWAShareModal 
          isOpen={showPWAModal} 
          onClose={() => setShowPWAModal(false)} 
          unidade={user}
        />
      )}
    </div>
  );
};

export default MasterLabelviewDashboard;
