import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { 
  ArrowLeft, Edit2, Save, X, User, Mail, Phone, MapPin, Building, Calendar, 
  Camera, Upload, Percent, Clock, Wrench, Link as LinkIcon, ExternalLink, FileImage, Eye, DollarSign 
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useTheme } from '../hooks/useTheme';

const UserProfile = () => {
  const { user, API, updateUser } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [businessSegments, setBusinessSegments] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  useEffect(() => {
    fetchBusinessSegments();
    fetchServiceTypes();
    
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        company_name: user.company_name || '',
        nome_fantasia: user.nome_fantasia || '',  // Nome fantasia para Labelview
        fantasy_name: user.fantasy_name || user.nome_fantasia || '',  // Alias para compatibilidade
        address: user.address || '',
        whatsapp: user.whatsapp || '',
        state: user.state || '',
        city: user.city || '',
        neighborhood: user.neighborhood || '',
        business_segment: user.business_segment || '',
        google_maps_url: user.google_maps_url || '',
        cpf: user.cpf || '',
        cep: user.cep || '',
        street: user.street || '',
        number: user.number || '',
        profile_description: user.profile_description || '',
        working_hours: user.working_hours || '',
        profile_image: user.profile_image || '',
        cashback_rate: user.cashback_rate || 0,
        pix_key: user.pix_key || '',
        pix_key_type: user.pix_key_type || '',
        menu_catalog_url: user.menu_catalog_url || '',
        provider_type_name: user.provider_type_name || '',
        service_type: user.service_type || '',
        cnpj: user.cnpj || '',
        admin_name: user.admin_name || '',
        admin_email: user.admin_email || '',
        admin_phone: user.admin_phone || '',
        admin_cpf: user.admin_cpf || '',
        company_type: user.company_type || 'pessoa_fisica' // pessoa_fisica ou empresa
      });
      setImagePreview(user.profile_image || null);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Preparar dados incluindo nome_fantasia se fantasy_name foi preenchido
      const dataToSend = {
        ...profileData,
        nome_fantasia: profileData.fantasy_name || profileData.nome_fantasia
      };
      
      const response = await fetch(`${API}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setEditing(false);
        
        // Atualizar dados do usuário no contexto com nome_fantasia sincronizado
        const updatedUser = { 
          ...user, 
          ...profileData,
          nome_fantasia: profileData.fantasy_name || profileData.nome_fantasia
        };
        updateUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.detail || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar dados originais
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        company_name: user.company_name || '',
        address: user.address || '',
        whatsapp: user.whatsapp || '',
        state: user.state || '',
        city: user.city || '',
        neighborhood: user.neighborhood || '',
        business_segment: user.business_segment || '',
        google_maps_url: user.google_maps_url || '',
        cpf: user.cpf || '',
        cep: user.cep || '',
        street: user.street || '',
        number: user.number || '',
        fantasy_name: user.fantasy_name || '',
        profile_description: user.profile_description || '',
        working_hours: user.working_hours || ''
      });
    }
    setEditing(false);
  };

  const formatUserType = (type) => {
    switch (type) {
      case 'cliente': return 'Cliente';
      case 'lojista': return 'Lojista';
      case 'service_provider': return 'Prestador de Serviços';
      case 'master': return 'Master';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const fetchBusinessSegments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/master/business-segments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusinessSegments(data.segments || []);
      }
    } catch (error) {
      console.error('Error fetching business segments:', error);
      // Fallback para segmentos padrão
      setBusinessSegments([
        'Alimentação', 'Varejo', 'Serviços', 'Saúde', 'Educação', 
        'Tecnologia', 'Beleza', 'Automóveis', 'Casa & Construção', 'Outros'
      ]);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/master/service-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceTypes(data.service_types || []);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      // Fallback para tipos padrão
      setServiceTypes([
        'Eletricista', 'Encanador', 'Pintor', 'Pedreiro', 'Carpinteiro',
        'Mecânico', 'Técnico em Eletrônicos', 'Jardineiro', 'Limpeza', 
        'Consultoria', 'Design', 'Fotografia', 'Outros'
      ]);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas.');
        return;
      }

      // Mostrar preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Mostrar loading
      toast.loading('Enviando foto...', { id: 'upload-photo' });
      
      try {
        const token = localStorage.getItem('token');
        
        // Usar FormData para upload direto (mais robusto que base64)
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Uploading file:', file.name, file.size, 'bytes');
        
        const response = await fetch(`${API}/user/profile-image-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log('Upload response:', responseData);
          
          // Usar URL do Cloudinary retornada pelo servidor
          const imageUrl = responseData.url;
          
          // Atualizar dados do usuário no contexto
          if (responseData.user) {
            updateUser(responseData.user);
            localStorage.setItem('user', JSON.stringify(responseData.user));
          } else {
            const updatedUser = { ...user, profile_image: imageUrl };
            updateUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          
          // Forçar atualização da imagem no preview
          setImagePreview(imageUrl);
          
          toast.success('✅ Foto atualizada com sucesso!', { id: 'upload-photo' });
          
          // Recarregar a página após 1 segundo
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          let errorMessage = 'Erro desconhecido';
          try {
            const errorData = await response.json();
            console.error('Upload error:', errorData);
            errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
          } catch (parseError) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            errorMessage = errorText || `HTTP ${response.status}`;
          }
          toast.error(`Erro ao atualizar foto: ${errorMessage}`, { id: 'upload-photo' });
          setImagePreview(user?.profile_image || null);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Erro ao atualizar foto: ${error.message}`, { id: 'upload-photo' });
        setImagePreview(user?.profile_image || null);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-[#2A3618]' : 'bg-[#EEEEEE]'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className={`border-2 ${isDarkMode ? 'bg-[#3F5123] border-[#005B9C]' : 'bg-[#FFFFFF] border-[#005B9C]'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className={`flex items-center ${
                    isDarkMode 
                      ? 'border-[#005B9C] text-white hover:bg-[#556B2F]' 
                      : 'border-[#005B9C] text-[#333333] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-[#005B9C]" />
                    Meu Perfil
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{formatUserType(user.user_type)}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {editing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel}
                      className="flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center bg-[#005B9C] hover:bg-[#005B9C]"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setEditing(true)}
                    className="flex items-center bg-[#005B9C] hover:bg-[#005B9C]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Foto/Logo do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-gray-700" />
              {user.user_type === 'lojista' ? 'Logo da Empresa' : 
               user.user_type === 'service_provider' ? 'Logo do Negócio' : 'Foto de Perfil'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Preview da Imagem */}
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Botão de Upload */}
                <label className="absolute bottom-0 right-0 bg-[#005B9C] hover:bg-[#005B9C] text-white p-2 rounded-full cursor-pointer shadow-lg">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                Clique no ícone para {imagePreview ? 'alterar' : 'adicionar'} sua {user.user_type === 'lojista' ? 'logo' : 'foto'}
                <br />
                <span className="text-xs">Formatos: JPG, PNG. Máx: 5MB</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Empresa - Para Master */}
        {(user.user_type === 'master' || user.is_master_account) && (
          <Card className="border-2 border-[#005B9C] bg-[#FFFFFF]">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <Building className="w-5 h-5 mr-2" />
                Dados da Empresa Master
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social</Label>
                  {editing ? (
                    <Input
                      value={profileData.company_name}
                      onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="p-2 bg-white rounded border">{user.company_name || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Nome Fantasia</Label>
                  {editing ? (
                    <Input
                      value={profileData.fantasy_name}
                      onChange={(e) => setProfileData({...profileData, fantasy_name: e.target.value})}
                      placeholder="Nome fantasia"
                    />
                  ) : (
                    <p className="p-2 bg-white rounded border">{user.fantasy_name || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>CNPJ</Label>
                  <div className="p-2 bg-gray-100 rounded border text-gray-600">
                    {user.cnpj || 'Não informado'} <span className="text-xs text-gray-500">(não editável)</span>
                  </div>
                </div>
                
                <div>
                  <Label>Email Corporativo</Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="empresa@exemplo.com"
                    />
                  ) : (
                    <p className="p-2 bg-white rounded border">{user.email || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Telefone da Empresa</Label>
                  {editing ? (
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="(00) 0000-0000"
                    />
                  ) : (
                    <p className="p-2 bg-white rounded border">{user.phone || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>WhatsApp Comercial</Label>
                  {editing ? (
                    <Input
                      value={profileData.whatsapp}
                      onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <p className="p-2 bg-white rounded border">{user.whatsapp || 'Não informado'}</p>
                  )}
                </div>
              </div>
              
              {/* Endereço da Empresa */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Endereço da Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>CEP</Label>
                    {editing ? (
                      <Input
                        value={profileData.cep}
                        onChange={(e) => setProfileData({...profileData, cep: e.target.value})}
                        placeholder="00000-000"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.cep || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Rua/Logradouro</Label>
                    {editing ? (
                      <Input
                        value={profileData.street}
                        onChange={(e) => setProfileData({...profileData, street: e.target.value})}
                        placeholder="Nome da rua"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.street || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Número</Label>
                    {editing ? (
                      <Input
                        value={profileData.number}
                        onChange={(e) => setProfileData({...profileData, number: e.target.value})}
                        placeholder="Nº"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.number || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Bairro</Label>
                    {editing ? (
                      <Input
                        value={profileData.neighborhood}
                        onChange={(e) => setProfileData({...profileData, neighborhood: e.target.value})}
                        placeholder="Bairro"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.neighborhood || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Cidade</Label>
                    {editing ? (
                      <Input
                        value={profileData.city}
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        placeholder="Cidade"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.city || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Estado</Label>
                    {editing ? (
                      <Input
                        value={profileData.state}
                        onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                        placeholder="UF"
                        maxLength={2}
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.state || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados do Administrador/Sócio - Para Master */}
        {(user.user_type === 'master' || user.is_master_account) && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <User className="w-5 h-5 mr-2" />
                Dados do Administrador / Sócio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Administrador</Label>
                  {editing ? (
                    <Input
                      value={profileData.admin_name}
                      onChange={(e) => setProfileData({...profileData, admin_name: e.target.value})}
                      placeholder="Nome completo do administrador"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{user.admin_name || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>CPF do Administrador</Label>
                  {editing ? (
                    <Input
                      value={profileData.admin_cpf}
                      onChange={(e) => setProfileData({...profileData, admin_cpf: e.target.value})}
                      placeholder="000.000.000-00"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{user.admin_cpf || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Email do Administrador</Label>
                  {editing ? (
                    <Input
                      value={profileData.admin_email}
                      onChange={(e) => setProfileData({...profileData, admin_email: e.target.value})}
                      placeholder="admin@empresa.com"
                      type="email"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{user.admin_email || 'Não informado'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Telefone do Administrador</Label>
                  {editing ? (
                    <Input
                      value={profileData.admin_phone}
                      onChange={(e) => setProfileData({...profileData, admin_phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{user.admin_phone || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados Pessoais - Para outros tipos de usuário (exceto Master e Labelview que têm seções específicas) */}
        {user.user_type !== 'master' && !user.is_master_account && 
         user.user_type !== 'labelview_master' && user.user_type !== 'labelview_unidade' && user.user_type !== 'labelview_regional' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-700" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                {editing ? (
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.full_name || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Email</Label>
                {editing ? (
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.email || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Telefone</Label>
                {editing ? (
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.phone || 'Não informado'}</p>
                )}
              </div>
              
              {/* CPF - Não editável para pessoa física */}
              {user.cpf && (
                <div>
                  <Label>CPF</Label>
                  <div className="p-2 bg-gray-100 rounded border text-gray-600">
                    {user.cpf} <span className="text-xs text-gray-500">(não editável)</span>
                  </div>
                </div>
              )}
              
              {/* CNPJ - Não editável para empresa */}
              {user.cnpj && (
                <div>
                  <Label>CNPJ</Label>
                  <div className="p-2 bg-gray-100 rounded border text-gray-600">
                    {user.cnpj} <span className="text-xs text-gray-500">(não editável)</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Dados Labelview - Para Master, Unidade e Regional */}
        {(user.user_type === 'labelview_master' || user.user_type === 'labelview_unidade' || user.user_type === 'labelview_regional') && (
          <React.Fragment>
            <Card className="border-2 border-[#556B2F] bg-[#FFFFFF]">
              <CardHeader>
                <CardTitle className="flex items-center text-[#556B2F]">
                  <Building className="w-5 h-5 mr-2" />
                  Dados da Empresa {user.user_type === 'labelview_master' ? 'Master Labelview' : user.user_type === 'labelview_unidade' ? 'Unidade' : 'Regional'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Razão Social *</Label>
                    {editing ? (
                      <Input
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                        placeholder="Nome da empresa"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.company_name || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Nome Fantasia</Label>
                    {editing ? (
                      <Input
                        value={profileData.nome_fantasia || profileData.fantasy_name}
                        onChange={(e) => setProfileData({...profileData, fantasy_name: e.target.value, nome_fantasia: e.target.value})}
                        placeholder="Nome fantasia"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.nome_fantasia || user.fantasy_name || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>CNPJ da Empresa *</Label>
                    <div className="p-2 bg-gray-100 rounded border text-gray-600">
                      {user.cnpj || 'Não informado'} (não editável)
                    </div>
                  </div>
                  
                  <div>
                    <Label>Telefone da Empresa</Label>
                    {editing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="(00) 0000-0000"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.phone || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>WhatsApp Comercial</Label>
                    {editing ? (
                      <Input
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.whatsapp || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Email Corporativo</Label>
                    {editing ? (
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="empresa@exemplo.com"
                      />
                    ) : (
                      <p className="p-2 bg-white rounded border">{user.email || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <User className="w-5 h-5 mr-2" />
                  Dados do Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Responsável *</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_name || profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, admin_name: e.target.value})}
                        placeholder="Nome completo do responsável"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_name || user.full_name || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>CPF do Responsável *</Label>
                    <div className="p-2 bg-gray-100 rounded border text-gray-600">
                      {user.admin_cpf || user.cpf || 'Não informado'} (não editável)
                    </div>
                  </div>
                  
                  <div>
                    <Label>Email do Responsável</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_email}
                        onChange={(e) => setProfileData({...profileData, admin_email: e.target.value})}
                        placeholder="responsavel@empresa.com"
                        type="email"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_email || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Telefone do Responsável</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_phone}
                        onChange={(e) => setProfileData({...profileData, admin_phone: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_phone || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </React.Fragment>
        )}

        {/* Dados Específicos por Tipo de Usuário */}
        {user.user_type === 'lojista' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-gray-700" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Empresa</Label>
                    {editing ? (
                      <Input
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.company_name || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>CNPJ</Label>
                    <div className="p-2 bg-gray-100 rounded border text-gray-600">
                      {user.cnpj || 'Não informado'} (não editável)
                    </div>
                  </div>
                  
                  <div>
                    <Label>Segmento</Label>
                    {editing ? (
                      <select
                        value={profileData.business_segment}
                        onChange={(e) => setProfileData({...profileData, business_segment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um segmento</option>
                        {businessSegments.map(segment => (
                          <option key={segment} value={segment}>{segment}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.business_segment || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>WhatsApp</Label>
                    {editing ? (
                      <Input
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.whatsapp || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Cashback Ofertado (%)</Label>
                    {editing ? (
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={profileData.cashback_rate}
                        onChange={(e) => setProfileData({...profileData, cashback_rate: parseFloat(e.target.value) || 0})}
                        placeholder="Ex: 5.5"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border flex items-center">
                        <Percent className="w-4 h-4 mr-2 text-green-600" />
                        {user.cashback_rate || 0}% de cashback
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Link do Google Maps</Label>
                    {editing ? (
                      <Input
                        value={profileData.google_maps_url}
                        onChange={(e) => setProfileData({...profileData, google_maps_url: e.target.value})}
                        placeholder="https://maps.google.com/..."
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="p-2 bg-gray-50 rounded border flex-1">{user.google_maps_url || 'Não informado'}</p>
                        {user.google_maps_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(user.google_maps_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>URL do Catálogo/Cardápio</Label>
                    {editing ? (
                      <Input
                        value={profileData.menu_catalog_url}
                        onChange={(e) => setProfileData({...profileData, menu_catalog_url: e.target.value})}
                        placeholder="https://seusite.com/catalogo/..."
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="p-2 bg-gray-50 rounded border flex-1">{user.menu_catalog_url || 'Não informado'}</p>
                        {user.menu_catalog_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(user.menu_catalog_url, '_blank')}
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            Ver Catálogo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        
        {/* Dados do Administrador da Empresa */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-700" />
                  Dados do Administrador da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Administrador</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_name}
                        onChange={(e) => setProfileData({...profileData, admin_name: e.target.value})}
                        placeholder="Nome completo do responsável"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_name || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>CPF do Administrador</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_cpf}
                        onChange={(e) => setProfileData({...profileData, admin_cpf: e.target.value})}
                        placeholder="000.000.000-00"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_cpf || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Email do Administrador</Label>
                    {editing ? (
                      <Input
                        type="email"
                        value={profileData.admin_email}
                        onChange={(e) => setProfileData({...profileData, admin_email: e.target.value})}
                        placeholder="email@empresa.com"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_email || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Telefone do Administrador</Label>
                    {editing ? (
                      <Input
                        value={profileData.admin_phone}
                        onChange={(e) => setProfileData({...profileData, admin_phone: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.admin_phone || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {user.user_type === 'service_provider' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-gray-700" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Fantasia</Label>
                    {editing ? (
                      <Input
                        value={profileData.fantasy_name}
                        onChange={(e) => setProfileData({...profileData, fantasy_name: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.fantasy_name || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Tipo de Prestador</Label>
                    {editing ? (
                      <select
                        value={profileData.company_type}
                        onChange={(e) => setProfileData({...profileData, company_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pessoa_fisica">Pessoa Física</option>
                        <option value="empresa">Empresa</option>
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">
                        {(user.company_type || profileData.company_type) === 'empresa' ? 'Empresa' : 'Pessoa Física'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Tipo de Serviço</Label>
                    {editing ? (
                      <select
                        value={profileData.service_type}
                        onChange={(e) => setProfileData({...profileData, service_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um tipo de serviço</option>
                        {serviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.service_type || user.provider_type_name || 'Não informado'}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Horário de Funcionamento</Label>
                    {editing ? (
                      <Input
                        value={profileData.working_hours}
                        onChange={(e) => setProfileData({...profileData, working_hours: e.target.value})}
                        placeholder="Ex: 08:00 às 18:00"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border">{user.working_hours || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <Label>Cashback Ofertado (%)</Label>
                    {editing ? (
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={profileData.cashback_rate}
                        onChange={(e) => setProfileData({...profileData, cashback_rate: parseFloat(e.target.value) || 0})}
                        placeholder="Ex: 5.5"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border flex items-center">
                        <Percent className="w-4 h-4 mr-2 text-green-600" />
                        {user.cashback_rate || 0}% de cashback
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Link do Google Maps</Label>
                    {editing ? (
                      <Input
                        value={profileData.google_maps_url}
                        onChange={(e) => setProfileData({...profileData, google_maps_url: e.target.value})}
                        placeholder="https://maps.google.com/..."
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="p-2 bg-gray-50 rounded border flex-1">{user.google_maps_url || 'Não informado'}</p>
                        {user.google_maps_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(user.google_maps_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Descrição Profissional</Label>
                    {editing ? (
                      <textarea
                        value={profileData.profile_description}
                        onChange={(e) => setProfileData({...profileData, profile_description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows="3"
                        placeholder="Descreva sua experiência e especialidades..."
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border min-h-[80px]">{user.profile_description || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados da Empresa (se prestador for empresa) */}
            {(user.company_type === 'empresa' || profileData.company_type === 'empresa') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2 text-gray-700" />
                    Dados da Empresa Prestadora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Empresa</Label>
                      {editing ? (
                        <Input
                          value={profileData.company_name}
                          onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                        />
                      ) : (
                        <p className="p-2 bg-gray-50 rounded border">{user.company_name || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <Label>CNPJ</Label>
                      <div className="p-2 bg-gray-100 rounded border text-gray-600">
                        {user.cnpj || 'Não informado'} <span className="text-xs text-gray-500">(não editável)</span>
                      </div>
                    </div>

                    <div>
                      <Label>Nome do Responsável</Label>
                      {editing ? (
                        <Input
                          value={profileData.admin_name}
                          onChange={(e) => setProfileData({...profileData, admin_name: e.target.value})}
                        />
                      ) : (
                        <p className="p-2 bg-gray-50 rounded border">{user.admin_name || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <Label>CPF do Responsável</Label>
                      <div className="p-2 bg-gray-100 rounded border text-gray-600">
                        {user.admin_cpf || 'Não informado'} <span className="text-xs text-gray-500">(não editável)</span>
                      </div>
                    </div>

                    <div>
                      <Label>Email da Empresa</Label>
                      {editing ? (
                        <Input
                          type="email"
                          value={profileData.admin_email}
                          onChange={(e) => setProfileData({...profileData, admin_email: e.target.value})}
                        />
                      ) : (
                        <p className="p-2 bg-gray-50 rounded border">{user.admin_email || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <Label>Telefone da Empresa</Label>
                      {editing ? (
                        <Input
                          value={profileData.admin_phone}
                          onChange={(e) => setProfileData({...profileData, admin_phone: e.target.value})}
                        />
                      ) : (
                        <p className="p-2 bg-gray-50 rounded border">{user.admin_phone || 'Não informado'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agenda do Prestador */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-700" />
                  Gerenciar Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div>
                    <h4 className="font-semibold text-indigo-900">Sistema de Agendamentos</h4>
                    <p className="text-sm text-indigo-700">Gerencie seus horários disponíveis e agendamentos de clientes</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/provider-schedule')}
                    className="bg-[#005B9C] hover:bg-[#005B9C]"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Abrir Agenda
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-700" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                {editing ? (
                  <Input
                    value={profileData.cep}
                    onChange={(e) => setProfileData({...profileData, cep: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.cep || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Rua</Label>
                {editing ? (
                  <Input
                    value={profileData.street}
                    onChange={(e) => setProfileData({...profileData, street: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.street || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Número</Label>
                {editing ? (
                  <Input
                    value={profileData.number}
                    onChange={(e) => setProfileData({...profileData, number: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.number || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Bairro</Label>
                {editing ? (
                  <Input
                    value={profileData.neighborhood}
                    onChange={(e) => setProfileData({...profileData, neighborhood: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.neighborhood || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Cidade</Label>
                {editing ? (
                  <Input
                    value={profileData.city}
                    onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.city || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Estado</Label>
                {editing ? (
                  <Input
                    value={profileData.state}
                    onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border">{user.state || 'Não informado'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários PIX para Saque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Dados Bancários PIX para Saque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>ℹ️ Importante:</strong> Estes dados serão utilizados para realizar seus saques. 
                Certifique-se de que estão corretos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Chave PIX</Label>
                <p className="p-3 bg-gray-50 rounded border font-medium">
                  {user.pix_key_type ? (() => {
                    const types = {
                      'cpf': '📄 CPF',
                      'cnpj': '🏢 CNPJ',
                      'email': '📧 E-mail',
                      'phone': '📱 Telefone',
                      'random': '🔑 Chave Aleatória'
                    };
                    return types[user.pix_key_type] || user.pix_key_type;
                  })() : 'Não informado'}
                </p>
              </div>
              
              <div>
                <Label>Chave PIX</Label>
                <div className="relative">
                  <p className="p-3 bg-gray-50 rounded border font-mono text-sm break-all">
                    {user.pix_key || 'Não informado'}
                  </p>
                  {user.pix_key && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        navigator.clipboard.writeText(user.pix_key);
                        toast.success('Chave PIX copiada!');
                      }}
                    >
                      📋 Copiar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {(!user.pix_key || !user.pix_key_type) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>⚠️ Atenção:</strong> Você precisa cadastrar seus dados PIX para realizar saques. 
                  Entre em contato com o suporte para atualizar.
                </p>
              </div>
            )}

            {user.pix_key && user.pix_key_type && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-green-800 text-sm">
                  ✅ <strong>Dados PIX configurados!</strong> Você pode realizar saques normalmente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentos de Verificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileImage className="w-5 h-5 mr-2 text-orange-600" />
              Documentos de Verificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Foto de Perfil / Logo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Camera className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <h3 className="font-bold text-sm mb-2">
                    {user.user_type === 'lojista' ? 'Logo da Empresa' : 'Foto de Perfil'}
                  </h3>
                  {user.profile_image ? (
                    <div className="space-y-2">
                      <div className="relative group">
                        <img 
                          src={user.profile_image} 
                          alt="Foto de Perfil"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        ✓ Enviado
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Nenhum documento</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        Pendente
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* RG - Frente */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <FileImage className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <h3 className="font-bold text-sm mb-2">RG - Frente</h3>
                  {user.rg_front ? (
                    <div className="space-y-2">
                      <div className="relative group">
                        <img 
                          src={user.rg_front} 
                          alt="RG Frente"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        ✓ Enviado
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Nenhum documento</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        Pendente
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* RG - Verso */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <FileImage className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <h3 className="font-bold text-sm mb-2">RG - Verso</h3>
                  {user.rg_back ? (
                    <div className="space-y-2">
                      <div className="relative group">
                        <img 
                          src={user.rg_back} 
                          alt="RG Verso"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        ✓ Enviado
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Nenhum documento</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        Pendente
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-blue-800 text-sm">
                <FileImage className="inline w-4 h-4 mr-1" />
                Para enviar ou atualizar documentos, acesse a aba "Docs" no seu dashboard
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-700" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Conta</Label>
                <p className="p-2 bg-gray-100 rounded border text-gray-600">
                  {formatUserType(user.user_type)}
                </p>
              </div>
              
              <div>
                <Label>Membro desde</Label>
                <p className="p-2 bg-gray-100 rounded border text-gray-600">
                  {formatDate(user.created_at)}
                </p>
              </div>
              
              {user.referral_code && (
                <div>
                  <Label>Código de Indicação</Label>
                  <p className="p-2 bg-gray-100 rounded border text-gray-600">
                    {user.referral_code}
                  </p>
                </div>
              )}
              
              <div>
                <Label>Status da Conta</Label>
                <p className="p-2 bg-gray-100 rounded border text-gray-600">
                  {user.is_verified ? 'Verificada' : 'Pendente de Verificação'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Labelview - Para clientes com proteção ativa */}
        {user.user_type === 'cliente' && (
          <Card className="border-2 border-[#2fa31c] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Proteção Veicular Labelview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Gerencie seu contrato de proteção veicular, visualize parcelas e documentos.
              </p>
              <Button
                onClick={() => navigate('/minha-protecao-labelview')}
                className="w-full bg-[#2fa31c] hover:bg-[#25881a] text-white font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Acessar Área Labelview
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default UserProfile;