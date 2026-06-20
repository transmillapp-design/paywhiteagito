#!/bin/bash

# Script para atualizar versão do sistema
# Uso: ./update_version.sh <versao> "<descrição da mudança>"
# Exemplo: ./update_version.sh v2.1.2 "Correção bug X"

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Uso: ./update_version.sh <versao> \"<descrição>\""
    echo "Exemplo: ./update_version.sh v2.1.2 \"Correção bug no cadastro\""
    exit 1
fi

VERSION=$1
DESCRIPTION=$2
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Atualizar VERSION.txt
cat > /app/VERSION.txt << EOF
$VERSION
$TIMESTAMP
$DESCRIPTION
EOF

echo "✅ Versão atualizada para: $VERSION"
echo "📅 Data: $TIMESTAMP"
echo "📝 Descrição: $DESCRIPTION"
echo ""
echo "🔔 INFORMAR AO USUÁRIO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Nova versão disponível: $VERSION"
echo "📅 Data: $TIMESTAMP"
echo "📝 Mudança: $DESCRIPTION"
echo ""
echo "Após o deploy, verifique no painel se aparece: $VERSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
