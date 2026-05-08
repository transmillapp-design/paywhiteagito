import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Camera,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

const VistoriaAprovacaoMaster = ({ clienteId, clienteNome, onClose, onAprovacaoCompleta }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vistoria, setVistoria] = useState(null);
  const [modelos, setModelos] = useState({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  useEffect(() => {
    buscarVistoria();
  }, [clienteId]);

  const buscarVistoria = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/vistorias/by-cliente/${clienteId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setVistoria(response.data.vistoria);
        setModelos(response.data.modelos_referencia || {});
      } else {
        toast.error(response.data.message || 'Vistoria não encontrada');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao buscar vistoria:', error);
      toast.error('Erro ao carregar vistoria');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarFoto = async () => {
    try {
      // Atualizar estado local apenas (a aprovação completa salva tudo)
      const novaVistoria = { ...vistoria };
      novaVistoria.fotos[currentPhotoIndex].status = 'aprovada';
      setVistoria(novaVistoria);

      toast.success('Foto aprovada!');

      // Avançar automaticamente
      if (currentPhotoIndex < vistoria.fotos.length - 1) {
        setTimeout(() => {
          setCurrentPhotoIndex(currentPhotoIndex + 1);
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao aprovar foto:', error);
      toast.error('Erro ao aprovar foto');
    }
  };

  const handleRejeitarFoto = async () => {
    if (!motivoRejeicao.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      // Atualizar estado local
      const novaVistoria = { ...vistoria };
      novaVistoria.fotos[currentPhotoIndex].status = 'rejeitada';
      novaVistoria.fotos[currentPhotoIndex].motivo_rejeicao = motivoRejeicao;
      setVistoria(novaVistoria);

      toast.success('Foto rejeitada');
      setShowRejectModal(false);
      setMotivoRejeicao('');
    } catch (error) {
      console.error('Erro ao rejeitar foto:', error);
      toast.error('Erro ao rejeitar foto');
    }
  };

  const handleAprovarVistoriaCompleta = async () => {
    try {
      const token = localStorage.getItem('token');

      // Usar o endpoint correto do labelview
      const response = await axios.patch(
        `${API}/labelview/vistorias/${vistoria.id}/aprovar`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('✅ Vistoria aprovada completamente!');
        if (onAprovacaoCompleta) {
          onAprovacaoCompleta();
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro ao aprovar vistoria:', error);
      toast.error(error.response?.data?.detail || 'Erro ao aprovar vistoria');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2fa31c] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vistoria...</p>
        </div>
      </div>
    );
  }

  if (!vistoria || !vistoria.fotos) {
    return (
      <div className="text-center p-8">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Nenhuma vistoria encontrada para este cliente</p>
      </div>
    );
  }

  const fotoAtual = vistoria.fotos[currentPhotoIndex];
  const totalFotos = vistoria.fotos.length;
  const fotosAprovadas = vistoria.fotos.filter(f => f.status === 'aprovada').length;
  const fotosRejeitadas = vistoria.fotos.filter(f => f.status === 'rejeitada').length;
  const todasAprovadas = fotosAprovadas === totalFotos;
  const progress = (fotosAprovadas / totalFotos) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Camera size={28} />
                Aprovação de Vistoria - {clienteNome}
              </h2>
              <p className="text-sm text-white/90 mt-1">
                Foto {currentPhotoIndex + 1} de {totalFotos}
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" className="text-white hover:bg-white/20">
              <X size={24} />
            </Button>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>{fotosAprovadas} aprovadas</span>
              <span>{Math.round(progress)}%</span>
              <span>{fotosRejeitadas} rejeitadas</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Tipo da Foto */}
          <Card>
            <CardHeader className="py-3 bg-gray-50">
              <CardTitle className="text-lg">{fotoAtual.tipo_foto}</CardTitle>
            </CardHeader>
          </Card>

          {/* Grid Comparativo */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Modelo de Referência */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#1a59ad]">
                <ImageIcon size={18} />
                Foto Modelo
              </h3>
              <div className="relative border-2 border-dashed border-[#1a59ad] rounded-lg p-4 bg-blue-50 h-80">
                {fotoAtual.tipo_foto.includes('CNH Frente') && modelos.cnh_frente ? (
                  <img src={modelos.cnh_frente} alt="Modelo CNH Frente" className="w-full h-full object-contain rounded" />
                ) : fotoAtual.tipo_foto.includes('CNH Verso') && modelos.cnh_verso ? (
                  <img src={modelos.cnh_verso} alt="Modelo CNH Verso" className="w-full h-full object-contain rounded" />
                ) : fotoAtual.tipo_foto.includes('Comprovante') && modelos.comprovante ? (
                  <img src={modelos.comprovante} alt="Modelo Comprovante" className="w-full h-full object-contain rounded" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} />
                    <p className="mt-2 text-sm">Sem modelo cadastrado</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-[#1a59ad] text-white px-2 py-1 rounded-full text-xs font-medium">
                  Referência
                </div>
              </div>
            </div>

            {/* Foto Enviada pelo Cliente */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#2fa31c]">
                <Camera size={18} />
                Foto do Cliente
              </h3>
              <div className="relative border-2 rounded-lg overflow-hidden h-80">
                <img
                  src={fotoAtual.url}
                  alt={fotoAtual.tipo_foto}
                  className="w-full h-full object-cover"
                />
                {fotoAtual.status && (
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                    fotoAtual.status === 'aprovada' ? 'bg-green-500 text-white' :
                    fotoAtual.status === 'rejeitada' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {fotoAtual.status === 'aprovada' ? '✅ Aprovada' :
                     fotoAtual.status === 'rejeitada' ? '❌ Rejeitada' :
                     '⏳ Pendente'}
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                Ações
              </h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${
                  fotoAtual.status === 'aprovada' ? 'bg-green-50 border-green-200' :
                  fotoAtual.status === 'rejeitada' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-sm font-medium mb-2">Status Atual:</p>
                  <p className="text-lg font-bold">
                    {fotoAtual.status === 'aprovada' ? '✅ Aprovada' :
                     fotoAtual.status === 'rejeitada' ? '❌ Rejeitada' :
                     '⏳ Aguardando Análise'}
                  </p>
                  {fotoAtual.motivo_rejeicao && (
                    <p className="text-xs text-red-600 mt-2">
                      Motivo: {fotoAtual.motivo_rejeicao}
                    </p>
                  )}
                </div>

                {fotoAtual.status !== 'aprovada' && (
                  <Button
                    onClick={handleAprovarFoto}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check size={18} className="mr-2" />
                    Aprovar Foto
                  </Button>
                )}

                {fotoAtual.status !== 'rejeitada' && (
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <X size={18} className="mr-2" />
                    Rejeitar Foto
                  </Button>
                )}

                <Button
                  onClick={() => window.open(fotoAtual.url, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <Eye size={18} className="mr-2" />
                  Ver em Tamanho Real
                </Button>
              </div>
            </div>
          </div>

          {/* Navegação */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
              disabled={currentPhotoIndex === 0}
              variant="outline"
            >
              <ChevronLeft size={20} className="mr-2" />
              Anterior
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {fotosAprovadas} de {totalFotos} fotos aprovadas
              </p>
            </div>

            {currentPhotoIndex < totalFotos - 1 ? (
              <Button
                onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                className="bg-[#2fa31c] hover:bg-[#25881a]"
              >
                Próxima
                <ChevronRight size={20} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleAprovarVistoriaCompleta}
                disabled={!todasAprovadas}
                className="bg-[#2fa31c] hover:bg-[#25881a] px-8"
              >
                <Check size={20} className="mr-2" />
                Aprovar Vistoria Completa
              </Button>
            )}
          </div>

          {/* Grid de Miniaturas */}
          <Card>
            <CardHeader className="py-3 bg-gray-50">
              <CardTitle className="text-sm">Todas as Fotos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {vistoria.fotos.map((foto, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                      currentPhotoIndex === index
                        ? 'border-[#2fa31c] ring-2 ring-[#2fa31c] ring-offset-2'
                        : foto.status === 'aprovada'
                          ? 'border-green-300'
                          : foto.status === 'rejeitada'
                            ? 'border-red-300'
                            : 'border-gray-300'
                    }`}
                  >
                    <img src={foto.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    {foto.status === 'aprovada' && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                    {foto.status === 'rejeitada' && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <X size={16} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-0.5 text-center">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Rejeição */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <MessageSquare size={20} />
                  Motivo da Rejeição
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <textarea
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowRejectModal(false);
                      setMotivoRejeicao('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRejeitarFoto}
                    variant="destructive"
                    className="flex-1"
                  >
                    Confirmar Rejeição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistoriaAprovacaoMaster;
