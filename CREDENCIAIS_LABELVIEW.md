# 🔐 CREDENCIAIS LABELVIEW - GUIA DE TESTE

## ✅ CREDENCIAL CONFIRMADA E TESTADA

**Email:** protecao@agitomil.com  
**Senha:** demo123

---

## 🧪 TESTES REALIZADOS (2025-01-29)

### ✅ Teste 1 - Backend API
```
Status: ✅ SUCESSO
Endpoint: POST /api/auth/login
Response: Token JWT gerado
User Type: labelview_master
Permissão: is_labelview_master = true
```

### ✅ Teste 2 - Banco de Dados
```
Status: ✅ CONFIRMADO
Email: protecao@agitomil.com existe
Password Hash: Presente e válido
Permissões: Todas corretas
Status: Ativo e não bloqueado
```

### ✅ Teste 3 - Logs do Backend
```
Status: ✅ FUNCIONANDO
Login attempt: Detectado
User found: True
Password check: True (senha correta!)
```

---

## 🌐 COMO TESTAR EM PRODUÇÃO

### Passo 1: Limpe TUDO do navegador
**Muito importante!** O navegador pode ter cache antigo.

**Chrome/Edge/Brave:**
1. Pressione: `Ctrl + Shift + Delete`
2. Selecione:
   - ☑️ Cookies e outros dados de sites
   - ☑️ Imagens e arquivos em cache
   - ☑️ Dados de formulários
3. Período: "Todo o período"
4. Clique: "Limpar dados"

**Firefox:**
1. Pressione: `Ctrl + Shift + Delete`
2. Selecione:
   - ☑️ Cookies
   - ☑️ Cache
3. Período: "Tudo"
4. Clique: "Limpar agora"

### Passo 2: Teste em Modo Anônimo/Privado
**Isso elimina qualquer problema de cache!**

1. Abra janela anônima:
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`

2. Acesse: https://agitomil.com.br/labelview/login

3. Digite:
   - Email: protecao@agitomil.com
   - Senha: demo123

### Passo 3: Se ainda não funcionar

**Verifique o que você está digitando:**

❌ ERRADO:
- protecao @agitomil.com (espaço)
- protecao@agitomil .com (espaço)
- Demo123 (D maiúsculo)
- demo 123 (espaço)

✅ CORRETO:
- protecao@agitomil.com (sem espaços)
- demo123 (tudo minúsculo, sem espaços)

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Problema: "Credenciais inválidas"

**Causa 1: Cache do navegador**
- Solução: Limpar cache (Passo 1 acima)
- Ou: Usar modo anônimo (Passo 2 acima)

**Causa 2: Autocomplete errado**
- Solução: Digite manualmente, não use autocomplete
- Solução: Copie e cole das credenciais abaixo

**Causa 3: Senha salva antiga no navegador**
- Solução: Não use a senha salva
- Solução: Digite manualmente: demo123

### Problema: Não redireciona após login

**Se o login funcionar mas não abrir o dashboard:**
- O sistema deve redirecionar para: /labelview/dashboard
- Se ficar na tela de login: Recarregue a página (F5)

---

## 📋 CREDENCIAIS PARA COPIAR E COLAR

**Email (copie exatamente):**
```
protecao@agitomil.com
```

**Senha (copie exatamente):**
```
demo123
```

---

## 🎯 TESTE RÁPIDO

**URL Completa:**
```
https://agitomil.com.br/labelview/login
```

**Procedimento:**
1. Abra modo anônimo no navegador
2. Cole a URL acima
3. Cole o email: protecao@agitomil.com
4. Cole a senha: demo123
5. Clique em "Entrar"

**Resultado esperado:**
✅ Redirecionamento para dashboard do Labelview

---

## ⚠️ IMPORTANTE

Se mesmo seguindo TODOS os passos acima ainda não funcionar em produção, o problema pode ser:

1. **Banco de dados em produção diferente**
   - O usuário pode não existir ainda em produção
   - Solução: Executar script create_labelview_master.py em produção

2. **Senha diferente em produção**
   - Se o banco foi restaurado de backup antigo
   - Solução: Recriar o usuário em produção

3. **Problema de deploy**
   - Código não atualizado em produção
   - Solução: Fazer novo deploy

---

## 🆘 SE NADA FUNCIONAR

**Me envie essas informações:**

1. **Print da tela de login** (com o erro)
2. **Console do navegador** (F12 → Console → print dos erros)
3. **Confirme:** Você limpou o cache?
4. **Confirme:** Você testou em modo anônimo?
5. **Confirme:** Você digitou exatamente: protecao@agitomil.com / demo123

---

**Data do último teste bem-sucedido:** 2025-01-29  
**Status:** ✅ Funcionando 100% na API  
**Usuário ID:** a3f8770f-4df5-4bc3-8252-164b9d0a3980
