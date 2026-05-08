import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Shield, Car, FileText, Calendar, DollarSign, Eye, Download,
  CheckCircle, Clock, XCircle, ArrowLeft
} from 'lucide-react';

const MinhasProtecoesPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cotacoes, setCotacoes] = useState([]);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState(null);

  useEffect(() => {
    carregarCotacoes();
  }, []);

  const carregarCotacoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/cotacoes/minhas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCotacoes(response.data.cotacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
      toast.error('Erro ao carregar suas proteções');
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = async (cotacaoId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/cotacoes/${cotacaoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCotacaoSelecionada(response.data.cotacao);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da proteção');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ativa': { label: 'Ativa', className: 'bg-green-500 text-white', icon: CheckCircle },
      'aguardando_pagamento': { label: 'Aguardando Pagamento', className: 'bg-yellow-500 text-white', icon: Clock },
      'cancelada': { label: 'Cancelada', className: 'bg-red-500 text-white', icon: XCircle },
      'suspensa': { label: 'Suspensa', className: 'bg-orange-500 text-white', icon: Clock }
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-500 text-white', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon size={14} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Visualização de Detalhes
  if (cotacaoSelecionada) {
    return (
      <div className="min-h-screen bg-[#FFFFFF]">
        {/* Header */}
        <div className="bg-[#556B2F] p-4 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCotacaoSelecionada(null)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-white">Detalhes da Proteção</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Header do Contrato */}
          <Card className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Número do Contrato</p>
                  <p className="text-2xl font-bold">{cotacaoSelecionada.numero_contrato}</p>
                  <p className="text-sm opacity-90 mt-2">
                    Contratado em {formatarData(cotacaoSelecionada.created_at)}
                  </p>
                </div>
                <div>
                  {getStatusBadge(cotacaoSelecionada.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Veículo */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <Car size={20} />
                Veículo Protegido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Marca/Modelo</p>
                  <p className="font-semibold">
                    {cotacaoSelecionada.veiculo?.marca} {cotacaoSelecionada.veiculo?.modelo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ano</p>
                  <p className="font-semibold">{cotacaoSelecionada.veiculo?.ano}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Placa</p>
                  <p className="font-semibold">{cotacaoSelecionada.veiculo?.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor FIPE</p>
                  <p className="font-semibold text-transmill-olive">
                    {formatarMoeda(cotacaoSelecionada.veiculo?.valorFipe)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano Contratado */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Plano Contratado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{cotacaoSelecionada.plano?.nome_plano}</p>
                    <p className="text-sm text-gray-600">{cotacaoSelecionada.plano?.descricao}</p>
                  </div>
                  <p className="text-xl font-bold text-[#2fa31c]">
                    {formatarMoeda(cotacaoSelecionada.valores?.valor_plano)}
                  </p>
                </div>
              </div>

              {/* Complementos */}
              {cotacaoSelecionada.complementos && cotacaoSelecionada.complementos.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Complementos</p>
                  {cotacaoSelecionada.complementos.map((comp, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span className="text-sm">{comp.nome}</span>
                      <span className="font-semibold text-blue-600">{formatarMoeda(comp.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores e Vencimento */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} />
                Valores e Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark p-6 rounded-lg text-white">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Valor Mensal</span>
                    <span className="font-bold text-xl">
                      {formatarMoeda(cotacaoSelecionada.valores?.valor_mensal)}
                    </span>
                  </div>
                  <div className="border-t border-white/30 pt-3">
                    <div className="flex justify-between mb-2">
                      <span>Vigência</span>
                      <span>{cotacaoSelecionada.valores?.vigencia_meses} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dia do Vencimento</span>
                      <span className="font-bold">
                        Dia {cotacaoSelecionada.vencimento?.dia_vencimento}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <Calendar className="inline mr-2" size={16} />
                Próximo vencimento: {formatarData(cotacaoSelecionada.vencimento?.primeira_parcela)}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              className="border-transmill-olive text-transmill-olive"
            >
              <Download className="mr-2" size={20} />
              Baixar Contrato (PDF)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Listagem de Proteções
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="bg-[#556B2F] p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-white">Minhas Proteções</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando suas proteções...</p>
          </div>
        ) : cotacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma Proteção Ativa
              </p>
              <p className="text-gray-600 mb-6">
                Você ainda não possui nenhuma proteção veicular contratada.
              </p>
              <Button
                onClick={() => window.location.href = '/protecao-veicular'}
                className="bg-transmill-olive hover:bg-transmill-olive-dark"
              >
                <Shield className="mr-2" size={20} />
                Contratar Proteção
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cotacoes.map((cotacao) => (
              <Card key={cotacao.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg mb-1">
                        {cotacao.veiculo?.marca} {cotacao.veiculo?.modelo}
                      </p>
                      <p className="text-sm text-gray-600">
                        Contrato: {cotacao.numero_contrato}
                      </p>
                      <p className="text-xs text-gray-500">
                        Contratado em {formatarData(cotacao.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(cotacao.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Plano</p>
                      <p className="font-semibold text-sm">{cotacao.plano?.nome_plano}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Valor Mensal</p>
                      <p className="font-semibold text-sm text-[#2fa31c]">
                        {formatarMoeda(cotacao.valores?.valor_mensal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Vencimento</p>
                      <p className="font-semibold text-sm">
                        Dia {cotacao.vencimento?.dia_vencimento}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Vigência</p>
                      <p className="font-semibold text-sm">
                        {cotacao.valores?.vigencia_meses} meses
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => verDetalhes(cotacao.id)}
                    variant="outline"
                    className="w-full border-transmill-olive text-transmill-olive hover:bg-transmill-gold/10"
                  >
                    <Eye className="mr-2" size={18} />
                    Ver Detalhes Completos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhasProtecoesPage;
