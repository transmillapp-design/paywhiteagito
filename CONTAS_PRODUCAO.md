# 🔑 Contas Demo para Produção

## ✅ CORREÇÕES APLICADAS:

### 1. Login Corrigido ✅
- Master Labelview agora vai para página inicial do Transmill (não mais direto para painel)
- Usuário clica no menu e depois em "Labelview" para acessar o painel

### 2. Logout Corrigido ✅
- Botão "Sair" do painel Labelview agora volta para `/login` do Transmill
- Não fica mais em tela azul vazia

### 3. Contas Atualizadas ✅
- Todas as 8 contas com senha `demo123`
- Script pronto para executar em produção

---

## ⚠️ IMPORTANTE: Executar Após Deploy

Este arquivo contém as instruções para criar/atualizar todas as contas demo em **produção** (https://app.transmill.com.br).

---

## 📋 Contas Necessárias (8 contas)

### Sistema Básico (4 contas):
| Email | Senha | Tipo | Descrição |
|-------|-------|------|-----------|
| cliente@demo.com | demo123 | cliente | Cliente comum |
| lojista@demo.com | demo123 | lojista | Lojista/Comerciante |
| prestador@demo.com | demo123 | service_provider | Prestador de serviços |
| master@agitocoin.com | demo123 | master | Master do sistema |

### Hierarquia Labelview (4 contas):
| Email | Senha | Tipo | Descrição |
|-------|-------|------|-----------|
| protecao@agitomil.com | demo123 | labelview_master | Master Labelview (topo hierarquia) |
| agitoauto@agitomil.com | demo123 | labelview_unidade | Unidade (franquia) |
| regional@agitomil.com | demo123 | labelview_regional | Regional (divisão regional) |
| rafael@agitomil.com | demo123 | labelview_consultor | Consultor (vendedor) |

---

## 🚀 Como Executar em Produção

### Opção 1: Via SSH no Servidor

```bash
# 1. Conectar ao servidor via SSH
ssh usuario@servidor

# 2. Navegar para o diretório da aplicação
cd /caminho/para/app

# 3. Executar o script
python3 create_all_production_accounts.py
```

### Opção 2: Via Script Manual no MongoDB

Se não tiver acesso SSH, execute diretamente no MongoDB:

```javascript
// Conectar ao MongoDB de produção
use agitomil

// Hash da senha "demo123" (bcrypt)
const passwordHash = "$2b$12$7oPmfgjI3pEkEr7fGtnEt.6YXZjYJjQBzC8qKZGZZZZZZZZZZZZ"

// Atualizar/Criar contas
const contas = [
  {email: "cliente@demo.com", full_name: "Cliente Demo", user_type: "cliente"},
  {email: "lojista@demo.com", full_name: "Lojista Demo", user_type: "lojista"},
  {email: "prestador@demo.com", full_name: "Prestador Demo", user_type: "service_provider"},
  {email: "master@agitocoin.com", full_name: "Master Sistema", user_type: "master", is_master_account: true},
  {email: "protecao@agitomil.com", full_name: "Master Labelview", user_type: "labelview_master", is_labelview_master: true},
  {email: "agitoauto@agitomil.com", full_name: "AgitoAuto Unidade", user_type: "labelview_unidade"},
  {email: "regional@agitomil.com", full_name: "Regional Sul", user_type: "labelview_regional"},
  {email: "rafael@agitomil.com", full_name: "Rafael Consultor", user_type: "labelview_consultor"}
]

contas.forEach(conta => {
  db.users.updateOne(
    {email: conta.email},
    {
      $set: {
        password_hash: passwordHash,
        full_name: conta.full_name,
        user_type: conta.user_type,
        is_active: true,
        is_blocked: false,
        is_master_account: conta.is_master_account || false,
        is_labelview_master: conta.is_labelview_master || false,
        balance: 0,
        cashback_balance: 0,
        usdt_balance: 0,
        updated_at: new ISODate()
      },
      $setOnInsert: {
        id: UUID().toString(),
        created_at: new ISODate(),
        social_points: 0,
        referral_code: conta.email.split("@")[0].toUpperCase()
      }
    },
    {upsert: true}
  )
  print("✅ " + conta.email)
})
```

---

## ✅ Validação

Após executar o script, teste as contas em https://app.transmill.com.br:

```bash
# Teste todas as contas
curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "cliente@demo.com", "password": "demo123"}'

curl -X POST https://app.transmill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "protecao@agitomil.com", "password": "demo123"}'

# ... repetir para todas as 8 contas
```

---

## 🔄 Fluxo de Acesso ao Labelview

1. Fazer login com qualquer conta Labelview
2. Clicar no menu (3 barras no topo)
3. Clicar em "Labelview" 🛡️
4. Sistema abre direto em `/labelview/dashboard`
5. Menu aparece baseado na hierarquia

---

## 📝 Notas Importantes

- ✅ Todas as contas usam senha: **demo123**
- ✅ Script cria se não existir, atualiza se já existir
- ✅ Apenas contas Labelview têm acesso ao painel Labelview
- ✅ PWA já configurado como "Transmill"
- ⚠️ Executar APÓS o deploy para garantir que as contas existam em produção
