import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
// OLD DASHBOARDS - NO LONGER USED - KEPT FOR REFERENCE
// import ClientDashboard from './components/ClientDashboard';
// import MerchantDashboard from './components/MerchantDashboard';
// import ServiceProviderDashboard from './components/ServiceProviderDashboard';
import SacarPage from './components/pages/SacarPage';
import IndicarPage from './components/pages/IndicarPage';
import DocumentosPage from './components/pages/DocumentosPage';
import DocumentacaoPage from './components/DocumentacaoPage';
import MasterDashboard from './components/MasterDashboard';
// MasterLabelviewDashboard removido (feature descontinuada)
// Imports removidos: LabelviewLogin (feature descontinuada)
import MasterPage from './components/MasterPage';
// ChatbotTraining removido (feature descontinuada)
import MasterExtractPage from './components/MasterExtractPage';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import PromoLandingPage from './components/PromoLandingPage';
import ServiceProviderRegister from './components/ServiceProviderRegister';
import MinimalistHomePage from './components/MinimalistHomePage';
import HomePage from './pages/HomePage';
import MeusPedidosPage from './components/MeusPedidosPage';
import LojasPage from './components/LojasPage';
import PrestadoresPage from './components/PrestadoresPage';
import ProviderSchedule from './components/ProviderSchedule';
import UserProfile from './components/UserProfile';
import VendasPage from './components/VendasPage';
// InternetPlansPage removido (feature descontinuada)
// Imports removidos: ProtecaoVeicularPage (feature descontinuada)
import POSPage from './components/POSPage';
// Imports removidos: MinhasProtecoesPage (feature descontinuada)
// Imports removidos: ClientesLabelviewPage, MinhaProtecaoPage, MinhasSolicitacoesPage, SolicitacoesLabelviewPage (features descontinuadas)
// MinhaProtecaoPage removido (feature descontinuada)
// removido
// removido
// removido
// removido
// removido
import PaymentPage from './components/PaymentPage';
import ExtractPage from './components/ExtractPage';
import DepositoPage from './components/pages/DepositoPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import USDTPage from './components/pages/USDTPage';
import ExtratoPage from './components/pages/ExtratoPage';
// removido
import MerchantCatalogView from './components/MerchantCatalogView';
import MeuNegocio from './components/MeuNegocio';
import EquipePage from './components/EquipePage';
import MinimalistCheckout from './components/MinimalistCheckout';
import MinimalistMerchantOrders from './components/MinimalistMerchantOrders';
import OrderConfirmation from './components/OrderConfirmation';
// SocialFeed removido (feature descontinuada)
// removido
// removido
// removido
import PWAInstallPrompt from './components/PWAInstallPrompt';
import FranquiaPWAInstallPrompt from './components/FranquiaPWAInstallPrompt';
import CotacaoPublica from './components/CotacaoPublica';
import ContinuarContratacao from './components/ContinuarContratacao';
// MinhaProtecaoLabelview removido (feature descontinuada)
// removido
// removido

// Sistema de Franquias White Label
import FranquiasManager from './components/FranquiasManager';
import FranquiaLogin from './components/FranquiaLogin';
import FranquiaDashboard from './components/FranquiaDashboard';
import FranquiaRecuperarSenha from './components/FranquiaRecuperarSenha';
import FranquiaRegister from './components/FranquiaRegister';
// removido
import AdminFranquiasPanel from './components/AdminFranquiasPanel';
import FranquiaAdminPanel from './components/FranquiaAdminPanel';
import FranquiaMinimalistHome from './components/FranquiaMinimalistHome';
// removido
import CadastroFranquiaPage from './components/CadastroFranquiaPage';
import SuportePage from './components/SuportePage';

// PWA Unidade Labelview - App exclusivo para clientes de proteção veicular
// removido

