# 🐛 DEBUG - IMAGENS NÃO APARECEM AO EDITAR UNIDADE

## 🎯 PROBLEMA
Após criar uma unidade com logo e documentos, ao editar, as imagens não aparecem nos campos de upload.

## 🔧 LOGS DETALHADOS ATIVADOS

Agora o backend gera logs SUPER detalhados ao criar unidade. Você verá no console:

### Ao Criar Unidade:
```
📥 Iniciando cadastro de unidade: [Nome]
🎨 Cores validadas - Primária: #..., Secundária: #...
✅ Usuário autorizado: labelview@transmill.com
🆔 ID gerado: [UUID]

📤 Upload logo: [nome_arquivo]
✅ Logo uploaded: [URL_COMPLETA]

📤 Upload contrato social: [nome_arquivo]
✅ Contrato social uploaded: [URL_COMPLETA]

📤 Upload doc CNPJ: [nome_arquivo]
✅ Doc CNPJ uploaded: [URL_COMPLETA]

📤 Upload RG frente: [nome_arquivo]
✅ RG frente uploaded: [URL_COMPLETA]

📤 Upload RG verso: [nome_arquivo]
✅ RG verso uploaded: [URL_COMPLETA]

================================================================================
📸 RESUMO DAS IMAGENS/DOCUMENTOS:
   Logo URL: https://...
   Contrato Social URL: https://...
   Doc CNPJ URL: https://...
   RG Frente URL: https://...
   RG Verso URL: https://...
================================================================================

💾 Salvando unidade no MongoDB...
✅ Unidade cadastrada com sucesso!
```

### Se Alguma Imagem NÃO For Enviada:
```
⚠️ Logo NÃO foi enviado!
⚠️ Contrato social NÃO foi enviado!
⚠️ Doc CNPJ NÃO foi enviado!
⚠️ RG frente NÃO foi enviado!
⚠️ RG verso NÃO foi enviado!
```

### Ao Listar Unidades (para Editar):
```
📸 Unidade [Nome]: logo_url=https://..., rg_front=https://..., rg_back=https://...
```

## 📋 TESTE APÓS DEPLOY

### Passo 1: Criar Nova Unidade
1. Login: labelview@transmill.com / demo123
2. Hierarquia → Nova Unidade
3. **Preencher TODOS os campos**
4. **Fazer upload de TODAS as imagens:**
   - Logo da Unidade
   - Contrato Social
   - Documento CNPJ
   - RG Frente
   - RG Verso
5. Clicar "Cadastrar Unidade"

### Passo 2: Verificar Logs
**IMPORTANTE:** Abra o console do navegador (F12) e veja se há erros.

Depois, me envie:
1. Screenshot dos logs do console
2. Mensagem de sucesso ou erro

### Passo 3: Editar a Unidade Recém-Criada
1. Hierarquia → Editar a unidade que acabou de criar
2. Verificar se as imagens aparecem

### Passo 4: Me Enviar Informações

**Se as imagens NÃO aparecerem, me envie:**

1. **Screenshot do formulário de edição** (mostrando campos vazios)

2. **Logs do backend** (executar no terminal):
```bash
# Ver logs da criação
tail -n 200 /var/log/supervisor/backend.out.log | grep -A 5 -B 5 "📸 RESUMO"

# Ver logs da listagem
tail -n 100 /var/log/supervisor/backend.out.log | grep "📸 Unidade"
```

3. **Dados direto do banco** (executar no terminal):
```bash
cd /app/backend && python3 << 'ENDSCRIPT'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path('.').absolute()
load_dotenv(ROOT_DIR / '.env')

async def check():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'agitomil')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Buscar última unidade criada
    unidade = await db.users.find_one(
        {"user_type": "labelview_unidade"},
        sort=[("created_at", -1)]
    )
    
    if unidade:
        print("📋 Última Unidade Criada:")
        print(f"   Nome: {unidade.get('nome_fantasia')}")
        print(f"   Email: {unidade.get('email')}")
        print(f"   Logo URL: {unidade.get('logo_url', 'NÃO TEM')}")
        print(f"   RG Front: {unidade.get('rg_front_url', 'NÃO TEM')}")
        print(f"   RG Back: {unidade.get('rg_back_url', 'NÃO TEM')}")
        print(f"   Contrato: {unidade.get('contrato_social_url', 'NÃO TEM')}")
        print(f"   Doc CNPJ: {unidade.get('doc_cnpj_url', 'NÃO TEM')}")
    else:
        print("❌ Nenhuma unidade encontrada")
    
    client.close()

asyncio.run(check())
ENDSCRIPT
```

## 🔍 POSSÍVEIS CAUSAS

Se as imagens não estão aparecendo, pode ser:

1. **Frontend não está enviando** → Logs mostrarão "⚠️ [arquivo] NÃO foi enviado!"
2. **Backend não está salvando** → Logs mostrarão URLs vazias
3. **Frontend não está carregando** → URLs existem no banco mas não aparecem
4. **URLs corrompidas** → URLs incompletas ou inválidas

Com os logs detalhados, vamos identificar EXATAMENTE onde está o problema!

---

**✅ Sistema com debug completo ativado!**
