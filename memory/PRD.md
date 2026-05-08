# PRD - Sistema Transmill

## Descrição do Projeto
Transmill é uma plataforma exclusiva para a família militar brasileira, oferecendo serviços de consumo, mobilidade urbana P2P, e gerenciamento de unidades/franquias. A plataforma agora suporta um sistema **White-Label COMPLETO de Franquias** que permite múltiplas franquias independentes operarem com marca, cores e dados totalmente isolados.

## Versão Atual
**v2.38.55** (2026-03-12) - ✅ **PRONTO PARA DEPLOY**

## Status de Saúde do Sistema
- **Backend:** ✅ Funcionando
- **Frontend:** ✅ Funcionando
- **Database:** ✅ Conectado
- **Bugs Críticos:** ✅ Todos Resolvidos
- **Sistema Dual PWA:** ✅ Implementado
- **Refatoração server.py:** ✅ **19 ROUTERS** + Limpeza (v2.38.55)
- **Endpoints no server.py:** 184 (reduzido de 285 → -101 endpoints migrados)
- **server.py:** 13504 linhas (reduzido de 17544 → -4040 linhas)
- **WHITE-LABEL COMPLETO:** ✅ Implementado (v2.38.43)
- **Isolamento por Unidade:** ✅ Corrigido (v2.38.45)
- **Templates de Notificação:** ✅ Implementado (v2.38.46)
- **CRM Kanban Proteção:** ✅ Implementado (v2.38.47)
- **Relatórios de Conversão:** ✅ Implementado (v2.38.48)
- **Exportação PDF/Excel:** ✅ Implementado (v2.38.49)
- **Refatoração Completa:** ✅ 19 routers (v2.38.50)
- **Limpeza Duplicados:** ✅ -5 endpoints (v2.38.51)
- **Redesign HomePage Super-App:** ✅ Implementado (v2.38.52)
- **Limpeza Stores+Social:** ✅ -728 linhas, 13 endpoints migrados (v2.38.53)
- **Limpeza Merchant+Notifications+Referral:** ✅ -1898 linhas total, 43 endpoints migrados (v2.38.54)
- **Auth Utils compartilhado:** ✅ `/app/backend/routes/auth_utils.py` (v2.38.54)
- **Mobility + Master CRUD migrados:** ✅ 40 endpoints (24 mobility + 16 master), -805 linhas (v2.38.55)
- **Service Worker PWA v7:** ✅ Network-first para HTML (v2.38.55)

## Routers Modulares (19 funcionais + 6 auxiliares)
| # | Router | Arquivo | Descrição |
|---|--------|---------|-----------|
| 1 | auth | auth.py | Autenticação, login, reset |
| 2 | wallet | wallet.py | Carteira e transações |
| 3 | admin | admin.py | Administração |
| 4 | pwa | pwa.py | PWA e manifest |
| 5 | labelview | labelview.py | Proteção veicular |
| 6 | xgate | xgate.py | PIX e USDT |
| 7 | master | master.py | Config master |
| 8 | merchant | merchant.py | Lojistas |
| 9 | services | services.py | Prestadores |
| 10 | mobility | mobility_routes.py | Mobilidade |
| 11 | users | users.py | Perfil e documentos |
| 12 | notifications | notifications.py | Notificações |
| 13 | franquias | franquias.py | Franquias |
| 14 | setup | setup.py | Configuração inicial |
| 15 | exports | exports.py | Exportação PDF/Excel |
| 16 | social | social.py | Rede social, vídeos |
| 17 | subusers | subusers.py | Colaboradores |
| 18 | stores | stores.py | Lojas públicas |
| 19 | suporte | suporte.py | Sistema de suporte |

## CRM Kanban Proteção Veicular (v2.38.47)

## Redesign HomePage Super-App (v2.38.52)

### Descrição
Nova tela principal no estilo super-app com 4 abas na navegação inferior, substituindo o layout antigo (`MinimalistHomePage`).

### Arquivo Principal
- `/app/frontend/src/pages/HomePage.js`
- `/app/frontend/src/components/FranquiaMinimalistHome.js` (wrapper atualizado para usar HomePage)

