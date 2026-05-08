import React, { useState } from 'react';
import { LayoutGrid, FileText, Users, UserCheck, Briefcase, ChevronDown, Package, Bell } from 'lucide-react';

const ConsultorMenu = ({ activeTab, setActiveTab, crmView, setCrmView, setMenuOpen }) => {
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Fechar menu em mobile
    if (setMenuOpen && window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };

  return (
    <>
      {/* Dashboard */}
      <button
        onClick={() => handleTabChange('dashboard')}
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
        onClick={() => handleTabChange('notificacoes')}
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
        onClick={() => handleTabChange('cotacao')}
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
        onClick={() => handleTabChange('minha-rede')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          activeTab === 'minha-rede'
            ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
            : 'text-white hover:bg-white/10'
        }`}
      >
        <Users size={20} />
        <span className="font-medium">Minha Rede</span>
      </button>

      {/* CRM - Dropdown com Lead e Proteção */}
      <div>
        <button
          onClick={() => setShowCrmDropdown(!showCrmDropdown)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
            showCrmDropdown || activeTab === 'crm'
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
                if (setCrmView) setCrmView('leads');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                crmView === 'leads' 
                  ? 'bg-white/20 text-white font-medium' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Users size={16} />
              Lead
            </button>
            <button
              onClick={() => { 
                setActiveTab('crm'); 
                if (setCrmView) setCrmView('protecao');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                crmView === 'protecao' 
                  ? 'bg-white/20 text-white font-medium' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Package size={16} />
              Proteção
            </button>
          </div>
        )}
      </div>

      {/* Clientes */}
      <button
        onClick={() => handleTabChange('clientes')}
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
        onClick={() => handleTabChange('cupons')}
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
        <Users size={20} />
        <span className="font-medium">Solicitações</span>
      </button>
    </>
  );
};

export default ConsultorMenu;
