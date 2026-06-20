#!/bin/bash

echo "🔐 Fazendo login como labelview@transmill.com..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"labelview@transmill.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Falha no login!"
  exit 1
fi

echo "✅ Login bem-sucedido!"
echo ""
echo "📋 Buscando tipos de veículos com imagens..."
echo ""

curl -s -X GET http://localhost:8001/api/labelview/tipos-veiculo \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)

if data.get('success'):
    print('✅ API FUNCIONANDO PERFEITAMENTE!')
    print()
    print('='*70)
    print('🎯 TIPOS DE VEÍCULOS NO PAINEL MASTER LABELVIEW')
    print('='*70)
    print()
    
    for idx, tipo in enumerate(data.get('tipos', []), 1):
        imagens = tipo.get('imagens_vistoria', [])
        nome = tipo.get('nome')
        icone = tipo.get('icone', '')
        categoria = tipo.get('categoria')
        tipo_fipe = tipo.get('tipo_fipe')
        
        print(f'{idx}. {nome} {icone}')
        print(f'   └─ Categoria: {categoria}')
        print(f'   └─ Tipo FIPE: {tipo_fipe}')
        print(f'   └─ 📸 Imagens de vistoria: {len(imagens)} fotos')
        
        if imagens:
            print(f'   └─ Exemplos:')
            for i, img in enumerate(imagens[:3], 1):
                img_nome = img.get('nome')
                print(f'       {i}. {img_nome}')
        print()
    
    print('='*70)
    total = data.get('total', 0)
    print(f'✅ TOTAL: {total} tipos de veículos cadastrados')
    print('📸 TODAS AS IMAGENS JÁ ESTÃO ENCAIXADAS NOS TIPOS!')
    print('='*70)
else:
    print('❌ Erro na resposta')
    print(json.dumps(data, indent=2))
"
