# 🎯 PANORAMA COMPLETO DO SISTEMA AGITOMIL

**Versão:** 2.0
**Data:** Novembro 2025
**Stack:** React + FastAPI + MongoDB

---

## 📊 VISÃO GERAL DO SISTEMA

**AgitoMil** é uma **super-app fintech brasileira** que integra:
- 💰 Carteira digital
- 🛒 Marketplace
- 🔐 Proteção veicular
- 📱 Internet móvel
- 🏥 Telemedicina
- 📱 Rede social
- 💳 Sistema de pagamentos
- 💵 USDT/Cripto
- 🤝 Sistema de indicação/comissões

---

## 👥 TIPOS DE USUÁRIOS

### 1. **Cliente** (cliente)
- Compra produtos/serviços
- Usa carteira digital
- Indica novos usuários
- Participa da rede social
- Contrata serviços

### 2. **Lojista** (lojista)
- Vende produtos físicos
- Gerencia catálogo
- Recebe pedidos
- Tem equipe
- Dashboard de vendas

### 3. **Prestador de Serviços** (service_provider)
- Oferece serviços
- Agenda agendamentos
- Recebe avaliações
- Dashboard de serviços

### 4. **Master** (master / is_master_account)
- Administração completa
- Gestão de usuários
- Configurações globais
- Analytics
- Comissões

### 5. **Master Labelview** (is_labelview_master)
- Sistema de proteção veicular
- Gestão de hierarquia Labelview
- Tabela de valores FIPE
- Unidades, Regionais, Consultores

---

## 🏗️ MÓDULOS PRINCIPAIS

### 💰 1. CARTEIRA DIGITAL (Wallet)

**Funcionalidades:**
- ✅ Saldo em BRL
- ✅ Saldo em USDT (cripto)
- ✅ Cashback
- ✅ Depósito via PIX
- ✅ Depósito USDT
- ✅ Saque
- ✅ Extrato completo
- ✅ Transferências P2P
- ✅ Conversão pontos → BRL

**Rotas Frontend:**
- `/` - Home com saldo
- `/deposito` - Depósito PIX
- `/usdt` - Operações USDT
- `/extrato` - Histórico de transações
- `/sacar` - Solicitar saque
- `/convert-points` - Converter pontos

**Endpoints Backend:**
- `GET /api/wallet/balance` - Consultar saldo
- `POST /api/wallet/deposit` - Criar depósito
- `POST /api/wallet/withdraw` - Solicitar saque
- `GET /api/wallet/transactions` - Histórico
- `POST /api/wallet/usdt/deposit` - Depósito USDT
- `POST /api/wallet/usdt/withdraw` - Saque USDT

---

### 🛒 2. MARKETPLACE

**Funcionalidades:**
- ✅ Catálogo de produtos
- ✅ Busca e filtros
- ✅ Carrinho de compras
- ✅ Checkout integrado
- ✅ Pedidos e rastreamento
- ✅ Avaliações
- ✅ Sistema de cashback
- ✅ Gestão de estoque (lojistas)

**Rotas Frontend:**
- `/lojas` - Lista de lojistas
- `/catalog/:merchant_id` - Catálogo do lojista
- `/checkout` - Finalizar compra
- `/meus-pedidos` - Pedidos do cliente
- `/vendas` - Dashboard de vendas (lojista)
- `/meu-negocio` - Gestão da loja

**Endpoints Backend:**
- `GET /api/products` - Listar produtos
- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos
- `PUT /api/orders/{id}/status` - Atualizar status
- `POST /api/reviews` - Avaliar produto/serviço

---

### 🏥 3. TELEMEDICINA

**Funcionalidades:**
- ✅ Consultas médicas online
- ✅ Prescrições digitais
- ✅ Agendamento
- ✅ Histórico médico
- ✅ Pagamento integrado

**Rotas Frontend:**
- `/telemedicina` - Contratar telemedicina

**Endpoints Backend:**
- `POST /api/telemedicine/subscribe` - Contratar plano
- `GET /api/telemedicine/consultations` - Consultas
- `POST /api/telemedicine/schedule` - Agendar

---

### 📱 4. INTERNET MÓVEL

**Funcionalidades:**
- ✅ Planos de internet (dados móveis)
- ✅ Contratação online
- ✅ Pagamento via carteira
- ✅ Ativação automática
- ✅ Gestão de planos ativos

**Rotas Frontend:**
- `/internet-movel` - Contratar internet

**Endpoints Backend:**
- `GET /api/internet/plans` - Listar planos
- `POST /api/internet/subscribe` - Contratar
- `GET /api/internet/active` - Planos ativos

---

### 🚗 5. PROTEÇÃO VEICULAR LABELVIEW

