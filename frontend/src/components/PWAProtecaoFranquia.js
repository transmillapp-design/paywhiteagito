import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Shield, 
  Phone, 
  MapPin, 
  Car, 
  FileText, 
  Bell,
  User,
  LogOut,
  Download,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Key,
  Fuel,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PWAProtecaoFranquia = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [protecao, setProtecao] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    carregarDados();
    
    // Capturar evento de instalação do PWA
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [slug]);

  const carregarDados = async () => {
    try {
      // Carregar franquia
      const franquiaRes = await axios.get(`${API_URL}/api/franquias/${slug}`);
      if (franquiaRes.data.success) {
        setFranquia(franquiaRes.data.franquia);
      }

      // Verificar se tem usuário logado
      const token = localStorage.getItem('token_protecao');
      if (token) {
        const userRes = await axios.get(`${API_URL}/api/pwa/minha-protecao`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.data.success) {
          setUser(userRes.data.cliente);
          setProtecao(userRes.data.protecao);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info('Para instalar, use o menu do navegador');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token_protecao');
    setUser(null);
    setProtecao(null);
    toast.success('Logout realizado');
  };

  const corPrimaria = franquia?.cor_primaria || '#1a59ad';
  const corTexto = franquia?.cor_texto || '#ffffff';
  const nomeFranquia = franquia?.nome || 'Proteção Veicular';

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: corPrimaria }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  // Tela de Login se não estiver logado
  if (!user) {
    return (
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: corPrimaria }}
      >
        {/* Header */}
        <div className="p-4 text-center">
          {franquia?.logo_url ? (
            <img src={franquia.logo_url} alt={nomeFranquia} className="h-16 mx-auto mb-2" />
          ) : (
            <Shield className="h-16 w-16 mx-auto mb-2" style={{ color: corTexto }} />
          )}
          <h1 className="text-2xl font-bold" style={{ color: corTexto }}>{nomeFranquia}</h1>
          <p className="text-sm opacity-80" style={{ color: corTexto }}>Proteção Veicular</p>
        </div>

        {/* Banner de Instalação */}
        {!isInstalled && deferredPrompt && (
          <div className="mx-4 mb-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8" style={{ color: corTexto }} />
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: corTexto }}>Instale o App!</p>
                <p className="text-xs opacity-80" style={{ color: corTexto }}>Acesso rápido à sua proteção</p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleInstall}>
                Instalar
              </Button>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <div className="flex-1 bg-white rounded-t-3xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Acesse sua Proteção</h2>
          
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
              const response = await axios.post(`${API_URL}/api/pwa/login`, {
                cpf: formData.get('cpf'),
                placa: formData.get('placa')
              });
              if (response.data.success) {
                localStorage.setItem('token_protecao', response.data.token);
                toast.success('Login realizado!');
                carregarDados();
              } else {
                toast.error(response.data.message || 'Dados não encontrados');
              }
            } catch (error) {
              toast.error('Erro ao fazer login');
            }
          }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Veículo</label>
              <input
                type="text"
                name="placa"
                placeholder="ABC-1234"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-3"
              style={{ backgroundColor: corPrimaria }}
            >
              Entrar
            </Button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Problemas para acessar?{' '}
            <a href={`tel:${franquia?.telefone_contato || ''}`} className="font-medium" style={{ color: corPrimaria }}>
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard do Cliente
  const servicosRapidos = [
    { icon: AlertTriangle, label: 'Roubo/Furto', cor: '#ef4444' },
    { icon: Car, label: 'Guincho', cor: '#f59e0b' },
    { icon: Wrench, label: 'Pane Mecânica', cor: '#3b82f6' },
    { icon: Key, label: 'Chaveiro', cor: '#8b5cf6' },
    { icon: Fuel, label: 'Pane Seca', cor: '#10b981' },
    { icon: Phone, label: 'Central 24h', cor: '#06b6d4' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div 
        className="p-4 pb-8"
        style={{ backgroundColor: corPrimaria }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {franquia?.logo_url ? (
              <img src={franquia.logo_url} alt={nomeFranquia} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Shield className="h-6 w-6" style={{ color: corTexto }} />
              </div>
            )}
            <div>
              <p className="text-sm opacity-80" style={{ color: corTexto }}>Olá,</p>
              <p className="font-semibold" style={{ color: corTexto }}>{user?.nome?.split(' ')[0]}</p>
            </div>
          </div>
          <button onClick={handleLogout}>
            <LogOut className="h-5 w-5" style={{ color: corTexto }} />
          </button>
        </div>

        {/* Card de Proteção */}
        <Card className="bg-white/10 backdrop-blur border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Car className="h-8 w-8" style={{ color: corTexto }} />
              <div className="flex-1">
                <p className="text-sm opacity-80" style={{ color: corTexto }}>{protecao?.veiculo || 'Meu Veículo'}</p>
                <p className="font-bold text-lg" style={{ color: corTexto }}>{protecao?.placa || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60" style={{ color: corTexto }}>Status</p>
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  {protecao?.status || 'Ativo'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Serviços Rápidos */}
      <div className="px-4 -mt-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Assistência 24h</h3>
            <div className="grid grid-cols-3 gap-3">
              {servicosRapidos.map((servico, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => toast.info(`Solicitando ${servico.label}...`)}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${servico.cor}20` }}
                  >
                    <servico.icon className="h-6 w-6" style={{ color: servico.cor }} />
                  </div>
                  <span className="text-xs text-gray-600 text-center">{servico.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu */}
      <div className="px-4 mt-4 space-y-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('contrato')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" style={{ color: corPrimaria }} />
              <span className="font-medium">Meu Contrato</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('veiculo')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5" style={{ color: corPrimaria }} />
              <span className="font-medium">Dados do Veículo</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('perfil')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" style={{ color: corPrimaria }} />
              <span className="font-medium">Meus Dados</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
        <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
          <span>Powered by</span>
          <span className="font-medium">Transmill</span>
        </div>
      </div>
    </div>
  );
};

export default PWAProtecaoFranquia;