### Abas (Bottom Navigation)
| Aba | Ícone | Conteúdo |
|-----|-------|----------|
| Mobilidade | Car | Mapa com carros animados, toggle Passageiro/Motorista, busca de destino, ações rápidas (Corrida, Proteção, Internet, Saúde) |
| Lojas | Utensils | Busca, filtros de categoria, listagem de lojas, estado vazio |
| Serviços | Wrench | 6 categorias (Manutenção, Profissionais, Proteção, Saúde, Tecnologia, Suporte), prestadores próximos |
| Finanças | DollarSign | Card de saldo (BRL + USDT), ações (Depositar, Sacar, Pagar, USDT), links rápidos |

### Header
- Avatar do usuário (clicável → perfil)
- Saudação "Olá, [nome]"
- Sino de notificações
- Toggle tema claro/escuro
- Menu hambúrguer com itens dinâmicos por tipo de usuário

### White-Labeling
- Suporte a `franquiaContext` para cores e logo dinâmicos
- Cores primárias aplicadas via prop
- Rota `/franquia/:slug/home` agora usa `HomePage` (via wrapper `FranquiaMinimalistHome`)

### Banner Promocional Rotativo
- 4 banners: Proteção Veicular, Internet Móvel, Telemedicina, Mobilidade
- Auto-rotação a cada 5 segundos com dots clicáveis
- Gradientes distintos por serviço
- CTA direto para navegação

### Teste
- 100% frontend tests passing (iteration_7.json)

## CRM Kanban Proteção Veicular (v2.38.47)

### Funcionalidades
| Feature | Status | Descrição |
|---------|--------|-----------|
| Interface Kanban | ✅ | 6 colunas com drag-and-drop |
| Criar Lead Manual | ✅ | Formulário modal completo |
| Mover Leads | ✅ | Arrastar entre colunas |
| Notificações Push | ✅ | Alerta para responsáveis |
| Busca de Leads | ✅ | Por nome, CPF, email, telefone |
| Filtros Hierárquicos | ✅ | Master, unidade, regional, consultor |

### Colunas do Kanban
1. **Novos Leads** - Leads recém-captados
2. **Interesse** - Demonstraram interesse
3. **Negociação** - Em negociação de valores
4. **Aguardando Docs** - Aguardando documentação
5. **Aprovado** - Vistoria aprovada
6. **Cancelado** - Processo cancelado

### Endpoints Backend
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/labelview/crm/leads` | Listar leads |
| POST | `/api/labelview/crm/lead` | Criar lead manual |
| PUT | `/api/labelview/crm/lead/{id}/status` | Atualizar status |
| DELETE | `/api/labelview/crm/lead/{id}` | Deletar lead |

### Acesso
- Dashboard Labelview > Menu CRM > Lead > Botão "Kanban"

## Routers Modulares (14 total)
| Router | Arquivo | Descrição |
|--------|---------|-----------|
| auth | routes/auth.py | Autenticação e usuários |
| wallet | routes/wallet.py | Carteira e transações |
| admin | routes/admin.py | Administração |
| pwa | routes/pwa.py | PWA e manifest |
| labelview | routes/labelview.py | Proteção veicular |
| xgate | routes/xgate.py | PIX e USDT |
| master | routes/master.py | Config master |
| merchant | routes/merchant.py | Lojistas |
| services | routes/services.py | Prestadores |
| mobility | routes/mobility_routes.py | Mobilidade |
| + 4 outros | routes/*.py | Diversos |

## Templates de Notificação (v2.38.46)
| Template | Cor | Uso |
|----------|-----|-----|
| Promoção | Verde | Ofertas e descontos |
| Aviso de Sistema | Amarelo | Manutenções e alertas |
| Novidade | Azul | Novas funcionalidades |
| Lembrete | Roxo | Lembretes gerais |
| Boas-vindas | Rosa | Novos usuários |
| Personalizado | Cinza | Mensagem livre |

## Regra de Isolamento White-Label (v2.38.45)

### IMPORTANTE
- **Podem existir MÚLTIPLAS unidades na mesma cidade/estado**
- **O isolamento é por `unidade_id`, NÃO por localização geográfica**
- Cada unidade tem: nome, logo e cores próprias

### Prioridade de Filtro
1. `unidade_id` (mais específico - isolamento por unidade)
2. `franquia_id` (fallback)
3. `franquia_slug` (compatibilidade)

### Exemplo
```
São Paulo:
  - Unidade "Transmill SP Norte" (unidade_id: abc123)
  - Unidade "Transmill SP Sul" (unidade_id: def456)
  - Unidade "Associação XYZ" (unidade_id: ghi789)

