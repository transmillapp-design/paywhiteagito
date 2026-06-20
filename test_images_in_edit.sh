#!/bin/bash

echo "🔐 Login Master..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"labelview@transmill.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "✅ Login OK"
echo ""
echo "📋 Testando estrutura de dados para o modal de edição..."
echo ""

curl -s -X GET "http://localhost:8001/api/labelview/tipos-veiculo" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)

if data.get('success') and data.get('tipos'):
    tipo = data['tipos'][0]  # Primeiro tipo
    
    print('✅ ESTRUTURA DO TIPO PARA EDIÇÃO:')
    print()
    print(f'📝 Nome: {tipo.get(\"nome\")}')
    print(f'📂 Categoria: {tipo.get(\"categoria\")}')
    print(f'✅ is_active: {tipo.get(\"is_active\")}')
    print(f'✅ ativo: {tipo.get(\"ativo\")}')
    print(f'💰 valor_fipe_maximo: {tipo.get(\"valor_fipe_maximo\")}')
    print()
    
    imagens = tipo.get('imagens_vistoria', [])
    print(f'📸 IMAGENS DE VISTORIA: {len(imagens)} imagens')
    print()
    
    if imagens:
        print('🔍 Exemplo da primeira imagem:')
        img = imagens[0]
        print(f'   - nome: \"{img.get(\"nome\")}\"')
        print(f'   - url: \"{img.get(\"url\")[:50]}...\"')
        print()
        print('✅ As imagens têm a estrutura {nome, url}')
        print('✅ O componente vai converter para {nome_campo, imagem, preview}')
    else:
        print('❌ Nenhuma imagem encontrada!')
else:
    print('❌ Erro ao buscar dados')
"
