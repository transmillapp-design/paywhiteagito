import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import {
  Shield,
  Car,
  FileText,
  Camera,
  PenTool,
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  User,
  MapPin,
  Edit
} from 'lucide-react';

// Componente de Assinatura Digital
const SignatureCanvas = ({ condutorData, setCondutorData }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ajustar tamanho do canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    e.preventDefault(); // Prevenir scroll no mobile
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      setCondutorData({ 
        ...condutorData, 
        assinatura_digital: dataUrl,
        data_assinatura: new Date().toISOString()
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCondutorData({ 
      ...condutorData, 
      assinatura_digital: '',
      data_assinatura: ''
    });
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-400 rounded-lg w-full bg-white cursor-crosshair touch-none"
          style={{ height: '200px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!condutorData.assinatura_digital && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Assine aqui</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <Button
          type="button"
          onClick={clearCanvas}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Limpar Assinatura
        </Button>
        {condutorData.assinatura_digital && (
          <p className="text-xs text-green-600 font-medium">✓ Assinatura capturada</p>
        )}
      </div>
    </div>
  );
};

const CotacaoConsultorLabelview = ({ publicMode = false, vendedorId = null, vendedorData = null }) => {
  const authContext = useAuth();
  const { user: loggedUser, API: authAPI } = authContext || {};
  
  // Usar vendedor do modo público ou usuário logado
  const user = publicMode ? vendedorData : loggedUser;
  const API = authAPI || process.env.REACT_APP_BACKEND_URL || '';
  
  const [currentStep, setCurrentStep] = useState(0); // Começar pelo step do cliente
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [clienteExistente, setClienteExistente] = useState(null); // Para buscar cliente existente
  const [criarNovoCliente, setCriarNovoCliente] = useState(false); // Toggle para criar novo cliente
  const [vendedorIdTracking] = useState(publicMode ? vendedorId : loggedUser?.id); // ID para rastreamento
  
  // Dados do cliente
  const [clienteData, setClienteData] = useState({
    nome: '',
    tipo_pessoa: 'fisica', // fisica ou juridica
    document_type: 'cpf', // cpf ou cnpj
    cpf: '',
    cnpj: '',
    email: '',
    telefone: '',
    company_name: '' // Para pessoa jurídica
  });

  // Dados do veículo (Step 1)
  const [veiculoData, setVeiculoData] = useState({
    tipo_veiculo_id: '',
    tipo_veiculo_nome: '',
    tipo_fipe: '', // carros, motos, caminhoes
    marca: '',
    marca_codigo: '',
    modelo: '',
    modelo_codigo: '',
    ano: '',
    ano_codigo: '',
    placa: '',
    valorFipe: ''
  });

  // Estado para controlar busca por placa
  const [buscandoPorPlaca, setBuscandoPorPlaca] = useState(false);
  const [placaEncontrada, setPlacaEncontrada] = useState(false);

  // ✅ Estados para QR Code PIX e PDF do Regulamento
  const [qrCodePix, setQrCodePix] = useState(null);
  const [dadosPix, setDadosPix] = useState(null);
  const [mostrarRegulamento, setMostrarRegulamento] = useState(false);

  // Estados para os dropdowns FIPE
  const [tiposVeiculo, setTiposVeiculo] = useState([]);
  const [marcasFipe, setMarcasFipe] = useState([]);
  const [modelosFipe, setModelosFipe] = useState([]);
  const [anosFipe, setAnosFipe] = useState([]);

  // Planos disponíveis e complementos (Step 2)
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [complementosDisponiveis, setComplementosDisponiveis] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [complementosSelecionados, setComplementosSelecionados] = useState([]);
  const [valorTotalPlano, setValorTotalPlano] = useState(0);
  
  // Configurações da Unidade (taxa de adesão e vencimentos)
  const [configuracoesUnidade, setConfiguracoesUnidade] = useState({
    taxa_adesao: 0,
    vencimento_inicio: 1,
    vencimento_fim: 15
  });
  const [diaVencimento, setDiaVencimento] = useState(1); // Dia escolhido pelo cliente
  const [nomeUnidade, setNomeUnidade] = useState(''); // Nome da unidade para exibição


  // 🔧 NOVO: IDs para integração CRM
  const [cotacaoTempId] = useState(() => `COT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [crmLeadId, setCrmLeadId] = useState(null);
  const [crmProtecaoId, setCrmProtecaoId] = useState(null);

  // Dados das coberturas (Step 2)
  const [coberturasData, setCoberturasData] = useState({
    rouboFurto: false,
    colisao: false,
    vidros: false,
    assistencia24h: false,
    carroReserva: false,
    danosTerceiros: false
  });

  // Dados da vistoria (Step 4)
  const [fotosVistoria, setFotosVistoria] = useState({
    frente: null,
    traseira: null,
    lateralEsquerda: null,
    lateralDireita: null,
    painel: null,
    motor: null,
    // 🔧 NOVO: Campos adicionais para tipos de veículos com mais fotos
    chassi: null,
    hodometro: null,
    banco_frente: null,
    banco_traseiro: null,
    porta_malas: null,
    roda_dianteira: null,
    roda_traseira: null,
    placa: null,
    vidros: null,
    teto: null
  });
  
  // ✅ Imagens modelo para vistoria (vem do tipo de veículo)
  const [imagensModeloVistoria, setImagensModeloVistoria] = useState([]);
  
  // ✅ Modelos de documentos (CNH, Comprovante, DUT - vem do Master)
  const [modelosDocumentos, setModelosDocumentos] = useState([]);
  
  // ✅ Fotos de documentos enviadas pelo cliente
  const [fotosDocumentos, setFotosDocumentos] = useState({
    cnh_frente: null,
    cnh_verso: null,
    comprovante: null,
    dut: null
  });

  // 🔧 NOVO: Estados para controle de vistoria e aprovação
  const [vistoriaEnviada, setVistoriaEnviada] = useState(false);
  const [vistoriaStatus, setVistoriaStatus] = useState('pendente'); // pendente, enviada, aprovada, reprovada
  const [enviandoVistoria, setEnviandoVistoria] = useState(false);

  // Dados do condutor + Dados completos para cadastro Transmill (Step 5)
  const [condutorData, setCondutorData] = useState({
    // Dados do condutor (originais)
    nomeCondutor: '',
    cpfCondutor: '',
    dataNascimento: '',
    situacao: 'proprio',
    cnh: null,
    idadeCondutor: '',
    
    // Dados obrigatórios para cadastro Transmill
    senha: '',
    confirmarSenha: '',
    telefone: '',
    
    // Dados PIX
    pix_key: '',
    pix_key_type: '',
    
    // Endereço completo
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    
    // Documentos RG
    rg_front: '',
    rg_back: '',
    
    // Regulamento e Assinatura PSM
    regulamento_aceito: false,
    assinatura_digital: '',
    data_assinatura: ''
  });

  useEffect(() => {
    if (currentStep === 1) {
      carregarTiposVeiculo();
    }
    if (currentStep === 2) {
      carregarPlanosEComplementos();
    }
  }, [currentStep]);

  // ✅ Calcular valor total do plano automaticamente
  useEffect(() => {
    if (planoSelecionado) {
      const valorBase = planoSelecionado.custo_mensal || 0;
      const valorComplementos = complementosSelecionados.reduce((total, comp) => {
        return total + (comp.valor || 0);
      }, 0);
      setValorTotalPlano(valorBase + valorComplementos);
    } else {
      setValorTotalPlano(0);
    }
  }, [planoSelecionado, complementosSelecionados]);

  // Carregar configurações da unidade (taxa de adesão e vencimentos)
  useEffect(() => {
    carregarConfiguracoesUnidade();
    carregarModelosDocumentos(); // ✅ Buscar modelos de documentos do Master
  }, []);

  // ✅ Buscar modelos de documentos (CNH, Comprovante, DUT)
  const carregarModelosDocumentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${getApiUrl()}/labelview/modelos-documentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.modelos) {
        console.log('📄 Modelos de documentos carregados:', response.data.modelos);
        setModelosDocumentos(response.data.modelos);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos de documentos:', error);
    }
  };

  const carregarConfiguracoesUnidade = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar unidade_id do usuário ou do vendedor
      let unidadeId = user?.unidade_id;
      
      console.log('🏢 carregarConfiguracoesUnidade - user:', {
        id: user?.id,
        email: user?.email,
        user_type: user?.user_type,
        unidade_id: user?.unidade_id,
        regional_id: user?.regional_id
      });
      
      // Se for Master ou Unidade, usar o próprio ID
      if (user?.user_type === 'labelview_master' || user?.user_type === 'labelview_unidade') {
        unidadeId = user?.id;
      }
      
      // 🔧 Se consultor não tem unidade_id, tentar buscar via regional
      if (!unidadeId && user?.user_type === 'labelview_consultor' && user?.regional_id) {
        console.log('🔍 Consultor sem unidade_id, buscando via regional...');
        try {
          const regionalResponse = await axios.get(
            `${API}/labelview/regionais`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (regionalResponse.data.success) {
            const regional = regionalResponse.data.regionais?.find(r => r.id === user.regional_id);
            if (regional?.unidade_id) {
              unidadeId = regional.unidade_id;
              console.log('✅ Unidade encontrada via regional:', unidadeId);
            }
          }
        } catch (e) {
          console.warn('Erro ao buscar unidade via regional:', e.message);
        }
      }
      
      // 🔧 NOVO: Se consultor foi criado direto pela unidade (sem regional), buscar a unidade vinculada
      if (!unidadeId && user?.user_type === 'labelview_consultor') {
        console.log('🔍 Consultor sem unidade_id e sem regional, buscando unidades disponíveis...');
        try {
          const unidadesResponse = await axios.get(
            `${API}/labelview/unidades`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (unidadesResponse.data.success && unidadesResponse.data.unidades?.length > 0) {
            // Usar a primeira unidade (provavelmente a única que o consultor tem acesso)
            const unidade = unidadesResponse.data.unidades[0];
            unidadeId = unidade.id;
            const nomeFantasia = unidade.nome_fantasia;
            console.log('✅ Unidade encontrada:', nomeFantasia, unidadeId);
            setNomeUnidade(nomeFantasia);
          }
        } catch (e) {
          console.warn('Erro ao buscar unidades:', e.message);
        }
      }
      
      if (!unidadeId) {
        console.warn('⚠️ Unidade ID não encontrado para usuário:', user?.email);
        return;
      }
      
      // Buscar configurações da unidade (endpoint opcional)
      const response = await axios.get(
        `${API}/labelview/configuracoes-unidade/${unidadeId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      if (response.data.success) {
        setConfiguracoesUnidade(response.data.configuracoes);
        // Buscar nome da unidade das configurações
        if (response.data.configuracoes?.nome_fantasia) {
          setNomeUnidade(response.data.configuracoes.nome_fantasia);
          console.log('✅ Nome da unidade das configurações:', response.data.configuracoes.nome_fantasia);
        }
      }
    } catch (error) {
      // Endpoint opcional - continuar com valores padrão se não existir
      if (error.response?.status !== 404) {
        console.warn('Erro ao carregar configurações da unidade:', error.message);
      }
    }
    
    // Buscar nome da unidade separadamente se ainda não tiver
    if (!nomeUnidade) {
      await buscarNomeUnidade();
    }
  };

  // Buscar nome da unidade para exibição
  const buscarNomeUnidade = async () => {
    try {
      const token = localStorage.getItem('token');
      let unidadeId = user?.unidade_id;
      
      console.log('🏢 Buscando nome da unidade:', { unidadeId, userType: user?.user_type });
      
      // Se for Unidade, usar nome_fantasia do próprio usuário
      if (user?.user_type === 'labelview_unidade') {
        const nome = user?.nome_fantasia || user?.full_name || 'Unidade';
        console.log('🏢 Nome da unidade (próprio usuário):', nome);
        setNomeUnidade(nome);
        return;
      }
      
      // Se for Consultor ou Regional, buscar nome da unidade vinculada
      if (unidadeId) {
        const response = await axios.get(
          `${API}/labelview/unidades`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          const unidade = response.data.unidades?.find(u => u.id === unidadeId);
          if (unidade) {
            const nome = unidade.nome_fantasia || unidade.name || unidade.full_name || 'Unidade';
            console.log('🏢 Nome da unidade encontrado:', nome);
            setNomeUnidade(nome);
          } else {
            console.warn('🏢 Unidade não encontrada na lista');
            // Tentar buscar unidade específica
            try {
              const unidadeResponse = await axios.get(
                `${API}/labelview/unidades/${unidadeId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (unidadeResponse.data) {
                const nome = unidadeResponse.data.nome_fantasia || unidadeResponse.data.name || 'Unidade';
                console.log('🏢 Nome da unidade (endpoint específico):', nome);
                setNomeUnidade(nome);
              }
            } catch (e) {
              console.warn('🏢 Erro ao buscar unidade específica:', e.message);
            }
          }
        }
      } else {
        console.warn('🏢 Usuário não tem unidade_id vinculada');
      }
    } catch (error) {
      console.warn('Erro ao buscar nome da unidade:', error.message);
      setNomeUnidade('sua unidade'); // Fallback mais amigável
    }
  };

  const carregarPlanosEComplementos = async () => {
    console.log('📋 carregarPlanosEComplementos - veiculoData:', veiculoData);
    
    if (!veiculoData.tipo_veiculo_id || !veiculoData.valorFipe) {
      console.warn('⚠️ Dados incompletos:', {
        tipo_veiculo_id: veiculoData.tipo_veiculo_id,
        valorFipe: veiculoData.valorFipe
      });
      toast.error('Selecione o veículo completo primeiro');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Converter valor FIPE formatado (R$ 10.655,00) para número (10655.00)
      const valorFipeNumerico = parseFloat(
        veiculoData.valorFipe.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
      );

      const url = `${API}/labelview/planos/para-cotacao?tipo_veiculo_id=${veiculoData.tipo_veiculo_id}&valor_fipe=${valorFipeNumerico}`;
      console.log('🌐 Buscando planos na URL:', url);

      // Buscar planos disponíveis
      const planosResponse = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      console.log('📦 Resposta da API de planos:', planosResponse.data);

      if (planosResponse.data.success && planosResponse.data.plano) {
        // ✅ Backend retorna 1 plano (o correto para a faixa FIPE)
        const plano = planosResponse.data.plano;
        console.log('✅ Plano encontrado:', plano);
        console.log('💰 Valor do plano (custo_mensal):', plano.custo_mensal);
        console.log('💰 Valor base master:', plano.valor_base_master);
        console.log('📊 Percentual aplicado:', plano.percentual);
        
        // ✅ O valor do plano JÁ vem calculado do backend
        // Fórmula: custo_mensal = valor_tabela_master × (1 + percentual_unidade/100)
        
        setPlanosDisponiveis([plano]);
        setPlanoSelecionado(plano);
        
        // ✅ Adicionais/complementos vêm do backend (já com valores calculados)
        const adicionais = planosResponse.data.complementos || plano.adicionais || [];
        console.log('📦 Complementos/Adicionais recebidos:', adicionais);
        
        // ✅ Calcular valor FIPE para os adicionais que não têm valor
        const valorFipeNumerico = parseFloat(
          veiculoData.valorFipe.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
        );
        
        // Formatar adicionais com ID único e valor
        const complementosFormatados = adicionais.map((ad, idx) => {
          const percentual = ad.percentual || 0;
          // Se o adicional já tem valor calculado, usar ele. Senão, calcular pelo percentual × FIPE
          const valorCalculado = ad.valor || ad.custo_mensal || (valorFipeNumerico * percentual / 100);
          
          console.log(`   📦 Adicional ${ad.tipo_cobertura}: ${percentual}% = R$ ${valorCalculado.toFixed(2)}`);
          if (ad.descricao) {
            console.log(`      📝 Descrição: ${ad.descricao.substring(0, 50)}...`);
          }
          if (ad.servicos_inclusos?.servicos?.length > 0) {
            console.log(`      🎁 Serviços: ${ad.servicos_inclusos.servicos.slice(0, 3).join(', ')}...`);
          }
          
          return {
            id: `comp-${idx}`,
            tipo_cobertura: ad.tipo_cobertura,
            percentual: percentual,
            valor: valorCalculado,
            // ✅ Usar descrição do Master ou fallback
            descricao: ad.descricao || `Adicione ${ad.tipo_cobertura} à sua proteção`,
            // ✅ Incluir serviços inclusos
            servicos_inclusos: ad.servicos_inclusos || null
          };
        });
        
        setComplementosDisponiveis(complementosFormatados);
        
        toast.success(`✅ Plano encontrado: ${plano.nome}`);
      } else {
        console.warn('⚠️ Resposta sem plano:', planosResponse.data);
        toast.warning('Nenhum plano disponível para este veículo. Entre em contato.');
        setPlanosDisponiveis([]);
        setComplementosDisponiveis([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      toast.error('Erro ao carregar opções de planos');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNÇÃO: Gerar QR Code PIX para pagamento
  const gerarQrCodePix = async () => {
    try {
      toast.loading('🔄 Gerando QR Code PIX...', { id: 'qrcode-pix' });
      const token = localStorage.getItem('token');
      
      // Determinar origem da cotação
      const origem = user?.user_type === 'user' ? 'transmill' : 'labelview';
      
      const response = await axios.post(
        `${API}/labelview/cotacao/gerar-qrcode-pix`,
        {
          valor: configuracoesUnidade.taxa_adesao,
          cliente_id: clienteData.id || null,
          origem: origem,
          indicador_id: user?.id,
          descricao: 'Taxa de Adesão - Proteção Veicular Labelview'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setQrCodePix(response.data.qr_code);
        setDadosPix(response.data);
        toast.success('✅ QR Code gerado!', { id: 'qrcode-pix' });
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code PIX', { id: 'qrcode-pix' });
    }
  };

  // ✅ NOVA FUNÇÃO: Buscar veículo por placa
  const buscarVeiculoPorPlaca = async (placa) => {
    if (!placa || placa.length < 7) {
      toast.error('Digite uma placa válida (7 caracteres)');
      return;
    }

    try {
      setBuscandoPorPlaca(true);
      setPlacaEncontrada(false);
      const token = localStorage.getItem('token');
      
      toast.loading('🔍 Buscando veículo...', { id: 'busca-placa' });
      
      const response = await axios.get(
        `${API}/protecao/buscar-por-placa/${placa}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('✅ Veículo encontrado!', { id: 'busca-placa' });
        
        // Preencher dados do veículo automaticamente
        setVeiculoData(prev => ({
          ...prev,
          placa: response.data.placa,
          marca: response.data.marca,
          modelo: response.data.modelo,
          ano: response.data.ano_modelo || response.data.ano_fabricacao,
          // Agora precisa buscar valor FIPE com os dados encontrados
        }));
        
        setPlacaEncontrada(true);
        
        // Buscar valor FIPE automaticamente
        // Vai precisar mapear marca/modelo para buscar na tabela FIPE
        toast.info('📊 Buscando valor FIPE...', { duration: 2000 });
        
      } else {
        toast.error(response.data.mensagem || 'Placa não encontrada', { id: 'busca-placa' });
        setPlacaEncontrada(false);
      }
    } catch (error) {
      console.error('Erro ao buscar por placa:', error);
      toast.error('Erro ao buscar veículo. Preencha manualmente.', { id: 'busca-placa' });
      setPlacaEncontrada(false);
    } finally {
      setBuscandoPorPlaca(false);
    }
  };

  const carregarTiposVeiculo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/protecao/tipos-veiculo`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        // ✅ Ordenar tipos na ordem específica para melhor UX
        const ordemPersonalizada = [
          'Aplicativo',
          'Aplicativos', 
          'Carro Leve',
          'Carros Leves',
          'Moto',
          'Motos',
          'SUV/Pickup/Van',
          'SUV',
          'Caminhão',
          'Caminhões'
        ];
        
        const tiposOrdenados = (response.data.tipos || []).sort((a, b) => {
          const indexA = ordemPersonalizada.findIndex(ordem => 
            a.nome?.toLowerCase().includes(ordem.toLowerCase()) || 
            a.categoria?.toLowerCase().includes(ordem.toLowerCase())
          );
          const indexB = ordemPersonalizada.findIndex(ordem => 
            b.nome?.toLowerCase().includes(ordem.toLowerCase()) || 
            b.categoria?.toLowerCase().includes(ordem.toLowerCase())
          );
          
          // Se ambos encontrados, usar ordem
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          // Se só A encontrado, A vem primeiro
          if (indexA !== -1) return -1;
          // Se só B encontrado, B vem primeiro
          if (indexB !== -1) return 1;
          // Se nenhum encontrado, manter ordem alfabética
          return (a.nome || '').localeCompare(b.nome || '');
        });
        
        setTiposVeiculo(tiposOrdenados);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de veículo:', error);
      toast.error('Erro ao carregar tipos de veículo');
    }
  };

  const carregarMarcasFipe = async (tipoFipe) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar Brasil API (gratuita)
      const response = await axios.get(
        `${API}/brasil-api/fipe/marcas/${tipoFipe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // FIPEAPI retorna estrutura: {codigo: "21", nome: "Fiat", valor: "21"}
        // Mapear para formato esperado: {codigo: "21", nome: "Fiat"}
        const marcasFormatadas = (response.data.marcas || []).map(m => ({
          codigo: m.codigo || m.valor,
          nome: m.nome
        }));
        setMarcasFipe(marcasFormatadas);
        toast.success(`${marcasFormatadas.length} marcas carregadas`);
      }
    } catch (error) {
      console.error('Erro ao carregar marcas FIPE:', error);
      toast.error('Erro ao carregar marcas');
      setMarcasFipe([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarModelosFipe = async (tipoFipe, marcaCodigo) => {
    try {
      console.log('📞 Iniciando carregamento de modelos:', { tipoFipe, marcaCodigo });
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = `${API}/brasil-api/fipe/modelos/${tipoFipe}/${marcaCodigo}`;
      console.log('🌐 URL da requisição:', url);
      
      // Usar Brasil API (gratuita)
      const response = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('📦 Resposta recebida:', response.data);
      
      if (response.data.success) {
        // FIPEAPI retorna estrutura: {codigo: "1044", nome: "Corsa Sedan", id_modelo: "1044"}
        const modelosFormatados = (response.data.modelos || []).map(m => ({
          codigo: m.codigo || m.id_modelo,
          nome: m.nome
        }));
        console.log('✅ Modelos formatados:', modelosFormatados.length, 'modelos');
        setModelosFipe(modelosFormatados);
        toast.success(`✅ ${modelosFormatados.length} modelos carregados`);
      } else {
        console.error('❌ API retornou success: false');
        toast.error('Nenhum modelo encontrado para esta marca');
        setModelosFipe([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar modelos FIPE:', error);
      console.error('❌ Detalhes do erro:', error.response?.data || error.message);
      toast.error(`Erro ao carregar modelos: ${error.response?.data?.message || error.message}`);
      setModelosFipe([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarAnosFipe = async (tipoFipe, marcaCodigo, modeloCodigo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar Brasil API (gratuita)
      const response = await axios.get(
        `${API}/brasil-api/fipe/anos/${tipoFipe}/${marcaCodigo}/${modeloCodigo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // FIPEAPI retorna estrutura: {codigo: "1999-1", nome: "1999", combustivel: "Gasolina"}
        const anosFormatados = (response.data.anos || []).map(a => ({
          codigo: a.codigo || a.id,
          nome: a.nome,
          combustivel: a.combustivel || ''
        }));
        setAnosFipe(anosFormatados);
        toast.success(`${anosFormatados.length} anos disponíveis`);
      }
    } catch (error) {
      console.error('Erro ao carregar anos FIPE:', error);
      toast.error('Erro ao carregar anos');
      setAnosFipe([]);
    } finally {
      setLoading(false);
    }
  };

  const buscarValorFipe = async (tipoFipe, marcaCodigo, modeloCodigo, anoCodigo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar Brasil API (gratuita)
      const response = await axios.get(
        `${API}/brasil-api/fipe/valor/${tipoFipe}/${marcaCodigo}/${modeloCodigo}/${anoCodigo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const valor = response.data.valor || '';
        const dados = response.data.dados || {};
        
        setVeiculoData(prev => ({ 
          ...prev, 
          valorFipe: valor,
          marca: dados.marca || prev.marca,
          modelo: dados.modelo || prev.modelo,
          ano: dados.ano_modelo || prev.ano
        }));
        
        toast.success(`💰 Valor FIPE: ${valor}`);
        
        // ✅ CARREGAR PLANOS automaticamente após pegar valor FIPE
        console.log('🔍 Buscando planos disponíveis para o veículo...');
        // Aguardar um pouco para garantir que veiculoData foi atualizado
        setTimeout(() => {
          carregarPlanosEComplementos();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao buscar valor FIPE:', error);
      toast.error('Erro ao buscar valor FIPE');
    } finally {
      setLoading(false);
    }
  };

  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/labelview/planos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPlanos(response.data.planos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos disponíveis');
    } finally {
      setLoading(false);
    }
  };



  // ============================================
  // INTEGRAÇÃO CRM - FUNIL DE VENDAS
  // ============================================

  const criarLeadNoCRM = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/labelview/crm/cotacao-to-lead`,
        {
          nome: clienteData.nome,
          cpf: clienteData.cpf,
          email: clienteData.email,
          telefone: clienteData.telefone,
          cotacao_temp_id: cotacaoTempId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCrmLeadId(response.data.lead.id);
        console.log('✅ Lead criado no CRM:', response.data.lead.id);
      }
    } catch (error) {
      console.error('❌ Erro ao criar lead no CRM:', error);
      // Não bloqueia o fluxo
    }
  };

  const moverParaInteresse = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/labelview/crm/cotacao-to-interesse`,
        {
          cliente_nome: clienteData.nome,
          cliente_cpf: clienteData.cpf,
          cliente_email: clienteData.email,
          cliente_telefone: clienteData.telefone,
          veiculo_tipo: veiculoData.tipo_veiculo_nome,
          veiculo_marca: veiculoData.marca,
          veiculo_modelo: veiculoData.modelo,
          veiculo_ano: veiculoData.ano,
          veiculo_placa: veiculoData.placa,
          veiculo_valor_fipe: veiculoData.valorFipe,
          cotacao_temp_id: cotacaoTempId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCrmProtecaoId(response.data.protecao.id);
        console.log('✅ Movido para INTERESSE no CRM:', response.data.protecao.id);
      }
    } catch (error) {
      console.error('❌ Erro ao mover para interesse:', error);
      // Não bloqueia o fluxo
    }
  };

  const moverParaNegociacao = async () => {
    console.log('📋 moverParaNegociacao chamada');
    console.log('   crmProtecaoId:', crmProtecaoId);
    
    if (!crmProtecaoId) {
      console.warn('⚠️ crmProtecaoId não definido, pulando...');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const adicionaisSelecionados = Object.keys(coberturasData)
        .filter(key => coberturasData[key])
        .map(key => ({
          nome: key,
          ativo: true
        }));

      // 🔧 CORREÇÃO P0: Usar campos consistentes para obter valor do plano
      const valorPlano = planoSelecionado?.custo_mensal || planoSelecionado?.valor_base || planoSelecionado?.valor || 0;
      const nomePlano = planoSelecionado?.nome || planoSelecionado?.tipo_veiculo || 'Plano Base';

      console.log('📤 Enviando para /cotacao-to-negociacao:', {
        plano_nome: nomePlano,
        plano_valor: valorPlano,
        adicionais: adicionaisSelecionados.length,
        valor_total: calcularValorTotal(),
        planoCompleto: planoSelecionado
      });

      const response = await axios.patch(
        `${API}/labelview/crm/cotacao-to-negociacao/${crmProtecaoId}`,
        {
          plano_nome: nomePlano,
          plano_valor: valorPlano,
          adicionais: adicionaisSelecionados,
          valor_total: calcularValorTotal()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Movido para NEGOCIAÇÃO no CRM - Cliente criado:', response.data);
      toast.success('✅ Plano confirmado! Cliente registrado no sistema.');
    } catch (error) {
      console.error('❌ Erro ao mover para negociação:', error);
      toast.error('Erro ao confirmar plano');
      // Não bloqueia o fluxo
    }
  };

  // 🔧 FUNÇÃO PRINCIPAL: Enviar Vistoria para aprovação do Master
  const enviarVistoriaParaAprovacao = async () => {
    // Validar se todas as fotos obrigatórias foram enviadas
    const fotosVeiculoEnviadas = Object.values(fotosVistoria).filter(f => f).length;
    const fotosDocumentosEnviadas = Object.values(fotosDocumentos).filter(f => f).length;
    
    if (fotosVeiculoEnviadas < 4) {
      toast.error('Envie pelo menos 4 fotos do veículo');
      return false;
    }
    
    if (fotosDocumentosEnviadas < 3) {
      toast.error('Envie pelo menos CNH, Comprovante de Residência e DUT');
      return false;
    }

    setEnviandoVistoria(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Preparar dados da vistoria
      // 🔧 CORREÇÃO: Log detalhado das fotos antes de enviar
      console.log('📷 Estado fotosVistoria antes de enviar:', fotosVistoria);
      console.log('📄 Estado fotosDocumentos antes de enviar:', fotosDocumentos);
      
      // Construir objeto de fotos do veículo dinamicamente
      const fotosVeiculoEnvio = {};
      Object.keys(fotosVistoria).forEach(key => {
        if (fotosVistoria[key]) {
          // Converter camelCase para snake_case
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fotosVeiculoEnvio[snakeKey] = fotosVistoria[key];
        }
      });
      
      console.log('📷 Fotos do veículo a enviar:', fotosVeiculoEnvio);
      
      // 🔧 Determinar valor do plano corretamente
      const valorPlano = planoSelecionado?.custo_mensal || planoSelecionado?.valor_base || planoSelecionado?.valor || 0;
      const nomePlano = planoSelecionado?.nome || planoSelecionado?.tipo_veiculo || 'Plano Base';
      
      console.log('📦 Dados do plano:', { 
        nome: nomePlano, 
        valor: valorPlano,
        planoCompleto: planoSelecionado 
      });
      
      const dadosVistoria = {
        // Fotos do veículo - todas as que foram preenchidas
        fotos_veiculo: fotosVeiculoEnvio,
        // Fotos dos documentos
        fotos_documentos: {
          cnh_frente: fotosDocumentos.cnh_frente || null,
          cnh_verso: fotosDocumentos.cnh_verso || null,
          comprovante: fotosDocumentos.comprovante || null,
          dut: fotosDocumentos.dut || null
        },
        // Dados do cliente
        cliente_nome: clienteData.nome,
        cliente_cpf: clienteData.cpf,
        cliente_email: clienteData.email,
        cliente_telefone: clienteData.telefone,
        // Dados do veículo
        veiculo_tipo: veiculoData.tipo_veiculo_nome,
        veiculo_marca: veiculoData.marca,
        veiculo_modelo: veiculoData.modelo,
        veiculo_ano: veiculoData.ano,
        veiculo_placa: veiculoData.placa,
        veiculo_valor_fipe: veiculoData.valorFipe,
        // Plano escolhido - 🔧 CORREÇÃO: Usar valores corretos
        plano_nome: nomePlano,
        plano_valor: valorPlano,
        taxa_adesao: configuracoesUnidade?.taxa_adesao || planoSelecionado?.taxa_adesao || 350,
        tipo_cobertura: planoSelecionado?.coberturas_principais?.[0]?.tipo_cobertura || planoSelecionado?.tipo_cobertura || '',
        adicionais: coberturasData,
        // IDs de referência
        cotacao_temp_id: cotacaoTempId,
        crm_protecao_id: crmProtecaoId
      };

      const response = await axios.post(
        `${API}/labelview/vistoria/enviar`,
        dadosVistoria,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setVistoriaEnviada(true);
        setVistoriaStatus('enviada');
        
        // Mostrar quantas fotos foram enviadas
        const fotosInfo = response.data.fotos_enviadas;
        if (fotosInfo) {
          toast.success(`✅ Vistoria enviada! ${fotosInfo.total} fotos recebidas (${fotosInfo.veiculo} do veículo, ${fotosInfo.documentos} de documentos). Aguarde a aprovação.`);
        } else {
          toast.success('✅ Vistoria enviada! Aguarde a aprovação.');
        }
        
        console.log('✅ Vistoria enviada para aprovação:', response.data);
        console.log('📷 Fotos enviadas:', response.data.fotos_enviadas);
        return true;
      } else {
        toast.error(response.data.message || 'Erro ao enviar vistoria');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar vistoria:', error);
      toast.error('Erro ao enviar vistoria. Tente novamente.');
      return false;
    } finally {
      setEnviandoVistoria(false);
    }
  };

  const moverParaAguardandoAprovacao = async () => {
    if (!crmProtecaoId) return;

    try {
      const token = localStorage.getItem('token');
      const fotosUrls = Object.keys(fotosVistoria)
        .filter(key => fotosVistoria[key])
        .map(key => fotosVistoria[key]);

      await axios.patch(
        `${API}/labelview/crm/cotacao-to-aguardando/${crmProtecaoId}`,
        {
          vistoria_fotos: fotosUrls
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Movido para AGUARDANDO APROVAÇÃO no CRM');
    } catch (error) {
      console.error('❌ Erro ao mover para aguardando aprovação:', error);
      // Não bloqueia o fluxo
    }
  };

  const calcularValorTotal = () => {
    // 🔧 CORREÇÃO P0: Usar campos consistentes para obter valor do plano
    let total = planoSelecionado?.custo_mensal || planoSelecionado?.valor_base || planoSelecionado?.valor || 0;
    // Adicionar valor dos complementos selecionados
    if (complementosSelecionados && complementosSelecionados.length > 0) {
      complementosSelecionados.forEach(comp => {
        total += comp.valor || 0;
      });
    }
    return total;
  };

  const handleNextStep = async () => {
    // Validações por step
    if (currentStep === 0 && !await validarDadosCliente()) return;
    if (currentStep === 1 && !validarDadosVeiculo()) return;
    if (currentStep === 2 && !validarCoberturas()) return;
    if (currentStep === 3) {
      // 🔧 VISTORIA: Validar e verificar status de aprovação
      if (!validarVistoria()) return;
      
      // Se vistoria não foi enviada, não pode prosseguir
      if (!vistoriaEnviada) {
        toast.error('Envie a vistoria antes de prosseguir');
        return;
      }
      
      // Se vistoria foi enviada mas não aprovada, bloquear
      if (vistoriaStatus !== 'aprovada') {
        toast.info('Aguarde a aprovação da vistoria');
        return;
      }
    }
    if (currentStep === 4 && !validarCondutor()) return;

    // 🔧 INTEGRAÇÃO CRM - Avançar no funil conforme steps
    if (currentStep === 0) {
      // Step 0 → 1: CPF digitado → Criar Lead
      await criarLeadNoCRM();
    } else if (currentStep === 1) {
      // Step 1 → 2: Veículo preenchido → Interesse em Proteção
      await moverParaInteresse();
    } else if (currentStep === 2) {
      // Step 2 → 3: Plano escolhido → Negociação em Proteção
      await moverParaNegociacao();
    }
    // Step 3 → 4: Vistoria → Aguardando Aprovação (feito pelo botão enviarVistoriaParaAprovacao)

    if (currentStep === 5) {
      finalizarCotacao();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const buscarClientePorCPF = async (cpf) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/users/buscar-por-cpf?cpf=${cpf}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.user) {
        setClienteExistente(response.data.user);
        setClienteData({
          nome: response.data.user.full_name || '',
          cpf: response.data.user.cpf || '',
          email: response.data.user.email || '',
          telefone: response.data.user.phone || ''
        });
        setCriarNovoCliente(false);
        toast.success('Cliente encontrado no sistema!');
        return true;
      } else {
        setClienteExistente(null);
        setCriarNovoCliente(true);
        toast.info('Cliente não encontrado. Preencha os dados para cadastrar.');
        return false;
      }
    } catch (error) {
      setClienteExistente(null);
      setCriarNovoCliente(true);
      return false;
    }
  };

  const validarDadosCliente = async () => {
    if (!clienteData.cpf) {
      toast.error('Informe o CPF do cliente');
      return false;
    }

    // Se cliente não foi buscado ainda, buscar primeiro
    if (!clienteExistente && !criarNovoCliente) {
      await buscarClientePorCPF(clienteData.cpf);
      return false; // Retorna false para não avançar ainda, usuário deve revisar os dados
    }

    // Se for criar novo cliente, validar todos os campos
    if (criarNovoCliente) {
      if (!clienteData.nome || !clienteData.email || !clienteData.telefone) {
        toast.error('Preencha todos os dados do novo cliente');
        return false;
      }
    }

    return true;
  };

  const validarDadosVeiculo = () => {
    if (!veiculoData.tipo_veiculo_id) {
      toast.error('Selecione o tipo de veículo');
      return false;
    }
    if (!veiculoData.marca || !veiculoData.modelo || !veiculoData.ano || !veiculoData.placa) {
      toast.error('Preencha todos os dados do veículo (marca, modelo, ano e placa)');
      return false;
    }
    if (!veiculoData.valorFipe) {
      toast.error('Aguarde o carregamento do valor FIPE');
      return false;
    }
    return true;
  };

  const validarCoberturas = () => {
    if (!planoSelecionado) {
      toast.error('Selecione um plano principal');
      return false;
    }
    return true;
  };

  const validarVistoria = () => {
    const todasFotos = Object.values(fotosVistoria).every(foto => foto !== null);
    if (!todasFotos) {
      toast.error('Envie todas as 6 fotos da vistoria');
      return false;
    }
    return true;
  };

  const validarCondutor = () => {
    // Validar dados básicos
    if (!condutorData.nomeCondutor || !condutorData.cpfCondutor || !condutorData.dataNascimento || !condutorData.telefone) {
      toast.error('Preencha todos os dados pessoais');
      return false;
    }
    
    // Validar senha
    if (!condutorData.senha || condutorData.senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return false;
    }
    
    if (condutorData.senha !== condutorData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return false;
    }
    
    // Validar PIX
    if (!condutorData.pix_key_type || !condutorData.pix_key) {
      toast.error('Preencha os dados PIX para saque');
      return false;
    }
    
    // Validar endereço
    if (!condutorData.cep || !condutorData.street || !condutorData.number || 
        !condutorData.neighborhood || !condutorData.city || !condutorData.state) {
      toast.error('Preencha o endereço completo');
      return false;
    }
    
    // Validar documentos RG
    if (!condutorData.rg_front || !condutorData.rg_back) {
      toast.error('Envie as fotos do RG (frente e verso)');
      return false;
    }
    
    // Validar aceite do regulamento
    if (!condutorData.regulamento_aceito) {
      toast.error('Você precisa ler e aceitar o Regulamento do PSM');
      return false;
    }
    
    // Validar assinatura digital
    if (!condutorData.assinatura_digital) {
      toast.error('É necessário assinar digitalmente o contrato');
      return false;
    }
    
    return true;
  };

  const finalizarCotacao = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let clienteId = clienteExistente?.id;

      // Se for criar novo cliente, cadastrar primeiro no sistema Transmill
      if (criarNovoCliente && !clienteExistente) {
        toast.info('Cadastrando novo cliente no sistema Transmill...');
        
        const novoClienteData = {
          // Dados básicos
          email: clienteData.email,
          password: condutorData.senha,
          full_name: condutorData.nomeCondutor,
          phone: condutorData.telefone,
          cpf: condutorData.cpfCondutor,
          user_type: 'cliente',
          referral_code_used: user.referral_code, // Código do consultor/regional/unidade Labelview que está criando o cliente
          
          // Dados PIX
          pix_key: condutorData.pix_key,
          pix_key_type: condutorData.pix_key_type,
          
          // Endereço completo
          cep: condutorData.cep,
          street: condutorData.street,
          number: condutorData.number,
          neighborhood: condutorData.neighborhood,
          city: condutorData.city,
          state: condutorData.state,
          complement: condutorData.complement,
          
          // Documentos RG
          rg_front: condutorData.rg_front,
          rg_back: condutorData.rg_back
        };

        const clienteResponse = await axios.post(
          `${API}/auth/register`,
          novoClienteData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (clienteResponse.data.user) {
          clienteId = clienteResponse.data.user.id;
          toast.success('Cliente cadastrado com sucesso! ✅');
        } else {
          throw new Error('Erro ao cadastrar cliente');
        }
      }

      const cotacaoData = {
        consultor_id: user.id,
        vendedor_id: vendedorIdTracking, // ID de quem gerou o link (rastreamento)
        cliente_id: clienteId,
        cliente: clienteData,
        veiculo: veiculoData,
        plano_selecionado: planoSelecionado,
        complementos_selecionados: complementosSelecionados,
        fotos_vistoria: fotosVistoria,
        condutor: condutorData,
        status: 'pendente_aprovacao',
        origem: publicMode ? 'link_compartilhavel' : 'painel_labelview', // Rastrear origem
        // Configurações de pagamento
        taxa_adesao: configuracoesUnidade.taxa_adesao,
        dia_vencimento: parseInt(diaVencimento)
      };

      const response = await axios.post(
        `${API}/labelview/cotacoes/criar`,
        cotacaoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Cotação criada com sucesso! 🎉');
        // Reset form
        setCurrentStep(0);
        setClienteData({ nome: '', cpf: '', email: '', telefone: '' });
        setClienteExistente(null);
        setCriarNovoCliente(false);
        setVeiculoData({ marca: '', modelo: '', ano: '', placa: '', valorFipe: '' });
        setCoberturasData({
          rouboFurto: false,
          colisao: false,
          vidros: false,
          assistencia24h: false,
          carroReserva: false,
          danosTerceiros: false
        });
        setPlanoSelecionado(null);
        setComplementosSelecionados([]);
        setPlanosDisponiveis([]);
        setComplementosDisponiveis([]);
        setFotosVistoria({
          frente: null,
          traseira: null,
          lateralEsquerda: null,
          lateralDireita: null,
          painel: null,
          motor: null
        });
        setCondutorData({
          nomeCondutor: '',
          cpfCondutor: '',
          dataNascimento: '',
          situacao: 'proprio',
          cnh: null,
          idadeCondutor: '',
          senha: '',
          confirmarSenha: '',
          telefone: '',
          pix_key: '',
          pix_key_type: '',
          cep: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          complement: '',
          rg_front: '',
          rg_back: ''
        });
      }
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar cotação');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (campo, file) => {
    // Preview imediato
    const reader = new FileReader();
    reader.onloadend = async () => {
      // Mostrar preview
      setFotosVistoria(prev => ({ ...prev, [campo]: reader.result }));
      
      // Upload para Cloudinary em background
      try {
        toast.loading(`Enviando ${campo} para Cloudinary...`, { id: `vistoria-${campo}` });
        
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('imagem_base64', reader.result);
        formData.append('nome_campo', campo);
        formData.append('cotacao_temp_id', `vistoria_${Date.now()}`);
        
        const response = await axios.post(
          `${API}/labelview/upload-foto-vistoria`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        
        if (response.data.success) {
          // Substituir base64 pela URL do Cloudinary
          setFotosVistoria(prev => ({ 
            ...prev, 
            [campo]: response.data.url 
          }));
          toast.success(`${campo} enviada! ☁️`, { id: `vistoria-${campo}` });
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error(`Erro ao enviar ${campo}`, { id: `vistoria-${campo}` });
      }
    };
    reader.readAsDataURL(file);
  };

  const renderStepper = () => {
    const steps = [
      { number: 0, label: 'Cliente', icon: User },
      { number: 1, label: 'Veículo', icon: Car },
      { number: 2, label: 'Planos', icon: Shield },
      { number: 3, label: 'Vistoria', icon: Camera },
      { number: 4, label: 'Condutor', icon: PenTool },
      { number: 5, label: 'Resumo', icon: Check }
    ];

    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-[#2fa31c] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isActive ? 'text-[#2fa31c]' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDadosCliente();
      case 1:
        return renderDadosVeiculo();
      case 2:
        return renderCoberturas();
      case 3:
        return renderVistoria();
      case 4:
        return renderCondutor();
      case 5:
        return renderResumo();
      default:
        return null;
    }
  };

  const renderDadosCliente = () => (
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={24} />
            Dados do Cliente
          </div>
          {clienteExistente && (
            <Badge className="bg-green-500 text-white">Cliente Cadastrado</Badge>
          )}
          {criarNovoCliente && (
            <Badge className="bg-yellow-500 text-white">Novo Cliente</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Busca por CPF */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3 font-medium">
            🔍 Primeiro, informe o CPF para verificar se o cliente já está cadastrado
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={clienteData.cpf}
                onChange={(e) => {
                  setClienteData({ ...clienteData, cpf: e.target.value });
                  setClienteExistente(null);
                  setCriarNovoCliente(false);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </div>
            <Button
              onClick={() => buscarClientePorCPF(clienteData.cpf)}
              disabled={!clienteData.cpf || loading}
              className="bg-[#2fa31c] hover:bg-[#1a59ad] text-white px-6"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Formulário de dados */}
        {(clienteExistente || criarNovoCliente) && (
          <div className="space-y-4">
            {criarNovoCliente && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ✨ Este cliente será cadastrado no sistema Transmill com seu código de indicação
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={clienteData.nome}
                  onChange={(e) => setClienteData({ ...clienteData, nome: e.target.value })}
                  disabled={clienteExistente}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c] ${
                    clienteExistente ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Nome do cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">E-mail *</label>
                <input
                  type="email"
                  value={clienteData.email}
                  onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
                  disabled={clienteExistente}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c] ${
                    clienteExistente ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Telefone *</label>
                <input
                  type="text"
                  value={clienteData.telefone}
                  onChange={(e) => setClienteData({ ...clienteData, telefone: e.target.value })}
                  disabled={clienteExistente}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c] ${
                    clienteExistente ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CPF *</label>
                <input
                  type="text"
                  value={clienteData.cpf}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDadosVeiculo = () => (
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
        <CardTitle className="flex items-center gap-2">
          <Car size={24} />
          Dados do Veículo
        </CardTitle>
        <p className="text-sm text-white/90 mt-2">
          🚗 Digite a PLACA para busca automática ou preencha manualmente
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Placa do Veículo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Placa do Veículo *</label>
            <input
              type="text"
              value={veiculoData.placa}
              onChange={(e) => {
                const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setVeiculoData({ ...veiculoData, placa: valor });
              }}
              placeholder="ABC1234"
              maxLength={7}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Tipo de Veículo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Tipo de Veículo *</label>
            <select
              value={veiculoData.tipo_veiculo_id}
              onChange={(e) => {
                const tipoSelecionado = Array.isArray(tiposVeiculo) ? tiposVeiculo.find(t => t.id === e.target.value) : null;
                setVeiculoData({
                  ...veiculoData,
                  tipo_veiculo_id: e.target.value,
                  tipo_veiculo_nome: tipoSelecionado?.nome || '',
                  tipo_fipe: tipoSelecionado?.tipo_fipe || '',
                  marca: '',
                  marca_codigo: '',
                  modelo: '',
                  modelo_codigo: '',
                  ano: '',
                  ano_codigo: '',
                  valorFipe: ''
                });
                setMarcasFipe([]);
                setModelosFipe([]);
                setAnosFipe([]);
                if (tipoSelecionado?.tipo_fipe) {
                  carregarMarcasFipe(tipoSelecionado.tipo_fipe);
                }
                // ✅ Carregar imagens modelo de vistoria do tipo de veículo
                if (tipoSelecionado?.imagens_vistoria) {
                  console.log('📸 Imagens modelo de vistoria:', tipoSelecionado.imagens_vistoria);
                  setImagensModeloVistoria(tipoSelecionado.imagens_vistoria);
                } else {
                  setImagensModeloVistoria([]);
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
            >
              <option value="">Selecione o tipo</option>
              {Array.isArray(tiposVeiculo) && tiposVeiculo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Marca FIPE */}
          {veiculoData.tipo_fipe && (
            <div>
              <label className="block text-sm font-medium mb-2">Marca *</label>
              <select
                value={veiculoData.marca_codigo}
                onChange={(e) => {
                  const marcaSelecionada = Array.isArray(marcasFipe) ? marcasFipe.find(m => m.codigo === e.target.value) : null;
                  setVeiculoData({
                    ...veiculoData,
                    marca_codigo: e.target.value,
                    marca: marcaSelecionada?.nome || '',
                    modelo: '',
                    modelo_codigo: '',
                    ano: '',
                    ano_codigo: '',
                    valorFipe: ''
                  });
                  setModelosFipe([]);
                  setAnosFipe([]);
                  // Carregar modelos quando selecionar marca
                  if (e.target.value && veiculoData.tipo_fipe) {
                    console.log('🔄 Carregando modelos para marca:', e.target.value);
                    carregarModelosFipe(veiculoData.tipo_fipe, e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!Array.isArray(marcasFipe) || marcasFipe.length === 0}
              >
                <option value="">Selecione a marca</option>
                {Array.isArray(marcasFipe) && marcasFipe.map((marca) => (
                  <option key={marca.codigo} value={marca.codigo}>
                    {marca.nome}
                  </option>
                ))}
              </select>
              {loading && <p className="text-xs text-gray-500 mt-1">⏳ Carregando modelos...</p>}
            </div>
          )}

          {/* Modelo FIPE */}
          {veiculoData.marca_codigo && (
            <div>
              <label className="block text-sm font-medium mb-2">Modelo *</label>
              <select
                value={veiculoData.modelo_codigo}
                onChange={(e) => {
                  const modeloSelecionado = Array.isArray(modelosFipe) ? modelosFipe.find(m => m.codigo === e.target.value) : null;
                  setVeiculoData({
                    ...veiculoData,
                    modelo_codigo: e.target.value,
                    modelo: modeloSelecionado?.nome || '',
                    ano: '',
                    ano_codigo: '',
                    valorFipe: ''
                  });
                  // Carregar anos quando selecionar modelo
                  if (e.target.value && veiculoData.tipo_fipe && veiculoData.marca_codigo) {
                    console.log('🔄 Carregando anos para modelo:', e.target.value);
                    carregarAnosFipe(veiculoData.tipo_fipe, veiculoData.marca_codigo, e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!Array.isArray(modelosFipe) || modelosFipe.length === 0}
              >
                <option value="">
                  {loading ? 'Carregando modelos...' : 
                   !Array.isArray(modelosFipe) || modelosFipe.length === 0 ? 'Selecione a marca primeiro' : 
                   'Selecione o modelo'}
                </option>
                {Array.isArray(modelosFipe) && modelosFipe.map((modelo) => (
                  <option key={modelo.codigo} value={modelo.codigo}>
                    {modelo.nome}
                  </option>
                ))}
              </select>
              {loading && <p className="text-xs text-gray-500 mt-1">⏳ Carregando anos...</p>}
            </div>
          )}

          {/* Ano FIPE */}
          {veiculoData.modelo_codigo && (
            <div>
              <label className="block text-sm font-medium mb-2">Ano *</label>
              <select
                value={veiculoData.ano_codigo}
                onChange={(e) => {
                  const anoSelecionado = Array.isArray(anosFipe) ? anosFipe.find(a => a.codigo === e.target.value) : null;
                  setVeiculoData({
                    ...veiculoData,
                    ano_codigo: e.target.value,
                    ano: anoSelecionado?.nome || ''
                  });
                  if (e.target.value) {
                    console.log('💰 Buscando valor FIPE para ano:', e.target.value);
                    buscarValorFipe(
                      veiculoData.tipo_fipe,
                      veiculoData.marca_codigo,
                      veiculoData.modelo_codigo,
                      e.target.value
                    );
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!Array.isArray(anosFipe) || anosFipe.length === 0}
              >
                <option value="">
                  {loading ? 'Carregando anos...' : 
                   !Array.isArray(anosFipe) || anosFipe.length === 0 ? 'Selecione o modelo primeiro' : 
                   'Selecione o ano'}
                </option>
                {Array.isArray(anosFipe) && anosFipe.map((ano) => (
                  <option key={ano.codigo} value={ano.codigo}>
                    {ano.nome}
                  </option>
                ))}
              </select>
              {loading && <p className="text-xs text-gray-500 mt-1">💰 Buscando valor FIPE...</p>}
            </div>
          )}
          
          {/* Valor FIPE (somente leitura) */}
          {veiculoData.valorFipe && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Valor FIPE</label>
              <div className="w-full px-4 py-3 border rounded-lg bg-green-50 border-green-300 text-green-800 font-bold text-lg">
                {veiculoData.valorFipe}
              </div>
              <p className="text-xs text-green-600 mt-1">✓ Valor buscado automaticamente na Tabela FIPE</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderCoberturas = () => (
    <div className="space-y-6">
      {/* Planos Principais */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
          <CardTitle className="flex items-center gap-2">
            <Shield size={24} />
            Selecione o Plano Principal
          </CardTitle>
          <p className="text-sm text-white/90 mt-2">
            Escolha o plano base de proteção para o veículo
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!Array.isArray(planosDisponiveis) || planosDisponiveis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum plano disponível para este tipo de veículo e faixa de valor.</p>
            </div>
          ) : (
            Array.isArray(planosDisponiveis) && planosDisponiveis.map((plano) => (
              <div
                key={plano.id}
                onClick={() => setPlanoSelecionado(plano)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  planoSelecionado?.id === plano.id
                    ? 'border-[#2fa31c] bg-green-50'
                    : 'border-gray-300 hover:border-[#2fa31c] hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={planoSelecionado?.id === plano.id}
                        onChange={() => setPlanoSelecionado(plano)}
                        className="w-5 h-5 text-[#2fa31c]"
                      />
                      <h3 className="text-lg font-bold text-gray-800">
                        {plano.coberturas_principais?.[0]?.tipo_cobertura || 'Roubo/Furto'}
                      </h3>
                      <Badge className="bg-blue-100 text-blue-800">
                        {plano.nome || plano.nome_plano || `${plano.tipo_veiculo}`}
                      </Badge>
                    </div>
                    
                    {/* ✅ Descrição da cobertura principal */}
                    {(plano.descricao_cobertura || plano.coberturas_principais?.[0]?.descricao) && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3 text-sm text-gray-700">
                        <p className="whitespace-pre-line">
                          {plano.descricao_cobertura || plano.coberturas_principais?.[0]?.descricao}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-3">
                      Proteção {plano.tipo_veiculo} - Faixa FIPE: R$ {(plano.valor_fipe_min || 0).toLocaleString('pt-BR')} a R$ {(plano.valor_fipe_max || 0).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <strong>Vigência:</strong> 12 meses
                      </span>
                      {(plano.taxa_adesao > 0) && (
                        <span className="text-orange-600">
                          <strong>Taxa de Adesão:</strong> R$ {plano.taxa_adesao?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-[#2fa31c]">
                      R$ {(plano.custo_mensal || plano.valor_calculado || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">por mês</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Complementos */}
      {planoSelecionado && Array.isArray(complementosDisponiveis) && complementosDisponiveis.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-[#2fa31c] to-[#1a59ad] text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} />
              Complementos Opcionais
            </CardTitle>
            <p className="text-sm text-white/90 mt-2">
              Adicione coberturas extras ao seu plano
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {Array.isArray(complementosDisponiveis) && complementosDisponiveis.map((complemento) => (
              <div
                key={complemento.id}
                className="flex items-start p-4 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  id={complemento.id}
                  checked={complementosSelecionados.some(c => c.id === complemento.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setComplementosSelecionados([...complementosSelecionados, complemento]);
                    } else {
                      setComplementosSelecionados(complementosSelecionados.filter(c => c.id !== complemento.id));
                    }
                  }}
                  className="w-5 h-5 text-[#2fa31c] rounded focus:ring-2 focus:ring-[#2fa31c] mt-1"
                />
                <label htmlFor={complemento.id} className="flex-1 ml-3 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{complemento.tipo_cobertura || complemento.nome}</h4>
                      
                      {/* ✅ Exibir serviços inclusos como lista */}
                      {complemento.servicos_inclusos?.servicos?.length > 0 ? (
                        <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-700">
                          {complemento.servicos_inclusos.titulo && (
                            <p className="font-medium mb-1">{complemento.servicos_inclusos.titulo}</p>
                          )}
                          <ul className="list-disc list-inside space-y-0.5">
                            {complemento.servicos_inclusos.servicos.map((servico, idx) => (
                              <li key={idx} className="text-gray-600">{servico}</li>
                            ))}
                          </ul>
                          {complemento.servicos_inclusos.observacoes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{complemento.servicos_inclusos.observacoes}</p>
                          )}
                        </div>
                      ) : complemento.descricao ? (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{complemento.descricao}</p>
                      ) : null}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-[#2fa31c]">
                        + R$ {(complemento.valor || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">por mês</div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ✅ RESUMO DO ORÇAMENTO + BOTÕES */}
      {planoSelecionado && (
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={24} />
                Resumo do Orçamento
              </div>
              <Badge className="bg-white text-green-600 text-lg px-4 py-2">
                R$ {valorTotalPlano.toFixed(2)}/mês
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Plano Base:</span>
                <span className="font-semibold">R$ {(planoSelecionado?.custo_mensal || 0).toFixed(2)}</span>
              </div>
              
              {Array.isArray(complementosSelecionados) && complementosSelecionados.map((comp) => (
                <div key={comp.id} className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">{comp.tipo_cobertura}:</span>
                  <span className="font-semibold text-green-600">+ R$ {(comp.valor || 0).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between py-3 border-t-2 border-green-500">
                <span className="text-lg font-bold">TOTAL MENSAL:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {valorTotalPlano.toFixed(2)}
                </span>
              </div>
              
              {/* ✅ Taxa de Adesão aparece APÓS o total mensal (paga no fechamento do contrato) */}
              {(configuracoesUnidade.taxa_adesao > 0 || planoSelecionado?.taxa_adesao > 0) && (
                <div className="flex justify-between py-3 bg-orange-50 px-3 rounded-lg border border-orange-200 mt-4">
                  <div>
                    <span className="text-gray-700 font-semibold">Taxa de Adesão:</span>
                    <p className="text-xs text-gray-500 mt-1">* Paga no fechamento do contrato</p>
                  </div>
                  <span className="font-bold text-orange-600 text-xl">
                    R$ {(configuracoesUnidade.taxa_adesao || planoSelecionado?.taxa_adesao || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={async () => {
                  try {
                    toast.loading('📄 Gerando PDF do orçamento...', { id: 'pdf-orcamento' });
                    const token = localStorage.getItem('token');
                    
                    const dadosOrcamento = {
                      cliente: {
                        nome: clienteData.nome,
                        documento: clienteData.cpf || clienteData.cnpj,
                        email: clienteData.email,
                        telefone: clienteData.telefone
                      },
                      veiculo: {
                        placa: veiculoData.placa,
                        marca: veiculoData.marca,
                        modelo: veiculoData.modelo,
                        ano: veiculoData.ano,
                        valor_fipe: veiculoData.valorFipe
                      },
                      plano: {
                        nome: planoSelecionado.nome,
                        custo_mensal: planoSelecionado.custo_mensal
                      },
                      adicionais: complementosSelecionados,
                      taxa_adesao: configuracoesUnidade.taxa_adesao,
                      valor_total: valorTotalPlano,
                      vendedor: {
                        nome: user?.name || user?.nome || '',
                        telefone: user?.telefone || '',
                        email: user?.email || ''
                      }
                    };
                    
                    const response = await axios.post(
                      `${API}/labelview/cotacao/gerar-pdf-orcamento`,
                      dadosOrcamento,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    if (response.data.success) {
                      // Converter base64 para blob e fazer download
                      const pdfBlob = await fetch(`data:application/pdf;base64,${response.data.pdf}`).then(res => res.blob());
                      const url = window.URL.createObjectURL(pdfBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = response.data.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success('✅ PDF baixado com sucesso!', { id: 'pdf-orcamento' });
                    }
                  } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    toast.error('Erro ao gerar PDF do orçamento', { id: 'pdf-orcamento' });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                📄 Baixar Orçamento em PDF
              </Button>
              
              <Button
                onClick={() => {
                  // Resetar para nova cotação
                  if (window.confirm('Deseja fazer uma nova cotação? Os dados atuais serão perdidos.')) {
                    window.location.reload();
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3"
              >
                🔄 Nova Cotação
              </Button>
            </div>

            {/* ✅ CARD DE CONFIRMAÇÃO DO PLANO ESCOLHIDO */}
            {planoSelecionado && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
                <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  ✅ Confirmação do Plano Escolhido
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600"><strong>Cliente:</strong> {clienteData.nome}</p>
                    <p className="text-gray-600"><strong>CPF:</strong> {clienteData.cpf}</p>
                    <p className="text-gray-600"><strong>Telefone:</strong> {clienteData.telefone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Veículo:</strong> {veiculoData.marca} {veiculoData.modelo}</p>
                    <p className="text-gray-600"><strong>Ano:</strong> {veiculoData.ano}</p>
                    <p className="text-gray-600"><strong>Placa:</strong> {veiculoData.placa}</p>
                    <p className="text-gray-600"><strong>Valor FIPE:</strong> R$ {parseFloat(veiculoData.valorFipe || 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-300">
                  <p className="text-gray-700"><strong>Plano:</strong> {planoSelecionado.nome || planoSelecionado.coberturas_principais?.[0]?.tipo_cobertura}</p>
                  <p className="text-green-700 text-lg font-bold">
                    <strong>Valor Mensal:</strong> R$ {valorTotalPlano.toFixed(2)}
                  </p>
                  {complementosSelecionados.length > 0 && (
                    <p className="text-gray-600 text-sm">
                      <strong>Adicionais:</strong> {complementosSelecionados.map(c => c.tipo_cobertura || c.nome).join(', ')}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  Ao clicar em &quot;Continuar para Vistoria&quot;, você confirma que os dados acima estão corretos.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={async () => {
                  console.log('🔔 Confirmando plano e criando cliente...');
                  await moverParaNegociacao();
                  console.log('✅ Cliente criado! Avançando para vistoria...');
                  setCurrentStep(3);
                }}
                disabled={!planoSelecionado}
                className="w-full bg-[#2fa31c] hover:bg-[#258517] text-white py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {planoSelecionado ? '✅ Confirmar Plano e Continuar para Vistoria →' : 'Selecione um plano para continuar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderVistoria = () => (
    <div className="space-y-6">
      {/* ===================== DOCUMENTOS DO CLIENTE ===================== */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#0d3d7a] text-white">
          <CardTitle className="flex items-center gap-2">
            <FileText size={24} />
            Documentos do Cliente
          </CardTitle>
          <p className="text-sm text-white/80 mt-1">
            Envie fotos nítidas dos documentos seguindo os modelos abaixo
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'cnh_frente', label: 'CNH Frente', tipo: 'cnh_frente' },
              { key: 'cnh_verso', label: 'CNH Verso', tipo: 'cnh_verso' },
              { key: 'comprovante', label: 'Comprovante de Residência', tipo: 'comprovante' },
              { key: 'dut', label: 'DUT (Documento do Veículo)', tipo: 'dut' }
            ].map(({ key, label, tipo }) => {
              // Buscar modelo de documento do Master
              const modelo = modelosDocumentos.find(m => m.tipo === tipo);
              
              return (
                <div key={key} className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
                  {/* Header com nome do documento */}
                  <div className="bg-blue-50 px-3 py-2 border-b">
                    <p className="font-semibold text-blue-900">{modelo?.nome || label}</p>
                  </div>
                  
                  <div className="flex">
                    {/* Imagem Modelo (lado esquerdo) */}
                    <div className="w-1/2 bg-gray-50 p-3 border-r">
                      <p className="text-xs text-gray-500 text-center mb-2">📷 Modelo:</p>
                      {modelo?.url ? (
                        <img
                          src={modelo.url}
                          alt={`Modelo ${label}`}
                          className="w-full h-28 object-contain rounded"
                        />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center text-gray-300">
                          <FileText size={40} />
                        </div>
                      )}
                      {modelo?.instrucoes && (
                        <p className="text-xs text-gray-500 text-center mt-2">{modelo.instrucoes}</p>
                      )}
                    </div>
                    
                    {/* Área de Upload (lado direito) */}
                    <div className="w-1/2 p-3">
                      <p className="text-xs text-gray-500 text-center mb-2">📤 Sua foto:</p>
                      <label className="cursor-pointer block">
                        {fotosDocumentos[key] ? (
                          <div className="text-center">
                            <img
                              src={fotosDocumentos[key]}
                              alt={label}
                              className="w-full h-28 object-cover rounded mb-1"
                            />
                            <p className="text-xs text-green-600 font-medium">✓ Enviado</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 h-28 flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                            <Camera size={24} className="text-gray-400 mb-1" />
                            <p className="text-xs text-blue-600">Clique para enviar</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFotosDocumentos(prev => ({
                                  ...prev,
                                  [key]: event.target.result
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===================== FOTOS DO VEÍCULO ===================== */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#2fa31c] to-[#1a8a15] text-white">
          <CardTitle className="flex items-center gap-2">
            <Camera size={24} />
            Fotos do Veículo
          </CardTitle>
          <p className="text-sm text-white/80 mt-1">
            Posicione o veículo conforme as imagens de referência
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {imagensModeloVistoria.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imagensModeloVistoria.map((imagemModelo, index) => {
                // 🔧 CORREÇÃO: Mapear tipo para key do state - EXPANDIDO para suportar 10+ tipos
                const keyMap = {
                  // Variações para Frente
                  'frente': 'frente', 'Frente': 'frente', 'veiculo_frente': 'frente', 'Frente do Veículo': 'frente',
                  // Variações para Traseira
                  'traseira': 'traseira', 'Traseira': 'traseira', 'veiculo_traseira': 'traseira', 'Traseira do Veículo': 'traseira',
                  // Variações para Lateral Esquerda
                  'lateral_esquerda': 'lateralEsquerda', 'Lateral Esquerda': 'lateralEsquerda', 'lateralEsquerda': 'lateralEsquerda',
                  // Variações para Lateral Direita  
                  'lateral_direita': 'lateralDireita', 'Lateral Direita': 'lateralDireita', 'lateralDireita': 'lateralDireita',
                  // Variações para Painel
                  'painel': 'painel', 'Painel': 'painel', 'Painel/Hodômetro': 'painel',
                  // Variações para Motor
                  'motor': 'motor', 'Motor': 'motor', 'Motor/Chassi': 'motor',
                  // Variações para Chassi
                  'chassi': 'chassi', 'Chassi': 'chassi',
                  // Variações para Hodômetro
                  'hodometro': 'hodometro', 'Hodômetro': 'hodometro', 'hodômetro': 'hodometro',
                  // Variações para Bancos
                  'banco_frente': 'banco_frente', 'Banco Frente': 'banco_frente', 'banco_dianteiro': 'banco_frente',
                  'banco_traseiro': 'banco_traseiro', 'Banco Traseiro': 'banco_traseiro',
                  // Variações para Porta-malas
                  'porta_malas': 'porta_malas', 'Porta Malas': 'porta_malas', 'Porta-malas': 'porta_malas',
                  // Variações para Rodas
                  'roda_dianteira': 'roda_dianteira', 'Roda Dianteira': 'roda_dianteira',
                  'roda_traseira': 'roda_traseira', 'Roda Traseira': 'roda_traseira',
                  // Variações para Placa
                  'placa': 'placa', 'Placa': 'placa',
                  // Variações para Vidros
                  'vidros': 'vidros', 'Vidros': 'vidros',
                  // Variações para Teto
                  'teto': 'teto', 'Teto': 'teto'
                };
                
                // Tentar encontrar a key correta - primeiro pelo tipo exato
                let stateKey = keyMap[imagemModelo.tipo];
                
                // Se não encontrou, tentar pelo nome
                if (!stateKey && imagemModelo.nome) {
                  const nomeLower = imagemModelo.nome.toLowerCase();
                  if (nomeLower.includes('frente') && !nomeLower.includes('lateral') && !nomeLower.includes('banco')) {
                    stateKey = 'frente';
                  } else if (nomeLower.includes('traseira') || nomeLower.includes('trás')) {
                    stateKey = 'traseira';
                  } else if (nomeLower.includes('lateral') && nomeLower.includes('esquerda')) {
                    stateKey = 'lateralEsquerda';
                  } else if (nomeLower.includes('lateral') && nomeLower.includes('direita')) {
                    stateKey = 'lateralDireita';
                  } else if (nomeLower.includes('painel')) {
                    stateKey = 'painel';
                  } else if (nomeLower.includes('motor')) {
                    stateKey = 'motor';
                  } else if (nomeLower.includes('chassi')) {
                    stateKey = 'chassi';
                  } else if (nomeLower.includes('hodômetro') || nomeLower.includes('hodometro')) {
                    stateKey = 'hodometro';
                  } else if (nomeLower.includes('banco') && nomeLower.includes('frente')) {
                    stateKey = 'banco_frente';
                  } else if (nomeLower.includes('banco') && nomeLower.includes('traseiro')) {
                    stateKey = 'banco_traseiro';
                  } else if (nomeLower.includes('porta') || nomeLower.includes('malas')) {
                    stateKey = 'porta_malas';
                  } else if (nomeLower.includes('roda') && nomeLower.includes('dianteira')) {
                    stateKey = 'roda_dianteira';
                  } else if (nomeLower.includes('roda') && nomeLower.includes('traseira')) {
                    stateKey = 'roda_traseira';
                  } else if (nomeLower.includes('placa')) {
                    stateKey = 'placa';
                  } else if (nomeLower.includes('vidro')) {
                    stateKey = 'vidros';
                  } else if (nomeLower.includes('teto')) {
                    stateKey = 'teto';
                  }
                }
                
                // Fallback: usar o tipo ou nome como key dinâmica
                if (!stateKey) {
                  stateKey = imagemModelo.tipo || `foto_${index}`;
                  // Criar entrada dinâmica no estado se não existir
                  if (!fotosVistoria.hasOwnProperty(stateKey)) {
                    setFotosVistoria(prev => ({ ...prev, [stateKey]: null }));
                  }
                }
                
                console.log(`📷 Mapeando imagem ${index}: tipo="${imagemModelo.tipo}" nome="${imagemModelo.nome}" -> stateKey="${stateKey}"`);
                
                return (
                  <div key={index} className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
                    {/* Header com nome do campo */}
                    <div className="bg-green-50 px-3 py-2 border-b">
                      <p className="font-semibold text-green-900">{imagemModelo.nome || imagemModelo.tipo}</p>
                    </div>
                    
                    <div className="flex">
                      {/* Imagem Modelo (lado esquerdo) */}
                      <div className="w-1/2 bg-gray-50 p-3 border-r">
                        <p className="text-xs text-gray-500 text-center mb-2">📷 Modelo:</p>
                        {imagemModelo.url ? (
                          <img
                            src={imagemModelo.url}
                            alt={`Modelo ${imagemModelo.nome}`}
                            className="w-full h-28 object-contain rounded"
                          />
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center text-gray-300">
                            <Camera size={40} />
                          </div>
                        )}
                        {imagemModelo.instrucoes && (
                          <p className="text-xs text-gray-500 text-center mt-2">{imagemModelo.instrucoes}</p>
                        )}
                      </div>
                      
                      {/* Área de Upload (lado direito) */}
                      <div className="w-1/2 p-3">
                        <p className="text-xs text-gray-500 text-center mb-2">📤 Sua foto:</p>
                        <label className="cursor-pointer block">
                          {fotosVistoria[stateKey] ? (
                            <div className="text-center">
                              <img
                                src={fotosVistoria[stateKey]}
                                alt={imagemModelo.nome}
                                className="w-full h-28 object-cover rounded mb-1"
                              />
                              <p className="text-xs text-green-600 font-medium">✓ Enviado</p>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 h-28 flex flex-col items-center justify-center hover:border-green-500 transition-colors">
                              <Camera size={24} className="text-gray-400 mb-1" />
                              <p className="text-xs text-green-600">Clique para enviar</p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleFileChange(stateKey, e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback se não houver imagens modelo cadastradas
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'frente', label: 'Frente do Veículo' },
                { key: 'traseira', label: 'Traseira do Veículo' },
                { key: 'lateralEsquerda', label: 'Lateral Esquerda' },
                { key: 'lateralDireita', label: 'Lateral Direita' },
                { key: 'painel', label: 'Painel/Hodômetro' },
                { key: 'motor', label: 'Motor/Chassi' }
              ].map(({ key, label }) => (
                <div key={key} className="border-2 border-dashed rounded-lg p-4 text-center bg-white">
                  <label className="cursor-pointer block">
                    {fotosVistoria[key] ? (
                      <div>
                        <img
                          src={fotosVistoria[key]}
                          alt={label}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="text-xs text-green-600 font-medium">✓ {label} enviada</p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <Camera size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-xs text-green-600 mt-1">Clique para enviar</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(key, e.target.files[0])}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== BOTÃO ENVIAR VISTORIA ===================== */}
      {!vistoriaEnviada ? (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-orange-800 mb-2">
                📤 Enviar Vistoria para Aprovação
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                Após enviar, a <strong>{nomeUnidade || 'unidade responsável'}</strong> irá analisar as fotos e aprovar a vistoria.
                <br />
                <strong>Você não poderá prosseguir até a aprovação.</strong>
              </p>
              
              {/* Resumo do que foi enviado */}
              <div className="flex justify-center gap-4 mb-4">
                <div className="bg-white px-4 py-2 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-700">📄 Documentos</p>
                  <p className="text-lg font-bold text-blue-600">
                    {Object.values(fotosDocumentos).filter(f => f).length}/4
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-700">🚗 Fotos Veículo</p>
                  <p className="text-lg font-bold text-green-600">
                    {Object.values(fotosVistoria).filter(f => f).length}/{imagensModeloVistoria.length || 6}
                  </p>
                </div>
              </div>

              <Button
                onClick={enviarVistoriaParaAprovacao}
                disabled={enviandoVistoria}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
              >
                {enviandoVistoria ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    📤 Enviar Vistoria para Aprovação
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ===================== TELA AGUARDANDO APROVAÇÃO ===================== */
        <Card className={`border-2 ${vistoriaStatus === 'aprovada' ? 'border-green-400 bg-green-50' : vistoriaStatus === 'reprovada' ? 'border-red-400 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}>
          <CardContent className="p-8">
            <div className="text-center">
              {vistoriaStatus === 'enviada' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">⏳</span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-800 mb-2">
                    Aguardando Aprovação
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Sua vistoria foi enviada com sucesso!<br />
                    A {nomeUnidade || 'Unidade'} está analisando as fotos enviadas.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-yellow-300 max-w-md mx-auto">
                    <p className="text-sm text-gray-600">
                      📱 Você receberá uma notificação quando a vistoria for aprovada.
                      <br /><br />
                      Enquanto isso, você pode fechar esta tela. 
                      O consultor entrará em contato assim que houver uma resposta.
                    </p>
                  </div>
                </>
              )}
              
              {vistoriaStatus === 'aprovada' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Vistoria Aprovada!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Parabéns! Sua vistoria foi aprovada pela {nomeUnidade || 'Unidade'}.
                    <br />
                    Agora você pode continuar com a contratação.
                  </p>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  >
                    ✅ Continuar para Finalização →
                  </Button>
                </>
              )}
              
              {vistoriaStatus === 'reprovada' && (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">❌</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 mb-2">
                    Vistoria Reprovada
                  </h3>
                  <p className="text-red-700 mb-4">
                    Infelizmente sua vistoria foi reprovada.
                    <br />
                    Entre em contato com o consultor para mais informações.
                  </p>
                  <Button
                    onClick={() => {
                      setVistoriaEnviada(false);
                      setVistoriaStatus('pendente');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                  >
                    🔄 Enviar Nova Vistoria
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCondutor = () => (
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
        <CardTitle className="flex items-center gap-2">
          <User size={24} />
          Dados Completos para Cadastro na Transmill
        </CardTitle>
        <p className="text-sm text-white/90 mt-2">
          Complete todos os dados necessários para criar a conta do cliente no sistema Transmill
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Seção 1: Dados Pessoais e Acesso */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <User size={18} className="mr-2" />
            Dados Pessoais e Acesso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Nome Completo *</label>
              <input
                type="text"
                value={condutorData.nomeCondutor}
                onChange={(e) => setCondutorData({ ...condutorData, nomeCondutor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Nome completo do cliente"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">CPF *</label>
              <input
                type="text"
                value={condutorData.cpfCondutor}
                onChange={(e) => setCondutorData({ ...condutorData, cpfCondutor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Data de Nascimento *</label>
              <input
                type="date"
                value={condutorData.dataNascimento}
                onChange={(e) => setCondutorData({ ...condutorData, dataNascimento: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Telefone *</label>
              <input
                type="text"
                value={condutorData.telefone}
                onChange={(e) => setCondutorData({ ...condutorData, telefone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="(00) 00000-0000"
                maxLength="15"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Situação do Condutor</label>
              <select
                value={condutorData.situacao}
                onChange={(e) => setCondutorData({ ...condutorData, situacao: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              >
                <option value="proprio">Proprietário</option>
                <option value="terceiro">Terceiro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Senha de Acesso *</label>
              <input
                type="password"
                value={condutorData.senha}
                onChange={(e) => setCondutorData({ ...condutorData, senha: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Senha *</label>
              <input
                type="password"
                value={condutorData.confirmarSenha}
                onChange={(e) => setCondutorData({ ...condutorData, confirmarSenha: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Repita a senha"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Dados PIX */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <DollarSign size={18} className="mr-2" />
            Dados PIX para Saque
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo da Chave PIX *</label>
              <select
                value={condutorData.pix_key_type}
                onChange={(e) => setCondutorData({ ...condutorData, pix_key_type: e.target.value, pix_key: '' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              >
                <option value="">Selecione o tipo</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Chave PIX *</label>
              <input
                type="text"
                value={condutorData.pix_key}
                onChange={(e) => setCondutorData({ ...condutorData, pix_key: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder={
                  condutorData.pix_key_type === 'cpf' ? '000.000.000-00' :
                  condutorData.pix_key_type === 'email' ? 'email@exemplo.com' :
                  condutorData.pix_key_type === 'phone' ? '(11) 99999-9999' :
                  condutorData.pix_key_type === 'random' ? 'Chave aleatória' :
                  'Selecione o tipo primeiro'
                }
                disabled={!condutorData.pix_key_type}
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Endereço Completo */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <MapPin size={18} className="mr-2" />
            Endereço Completo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CEP *</label>
              <input
                type="text"
                value={condutorData.cep}
                onChange={(e) => setCondutorData({ ...condutorData, cep: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="00000-000"
                maxLength="9"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Rua/Avenida *</label>
              <input
                type="text"
                value={condutorData.street}
                onChange={(e) => setCondutorData({ ...condutorData, street: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Nome da rua"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Número *</label>
              <input
                type="text"
                value={condutorData.number}
                onChange={(e) => setCondutorData({ ...condutorData, number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Nº"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Complemento</label>
              <input
                type="text"
                value={condutorData.complement}
                onChange={(e) => setCondutorData({ ...condutorData, complement: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Apto, bloco, etc. (opcional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bairro *</label>
              <input
                type="text"
                value={condutorData.neighborhood}
                onChange={(e) => setCondutorData({ ...condutorData, neighborhood: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Bairro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cidade *</label>
              <input
                type="text"
                value={condutorData.city}
                onChange={(e) => setCondutorData({ ...condutorData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="Cidade"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Estado *</label>
              <select
                value={condutorData.state}
                onChange={(e) => setCondutorData({ ...condutorData, state: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              >
                <option value="">Selecione</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção 4: Documentos RG */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <FileText size={18} className="mr-2" />
            Documentos RG (Frente e Verso)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">RG Frente *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCondutorData({ ...condutorData, rg_front: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              />
              {condutorData.rg_front && (
                <p className="text-xs text-green-600 mt-1">✓ Arquivo carregado</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">RG Verso *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCondutorData({ ...condutorData, rg_back: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
              />
              {condutorData.rg_back && (
                <p className="text-xs text-green-600 mt-1">✓ Arquivo carregado</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 5: Regulamento PSM */}
        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
          <h3 className="font-semibold text-lg mb-4 flex items-center text-red-800">
            <FileText size={18} className="mr-2" />
            Regulamento do Programa de Socorro Mútuo (PSM)
          </h3>
          
          {/* PDF Embed */}
          <div className="bg-white p-2 rounded-lg mb-4 border">
            <iframe
              src="/documents/regulamento-psm-labelview.pdf"
              className="w-full h-96 rounded"
              title="Regulamento PSM Labelview"
            />
          </div>
          
          {/* Link para download */}
          <div className="mb-4">
            <a
              href="/documents/regulamento-psm-labelview.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a59ad] hover:text-[#2fa31c] font-medium flex items-center gap-2"
            >
              <FileText size={16} />
              Baixar Regulamento (PDF)
            </a>
          </div>
          
          {/* Checkbox de aceite */}
          <div className="space-y-3">
            <Button
              onClick={() => setMostrarRegulamento(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              📄 Visualizar Regulamento PSM (PDF)
            </Button>
            
            <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <input
                type="checkbox"
                id="regulamento-aceito"
                checked={condutorData.regulamento_aceito}
                onChange={(e) => setCondutorData({ ...condutorData, regulamento_aceito: e.target.checked })}
                className="mt-1 w-5 h-5 text-[#2fa31c] focus:ring-[#2fa31c] rounded"
              />
              <label htmlFor="regulamento-aceito" className="text-sm font-medium cursor-pointer">
                <span className="text-red-600">* </span>
                Li e aceito o Regulamento do Programa de Socorro Mútuo (PSM) da Labelview
              </label>
            </div>
          </div>

          {/* ✅ MODAL DO REGULAMENTO PDF */}
          {mostrarRegulamento && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Regulamento PSM - Labelview</h3>
                  <button
                    onClick={() => setMostrarRegulamento(false)}
                    className="text-white hover:text-gray-200 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <iframe
                    src="/regulamento-psm-labelview.pdf"
                    className="w-full h-[600px] border-0"
                    title="Regulamento PSM"
                  />
                </div>
                <div className="p-4 bg-gray-100 flex justify-end gap-3">
                  <Button
                    onClick={() => setMostrarRegulamento(false)}
                    className="bg-[#2fa31c] hover:bg-[#258517]"
                  >
                    ✓ Li o Regulamento
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção 6: Assinatura Digital */}
        <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
          <h3 className="font-semibold text-lg mb-4 flex items-center text-indigo-800">
            <Edit size={18} className="mr-2" />
            Assinatura Digital do Contrato
          </h3>
          
          {/* Texto do contrato */}
          <div className="bg-white p-6 rounded-lg mb-4 border">
            <p className="text-base leading-relaxed">
              Eu, <strong className="text-[#1a59ad]">{condutorData.nomeCondutor || '[Nome do Cliente]'}</strong>, 
              aceito me tornar um associado do <strong>(PSM) Programa de Socorro Mútuo da Labelview</strong>.
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          
          {/* Canvas de Assinatura */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
            <label className="block text-sm font-medium mb-2">
              <span className="text-red-600">* </span>
              Assine no campo abaixo (use o dedo no celular ou mouse no computador)
            </label>
            <SignatureCanvas
              condutorData={condutorData}
              setCondutorData={setCondutorData}
            />
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            ℹ️ <strong>Importante:</strong> Todos esses dados são necessários para criar a conta do cliente no sistema Transmill. A senha será enviada por e-mail após a aprovação.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderResumo = () => {
    // Calcular valor total - 🔧 CORREÇÃO: Usar campo correto do plano
    const valorPlano = planoSelecionado?.custo_mensal || planoSelecionado?.valor_base || planoSelecionado?.valor || 0;
    const valorComplementos = complementosSelecionados.reduce((sum, comp) => sum + (comp.valor || 0), 0);
    const taxaAdesao = configuracoesUnidade.taxa_adesao || 0; // Taxa da unidade
    const valorTotal = valorPlano + valorComplementos + taxaAdesao;

    const gerarPDF = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        await axios.post(
          `${API}/labelview/cotacoes/gerar-pdf-plano`,
          {
            plano: planoSelecionado,
            complementos: complementosSelecionados,
            valor_total: valorTotal
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('PDF gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast.error('Erro ao gerar PDF');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Composição do Plano */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} />
              Composição do Plano Escolhido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Plano Principal */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-blue-900">Cobertura Principal</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 text-lg">
                    {planoSelecionado?.coberturas_principais?.[0]?.tipo_cobertura || 'Roubo/Furto'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {planoSelecionado?.nome || planoSelecionado?.tipo_veiculo} - Faixa FIPE: R$ {(planoSelecionado?.valor_fipe_min || 0).toLocaleString('pt-BR')} a R$ {(planoSelecionado?.valor_fipe_max || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vigência: 12 meses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#2fa31c]">
                    R$ {valorPlano.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">por mês</p>
                </div>
              </div>
            </div>

            {/* Complementos */}
            {Array.isArray(complementosSelecionados) && complementosSelecionados.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-green-900">Complementos Selecionados</h3>
                <div className="space-y-2">
                  {Array.isArray(complementosSelecionados) && complementosSelecionados.map((comp) => (
                    <div key={comp.id} className="flex justify-between items-center py-2 border-b border-green-200 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{comp.tipo_cobertura || comp.nome}</p>
                        <p className="text-xs text-gray-600">{comp.descricao}</p>
                      </div>
                      <p className="font-bold text-[#2fa31c]">+ R$ {(comp.valor || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-green-300 flex justify-between">
                  <p className="font-semibold">Subtotal Complementos:</p>
                  <p className="font-bold text-[#2fa31c]">R$ {valorComplementos.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Taxa de Adesão */}
            {taxaAdesao > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-orange-900">Taxa de Adesão</p>
                    <p className="text-xs text-orange-700">Pagamento único à vista na contratação • 100% para quem vende</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">R$ {taxaAdesao.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Seletor de Vencimento */}
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3">📅 Escolha o Dia de Vencimento das Mensalidades</h3>
              <p className="text-xs text-purple-700 mb-3">
                Selecione o melhor dia do mês para o pagamento das mensalidades
              </p>
              <select
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-lg font-semibold"
              >
                {Array.from(
                  { length: configuracoesUnidade.vencimento_fim - configuracoesUnidade.vencimento_inicio + 1 },
                  (_, i) => configuracoesUnidade.vencimento_inicio + i
                ).map(dia => (
                  <option key={dia} value={dia}>
                    Dia {dia} de cada mês
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-2">
                ℹ️ As mensalidades serão cobradas automaticamente no dia {diaVencimento} de cada mês
              </p>
            </div>

            {/* Valor Total */}
            <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] p-6 rounded-lg text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">Valor Total Mensal</p>
                  <p className="text-xs opacity-75">
                    {taxaAdesao > 0 && '+ Taxa de adesão no primeiro mês'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">R$ {valorTotal.toFixed(2)}</p>
                  <p className="text-sm opacity-90">por mês</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={gerarPDF}
                disabled={loading}
                className="bg-[#2fa31c] hover:bg-green-700 text-white"
              >
                <FileText size={20} className="mr-2" />
                {loading ? 'Gerando...' : 'Gerar PDF do Plano'}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600 mb-4">
                ✓ Revise as informações acima antes de continuar
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-[#1a59ad] hover:bg-blue-700 text-white"
                >
                  Voltar e Modificar Plano
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja cancelar esta cotação?')) {
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancelar Cotação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ PAGAMENTO PIX - TAXA DE ADESÃO */}
        {taxaAdesao > 0 && (
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={24} />
                Pagamento da Taxa de Adesão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold mb-2">
                  Taxa de Adesão: <span className="text-2xl text-green-600">R$ {taxaAdesao.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Pagamento único via PIX - 100% para quem indicou o cliente
                </p>
              </div>

              {!qrCodePix ? (
                <Button
                  onClick={gerarQrCodePix}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                >
                  📱 Gerar QR Code PIX para Pagamento
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-green-500 flex flex-col items-center">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Escaneie o QR Code para pagar:
                    </p>
                    <img 
                      src={`data:image/png;base64,${qrCodePix}`}
                      alt="QR Code PIX"
                      className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                    />
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-600 mb-2">Chave PIX: {dadosPix?.tipo_chave}</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {dadosPix?.chave_pix}
                      </p>
                    </div>
                    {dadosPix?.beneficiario && (
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-600">Beneficiário:</p>
                        <p className="text-sm font-semibold">{dadosPix.beneficiario.nome}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ <strong>Importante:</strong> Após realizar o pagamento, clique em &quot;Finalizar Cotação&quot; para concluir o processo.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informação Final */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Próximo passo:</strong> Após continuar, você irá para a vistoria do veículo e depois finalizará o cadastro completo do cliente.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield size={48} />
              <div>
                <h2 className="text-2xl font-bold">Nova Cotação</h2>
                <p className="text-white/90">
                  Preencha os dados para cotar proteção veicular para seu cliente
                </p>
              </div>
            </div>
            {!publicMode && (
              <Button
                onClick={() => {
                  const linkCotacao = `${window.location.origin}/cotacao/${user.id}`;
                  navigator.clipboard.writeText(linkCotacao);
                  toast.success('Link copiado! Compartilhe com seus clientes.');
                }}
                className="bg-[#1a59ad] hover:bg-blue-700 text-white"
              >
                🔗 Gerar Link Compartilhável
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stepper */}
      {renderStepper()}

      {/* Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0 || loading}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          <ChevronLeft size={20} className="mr-2" />
          Voltar
        </Button>

        <Badge className="bg-[#1a59ad] text-white px-4 py-2">
          Etapa {currentStep + 1} de 6
        </Badge>

        <Button
          onClick={handleNextStep}
          disabled={loading}
          className="bg-[#2fa31c] hover:bg-[#258517] text-white"
        >
          {currentStep === 5 ? (
            <>
              {loading ? 'Enviando...' : 'Finalizar Cotação'}
              <Check size={20} className="ml-2" />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight size={20} className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CotacaoConsultorLabelview;
