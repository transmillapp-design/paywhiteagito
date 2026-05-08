#!/bin/bash

echo "🧪 TESTE DO ENDPOINT DE MIGRAÇÃO"
echo "================================"
echo ""

# Login
echo "1️⃣ Login..."
LOGIN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}')

TOKEN=$(echo $LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro no login!"
    exit 1
fi

echo "✅ Login bem-sucedido!"
echo ""

# Executar migração
echo "2️⃣ Executando migração..."
RESULT=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/migrar-tipos-veiculos \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | python3 -m json.tool

echo ""
echo "✅ Teste concluído!"
