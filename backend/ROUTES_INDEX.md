# 📁 Estrutura de Rotas - Transmill API

## Visão Geral
O arquivo `server.py` contém ~17.700 linhas com ~313 endpoints.
Este documento serve como guia para navegação e futuras refatorações.

## Estrutura Atual do server.py

### 📍 CONFIGURAÇÃO (Linhas 1-750)
- Imports e configuração
- Modelos Pydantic (User, Transaction, etc.)
- Funções auxiliares (validação, tokens, etc.)

### 📍 AUTENTICAÇÃO (Linhas 2051-2470)
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Recuperação de senha
- `POST /auth/verify-reset-code` - Verificar código
- `POST /auth/reset-password` - Redefinir senha
- `POST /auth/change-password` - Alterar senha

### 📍 USUÁRIOS (Linhas 2472-2810)
- `GET /user/profile` - Perfil do usuário
- `GET /user/balance` - Saldo
- `PUT /user/profile-image` - Atualizar foto
- `POST /user/profile-image-upload` - Upload de foto
- `PUT /user/documents` - Atualizar documentos
- `PUT /user/profile-data` - Atualizar dados

### 📍 TRANSAÇÕES (Linhas 2806-3245)
- `POST /transactions/payment` - Pagamento via QR/código
- `POST /transactions/withdrawal` - Saque
- `GET /transactions/history` - Histórico
- `POST /transactions/validate-digital-code` - Validar código

### 📍 LABELVIEW (Linhas 3246-4500)
- Dashboard, funcionários, regionais, consultores
- CRM, leads, proteções
- Planos, fornecedores
- Tipos de veículo, FIPE API

### 📍 LOJISTA/MERCHANT (Linhas 4557-5030)
- `POST /merchant/cashback-rate` - Taxa de cashback
- `POST /merchant/team` - Equipe
- `GET /merchant/team` - Listar equipe
- `PUT /merchant/store-settings` - Configurações loja
- `POST /merchant/qr-code` - Gerar QR Code

### 📍 LOJAS E PRESTADORES (Linhas 5034-5365)
- `GET /stores` - Listar lojas
- `GET /prestadores` - Listar prestadores
- `GET /stores/search` - Buscar lojas
- `GET /stores/filters` - Filtros disponíveis

### 📍 MASTER ADMIN (Linhas 5427-6450)
- Segmentos de negócio
- Notificações
- Transações manuais
- Agentes hierárquicos
- Dashboard master

### 📍 FRANQUIAS (Linhas 7563-8500)
- `GET /franquias` - Listar franquias
- `POST /franquias` - Criar franquia
- `GET /franquias/{slug}` - Obter franquia
- `PATCH /franquias/{franquia_id}` - Atualizar
- `DELETE /franquias/{franquia_id}` - Desativar

### 📍 ADMIN FRANQUIAS (Linhas 8500-9800)
- `GET /admin/franquias/stats` - Estatísticas
- `GET /admin/franquias/saldos` - Saldos
- `POST /admin/franquias/movimentacao` - Movimentação
- `GET/POST /admin/franquias/taxas` - Taxas globais
- `GET/POST/DELETE /admin/franquias/taxas-personalizadas` - Taxas por franquia

### 📍 SERVIÇOS/PRESTADORES (Linhas 9816-10650)
- CRUD de serviços
- Agendamentos
- POS

### 📍 USDT/CRYPTO (Linhas 11096-11430)
- Taxa USDT
- Depósito/saque USDT
- Conversão BRL

### 📍 PLANOS INTERNET/TELEMEDICINA (Linhas 11432-12520)
- CRUD de planos
- Compras de planos

### 📍 SUBUSUÁRIOS (Linhas 12519-12860)
- CRUD subusuários
- Login de subusuário

### 📍 POS/PAGAMENTOS (Linhas 12859-13260)
- Gerar cobrança POS
- Processar código de pagamento

### 📍 DISPONIBILIDADE/AGENDAMENTOS (Linhas 13256-13665)
- Slots de disponibilidade
- Reservas

### 📍 CHATBOT (Linhas 13663-13890)
- Comandos do chatbot
- Query do chatbot

### 📍 CATÁLOGO/PRODUTOS (Linhas 13890-14600)
- Categorias
- Produtos
- Pedidos

### 📍 SOCIAL/VÍDEOS (Linhas 14800-15360)
- Vídeos
- Likes, comentários
- Pontos sociais

### 📍 MOBILIDADE (Linhas 15626-15810)
- Driver routes
- Ride routes
- Estimativas

### 📍 SETUP/ADMIN (Linhas 15835-16650)
- Endpoints de setup
- Correções de dados
- Versão do sistema

### 📍 PWA (Linhas 16685-17250)
- Manifest por franquia
- Login PWA
- Proteção do cliente
- Solicitações de assistência

### 📍 PUSH NOTIFICATIONS (Linhas 17239-17633)
- Subscrições
- Envio de notificações

---

## Arquivos de Rotas Existentes

- `/app/backend/routes/labelview.py` - Rotas Labelview (8017 linhas)
- `/app/backend/routes/mobility_routes.py` - Rotas de mobilidade
- `/app/backend/routes/auth.py` - Autenticação (novo)
- `/app/backend/routes/debug.py` - Debug
- `/app/backend/routes/diagnostico.py` - Diagnóstico

## Prioridade de Refatoração Futura

1. **Alta**: Mover autenticação para `routes/auth.py`
2. **Alta**: Mover franquias para `routes/franquias.py`
3. **Média**: Mover transações para `routes/transactions.py`
4. **Média**: Mover admin para `routes/admin.py`
5. **Baixa**: Mover outros módulos conforme necessidade

## Convenções

- Todos os endpoints usam `/api` como prefixo
- Autenticação via Bearer Token (JWT)
- MongoDB para persistência
- Cloudinary para uploads de imagens
