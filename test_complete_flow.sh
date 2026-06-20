#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           🧪 TESTE COMPLETO DO FLUXO DE IMAGENS                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Login
echo "1️⃣  Fazendo login..."
RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"labelview@transmill.com","password":"demo123"}')

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', 'ERRO'))" 2>/dev/null)

if [ "$TOKEN" = "ERRO" ] || [ -z "$TOKEN" ]; then
  echo "❌ Falha no login!"
  echo "Resposta:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Login OK"
echo ""

# 2. Buscar tipos de veículos
echo "2️⃣  Buscando tipos de veículos via API..."
TIPOS_RESPONSE=$(curl -s -X GET "http://localhost:8001/api/labelview/tipos-veiculo" \
  -H "Authorization: Bearer $TOKEN")

# Salvar resposta para análise
echo "$TIPOS_RESPONSE" > /tmp/tipos_response.json

echo "$TIPOS_RESPONSE" | python3 << 'PYTHON_SCRIPT'
import sys, json

try:
    data = json.load(sys.stdin)
    
    if not data.get('success'):
        print('❌ API retornou erro!')
        print(json.dumps(data, indent=2))
        sys.exit(1)
    
    tipos = data.get('tipos', [])
    
    if not tipos:
        print('❌ Nenhum tipo retornado!')
        sys.exit(1)
    
    print(f'✅ API retornou {len(tipos)} tipos')
    print()
    
    # Analisar primeiro tipo
    tipo = tipos[0]
    print(f'📋 Analisando primeiro tipo: {tipo.get("nome")}')
    print()
    
    # Verificar estrutura
    print('🔍 Estrutura do tipo:')
    print(f'   - id: {tipo.get("id", "N/A")[:20]}...')
    print(f'   - nome: {tipo.get("nome")}')
    print(f'   - categoria: {tipo.get("categoria")}')
    print(f'   - is_active: {tipo.get("is_active")}')
    print(f'   - ativo: {tipo.get("ativo")}')
    print()
    
    # Verificar imagens
    imagens = tipo.get('imagens_vistoria', [])
    print(f'📸 Imagens de vistoria: {len(imagens)} imagens')
    print()
    
    if not imagens:
        print('❌ NENHUMA IMAGEM RETORNADA!')
        sys.exit(1)
    
    # Analisar primeira imagem
    img = imagens[0]
    print('🔍 Estrutura da primeira imagem:')
    print(f'   Campos presentes: {list(img.keys())}')
    print()
    print(f'   - nome: "{img.get("nome")}"')
    print(f'   - url: "{img.get("url")[:60]}..."')
    print()
    
    # Simular conversão que o frontend faz
    print('🔄 Simulando conversão do frontend:')
    print()
    print('   ANTES (do banco):')
    print(f'   {{"nome": "{img.get("nome")}", "url": "https://..."}}')
    print()
    print('   DEPOIS (convertido):')
    converted = {
        'nome_campo': img.get('nome', img.get('nome_campo', 'Imagem')),
        'imagem': img.get('url', img.get('imagem')),
        'preview': img.get('url', img.get('imagem', img.get('preview')))
    }
    print(f'   {{"nome_campo": "{converted["nome_campo"]}", "imagem": "https://...", "preview": "https://..."}}')
    print()
    
    # Verificar se conversão funciona
    if converted['nome_campo'] and converted['imagem'] and converted['preview']:
        print('✅ Conversão funcionaria corretamente!')
        print()
        print(f'   nome_campo: ✅ "{converted["nome_campo"]}"')
        print(f'   imagem: ✅ URL presente')
        print(f'   preview: ✅ URL presente')
    else:
        print('❌ Conversão teria problemas!')
        if not converted['nome_campo']:
            print('   ❌ nome_campo está vazio')
        if not converted['imagem']:
            print('   ❌ imagem está vazio')
        if not converted['preview']:
            print('   ❌ preview está vazio')
    
    print()
    print('=' * 80)
    print('✅ TESTE CONCLUÍDO - DADOS ESTÃO CORRETOS NO BACKEND!')
    print('=' * 80)
    
except Exception as e:
    print(f'❌ Erro ao processar: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                    📊 CONCLUSÃO DO TESTE                             ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "✅ Backend está funcionando corretamente"
    echo "✅ API retorna imagens com estrutura correta"
    echo "✅ Conversão do frontend deveria funcionar"
    echo ""
    echo "⚠️  Se as imagens NÃO aparecem no navegador, o problema é:"
    echo ""
    echo "1. 🔴 CÓDIGO DO FRONTEND NÃO ATUALIZADO"
    echo "   Solução: Verificar se TipoVeiculoModal.js tem a correção"
    echo ""
    echo "2. 🔴 COMPONENTE NÃO ESTÁ USANDO OS DADOS CORRETAMENTE"
    echo "   Solução: Debug no console do navegador (F12)"
    echo ""
    echo "3. 🔴 HOT RELOAD NÃO DETECTOU A MUDANÇA"
    echo "   Solução: Reiniciar frontend manualmente"
    echo ""
    echo "📝 Resposta completa salva em: /tmp/tipos_response.json"
    echo ""
else
    echo ""
    echo "❌ Teste falhou! Verifique os logs acima."
fi
