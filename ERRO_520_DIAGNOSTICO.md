# 🚨 DIAGNÓSTICO: ERRO 520 NO BACKEND DE PRODUÇÃO

## ❌ ERRO ATUAL
```
GET https://app.transmill.com.br/api/health 520
Erro: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Significado**: Backend não está respondendo corretamente em produção.

---

## ✅ VERIFICAÇÕES LOCAIS (TODAS PASSARAM)

✅ Backend local: Rodando e respondendo
✅ Endpoint /api/health: Funcionando (retorna v2.34.9)
✅ Endpoint /api/labelview/version-check: Funcionando
✅ MongoDB: Conectado
✅ Dependências: Instaladas (httpx, pypng, qrcode)

---

## 🔍 POSSÍVEIS CAUSAS DO ERRO 520

### 1. **Backend não iniciou em produção**
   - Dependências faltando
   - Erro ao importar módulos
   - Timeout no startup

### 2. **Variáveis de ambiente faltando**
   - MONGO_URL não configurada
   - Cloudinary keys faltando
   - Outras envs necessárias

### 3. **Timeout do Cloudflare**
   - Backend demora muito para responder
   - Processo travado no startup

---

## 🛠️ COMO VERIFICAR (APÓS DEPLOY)

### Via Plataforma Emergent:

1. **Verificar logs do backend em produção:**
   - Procurar por: `ModuleNotFoundError`
   - Procurar por: `Application startup complete`
   - Verificar se há erros de import

2. **Verificar se todas as dependências foram instaladas:**
   - httpx==0.25.2 (ou superior)
   - pypng==0.20220715.0
   - qrcode[pil]==7.4.2
   - Todas as outras do requirements.txt

3. **Verificar variáveis de ambiente:**
   - MONGO_URL
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - FIPE_API_KEY (se necessário)
   - XGATE_* (se necessário)

---

## ✅ SOLUÇÃO TEMPORÁRIA

Se o backend não subir, você pode tentar:

1. **Redeploy completo** (rebuild from scratch)
2. **Verificar logs detalhados** do supervisor/uvicorn
3. **Testar startup do backend isoladamente**

---

## 📋 CHECKLIST DE DEPLOY

Antes do próximo deploy, garantir:

- [ ] Todas as dependências estão no requirements.txt
- [ ] Não há conflitos de versão
- [ ] Variáveis de ambiente configuradas
- [ ] Backend inicia localmente sem erros
- [ ] Endpoints /api/health e /api/labelview/version-check funcionam

---

## 🎯 ARQUIVOS CRÍTICOS

1. `/app/backend/requirements.txt` - Todas as dependências
2. `/app/backend/.env` - Variáveis de ambiente
3. `/app/backend/server.py` - Código principal (linha 41 - imports)

---

## 🚀 RESOLUÇÃO PROVÁVEL

O erro 520 geralmente se resolve com:
1. **Redeploy completo** após verificar requirements.txt
2. **Aguardar mais tempo** no primeiro startup (pode demorar)
3. **Verificar logs** para identificar o erro específico

---

## 📞 SUPORTE

Se o erro persistir após redeploy:
1. Verificar logs detalhados do backend em produção
2. Confirmar que MongoDB está acessível
3. Testar manualmente: `curl https://app.transmill.com.br/api/health`
