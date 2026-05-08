import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  User, 
  FileImage, 
  Eye, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import SimpleDocumentDisplay from './SimpleDocumentDisplay';

const CompleteUserProfile = () => {
  const { user, token, API } = useAuth();
  const [showDocumentPreview, setShowDocumentPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatCPF = (cpf) => {
    if (!cpf) return 'Não informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return 'Não informado';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const isLojista = user?.user_type === 'lojista';
  const isPrestador = user?.user_type === 'service_provider';

  const formatPhone = (phone) => {
    if (!phone) return 'Não informado';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado!`);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'ativo':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle size={12} className="mr-1" />Aprovado</Badge>;
      case 'pending':
      case 'pendente':
      case 'pendente de verificação':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle size={12} className="mr-1" />Pendente</Badge>;
      case 'rejected':
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-700"><X size={12} className="mr-1" />Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700"><AlertCircle size={12} className="mr-1" />Não Verificado</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header do Perfil */}
      <Card className="bg-gradient-to-r from-[#005B9C] to-[#005B9C] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-4 rounded-full">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.name || user?.full_name || user?.business_name || 'Usuário'}</h1>
                <p className="text-blue-100">
                  {user?.user_type === 'cliente' ? 'Cliente Pessoa Física' : 
                   user?.user_type === 'lojista' ? 'Lojista Pessoa Jurídica' : 
                   'Prestador de Serviços'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(user?.verification_status || 'Pendente de Verificação')}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Calendar size={20} className="mx-auto mb-1" />
              <p className="text-xs text-blue-100">Membro desde</p>
              <p className="font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '11/10/2025'}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Shield size={20} className="mx-auto mb-1" />
              <p className="text-xs text-blue-100">Código</p>
              <p className="font-bold">{user?.referral_code || 'Z9AAVSIM'}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <CheckCircle size={20} className="mx-auto mb-1" />
              <p className="text-xs text-blue-100">Documentos</p>
              <p className="font-bold">{(user?.rg_front && user?.rg_back) ? 'Enviados' : 'Pendente'}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <CreditCard size={20} className="mx-auto mb-1" />
              <p className="text-xs text-blue-100">PIX</p>
              <p className="font-bold">{user?.pix_key ? 'Configurado' : 'Pendente'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User size={20} className="text-blue-500" />
              <span>Dados Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{isLojista ? 'Razão Social' : 'Nome Completo'}</p>
                <p className="font-bold">
                  {isLojista ? (user?.business_name || 'Empresa Demo Ltda') : 
                   (user?.name || user?.full_name || 'Cliente Demo')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{isLojista ? 'CNPJ' : 'CPF'}</p>
                <div className="flex items-center space-x-2">
                  <p className="font-bold">
                    {isLojista ? 
                      formatCNPJ(user?.cnpj || '12345678000100') : 
                      formatCPF(user?.cpf || '12345678901')
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(
                      isLojista ? (user?.cnpj || '12345678000100') : (user?.cpf || '12345678901'), 
                      isLojista ? 'CNPJ' : 'CPF'
                    )}
                    className="p-1"
                  >
                    <Copy size={12} />
                  </Button>
                </div>
                {!(isLojista ? user?.cnpj : user?.cpf) && (
                  <p className="text-xs text-orange-500 mt-1">* Dados de exemplo</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-bold">
                  {user?.email || 
                   (isLojista ? 'lojista@demo.com' : 
                    isPrestador ? 'prestador@demo.com' : 'cliente@demo.com')}
                </p>
                <p className="text-xs text-gray-500">(não editável)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-bold">{formatPhone(user?.phone || '11987654321')}</p>
              </div>
            </div>

            {isLojista && (
              <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-3">
                <div>
                  <p className="text-sm text-gray-600">Nome Fantasia</p>
                  <p className="font-bold">{user?.fantasy_name || 'Loja Demo'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responsável Legal</p>
                  <p className="font-bold">{user?.legal_representative || 'João da Silva'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados PIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard size={20} className="text-green-500" />
              <span>Conta PIX para Saques</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.pix_key || !user?.cpf ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">Chave PIX Cadastrada</p>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle size={12} className="mr-1" />
                      {user?.pix_key ? 'Ativa' : 'Exemplo'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-green-900">{user?.pix_key || '123.456.789-01'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(user?.pix_key || '123.456.789-01', 'Chave PIX')}
                      className="p-1"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Tipo: {user?.pix_type || 'CPF'}
                  </p>
                  {!user?.pix_key && (
                    <p className="text-xs text-orange-500 mt-1">* Dados de exemplo</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Banco</p>
                    <p className="font-bold">{user?.bank_name || 'Banco Inter'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Titular</p>
                    <p className="font-bold">{user?.account_holder || user?.name || 'Cliente Demo'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-yellow-600" size={32} />
                </div>
                <h3 className="font-bold text-yellow-800 mb-2">Conta PIX não cadastrada</h3>
                <p className="text-yellow-600 text-sm mb-4">
                  Para realizar saques, você precisa cadastrar sua chave PIX
                </p>
                <Badge className="bg-yellow-100 text-yellow-700">
                  Entre em contato com o suporte
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin size={20} className="text-purple-500" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">CEP</p>
                <p className="font-bold">{user?.zip_code || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cidade</p>
                <p className="font-bold">{user?.city || 'Não informado'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Rua</p>
              <p className="font-bold">{user?.street || 'Não informado'}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-gray-600">Número</p>
                <p className="font-bold">{user?.number || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bairro</p>
                <p className="font-bold">{user?.neighborhood || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="font-bold">{user?.state || 'Não informado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos Enviados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileImage size={20} className="text-orange-500" />
              <span>Documentos de Verificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDocumentDisplay />
          </CardContent>
        </Card>
      </div>

      {/* Modal de Preview de Documento */}
      {showDocumentPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDocumentPreview(null)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg"
            >
              <X size={16} />
            </Button>
            <img 
              src={showDocumentPreview} 
              alt="Preview do documento"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteUserProfile;