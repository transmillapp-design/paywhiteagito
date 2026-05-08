import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import axios from 'axios';
import { 
  User, 
  Car, 
  FileText, 
  Camera, 
  FileSignature, 
  DollarSign, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import VistoriaAprovacaoMaster from './VistoriaAprovacaoMaster';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ClientesLabelview = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showVistoriaModal, setShowVistoriaModal] = useState(false);
  const [clienteVistoria, setClienteVistoria] = useState(null);
  
  // Estados para filtros hierárquicos
  const [user, setUser] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('todos'); // todos, proprios, por_regional, por_consultor, por_unidade
  const [unidades, setUnidades] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [filtroUnidadeId, setFiltroUnidadeId] = useState('');
  const [filtroRegionalId, setFiltroRegionalId] = useState('');
  const [filtroConsultorId, setFiltroConsultorId] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchClientes();
      fetchHierarquia();
    }
  }, [user, filtroAtivo, filtroUnidadeId, filtroRegionalId, filtroConsultorId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchHierarquia = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Master vê todas as unidades
      if (user?.is_labelview_master) {
        const unidadesRes = await axios.get(`${API}/labelview/unidades`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (unidadesRes.data.success) {
          setUnidades(unidadesRes.data.unidades);
        }
      }
      
      // Unidade vê seus regionais
      if (user?.user_type === 'labelview_unidade') {
        const regionaisRes = await axios.get(`${API}/labelview/regionais`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (regionaisRes.data.success) {
          setRegionais(regionaisRes.data.regionais);
        }
        
        const consultoresRes = await axios.get(`${API}/labelview/consultores`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (consultoresRes.data.success) {
          setConsultores(consultoresRes.data.consultores);
        }
      }
      
      // Regional vê seus consultores
      if (user?.user_type === 'labelview_regional') {
        const consultoresRes = await axios.get(`${API}/labelview/consultores`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (consultoresRes.data.success) {
          setConsultores(consultoresRes.data.consultores);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar hierarquia:', error);
    }
  };

  const fetchClientes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar endpoint /clientes que busca de labelview_clientes
      const response = await axios.get(`${API}/labelview/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setClientes(response.data.clientes);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pago': return 'text-green-600 bg-green-100';
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'atrasado': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2fa31c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  const renderFiltros = () => {
    if (!user) return null;
    
    // Consultor não precisa de filtros (só vê próprios)
    if (user.user_type === 'labelview_consultor') {
      return null;
    }
    
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
        <h3 className="font-semibold text-gray-700 mb-3">Filtrar Clientes</h3>
        
        {/* Master: Filtrar por Unidade */}
        {user.is_labelview_master && (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'todos'}
                onChange={() => {
                  setFiltroAtivo('todos');
                  setFiltroUnidadeId('');
                }}
                className="text-[#2fa31c]"
              />
              <span>Todos os clientes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'por_unidade'}
                onChange={() => setFiltroAtivo('por_unidade')}
                className="text-[#2fa31c]"
              />
              <span>Por Unidade:</span>
            </label>
            {filtroAtivo === 'por_unidade' && (
              <select
                value={filtroUnidadeId}
                onChange={(e) => setFiltroUnidadeId(e.target.value)}
                className="ml-6 w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma unidade...</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome_fantasia || u.full_name}</option>
                ))}
              </select>
            )}
          </div>
        )}
        
        {/* Unidade: Todos, Indicado (próprios), Regional, Consultor */}
        {user.user_type === 'labelview_unidade' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'todos'}
                onChange={() => {
                  setFiltroAtivo('todos');
                  setFiltroRegionalId('');
                  setFiltroConsultorId('');
                }}
                className="text-[#2fa31c]"
              />
              <span>Todos os clientes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'proprios'}
                onChange={() => {
                  setFiltroAtivo('proprios');
                  setFiltroRegionalId('');
                  setFiltroConsultorId('');
                }}
                className="text-[#2fa31c]"
              />
              <span>Indicado (clientes diretos da unidade)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'por_regional'}
                onChange={() => setFiltroAtivo('por_regional')}
                className="text-[#2fa31c]"
              />
              <span>Regional:</span>
            </label>
            {filtroAtivo === 'por_regional' && (
              <select
                value={filtroRegionalId}
                onChange={(e) => setFiltroRegionalId(e.target.value)}
                className="ml-6 w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma regional...</option>
                {regionais.map(r => (
                  <option key={r.id} value={r.id}>{r.nome || r.full_name}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'por_consultor'}
                onChange={() => setFiltroAtivo('por_consultor')}
                className="text-[#2fa31c]"
              />
              <span>Consultor:</span>
            </label>
            {filtroAtivo === 'por_consultor' && (
              <select
                value={filtroConsultorId}
                onChange={(e) => setFiltroConsultorId(e.target.value)}
                className="ml-6 w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione um consultor...</option>
                {consultores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome || c.full_name}</option>
                ))}
              </select>
            )}
          </div>
        )}
        
        {/* Regional: Todos, Indicado (próprios), Consultor */}
        {user.user_type === 'labelview_regional' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'todos'}
                onChange={() => {
                  setFiltroAtivo('todos');
                  setFiltroConsultorId('');
                }}
                className="text-[#2fa31c]"
              />
              <span>Todos os clientes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'proprios'}
                onChange={() => {
                  setFiltroAtivo('proprios');
                  setFiltroConsultorId('');
                }}
                className="text-[#2fa31c]"
              />
              <span>Indicado (clientes diretos da regional)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filtro"
                checked={filtroAtivo === 'por_consultor'}
                onChange={() => setFiltroAtivo('por_consultor')}
                className="text-[#2fa31c]"
              />
              <span>Consultor:</span>
            </label>
            {filtroAtivo === 'por_consultor' && (
              <select
                value={filtroConsultorId}
                onChange={(e) => setFiltroConsultorId(e.target.value)}
                className="ml-6 w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione um consultor...</option>
                {consultores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome || c.full_name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!clienteSelecionado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Clientes Labelview ({clientes.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFiltros()}
          
          {clientes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => setClienteSelecionado(cliente)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#2fa31c] hover:bg-green-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#1a59ad] rounded-full flex items-center justify-center text-white font-bold">
                        {cliente.nome?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-[#1a59ad]">{cliente.nome}</h3>
                        <p className="text-sm text-gray-600">{cliente.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Plano</p>
                        <p className="font-semibold text-[#2fa31c]">{cliente.plano_nome || 'N/A'}</p>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Visualização detalhada do cliente
  return (
    <div className="space-y-4">
      {/* Botão Voltar */}
      <button
        onClick={() => setClienteSelecionado(null)}
        className="flex items-center gap-2 text-[#1a59ad] hover:text-[#2fa31c] font-semibold"
      >
        <ChevronRight className="rotate-180" size={20} />
        Voltar para lista de clientes
      </button>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('cliente')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="text-[#1a59ad]" />
              <span>Dados do Cliente</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.cliente ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.cliente && (
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Nome Completo</label>
              <p className="text-lg">{clienteSelecionado.nome}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <p className="text-lg">{clienteSelecionado.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Telefone</label>
              <p className="text-lg">{clienteSelecionado.telefone || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">CPF</label>
              <p className="text-lg">{clienteSelecionado.cpf || 'Não informado'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Endereço</label>
              <p className="text-lg">{clienteSelecionado.endereco || 'Não informado'}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dados do Veículo */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('veiculo')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="text-[#1a59ad]" />
              <span>Dados do Veículo</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.veiculo ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.veiculo && (
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Marca/Modelo</label>
              <p className="text-lg">{clienteSelecionado.veiculo_modelo || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Ano</label>
              <p className="text-lg">{clienteSelecionado.veiculo_ano || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Placa</label>
              <p className="text-lg font-mono">{clienteSelecionado.veiculo_placa || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Chassi</label>
              <p className="text-lg font-mono text-sm">{clienteSelecionado.veiculo_chassi || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Cor</label>
              <p className="text-lg">{clienteSelecionado.veiculo_cor || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Valor FIPE</label>
              <p className="text-lg text-[#2fa31c] font-semibold">
                {clienteSelecionado.veiculo_valor_fipe ? 
                  `R$ ${parseFloat(clienteSelecionado.veiculo_valor_fipe).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` 
                  : 'Não informado'}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Plano Contratado */}
      <Card className="border-2 border-yellow-300">
        <CardHeader 
          className="cursor-pointer hover:bg-yellow-50 bg-yellow-50"
          onClick={() => toggleSection('plano')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-yellow-700" />
              <span className="text-yellow-800">📦 Plano Contratado</span>
            </div>
            <ChevronDown 
              className={`transition-transform text-yellow-700 ${expandedSections.plano ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.plano && (
          <CardContent className="bg-yellow-50/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Nome do Plano */}
              <div className="bg-white p-3 rounded-lg border col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Plano</label>
                <p className="text-2xl font-bold text-[#1a59ad]">{clienteSelecionado.plano_nome || 'Não contratado'}</p>
              </div>
              
              {/* Taxa de Adesão */}
              <div className="bg-white p-3 rounded-lg border">
                <label className="text-xs font-semibold text-gray-500 uppercase">Taxa de Adesão</label>
                <p className="text-xl font-bold text-green-600">
                  R$ {Number(clienteSelecionado.taxa_adesao || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
              
              {/* Parcelas */}
              <div className="bg-white p-3 rounded-lg border">
                <label className="text-xs font-semibold text-gray-500 uppercase">Parcelas</label>
                <p className="text-xl font-bold text-gray-800">12x</p>
              </div>
              
              {/* Valor da Parcela */}
              <div className="bg-gradient-to-r from-green-100 to-green-200 p-3 rounded-lg border-2 border-green-300 col-span-2">
                <label className="text-xs font-semibold text-green-700 uppercase">Valor da Parcela Mensal</label>
                <p className="text-3xl font-bold text-[#2fa31c]">
                  R$ {Number(clienteSelecionado.plano_valor || clienteSelecionado.valor_mensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
            </div>
            
            {/* Adicionais */}
            {clienteSelecionado.adicionais && (
              (Array.isArray(clienteSelecionado.adicionais) && clienteSelecionado.adicionais.length > 0) ||
              (typeof clienteSelecionado.adicionais === 'object' && Object.keys(clienteSelecionado.adicionais).filter(k => clienteSelecionado.adicionais[k]).length > 0)
            ) && (
              <div className="bg-white p-3 rounded-lg border mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">➕ Coberturas Adicionais</label>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(clienteSelecionado.adicionais) ? (
                    clienteSelecionado.adicionais.map((adicional, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {adicional}
                      </span>
                    ))
                  ) : (
                    <>
                      {clienteSelecionado.adicionais.carro_reserva && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🚗 Carro Reserva</span>}
                      {clienteSelecionado.adicionais.assistencia_24h && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">🚑 Assistência 24h</span>}
                      {clienteSelecionado.adicionais.vidros && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🪟 Vidros</span>}
                      {clienteSelecionado.adicionais.terceiros && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">🛡️ Terceiros</span>}
                      {clienteSelecionado.adicionais.colisao && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">💥 Colisão</span>}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Vencimento */}
            {clienteSelecionado.data_vencimento && (
              <div className="bg-white p-3 rounded-lg border">
                <label className="text-xs font-semibold text-gray-500 uppercase">Dia de Vencimento</label>
                <p className="text-lg font-bold text-gray-800">Todo dia {clienteSelecionado.data_vencimento}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Vistoria */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('vistoria')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="text-[#1a59ad]" />
              <span>Vistoria ({clienteSelecionado.total_fotos_vistoria || 0} fotos)</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.vistoria ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.vistoria && (
          <CardContent>
            {/* Usar vistoria_imagens (array) ou fotos_vistoria (objeto) */}
            {(clienteSelecionado.vistoria_imagens && clienteSelecionado.vistoria_imagens.length > 0) ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {clienteSelecionado.vistoria_imagens.map((imagem, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imagem.url} 
                      alt={imagem.nome || `Foto ${index + 1}`}
                      className="w-full h-28 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#2fa31c]"
                      onClick={() => window.open(imagem.url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button 
                        onClick={() => window.open(imagem.url, '_blank')}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                      >
                        <Eye size={18} className="text-gray-700" />
                      </button>
                    </div>
                    <p className="text-xs text-center text-gray-600 mt-1 truncate">{imagem.nome}</p>
                    <span className={`absolute top-1 right-1 text-xs px-1 rounded ${imagem.tipo === 'documento' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                      {imagem.tipo === 'documento' ? '📄' : '🚗'}
                    </span>
                  </div>
                ))}
              </div>
            ) : clienteSelecionado.fotos_vistoria && Object.keys(clienteSelecionado.fotos_vistoria).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Object.entries(clienteSelecionado.fotos_vistoria).map(([key, url], index) => (
                  url && (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={key}
                        className="w-full h-28 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#2fa31c]"
                        onClick={() => window.open(url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button 
                          onClick={() => window.open(url, '_blank')}
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                        >
                          <Eye size={18} className="text-gray-700" />
                        </button>
                      </div>
                      <p className="text-xs text-center text-gray-600 mt-1 truncate capitalize">{key.replace(/_/g, ' ')}</p>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Vistoria não realizada</p>
            )}
            {clienteSelecionado.vistoria_status && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      clienteSelecionado.vistoria_status === 'aprovada' ? 'bg-green-100 text-green-800' :
                      clienteSelecionado.vistoria_status === 'pendente' || clienteSelecionado.vistoria_status === 'aguardando_aprovacao' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {clienteSelecionado.vistoria_status === 'aguardando_aprovacao' ? '⏳ Aguardando Aprovação' : clienteSelecionado.vistoria_status}
                    </span>
                  </div>
                  {clienteSelecionado.vistoria_status !== 'aprovada' && (
                    <Button
                      onClick={() => {
                        setClienteVistoria({
                          id: clienteSelecionado.id,
                          nome: clienteSelecionado.nome
                        });
                        setShowVistoriaModal(true);
                      }}
                      className="bg-[#2fa31c] hover:bg-[#25881a]"
                    >
                      <Camera size={16} className="mr-2" />
                      Analisar Vistoria
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Contrato e Assinatura */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('contrato')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="text-[#1a59ad]" />
              <span>Contrato e Assinatura</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.contrato ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.contrato && (
          <CardContent>
            {clienteSelecionado.contrato ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Contrato #{clienteSelecionado.contrato.numero}</p>
                    <p className="text-sm text-gray-600">Assinado em: {clienteSelecionado.contrato.data_assinatura}</p>
                  </div>
                  <button className="px-4 py-2 bg-[#1a59ad] text-white rounded-lg hover:bg-[#2fa31c] transition-colors flex items-center gap-2">
                    <Download size={16} />
                    Baixar
                  </button>
                </div>
                {clienteSelecionado.contrato.assinatura_url && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Assinatura Digital</label>
                    <img 
                      src={clienteSelecionado.contrato.assinatura_url} 
                      alt="Assinatura"
                      className="border-2 border-gray-300 rounded-lg p-4 bg-white max-w-xs"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Contrato não gerado</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('financeiro')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="text-[#1a59ad]" />
              <span>Financeiro</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.financeiro ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.financeiro && (
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Dia de Vencimento</p>
              <p className="text-2xl font-bold text-[#1a59ad]">Dia {clienteSelecionado.dia_vencimento || '10'}</p>
            </div>
            
            {clienteSelecionado.pagamentos && clienteSelecionado.pagamentos.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-semibold mb-2">Histórico de Pagamentos</h4>
                {clienteSelecionado.pagamentos.map((pagamento, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {pagamento.status === 'pago' ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : pagamento.status === 'pendente' ? (
                        <Clock className="text-yellow-600" size={24} />
                      ) : (
                        <XCircle className="text-red-600" size={24} />
                      )}
                      <div>
                        <p className="font-semibold">{pagamento.mes_referencia}</p>
                        <p className="text-sm text-gray-600">Vencimento: {pagamento.data_vencimento}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ {parseFloat(pagamento.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(pagamento.status)}`}>
                        {pagamento.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum pagamento registrado</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Solicitações de Serviço */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('solicitacoes')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-[#1a59ad]" />
              <span>Solicitações de Serviço</span>
            </div>
            <ChevronDown 
              className={`transition-transform ${expandedSections.solicitacoes ? 'rotate-180' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.solicitacoes && (
          <CardContent>
            {clienteSelecionado.solicitacoes && clienteSelecionado.solicitacoes.length > 0 ? (
              <div className="space-y-3">
                {clienteSelecionado.solicitacoes.map((solicitacao, index) => (
                  <div 
                    key={index}
                    className="p-4 border-2 rounded-lg hover:border-[#2fa31c] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{solicitacao.tipo}</h4>
                        <p className="text-sm text-gray-600">{solicitacao.data}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        solicitacao.status === 'concluido' ? 'bg-green-100 text-green-800' :
                        solicitacao.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {solicitacao.status}
                      </span>
                    </div>
                    <p className="text-gray-700">{solicitacao.descricao}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma solicitação registrada</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de Aprovação de Vistoria */}
      {showVistoriaModal && clienteVistoria && (
        <VistoriaAprovacaoMaster
          clienteId={clienteVistoria.id}
          clienteNome={clienteVistoria.nome}
          onClose={() => {
            setShowVistoriaModal(false);
            setClienteVistoria(null);
          }}
          onAprovacaoCompleta={() => {
            toast.success('Vistoria aprovada com sucesso!');
            fetchClientes(); // Recarregar lista
            setShowVistoriaModal(false);
            setClienteVistoria(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientesLabelview;
