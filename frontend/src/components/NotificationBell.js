import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, ShoppingBag, Package, Clock } from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const NotificationBell = () => {
  const { API, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);

  // Criar som de notificação (beep simples)
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const createBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequência do beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    audioRef.current = createBeep;
  }, []);

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

      const response = await axios.get(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newCount = response.data.unread_count;
        
        // Se aumentou, mostrar toast E tocar som
        if (newCount > unreadCount && unreadCount > 0) {
          // Verificar se é novo pedido (buscar última notificação)
          const notifResponse = await axios.get(`${API}/notifications?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const lastNotif = notifResponse.data.notifications?.[0];
          
          // Tocar som se for novo pedido (importante para lojista)
          if (lastNotif?.type === 'new_order') {
            try {
              if (audioRef.current) {
                audioRef.current();
              }
            } catch (e) {
              console.log('Som desabilitado pelo navegador');
            }
            
            toast.success('🔔 Novo Pedido Recebido!', {
              duration: 5000,
              style: {
                background: '#10B981',
                color: 'white',
                fontWeight: 'bold'
              }
            });
          } else {
            toast.info('Você tem novas notificações!', {
              icon: '🔔',
              duration: 3000
            });
          }
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

      const response = await axios.get(`${API}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
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
      await axios.put(
        `${API}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar localmente
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas:', error);
      toast.error('Erro ao marcar notificações');
    }
  };

  // Polling a cada 30 segundos
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  // Abrir dropdown
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Ícone por tipo de notificação
  const getIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <ShoppingBag size={20} className="text-green-600" />;
      case 'order_status':
        return <Package size={20} className="text-blue-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  // Cor do badge por tipo
  const getBadgeColor = (type) => {
    switch (type) {
      case 'new_order':
        return 'bg-green-500';
      case 'order_status':
        return 'bg-blue-500';
      default:
        return 'bg-purple-500';
    }
  };

  // Formatar tempo
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // segundos

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={24} />
        
        {/* Badge com contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-[100] max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
            <div>
              <h3 className="font-bold text-gray-900">Notificações</h3>
              <p className="text-xs text-gray-600">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: '500px' }}>
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <Clock className="animate-spin mx-auto mb-2" size={32} />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Nenhuma notificação</p>
                <p className="text-xs mt-1">Você está em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Ícone */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${getBadgeColor(notification.type)} bg-opacity-10 flex items-center justify-center`}>
                          {getIcon(notification.type)}
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(notification.created_at)}
                          </span>
                          
                          {notification.data?.order_id && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              #{notification.data.order_id.substring(0, 8)}
                            </span>
                          )}
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
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aqui pode navegar para página de notificações completa se existir
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
