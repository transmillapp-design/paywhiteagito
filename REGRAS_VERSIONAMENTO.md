# 📋 Regras de Versionamento e Sincronização do Sistema

**REGRA OBRIGATÓRIA:** Toda alteração, implementação e mudança no sistema **DEVE** sincronizar e gerar nova versão da plataforma.

---

## ⚠️ REGRA CRÍTICA DE VERSIONAMENTO

### 🔴 **OBRIGATÓRIO EM TODA MUDANÇA:**

```
TODA alteração no código = NOVA versão do sistema
```

Não importa o tamanho da mudança:
- ✅ Bug fix pequeno → NOVA VERSÃO
- ✅ Nova funcionalidade → NOVA VERSÃO
- ✅ Correção de texto → NOVA VERSÃO
- ✅ Ajuste de estilo → NOVA VERSÃO
- ✅ Refatoração → NOVA VERSÃO
- ✅ Atualização de dependências → NOVA VERSÃO

**NUNCA faça deploy sem atualizar a versão!**

---

## 📊 Esquema de Versionamento (Semantic Versioning)

### Formato: `vMAJOR.MINOR.PATCH`

Exemplo: `v2.4.0`

#### **MAJOR** (primeiro número)
- Mudanças incompatíveis com versões anteriores
- Reestruturação completa do sistema
- Mudança de arquitetura
- Exemplo: `v2.x.x` → `v3.0.0`

#### **MINOR** (segundo número)
- Novas funcionalidades compatíveis
- Adição de endpoints/features
- Melhorias significativas
- Exemplo: `v2.4.x` → `v2.5.0`

#### **PATCH** (terceiro número)
- Bug fixes
- Correções pequenas
- Ajustes de texto/estilo
- Melhorias de performance
- Exemplo: `v2.4.0` → `v2.4.1`

---

## 🔄 Processo Obrigatório de Sincronização

### Passo a Passo (SEMPRE):

#### 1️⃣ **Fazer a Alteração no Código**
```bash
# Exemplo: Correção de bug
vim /app/backend/routes/labelview.py
```

#### 2️⃣ **Atualizar a Versão**
```bash
cd /app

# Para PATCH (bug fix, correção pequena)
./update_version.sh v2.4.1 "🐛 FIX: Descrição da correção"

# Para MINOR (nova funcionalidade)
./update_version.sh v2.5.0 "✨ NEW: Descrição da nova feature"

# Para MAJOR (mudança grande/incompatível)
./update_version.sh v3.0.0 "💥 BREAKING: Descrição da mudança"
```

#### 3️⃣ **Atualizar Frontend**
```bash
# Editar /app/frontend/src/App.js
# Linha ~759: Atualizar FRONTEND_VERSION
const FRONTEND_VERSION = 'v2.4.1';  # NOVA VERSÃO
```

#### 4️⃣ **Verificar Sincronização**
```bash
# Conferir se tudo está sincronizado
echo "VERSION.txt:"
cat /app/VERSION.txt | head -1

echo "Frontend:"
grep "FRONTEND_VERSION = " /app/frontend/src/App.js

echo "Backend (testa via API):"
curl -s http://localhost:8001/api/labelview/version-check | jq '.version'
```

#### 5️⃣ **Reiniciar Serviços (se necessário)**
```bash
# Backend
sudo supervisorctl restart backend

# Frontend (apenas se mudou package.json ou .env)
sudo supervisorctl restart frontend
```

#### 6️⃣ **Documentar Mudanças**
```bash
# Criar/atualizar changelog
vim /app/CHANGELOG_v2.4.1.md
```

---

## 📝 Template de Mensagem de Versão

### Para Bug Fix (PATCH):
```bash
./update_version.sh v2.4.1 "🐛 FIX: [Descrição clara do bug corrigido]"
```

### Para Nova Feature (MINOR):
```bash
./update_version.sh v2.5.0 "✨ NEW: [Descrição da funcionalidade adicionada]"
```

