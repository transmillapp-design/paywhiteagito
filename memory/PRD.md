# PRD - Sistema Transmill Super App

## Versão Atual
**v2.39.0** (2026-06-20) - ✅ **VERSÃO LIMPA + REDESIGN ESTILO 99**

## Verticais Ativas
- ✅ **Mobilidade** - Corridas P2P, motoristas, passageiros
- ✅ **Lojas de Produtos** - Marketplace com catálogo e pedidos
- ✅ **Lojas de Serviços** - Prestadores de serviço
- ✅ **Carteira Digital** - Saldo, depósito, saque, PIX, cashback
- ✅ **Criptoativos (USDT)** - Dentro da carteira digital (via XGate)
- ✅ **Franquias/White-Label** - Multi-unidade com branding
- ✅ **Notificações Push** - WebPush (VAPID)
- ✅ **Referral** - Sistema de indicação

## Verticais Removidas (v2.39.0)
- ❌ Labelview / Proteção Veicular
- ❌ Telemedicina
- ❌ Internet Móvel
- ❌ Feed Social / Rede Social
- ❌ Chatbot Interno
- ❌ CRM Kanban de Proteção
- ❌ Exportação PDF/Excel de Labelview

## Status de Saúde do Sistema
- **Backend:** ✅ Funcionando (8764 linhas, 98 endpoints em server.py + routers modulares)
- **Frontend:** ✅ Funcionando (build OK)
- **Database:** ✅ Conectado
- **Service Worker:** v7 - Network-first para HTML

## Refatoração server.py (P0 - em andamento)
**Batch 4 (2026-06):** Migrados 37 endpoints de server.py para 5 routers modulares novos, usando camada de auth compartilhada `routes/deps.py` (get_current_user/get_current_master_user/verify_token wrapping auth_utils):
- `routes/fipe.py` (4) - Brasil API / FIPE
- `routes/usdt.py` (9) - USDT wallet + master/usdt approvals
- `routes/provider_schedule.py` (8) - disponibilidade prestador + agendamentos
- `routes/orders.py` (7) - pedidos + catálogo
- `routes/payment_methods.py` (2) - preferências de pagamento
- server.py: 10394 → 8764 linhas; 135 → 98 endpoints. Testado: 30/30 OK (iteration_11.json).
- Bug corrigido: `/api/master/all-transactions` (serialização ObjectId, _id projetado fora).
**Restam ~98 endpoints** em server.py para migrar (grupos com helpers compartilhados: admin/franquias, master CRUD, prestador/services, auth) — exigem extração de helpers para módulo compartilhado.

## Arquitetura Backend

```
/app/backend/
├── server.py                  # Core (10394 linhas, 129 endpoints)
├── routes/
│   ├── auth.py                # Autenticação
│   ├── auth_utils.py          # Auth compartilhado (DictObject + JWT)
│   ├── mobility_routes.py     # Mobilidade P2P (24 endpoints)
│   ├── master.py              # Admin (segmentos, tipos prestador)
│   ├── wallet.py              # Carteira digital
│   ├── stores.py              # Marketplace
│   ├── merchant.py            # Gestão lojistas
│   ├── notifications.py       # Push notifications
│   ├── franquias.py           # White-label
│   ├── users.py               # Perfil/documentos
│   ├── admin.py               # Administração
│   ├── referral.py            # Indicações
│   ├── xgate.py               # PIX/USDT
│   └── _deprecated/           # Routers removidos
│       ├── labelview.py
│       ├── social.py
│       └── exports.py
├── models/
│   └── mobility_models.py
└── utils/
```

## Layout Frontend (estilo 99 app)
- **Header:** Cor primária white-label + "Olá, {nome}!" + Pix + Notificação + Menu
- **Mapa:** Google Maps (~40% da tela)
- **Search bar:** "Para onde vamos?" (redireciona para seleção de corrida)
- **Banner:** Carrossel promocional rotativo
- **Lojas:** Horizontal scroll com cards de lojas recomendadas
- **Bottom Nav:** Flutuante, pill-shaped (rounded-full), com shadow
  - Mobilidade (Car) | Lojas (Utensils) | Serviços (Package) | Carteira ($)
- **White-Label:** Cores e logo dinâmicos por empresa contratante

## Credenciais de Teste
- **Master Admin:** marcelotransmillapp@gmail.com / !Ma04202011@
- **Franchise User:** transmillapp@gmail.com / demo123

## Integrações 3rd Party
- Cloudinary (imagens)
- XGate (PIX/USDT) - parcialmente quebrado, fallback ativo
- Google Maps API
- pywebpush (VAPID)
- ViaCEP
- Parallelum/Brasil API (FIPE)

## Issues Conhecidos
- XGate USDT Rate retorna 403 (fallback CoinGecko/Binance ativo)
- FIPE API não retorna dados para todos os modelos (limitação externa)

## Próximas Tarefas
1. **P0:** Continuar refatoração server.py (~129 endpoints restantes)
2. **P1:** Integração Asaas (gateway de pagamento)
3. **P1:** Preparar PWA para empacotamento (TWA/Capacitor)
