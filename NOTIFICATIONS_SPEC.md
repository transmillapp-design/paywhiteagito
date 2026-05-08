# SISTEMA DE NOTIFICAÇÕES - ESPECIFICAÇÃO TÉCNICA

## ARQUITETURA

### Abordagem: Polling + Badge + Toast
- **Polling**: Verificação a cada 30 segundos
- **Badge**: Contador de notificações não lidas
- **Toast**: Alertas visuais importantes
- **Som**: Notificação sonora (opcional)

## BACKEND

### Endpoint: GET /api/notifications/my-notifications
**Retorna:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif-123",
      "type": "order_status_changed",
      "title": "Pedido Confirmado",
      "message": "Seu pedido #ABC123 foi confirmado!",
      "order_id": "abc-123",
      "status": "confirmed",
      "read": false,
      "created_at": "2024-10-14T10:30:00Z"
    }
  ],
  "unread_count": 3
}
```

### Tipos de Notificação:

**Cliente:**
- `order_confirmed`: Pedido confirmado
- `order_preparing`: Pedido em preparo
- `order_ready`: Pedido pronto
- `order_delivering`: Saiu para entrega
- `order_completed`: Pedido entregue

**Lojista:**
- `new_order`: Novo pedido recebido
- `order_cancelled`: Cliente cancelou

### Endpoint: POST /api/notifications/{notification_id}/mark-read
Marca notificação como lida

### Endpoint: POST /api/notifications/mark-all-read
Marca todas como lidas

## FRONTEND

### NotificationContext
Provider global para gerenciar notificações

### Components:
1. **NotificationBell**: Ícone sino com badge
2. **NotificationCenter**: Modal/Dropdown com lista
3. **NotificationToast**: Popup temporário

### Hooks:
- `useNotifications()`: Hook para acessar notificações
- `useNotificationPolling()`: Inicia polling automático

## FLUXO

### Cliente Faz Pedido:
1. Cliente cria pedido
2. Backend cria notificação para LOJISTA: "new_order"
3. Lojista vê badge (1) no sino
4. Toast aparece: "🔔 Novo Pedido Recebido!"
5. Som toca (se habilitado)

### Lojista Atualiza Status:
1. Lojista move pedido no Kanban (ex: pending → confirmed)
2. Backend cria notificação para CLIENTE: "order_confirmed"
3. Cliente vê badge (1) no sino
4. Toast aparece: "✅ Seu pedido foi confirmado!"

### Cliente Abre Notificações:
1. Clica no sino
2. Lista de notificações aparece
3. Clica em notificação
4. Vai para página do pedido
5. Notificação marcada como lida

## POLLING

### Quando ativar:
- Cliente na home ou em /meus-pedidos
- Lojista no Meu Negócio (aba Pedidos)

### Intervalo:
- 30 segundos (padrão)
- Pausar quando aba inativa (Page Visibility API)

## SOM DE NOTIFICAÇÃO

### Arquivo: notification.mp3
- Curto (1-2s)
- Discreto
- Configurável (on/off nas configurações)

## PRÓXIMOS PASSOS

### Fase 1 (MVP): ✅ Implementar agora
- Backend: Endpoints de notificações
- Frontend: Polling + Badge + Toast básico

### Fase 2 (Futuro):
- WebSockets para tempo real
- Push Notifications (browser)
- Notificações por email/SMS
- Filtros e busca

### Fase 3 (Avançado):
- Notificações agrupadas
- Preferências de notificação
- Histórico completo
- Analytics de engajamento

## IMPLEMENTAÇÃO

Vou implementar FASE 1 agora com:
1. Backend completo
2. NotificationBell component
3. Polling system
4. Badge contador
5. Toast integration
