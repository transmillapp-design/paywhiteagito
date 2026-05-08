# Histórico de Versões - Transmill API

## v2.30.2 (06/12/2024)
**Correções de Hierarquia Labelview**
- ✅ Adicionados logs detalhados de debug no endpoint `/api/labelview/consultores`
- ✅ Cadastradas contas de produção no ambiente de desenvolvimento:
  - Master Labelview: `labelview@transmill.com`
  - Unidade AgitoAuto: `agitoautobrasil@gmail.com`
  - Consultor Rafael: `rafael.bersch@htmail.com`
- ✅ Proteções adicionadas no frontend para evitar tela branca
- ✅ Instalada dependência `pypng` para suporte a QR codes
- 🔍 Logs mostram: user_type, is_master, query executada e consultores encontrados
- 📋 Arquivo de instruções de debug criado: `/app/INSTRUCOES_DEBUG_HIERARQUIA.md`

**Alterações Técnicas:**
- `routes/labelview.py`: Logs de debug no GET `/consultores` (linhas 1917-1943)
- `frontend/MasterLabelviewDashboard.js`: Proteções em `fetchConsultores`
- `server.py`: Versão atualizada de 2.30.1 → 2.30.2

**Arquivos Modificados:**
- `/app/backend/routes/labelview.py`
- `/app/backend/server.py`
- `/app/frontend/src/components/MasterLabelviewDashboard.js`

---

## v2.30.1 (anterior)
- Versão base do sistema

---

## Como Verificar a Versão

### 1. Via API Health Check
```bash
curl http://localhost:8001/api/health
```

Resposta:
```json
{
  "status": "healthy",
  "service": "Transmill API",
  "version": "2.30.2",
  "timestamp": "2024-12-06T...",
  "database": "connected"
}
```

### 2. Via Console do Navegador (Frontend)
Abra o DevTools (F12) e digite:
```javascript
// Verificar versão do backend
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('🔢 Versão Backend:', d.version));
```

### 3. Via Logs do Backend
```bash
tail -f /var/log/supervisor/backend.out.log | grep version
```

---

## Processo de Versionamento

### Quando Incrementar a Versão:
- **PATCH (x.x.X)**: Correções de bugs, ajustes menores
- **MINOR (x.X.0)**: Novas funcionalidades, melhorias
- **MAJOR (X.0.0)**: Mudanças breaking, refatoração grande

### Onde Atualizar:
1. `/app/backend/server.py` linha 114: `FastAPI(version="X.X.X")`
2. `/app/backend/server.py` linha 6091: `"version": "X.X.X"`
3. `/app/VERSION.md`: Adicionar entrada com changelog

### Comando de Atualização Rápida:
```bash
cd /app/backend && \
NEW_VERSION="2.30.3" && \
sed -i "s/version=\"[0-9.]*\"/version=\"$NEW_VERSION\"/g" server.py && \
echo "✅ Versão atualizada para $NEW_VERSION"
```

---

## Verificação Pós-Deploy

Após fazer deploy em produção, verificar:
```bash
# Em produção
curl https://app.transmill.com.br/api/health | jq '.version'

# Deve retornar a versão esperada
```
