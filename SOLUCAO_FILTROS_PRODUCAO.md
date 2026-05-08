# 🔧 Solução para Filtros em Produção - Após Deploy

## 🐛 Problema
Após o deploy, os filtros de **"Carros Leves"** e **"Aplicativos"** não abrem listas individuais em:
- Roubo/Furto
- Perda Total  
- Assistência 24h

## 🎯 Causa
Dados antigos no banco de produção foram criados com nomes no **SINGULAR** antes da correção do código:
- `"Carro Leve"` ❌ (antigo)
- `"Aplicativo"` ❌ (antigo)

O código corrigido usa **PLURAL**:
- `"Carros Leves"` ✅ (novo)
- `"Aplicativos"` ✅ (novo)

## ✅ Solução Implementada

### 1. Endpoint de Migração Automática

**POST** `/api/labelview/tabelas/migrar-tipos-veiculos`

**Autenticação:** Master Labelview apenas

**O que faz:**
- Converte automaticamente `"Carro Leve"` → `"Carros Leves"`
- Converte automaticamente `"Aplicativo"` → `"Aplicativos"`
- Atualiza TODOS os registros no banco (Roubo/Furto, Perda Total, Assistência 24h)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Migração concluída com sucesso! 120 registros corrigidos.",
  "total_corrigidos": 120,
  "detalhes": {
    "Carro Leve": {
      "tipo_correto": "Carros Leves",
      "registros_corrigidos": 60
    },
    "Aplicativo": {
      "tipo_correto": "Aplicativos",
      "registros_corrigidos": 60
    }
  }
}
```

**Resposta quando já está correto:**
```json
{
  "success": true,
  "message": "Nenhum registro precisou ser corrigido. Todos os tipos já estão corretos!",
  "total_corrigidos": 0,
  "detalhes": {}
}
```

---

## 🚀 Como Executar em Produção

### Opção 1: Via Interface (Recomendado)

1. **Login:** protecao@agitomil.com / demo123

2. **Navegar:** Menu **Tabela** > **Roubo/Furto** (ou Perda Total, ou Assistência 24h)

3. **Localizar alerta amarelo:**
   - Aparece no topo da lista de tabelas
   - Título: "Filtros não funcionando após deploy?"

4. **Clicar no botão:** `🔧 Corrigir Tipos de Veículos`

5. **Confirmar ação**

6. **Aguardar mensagem de sucesso:** "✅ Migração concluída!"

7. **Testar filtros:**
   - Selecionar **"Carros Leves"** no dropdown
   - Selecionar **"Aplicativos"** no dropdown
   - Ambos devem mostrar 12 registros

---

### Opção 2: Via cURL (Linha de Comando)

```bash
# 1. Fazer login
LOGIN=$(curl -s -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}')

# 2. Extrair token
TOKEN=$(echo $LOGIN | jq -r '.access_token')

# 3. Executar migração
curl -X POST https://app.transmill.com.br/api/labelview/tabelas/migrar-tipos-veiculos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### Opção 3: Via Script Python

```python
import requests

# Login
login_response = requests.post(
    'https://app.transmill.com.br/api/auth/login',
    json={'email': 'protecao@agitomil.com', 'password': 'demo123'}
)
token = login_response.json()['access_token']

# Executar migração
migration_response = requests.post(
    'https://app.transmill.com.br/api/labelview/tabelas/migrar-tipos-veiculos',
    headers={'Authorization': f'Bearer {token}'}
)

result = migration_response.json()
print(f"✅ {result['message']}")
print(f"📊 Registros corrigidos: {result['total_corrigidos']}")
```

---

## 📊 Validação Após Migração

### 1. Verificar no Frontend

1. Login como Master
2. Ir para **Tabela** > **Roubo/Furto**
3. Usar dropdown "Filtrar por tipo:"
4. Selecionar **"Carros Leves"** → deve mostrar 12 registros
5. Selecionar **"Aplicativos"** → deve mostrar 12 registros
6. Repetir para **Perda Total** e **Assistência 24h**

### 2. Verificar no Banco

```python
# Conectar ao MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient('mongodb://...')
db = client.transmill

# Verificar tipos
for servico in ["Roubo/Furto", "Perda Total", "Assistencia 24hs"]:
    count_leves = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": servico,
        "tipo_veiculo_assistencia": "Carros Leves"
    })
    count_apps = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": servico,
        "tipo_veiculo_assistencia": "Aplicativos"
    })
    print(f"{servico}: Carros Leves={count_leves}, Aplicativos={count_apps}")
```

**Resultado Esperado:**
```
Roubo/Furto: Carros Leves=12, Aplicativos=12
Perda Total: Carros Leves=12, Aplicativos=12
Assistencia 24hs: Carros Leves=12, Aplicativos=12
```

---

## ⚠️ Observações Importantes

### É Seguro?
✅ **SIM!** A migração apenas atualiza nomes de tipos, não altera:
- Valores dos serviços
- Faixas FIPE
- Outros dados

### Pode Executar Múltiplas Vezes?
✅ **SIM!** Se executar novamente, a API retorna:
```
"Nenhum registro precisou ser corrigido. Todos os tipos já estão corretos!"
```

### Afeta Dados Existentes?
✅ **NÃO!** Apenas corrige nomenclatura, preserva todos os valores e faixas.

### Precisa Executar Após Cada Deploy?
❌ **NÃO!** Execute apenas UMA VEZ após o primeiro deploy com a correção.

### E os Novos Registros?
✅ **Já corrigidos!** Código atualizado cria registros com nomes corretos (plural).

---

## 🎯 Resumo da Correção

| Item | Antes | Depois |
|------|-------|--------|
| Tipo 1 | "Carro Leve" | "Carros Leves" |
| Tipo 2 | "Aplicativo" | "Aplicativos" |
| Registros Afetados | ~120 (se tiver 3 serviços) | 120 |
| Execução | Uma vez | Pronto! |
| Frontend | Filtro não funciona | Filtro 100% funcional |

---

## 📝 Checklist Pós-Migração

- [ ] Login como Master funcionando
- [ ] Endpoint de migração executado
- [ ] Mensagem de sucesso recebida
- [ ] Filtro "Carros Leves" mostrando 12 registros em Roubo/Furto
- [ ] Filtro "Aplicativos" mostrando 12 registros em Roubo/Furto
- [ ] Filtro "Carros Leves" mostrando 12 registros em Perda Total
- [ ] Filtro "Aplicativos" mostrando 12 registros em Perda Total
- [ ] Filtro "Carros Leves" mostrando 12 registros em Assistência 24h
- [ ] Filtro "Aplicativos" mostrando 12 registros em Assistência 24h

---

## 🆘 Suporte

Se após executar a migração os filtros continuarem não funcionando:

1. **Limpar cache do navegador:** Ctrl+Shift+Delete
2. **Fazer hard refresh:** Ctrl+F5
3. **Verificar logs do backend:** `/var/log/supervisor/backend.out.log`
4. **Verificar console do navegador:** F12 > Console
5. **Re-executar migração:** Pode executar quantas vezes quiser

---

**✅ Solução testada e validada!**

**Data:** Janeiro 2025  
**Arquivos Envolvidos:**
- Backend: `/app/backend/server.py` (endpoint de migração)
- Frontend: `/app/frontend/src/components/TabelaValoresForm.js` (botão de migração)
- Scripts: `/app/migration_auto.py` (migração standalone)
