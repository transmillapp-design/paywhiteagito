# ☁️ CONFIGURAÇÃO CLOUDINARY - SOLUÇÃO DEFINITIVA

## 🎯 POR QUE CLOUDINARY?

O Emergent usa containers Docker onde arquivos salvos localmente são **perdidos ao reiniciar**.
Cloudinary é um serviço de armazenamento em nuvem **GRATUITO** e **PERSISTENTE**.

## 📋 PASSOS PARA CONFIGURAR

### 1. Criar Conta no Cloudinary

✅ Já criada em: https://cloudinary.com

### 2. Obter Credenciais

Após fazer login no Cloudinary:
1. Ir para Dashboard
2. Você verá 3 informações importantes:

```
Cloud Name: xxxxxxxxx
API Key: xxxxxxxxxxxxxxxxx
API Secret: xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Configurar no Backend

**Adicionar no arquivo `/app/backend/.env`:**

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=seu_api_secret_aqui
```

**IMPORTANTE:** Substituir pelos valores reais do seu Dashboard Cloudinary

### 4. Reiniciar o Backend

```bash
sudo supervisorctl restart backend
```

## ✅ COMO VAI FUNCIONAR

**ANTES (Local - não funciona em produção):**
```
Upload → /app/backend/uploads/... → 404 ao reiniciar container
```

**DEPOIS (Cloudinary - funciona sempre):**
```
Upload → Cloudinary → URL permanente: https://res.cloudinary.com/seu-cloud/...
```

**Vantagens:**
- ✅ Arquivos persistem mesmo após reiniciar/fazer deploy
- ✅ URLs sempre funcionam
- ✅ CDN global (carregamento rápido)
- ✅ Gratuito até 25GB de armazenamento
- ✅ Backup automático
- ✅ Redimensionamento automático de imagens

## 🧪 TESTE

Após configurar e reiniciar:

1. **Criar nova unidade** com imagens
2. **Verificar console:**
   - Deve aparecer: `☁️ Upload concluído! URL: https://res.cloudinary.com/...`
3. **Editar unidade:**
   - ✅ Imagens DEVEM APARECER
   - ✅ SEM erros 404
4. **Fazer deploy novamente:**
   - ✅ Imagens CONTINUAM APARECENDO (não são perdidas)

## 📊 FORMATO DAS URLs

**Antes:** `/uploads/labelview/unidades/{id}/logo_...`
**Depois:** `https://res.cloudinary.com/seu-cloud/image/upload/transmill/labelview/unidades/{id}/logo_...`

## ⚠️ IMPORTANTE

- Plano gratuito: 25GB armazenamento + 25GB bandwidth/mês
- URLs são públicas (não precisa autenticação para ver)
- Arquivos organizados em: `transmill/labelview/unidades/{id}/`

## 🆘 SE DER ERRO

**Erro: "Must supply api_key"**
→ Verificar se as variáveis de ambiente estão corretas no `.env`

**Erro: "Invalid cloud_name"**
→ Cloud Name está errado, verificar no Dashboard

**Erro 401:**
→ API Key ou API Secret estão errados

---

**Com Cloudinary configurado, o problema de upload estará RESOLVIDO 100%!** 🚀
