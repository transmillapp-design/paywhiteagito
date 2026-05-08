import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Shield, Car, Phone, AlertCircle, CheckCircle, Clock, 
  ArrowLeft, FileText, Calendar, DollarSign, X, Wrench
} from 'lucide-react';

const MinhaProtecaoPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [protecao, setProtecao] = useState(null);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [criandoSolicitacao, setCriandoSolicitacao] = useState(false);
  const [solicitacaoCriada, setSolicitacaoCriada] = useState(null);

  useEffect(() => {
    carregarProtecao();
  }, []);

  const carregarProtecao = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/cotacoes/minhas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.cotacoes.length > 0) {
        // Pegar a primeira proteção ativa
        const protecaoAtiva = response.data.cotacoes.find(c => c.status === 'ativa');
        setProtecao(protecaoAtiva || response.data.cotacoes[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar proteção:', error);
      toast.error('Erro ao carregar sua proteção');
    } finally {
      setLoading(false);
    }
  };

  const servicosDisponiveis = protecao ? [
    {
      id: 'roubo_furto_rastreado',
      nome: 'Roubo/Furto do Veículo Rastreado',
      descricao: 'Comunicar roubo ou furto - veículo com rastreador obrigatório',
      disponivel: true,
      destaque: true
    },
    {
      id: 'perda_total',
      nome: 'Perda Total',
      descricao: 'Comunicar perda total do veículo',
      disponivel: protecao.coberturas?.perdaTotal || false
    },
    {
      id: 'guincho',
      nome: 'Guincho',
      descricao: 'Reboque do veículo em caso de pane ou acidente',
      disponivel: protecao.coberturas?.assistencia24h || true
    },
    {
      id: 'socorro_mecanico',
      nome: 'Socorro Mecânico',
      descricao: 'Atendimento emergencial no local',
      disponivel: protecao.coberturas?.assistencia24h || true
    },
    {
      id: 'troca_pneu',
      nome: 'Troca de Pneu',
      descricao: 'Auxílio para troca de pneu furado',
      disponivel: protecao.coberturas?.assistencia24h || true
    },
    {
      id: 'chaveiro',
      nome: 'Chaveiro',
      descricao: 'Abertura de veículo ou cópia de chave',
      disponivel: protecao.coberturas?.assistencia24h || true
    },
    {
      id: 'carro_reserva',
      nome: 'Carro Reserva',
      descricao: 'Veículo substituto durante reparo',
      disponivel: protecao.coberturas?.carroReserva || false
    },
    {
      id: 'vidros',
      nome: 'Reparo/Troca de Vidros',
      descricao: 'Substituição de vidros danificados',
      disponivel: protecao.coberturas?.vidros || false
    },
    {
      id: 'sinistro',
      nome: 'Comunicar Sinistro (Colisão)',
      descricao: 'Comunicar colisão ou danos ao veículo',
      disponivel: true
    }
  ] : [];

  const toggleServico = (servicoId) => {
    if (servicosSelecionados.includes(servicoId)) {
      setServicosSelecionados(servicosSelecionados.filter(id => id !== servicoId));
    } else {
      setServicosSelecionados([...servicosSelecionados, servicoId]);
    }
  };

  const criarSolicitacao = async () => {
    if (servicosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      return;
    }

    try {
      setCriandoSolicitacao(true);
      const token = localStorage.getItem('token');
      
      const servicosDetalhados = servicosSelecionados.map(id => {
        const servico = servicosDisponiveis.find(s => s.id === id);
        return {
          id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao
        };
      });

      const response = await axios.post(
        `${API}/labelview/solicitacoes/criar`,
        {
          cotacao_id: protecao.id,
          servicos: servicosDetalhados,
          observacoes: observacoes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSolicitacaoCriada(response.data.solicitacao);
        toast.success('Solicitação criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar solicitação');
    } finally {
      setCriandoSolicitacao(false);
    }
  };

  const fecharModal = () => {
    setShowSolicitacao(false);
    setSolicitacaoCriada(null);
    setServicosSelecionados([]);
    setObservacoes('');
  };

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
          <p className="text-gray-600">Carregando sua proteção...</p>
        </div>
      </div>
    );
  }

  if (!protecao) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#1a59ad] p-4 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-white">Minha Proteção</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma Proteção Ativa
              </p>
              <p className="text-gray-600">
                Você ainda não possui uma proteção veicular contratada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a59ad] p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-white">Minha Proteção Veicular</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status da Proteção */}
        <Card className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90 mb-1">Número do Contrato</p>
                <p className="text-2xl font-bold">{protecao.numero_contrato}</p>
                <p className="text-sm opacity-90 mt-2">
                  Contratado em {formatarData(protecao.created_at)}
                </p>
              </div>
              <Badge className="bg-green-500 text-white border-0">
                <CheckCircle size={14} className="mr-1" />
                {protecao.status === 'ativa' ? 'Ativa' : protecao.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Solicitação em Destaque */}
        <Card className="border-2 border-transmill-gold bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-transmill-olive rounded-full flex items-center justify-center">
                  <Wrench className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-1">
                    Precisa de Atendimento?
                  </h3>
                  <p className="text-gray-600">
                    Solicite assistência 24h para seu veículo
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowSolicitacao(true)}
                className="bg-transmill-olive hover:bg-transmill-olive-dark text-white px-8 py-6 text-lg"
              >
                <Phone className="mr-2" size={24} />
                Solicitar Atendimento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Veículo Protegido */}
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
                <p className="font-semibold text-lg">
                  {protecao.veiculo?.marca} {protecao.veiculo?.modelo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ano</p>
                <p className="font-semibold text-lg">{protecao.veiculo?.ano}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa</p>
                <p className="font-semibold text-lg">{protecao.veiculo?.placa}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor FIPE</p>
                <p className="font-semibold text-lg text-transmill-olive">
                  {formatarMoeda(protecao.veiculo?.valorFipe)}
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
              Plano e Coberturas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{protecao.plano?.nome_plano}</p>
                  <p className="text-sm text-gray-600">{protecao.plano?.descricao}</p>
                </div>
                <p className="text-xl font-bold text-[#2fa31c]">
                  {formatarMoeda(protecao.valores?.valor_mensal)}
                  <span className="text-xs text-gray-500">/mês</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {protecao.coberturas?.rouboFurto && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Roubo/Furto</span>
                </div>
              )}
              {protecao.coberturas?.colisao && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Colisão</span>
                </div>
              )}
              {protecao.coberturas?.vidros && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Vidros</span>
                </div>
              )}
              {protecao.coberturas?.assistencia24h && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Assistência 24h</span>
                </div>
              )}
              {protecao.coberturas?.carroReserva && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Carro Reserva</span>
                </div>
              )}
              {protecao.coberturas?.danosTerceiros && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Danos a Terceiros</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rastreador */}
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Wrench size={20} />
              Rastreador do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {protecao.rastreador ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <p className="font-bold text-green-700">Rastreador Instalado</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">IMEI</p>
                    <p className="font-bold text-lg">{protecao.rastreador.imei}</p>
                  </div>
                  {protecao.rastreador.modelo && (
                    <div>
                      <p className="text-gray-600">Modelo</p>
                      <p className="font-semibold">{protecao.rastreador.modelo}</p>
                    </div>
                  )}
                  {protecao.rastreador.fabricante && (
                    <div>
                      <p className="text-gray-600">Fabricante</p>
                      <p className="font-semibold">{protecao.rastreador.fabricante}</p>
                    </div>
                  )}
                  {protecao.rastreador.data_instalacao && (
                    <div>
                      <p className="text-gray-600">Data de Instalação</p>
                      <p className="font-semibold">{formatarData(protecao.rastreador.data_instalacao)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-yellow-600" size={24} />
                  <p className="font-bold text-yellow-700">Aguardando Instalação</p>
                </div>
                <p className="text-sm text-yellow-700">
                  O rastreador será instalado em breve. Você será notificado quando a instalação for concluída.
                </p>
              </div>
            )}
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Importante:</strong> O rastreador é obrigatório em todas as proteções Labelview. 
                Taxa mensal: <strong>R$ 50,00</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Financeiras */}
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} />
              Informações de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Valor Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatarMoeda(protecao.valores?.valor_mensal)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Inclui taxa de rastreador</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Vencimento</p>
                <p className="text-2xl font-bold text-green-600">
                  Dia {protecao.vencimento?.dia_vencimento}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Vigência</p>
                <p className="text-2xl font-bold text-purple-600">
                  {protecao.valores?.vigencia_meses} meses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Solicitação */}
      {showSolicitacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Wrench size={24} />
                  {solicitacaoCriada ? 'Solicitação Criada!' : 'Solicitar Atendimento'}
                </CardTitle>
                <button
                  onClick={fecharModal}
                  className="text-white hover:bg-white/20 p-2 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {solicitacaoCriada ? (
                // Tela de Sucesso com 0800
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="text-green-600" size={48} />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Solicitação Registrada!
                    </h3>
                    <p className="text-gray-600 mb-1">
                      Número da solicitação: <strong>{solicitacaoCriada.numero_solicitacao}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      Agora ligue para nossa central de atendimento
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark p-8 rounded-lg text-white">
                    <Phone className="mx-auto mb-4" size={48} />
                    <p className="text-sm mb-2">Ligue agora para</p>
                    <a 
                      href={`tel:${solicitacaoCriada.telefone_0800.replace(/\s/g, '')}`}
                      className="text-5xl font-bold block hover:underline"
                    >
                      {solicitacaoCriada.telefone_0800}
                    </a>
                    <p className="text-sm mt-4 opacity-90">
                      Atendimento 24 horas, 7 dias por semana
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                      <div className="text-left">
                        <p className="font-semibold text-yellow-800 mb-1">Importante</p>
                        <p className="text-sm text-yellow-700">
                          Tenha em mãos o número da sua solicitação e os documentos do veículo.
                          Nossa equipe está pronta para te atender!
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => window.location.href = '/minhas-solicitacoes'}
                    variant="outline"
                    className="border-transmill-olive text-transmill-olive"
                  >
                    <FileText className="mr-2" size={20} />
                    Ver Minhas Solicitações
                  </Button>
                </div>
              ) : (
                // Tela de Seleção de Serviços
                <>
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">Selecione os serviços necessários:</h3>
                    <p className="text-sm text-gray-600">
                      Marque todos os serviços que você precisa e depois ligue para nossa central.
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {servicosDisponiveis.map((servico) => (
                      <div
                        key={servico.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          servico.destaque
                            ? 'border-red-500 bg-red-50'
                            : !servico.disponivel
                            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                            : servicosSelecionados.includes(servico.id)
                            ? 'border-transmill-olive bg-transmill-gold/10'
                            : 'border-gray-300 hover:border-transmill-olive'
                        }`}
                        onClick={() => servico.disponivel && toggleServico(servico.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 ${
                            servicosSelecionados.includes(servico.id)
                              ? 'bg-transmill-olive border-transmill-olive'
                              : 'border-gray-400'
                          }`}>
                            {servicosSelecionados.includes(servico.id) && (
                              <CheckCircle className="text-white" size={16} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 flex items-center gap-2">
                              {servico.nome}
                              {servico.destaque && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  Obrigatório - Rastreador
                                </Badge>
                              )}
                              {!servico.disponivel && (
                                <Badge variant="outline" className="text-xs">
                                  Não incluído no plano
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">{servico.descricao}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Descreva detalhes sobre a situação..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={fecharModal}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={criarSolicitacao}
                      disabled={servicosSelecionados.length === 0 || criandoSolicitacao}
                      className="flex-1 bg-transmill-olive hover:bg-transmill-olive-dark text-white"
                    >
                      {criandoSolicitacao ? (
                        <>
                          <Clock className="animate-spin mr-2" size={20} />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2" size={20} />
                          Criar Solicitação
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MinhaProtecaoPage;
