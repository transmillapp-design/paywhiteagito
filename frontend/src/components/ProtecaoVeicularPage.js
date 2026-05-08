import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import AssinaturaContrato from './AssinaturaContrato';
import VistoriaVeiculo from './VistoriaVeiculo';
import ResumoProtecaoCompleto from './ResumoProtecaoCompleto';
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
  ArrowLeft,
  Clock
} from 'lucide-react';

const ProtecaoVeicularPage = () => {
  const { user, API } = useAuth();
  const [showInitialScreen, setShowInitialScreen] = useState(true); // Mostrar tela inicial antes do processo
  const [currentStep, setCurrentStep] = useState(0); // Começar pelo step do Cliente (Step 0)
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [leadId, setLeadId] = useState(null); // ID do lead no CRM
  
  // Dados da unidade (Transmill Auto para cotações diretas)
  const [unidadeId, setUnidadeId] = useState(null);
  const [nomeUnidade, setNomeUnidade] = useState('Transmill Auto');
  
  // Dados do cliente (Step 0)
  const [clienteData, setClienteData] = useState({
    cpf: '',
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    pix_key: '',
    pix_key_type: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    rg_front: null,
    rg_back: null
  });
  const [clienteExistente, setClienteExistente] = useState(null);
  const [criarNovoCliente, setCriarNovoCliente] = useState(false);

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
  const [veiculoBloqueado, setVeiculoBloqueado] = useState(false);
  const [mensagemBloqueio, setMensagemBloqueio] = useState('');
  const [showModalDesistencia, setShowModalDesistencia] = useState(false);
  const [motivoDesistencia, setMotivoDesistencia] = useState('');

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
    motor: null
  });

  // Controles para assinatura e vistoria
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showVistoria, setShowVistoria] = useState(false);
  const [cotacaoId, setCotacaoId] = useState(null);
  const [assinaturaBase64, setAssinaturaBase64] = useState('');

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
    rg_back: ''
  });

  useEffect(() => {
    if (currentStep === 1) {
      carregarTiposVeiculo();
    }
    if (currentStep === 2) {
      carregarPlanosEComplementos();
    }
  }, [currentStep]);

  // Buscar unidade padrão para cotações (Transmill Auto)
  useEffect(() => {
    const carregarUnidadePadrao = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Primeiro tentar usar a unidade do próprio usuário
        if (user?.unidade_id) {
          setUnidadeId(user.unidade_id);
          setNomeUnidade(user.nome_fantasia || user.company_name || 'Transmill Auto');
          return;
        }
        
        // Se for unidade labelview, usar o próprio ID
        if (user?.user_type === 'labelview_unidade') {
          setUnidadeId(user.id);
          setNomeUnidade(user.nome_fantasia || user.company_name || 'Transmill Auto');
          return;
        }
        
        // Buscar a unidade "Transmill Auto" ou a primeira disponível
        const response = await axios.get(
          `${API}/labelview/unidades`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success && response.data.unidades?.length > 0) {
          // Procurar por "Transmill Auto" primeiro
          const transmillAuto = response.data.unidades.find(u => 
            u.name?.toLowerCase().includes('transmill') || 
            u.nome_fantasia?.toLowerCase().includes('transmill')
          );
          
          if (transmillAuto) {
            setUnidadeId(transmillAuto.id);
            setNomeUnidade(transmillAuto.name || transmillAuto.nome_fantasia || 'Transmill Auto');
          } else {
            // Usar a primeira unidade disponível
            const primeiraUnidade = response.data.unidades[0];
            setUnidadeId(primeiraUnidade.id);
            setNomeUnidade(primeiraUnidade.name || primeiraUnidade.nome_fantasia || 'Transmill Auto');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar unidade padrão:', error);
        // Continuar sem unidade definida
      }
    };
    
    carregarUnidadePadrao();
  }, [user, API]);

  const carregarPlanosEComplementos = async () => {
    if (!veiculoData.tipo_veiculo_id || !veiculoData.valorFipe) {
      toast.error('Selecione o veículo completo primeiro');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Buscar planos disponíveis
      const planosResponse = await axios.get(
        `${API}/labelview/planos/para-cotacao?tipo_veiculo_id=${veiculoData.tipo_veiculo_id}&valor_fipe=${veiculoData.valorFipe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Verificar se o veículo está bloqueado por exceder o valor máximo
      if (planosResponse.data.bloqueado === true) {
        setPlanosDisponiveis([]);
        setComplementosDisponiveis([]);
        setVeiculoBloqueado(true);
        setMensagemBloqueio(planosResponse.data.message || 'Veículo acima do valor limite para cotação. Entre em contato com nossa central para casos especiais.');
        
        // Exibir mensagem de bloqueio em um toast mais longo
        toast.error(
          planosResponse.data.message || 
          'Veículo acima do valor limite para cotação. Entre em contato com nossa central para casos especiais.',
          {
            duration: 8000,
            style: {
              background: '#fee',
              color: '#c00',
              border: '2px solid #c00',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500'
            }
          }
        );
        
        return; // Não continua buscando complementos
      }

      // Se não está bloqueado, limpar os estados de bloqueio
      setVeiculoBloqueado(false);
      setMensagemBloqueio('');

      if (planosResponse.data.success) {
        setPlanosDisponiveis(planosResponse.data.planos || []);
      }

      // Buscar complementos disponíveis
      const complementosResponse = await axios.get(
        `${API}/labelview/complementos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (complementosResponse.data.success) {
        setComplementosDisponiveis(complementosResponse.data.complementos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos e complementos:', error);
      toast.error('Erro ao carregar opções de planos');
    } finally {
      setLoading(false);
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
      const response = await axios.get(
        `${API}/brasil-api/fipe/marcas/${tipoFipe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMarcasFipe(response.data.marcas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar marcas FIPE:', error);
      toast.error('Erro ao carregar marcas');
    } finally {
      setLoading(false);
    }
  };

  const carregarModelosFipe = async (tipoFipe, marcaCodigo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/brasil-api/fipe/modelos/${tipoFipe}/${marcaCodigo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setModelosFipe(response.data.modelos || []);
        setAnosFipe(response.data.anos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos FIPE:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const buscarValorFipe = async (tipoFipe, marcaCodigo, modeloCodigo, anoCodigo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/brasil-api/fipe/valor/${tipoFipe}/${marcaCodigo}/${modeloCodigo}/${anoCodigo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success && response.data.dados) {
        const valor = response.data.dados.Valor || response.data.valor;
        setVeiculoData(prev => ({ ...prev, valorFipe: valor }));
        toast.success(`Valor FIPE encontrado: ${valor}`);
      }
    } catch (error) {
      console.error('Erro ao buscar valor FIPE:', error);
      toast.error('Erro ao buscar valor FIPE');
    } finally {
      setLoading(false);
    }
  };


  const buscarVeiculoPorPlaca = async () => {
    if (!veiculoData.placa || veiculoData.placa.length < 7) {
      toast.error('Digite uma placa válida');
      return;
    }

    try {
      setLoading(true);
      toast.info('🔍 Buscando dados do veículo...');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/protecao/buscar-por-placa/${veiculoData.placa}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Preencher dados automaticamente
        const dados = response.data;
        
        // Tentar mapear o tipo de veículo (apenas 3 tipos simples para FIPE)
        let tipoId = '';
        const tipoVeiculo = dados.tipo?.toLowerCase() || '';
        
        if (tipoVeiculo.includes('automóvel') || tipoVeiculo.includes('automovel') || tipoVeiculo.includes('carro')) {
          tipoId = 'carro';
        } else if (tipoVeiculo.includes('motocicleta') || tipoVeiculo.includes('moto') || tipoVeiculo.includes('ciclomotor')) {
          tipoId = 'moto';
        } else if (tipoVeiculo.includes('caminhão') || tipoVeiculo.includes('caminhao') || tipoVeiculo.includes('caminhonete')) {
          tipoId = 'caminhao';
        }

        setVeiculoData(prev => ({
          ...prev,
          marca: dados.marca || prev.marca,
          modelo: dados.modelo || prev.modelo,
          ano: dados.ano_modelo || prev.ano,
          tipo_veiculo_id: tipoId || prev.tipo_veiculo_id
        }));

        toast.success(`✅ Veículo encontrado: ${dados.marca} ${dados.modelo}`);
        
        // Se conseguiu mapear o tipo, buscar marcas FIPE
        if (tipoId) {
          const tipoSelecionado = tiposVeiculo.find(t => t.id === tipoId);
          if (tipoSelecionado?.tipo_fipe) {
            await carregarMarcasFipe(tipoSelecionado.tipo_fipe);
          }
        }
      } else {
        toast.warning(response.data.mensagem || 'Placa não encontrada. Preencha os dados manualmente.');
      }
    } catch (error) {
      console.error('Erro ao buscar veículo por placa:', error);
      toast.warning('Não foi possível consultar a placa. Preencha os dados manualmente.');
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

  // Salvar progresso no CRM
  const salvarProgressoCRM = async (step) => {
    try {
      const token = localStorage.getItem('token');
      const progressData = {
        lead_id: leadId,
        step: step,
        cliente: clienteData,
        veiculo: veiculoData,
        plano: planoSelecionado,
        complementos: complementosSelecionados,
        coberturas: coberturasData,
        fotos_vistoria: fotosVistoria,
        condutor: condutorData,
        origem: 'transmill', // Origem Transmill (diferente de 'labelview')
        unidade_id: unidadeId, // ID da unidade (Transmill Auto)
        indicador_id: user?.id, // ID do usuário que está fazendo a cotação
        indicador_nome: nomeUnidade // Nome da unidade indicadora
      };

      const response = await axios.post(
        `${API}/labelview/leads/criar-atualizar`,
        progressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && !leadId) {
        setLeadId(response.data.lead_id);
      }
    } catch (error) {
      console.error('Erro ao salvar progresso CRM:', error);
      // Não bloquear o fluxo se falhar
    }
  };

  const handleDesistir = async () => {
    try {
      if (!leadId) {
        // Se não tem lead criado ainda, apenas volta para tela inicial
        setShowInitialScreen(true);
        setCurrentStep(0);
        toast.info('Cotação cancelada');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Marcar lead como abandonado no CRM
      await axios.post(
        `${API}/labelview/leads/marcar-abandonado`,
        {
          lead_id: leadId,
          motivo: motivoDesistencia,
          step: currentStep
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cotação cancelada. Seus dados foram salvos para futuro contato.');
      
      // Voltar para tela inicial
      setShowModalDesistencia(false);
      setShowInitialScreen(true);
      setCurrentStep(0);
      setMotivoDesistencia('');
      
      // Limpar dados do formulário
      setPlanoSelecionado(null);
      setComplementosSelecionados([]);
      
    } catch (error) {
      console.error('Erro ao processar desistência:', error);
      toast.error('Erro ao cancelar cotação');
    }
  };


  const handleNextStep = async () => {
    // Validações por step
    if (currentStep === 0) {
      const isValid = await validarDadosCliente();
      if (!isValid) return;
      // Salvar no CRM: Lead/Interesse
      await salvarProgressoCRM(0);
    }
    if (currentStep === 1) {
      if (!validarDadosVeiculo()) return;
      // Salvar no CRM: Negociação
      await salvarProgressoCRM(1);
    }
    if (currentStep === 2) {
      if (!validarCoberturas()) return;
      // Salvar no CRM: Negociação (com plano)
      await salvarProgressoCRM(2);
    }
    if (currentStep === 3) {
      if (!validarVistoria()) return;
      // Salvar no CRM: Aguardando Aprovação
      await salvarProgressoCRM(3);
    }
    
    // Após validar condutor (step 4), ir para VISTORIA primeiro
    if (currentStep === 4) {
      if (!validarCondutor()) return;
      // Salvar no CRM: Aguardando Aprovação (com condutor)
      await salvarProgressoCRM(4);
      setShowVistoria(true);
      return;
    }

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
    
    return true;
  };

  const finalizarCotacao = async (diaVencimento) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const cotacaoData = {
        cliente: {
          nome: condutorData.nomeCondutor || clienteData.nome,
          cpf: condutorData.cpfCondutor || clienteData.cpf,
          email: clienteData.email,
          telefone: condutorData.telefone || clienteData.telefone,
          endereco: {
            cep: condutorData.cep,
            street: condutorData.street,
            number: condutorData.number,
            neighborhood: condutorData.neighborhood,
            city: condutorData.city,
            state: condutorData.state,
            complement: condutorData.complement
          }
        },
        veiculo: veiculoData,
        plano: planoSelecionado,
        complementos: complementosSelecionados,
        coberturas: coberturasData,
        fotos_vistoria: fotosVistoria,
        condutor: condutorData,
        assinatura: assinaturaBase64,
        vencimento: {
          dia: diaVencimento
        }
      };

      const response = await axios.post(
        `${API}/labelview/cotacoes/finalizar`,
        cotacaoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('🎉 Contratação finalizada com sucesso!');
        const numeroContrato = response.data.numero_contrato;
        const cotacaoId = response.data.cotacao_id;
        
        // Mostrar modal de sucesso
        setTimeout(() => {
          alert(`
✅ PROTEÇÃO VEICULAR ATIVADA!

Número do Contrato: ${numeroContrato}
Valor da 1ª Parcela: R$ ${response.data.valor_primeira_parcela?.toFixed(2)}
Parcelas Seguintes: R$ ${response.data.valor_parcelas_seguintes?.toFixed(2)}
Dia do Vencimento: ${response.data.dia_vencimento}

Você pode acessar os detalhes da contratação na área "Minhas Proteções".
          `);
          
          // Redirecionar para área do cliente
          window.location.href = '/client-dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao finalizar cotação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao finalizar contratação');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (campo, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotosVistoria(prev => ({ ...prev, [campo]: reader.result }));
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
                      ? 'bg-transmill-olive text-white'
                      : isActive
                      ? 'bg-[#1a59ad] text-white'
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
                    currentStep > step.number ? 'bg-transmill-olive' : 'bg-gray-200'
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
      <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={24} />
            Dados do Cliente
          </div>
          {clienteExistente && (
            <Badge className="bg-transmill-olive text-white">Cliente Cadastrado</Badge>
          )}
          {criarNovoCliente && (
            <Badge className="bg-transmill-gold text-white">Novo Cliente</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Busca por CPF */}
        <div className="bg-transmill-gold/10 border border-transmill-gold rounded-lg p-4">
          <p className="text-sm text-transmill-olive-dark mb-3 font-medium">
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
              className="bg-[#1a59ad] hover:bg-[#258a15] text-white px-6"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Formulário de dados */}
        {(clienteExistente || criarNovoCliente) && (
          <div className="space-y-4">
            {criarNovoCliente && (
              <div className="bg-transmill-gold/10 border border-transmill-gold rounded-lg p-4">
                <p className="text-sm text-transmill-olive-dark font-medium">
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
      <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
        <CardTitle className="flex items-center gap-2">
          <Car size={24} />
          Dados do Veículo
        </CardTitle>
        <p className="text-sm text-white/90 mt-2">
          Selecione o tipo e buscaremos automaticamente as informações na Tabela FIPE
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Veículo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Tipo de Veículo *</label>
            <select
              value={veiculoData.tipo_veiculo_id}
              onChange={(e) => {
                const tipoSelecionado = tiposVeiculo.find(t => t.id === e.target.value);
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
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
            >
              <option value="">Selecione o tipo</option>
              {tiposVeiculo.map((tipo) => (
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
                  const marcaSelecionada = marcasFipe.find(m => m.codigo === e.target.value);
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
                  if (e.target.value) {
                    carregarModelosFipe(veiculoData.tipo_fipe, e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!marcasFipe.length}
              >
                <option value="">Selecione a marca</option>
                {marcasFipe.map((marca) => (
                  <option key={marca.codigo} value={marca.codigo}>
                    {marca.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modelo FIPE */}
          {veiculoData.marca_codigo && (
            <div>
              <label className="block text-sm font-medium mb-2">Modelo *</label>
              <select
                value={veiculoData.modelo_codigo}
                onChange={(e) => {
                  const modeloSelecionado = modelosFipe.find(m => m.codigo === e.target.value);
                  setVeiculoData({
                    ...veiculoData,
                    modelo_codigo: e.target.value,
                    modelo: modeloSelecionado?.nome || '',
                    ano: '',
                    ano_codigo: '',
                    valorFipe: ''
                  });
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!modelosFipe.length}
              >
                <option value="">Selecione o modelo</option>
                {modelosFipe.map((modelo) => (
                  <option key={modelo.codigo} value={modelo.codigo}>
                    {modelo.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ano FIPE */}
          {veiculoData.modelo_codigo && (
            <div>
              <label className="block text-sm font-medium mb-2">Ano *</label>
              <select
                value={veiculoData.ano_codigo}
                onChange={(e) => {
                  const anoSelecionado = anosFipe.find(a => a.codigo === e.target.value);
                  setVeiculoData({
                    ...veiculoData,
                    ano_codigo: e.target.value,
                    ano: anoSelecionado?.nome || ''
                  });
                  if (e.target.value) {
                    buscarValorFipe(
                      veiculoData.tipo_fipe,
                      veiculoData.marca_codigo,
                      veiculoData.modelo_codigo,
                      e.target.value
                    );
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                disabled={!anosFipe.length}
              >
                <option value="">Selecione o ano</option>
                {anosFipe.map((ano) => (
                  <option key={ano.codigo} value={ano.codigo}>
                    {ano.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Placa */}
          <div>
            <label className="block text-sm font-medium mb-2">Placa *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={veiculoData.placa}
                onChange={(e) => setVeiculoData({ ...veiculoData, placa: e.target.value.toUpperCase() })}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2fa31c]"
                placeholder="ABC-1234"
                maxLength="8"
              />
              <button
                type="button"
                onClick={buscarVeiculoPorPlaca}
                disabled={loading || !veiculoData.placa || veiculoData.placa.length < 7}
                className="px-4 py-2 bg-[#2fa31c] text-white rounded-lg hover:bg-[#258a16] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                🔍 Buscar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">💡 Digite a placa e clique em Buscar para preencher automaticamente</p>
          </div>
          
          {/* Valor FIPE (somente leitura) */}
          {veiculoData.valorFipe && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Valor FIPE</label>
              <div className="w-full px-4 py-3 border rounded-lg bg-transmill-gold/10 border-transmill-gold text-transmill-olive font-bold text-lg">
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
        <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
          <CardTitle className="flex items-center gap-2">
            <Shield size={24} />
            Selecione o Plano Principal
          </CardTitle>
          <p className="text-sm text-white/90 mt-2">
            Escolha o plano base de proteção para o veículo
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {planosDisponiveis.length === 0 ? (
            <div className={`text-center py-8 px-6 rounded-lg ${veiculoBloqueado ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50'}`}>
              {veiculoBloqueado ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Shield className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-red-700">Veículo Acima do Valor Limite</h3>
                  <p className="text-red-600 max-w-2xl mx-auto leading-relaxed">
                    {mensagemBloqueio}
                  </p>
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>📞 Atendimento Especial:</strong> Entre em contato com nossa central pelo telefone ou WhatsApp para casos de veículos com valores acima do padrão.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Nenhum plano disponível para este tipo de veículo e faixa de valor.</p>
              )}
            </div>
          ) : (
            planosDisponiveis.map((plano) => (
              <div
                key={plano.id}
                onClick={() => setPlanoSelecionado(plano)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  planoSelecionado?.id === plano.id
                    ? 'border-transmill-olive bg-transmill-gold/10'
                    : 'border-gray-300 hover:border-transmill-olive hover:bg-gray-50'
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
                      <h3 className="text-lg font-bold text-gray-800">{plano.nome_plano}</h3>
                      <Badge className="bg-transmill-gold/20 text-transmill-olive-dark">{plano.classificacao}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{plano.descricao}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <strong>Vigência:</strong> {plano.vigencia_meses} meses
                      </span>
                      {plano.taxa_adesao && (
                        <span className="text-orange-600">
                          <strong>Taxa de Adesão:</strong> R$ {plano.taxa_adesao?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-[#2fa31c]">
                      R$ {plano.valor_calculado?.toFixed(2)}
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
      {planoSelecionado && complementosDisponiveis.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} />
              Complementos Opcionais
            </CardTitle>
            <p className="text-sm text-white/90 mt-2">
              Adicione coberturas extras ao seu plano
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {complementosDisponiveis.map((complemento) => (
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
                    <div>
                      <h4 className="font-semibold text-gray-800">{complemento.nome}</h4>
                      <p className="text-sm text-gray-600 mt-1">{complemento.descricao}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-[#2fa31c]">
                        + R$ {complemento.valor?.toFixed(2)}
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
    </div>
  );

  const renderVistoria = () => (
    <Card>
      <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
        <CardTitle className="flex items-center gap-2">
          <Camera size={24} />
          Vistoria do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          Envie fotos nítidas do veículo nas 6 posições abaixo:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'frente', label: 'Frente' },
            { key: 'traseira', label: 'Traseira' },
            { key: 'lateralEsquerda', label: 'Lateral Esquerda' },
            { key: 'lateralDireita', label: 'Lateral Direita' },
            { key: 'painel', label: 'Painel' },
            { key: 'motor', label: 'Motor' }
          ].map(({ key, label }) => (
            <div key={key} className="border-2 border-dashed rounded-lg p-4 text-center">
              <label className="cursor-pointer block">
                {fotosVistoria[key] ? (
                  <div>
                    <img
                      src={fotosVistoria[key]}
                      alt={label}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <p className="text-xs text-green-600 font-medium">✓ {label}</p>
                  </div>
                ) : (
                  <div>
                    <Camera size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{label}</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(key, e.target.files[0])}
                />
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderCondutor = () => (
    <Card>
      <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
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
        <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
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
        <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
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
        <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
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
        <div className="bg-[#F5F5DC] p-4 rounded-lg border border-transmill-olive">
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

        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            ℹ️ <strong>Importante:</strong> Todos esses dados são necessários para criar a conta do cliente no sistema Transmill. A senha será enviada por e-mail após a aprovação.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderResumo = () => {
    // Calcular valores
    const valorPlan = planoSelecionado?.valor_calculado || 0;
    const valorComplementos = complementosSelecionados.reduce((sum, comp) => sum + (comp.valor || 0), 0);
    const taxaAdesao = planoSelecionado?.taxa_adesao || 0;

    return (
      <ResumoProtecaoCompleto
        clienteData={clienteData}
        veiculoData={veiculoData}
        planoSelecionado={planoSelecionado}
        complementosSelecionados={complementosSelecionados}
        coberturasData={coberturasData}
        fotosVistoria={fotosVistoria}
        condutorData={condutorData}
        assinaturaBase64={assinaturaBase64}
        valorPlano={valorPlan}
        valorComplementos={valorComplementos}
        taxaAdesao={taxaAdesao}
        onFinalizar={finalizarCotacao}
        onVoltar={() => setCurrentStep(4)}
        loading={loading}
      />
    );
  };

  // Função auxiliar removida (não mais necessária dentro de renderResumo)
  const renderResumoAntigo = () => {
    // Calcular valor total
    const valorPlan = planoSelecionado?.valor_calculado || 0;
    const valorComplementos = complementosSelecionados.reduce((sum, comp) => sum + (comp.valor || 0), 0);
    const taxaAdesao = planoSelecionado?.taxa_adesao || 0;
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
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} />
              Composição do Plano Escolhido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Plano Principal */}
            <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold">
              <h3 className="font-bold text-lg mb-3 text-transmill-olive">Plano Principal</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{planoSelecionado?.nome_plano}</p>
                  <p className="text-sm text-gray-600">{planoSelecionado?.descricao}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vigência: {planoSelecionado?.vigencia_meses} meses
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
            {complementosSelecionados.length > 0 && (
              <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold">
                <h3 className="font-bold text-lg mb-3 text-transmill-olive">Complementos Selecionados</h3>
                <div className="space-y-2">
                  {complementosSelecionados.map((comp) => (
                    <div key={comp.id} className="flex justify-between items-center py-2 border-b border-green-200 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{comp.nome}</p>
                        <p className="text-xs text-gray-600">{comp.descricao}</p>
                      </div>
                      <p className="font-bold text-[#2fa31c]">+ R$ {comp.valor?.toFixed(2)}</p>
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
              <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-orange-900">Taxa de Adesão</p>
                    <p className="text-xs text-orange-700">Pagamento único na contratação</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">R$ {taxaAdesao.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Valor Total */}
            <div className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark p-6 rounded-lg text-white">
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
                variant="outline"
                onClick={gerarPDF}
                disabled={loading}
                className="border-transmill-olive text-transmill-olive hover:bg-transmill-gold/10"
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
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="border-gray-300"
                >
                  Voltar e Modificar Plano
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja cancelar esta cotação?')) {
                      window.location.reload();
                    }
                  }}
                  className="border-transmill-gray text-transmill-gray hover:bg-gray-50"
                >
                  Cancelar Cotação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informação Final */}
        <div className="bg-transmill-gold/10 border border-transmill-gold rounded-lg p-4">
          <p className="text-sm text-transmill-olive-dark">
            ℹ️ <strong>Próximo passo:</strong> Após continuar, você irá para a vistoria do veículo e depois finalizará o cadastro completo do cliente.
          </p>
        </div>
      </div>
    );
  };

  // Renderizar tela inicial antes do processo
  if (showInitialScreen) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#1a59ad] p-4 shadow-md">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-white">Proteção Veicular</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Card Hero Principal */}
          <Card className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white overflow-hidden">
            <CardContent className="p-6 text-center relative">
              <div className="relative z-10">
                <Shield className="w-16 h-16 mx-auto mb-4 text-white/90" />
                <h2 className="text-2xl font-bold mb-2">Proteção Veicular Labelview</h2>
                <p className="text-white/90 mb-4">
                  Contrate proteção completa para seu veículo
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-white/20 text-white">
                    🛡️ Cobertura completa
                  </Badge>
                  <Badge className="bg-white/20 text-white">
                    🚗 Assistência 24h
                  </Badge>
                </div>
              </div>
              {/* Círculos decorativos */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10"></div>
            </CardContent>
          </Card>

          {/* Card Saldo Disponível */}
          <Card className="border-transmill-gold">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Saldo disponível</p>
                  <p className="text-2xl font-bold text-transmill-olive">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user?.balance || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <DollarSign className="w-8 h-8 text-transmill-gold mb-2" />
                  <p className="text-xs text-gray-500">Pague com seu saldo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefícios em Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-transmill-gold/10 border-transmill-gold">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-transmill-olive" />
                <h3 className="font-semibold text-sm text-transmill-olive mb-1">Roubo e Furto</h3>
                <p className="text-xs text-gray-600">Proteção contra sinistros</p>
              </CardContent>
            </Card>

            <Card className="bg-transmill-gold/10 border-transmill-gold">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-transmill-olive" />
                <h3 className="font-semibold text-sm text-transmill-olive mb-1">Assistência 24h</h3>
                <p className="text-xs text-gray-600">Suporte a qualquer hora</p>
              </CardContent>
            </Card>

            <Card className="bg-transmill-gold/10 border-transmill-gold">
              <CardContent className="p-4 text-center">
                <Car className="w-8 h-8 mx-auto mb-2 text-transmill-olive" />
                <h3 className="font-semibold text-sm text-transmill-olive mb-1">Carro Reserva</h3>
                <p className="text-xs text-gray-600">Veículo substituto</p>
              </CardContent>
            </Card>

            <Card className="bg-transmill-gold/10 border-transmill-gold">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-transmill-olive" />
                <h3 className="font-semibold text-sm text-transmill-olive mb-1">Colisão</h3>
                <p className="text-xs text-gray-600">Cobertura de acidentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão para iniciar contratação */}
          <Button
            className="w-full bg-transmill-olive hover:bg-transmill-olive-dark text-white py-6 text-lg"
            onClick={() => setShowInitialScreen(false)}
          >
            <Shield className="mr-2" size={24} />
            Iniciar Contratação
          </Button>

          {/* Informações adicionais */}
          <Card className="bg-transmill-gold/10 border-transmill-gold">
            <CardContent className="p-4">
              <h4 className="font-semibold text-transmill-olive mb-3">🛡️ Como funciona?</h4>
              <ul className="text-sm text-transmill-olive-dark space-y-2">
                <li>• Preencha os dados do seu veículo</li>
                <li>• Escolha o plano de proteção ideal</li>
                <li>• Faça a vistoria fotográfica</li>
                <li>• Cadastre os dados do condutor</li>
                <li>• Finalize e comece a usar!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se estiver na vistoria, mostrar componente VistoriaVeiculo (ANTES da assinatura)
  if (showVistoria) {
    return (
      <VistoriaVeiculo
        cotacaoId={cotacaoId}
        tipoVeiculoId={veiculoData.tipo_veiculo_id}
        onComplete={(data) => {
          toast.success('✅ Vistoria enviada! Aguarde aprovação do Master Labelview para continuar.');
          toast.info('📧 Você receberá uma notificação quando sua vistoria for aprovada.');
          // Redirecionar para dashboard - cliente deve aguardar aprovação
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        }}
        onBack={() => {
          setShowVistoria(false);
          setCurrentStep(4); // Voltar para step de condutor
        }}
      />
    );
  }

  // Se estiver na assinatura, mostrar componente AssinaturaContrato (DEPOIS da vistoria aprovada)
  if (showAssinatura) {
    return (
      <AssinaturaContrato
        cotacaoData={{ id: cotacaoId, ...veiculoData, ...coberturaData }}
        clienteData={condutorData}
        onComplete={(data) => {
          toast.success('✅ Contrato assinado com sucesso!');
          toast.info('Agora você pode realizar o pagamento da taxa de adesão.');
          setShowAssinatura(false);
          // Redirecionar para tela de pagamento ou dashboard
          setTimeout(() => {
            window.location.href = '/minha-protecao-labelview';
          }, 2000);
        }}
        onBack={() => setShowAssinatura(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com botão voltar */}
      <div className="bg-[#1a59ad] p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Proteção Veicular</h1>
            <p className="text-white/80 text-sm">Etapa {currentStep + 1} de 6</p>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Card interno com título */}
        <Card className="bg-white shadow-lg border-2 border-transmill-gold">
          <CardHeader className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
            <div className="flex items-center gap-3">
              <Shield size={32} />
              <div>
                <CardTitle className="text-2xl">Proteção Veicular Labelview</CardTitle>
                <p className="text-white/90 text-sm mt-1">
                  Contrate proteção completa para seu veículo
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Stepper minimalista - 6 Etapas */}
          <div className="px-6 py-4 bg-gray-50 border-b border-transmill-gold/30">
            <div className="flex items-center justify-between">
              {[
                { num: 0, label: 'Cliente', icon: User },
                { num: 1, label: 'Veículo', icon: Car },
                { num: 2, label: 'Planos', icon: Shield },
                { num: 3, label: 'Vistoria', icon: Camera },
                { num: 4, label: 'Condutor', icon: PenTool },
                { num: 5, label: 'Resumo', icon: FileText }
              ].map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                
                return (
                  <React.Fragment key={step.num}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isActive ? 'bg-transmill-olive text-white scale-110' : ''}
                        ${isCompleted ? 'bg-transmill-gold text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                      `}>
                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-transmill-olive' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < 5 && (
                      <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-transmill-gold' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Conteúdo do step */}
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>

          {/* Navegação */}
          <div className="px-6 py-4 bg-gray-50 border-t border-transmill-gold/30 flex justify-between items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 0) {
                  setShowInitialScreen(true);
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
              disabled={loading}
              className="border-transmill-olive text-transmill-olive hover:bg-transmill-olive hover:text-white"
            >
              <ChevronLeft size={20} className="mr-2" />
              Voltar
            </Button>

            {/* Botão Desistir - Aparece do step 1 em diante */}
            {currentStep >= 1 && (
              <Button
                variant="outline"
                onClick={() => setShowModalDesistencia(true)}
                disabled={loading}
                className="border-red-400 text-red-600 hover:bg-red-50"
              >
                Desistir
              </Button>
            )}

            <Button
              onClick={handleNextStep}
              disabled={loading}
              className="bg-transmill-olive hover:bg-transmill-olive-dark text-white"
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
        </Card>
      </div>

      {/* Modal de Desistência */}
      {showModalDesistencia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Deseja realmente cancelar a cotação?
              </h3>
              <p className="text-gray-600 mb-4">
                Seus dados serão salvos e você poderá retomar a cotação posteriormente. Nossa equipe também poderá entrar em contato para ajudá-lo.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da desistência (opcional)
                </label>
                <textarea
                  value={motivoDesistencia}
                  onChange={(e) => setMotivoDesistencia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                  rows="3"
                  placeholder="Ex: Preciso avaliar outras opções, valores acima do esperado, etc."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModalDesistencia(false);
                    setMotivoDesistencia('');
                  }}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Voltar à Cotação
                </Button>
                <Button
                  onClick={handleDesistir}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Confirmar Desistência
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtecaoVeicularPage;
