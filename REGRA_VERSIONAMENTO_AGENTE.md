# ⚠️ REGRA OBRIGATÓRIA DE VERSIONAMENTO - PARA AGENTES IA

## 🎯 Versão Atual: **2.30.2**

---

## ⚠️ REGRA CRÍTICA

**TODO AGENTE QUE FIZER QUALQUER ALTERAÇÃO NO CÓDIGO DEVE ATUALIZAR A VERSÃO!**

O usuário **NÃO é programador** e **NÃO pode atualizar versões manualmente**.

---

## ✅ O Que o Agente DEVE Fazer

### **SEMPRE que alterar código:**

1. ✅ **Incrementar a versão** antes de finalizar
2. ✅ **Atualizar os 2 locais** no server.py
3. ✅ **Atualizar VERSION.md** com changelog
4. ✅ **Reiniciar o backend** para aplicar
5. ✅ **Verificar** que a nova versão está ativa
6. ✅ **Informar ao usuário** qual é a nova versão

---

## 📝 Processo Obrigatório

### **Passo 1: Definir Nova Versão**

```
Versão atual: 2.30.2
Tipo de alteração: Correção de bug
Nova versão: 2.30.3
```

### **Passo 2: Atualizar 4 Arquivos (CRÍTICO!)**

**❗ IMPORTANTE: São 4 lugares diferentes!**

#### **1. Backend - `/app/backend/server.py` (Linha 6091)**
```python
"version": "v2.30.3",
```

#### **2. Frontend - `/app/frontend/src/App.js` (Linha ~759)**
```javascript
const FRONTEND_VERSION = 'v2.30.3';
console.log('🚀 BUILD v2.30.3 - Descrição - ', new Date().getTime());
```

#### **3. VERSION.txt - `/app/VERSION.txt`**
```
v2.30.3
2025-12-06 14:00:00
Descrição da mudança
```

#### **4. VERSION.md - `/app/VERSION.md`**
Adicionar novo entry no início do arquivo

### **Passo 3: Atualizar VERSION.md**

Adicionar no início de `/app/VERSION.md`:

```markdown
## v2.30.3 (DD/MM/AAAA)
**[Título da Alteração]**
- ✅ Descrição da mudança 1
- ✅ Descrição da mudança 2
- 🔧 Correção de bug X

**Alterações Técnicas:**
- `arquivo.py`: Descrição técnica

**Arquivos Modificados:**
- `/app/backend/...`
- `/app/frontend/src/...`
```

### **Passo 4: Reiniciar Backend**

```bash
sudo supervisorctl restart backend
```

### **Passo 5: Verificar**

```bash
curl -s http://localhost:8001/api/health | jq '.version'
```

Deve retornar: `"2.30.3"`

### **Passo 6: Informar ao Usuário**

Na resposta final, incluir:

```markdown
✅ Versão atualizada: 2.30.2 → 2.30.3

Você pode verificar no console do navegador (F12):
- Deve aparecer: ✅ Backend Version: 2.30.3
```

---

## 🔢 Regra de Incremento

### **PATCH (x.x.+1)** - 90% dos casos
- Correções de bugs
- Ajustes menores
- Melhorias de logs
- Proteções adicionais
- **Exemplo:** 2.30.2 → 2.30.3

### **MINOR (x.+1.0)** - Funcionalidades novas
- Nova feature completa
- Novo módulo
- Nova integração
- **Exemplo:** 2.30.3 → 2.31.0

### **MAJOR (+1.0.0)** - Mudanças breaking
- Refatoração grande
- Mudança de arquitetura
- Breaking changes
- **Exemplo:** 2.31.0 → 3.0.0

**Dúvida? Use PATCH!**

---

## ❌ Erros Comuns - NÃO FAÇA

### ❌ **Erro 1: Esquecer de Versionar**
```
❌ ERRADO: Fazer alteração e finalizar sem versionar
✅ CORRETO: Sempre versionar antes de finish
```

