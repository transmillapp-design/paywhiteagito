import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  FileText, Clock, CheckCircle, AlertCircle, ArrowLeft,
  Car, Calendar, Phone, Wrench
} from 'lucide-react';

const MinhasSolicitacoesPage = () => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/solicitacoes/minhas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSolicitacoes(response.data.solicitacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pendente': {
        label: 'Aguardando Atendimento',
        className: 'bg-yellow-500 text-white',
        icon: Clock
      },
      'em_atendimento': {
        label: 'Em Atendimento',
        className: 'bg-blue-500 text-white',
        icon: Wrench
      },
      'concluido': {
        label: 'Concluído',
        className: 'bg-green-500 text-white',
        icon: CheckCircle
      },
      'cancelado': {
        label: 'Cancelado',
        className: 'bg-red-500 text-white',
        icon: AlertCircle
      }
    };

    return configs[status] || configs['pendente'];
  };

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
          <h1 className="text-xl font-bold text-white">Minhas Solicitações</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4 text-transmill-olive" size={48} />
            <p className="text-gray-600">Carregando solicitações...</p>
          </div>
        ) : solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma Solicitação
              </p>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhuma solicitação de atendimento.
              </p>
              <Button
                onClick={() => window.location.href = '/minha-protecao'}
                className="bg-transmill-olive hover:bg-transmill-olive-dark"
              >
                <Wrench className="mr-2" size={20} />
                Solicitar Atendimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((solicitacao) => {
              const statusConfig = getStatusConfig(solicitacao.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={solicitacao.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Solicitação</p>
                        <p className="font-bold text-lg">{solicitacao.numero_solicitacao}</p>
                      </div>
                      <Badge className={statusConfig.className}>
                        <StatusIcon size={14} className="mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Data */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>Solicitado em {formatarData(solicitacao.data_solicitacao)}</span>
                    </div>

                    {/* Veículo */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Car size={18} className="text-blue-600" />
                        <p className="font-semibold text-gray-700">Veículo</p>
                      </div>
                      <p className="text-gray-800">
                        {solicitacao.veiculo?.marca} {solicitacao.veiculo?.modelo} - {solicitacao.veiculo?.placa}
                      </p>
                      <p className="text-sm text-gray-600">Contrato: {solicitacao.numero_contrato}</p>
                    </div>

                    {/* Serviços Solicitados */}
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Wrench size={18} />
                        Serviços Solicitados
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {solicitacao.servicos_solicitados?.map((servico, index) => (
                          <div
                            key={index}
                            className="bg-transmill-gold/10 border border-transmill-gold px-3 py-2 rounded-lg"
                          >
                            <p className="font-medium text-sm">{servico.nome}</p>
                            <p className="text-xs text-gray-600">{servico.descricao}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observações */}
                    {solicitacao.observacoes && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-700 mb-2">Observações</p>
                        <p className="text-sm text-gray-700">{solicitacao.observacoes}</p>
                      </div>
                    )}

                    {/* Informações de Atendimento */}
                    {solicitacao.atendido_por_nome && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">
                          Atendido por: <strong>{solicitacao.atendido_por_nome}</strong>
                        </p>
                        {solicitacao.data_atendimento && (
                          <p className="text-xs text-gray-500">
                            em {formatarData(solicitacao.data_atendimento)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contato */}
                    {solicitacao.status === 'pendente' && (
                      <div className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark p-4 rounded-lg text-white">
                        <p className="text-sm mb-2">Central de Atendimento 24h</p>
                        <a
                          href="tel:08001234567"
                          className="text-2xl font-bold flex items-center gap-2 hover:underline"
                        >
                          <Phone size={24} />
                          0800 123 4567
                        </a>
                      </div>
                    )}
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

export default MinhasSolicitacoesPage;