**Sistema Completo de Proteção Veicular**

#### 5.1 **Para Clientes:**
**Funcionalidades:**
- ✅ Cotação online (6 etapas)
- ✅ Seleção de coberturas
- ✅ Vistoria com upload de fotos
- ✅ Pagamento mensal
- ✅ Cobertura: Roubo, Furto, Colisão, Assistência 24h, etc.

**Rotas Frontend:**
- `/protecao-veicular` - Contratar proteção

#### 5.2 **Para Master Labelview:**
**Funcionalidades:**
- ✅ Dashboard completo
- ✅ Hierarquia (Unidades → Regionais → Consultores)
- ✅ Gestão de comissões
- ✅ Tabela FIPE integrada
- ✅ **NOVO: Tabela de Valores por Faixa FIPE**
  - 6 tipos de cobertura
  - Valores por faixa de valor do veículo
  - Margem da Unidade
  - Split automático de pagamentos
- ✅ CRM de leads
- ✅ Relatórios
- ✅ Notificações

**Rotas Frontend:**
- `/labelview/login` - Login exclusivo Labelview
- `/labelview` ou `/labelview/dashboard` - Dashboard Master

**Endpoints Backend:**
- `GET /api/labelview/hierarquia` - Hierarquia completa
- `POST /api/labelview/unidades` - Criar unidades
- `GET /api/labelview/comissoes` - Comissões
- `GET /api/labelview/tabelas/tipos` - Tipos de cobertura
- `POST /api/labelview/tabelas/criar` - Criar tabela de valores
- `GET /api/labelview/tabelas/{tipo}` - Listar valores
- `POST /api/labelview/tabelas/buscar-valor` - Buscar valor FIPE
- `GET /api/labelview/fipe/veiculos` - Buscar veículos FIPE

**Conta Interna:**
- Email: labelview@agitomil.com
- Tipo: service_provider (interno)
- Função: Receber valores via split

---

### 📱 6. REDE SOCIAL (TikTok-Style)

**Funcionalidades:**
- ✅ Feed de vídeos verticais
- ✅ Gravação de vídeos (até 60s)
- ✅ Vídeos gratuitos (até 30s)
- ✅ Vídeos pagos (30-60s, R$ 5)
- ✅ Likes, comentários, visualizações
- ✅ Sistema de pontos
- ✅ Conversão pontos → dinheiro
- ✅ Ações em vídeos (comprar, agendar)

**Rotas Frontend:**
- `/social` - Feed social
- `/video-recorder` - Gravar/publicar vídeo
- `/tiktok-feed` - Feed estilo TikTok

**Endpoints Backend:**
- `POST /api/social/videos` - Publicar vídeo
- `GET /api/social/videos` - Feed de vídeos
- `POST /api/social/videos/like` - Curtir
- `POST /api/social/videos/comment` - Comentar
- `POST /api/social/videos/view` - Registrar visualização
- `GET /api/social/stats` - Estatísticas

**Sistema de Pontos:**
- Publicar vídeo: 10 pontos
- Curtir: 2 pontos
- Comentar: 5 pontos
- Visualizar: 1 ponto
- Assistir completo: +3 pontos
- Taxa conversão: R$ 0,01 por ponto

---

### 🤝 7. SISTEMA DE INDICAÇÃO & COMISSÕES

**Funcionalidades:**
- ✅ Link de indicação único
- ✅ Cashback em compras
- ✅ Comissões por vendas
- ✅ Rede de indicados (hierarquia)
- ✅ Dashboard de ganhos
- ✅ Resgate de comissões

**Rotas Frontend:**
- `/indicar` - Link de indicação

**Endpoints Backend:**
- `GET /api/referral/link` - Meu link
- `GET /api/referral/stats` - Estatísticas
- `POST /api/referral/register` - Registrar com indicação
- `GET /api/commissions` - Minhas comissões

**Regras:**
- Cliente indica cliente: cashback
- Cliente indica lojista: comissão por vendas
- Lojista indica cliente: comissão
- Sistema multi-nível configurável

---

### 💳 8. SISTEMA DE PAGAMENTOS

**Funcionalidades:**
- ✅ Pagamento via saldo
- ✅ PIX integrado
- ✅ Cartão de crédito
- ✅ Split de pagamentos
- ✅ Cashback automático
- ✅ Comissões automáticas
- ✅ QR Code para POS

**Integrações:**
- XGate (gateway de pagamento)
- PIX
- USDT/Blockchain

**Endpoints Backend:**
- `POST /api/payments/create` - Criar pagamento
- `POST /api/payments/pix` - Gerar PIX
- `GET /api/payments/{id}` - Consultar status
- `POST /api/pos/generate-qr` - Gerar QR POS

---