### ❌ **Erro 2: Atualizar Só Um Local**
```
❌ ERRADO: Atualizar só linha 114 OU só linha 6091
✅ CORRETO: Atualizar AMBAS as linhas
```

### ❌ **Erro 3: Não Reiniciar**
```
❌ ERRADO: Atualizar código e não reiniciar
✅ CORRETO: SEMPRE reiniciar após versionar
```

### ❌ **Erro 4: Não Verificar**
```
❌ ERRADO: Assumir que funcionou
✅ CORRETO: SEMPRE verificar com curl
```

### ❌ **Erro 5: Esquecer VERSION.md**
```
❌ ERRADO: Versionar mas não documentar
✅ CORRETO: Sempre atualizar VERSION.md
```

---

## 🤖 Template de Resposta Final

Ao finalizar qualquer tarefa com alterações:

```markdown
## ✅ [Título da Tarefa] Concluído!

**Alterações Realizadas:**
- ✅ [descrição 1]
- ✅ [descrição 2]

**Versão Atualizada:**
- De: 2.30.2
- Para: 2.30.3

**Como Verificar:**
Abra o navegador e pressione F12. No console você verá:
```
✅ Backend Version: 2.30.3
```

**Arquivos Alterados:**
- `/app/backend/...`
- `/app/frontend/src/...`
```

---

## 🚨 Checklist Final do Agente

Antes de chamar `finish`:

- [ ] Código alterado?
- [ ] Versão incrementada em server.py (2 locais)?
- [ ] VERSION.md atualizado?
- [ ] Backend reiniciado?
- [ ] Versão verificada com curl?
- [ ] Nova versão informada ao usuário?

**Todos devem estar ✅ antes de finalizar!**

---

## 🔧 Script Rápido para Agentes (Atualiza TUDO)

```bash
# ⚠️ USE ESTE SCRIPT - Atualiza os 4 lugares necessários
NEW_VERSION="v2.30.3"
DESCRIPTION="Descrição breve da mudança"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 1. Backend
sed -i "s/\"version\": \"v[0-9.]*\"/\"version\": \"$NEW_VERSION\"/g" /app/backend/server.py

# 2. Frontend
sed -i "s/FRONTEND_VERSION = 'v[0-9.]*'/FRONTEND_VERSION = '$NEW_VERSION'/g" /app/frontend/src/App.js
sed -i "s/BUILD v[0-9.]*/BUILD $NEW_VERSION/g" /app/frontend/src/App.js

# 3. VERSION.txt
echo "$NEW_VERSION" > /app/VERSION.txt
echo "$DATE" >> /app/VERSION.txt
echo "$DESCRIPTION" >> /app/VERSION.txt

# 4. Reiniciar serviços
sudo supervisorctl restart backend frontend

# 5. Verificar
sleep 8
curl -s http://localhost:8001/api/health | jq '.version'
curl -s http://localhost:8001/api/labelview/version-check | jq '.version'

echo "✅ Versão atualizada para $NEW_VERSION em todos os lugares"
```

---

## 📱 O Que o Usuário Vai Fazer

O usuário vai:
1. ✅ Abrir o navegador
2. ✅ Pressionar F12
3. ✅ Ver a versão no console
4. ✅ Fazer deploy em produção
5. ✅ Testar

O usuário **NÃO vai**:
- ❌ Rodar comandos
- ❌ Editar código
- ❌ Atualizar versões
- ❌ Mexer em arquivos

**Tudo isso é responsabilidade do AGENTE!**

---

## 💡 Lembrete Final

**SE VOCÊ ALTEROU O CÓDIGO, VOCÊ DEVE VERSIONAR!**

Não importa quão pequena seja a alteração:
- 1 linha alterada = versionar
- 100 linhas alteradas = versionar
- Correção de typo = versionar
- Refatoração completa = versionar

**SEMPRE VERSIONE!** ⚠️

---

**Este documento é uma REGRA, não uma sugestão.**
