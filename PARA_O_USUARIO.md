# 📋 Guia Rápido - Verificação de Versão

## 🎯 Versão Atual: **2.30.2**

---

## ✅ Como Você Verifica se a Versão Foi Atualizada

### **Método 1: Console do Navegador (Mais Fácil)**

1. Abra a aplicação no navegador
2. Pressione **F12** (ou botão direito → Inspecionar)
3. Vá na aba **Console**
4. Você verá automaticamente:

```
🚀 Transmill API
✅ Backend Version: 2.30.2
📅 Timestamp: 06/12/2024 10:45:23
💾 Database: connected
```

**A versão aparece automaticamente quando você abre a página!**

---

### **Método 2: Verificar Manualmente no Console**

Se não aparecer automaticamente, digite no console:

```javascript
window.TRANSMILL_VERSION
```

Ou:

```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log('Versão:', d.version))
```

---

## ⚠️ Importante para Você

### **Você NÃO precisa atualizar a versão!**

✅ O **agente IA** sempre atualizará a versão automaticamente quando fizer qualquer alteração no código

✅ Você apenas precisa:
1. Verificar no console se a versão mudou
2. Fazer o deploy
3. Testar as funcionalidades

---

## 🔍 Quando Verificar a Versão

- ✅ **Após o agente fazer uma alteração** - para confirmar que foi versionado
- ✅ **Após fazer deploy em produção** - para garantir que a versão correta subiu
- ✅ **Ao reportar bugs** - para informar em qual versão o problema ocorreu

---

## 📱 Exemplo Prático

**Situação:** O agente corrigiu um bug na hierarquia Labelview

**O que você faz:**

1. **Abrir o navegador** (desenvolvimento ou produção)
2. **Pressionar F12** e olhar o console
3. **Verificar:** `✅ Backend Version: 2.30.2`
4. **Anotar** a versão (se precisar reportar algo)
5. **Testar** as funcionalidades corrigidas

**Se a versão não mudou:** Avisar o agente para versionar!

---

## 🚀 Checklist Pós-Alteração

Após o agente fazer qualquer alteração:

- [ ] Verificar versão no console (deve ter mudado)
- [ ] Fazer deploy em produção
- [ ] Verificar versão em produção (deve ser a mesma)
- [ ] Testar funcionalidades alteradas
- [ ] Reportar se algo não está funcionando (com a versão)

---

## 🐛 Ao Reportar Bugs

Sempre inclua a versão:

```
BUG: Consultor não aparece para a Unidade
Versão: 2.30.2
Ambiente: Produção
```

Isso ajuda o agente a saber exatamente qual código está rodando.

---

## ❓ FAQ

**P: A versão não aparece no console, o que fazer?**
R: Limpe o cache (Ctrl+Shift+R) e recarregue a página

**P: A versão está diferente entre desenvolvimento e produção?**
R: Normal! Produção pode estar em uma versão anterior. Basta fazer o deploy.

**P: Preciso rodar algum comando para atualizar a versão?**
R: NÃO! O agente faz tudo automaticamente.

**P: Como sei se o agente esqueceu de versionar?**
R: Se ele fez alterações no código e a versão não mudou, é só avisar: "Por favor, versione a alteração"

---

## 📞 Comunicação com o Agente

### ✅ Bom:
- "A versão atual é 2.30.2"
- "Versão verificada, posso fazer deploy"
- "Bug na versão 2.30.2"

### ❌ Evite:
- ~~"Como atualizo a versão?"~~ (você não precisa)
- ~~"Qual comando rodo para versionar?"~~ (o agente faz)
- ~~"Preciso mexer no código?"~~ (não!)

---

**Resumo:** Você só VERIFICA a versão no console, não precisa fazer nada técnico! 👍
