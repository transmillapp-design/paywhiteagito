import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  FileImage, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Trash2,
  Eye
} from 'lucide-react';
import { useAuth } from '../App';

const DocumentUpload = ({ userType = 'cliente' }) => {
  const { API, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState({
    profile_image: null,
    rg_front: null,
    rg_back: null
  });
  const [previews, setPreviews] = useState({
    profile_image: null,
    rg_front: null,
    rg_back: null
  });

  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      
      setDocuments(prev => ({
        ...prev,
        [documentType]: base64
      }));

      setPreviews(prev => ({
        ...prev,
        [documentType]: base64
      }));

      toast.success(`${getDocumentLabel(documentType)} selecionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao converter arquivo:', error);
      toast.error('Erro ao processar arquivo');
    }
  };

  const handleUploadProfileImage = async () => {
    if (!documents.profile_image) {
      toast.error('Selecione uma imagem de perfil primeiro');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API}/user/profile-image`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          profile_image: documents.profile_image
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Imagem de perfil atualizada com sucesso! 🎉');
        setDocuments(prev => ({ ...prev, profile_image: null }));
        setPreviews(prev => ({ ...prev, profile_image: null }));
      } else {
        throw new Error(data.detail || 'Erro ao atualizar imagem');
      }
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      toast.error(error.message || 'Erro ao atualizar imagem de perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!documents.rg_front && !documents.rg_back) {
      toast.error('Selecione pelo menos um documento RG');
      return;
    }

    try {
      setLoading(true);
      const payload = {};
      
      if (documents.rg_front) payload.rg_front = documents.rg_front;
      if (documents.rg_back) payload.rg_back = documents.rg_back;

      const response = await fetch(`${API}/user/documents`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Documentos enviados: ${data.updated_documents.join(', ')} 🎉`);
        // Limpar documentos enviados
        if (documents.rg_front) {
          setDocuments(prev => ({ ...prev, rg_front: null }));
          setPreviews(prev => ({ ...prev, rg_front: null }));
        }
        if (documents.rg_back) {
          setDocuments(prev => ({ ...prev, rg_back: null }));
          setPreviews(prev => ({ ...prev, rg_back: null }));
        }
      } else {
        throw new Error(data.detail || 'Erro ao enviar documentos');
      }
    } catch (error) {
      console.error('Erro no upload dos documentos:', error);
      toast.error(error.message || 'Erro ao enviar documentos');
    } finally {
      setLoading(false);
    }
  };

  const removeDocument = (documentType) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: null
    }));
    setPreviews(prev => ({
      ...prev,
      [documentType]: null
    }));
    toast.success(`${getDocumentLabel(documentType)} removido`);
  };

  const getDocumentLabel = (type) => {
    switch (type) {
      case 'profile_image':
        return userType === 'cliente' ? 'Foto de Perfil' : 'Logo da Empresa';
      case 'rg_front':
        return 'RG - Frente';
      case 'rg_back':
        return 'RG - Verso';
      default:
        return 'Documento';
    }
  };

  const getDocumentDescription = (type) => {
    switch (type) {
      case 'profile_image':
        return userType === 'cliente' 
          ? 'Sua foto de perfil para identificação' 
          : 'Logo da sua empresa';
      case 'rg_front':
        return 'Frente do seu documento de identidade (RG)';
      case 'rg_back':
        return 'Verso do seu documento de identidade (RG)';
      default:
        return '';
    }
  };

  const DocumentUploadSection = ({ type, icon: Icon }) => (
    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center">
          <Icon size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="font-bold text-lg mb-2">{getDocumentLabel(type)}</h3>
          <p className="text-gray-600 text-sm mb-4">{getDocumentDescription(type)}</p>
          
          {previews[type] ? (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={previews[type]} 
                  alt={getDocumentLabel(type)}
                  className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-green-500"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDocument(type)}
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle size={12} className="mr-1" />
                Pronto para envio
              </Badge>
            </div>
          ) : (
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, type)}
                className="hidden"
                id={`file-${type}`}
              />
              <Label
                htmlFor={`file-${type}`}
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Camera size={16} className="mr-2" />
                Selecionar Imagem
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-full">
                <FileImage size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Documentos para Compliance</h2>
                <p className="text-blue-100 text-sm">Envie seus documentos para verificação</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white">
              <AlertCircle size={12} className="mr-1" />
              Obrigatório
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocumentUploadSection type="profile_image" icon={Camera} />
        <DocumentUploadSection type="rg_front" icon={FileImage} />
        <DocumentUploadSection type="rg_back" icon={FileImage} />
      </div>

      {/* Upload Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Upload Profile Image */}
            {documents.profile_image && (
              <Button
                onClick={handleUploadProfileImage}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload size={16} />
                    <span>Enviar {getDocumentLabel('profile_image')}</span>
                  </div>
                )}
              </Button>
            )}

            {/* Upload Documents */}
            {(documents.rg_front || documents.rg_back) && (
              <Button
                onClick={handleUploadDocuments}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload size={16} />
                    <span>Enviar Documentos RG</span>
                  </div>
                )}
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-bold text-yellow-800 mb-2">📋 Instruções Importantes</p>
                <ul className="space-y-1 text-yellow-700">
                  <li>• <strong>Qualidade:</strong> Use imagens claras e bem iluminadas</li>
                  <li>• <strong>Formato:</strong> Aceita JPG, PNG, WebP (máximo 5MB)</li>
                  <li>• <strong>RG:</strong> Todos os dados devem estar legíveis</li>
                  <li>• <strong>Compliance:</strong> Documentos são verificados pelo Master</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;