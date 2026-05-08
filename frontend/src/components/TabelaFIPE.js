import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Search, Filter, Upload, X, ChevronDown, RefreshCw, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';
import VeiculoFipeModal from './VeiculoFipeModal';

const TabelaFIPE = () => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState([]);
  const [filteredVeiculos, setFilteredVeiculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedVeiculos, setSelectedVeiculos] = useState([]);
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [editVeiculo, setEditVeiculo] = useState(null);
  
  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    carros: { total: 0, ultimaAtualizacao: new Date().toLocaleString('pt-BR') },
    motos: { total: 0, ultimaAtualizacao: new Date().toLocaleString('pt-BR') },
    caminhoes: { total: 0, ultimaAtualizacao: new Date().toLocaleString('pt-BR') }
  });

  useEffect(() => {
    loadFIPEData();
  }, []);

  useEffect(() => {
    filterVeiculos();
  }, [veiculos, searchTerm, tipoFiltro, subcategoriaFiltro]);

  const loadFIPEData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Token não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }
      
      console.log('Carregando dados FIPE de:', `${API}/labelview/fipe/veiculos`);
      
      // Buscar veículos reais da API FIPE via backend
      const response = await axios.get(`${API}/labelview/fipe/veiculos?limit=50000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 segundos timeout
      });
      
      console.log('Resposta da API FIPE:', response.data);
      
      if (response.data.success && response.data.veiculos) {
        const veiculosData = response.data.veiculos.map((v, index) => {
          // Limpar valor
          let valorLimpo = '0';
          if (v.valor) {
            valorLimpo = v.valor
              .replace('R$', '')
              .replace(/\s/g, '')
              .replace('.', '')
              .replace(',', '.');
          }
          
          return {
            id: `fipe-${index}`,
            codigoFipe: v.codigoFipe || 'N/A',
            tipo: v.tipo || 'Carro', // Usar o tipo que vem do banco diretamente
            marca: v.marca || 'N/A',
            modelo: v.modelo || 'N/A',
            ano: v.ano || 'N/A',
            combustivel: v.combustivel || 'N/A',
            valor: valorLimpo,
            mesReferencia: v.mesReferencia || 'N/A',
            participacaoMin: '',
            participacaoMax: '',
            categoria: 'Nacional',
            vinculado: false
          };
        });
        
        setVeiculos(veiculosData);
        
        // Calcular stats
        const stats = response.data.stats || { carros: 0, motos: 0, caminhoes: 0 };
        setStats({
          carros: { total: stats.carros, ultimaAtualizacao: new Date().toLocaleString('pt-BR') },
          motos: { total: stats.motos, ultimaAtualizacao: new Date().toLocaleString('pt-BR') },
          caminhoes: { total: stats.caminhoes, ultimaAtualizacao: new Date().toLocaleString('pt-BR') }
        });
        
        toast.success(`${veiculosData.length} veículos FIPE carregados com sucesso!`);
      } else {
        toast.warning('Nenhum veículo foi retornado pela API FIPE');
      }
    } catch (error) {
      console.error('Erro ao carregar dados FIPE:', error);
      if (error.response) {
        toast.error(`Erro: ${error.response.status} - ${error.response.data?.detail || 'Erro desconhecido'}`);
      } else if (error.request) {
        toast.error('Erro de conexão com o servidor. Verifique sua conexão.');
      } else {
        toast.error('Erro ao processar requisição: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterVeiculos = () => {
    let filtered = [...veiculos];
    
    // Filtro por tipo
    if (tipoFiltro) {
      filtered = filtered.filter(v => v.tipo === tipoFiltro);
    }
    
    // Filtro por subcategoria
    if (subcategoriaFiltro) {
      filtered = filtered.filter(v => v.subcategoria === subcategoriaFiltro);
    }
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.marca.toLowerCase().includes(term) ||
        v.modelo.toLowerCase().includes(term) ||
        v.codigoFipe.toLowerCase().includes(term) ||
        v.ano.toString().includes(term) ||
        (v.subcategoria && v.subcategoria.toLowerCase().includes(term))
      );
    }
    
    setFilteredVeiculos(filtered);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    const currentPageVeiculos = getCurrentPageData();
    if (selectedVeiculos.length === currentPageVeiculos.length) {
      setSelectedVeiculos([]);
    } else {
      setSelectedVeiculos(currentPageVeiculos.map(v => v.id));
    }
  };

  const handleSelectVeiculo = (id) => {
    if (selectedVeiculos.includes(id)) {
      setSelectedVeiculos(selectedVeiculos.filter(v => v !== id));
    } else {
      setSelectedVeiculos([...selectedVeiculos, id]);
    }
  };


  const handleDeleteVeiculo = async (veiculoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API}/labelview/fipe/veiculo/${veiculoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Veículo excluído com sucesso');
      loadFIPEData();
    } catch (error) {
      toast.error('Erro ao excluir veículo');
    }
  };

  const handleImportarFIPE = async (modoImportacao = 'completo') => {
    let mensagem = '';
    let timeout = 300000; // 5 minutos
    
    if (modoImportacao === 'total') {
      mensagem = 
        '🔥 IMPORTAÇÃO TOTAL da API FIPE\n\n' +
        'Esta operação irá:\n' +
        '✅ Buscar TODAS as marcas e modelos\n' +
        '✅ Carros, Motos e SUVs completos\n' +
        '✅ ~15.000+ veículos da tabela FIPE\n\n' +
        '⏱️ Tempo estimado: 1-2 HORAS\n' +
        '💾 Tamanho: ~50-100 MB de dados\n\n' +
        '⚠️ NÃO FECHE esta página durante a importação!\n\n' +
        'Deseja continuar?';
      timeout = 7200000; // 2 horas
    } else {
      mensagem =
        '🚗 Importar veículos da API FIPE?\n\n' +
        'Esta operação irá:\n' +
        '✅ Buscar marcas principais (VW, Fiat, Toyota, Honda...)\n' +
        '✅ Carros, Motos e SUVs populares\n' +
        '✅ ~2.000-3.000 veículos\n' +
        '✅ Adicionar apenas novos registros\n\n' +
        '⏱️ Tempo estimado: 10-15 minutos\n\n' +
        'Deseja continuar?';
      timeout = 900000; // 15 minutos
    }

    const confirmacao = window.confirm(mensagem);
    if (!confirmacao) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');

      const msgLoading = modoImportacao === 'total' 
        ? '🔥 Importando TODOS os veículos... Isso pode levar 1-2 HORAS. Aguarde!' 
        : '🔄 Importando veículos principais... Aguarde 10-15 minutos!';
      
      toast.loading(msgLoading);

      // Importar completo ou total
      const response = await axios.post(
        `${API}/labelview/fipe/importar-completo?modo=${modoImportacao}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: timeout
        }
      );

      if (response.data.success) {
        const { total_salvos, total_duplicados, total_ignorados, resultados, modo } = response.data;
        
        toast.dismiss();
        toast.success(
          `✅ Importação ${modo === 'total' ? 'TOTAL' : 'Completa'} finalizada!\n\n` +
          `📊 Novos veículos: ${total_salvos}\n` +
          `🔄 Já existentes: ${total_duplicados}\n` +
          `🚫 Ignorados: ${total_ignorados} (caminhões pesados)\n\n` +
          `🚗 Carros: ${resultados.carros.salvos} | ` +
          `🏍️ Motos: ${resultados.motos.salvos} | ` +
          `🚛 Caminhões: ${resultados.caminhoes.salvos}`,
          { duration: 8000 }
        );
        
        // Recarregar dados
        await loadFIPEData();
      }
    } catch (error) {
      console.error('Erro ao importar FIPE:', error);
      toast.dismiss();
      
      if (error.code === 'ECONNABORTED') {
        toast.error('⏱️ Tempo esgotado. A importação está muito grande. Tente importação parcial.');
      } else {
        toast.error('❌ Erro ao importar dados da FIPE. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };


  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVeiculos.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredVeiculos.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a59ad]">
          Relações De Veículos - Tabela FIPE
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border-l-8 border-[#1a59ad] shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-[#e3dcda] rounded-lg">
              <Car size={32} className="text-[#1a59ad]" />
            </div>
            <span className="text-3xl font-bold text-[#1a59ad]">{stats.carros.total}</span>
          </div>
          <h3 className="text-lg font-semibold text-[#1a59ad]">Carros</h3>
          <p className="text-xs text-[#1a59ad] mt-2 opacity-70">
            Última atualização: {stats.carros.ultimaAtualizacao}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-8 border-[#2fa31c] shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-[#e3dcda] rounded-lg">
              <Bike size={32} className="text-[#2fa31c]" />
            </div>
            <span className="text-3xl font-bold text-[#2fa31c]">{stats.motos.total}</span>
          </div>
          <h3 className="text-lg font-semibold text-[#1a59ad]">Motos</h3>
          <p className="text-xs text-[#1a59ad] mt-2 opacity-70">
            Última atualização: {stats.motos.ultimaAtualizacao}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-8 border-[#1a59ad] shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-[#e3dcda] rounded-lg">
              <Truck size={32} className="text-[#1a59ad]" />
            </div>
            <span className="text-3xl font-bold text-[#1a59ad]">{stats.caminhoes.total}</span>
          </div>
          <h3 className="text-lg font-semibold text-[#1a59ad]">Caminhões</h3>
          <p className="text-xs text-[#1a59ad] mt-2 opacity-70">
            Última atualização: {stats.caminhoes.ultimaAtualizacao}
          </p>
        </div>
      </div>

      {/* Tabela de Veículos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a59ad]">Tabela de Veículos</h2>
          <div className="flex gap-2">
            <button
              onClick={loadFIPEData}
              className="flex items-center gap-2 px-4 py-2 bg-[#2fa31c] hover:bg-[#248517] text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditVeiculo(null);
                setShowVeiculoModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#2fa31c] hover:bg-[#248517] text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Car size={16} />
              Novo Veículo
            </button>

            <div className="relative group">
              <button
                onClick={() => handleImportarFIPE('completo')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                {loading ? 'Importando...' : 'Importar da FIPE'}
                <ChevronDown size={14} />
              </button>
              
              {!loading && (
                <div className="absolute top-full left-0 mt-1 bg-white border-2 border-[#1a59ad] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[250px]">
                  <button
                    onClick={() => handleImportarFIPE('completo')}
                    className="w-full px-4 py-3 text-left hover:bg-[#e3dcda] transition-colors border-b border-gray-200"
                  >
                    <div className="font-semibold text-[#1a59ad]">📊 Importação Padrão</div>
                    <div className="text-xs text-gray-600 mt-1">~2.500 veículos • 10-15 min</div>
                  </button>
                  <button
                    onClick={() => handleImportarFIPE('total')}
                    className="w-full px-4 py-3 text-left hover:bg-[#e3dcda] transition-colors rounded-b-lg"
                  >
                    <div className="font-semibold text-[#2fa31c]">🔥 Importação TOTAL</div>
                    <div className="text-xs text-gray-600 mt-1">~15.000+ veículos • 1-2 horas</div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Filter size={16} />
              Filtros
            </button>

            <button 
              onClick={() => toast.info('Funcionalidade em desenvolvimento')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Upload size={16} />
              Importar Veículos
            </button>
          </div>

          {/* Filtros Ativos */}
          {tipoFiltro && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#1a59ad]">Filtros ativos:</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#e3dcda] rounded-full">
                <span className="text-sm text-[#1a59ad]">Tipo: {tipoFiltro}</span>
                <button
                  onClick={() => setTipoFiltro('')}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Painel de Filtros */}
          {showFiltros && (
            <div className="bg-[#e3dcda] p-4 rounded-lg border-2 border-[#1a59ad] shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#1a59ad] mb-3">Filtrar por tipo de veículo:</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTipoFiltro('Carro')}
                    className={`px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md ${
                      tipoFiltro === 'Carro'
                        ? 'bg-[#1a59ad] text-white'
                        : 'bg-white text-[#1a59ad] hover:bg-[#1a59ad] hover:text-white border-2 border-[#1a59ad]'
                    }`}
                  >
                    <Car size={16} className="inline mr-2" />
                    Carros
                  </button>
                  <button
                    onClick={() => setTipoFiltro('Moto')}
                    className={`px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md ${
                      tipoFiltro === 'Moto'
                        ? 'bg-[#2fa31c] text-white'
                        : 'bg-white text-[#1a59ad] hover:bg-[#2fa31c] hover:text-white border-2 border-[#2fa31c]'
                    }`}
                  >
                    <Bike size={16} className="inline mr-2" />
                    Motos
                  </button>
                  <button
                    onClick={() => setTipoFiltro('Caminhão')}
                    className={`px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md ${
                      tipoFiltro === 'Caminhão'
                        ? 'bg-[#1a59ad] text-white'
                        : 'bg-white text-[#1a59ad] hover:bg-[#1a59ad] hover:text-white border-2 border-[#1a59ad]'
                    }`}
                  >
                    <Truck size={16} className="inline mr-2" />
                    Caminhões
                  </button>
                </div>
              </div>

              {/* Filtro por Subcategoria */}
              <div>
                <h3 className="text-sm font-bold text-[#1a59ad] mb-3">Filtrar por subcategoria:</h3>
                <select
                  value={subcategoriaFiltro}
                  onChange={(e) => setSubcategoriaFiltro(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[#1a59ad] rounded-lg focus:outline-none focus:border-[#2fa31c]"
                >
                  <option value="">Todas as subcategorias</option>
                  <optgroup label="Carros">
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="SUV">SUV</option>
                    <option value="Crossover">Crossover</option>
                    <option value="Picape">Picape</option>
                    <option value="Minivan">Minivan</option>
                  </optgroup>
                  <optgroup label="Motos">
                    <option value="Street">Street</option>
                    <option value="Sport">Sport</option>
                    <option value="Trail">Trail</option>
                    <option value="Scooter">Scooter</option>
                  </optgroup>
                  <optgroup label="Caminhões">
                    <option value="Leve (até 3.5t)">Leve (até 3.5t)</option>
                    <option value="Van Baú">Van Baú</option>
                    <option value="Utilitário">Utilitário</option>
                  </optgroup>
                </select>
              </div>

              <button
                onClick={() => {
                  setTipoFiltro('');
                  setSubcategoriaFiltro('');
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Limpar Filtros
              </button>
            </div>
          )}

          {/* Busca e Paginação */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border-2 border-[#1a59ad] rounded-lg focus:outline-none focus:border-[#2fa31c]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-[#1a59ad]">
                Mostrando de {((currentPage - 1) * itemsPerPage) + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filteredVeiculos.length)} de{' '}
                {filteredVeiculos.length} registros
              </span>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1a59ad]" size={20} />
              <input
                type="text"
                placeholder="Buscar por marca, modelo, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#1a59ad] rounded-lg focus:outline-none focus:border-[#2fa31c]"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto border-2 border-[#1a59ad] rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-[#1a59ad] text-white">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold border-r border-white/20">
                  <input
                    type="checkbox"
                    checked={selectedVeiculos.length === getCurrentPageData().length && getCurrentPageData().length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Código FIPE</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Subcategoria</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Marca</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Modelo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Ano</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Combustível</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Valor (R$)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Mês ref.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-r border-white/20">Categoria</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="border px-4 py-8 text-center text-[#1a59ad]">
                    Carregando dados...
                  </td>
                </tr>
              ) : getCurrentPageData().length === 0 ? (
                <tr>
                  <td colSpan="11" className="border px-4 py-8 text-center text-[#1a59ad]">
                    Nenhum veículo encontrado
                  </td>
                </tr>
              ) : (
                getCurrentPageData().map((veiculo, index) => (
                  <tr key={veiculo.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#e3dcda]/30'} hover:bg-[#e3dcda] transition-colors border-b border-[#1a59ad]/20`}>
                    <td className="px-3 py-3 border-r border-[#1a59ad]/10">
                      <input
                        type="checkbox"
                        checked={selectedVeiculos.includes(veiculo.id)}
                        onChange={() => handleSelectVeiculo(veiculo.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1a59ad] font-medium border-r border-[#1a59ad]/10">{veiculo.codigoFipe}</td>
                    <td className="px-4 py-3 text-sm text-[#1a59ad] border-r border-[#1a59ad]/10">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        veiculo.tipo === 'Carro' ? 'bg-blue-100 text-[#1a59ad]' :
                        veiculo.tipo === 'Moto' ? 'bg-green-100 text-[#2fa31c]' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {veiculo.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1a59ad] border-r border-[#1a59ad]/10">
                      <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700">
                        {veiculo.subcategoria || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#1a59ad] border-r border-[#1a59ad]/10">{veiculo.marca}</td>
                    <td className="px-4 py-3 text-sm text-[#1a59ad] border-r border-[#1a59ad]/10">{veiculo.modelo}</td>
                    <td className="px-4 py-3 text-sm text-center text-[#1a59ad] border-r border-[#1a59ad]/10">{veiculo.ano}</td>
                    <td className="px-4 py-3 text-sm text-[#1a59ad] border-r border-[#1a59ad]/10">{veiculo.combustivel}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#2fa31c] border-r border-[#1a59ad]/10">
                      R$ {new Intl.NumberFormat('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(veiculo.valor)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-[#1a59ad] border-r border-[#1a59ad]/10">{veiculo.mesReferencia}</td>
                    <td className="px-4 py-3 text-sm border-r border-[#1a59ad]/10">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e3dcda] text-[#1a59ad]">
                        {veiculo.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditVeiculo(veiculo);
                            setShowVeiculoModal(true);
                          }}
                          className="p-2 text-[#1a59ad] hover:bg-[#e3dcda] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteVeiculo(veiculo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#1a59ad] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#2fa31c] transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-[#1a59ad]">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#1a59ad] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#2fa31c] transition-colors"
            >
              Próximo
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showVeiculoModal && (
        <VeiculoFipeModal
          isOpen={showVeiculoModal}
          onClose={() => {
            setShowVeiculoModal(false);
            setEditVeiculo(null);
          }}
          editData={editVeiculo}
          onSuccess={() => {
            loadFIPEData();
            setShowVeiculoModal(false);
            setEditVeiculo(null);
          }}
        />
      )}
    </div>
  );
};

export default TabelaFIPE;