Cada uma vê APENAS seus próprios dados, mesmo estando na mesma cidade.
```

### P3 - Notificações por Franquia ✅
- Novo endpoint `/api/master/notifications/franquias`
- UI multi-select de franquias no painel admin
- Master pode enviar notificações direcionadas para franquias específicas
- 3 tipos de envio: Individual, Por Franquia, Todos

### P1 - Refatoração server.py (em andamento) ✅
- Novo arquivo `routes/master.py` criado
- Endpoints de segmentos de negócio, tipos de prestador, planos movidos
- Total de routers modulares: **12**

## Sistema White-Label Completo (v2.38.43)

### Conceito
Cada franquia/unidade opera como um sistema independente com:
- **Branding personalizado**: Nome, logo, cores
- **Dados isolados**: Usuários só veem dados da sua franquia
- **Nomes de serviços personalizados**: "NomeFranquia Lojas", "NomeFranquia Mobility", etc.

### Endpoints Atualizados com White-Label
| Endpoint | Nome do Serviço | Filtro |
|----------|-----------------|--------|
| `/api/merchants` | {Franquia} Lojas | franquia_slug |
| `/api/prestadores` | {Franquia} Prestadores | franquia_slug |
| `/api/stores/search` | {Franquia} Lojas | franquia_slug |
| `/api/internet-plans` | {Franquia} Internet | franquia_slug |
| `/api/servicos` | {Franquia} Serviços | franquia_slug |
| `/api/mobility/drivers/nearby` | {Franquia} Mobility | franquia_slug |

### Funções Auxiliares Criadas
- `get_franquia_filter(user)`: Retorna filtro MongoDB para isolamento de dados
- `get_franquia_context(user)`: Retorna contexto completo da franquia (nome, id, slug)

### Hierarquia de Acesso
1. **Master**: Vê todos os dados (sem filtro)
2. **Unidade Labelview**: Vê dados da sua unidade
3. **Regional/Consultor**: Vê dados da unidade vinculada
4. **Cliente**: Vê dados da franquia vinculada

```
URL da Franquia: /franquia/{slug}/
├── /login → Login com logo/cores da franquia + Instruções PWA
├── /home → Layout Minimalista Smartphone
│   └── Menu (☰) → 
│       ├── Perfil
│       ├── Painel Admin → MasterDashboard (ecossistema completo)
│       ├── Painel Proteção → MasterLabelviewDashboard
│       ├── Suporte → Página de chamados/tickets
│       └── Sair
├── /admin → Painel Admin completo
├── /labelview → Painel de Proteção Veicular
├── /suporte → Sistema de chamados de suporte
├── /cadastro → Cadastrar novos clientes
├── /recuperar-senha → Recuperação de senha
└── /protecao/* → Área do cliente (proteção veicular)
```

## Layout Minimalista para Smartphone (v2.38.28)

Cada franquia agora tem um **layout minimalista otimizado para smartphone**:

| Componente | Descrição |
|------------|-----------|
| **Header** | Logo/Nome da franquia + Notificações + Tema + Menu |
| **Saudação** | "Olá, [Nome]" + Saldo disponível |
| **Busca** | "O que você precisa hoje?" |
| **Serviços** | 8 ícones: Mobilidade, Proteção, Internet, Telemedicina, Eventos, Lojas, Prestadores, Criptoativos |
| **Menu Inferior** | Carteira, Indicar, Pagar, Lojas, Serviços |

### Menu do Usuário Franquia
- **Perfil**: Dados pessoais
- **Painel Admin**: MasterDashboard com cores da franquia
- **Painel Proteção**: MasterLabelviewDashboard para gestão de regionais/consultores
- **Sair**: Logout

## Ecossistema Transmill para Franquias (v2.38.27)

Cada franquia agora tem acesso ao **ecossistema completo Transmill**:

| Serviço | Status | Descrição |
|---------|--------|-----------|
| 💳 **Carteira Digital** | ✅ NOVO | Saldo XGate API, depositar, sacar, USDT |
| 🏪 **Lojas** | ✅ NOVO | Marketplace de lojas parceiras |
| 🔧 **Prestadores** | ✅ NOVO | Catálogo de prestadores de serviço |
| 🚗 **Mobilidade** | ✅ NOVO | Transporte P2P (passageiro/motorista) |
| 📱 **Internet Móvel** | ✅ | Planos de internet |
| 🏥 **Telemedicina** | ✅ | Consultas médicas online |
| 📋 **Labelview** | ✅ | Proteção veicular (tab separada) |

### Arquitetura do Dashboard Franquia
```
FranquiaDashboard
├── Header com tabs [Transmill] [Labelview]
├── Tab Transmill → MasterDashboard (com franquiaContext)
│   ├── Visão Geral
│   ├── Carteira Digital (WalletDashboard)
│   ├── Lojas (LojasPage embedded)
│   ├── Prestadores (PrestadoresPage embedded)
│   ├── Mobilidade (MobilityHome embedded)
│   ├── Internet Móvel
│   ├── Telemedicina
│   └── Outros serviços...
└── Tab Labelview → MasterLabelviewDashboard
    ├── Dashboard
    ├── CRM
    ├── Hierarquia
    └── Pessoas
```

## Arquitetura White-Label

### Conceito
- **Transmill Plataforma**: Entidade master que gerencia todas as franquias (verde escuro #293618)
- **Franquias**: Instâncias independentes da plataforma (ex: Transmill RJ, Transmill SP) com cores próprias
- **Conta Bolsão**: Wallet master no XGate que centraliza os recursos financeiros
- **Dual PWA**: Cada franquia terá dois PWAs instaláveis separadamente

### URLs do Sistema

| Sistema | URL | Cor |
|---------|-----|-----|
| Admin Transmill Plataforma (Login) | `/login` | Verde #293618 |
| Admin Transmill Plataforma (Painel) | `/admin/franquias` | Verde #293618 |
| Franquia Login | `/franquia/{slug}/login` | Cor da franquia |
| Franquia Cadastro | `/franquia/{slug}/cadastro` | Cor da franquia |
| Franquia Recuperar Senha | `/franquia/{slug}/recuperar-senha` | Cor da franquia |
| Franquia Dashboard | `/franquia/{slug}/dashboard` | Cor da franquia |

## Funcionalidades Implementadas (v2.38.19)

### ✅ Painel Admin Transmill Plataforma
1. **Login exclusivo** - Tela verde escuro sem opção de cadastro
2. **Dashboard** - Estatísticas: franquias ativas, saldo bolsão, clientes, receita
3. **Aba Franquias** - Listagem por estado com URL de acesso e botão copiar
4. **Aba Financeiro** - Saldos por franquia, histórico de movimentações, nova movimentação
5. **Aba Taxas** - Taxas globais editáveis + taxas personalizadas por franquia
6. **Aba Notificações** - Envio individual (por CPF/CNPJ) e broadcast
7. **Aba Suporte** - Busca por CPF/transação
8. **Aba Configurações** - Configurações globais

### ✅ Sistema de Franquias
1. **Login personalizado** - Logo e cores da franquia
2. **Cadastro via franquia** - Usa Register.js existente com header da franquia
3. **Recuperação de senha** - Tela com identidade visual da franquia
4. **Redirecionamento automático** - Master → `/admin/franquias`

### ✅ Correções v2.38.19
- **P0 - Fluxo Nova Cotação**: Valores do plano agora são salvos corretamente
- **P1 - Página Solicitações**: Proteção contra dados undefined
- PWA prompt só aparece em rotas de franquias
- Login admin sem "Não tem conta? Cadastre-se"
- Rota `/` redireciona master para painel admin

## Endpoints Backend (v2.38.19)

### Admin Franquias
- `GET /api/admin/franquias/stats` - Estatísticas globais
- `GET /api/admin/franquias/movimentacoes` - Histórico de movimentações
- `POST /api/admin/franquias/movimentacao` - Registrar movimentação
- `GET /api/admin/franquias/saldos` - Saldos por franquia
- `GET /api/admin/franquias/{id}/saldo` - Saldo específico
- `GET/POST /api/admin/franquias/taxas` - Taxas globais
- `GET/POST/DELETE /api/admin/franquias/taxas-personalizadas` - Taxas por franquia

### Cadastro Franquia
- `POST /api/franquia/cadastro` - Cadastro de usuário via franquia

### Labelview/Cotação
- `POST /api/labelview/vistoria/enviar` - Enviar vistoria para aprovação
- `PATCH /api/labelview/crm/cotacao-to-negociacao/{id}` - Confirmar plano (cria cliente)
- `GET /api/labelview/solicitacoes-servico` - Listar solicitações de serviço

## Collections MongoDB

### franquias
```json
{
  "id": "uuid",
  "nome": "string",
  "slug": "string (único)",
  "estado": "string",
  "cidades": ["array"],
  "cor_primaria": "#hex",
  "cor_secundaria": "#hex",
  "cor_texto": "#hex",
  "logo_url": "string",
  "email_contato": "string",
  "telefone_contato": "string",
  "ativo": "boolean",
  "created_at": "datetime"
}
```

### movimentacoes_bolsao
```json
{
  "id": "uuid",
  "tipo": "entrada|saida",
  "valor": "float",
  "descricao": "string",
  "franquia_id": "uuid",
  "franquia_nome": "string",
  "origem": "manual|pagamento_pix|repasse|taxa",
  "data": "datetime"
}
```

### labelview_vistorias
```json
{
  "id": "uuid",
  "status": "aguardando_aprovacao|aprovada|reprovada",
  "fotos_veiculo": {},
  "fotos_documentos": {},
  "cliente_nome": "string",
  "cliente_cpf": "string",
  "plano_nome": "string",
  "plano_valor": "float",
  "taxa_adesao": "float",
  "unidade_id": "uuid",
  "created_at": "datetime"
}
```

## Credenciais

### Produção (app.transmill.com.br)
- **Admin Plataforma:** marcelotransmillapp@gmail.com / !Ma04202011@
- **Franquia Transmill RJ:** transmillapp@gmail.com / demo123

### Preview
- **Admin Plataforma:** marcelotransmillapp@gmail.com / !Ma04202011@
- **Franquia Transmill RJ:** transmillapp@gmail.com / demo123

## Backlog

### ✅ Concluído
- [x] Bug P0: Fluxo "Nova Cotação" - dados do plano não salvando (v2.38.19) ✅ TESTADO
- [x] Bug P1: TypeError na página "Solicitações" (v2.38.19) ✅ TESTADO
- [x] Bug P2: Contagem incorreta de clientes no Dashboard Master (v2.38.20) ✅ CORRIGIDO
- [x] Refatoração: Documentação ROUTES_INDEX.md criada
- [x] Refatoração: Módulos auth.py, transactions.py, franquias.py criados
- [x] Sistema Dual PWA por Franquia (v2.38.21) ✅ IMPLEMENTADO
- [x] Upload de Logo para Franquias (v2.38.22) ✅ IMPLEMENTADO
- [x] Cadastro de Franquias Completo (v2.38.23) ✅ IMPLEMENTADO
  - Área de cadastro no painel admin
  - Link compartilhável para interessados
  - Wizard de 5 etapas (Empresa, Endereço, Responsável, Documentos, Visual)
  - Upload de documentos (CNPJ, comprovantes, RG)
  - Sistema de aprovação pelo master
- [x] Master Labelview View-Only (v2.38.24) ✅ IMPLEMENTADO
  - Removidos botões "Nova Unidade", "Nova Regional", "Novo Consultor"
  - Removidas abas de cadastro
  - Unidades, regionais e consultores são vinculados automaticamente às franquias
- [x] Fluxo Franquia→Unidade Automático (v2.38.25) ✅ IMPLEMENTADO
  - Franquia aprovada cria Unidade Labelview automaticamente
  - Usuário admin da franquia criado com senha temporária
  - Franquia/Unidade pode cadastrar Regionais e Consultores
  - Master apenas visualiza dados
- [x] Painel Labelview por Hierarquia (v2.38.26) ✅ IMPLEMENTADO
  - Master: vê tudo, apenas visualização
  - Franquia/Unidade: pode criar Regionais e Consultores
  - Regional: pode criar Consultores
  - Dados filtrados por hierarquia automaticamente
- [x] Ecossistema Transmill Completo para Franquias (v2.38.27) ✅ IMPLEMENTADO
  - Carteira Digital (XGate API) integrada
  - Lojas Parceiras integrado ao dashboard
  - Prestadores de Serviço integrado ao dashboard
  - Mobilidade Urbana P2P integrado ao dashboard
  - Todos os serviços mostram nome da franquia dinamicamente
  - FranquiaLogin corrigido para usar useAuth()

### P0 - Crítico
- [x] UI Gerenciamento USDT Avançado (v2.38.40) ✅ IMPLEMENTADO

### P1 - Alta
- [ ] Refatoração do server.py (arquivo com >16.000 linhas, ~280 endpoints restantes)
- [ ] Integração Asaas (cartão/boleto)

### P3 - Baixa
- [x] ~~Rede Social (clone Butflow)~~ - REMOVIDO pelo usuário (não será implementado)
- [ ] Continuar refatoração do server.py (migrar mais endpoints para módulos)

## Tecnologias
- **Backend:** FastAPI, Python, MongoDB, pywebpush
- **Frontend:** React, Shadcn UI, Tailwind CSS
- **PWA:** Service Workers, Web Push API, VAPID
- **Integrações:** Cloudinary, XGate (PIX), Google Maps, ViaCEP, FIPE API

## Histórico de Versões

### v2.38.41 (2026-01-31)
- Feature: **Gráficos USDT no Histórico**
  - Gráfico de área: evolução do saldo de movimentações
  - Gráfico de barras: entradas vs saídas
  - Biblioteca Recharts adicionada
- Refatoração: **Router XGate criado** (`/app/backend/routes/xgate.py`)
  - 9 endpoints migrados do server.py
  - Endpoints: test-connection, create-customer, pix-deposit, exchange-rate, convert-brl-usdt, deposit-status, transactions, webhook
  - Módulo inicializado via `init_xgate_routes()`

### v2.38.40 (2026-01-26)
- Feature: **UI Avançada de Gerenciamento USDT**
  - Modal completo para gerenciamento de USDT no painel financeiro
  - 3 abas: Movimentação (entrada/saída), Conversão (USDT↔BRL), Histórico
  - Cotação USDT/BRL em tempo real via XGate API
  - Formulário para registrar depósitos e saques de USDT
  - Formulário para registrar conversões com cálculo automático de valores
  - Histórico de movimentações e conversões com visual diferenciado
  - Card de cotação na aba Financeiro com botão de atualizar
  - Botão "Gerenciar USDT" azul para acesso rápido ao modal
- Frontend: Novo modal `UsdtManagementModal` em `AdminFranquiasPanel.js`
- Frontend: Funções `carregarCotacaoUsdt`, `carregarHistoricoUsdt`, `registrarMovimentacaoUsdt`, `registrarConversaoUsdt`
- Backend: Endpoints USDT já existentes utilizados na interface

### v2.38.39 (2025-01-26)
- Feature: **Dados USDT no Painel Admin**
  - Saldo USDT do bolsão em tempo real
  - Depósitos USDT do mês
  - Saídas USDT do mês (transferências externas)
  - Contagem de conversões USDT↔BRL
- Backend: Novos endpoints para USDT:
  - `GET /api/admin/franquias/usdt/movimentacoes`
  - `GET /api/admin/franquias/usdt/conversoes`
  - `GET /api/admin/franquias/usdt/transferencias-externas`
  - `GET /api/admin/franquias/usdt/cotacao`
  - `POST /api/admin/franquias/usdt/registrar-movimentacao`
  - `POST /api/admin/franquias/usdt/registrar-conversao`
- Frontend: Cards USDT no painel financeiro com visual diferenciado (azul)
- Collections MongoDB: `movimentacoes_usdt`, `conversoes_usdt`, `transferencias_usdt_externas`

### v2.38.38 (2025-01-23)
- Refatoração: **Novos Routers Modulares**
  - `users.py`: 8 endpoints (perfil, saldo, documentos, KYC)
  - `wallet.py`: 6 endpoints (transações, pagamentos, saques, transferências)
  - `admin.py`: 9 endpoints (gestão usuários, auditoria, permissões)
- Total: **10 routers ativos** com 71 endpoints modularizados
- Os routers estão prontos para substituir gradualmente os endpoints do server.py
- Versões sincronizadas em todos os arquivos

### v2.38.37 (2025-01-23)
- Refatoração: **Limpeza Completa do server.py**
  - Removidos ~2000 linhas de endpoints duplicados
  - server.py reduzido de 18.278 para 16.229 linhas (-11%)
  - Removidos: manifests PWA, setup, PWA client, master push (todos nos routers)
  - Código mais limpo e sem duplicações
- Versões sincronizadas: VERSION.txt, version.json, server.py, App.js

### v2.38.36 (2025-01-23)
- Refatoração: **Backend Completamente Modularizado**
  - 7 routers principais ativos: auth, franquias, transactions, suporte, setup, pwa, labelview
  - `setup.py`: 14 endpoints (versão, URLs, CNPJ, CPF, referral codes)
  - `pwa.py`: 14 endpoints (push subscriptions, login PWA, master push)
  - `franquias.py`: 6 endpoints (+ manifests PWA dinâmicos)
  - `suporte.py`: 5 endpoints (chamados + notificações push)
  - `labelview.py`: 2 endpoints (solicitações de serviço)
  - `auth.py`: 4 endpoints (login, registro, senha)
  - `transactions.py`: 1 endpoint (histórico)
- Arquitetura: Código mais organizado, manutenível e escalável
- Compatibilidade: Mantido alias `get_current_user_dependency` para server.py

### v2.38.35 (2025-01-23)
- Feature: **Notificações Push para Sistema de Suporte**
  - Push notification para master quando franquia abre novo chamado
  - Push notification para franquia quando master responde
  - Push notification para master quando franquia responde
- Refatoração: **Backend Modularizado**
  - Criado `/app/backend/routes/notifications.py` - Módulo de notificações push
  - Criado `/app/backend/routes/setup.py` - Endpoints administrativos
  - Criado `/app/backend/routes/pwa.py` - Endpoints PWA e push subscriptions
  - Total de 6 routers modulares: auth, franquias, transactions, suporte, setup, pwa
- Arquitetura: Backend mais organizado e escalável

### v2.38.34 (2025-01-23)
- Feature: **Sistema de Suporte/Chamados completo** 
  - Franquias podem criar chamados de suporte
  - Master pode visualizar e responder todos os chamados
  - Workflow de status: aberto → em_andamento → aguardando_resposta → resolvido → fechado
  - Categorias: geral, financeiro, técnico, operacional
  - Prioridades: baixa, média, alta, urgente
- Backend: Novo router `/app/backend/routes/suporte.py`
- Frontend: Nova página `SuportePage.js` para franquias
- Frontend: Novo componente `SuporteMasterPanel` no AdminFranquiasPanel.js
- Frontend: Menu "Suporte" adicionado ao dropdown da MinimalistHomePage
- UX: Sistema de mensagens tipo chat entre franquia e master
- Testes: 16 testes backend + testes frontend (100% passando)

### v2.38.27 (2025-01-23)
- Feature: Ecossistema Transmill completo integrado ao dashboard de franquias
- Feature: Carteira Digital (XGate API) no menu lateral
- Feature: Lojas Parceiras integrado ao dashboard
- Feature: Prestadores de Serviço integrado ao dashboard
- Feature: Mobilidade Urbana P2P integrado ao dashboard
- Fix: FranquiaLogin agora usa useAuth() para atualizar contexto global
- Fix: FranquiaDashboard verifica se user está carregado antes de renderizar
- UX: Todos os serviços mostram nome da franquia dinamicamente

### v2.38.19 (2025-01-24)
- BugFix P0: Correção do fluxo Nova Cotação - valores do plano agora são salvos corretamente
- BugFix P0: Função calcularValorTotal() usa campos consistentes (custo_mensal > valor_base > valor)
- BugFix P0: moverParaNegociacao() usa mesma lógica de obtenção do valor do plano
- BugFix P1: Página Solicitações - proteção contra dados undefined
- BugFix P1: Adicionado fallback 'N/A' para campos vazios
- BugFix P1: Proteção contra servicos_solicitados undefined
- Enhancement: Logs mais detalhados para debug de problemas

### v2.38.18 (2025-01-23)
- Feature: Painel Admin Transmill Plataforma completo
- Feature: Login admin exclusivo (verde escuro #293618)
- Feature: Dashboard com estatísticas de franquias
- Feature: Gestão financeira do bolsão
- Feature: Taxas globais e personalizadas por franquia
- Fix: PWA prompt apenas em rotas de franquias
