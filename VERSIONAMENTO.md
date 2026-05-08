# 📦 Sistema de Versionamento Transmill

## 🎯 Objetivo

Sistema automático que atualiza a versão em **todos** os arquivos do sistema de forma sincronizada, garantindo que backend e frontend sempre estejam na mesma versão.

## 📁 Arquivos Atualizados Automaticamente

- ✅ `/app/VERSION.txt` - Versão principal + changelog
- ✅ `/app/backend/server.py` - FastAPI version + health check
- ✅ `/app/frontend/src/App.js` - FRONTEND_VERSION + console logs

## 🚀 Como Usar

### Atualizar Versão

```bash
# Formato
python update_version.py <versão> "<mensagem do changelog>"

# Exemplos
python update_version.py 2.8.1 "Correção bug consultor unidade_id"
python update_version.py 2.9.0 "Nova feature: upload múltiplo de imagens"
python update_version.py 3.0.0 "Breaking change: novo sistema de auth"
```

### Formato da Versão

Seguimos o padrão **Semantic Versioning** (MAJOR.MINOR.PATCH):

- **MAJOR (X.0.0)**: Mudanças incompatíveis (breaking changes)
- **MINOR (0.X.0)**: Novas funcionalidades (compatível)
- **PATCH (0.0.X)**: Correções de bugs

## 📋 Workflow Recomendado

### 1. Fazer Mudanças no Código
```bash
# Desenvolva suas features/correções normalmente
git status
```

### 2. Atualizar Versão
```bash
# Escolha a versão apropriada
python update_version.py 2.8.1 "Correção: unidade_id em branco"
```

### 3. Revisar Mudanças
```bash
# Ver o que foi alterado
git diff

# Ver arquivos modificados
git status
```

### 4. Commit e Deploy
```bash
# Commit com mensagem da versão
git add .
git commit -m "v2.8.1: Correção unidade_id em branco"

# Push para produção
git push origin main
```

### 5. Verificar em Produção
```bash
# Health check mostra a versão
curl https://app.transmill.com.br/api/health

# Console do navegador mostra versão do frontend
# Abrir DevTools (F12) → Console
```

## 🔍 Verificar Versão Atual

### Backend
```bash
curl https://app.transmill.com.br/api/health | jq '.version'
```

### Frontend
```bash
# Console do navegador
# Procure por: "✅ VERSÃO FRONTEND: vX.X.X"
```

### Arquivo Principal
```bash
cat /app/VERSION.txt
```

## 📊 Histórico de Versões

### v2.8.0 (2025-12-03)
- ✅ Endpoint DELETE tipos-veiculo implementado
- ✅ Logs detalhados PATCH/GET imagens
- ✅ Rebranding completo AgitoCoin→Transmill
- ✅ QR codes TRANSMILL_
- ✅ Conta Master labelview@transmill.com

### v2.7.6 (2025-12-03)
- 🔧 Debug logs detalhados salvamento imagens
- 🔧 Campo Motor já existia

## ⚠️ Notas Importantes

1. **Sempre use o script** para atualizar versões (não edite manualmente)
2. **Mensagem clara** do que foi alterado no changelog
3. **Teste antes do deploy** em ambiente local
4. **Versões sincronizadas** entre backend e frontend
5. **Commit após atualizar** a versão

## 🐛 Troubleshooting

### Script não executa
```bash
# Dar permissão de execução
chmod +x /app/update_version.py
```

### Formato inválido
```bash
# ❌ Errado
python update_version.py v2.8.1 "mensagem"
python update_version.py 2.8 "mensagem"

# ✅ Correto
python update_version.py 2.8.1 "mensagem"
python update_version.py 2.9.0 "mensagem"
```

### Versões diferentes em prod
```bash
# Fazer deploy novamente
git push origin main --force

# Limpar cache do navegador
# Ctrl + Shift + R (hard reload)
```

## 📝 Exemplo Completo

```bash
# 1. Você corrigiu um bug
git status

# 2. Atualizar versão (patch)
python update_version.py 2.8.1 "Fix: consultores não aparecem para unidade"

# 3. Ver mudanças
git diff

# 4. Commit
git add .
git commit -m "v2.8.1: Fix consultores tela em branco"

# 5. Deploy
git push origin main

# 6. Verificar
curl https://app.transmill.com.br/api/health
# Deve retornar: "version": "2.8.1"
```

## 🎯 Convenções

### Mensagens de Commit
```bash
# Formato: vX.Y.Z: Descrição breve
v2.8.1: Fix consultores tela em branco
v2.9.0: Add sistema de notificações
v3.0.0: Breaking: novo sistema de auth
```

### Changelog
```bash
# Seja descritivo e específico
❌ "Correções"
✅ "Fix: unidade_id NULL causando tela em branco em consultores"

❌ "Nova feature"
✅ "Add: Upload múltiplo de até 20 imagens em vistorias"
```

---

**Mantido por:** Time Transmill  
**Última atualização:** 2025-12-04
