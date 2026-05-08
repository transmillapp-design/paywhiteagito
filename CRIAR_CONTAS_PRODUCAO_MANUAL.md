# 🔧 INSTRUÇÕES: Criar Contas Labelview em Produção (Manual)

## ⚠️ IMPORTANTE
O banco de dados local e de produção são DIFERENTES. As contas precisam ser criadas diretamente no servidor de produção.

---

## 📋 3 Contas que Precisam Ser Criadas

1. **Unidade**: agitoauto@agitomil.com / demo123
2. **Regional**: regional@agitomil.com / demo123
3. **Consultor**: rafael@agitomil.com / demo123

---

## 🚀 OPÇÃO 1: Via Script Python (Recomendado)

### Passo 1: Conectar ao servidor de produção via SSH
```bash
ssh usuario@servidor-producao
```

### Passo 2: Navegar para o diretório da aplicação
```bash
cd /app
```

### Passo 3: Executar o script
```bash
python3 fix_labelview_hierarchy_accounts.py
```

---

## 🗄️ OPÇÃO 2: Via MongoDB Shell Direto

### Passo 1: Conectar ao MongoDB de produção
```bash
mongosh mongodb://localhost:27017/agitomil
# Ou se tiver autenticação:
# mongosh "mongodb://usuario:senha@host:porta/agitomil"
```

### Passo 2: Copiar e colar o script abaixo

```javascript
// Usar o banco de dados correto
use agitomil

// Hash bcrypt da senha "demo123"
const passwordHash = "$2b$12$7oPmfgjI3pEkEr7fGtnEt.6YXZjYJjQBzC8qKZGZZZZZZZZZZZZ"

// IMPORTANTE: Gerar novo hash no servidor de produção com:
// python3 -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); print(pwd_context.hash('demo123'))"

// Função para criar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 1. CONTA UNIDADE
db.users.updateOne(
  { email: "agitoauto@agitomil.com" },
  {
    $set: {
      password_hash: passwordHash,
      full_name: "AgitoAuto Unidade",
      user_type: "labelview_unidade",
      phone: "(11) 94444-4444",
      document: "12.345.678/0001-90",
      is_active: true,
      is_blocked: false,
      balance: 0,
      cashback_balance: 0,
      usdt_balance: 0,
      social_points: 0,
      updated_at: new Date().toISOString()
    },
    $setOnInsert: {
      id: generateUUID(),
      created_at: new Date().toISOString(),
      referral_code: "AGITOAUTO",
      is_verified: true
    }
  },
  { upsert: true }
)
print("✅ Conta Unidade criada/atualizada")

// 2. CONTA REGIONAL
db.users.updateOne(
  { email: "regional@agitomil.com" },
  {
    $set: {
      password_hash: passwordHash,
      full_name: "Regional Sul",
      user_type: "labelview_regional",
      phone: "(11) 93333-3333",
      is_active: true,
      is_blocked: false,
      balance: 0,
      cashback_balance: 0,
      usdt_balance: 0,
      social_points: 0,
      updated_at: new Date().toISOString()
    },
    $setOnInsert: {
      id: generateUUID(),
      created_at: new Date().toISOString(),
      referral_code: "REGIONAL",
      is_verified: true
    }
  },
  { upsert: true }
)
print("✅ Conta Regional criada/atualizada")

// 3. CONTA CONSULTOR
db.users.updateOne(
  { email: "rafael@agitomil.com" },
  {
    $set: {
      password_hash: passwordHash,
      full_name: "Rafael Consultor",
      user_type: "labelview_consultor",
      phone: "(11) 92222-2222",
      is_active: true,
      is_blocked: false,
      balance: 0,
      cashback_balance: 0,
      usdt_balance: 0,
      social_points: 0,
      updated_at: new Date().toISOString()
    },
    $setOnInsert: {
      id: generateUUID(),
      created_at: new Date().toISOString(),
      referral_code: "RAFAEL",
      is_verified: true
    }
  },
  { upsert: true }
)
print("✅ Conta Consultor criada/atualizada")

// Verificar
print("\n📋 VERIFICANDO CONTAS CRIADAS:")
db.users.find(
  { email: { $in: ["agitoauto@agitomil.com", "regional@agitomil.com", "rafael@agitomil.com"] } },
  { email: 1, user_type: 1, is_active: 1 }
).forEach(u => {
  print(`✅ ${u.email} - ${u.user_type} - ${u.is_active ? 'Ativa' : 'Inativa'}`)
})
```

