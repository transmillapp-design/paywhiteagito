# 🔍 Instruções para Debug da Hierarquia Labelview

## 📋 Problema Reportado
O consultor Rafael aparece para o Master mas não para a Unidade AgitoAuto (tela branca).

## 🎯 Contas em Produção
- **Master Labelview**: `labelview@transmill.com` / `demo123`
- **Unidade AgitoAuto**: `agitoautobrasil@gmail.com` / `!Ma04202011@`
- **Consultor Rafael**: `rafael.bersch@htmail.com` / `!Ma04202011@`

## 🔧 Correção Aplicada

### 1. Logs de Debug Adicionados
O endpoint `/api/labelview/consultores` agora possui logs detalhados que mostram:
- Email, user_type, is_master e ID do usuário logado
- Se o filtro hierárquico está sendo aplicado
- Qual tipo de filtro foi aplicado (Unidade, Regional ou genérico)
- Query final executada no MongoDB
- Quantos consultores foram encontrados

### 2. Como Verificar os Logs em Produção

Após fazer login com a conta da Unidade AgitoAuto e acessar a tela de consultores:

```bash
# Ver logs do backend em tempo real
tail -f /var/log/supervisor/backend.out.log | grep -E "(🔍|📋|✅|⚠️|👑)"
```

ou

```bash
# Ver os últimos 100 logs
tail -100 /var/log/supervisor/backend.out.log | grep -E "(🔍|📋|✅|⚠️)"
```

### 3. O Que Procurar nos Logs

Quando a Unidade AgitoAuto acessa a lista de consultores, você deverá ver:

```
🔍 DEBUG - Current User: email=agitoautobrasil@gmail.com, user_type=labelview_unidade, is_master=False, id=<UNIDADE_ID>
🔍 User não é master, aplicando filtro hierárquico para user_type=labelview_unidade
✅ Aplicado filtro de Unidade: $or com unidade_id e referred_by
📋 Buscando consultores - Query final: {'user_type': 'labelview_consultor', '$or': [{'unidade_id': '<UNIDADE_ID>'}, {'referred_by': '<UNIDADE_ID>'}]}
✅ Encontrados X consultores
```

## 🐛 Possíveis Problemas e Soluções

### Problema 1: user_type incorreto
**Sintoma nos logs:**
```
user_type=cliente ou user_type=None
⚠️ Aplicado filtro genérico: referred_by
```

**Solução:**
```python
# Verificar e corrigir user_type da Unidade no banco
db.users.update_one(
    {'email': 'agitoautobrasil@gmail.com'},
    {'$set': {'user_type': 'labelview_unidade'}}
)
```

### Problema 2: Consultor sem vínculo correto
**Sintoma nos logs:**
```
✅ Encontrados 0 consultores
```

**Solução:**
```python
# Verificar campos unidade_id e referred_by do consultor Rafael
consultor = db.users.find_one({'email': 'rafael.bersch@htmail.com'})
unidade = db.users.find_one({'email': 'agitoautobrasil@gmail.com'})

# Se não estiverem corretos, atualizar:
db.users.update_one(
    {'email': 'rafael.bersch@htmail.com'},
    {'$set': {
        'unidade_id': unidade['id'],
        'referred_by': unidade['id']
    }}
)
```

### Problema 3: is_labelview_master incorreto
**Sintoma nos logs:**
```
👑 User é MASTER - sem filtros hierárquicos aplicados
```
(quando deveria ser Unidade)

**Solução:**
```python
# Garantir que Unidade não tem flag de master
db.users.update_one(
    {'email': 'agitoautobrasil@gmail.com'},
    {'$set': {'is_labelview_master': False}}
)
```

## 📊 Script de Verificação Completa

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verificar_hierarquia():
    client = AsyncIOMotorClient('mongodb://localhost:27017/transmill')
    db = client.transmill
    
    # 1. Verificar Unidade
    unidade = await db.users.find_one({'email': 'agitoautobrasil@gmail.com'})
    print("UNIDADE:")
    print(f"  ID: {unidade.get('id')}")
    print(f"  user_type: {unidade.get('user_type')}")
    print(f"  is_labelview_master: {unidade.get('is_labelview_master')}")
    
    # 2. Verificar Consultor
    consultor = await db.users.find_one({'email': 'rafael.bersch@htmail.com'})
    print("\nCONSULTOR:")
    print(f"  ID: {consultor.get('id')}")
    print(f"  user_type: {consultor.get('user_type')}")
    print(f"  unidade_id: {consultor.get('unidade_id')}")
    print(f"  referred_by: {consultor.get('referred_by')}")
    
    # 3. Verificar vínculo
    print("\nVÍNCULO:")
    if consultor.get('unidade_id') == unidade.get('id'):
        print("  ✅ unidade_id correto")
    else:
        print(f"  ❌ unidade_id incorreto")
        print(f"     Esperado: {unidade.get('id')}")
        print(f"     Atual: {consultor.get('unidade_id')}")
    
    if consultor.get('referred_by') == unidade.get('id'):
        print("  ✅ referred_by correto")
    else:
        print(f"  ❌ referred_by incorreto")
        print(f"     Esperado: {unidade.get('id')}")
        print(f"     Atual: {consultor.get('referred_by')}")
    
    client.close()

asyncio.run(verificar_hierarquia())
```

## 🎯 Próximos Passos

1. **Acessar o painel com a Unidade AgitoAuto** em produção
2. **Ir até a tela de consultores**
3. **Verificar os logs do backend** conforme instruções acima
4. **Enviar os logs** para identificar o problema exato
5. **Aplicar a correção apropriada** baseada nos logs

## 📞 Informações Importantes

- Os logs agora são **muito mais detalhados**
- Cada etapa do filtro é registrada
- É possível identificar exatamente onde o problema está
- A correção pode ser aplicada diretamente no banco de dados em produção

---

**Desenvolvido para debug do sistema de hierarquia Labelview**
