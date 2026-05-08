import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Users, 
  Store, 
  Wrench,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Configurações por tipo de cadastro
const tiposCadastro = {
  'clube-militar': {
    titulo: 'Cadastro de Clube Militar',
    descricao: 'Cadastre sua associação ou clube militar',
    icon: Building2,
    campos: [
      { name: 'nome_clube', label: 'Nome do Clube/Associação', type: 'text', required: true },
      { name: 'cnpj', label: 'CNPJ', type: 'text', required: true, mask: 'cnpj' },
      { name: 'responsavel', label: 'Nome do Responsável', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { name: 'endereco', label: 'Endereço', type: 'text', required: false },
      { name: 'cidade', label: 'Cidade', type: 'text', required: true },
      { name: 'estado', label: 'Estado', type: 'text', required: true },
      { name: 'password', label: 'Senha', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirmar Senha', type: 'password', required: true }
    ],
    userType: 'clube_militar'
  },
  'militar': {
    titulo: 'Cadastro de Militar',
    descricao: 'Cadastre-se como militar ou familiar',
    icon: Users,
    campos: [
      { name: 'nome_completo', label: 'Nome Completo', type: 'text', required: true },
      { name: 'cpf', label: 'CPF', type: 'text', required: true, mask: 'cpf' },
      { name: 'patente', label: 'Patente/Graduação', type: 'text', required: false },
      { name: 'forca', label: 'Força (Ex: Exército, Marinha, Aeronáutica)', type: 'text', required: false },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { name: 'cidade', label: 'Cidade', type: 'text', required: true },
      { name: 'estado', label: 'Estado', type: 'text', required: true },
      { name: 'password', label: 'Senha', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirmar Senha', type: 'password', required: true }
    ],
    userType: 'militar'
  },
  'loja': {
    titulo: 'Cadastro de Loja',
    descricao: 'Cadastre sua loja ou comércio parceiro',
    icon: Store,
    campos: [
      { name: 'nome_loja', label: 'Nome da Loja', type: 'text', required: true },
      { name: 'cnpj', label: 'CNPJ', type: 'text', required: true, mask: 'cnpj' },
      { name: 'ramo_atividade', label: 'Ramo de Atividade', type: 'text', required: true },
      { name: 'responsavel', label: 'Nome do Responsável', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { name: 'endereco', label: 'Endereço', type: 'text', required: true },
      { name: 'cidade', label: 'Cidade', type: 'text', required: true },
      { name: 'estado', label: 'Estado', type: 'text', required: true },
      { name: 'password', label: 'Senha', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirmar Senha', type: 'password', required: true }
    ],
    userType: 'loja_parceira'
  },
  'prestador': {
    titulo: 'Cadastro de Prestador',
    descricao: 'Cadastre-se como prestador de serviços',
    icon: Wrench,
    campos: [
      { name: 'nome_empresa', label: 'Nome da Empresa/Profissional', type: 'text', required: true },
      { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text', required: true },
      { name: 'tipo_servico', label: 'Tipo de Serviço', type: 'text', required: true },
      { name: 'responsavel', label: 'Nome do Responsável', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { name: 'endereco', label: 'Endereço', type: 'text', required: false },
      { name: 'cidade', label: 'Cidade', type: 'text', required: true },
      { name: 'estado', label: 'Estado', type: 'text', required: true },
      { name: 'password', label: 'Senha', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirmar Senha', type: 'password', required: true }
    ],
    userType: 'prestador_servico'
  }
};

const FranquiaCadastro = () => {
  const { slug, tipo } = useParams();
  const navigate = useNavigate();
  
  const [franquia, setFranquia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({});

  const tipoCadastro = tiposCadastro[tipo];

  useEffect(() => {
    carregarFranquia();
  }, [slug]);

  useEffect(() => {
    // Inicializar formData com campos vazios
    if (tipoCadastro) {
      const initialData = {};
      tipoCadastro.campos.forEach(campo => {
        initialData[campo.name] = '';
      });
      setFormData(initialData);
    }
  }, [tipo]);

  const carregarFranquia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/franquias/${slug}`);
      
      if (response.data.success && response.data.franquia) {
        setFranquia(response.data.franquia);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao carregar franquia:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar senhas
    if (formData.password !== formData.confirm_password) {
      toast.error('As senhas não conferem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setSubmitLoading(true);
      
      const dadosCadastro = {
        ...formData,
        franquia_slug: slug,
        franquia_id: franquia?.id,
        user_type: tipoCadastro.userType,
        tipo_cadastro: tipo
      };

      // Remover confirm_password antes de enviar
      delete dadosCadastro.confirm_password;

      const response = await axios.post(`${API_URL}/api/franquia/cadastro`, dadosCadastro);

      if (response.data.success) {
        setCadastroSucesso(true);
        toast.success('Cadastro realizado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao realizar cadastro');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error(error.response?.data?.detail || 'Erro ao realizar cadastro');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!tipoCadastro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Tipo de cadastro inválido</h1>
            <p className="text-gray-500 mb-4">
              O tipo de cadastro "{tipo}" não é válido.
            </p>
            <Button onClick={() => navigate(`/franquia/${slug}/login`)} variant="outline">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1a59ad' }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Franquia não encontrada</h1>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const corPrimaria = franquia?.cor_primaria || '#1a59ad';
  const corTexto = franquia?.cor_texto || '#ffffff';
  const IconComponent = tipoCadastro.icon;

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        backgroundColor: corPrimaria,
        backgroundImage: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%)`
      }}
    >
      <div className="w-full max-w-lg mx-auto">
        {/* Header com Logo */}
        <div className="text-center mb-6">
          {franquia?.logo_url ? (
            <img 
              src={franquia.logo_url} 
              alt={franquia.nome}
              className="h-16 mx-auto mb-3 object-contain"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: corTexto }}
            >
              {franquia?.nome?.charAt(0) || 'F'}
            </div>
          )}
          <h1 
            className="text-2xl font-bold"
            style={{ color: corTexto }}
          >
            {franquia?.nome || 'Franquia'}
          </h1>
        </div>

        {/* Card de Cadastro */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div 
              className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: corPrimaria + '15' }}
            >
              <IconComponent className="h-7 w-7" style={{ color: corPrimaria }} />
            </div>
            <CardTitle className="text-xl">{tipoCadastro.titulo}</CardTitle>
            <CardDescription>{tipoCadastro.descricao}</CardDescription>
          </CardHeader>
          <CardContent>
            {cadastroSucesso ? (
              <div className="text-center py-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: '#22c55e15' }}
                >
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cadastro Realizado!</h3>
                <p className="text-gray-600 mb-6">
                  Seu cadastro foi enviado com sucesso. Em breve você receberá um e-mail de confirmação.
                </p>
                <Button
                  onClick={() => navigate(`/franquia/${slug}/login`)}
                  className="w-full"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Ir para o Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {tipoCadastro.campos.map((campo) => (
                  <div key={campo.name} className="space-y-2">
                    <Label htmlFor={campo.name}>
                      {campo.label}
                      {campo.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id={campo.name}
                        name={campo.name}
                        type={
                          campo.type === 'password' 
                            ? (campo.name === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password'))
                            : campo.type
                        }
                        value={formData[campo.name] || ''}
                        onChange={handleChange}
                        required={campo.required}
                        className={campo.type === 'password' ? 'pr-10' : ''}
                        data-testid={`cadastro-${campo.name}`}
                      />
                      {campo.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (campo.name === 'password') {
                              setShowPassword(!showPassword);
                            } else {
                              setShowConfirmPassword(!showConfirmPassword);
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {(campo.name === 'password' ? showPassword : showConfirmPassword) 
                            ? <EyeOff size={18} /> 
                            : <Eye size={18} />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  className="w-full mt-6"
                  style={{ backgroundColor: corPrimaria }}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cadastrando...
                    </>
                  ) : (
                    'Finalizar Cadastro'
                  )}
                </Button>

                <Link
                  to={`/franquia/${slug}/login`}
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <p 
            className="text-xs opacity-40"
            style={{ color: corTexto }}
          >
            Powered by Transmill
          </p>
        </div>
      </div>
    </div>
  );
};

export default FranquiaCadastro;
