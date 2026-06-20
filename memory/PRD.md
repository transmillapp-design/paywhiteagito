# PRD - Sistema Transmill Super App

## Versão Atual
**v2.39.0** (2026-06-20) - ✅ **VERSÃO LIMPA PARA GITHUB**

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
- **Backend:** ✅ Funcionando (10394 linhas, 129 endpoints)
- **Frontend:** ✅ Funcionando (build OK)
- **Database:** ✅ Conectado
- **Service Worker:** v7 - Network-first para HTML

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
