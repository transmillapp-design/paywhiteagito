import React, { useState } from 'react';
import { 
  UserCheck, 
  Package, 
  AlertCircle,
  Radio
} from 'lucide-react';

const FornecedorMenu = ({ activeTab, setActiveTab, user }) => {
  // Verificar se o fornecedor é de rastreador
  const isRastreador = user.tipo_servico_id && (
    user.tipo_servico_nome?.toLowerCase().includes('rastreador') ||
    user.tipo_servico_nome?.toLowerCase().includes('rastreamento')
  );

  console.log('🔍 [DEBUG FORNECEDOR MENU] Tipo de serviço:', user.tipo_servico_nome);
  console.log('🔍 [DEBUG FORNECEDOR MENU] É rastreador?', isRastreador);

  return (
    <>
      {/* Clientes da Rede */}
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

      {/* 🔧 CONDICIONAL: Rastreadores (apenas se fornecedor for de rastreamento) */}
      {isRastreador && (
        <>
          {/* Rastreadores */}
          <button
            onClick={() => setActiveTab('rastreadores')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'rastreadores'
                ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Radio size={20} />
            <span className="font-medium">Rastreadores</span>
          </button>

          {/* Técnicos */}
          <button
            onClick={() => setActiveTab('tecnicos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'tecnicos'
                ? 'text-white border-l-4 border-[#2fa31c] bg-white/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Package size={20} />
            <span className="font-medium">Técnicos</span>
          </button>
        </>
      )}

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

export default FornecedorMenu;