### Para Melhoria (PATCH):
```bash
./update_version.sh v2.4.1 "⚡ IMPROVE: [Descrição da melhoria]"
```

### Para Refatoração (PATCH):
```bash
./update_version.sh v2.4.1 "♻️ REFACTOR: [Descrição da refatoração]"
```

### Para Breaking Change (MAJOR):
```bash
./update_version.sh v3.0.0 "💥 BREAKING: [Descrição da mudança incompatível]"
```

---

## 🎯 Emojis para Commits e Versões

| Emoji | Código | Tipo | Exemplo |
|-------|--------|------|---------|
| ✨ | `:sparkles:` | Nova feature | `✨ NEW: Sistema de notificações` |
| 🐛 | `:bug:` | Bug fix | `🐛 FIX: Correção no login` |
| 🔒 | `:lock:` | Segurança | `🔒 SECURITY: Validação de tokens` |
| ⚡ | `:zap:` | Performance | `⚡ IMPROVE: Otimização de queries` |
| 🎨 | `:art:` | UI/Estilo | `🎨 STYLE: Novo design do dashboard` |
| 📝 | `:memo:` | Documentação | `📝 DOCS: Atualização do README` |
| ♻️ | `:recycle:` | Refatoração | `♻️ REFACTOR: Reorganização de componentes` |
| 🗑️ | `:wastebasket:` | Remoção | `🗑️ REMOVE: Código obsoleto removido` |
| 💥 | `:boom:` | Breaking change | `💥 BREAKING: Nova API incompatível` |
| 🔧 | `:wrench:` | Configuração | `🔧 CONFIG: Atualização de variáveis` |

---

## 📋 Checklist Obrigatório Antes do Deploy

```markdown
- [ ] Código alterado e testado
- [ ] Versão atualizada em VERSION.txt
- [ ] Versão atualizada em App.js (FRONTEND_VERSION)
- [ ] Ambas versões são IGUAIS (backend = frontend)
- [ ] Changelog criado/atualizado
- [ ] Serviços reiniciados (se necessário)
- [ ] Testes básicos realizados
- [ ] Endpoint /api/labelview/version-check retorna nova versão
- [ ] Console do navegador mostra nova versão
- [ ] Documentação atualizada (se aplicável)
```

---

## 🚫 O QUE NÃO FAZER

❌ **NUNCA fazer deploy sem atualizar versão**
```bash
# ERRADO
vim /app/backend/server.py  # Fez mudança
git commit -m "fix bug"
# Deploy sem atualizar versão ❌
```

❌ **NUNCA deixar versões desincronizadas**
```bash
# ERRADO
VERSION.txt: v2.4.0
App.js: v2.3.9  # ❌ Versões diferentes!
```

❌ **NUNCA usar descrições vagas**
```bash
# ERRADO
./update_version.sh v2.4.1 "correções"  # ❌ Muito vago!

# CERTO
./update_version.sh v2.4.1 "🐛 FIX: Correção no modal de edição de tipos de veículos - imagens agora aparecem corretamente"
```

---

## 🔄 Automação (Script Helper)

### Usar o script auxiliar:

```bash
# O script já faz tudo automaticamente
cd /app
./sync_version.sh v2.4.1 "🐛 FIX: Descrição da mudança"

# O que ele faz:
# 1. Atualiza VERSION.txt
# 2. Atualiza App.js
# 3. Verifica sincronização
# 4. Reinicia serviços se necessário
# 5. Mostra resumo
```

---

## 📊 Exemplos Reais

### Exemplo 1: Bug Fix
```bash
# 1. Corrigiu bug no login
vim /app/backend/server.py

# 2. Atualizar versão
./update_version.sh v2.4.1 "🐛 FIX: Correção no endpoint de login - validação de email agora case-insensitive"

# 3. Atualizar frontend
vim /app/frontend/src/App.js
# const FRONTEND_VERSION = 'v2.4.1';

# 4. Verificar
grep -r "v2.4.1" /app/VERSION.txt /app/frontend/src/App.js
```

