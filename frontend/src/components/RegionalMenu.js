import React, { useState } from 'react';
import { 
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
  User,
  Warehouse,
  List,
  LayoutGrid,
  Bell
} from 'lucide-react';

const RegionalMenu = ({ activeTab, setActiveTab }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showFornecedorSubDropdown, setShowFornecedorSubDropdown] = useState(false);
  const [showTipoVeiculoDropdown, setShowTipoVeiculoDropdown] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);

  return (
    <>
      {/* Dashboard */}
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

      {/* Nova Cotação */}
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

      {/* Minha Rede de Indicados */}
      <button
        onClick={() => setActiveTab('minha-rede')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'minha-rede'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Users size={20} />
        <span className="font-medium">Minha Rede</span>
      </button>

      {/* Pessoas - Dropdown (SEM Colaboradores, Unidade, Regional e Rastreadores) */}
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

            {/* 🔧 CORREÇÃO: Regional NÃO cadastra Tipo de Fornecedor, Rastreadores ou Tipo de Veículos */}
            {/* Essas opções foram removidas conforme solicitado */}
          </div>
        )}
      </div>

      {/* CRM - Dropdown */}
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

      {/* Clientes */}
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

      {/* 🎁 Cupons de Desconto */}
      <button
        onClick={() => setActiveTab('cupons')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'cupons'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Package size={20} />
        <span className="font-medium">Cupons de Desconto</span>
      </button>

      {/* Solicitações */}
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

export default RegionalMenu;
