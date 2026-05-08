import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertCircle, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const LabelviewNotificationBell = () => {
  const { API } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar contagem de não lidas
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/labelview/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newCount = response.data.unread_count;
        
        // Se aumentou, mostrar toast
        if (newCount > unreadCount && unreadCount > 0) {
          toast.info('Você tem novas notificações Labelview!', {
            icon: '🔔',
            duration: 3000
          });
        }
        
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem:', error);
    }
  };

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/labelview/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/labelview/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Poll de notificações a cada 30 segundos
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [unreadCount]);

  // Buscar notificações quando abrir
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Função para renderizar prioridade
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'media':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baixa':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'alta':
        return '🔴';
      case 'media':
        return '🟡';
      case 'baixa':
        return '🔵';
      default:
        return '⚪';
    }
  };

  // Download de anexo
  const downloadAttachment = (attachmentData, attachmentType, title) => {
    try {
      const link = document.createElement('a');
      link.href = attachmentData;
      link.download = `${title}.${attachmentType === 'pdf' ? 'pdf' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notificações</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-white/90 mt-1">
                {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
              </p>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a59ad] mx-auto"></div>
                <p className="mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma notificação</p>
                <p className="text-sm mt-1">Você está em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    {/* Cabeçalho da notificação */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getPriorityColor(notification.priority)}`}>
                        {getPriorityIcon(notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Título e badge não lida */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                          )}
                        </div>

                        {/* Remetente */}
                        <p className="text-xs text-gray-500 mb-2">
                          De: <span className="font-medium">{notification.sender_name}</span>
                        </p>

                        {/* Mensagem */}
                        <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                          {notification.message}
                        </p>

                        {/* Anexo */}
                        {notification.attachment_data && (
                          <div className="mt-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {notification.attachment_type === 'pdf' ? (
                                <FileText size={16} className="text-red-600" />
                              ) : (
                                <ImageIcon size={16} className="text-blue-600" />
                              )}
                              <span className="text-xs font-medium text-gray-700">
                                {notification.attachment_type === 'pdf' ? 'Documento PDF' : 'Imagem'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadAttachment(
                                  notification.attachment_data,
                                  notification.attachment_type,
                                  notification.title
                                );
                              }}
                              className="text-[#1a59ad] hover:text-[#2fa31c] transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        )}

                        {/* Rodapé com data e prioridade */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  fetchNotifications();
                  toast.success('Notificações atualizadas!');
                }}
                className="w-full text-sm text-[#1a59ad] hover:text-[#2fa31c] font-medium transition-colors"
              >
                Atualizar notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelviewNotificationBell;
