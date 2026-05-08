# ⚠️ CONFIGURAÇÃO CRÍTICA: URL DE PRODUÇÃO

## 🎯 Problema Identificado

O **link de indicação não funciona** na URL https://agitomil.com.br porque o backend está usando a URL de preview do Emergent.

## 🔧 Solução

### Opção 1: Configurar via Variável de Ambiente no Deploy (RECOMENDADO)

No momento do deploy no Emergent ou servidor de produção, configure a variável de ambiente:

```bash
FRONTEND_URL=https://agitomil.com.br
```

Isso substituirá o valor do arquivo `.env` automaticamente.

### Opção 2: Editar o arquivo .env antes do deploy

**Arquivo:** `/app/backend/.env` (Linha 14)

**Antes:**
```
FRONTEND_URL=https://api-decompose-1.preview.emergentagent.com
```

**Depois:**
```
FRONTEND_URL=https://agitomil.com.br
```

## 📍 Onde Esta URL é Usada

### 1. Link de Indicação (Referral Link)
```
https://agitomil.com.br/register?ref=Z9AAVSIM
```

### 2. Mensagem WhatsApp
```
🎉 João está te indicando para fazer parte da AgitoCoin!
💰 Use meu código: Z9AAVSIM
👉 Link: https://agitomil.com.br/register?ref=Z9AAVSIM
```

### 3. Emails de Recuperação de Senha (se implementado)
```
https://agitomil.com.br/reset-password?token=abc123
```

## ✅ Como Verificar se Está Funcionando

### 1. Via API (Backend)
```bash
curl -X GET "https://agitomil.com.br/api/referral/my-code" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta Esperada:**
```json
{
  "referral_code": "Z9AAVSIM",
  "referral_link": "https://agitomil.com.br/register?ref=Z9AAVSIM",
  "whatsapp_link": "https://wa.me/?text=🎉..."
}
```

**❌ Resposta Incorreta (indica que FRONTEND_URL está errada):**
```json
{
  "referral_link": "https://api-decompose-1.preview.emergentagent.com/register?ref=Z9AAVSIM"
}
```

### 2. Via Interface (Smartphone)

1. Login em https://agitomil.com.br
2. Ir para aba "Indicar"
3. Ver o link exibido
4. Clicar em "Compartilhar no WhatsApp"
5. **Verificar:** URL no WhatsApp deve ser `https://agitomil.com.br/register?ref=...`

## 🔄 Reiniciar Serviços Após Alteração

Se você alterar o `.env` manualmente, precisa reiniciar o backend:

```bash
# Reiniciar backend
sudo supervisorctl restart backend

# Verificar status
sudo supervisorctl status backend

# Ver logs se houver problema
tail -f /var/log/supervisor/backend.err.log
```

## 🚨 IMPORTANTE

1. **NÃO use `localhost`** em produção
2. **NÃO use `preview.emergentagent.com`** em produção
3. **USE SEMPRE** a URL real: `https://agitomil.com.br`
4. **TESTE** após deploy fazendo um compartilhamento de link

## 📱 Teste Completo no Smartphone

Após configurar corretamente:

1. ✅ Acesse https://agitomil.com.br no smartphone
2. ✅ Faça login
3. ✅ Vá em "Indicar"
4. ✅ Compartilhe no WhatsApp
5. ✅ Abra o link compartilhado
6. ✅ Deve abrir https://agitomil.com.br/register?ref=CODIGO
7. ✅ Complete o cadastro
8. ✅ Verifique se o novo usuário está vinculado ao indicador

## 💡 Dica para Deploy no Emergent

Se estiver usando deploy nativo do Emergent, configure a variável de ambiente na interface:

1. Acesse configurações do projeto
2. Vá em "Environment Variables"
3. Adicione:
   - **Nome:** `FRONTEND_URL`
   - **Valor:** `https://agitomil.com.br`
4. Faça o deploy
5. O sistema usará automaticamente esta URL

---

**Prioridade:** 🔴 CRÍTICA
**Impacto:** Alto - Afeta sistema de indicação
**Status:** ⚠️ Requer configuração no deploy