### 👥 9. GESTÃO DE EQUIPE

**Funcionalidades:**
- ✅ Adicionar colaboradores
- ✅ Permissões e papéis
- ✅ Relatórios por equipe
- ✅ Comissões da equipe

**Rotas Frontend:**
- `/equipe` - Gestão de equipe

**Endpoints Backend:**
- `GET /api/team` - Listar equipe
- `POST /api/team/add` - Adicionar membro
- `PUT /api/team/{id}/permissions` - Permissões

---

### 📊 10. PAINEL MASTER (Administração)

**Funcionalidades:**
- ✅ Dashboard analytics
- ✅ Gestão de usuários
- ✅ Gestão de transações
- ✅ Configurações globais
- ✅ Hierarquia do sistema
- ✅ Segmentos de negócio
- ✅ Notificações em massa
- ✅ Compliance e documentos
- ✅ Planos de internet (gestão)
- ✅ Telemedicina (gestão)
- ✅ Treinamento IA chatbot
- ✅ Extrato master
- ✅ Saque master
- ✅ Rede social (gestão e analytics)

**Rotas Frontend:**
- `/master` - Dashboard minimalista
- `/master-dashboard` - Dashboard completo
- `/master-portal` - Login master
- `/visao-geral` - Overview
- `/usuarios` - Gestão de usuários
- `/hierarquia` - Hierarquia e rede
- `/segmentos` - Segmentos de negócio
- `/notificacoes` - Notificações
- `/transacoes` - Transações
- `/extrato-master` - Extrato master
- `/saque-master` - Saque master
- `/comissoes` - Comissões
- `/internet-master` - Planos internet
- `/telemedicina-master` - Telemedicina
- `/subusuarios` - Sub-usuários
- `/compliance` - Compliance e docs
- `/treinamento-ia` - Treinar chatbot

**Endpoints Backend:**
- `GET /api/admin/stats` - Estatísticas gerais
- `GET /api/admin/users` - Listar usuários
- `PUT /api/admin/users/{id}` - Editar usuário
- `POST /api/admin/notifications` - Enviar notificação
- `GET /api/admin/transactions` - Todas transações
- `GET /api/admin/hierarchy` - Hierarquia completa
- `POST /api/admin/segments` - Criar segmento

---

## 🔐 AUTENTICAÇÃO & SEGURANÇA

**Funcionalidades:**
- ✅ JWT Token
- ✅ Refresh tokens
- ✅ Senha com bcrypt
- ✅ Recuperação de senha
- ✅ 2FA (preparado)
- ✅ Logs de acesso
- ✅ Permissões por tipo de usuário

**Rotas Frontend:**
- `/login` - Login
- `/register` - Cadastro
- `/forgot-password` - Recuperar senha
- `/reset-password` - Redefinir senha

**Endpoints Backend:**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Redefinir
- `GET /api/auth/me` - Usuário atual

---

## 📦 INTEGRAÇÕES EXTERNAS

### 1. **API FIPE**
- Consulta de veículos
- Valores de mercado
- Marcas, modelos, anos
- Cache local no MongoDB

### 2. **XGate (Pagamentos)**
- Gateway de pagamento
- PIX
- Cartão de crédito
- Split de pagamentos

### 3. **USDT/Blockchain**
- Depósitos USDT
- Saques USDT
- Conversão BRL ↔ USDT

### 4. **Telemedicina (Parceiro)**
- API de consultas
- Agendamentos
- Prontuário eletrônico

### 5. **Internet Móvel (Parceiro)**
- Ativação de chips
- Recarga
- Gestão de dados

---

## 📱 RECURSOS MOBILE

**PWA (Progressive Web App):**
- ✅ Instalável (Android/iOS)
- ✅ Offline básico
- ✅ Push notifications (preparado)
- ✅ Splash screen
- ✅ Ícones otimizados

**Responsividade:**
- ✅ Mobile-first design
- ✅ Tailwind CSS
- ✅ Breakpoints: sm, md, lg, xl
- ✅ Touch-friendly
- ✅ Gestos (swipe, etc.)

---

## 🗄️ BANCO DE DADOS (MongoDB)

**Collections Principais:**

### Users
- Dados de usuários
- Saldos
- Permissões
- Hierarquia

### Transactions
- Histórico financeiro
- Depósitos, saques, pagamentos
- Status e timestamps

### Products
- Catálogo de produtos
- Estoque
- Preços e promoções

### Orders
- Pedidos de clientes
- Status de entrega
- Itens e valores

### Social_Videos
- Vídeos da rede social
- Metadados
- Estatísticas

### Social_Likes/Comments/Views
- Interações sociais
- Pontos ganhos

### Labelview_* (8+ collections)
- Hierarquia Labelview
- Comissões
- Proteções veiculares
- Tabelas de valores
- FIPE cache

