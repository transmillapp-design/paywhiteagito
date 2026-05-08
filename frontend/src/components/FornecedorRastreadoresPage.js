import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Plus, Wrench, CheckCircle, Clock, AlertCircle, ArrowLeft, Search, Edit
} from 'lucide-react';

const FornecedorRastreadoresPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rastreadores, setRastreadores] = useState([]);
  const [showCadastro, setShowCadastro] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [imei, setImei] = useState('');
  const [modelo, setModelo] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarRastreadores();
  }, []);

  const carregarRastreadores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/rastreadores/meus`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRastreadores(response.data.rastreadores);
      }
    } catch (error) {
      console.error('Erro ao carregar rastreadores:', error);
      toast.error('Erro ao carregar rastreadores');
    } finally {
      setLoading(false);
    }
  };

  const cadastrarRastreador = async (e) => {
    e.preventDefault();

    if (!imei) {
      toast.error('IMEI é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/labelview/rastreadores/cadastrar`,
        { imei, modelo, fabricante },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Rastreador cadastrado com sucesso!');
        setImei('');
        setModelo('');
        setFabricante('');
        setShowCadastro(false);
        carregarRastreadores();
      }
    } catch (error) {
      console.error('Erro ao cadastrar rastreador:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar rastreador');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'disponivel': {
        label: 'Disponível',
        className: 'bg-green-500 text-white',
        icon: CheckCircle
      },
      'instalado': {
        label: 'Instalado',
        className: 'bg-blue-500 text-white',
        icon: Wrench
      },
      'manutencao': {
        label: 'Manutenção',
        className: 'bg-orange-500 text-white',
        icon: AlertCircle
      }
    };

    return configs[status] || configs['disponivel'];
  };

  const filtrarRastreadores = () => {
    if (!searchTerm) return rastreadores;

    return rastreadores.filter(r =>
      r.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const rastreadorFiltrados = filtrarRastreadores();

  // Estatísticas
  const stats = {
    total: rastreadores.length,
    disponiveis: rastreadores.filter(r => r.status === 'disponivel').length,
    instalados: rastreadores.filter(r => r.status === 'instalado').length,
    manutencao: rastreadores.filter(r => r.status === 'manutencao').length
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="bg-[#556B2F] p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-white">Meus Rastreadores</h1>
          </div>
          <Button
            onClick={() => setShowCadastro(!showCadastro)}
            className="bg-white text-transmill-olive hover:bg-gray-100"
          >
            <Plus size={20} className="mr-2" />
            Cadastrar Rastreador
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.disponiveis}</p>
              <p className="text-sm text-gray-600">Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.instalados}</p>
              <p className="text-sm text-gray-600">Instalados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.manutencao}</p>
              <p className="text-sm text-gray-600">Manutenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Cadastro */}
        {showCadastro && (
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
              <CardTitle>Cadastrar Novo Rastreador</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={cadastrarRastreador} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMEI *
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="Digite o código IMEI"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ex: GPS-2000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fabricante
                    </label>
                    <input
                      type="text"
                      value={fabricante}
                      onChange={(e) => setFabricante(e.target.value)}
                      placeholder="Ex: TechTrack"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCadastro(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={salvando}
                    className="flex-1 bg-transmill-olive hover:bg-transmill-olive-dark text-white"
                  >
                    {salvando ? (
                      <>
                        <Clock className="animate-spin mr-2" size={20} />
                        Salvando...
                      </>
                    ) : (
                      'Cadastrar'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por IMEI ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Rastreadores */}
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando rastreadores...</p>
          </div>
        ) : rastreadorFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum Rastreador
              </p>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Nenhum rastreador encontrado.' : 'Cadastre seu primeiro rastreador.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCadastro(true)}
                  className="bg-transmill-olive hover:bg-transmill-olive-dark"
                >
                  <Plus className="mr-2" size={20} />
                  Cadastrar Rastreador
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rastreadorFiltrados.map((rastreador) => {
              const statusConfig = getStatusConfig(rastreador.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={rastreador.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="text-transmill-olive" size={24} />
                        <Badge className={statusConfig.className}>
                          <StatusIcon size={14} className="mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">IMEI</p>
                        <p className="font-bold text-lg">{rastreador.imei}</p>
                      </div>

                      {rastreador.modelo && (
                        <div>
                          <p className="text-xs text-gray-600">Modelo</p>
                          <p className="font-semibold">{rastreador.modelo}</p>
                        </div>
                      )}

                      {rastreador.fabricante && (
                        <div>
                          <p className="text-xs text-gray-600">Fabricante</p>
                          <p className="font-semibold">{rastreador.fabricante}</p>
                        </div>
                      )}

                      {rastreador.status === 'instalado' && rastreador.data_instalacao && (
                        <div className="bg-blue-50 p-3 rounded-lg mt-3">
                          <p className="text-xs text-gray-600 mb-1">Instalado em</p>
                          <p className="text-sm font-semibold">
                            {new Date(rastreador.data_instalacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FornecedorRastreadoresPage;