---

## 🧪 OPÇÃO 3: Via API REST (Backend)

### Criar endpoint temporário no backend para criar contas

Adicione este endpoint em `backend/server.py`:

```python
@app.post("/api/admin/create-labelview-accounts")
async def create_labelview_accounts(
    request: Request,
    admin_secret: str = Header(...)
):
    """Endpoint temporário para criar contas Labelview em produção"""
    
    # Validar segredo (use uma senha forte)
    if admin_secret != "SUA_SENHA_ADMIN_FORTE_AQUI":
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    from passlib.context import CryptContext
    import uuid
    from datetime import datetime
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("demo123")
    
    accounts = [
        {
            "email": "agitoauto@agitomil.com",
            "full_name": "AgitoAuto Unidade",
            "user_type": "labelview_unidade",
            "phone": "(11) 94444-4444",
            "document": "12.345.678/0001-90",
        },
        {
            "email": "regional@agitomil.com",
            "full_name": "Regional Sul",
            "user_type": "labelview_regional",
            "phone": "(11) 93333-3333",
        },
        {
            "email": "rafael@agitomil.com",
            "full_name": "Rafael Consultor",
            "user_type": "labelview_consultor",
            "phone": "(11) 92222-2222",
        },
    ]
    
    results = []
    
    for account in accounts:
        existing = await db.users.find_one({"email": account["email"]})
        
        if existing:
            await db.users.update_one(
                {"email": account["email"]},
                {"$set": {
                    "password_hash": password_hash,
                    "is_active": True,
                    "is_blocked": False,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            results.append(f"✅ {account['email']} - Atualizada")
        else:
            user_data = {
                "id": str(uuid.uuid4()),
                "email": account["email"],
                "password_hash": password_hash,
                "full_name": account["full_name"],
                "user_type": account["user_type"],
                "phone": account.get("phone", ""),
                "document": account.get("document", ""),
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "social_points": 0,
                "is_active": True,
                "is_blocked": False,
                "is_verified": True,
                "referral_code": account["email"].split("@")[0].upper(),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db.users.insert_one(user_data)
            results.append(f"✅ {account['email']} - Criada")
    
    return {"success": True, "results": results}
```

### Chamar o endpoint:

```bash
curl -X POST https://app.transmill.com.br/api/admin/create-labelview-accounts \
  -H "admin-secret: SUA_SENHA_ADMIN_FORTE_AQUI"
```

---

## ✅ VALIDAÇÃO

Após criar as contas, teste:

```bash
# Teste 1: Unidade
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "agitoauto@agitomil.com", "password": "demo123"}'

# Teste 2: Regional
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "regional@agitomil.com", "password": "demo123"}'

# Teste 3: Consultor
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "rafael@agitomil.com", "password": "demo123"}'
```

**Resultado Esperado**: Cada comando deve retornar um JSON com `access_token` e `user`.

---

## 🔐 IMPORTANTE: Gerar Hash Correto

Para gerar o hash bcrypt correto da senha "demo123" no servidor de produção:

```bash
python3 << 'EOF'
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("demo123"))
EOF
```

Copie o hash gerado e use no script MongoDB acima.

---

## 📝 RESUMO

- **Problema**: Banco local ≠ Banco produção
- **Solução**: Criar contas diretamente no servidor de produção
- **Opções**: Script Python (melhor) ou MongoDB Shell ou API endpoint
- **Contas**: 3 (Unidade, Regional, Consultor)
- **Senha**: Todas com "demo123"

---

## 🆘 SUPORTE

Se nenhuma opção funcionar, considere:
1. Verificar se tem acesso SSH ao servidor
2. Verificar string de conexão MongoDB
3. Confirmar nome do banco de dados (agitomil)
4. Verificar permissões de escrita no banco
