# 🌍 Ambiente de Produção vs Local - Transmill

## ⚠️ PROBLEMA ATUAL

### Situação
- **PRODUÇÃO** (app.transmill.com.br): Tem dados reais (unidades, consultores, clientes)
- **LOCAL** (ambiente de desenvolvimento): Banco vazio, sem dados

### Por que isso acontece?
Os bancos de dados são **completamente separados**:
- Produção usa MongoDB em um servidor externo
- Local usa MongoDB em container Docker

**Resultado:** Mudanças no código afetam apenas onde são executadas!

## 🔧 SOLUÇÕES PARA CORRIGIR DADOS EM PRODUÇÃO

### Opção 1: Endpoint Administrativo (✅ IMPLEMENTADO)

**O que foi feito:**
- Criado endpoint `POST /api/admin/fix-unidade-user`
- Corrige automaticamente `unidade_id` NULL
- Só funciona se for deployado em produção

**Como usar após deploy:**
```bash
# 1. Login como Master
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "labelview@transmill.com", "password": "demo123"}'

# 2. Copiar o access_token da resposta

# 3. Executar correção
curl -X POST https://app.transmill.com.br/api/admin/fix-unidade-user \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### Opção 2: Acesso Direto ao MongoDB Produção

**Se você tem acesso ao MongoDB de produção:**

```javascript
// Conectar ao MongoDB de produção
use transmill

// Corrigir usuário da unidade
db.users.updateOne(
  { email: "agitoautobrasil@gmail.com" },
  { 
    $set: { 
      unidade_id: "9d110aec-ff9b-448d-ae03-ae9ddec2e0f2",
      is_labelview_unidade: true,
      updated_at: new Date()
    }
  }
)

// Verificar
db.users.findOne({ email: "agitoautobrasil@gmail.com" })
```

### Opção 3: Script de Migração

**Para casos mais complexos:**

```python
# /app/migrations/fix_unidade_id.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_production():
    # Conectar ao MongoDB de produção
    client = AsyncIOMotorClient("mongodb://URL_PRODUCAO")
    db = client.transmill
    
    # Sua correção aqui
    result = await db.users.update_one(
        {"email": "agitoautobrasil@gmail.com"},
        {"$set": {"unidade_id": "9d110aec-ff9b-448d-ae03-ae9ddec2e0f2"}}
    )
    
    print(f"Corrigido: {result.modified_count}")

asyncio.run(fix_production())
```

## 📋 WORKFLOW CORRETO

### Durante Desenvolvimento (Local)

```bash
# 1. Fazer mudanças no código
vim /app/backend/server.py

# 2. Testar localmente com dados de teste
# (criar dados mock se necessário)

# 3. Atualizar versão
python update_version.py 2.8.1 "Mensagem"

# 4. Commit
git add .
git commit -m "v2.8.1: Descrição"

# 5. Push para produção
git push origin main
```

### Após Deploy em Produção

```bash
# 1. Verificar versão deployada
curl https://app.transmill.com.br/api/health

# 2. Executar correções via endpoint (se necessário)
curl -X POST https://app.transmill.com.br/api/admin/fix-unidade-user \
  -H "Authorization: Bearer TOKEN"

# 3. Testar funcionalidade
# Login: agitoautobrasil@gmail.com
# Acessar: Pessoas > Consultor
# Verificar: Lista aparece
```

## 🎯 CASOS DE USO

### Caso 1: Bug no Código
```bash
# Local: Corrigir código
# Local: Testar
# Local: Versionar + Commit
# Produção: Deploy automático
# ✅ Resolvido
```

### Caso 2: Dados Incorretos em Produção
```bash
# Opção A: Usar endpoint admin (após deploy)
# Opção B: Corrigir direto no MongoDB
# Opção C: Script de migração
# ✅ Resolvido
```

### Caso 3: Falta Campo no Usuário
```bash
# Local: Criar endpoint de correção
# Local: Versionar + Commit + Deploy
# Produção: Executar endpoint
# ✅ Resolvido
```

## 🔍 PROBLEMA ATUAL: unidade_id NULL

### Diagnóstico
```
Usuário: agitoautobrasil@gmail.com
Problema: unidade_id = NULL
Causa: Usuário criado sem o campo
Sintoma: Tela de Consultores em branco
```

### Solução Criada
```
Endpoint: POST /api/admin/fix-unidade-user
Status: ✅ Implementado (aguardando deploy)
Ação: Seta unidade_id automaticamente
```

### Como Aplicar
```bash
# APÓS DEPLOY:

# 1. Login master
TOKEN=$(curl -s -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "labelview@transmill.com", "password": "demo123"}' \
  | jq -r '.access_token')

# 2. Executar correção
curl -X POST https://app.transmill.com.br/api/admin/fix-unidade-user \
  -H "Authorization: Bearer $TOKEN"

# 3. Fazer logout/login com unidade
# Email: agitoautobrasil@gmail.com
# Senha: !Ma04202011@

# 4. Acessar Pessoas > Consultor
# ✅ Deve aparecer normalmente
```

## ⚡ CORREÇÃO RÁPIDA MANUAL

**Se você tem acesso ao MongoDB:**

```javascript
// MongoDB Produção
use transmill

db.users.updateOne(
  { email: "agitoautobrasil@gmail.com" },
  { $set: { 
      unidade_id: "9d110aec-ff9b-448d-ae03-ae9ddec2e0f2",
      is_labelview_unidade: true 
  }}
)
```

**Verificar:**
```javascript
db.users.findOne(
  { email: "agitoautobrasil@gmail.com" },
  { email: 1, unidade_id: 1, is_labelview_unidade: 1 }
)
```

## 📊 Dados Corretos

```json
{
  "email": "agitoautobrasil@gmail.com",
  "unidade_id": "9d110aec-ff9b-448d-ae03-ae9ddec2e0f2",
  "user_type": "labelview_unidade",
  "is_labelview_unidade": true,
  "is_active": true
}
```

## 🚨 ATENÇÃO

1. **Nunca teste em produção sem testar localmente primeiro**
2. **Use endpoints admin apenas quando necessário**
3. **Sempre faça backup antes de alterar dados em produção**
4. **Documente todas as mudanças no banco de dados**

---

**Criado em:** 2025-12-04  
**Versão:** 2.8.1
