import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Users, Car, CheckCircle, Clock, ArrowLeft, Search, Wrench, X
} from 'lucide-react';

const FornecedorClientesPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [protecoes, setProtecoes] = useState([]);
  const [rastreadores, setRastreadores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [protecaoSelecionada, setProtecaoSelecionada] = useState(null);
  const [imeiSelecionado, setImeiSelecionado] = useState('');
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Carregar proteções
      const protecoesResponse = await axios.get(
        `${API}/labelview/fornecedor/clientes-protecoes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Carregar rastreadores disponíveis
      const rastreadoresResponse = await axios.get(
        `${API}/labelview/rastreadores/meus`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (protecoesResponse.data.success) {
        setProtecoes(protecoesResponse.data.protecoes);
      }

      if (rastreadoresResponse.data.success) {
        setRastreadores(rastreadoresResponse.data.rastreadores.filter(r => r.status === 'disponivel'));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalInstalacao = (protecao) => {
    setProtecaoSelecionada(protecao);
    setShowModal(true);
    setImeiSelecionado('');
  };

  const marcarInstalado = async () => {
    if (!imeiSelecionado) {
      toast.error('Selecione um rastreador');
      return;
    }

    try {
      setInstalando(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/labelview/rastreadores/instalar`,
        {
          imei: imeiSelecionado,
          cotacao_id: protecaoSelecionada.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Rastreador marcado como instalado!');
        setShowModal(false);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao marcar instalação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao marcar instalação');
    } finally {
      setInstalando(false);
    }
  };

  const filtrarProtecoes = () => {
    if (!searchTerm) return protecoes;

    return protecoes.filter(p =>
      p.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const protecoesFiltradas = filtrarProtecoes();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="bg-[#556B2F] p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-white">Clientes - Instalação de Rastreadores</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente, placa ou contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Proteções */}
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        ) : protecoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum Cliente
              </p>
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum cliente encontrado.' : 'Ainda não há proteções ativas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {protecoesFiltradas.map((protecao) => (
              <Card key={protecao.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {protecao.cliente_nome?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{protecao.cliente_nome}</h3>
                          <p className="text-sm text-gray-600">{protecao.cliente_email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Contrato</p>
                          <p className="font-bold">{protecao.numero_contrato}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Car size={16} className="text-green-600" />
                            <p className="text-xs text-gray-600">Veículo</p>
                          </div>
                          <p className="font-semibold text-sm">
                            {protecao.veiculo?.marca} {protecao.veiculo?.modelo}
                          </p>
                          <p className="text-xs text-gray-600">Placa: {protecao.veiculo?.placa}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Plano</p>
                          <p className="font-semibold text-sm">{protecao.plano?.nome_plano}</p>
                        </div>
                      </div>

                      {protecao.rastreador ? (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <div>
                              <p className="font-bold text-green-700">Rastreador Instalado</p>
                              <p className="text-sm text-gray-600">
                                IMEI: <strong>{protecao.rastreador.imei}</strong> • 
                                Instalado em {new Date(protecao.rastreador.data_instalacao).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="text-yellow-600" size={20} />
                            <p className="font-bold text-yellow-700">Aguardando Instalação</p>
                          </div>
                          <Button
                            onClick={() => abrirModalInstalacao(protecao)}
                            className="bg-transmill-olive hover:bg-transmill-olive-dark text-white"
                            disabled={rastreadores.length === 0}
                          >
                            <Wrench className="mr-2" size={18} />
                            Marcar como Instalado
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Instalação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
              <div className="flex justify-between items-center">
                <CardTitle>Marcar Rastreador como Instalado</CardTitle>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Cliente: {protecaoSelecionada?.cliente_nome}</h3>
                <p className="text-sm text-gray-600">
                  Veículo: {protecaoSelecionada?.veiculo?.marca} {protecaoSelecionada?.veiculo?.modelo} - 
                  Placa: {protecaoSelecionada?.veiculo?.placa}
                </p>
                <p className="text-sm text-gray-600">
                  Contrato: {protecaoSelecionada?.numero_contrato}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Rastreador (IMEI) *
                </label>
                {rastreadores.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                    <p className="text-red-700 font-semibold">Nenhum rastreador disponível</p>
                    <p className="text-sm text-red-600 mt-1">
                      Cadastre rastreadores antes de marcar instalação
                    </p>
                  </div>
                ) : (
                  <select
                    value={imeiSelecionado}
                    onChange={(e) => setImeiSelecionado(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
                  >
                    <option value="">Selecione um rastreador...</option>
                    {rastreadores.map((rastreador) => (
                      <option key={rastreador.id} value={rastreador.imei}>
                        IMEI: {rastreador.imei}
                        {rastreador.modelo && ` - ${rastreador.modelo}`}
                        {rastreador.fabricante && ` (${rastreador.fabricante})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={marcarInstalado}
                  disabled={instalando || !imeiSelecionado || rastreadores.length === 0}
                  className="flex-1 bg-transmill-olive hover:bg-transmill-olive-dark text-white"
                >
                  {instalando ? (
                    <>
                      <Clock className="animate-spin mr-2" size={20} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2" size={20} />
                      Confirmar Instalação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FornecedorClientesPage;
