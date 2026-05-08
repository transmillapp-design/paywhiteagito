# 🚀 Instruções de Deploy para AgitoCoin

## ⚠️ CONFIGURAÇÕES CRÍTICAS PARA PRODUÇÃO

### 1. Variável de Ambiente FRONTEND_URL

**Problema Identificado:**
O link de indicação não funciona na URL https://agitomil.com.br porque a variável `FRONTEND_URL` no backend está configurada com a URL de preview.

**Localização:**
- Arquivo: `/app/backend/.env`
- Linha 14: `FRONTEND_URL=https://api-decompose-1.preview.emergentagent.com`

**Correção Necessária:**
```bash
# NO ARQUIVO backend/.env, ALTERAR DE:
FRONTEND_URL=https://api-decompose-1.preview.emergentagent.com

# PARA:
FRONTEND_URL=https://agitomil.com.br
```

### 2. Impacto da Variável FRONTEND_URL

Esta variável é usada em:
- **Links de indicação/referral**: `{FRONTEND_URL}/register?ref={codigo}`
- **Mensagens WhatsApp**: Links compartilhados incluem esta URL
- **Emails de recuperação de senha**: Links de reset

### 3. Outras Variáveis de Ambiente Importantes

Verifique no arquivo `/app/backend/.env`:

```bash
# MongoDB - Geralmente já está correto no deploy
MONGO_URL=mongodb://localhost:27017/agitocoin

# URLs do Frontend
FRONTEND_URL=https://agitomil.com.br  # ← CRÍTICO PARA PRODUÇÃO

# Email (se configurado)
EMAIL_USER=seu-email@exemplo.com
EMAIL_PASS=sua-senha
EMAIL_FROM=noreply@agitomil.com.br

# Chaves de APIs externas (se houver)
# Adicione aqui qualquer chave de API necessária
```

### 4. Arquivo .env do Frontend

Verifique `/app/frontend/.env`:

```bash
# Backend URL - Geralmente configurado automaticamente no Emergent
REACT_APP_BACKEND_URL=https://agitomil.com.br
```

## 🔧 Checklist Pré-Deploy

### Backend (.env)
- [ ] `FRONTEND_URL` aponta para `https://agitomil.com.br`
- [ ] `MONGO_URL` está correto para produção
- [ ] Variáveis de email configuradas (se usar recuperação de senha)
- [ ] Chaves de APIs externas configuradas (se houver)

### Frontend (.env)
- [ ] `REACT_APP_BACKEND_URL` aponta para o backend de produção

### Após Deploy
- [ ] Testar link de indicação no app
- [ ] Compartilhar link via WhatsApp e verificar URL
- [ ] Testar cadastro usando código de referral
- [ ] Verificar se emails de recuperação usam URL correta

## 📱 Teste de Indicação Pós-Deploy

1. Faça login em https://agitomil.com.br
2. Vá para a aba "Indicar"
3. Clique em "Compartilhar no WhatsApp"
4. **VERIFIQUE:** O link deve ser `https://agitomil.com.br/register?ref=CODIGO`
5. **NÃO DEVE SER:** `https://api-decompose-1.preview.emergentagent.com/register?ref=CODIGO`

## 🐛 Troubleshooting

### Link de Indicação Ainda Aponta para Preview

**Causa:** Backend não foi reiniciado após alterar `.env`

**Solução:**
```bash
# Reiniciar backend
sudo supervisorctl restart backend

# Verificar se está rodando
sudo supervisorctl status backend

# Verificar logs se houver erro
tail -f /var/log/supervisor/backend.err.log
```

### Link de Indicação Está Vazio

**Causa:** Variável `FRONTEND_URL` não definida no `.env`

**Solução:**
1. Adicionar `FRONTEND_URL=https://agitomil.com.br` no `/app/backend/.env`
2. Reiniciar backend

## 📝 Notas Importantes

1. **NUNCA modifique MONGO_URL** - Ela é configurada automaticamente
2. **NUNCA modifique REACT_APP_BACKEND_URL no frontend** - Configurada pelo sistema
3. **SEMPRE reinicie os serviços** após alterar `.env`
4. **TESTE no smartphone real** após deploy

## ✅ Sucesso do Deploy

Se tudo estiver correto, você deve ver:
- ✅ Link de indicação: `https://agitomil.com.br/register?ref=CODIGO`
- ✅ WhatsApp compartilha link correto
- ✅ Cadastro via link funciona
- ✅ Novo usuário fica vinculado ao indicador

---

**Última atualização:** Após correção do Scanner QR Code
**Versão do Sistema:** 1.2
