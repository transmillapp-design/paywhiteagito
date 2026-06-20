#!/bin/bash

echo "🧪 TESTE DO ENDPOINT DE IMPORTAÇÃO DA API"
echo "=========================================="
echo ""

# 1. Login como Master Labelview
echo "1️⃣ Fazendo login como Master Labelview..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro no login!"
    exit 1
fi

echo "✅ Login bem-sucedido! Token obtido."
echo ""

# 2. Chamar endpoint de importação
echo "2️⃣ Chamando endpoint de importação..."
IMPORT_RESPONSE=$(curl -s -X POST http://localhost:8001/api/labelview/tabelas/importar-assistencia-24h \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$IMPORT_RESPONSE" | python3 -m json.tool
echo ""

# 3. Listar tabelas criadas
echo "3️⃣ Listando tabelas de Assistência 24hs..."
LIST_RESPONSE=$(curl -s -X GET "http://localhost:8001/api/labelview/tabelas/Assistencia_24hs" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $LIST_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('total', 0))" 2>/dev/null)

echo "📊 Total de registros: $TOTAL"
echo ""

if [ "$TOTAL" == "60" ]; then
    echo "✅ SUCESSO! 60 registros criados conforme esperado!"
else
    echo "⚠️ Total: $TOTAL (esperado: 60)"
fi

echo ""
echo "✅ TESTE COMPLETO FINALIZADO!"
