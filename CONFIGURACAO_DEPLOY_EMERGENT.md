# 🚀 CONFIGURAÇÃO DE DEPLOY - PLATAFORMA EMERGENT

## ❌ PROBLEMA ATUAL

Deploy falha com erro 520 porque:
1. **Health checks começam muito cedo** (enquanto ainda está em BUILD)
2. **Timeout muito curto** (60 segundos total)
3. **Build pode demorar 7+ minutos** (yarn install + pip install + yarn build)

**Logs do último deploy:**
```
[BUILD] Running: yarn install && yarn build (7 minutos)
[HEALTH_CHECK] Dec 10 21:24:09 backend failed with status code: 520
[HEALTH_CHECK] Dec 10 21:24:29 backend failed with status code: 520
[HEALTH_CHECK] Dec 10 21:24:49 backend failed with status code: 520
[HEALTH_CHECK] Dec 10 21:25:09 backend health check failed after 3 attempts
```

**Problema:** Health checks desistem após 1 minuto, mas serviços só ficam prontos após 7+ minutos.

---

## ✅ CORREÇÕES APLICADAS NO CÓDIGO

### 1. Dockerfile - Health Check Ajustado

**Antes:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8001/api/health || exit 1
```

**Depois:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:8001/healthz || exit 1
```

**Mudanças:**
- `start-period`: 40s → **180s** (3 minutos para aguardar startup)
- `retries`: 3 → **5** (mais tentativas)
- Health check endpoint: `/api/health` → **/healthz** (mais rápido, sem MongoDB)

### 2. start.sh - Backend com Uvicorn

**Antes:**
```bash
python3 server.py &
```

**Depois:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 &
```

### 3. Backend - Health Check Endpoints

- ✅ `/healthz` - Resposta instantânea (~11ms)
- ✅ `/api/health` - Com validação MongoDB
- ✅ `/ready` - Readiness check

Todos aceitam GET e HEAD requests ✅

---

## ⚠️ CONFIGURAÇÃO NECESSÁRIA NA PLATAFORMA EMERGENT

### Opção 1: Ajustar Health Check na Plataforma

Se a plataforma Emergent tem configuração de health check, ajustar para:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8001
  initialDelaySeconds: 180  # ← 3 minutos para aguardar build
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 5

readinessProbe:
  httpGet:
    path: /healthz
    port: 8001
  initialDelaySeconds: 180  # ← 3 minutos
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 5
```

### Opção 2: Desabilitar Health Check Durante Build

Se possível na plataforma Emergent, desabilitar health checks até o container sinalizar "ready".

### Opção 3: Build em Etapa Separada

Idealmente, fazer o build (yarn build, pip install) em uma etapa anterior do CI/CD, não no runtime do container.

---

## 📊 TIMELINE ESPERADO DO DEPLOY

```
[0:00] - Deploy iniciado
[0:30] - Extraindo arquivos
[1:00] - yarn install (pode demorar 3-5 minutos)
[4:00] - yarn build (pode demorar 2-3 minutos)
[6:00] - pip install (pode demorar 1 minuto)
[7:00] - Container iniciado
[7:05] - Backend pronto (uvicorn started)
[7:10] - Frontend pronto (serve started)
[7:15] - PRIMEIRO health check deve ocorrer AQUI
```

**Problema atual:** Health checks começam em [0:40] e desistem em [1:40]

**Solução:** Health checks devem começar em [7:00+] e aguardar até [10:00]

---

## 🎯 RECOMENDAÇÕES PARA EMERGENT

### Curto Prazo (Emergencial):
1. **Aumentar timeout de health check** para 10 minutos no primeiro deploy
2. **Aumentar initialDelaySeconds** para 180 segundos (3 minutos)
3. **Aumentar failureThreshold** para 10 tentativas

### Médio Prazo (Ideal):
1. **Separar build de runtime**: 
   - Fazer yarn build e pip install em etapa de BUILD
   - Container de runtime já ter tudo compilado
2. **Multi-stage Dockerfile**:
   - Stage 1: Build (yarn build, pip install)
   - Stage 2: Runtime (apenas executar)
3. **Cache de dependências**:
   - Cachear node_modules e pip packages

---

## 🔧 TESTE LOCAL

Você pode testar o tempo de build localmente:

```bash
cd /app
time docker build -t transmill-test .
# Deve demorar ~7-10 minutos na primeira vez
```

---

## ✅ VALIDAÇÃO

Para confirmar que tudo está funcionando:

1. **Após deploy bem-sucedido:**
   ```bash
   curl https://app.transmill.com.br/healthz
   # Deve retornar: {"status":"ok"}
   ```

2. **Verificar versão:**
   ```bash
   curl https://app.transmill.com.br/api/health
   # Deve retornar: {"status":"healthy","version":"v2.34.9",...}
   ```

---

## 📋 CHECKLIST PRÉ-DEPLOY

- [x] Dockerfile ajustado (start-period: 180s)
- [x] start.sh usando uvicorn
- [x] Health check endpoints otimizados
- [x] Backend não bloqueia no MongoDB
- [x] Versão v2.34.9 sincronizada
- [ ] Configuração de health check na plataforma Emergent ajustada
- [ ] Timeout total do deploy aumentado (se possível)

---

## 🚨 SE O PRÓXIMO DEPLOY FALHAR NOVAMENTE

**Verifique:**
1. Os logs mostram quando o build termina?
2. Quanto tempo entre "build complete" e "health check failed"?
3. A plataforma permite ajustar `initialDelaySeconds`?

**Solução alternativa:**
- Criar um script de "warm-up" que aguarda serviços ficarem prontos
- Usar arquivo `.ready` que só é criado quando tudo estiver funcionando
- Health check pode verificar se arquivo `.ready` existe

---

**Próximo deploy deve funcionar se o initialDelaySeconds for ajustado na plataforma!** 🚀
