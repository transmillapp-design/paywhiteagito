# ✅ CHECKLIST PRÉ-DEPLOY - AGITOCOIN.COM.BR

## 🚨 CONFIGURAÇÕES CRÍTICAS IDENTIFICADAS

### ❌ PROBLEMAS ENCONTRADOS QUE IMPEDEM DEPLOY CORRETO:

1. **Backend - FRONTEND_URL está INCORRETA**
   - Arquivo: `/app/backend/.env` (linha 14)
   - Valor Atual: `https://slim-super-app.preview.emergentagent.com`
   - ❌ **PROBLEMA:** Links de indicação usarão URL de preview
   - ✅ **DEVE SER:** `https://agitomil.com.br`

2. **Frontend - REACT_APP_BACKEND_URL está INCORRETA**
   - Arquivo: `/app/frontend/.env` (linha 1)
   - Valor Atual: `https://slim-super-app.preview.emergentagent.com`
   - ❌ **PROBLEMA:** Frontend não conseguirá se comunicar com backend de produção
   - ✅ **DEVE SER:** `https://agitomil.com.br`

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Atualizar Backend .env

**Método A: Via Painel de Deploy (RECOMENDADO)**
Configure a variável de ambiente no painel:
```
FRONTEND_URL=https://agitomil.com.br
```

**Método B: Editar arquivo manualmente**
```bash
# Editar /app/backend/.env linha 14
FRONTEND_URL=https://agitomil.com.br
```

### 2. Atualizar Frontend .env

**IMPORTANTE:** O sistema de deploy do Emergent geralmente configura automaticamente o `REACT_APP_BACKEND_URL`. Verifique se:
- O deploy nativo do Emergent configurará automaticamente para `https://agitomil.com.br`
- Se não, configure manualmente no painel de variáveis de ambiente

---

## ✅ VERIFICAÇÕES ADICIONAIS

### Backend (/app/backend/.env)
```
✅ MONGO_URL=mongodb://localhost:27017 (OK - local MongoDB)
✅ DB_NAME=agitocoin (OK)
✅ JWT_SECRET=agitocoin_secret_key_2024 (OK)
❌ FRONTEND_URL=https://slim-super-app.preview.emergentagent.com (PRECISA MUDAR)
✅ XGATE_API_URL=https://api.xgateglobal.com (OK)
✅ XGATE_ENVIRONMENT=production (OK)
⚠️  EMAIL_USER/PASS/FROM vazios (se usar recuperação de senha, configure)
```

### Frontend (/app/frontend/.env)
```
❌ REACT_APP_BACKEND_URL=https://slim-super-app.preview.emergentagent.com (PRECISA MUDAR)
✅ GENERATE_SOURCEMAP=false (OK - otimização)
```

---

## 📋 IMPACTO DAS URLS INCORRETAS

### Se FRONTEND_URL estiver errada no backend:
- ❌ Links de indicação apontarão para preview
- ❌ Usuário compartilha link no WhatsApp: vai para preview
- ❌ Novo usuário clica no link: cadastro no ambiente errado
- ❌ Sistema de referral não funcionará corretamente

### Se REACT_APP_BACKEND_URL estiver errada no frontend:
- ❌ Frontend não consegue fazer chamadas à API
- ❌ Login não funciona
- ❌ Todas as operações falham
- ❌ Aplicação completamente quebrada

---

## 🧪 TESTES PÓS-DEPLOY

Após fazer deploy com URLs corretas, teste:

### 1. Teste de Indicação
```
1. Login em https://agitomil.com.br
2. Ir para aba "Indicar"
3. Verificar link de indicação
4. Deve mostrar: https://agitomil.com.br/register?ref=CODIGO
5. NÃO deve mostrar: preview.emergentagent.com
```

### 2. Teste de API
```
1. Abrir DevTools (F12)
2. Network tab
3. Fazer qualquer ação (login, buscar dados)
4. Verificar chamadas de API
5. Devem ir para: https://agitomil.com.br/api/...
6. NÃO para: preview.emergentagent.com
```

### 3. Teste do Chatbot
```
1. Campo "O que você precisa hoje?"
2. Digitar: "deposito"
3. Clicar no botão "Ir para Depósito"
4. Deve navegar para: https://agitomil.com.br/deposito
5. URL deve estar correta
```

---

## 📝 OUTRAS CONFIGURAÇÕES

### Variáveis que NÃO precisam mudar:
- ✅ MONGO_URL (gerenciada pelo sistema)
- ✅ JWT_SECRET (OK para produção)
- ✅ XGATE credentials (já em produção)
- ✅ DB_NAME (OK)

### Variáveis opcionais:
- ⚠️ EMAIL_* (configure se quiser recuperação de senha por email)

---

## 🚀 PASSO A PASSO PARA DEPLOY

### Opção 1: Deploy via Painel Emergent (RECOMENDADO)

1. **Configurar Variáveis de Ambiente no Painel:**
   ```
   FRONTEND_URL=https://agitomil.com.br
   ```

2. **Fazer Deploy:**
   - O sistema aplicará a variável automaticamente
   - `REACT_APP_BACKEND_URL` será configurado pelo sistema

3. **Verificar após deploy:**
   - Testar link de indicação
   - Testar chamadas de API
   - Testar navegação do chatbot

### Opção 2: Editar manualmente antes do deploy

1. **Editar `/app/backend/.env`:**
   ```bash
   FRONTEND_URL=https://agitomil.com.br
   ```

2. **Commit e push:**
   ```bash
   git add backend/.env
   git commit -m "fix: update FRONTEND_URL for production"
   git push
   ```

3. **Fazer deploy**

4. **Após deploy, verificar que `REACT_APP_BACKEND_URL` foi configurado automaticamente pelo Emergent**

---

## ⚠️ IMPORTANTE

**NUNCA modifique estas URLs no código:**
- ❌ Não faça hardcode de URLs
- ❌ Não modifique `MONGO_URL` manualmente
- ✅ SEMPRE use variáveis de ambiente

**O QUE O EMERGENT FAZ AUTOMATICAMENTE:**
- ✅ Configura `REACT_APP_BACKEND_URL` no frontend
- ✅ Configura roteamento de `/api/*` para backend
- ✅ Configura MongoDB local

**O QUE VOCÊ PRECISA CONFIGURAR:**
- ❌ `FRONTEND_URL` no backend (para links de indicação)

---

## 📊 RESUMO EXECUTIVO

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| FRONTEND_URL (backend) | ❌ | Mudar para `https://agitomil.com.br` |
| REACT_APP_BACKEND_URL (frontend) | ⚠️ | Verificar se Emergent configura automaticamente |
| MONGO_URL | ✅ | Não modificar |
| JWT_SECRET | ✅ | OK |
| XGATE | ✅ | OK |
| Email | ⚠️ | Opcional |

---

## 🎯 CONCLUSÃO

**ANTES DE FAZER DEPLOY:**
1. ✅ Configure `FRONTEND_URL=https://agitomil.com.br` no backend
2. ✅ Verifique se o Emergent configurará `REACT_APP_BACKEND_URL` automaticamente
3. ✅ Teste o link de indicação após deploy

**SEM ESTAS CONFIGURAÇÕES:**
- Sistema de indicação não funcionará
- Links compartilhados irão para ambiente errado
- Experiência do usuário quebrada

---

**Última atualização:** Pré-Deploy para agitomil.com.br
**Status:** ⚠️ AÇÃO NECESSÁRIA ANTES DO DEPLOY
