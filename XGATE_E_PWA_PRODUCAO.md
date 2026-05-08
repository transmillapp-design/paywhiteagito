# 🚀 Guia Completo: XGate em Produção e PWA

## 1️⃣ XGATE API - O QUE FALTA PARA FUNCIONAR EM PRODUÇÃO

### ✅ O QUE JÁ ESTÁ CONFIGURADO:

```env
XGATE_API_URL=https://api.xgateglobal.com
XGATE_EMAIL=marcelobersch@transmill.com.br
XGATE_PASSWORD=!Ma04202011@
XGATE_ENVIRONMENT=production
```

### ⚠️ O QUE FALTA CONFIGURAR:

#### 1. **Variável APP_URL (CRÍTICO)**

**Arquivo:** `/app/backend/.env`

**Adicionar:**
```env
APP_URL=https://agitomil.com.br
```

**Por quê?**
- O XGate precisa enviar webhooks/callbacks quando uma transação PIX é confirmada
- A URL atual está hardcoded com fallback para preview
- Linha 192 do `xgate_service.py`: `callback_url: f"{os.environ.get('APP_URL', 'https://api-decompose-1.preview.emergentagent.com')}/api/xgate/webhook"`

**Impacto:**
- ❌ Sem esta URL: Xgate envia notificações para ambiente errado
- ✅ Com esta URL: Webhooks chegam corretamente em produção

#### 2. **Webhook Endpoint**

**Status:** ✅ JÁ IMPLEMENTADO

O endpoint `/api/xgate/webhook` já existe no backend (server.py) e está pronto para receber notificações do XGate.

#### 3. **Credenciais XGate Válidas**

**Status:** ✅ CONFIGURADAS

As credenciais já estão no `.env`:
- Email: marcelobersch@transmill.com.br
- Password: !Ma04202011@
- Environment: production

**Importante:**
- Verifique com a XGate se essas credenciais estão ativas
- Teste a autenticação em produção
- Confirme se a conta tem saldo/limite para transações

#### 4. **Testes Necessários**

Após configurar `APP_URL`, teste:

**a) Autenticação XGate:**
```bash
curl -X POST https://agitomil.com.br/api/xgate/auth/test
```

**b) Criar Depósito PIX:**
```bash
# Login primeiro
curl -X POST https://agitomil.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@demo.com","password":"demo123"}'

# Usar o token para criar depósito
curl -X POST https://agitomil.com.br/api/deposits/pix \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":50.00}'
```

**c) Verificar Webhook:**
- Webhook deve chegar em: `https://agitomil.com.br/api/xgate/webhook`
- Backend deve processar e creditar valor na conta

### 📋 CHECKLIST XGATE PRODUÇÃO:

- [x] Credenciais XGate configuradas
- [x] Ambiente production configurado
- [x] Webhook endpoint implementado
- [ ] **APP_URL configurada para https://agitomil.com.br**
- [ ] Testar autenticação XGate
- [ ] Testar criar depósito PIX
- [ ] Verificar se webhook chega corretamente
- [ ] Confirmar crédito na conta do usuário

---

## 2️⃣ PWA - CONFIGURAR ÍCONE DO LOGO

### 🎯 PROBLEMA ATUAL:

O PWA está usando ícones padrão (icon-*.png) que não são o logo da AgitoCoin que você forneceu.

### ✅ SOLUÇÃO:

Você precisa converter o logo SVG (`agitocoin-icon.svg`) em imagens PNG de vários tamanhos.

#### Opção 1: Conversão Manual (Recomendado)

**Tamanhos necessários:**
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

**Passos:**

1. **Abra o logo em um editor de imagens** (Photoshop, GIMP, Figma, Canva)
2. **Exporte em cada tamanho** listado acima
3. **Salve como PNG** com fundo transparente
4. **Nomeie os arquivos:**
   - `icon-72x72.png`
   - `icon-96x96.png`
   - etc.
5. **Substitua os arquivos** em `/app/frontend/public/`

#### Opção 2: Usando Ferramenta Online

**Sites que podem ajudar:**
- https://realfavicongenerator.net/ (recomendado)
- https://www.pwabuilder.com/imageGenerator
- https://www.favicon-generator.org/

**Passos:**
1. Faça upload do SVG ou PNG do logo
2. Configure os tamanhos do PWA
3. Baixe o pacote completo
4. Substitua os arquivos em `/app/frontend/public/`

#### Opção 3: Eu Posso Gerar para Você

Se você preferir, posso:
1. Pegar o `agitocoin-icon.svg` atual
2. Converter para os tamanhos necessários usando Python/PIL
3. Substituir automaticamente os arquivos

**Comando que executarei:**
```python
from PIL import Image
import cairosvg
import io

# Converter SVG para PNG em vários tamanhos
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for size in sizes:
    # Converter SVG para PNG
    png_data = cairosvg.svg2png(url='/app/frontend/public/agitocoin-icon.svg', 
                                  output_width=size, 
                                  output_height=size)
    # Salvar
    with open(f'/app/frontend/public/icon-{size}x{size}.png', 'wb') as f:
        f.write(png_data)
```

### 📱 FAVICON TAMBÉM

Além dos ícones PWA, você também precisa do **favicon** (ícone na aba do navegador):

**Arquivos necessários:**
- `favicon.ico` (16x16 e 32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180 para iOS)

### 🔧 APÓS SUBSTITUIR OS ÍCONES:

1. **Limpar cache do navegador**
2. **Reinstalar o PWA** (remover e instalar novamente)
3. **Verificar no smartphone:**
   - Abrir https://agitomil.com.br
   - Menu → "Adicionar à tela inicial"
   - Verificar se o ícone correto aparece

### ⚙️ VERIFICAR index.html

Certifique-se de que o `index.html` está referenciando o manifest corretamente:

```html
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## 📊 RESUMO EXECUTIVO

### XGATE em Produção:

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Credenciais | ✅ | Já configuradas |
| Ambiente | ✅ | production |
| Webhook Endpoint | ✅ | Implementado |
| **APP_URL** | ❌ | **Adicionar `APP_URL=https://agitomil.com.br`** |
| Testes | ⏳ | Testar após configurar APP_URL |

### PWA Logo:

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Logo SVG | ✅ | Já existe |
| Ícones PNG | ❌ | **Converter SVG para PNG (8 tamanhos)** |
| Favicon | ❌ | **Gerar favicon.ico e apple-touch-icon.png** |
| Manifest | ✅ | Já configurado |
| index.html | ⏳ | Verificar links |

---

## 🚀 AÇÃO IMEDIATA

### Para XGate:

```bash
# Adicionar no /app/backend/.env:
echo "APP_URL=https://agitomil.com.br" >> /app/backend/.env

# Reiniciar backend
sudo supervisorctl restart backend
```

### Para PWA:

**Você prefere que:**
1. ✅ **Eu converta automaticamente o SVG para PNG** (mais rápido)
2. ⏸️ **Você mesmo converta usando ferramenta online** (mais controle)

**Se escolher opção 1, confirme e eu executo agora mesmo!**

---

## 📞 SUPORTE

Se precisar de ajuda:
- XGate: Verifique documentação em https://xgateglobal.com
- PWA: Teste com Chrome DevTools → Application → Manifest
- Ícones: Use https://realfavicongenerator.net/

---

**Última atualização:** Pré-produção AgitoCoin
**Status:** ⚠️ CONFIGURAÇÕES PENDENTES
