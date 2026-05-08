# 📊 SISTEMA DE VERSIONAMENTO AUTOMÁTICO

## 🎯 Como Funciona

Toda vez que eu (agente) fizer qualquer alteração no código, vou:

1. ✅ Atualizar o número da versão
2. ✅ Registrar a data e hora
3. ✅ Descrever o que foi alterado
4. ✅ TE INFORMAR o novo número da versão

---

## 📋 Formato da Versão

**Formato**: `vMAJOR.MINOR.PATCH`

**Exemplos**:
- `v2.1.1` → Versão 2, feature 1, correção 1
- `v2.1.2` → Versão 2, feature 1, correção 2
- `v2.2.0` → Versão 2, feature 2, nova funcionalidade

**Quando muda cada número**:
- `MAJOR` (v2 → v3): Mudança gigante no sistema
- `MINOR` (v2.1 → v2.2): Nova funcionalidade grande
- `PATCH` (v2.1.1 → v2.1.2): Correção de bug

---

## 🔍 Como Você Verifica a Versão

### Opção 1: No Painel (MAIS FÁCIL)
1. Fazer login
2. Olhar no canto inferior esquerdo da sidebar
3. Aparece um card com:
   ```
   Versão do Sistema
   v2.1.1
   ```

### Opção 2: No Console (F12)
1. Abrir console (F12)
2. Executar:
   ```javascript
   fetch('/api/labelview/version-check').then(r=>r.json()).then(console.log)
   ```

### Opção 3: Via API
```bash
curl https://app.transmill.com.br/api/labelview/version-check
```

---

## 📝 Arquivos de Controle

### `/app/VERSION.txt`
Arquivo com 3 linhas:
```
v2.1.1
2025-01-02 02:30:00
Correção erro 500 notificações
```

### `/app/CHANGELOG.md`
Histórico completo de todas as versões

### `/app/update_version.sh`
Script que eu uso para atualizar a versão

---

## 🔔 Quando Eu Atualizar a Versão

Sempre que eu fizer alguma alteração, vou te informar assim:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Nova versão disponível: v2.1.2
📅 Data: 2025-01-02 15:30:00
📝 Mudança: Correção bug no filtro de consultores

Após o deploy, verifique no painel se aparece: v2.1.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Checklist Após Deploy

1. [ ] Fazer login no sistema
2. [ ] Olhar versão no canto inferior esquerdo
3. [ ] Confirmar se a versão está correta
4. [ ] Se estiver errada → me avisar
5. [ ] Se estiver certa → testar a funcionalidade

---

## 🎯 Versão Atual

**v2.1.1** - 2025-01-02 02:30:00
- Correção erro 500 notificações
- Sistema de versionamento implementado

---

## 📚 Histórico Completo

Veja o arquivo `/app/CHANGELOG.md` para histórico completo de todas as versões.
