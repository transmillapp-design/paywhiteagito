import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  FileImage, 
  Eye, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  X,
  Camera
} from 'lucide-react';

const DocumentViewer = ({ showUpload = false }) => {
  const { user, token, API } = useAuth();
  const [documents, setDocuments] = useState({
    profile_image: null,
    rg_front: null,
    rg_back: null
  });
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = () => {
    if (user) {
      setDocuments({
        profile_image: user.profile_image || null,
        rg_front: user.rg_front || null,
        rg_back: user.rg_back || null
      });
      setLoading(false);
    }
  };

  const getDocumentLabel = (type) => {
    switch (type) {
      case 'profile_image':
        return user?.user_type === 'lojista' ? 'Logo da Empresa' : 'Foto de Perfil';
      case 'rg_front':
        return 'RG - Frente';
      case 'rg_back':
        return 'RG - Verso';
      default:
        return 'Documento';
    }
  };

  const getStatus = (documentData) => {
    if (!documentData) {
      return { status: 'Não Enviado', color: 'bg-red-100 text-red-700', icon: AlertCircle };
    }
    // Assumindo que se existe o documento, foi enviado
    return { status: 'Enviado', color: 'bg-green-100 text-green-700', icon: CheckCircle };
  };

  const DocumentCard = ({ type, data }) => {
    const { status, color, icon: StatusIcon } = getStatus(data);
    
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">{getDocumentLabel(type)}</h3>
            <Badge className={color}>
              <StatusIcon size={12} className="mr-1" />
              {status}
            </Badge>
          </div>

          {data ? (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={data} 
                  alt={getDocumentLabel(type)}
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                  onClick={() => setShowPreview(data)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(data)}
                className="w-full"
              >
                <Eye size={16} className="mr-2" />
                Visualizar
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <FileImage className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-500 text-sm mb-3">Documento não enviado</p>
              {showUpload && (
                <Button variant="outline" size="sm">
                  <Upload size={16} className="mr-2" />
                  Enviar Documento
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Carregando documentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FileImage size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Meus Documentos</h2>
              <p className="text-blue-100 text-sm">Status da verificação</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCard type="profile_image" data={documents.profile_image} />
        <DocumentCard type="rg_front" data={documents.rg_front} />
        <DocumentCard type="rg_back" data={documents.rg_back} />
      </div>

      {/* Informações */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 mt-1" size={20} />
            <div className="text-sm">
              <p className="font-bold text-yellow-800 mb-2">ℹ️ Informações sobre Documentos</p>
              <ul className="space-y-1 text-yellow-700">
                <li>• Documentos são verificados pelo sistema de compliance</li>
                <li>• A aprovação é necessária para funcionalidades completas</li>
                <li>• Em caso de rejeição, você receberá instruções para reenvio</li>
                <li>• Mantenha seus documentos atualizados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(null)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg"
            >
              <X size={16} />
            </Button>
            <img 
              src={showPreview} 
              alt="Preview do documento"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;