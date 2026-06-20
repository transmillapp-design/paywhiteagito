#!/bin/bash

echo "🔐 Fazendo login como Master Labelview..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protecao@agitomil.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Falha no login!"
  exit 1
fi

echo "✅ Login bem-sucedido!"
echo ""
echo "📋 Buscando tipos de veículos..."
echo ""

curl -s -X GET http://localhost:8001/api/labelview/tipos-veiculo \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)

if data.get('success'):
    print('✅ Endpoint funcionando!')
    print(f\"📊 Total de tipos: {data.get('total', 0)}\")
    print()
    
    for idx, tipo in enumerate(data.get('tipos', []), 1):
        print(f\"{idx}. {tipo.get('nome')} {tipo.get('icone', '')}\" )
        print(f\"   └─ Imagens: {len(tipo.get('imagens_vistoria', []))}\")
        
        # Mostrar primeira imagem como exemplo
        imagens = tipo.get('imagens_vistoria', [])
        if imagens:
            print(f\"   └─ Exemplo: {imagens[0].get('nome')} - {imagens[0].get('url')[:50]}...\")
        print()
else:
    print('❌ Erro na resposta')
    print(json.dumps(data, indent=2))
"
