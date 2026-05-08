# 🔧 TROUBLESHOOTING - Service Temporarily Unavailable

## ❌ Erro: "Service temporarily unavailable"

Esse erro significa que o **backend não está respondendo** em produção.

---

## 🔍 Causas Possíveis

### 1. Backend Não Iniciou
O serviço pode não ter iniciado corretamente devido a:
- Erro de sintaxe no código
- Dependência Python faltando
- Problema no MongoDB
- Erro nas variáveis de ambiente

### 2. MongoDB Não Acessível
- Conexão com banco falhou
- Credenciais incorretas
- Banco não existe

### 3. Porta Bloqueada
- Backend não está escutando na porta 8001
- Proxy/Nginx não está redirecionando

---

## ✅ SOLUÇÕES - Passo a Passo

### **SOLUÇÃO 1: Verificar Logs do Backend**

**Na plataforma Emergent:**
1. Acesse o painel de logs
2. Procure por "backend" nos logs
3. Veja se há erro de:
   - `ModuleNotFoundError` (falta importação)
   - `SyntaxError` (erro de código)
   - `MongoDB connection failed` (problema de banco)
   - `Port already in use` (porta ocupada)

**O que procurar:**
- Última linha antes de parar
- Mensagens de erro em vermelho
- Stack trace completo

---

### **SOLUÇÃO 2: Verificar se Backend Subiu**

**Teste direto da API:**
```
https://agitomil.com.br/api/health
```

**Resultados possíveis:**
- ✅ `{"status": "healthy"}` → Backend OK, problema é no frontend
- ❌ `Service unavailable` → Backend não está rodando
- ❌ `404 Not Found` → Proxy não está configurado

---

### **SOLUÇÃO 3: Reiniciar Serviços**

**Na plataforma Emergent:**
1. Vá em "Services" ou "Containers"
2. Encontre o serviço "backend"
3. Clique em "Restart" ou "Rebuild"
4. Aguarde 1-2 minutos
5. Teste novamente

---

### **SOLUÇÃO 4: Verificar Variáveis de Ambiente**

**Certifique-se que existem:**

**Backend (.env):**
```env
MONGO_URL=mongodb://...
DB_NAME=agitomil
JWT_SECRET=...
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=https://agitomil.com.br/api
```

Se faltando, adicione e faça rebuild.

---

### **SOLUÇÃO 5: Problema com Imports Novos**

Nosso código adicionou novos imports. Verifique se as bibliotecas estão instaladas:

**Imports usados:**
```python
from uuid import uuid4  # Built-in Python (OK)
from datetime import datetime  # Built-in Python (OK)
from pydantic import BaseModel  # Já estava no projeto
```

**Não deve faltar nada**, mas se o log mostrar erro, verifique `requirements.txt`.

---

### **SOLUÇÃO 6: Arquivo Corrompido no Deploy**

Às vezes o deploy corrompe arquivos. Tente:

1. Fazer **rollback** para versão anterior
2. Verificar se funcionou
3. Fazer **novo deploy** limpo

---

### **SOLUÇÃO 7: MongoDB Não Existe em Produção**

O banco `agitomil` pode não existir em produção ainda.

**Solução:**
1. Acesse: `https://agitomil.com.br/setup-labelview.html`
2. Esse endpoint cria automaticamente o usuário
3. Se funcionar, significa que MongoDB está OK
4. Se não funcionar, MongoDB não está acessível

---

## 🆘 SOLUÇÃO RÁPIDA (Mais Provável)

### **Problema: Backend não compilou no deploy**

**Causa:** Erro de sintaxe ou import em `labelview.py`

**Como resolver:**

**Opção A - Temporária:**
1. Comente temporariamente as novas funcionalidades
2. Em `/app/backend/routes/labelview.py`
3. Comente os endpoints de **fornecedores** e **planos** (linhas 937-1299)
4. Faça novo deploy
5. Sistema volta a funcionar sem essas features

**Opção B - Definitiva:**
1. Verifique os logs de erro
2. Me envie a mensagem de erro específica
3. Corrijo o problema
4. Faz novo deploy

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute na ordem:

- [ ] **1. Ver logs do backend**
  - Procure última mensagem de erro
  - Anote o erro completo

- [ ] **2. Testar endpoint de health**
  - Acesse: `/api/health`
  - Se funcionar: problema é no frontend
  - Se não funcionar: problema é no backend

- [ ] **3. Verificar se MongoDB está acessível**
  - Logs devem mostrar "Connected to MongoDB"
  - Se não: problema de conexão DB

- [ ] **4. Verificar variáveis de ambiente**
  - MONGO_URL existe?
  - DB_NAME = agitomil?

- [ ] **5. Fazer rebuild do backend**
  - Às vezes resolve problemas de cache

---

## 🎯 O QUE ME ENVIAR PARA EU AJUDAR

Se ainda não funcionar, me envie:

1. **Print ou texto dos logs do backend**
   - Últimas 50 linhas
   - Foque em erros (vermelho)

2. **Resultado de /api/health**
   - Funciona ou dá erro?
   - Qual erro exatamente?

3. **Screenshot do erro completo**
   - Página inteira se possível

Com essas informações consigo identificar o problema exato!

---

## 💡 PROBLEMA MAIS COMUM

**90% das vezes é:**
- Backend não iniciou por erro de sintaxe
- MongoDB não conectou

**Solução:**
1. Veja os logs do backend
2. Me envie o erro
3. Corrijo em 2 minutos
4. Novo deploy
5. Funciona! ✅

---

**Aguardando seus logs para diagnóstico preciso!** 🔍
