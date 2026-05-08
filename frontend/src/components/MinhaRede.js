import React, { useState, useEffect } from 'react';
import { Users, User, Building2, Network, TrendingUp, DollarSign, Copy, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config/api';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const MinhaRede = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [indicados, setIndicados] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    regionais: 0,
    consultores: 0,
    clientes: 0,
    diretos: 0,
    indiretos: 0
  });

  useEffect(() => {
    carregarRede();
  }, []);

  const carregarRede = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API}/minha-rede`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIndicados(response.data.indicados || []);
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.error('Erro ao carregar rede:', error);
      toast.error('Erro ao carregar rede de indicados');
    } finally {
      setLoading(false);
    }
  };

  const copiarLinkIndicacao = () => {
    const link = user.referral_link || `https://app.transmill.com.br/register?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de indicação copiado!');
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(user.referral_code || '');
    toast.success('Código de indicação copiado!');
  };

  const getTipoLabel = (userType) => {
    const tipos = {
      'labelview_regional': '👥 Regional',
      'labelview_consultor': '👤 Consultor',
      'cliente': '🛡️ Cliente'
    };
    return tipos[userType] || userType;
  };

  const getTipoIcon = (userType) => {
    if (userType === 'labelview_regional') return <Building2 size={20} className="text-blue-600" />;
    if (userType === 'labelview_consultor') return <User size={20} className="text-green-600" />;
    if (userType === 'cliente') return <User size={20} className="text-purple-600" />;
    return <User size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🌐 Minha Rede de Indicados</h2>
            <p className="text-white/90">Acompanhe todos os usuários que você indicou ou cadastrou</p>
          </div>
          <Network size={48} className="text-white/30" />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Indicados</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Users size={32} className="text-blue-500" />
          </div>
        </div>

        {user.user_type === 'labelview_unidade' && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Regionais</p>
                <p className="text-3xl font-bold text-gray-800">{stats.regionais || 0}</p>
              </div>
              <Building2 size={32} className="text-green-500" />
            </div>
          </div>
        )}

        {/* 🔧 CORREÇÃO: Consultores aparece apenas para Unidade e Regional (não para Consultor) */}
        {user.user_type !== 'labelview_consultor' && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Consultores</p>
                <p className="text-3xl font-bold text-gray-800">{stats.consultores || 0}</p>
              </div>
              <User size={32} className="text-purple-500" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clientes</p>
              <p className="text-3xl font-bold text-gray-800">{stats.clientes || 0}</p>
            </div>
            <User size={32} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Link de Indicação */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
          <Copy size={20} />
          Seu Link de Indicação
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Código de Referência:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user.referral_code || 'Gerando...'}
                readOnly
                className="flex-1 px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg font-mono font-bold text-lg"
              />
              <button
                onClick={copiarCodigo}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Link Completo:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user.referral_link || `https://app.transmill.com.br/register?ref=${user.referral_code}`}
                readOnly
                className="flex-1 px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg text-sm"
              />
              <button
                onClick={copiarLinkIndicacao}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Indicados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={24} />
            {/* 🔧 CORREÇÃO: Contador ajustado - consultor conta apenas clientes */}
            {user.user_type === 'labelview_consultor' 
              ? `Seus Clientes (${indicados.filter(i => i.user_type === 'cliente' || i.user_type === 'client').length})`
              : `Seus Indicados (${indicados.length})`
            }
          </h3>
        </div>

        {indicados.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Você ainda não possui indicados na sua rede</p>
            <p className="text-gray-400 text-sm mt-2">Compartilhe seu link de indicação para começar a construir sua rede!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Data Cadastro</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 🔧 CORREÇÃO: Consultor vê apenas clientes, não outros consultores */}
                {indicados
                  .filter(indicado => {
                    // Se for consultor, mostrar apenas clientes
                    if (user.user_type === 'labelview_consultor') {
                      return indicado.user_type === 'cliente' || indicado.user_type === 'client';
                    }
                    // Para outros tipos (unidade, regional, master), mostrar todos
                    return true;
                  })
                  .map((indicado, index) => (
                  <tr key={indicado.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(indicado.user_type)}
                        <span className="text-sm font-medium">{getTipoLabel(indicado.user_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{indicado.full_name || indicado.nome_fantasia}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{indicado.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{indicado.cpf || indicado.cnpj || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {indicado.created_at ? new Date(indicado.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        indicado.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {indicado.is_active ? '✅ Ativo' : '❌ Inativo'}
                      </span>
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

export default MinhaRede;
