import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSignature,
  ArrowRight
} from 'lucide-react';

const StatusVistoriaCliente = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vistoria, setVistoria] = useState(null);
  const [cotacao, setCotacao] = useState(null);

  useEffect(() => {
    buscarStatusVistoria();
  }, []);

  const buscarStatusVistoria = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Buscar vistoria do cliente
      const responseVistoria = await axios.get(
        `${API}/protecao/vistoria/by-cliente/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (responseVistoria.data.success) {
        setVistoria(responseVistoria.data.vistoria);
      }

      // Buscar cotação para pegar ID
      const responseCotacao = await axios.get(
        `${API}/cotacoes/cliente/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (responseCotacao.data) {
        setCotacao(responseCotacao.data);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssinarContrato = () => {
    // Redirecionar para página de assinatura com dados da cotação
    navigate('/protecao-veicular/assinar', { 
      state: { 
        cotacaoId: cotacao?.id,
        vistoriaAprovada: true 
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2fa31c] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  if (!vistoria) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Camera size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Nenhuma vistoria encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const status = vistoria.status;
  const fotosAprovadas = vistoria.fotos?.filter(f => f.status === 'aprovada').length || 0;
  const totalFotos = vistoria.fotos?.length || 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-l-4 border-l-[#2fa31c]">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-3">
            <Camera size={24} className="text-[#2fa31c]" />
            Status da Vistoria
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {status === 'em_analise' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Vistoria em Análise
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Suas fotos foram enviadas e estão sendo analisadas pelo Master Labelview.
                    Você receberá uma notificação assim que a análise for concluída.
                  </p>
                  <div className="mt-3 text-sm text-yellow-600">
                    <strong>{fotosAprovadas}</strong> de <strong>{totalFotos}</strong> fotos analisadas
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'aprovada_completa' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">
                    ✅ Vistoria Aprovada!
                  </h3>
                  <p className="text-sm text-green-700">
                    Parabéns! Sua vistoria foi aprovada pelo Master Labelview.
                    Agora você pode prosseguir com a assinatura do contrato.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAssinarContrato}
                className="w-full bg-[#2fa31c] hover:bg-[#25881a] text-white font-semibold py-6 text-lg"
              >
                <FileSignature size={24} className="mr-3" />
                Assinar Contrato de Proteção Veicular
                <ArrowRight size={20} className="ml-3" />
              </Button>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <AlertCircle size={16} className="inline mr-2" />
                  <strong>Próximos passos:</strong> Após assinar o contrato, você deverá pagar a taxa de adesão para ativar sua proteção.
                </p>
              </div>
            </div>
          )}

          {status === 'rejeitada' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Vistoria com Pendências
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Algumas fotos foram rejeitadas. Por favor, refaça a vistoria enviando novas fotos.
                  </p>
                  <Button
                    onClick={() => navigate('/protecao-veicular/vistoria')}
                    variant="destructive"
                  >
                    Refazer Vistoria
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes das Fotos */}
      <Card>
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-sm">Fotos Enviadas</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {vistoria.fotos?.map((foto, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-lg border-2 overflow-hidden ${
                  foto.status === 'aprovada'
                    ? 'border-green-400'
                    : foto.status === 'rejeitada'
                      ? 'border-red-400'
                      : 'border-yellow-400'
                }`}
              >
                <img
                  src={foto.url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-1 right-1 rounded-full p-1 ${
                  foto.status === 'aprovada'
                    ? 'bg-green-500'
                    : foto.status === 'rejeitada'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                }`}>
                  {foto.status === 'aprovada' ? (
                    <CheckCircle size={12} className="text-white" />
                  ) : foto.status === 'rejeitada' ? (
                    <XCircle size={12} className="text-white" />
                  ) : (
                    <Clock size={12} className="text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusVistoriaCliente;
