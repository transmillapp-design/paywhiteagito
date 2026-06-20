import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import TransmillLogo from './TransmillLogo';
import ThemeToggle from './ThemeToggle';
import SubUsersManager from './SubUsersManager';
import CompleteUserProfile from './CompleteUserProfile';
import ChatbotTraining from './ChatbotTraining';
// Ecossistema Transmill - Serviços completos
import LojasPage from './LojasPage';
import PrestadoresPage from './PrestadoresPage';
import MobilityHome from './mobility/MobilityHome';
import WalletModal from './WalletModal';
import { 
  Crown, 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  LogOut,
  Activity,
  BarChart3,
  Wallet,
  Store,
  Gift,
  ArrowUpRight,
  History,
  ArrowDownLeft,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  UserCheck,
  UserX,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tags,
  Plus,
  Edit,
  Save,
  X,
  Bell,
  Send,
  Image,
  Users2,
  User,
  Globe,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Wifi,
  Smartphone,
  Settings,
  Menu,
  ChevronLeft,
  Home,
  Target,
  UserPlus,
  Briefcase,
  Stethoscope,
  UserCog,
  Key,
  Lock,
  Unlock,
  FileImage,
  Bot,
  Video,
  Network,
  Car,
  Wrench,
  KeyRound
} from 'lucide-react';
import axios from 'axios';
import SocialManagement from './SocialManagement';
import CreditCardFeesManagement from './CreditCardFeesManagement';
import FranquiaIntegracoesPanel from './FranquiaIntegracoesPanel';

