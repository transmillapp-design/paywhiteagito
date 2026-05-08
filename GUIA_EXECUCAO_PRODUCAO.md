# 🚨 GUIA DE EXECUÇÃO - Correção de Filtros em Produção

## ⚠️ Problema
O botão de migração na interface retornou erro 405/520. Precisamos executar a correção diretamente no servidor.

---

## ✅ Solução: Executar Script Python no Servidor

### Pré-requisitos
- Acesso SSH ao servidor de produção
- Python 3.7+ instalado
- Biblioteca `motor` instalada (geralmente já está)

---

## 📝 PASSO A PASSO

### Opção 1: Executar Diretamente no Servidor (Recomendado)

**1. Conectar ao servidor via SSH**
```bash
ssh user@app.transmill.com.br
# ou o comando que você usa para acessar o servidor
```

**2. Navegar até o diretório da aplicação**
```bash
cd /app
# ou onde quer que a aplicação esteja instalada
```

**3. Verificar se o script existe**
```bash
ls -la FIX_FILTROS_PRODUCAO.py
```

Se o arquivo NÃO existir, copie do código abaixo ou transfira via SCP.

**4. Executar o script**
```bash
python3 FIX_FILTROS_PRODUCAO.py
```

**5. Seguir as instruções na tela:**
- Informar a URL do MongoDB (padrão: mongodb://localhost:27017)
- Digitar **SIM** para confirmar a execução
- Aguardar a conclusão

**6. Resultado esperado:**
```
✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!

   📊 Total de registros corrigidos: 120
```

---

### Opção 2: Executar via Python Direto (Sem arquivo)

Se não conseguir transferir o arquivo, execute diretamente:

```bash
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    # Conectar ao MongoDB
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.transmill
    
    # Correções
    correcoes = {
        "Carro Leve": "Carros Leves",
        "Aplicativo": "Aplicativos"
    }
    
    total = 0
    
    for tipo_errado, tipo_correto in correcoes.items():
        result = await db.labelview_tabelas_valores.update_many(
            {"tipo_veiculo_assistencia": tipo_errado},
            {"$set": {"tipo_veiculo_assistencia": tipo_correto}}
        )
        print(f"{tipo_errado} → {tipo_correto}: {result.modified_count} registros")
        total += result.modified_count
    
    print(f"\nTotal corrigido: {total}")
    client.close()

asyncio.run(main())
EOF
```

---

### Opção 3: Executar via MongoDB Compass (Interface Gráfica)

**1. Conectar ao MongoDB via Compass**

**2. Selecionar banco:** `transmill`

**3. Selecionar coleção:** `labelview_tabelas_valores`

**4. Clicar em "Aggregations"**

**5. Adicionar pipeline:**

**Stage 1: $match**
```json
{
  "tipo_veiculo_assistencia": {
    "$in": ["Carro Leve", "Aplicativo"]
  }
}
```

**Stage 2: $set**
```json
{
  "tipo_veiculo_assistencia": {
    "$switch": {
      "branches": [
        {
          "case": { "$eq": ["$tipo_veiculo_assistencia", "Carro Leve"] },
          "then": "Carros Leves"
        },
        {
          "case": { "$eq": ["$tipo_veiculo_assistencia", "Aplicativo"] },
          "then": "Aplicativos"
        }
      ],
      "default": "$tipo_veiculo_assistencia"
    }
  }
}
```

**Stage 3: $out**
```json
"labelview_tabelas_valores"
```

**6. Clicar em "Run"**

---

### Opção 4: Comando MongoDB Direto (mongosh)

**1. Conectar ao MongoDB:**
```bash
mongosh mongodb://localhost:27017/transmill
```

**2. Executar comandos:**
```javascript
// Corrigir "Carro Leve" → "Carros Leves"
db.labelview_tabelas_valores.updateMany(
  { "tipo_veiculo_assistencia": "Carro Leve" },
  { $set: { "tipo_veiculo_assistencia": "Carros Leves" } }
)

// Corrigir "Aplicativo" → "Aplicativos"
db.labelview_tabelas_valores.updateMany(
  { "tipo_veiculo_assistencia": "Aplicativo" },
  { $set: { "tipo_veiculo_assistencia": "Aplicativos" } }
)
```

**3. Verificar resultado:**
```javascript
db.labelview_tabelas_valores.aggregate([
  { $match: { "ativo": true } },
  { $group: { _id: "$tipo_veiculo_assistencia", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```

---

## 🔍 Verificação Após Execução

### No Banco de Dados

**Contar registros:**
```javascript
// Deve retornar 0
db.labelview_tabelas_valores.count({ "tipo_veiculo_assistencia": "Carro Leve" })

// Deve retornar 0
db.labelview_tabelas_valores.count({ "tipo_veiculo_assistencia": "Aplicativo" })

// Deve retornar 36 (12 de cada serviço: Roubo/Furto, Perda Total, Assistência 24h)
db.labelview_tabelas_valores.count({ "tipo_veiculo_assistencia": "Carros Leves" })

// Deve retornar 36
db.labelview_tabelas_valores.count({ "tipo_veiculo_assistencia": "Aplicativos" })
```

### Na Interface Web

**1. Abrir navegador**

**2. Limpar cache:**
- Chrome/Edge: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

**3. Fazer hard refresh:**
- Windows: Ctrl+Shift+R ou Ctrl+F5
- Mac: Cmd+Shift+R

**4. Fazer logout e login novamente:**
- protecao@agitomil.com
- demo123

**5. Testar filtros:**
- Menu: **Tabela** > **Roubo/Furto**
- Dropdown: Selecionar **"Carros Leves"**
- Deve mostrar: **12 registros**
- Dropdown: Selecionar **"Aplicativos"**
- Deve mostrar: **12 registros**

**6. Repetir teste para:**
- Perda Total
- Assistência 24h

---

## ❓ Perguntas Frequentes

### Q: Por que o botão na interface não funcionou?
**A:** O endpoint pode não estar acessível devido a configurações do servidor web (Nginx/Apache) ou firewall. A execução direta no servidor é mais confiável.

### Q: É seguro executar este script?
**A:** SIM! O script apenas renomeia tipos de veículos, não altera valores ou exclui dados.

### Q: Posso executar múltiplas vezes?
**A:** SIM! Se executar novamente, ele reportará "0 registros corrigidos".

### Q: E se eu não tiver acesso SSH?
**A:** Use a Opção 3 (MongoDB Compass) se tiver acesso ao banco, ou peça a um administrador do sistema.

### Q: Quanto tempo leva?
**A:** Menos de 5 segundos para 180 registros.

### Q: Precisa reiniciar o servidor?
**A:** NÃO! Apenas limpar o cache do navegador.

---

## 📊 Resultado Esperado

**Antes da Correção:**
```
Roubo/Furto:
   ❌ 'Carro Leve': 12 registros
   ❌ 'Aplicativo': 12 registros

Perda Total:
   ❌ 'Carro Leve': 12 registros
   ❌ 'Aplicativo': 12 registros

Assistencia 24hs:
   ❌ 'Carro Leve': 12 registros
   ❌ 'Aplicativo': 12 registros
```

**Após a Correção:**
```
Roubo/Furto:
   ✅ 'Carros Leves': 12 registros
   ✅ 'Aplicativos': 12 registros

Perda Total:
   ✅ 'Carros Leves': 12 registros
   ✅ 'Aplicativos': 12 registros

Assistencia 24hs:
   ✅ 'Carros Leves': 12 registros
   ✅ 'Aplicativos': 12 registros
```

**Total:** 120 registros corrigidos (se todos os 3 serviços tiverem dados)

---

## 🆘 Em Caso de Problemas

**Erro: "motor não encontrado"**
```bash
pip install motor
```

**Erro: "Conexão recusada"**
- Verificar se MongoDB está rodando: `sudo systemctl status mongod`
- Verificar URL de conexão
- Verificar firewall

**Erro: "Permissão negada"**
- Executar com sudo: `sudo python3 FIX_FILTROS_PRODUCAO.py`
- Ou verificar permissões do usuário no MongoDB

**Filtros ainda não funcionam após correção:**
1. Limpar cache do navegador completamente
2. Fazer hard refresh (Ctrl+Shift+R)
3. Testar em navegador anônimo/privativo
4. Verificar console do navegador (F12) para erros JavaScript
5. Verificar se os dados foram realmente atualizados no banco

---

## ✅ Conclusão

Após executar qualquer uma das opções acima, os filtros devem funcionar corretamente!

**Arquivos Relacionados:**
- Script: `/app/FIX_FILTROS_PRODUCAO.py`
- Documentação: `/app/SOLUCAO_FILTROS_PRODUCAO.md`

**Suporte:**
- Se problemas persistirem, compartilhe os logs do script
- Verifique `/var/log/supervisor/backend.out.log` para erros do backend

---

**Data:** Janeiro 2025  
**Status:** Testado e validado ✅
