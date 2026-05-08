import React, { useState, useEffect } from 'react';
import { X, Send, Upload, AlertCircle, Image, FileText, Users } from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const SendNotificationModal = ({ isOpen, onClose }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchDocument, setSearchDocument] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'media',
    attachment_type: null,
    attachment_data: null,
    recipient_id: null
  });

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // Limpar campos ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchDocument('');
      setFoundUser(null);
      setFormData({
        title: '',
        message: '',
        priority: 'media',
        attachment_type: null,
        attachment_data: null,
        recipient_id: null
      });
      setAttachmentFile(null);
      setAttachmentPreview(null);
    }
  }, [isOpen]);

  // Buscar usuário Transmill por CPF/CNPJ
  const searchUserByDocument = async () => {
    if (!searchDocument || searchDocument.length < 11) {
      toast.error('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido');
      return;
    }

    try {
      setSearchingUser(true);
      const token = localStorage.getItem('token');
      
      // Remove caracteres especiais
      const cleanDocument = searchDocument.replace(/[^\d]/g, '');
      
      const response = await axios.get(`${API}/users/search-by-document/${cleanDocument}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.user) {
        setFoundUser(response.data.user);
        setFormData(prev => ({
          ...prev,
          recipient_id: response.data.user.id
        }));
        toast.success(`Usuário encontrado: ${response.data.user.full_name}`);
      } else {
        setFoundUser(null);
        toast.error('Usuário não encontrado na base Transmill');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setFoundUser(null);
      toast.error('Erro ao buscar usuário. Verifique o CPF/CNPJ');
    } finally {
      setSearchingUser(false);
    }
  };

  // Formatar CPF/CNPJ durante digitação
  const handleDocumentChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    
    if (value.length <= 11) {
      // CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      value = value.substring(0, 14);
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    setSearchDocument(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      toast.error('Apenas imagens (PNG, JPG) ou PDF são permitidos');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAttachmentFile(file);
      setAttachmentPreview(base64);
      setFormData(prev => ({
        ...prev,
        attachment_type: isPDF ? 'pdf' : 'image',
        attachment_data: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setFormData(prev => ({
      ...prev,
      attachment_type: null,
      attachment_data: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.title.trim()) {
      toast.error('Digite um título');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (!foundUser || !formData.recipient_id) {
      toast.error('Busque e selecione um destinatário pelo CPF/CNPJ');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API}/labelview/notifications`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(
          `Notificação enviada para ${response.data.recipients_count} ${
            response.data.recipients_count === 1 ? 'destinatário' : 'destinatários'
          }!`
        );
        
        // Resetar formulário
        setFormData({
          title: '',
          message: '',
          priority: 'media',
          attachment_type: null,
          attachment_data: null,
          recipient_ids: []
        });
        setAttachmentFile(null);
        setAttachmentPreview(null);
        
        onClose();
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientTypeBadge = (type) => {
    const badges = {
      labelview_unidade: { label: 'Unidade', color: 'bg-purple-100 text-purple-700' },
      labelview_regional: { label: 'Regional', color: 'bg-blue-100 text-blue-700' },
      labelview_consultor: { label: 'Consultor', color: 'bg-green-100 text-green-700' },
      labelview_colaborador: { label: 'Colaborador', color: 'bg-yellow-100 text-yellow-700' },
      cliente: { label: 'Cliente', color: 'bg-gray-100 text-gray-700' }
    };
    
    return badges[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Send size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Enviar Notificação</h2>
                <p className="text-sm text-white/90">Sistema de comunicação Labelview</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Buscar Destinatário por CPF/CNPJ */}
            <div className="bg-[#e3dcda] p-4 rounded-lg border-2 border-[#1a59ad]">
              <label className="block text-sm font-medium text-[#1a59ad] mb-2">
                🔍 Buscar Destinatário (Conta Transmill) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchDocument}
                  onChange={handleDocumentChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                  placeholder="Digite CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)"
                  maxLength={18}
                />
                <button
                  type="button"
                  onClick={searchUserByDocument}
                  disabled={searchingUser || !searchDocument}
                  className="px-6 py-3 bg-[#1a59ad] text-white rounded-lg hover:bg-[#2fa31c] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {searchingUser ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              
              {/* Usuário Encontrado */}
              {foundUser && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#2fa31c]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2fa31c] flex items-center justify-center text-white font-semibold">
                      {foundUser.full_name ? foundUser.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1a59ad]">{foundUser.full_name}</p>
                      <p className="text-sm text-gray-600">{foundUser.email}</p>
                      <p className="text-xs text-gray-500">
                        {foundUser.cpf ? `CPF: ${foundUser.cpf}` : `CNPJ: ${foundUser.cnpj || 'N/A'}`}
                      </p>
                    </div>
                    <div className="text-[#2fa31c]">
                      ✓ Selecionado
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-600 mt-2">
                💡 A notificação será enviada para a conta <strong>Transmill</strong> do usuário
              </p>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Notificação *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                placeholder="Ex: Atualização importante"
                maxLength={100}
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent resize-none"
                placeholder="Digite sua mensagem aqui..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/1000 caracteres
              </p>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'baixa', label: 'Baixa', icon: '🔵', color: 'border-blue-500 bg-blue-50' },
                  { value: 'media', label: 'Média', icon: '🟡', color: 'border-yellow-500 bg-yellow-50' },
                  { value: 'alta', label: 'Alta', icon: '🔴', color: 'border-red-500 bg-red-50' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.priority === priority.value
                        ? `${priority.color} border-2`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{priority.icon}</span>
                    <p className="text-sm font-medium mt-1">{priority.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Anexo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexo (opcional)
              </label>
              
              {!attachmentFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#1a59ad] transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Clique para fazer upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Imagem (PNG, JPG) ou PDF • Máx 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.attachment_type === 'pdf' ? (
                      <FileText size={32} className="text-red-600" />
                    ) : (
                      <Image size={32} className="text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">{attachmentFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachmentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send size={16} />
                Enviar Notificação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationModal;