const MasterDashboard = ({ initialTab = 'overview', hideHeader = false, franquiaContext = null }) => {
  const navigate = useNavigate();

  // Se é contexto de franquia, usar cores da franquia
  const isFranquiaMode = Boolean(franquiaContext);
  const corPrimaria = franquiaContext?.cor_primaria || '#1a59ad';
  const corSecundaria = franquiaContext?.cor_secundaria || '#ffffff';

  // Função auxiliar para formatar tipo de usuário
  const formatUserType = (userType) => {
    const typeMap = {
      'cliente': 'Cliente',
      'lojista': 'Lojista',
      'service_provider': 'Prestador',
      'labelview_master': 'Master Labelview',
      'labelview_unidade': 'Unidade Labelview',
      'labelview_regional': 'Regional Labelview',
      'labelview_consultor': 'Consultor Labelview'
    };
    return typeMap[userType] || userType;
  };

  // Função auxiliar para cor do badge por tipo de usuário
  const getUserTypeBadgeColor = (userType) => {
    if (userType === 'cliente') return 'bg-[#F5F5F5] text-[#005B9C]';
    if (userType === 'lojista') return 'bg-orange-100 text-orange-800';
    if (userType === 'service_provider') return 'bg-[#F5F5F5] text-[#005B9C]';
    if (userType.startsWith('labelview')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const { user, logout, token, API } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Tab state management
  const [activeTab, setActiveTab] = useState(initialTab);
  console.log('🏷️ Current activeTab:', activeTab);
  
  // Simplified tab change handler
  const handleTabChange = (value) => {
    console.log('🔄 Tab changing to:', value);
    setActiveTab(value);
  };

  // Integrações (modo master: selecionar franquia)
  const [integracoesSlug, setIntegracoesSlug] = useState('');
  const [franquiasList, setFranquiasList] = useState([]);
  useEffect(() => {
    if (activeTab === 'integracoes' && !isFranquiaMode && franquiasList.length === 0) {
      axios.get(`${API}/franquias`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setFranquiasList(res.data?.franquias || res.data || []))
        .catch(() => {});
    }
  }, [activeTab, isFranquiaMode]);
  
  // Withdrawal states
  const [withdrawalData, setWithdrawalData] = useState({ 
    amount: '', 
    pix_key: '', 
    pix_key_type: 'cpf',
    bank_name: ''
  });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  
  // User management states
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNetwork, setUserNetwork] = useState(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  
  // 🔴 MONITORAMENTO TEMPO REAL - NOVOS CADASTROS
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Compliance states
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceUser, setComplianceUser] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  
  // Business segments states
  const [businessSegments, setBusinessSegments] = useState([]);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [segmentLoading, setSegmentLoading] = useState(false);

  // Service provider types states
  const [serviceProviderTypes, setServiceProviderTypes] = useState([]);
  const [providerTypeData, setProviderTypeData] = useState({
    name: '',
    description: '',
    category: '',
    icon: '',
    is_active: true
  });
  const [providerTypeLoading, setProviderTypeLoading] = useState(false);
  const [editingProviderType, setEditingProviderType] = useState(null);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    image: '',
    target_type: 'all',
    target_user_id: '',
    priority: 'normal'
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationImagePreview, setNotificationImagePreview] = useState(null);
  
  // Push Notification states
  const [sendPushNotification, setSendPushNotification] = useState(false);
  const [pushSubscribersCount, setPushSubscribersCount] = useState(0);
  const [pushLoading, setPushLoading] = useState(false);

  // Hierarchical users states
  const [hierarchicalUsers, setHierarchicalUsers] = useState([]);
  const [hierarchicalUsersLoaded, setHierarchicalUsersLoaded] = useState(false);
  const hierarchicalUsersRef = useRef(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    state: '',
    city: '',
    role: 'consultor',
    password: ''
  });
  const [userLoading, setUserLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  
  // Novos estados para funcionalidades master
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    user_id: '',
    amount: '',
    transaction_type: 'manual_credit',
    description: ''
  });
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [userExtract, setUserExtract] = useState(null);
  const [hierarchicalExtract, setHierarchicalExtract] = useState(null);
  const [cashbackRules, setCashbackRules] = useState(null);
  const [showHierarchicalModal, setShowHierarchicalModal] = useState(false);
  const [hierarchicalForm, setHierarchicalForm] = useState({
    user_id: '',
    hierarchical_role: 'consultor',
    state: '',
    city: ''
  });
  const [hierarchicalLoading, setHierarchicalLoading] = useState(false);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMasterData();
    fetchAllTransactions();
    fetchAllUsers();
    fetchBusinessSegments();
    fetchServiceProviderTypes();
    fetchNotifications();
    fetchHierarchicalUsers();
    fetchStates();
    
    // 🔴 AUTO-ATUALIZAÇÃO A CADA 10 SEGUNDOS - MONITORAMENTO PRODUÇÃO
    const intervalId = setInterval(() => {
      console.log('🔄 [AUTO-UPDATE] Atualizando dados do servidor de produção...');
      fetchAllUsers();
    }, 10000); // 10 segundos
    
    // Limpar interval ao desmontar componente
    return () => clearInterval(intervalId);
  }, []);

  const fetchMasterData = async () => {
    try {
      const response = await axios.get(`${API}/master/dashboard`, { headers });
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching master data:', error);
      setDashboardData({ platform_stats: {}, recent_transactions: [] }); // Dados vazios padrão
      setLoading(false);
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar dashboard master');
      }
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions/history`, { headers });
      setAllTransactions(Array.isArray(response.data) ? response.data : (response.data?.transactions || []));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawalLoading(true);

    try {
      const response = await axios.post(`${API}/transactions/withdrawal`,
        { 
          ...withdrawalData, 
          amount: parseFloat(withdrawalData.amount)
        },
        { headers }
      );
      
      toast.success(
        `Saque da plataforma processado! 
         Valor: ${formatCurrency(response.data.amount)}
         Taxa: ${formatCurrency(response.data.fee)}
         ID XGate: ${response.data.xgate_transaction_id || 'N/A'}`,
        { duration: 5000 }
      );
      setWithdrawalData({ amount: '', pix_key: '', pix_key_type: 'cpf', bank_name: '' });
      fetchMasterData(); // Refresh data
      fetchAllTransactions(); // Refresh transactions
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao realizar saque da plataforma');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // User management functions
  const fetchAllUsers = async () => {
    try {
      console.log('🔍 Fetching all users from API...');
      const response = await axios.get(`${API}/admin/users`, { headers });
      console.log('📊 Users API response:', response.data);
      const users = response.data.users || [];
      console.log(`👥 Found ${users.length} users:`, users);
      
      // 🔴 DETECTAR NOVOS CADASTROS
      const previousCount = totalUsersCount;
      const currentCount = users.length;
      
      if (previousCount > 0 && currentCount > previousCount) {
        const newUsersCount = currentCount - previousCount;
        console.log(`🎉 NOVO CADASTRO DETECTADO! ${newUsersCount} novo(s) usuário(s)`);
        
        // Pegar os usuários mais recentes
        const sortedUsers = [...users].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        
        const newUsers = sortedUsers.slice(0, newUsersCount);
        
        // Adicionar aos cadastros recentes
        newUsers.forEach(user => {
          const registration = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            created_at: user.created_at,
            timestamp: new Date().toISOString()
          };
          
          console.log('✅ CONFIRMAÇÃO DE CADASTRO:', registration);
          
          // Toast de confirmação
          toast.success(
            `🎉 NOVO CADASTRO CONFIRMADO!\n\n` +
            `Tipo: ${user.user_type}\n` +
            `Email: ${user.email}\n` +
            `✅ Salvo no servidor de PRODUÇÃO`,
            { duration: 5000 }
          );
        });
        
        setRecentRegistrations(prev => [...newUsers, ...prev].slice(0, 10));
      }
      
      setTotalUsersCount(currentCount);
      setAllUsers(users);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setAllUsers([]); // Garantir array vazio em caso de erro
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar usuários');
      }
    }
  };

  const handleUserAction = async (userId, action) => {
    if (action === 'delete') {
      if (!window.confirm('Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) {
        return;
      }
    }

    setUserActionLoading(true);
    try {
      const response = await axios.post(`${API}/admin/user-action`, {
        user_id: userId,
        action: action
      }, { headers });
      
      toast.success(response.data.message);
      await fetchAllUsers(); // Refresh user list
    } catch (error) {
      console.error('User action error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao executar ação');
    } finally {
      setUserActionLoading(false);
    }
  };

  const fetchUserNetwork = async (userId) => {
    try {
      const response = await axios.get(`${API}/admin/user-network/${userId}`, { headers });
      setUserNetwork(response.data);
      setShowNetworkModal(true);
    } catch (error) {
      console.error('Error fetching user network:', error);
      toast.error('Erro ao carregar rede de indicações');
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    await fetchUserNetwork(user.id);
  };

  // Compliance functions
  const handleComplianceClick = async (user) => {
    setComplianceLoading(true);
    setComplianceUser(user);
    setShowComplianceModal(true);
    setComplianceLoading(false);
  };

  const handleApproveUser = async (userId, approved) => {
    try {
      setComplianceLoading(true);
      const response = await axios.post(
        `${API}/master/approve-user`, 
        { user_id: userId, approved: approved },
        { headers }
      );
      
      if (response.data.success) {
        toast.success(`Usuário ${approved ? 'aprovado' : 'rejeitado'} com sucesso!`);
        fetchAllUsers(); // Refresh user list
        setShowComplianceModal(false);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao processar aprovação');
    } finally {
      setComplianceLoading(false);
    }
  };

  // Business Segments functions
  // Service provider types functions
  const fetchServiceProviderTypes = async () => {
    try {
      const response = await axios.get(`${API}/master/service-provider-types`, { headers });
      if (response.data.success && response.data.data?.types) {
        setServiceProviderTypes(response.data.data.types);
      } else {
        setServiceProviderTypes([]);
      }
    } catch (error) {
      console.error('Error fetching provider types:', error);
      setServiceProviderTypes([]); // Garantir array vazio em caso de erro
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar tipos de prestadores');
      }
    }
  };

  const handleCreateProviderType = async (e) => {
    e.preventDefault();
    setProviderTypeLoading(true);

    try {
      const response = await axios.post(`${API}/master/service-provider-types`, providerTypeData, { headers });
      
      if (response.data.success) {
        toast.success('Tipo de prestador criado com sucesso!');
        setProviderTypeData({
          name: '',
          description: '',
          category: '',
          icon: '',
          is_active: true
        });
        fetchServiceProviderTypes();
      }
    } catch (error) {
      console.error('Error creating provider type:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar tipo de prestador');
    } finally {
      setProviderTypeLoading(false);
    }
  };

  const handleUpdateProviderType = async (e) => {
    e.preventDefault();
    if (!editingProviderType) return;
    
    setProviderTypeLoading(true);

    try {
      const response = await axios.put(
        `${API}/master/service-provider-types/${editingProviderType.id}`, 
        providerTypeData, 
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Tipo de prestador atualizado com sucesso!');
        setEditingProviderType(null);
        setProviderTypeData({
          name: '',
          description: '',
          category: '',
          icon: '',
          is_active: true
        });
        fetchServiceProviderTypes();
      }
    } catch (error) {
      console.error('Error updating provider type:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar tipo de prestador');
    } finally {
      setProviderTypeLoading(false);
    }
  };

  const handleDeleteProviderType = async (typeId, typeName) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${typeName}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/master/service-provider-types/${typeId}`, { headers });
      
      if (response.data.success) {
        toast.success('Tipo de prestador excluído com sucesso!');
        fetchServiceProviderTypes();
      }
    } catch (error) {
      console.error('Error deleting provider type:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir tipo de prestador');
    }
  };

  const startEditProviderType = (type) => {
    setEditingProviderType(type);
    setProviderTypeData({
      name: type.name,
      description: type.description,
      category: type.category,
      icon: type.icon,
      is_active: type.is_active
    });
  };

  const cancelEditProviderType = () => {
    setEditingProviderType(null);
    setProviderTypeData({
      name: '',
      description: '',
      category: '',
      icon: '',
      is_active: true
    });
  };

  const fetchBusinessSegments = async () => {
    try {
      const response = await axios.get(`${API}/master/business-segments`, { headers });
      setBusinessSegments(response.data.segments || []);
    } catch (error) {
      console.error('Error fetching business segments:', error);
      setBusinessSegments([]); // Garantir array vazio em caso de erro
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar segmentos de negócio');
      }
    }
  };

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setSegmentForm({
      name: '',
      description: '',
      is_active: true
    });
    setShowSegmentModal(true);
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setSegmentForm({
      name: segment.name,
      description: segment.description || '',
      is_active: segment.is_active
    });
    setShowSegmentModal(true);
  };

  const handleSaveSegment = async (e) => {
    e.preventDefault();
    setSegmentLoading(true);

    try {
      if (editingSegment) {
        // Update existing segment
        await axios.put(`${API}/master/business-segments/${editingSegment.id}`, segmentForm, { headers });
        toast.success('Segmento atualizado com sucesso');
      } else {
        // Create new segment
        await axios.post(`${API}/master/business-segments`, segmentForm, { headers });
        toast.success('Segmento criado com sucesso');
      }

      setShowSegmentModal(false);
      await fetchBusinessSegments(); // Refresh list
    } catch (error) {
      console.error('Segment save error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar segmento');
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este segmento? Esta ação não pode ser desfeita.')) {
      return;
    }

    setSegmentLoading(true);
    try {
      await axios.delete(`${API}/master/business-segments/${segmentId}`, { headers });
      toast.success('Segmento excluído com sucesso');
      await fetchBusinessSegments(); // Refresh list
    } catch (error) {
      console.error('Delete segment error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir segmento');
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleToggleSegmentStatus = async (segmentId, currentStatus) => {
    setSegmentLoading(true);
    try {
      await axios.put(`${API}/master/business-segments/${segmentId}`, 
        { is_active: !currentStatus }, 
        { headers }
      );
      toast.success(`Segmento ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      await fetchBusinessSegments(); // Refresh list
    } catch (error) {
      console.error('Toggle segment status error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar status do segmento');
    } finally {
      setSegmentLoading(false);
    }
  };

  // Notifications functions
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/master/notifications`, { headers });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    }
  };

  // Fetch push subscribers count
  const fetchPushSubscribersCount = async () => {
    try {
      const response = await axios.get(`${API}/master/push/subscribers-count`, { headers });
      if (response.data.success) {
        setPushSubscribersCount(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching push subscribers count:', error);
    }
  };

  // Fetch push count when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchPushSubscribersCount();
    }
  }, [activeTab]);

  const handleCreateNotification = () => {
    setNotificationForm({
      title: '',
      message: '',
      image: '',
      target_type: 'all',
      target_user_id: '',
      priority: 'normal'
    });
    setNotificationImagePreview(null);
    setShowNotificationModal(true);
  };

  const handleNotificationImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setNotificationImagePreview(base64String);
        setNotificationForm({ ...notificationForm, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    if (notificationForm.target_type === 'individual' && !notificationForm.target_user_id) {
      toast.error('Selecione um usuário para notificação individual');
      return;
    }

    setNotificationLoading(true);
    let successInternal = false;
    let successPush = false;

    try {
      // Enviar notificação interna (sistema)
      const response = await axios.post(`${API}/master/notifications`, notificationForm, { headers });
      successInternal = true;
      toast.success(`Notificação enviada para ${response.data.recipients_count} usuário(s)`);
      
      // Enviar Push Notification se estiver ativado
      if (sendPushNotification && pushSubscribersCount > 0) {
        try {
          const pushResponse = await axios.post(`${API}/master/push/send`, {
            titulo: notificationForm.title,
            mensagem: notificationForm.message,
            imagem_url: notificationForm.image || null,
            url_destino: '/',
            target_type: notificationForm.target_type,
            target_user_id: notificationForm.target_user_id || null
          }, { headers });
          
          if (pushResponse.data.success) {
            successPush = true;
            toast.success(`📲 Push enviado para ${pushResponse.data.enviadas} dispositivos`);
          }
        } catch (pushError) {
          console.error('Push notification error:', pushError);
          toast.error('Erro ao enviar push notification');
        }
      }

      if (successInternal || successPush) {
        setShowNotificationModal(false);
        setSendPushNotification(false);
        await fetchNotifications(); // Refresh list
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar notificação');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      return;
    }

    try {
      await axios.delete(`${API}/master/notifications/${notificationId}`, { headers });
      toast.success('Notificação excluída com sucesso');
      await fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir notificação');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-[#F5F5F5] text-[#005B9C]';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-[#F5F5F5] text-[#005B9C]';
    }
  };

  const getTargetTypeLabel = (targetType) => {
    switch (targetType) {
      case 'all': return 'Todos';
      case 'clients': return 'Clientes';
      case 'merchants': return 'Lojistas';
      case 'individual': return 'Individual';
      default: return targetType;
    }
  };

  // Hierarchical users functions
  const fetchHierarchicalUsers = async (force = false) => {
    // Usar useRef para prevenir dupla execução no desenvolvimento
    if (hierarchicalUsersRef.current && !force) {
      console.log('Hierarchical users already loaded - skipping duplicate call');
      return;
    }
    
    // Marcar imediatamente como "em progresso" para bloquear chamadas subsequentes
    hierarchicalUsersRef.current = true;
    
    try {
      console.log('Fetching hierarchical users...');
      const response = await axios.get(`${API}/master/hierarchical-users`, { headers });
      
      // Filtrar duplicatas baseadas no email para garantir usuários únicos
      const users = response.data.users || [];
      const uniqueUsers = users.filter((user, index, self) => 
        index === self.findIndex(u => u.email === user.email)
      );
      
      console.log(`Loaded ${users.length} users, filtered to ${uniqueUsers.length} unique users`);
      setHierarchicalUsers(uniqueUsers);
      setHierarchicalUsersLoaded(true);
    } catch (error) {
      console.error('Error fetching hierarchical users:', error);
      setHierarchicalUsers([]); // Garantir array vazio em caso de erro
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar usuários hierárquicos');
      }
      // Em caso de erro, permite nova tentativa
      hierarchicalUsersRef.current = false;
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API}/stores/filters`);
      setStates(response.data.states || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const handleStateChange = (selectedState) => {
    setUserForm({ ...userForm, state: selectedState, city: '' });
    fetchCitiesByState(selectedState);
  };

  const fetchCitiesByState = async (state) => {
    if (!state) {
      setFilteredCities([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/stores/cities/${encodeURIComponent(state)}`);
      setFilteredCities(response.data.cities || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setFilteredCities([]);
    }
  };

  const handleCreateUser = () => {
    setUserForm({
      full_name: '',
      email: '',
      phone: '',
      whatsapp: '',
      state: '',
      city: '',
      role: 'consultor',
      password: ''
    });
    setFilteredCities([]);
    setShowUserModal(true);
  };

  const handleCreateHierarchicalUser = async (e) => {
    e.preventDefault();
    
    if (!userForm.full_name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast.error('Nome, email e senha são obrigatórios');
      return;
    }

    if (userForm.role === 'mini_agencia' && !userForm.city) {
      toast.error('Cidade é obrigatória para Mini Agencia');
      return;
    }

    setUserLoading(true);

    try {
      const response = await axios.post(`${API}/master/hierarchical-users`, userForm, { headers });
      toast.success(`Usuário ${userForm.role.replace('_', ' ')} criado com sucesso!`);
      setShowUserModal(false);
      await fetchHierarchicalUsers(true);
    } catch (error) {
      console.error('Create hierarchical user error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    } finally {
      setUserLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      await axios.put(`${API}/master/hierarchical-users/${userId}/status`, 
        { is_active: !isActive }, 
        { headers }
      );
      toast.success(`Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso`);
      await fetchHierarchicalUsers(true);
    } catch (error) {
      console.error('Toggle user status error:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    // Confirmação dupla para deletar
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o usuário "${userName}"?`)) {
      return;
    }
    
    if (!window.confirm(`ATENÇÃO: Esta ação não pode ser desfeita! Confirma a exclusão de "${userName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/master/hierarchical-users/${userId}`, { headers });
      toast.success(`Usuário "${userName}" excluído com sucesso`);
      await fetchHierarchicalUsers(true);
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'socio_operador': return 'Sócio Operador';
      case 'mini_agencia': return 'Mini Agencia';
      case 'consultor': return 'Consultor';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'socio_operador': return 'bg-[#F5F5F5] text-[#005B9C]';
      case 'mini_agencia': return 'bg-[#F5F5F5] text-[#005B9C]';
      case 'consultor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // NOVAS FUNCIONALIDADES MASTER

  const createUserTransaction = async () => {
    if (!transactionForm.user_id || !transactionForm.amount || !transactionForm.description) {
      toast.error('Preencha todos os campos');
      return;
    }

    setTransactionLoading(true);
    try {
      await axios.post(`${API}/master/user-transaction`, transactionForm, { headers });
      toast.success('Lançamento realizado com sucesso');
      setShowTransactionModal(false);
      setTransactionForm({ user_id: '', amount: '', transaction_type: 'manual_credit', description: '' });
      fetchAllUsers(); // Atualizar dados
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao realizar lançamento');
    } finally {
      setTransactionLoading(false);
    }
  };

  const fetchUserExtract = async (userId) => {
    try {
      const response = await axios.get(`${API}/master/user-extract/${userId}`, { headers });
      setUserExtract(response.data);
      setShowExtractModal(true);
    } catch (error) {
      console.error('Fetch user extract error:', error);
      toast.error('Erro ao buscar extrato do usuário');
    }
  };

  const fetchHierarchicalExtract = async () => {
    try {
      const response = await axios.get(`${API}/master/hierarchical-extract`, { headers });
      setHierarchicalExtract(response.data);
    } catch (error) {
      console.error('Fetch hierarchical extract error:', error);
      toast.error('Erro ao buscar extrato hierárquico');
    }
  };

  const fetchCashbackRules = async () => {
    try {
      const response = await axios.get(`${API}/master/cashback-rules`, { headers });
      setCashbackRules(response.data);
    } catch (error) {
      console.error('Fetch cashback rules error:', error);
      toast.error('Erro ao buscar regras de cashback');
    }
  };

  const setHierarchicalAgent = async () => {
    if (!hierarchicalForm.user_id || !hierarchicalForm.hierarchical_role) {
      toast.error('Selecione usuário e tipo de agente');
      return;
    }

    // Validações específicas
    if (hierarchicalForm.hierarchical_role === 'socio_operador' && !hierarchicalForm.state) {
      toast.error('Estado é obrigatório para Sócio Operador');
      return;
    }

    if (hierarchicalForm.hierarchical_role === 'mini_agencia' && (!hierarchicalForm.state || !hierarchicalForm.city)) {
      toast.error('Estado e cidade são obrigatórios para Mini Agencia');
      return;
    }

    setHierarchicalLoading(true);
    try {
      await axios.post(`${API}/master/set-hierarchical-agent`, hierarchicalForm, { headers });
      toast.success('Agente hierárquico definido com sucesso');
      setShowHierarchicalModal(false);
      setHierarchicalForm({ user_id: '', hierarchical_role: 'consultor', state: '', city: '' });
      fetchAllUsers();
      fetchHierarchicalUsers();
    } catch (error) {
      console.error('Set hierarchical agent error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao definir agente hierárquico');
    } finally {
      setHierarchicalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEEEEE] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-purple-600 font-medium">Carregando Dashboard Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] flex flex-col lg:flex-row">
      {/* Sidebar Vertical à Esquerda - Responsiva */}
      <div 
        className={`
          ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
        `}
        style={{ backgroundColor: corPrimaria }}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b" style={{ borderColor: `${corPrimaria}dd` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
              {franquiaContext?.logo_url ? (
                <img src={franquiaContext.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <Crown size={28} style={{ color: corPrimaria }} />
              )}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {franquiaContext?.nome || 'Master'}
              </h2>
              <p className="text-white/70 text-xs">
                {isFranquiaMode ? 'White Label' : 'Transmill'}
              </p>
            </div>
          </div>
          
          {/* Botão fechar no mobile */}
          <button 
            className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Vertical */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {[
              { id: 'overview', icon: BarChart3, label: 'Visão Geral' },
              { id: 'wallet', icon: Wallet, label: 'Carteira Digital' },
              { id: 'lojas', icon: Store, label: 'Lojas' },
              { id: 'prestadores', icon: Wrench, label: 'Prestadores' },
              { id: 'mobility', icon: Car, label: 'Mobilidade' },
              { id: 'integracoes', icon: KeyRound, label: 'Integrações / APIs' },
              { id: 'users', icon: Users, label: 'Usuários', masterOnly: true },
              { id: 'hierarchy', icon: Shield, label: 'Hierarquia', masterOnly: true },
              { id: 'segments', icon: Tags, label: 'Segmentos', masterOnly: true },
              { id: 'notifications', icon: Bell, label: 'Notificações' },
              { id: 'transactions', icon: Activity, label: 'Transações' },
              { id: 'extract', icon: DollarSign, label: 'Extrato' },
              { id: 'withdrawal', icon: ArrowUpRight, label: 'Sacar' },
              { id: 'commissions', icon: DollarSign, label: 'Modelo Comissões', masterOnly: true },
              { id: 'internet', icon: Wifi, label: 'Internet Móvel' },
              { id: 'telemedicine', icon: Stethoscope, label: 'Telemedicina' },
              { id: 'subusers', icon: UserCog, label: 'Colaboradores' },
              { id: 'docs', icon: FileImage, label: 'Documentos' },
              { id: 'chatbot', icon: Bot, label: 'Treinamento IA', masterOnly: true },
              { id: 'social', icon: Video, label: 'Rede Social' },
              { id: 'credit-card', icon: CreditCard, label: 'Taxas Cartão', masterOnly: true },
            ].filter(item => !item.masterOnly || !isFranquiaMode).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      handleTabChange(item.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white font-semibold' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                    style={isActive ? { color: corPrimaria } : {}}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-[#0077CC]">
          {/* Botão Labelview */}
          {(user.user_type === 'labelview_master' || 
            user.user_type === 'labelview_unidade' ||
            user.user_type === 'labelview_regional' ||
            user.user_type === 'labelview_consultor') && (
            <button
              onClick={() => navigate('/labelview/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2fa31c] text-white hover:bg-[#258a15] transition-colors mb-2"
            >
              <Shield size={20} />
              <span className="text-sm">Painel Labelview</span>
            </button>
          )}
          
          {/* Botão Voltar ao App */}
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors mb-2"
          >
            <Home size={20} />
            <span className="text-sm">Voltar ao App</span>
          </button>
          
          {/* Botão Sair */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Sair</span>
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

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Mobile com botão de menu */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-[#005B9C] text-white"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-[#005B9C]" />
            <span className="font-bold text-[#005B9C]">Master Transmill</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Desktop */}
            <div className="hidden lg:flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center space-x-4">
                <TransmillLogo width={120} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Master
                  </h1>
                  <p className="text-gray-600 text-sm">Painel de controle da plataforma</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Badge className="bg-[#F5F5F5] text-[#005B9C] px-3 py-1">
                  <Crown size={14} className="mr-1" />
                  Administrador
                </Badge>
              </div>
            </div>

        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between min-h-[100px] sm:min-h-[110px]">
                <div className="flex flex-col justify-center flex-1 pr-2">
                  <p className="text-white/90 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    <span className="hidden sm:inline">Total de Usuários</span>
                    <span className="sm:hidden">Usuários</span>
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    {dashboardData?.platform_stats?.total_users || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <Users className="text-white/70" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between min-h-[100px] sm:min-h-[110px]">
                <div className="flex flex-col justify-center flex-1 pr-2">
                  <p className="text-white/90 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    <span className="hidden sm:inline">Clientes Ativos</span>
                    <span className="sm:hidden">Clientes</span>
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    {dashboardData?.platform_stats?.total_clients || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <Wallet className="text-white/70" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between min-h-[100px] sm:min-h-[110px]">
                <div className="flex flex-col justify-center flex-1 pr-2">
                  <p className="text-white/90 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    <span className="hidden sm:inline">Lojistas Parceiros</span>
                    <span className="sm:hidden">Lojistas</span>
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    {dashboardData?.platform_stats?.total_merchants || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <Building2 className="text-white/70" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between min-h-[100px] sm:min-h-[110px]">
                <div className="flex flex-col justify-center flex-1 pr-2">
                  <p className="text-white/90 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    <span className="hidden sm:inline">Receita da Plataforma</span>
                    <span className="sm:hidden">Receita</span>
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                    {formatCurrency(dashboardData?.platform_stats?.total_commission || 0)}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <TrendingUp className="text-white/70" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          defaultValue="overview"
          activationMode="manual"
          className="space-y-6"
        >
          {/* Menu vertical agora está na sidebar - removido menu horizontal */}
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 overflow-y-visible pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign size={20} />
                    <span>Receita da Plataforma</span>
                  </CardTitle>
                  <CardDescription>Comissões acumuladas de todas as transações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Platform Balance BRL */}
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                      <span className="text-emerald-800 font-medium">Saldo Plataforma (BRL)</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(dashboardData?.platform_stats?.platform_balance || 0)}
                      </span>
                    </div>
                    
                    {/* Platform Balance USDT */}
                    <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-800 font-medium">Saldo Plataforma (USDT)</span>
                      <span className="text-2xl font-bold text-yellow-600">
                        {(dashboardData?.platform_stats?.platform_usdt_balance || 0).toFixed(6)} USDT
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="text-blue-800 font-medium">Total de Comissões</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(dashboardData?.platform_stats?.total_commission || 0)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p><strong>Como funciona:</strong></p>
                      <p>• 30% de cada cashback vai para a plataforma</p>
                      <p>• Receita automática a cada transação</p>
                      <p>• Modelo sustentável de negócio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp size={20} />
                    <span>Crescimento da Plataforma</span>
                  </CardTitle>
                  <CardDescription>Métricas de crescimento e engajamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {dashboardData?.platform_stats?.total_clients || 0}
                        </p>
                        <p className="text-sm text-blue-800">Clientes</p>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {dashboardData?.platform_stats?.total_merchants || 0}
                        </p>
                        <p className="text-sm text-green-800">Lojistas</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-2">Status da Plataforma</h4>
                      <div className="space-y-2 text-sm text-indigo-800">
                        <div className="flex justify-between">
                          <span>Sistema de Indicações:</span>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>XGate API:</span>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Distribuição Automática:</span>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users size={20} />
                  <span>Gerenciar Usuários</span>
                </CardTitle>
                <CardDescription>Lista completa de clientes, lojistas e prestadores da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* MONITORAMENTO EM TEMPO REAL - PRODUÇÃO */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="font-bold text-green-800">🔴 MONITORAMENTO PRODUÇÃO - TEMPO REAL</h3>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await fetchAllUsers();
                            toast.success('✅ Dados atualizados!');
                            console.log('🔄 Dados atualizados do servidor de PRODUÇÃO');
                          } catch (error) {
                            toast.error('Erro ao atualizar dados');
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🔄 Atualizar Agora
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">📊 TOTAL GERAL</p>
                        <p className="text-2xl font-bold text-blue-600">{(allUsers || []).length}</p>
                        <p className="text-xs text-gray-500 mt-1">usuários cadastrados</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-200">
                        <p className="text-xs text-gray-600 mb-1">🏢 LABELVIEW</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {(allUsers || []).filter(u => 
                            u.user_type === 'labelview_unidade' || 
                            u.user_type === 'labelview_regional' || 
                            u.user_type === 'labelview_consultor'
                          ).length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(allUsers || []).filter(u => u.user_type === 'labelview_unidade').length} unidades | {' '}
                          {(allUsers || []).filter(u => u.user_type === 'labelview_regional').length} regionais | {' '}
                          {(allUsers || []).filter(u => u.user_type === 'labelview_consultor').length} consultores
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">👤 CLIENTES</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(allUsers || []).filter(u => u.user_type === 'cliente').length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">clientes Transmill</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                        <p className="text-xs text-gray-600 mb-1">🏪 LOJISTAS</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(allUsers || []).filter(u => u.user_type === 'lojista').length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">lojas ativas</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                        <p className="text-xs text-gray-600 mb-1">🔧 PRESTADORES</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {(allUsers || []).filter(u => u.user_type === 'service_provider').length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">prestadores ativos</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <span>✅ Conectado ao servidor de PRODUÇÃO</span>
                      <span className="text-green-600 font-semibold">
                        Última atualização: {lastUpdateTime.toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* 🔴 ÚLTIMOS CADASTROS - CONFIRMAÇÃO VISUAL */}
                  {(recentRegistrations || []).length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <h3 className="font-bold text-blue-800">🎉 ÚLTIMOS CADASTROS CONFIRMADOS NO SERVIDOR</h3>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recentRegistrations.map((reg, idx) => (
                          <div 
                            key={reg.id + idx} 
                            className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500 animate-fade-in"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                    {reg.user_type === 'cliente' && '👤 CLIENTE'}
                                    {reg.user_type === 'lojista' && '🏪 LOJISTA'}
                                    {reg.user_type === 'service_provider' && '🔧 PRESTADOR'}
                                    {reg.user_type === 'labelview_unidade' && '🏢 UNIDADE LABELVIEW'}
                                    {reg.user_type === 'labelview_regional' && '📍 REGIONAL LABELVIEW'}
                                    {reg.user_type === 'labelview_consultor' && '👔 CONSULTOR LABELVIEW'}
                                    {!['cliente', 'lojista', 'service_provider', 'labelview_unidade', 'labelview_regional', 'labelview_consultor'].includes(reg.user_type) && '👥 ' + reg.user_type.toUpperCase()}
                                  </span>
                                  <span className="text-green-600 font-bold text-xs">✅ CONFIRMADO</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-800">{reg.full_name || reg.email}</p>
                                <p className="text-xs text-gray-600">{reg.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Cadastrado: {new Date(reg.created_at || reg.timestamp).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-mono text-gray-400">
                                  ID: {reg.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 text-center text-xs text-gray-600">
                        Mostrando os últimos {(recentRegistrations || []).length} cadastros detectados
                      </div>
                    </div>
                  )}
                  
                  {/* Estatísticas Antigas (manter para compatibilidade) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{(allUsers || []).length}</p>
                      <p className="text-sm text-gray-600">Total de Usuários</p>
                      {(allUsers || []).length === 0 && (
                        <p className="text-xs text-red-500 mt-1">⚠️ Array vazio</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(allUsers || []).filter(u => u.user_type === 'cliente').length}
                      </p>
                      <p className="text-sm text-gray-600">Clientes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {(allUsers || []).filter(u => u.user_type === 'lojista').length}
                      </p>
                      <p className="text-sm text-gray-600">Lojistas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {(allUsers || []).filter(u => u.user_type === 'service_provider').length}
                      </p>
                      <p className="text-sm text-gray-600">Prestadores</p>
                    </div>
                  </div>

                  {/* Lista de Usuários */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Usuário</th>
                          <th className="p-3 text-left">Tipo</th>
                          <th className="p-3 text-left">Data de Cadastro</th>
                          <th className="p-3 text-left">Saldos (BRL / USDT)</th>
                          <th className="p-3 text-left">Indicações</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left min-w-[200px]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allUsers || []).length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-500">
                              <Users className="mx-auto mb-4" size={48} />
                              <p className="text-lg">Nenhum usuário encontrado</p>
                              <p className="text-sm">Verifique se há usuários cadastrados na plataforma</p>
                            </td>
                          </tr>
                        ) : (
                          allUsers.map((user) => (
                          <tr 
                            key={user.id} 
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleUserClick(user)}
                          >
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                {user.profile_image ? (
                                  <img
                                    src={user.profile_image}
                                    alt={user.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-600 font-semibold">
                                      {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">
                                    {user.company_name || user.full_name}
                                  </p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                  {user.cnpj && (
                                    <p className="text-xs text-gray-400">CNPJ: {user.cnpj}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={getUserTypeBadgeColor(user.user_type)}>
                                {formatUserType(user.user_type)}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {user.created_at ? formatDate(user.created_at) : 'N/A'}
                            </td>
                            <td className="p-3">
                              <div className="text-sm space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-emerald-700">BRL:</span>
                                  <span className="font-semibold">{formatCurrency(user.balance || 0)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-yellow-600">USDT:</span>
                                  <span className="font-semibold">{(user.usdt_balance || 0).toFixed(6)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-orange-600">CB:</span>
                                  <span className="text-gray-700">{formatCurrency(user.cashback_balance || 0)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm font-medium">{user.referral_count || 0}</span>
                            </td>
                            <td className="p-3">
                              <Badge className={user.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                {user.is_blocked ? 'Bloqueado' : 'Ativo'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* PRIORIDADE ALTA - Botão Compliance (sempre visível) */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleComplianceClick(user)}
                                  className="p-1 h-7 w-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                                  title="🔍 Verificar Documentação (Compliance)"
                                >
                                  <FileText size={12} className="text-blue-600" />
                                </Button>
                                
                                {/* Botão Abrir Loja (somente para lojistas) */}
                                {user.user_type === 'lojista' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/meu-negocio/${user.id}`, '_blank')}
                                    className="p-1 h-7 w-7 bg-orange-50 border-orange-200 hover:bg-orange-100"
                                    title="🏪 Abrir Loja (Modo Suporte)"
                                  >
                                    <Store size={12} className="text-orange-600" />
                                  </Button>
                                )}
                                
                                {/* Botão Ver Extrato */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fetchUserExtract(user.id)}
                                  className="p-1 h-7 w-7"
                                  title="Ver Extrato"
                                >
                                  <Eye size={12} />
                                </Button>
                                
                                {/* Botão Lançamento Manual */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setTransactionForm({...transactionForm, user_id: user.id});
                                    setShowTransactionModal(true);
                                  }}
                                  className="p-1 h-7 w-7"
                                  title="Lançamento Manual"
                                >
                                  <CreditCard size={12} />
                                </Button>
                                
                                {/* Botão Definir Agente Hierárquico */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setHierarchicalForm({
                                      ...hierarchicalForm, 
                                      user_id: user.id,
                                      state: user.state || '',
                                      city: user.city || ''
                                    });
                                    setShowHierarchicalModal(true);
                                  }}
                                  className="p-1 h-7 w-7"
                                  title="Definir como Agente Hierárquico"
                                >
                                  <UserPlus size={12} />
                                </Button>
                                
                                {/* Botões originais */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.id, user.is_blocked ? 'unblock' : 'block')}
                                  disabled={userActionLoading}
                                  className="p-1 h-7 w-7"
                                  title={user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                >
                                  {user.is_blocked ? <Shield size={12} /> : <ShieldOff size={12} />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                  disabled={userActionLoading}
                                  className="p-1 h-7 w-7 text-red-600 hover:text-red-700"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hierarchical Users Tab */}
          <TabsContent value="hierarchy" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield size={20} />
                    <span>Usuários Hierárquicos</span>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Usuário
                  </Button>
                </CardTitle>
                <CardDescription>Gerencie Sócios Operadores, Mini Agencias e Consultores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {(hierarchicalUsers || []).filter(u => u.hierarchical_role === 'socio_operador').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Sócios Operadores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {(hierarchicalUsers || []).filter(u => u.hierarchical_role === 'mini_agencia').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Mini Agencias</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(hierarchicalUsers || []).filter(u => u.hierarchical_role === 'consultor').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Consultores</p>
                    </div>
                  </div>

                  {/* Lista de Usuários Hierárquicos */}
                  {(hierarchicalUsers || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Nenhum usuário hierárquico cadastrado ainda</p>
                      <Button
                        onClick={handleCreateUser}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Cadastrar Primeiro Usuário
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hierarchicalUsers.map((user) => (
                        <Card key={user.id} className="border-l-4 border-l-indigo-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                  <Badge className={getRoleColor(user.hierarchical_role)}>
                                    {getRoleLabel(user.hierarchical_role)}
                                  </Badge>
                                  <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {user.is_active ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-1">{user.email}</p>
                                <p className="text-sm text-gray-500">
                                  <MapPin className="inline w-4 h-4 mr-1" />
                                  {user.state}{user.city && `, ${user.city}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  <Phone className="inline w-4 h-4 mr-1" />
                                  WhatsApp: {user.whatsapp}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">BRL:</span>
                                      <span className="font-semibold text-emerald-600">
                                        R$ {user.balance?.toFixed(2) || '0,00'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">USDT:</span>
                                      <span className="font-semibold text-yellow-600">
                                        {(user.usdt_balance || 0).toFixed(6)} USDT
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">Comissões:</span>
                                      <span className="font-bold text-green-600">
                                        R$ {user.commission_balance?.toFixed(2) || '0,00'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                  className={user.is_active ? 'text-red-600' : 'text-green-600'}
                                  title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                                >
                                  {user.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(user.id, user.full_name)}
                                  className="text-red-600 hover:bg-red-50"
                                  title="Excluir usuário permanentemente"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              Cadastrado em: {formatDateTime(user.created_at)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Extrato de Cashback Hierárquico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={20} />
                    <span>Extrato Comissões Hierárquicas</span>
                  </div>
                  <Button
                    onClick={fetchHierarchicalExtract}
                    className="btn-primary"
                    size="sm"
                  >
                    <History size={16} className="mr-2" />
                    Atualizar Extrato
                  </Button>
                </CardTitle>
                <CardDescription>Movimentação de ganhos de cashback dos agentes hierárquicos (Sócios, Mini Agencias, Consultores)</CardDescription>
              </CardHeader>
              <CardContent>
                {hierarchicalExtract ? (
                  <div className="space-y-6">
                    {/* Totais por Tipo de Agente */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Crown size={20} className="text-purple-600" />
                          <h5 className="font-semibold text-purple-900">Sócios Operadores</h5>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(hierarchicalExtract.totals?.socio_operador || 0)}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">Total distribuído (10%)</p>
                      </div>
                      
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 size={20} className="text-indigo-600" />
                          <h5 className="font-semibold text-indigo-900">Mini Agencias</h5>
                        </div>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(hierarchicalExtract.totals?.mini_agencia || 0)}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">Total distribuído (5%)</p>
                      </div>
                      
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target size={20} className="text-teal-600" />
                          <h5 className="font-semibold text-teal-900">Consultores</h5>
                        </div>
                        <p className="text-2xl font-bold text-teal-600">
                          {formatCurrency(hierarchicalExtract.totals?.consultor || 0)}
                        </p>
                        <p className="text-xs text-teal-700 mt-1">Total distribuído (5%)</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign size={20} className="text-green-600" />
                          <h5 className="font-semibold text-green-900">Total Geral</h5>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(hierarchicalExtract.grand_total || 0)}
                        </p>
                        <p className="text-xs text-green-700 mt-1">Todas as comissões</p>
                      </div>
                    </div>

                    {/* Transações Recentes dos Agentes */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-900">Últimas Movimentações de Cashback</h5>
                        <Badge className="bg-[#F5F5F5] text-[#005B9C]">
                          {hierarchicalExtract.transactions?.length || 0} transações
                        </Badge>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {hierarchicalExtract.transactions?.slice(0, 15).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.transaction_type === 'socio_operador_bonus' ? 'bg-purple-100' :
                                  transaction.transaction_type === 'mini_agencia_bonus' ? 'bg-indigo-100' :
                                  'bg-teal-100'
                                }`}>
                                  {transaction.transaction_type === 'socio_operador_bonus' ? 
                                    <Crown size={18} className="text-purple-600" /> :
                                   transaction.transaction_type === 'mini_agencia_bonus' ? 
                                    <Building2 size={18} className="text-indigo-600" /> :
                                    <Target size={18} className="text-teal-600" />
                                  }
                                </div>
                                
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 text-sm leading-tight">
                                    {transaction.description}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit', 
                                      year: 'numeric'
                                    })} às{' '}
                                    {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-bold text-green-600 text-lg">
                                  +{formatCurrency(transaction.amount)}
                                </p>
                                <Badge className={
                                  transaction.transaction_type === 'socio_operador_bonus' ? 'bg-[#F5F5F5] text-[#005B9C]' :
                                  transaction.transaction_type === 'mini_agencia_bonus' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-teal-100 text-teal-800'
                                }>
                                  {transaction.transaction_type === 'socio_operador_bonus' ? 'Sócio Operador' :
                                   transaction.transaction_type === 'mini_agencia_bonus' ? 'Mini Agencia' :
                                   'Consultor'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {hierarchicalExtract.transactions?.length === 0 && (
                        <div className="text-center p-8 text-gray-500">
                          <History size={48} className="mx-auto mb-4 text-gray-400" />
                          <p className="text-sm">Nenhuma transação hierárquica encontrada</p>
                          <p className="text-xs text-gray-400 mt-1">
                            As comissões aparecerão aqui quando os agentes hierárquicos receberem cashback
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Resumo dos Percentuais */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h6 className="font-semibold text-gray-900 mb-3">Como Funciona a Distribuição</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          <span><strong>Sócio Operador:</strong> Recebe 10% do cashback total de vendas no seu estado</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                          <span><strong>Mini Agencia:</strong> Recebe 5% do cashback total de vendas na sua cidade</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                          <span><strong>Consultor:</strong> Recebe 5% do cashback das lojas na sua rede de indicação</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 text-gray-500">
                    <BarChart3 size={64} className="mx-auto mb-4 text-gray-400" />
                    <h6 className="font-semibold text-gray-700 mb-2">Extrato de Comissões Hierárquicas</h6>
                    <p className="text-sm mb-4">
                      Visualize aqui todos os ganhos de cashback dos agentes hierárquicos
                    </p>
                    <Button
                      onClick={fetchHierarchicalExtract}
                      className="btn-primary"
                    >
                      <History size={16} className="mr-2" />
                      Carregar Extrato
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Segments Tab */}
          <TabsContent value="segments" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tags size={20} />
                    <span>Segmentos de Negócio</span>
                  </div>
                  <Button
                    onClick={handleCreateSegment}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Novo Segmento
                  </Button>
                </CardTitle>
                <CardDescription>Gerencie os segmentos de negócio disponíveis para lojistas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{(businessSegments || []).length}</p>
                      <p className="text-sm text-gray-600">Total de Segmentos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(businessSegments || []).filter(s => s.is_active).length}
                      </p>
                      <p className="text-sm text-gray-600">Ativos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {(businessSegments || []).filter(s => !s.is_active).length}
                      </p>
                      <p className="text-sm text-gray-600">Inativos</p>
                    </div>
                  </div>

                  {/* Lista de Segmentos */}
                  {(businessSegments || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Tags className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-4">Nenhum segmento cadastrado ainda</p>
                      <Button
                        onClick={handleCreateSegment}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Criar Primeiro Segmento
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left">Nome</th>
                            <th className="p-3 text-left">Descrição</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Data de Criação</th>
                            <th className="p-3 text-left min-w-[200px]">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessSegments.map((segment) => (
                            <tr key={segment.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Tags size={16} className="text-purple-600" />
                                  <span className="font-medium">{segment.name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-gray-600">
                                  {segment.description || 'Sem descrição'}
                                </span>
                              </td>
                              <td className="p-3">
                                <Badge className={segment.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {segment.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                {segment.created_at ? formatDate(segment.created_at) : 'N/A'}
                              </td>
                              <td className="p-3">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSegment(segment)}
                                    disabled={segmentLoading}
                                    className="p-1 h-8 w-8"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleSegmentStatus(segment.id, segment.is_active)}
                                    disabled={segmentLoading}
                                    className="p-1 h-8 w-8"
                                  >
                                    {segment.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteSegment(segment.id)}
                                    disabled={segmentLoading}
                                    className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Tipos de Prestadores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={20} />
                    <span>Tipos de Prestadores de Serviço</span>
                  </div>
                  <Badge className="bg-[#F5F5F5] text-[#005B9C]">
                    {serviceProviderTypes?.length || 0} tipos
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Gerencie os tipos de prestadores disponíveis na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Form para criar/editar tipo de prestador */}
                  <form onSubmit={editingProviderType ? handleUpdateProviderType : handleCreateProviderType} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {editingProviderType ? 'Editar Tipo de Prestador' : 'Novo Tipo de Prestador'}
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="w-full">
                        <Label htmlFor="provider-type-name" className="block mb-2">Nome do Tipo*</Label>
                        <Input
                          id="provider-type-name"
                          type="text"
                          value={providerTypeData.name}
                          onChange={(e) => setProviderTypeData({...providerTypeData, name: e.target.value})}
                          placeholder="Ex: Eletricista, Diarista, Consultor..."
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="provider-type-category" className="block mb-2">Categoria*</Label>
                        <Select 
                          value={providerTypeData.category} 
                          onValueChange={(value) => setProviderTypeData({...providerTypeData, category: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saude">Saúde</SelectItem>
                            <SelectItem value="domestico">Doméstico</SelectItem>
                            <SelectItem value="automotivo">Automotivo</SelectItem>
                            <SelectItem value="beleza">Beleza & Estética</SelectItem>
                            <SelectItem value="consultoria">Consultoria</SelectItem>
                            <SelectItem value="educacao">Educação</SelectItem>
                            <SelectItem value="tecnologia">Tecnologia</SelectItem>
                            <SelectItem value="construcao">Construção</SelectItem>
                            <SelectItem value="eventos">Eventos</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <Label htmlFor="provider-type-description" className="block mb-2">Descrição</Label>
                      <textarea
                        id="provider-type-description"
                        value={providerTypeData.description}
                        onChange={(e) => setProviderTypeData({...providerTypeData, description: e.target.value})}
                        placeholder="Descreva o tipo de serviço oferecido..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        rows="3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="w-full">
                        <Label htmlFor="provider-type-icon" className="block mb-2">Ícone (emoji ou nome)</Label>
                        <Input
                          id="provider-type-icon"
                          type="text"
                          value={providerTypeData.icon}
                          onChange={(e) => setProviderTypeData({...providerTypeData, icon: e.target.value})}
                          placeholder="🔧 ou wrench"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 lg:mt-8">
                        <input
                          type="checkbox"
                          id="provider-type-active"
                          checked={providerTypeData.is_active}
                          onChange={(e) => setProviderTypeData({...providerTypeData, is_active: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="provider-type-active" className="cursor-pointer">Tipo ativo</Label>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={providerTypeLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                      >
                        {providerTypeLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2" size={16} />
                            {editingProviderType ? 'Atualizar' : 'Criar Tipo'}
                          </>
                        )}
                      </Button>
                      
                      {editingProviderType && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditProviderType}
                          className="border-gray-300 w-full sm:w-auto"
                        >
                          <X className="mr-2" size={16} />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* Lista de tipos existentes */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <Settings className="mr-2" size={16} />
                      Tipos Cadastrados
                    </h4>
                    
                    {(serviceProviderTypes?.length || 0) === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <UserPlus size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>Nenhum tipo de prestador cadastrado ainda.</p>
                        <p className="text-sm">Crie o primeiro tipo usando o formulário acima.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(serviceProviderTypes || []).map((type) => (
                          <div key={type.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">{type.icon || '📋'}</span>
                                <div>
                                  <h5 className="font-medium text-gray-800">{type.name}</h5>
                                  <p className="text-sm text-gray-600 capitalize">{type.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {type.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                            </div>
                            
                            {type.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {type.description}
                              </p>
                            )}
                            
                            <div className="flex space-x-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditProviderType(type)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit size={14} className="mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProviderType(type.id, type.name)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={14} className="mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell size={20} />
                    <span>Sistema de Notificações</span>
                  </div>
                  <Button
                    onClick={handleCreateNotification}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send size={16} className="mr-2" />
                    Nova Notificação
                  </Button>
                </CardTitle>
                <CardDescription>Envie notificações para usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{(notifications || []).length}</p>
                      <p className="text-sm text-gray-600">Total Enviadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(notifications || []).filter(n => n.target_type === 'all').length}
                      </p>
                      <p className="text-sm text-gray-600">Para Todos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {(notifications || []).filter(n => n.target_type === 'clients').length}
                      </p>
                      <p className="text-sm text-gray-600">Para Clientes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {(notifications || []).filter(n => n.target_type === 'merchants').length}
                      </p>
                      <p className="text-sm text-gray-600">Para Lojistas</p>
                    </div>
                  </div>

                  {/* Lista de Notificações */}
                  {(notifications || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-4">Nenhuma notificação enviada ainda</p>
                      <Button
                        onClick={handleCreateNotification}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send size={16} className="mr-2" />
                        Enviar Primeira Notificação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(notifications || []).map((notification) => (
                        <Card key={notification.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-lg">{notification.title}</h3>
                                  <Badge className={getPriorityColor(notification.priority)}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-2">{notification.message}</p>
                                {notification.image && (
                                  <img 
                                    src={notification.image} 
                                    alt="Imagem da notificação" 
                                    className="w-20 h-20 object-cover rounded-lg mb-2"
                                  />
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Globe size={14} />
                                    <span>Para: {getTargetTypeLabel(notification.target_type)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users2 size={14} />
                                    <span>{notification.total_recipients} destinatários</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock size={14} />
                                    <span>{formatDateTime(notification.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity size={20} />
                  <span>Transações Recentes da Plataforma</span>
                </CardTitle>
                <CardDescription>Últimas comissões e atividades do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.recent_transactions?.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">Nenhuma transação da plataforma ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData?.recent_transactions?.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="text-purple-600" size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +{formatCurrency(transaction.amount)}
                          </p>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Comissão
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extract Tab */}
          <TabsContent value="extract" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet size={20} />
                  <span>Extrato da Plataforma</span>
                </CardTitle>
                <CardDescription>Histórico completo de comissões e movimentações da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {(allTransactions || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {/* Header do extrato */}
                      <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 border-b-2 border-gray-200">
                        <div>Data/Hora</div>
                        <div>Descrição</div>
                        <div className="text-center">Tipo</div>
                        <div className="text-right">Valor</div>
                        <div className="text-right">Saldo</div>
                      </div>

                      {/* Processar transações da plataforma */}
                      {(() => {
                        const platformTransactions = allTransactions.filter(t => 
                          ['platform_commission', 'withdrawal', 'withdrawal_fee'].includes(t.transaction_type)
                        );
                        
                        let currentBalance = 0;
                        
                        // Calcular saldo para cada transação
                        const transactionsWithBalance = platformTransactions.reverse().map((transaction) => {
                          const isCredit = transaction.transaction_type === 'platform_commission';
                          
                          if (isCredit) {
                            currentBalance += transaction.amount;
                          } else {
                            currentBalance -= transaction.amount;
                          }
                          
                          return { ...transaction, balanceAfter: currentBalance, isCredit };
                        }).reverse();

                        return transactionsWithBalance.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="grid grid-cols-5 gap-4 p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100 text-sm"
                          >
                            {/* Data/Hora */}
                            <div className="text-gray-600">
                              <div className="font-medium">
                                {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                              </div>
                            </div>

                            {/* Descrição */}
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.description}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center space-x-1">
                                {transaction.transaction_type === 'platform_commission' && <><DollarSign size={12} /> <span>Comissão</span></>}
                                {transaction.transaction_type === 'withdrawal' && <><ArrowUpRight size={12} /> <span>Saque</span></>}
                                {transaction.transaction_type === 'withdrawal_fee' && <><ArrowUpRight size={12} /> <span>Taxa</span></>}
                              </div>
                            </div>

                            {/* Tipo */}
                            <div className="text-center">
                              <Badge 
                                className={`text-xs ${
                                  transaction.isCredit 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {transaction.isCredit ? 'CRÉDITO' : 'DÉBITO'}
                              </Badge>
                            </div>

                            {/* Valor */}
                            <div className={`text-right font-bold ${
                              transaction.isCredit ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.isCredit ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>

                            {/* Saldo após transação */}
                            <div className="text-right font-medium text-gray-900">
                              {formatCurrency(transaction.balanceAfter)}
                            </div>
                          </div>
                        ));
                      })()}

                      {/* Saldo atual */}
                      <div className="grid grid-cols-5 gap-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200 font-bold">
                        <div className="col-span-3 text-purple-800">
                          SALDO ATUAL DA PLATAFORMA
                        </div>
                        <div></div>
                        <div className="text-right text-purple-600 text-lg">
                          {formatCurrency(dashboardData?.platform_stats?.platform_balance || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawal Tab */}
          <TabsContent value="withdrawal" className="space-y-6 overflow-y-visible pb-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpRight size={20} />
                  <span>Sacar Receita da Plataforma</span>
                </CardTitle>
                <CardDescription>Transfira a receita da plataforma para conta bancária via PIX</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-800 font-medium">Saldo Disponível para Saque:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardData?.platform_stats?.platform_balance || 0)}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    💡 Este é o saldo acumulado das comissões de 30% de cada transação
                  </p>
                </div>

                <form onSubmit={handleWithdrawal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-amount">Valor (R$)</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      step="0.01"
                      min="3.01"
                      max={dashboardData?.platform_stats?.platform_balance || 0}
                      placeholder="0,00"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                      required
                      className="input-field"
                    />
                    <p className="text-sm text-gray-600">
                      Valor mínimo: R$ 3,01 (para cobrir taxa mínima)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-key-type">Tipo de Chave PIX</Label>
                    <Select 
                      value={withdrawalData.pix_key_type} 
                      onValueChange={(value) => setWithdrawalData({ ...withdrawalData, pix_key_type: value, pix_key: '' })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-key">Chave PIX da Transmill</Label>
                    <Input
                      id="pix-key"
                      type="text"
                      placeholder={
                        withdrawalData.pix_key_type === 'cpf' ? '000.000.000-00' :
                        withdrawalData.pix_key_type === 'cnpj' ? '00.000.000/0001-00' :
                        withdrawalData.pix_key_type === 'email' ? 'financeiro@transmill.com' :
                        withdrawalData.pix_key_type === 'phone' ? '(11) 99999-9999' :
                        'chave-aleatória-uuid'
                      }
                      value={withdrawalData.pix_key}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, pix_key: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Banco de Destino</Label>
                    <Select 
                      value={withdrawalData.bank_name} 
                      onValueChange={(value) => setWithdrawalData({ ...withdrawalData, bank_name: value })}
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nubank">Nubank</SelectItem>
                        <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                        <SelectItem value="Bradesco">Bradesco</SelectItem>
                        <SelectItem value="Itaú">Itaú</SelectItem>
                        <SelectItem value="Santander">Santander</SelectItem>
                        <SelectItem value="Caixa">Caixa Econômica</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="C6 Bank">C6 Bank</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {withdrawalData.amount && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      {(() => {
                        const amount = parseFloat(withdrawalData.amount);
                        const fee = Math.max(amount * 0.0399, 3.00);
                        const total = amount + fee;
                        return (
                          <div className="text-sm text-yellow-800 space-y-1">
                            <p><strong>Valor solicitado:</strong> {formatCurrency(amount)}</p>
                            <p><strong>Taxa (3,99% - mín. R$ 3,00):</strong> {formatCurrency(fee)}</p>
                            <p><strong>Total debitado:</strong> {formatCurrency(total)}</p>
                            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                              🏦 <strong>XGate API:</strong> Transferência da receita da plataforma via PIX
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={withdrawalLoading || !withdrawalData.amount || !withdrawalData.pix_key || !withdrawalData.bank_name}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {withdrawalLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando saque da plataforma...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ArrowUpRight size={16} />
                        <span>Sacar {withdrawalData.amount ? formatCurrency(parseFloat(withdrawalData.amount)) : 'R$ 0,00'}</span>
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">💰 Modelo de Negócio Sustentável</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• 30% de cada cashback = receita automática da plataforma</p>
                    <p>• Quanto mais transações, maior a receita</p>
                    <p>• Sistema escalável e lucrativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6 overflow-y-visible pb-20">
            {/* Novo Modelo de Distribuição de Cashback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift size={20} />
                    <span>Modelo de Comissões Hierárquico</span>
                  </div>
                  <Button
                    onClick={fetchCashbackRules}
                    className="btn-primary"
                    size="sm"
                  >
                    <FileText size={16} className="mr-2" />
                    Regras Detalhadas
                  </Button>
                </CardTitle>
                <CardDescription>Sistema hierárquico de distribuição de cashback por localização</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Nova Distribuição de Cashback */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-4 text-lg">Nova Distribuição de Cashback (100%)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-xl font-bold text-green-600 mb-1">50%</div>
                        <div className="text-xs text-gray-600">Comprador</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-xl font-bold text-blue-600 mb-1">10%</div>
                        <div className="text-xs text-gray-600">Indicador Cliente</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-xl font-bold text-orange-600 mb-1">10%</div>
                        <div className="text-xs text-gray-600">Indicador Loja</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-purple-300">
                        <div className="text-xl font-bold text-purple-600 mb-1">10%</div>
                        <div className="text-xs text-gray-600">Sócio Estado</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-indigo-300">
                        <div className="text-xl font-bold text-indigo-600 mb-1">5%</div>
                        <div className="text-xs text-gray-600">Mini Agencia</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-teal-300">
                        <div className="text-xl font-bold text-teal-600 mb-1">5%</div>
                        <div className="text-xs text-gray-600">Consultor</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-red-300">
                        <div className="text-xl font-bold text-red-600 mb-1">10%</div>
                        <div className="text-xs text-gray-600">Master</div>
                      </div>
                    </div>
                  </div>

                  {/* Exemplo Prático Atualizado */}
                  <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3">Exemplo: Compra R$ 100,00 com 10% cashback (R$ 10,00 total)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm text-green-800">
                        <p>• <strong>Comprador:</strong> R$ 5,00 (50%)</p>
                        <p>• <strong>Indicador Cliente:</strong> R$ 1,00 (10%)</p>
                        <p>• <strong>Indicador Loja:</strong> R$ 1,00 (10%)</p>
                        <p>• <strong>Sócio Operador Estado:</strong> R$ 1,00 (10%)</p>
                      </div>
                      <div className="space-y-2 text-sm text-green-800">
                        <p>• <strong>Mini Agencia Cidade:</strong> R$ 0,50 (5%)</p>
                        <p>• <strong>Consultor:</strong> R$ 0,50 (5%)</p>
                        <p className="font-bold text-green-600">• <strong>Master + Fallbacks:</strong> R$ 1,00 (10%)</p>
                        <p className="font-bold text-purple-600 border-t pt-2">• <strong>Total:</strong> R$ 10,00 (100%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Regras de Fallback */}
                  <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-3">Regras de Fallback para Master</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-yellow-800">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="font-semibold text-purple-600 mb-1">Sem Sócio Operador</p>
                        <p>Se não há Sócio no estado → 10% vai para Master</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="font-semibold text-indigo-600 mb-1">Sem Mini Agencia</p>
                        <p>Se não há Mini Agencia na cidade → 5% vai para Master</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="font-semibold text-teal-600 mb-1">Sem Consultor</p>
                        <p>Se não há Consultor na hierarquia → 5% vai para Master</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extrato Hierárquico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={20} />
                    <span>Extrato Comissões Hierárquicas</span>
                  </div>
                  <Button
                    onClick={fetchHierarchicalExtract}
                    className="btn-primary"
                    size="sm"
                  >
                    <History size={16} className="mr-2" />
                    Atualizar Extrato
                  </Button>
                </CardTitle>
                <CardDescription>Comissões recebidas pelos agentes hierárquicos (Sócio, Mini Agencia, Consultor)</CardDescription>
              </CardHeader>
              <CardContent>
                {hierarchicalExtract ? (
                  <div className="space-y-6">
                    {/* Totais por Tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-2">Sócios Operadores</h5>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(hierarchicalExtract.totals?.socio_operador || 0)}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">Total distribuído</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-2">Mini Agencias</h5>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(hierarchicalExtract.totals?.mini_agencia || 0)}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">Total distribuído</p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <h5 className="font-semibold text-teal-900 mb-2">Consultores</h5>
                        <p className="text-2xl font-bold text-teal-600">
                          {formatCurrency(hierarchicalExtract.totals?.consultor || 0)}
                        </p>
                        <p className="text-xs text-teal-700 mt-1">Total distribuído</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2">Total Geral</h5>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(hierarchicalExtract.grand_total || 0)}
                        </p>
                        <p className="text-xs text-green-700 mt-1">Todas comissões</p>
                      </div>
                    </div>

                    {/* Transações Recentes */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Últimas Transações Hierárquicas</h5>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="space-y-2">
                          {hierarchicalExtract.transactions?.slice(0, 10).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-gray-600">
                                  {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às{' '}
                                  {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatCurrency(transaction.amount)}
                                </p>
                                <Badge className={
                                  transaction.transaction_type === 'socio_operador_bonus' ? 'bg-[#F5F5F5] text-[#005B9C]' :
                                  transaction.transaction_type === 'mini_agencia_bonus' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-teal-100 text-teal-800'
                                }>
                                  {transaction.transaction_type === 'socio_operador_bonus' ? 'Sócio' :
                                   transaction.transaction_type === 'mini_agencia_bonus' ? 'Mini Agencia' :
                                   'Consultor'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <History size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>Clique em "Atualizar Extrato" para carregar as transações hierárquicas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internet Móvel Tab */}
          <TabsContent value="internet" className="space-y-6 overflow-y-visible pb-20">
            <InternetPlansManager />
          </TabsContent>

          {/* Telemedicina Tab */}
          <TabsContent value="telemedicine" className="space-y-6 overflow-y-visible pb-20">
            <TelemedicinePlansManager />
          </TabsContent>

          {/* Colaboradores Tab */}
          <TabsContent value="subusers" className="space-y-6 overflow-y-visible pb-20">
            <SubUsersManager />
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent value="docs" className="space-y-6 overflow-y-visible pb-20">
            <CompleteUserProfile />
          </TabsContent>

          {/* Chatbot Training Tab */}
          <TabsContent value="chatbot" className="space-y-6 overflow-y-visible pb-20">
            <ChatbotTraining API={API} token={token} />
          </TabsContent>

          {/* Social Network Tab */}
          <TabsContent value="social" className="space-y-6 overflow-y-visible pb-20">
            <SocialManagement />
          </TabsContent>

          {/* Credit Card Fees Tab */}
          <TabsContent value="credit-card" className="space-y-6 overflow-y-visible pb-20">
            <CreditCardFeesManagement />
          </TabsContent>

          {/* ========== ECOSSISTEMA TRANSMILL - SERVIÇOS COMPLETOS ========== */}
          
          {/* Carteira Digital Tab */}
          <TabsContent value="wallet" className="space-y-6 overflow-y-visible pb-20">
            <WalletDashboard franquiaContext={franquiaContext} />
          </TabsContent>

          {/* Lojas Tab */}
          <TabsContent value="lojas" className="space-y-6 overflow-y-visible pb-20">
            <LojasPage embedded={true} franquiaContext={franquiaContext} />
          </TabsContent>

          {/* Prestadores Tab */}
          <TabsContent value="prestadores" className="space-y-6 overflow-y-visible pb-20">
            <PrestadoresPage embedded={true} franquiaContext={franquiaContext} />
          </TabsContent>

          {/* Mobilidade Tab */}
          <TabsContent value="mobility" className="space-y-6 overflow-y-visible pb-20">
            <MobilityHome embedded={true} franquiaContext={franquiaContext} />
          </TabsContent>

          {/* Integrações / APIs Tab */}
          <TabsContent value="integracoes" className="space-y-6 overflow-y-visible pb-20">
            {isFranquiaMode && franquiaContext?.slug ? (
              <FranquiaIntegracoesPanel slug={franquiaContext.slug} corPrimaria={corPrimaria} />
            ) : (
              <div className="space-y-4 max-w-3xl" data-testid="integracoes-master-selector">
                <div>
                  <label className="text-sm font-medium text-gray-700">Selecione o White Label para configurar as APIs</label>
                  <select
                    data-testid="integracoes-franquia-select"
                    className="mt-1 block w-full rounded-lg border border-gray-300 p-2 text-sm"
                    value={integracoesSlug}
                    onChange={(e) => setIntegracoesSlug(e.target.value)}
                  >
                    <option value="">— Escolha um White Label —</option>
                    {franquiasList.map((f) => (
                      <option key={f.slug} value={f.slug}>{f.nome} ({f.slug})</option>
                    ))}
                  </select>
                </div>
                {integracoesSlug && (
                  <FranquiaIntegracoesPanel slug={integracoesSlug} corPrimaria={corPrimaria} />
                )}
              </div>
            )}
          </TabsContent>

        </Tabs>

        {/* User Network Modal */}
        <Dialog open={showNetworkModal} onOpenChange={setShowNetworkModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users size={20} />
                <span>Rede de Indicações</span>
              </DialogTitle>
              <DialogDescription>
                Visualize a rede de indicações e bônus gerados pelo usuário
              </DialogDescription>
            </DialogHeader>
            
            {userNetwork && (
              <div className="space-y-6 mt-6">
                {/* Informações do Usuário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Usuário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      {userNetwork.user_info.profile_image ? (
                        <img
                          src={userNetwork.user_info.profile_image}
                          alt={userNetwork.user_info.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-lg">
                            {userNetwork.user_info.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold">
                          {userNetwork.user_info.company_name || userNetwork.user_info.full_name}
                        </h3>
                        <p className="text-gray-600">{userNetwork.user_info.email}</p>
                        <Badge className={getUserTypeBadgeColor(userNetwork.user_info.user_type)}>
                          {formatUserType(userNetwork.user_info.user_type)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{userNetwork.network_stats.total_referred}</p>
                        <p className="text-sm text-gray-600">Total Indicados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{userNetwork.network_stats.active_referred}</p>
                        <p className="text-sm text-gray-600">Ativos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(userNetwork.network_stats.total_bonus_earned)}
                        </p>
                        <p className="text-sm text-gray-600">Bônus Gerados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quem indicou este usuário */}
                {userNetwork.referrer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Indicado por</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                        {userNetwork.referrer.profile_image ? (
                          <img
                            src={userNetwork.referrer.profile_image}
                            alt={userNetwork.referrer.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {userNetwork.referrer.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">
                            {userNetwork.referrer.company_name || userNetwork.referrer.full_name}
                          </p>
                          <p className="text-sm text-gray-600">{userNetwork.referrer.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Usuários indicados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuários Indicados ({userNetwork.referred_users.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userNetwork.referred_users.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600">Nenhum usuário indicado ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userNetwork.referred_users.map((referred) => (
                          <div key={referred.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              {referred.profile_image ? (
                                <img
                                  src={referred.profile_image}
                                  alt={referred.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-semibold">
                                    {referred.full_name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">
                                  {referred.company_name || referred.full_name}
                                </p>
                                <p className="text-sm text-gray-600">{referred.email}</p>
                                <div className="flex space-x-2">
                                  <Badge className={getUserTypeBadgeColor(referred.user_type)}>
                                    {formatUserType(referred.user_type)}
                                  </Badge>
                                  <Badge className={referred.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                    {referred.is_blocked ? 'Bloqueado' : 'Ativo'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(referred.balance)}</p>
                              <p className="text-sm text-orange-600">
                                Bônus: {formatCurrency(referred.total_bonus_generated)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {referred.created_at ? formatDate(referred.created_at) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Business Segment Modal */}
        <Dialog open={showSegmentModal} onOpenChange={setShowSegmentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSegment ? 'Editar Segmento' : 'Novo Segmento'}
              </DialogTitle>
              <DialogDescription>
                {editingSegment ? 'Altere os dados do segmento de negócio' : 'Crie um novo segmento de negócio para lojistas'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSaveSegment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="segment-name">Nome do Segmento *</Label>
                <Input
                  id="segment-name"
                  type="text"
                  placeholder="Ex: Alimentação, Vestuário, Saúde"
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment-description">Descrição</Label>
                <Input
                  id="segment-description"
                  type="text"
                  placeholder="Descrição opcional do segmento"
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="segment-active"
                  checked={segmentForm.is_active}
                  onChange={(e) => setSegmentForm({ ...segmentForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <Label htmlFor="segment-active">Segmento ativo</Label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSegmentModal(false)}
                  disabled={segmentLoading}
                  className="flex-1"
                >
                  <X size={16} className="mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={segmentLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {segmentLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {editingSegment ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Notification Modal */}
        <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Notificação</DialogTitle>
              <DialogDescription>
                Envie notificações para usuários da plataforma
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-title">Título *</Label>
                  <Input
                    id="notification-title"
                    type="text"
                    placeholder="Título da notificação"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-priority">Prioridade</Label>
                  <select
                    id="notification-priority"
                    value={notificationForm.priority}
                    onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message">Mensagem *</Label>
                <textarea
                  id="notification-message"
                  placeholder="Escreva sua mensagem aqui..."
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  required
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-target">Destinatários</Label>
                <select
                  id="notification-target"
                  value={notificationForm.target_type}
                  onChange={(e) => setNotificationForm({ ...notificationForm, target_type: e.target.value, target_user_id: '' })}
                  className="input-field"
                >
                  <option value="all">Todos os usuários</option>
                  <option value="clients">Apenas clientes</option>
                  <option value="merchants">Apenas lojistas</option>
                  <option value="individual">Usuário específico</option>
                </select>
              </div>

              {notificationForm.target_type === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="notification-user">Usuário Específico *</Label>
                  <select
                    id="notification-user"
                    value={notificationForm.target_user_id}
                    onChange={(e) => setNotificationForm({ ...notificationForm, target_user_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione um usuário...</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email}) - {formatUserType(user.user_type)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notification-image">Imagem (opcional)</Label>
                <Input
                  id="notification-image"
                  type="file"
                  accept="image/*"
                  onChange={handleNotificationImageUpload}
                  className="input-field"
                />
                {notificationImagePreview && (
                  <div className="mt-2">
                    <img 
                      src={notificationImagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotificationImagePreview(null);
                        setNotificationForm({ ...notificationForm, image: '' });
                      }}
                      className="mt-2"
                    >
                      Remover Imagem
                    </Button>
                  </div>
                )}
              </div>

              {/* Push Notification Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bell size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Push Notification (PWA)</h4>
                      <p className="text-sm text-gray-600">
                        {pushSubscribersCount > 0 
                          ? `${pushSubscribersCount} dispositivo(s) inscrito(s) para receber notificações`
                          : 'Nenhum dispositivo inscrito ainda'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendPushNotification}
                      onChange={(e) => setSendPushNotification(e.target.checked)}
                      className="sr-only peer"
                      disabled={pushSubscribersCount === 0}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${pushSubscribersCount > 0 ? 'peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600' : 'opacity-50 cursor-not-allowed'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                </div>
                {sendPushNotification && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    ✓ Notificação será enviada para os smartphones dos usuários
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNotificationModal(false)}
                  disabled={notificationLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={notificationLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {notificationLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send size={16} className="mr-2" />
                  )}
                  Enviar Notificação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Hierarchical User Modal */}
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield size={20} />
                <span>Novo Usuário Hierárquico</span>
              </DialogTitle>
              <DialogDescription>
                Cadastre um novo Sócio Operador, Mini Agencia ou Consultor
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateHierarchicalUser} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome Completo *</Label>
                  <Input
                    id="user-name"
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-email">Email *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-phone">Telefone</Label>
                  <Input
                    id="user-phone"
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-whatsapp">WhatsApp *</Label>
                  <Input
                    id="user-whatsapp"
                    type="text"
                    value={userForm.whatsapp}
                    onChange={(e) => setUserForm({ ...userForm, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-state">Estado *</Label>
                  <Select 
                    value={userForm.state} 
                    onValueChange={(value) => handleStateChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state, index) => (
                        <SelectItem key={`state-${index}`} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-city">Cidade</Label>
                  <Select 
                    value={userForm.city} 
                    onValueChange={(value) => setUserForm({ ...userForm, city: value })}
                    disabled={!userForm.state || (userForm.role !== 'mini_agencia')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !userForm.state 
                          ? "Selecione primeiro o estado" 
                          : userForm.role !== 'mini_agencia' 
                          ? "Não obrigatório para esta função" 
                          : "Selecione a cidade"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCities.map((city, index) => (
                        <SelectItem key={`city-${index}`} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-role">Função *</Label>
                  <Select 
                    value={userForm.role} 
                    onValueChange={(value) => setUserForm({ ...userForm, role: value, city: value === 'mini_agencia' ? userForm.city : '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="socio_operador">Sócio Operador</SelectItem>
                      <SelectItem value="mini_agencia">Mini Agencia</SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha *</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Digite a senha"
                    required
                  />
                </div>
              </div>

              {/* Informações sobre a função selecionada */}
              {userForm.role && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {getRoleLabel(userForm.role)}
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {userForm.role === 'socio_operador' && (
                      <>
                        <p>• Acesso a toda movimentação do estado de origem</p>
                        <p>• Recebe 10/30 (33,33%) das comissões master do estado</p>
                        <p>• Dashboard com estatísticas estaduais</p>
                      </>
                    )}
                    {userForm.role === 'mini_agencia' && (
                      <>
                        <p>• Acesso a toda movimentação da cidade de origem</p>
                        <p>• Recebe 5/30 (16,67%) das comissões master da cidade</p>
                        <p>• Dashboard com estatísticas municipais</p>
                      </>
                    )}
                    {userForm.role === 'consultor' && (
                      <>
                        <p>• Acesso à movimentação da sua rede de indicados</p>
                        <p>• Recebe 5/30 (16,67%) das comissões da sua rede</p>
                        <p>• Dashboard com estatísticas da rede</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                  disabled={userLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={userLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {userLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Criando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus size={16} />
                      <span>Criar Usuário</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Lançamento Manual */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lançamento Manual</DialogTitle>
              <DialogDescription>
                Realize crédito ou débito na conta do usuário
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => { e.preventDefault(); createUserTransaction(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-type">Tipo de Lançamento</Label>
                <Select 
                  value={transactionForm.transaction_type} 
                  onValueChange={(value) => setTransactionForm({...transactionForm, transaction_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_credit">Crédito (+)</SelectItem>
                    <SelectItem value="manual_debit">Débito (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                  placeholder="Motivo do lançamento"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransactionModal(false)}
                  disabled={transactionLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={transactionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {transactionLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CreditCard size={16} />
                      <span>Realizar Lançamento</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Extrato do Usuário */}
        <Dialog open={showExtractModal} onOpenChange={setShowExtractModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Extrato do Usuário - Suporte</DialogTitle>
              <DialogDescription>
                Visualização completa do extrato para suporte técnico
              </DialogDescription>
            </DialogHeader>
            
            {userExtract && (
              <div className="space-y-6">
                {/* Informações do Usuário */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Dados do Usuário</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Nome:</strong> {userExtract.user_info.name}</p>
                      <p><strong>Email:</strong> {userExtract.user_info.email}</p>
                    </div>
                    <div>
                      <p><strong>Tipo:</strong> {userExtract.user_info.user_type}</p>
                      <p><strong>ID:</strong> {userExtract.user_info.id}</p>
                    </div>
                  </div>
                </div>

                {/* Saldos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(userExtract.balance.balance)}
                    </p>
                    <p className="text-sm text-emerald-800">Saldo BRL</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-yellow-600">
                      {(userExtract.balance.usdt_balance || 0).toFixed(6)} USDT
                    </p>
                    <p className="text-sm text-yellow-800">Saldo USDT</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(userExtract.balance.cashback_balance)}
                    </p>
                    <p className="text-sm text-orange-800">Cashback</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(userExtract.balance.total)}
                    </p>
                    <p className="text-sm text-blue-800">Total BRL</p>
                  </div>
                </div>

                {/* Transações */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Histórico de Transações</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {userExtract.transactions.map((transaction) => (
                        <div key={transaction.id} className="p-3 bg-white border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(transaction.created_at).toLocaleString('pt-BR')}
                              </p>
                              <Badge className="mt-1">
                                {transaction.transaction_type}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                              </p>
                              {transaction.created_by_master && (
                                <Badge className="mt-1 bg-[#F5F5F5] text-[#005B9C]">
                                  MASTER
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Definir Agente Hierárquico */}
        <Dialog open={showHierarchicalModal} onOpenChange={setShowHierarchicalModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Definir Agente Hierárquico</DialogTitle>
              <DialogDescription>
                Configure o usuário como agente hierárquico da rede
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => { e.preventDefault(); setHierarchicalAgent(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hierarchical-role">Tipo de Agente</Label>
                <Select 
                  value={hierarchicalForm.hierarchical_role} 
                  onValueChange={(value) => setHierarchicalForm({...hierarchicalForm, hierarchical_role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultor">Consultor</SelectItem>
                    <SelectItem value="mini_agencia">Mini Agencia (Cidade)</SelectItem>
                    <SelectItem value="socio_operador">Sócio Operador (Estado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hierarchicalForm.hierarchical_role === 'socio_operador' && (
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    type="text"
                    value={hierarchicalForm.state}
                    onChange={(e) => setHierarchicalForm({...hierarchicalForm, state: e.target.value})}
                    placeholder="Ex: Rio de Janeiro"
                    required
                  />
                </div>
              )}

              {hierarchicalForm.hierarchical_role === 'mini_agencia' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      type="text"
                      value={hierarchicalForm.state}
                      onChange={(e) => setHierarchicalForm({...hierarchicalForm, state: e.target.value})}
                      placeholder="Ex: Rio de Janeiro"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      type="text"
                      value={hierarchicalForm.city}
                      onChange={(e) => setHierarchicalForm({...hierarchicalForm, city: e.target.value})}
                      placeholder="Ex: Rio de Janeiro"
                      required
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta ação definirá o usuário como agente hierárquico.
                  {hierarchicalForm.hierarchical_role === 'socio_operador' && ' Só pode haver um Sócio Operador por estado.'}
                  {hierarchicalForm.hierarchical_role === 'mini_agencia' && ' Só pode haver uma Mini Agencia por cidade.'}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHierarchicalModal(false)}
                  disabled={hierarchicalLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={hierarchicalLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {hierarchicalLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Definindo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <UserPlus size={16} />
                      <span>Definir Agente</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Compliance Modal */}
        <Dialog open={showComplianceModal} onOpenChange={setShowComplianceModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText size={20} />
                <span>Verificação de Documentação - Compliance</span>
              </DialogTitle>
              <DialogDescription>
                Analise todos os dados e documentos do usuário para aprovação
              </DialogDescription>
            </DialogHeader>
            
            {complianceUser && (
              <div className="space-y-6">
                {/* User Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <User className="mr-2" size={18} />
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                      <p className="font-semibold">{complianceUser.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="font-semibold">{complianceUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CPF</Label>
                      <p className="font-semibold">{complianceUser.cpf || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                      <p className="font-semibold">{complianceUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Nascimento</Label>
                      <p className="font-semibold">{complianceUser.birth_date || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo de Usuário</Label>
                      <Badge className={getUserTypeBadgeColor(complianceUser.user_type)}>
                        {formatUserType(complianceUser.user_type)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <MapPin className="mr-2" size={18} />
                    Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CEP</Label>
                      <p className="font-semibold">{complianceUser.zipcode || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estado</Label>
                      <p className="font-semibold">{complianceUser.state || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cidade</Label>
                      <p className="font-semibold">{complianceUser.city || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bairro</Label>
                      <p className="font-semibold">{complianceUser.neighborhood || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Endereço Completo</Label>
                      <p className="font-semibold">
                        {complianceUser.street}, {complianceUser.number}
                        {complianceUser.complement && ` - ${complianceUser.complement}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Info (for merchants and service providers) */}
                {(complianceUser.user_type === 'lojista' || complianceUser.user_type === 'service_provider') && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Building2 className="mr-2" size={18} />
                      Dados da Empresa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Nome da Empresa</Label>
                        <p className="font-semibold">{complianceUser.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">CNPJ</Label>
                        <p className="font-semibold">{complianceUser.cnpj || 'N/A'}</p>
                      </div>
                      {complianceUser.user_type === 'lojista' && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Segmento de Negócio</Label>
                          <p className="font-semibold">{complianceUser.business_segment || 'N/A'}</p>
                        </div>
                      )}
                      {complianceUser.user_type === 'service_provider' && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Tipo de Serviço</Label>
                          <p className="font-semibold">{complianceUser.service_type || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Shield className="mr-2" size={18} />
                    Status da Conta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-600">Status:</Label>
                      <Badge className={complianceUser.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {complianceUser.is_blocked ? 'Bloqueado' : 'Ativo'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-600">Data de Cadastro:</Label>
                      <span className="font-semibold text-sm">
                        {complianceUser.created_at ? formatDate(complianceUser.created_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-600">Aprovado:</Label>
                      <Badge className={complianceUser.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {complianceUser.is_approved ? 'Sim' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <FileText className="mr-2" size={18} />
                    Documentos Enviados
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Profile Image */}
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-600 block mb-2">
                        {complianceUser.user_type === 'cliente' ? 'Foto de Perfil' : 'Logo da Empresa'}
                      </Label>
                      {complianceUser.profile_image ? (
                        <img
                          src={complianceUser.profile_image}
                          alt="Perfil/Logo"
                          className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Não enviado</span>
                        </div>
                      )}
                    </div>

                    {/* RG Front */}
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-600 block mb-2">RG - Frente</Label>
                      {complianceUser.rg_front ? (
                        <img
                          src={complianceUser.rg_front}
                          alt="RG Frente"
                          className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Não enviado</span>
                        </div>
                      )}
                    </div>

                    {/* RG Back */}
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-600 block mb-2">RG - Verso</Label>
                      {complianceUser.rg_back ? (
                        <img
                          src={complianceUser.rg_back}
                          alt="RG Verso"
                          className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Não enviado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Instruções de Compliance:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Verifique se os dados pessoais conferem com o documento</li>
                      <li>• Confirme se o RG está legível e não é falsificado</li>
                      <li>• Para empresas, verifique CNPJ e dados da empresa</li>
                      <li>• Aprove apenas se todos os dados estiverem corretos</li>
                    </ul>
                  </div>
                </div>

                {/* Approval Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowComplianceModal(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproveUser(complianceUser.id, false)}
                    disabled={complianceLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="mr-2" size={16} />
                    {complianceLoading ? 'Processando...' : 'Rejeitar'}
                  </Button>
                  <Button
                    onClick={() => handleApproveUser(complianceUser.id, true)}
                    disabled={complianceLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2" size={16} />
                    {complianceLoading ? 'Processando...' : 'Aprovar Usuário'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
          </div> {/* Fecha max-w-7xl */}
        </div> {/* Fecha área de conteúdo */}
      </div> {/* Fecha conteúdo principal */}
    </div>
  );
};

// Componente para gerenciar planos de Internet Móvel
const InternetPlansManager = () => {
  const { API } = useAuth();
  const [plans, setPlans] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' ou 'sales'
  
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    cashback_percentage: '5.0',
    image_url: '',
    data_limit_gb: '',
    validity_days: '30',
    speed_mbps: '',
    features: '',
    is_active: true
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API}/master/internet-plans`, { headers });
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const response = await fetch(`${API}/master/internet-plans/sales?limit=100`, { headers });
      const data = await response.json();
      if (data.success) {
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoadingSales(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPlanForm({...planForm, image_url: base64});
      toast.success('Imagem carregada com sucesso');
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar imagem');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const planData = {
        ...planForm,
        price: parseFloat(planForm.price),
        cashback_percentage: parseFloat(planForm.cashback_percentage),
        data_limit_gb: planForm.data_limit_gb ? parseInt(planForm.data_limit_gb) : null,
        validity_days: parseInt(planForm.validity_days),
        features: planForm.features ? planForm.features.split(',').map(f => f.trim()) : []
      };

      const url = editingPlan 
        ? `${API}/master/internet-plans/${editingPlan.id}`
        : `${API}/master/internet-plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
        resetForm();
        fetchPlans();
      } else {
        toast.error(data.message || 'Erro ao salvar plano');
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      cashback_percentage: (plan.cashback_percentage || 5.0).toString(),
      image_url: plan.image_url || '',
      data_limit_gb: plan.data_limit_gb ? plan.data_limit_gb.toString() : '',
      validity_days: plan.validity_days.toString(),
      speed_mbps: plan.speed_mbps || '',
      features: plan.features ? plan.features.join(', ') : '',
      is_active: plan.is_active
    });
    setIsCreating(true);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const response = await fetch(`${API}/master/internet-plans/${planId}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Plano removido com sucesso!');
        fetchPlans();
      } else {
        toast.error('Erro ao remover plano');
      }
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      toast.error('Erro ao remover plano');
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      cashback_percentage: '5.0',
      image_url: '',
      data_limit_gb: '',
      validity_days: '30',
      speed_mbps: '',
      features: '',
      is_active: true
    });
    setEditingPlan(null);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando planos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi size={24} className="text-blue-600" />
            Internet Móvel
          </CardTitle>
          <CardDescription>
            Gerencie planos e acompanhe vendas de internet móvel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setActiveTab('plans')}
              variant={activeTab === 'plans' ? 'default' : 'outline'}
            >
              📋 Planos
            </Button>
            <Button
              onClick={() => {
                setActiveTab('sales');
                fetchSales();
              }}
              variant={activeTab === 'sales' ? 'default' : 'outline'}
            >
              💰 Vendas
            </Button>
          </div>

          {/* Aba Planos */}
          {activeTab === 'plans' && (
            <div>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 mb-4"
              >
                <Plus size={16} className="mr-2" />
                Novo Plano
              </Button>

              {/* Form para criar/editar plano */}
              {isCreating && (
                <Card>
          <CardHeader>
            <CardTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano de Internet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan-name">Nome do Plano</Label>
                  <Input
                    id="plan-name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="Ex: Plano 5GB"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan-price">Preço (R$)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                    placeholder="Ex: 29.90"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="plan-cashback">Cashback (%)</Label>
                  <Input
                    id="plan-cashback"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={planForm.cashback_percentage}
                    onChange={(e) => setPlanForm({...planForm, cashback_percentage: e.target.value})}
                    placeholder="Ex: 5.0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="plan-data">Dados (GB)</Label>
                  <Input
                    id="plan-data"
                    type="number"
                    value={planForm.data_limit_gb}
                    onChange={(e) => setPlanForm({...planForm, data_limit_gb: e.target.value})}
                    placeholder="Ex: 5 (deixe vazio para ilimitado)"
                  />
                </div>

                <div>
                  <Label htmlFor="plan-validity">Validade (dias)</Label>
                  <Input
                    id="plan-validity"
                    type="number"
                    value={planForm.validity_days}
                    onChange={(e) => setPlanForm({...planForm, validity_days: e.target.value})}
                    placeholder="Ex: 30"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="plan-speed">Velocidade</Label>
                  <Input
                    id="plan-speed"
                    value={planForm.speed_mbps}
                    onChange={(e) => setPlanForm({...planForm, speed_mbps: e.target.value})}
                    placeholder="Ex: Até 100 Mbps"
                  />
                </div>

                <div>
                  <Label htmlFor="plan-image">Imagem do Plano (300x300px)</Label>
                  <div className="space-y-2">
                    <Input
                      id="plan-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {planForm.image_url && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img 
                          src={planForm.image_url} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPlanForm({...planForm, image_url: ''})}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Recomendado: 300x300px, máx 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="plan-description">Descrição</Label>
                <textarea
                  id="plan-description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  placeholder="Descrição detalhada do plano..."
                  className="w-full p-3 border rounded-lg resize-none h-24"
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-features">Características (separadas por vírgula)</Label>
                <Input
                  id="plan-features"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
                  placeholder="Ex: WhatsApp grátis, Redes sociais liberadas, Ligações ilimitadas"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="plan-active"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="plan-active">Plano ativo</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save size={16} className="mr-2" />
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X size={16} className="mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de planos existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados ({(plans || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <Wifi size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhum plano cadastrado ainda.</p>
              <p className="text-sm text-gray-500">Clique em "Novo Plano" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    {plan.image_url && (
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={plan.image_url} 
                          alt={plan.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><Smartphone class="text-gray-400" size={32} /></div>';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <p className="text-2xl font-bold text-green-600">
                        R$ {plan.price.toFixed(2)}
                      </p>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="space-y-1 text-sm text-gray-600">
                        {plan.data_limit_gb && (
                          <div>📊 {plan.data_limit_gb} GB</div>
                        )}
                        <div>⏱️ {plan.validity_days} dias</div>
                        {plan.speed_mbps && (
                          <div>🚀 {plan.speed_mbps}</div>
                        )}
                        <div className="text-green-600 font-semibold">
                          💰 {plan.cashback_percentage || 5.0}% cashback
                        </div>
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-1">
                          {plan.features.slice(0, 2).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit size={14} className="mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
            </div>
          )}

          {/* Aba Vendas */}
          {activeTab === 'sales' && (
            <div>
              {loadingSales ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Carregando vendas...</p>
                </div>
              ) : (
                <>
                  {/* Resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Total de Vendas</div>
                        <div className="text-2xl font-bold">{(sales || []).length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Receita Total</div>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {sales.reduce((sum, s) => sum + (s.amount_paid || 0), 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Planos Ativos</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(sales || []).filter(s => s.status === 'active').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela de Vendas */}
                  {sales.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Nenhuma venda registrada ainda.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Data</th>
                            <th className="text-left p-3">Cliente</th>
                            <th className="text-left p-3">Plano</th>
                            <th className="text-right p-3">Valor</th>
                            <th className="text-center p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((sale, index) => (
                            <tr key={sale.id || index} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                {new Date(sale.purchase_date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-3">
                                <div>{sale.customer_name || 'Cliente'}</div>
                                <div className="text-xs text-gray-500">{sale.customer_email}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium">{sale.plan_name}</div>
                                <div className="text-xs text-gray-500">
                                  {sale.data_limit_gb}GB - {sale.validity_days} dias
                                </div>
                              </td>
                              <td className="p-3 text-right font-semibold">
                                R$ {(sale.amount_paid || 0).toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  sale.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {sale.status === 'active' ? 'Ativo' : 'Expirado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para gerenciar planos de Telemedicina
const TelemedicinePlansManager = () => {
  const { API } = useAuth();
  const [plans, setPlans] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' ou 'sales'
  
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    cashback_percentage: '5.0',
    image_url: '',
    consultations_included: '',
    validity_days: '30',
    specialties: '',
    features: '',
    is_active: true
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/master/telemedicine-plans`, { headers });
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos de telemedicina');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const response = await axios.get(`${API}/master/telemedicine-plans/sales?limit=100`, { headers });
      if (response.data.success) {
        setSales(response.data.sales || []);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoadingSales(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPlanForm({...planForm, image_url: base64});
      toast.success('Imagem carregada com sucesso');
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar imagem');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        cashback_percentage: parseFloat(planForm.cashback_percentage),
        image_url: planForm.image_url || null,
        consultations_included: planForm.consultations_included ? parseInt(planForm.consultations_included) : null,
        validity_days: parseInt(planForm.validity_days),
        specialties: planForm.specialties ? planForm.specialties.split(',').map(s => s.trim()) : [],
        features: planForm.features ? planForm.features.split(',').map(f => f.trim()) : [],
        is_active: planForm.is_active
      };

      if (editingPlan) {
        const response = await axios.put(
          `${API}/master/telemedicine-plans/${editingPlan.id}`,
          planData,
          { headers }
        );
        
        if (response.data.success) {
          toast.success('Plano atualizado com sucesso!');
          setEditingPlan(null);
        }
      } else {
        const response = await axios.post(
          `${API}/master/telemedicine-plans`,
          planData,
          { headers }
        );
        
        if (response.data.success) {
          toast.success('Plano criado com sucesso!');
        }
      }
      
      resetForm();
      setIsCreating(false);
      fetchPlans();
      
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar plano');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      cashback_percentage: plan.cashback_percentage.toString(),
      image_url: plan.image_url || '',
      consultations_included: plan.consultations_included ? plan.consultations_included.toString() : '',
      validity_days: plan.validity_days.toString(),
      specialties: plan.specialties ? plan.specialties.join(', ') : '',
      features: plan.features ? plan.features.join(', ') : '',
      is_active: plan.is_active
    });
    setIsCreating(true);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API}/master/telemedicine-plans/${planId}`,
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Plano excluído com sucesso!');
        fetchPlans();
      }
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      cashback_percentage: '5.0',
      image_url: '',
      consultations_included: '',
      validity_days: '30',
      specialties: '',
      features: '',
      is_active: true
    });
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Stethoscope className="mr-2" />
                Telemedicina
              </CardTitle>
              <CardDescription>
                Gerencie planos e acompanhe vendas de telemedicina
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('plans')}
                variant={activeTab === 'plans' ? 'default' : 'outline'}
              >
                📋 Planos
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('sales');
                  fetchSales();
                }}
                variant={activeTab === 'sales' ? 'default' : 'outline'}
              >
                💰 Vendas
              </Button>
            </div>
          </div>
        </CardHeader>

        {activeTab === 'plans' && (
          <>
            <CardContent>
              <Button
                onClick={() => {
                  setIsCreating(!isCreating);
                  if (isCreating) resetForm();
                }}
                variant={isCreating ? "outline" : "default"}
                className="mb-4"
              >
                {isCreating ? (
                  <>
                    <X className="mr-2" size={16} />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" size={16} />
                    Novo Plano
                  </>
                )}
              </Button>
            </CardContent>
          </>
        )}
        <CardContent>
          {isCreating && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-lg">
                {editingPlan ? 'Editar Plano' : 'Novo Plano de Telemedicina'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Plano *</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="Ex: Plano Básico"
                    required
                  />
                </div>
                
                <div>
                  <Label>Preço (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                    placeholder="Ex: 49.90"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descrição *</Label>
                <Input
                  value={planForm.description}
                  onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  placeholder="Descrição do plano"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cashback (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={planForm.cashback_percentage}
                    onChange={(e) => setPlanForm({...planForm, cashback_percentage: e.target.value})}
                    placeholder="5.0"
                  />
                </div>

                <div>
                  <Label>Consultas Incluídas</Label>
                  <Input
                    type="number"
                    value={planForm.consultations_included}
                    onChange={(e) => setPlanForm({...planForm, consultations_included: e.target.value})}
                    placeholder="Ex: 5 (deixe vazio para ilimitado)"
                  />
                </div>

                <div>
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    value={planForm.validity_days}
                    onChange={(e) => setPlanForm({...planForm, validity_days: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label>Imagem do Plano (300x300px)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  {planForm.image_url && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img 
                        src={planForm.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPlanForm({...planForm, image_url: ''})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Recomendado: 300x300px, máx 5MB</p>
                </div>
              </div>

              <div>
                <Label>Especialidades (separadas por vírgula)</Label>
                <Input
                  value={planForm.specialties}
                  onChange={(e) => setPlanForm({...planForm, specialties: e.target.value})}
                  placeholder="Clínico Geral, Pediatria, Dermatologia"
                />
              </div>

              <div>
                <Label>Características (separadas por vírgula)</Label>
                <Input
                  value={planForm.features}
                  onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
                  placeholder="Atendimento 24h, Prescrição digital, Sem fila"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">Plano Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Save className="mr-2" size={16} />
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsCreating(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p>Carregando planos...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhum plano cadastrado ainda.</p>
              <p className="text-sm">Clique em "Novo Plano" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {plan.image_url && (
                      <img 
                        src={plan.image_url} 
                        alt={plan.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {plan.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Preço:</span>
                        <span className="font-semibold text-green-600">R$ {plan.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cashback:</span>
                        <span className="font-semibold">{plan.cashback_percentage}%</span>
                      </div>

                      {plan.consultations_included && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Consultas:</span>
                          <span className="font-semibold">{plan.consultations_included}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Validade:</span>
                        <span className="font-semibold">{plan.validity_days} dias</span>
                      </div>
                    </div>

                    {plan.specialties && plan.specialties.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Especialidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {plan.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{plan.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plan)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        {/* Aba Vendas */}
        {activeTab === 'sales' && (
          <CardContent>
            {loadingSales ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Carregando vendas...</p>
              </div>
            ) : (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Total de Vendas</div>
                      <div className="text-2xl font-bold">{(sales || []).length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Receita Total</div>
                      <div className="text-2xl font-bold text-green-600">
                        R$ {sales.reduce((sum, s) => sum + (s.amount_paid || 0), 0).toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Planos Ativos</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(sales || []).filter(s => s.status === 'active').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de Vendas */}
                {sales.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Nenhuma venda registrada ainda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Data</th>
                          <th className="text-left p-3">Cliente</th>
                          <th className="text-left p-3">Plano</th>
                          <th className="text-right p-3">Valor</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale, index) => (
                          <tr key={sale.id || index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {new Date(sale.purchase_date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3">
                              <div>{sale.customer_name || 'Cliente'}</div>
                              <div className="text-xs text-gray-500">{sale.customer_email}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{sale.plan_name}</div>
                              <div className="text-xs text-gray-500">
                                {sale.consultations_included} consultas - {sale.validity_days} dias
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold">
                              R$ {(sale.amount_paid || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                sale.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.status === 'active' ? 'Ativo' : 'Expirado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// ========== COMPONENTE WALLET DASHBOARD - CARTEIRA DIGITAL INTEGRADA ==========
const WalletDashboard = ({ franquiaContext }) => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState({
    brl: 0,
    balance: 0,
    cashback: 0,
    usdt: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar saldo do usuário
      const profileResponse = await axios.get(`${API}/user/profile`, { headers });
      if (profileResponse?.data) {
        const userData = profileResponse.data;
        setBalance({
          brl: (userData.balance || 0) + (userData.cashback_balance || 0),
          balance: userData.balance || 0,
          cashback: userData.cashback_balance || 0,
          usdt: userData.usdt_balance || 0
        });
      }

      // Buscar transações recentes
      try {
        const transactionsResponse = await axios.get(`${API}/user/transactions?limit=10`, { headers });
        if (transactionsResponse?.data?.transactions) {
          setTransactions(transactionsResponse.data.transactions);
        }
      } catch (err) {
        console.log('Transações não disponíveis:', err);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const corPrimaria = franquiaContext?.cor_primaria || '#005B9C';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Carteira Digital</h2>
          <p className="text-gray-600">Gerencie seu saldo e transações via XGate</p>
        </div>
        {franquiaContext && (
          <Badge style={{ backgroundColor: corPrimaria }} className="text-white">
            {franquiaContext.nome}
          </Badge>
        )}
      </div>

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Total */}
        <Card className="border-2" style={{ borderColor: corPrimaria }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${corPrimaria}20` }}>
                <Wallet size={24} style={{ color: corPrimaria }} />
              </div>
              <span className="text-xs text-gray-500">XGate API</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              R$ {balance.brl.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Saldo Total Disponível</p>
          </CardContent>
        </Card>

        {/* Saldo Principal */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              R$ {balance.balance.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Saldo Principal</p>
          </CardContent>
        </Card>

        {/* Cashback */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Gift size={24} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              R$ {balance.cashback.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Cashback Acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/deposito')}
            >
              <Plus size={24} style={{ color: corPrimaria }} />
              <span>Depositar</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/sacar')}
            >
              <ArrowUpRight size={24} className="text-green-600" />
              <span>Sacar</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/extrato')}
            >
              <FileText size={24} className="text-blue-600" />
              <span>Extrato</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/usdt')}
            >
              <TrendingUp size={24} className="text-purple-600" />
              <span>USDT</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History size={20} />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={tx.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.type === 'credit' || tx.type === 'deposit' 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'deposit' ? (
                        <ArrowDownLeft size={16} className="text-green-600" />
                      ) : (
                        <ArrowUpRight size={16} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at || tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    tx.type === 'credit' || tx.type === 'deposit' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'} R$ {(tx.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterDashboard;