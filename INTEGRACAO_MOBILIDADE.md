# Integração Transmill + App Mobilidade (Servidor Separado)

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA FINAL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         TRANSMILL (PWA)                             │  │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │  │
│   │  │   Cliente   │    │  Motorista  │    │     Card Mobilidade     │  │  │
│   │  │   (Home)    │    │   (Home)    │    │  - Solicitar corrida    │  │  │
│   │  │             │    │             │    │  - Acessar como motorista│  │  │
│   │  └─────────────┘    └─────────────┘    └─────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    │ Token JWT                              │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    SERVIDOR EMERGENT - TRANSMILL                    │  │
│   │                    (Backend Atual - FastAPI)                        │  │
│   │                                                                     │  │
│   │   Endpoints existentes:                                             │  │
│   │   - POST /api/auth/login        (autenticação)                      │  │
│   │   - GET  /api/user/profile      (dados do usuário)                  │  │
│   │   - GET  /api/user/balance      (saldo carteira)                    │  │
│   │                                                                     │  │
│   │   Novos endpoints (proxy para mobilidade):                          │  │
│   │   - POST /api/mobility/validate-token  (validar usuário)            │  │
│   │   - POST /api/mobility/debit-balance   (debitar saldo)              │  │
│   │   - POST /api/mobility/credit-balance  (creditar motorista)         │  │
│   │                                                                     │  │
│   │   MongoDB: transmill                                                │  │
│   │   - users (clientes e motoristas - mesma coleção)                   │  │
│   │   - transactions                                                    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    │ API REST (HTTPS)                       │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                 SERVIDOR EMERGENT - MOBILIDADE                      │  │
│   │                 (Backend Separado - FastAPI)                        │  │
│   │                                                                     │  │
│   │   Endpoints de mobilidade:                                          │  │
│   │   - POST /api/driver/register        (registrar como motorista)     │  │
│   │   - PUT  /api/driver/profile         (dados veículo/valores)        │  │
│   │   - PUT  /api/driver/availability    (online/offline)               │  │
│   │   - PUT  /api/driver/location        (atualizar localização)        │  │
│   │   - GET  /api/drivers/nearby         (motoristas próximos)          │  │
│   │                                                                     │  │
│   │   - POST /api/ride/request           (cliente solicita corrida)     │  │
│   │   - POST /api/ride/accept            (motorista aceita)             │  │
│   │   - POST /api/ride/start             (iniciar corrida)              │  │
│   │   - POST /api/ride/complete          (finalizar corrida)            │  │
│   │   - POST /api/ride/cancel            (cancelar corrida)             │  │
│   │   - GET  /api/ride/history           (histórico de corridas)        │  │
│   │                                                                     │  │
│   │   MongoDB: mobilidade                                               │  │
│   │   - drivers (perfil motorista + veículo + valores)                  │  │
│   │   - rides (corridas)                                                │  │
│   │   - driver_locations (localizações em tempo real)                   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### 1. Cliente Solicita Corrida (via Transmill)

```
1. Cliente abre Transmill → Card "Mobilidade"
2. Frontend envia requisição para SERVIDOR MOBILIDADE
3. Servidor Mobilidade valida token JWT no SERVIDOR TRANSMILL
4. Se válido, cria solicitação de corrida
5. Notifica motoristas próximos (WebSocket)
6. Motorista aceita
7. Corrida inicia
8. Corrida finaliza
9. Servidor Mobilidade solicita débito no SERVIDOR TRANSMILL
10. Transmill debita cliente e credita motorista
```

### 2. Motorista se Cadastra

```
1. Usuário já tem conta no Transmill (tipo: cliente)
2. Abre Card "Mobilidade" → "Quero ser motorista"
3. Frontend envia dados para SERVIDOR MOBILIDADE
4. Servidor Mobilidade valida token no TRANSMILL
5. Cria registro de motorista com user_id do Transmill
6. Motorista configura: veículo, taxa mínima, valor/km
```

---

## Modelos de Dados

### Servidor Mobilidade - Coleção `drivers`

```javascript
{
    "id": "uuid",
    "transmill_user_id": "id-do-usuario-no-transmill",  // Referência
    "email": "motorista@email.com",                     // Cache para buscas
    "full_name": "Nome do Motorista",                   // Cache
    "phone": "11999999999",                             // Cache
    
    // Dados do Veículo
    "vehicle": {
        "placa": "ABC-1234",
        "modelo": "Honda Civic",
        "marca": "Honda",
        "cor": "Prata",
        "ano": 2020,
        "tipo": "sedan"  // sedan, suv, moto, van
    },
    
    // CNH
    "cnh": {
        "numero": "123456789",
        "categoria": "B",
        "validade": "2028-12-31"
    },
    
    // Valores
    "pricing": {
        "taxa_minima": 8.00,       // R$ valor mínimo da corrida
        "valor_por_km": 2.50,      // R$ por km
        "valor_por_minuto": 0.30,  // R$ por minuto (opcional)
        "taxa_noturna": 1.20       // Multiplicador noturno (22h-6h)
    },
    
    // Status
    "is_active": true,             // Cadastro ativo
    "is_online": false,            // Disponível para corridas
    "is_verified": true,           // Documentos verificados
    
    // Localização atual
    "current_location": {
        "lat": -23.5505,
        "lng": -46.6333,
        "updated_at": "2025-12-26T14:00:00Z"
    },
    
    // Estatísticas
    "stats": {
        "total_rides": 150,
        "rating": 4.8,
        "rating_count": 120,
        "acceptance_rate": 0.92,
        "cancellation_rate": 0.05
    },
    
    "created_at": "2025-12-26T10:00:00Z",
    "updated_at": "2025-12-26T14:00:00Z"
}
```

### Servidor Mobilidade - Coleção `rides`

```javascript
{
    "id": "uuid",
    
    // Participantes (IDs do Transmill)
    "client_id": "transmill-user-id-cliente",
    "driver_id": "transmill-user-id-motorista",
    "driver_profile_id": "id-do-perfil-motorista-aqui",
    
    // Origem e Destino
    "origin": {
        "lat": -23.5505,
        "lng": -46.6333,
        "address": "Av. Paulista, 1000 - São Paulo"
    },
    "destination": {
        "lat": -23.5605,
        "lng": -46.6433,
        "address": "Rua Augusta, 500 - São Paulo"
    },
    
    // Rota
    "route": {
        "distance_km": 5.2,
        "duration_min": 15,
        "polyline": "encoded_polyline_string"
    },
    
    // Valores
    "pricing": {
        "base_fare": 8.00,          // Taxa mínima
        "distance_fare": 13.00,     // 5.2km * R$2.50
        "time_fare": 4.50,          // 15min * R$0.30
        "surge_multiplier": 1.0,    // Multiplicador de demanda
        "total": 25.50,
        "driver_earnings": 22.95,   // 90% para motorista
        "platform_fee": 2.55        // 10% para plataforma
    },
    
    // Status
    "status": "completed",  // pending, accepted, arriving, in_progress, completed, cancelled
    
    // Timestamps
    "requested_at": "2025-12-26T14:00:00Z",
    "accepted_at": "2025-12-26T14:01:00Z",
    "started_at": "2025-12-26T14:05:00Z",
    "completed_at": "2025-12-26T14:20:00Z",
    
    // Avaliações
    "client_rating": 5,
    "driver_rating": 5,
    "client_comment": "Ótimo motorista!",
    "driver_comment": "Passageiro educado",
    
    // Pagamento
    "payment": {
        "method": "wallet",              // wallet (Transmill) ou pix
        "status": "completed",
        "transmill_transaction_id": "id-transacao-transmill"
    }
}
```

---

## Endpoints de Comunicação entre Servidores

### No TRANSMILL (novos endpoints)

```python
# Validar token e retornar dados do usuário
POST /api/mobility/validate-token
Request: { "token": "jwt_token" }
Response: {
    "valid": true,
    "user": {
        "id": "user-id",
        "email": "user@email.com",
        "full_name": "Nome Completo",
        "phone": "11999999999",
        "balance": 150.00,
        "profile_image": "url"
    }
}

# Debitar saldo do cliente
POST /api/mobility/debit-balance
Request: {
    "user_id": "client-id",
    "amount": 25.50,
    "ride_id": "ride-id",
    "description": "Corrida - Origem → Destino"
}
Response: { "success": true, "new_balance": 124.50 }

# Creditar saldo do motorista
POST /api/mobility/credit-balance
Request: {
    "user_id": "driver-id",
    "amount": 22.95,
    "ride_id": "ride-id",
    "description": "Ganho corrida - Origem → Destino"
}
Response: { "success": true, "new_balance": 522.95 }
```

