#!/bin/bash

echo "🔐 Fazendo login como Master..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"labelview@transmill.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Falha no login!"
  exit 1
fi

echo "✅ Login OK!"
echo ""
echo "📋 Buscando primeiro tipo de veículo para ver estrutura das imagens..."
echo ""

curl -s -X GET "http://localhost:8001/api/labelview/tipos-veiculo" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)

if data.get('success') and data.get('tipos'):
    tipo = data['tipos'][0]  # Primeiro tipo
    
    print(f\"✅ Tipo: {tipo.get('nome')}\")
    print(f\"📸 Total de imagens: {len(tipo.get('imagens_vistoria', []))}\")
    print()
    print('🔍 Estrutura das 3 primeiras imagens:')
    print()
    
    for i, img in enumerate(tipo.get('imagens_vistoria', [])[:3], 1):
        print(f'{i}. Nome: {img.get(\"nome\")}')
        print(f'   URL: {img.get(\"url\")[:60]}...')
        print(f'   Campos presentes: {list(img.keys())}')
        print()
else:
    print('❌ Erro ao buscar tipos')
"
