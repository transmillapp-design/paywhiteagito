# 🎯 Sistema de Versionamento Automático

## ⚠️ REGRA OBRIGATÓRIA

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  TODA ALTERAÇÃO NO CÓDIGO = NOVA VERSÃO                  ║
║                                                           ║
║  ✅ Implementou algo novo? → NOVA VERSÃO                  ║
║  ✅ Corrigiu um bug? → NOVA VERSÃO                        ║
║  ✅ Mudou um texto? → NOVA VERSÃO                         ║
║  ✅ Ajustou estilo? → NOVA VERSÃO                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🚀 Como Usar (Rápido)

### Método 1: Script Automático (RECOMENDADO)

```bash
# 1. Faça suas alterações no código
vim /app/backend/server.py

# 2. Sincronize automaticamente
./sync_version.sh v2.4.2 "🐛 FIX: Descrição clara da mudança"

# 3. Pronto! ✅
# O script atualiza VERSION.txt, App.js e verifica tudo
```

### Método 2: Manual

```bash
# 1. Atualizar VERSION.txt
./update_version.sh v2.4.2 "🐛 FIX: Descrição"

# 2. Atualizar App.js
vim /app/frontend/src/App.js
# Linha 759: const FRONTEND_VERSION = 'v2.4.2';

# 3. Reiniciar backend
sudo supervisorctl restart backend

# 4. Verificar
./check_version_sync.sh
```

---

## 📋 Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `sync_version.sh` | ✨ **Sincronização automática** (RECOMENDADO) | `./sync_version.sh v2.4.2 "descrição"` |
| `update_version.sh` | Atualiza apenas VERSION.txt | `./update_version.sh v2.4.2 "descrição"` |
| `check_version_sync.sh` | Verifica se tudo está sincronizado | `./check_version_sync.sh` |

---

## 🔢 Esquema de Versionamento

### Formato: `vMAJOR.MINOR.PATCH`

```
v2.4.1
│ │ │
│ │ └─── PATCH: Bug fixes, correções pequenas (2.4.0 → 2.4.1)
│ └───── MINOR: Novas funcionalidades (2.4.x → 2.5.0)
└─────── MAJOR: Mudanças incompatíveis (2.x.x → 3.0.0)
```

### Quando usar cada tipo:

#### PATCH (terceiro número) - Mais comum
- ✅ Bug fixes
- ✅ Correções de texto
- ✅ Ajustes de estilo
- ✅ Melhorias de performance
- ✅ Refatorações sem mudança de comportamento

**Exemplo:** `v2.4.0 → v2.4.1`

```bash
./sync_version.sh v2.4.1 "🐛 FIX: Correção no formulário de login"
```

#### MINOR (segundo número)
- ✅ Nova funcionalidade
- ✅ Novo endpoint de API
- ✅ Nova página/componente
- ✅ Melhorias significativas

**Exemplo:** `v2.4.1 → v2.5.0`

```bash
./sync_version.sh v2.5.0 "✨ NEW: Sistema de notificações push"
```

#### MAJOR (primeiro número) - Raro
- ✅ Mudanças incompatíveis
- ✅ Reestruturação completa
- ✅ Nova arquitetura
- ✅ Breaking changes

**Exemplo:** `v2.5.0 → v3.0.0`

```bash
./sync_version.sh v3.0.0 "💥 BREAKING: Nova API REST incompatível"
```

---

## 📝 Emojis e Prefixos

| Emoji | Tipo | Uso |
|-------|------|-----|
| ✨ NEW | Nova funcionalidade | `✨ NEW: Sistema de chat` |
| 🐛 FIX | Bug fix | `🐛 FIX: Correção no login` |
| ⚡ IMPROVE | Melhoria | `⚡ IMPROVE: Performance 30% melhor` |
| 🎨 STYLE | UI/Design | `🎨 STYLE: Novo tema escuro` |
| ♻️ REFACTOR | Refatoração | `♻️ REFACTOR: Código limpo` |
| 🔒 SECURITY | Segurança | `🔒 SECURITY: Validação de tokens` |
| 📝 DOCS | Documentação | `📝 DOCS: README atualizado` |
| 🗑️ REMOVE | Remoção | `🗑️ REMOVE: Código obsoleto` |
| 💥 BREAKING | Breaking change | `💥 BREAKING: API v3` |

---

## ✅ Checklist Antes do Deploy

```markdown
- [ ] Código alterado e testado localmente
- [ ] ./sync_version.sh executado com sucesso
- [ ] ./check_version_sync.sh retorna "100% SINCRONIZADO"
- [ ] Backend reiniciado (se necessário)
- [ ] Commit feito com mensagem clara
- [ ] Deploy realizado
- [ ] Versão verificada em produção (Console F12)
```

---

## 🔍 Verificação Rápida

```bash
# Ver versão atual
cat /app/VERSION.txt | head -1

# Verificar sincronização
./check_version_sync.sh

# Ver últimas versões
tail -n 20 /app/VERSION.txt
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Corrigiu bug no login
```bash
# 1. Corrigiu código
vim /app/backend/routes/auth.py

