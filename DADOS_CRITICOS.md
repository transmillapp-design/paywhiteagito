# 🛡️ DADOS CRÍTICOS - NÃO DELETAR

**ATENÇÃO:** Estes dados são ESSENCIAIS para o funcionamento do sistema!

---

## 📋 Contas Que NUNCA Devem Ser Deletadas

### **Master Transmill (Sistema Principal)**
```
Email: transmillapp@gmail.com
Senha: demo123
Campo: is_master: true
Função: Acesso total ao sistema Transmill
```

### **Master Labelview**
```
Email: labelview@transmill.com
Senha: demo123
Campo: is_labelview_master: true
Função: Gestão do sistema Labelview
```

### **Unidade AgitoAuto**
```
Email: agitoautobrasil@gmail.com
Senha: !Ma04202011@
Tipo: labelview_unidade
Função: Unidade de produção
```

### **Regional Sul**
```
Email: regional.sul@transmill.com
Senha: demo123
Tipo: labelview_regional
Função: Regional de teste
```

### **Consultor Rafael Bersch**
```
Email: rafael.bersch@htmail.com
Senha: !Ma04202011@
Tipo: labelview_consultor
Vinculado: Unidade AgitoAuto
Função: Consultor de produção
```

### **Consultor Carlos Silva**
```
Email: carlos.consultor@transmill.com
Senha: demo123
Tipo: labelview_consultor
Vinculado: Regional Sul
Função: Consultor de teste
```

---

## 🔒 Campos Críticos no MongoDB

### **NUNCA remover estes campos:**

```javascript
{
  "id": "...",              // ✅ ID único
  "email": "...",           // ✅ Email único
  "is_master": true,        // ✅ Permissão master
  "is_labelview_master": true, // ✅ Permissão labelview master
  "user_type": "...",       // ✅ Tipo de usuário
  "unidade_id": "...",      // ✅ Vínculo hierárquico
  "regional_id": "...",     // ✅ Vínculo hierárquico
  "referred_by": "..."      // ✅ Vínculo hierárquico
}
```

---

## 🚫 O Que NUNCA Fazer

### **❌ Scripts que DELETAM tudo:**
```python
# ❌ NUNCA FAZER ISSO:
await db.users.delete_many({})
await db.users.drop()
```

### **❌ Updates sem filtro:**
```python
# ❌ NUNCA FAZER ISSO:
await db.users.update_many(
    {},  # SEM FILTRO = atualiza TUDO
    {'$set': {'is_master': False}}
)
```

### **❌ Sobrescrever contas importantes:**
```python
# ❌ CUIDADO:
# Sempre verificar se conta existe antes de criar
existing = await db.users.find_one({'email': 'transmillapp@gmail.com'})
if not existing:
    # Só cria se não existir
    await db.users.insert_one(new_user)
```

---

## ✅ O Que SEMPRE Fazer

### **1. Backup Antes de Qualquer Alteração**
```bash
/app/scripts/backup-antes-update.sh
```

### **2. Verificar Antes de Atualizar**
```bash
/app/scripts/verificar-antes-update.sh
```

### **3. Usar Upsert com Cuidado**
```python
# ✅ CORRETO: Apenas atualiza o que precisa
await db.users.update_one(
    {'email': 'transmillapp@gmail.com'},  # Filtro específico
    {
        '$set': {'is_active': True}  # Apenas o campo necessário
    },
    upsert=False  # NÃO cria se não existir
)
```

### **4. Verificar Após Alteração**
```python
# ✅ Sempre verificar o resultado
result = await db.users.update_one(...)
print(f"Modificados: {result.modified_count}")
```

---

## 📊 Collections Críticas

### **users**
- Todas as contas
- Hierarquia Labelview
- Permissões

### **modelos_documentos**
- Modelos de CNH, RG, etc
- URLs do Cloudinary

### **cotacoes** (se existir)
- Cotações de clientes
- Histórico

---

## 🔄 Processo de Update Seguro

```bash
# 1. Backup
/app/scripts/backup-antes-update.sh

# 2. Verificar
/app/scripts/verificar-antes-update.sh

# 3. Se OK, fazer update
# ... suas alterações ...

# 4. Verificar novamente
/app/scripts/verificar-antes-update.sh

# 5. Testar funcionalidades críticas
# - Login Master Transmill
# - Login Master Labelview
# - Login Unidade
# - Hierarquia consultores
```

---

## 🆘 Se Algo Der Errado

### **Restaurar Banco:**
```bash
# Usar backup mais recente
ls -lt /app/backups/
mongorestore --uri='mongodb://localhost:27017/transmill' /app/backups/YYYYMMDD_HHMMSS/mongodb/transmill
```

### **Restaurar Arquivos:**
```bash
cp -r /app/backups/YYYYMMDD_HHMMSS/critical_files/* /app/backend/
sudo supervisorctl restart all
```

---

## 📞 Checklist de Segurança

Antes de QUALQUER alteração no banco:

- [ ] Fiz backup? (`backup-antes-update.sh`)
- [ ] Verifiquei que tudo está OK? (`verificar-antes-update.sh`)
- [ ] Tenho certeza do que vou fazer?
- [ ] Testei em ambiente local primeiro?
- [ ] Sei como reverter se der errado?

**SE QUALQUER RESPOSTA FOR NÃO, NÃO FAÇA A ALTERAÇÃO!**

---

**Última atualização:** 08/12/2024
**Versão:** v2.31.6
