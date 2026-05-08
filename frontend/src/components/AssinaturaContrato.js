import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import {
  FileText,
  Check,
  Download,
  Edit,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

const AssinaturaContrato = ({ cotacaoData, clienteData, onComplete, onBack }) => {
  const { user, API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [assinaturaFeita, setAssinaturaFeita] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  const sigCanvas = useRef(null);
  const termoRef = useRef(null);

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !scrolledToEnd) {
      setScrolledToEnd(true);
      toast.success('✅ Você leu todo o regulamento!');
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setAssinaturaFeita(false);
  };

  const handleSignatureEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setAssinaturaFeita(true);
    }
  };

  const downloadPDF = async () => {
    try {
      // Gerar PDF do regulamento
      const response = await axios.get(
        'https://customer-assets.emergentagent.com/job_labelview-fix/artifacts/lsexc5rd_Regulamento%20do%20Programa%20de%20Socorro%20Mu%CC%81tuo%20-%20Labelview%20%284%29.pdf',
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Regulamento_Labelview_PSM.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const handleFinalizar = async () => {
    if (!termoAceito) {
      toast.error('Você precisa aceitar os termos do contrato');
      return;
    }

    if (!assinaturaFeita || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, assine o contrato');
      return;
    }

    setLoading(true);
    try {
      // Capturar assinatura como base64
      const assinaturaBase64 = sigCanvas.current.toDataURL('image/png');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/protecao/salvar-assinatura`,
        {
          cliente_id: clienteData.id || user.id,
          cotacao_id: cotacaoData.id,
          assinatura_digital: assinaturaBase64,
          termos_aceitos: true,
          termos_versao: 'v1.0',
          nome_cliente: clienteData.nomeCondutor || user.full_name,
          cidade: clienteData.city || user.city,
          estado: clienteData.state || user.state,
          data_assinatura: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('✅ Contrato assinado com sucesso!');
        onComplete({
          assinatura_url: assinaturaBase64,
          contrato_aceito: true
        });
      }
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      toast.error('Erro ao salvar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText size={28} />
              <div>
                <div>Contrato de Proteção Veicular</div>
                <p className="text-sm text-white/90 mt-1">
                  Leia atentamente e assine digitalmente
                </p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Visualizador do Regulamento */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} className="text-[#1a59ad]" />
                Regulamento do Programa de Socorro Mútuo
              </CardTitle>
              <Button
                onClick={downloadPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={termoRef}
              onScroll={handleScroll}
              className="h-[400px] overflow-y-scroll p-6 bg-white"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="prose prose-sm max-w-none">
                <iframe
                  src="https://customer-assets.emergentagent.com/job_labelview-fix/artifacts/lsexc5rd_Regulamento%20do%20Programa%20de%20Socorro%20Mu%CC%81tuo%20-%20Labelview%20%284%29.pdf"
                  className="w-full h-[600px] border-0"
                  title="Regulamento Labelview"
                />
              </div>
            </div>

            {/* Indicador de Scroll */}
            {!scrolledToEnd && (
              <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Role até o final do documento para poder aceitar os termos
                </p>
              </div>
            )}

            {/* Checkbox de Aceite */}
            <div className="p-6 bg-gray-50 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termoAceito}
                  onChange={(e) => setTermoAceito(e.target.checked)}
                  disabled={!scrolledToEnd}
                  className="mt-1 w-5 h-5 text-[#2fa31c] rounded focus:ring-2 focus:ring-[#2fa31c]"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    Li e aceito os termos do Regulamento do Programa de Socorro Mútuo
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Declaro que li todo o regulamento e concordo com todas as condições estabelecidas
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Assinatura Digital */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Edit size={20} className="text-[#2fa31c]" />
              Assinatura Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Texto do Termo */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <p className="text-base leading-relaxed text-gray-800">
                Eu, <strong>{clienteData.nomeCondutor || user.full_name}</strong>, aceito fazer parte do sistema de mutualismo da empresa{' '}
                <strong>LABELVIEW ASSOCIAÇÃO MUTUALISTA DE PROTEÇÃO VEICULAR</strong>, conforme regulamento apresentado.
              </p>
              <div className="mt-4 pt-4 border-t border-blue-300 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-semibold text-gray-900">{dataAtual}</p>
                </div>
                <div>
                  <span className="text-gray-600">Local:</span>
                  <p className="font-semibold text-gray-900">
                    {clienteData.city || user.city}/{clienteData.state || user.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Canvas de Assinatura */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Assine abaixo com o mouse ou dedo (touch):
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-48 rounded-lg',
                    style: { touchAction: 'none' }
                  }}
                  onEnd={handleSignatureEnd}
                />
                {!assinaturaFeita && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-400 text-sm">Assine aqui</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Limpar Assinatura
                </Button>
                {assinaturaFeita && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    Assinatura capturada
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Navegação */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-8"
            disabled={loading}
          >
            Voltar
          </Button>

          <Button
            onClick={handleFinalizar}
            disabled={!termoAceito || !assinaturaFeita || loading}
            className="bg-[#2fa31c] hover:bg-[#25881a] px-8 text-lg"
          >
            {loading ? (
              'Salvando...'
            ) : (
              <>
                <Check size={20} className="mr-2" />
                Finalizar e Assinar Contrato
              </>
            )}
          </Button>
        </div>

        {/* Informações Importantes */}
        <Card className="shadow-md border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Informações Importantes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>O plano tem duração de <strong>12 meses</strong></li>
                  <li>Primeira parcela vence na data escolhida por você</li>
                  <li>Valores conforme plano aceito anteriormente</li>
                  <li>Assinatura digital tem validade jurídica</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssinaturaContrato;
