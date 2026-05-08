# 🔐 CONTAS MASTER DE PRODUÇÃO - TRANSMILL

**Data de Criação:** 24/11/2025  
**Banco de Dados:** MongoDB - Database `transmill`  
**Status:** ✅ ATIVO E FUNCIONANDO

---

## 🏢 1. MASTER TRANSMILL (Sistema Completo)

**Responsabilidade:** Administra TODO o sistema Transmill

### 📋 Dados da Conta:
- **Email:** `transmillapp@gmail.com`
- **Senha:** `demo123`
- **Nome:** Master Transmill
- **User Type:** `master`

### 🏢 Dados da Empresa:
- **Razão Social:** Transmill Tecnologia Ltda
- **CNPJ:** 13.462.972/0001-40

### 👑 Permissões:
- ✅ `is_master_account: true` → **Master do Sistema**
- ❌ `is_labelview_master: false` → Não gerencia Labelview
- ✅ Acesso completo a todos os módulos da plataforma
- ✅ Gerenciamento de usuários, lojas, prestadores
- ✅ Configurações gerais do sistema
- ✅ Relatórios e dashboard master

### 🔑 ID da Conta:
`710fc3c9-9122-4b92-9787-a6f16131ecb2`

---

## 🛡️ 2. MASTER LABELVIEW (Proteção Veicular)

**Responsabilidade:** Administra APENAS o módulo de Proteção Veicular (Labelview)

### 📋 Dados da Conta:
- **Email:** `labelview@transmill.com`
- **Senha:** `demo123`
- **Nome:** Master Labelview
- **User Type:** `labelview_master`

### 🏢 Dados da Empresa:
- **Razão Social:** LABELVIEW ASSOCIAÇÃO MUTUALISTA DE PROTEÇÃO VEICULAR
- **CNPJ:** 59.035.703/0001-06

### 👑 Permissões:
- ❌ `is_master_account: false` → Não é master do sistema geral
- ✅ `is_labelview_master: true` → **Master do Labelview**
- ✅ Acesso ao painel Labelview completo
- ✅ Gerenciamento de hierarquia (Unidades, Regionais, Consultores)
- ✅ Cadastro de tipos de fornecedores, equipamentos, técnicos
- ✅ Gestão de CRM, leads e solicitações de proteção
- ✅ Configuração de tabelas de valores e planos
- ✅ Sistema de notificações Labelview

### 🔑 ID da Conta:
`4715c347-e334-4f67-9019-20c3b3170f2c`

---

## 🌐 URLs de Acesso

### Login:
```
https://app.transmill.com.br/login
```

### Painel Master Transmill:
```
https://app.transmill.com.br/master/dashboard
```
- Login com: `transmillapp@gmail.com`

### Painel Master Labelview:
```
https://app.transmill.com.br/labelview/dashboard
```
- Login com: `labelview@transmill.com`

---

## 🧪 Teste de Login (via API)

### Master Transmill:
```bash
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "transmillapp@gmail.com",
    "password": "demo123"
  }'
```

### Master Labelview:
```bash
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "labelview@transmill.com",
    "password": "demo123"
  }'
```

---

## 📊 Status do Banco de Dados

- **Total de Contas:** 2 (apenas as contas master)
- **Contas Demo:** DELETADAS ✅
- **Outras Contas:** DELETADAS ✅
- **Banco Limpo:** ✅ SIM - Pronto para produção

---

## ⚠️ IMPORTANTE

1. **Senha Padrão:** Ambas as contas usam a senha `demo123`
   - ⚠️ **RECOMENDAÇÃO:** Alterar a senha em produção após primeiro acesso

2. **Separação de Responsabilidades:**
   - `transmillapp@gmail.com` → Gerencia TODO o sistema
   - `labelview@transmill.com` → Gerencia APENAS proteção veicular

3. **Backup das Informações:**
   - Guarde este documento em local seguro
   - Salve os IDs das contas para referência futura

4. **Acesso aos Painéis:**
   - Master Transmill vê dashboard principal com todos os módulos
   - Master Labelview vê apenas o painel de proteção veicular

---

## 🔧 Script de Criação

O script utilizado para criar estas contas está salvo em:
```
/app/create_master_accounts_production.py
```

Para recriar as contas (se necessário):
```bash
cd /app
python3 create_master_accounts_production.py
```

---

## ✅ Validação Realizada

- ✅ Contas criadas no banco de dados
- ✅ Senhas hashadas com bcrypt
- ✅ Permissões configuradas corretamente
- ✅ Login testado via API (ambas as contas)
- ✅ Tokens JWT gerados com sucesso
- ✅ User types corretos
- ✅ Contas ativas e não bloqueadas
- ✅ Dados das empresas salvos corretamente

---

**Criado por:** Sistema Automatizado Transmill  
**Última Atualização:** 24/11/2025 16:02 UTC
