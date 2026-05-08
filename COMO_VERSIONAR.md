# 📋 Sistema de Versionamento - Transmill API

## 🎯 Versão Atual: **2.30.2**

---

## ✅ Como Verificar a Versão

### 1️⃣ **Console do Navegador (Recomendado)**

Ao abrir a aplicação no navegador, a versão é automaticamente exibida no console:

```
🚀 Transmill API
Verificando versão do sistema...
✅ Backend Version: 2.30.2
📅 Timestamp: 06/12/2024 10:45:23
💾 Database: connected
```

Você também pode verificar manualmente:
```javascript
// Versão salva globalmente
console.log(window.TRANSMILL_VERSION);

// Ou via localStorage
console.log(localStorage.getItem('transmill-backend-version'));

// Ou fazer nova requisição
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('Versão:', d.version));
```

### 2️⃣ **Via API Health Check**

```bash
curl http://localhost:8001/api/health | jq '.version'
# Produção:
curl https://app.transmill.com.br/api/health | jq '.version'
```

### 3️⃣ **Via Logs do Backend**

```bash
tail -f /var/log/supervisor/backend.out.log | grep version
```

---

## 🔄 Como Incrementar a Versão

### **Regra de Versionamento (Semantic Versioning)**

```
MAJOR.MINOR.PATCH (ex: 2.30.2)

MAJOR (2.x.x): Mudanças breaking, refatoração grande
MINOR (x.30.x): Novas funcionalidades, melhorias significativas  
PATCH (x.x.2): Correções de bugs, ajustes menores
```

### **Quando Incrementar:**

- ✅ **Toda alteração no código backend ou frontend**
- ✅ **Correção de bugs**
- ✅ **Novas funcionalidades**
- ✅ **Melhorias de performance**
- ✅ **Ajustes de segurança**

---

## 📝 Processo de Atualização

### **Passo 1: Definir Nova Versão**

Exemplo: de `2.30.2` → `2.30.3` (correção de bug)

### **Passo 2: Atualizar Arquivos (4 lugares)**

#### **1. Backend - `/app/backend/server.py`**

Linha 6091 (dentro do health_check):
```python
"version": "v2.30.3",
```

#### **2. Frontend - `/app/frontend/src/App.js`**

Duas linhas (por volta da linha 759):
```javascript
const FRONTEND_VERSION = 'v2.30.3';
console.log('🚀 BUILD v2.30.3 - Descrição da mudança - ', new Date().getTime());
```

#### **3. Arquivo VERSION.txt - `/app/VERSION.txt`**

```
v2.30.3
2025-12-06 14:00:00
Descrição breve da mudança | Detalhes | Sistema estável
```

#### **Script Automático (Atualiza TODOS os 4 lugares):**

```bash
NEW_VERSION="v2.30.3"
DESCRIPTION="Descrição da mudança"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 1. Backend server.py
sed -i "s/\"version\": \"v[0-9.]*\"/\"version\": \"$NEW_VERSION\"/g" /app/backend/server.py

# 2. Frontend App.js
sed -i "s/FRONTEND_VERSION = 'v[0-9.]*'/FRONTEND_VERSION = '$NEW_VERSION'/g" /app/frontend/src/App.js
sed -i "s/BUILD v[0-9.]*/BUILD $NEW_VERSION/g" /app/frontend/src/App.js

# 3. VERSION.txt
echo "$NEW_VERSION" > /app/VERSION.txt
echo "$DATE" >> /app/VERSION.txt
echo "$DESCRIPTION" >> /app/VERSION.txt

echo "✅ Todos os arquivos atualizados para $NEW_VERSION"
```

### **Passo 3: Atualizar Histórico**

Adicionar entrada no `/app/VERSION.md`:

```markdown
## v2.30.3 (06/12/2024)
**Descrição das Mudanças**
- ✅ Correção de bug X
- ✅ Melhoria Y
- 🔧 Ajuste Z

**Arquivos Modificados:**
- `/app/backend/routes/...`
- `/app/frontend/src/components/...`
```

### **Passo 4: Reiniciar Serviços**

```bash
sudo supervisorctl restart backend
# Se houver mudanças no frontend:
sudo supervisorctl restart frontend
```

### **Passo 5: Verificar**

```bash
# Backend
curl http://localhost:8001/api/health | jq '.version'

# Produção (após deploy)
curl https://app.transmill.com.br/api/health | jq '.version'
```

---

## 🚀 Script Completo de Atualização

Salve como `/app/scripts/update-version.sh`:

```bash
#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo "❌ Uso: ./update-version.sh <nova_versão>"
    echo "   Exemplo: ./update-version.sh 2.30.3"
    exit 1
fi

NEW_VERSION=$1
CURRENT_VERSION=$(grep -oP 'version="\K[^"]+' /app/backend/server.py | head -1)

echo -e "${BLUE}📋 Versão atual: $CURRENT_VERSION${NC}"
echo -e "${BLUE}🎯 Nova versão: $NEW_VERSION${NC}"
echo ""

# Confirmar
read -p "Confirma atualização? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# Atualizar server.py
cd /app/backend
sed -i "s/version=\"[0-9.]*\"/version=\"$NEW_VERSION\"/g" server.py
echo -e "${GREEN}✅ server.py atualizado${NC}"

# Reiniciar backend
sudo supervisorctl restart backend
echo -e "${GREEN}✅ Backend reiniciado${NC}"

# Aguardar e verificar
sleep 5
DEPLOYED_VERSION=$(curl -s http://localhost:8001/api/health | jq -r '.version')

if [ "$DEPLOYED_VERSION" == "$NEW_VERSION" ]; then
    echo -e "${GREEN}✅ Versão $NEW_VERSION implantada com sucesso!${NC}"
else
    echo -e "❌ Erro: Versão implantada ($DEPLOYED_VERSION) diferente da esperada ($NEW_VERSION)"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Não esqueça de:${NC}"
echo "   1. Atualizar /app/VERSION.md com as mudanças"
echo "   2. Verificar no console do navegador"
echo "   3. Fazer commit das alterações"
```

Tornar executável:
```bash
chmod +x /app/scripts/update-version.sh
```

Usar:
```bash
/app/scripts/update-version.sh 2.30.3
```

---

## 📊 Histórico de Versões

Veja o arquivo `/app/VERSION.md` para o histórico completo.

---

## ⚠️ Importante

1. **SEMPRE atualize a versão após mudanças no código**
2. **Verifique no console do navegador se a versão está correta**
3. **Mantenha o VERSION.md atualizado**
4. **Em produção, verifique a versão após deploy**

---

## 🔍 Troubleshooting

**Versão não atualiza no navegador:**
- Limpar cache: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
- Fechar e reabrir o navegador
- Verificar se o backend foi reiniciado

**Versão diferente entre health e console:**
- Verificar se ambas as linhas do server.py foram atualizadas
- Reiniciar o backend novamente
- Verificar logs: `tail -f /var/log/supervisor/backend.err.log`

**Script não funciona:**
```bash
# Verificar sintaxe
bash -n /app/scripts/update-version.sh

# Executar com debug
bash -x /app/scripts/update-version.sh 2.30.3
```

---

**Última atualização:** 06/12/2024
**Versão do documento:** 1.0
