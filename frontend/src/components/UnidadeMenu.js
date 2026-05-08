import React, { useState } from 'react';
import { 
  LayoutGrid, 
  FileText, 
  Users, 
  UserCheck, 
  Briefcase, 
  Shield, 
  Handshake, 
  Car, 
  Truck, 
  AlertCircle, 
  DollarSign, 
  ChevronDown, 
  Package, 
  Store, 
  User,
  Warehouse,
  Wrench,
  List,
  Calendar,
  Bell,
  Gift,
  Smartphone
} from 'lucide-react';

const UnidadeMenu = ({ activeTab, setActiveTab, setMenuOpen, onOpenPWAModal }) => {
  const [showTabelaDropdown, setShowTabelaDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showFornecedorSubDropdown, setShowFornecedorSubDropdown] = useState(false);
  const [showRastreadoresDropdown, setShowRastreadoresDropdown] = useState(false);
  const [showTipoVeiculoDropdown, setShowTipoVeiculoDropdown] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);

  return (
    <>
      {/* 🔧 ORDEM CORRIGIDA CONFORME SOLICITADO */}
      
      {/* 1. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'dashboard'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <LayoutGrid size={20} />
        <span className="font-medium">Dashboard</span>
      </button>

      {/* 🔔 Enviar Notificações */}
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

      {/* 2. Tabela - Dropdown */}
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
              <AlertCircle size={16} />
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

      {/* 3. Planos Automáticos */}
      <button
        onClick={() => setActiveTab('planos-automaticos')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'planos-automaticos'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Shield size={20} />
        <span className="font-medium">Planos</span>
      </button>

      {/* 4. Vencimentos */}
      <button
        onClick={() => setActiveTab('vencimentos')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'vencimentos'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Calendar size={20} />
        <span className="font-medium">Vencimentos</span>
      </button>

      {/* 5. Nova Cotação */}
      <button
        onClick={() => setActiveTab('cotacao')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'cotacao'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <FileText size={20} />
        <span className="font-medium">Nova Cotação</span>
      </button>

      {/* 6. Pessoas - Dropdown (SEM Colaboradores e Unidades) */}
      <div className="py-2 user-dropdown-container">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
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
            {/* Regional */}
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
            
            {/* Consultor */}
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

            {/* Fornecedor - Sub-dropdown */}
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
              )}
            </div>
            
            {/* Rastreadores - Sub-dropdown */}
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

            {/* Tipo de Veículo - Sub-dropdown */}
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

      {/* 7. CRM - Dropdown */}
      <div>
        <button
          onClick={() => setShowCrmDropdown(!showCrmDropdown)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
            showCrmDropdown
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
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Users size={16} />
              Lead
            </button>
            <button
              onClick={() => { 
                setActiveTab('crm');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Package size={16} />
              Proteção
            </button>
          </div>
        )}
      </div>

      {/* 8. Clientes */}
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

      {/* 9. Cupons de Desconto */}
      <button
        onClick={() => setActiveTab('cupons')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'cupons'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Gift size={20} />
        <span className="font-medium">Cupons de Desconto</span>
      </button>

      {/* 10. PWA para Clientes */}
      <button
        onClick={() => {
          if (onOpenPWAModal) {
            onOpenPWAModal();
          }
          if (setMenuOpen) {
            setMenuOpen(false);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-white hover:bg-white/10"
        data-testid="menu-pwa-clientes"
      >
        <Smartphone size={20} />
        <span className="font-medium">PWA Clientes</span>
      </button>

      {/* 11. Solicitações */}
      <button
        onClick={() => window.location.href = '/labelview/solicitacoes'}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-white hover:bg-white/10"
      >
        <AlertCircle size={20} />
        <span className="font-medium">Solicitações</span>
      </button>
    </>
  );
};

export default UnidadeMenu;