// Mobility Module - Sistema de Mobilidade Urbana P2P
import MobilityHome from './components/mobility/MobilityHome';
import PassengerFlow from './components/mobility/PassengerFlow';
import DriverFlow from './components/mobility/DriverFlow';
import DriverRegister from './components/mobility/DriverRegister';

import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Crown, Shield, Loader2 } from 'lucide-react';

import { API_URL } from './config/api';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

console.log('🔧 Transmill API URL:', API);

// Backend URL configurado

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if user is master
const isMasterUser = (user) => {
  if (!user) return false;
  return user.user_type === 'master' || 
         user.is_master_account || 
         user.user_type === 'transmill_master' || 
         user.is_transmill_master;
};

// Componente específico para portal master
const MasterPortal = () => {
  const { user, login, API } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Redirecionamento automático removido - Master Transmill agora acessa via menu

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      
      if (response.data.access_token && response.data.user.is_master_account) {
        login(response.data.user, response.data.access_token);
        toast.success('Acesso master autorizado!');
        // Não precisa de navigate, será redirecionado automaticamente
      } else if (response.data.access_token) {
        toast.error('Acesso negado. Esta área é restrita a administradores.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Credenciais inválidas ou acesso não autorizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Portal Master
          </CardTitle>
          <CardDescription className="text-slate-300">
            Área restrita para administradores do sistema Transmill
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="master-email" className="text-slate-200">Email Administrativo</Label>
              <Input
                id="master-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@transmill.com"
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="master-password" className="text-slate-200">Senha Master</Label>
              <Input
                id="master-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••••"
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Verificando acesso...
                </>
              ) : (
                <>
                  <Shield className="mr-2" size={16} />
                  Acessar Sistema Master
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-xs text-slate-400 text-center">
              🔒 Área protegida • Apenas contas com privilégios administrativos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Verificar se é uma rota pública que não precisa de loading
  const isPublicRoute = () => {
    const path = window.location.pathname;
    return path.includes('/pwa-clientes') || 
           path.includes('/cotacao/') ||
           path.includes('/promo') ||
           path.includes('/documento_');
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Para rotas públicas, não mostrar loading
      if (isPublicRoute()) {
        setLoading(false);
        return;
      }
      
      if (token) {
        try {
          const response = await axios.get(`${API}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          
          // Verificar se precisa trocar senha (primeiro acesso)
          if (response.data.must_change_password) {
            setShowChangePasswordModal(true);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (userData, authToken, mustChangePassword = false) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    
    // Verificar se precisa trocar senha no primeiro acesso
    if (mustChangePassword || userData.must_change_password) {
      setShowChangePasswordModal(true);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Salvar também no localStorage para persistência
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    // Salvar o slug da franquia antes de limpar
    const franquiaSlug = user?.franquia_slug || localStorage.getItem('franquia_slug');
    
    setUser(null);
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para login da franquia ou login principal
    if (franquiaSlug) {
      window.location.href = `/franquia/${franquiaSlug}/login`;
    } else {
      window.location.href = '/login';
    }
  };

  const handlePasswordChanged = async () => {
    // Atualizar informações do usuário após trocar senha
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setShowChangePasswordModal(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#005B9C' }}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <img 
            src="/icon-192x192.png" 
            alt="Transmill" 
            className="w-16 h-16 animate-pulse"
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, token, login, logout, updateUser, API }}>
        <ThemeProvider>
          <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
          {/* Mobile viewport meta tag handled by React */}
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register-provider" 
              element={!user ? <ServiceProviderRegister /> : <Navigate to="/" />} 
            />
            <Route 
              path="/forgot-password" 
              element={!user ? <ForgotPassword /> : <Navigate to="/" />} 
            />
            <Route 
              path="/reset-password" 
              element={!user ? <ResetPassword /> : <Navigate to="/" />} 
            />
            {/* Rota Pública de Cotação - Acesso sem login */}
            <Route 
              path="/cotacao/:userId" 
              element={<CotacaoPublica />} 
            />
            {/* 🔧 Rota de Continuação da Contratação após aprovação da vistoria */}
            <Route 
              path="/continuar-contratacao/:slug" 
              element={<ContinuarContratacao />} 
            />
            {/* Promo Landing Page - Para Anúncios Patrocinados */}
            <Route 
              path="/promo" 
              element={<PromoLandingPage />} 
            />
            {/* Cadastro de Franquia - Página pública via link compartilhável */}
            <Route 
              path="/cadastro-franquia" 
              element={<CadastroFranquiaPage />} 
            />
            
            {/* Documentação Pública */}
            <Route 
              path="/documento_transmill" 
              element={<DocumentacaoPage />} 
            />
            
            {/* Homepage with Master Detection */}
            <Route 
              path="/" 
              element={
                user 
                  ? (user.user_type === 'master' && user.is_labelview_master)
                    ? <Navigate to="/admin/franquias" />
                    : <HomePage />
                  : <Navigate to="/login" />
              } 
            />
            
            {/* Rotas Específicas para Formulários */}
            <Route 
              path="/sacar" 
              element={
                user ? <SacarPage /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/indicar" 
              element={
                user ? <IndicarPage /> : <Navigate to="/login" />
              } 
            />
            {/* OLD DASHBOARDS - COMMENTED OUT - USE NEW MINIMALIST LAYOUT */}
            {/* All users now use MinimalistHomePage (/) */}
            {/* 
            <Route 
              path="/client-dashboard" 
              element={
                user && user.user_type === 'cliente' ? <ClientDashboard /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/merchant-dashboard" 
              element={
                user && user.user_type === 'lojista' ? <MerchantDashboard /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/service-provider-dashboard" 
              element={
                user && user.user_type === 'service_provider' ? <ServiceProviderDashboard user={user} onLogout={logout} /> : <Navigate to="/" />
              } 
            />
            */}
            
            {/* Master Dashboard - Principal para master */}
            <Route 
              path="/master" 
              element={
                user && (isMasterUser(user)) ? <MasterDashboard /> : <Navigate to="/" />
              } 
            />
            
            {/* Master Dashboard Completo - Funcionalidades internas */}
            <Route 
              path="/master-dashboard" 
              element={
                user && (isMasterUser(user)) ? <MasterDashboard /> : <Navigate to="/" />
              } 
            />

            {/* Rotas individuais para cada funcionalidade Master */}
            <Route 
              path="/visao-geral" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="overview" title="Visão Geral" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/usuarios" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="users" title="Gestão de Usuários" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/hierarquia" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="hierarchy" title="Hierarquia e Rede" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/segmentos" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="segments" title="Segmentos de Negócio" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/notificacoes" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="notifications" title="Notificações" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/transacoes" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="transactions" title="Transações" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/extrato-master" 
              element={
                user && isMasterUser(user) ? <MasterExtractPage /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/saque-master" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="withdrawal" title="Saque Master" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/comissoes" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="commissions" title="Comissões" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/subusuarios" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="subusers" title="Sub-usuários" /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/compliance" 
              element={
                user && isMasterUser(user) ? <MasterPage tab="docs" title="Compliance e Documentos" /> : <Navigate to="/" />
              } 
            />
            
            {/* Sistema de Franquias White Label */}
            <Route 
              path="/franquias" 
              element={
                user && (user.is_labelview_master || user.user_type === 'labelview_master') 
                  ? <FranquiasManager /> 
                  : <Navigate to="/" />
              } 
            />
            
            {/* Painel Admin de Franquias - Visão Geral da Plataforma */}
            <Route 
              path="/admin/franquias" 
              element={
                user && (user.is_labelview_master || user.user_type === 'labelview_master' || user.user_type === 'master') 
                  ? <AdminFranquiasPanel /> 
                  : <Navigate to="/" />
              } 
            />
            
            {/* Rotas dinâmicas de Franquia - Login e Dashboard */}
            <Route 
              path="/franquia/:slug/login" 
              element={<FranquiaLogin />} 
            />
            <Route 
              path="/franquia/:slug/recuperar-senha" 
              element={<FranquiaRecuperarSenha />} 
            />
            <Route 
              path="/franquia/:slug/cadastro" 
              element={<FranquiaRegister />} 
            />
            <Route 
              path="/franquia/:slug/dashboard" 
              element={<FranquiaDashboard />} 
            />
            <Route 
              path="/franquia/:slug/admin" 
              element={<FranquiaAdminPanel />} 
            />
            <Route 
              path="/franquia/:slug/home" 
              element={<FranquiaMinimalistHome />} 
            />
            <Route 
              path="/franquia/:slug" 
              element={<FranquiaLogin />} 
            />
            
            {/* Official Master Portal */}
            <Route 
              path="/master-portal" 
              element={<MasterPortal />}
            />
            
            {/* Direct Master Access Route - temporarily accessible to any logged user */}
            <Route 
              path="/admin" 
              element={
                user ? <MasterDashboard /> : <Navigate to="/login" />
              } 
            />
            
            {/* New Service Pages */}
            <Route 
              path="/lojas" 
              element={user ? <LojasPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/suporte" 
              element={user ? <SuportePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/prestadores" 
              element={user ? <PrestadoresPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/provider-schedule" 
              element={user ? <ProviderSchedule /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <UserProfile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/vendas" 
              element={user ? <VendasPage /> : <Navigate to="/login" />} 
            />
            {/* Rotas da carteira removidas - usar rotas existentes */}
            <Route 
              path="/pos" 
              element={user ? <POSPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/payment" 
              element={user ? <PaymentPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/extrato" 
              element={user ? <ExtractPage /> : <Navigate to="/login" />} 
            />
            
            {/* Functional Pages with dedicated URLs */}
            <Route 
              path="/deposito" 
              element={user ? <DepositoPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/usdt" 
              element={user ? <USDTPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/extrato" 
              element={user ? <ExtratoPage /> : <Navigate to="/login" />} 
            />
            
            {/* Meu Negócio - Lojista */}
            <Route 
              path="/meu-negocio" 
              element={user && user.user_type === 'lojista' ? <MeuNegocio /> : <Navigate to="/" />} 
            />
            
            {/* Meu Negócio - Master acessando loja (modo suporte) */}
            <Route 
              path="/meu-negocio/:merchantId" 
              element={user && user.user_type === 'master' ? <MeuNegocio /> : <Navigate to="/" />} 
            />
            
            {/* Equipe - Apenas para lojistas */}
            <Route 
              path="/equipe" 
              element={user && user.user_type === 'lojista' ? <EquipePage /> : <Navigate to="/" />} 
            />
            
            {/* Meus Pedidos - Apenas para clientes */}
            <Route 
              path="/meus-pedidos" 
              element={user && user.user_type === 'cliente' ? <MeusPedidosPage /> : <Navigate to="/login" />} 
            />
            
            {/* ========== MOBILITY MODULE - Mobilidade Urbana P2P ========== */}
            <Route 
              path="/mobility" 
              element={user ? <MobilityHome /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/passenger" 
              element={user ? <PassengerFlow /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/driver" 
              element={user ? <DriverFlow /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/driver/register" 
              element={user ? <DriverRegister /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/driver/profile" 
              element={user ? <DriverRegister /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/ride/:rideId" 
              element={user ? <PassengerFlow /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mobility/driver/ride/:rideId" 
              element={user ? <DriverFlow /> : <Navigate to="/login" />} 
            />
            
            {/* Catalog Routes - PÚBLICO (sem autenticação) */}
            <Route 
              path="/catalog/:merchantId" 
              element={<MerchantCatalogView />} 
            />
            {/* Catalog por Slug (URL amigável) - PÚBLICO */}
            <Route 
              path="/:storeSlug" 
              element={<MerchantCatalogView />} 
            />
            <Route 
              path="/checkout" 
              element={user ? <MinimalistCheckout /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/pedidos-lojista" 
              element={user && user.user_type === 'lojista' ? <MinimalistMerchantOrders /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/order-confirmation" 
              element={user ? <OrderConfirmation /> : <Navigate to="/login" />} 
            />

            {/* Legacy redirect for backward compatibility - REDIRECT TO NEW LAYOUT */}
            <Route 
              path="/dashboard" 
              element={user ? <Navigate to="/" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/client-dashboard" 
              element={user ? <Navigate to="/" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/merchant-dashboard" 
              element={user ? <Navigate to="/" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/service-provider-dashboard" 
              element={user ? <Navigate to="/" /> : <Navigate to="/login" />} 
            />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                style: {
                  border: '1px solid #10b981',
                  color: '#065f46',
                },
              },
              error: {
                style: {
                  border: '1px solid #ef4444',
                  color: '#991b1b',
                },
              },
            }}
          />
        </div>
        </BrowserRouter>
        
        {/* Modal de Troca de Senha Obrigatória - Primeiro Acesso */}
        {user && showChangePasswordModal && (
          <ChangePasswordModal
            isOpen={showChangePasswordModal}
            onClose={() => {}} // Não pode fechar - obrigatório
            onSuccess={handlePasswordChanged}
          />
        )}
        
        <PWAInstallPrompt />
        <FranquiaPWAInstallPrompt />
        </ThemeProvider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    ⚠️  IMPORTANTE - VERSIONAMENTO ⚠️                          ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║  Ao atualizar a versão, TODOS os arquivos abaixo devem ser atualizados:     ║
// ║                                                                              ║
// ║  1. /app/frontend/src/App.js - FRONTEND_VERSION (abaixo) e BUILD log        ║
// ║  2. /app/backend/server.py - FastAPI version + endpoints /api/health        ║
// ║  3. /app/VERSION.txt - CRÍTICO! Usado por /api/labelview/version-check      ║
// ║                                                                              ║
// ║  Se VERSION.txt não for atualizado, aparecerá no console:                   ║
// ║  "⚠️ Versões diferentes! Backend: vX.X.X, Frontend: vY.Y.Y"                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const FRONTEND_VERSION = 'v2.38.50';

console.log('🔥 APP ATUALIZADO - Build timestamp:', new Date().toISOString());
console.log(`✅ VERSÃO FRONTEND: ${FRONTEND_VERSION} - Refatoração Completa`);
console.log('🚀 BUILD v2.38.50 - 19 Routers Modulares - ', new Date().getTime());
console.log('🔧 Build ID: 20260223-1715');

// Verificar versão do backend e limpar cache se necessário
setTimeout(() => {
  fetch('/api/version')
    .then(r => r.json())
    .then(data => {
      // Suporta tanto 'version' quanto 'versao' para compatibilidade
      const rawVersion = data.version || data.versao;
      const backendVersion = rawVersion ? (rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`) : 'desconhecida';
      console.log(`📊 Versão Backend: ${backendVersion}`);
      console.log(`📊 Versão Frontend: ${FRONTEND_VERSION}`);
      
      // Se as versões forem muito diferentes, sugerir reload
      if (backendVersion !== 'desconhecida' && FRONTEND_VERSION && backendVersion !== FRONTEND_VERSION) {
        console.warn(`⚠️  Versões diferentes! Backend: ${backendVersion}, Frontend: ${FRONTEND_VERSION}`);
        
        // Limpar cache do service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              registration.update();
            });
          });
        }
      } else if (backendVersion !== 'desconhecida') {
        console.log('✅ Versões sincronizadas!');
      }
    })
    .catch(err => console.log('Info: Versão check não disponível'));
}, 2000);

export default App;