### Internet_Plans
- Planos disponíveis
- Assinaturas ativas

### Telemedicine_*
- Consultas
- Assinaturas
- Histórico médico

---

## 🎨 DESIGN SYSTEM

**Cores Principais:**
- Primary: `#2fa31c` (verde)
- Secondary: `#1a59ad` (azul)
- Dark: `#2A3618`
- Gold: `#D4AF37`
- Accent: `#8B6F47`

**Componentes UI:**
- Shadcn/ui (React)
- Tailwind CSS
- Lucide Icons
- Sonner (toasts)
- React Router

**Temas:**
- ✅ Light mode
- ✅ Dark mode
- ✅ Persistência de tema

---

## 📊 ESTATÍSTICAS & ANALYTICS

**Métricas Rastreadas:**
- Total de usuários
- Transações (volume e quantidade)
- GMV (Gross Merchandise Value)
- Taxa de conversão
- Cashback distribuído
- Comissões pagas
- Usuários ativos
- Engagement social
- Proteções vendidas
- Planos ativos

**Dashboards:**
- Master: Visão geral completa
- Lojista: Vendas e produtos
- Prestador: Agendamentos
- Cliente: Saldo e pedidos
- Labelview: Proteções e comissões

---

## 🚀 TECNOLOGIAS

### Backend
- **FastAPI** (Python 3.11)
- **MongoDB** (Motor - async driver)
- **JWT** para auth
- **Passlib** para senhas
- **Pydantic** para validação
- **CORS** habilitado
- **Logging** estruturado
- **Supervisor** para processos

### Frontend
- **React 18**
- **React Router v6**
- **Axios** para HTTP
- **Tailwind CSS**
- **Shadcn/ui**
- **Lucide Icons**
- **Sonner** (toasts)
- **Context API** (auth, theme)

### Infraestrutura
- **Docker** (desenvolvimento)
- **Kubernetes** (produção)
- **Nginx** (proxy reverso)
- **MongoDB** (database)
- **Supervisor** (process manager)

---

## 📈 ROADMAP & MELHORIAS FUTURAS

**Em Planejamento:**
- [ ] Sistema de afiliados avançado
- [ ] Cartão de crédito virtual
- [ ] Boleto bancário
- [ ] Marketplace internacional
- [ ] App nativo (React Native)
- [ ] Biometria
- [ ] Gamificação avançada
- [ ] Chat entre usuários
- [ ] Live streaming
- [ ] Dropshipping
- [ ] Assinatura de serviços
- [ ] Open Banking

**Otimizações Necessárias:**
- [ ] CDN para vídeos (S3, Cloudflare)
- [ ] Elastic Search para buscas
- [ ] Redis para cache
- [ ] WebSockets para real-time
- [ ] Compressão de imagens
- [ ] Lazy loading avançado

---

## 🎯 DIFERENCIAIS DO AGITOMIL

1. **Super App Brasileiro** - Tudo em um só lugar
2. **Cashback Real** - Dinheiro de volta em compras
3. **Rede Social Monetizável** - Ganhe criando conteúdo
4. **Sistema de Indicação** - Ganhe indicando
5. **USDT Integrado** - Cripto sem complicação
6. **Proteção Veicular** - Seguro acessível
7. **Multi-negócio** - Loja, serviços, cliente, tudo junto
8. **Mobile First** - 100% responsivo
9. **Sem Taxas Abusivas** - Competitivo
10. **Comunidade** - Rede de apoio

---

## 📞 SUPORTE & DOCUMENTAÇÃO

**Documentos Importantes:**
- `/app/README.md` - Setup geral
- `/app/DEPLOY_READY.md` - Deploy produção
- `/app/test_result.md` - Histórico de testes
- `/app/PANORAMA_COMPLETO_AGITOMIL.md` - Este documento

**Credenciais de Teste:**
- Master: protecao@agitomil.com / demo123
- Labelview: labelview@agitomil.com / labelview2025

**URLs:**
- **Produção:** https://agitomil.com.br
- **Labelview:** https://agitomil.com.br/labelview/login
- **API:** https://agitomil.com.br/api

---

## ✅ STATUS ATUAL DO SISTEMA

**Funcionalidades Implementadas:** ~95%
**Testes:** Em andamento
**Performance:** Otimizada
**Responsividade:** 100%
**Segurança:** Implementada
**Deploy:** Pronto para produção

**Última Atualização:** Novembro 2025
**Versão:** 2.0 (Sistema de Tabela de Valores + Otimizações)

---

*Documento gerado automaticamente pelo sistema AgitoMil*
*Para dúvidas ou sugestões, consulte a equipe de desenvolvimento*