### No SERVIDOR MOBILIDADE

```python
# Autenticação (usa token do Transmill)
# Todos os endpoints recebem header: Authorization: Bearer {transmill_token}

# Motorista
POST   /api/driver/register          # Cadastrar como motorista
GET    /api/driver/profile           # Ver perfil motorista
PUT    /api/driver/profile           # Atualizar veículo/valores
PUT    /api/driver/availability      # Online/Offline
PUT    /api/driver/location          # Atualizar GPS
GET    /api/driver/earnings          # Ganhos do período

# Corridas
POST   /api/ride/estimate            # Calcular valor da corrida
POST   /api/ride/request             # Solicitar corrida
GET    /api/ride/available           # Corridas disponíveis (motorista)
POST   /api/ride/{id}/accept         # Aceitar corrida
POST   /api/ride/{id}/arrive         # Cheguei no local
POST   /api/ride/{id}/start          # Iniciar corrida
POST   /api/ride/{id}/complete       # Finalizar corrida
POST   /api/ride/{id}/cancel         # Cancelar corrida
POST   /api/ride/{id}/rate           # Avaliar corrida
GET    /api/ride/history             # Histórico de corridas

# Busca
GET    /api/drivers/nearby?lat=X&lng=Y  # Motoristas próximos
```

---

## Configuração de Ambiente

### No Servidor Mobilidade (.env)

```env
MONGO_URL=mongodb://...
DB_NAME=mobilidade

# URL do Transmill para validação de tokens e transações
TRANSMILL_API_URL=https://api-decompose-1.preview.emergentagent.com
TRANSMILL_API_KEY=chave-secreta-compartilhada

# WebSocket para notificações em tempo real
WEBSOCKET_ENABLED=true
```

### No Servidor Transmill (.env) - Adicionar

```env
# Chave para validar requisições do servidor de mobilidade
MOBILITY_API_KEY=chave-secreta-compartilhada
MOBILITY_API_URL=https://api-decompose-1.preview.emergentagent.com
```

---

## Fluxo de Autenticação

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Cliente    │      │  Transmill   │      │  Mobilidade  │
│   (App)      │      │  (Backend)   │      │  (Backend)   │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │  1. Login           │                     │
       │────────────────────>│                     │
       │                     │                     │
       │  2. Token JWT       │                     │
       │<────────────────────│                     │
       │                     │                     │
       │  3. Abre Card Mobilidade                  │
       │  4. Request + Token │                     │
       │─────────────────────────────────────────>│
       │                     │                     │
       │                     │  5. Validate Token  │
       │                     │<────────────────────│
       │                     │                     │
       │                     │  6. User Data       │
       │                     │────────────────────>│
       │                     │                     │
       │  7. Response        │                     │
       │<─────────────────────────────────────────│
       │                     │                     │
```

---

## Próximos Passos (quando iniciar)

1. **No Transmill (este servidor):**
   - [ ] Criar endpoints de integração (`/api/mobility/*`)
   - [ ] Adicionar Card "Mobilidade" na home
   - [ ] Configurar variáveis de ambiente

2. **No Servidor Mobilidade (novo servidor Emergent):**
   - [ ] Criar estrutura FastAPI + MongoDB
   - [ ] Implementar validação de token via Transmill
   - [ ] Criar endpoints de motorista e corridas
   - [ ] Implementar WebSocket para tempo real
   - [ ] Criar interface (pode ser React ou integrado ao Transmill)

---

## Observações

- **Mesma conta:** Motorista e cliente usam a mesma conta Transmill
- **Saldo único:** Débitos e créditos acontecem na carteira Transmill
- **Servidores separados:** Mobilidade tem seu próprio servidor para não pesar no Transmill
- **Comunicação:** Via API REST com autenticação por chave compartilhada
- **Tempo real:** WebSocket no servidor de mobilidade para atualizações

---

**Criado em:** 2025-12-26
**Status:** Aguardando início do desenvolvimento
