import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import jsPDF from 'jspdf';
import { getApiUrl } from '../config/api';
import {
  Shield,
  Calendar,
  DollarSign,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  ArrowLeft,
  User,
  Camera,
  Eye,
  ExternalLink,
  CreditCard,
  Wallet,
  AlertTriangle
} from 'lucide-react';

const MinhaProtecaoLabelview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API = getApiUrl();
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState(null);
  const [pagandoParcela, setPagandoParcela] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [saldoCarteira, setSaldoCarteira] = useState(0);

  useEffect(() => {
    buscarContrato();
    buscarSaldo();
  }, []);

  const buscarContrato = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/meu-contrato`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success && response.data.contrato) {
        setContrato(response.data.contrato);
      }
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarSaldo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/user/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data) {
        setSaldoCarteira(response.data.balance || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    }
  };

  const pagarParcela = async (parcelaId, valor) => {
    if (saldoCarteira < valor) {
      toast.error(`Saldo insuficiente! Você tem R$ ${saldoCarteira.toFixed(2)} e precisa de R$ ${valor.toFixed(2)}`);
      return;
    }

    try {
      setPagandoParcela(parcelaId);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/labelview/pagar-parcela/${parcelaId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Parcela paga com sucesso!');
        setSaldoCarteira(response.data.novo_saldo);
        buscarContrato();
      }
    } catch (error) {
      console.error('Erro ao pagar parcela:', error);
      toast.error(error.response?.data?.detail || 'Erro ao pagar parcela');
    } finally {
      setPagandoParcela(null);
    }
  };

  // Função para gerar PDF do resumo
  const gerarPdfResumo = async () => {
    if (!contrato) return;
    
    setGerandoPdf(true);
    toast.info('Gerando PDF do resumo...');
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      
      const corAzul = [26, 89, 173];
      const corVerde = [47, 163, 28];
      
      // Header
      doc.setFillColor(...corAzul);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LABELVIEW', pageWidth / 2, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Proteção Veicular - Resumo do Contrato', pageWidth / 2, 30, { align: 'center' });
      
      yPos = 55;
      
      // Número do Contrato
      doc.setTextColor(...corVerde);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Contrato: ${contrato.numero_contrato}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      // Dados do Cliente
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(...corAzul);
      doc.setFontSize(12);
      doc.text('DADOS DO CLIENTE', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const cliente = contrato.cliente;
      doc.text(`Nome: ${cliente?.nome || '-'}`, 20, yPos); yPos += 6;
      doc.text(`CPF: ${cliente?.cpf || '-'}`, 20, yPos); yPos += 6;
      doc.text(`Email: ${cliente?.email || '-'}`, 20, yPos); yPos += 6;
      doc.text(`Telefone: ${cliente?.telefone || '-'}`, 20, yPos); yPos += 10;
      
      // Dados do Veículo
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(...corVerde);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO VEÍCULO', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const veiculo = contrato.veiculo;
      doc.text(`Marca/Modelo: ${veiculo?.marca || ''} ${veiculo?.modelo || ''}`, 20, yPos); yPos += 6;
      doc.text(`Ano: ${veiculo?.ano || '-'}`, 20, yPos); yPos += 6;
      doc.text(`Placa: ${veiculo?.placa || '-'}`, 20, yPos); yPos += 6;
      doc.text(`Valor FIPE: R$ ${Number(veiculo?.valor_fipe || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPos); yPos += 10;
      
      // Dados do Plano
      doc.setFillColor(255, 243, 224);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(180, 120, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANO CONTRATADO', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      const plano = contrato.plano;
      doc.text(`Plano: ${plano?.nome || 'Plano Base'}`, 20, yPos); yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corVerde);
      doc.setFontSize(14);
      doc.text(`Valor Mensal: R$ ${Number(plano?.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPos); yPos += 8;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vencimento: Todo dia ${plano?.data_vencimento || 10}`, 20, yPos); yPos += 15;
      
      // Parcelas
      doc.setFillColor(220, 220, 255);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(100, 100, 150);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUAS 12 PARCELAS', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      contrato.parcelas?.forEach((parcela, i) => {
        const dataVenc = new Date(parcela.data_vencimento);
        const status = parcela.status === 'pago' ? '✓ PAGO' : parcela.status === 'vencida' ? '⚠ VENCIDA' : 'Pendente';
        doc.text(`${i + 1}ª Parcela - ${dataVenc.toLocaleDateString('pt-BR')} - R$ ${parcela.valor?.toFixed(2)} - ${status}`, 20, yPos);
        yPos += 5;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `LABELVIEW Proteção Veicular | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      
      doc.save(`Contrato_Labelview_${contrato.cliente?.nome?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
      toast.success('PDF salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGerandoPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2fa31c] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando sua proteção...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Nenhuma Proteção Ativa
              </h2>
              <p className="text-gray-600 mb-6">
                Você ainda não possui um contrato de proteção veicular ativo.
              </p>
              <Button
                onClick={() => navigate('/protecao-veicular')}
                className="bg-[#2fa31c] hover:bg-[#25881a]"
              >
                Contratar Proteção Veicular
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { cliente, veiculo, plano, contrato: contratoInfo, taxa_adesao, parcelas, fotos_vistoria } = contrato;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header com Número do Contrato */}
        <Card className="shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Minha Proteção Veicular</h1>
                  <p className="text-white/90 text-sm mt-1">
                    Contrato: <span className="font-mono font-bold">{contrato.numero_contrato}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`text-sm py-1 px-3 ${contrato.status === 'ativo' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {contrato.status === 'ativo' ? '✅ ATIVO' : '⏳ PENDENTE'}
                </Badge>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Alerta de Saldo */}
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Wallet className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <p className="font-bold text-yellow-800 text-lg">💰 Saldo na Carteira Transmill</p>
                <p className="text-yellow-700 mt-1">
                  As parcelas são debitadas automaticamente da sua carteira no dia do vencimento.
                  <br />
                  <strong className="text-xl">Seu saldo atual: R$ {saldoCarteira.toFixed(2)}</strong>
                </p>
                {saldoCarteira < (plano?.valor_mensal || 0) && (
                  <div className="mt-2 p-2 bg-red-100 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={18} />
                    <span className="text-red-700 text-sm font-semibold">
                      Saldo insuficiente para a próxima parcela! Adicione créditos na sua carteira.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 1: Dados do Cliente */}
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-[#1a59ad]">
              <User size={20} />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Nome Completo</p>
                <p className="font-semibold text-gray-800">{cliente?.nome || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">CPF</p>
                <p className="font-semibold text-gray-800">{cliente?.cpf || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">RG</p>
                <p className="font-semibold text-gray-800">{cliente?.rg || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Email</p>
                <p className="font-semibold text-gray-800 truncate">{cliente?.email || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Telefone</p>
                <p className="font-semibold text-gray-800">{cliente?.telefone || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Data de Nascimento</p>
                <p className="font-semibold text-gray-800">{cliente?.data_nascimento || '-'}</p>
              </div>
              {(cliente?.endereco || cliente?.endereco_completo) && (
                <div className="bg-gray-50 p-3 rounded-lg col-span-2 md:col-span-3">
                  <p className="text-gray-500 text-xs uppercase">Endereço</p>
                  <p className="font-semibold text-gray-800">
                    {cliente?.endereco_completo || `${cliente?.endereco || ''}, ${cliente?.numero || ''} - ${cliente?.bairro || ''}, ${cliente?.cidade || ''}/${cliente?.estado || ''}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Dados do Veículo */}
        <Card className="shadow-lg">
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-[#2fa31c]">
              <Car size={20} />
              Veículo Protegido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Marca</p>
                <p className="font-semibold text-gray-800">{veiculo?.marca || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Modelo</p>
                <p className="font-semibold text-gray-800">{veiculo?.modelo || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Ano</p>
                <p className="font-semibold text-gray-800">{veiculo?.ano || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-xs uppercase">Placa</p>
                <p className="font-bold text-xl text-gray-800">{veiculo?.placa || '-'}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg col-span-2">
                <p className="text-gray-600 text-xs uppercase">Valor Tabela FIPE</p>
                <p className="font-bold text-2xl text-[#1a59ad]">
                  R$ {Number(veiculo?.valor_fipe || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {veiculo?.chassi && (
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <p className="text-gray-500 text-xs uppercase">Chassi</p>
                  <p className="font-mono text-gray-800">{veiculo?.chassi}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Plano e Adicionais */}
        <Card className="shadow-lg border-2 border-yellow-300">
          <CardHeader className="bg-yellow-50 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Shield size={20} />
              Plano Contratado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border col-span-2">
                <p className="text-gray-500 text-xs uppercase">Plano</p>
                <p className="font-bold text-2xl text-[#1a59ad]">{plano?.nome || 'Plano Base'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg">
                <p className="text-green-800 text-xs uppercase">Valor Mensal</p>
                <p className="font-bold text-3xl text-[#2fa31c]">
                  R$ {Number(plano?.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-gray-500 text-xs uppercase">Vencimento</p>
                <p className="font-bold text-2xl text-gray-800">Dia {plano?.data_vencimento || 10}</p>
              </div>
            </div>
            
            {/* Adicionais */}
            {plano?.adicionais && Object.keys(plano.adicionais).filter(k => plano.adicionais[k]).length > 0 && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <p className="text-gray-500 text-xs uppercase mb-2">➕ Adicionais Contratados</p>
                <div className="flex flex-wrap gap-2">
                  {plano.adicionais.carro_reserva && <Badge className="bg-blue-100 text-blue-800">🚗 Carro Reserva</Badge>}
                  {plano.adicionais.assistencia_24h && <Badge className="bg-green-100 text-green-800">🚑 Assistência 24h</Badge>}
                  {plano.adicionais.vidros && <Badge className="bg-purple-100 text-purple-800">🪟 Proteção de Vidros</Badge>}
                  {plano.adicionais.terceiros && <Badge className="bg-orange-100 text-orange-800">🛡️ Danos a Terceiros</Badge>}
                  {plano.adicionais.colisao && <Badge className="bg-red-100 text-red-800">💥 Colisão</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 4: 12 Parcelas */}
        <Card className="shadow-lg">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Calendar size={20} />
              Suas 12 Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Alerta importante */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-bold text-red-800">⚠️ IMPORTANTE: Mantenha saldo na sua Carteira Transmill!</p>
                  <p className="text-red-700 text-sm mt-1">
                    As parcelas são debitadas automaticamente da sua carteira no dia do vencimento.
                    Certifique-se de ter saldo suficiente para evitar inadimplência.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {parcelas?.map((parcela, i) => {
                const dataVenc = new Date(parcela.data_vencimento);
                const isVencida = parcela.status === 'vencida';
                const isPago = parcela.status === 'pago';
                const isProxima = !isPago && !isVencida && i === parcelas.findIndex(p => p.status === 'pendente');
                
                return (
                  <div 
                    key={parcela.id} 
                    className={`p-3 rounded-lg text-center border-2 transition-all ${
                      isPago 
                        ? 'bg-green-50 border-green-400' 
                        : isVencida 
                          ? 'bg-red-50 border-red-400' 
                          : isProxima 
                            ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300' 
                            : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className={`font-bold text-lg ${isPago ? 'text-green-700' : isVencida ? 'text-red-700' : 'text-purple-700'}`}>
                      {i + 1}ª
                    </p>
                    <p className="text-gray-600 text-sm">
                      {dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className={`font-bold ${isPago ? 'text-green-600' : isVencida ? 'text-red-600' : 'text-[#2fa31c]'}`}>
                      R$ {parcela.valor?.toFixed(2)}
                    </p>
                    
                    {isPago ? (
                      <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        <span className="text-xs font-semibold">PAGO</span>
                      </div>
                    ) : isVencida ? (
                      <Button
                        onClick={() => pagarParcela(parcela.id, parcela.valor)}
                        disabled={pagandoParcela === parcela.id}
                        size="sm"
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs w-full"
                      >
                        {pagandoParcela === parcela.id ? '...' : 'Pagar'}
                      </Button>
                    ) : isProxima ? (
                      <Button
                        onClick={() => pagarParcela(parcela.id, parcela.valor)}
                        disabled={pagandoParcela === parcela.id}
                        size="sm"
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs w-full"
                      >
                        {pagandoParcela === parcela.id ? '...' : 'Próxima'}
                      </Button>
                    ) : (
                      <div className="mt-2 flex items-center justify-center gap-1 text-gray-400">
                        <Clock size={14} />
                        <span className="text-xs">Aguard.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Seção 5: Fotos da Vistoria */}
        {fotos_vistoria && Object.keys(fotos_vistoria).filter(k => fotos_vistoria[k]).length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Camera size={20} />
                Fotos da Vistoria ({Object.keys(fotos_vistoria).filter(k => fotos_vistoria[k]).length} imagens)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(fotos_vistoria).map(([key, url]) => (
                  url && (
                    <div key={key} className="relative group cursor-pointer" onClick={() => window.open(url, '_blank')}>
                      <img 
                        src={url} 
                        alt={key} 
                        className="w-full h-20 object-cover rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-white"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Eye className="text-white" size={20} />
                      </div>
                      <p className="text-xs text-center text-gray-600 mt-1 truncate capitalize">{key.replace(/_/g, ' ')}</p>
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção 6: Contrato Assinado */}
        <Card className="shadow-lg border-2 border-purple-300">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <FileText size={20} />
              Contrato Assinado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-gray-500 text-xs uppercase">Documento</p>
                  <p className="font-semibold text-gray-800">Termo de Adesão ao Programa de Socorro Mútuo - LABELVIEW</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-gray-500 text-xs uppercase">Número do Contrato</p>
                  <p className="font-bold text-[#1a59ad] font-mono">{contratoInfo?.numero || contrato.numero_contrato}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-gray-500 text-xs uppercase">Data/Hora da Assinatura</p>
                  <p className="font-semibold text-gray-800">{contratoInfo?.data_assinatura || '-'}</p>
                </div>
                {contratoInfo?.regulamento_aceito && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    <p className="text-sm text-green-800 font-semibold">Regulamento do PSM lido e aceito</p>
                  </div>
                )}
              </div>
              
              {/* Assinatura Digital */}
              {contratoInfo?.assinatura_url && (
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-purple-300">
                  <p className="text-purple-600 text-xs uppercase mb-2 font-semibold">✍️ Assinatura Digital do Contratante</p>
                  <img 
                    src={contratoInfo.assinatura_url} 
                    alt="Assinatura Digital" 
                    className="max-h-24 mx-auto object-contain"
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">{cliente?.nome}</p>
                  <p className="text-xs text-gray-400 text-center">CPF: {cliente?.cpf}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 7: Taxa de Adesão */}
        <Card className="shadow-lg">
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CreditCard size={20} />
              Taxa de Adesão
              <Badge className="bg-green-500 text-white ml-auto">✅ PAGO</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-gray-500 text-xs uppercase">Valor Original</p>
                <p className="font-semibold text-gray-800">R$ {Number(taxa_adesao?.valor_original || 150).toFixed(2)}</p>
              </div>
              {taxa_adesao?.desconto_aplicado > 0 && (
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-gray-500 text-xs uppercase">Desconto Aplicado</p>
                  <p className="font-semibold text-green-600">-{taxa_adesao?.desconto_aplicado}%</p>
                </div>
              )}
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg">
                <p className="text-green-800 text-xs uppercase font-semibold">Valor Pago</p>
                <p className="font-bold text-2xl text-green-700">R$ {Number(taxa_adesao?.valor_pago || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col md:flex-row justify-center gap-4 py-4">
          <Button
            onClick={gerarPdfResumo}
            disabled={gerandoPdf}
            className="bg-gray-700 hover:bg-gray-800 text-white py-3 px-6 flex items-center gap-2"
          >
            {gerandoPdf ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Gerando...
              </>
            ) : (
              <>
                <Download size={20} />
                📄 Salvar Resumo em PDF
              </>
            )}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#1a59ad] hover:bg-[#15478a] text-white py-3 px-6 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Button>
        </div>

      </div>
    </div>
  );
};

export default MinhaProtecaoLabelview;