# 2. Sincronizar
./sync_version.sh v2.4.3 "🐛 FIX: Validação de email no login agora case-insensitive"

# 3. Confirmar
./check_version_sync.sh
# ✅ SISTEMA 100% SINCRONIZADO!
```

### Exemplo 2: Adicionou nova funcionalidade
```bash
# 1. Implementou nova feature
vim /app/backend/routes/notifications.py
vim /app/frontend/src/components/Notifications.js

# 2. Sincronizar (MINOR - nova feature)
./sync_version.sh v2.5.0 "✨ NEW: Sistema de notificações em tempo real com WebSocket"

# 3. Confirmar
./check_version_sync.sh
# ✅ SISTEMA 100% SINCRONIZADO!
```

### Exemplo 3: Mudou texto na interface
```bash
# 1. Alterou texto
vim /app/frontend/src/components/Dashboard.js

# 2. Sincronizar (PATCH - mudança pequena)
./sync_version.sh v2.4.4 "📝 FIX: Texto 'Usuários' alterado para 'Clientes' no dashboard"

# 3. Confirmar
./check_version_sync.sh
# ✅ SISTEMA 100% SINCRONIZADO!
```

---

## 🚫 Erros Comuns

### ❌ ERRO 1: Esqueceu de versionar
```bash
# ERRADO
vim /app/backend/server.py  # Fez mudança
git commit -m "fix"
# Deploy sem versionar ❌

# CERTO
vim /app/backend/server.py  # Faz mudança
./sync_version.sh v2.4.5 "🐛 FIX: Descrição clara"  # ✅
git commit -m "fix: descrição (v2.4.5)"
```

### ❌ ERRO 2: Versões desincronizadas
```bash
# PROBLEMA
VERSION.txt: v2.4.5
App.js: v2.4.3  # ❌ Diferente!

# SOLUÇÃO
./sync_version.sh v2.4.5 "🔧 SYNC: Sincronização de versões"
```

### ❌ ERRO 3: Descrição vaga
```bash
# ERRADO
./sync_version.sh v2.4.6 "correções"  # ❌ Muito vago

# CERTO
./sync_version.sh v2.4.6 "🐛 FIX: Correção no formulário de cadastro - validação de CPF agora aceita formato com pontos"  # ✅
```

---

## 📱 Onde Verificar a Versão

### 1. Console do Navegador (F12)
```javascript
// Deve aparecer:
✅ VERSÃO FRONTEND: v2.4.0 - Sistema Estável e Protegido
🚀 BUILD v2.4.0 - Sistema Completo
```

### 2. API Endpoint
```bash
curl http://localhost:8001/api/labelview/version-check | jq
# {
#   "success": true,
#   "version": "v2.4.0",
#   "build_date": "2025-12-03 14:40:54"
# }
```

### 3. Arquivo VERSION.txt
```bash
cat /app/VERSION.txt
# v2.4.0
# 2025-12-03 14:40:54
# 🐛 CORREÇÃO CRÍTICA: ...
```

---

## 🎯 Fluxo de Trabalho Ideal

```
1. Fazer alteração no código
   ↓
2. Testar localmente
   ↓
3. Executar: ./sync_version.sh vX.Y.Z "📝 Descrição"
   ↓
4. Verificar: ./check_version_sync.sh
   ↓
5. Commit: git commit -m "descrição (vX.Y.Z)"
   ↓
6. Deploy
   ↓
7. Validar em produção (F12 Console)
```

---

## 🆘 Ajuda

### Comandos úteis:

```bash
# Ver versão atual
cat /app/VERSION.txt | head -1

# Verificar sincronização
./check_version_sync.sh

# Atualizar versão
./sync_version.sh v2.4.X "descrição"

# Ver histórico de versões
less /app/VERSION.txt

# Status do backend
sudo supervisorctl status backend

# Reiniciar backend
sudo supervisorctl restart backend

# Ver logs
tail -f /var/log/supervisor/backend.err.log
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- 📋 `/app/REGRAS_VERSIONAMENTO.md` - Regras completas
- 📝 `/app/CHANGELOG_v2.X.X.md` - Changelog de cada versão
- 📄 `/app/RELEASE_NOTES_v2.X.X.md` - Release notes

---

## 🎓 Resumo

```
╔═══════════════════════════════════════════════════════════╗
║                  PROCESSO SIMPLIFICADO                    ║
║                                                           ║
║  1. Alterar código                                        ║
║  2. ./sync_version.sh vX.Y.Z "descrição"                  ║
║  3. ./check_version_sync.sh                               ║
║  4. Deploy                                                ║
║                                                           ║
║  ✅ SEMPRE seguir esta sequência!                         ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Versão deste documento:** 1.0  
**Última atualização:** 2025-12-03  
**Obrigatório para:** Todos os desenvolvedores e agentes