### Exemplo 2: Nova Feature
```bash
# 1. Adicionou funcionalidade de exportar relatório
vim /app/backend/routes/labelview.py
vim /app/frontend/src/components/Relatorios.js

# 2. Atualizar versão (MINOR - nova feature)
./update_version.sh v2.5.0 "✨ NEW: Sistema de exportação de relatórios em PDF e Excel"

# 3. Atualizar frontend
vim /app/frontend/src/App.js
# const FRONTEND_VERSION = 'v2.5.0';

# 4. Criar changelog
vim /app/CHANGELOG_v2.5.0.md
```

### Exemplo 3: Correção de Texto
```bash
# 1. Corrigiu texto na interface
vim /app/frontend/src/components/Dashboard.js

# 2. Atualizar versão (PATCH - correção pequena)
./update_version.sh v2.4.1 "📝 FIX: Correção de texto no dashboard - 'Usuários' para 'Clientes'"

# 3. Atualizar frontend
vim /app/frontend/src/App.js
# const FRONTEND_VERSION = 'v2.4.1';
```

---

## 🎯 Rastreabilidade

### Por que versionar TUDO?

1. **Rastreabilidade:** Saber exatamente qual código está em produção
2. **Rollback:** Facilita voltar para versão anterior se necessário
3. **Debugging:** Identifica quando um bug foi introduzido
4. **Comunicação:** Equipe sabe o que mudou
5. **Changelog:** Histórico completo de mudanças
6. **Deploy:** Garantia de que frontend e backend estão sincronizados

---

## 📱 Onde a Versão Aparece

### Frontend:
- Console do navegador (F12)
- Logs de inicialização
- Rodapé do sistema (se implementado)

### Backend:
- Endpoint `/api/labelview/version-check`
- Logs do servidor
- Headers HTTP (se configurado)

### Sistema:
- Arquivo `/app/VERSION.txt`
- Changelog files
- Release notes

---

## 🔍 Verificação Rápida

### Comando para verificar versão atual:
```bash
# Versão do sistema
cat /app/VERSION.txt | head -1

# Versão do frontend
grep "FRONTEND_VERSION = " /app/frontend/src/App.js | cut -d"'" -f2

# Versão do backend (via API)
curl -s http://localhost:8001/api/labelview/version-check | jq -r '.version'

# Verificar se estão TODAS iguais
bash /app/check_version_sync.sh
```

---

## 📞 Em Caso de Dúvida

### Perguntas Frequentes:

**Q: Preciso versionar uma mudança de 1 linha?**  
A: **SIM!** Toda mudança = nova versão.

**Q: Esqueci de versionar antes do commit, e agora?**  
A: Versione imediatamente e faça novo commit.

**Q: Posso pular números de versão?**  
A: Não. Sempre incremental (2.4.0 → 2.4.1 → 2.4.2).

**Q: Como saber qual tipo de versão usar?**  
A: Bug fix/correção = PATCH, Nova feature = MINOR, Breaking change = MAJOR.

**Q: Frontend e backend podem ter versões diferentes?**  
A: **NÃO!** Devem SEMPRE estar sincronizados.

---

## ✅ Resumo da Regra

```
╔═══════════════════════════════════════════════════════════╗
║                  REGRA DE OURO                            ║
║                                                           ║
║  TODA MUDANÇA = NOVA VERSÃO                               ║
║                                                           ║
║  1. Alterar código                                        ║
║  2. Atualizar VERSION.txt (./update_version.sh)           ║
║  3. Atualizar App.js (FRONTEND_VERSION)                   ║
║  4. Verificar sincronização                               ║
║  5. Deploy                                                ║
║                                                           ║
║  ✅ SEMPRE SEGUIR ESTA ORDEM!                             ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Criado em:** 2025-12-03  
**Versão do Documento:** 1.0  
**Obrigatório para:** Todos os desenvolvedores e agentes
