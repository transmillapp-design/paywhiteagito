# 🐛 DEBUG - BOTÃO CADASTRAR UNIDADE NÃO FUNCIONA

## ✅ O QUE FOI FEITO

Adicionei logs detalhados no console do navegador para identificar onde está travando.

## 🧪 COMO TESTAR APÓS O DEPLOY

1. **Fazer o deploy**

2. **Abrir o sistema:**
   - URL: https://app.transmill.com.br
   - Login: labelview@transmill.com / demo123

3. **Abrir o console do navegador:**
   - Apertar F12
   - Ir na aba "Console"

4. **Tentar cadastrar uma unidade:**
   - Ir em: Hierarquia → Unidades → Nova Unidade
   - Preencher TODOS os campos obrigatórios
   - Clicar em "Cadastrar Unidade"

5. **Verificar os logs no console:**

Os logs vão mostrar EXATAMENTE onde está o problema:

```javascript
// Logs que você vai ver:
🚀 INICIANDO CADASTRO DE UNIDADE
📋 FormData atual: {...}  // Mostra todos os dados
📊 Campos faltando: 0 []  // Se estiver vazio = OK
✅ Validação de campos obrigatórios passou
✅ Todas as validações passaram - Iniciando envio...
🔄 Definindo loading=true
🔑 Token recuperado: OK
📦 Criando FormData para envio...
```

## 🔍 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: Logo Faltando
```
⚠️ Logo não fornecido - campo obrigatório
❌ VALIDAÇÃO FALHOU - Campos obrigatórios faltando: ["Logo da Unidade"]
```

**Solução:** Upload do logo antes de cadastrar

### Problema 2: Token Expirado
```
❌ Token não encontrado - usuário não autenticado
```

**Solução:** Fazer login novamente

### Problema 3: Erro no Backend
```
❌ Erro ao cadastrar unidade: {...}
```

**Solução:** Ver detalhes do erro e avisar

## 📋 ME ENVIE ESTES LOGS

Quando testar, me envie:

1. **Screenshot do console** com todos os logs
2. **Mensagem de erro** (se aparecer alguma)
3. **Quais campos foram preenchidos**

Com isso vou identificar o problema exato!

---

**✅ Sistema com logs de debug ativados e pronto para investigação!**
