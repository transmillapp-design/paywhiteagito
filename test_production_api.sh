#!/bin/bash

echo "🔐 Testando API de tipos de veículos..."
echo ""

# Login
echo "1️⃣ Fazendo login..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"labelview@transmill.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', 'ERRO'))")

if [ "$TOKEN" = "ERRO" ]; then
  echo "❌ Falha no login!"
  exit 1
fi

echo "✅ Login OK"
echo ""

# Buscar tipos
echo "2️⃣ Buscando tipos de veículos..."
RESPONSE=$(curl -s -X GET "http://localhost:8001/api/labelview/tipos-veiculo" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | python3 -c "
import sys, json

try:
    data = json.load(sys.stdin)
    
    if not data.get('success'):
        print('❌ API retornou erro')
        print(data)
        sys.exit(1)
    
    tipos = data.get('tipos', [])
    print(f'✅ API retornou {len(tipos)} tipos')
    print()
    
    for idx, tipo in enumerate(tipos, 1):
        nome = tipo.get('nome', 'Sem nome')
        imagens = tipo.get('imagens_vistoria', [])
        
        print(f'{idx}. {nome}')
        print(f'   - Total de imagens: {len(imagens)}')
        
        if imagens:
            img = imagens[0]
            print(f'   - Primeira imagem:')
            print(f'     • nome: {img.get(\"nome\", \"N/A\")}')
            print(f'     • url: {img.get(\"url\", \"N/A\")[:60]}...')
            print(f'     • Campos: {list(img.keys())}')
        else:
            print(f'   ⚠️  NENHUMA IMAGEM!')
        print()
    
except Exception as e:
    print(f'❌ Erro ao processar resposta: {e}')
    sys.exit(1)
"

