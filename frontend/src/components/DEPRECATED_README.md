# ⚠️ ARQUIVOS DEPRECADOS - NÃO USAR

Este diretório contém arquivos de layout ANTIGO que NÃO devem mais ser usados.

## Arquivos Deprecados:

### MerchantDashboard.js.OLD_DEPRECATED
- **Status**: DEPRECADO - NÃO USAR
- **Substituído por**: `MeuNegocio.js`
- **Motivo**: Layout antigo com tabs. O novo layout usa páginas separadas e menu dropdown.
- **Data de depreciação**: Janeiro 2025

### ClientDashboard.js (se existir)
- **Status**: DEPRECADO - NÃO USAR  
- **Substituído por**: `MinimalistHomePage.js` e páginas separadas (SacarPage, IndicarPage, etc.)
- **Motivo**: Layout antigo com tabs. O novo layout usa páginas separadas.

### ServiceProviderDashboard.js (se existir)
- **Status**: DEPRECADO - NÃO USAR
- **Substituído por**: Páginas específicas de prestador
- **Motivo**: Layout antigo com tabs.

---

## ✅ LAYOUTS OFICIAIS (USAR SEMPRE):

### Para Lojistas:
- **`MeuNegocio.js`** - Dashboard principal do lojista
- **`EquipePage.js`** - Gestão de equipe
- **`MinimalistMerchantOrders.js`** - Pedidos do lojista

### Para Clientes:
- **`MinimalistHomePage.js`** - Página inicial
- **Páginas separadas**: SacarPage, IndicarPage, DocumentosPage, etc.

### Para Masters:
- **`MinimalistMasterDashboard.js`** - Dashboard principal

---

## 🚫 REGRA IMPORTANTE:

**NUNCA MAIS PROGRAMAR EM CIMA DOS ARQUIVOS .OLD_DEPRECATED**

Se precisar adicionar funcionalidades:
1. Verificar qual é o arquivo NOVO correspondente
2. Implementar no arquivo novo
3. Se não souber qual é o novo, perguntar ao usuário

---

## Histórico:
- **Janeiro 2025**: MerchantDashboard.js depreciado e renomeado para .OLD_DEPRECATED
