/**
 * CadastroFranquiaPage - Página pública de cadastro de franquia
 * Acessada via link compartilhável gerado pelo admin
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Building, 
  MapPin, 
  Users, 
  FileText, 
  Image, 
  Upload, 
  Save, 
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Shield
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const CadastroFranquiaPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    // Dados da empresa
    nome: '',
    slug: '',
    razao_social: '',
    cnpj: '',
    inscricao_estadual: '',
    estado: '',
    cidades: '',
    
    // Endereço
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    
    // Responsável
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_rg: '',
    responsavel_telefone: '',
    responsavel_email: '',
    
    // Contato comercial
    email_contato: '',
    telefone_contato: '',
    
    // Identidade visual
    cor_primaria: '#1a59ad',
    cor_secundaria: '#ffffff',
    cor_texto: '#ffffff',
    
    // Documentos
    documentos: {
      contrato_social: null,
      comprovante_endereco: null,
      documento_responsavel: null
    },
    
    // Observações
    observacoes: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [docPreviews, setDocPreviews] = useState({});

  // Auto-gerar slug
  useEffect(() => {
    if (formData.nome) {
      const slug = formData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.nome]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnderecoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }
    
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDocChange = (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      documentos: { ...prev.documentos, [docType]: file }
    }));
    
    // Preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setDocPreviews(prev => ({ ...prev, [docType]: e.target.result }));
      reader.readAsDataURL(file);
    } else {
      setDocPreviews(prev => ({ ...prev, [docType]: file.name }));
    }
  };

  const buscarCEP = async () => {
    const cep = formData.endereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }
      }));
      toast.success('Endereço preenchido!');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validações
      if (!formData.nome || !formData.estado || !formData.responsavel_nome) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      // Enviar dados
      const submitData = {
        ...formData,
        cidades: formData.cidades.split(',').map(c => c.trim()).filter(c => c),
        origem: 'link_cadastro',
        data_cadastro: new Date().toISOString()
      };
      
      const response = await axios.post(`${API}/api/franquias/solicitacao`, submitData);
      
      if (response.data.success) {
        // Upload de documentos se houver
        const solicitacaoId = response.data.solicitacao_id;
        
        // Upload logo
        if (logoFile) {
          const logoFormData = new FormData();
          logoFormData.append('file', logoFile);
          logoFormData.append('tipo', 'logo');
          await axios.post(`${API}/api/franquias/solicitacao/${solicitacaoId}/documento`, logoFormData);
        }
        
        // Upload documentos
        for (const [tipo, file] of Object.entries(formData.documentos)) {
          if (file) {
            const docFormData = new FormData();
            docFormData.append('file', file);
            docFormData.append('tipo', tipo);
            await axios.post(`${API}/api/franquias/solicitacao/${solicitacaoId}/documento`, docFormData);
          }
        }
        
        setSubmitted(true);
        toast.success('Cadastro enviado com sucesso!');
      } else {
        toast.error(response.data.error || 'Erro ao enviar cadastro');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#293618] to-[#1a2410] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Cadastro Enviado!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de franquia foi enviada com sucesso. 
              Nossa equipe entrará em contato em breve para dar continuidade ao processo.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
              <p className="font-medium text-gray-700 mb-2">Próximos passos:</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="bg-[#293618] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                  Análise da documentação enviada
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-[#293618] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                  Contato para esclarecimentos
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-[#293618] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                  Assinatura do contrato de franquia
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-[#293618] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                  Ativação do sistema
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-[#293618] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Transmill Plataforma</h1>
              <p className="text-sm opacity-80">Cadastro de Nova Franquia</p>
            </div>
          </div>
          
          {/* Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[
              { num: 1, label: 'Empresa' },
              { num: 2, label: 'Endereço' },
              { num: 3, label: 'Responsável' },
              { num: 4, label: 'Documentos' },
              { num: 5, label: 'Visual' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div 
                  className={`flex items-center gap-2 cursor-pointer ${step >= s.num ? 'opacity-100' : 'opacity-50'}`}
                  onClick={() => setStep(s.num)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s.num ? 'bg-white text-[#293618]' : 
                    step > s.num ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                  }`}>
                    {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                  </div>
                  <span className="text-sm hidden sm:block">{s.label}</span>
                </div>
                {i < 4 && <ArrowRight className="h-4 w-4 opacity-50" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 -mt-4">
        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Dados da Empresa */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-[#293618]" />
                  <h2 className="text-lg font-semibold">Dados da Empresa</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Fantasia *</Label>
                    <Input 
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Ex: Transmill São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input 
                      value={formData.razao_social}
                      onChange={(e) => handleChange('razao_social', e.target.value)}
                      placeholder="Nome completo da empresa"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input 
                      value={formData.cnpj}
                      onChange={(e) => handleChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Estadual</Label>
                    <Input 
                      value={formData.inscricao_estadual}
                      onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
                      placeholder="Número da IE"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estado de Atuação *</Label>
                    <Input 
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="UF"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Cidades de Atuação</Label>
                    <Input 
                      value={formData.cidades}
                      onChange={(e) => handleChange('cidades', e.target.value)}
                      placeholder="São Paulo, Campinas, Santos (separadas por vírgula)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Endereço */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-[#293618]" />
                  <h2 className="text-lg font-semibold">Endereço da Sede</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.endereco.cep}
                        onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                        placeholder="00000-000"
                      />
                      <Button variant="outline" onClick={buscarCEP}>
                        Buscar
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label>Rua</Label>
                    <Input 
                      value={formData.endereco.rua}
                      onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input 
                      value={formData.endereco.numero}
                      onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input 
                      value={formData.endereco.complemento}
                      onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                      placeholder="Sala 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input 
                      value={formData.endereco.bairro}
                      onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                      placeholder="Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input 
                      value={formData.endereco.cidade}
                      onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Responsável */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-[#293618]" />
                  <h2 className="text-lg font-semibold">Responsável pela Franquia</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={formData.responsavel_nome}
                      onChange={(e) => handleChange('responsavel_nome', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input 
                      value={formData.responsavel_cpf}
                      onChange={(e) => handleChange('responsavel_cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <Input 
                      value={formData.responsavel_rg}
                      onChange={(e) => handleChange('responsavel_rg', e.target.value)}
                      placeholder="Número do RG"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone Celular</Label>
                    <Input 
                      value={formData.responsavel_telefone}
                      onChange={(e) => handleChange('responsavel_telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email do Responsável</Label>
                    <Input 
                      type="email"
                      value={formData.responsavel_email}
                      onChange={(e) => handleChange('responsavel_email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone Comercial</Label>
                    <Input 
                      value={formData.telefone_contato}
                      onChange={(e) => handleChange('telefone_contato', e.target.value)}
                      placeholder="(11) 3333-3333"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documentos */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-[#293618]" />
                  <h2 className="text-lg font-semibold">Documentos</h2>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Envie os documentos necessários para análise. Formatos aceitos: PDF, JPG, PNG (máx. 10MB cada).
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'contrato_social', label: 'Contrato Social', desc: 'Última alteração consolidada' },
                    { key: 'comprovante_endereco', label: 'Comprovante de Endereço', desc: 'Conta de luz, água ou telefone' },
                    { key: 'documento_responsavel', label: 'Documento do Responsável', desc: 'RG, CNH ou Passaporte' }
                  ].map((doc) => (
                    <div key={doc.key} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          <p className="text-sm text-gray-500">{doc.desc}</p>
                        </div>
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById(`doc-${doc.key}`).click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {docPreviews[doc.key] ? 'Alterar' : 'Enviar'}
                          </Button>
                          <input
                            id={`doc-${doc.key}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleDocChange(doc.key, e)}
                          />
                        </div>
                      </div>
                      {docPreviews[doc.key] && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {typeof docPreviews[doc.key] === 'string' && docPreviews[doc.key].startsWith('data:') 
                            ? 'Arquivo enviado' 
                            : docPreviews[doc.key]
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label>Observações Adicionais</Label>
                  <Textarea 
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais que você gostaria de compartilhar..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Identidade Visual */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-[#293618]" />
                  <h2 className="text-lg font-semibold">Identidade Visual</h2>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Personalize a aparência da sua franquia no sistema.
                </p>
                
                {/* Logo */}
                <div className="flex items-start gap-6">
                  <div 
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: formData.cor_primaria }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2 bg-white rounded-lg" />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {formData.nome?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Logo da Franquia</Label>
                    <p className="text-sm text-gray-500">JPG, PNG, WEBP ou SVG (máx. 5MB)</p>
                    <Button variant="outline" onClick={() => document.getElementById('logo-upload').click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
                
                {/* Cores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={formData.cor_primaria}
                        onChange={(e) => handleChange('cor_primaria', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={formData.cor_primaria}
                        onChange={(e) => handleChange('cor_primaria', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={formData.cor_secundaria}
                        onChange={(e) => handleChange('cor_secundaria', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={formData.cor_secundaria}
                        onChange={(e) => handleChange('cor_secundaria', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={formData.cor_texto}
                        onChange={(e) => handleChange('cor_texto', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input 
                        value={formData.cor_texto}
                        onChange={(e) => handleChange('cor_texto', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="mt-6">
                  <Label className="text-sm text-gray-500 mb-2 block">Preview da Tela de Login:</Label>
                  <div 
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: formData.cor_primaria }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-lg object-contain bg-white p-1" />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-lg flex items-center justify-center font-bold text-2xl"
                          style={{ backgroundColor: formData.cor_secundaria, color: formData.cor_primaria }}
                        >
                          {formData.nome?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-xl" style={{ color: formData.cor_texto }}>
                          {formData.nome || 'Nome da Franquia'}
                        </h3>
                        <p className="text-sm opacity-80" style={{ color: formData.cor_texto }}>
                          Ecossistema de Serviços
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                Voltar
              </Button>
              
              {step < 5 ? (
                <Button 
                  className="bg-[#293618]"
                  onClick={() => setStep(s => Math.min(5, s + 1))}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  className="bg-[#293618]"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enviar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CadastroFranquiaPage;
