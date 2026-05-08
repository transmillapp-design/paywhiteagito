import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Check, AlertCircle, User, Car, FileText, CreditCard, Calendar, CheckCircle, Eye, EyeOff, Lock, Gift, QrCode, Download, ExternalLink, Camera, Shield, Clock } from 'lucide-react';
import { getApiUrl } from '../config/api';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';

const ContinuarContratacao = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const API = getApiUrl();
  
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [indicador, setIndicador] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados dos formulários - Dados para conta Transmill
  const [dadosContaForm, setDadosContaForm] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: '',
    profissao: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    // Senha para conta Transmill
    senha: '',
    confirmar_senha: ''
  });
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  // Datas de vencimento da Unidade
  const [datasVencimento, setDatasVencimento] = useState([]);
  const [dataVencimentoSelecionada, setDataVencimentoSelecionada] = useState('');
  const [loadingDatas, setLoadingDatas] = useState(true);
  
  // Contrato e Manual
  const [manualPdfUrl, setManualPdfUrl] = useState('');
  const [liEAceitei, setLiEAceitei] = useState(false);
  const [assinaturaUrl, setAssinaturaUrl] = useState('');
  const signatureRef = useRef(null);
  
  // Pagamento e Cupom
  const [taxaAdesao, setTaxaAdesao] = useState(350);
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomValidado, setCupomValidado] = useState(null);
  const [desconto, setDesconto] = useState(0);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [qrCodePix, setQrCodePix] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [gerandoQrCode, setGerandoQrCode] = useState(false);
  const [qrCodeGerado, setQrCodeGerado] = useState(false);
  const [indicadorNome, setIndicadorNome] = useState('');
  
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [pagamentoRealizado, setPagamentoRealizado] = useState(false);
  const [numeroContrato, setNumeroContrato] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);
  
  const steps = [
    { id: 0, nome: 'Dados Pessoais', icon: User },
    { id: 1, nome: 'Vencimento', icon: Calendar },
    { id: 2, nome: 'Contrato', icon: FileText },
    { id: 3, nome: 'Pagamento', icon: CreditCard },
    { id: 4, nome: 'Concluído', icon: CheckCircle }
  ];

  // Carregar dados do cliente pelo slug
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Buscar cliente
        const response = await axios.get(`${API}/labelview/continuar-contratacao/${slug}`);
        
        if (response.data.success) {
          const clienteData = response.data.cliente;
          setCliente(clienteData);
          setIndicador(response.data.indicador);
          setManualPdfUrl(response.data.manual_pdf_url || '');
          setTaxaAdesao(response.data.taxa_adesao || 150);
          
          // 🔧 Usar datas de vencimento retornadas pelo backend
          if (response.data.datas_vencimento?.length > 0) {
            setDatasVencimento(response.data.datas_vencimento);
            console.log('📅 Datas de vencimento da unidade:', response.data.datas_vencimento);
          } else {
            setDatasVencimento([5, 10, 15, 20, 25]); // Fallback
          }
          
          // Preencher form com dados existentes
          setDadosContaForm(prev => ({
            ...prev,
            nome_completo: clienteData.nome || '',
            cpf: clienteData.cpf || '',
            email: clienteData.email || '',
            telefone: clienteData.telefone || ''
          }));
          
          // Gerar dados PIX do indicador
          if (response.data.indicador?.chave_pix) {
            setChavePix(response.data.indicador.chave_pix);
          }
        } else {
          setError('Cliente não encontrado ou link inválido');
        }
      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        setError('Erro ao carregar dados. Verifique se o link está correto.');
      } finally {
        setLoading(false);
        setLoadingDatas(false);
      }
    };

    if (slug) {
      carregarDados();
    }
  }, [slug, API]);

  // Validar cupom de desconto
  const validarCupom = async () => {
    if (!cupomCodigo.trim()) {
      toast.error('Digite o código do cupom');
      return;
    }

    setValidandoCupom(true);
    try {
      const response = await axios.post(`${API}/labelview/cupons/validar`, {
        codigo: cupomCodigo.toUpperCase(),
        cliente_cpf: cliente.cpf
      });

      if (response.data.success) {
        setCupomValidado(response.data.cupom);
        setDesconto(response.data.cupom.percentual);
        toast.success(`🎉 Cupom válido! Desconto de ${response.data.cupom.percentual}%`);
      } else {
        setCupomValidado(null);
        setDesconto(0);
        toast.error(response.data.message || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setCupomValidado(null);
      setDesconto(0);
      toast.error('Cupom inválido ou expirado');
    } finally {
      setValidandoCupom(false);
    }
  };

  // Calcular valor final
  const valorFinal = taxaAdesao - (taxaAdesao * desconto / 100);

  // Gerar QR Code PIX via XGate (depósito na conta do indicador)
  const gerarQRCodePixXgate = async () => {
    if (valorFinal <= 0) {
      toast.info('Taxa de adesão gratuita!');
      return;
    }
    
    if (!cliente?.id) {
      toast.error('Cliente não identificado');
      return;
    }
    
    setGerandoQrCode(true);
    
    try {
      const response = await axios.post(`${API}/labelview/gerar-qrcode-adesao/${cliente.id}`, {
        valor: valorFinal,
        cupom_codigo: cupomValidado?.codigo || null,
        desconto_percentual: desconto
      });
      
      if (response.data.success) {
        setQrCodePix(response.data.qr_code || '');
        setQrCodeBase64(response.data.qr_code_base64 || '');
        setPixKey(response.data.pix_key || '');
        setIndicadorNome(response.data.indicador_nome || indicador?.nome || '');
        setQrCodeGerado(true);
        toast.success('QR Code PIX gerado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error(error.response?.data?.detail || 'Erro ao gerar QR Code PIX');
    } finally {
      setGerandoQrCode(false);
    }
  };

  // Função antiga removida - não usar mais gerarQRCodePix manual

  // Limpar assinatura
  const limparAssinatura = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setAssinaturaUrl('');
    }
  };

  // Salvar assinatura
  const salvarAssinatura = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      setAssinaturaUrl(dataUrl);
      toast.success('Assinatura salva!');
      return true;
    } else {
      toast.error('Por favor, assine o contrato');
      return false;
    }
  };

  // Finalizar contratação
  const finalizarContratacao = async () => {
    setProcessandoPagamento(true);
    
    try {
      const response = await axios.post(`${API}/labelview/finalizar-contratacao/${cliente.id}`, {
        dados_conta: dadosContaForm,
        data_vencimento: dataVencimentoSelecionada,
        assinatura_url: assinaturaUrl,
        cupom_usado: cupomValidado?.codigo || null,
        desconto_aplicado: desconto,
        valor_pago: valorFinal,
        indicador_id: indicador?.id
      });

      if (response.data.success) {
        setPagamentoRealizado(true);
        setNumeroContrato(response.data.numero_contrato || '');
        setCurrentStep(4);
        toast.success('🎉 Contratação finalizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Erro ao finalizar contratação');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  // Gerar PDF do Resumo da Contratação
  const gerarPdfResumo = async () => {
    setGerandoPdf(true);
    toast.info('Gerando PDF do resumo...');
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      
      // Cores da marca
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
      doc.setFont('helvetica', 'normal');
      doc.text('Proteção Veicular - Resumo da Contratação', pageWidth / 2, 30, { align: 'center' });
      
      yPos = 55;
      
      // Número do Contrato
      doc.setTextColor(...corVerde);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Contrato: ${numeroContrato || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      // Seção: Dados do Cliente
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(...corAzul);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('👤 DADOS DO CLIENTE', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const dadosCliente = [
        ['Nome:', dadosContaForm.nome_completo || cliente?.nome || '-'],
        ['CPF:', dadosContaForm.cpf || cliente?.cpf || '-'],
        ['RG:', dadosContaForm.rg || '-'],
        ['Email:', dadosContaForm.email || cliente?.email || '-'],
        ['Telefone:', dadosContaForm.telefone || cliente?.telefone || '-'],
        ['Endereço:', `${dadosContaForm.endereco || ''}, ${dadosContaForm.numero || ''} - ${dadosContaForm.bairro || ''}`],
        ['Cidade/UF:', `${dadosContaForm.cidade || ''}/${dadosContaForm.estado || ''} - CEP: ${dadosContaForm.cep || ''}`]
      ];
      
      dadosCliente.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 50, yPos);
        yPos += 6;
      });
      
      yPos += 10;
      
      // Seção: Dados do Veículo
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(...corVerde);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('🚗 DADOS DO VEÍCULO', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      const dadosVeiculo = [
        ['Marca/Modelo:', `${cliente?.veiculo_marca || ''} ${cliente?.veiculo_modelo || ''}`],
        ['Ano:', cliente?.veiculo_ano || '-'],
        ['Placa:', cliente?.veiculo_placa || '-'],
        ['Valor FIPE:', `R$ ${Number(cliente?.veiculo_valor_fipe || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      ];
      
      dadosVeiculo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 55, yPos);
        yPos += 6;
      });
      
      yPos += 10;
      
      // Seção: Plano Contratado
      doc.setFillColor(255, 243, 224);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(180, 120, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('📦 PLANO CONTRATADO', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Plano:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente?.plano_nome || 'Plano Base', 55, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corVerde);
      doc.setFontSize(14);
      doc.text(`Valor Mensal: R$ ${Number(cliente?.plano_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPos);
      yPos += 8;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Vencimento:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Todo dia ${dataVencimentoSelecionada}`, 55, yPos);
      yPos += 8;
      
      // Adicionais
      if (cliente?.adicionais) {
        const adicionaisAtivos = Object.entries(cliente.adicionais)
          .filter(([_, ativo]) => ativo)
          .map(([nome]) => nome.replace(/_/g, ' ').charAt(0).toUpperCase() + nome.replace(/_/g, ' ').slice(1));
        
        if (adicionaisAtivos.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Adicionais:', 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(adicionaisAtivos.join(', '), 55, yPos);
          yPos += 8;
        }
      }
      
      yPos += 10;
      
      // Seção: Taxa de Adesão
      doc.setFillColor(220, 255, 220);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(...corVerde);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('💰 TAXA DE ADESÃO', 20, yPos + 3);
      yPos += 15;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Valor Original: R$ ${taxaAdesao.toFixed(2)}`, 20, yPos);
      yPos += 6;
      
      if (desconto > 0) {
        doc.text(`Desconto: -${desconto}%`, 20, yPos);
        yPos += 6;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corVerde);
      doc.setFontSize(14);
      doc.text(`Valor Pago: R$ ${valorFinal.toFixed(2)}`, 20, yPos);
      yPos += 6;
      
      doc.setTextColor(0, 150, 0);
      doc.setFontSize(10);
      doc.text('✅ PAGO', 75, yPos - 6);
      
      yPos += 15;
      
      // Assinatura (se houver)
      if (assinaturaUrl) {
        doc.setFillColor(245, 230, 255);
        doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
        doc.setTextColor(128, 0, 128);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('✍️ ASSINATURA DIGITAL', 20, yPos + 3);
        yPos += 15;
        
        try {
          doc.addImage(assinaturaUrl, 'PNG', 20, yPos, 80, 30);
          yPos += 35;
        } catch (e) {
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(10);
          doc.text('Assinatura digital registrada no sistema', 20, yPos);
          yPos += 10;
        }
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(`Assinado digitalmente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPos);
      }
      
      // Nova página para vistoria (se houver fotos)
      if (cliente?.fotos_vistoria && Object.keys(cliente.fotos_vistoria).length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📷 FOTOS DA VISTORIA', 20, yPos + 3);
        yPos += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de ${Object.keys(cliente.fotos_vistoria).length} imagens enviadas na vistoria`, 20, yPos);
        yPos += 10;
        
        Object.entries(cliente.fotos_vistoria).forEach(([nome, url]) => {
          if (url) {
            doc.text(`• ${nome}`, 20, yPos);
            yPos += 6;
          }
        });
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('As imagens completas podem ser visualizadas no sistema Labelview.', 20, yPos + 10);
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount} | LABELVIEW Proteção Veicular | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Salvar PDF
      doc.save(`Contrato_Labelview_${cliente?.nome?.replace(/\s+/g, '_') || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('📄 PDF salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // Validar step atual
  const validarStep = () => {
    if (currentStep === 0) {
      if (!dadosContaForm.nome_completo || !dadosContaForm.cpf || !dadosContaForm.data_nascimento) {
        toast.error('Preencha nome, CPF e data de nascimento');
        return false;
      }
      if (!dadosContaForm.senha || dadosContaForm.senha.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
      if (dadosContaForm.senha !== dadosContaForm.confirmar_senha) {
        toast.error('As senhas não conferem');
        return false;
      }
    }
    if (currentStep === 1) {
      if (!dataVencimentoSelecionada) {
        toast.error('Selecione uma data de vencimento');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!liEAceitei) {
        toast.error('Você precisa ler e aceitar o Manual do Mutualismo');
        return false;
      }
      if (!assinaturaUrl) {
        return salvarAssinatura();
      }
    }
    return true;
  };

  const proximoStep = () => {
    if (validarStep()) {
      if (currentStep === 3) {
        // Se desconto for 100%, finaliza direto
        if (desconto === 100) {
          finalizarContratacao();
        } else {
          // Em produção: verificar pagamento PIX
          finalizarContratacao();
        }
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a59ad] to-[#2fa31c] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a59ad] to-[#2fa31c] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="bg-[#1a59ad]">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3dcda] to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">✅ Vistoria Aprovada!</h1>
          <p className="text-white/80">
            Olá {cliente?.nome}, finalize sua contratação e crie sua conta Transmill.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                currentStep >= step.id 
                  ? 'bg-[#2fa31c] text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
              </div>
              <span className={`text-xs text-center ${
                currentStep >= step.id ? 'text-[#1a59ad] font-semibold' : 'text-gray-500'
              }`}>
                {step.nome}
              </span>
            </div>
          ))}
        </div>

        {/* Conteúdo do Step */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Step 0: Dados Pessoais + Conta Transmill */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-[#1a59ad] p-4 rounded">
                  <h2 className="text-lg font-bold text-[#1a59ad] mb-1">📝 Dados para sua Conta Transmill</h2>
                  <p className="text-sm text-gray-600">
                    Esses dados serão usados para criar sua conta no Transmill, onde você poderá acessar suas faturas e efetuar pagamentos.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={dadosContaForm.nome_completo}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, nome_completo: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                    <input
                      type="text"
                      value={dadosContaForm.cpf}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                    <input
                      type="text"
                      value={dadosContaForm.rg}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, rg: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento *</label>
                    <input
                      type="date"
                      value={dadosContaForm.data_nascimento}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, data_nascimento: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={dadosContaForm.email}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                    <input
                      type="tel"
                      value={dadosContaForm.telefone}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, telefone: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                    <input
                      type="text"
                      value={dadosContaForm.profissao}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, profissao: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                    <select
                      value={dadosContaForm.estado_civil}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, estado_civil: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-3">📍 Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={dadosContaForm.cep}
                      onChange={async (e) => {
                        const cep = e.target.value.replace(/\D/g, '');
                        setDadosContaForm({...dadosContaForm, cep: cep});
                        
                        // Buscar CEP quando tiver 8 dígitos
                        if (cep.length === 8) {
                          try {
                            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                            const data = await response.json();
                            if (!data.erro) {
                              setDadosContaForm(prev => ({
                                ...prev,
                                endereco: data.logradouro || '',
                                bairro: data.bairro || '',
                                cidade: data.localidade || '',
                                estado: data.uf || '',
                                cep: cep
                              }));
                              toast.success('CEP encontrado!');
                            } else {
                              toast.error('CEP não encontrado');
                            }
                          } catch (err) {
                            console.error('Erro ao buscar CEP:', err);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                      placeholder="00000000"
                      maxLength={8}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={dadosContaForm.endereco}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, endereco: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={dadosContaForm.numero}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, numero: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={dadosContaForm.complemento}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, complemento: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={dadosContaForm.bairro}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, bairro: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={dadosContaForm.cidade}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, cidade: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={dadosContaForm.estado}
                      onChange={(e) => setDadosContaForm({...dadosContaForm, estado: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none"
                    >
                      <option value="">UF</option>
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                    </select>
                  </div>
                </div>

                {/* Senha para conta Transmill */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-[#1a59ad] mb-4 flex items-center gap-2">
                    <Lock size={20} />
                    Crie sua Senha de Acesso ao Transmill
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                      <div className="relative">
                        <input
                          type={showSenha ? 'text' : 'password'}
                          value={dadosContaForm.senha}
                          onChange={(e) => setDadosContaForm({...dadosContaForm, senha: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none pr-12"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                      <div className="relative">
                        <input
                          type={showConfirmarSenha ? 'text' : 'password'}
                          value={dadosContaForm.confirmar_senha}
                          onChange={(e) => setDadosContaForm({...dadosContaForm, confirmar_senha: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1a59ad] focus:outline-none pr-12"
                          placeholder="Repita a senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Vencimento */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#1a59ad] mb-4">📅 Escolha a Data de Vencimento</h2>
                <p className="text-gray-600 mb-4">
                  Selecione o melhor dia para vencimento da sua mensalidade:
                </p>
                
                {loadingDatas ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-[#1a59ad] border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-500">Carregando datas disponíveis...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {datasVencimento.map(dia => (
                      <button
                        key={dia}
                        onClick={() => setDataVencimentoSelecionada(dia.toString())}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          dataVencimentoSelecionada === dia.toString()
                            ? 'border-[#2fa31c] bg-[#2fa31c]/10 text-[#2fa31c]'
                            : 'border-gray-300 hover:border-[#1a59ad] hover:bg-[#1a59ad]/5'
                        }`}
                      >
                        <p className="text-3xl font-bold">{dia}</p>
                        <p className="text-sm">de cada mês</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Contrato */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#1a59ad] mb-4">📄 Leia e Assine o Contrato</h2>
                
                {/* Dados da Labelview */}
                <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
                  <h3 className="font-bold text-[#1a59ad] mb-2">🏢 LABELVIEW - PROTEÇÃO VEICULAR</h3>
                  <p className="text-sm text-gray-700">
                    Associação Mutualista de Proteção Veicular, entidade privada sem fins lucrativos, 
                    com base legal na Constituição Federal (Art. 5º, XVII e XVIII) e no Código Civil (Art. 53 a 61).
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    A LABELVIEW não é uma seguradora, opera com sistema de socorro mútuo baseado na união dos associados.
                  </p>
                </div>

                {/* Regulamento do Programa de Socorro Mútuo */}
                <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <FileText size={20} />
                    Regulamento do Programa de Socorro Mútuo (PSM) - LABELVIEW
                  </h3>
                  
                  <div className="space-y-3">
                    <a
                      href="https://customer-assets.emergentagent.com/job_update-vistoria/artifacts/un99pvjq_Regulamento%20do%20Programa%20de%20Socorro%20Mu%CC%81tuo%20-%20Labelview%20%284%29.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#1a59ad] text-white px-4 py-2 rounded-lg hover:bg-[#1a59ad]/80"
                    >
                      <Eye size={18} />
                      📄 Visualizar Regulamento Completo (PDF)
                    </a>
                    <p className="text-sm text-yellow-700">
                      <strong>⚠️ IMPORTANTE:</strong> É obrigatório ler o regulamento antes de prosseguir.
                    </p>
                  </div>

                  {/* Resumo dos principais pontos */}
                  <div className="bg-white p-4 rounded mt-4 max-h-48 overflow-y-auto text-sm text-gray-700">
                    <h4 className="font-semibold mb-2 text-yellow-800">📋 Resumo dos Principais Pontos:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Natureza:</strong> Sistema de socorro mútuo entre associados (não é seguro)</li>
                      <li><strong>Rateio:</strong> Os prejuízos são apurados mensalmente e rateados entre todos os associados</li>
                      <li><strong>Participação:</strong> Varia de 6% a 10% do valor FIPE em caso de acionamento</li>
                      <li><strong>Eventos cobertos:</strong> Roubo, furto, colisão, capotamento, incêndio, eventos naturais</li>
                      <li><strong>Início dos benefícios:</strong> 00:00h do dia útil seguinte à vistoria e pagamento</li>
                      <li><strong>Taxa mensal:</strong> Taxa administrativa + rateio variável, reajustada anualmente pelo IPCA</li>
                      <li><strong>Obrigações:</strong> Manter veículo em bom estado, informar alterações, colaborar na recuperação de prejuízos</li>
                    </ul>
                  </div>
                  
                  <label className="flex items-center gap-3 mt-4 cursor-pointer bg-white p-3 rounded-lg border-2 border-yellow-300">
                    <input
                      type="checkbox"
                      checked={liEAceitei}
                      onChange={(e) => setLiEAceitei(e.target.checked)}
                      className="w-6 h-6 rounded border-yellow-500 text-[#2fa31c] focus:ring-[#2fa31c]"
                    />
                    <span className="font-semibold text-yellow-800">
                      ✅ Li e aceito integralmente o Regulamento do Programa de Socorro Mútuo da LABELVIEW
                    </span>
                  </label>
                </div>

                {/* TERMO DE ADESÃO */}
                <div className="bg-green-50 border-2 border-green-400 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-3">📜 TERMO DE ADESÃO AO PROGRAMA DE SOCORRO MÚTUO</h3>
                  
                  <div className="bg-white p-4 rounded text-sm text-gray-700 space-y-3 max-h-96 overflow-y-auto">
                    <p className="text-center font-bold text-[#1a59ad]">
                      LABELVIEW - ASSOCIAÇÃO MUTUALISTA DE PROTEÇÃO VEICULAR
                    </p>
                    <p className="text-center text-xs text-gray-500">
                      Entidade privada sem fins lucrativos, com base legal na Constituição Federal e Código Civil
                    </p>
                    
                    <hr className="my-3" />
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="font-bold text-[#1a59ad] mb-2">👤 DADOS DO ASSOCIADO</h4>
                      <p>
                        <strong>Nome:</strong> {dadosContaForm.nome_completo || cliente?.nome}<br/>
                        <strong>CPF:</strong> {dadosContaForm.cpf || cliente?.cpf}<br/>
                        <strong>RG:</strong> {dadosContaForm.rg || '-'}<br/>
                        <strong>Email:</strong> {dadosContaForm.email || cliente?.email}<br/>
                        <strong>Telefone:</strong> {dadosContaForm.telefone || cliente?.telefone}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="font-bold text-green-700 mb-2">🚗 VEÍCULO PROTEGIDO</h4>
                      <p>
                        <strong>Veículo:</strong> {cliente?.veiculo_marca} {cliente?.veiculo_modelo}<br/>
                        <strong>Ano:</strong> {cliente?.veiculo_ano}<br/>
                        <strong>Placa:</strong> {cliente?.veiculo_placa}<br/>
                        <strong>Valor FIPE:</strong> R$ {Number(cliente?.veiculo_valor_fipe || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-400">
                      <h4 className="font-bold text-yellow-800 mb-2">📦 PLANO CONTRATADO</h4>
                      <p className="text-lg">
                        <strong>Plano:</strong> {cliente?.plano_nome || 'Plano Base'}<br/>
                        <strong className="text-2xl text-green-600">Valor Mensal: R$ {Number(cliente?.plano_valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                      </p>
                      
                      {cliente?.adicionais && Object.keys(cliente.adicionais).filter(k => cliente.adicionais[k]).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                          <p className="font-semibold text-yellow-800">➕ Adicionais Contratados:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {cliente.adicionais.carro_reserva && <li>Carro Reserva</li>}
                            {cliente.adicionais.assistencia_24h && <li>Assistência 24h</li>}
                            {cliente.adicionais.vidros && <li>Proteção de Vidros</li>}
                            {cliente.adicionais.terceiros && <li>Danos a Terceiros</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded border-2 border-purple-400">
                      <h4 className="font-bold text-purple-800 mb-2">📅 12 PARCELAS - VENCIMENTO DIA {dataVencimentoSelecionada}</h4>
                      <p className="text-sm text-purple-700 mb-2">
                        ⚠️ Tenha saldo na sua Carteira Transmill para quitar cada parcela na data de vencimento.
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {[...Array(12)].map((_, i) => {
                          const hoje = new Date();
                          const dataVenc = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, parseInt(dataVencimentoSelecionada) || 10);
                          return (
                            <div key={i} className="bg-white p-2 rounded text-center text-xs border">
                              <p className="font-bold text-purple-700">Parcela {i + 1}</p>
                              <p>{dataVenc.toLocaleDateString('pt-BR')}</p>
                              <p className="text-green-600 font-semibold">R$ {Number(cliente?.plano_valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <hr className="my-3" />
                    
                    <p className="text-justify">
                      Pelo presente instrumento, declaro que <strong>li e compreendi integralmente o Regulamento 
                      do Programa de Socorro Mútuo (PSM) da LABELVIEW</strong>, estando ciente de que:
                    </p>
                    
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>A LABELVIEW não é uma seguradora, mas uma associação mutualista de proteção veicular;</li>
                      <li>Os prejuízos são rateados mensalmente entre todos os associados participantes;</li>
                      <li>Comprometo-me a contribuir com as cotas necessárias para as despesas apuradas;</li>
                      <li>Em caso de acionamento, terei participação de 6% a 10% do valor FIPE do veículo;</li>
                      <li>Devo manter o veículo em bom estado e informar quaisquer alterações;</li>
                      <li>Os benefícios iniciam às 00:00h do dia útil seguinte à aprovação da vistoria e pagamento da adesão.</li>
                    </ul>
                    
                    <p className="text-center font-semibold mt-4">
                      Local e Data: _______________, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Resumo Visual */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#1a59ad] mb-3">📋 Dados da Contratação</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Cliente:</strong> {cliente?.nome}</p>
                    <p><strong>CPF:</strong> {cliente?.cpf}</p>
                    <p><strong>Veículo:</strong> {cliente?.veiculo_marca} {cliente?.veiculo_modelo}</p>
                    <p><strong>Ano:</strong> {cliente?.veiculo_ano}</p>
                    <p><strong>Placa:</strong> {cliente?.veiculo_placa}</p>
                    <p><strong>Plano:</strong> {cliente?.plano_nome}</p>
                    <p><strong>Vencimento:</strong> Dia {dataVencimentoSelecionada}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Área de Assinatura */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ✍️ Sua Assinatura Digital (assine abaixo como concordância ao Termo de Adesão)
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg bg-white">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        width: 600,
                        height: 200,
                        className: 'w-full rounded-lg'
                      }}
                      backgroundColor="white"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={limparAssinatura} variant="outline" className="flex-1">
                      🗑️ Limpar
                    </Button>
                    <Button onClick={salvarAssinatura} className="flex-1 bg-[#2fa31c]">
                      ✅ Confirmar Assinatura
                    </Button>
                  </div>
                  {assinaturaUrl && (
                    <p className="text-green-600 text-sm mt-2 text-center">✓ Assinatura digital salva com sucesso</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Pagamento */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[#1a59ad] mb-4">💳 Pagamento da Taxa de Adesão</h2>
                
                {/* Valor da Taxa */}
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl text-center border-2 border-[#1a59ad]">
                  <p className="text-gray-600 mb-2 text-lg">Taxa de Adesão</p>
                  {desconto > 0 && (
                    <p className="text-gray-400 line-through text-xl">R$ {taxaAdesao.toFixed(2)}</p>
                  )}
                  <p className="text-5xl font-bold text-[#1a59ad]">
                    R$ {valorFinal.toFixed(2)}
                  </p>
                  {desconto > 0 && (
                    <Badge className="bg-green-500 text-white mt-2 text-lg px-4 py-1">
                      🎉 {desconto}% de desconto aplicado
                    </Badge>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    O valor será depositado na conta de <strong>{indicador?.nome || 'seu indicador'}</strong>
                  </p>
                </div>

                {/* Cupom de Desconto */}
                <div className="bg-purple-50 border-2 border-purple-300 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Gift size={20} />
                    Tem cupom de desconto?
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cupomCodigo}
                      onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                      placeholder="DIGITE O CÓDIGO DO CUPOM"
                      className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none uppercase text-center font-mono text-lg"
                      disabled={qrCodeGerado}
                    />
                    <Button
                      onClick={validarCupom}
                      disabled={validandoCupom || qrCodeGerado}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                    >
                      {validandoCupom ? '⏳' : '🎁 Aplicar'}
                    </Button>
                  </div>
                  {cupomValidado && (
                    <p className="mt-2 text-green-600 font-semibold">
                      ✅ Cupom "{cupomValidado.codigo}" aplicado - {cupomValidado.percentual}% de desconto!
                    </p>
                  )}
                </div>

                {/* QR Code ou Botão para Gerar */}
                {valorFinal > 0 ? (
                  <div className="bg-white border-2 border-[#1a59ad] p-6 rounded-xl text-center">
                    {!qrCodeGerado ? (
                      <>
                        {/* Botão para gerar QR Code */}
                        <div className="space-y-4">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <QrCode size={40} className="text-[#1a59ad]" />
                          </div>
                          <h3 className="text-xl font-bold text-[#1a59ad]">
                            Gerar QR Code PIX
                          </h3>
                          <p className="text-gray-600">
                            Clique no botão abaixo para gerar o QR Code PIX.<br/>
                            O pagamento será depositado diretamente na conta do seu indicador.
                          </p>
                          <Button
                            onClick={gerarQRCodePixXgate}
                            disabled={gerandoQrCode}
                            className="bg-[#2fa31c] hover:bg-[#268f17] text-white px-8 py-4 text-lg font-bold"
                          >
                            {gerandoQrCode ? (
                              <>
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Gerando QR Code...
                              </>
                            ) : (
                              <>
                                <QrCode size={24} className="mr-2" />
                                Gerar QR Code PIX
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* QR Code Gerado */}
                        <h3 className="font-semibold text-[#1a59ad] mb-4 flex items-center justify-center gap-2">
                          <QrCode size={24} />
                          Pague via PIX
                        </h3>
                        
                        <div className="bg-white p-4 rounded-lg inline-block mb-4 border-2 border-green-300">
                          {qrCodeBase64 ? (
                            <img 
                              src={`data:image/png;base64,${qrCodeBase64}`} 
                              alt="QR Code PIX" 
                              className="w-52 h-52 mx-auto"
                            />
                          ) : qrCodePix ? (
                            <QRCodeSVG
                              value={qrCodePix}
                              size={200}
                              level="M"
                              includeMargin={true}
                            />
                          ) : (
                            <div className="w-52 h-52 flex items-center justify-center bg-gray-100 rounded">
                              <p className="text-gray-500">QR Code</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Valor a pagar:</p>
                            <p className="text-2xl font-bold text-[#2fa31c]">R$ {valorFinal.toFixed(2)}</p>
                          </div>
                          
                          {pixKey && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Ou copie a chave PIX:</p>
                              <div className="flex items-center justify-center gap-2">
                                <code className="bg-white px-3 py-2 rounded text-sm border max-w-xs truncate">
                                  {pixKey}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixKey);
                                    toast.success('Chave PIX copiada!');
                                  }}
                                >
                                  📋 Copiar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-500">
                            Beneficiário: <strong>{indicadorNome || indicador?.nome || 'Indicador'}</strong>
                          </p>
                          
                          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                            ⚠️ Após efetuar o pagamento, clique em <strong>"Confirmar Pagamento"</strong> para finalizar sua contratação.
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-400 p-6 rounded-xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gift size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">
                      🎉 Adesão Gratuita!
                    </h3>
                    <p className="text-green-600">
                      Você ganhou 100% de desconto na taxa de adesão!<br/>
                      Clique em "Finalizar" para ativar sua proteção.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Resumo Completo da Contratação */}
            {currentStep === 4 && (
              <div className="py-4" id="resumo-contratacao">
                {/* Header de Sucesso */}
                <div className="w-24 h-24 bg-gradient-to-br from-[#2fa31c] to-[#1a59ad] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#2fa31c] mb-2 text-center">🎉 Parabéns!</h2>
                <p className="text-lg text-gray-700 mb-2 text-center">
                  Sua proteção veicular foi ativada e sua conta Transmill foi criada!
                </p>
                
                {/* Número do Contrato */}
                {numeroContrato && (
                  <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-3 rounded-lg text-center mb-6">
                    <p className="text-sm opacity-80">Número do Contrato</p>
                    <p className="text-2xl font-bold">{numeroContrato}</p>
                  </div>
                )}
                
                {/* Resumo Completo */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6 shadow-lg">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-xl text-[#1a59ad]">📋 RESUMO COMPLETO DA CONTRATAÇÃO</h3>
                    <Badge className="bg-green-500 text-white">ATIVO</Badge>
                  </div>
                  
                  {/* Seção 1: Dados do Cliente */}
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-[#1a59ad]">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-[#1a59ad]" size={20} />
                      <h4 className="font-bold text-blue-800">DADOS DO CLIENTE</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Nome Completo</p>
                        <p className="font-semibold text-gray-800">{dadosContaForm.nome_completo || cliente?.nome || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">CPF</p>
                        <p className="font-semibold text-gray-800">{dadosContaForm.cpf || cliente?.cpf || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">RG</p>
                        <p className="font-semibold text-gray-800">{dadosContaForm.rg || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Data de Nascimento</p>
                        <p className="font-semibold text-gray-800">{dadosContaForm.data_nascimento || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Email</p>
                        <p className="font-semibold text-gray-800 truncate">{dadosContaForm.email || cliente?.email || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Telefone</p>
                        <p className="font-semibold text-gray-800">{dadosContaForm.telefone || cliente?.telefone || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded md:col-span-2 lg:col-span-3">
                        <p className="text-gray-500 text-xs uppercase">Endereço Completo</p>
                        <p className="font-semibold text-gray-800">
                          {dadosContaForm.endereco ? `${dadosContaForm.endereco}, ${dadosContaForm.numero || 'S/N'}${dadosContaForm.complemento ? ` - ${dadosContaForm.complemento}` : ''} - ${dadosContaForm.bairro || ''}, ${dadosContaForm.cidade || ''}/${dadosContaForm.estado || ''} - CEP: ${dadosContaForm.cep || ''}` : 'Não informado'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seção 2: Dados do Veículo */}
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-[#2fa31c]">
                    <div className="flex items-center gap-2 mb-3">
                      <Car className="text-[#2fa31c]" size={20} />
                      <h4 className="font-bold text-green-800">DADOS DO VEÍCULO PROTEGIDO</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Marca</p>
                        <p className="font-semibold text-gray-800">{cliente?.veiculo_marca || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Modelo</p>
                        <p className="font-semibold text-gray-800">{cliente?.veiculo_modelo || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Ano</p>
                        <p className="font-semibold text-gray-800">{cliente?.veiculo_ano || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Placa</p>
                        <p className="font-bold text-lg text-gray-800">{cliente?.veiculo_placa || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded col-span-2">
                        <p className="text-gray-500 text-xs uppercase">Valor Tabela FIPE</p>
                        <p className="font-bold text-xl text-[#1a59ad]">R$ {Number(cliente?.veiculo_valor_fipe || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                      {cliente?.veiculo_chassi && (
                        <div className="bg-white p-3 rounded col-span-2">
                          <p className="text-gray-500 text-xs uppercase">Chassi</p>
                          <p className="font-mono text-gray-800">{cliente?.veiculo_chassi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Seção 3: Plano e Adicionais */}
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 border-2 border-yellow-300">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="text-yellow-600" size={20} />
                      <h4 className="font-bold text-yellow-800">PLANO E COBERTURAS CONTRATADAS</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="bg-white p-3 rounded col-span-2">
                        <p className="text-gray-500 text-xs uppercase">Plano</p>
                        <p className="font-bold text-xl text-[#1a59ad]">{cliente?.plano_nome || 'Plano Base'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded">
                        <p className="text-gray-600 text-xs uppercase">Valor Mensal</p>
                        <p className="font-bold text-2xl text-[#2fa31c]">R$ {Number(cliente?.plano_valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Vencimento</p>
                        <p className="font-bold text-xl text-gray-800">Dia {dataVencimentoSelecionada}</p>
                      </div>
                    </div>
                    
                    {/* Adicionais Contratados */}
                    {cliente?.adicionais && Object.keys(cliente.adicionais).filter(k => cliente.adicionais[k]).length > 0 && (
                      <div className="bg-white p-3 rounded mb-4">
                        <p className="text-gray-500 text-xs uppercase mb-2">➕ Adicionais Contratados</p>
                        <div className="flex flex-wrap gap-2">
                          {cliente.adicionais.carro_reserva && <Badge className="bg-blue-100 text-blue-800">🚗 Carro Reserva</Badge>}
                          {cliente.adicionais.assistencia_24h && <Badge className="bg-green-100 text-green-800">🚑 Assistência 24h</Badge>}
                          {cliente.adicionais.vidros && <Badge className="bg-purple-100 text-purple-800">🪟 Proteção de Vidros</Badge>}
                          {cliente.adicionais.terceiros && <Badge className="bg-orange-100 text-orange-800">🛡️ Danos a Terceiros</Badge>}
                          {cliente.adicionais.colisao && <Badge className="bg-red-100 text-red-800">💥 Colisão</Badge>}
                        </div>
                      </div>
                    )}
                    
                    {/* Calendário de 12 Parcelas */}
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="text-purple-600" size={18} />
                        <p className="font-semibold text-purple-800">📅 Suas 12 Parcelas</p>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {[...Array(12)].map((_, i) => {
                          const hoje = new Date();
                          const dataVenc = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, parseInt(dataVencimentoSelecionada) || 10);
                          return (
                            <div key={i} className={`p-2 rounded text-center text-xs border ${i === 0 ? 'border-[#2fa31c] bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                              <p className="font-bold text-purple-700">{i + 1}ª</p>
                              <p className="text-gray-600">{dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                              <p className="text-[#2fa31c] font-semibold">R$ {Number(cliente?.plano_valor || 0).toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-red-600 mt-3 text-center bg-red-50 p-2 rounded">
                        ⚠️ Mantenha saldo na sua Carteira Transmill para débito automático das parcelas
                      </p>
                    </div>
                  </div>
                  
                  {/* Seção 4: Fotos da Vistoria */}
                  {cliente?.fotos_vistoria && Object.keys(cliente.fotos_vistoria).filter(k => cliente.fotos_vistoria[k]).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                      <div className="flex items-center gap-2 mb-3">
                        <Camera className="text-gray-600" size={20} />
                        <h4 className="font-bold text-gray-800">FOTOS DA VISTORIA ({Object.keys(cliente.fotos_vistoria).filter(k => cliente.fotos_vistoria[k]).length} imagens)</h4>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {Object.entries(cliente.fotos_vistoria).map(([key, url]) => (
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
                      <p className="text-xs text-gray-500 mt-2 text-center">Clique nas imagens para visualizar em tamanho completo</p>
                    </div>
                  )}
                  
                  {/* Seção 5: Contrato Assinado */}
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 border-2 border-purple-300">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="text-purple-600" size={20} />
                      <h4 className="font-bold text-purple-800">CONTRATO ASSINADO DIGITALMENTE</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-500 text-xs uppercase">Documento</p>
                          <p className="font-semibold text-gray-800">Termo de Adesão ao Programa de Socorro Mútuo - LABELVIEW</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-500 text-xs uppercase">Número do Contrato</p>
                          <p className="font-bold text-[#1a59ad]">{numeroContrato || 'Pendente'}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-500 text-xs uppercase">Data/Hora da Assinatura</p>
                          <p className="font-semibold text-gray-800">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                        {liEAceitei && (
                          <div className="bg-green-100 p-3 rounded flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={18} />
                            <p className="text-sm text-green-800 font-semibold">Regulamento do PSM lido e aceito</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Assinatura Digital */}
                      {assinaturaUrl && (
                        <div className="bg-white p-4 rounded border-2 border-dashed border-purple-300">
                          <p className="text-purple-600 text-xs uppercase mb-2 font-semibold">✍️ Assinatura Digital do Contratante</p>
                          <img 
                            src={assinaturaUrl} 
                            alt="Assinatura Digital" 
                            className="max-h-24 mx-auto object-contain"
                          />
                          <p className="text-xs text-gray-500 text-center mt-2">
                            {dadosContaForm.nome_completo || cliente?.nome}
                          </p>
                          <p className="text-xs text-gray-400 text-center">
                            CPF: {dadosContaForm.cpf || cliente?.cpf}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Seção 6: Taxa de Adesão Paga */}
                  <div className="bg-green-100 p-4 rounded-lg border-l-4 border-[#2fa31c]">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="text-[#2fa31c]" size={20} />
                      <h4 className="font-bold text-green-800">TAXA DE ADESÃO</h4>
                      <Badge className="bg-green-500 text-white ml-auto">✅ PAGO</Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="text-gray-500 text-xs uppercase">Valor Original</p>
                        <p className="font-semibold text-gray-800">R$ {taxaAdesao.toFixed(2)}</p>
                      </div>
                      {desconto > 0 && (
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-500 text-xs uppercase">Desconto Aplicado</p>
                          <p className="font-semibold text-green-600">-{desconto}%</p>
                        </div>
                      )}
                      <div className="bg-gradient-to-br from-green-200 to-green-300 p-3 rounded">
                        <p className="text-green-800 text-xs uppercase font-semibold">Valor Pago</p>
                        <p className="font-bold text-2xl text-green-800">R$ {valorFinal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card de Acesso ao Transmill */}
                <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] p-6 rounded-xl max-w-2xl mx-auto mt-6 text-white shadow-xl">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <ExternalLink size={24} />
                    </div>
                    <h4 className="font-bold text-2xl">Acesse sua Conta Transmill</h4>
                  </div>
                  <p className="text-center text-white/90 mb-4">
                    No menu <strong>"Proteção Veicular"</strong> você verá suas parcelas, status da proteção e poderá gerenciar tudo.
                  </p>
                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <p className="text-sm text-center text-white/80 mb-2">Suas credenciais de acesso:</p>
                    <div className="flex flex-col md:flex-row justify-center gap-4 text-center">
                      <div>
                        <p className="text-xs text-white/60">Login</p>
                        <p className="font-bold">{dadosContaForm.email || cliente?.email}</p>
                      </div>
                      <div className="hidden md:block text-white/30">|</div>
                      <div>
                        <p className="text-xs text-white/60">Senha</p>
                        <p className="font-bold">A que você criou</p>
                      </div>
                    </div>
                  </div>
                  <a 
                    href="https://app.transmill.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-white text-[#1a59ad] font-bold py-4 px-6 rounded-lg text-center hover:bg-gray-100 transition text-lg shadow-lg"
                  >
                    🚀 Acessar app.transmill.com.br
                  </a>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
                  <Button
                    onClick={gerarPdfResumo}
                    disabled={gerandoPdf}
                    className="bg-gray-700 hover:bg-gray-800 text-white py-4 px-8 text-lg flex items-center gap-2"
                  >
                    {gerandoPdf ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        📄 Salvar Resumo em PDF
                      </>
                    )}
                  </Button>
                  <a 
                    href="https://app.transmill.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#2fa31c] hover:bg-[#248a17] text-white py-4 px-8 rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ExternalLink size={20} />
                    🚀 Ir para o Transmill
                  </a>
                </div>
                
                {/* Mensagem Final */}
                <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    📧 Uma cópia deste resumo foi enviada para <strong>{dadosContaForm.email || cliente?.email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Em caso de dúvidas, entre em contato com seu consultor ou acesse o suporte no app.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Navegação */}
        {currentStep < 4 && (
          <div className="flex gap-4">
            {currentStep > 0 && (
              <Button
                onClick={() => setCurrentStep(prev => prev - 1)}
                variant="outline"
                className="flex-1 border-[#1a59ad] text-[#1a59ad]"
              >
                ← Voltar
              </Button>
            )}
            <Button
              onClick={proximoStep}
              disabled={processandoPagamento || (currentStep === 2 && (!liEAceitei || !assinaturaUrl)) || (currentStep === 3 && valorFinal > 0 && !qrCodeGerado)}
              className="flex-1 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white py-4 text-lg"
            >
              {processandoPagamento ? '⏳ Processando...' : 
               currentStep === 3 ? (valorFinal > 0 ? (qrCodeGerado ? '✅ Confirmar Pagamento' : '⚠️ Gere o QR Code primeiro') : '✅ Finalizar') : 
               currentStep === 2 ? (assinaturaUrl ? 'Próximo →' : '⚠️ Assine primeiro') : 'Próximo →'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuarContratacao;
