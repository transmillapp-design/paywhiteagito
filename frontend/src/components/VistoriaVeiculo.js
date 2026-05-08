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
  FileText,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Eye
} from 'lucide-react';

const VistoriaVeiculo = ({ cotacaoId, tipoVeiculoId, onComplete, onBack }) => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [modelosFotos, setModelosFotos] = useState([]);
  const [modeloCNHFrente, setModeloCNHFrente] = useState(null);
  const [modeloCNHVerso, setModeloCNHVerso] = useState(null);
  const [modeloComprovante, setModeloComprovante] = useState(null);
  const [modeloDUT, setModeloDUT] = useState(null);
  const [fotosEnviadas, setFotosEnviadas] = useState([]);
  const [vistoriaId, setVistoriaId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Buscar modelos de fotos do tipo de veículo
  useEffect(() => {
    if (tipoVeiculoId) {
      buscarModelosFotos();
    }
    buscarModelosDocumentos();
  }, [tipoVeiculoId]);

  const buscarModelosFotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/tipos-veiculos/${tipoVeiculoId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data && response.data.imagens_vistoria) {
        setModelosFotos(response.data.imagens_vistoria);
        // Inicializar array de fotos enviadas
        const fotosInit = response.data.imagens_vistoria.map(() => null);
        // Adicionar slots para CNH Frente, CNH Verso, Comprovante e DUT
        fotosInit.push(null, null, null, null);
        setFotosEnviadas(fotosInit);
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      toast.error('Erro ao carregar modelos de fotos');
    }
  };

  const buscarModelosDocumentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/modelos-documentos`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data) {
        setModeloCNHFrente(response.data.modelo_cnh_frente);
        setModeloCNHVerso(response.data.modelo_cnh_verso);
        setModeloComprovante(response.data.modelo_comprovante);
        setModeloDUT(response.data.modelo_dut);
      }
    } catch (error) {
      console.error('Erro ao buscar modelos de documentos:', error);
    }
  };

  const handleCapturarFoto = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Salvar no estado
        const novasFotos = [...fotosEnviadas];
        novasFotos[currentPhotoIndex] = base64Image;
        setFotosEnviadas(novasFotos);

        // Enviar para backend
        const token = localStorage.getItem('token');
        await axios.post(
          `${API}/protecao/vistoria/upload-foto`,
          {
            vistoria_id: vistoriaId || cotacaoId,
            foto_index: currentPhotoIndex,
            foto_base64: base64Image,
            tipo_foto: currentPhotoIndex < modelosFotos.length 
              ? modelosFotos[currentPhotoIndex].nome_campo 
              : currentPhotoIndex === modelosFotos.length 
                ? 'CNH Frente'
                : currentPhotoIndex === modelosFotos.length + 1
                  ? 'CNH Verso'
                  : 'Comprovante de Endereço'
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        toast.success('Foto enviada com sucesso!');
        
        // Avançar automaticamente para próxima foto
        if (currentPhotoIndex < totalFotos - 1) {
          setTimeout(() => {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
          }, 1000);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      toast.error('Erro ao enviar foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const totalFotos = modelosFotos.length + 4; // Fotos do veículo + CNH Frente + CNH Verso + Comprovante + DUT
  const progress = ((fotosEnviadas.filter(f => f !== null).length) / totalFotos) * 100;
  
  const fotoAtual = currentPhotoIndex < modelosFotos.length 
    ? modelosFotos[currentPhotoIndex]
    : currentPhotoIndex === modelosFotos.length
      ? { nome_campo: 'CNH - Frente (Carteira Nacional de Habilitação)', imagem: modeloCNHFrente, instrucao: 'Tire uma foto da frente da sua CNH. Certifique-se de que todos os dados estejam visíveis e legíveis.' }
      : currentPhotoIndex === modelosFotos.length + 1
        ? { nome_campo: 'CNH - Verso (Carteira Nacional de Habilitação)', imagem: modeloCNHVerso, instrucao: 'Tire uma foto do verso da sua CNH. Certifique-se de que todos os dados estejam visíveis e legíveis.' }
        : currentPhotoIndex === modelosFotos.length + 2
          ? { nome_campo: 'Comprovante de Endereço', imagem: modeloComprovante, instrucao: 'Envie uma foto de um comprovante de endereço recente (conta de luz, água, telefone, etc). O endereço deve ser o mesmo informado no cadastro.' }
          : { nome_campo: 'DUT - Documento Único de Transferência', imagem: modeloDUT, instrucao: 'Tire uma foto do DUT do veículo. Certifique-se de que todos os dados do veículo e proprietário estejam visíveis e legíveis.' };

  const todasFotosEnviadas = fotosEnviadas.every(f => f !== null);

  const handleFinalizar = async () => {
    if (!todasFotosEnviadas) {
      toast.error('Envie todas as fotos antes de finalizar');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/protecao/vistoria/${vistoriaId || cotacaoId}/finalizar`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success('✅ Vistoria finalizada com sucesso!');
      toast.info('📧 Você receberá uma notificação quando o Master Labelview aprovar sua vistoria.');
      
      // Aguardar 2 segundos e redirecionar para página de status
      setTimeout(() => {
        window.location.href = '/status-vistoria';
      }, 2000);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Erro ao finalizar vistoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera size={28} />
                <div>
                  <CardTitle className="text-2xl">Vistoria Fotográfica</CardTitle>
                  <p className="text-sm text-white/90 mt-1">
                    Tire fotos do veículo e envie os documentos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{currentPhotoIndex + 1}/{totalFotos}</div>
                <div className="text-xs text-white/80">fotos</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Instruções Gerais */}
        {currentPhotoIndex === 0 && (
          <Card className="mb-6 shadow-md border-l-4 border-[#1a59ad]">
            <CardContent className="p-4">
              <h3 className="font-semibold text-[#1a59ad] mb-3 flex items-center gap-2">
                <AlertCircle size={20} />
                Passo a Passo da Vistoria
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="bg-[#1a59ad] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <p><strong>Fotos do Veículo:</strong> Tire fotos de todos os ângulos solicitados seguindo os exemplos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#1a59ad] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <p><strong>CNH (Frente e Verso):</strong> Envie fotos da sua Carteira Nacional de Habilitação</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#1a59ad] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <p><strong>Comprovante de Residência:</strong> Foto de uma conta recente (luz, água, telefone, etc)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#1a59ad] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                  <p><strong>DUT:</strong> Documento Único de Transferência do veículo com dados visíveis</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Importante:</strong> Todas as fotos devem estar nítidas, bem iluminadas e com dados legíveis. Documentos rasgados, manchados ou ilegíveis podem reprovar sua vistoria.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra de Progresso */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
              <span className="text-sm font-bold text-[#2fa31c]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2fa31c] to-[#25881a] h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center">
              {fotosEnviadas.filter(f => f !== null).length} de {totalFotos} fotos enviadas
            </div>
          </CardContent>
        </Card>

        {/* Card Principal - Captura de Foto */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText size={20} className="text-[#1a59ad]" />
              {fotoAtual?.nome_campo}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Modelo de Referência */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#1a59ad]">
                  <ImageIcon size={18} />
                  Foto Modelo
                </h3>
                <div className="relative border-2 border-dashed border-[#1a59ad] rounded-lg p-4 bg-blue-50">
                  {fotoAtual?.imagem ? (
                    <img
                      src={fotoAtual.imagem}
                      alt="Modelo"
                      className="w-full h-64 object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={48} />
                      <p className="mt-2 text-sm">Nenhum modelo cadastrado</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-[#1a59ad] text-white px-2 py-1 rounded-full text-xs font-medium">
                    Exemplo
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-[#1a59ad] font-semibold mb-2 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>Instrução:</span>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {fotoAtual?.instrucao || 'Siga o exemplo ao lado para garantir uma foto adequada. Certifique-se de que a imagem esteja nítida e bem iluminada.'}
                  </p>
                </div>
              </div>

              {/* Captura da Foto */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#2fa31c]">
                  <Camera size={18} />
                  Sua Foto
                </h3>
                
                {fotosEnviadas[currentPhotoIndex] ? (
                  <div className="relative">
                    <img
                      src={fotosEnviadas[currentPhotoIndex]}
                      alt="Foto enviada"
                      className="w-full h-64 object-cover rounded-lg border-2 border-[#2fa31c]"
                    />
                    <div className="absolute top-2 right-2 bg-[#2fa31c] text-white p-2 rounded-full">
                      <Check size={20} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye size={16} className="mr-2" />
                        Visualizar
                      </Button>
                      <label className="flex-1">
                        <Button
                          as="div"
                          variant="outline"
                          className="w-full cursor-pointer"
                        >
                          <Upload size={16} className="mr-2" />
                          Trocar Foto
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleCapturarFoto}
                          disabled={loading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <label className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-20 h-20 bg-[#2fa31c] rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <Camera size={40} className="text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">
                          Tire a Foto Agora
                        </h4>
                        <p className="text-sm text-gray-500 text-center px-4">
                          Toque para abrir a câmera do seu dispositivo
                        </p>
                        <div className="mt-4 px-6 py-2 bg-[#2fa31c] text-white rounded-full font-medium">
                          Abrir Câmera
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleCapturarFoto}
                        disabled={loading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-6"
            disabled={loading}
          >
            <ChevronLeft size={20} className="mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentPhotoIndex > 0 && (
              <Button
                onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
                variant="outline"
                disabled={loading}
              >
                <ChevronLeft size={20} className="mr-2" />
                Foto Anterior
              </Button>
            )}
            
            {currentPhotoIndex < totalFotos - 1 ? (
              <Button
                onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                disabled={!fotosEnviadas[currentPhotoIndex] || loading}
                className="bg-[#2fa31c] hover:bg-[#25881a]"
              >
                Próxima Foto
                <ChevronRight size={20} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalizar}
                disabled={!todasFotosEnviadas || loading}
                className="bg-[#2fa31c] hover:bg-[#25881a] px-8"
              >
                <Check size={20} className="mr-2" />
                {loading ? 'Finalizando...' : 'Finalizar Vistoria'}
              </Button>
            )}
          </div>
        </div>

        {/* Grid de Miniaturas */}
        <Card className="mt-6 shadow-md">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium">Todas as Fotos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from({ length: totalFotos }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`
                    relative aspect-square rounded-lg border-2 overflow-hidden transition-all
                    ${currentPhotoIndex === index 
                      ? 'border-[#2fa31c] ring-2 ring-[#2fa31c] ring-offset-2' 
                      : fotosEnviadas[index]
                        ? 'border-green-300 hover:border-green-400'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {fotosEnviadas[index] ? (
                    <>
                      <img
                        src={fotosEnviadas[index]}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                        <Check size={20} className="text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Camera size={20} className="text-gray-400" />
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
    </div>
  );
};

export default VistoriaVeiculo;
