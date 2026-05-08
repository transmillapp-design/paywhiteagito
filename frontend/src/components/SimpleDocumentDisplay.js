import React, { useState } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  FileImage, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';

const SimpleDocumentDisplay = () => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(null);

  // URLs de exemplo para documentos
  const exampleDocs = {
    profile_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzQzODVmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm90byBkZSBQZXJmaWw8L3RleHQ+PC9zdmc+',
    rg_front: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UkcgLSBGcmVudGU8L3RleHQ+PC9zdmc+',
    rg_back: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzk5MzNmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UkcgLSBWZXJzbzwvdGV4dD48L3N2Zz4='
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

  const getDocumentImage = (type) => {
    // Se o usuário tem o documento, usar o real, senão usar exemplo
    const realDoc = user?.[type];
    const exampleDoc = exampleDocs[type];
    
    return realDoc || exampleDoc;
  };

  const getStatus = (type) => {
    const hasRealDoc = user?.[type];
    
    if (hasRealDoc) {
      return { status: 'Enviado', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    } else {
      return { status: 'Exemplo', color: 'bg-orange-100 text-orange-700', icon: AlertCircle };
    }
  };

  const DocumentCard = ({ type }) => {
    const { status, color, icon: StatusIcon } = getStatus(type);
    const documentImage = getDocumentImage(type);
    
    return (
      <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm">{getDocumentLabel(type)}</h3>
            <Badge className={color}>
              <StatusIcon size={12} className="mr-1" />
              {status}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <img 
                src={documentImage} 
                alt={getDocumentLabel(type)}
                className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowPreview(documentImage)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(documentImage)}
              className="w-full text-xs"
            >
              <Eye size={14} className="mr-1" />
              Visualizar
            </Button>
            
            {!user?.[type] && (
              <p className="text-xs text-orange-600 text-center">
                * Imagem de exemplo
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Documentos Enviados</h3>
        <p className="text-sm text-gray-600">Status da verificação de documentos</p>
      </div>

      {/* Grid de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCard type="profile_image" />
        <DocumentCard type="rg_front" />
        <DocumentCard type="rg_back" />
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <FileImage className="text-blue-600" size={16} />
          <span className="text-blue-800 font-medium text-sm">Status da Verificação</span>
        </div>
        <p className="text-blue-700 text-xs">
          Documentos são verificados automaticamente pelo sistema de compliance
        </p>
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(null)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X size={16} />
            </Button>
            <img 
              src={showPreview} 
              alt="Preview do documento"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDocumentDisplay;