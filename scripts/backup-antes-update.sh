#!/bin/bash

# 🛡️ BACKUP AUTOMÁTICO ANTES DE QUALQUER UPDATE
# Este script deve ser executado ANTES de fazer qualquer alteração

BACKUP_DIR="/app/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🛡️ BACKUP ANTES DE UPDATE"
echo "=========================="
echo "Diretório: $BACKUP_DIR"
echo ""

# 1. Backup do banco de dados
echo "1️⃣ Fazendo backup do MongoDB..."
mongodump --uri="mongodb://localhost:27017/transmill" --out="$BACKUP_DIR/mongodb" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Backup MongoDB concluído"
else
    echo "   ⚠️  MongoDB backup falhou (pode não estar instalado localmente)"
fi

# 2. Backup de arquivos críticos
echo ""
echo "2️⃣ Backup de arquivos críticos..."
mkdir -p "$BACKUP_DIR/critical_files"

# Backend
cp -r /app/backend/routes "$BACKUP_DIR/critical_files/"
cp /app/backend/server.py "$BACKUP_DIR/critical_files/"
cp /app/backend/requirements.txt "$BACKUP_DIR/critical_files/"

# Frontend
cp /app/frontend/src/App.js "$BACKUP_DIR/critical_files/"
cp /app/frontend/package.json "$BACKUP_DIR/critical_files/"

# Configs
cp /app/VERSION.txt "$BACKUP_DIR/critical_files/" 2>/dev/null
cp /app/test_result.md "$BACKUP_DIR/critical_files/" 2>/dev/null

echo "   ✅ Arquivos críticos backupeados"

# 3. Listar contas críticas
echo ""
echo "3️⃣ Documentando contas críticas..."
python3 << 'PYEOF' > "$BACKUP_DIR/contas_criticas.txt"
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def list_critical_accounts():
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/transmill')
        client = AsyncIOMotorClient(mongo_url)
        db = client.transmill
        
        print("CONTAS CRÍTICAS - NÃO DELETAR")
        print("=" * 80)
        
        # Masters
        print("\n📌 MASTERS TRANSMILL:")
        masters = await db.users.find({'is_master': True}).to_list(length=100)
        for m in masters:
            print(f"  - {m.get('email')} (ID: {m.get('id')})")
        
        # Master Labelview
        print("\n📌 MASTER LABELVIEW:")
        master_lv = await db.users.find({'is_labelview_master': True}).to_list(length=100)
        for m in master_lv:
            print(f"  - {m.get('email')} (ID: {m.get('id')})")
        
        # Unidades
        print("\n📌 UNIDADES LABELVIEW:")
        unidades = await db.users.find({'user_type': 'labelview_unidade'}).to_list(length=100)
        for u in unidades:
            print(f"  - {u.get('email')} (ID: {u.get('id')})")
        
        # Regionais
        print("\n📌 REGIONAIS LABELVIEW:")
        regionais = await db.users.find({'user_type': 'labelview_regional'}).to_list(length=100)
        for r in regionais:
            print(f"  - {r.get('email')} (ID: {r.get('id')})")
        
        # Consultores
        print("\n📌 CONSULTORES:")
        consultores = await db.users.find({'user_type': 'labelview_consultor'}).to_list(length=100)
        for c in consultores:
            print(f"  - {c.get('email')} (ID: {c.get('id')})")
        
        client.close()
        
    except Exception as e:
        print(f"Erro ao listar contas: {e}")

asyncio.run(list_critical_accounts())
PYEOF

echo "   ✅ Contas documentadas em contas_criticas.txt"

# 4. Estado dos serviços
echo ""
echo "4️⃣ Documentando estado dos serviços..."
sudo supervisorctl status > "$BACKUP_DIR/services_status.txt"
echo "   ✅ Estado dos serviços salvo"

# 5. Versão atual
echo ""
echo "5️⃣ Documentando versão atual..."
curl -s http://localhost:8001/api/health > "$BACKUP_DIR/version_atual.json" 2>/dev/null
cat /app/VERSION.txt > "$BACKUP_DIR/VERSION_atual.txt" 2>/dev/null
echo "   ✅ Versão documentada"

# Resumo
echo ""
echo "======================================"
echo "✅ BACKUP COMPLETO!"
echo "======================================"
echo "Localização: $BACKUP_DIR"
echo ""
echo "Conteúdo:"
echo "  - MongoDB dump"
echo "  - Arquivos críticos"
echo "  - Lista de contas"
echo "  - Estado dos serviços"
echo "  - Versão atual"
echo ""
echo "Para restaurar:"
echo "  mongorestore --uri='mongodb://localhost:27017/transmill' $BACKUP_DIR/mongodb/transmill"
echo ""
