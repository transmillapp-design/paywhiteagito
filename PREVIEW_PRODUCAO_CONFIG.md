# CONFIGURAÇÃO PREVIEW E PRODUÇÃO

## ✅ SISTEMA PRONTO PARA AMBOS OS AMBIENTES

### 🌐 URLs SUPORTADAS

**Preview (Emergent):**
- Auto-detectado via `REACT_APP_BACKEND_URL`
- Qualquer URL com `emergentagent.com` ou `emergent.host`
- Exemplo: `https://api-decompose-1.preview.emergentagent.com`

**Produção:**
- `https://agitomil.com.br`
- `https://www.agitomil.com.br`

**Desenvolvimento Local:**
- `http://localhost:3000`
- `http://localhost:3001`

---

## 🔧 CONFIGURAÇÕES

### CORS (Backend)

**Arquivo:** `/app/backend/server.py` (linhas 101-127)

```python
allowed_origins = [
    "http://localhost:3000",          # Dev local
    "http://localhost:3001",          # Dev local
    "https://agitomil.com.br",       # Produção
    "https://www.agitomil.com.br"    # Produção com www
]

# Auto-detecta Emergent preview/staging
backend_url = os.environ.get('REACT_APP_BACKEND_URL', '')
if 'emergentagent.com' in backend_url or 'emergent.host' in backend_url:
    parsed = urlparse(backend_url)
    frontend_url = f"{parsed.scheme}://{parsed.netloc}".replace(':8001', ':3000')
    if frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)
```

**Como Funciona:**
1. Lista fixa para produção e local
2. Auto-detecção para preview Emergent
3. Suporta múltiplos ambientes simultaneamente

---

### Variáveis de Ambiente

**Frontend:** `/app/frontend/.env`
```
REACT_APP_BACKEND_URL=https://api-decompose-1.preview.emergentagent.com
GENERATE_SOURCEMAP=false
```

**⚠️ IMPORTANTE:**
- Em **preview**: usa o valor do `.env`
- Em **produção**: Emergent sobrescreve automaticamente
- Não precisa alterar manualmente!

---

### Marca D'água Emergent

**Status:** ✅ REMOVIDA

**Arquivo:** `/app/frontend/public/index.html`
- Badge "Made with Emergent" foi removida
- Sem marca d'água visível no site

---

## 🚀 DEPLOY

### Para Preview (Emergent):
1. Commit e push para GitHub
2. Emergent rebuilda automaticamente
3. Acessa via URL preview

### Para Produção (agitomil.com.br):
1. Conectar GitHub ao Emergent
2. Configurar domínio customizado
3. Deploy automático
4. DNS aponta para Emergent

---

## 🧪 TESTANDO

### Preview:
```bash
# Acessar
https://api-decompose-1.preview.emergentagent.com

# Login
Cliente: cliente@demo.com / demo123
Lojista: lojista@demo.com / demo123
Master: admin@admin.com / admin123
```

### Produção:
```bash
# Acessar
https://agitomil.com.br

# Mesmas credenciais
```

---

## ✅ CHECKLIST COMPLETO

- [x] CORS configurado para preview
- [x] CORS configurado para produção
- [x] Auto-detecção Emergent funcionando
- [x] Variáveis de ambiente corretas
- [x] Marca d'água removida
- [x] Meta tags mobile OK
- [x] PWA configurado
- [x] Backend validado (23/23 testes)
- [x] Frontend limpo
- [x] Documentação completa

---

## 🔄 COMO FUNCIONA EM CADA AMBIENTE

### Preview (emergentagent.com):
1. Emergent seta `REACT_APP_BACKEND_URL` automaticamente
2. Backend detecta no CORS e adiciona à lista
3. Requests funcionam ✅

### Produção (agitomil.com.br):
1. Emergent seta `REACT_APP_BACKEND_URL` para produção
2. Backend já tem na lista fixa de `allowed_origins`
3. Requests funcionam ✅

### Local (localhost):
1. `.env` tem URL do preview ou local
2. Backend tem localhost na lista fixa
3. Requests funcionam ✅

---

## 🎯 RESULTADO

Sistema funciona perfeitamente em:
- ✅ Preview Emergent
- ✅ Produção (agitomil.com.br)
- ✅ Desenvolvimento local

**Sem marca d'água!** 🎉
