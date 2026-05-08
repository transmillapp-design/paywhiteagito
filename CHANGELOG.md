# 📋 HISTÓRICO DE VERSÕES - SISTEMA LABELVIEW

## Como funciona o versionamento

- **Formato**: v{MAJOR}.{MINOR}.{PATCH}
- **MAJOR**: Mudanças grandes (v1 → v2)
- **MINOR**: Novas funcionalidades (v2.1 → v2.2)
- **PATCH**: Correções de bugs (v2.1.0 → v2.1.1)

---

## v2.34.88 - 2025-12-22 14:35:00

### 🔧 Correções PWA
- ✅ **Forçar tema claro** - Reset automático para modo claro em nova versão
- ✅ **Limpar cache agressivo** - Remove TODOS os caches antigos do PWA
- ✅ **Logo modo escuro** - Fundo verde (#293618) igual ao tema
- ✅ **Description atualizada** - "Ecossistema de Consumo Militar"

**Instruções para usuários:**
1. Após redeploy, remover o app da tela inicial
2. Limpar dados do navegador/app
3. Adicionar o PWA novamente

---

## v2.34.87 - 2025-12-22 14:15:00

### 🎨 Correção Logo Modo Escuro
- ✅ **Logo transparente** no modo escuro (sem fundo azul)
- ✅ **Harmonia visual** com tema verde/oliva

---

## v2.34.86 - 2025-12-22 13:58:00

### 🏷️ Novo Slogan + Logo Transmill
- ✅ **Slogan alterado** - "Ecossistema de Consumo Militar" em todas as páginas
- ✅ **index.html** - Meta description e title atualizados
- ✅ **manifest.json** - Nome do PWA atualizado
- ✅ **Login.js** - Slogan na tela de login
- ✅ **MinimalistHomePage.js** - Saudação para clientes
- ✅ **Ícones PWA** - Nova logo em todos os tamanhos

---

## v2.34.85 - 2025-12-22 13:50:00

### 🖼️ Nova Logo Transmill
- ✅ **Ícones PWA atualizados** - Todos os tamanhos (72x72 até 512x512) com nova logo
- ✅ **apple-touch-icon.png** - Ícone para iOS atualizado
- ✅ **favicon** - Ícones 16x16 e 32x32 atualizados
- ✅ **TransmillLogo.js** - Componente atualizado para usar nova imagem
- ✅ **TransmillLogoCompact.js** - Componente compacto atualizado
- ✅ **Login.js** - Página de login com nova logo no header

---

## v2.34.84 - 2025-12-22 13:35:00

### 🎨 PWA Atualizado
- ✅ **manifest.json** - theme_color: #005B9C, background_color: #EEEEEE
- ✅ **index.html** - meta theme-color: #005B9C
- ✅ **index.css** - cores root atualizadas para modo claro como padrão
- ✅ **Splash screen removido** - SplashScreen.js deletado
- ✅ **Animações de splash removidas** do CSS

---

## v2.34.83 - 2025-12-22 13:30:00

### 🎨 Nova Paleta de Cores Transmill
- ✅ **Modo Claro (padrão)**:
  - Azul primário: #005B9C (fundo, botões, bordas, badges)
  - Prata secundário: #EEEEEE (cards, fundo ícones)
- ✅ **Modo Escuro**:
  - Verde escuro primário: #293618 (fundo, barra navegação)
  - Verde oliva: #6B6A4B (cards, barra ferramenta)
  - Amarelo mostarda: #CEAE31 (cards inversos, bordas, badges)
- ✅ **Login sempre abre em modo claro**
- ✅ **Botão de troca de tema** (sol/lua) no canto superior direito
- ✅ **Master Transmill e Master Labelview NÃO alterados**

---

## v2.34.82 - 2025-12-16 21:30:00

### 🎉 Integração XGate PIX em PRODUÇÃO
- ✅ **API XGate funcionando** - Depósitos PIX reais
  - URL corrigida: `/deposit` (sem "s" no final)
  - Autenticação via Bearer Token (JWT) funcionando
  - Payload atualizado conforme documentação XGate
  - QR Code real sendo gerado pela API

### 🔧 Correções Técnicas
- ✅ Busca moedas disponíveis antes de criar depósito
- ✅ Criação de cliente junto com depósito (objeto `customer`)
- ✅ Tratamento de resposta XGate (`data.code` → `qr_code`)
- ✅ Geração de QR Code base64 a partir do código PIX

---

## v2.34.81 - 2025-12-16 21:05:00

### 🐛 Correções
- ✅ **QR Code PIX no pagamento** - Mock XGate agora retorna `qr_code` e `qr_code_base64` corretamente

---

## v2.34.80 - 2025-12-16 20:45:00

### 🐛 Correções
- ✅ **Coluna Contrato corrigida** - Agora usa `contrato_status` em vez de `contrato_assinado`
  - Mostra "✓ Assinado" quando `contrato_status === 'assinado'` ou existe `contrato.data_assinatura`
  - Mostra data da assinatura corretamente
- ✅ **Status do cliente corrigido** - Valores corretos: Ativo, Vencido, Inativo, Suspenso

---

## v2.34.79 - 2025-12-16 20:20:00

### 🎉 Funcionalidades Novas
- ✅ **Dados do contrato na página de clientes** - Para toda a hierarquia
  - Plano nome
  - Valor mensal (R$)
  - Dia de vencimento
  - Status dinâmico (Ativo/Vencido/Inativo/Suspenso)
  - Número do contrato

### 📊 UX Melhorada
- ✅ Card de cliente com layout melhorado
- ✅ Seção de dados do contrato em destaque (fundo cinza)
- ✅ Ícones coloridos para cada informação
- ✅ Badge de status com cores e ícones apropriados
- ✅ Nome do Regional adicionado ao endpoint

---

## v2.34.78 - 2025-12-16 16:35:00

### 🐛 Correções Críticas
- ✅ **MasterDashboard crash corrigido** - Adicionado null safety em todas as variáveis de array
  - Corrigido `TypeError: Cannot read properties of null (reading 'length')`
  - Protegidos: `allUsers`, `hierarchicalUsers`, `businessSegments`, `notifications`, `recentRegistrations`, `plans`, `sales`
- ✅ **Usuário Master criado** - `transmillapp@gmail.com` com flags `is_master_account` e `is_labelview_master`

### 🔧 Melhorias de Estabilidade
- ✅ Funções de fetch agora garantem array vazio em caso de erro 403
- ✅ Melhor tratamento de erros em endpoints /api/master/*

---

## v2.34.77 - 2025-12-16 16:00:00

### 🎉 Funcionalidades Novas
- ✅ **Filtros na tela de clientes para Unidade** - Regional e Consultor
- ✅ **Endpoint `/api/labelview/unidades/com-contadores`** - Lista unidades com contadores
- ✅ **Endpoint `/api/labelview/regionais/com-contadores`** - Lista regionais com contadores
- ✅ **Endpoint `/api/labelview/consultores/com-contadores`** - Lista consultores com contadores
- ✅ **Endpoint `/api/labelview/clientes/hierarquia`** - Lista clientes com filtros hierárquicos

### 📊 UX Melhorada
- ✅ Filtros aparecem apenas para usuários do tipo `labelview_unidade`
- ✅ Dropdowns carregam regionais e consultores vinculados à unidade
- ✅ Botão "Limpar" para resetar filtros

### 🔧 Infraestrutura
- ✅ **Redeploy liberado** - Problema de "400 Bad Request" resolvido pelo suporte Emergent

---

## v2.1.1 - 2025-01-02 02:30:00

### 🐛 Correções
- ✅ Erro 500 em `/api/labelview/notifications/unread-count`
- ✅ Adicionado tratamento de erro no endpoint

### 📊 Sistema de Versionamento
- ✅ Criado arquivo `/app/VERSION.txt` centralizado
- ✅ Endpoint `/version-check` agora lê do arquivo
- ✅ Versão atualizada automaticamente a cada mudança

---

## v2.1.0 - 2025-01-02 02:00:00

### 🎉 Funcionalidades Novas
- ✅ Sistema completo de cadastro de consultores
- ✅ Versão visível no painel (sidebar)
- ✅ Filtros: Todos/Indicados/Regional

## v2.34.37 - 2025-12-12 18:45:00

### 🔧 Fluxo de Cotação Corrigido
- ✅ **Card de Confirmação do Plano** - Resumo completo antes de ir para Vistoria
- ✅ **Textos "Master" substituídos** - Agora exibe nome da Unidade para o cliente
- ✅ **Botão desabilitado** se nenhum plano selecionado

### 📊 CRM Corrigido
- ✅ Endpoint `/crm/leads` - Master vê TODOS os leads (não precisa mais selecionar unidade)
- ✅ Endpoint `/crm/protecoes` - Agora consulta o banco de dados (antes retornava arrays vazios fixos)

### 👥 Menu Clientes
- ✅ **Cliente criado imediatamente** quando vistoria é enviada (status: aguardando_vistoria)
- ✅ Cliente aparece no menu "Clientes" de toda a hierarquia ANTES da aprovação
- ✅ Cliente ATUALIZADO (não duplicado) quando vistoria é aprovada

### 🔔 Notificações
- ✅ **Notificação para Master** quando vistoria é enviada
- ✅ **Notificação para Unidade/Regional/Consultor** quando vistoria é aprovada
- ✅ Notificação inclui link de continuação para enviar ao cliente

### 📋 Fluxo Completo
```
Nova Cotação → Dados Pessoais (CRM Lead + Proteção "interesse") 
→ Dados Veículo → Escolhe Plano + Confirma (CRM Proteção "negociação") 
→ Vistoria (Cliente criado + Proteção "aguardando")
→ Master Aprova (Cliente atualizado + Notificação hierarquia)
```

---

## v2.34.36 - 2025-12-12 17:15:00

### 🔧 Correções Críticas
- ✅ **Endpoints CRM Leads criados** - Frontend chamava endpoints inexistentes
  - `GET /labelview/leads/por-status` - Lista leads com filtro e estatísticas
  - `PATCH /labelview/leads/{id}/status` - Atualiza status do lead
  - `DELETE /labelview/leads/{id}` - Deleta lead
  - `POST /labelview/leads/criar-atualizar` - Cria ou atualiza lead
  - `POST /labelview/leads/marcar-abandonado` - Marca lead como abandonado

### 🗄️ Banco de Dados
- ✅ **Migração completa para banco "transmill"**
  - Banco "agitomil" removido (era resquício de implementação antiga)
  - 16 scripts corrigidos para usar "transmill" como default
  - Dados preservados e migrados corretamente

### 📊 Hierarquia de Filtros
- ✅ Master vê TODOS os leads
- ✅ Unidade vê leads da sua rede
- ✅ Regional vê seus leads + dos consultores
- ✅ Consultor vê apenas próprios leads

---
- ✅ Integração com API ViaCEP
- ✅ Sistema de indicação (hierarquia completa)

### 🔧 Correções Críticas
- ✅ Endpoint POST `/consultores` - 13 campos salvando
- ✅ Endpoint GET `/consultores` - Filtro $or retrocompatível
- ✅ Endpoint `/filtros/consultores` criado
- ✅ Endpoint `/filtros/regionais` com alias
- ✅ Endpoint `/dashboard/stats` sem restrição Master
- ✅ Frontend: Parâmetros `email_consultor`, `password_consultor`
- ✅ Frontend: Modal com scroll
- ✅ Frontend: Botões cores Labelview

### 🐛 Bugs Corrigidos
- ✅ Consultor sumindo após refresh
- ✅ Dados não salvando ao editar
- ✅ Erro 404 em `/filtros/consultores`
- ✅ Erro 403 em `/dashboard/stats`
- ✅ CEP não preenchendo automaticamente

---

## v2.0.0 - 2024-12-01

### 🎉 Versão Inicial
- Sistema Labelview básico
- Master, Unidades, Regionais

---

## 🔍 Como verificar a versão

### No Painel:
- Olhar no canto inferior esquerdo da sidebar
- Acima do botão "Sair do Sistema"

### Via API:
```bash
curl https://app.transmill.com.br/api/labelview/version-check
```

### Via Console (F12):
```javascript
fetch('/api/labelview/version-check').then(r=>r.json()).then(console.log)
```
