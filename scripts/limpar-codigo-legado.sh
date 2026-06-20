#!/bin/bash

echo "🧹 LIMPEZA COMPLETA DE CÓDIGO LEGADO AGITOMIL/AGITOCOIN"
echo "========================================================"
echo ""

# Contador
TOTAL=0

# 1. Renomear referências de tema
echo "1️⃣ Renomeando tema localStorage..."
COUNT=$(grep -r "agitocoin-theme\|agito-theme" /app/frontend/src /app/frontend/public --include="*.js" --include="*.jsx" --include="*.html" 2>/dev/null | wc -l)
if [ $COUNT -gt 0 ]; then
    find /app/frontend/src /app/frontend/public -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.html" \) -exec sed -i "s/agitocoin-theme/transmill-theme/g" {} \;
    echo "   ✅ $COUNT referências de tema renomeadas"
    TOTAL=$((TOTAL + COUNT))
else
    echo "   ✅ Nenhuma referência de tema encontrada"
fi

# 2. Limpar comentários legados
echo ""
echo "2️⃣ Removendo comentários com AgitoMil/AgitoCoin..."
COUNT=$(grep -r "// .*[Aa]gito\|/\* .*[Aa]gito" /app/frontend/src --include="*.js" 2>/dev/null | grep -v "agitoauto" | wc -l)
if [ $COUNT -gt 0 ]; then
    # Remover linhas de comentário que mencionam Agito (exceto agitoauto)
    find /app/frontend/src -type f -name "*.js" -exec sed -i '/\/\/ .*[Aa]gito[^a]/d' {} \;
    echo "   ✅ $COUNT comentários removidos"
    TOTAL=$((TOTAL + COUNT))
else
    echo "   ✅ Nenhum comentário legado encontrado"
fi

# 3. Verificar se ainda existe 'licenciados' no código
echo ""
echo "3️⃣ Verificando referências a 'licenciados'..."
COUNT=$(grep -r "licenciados\|licenciado" /app/frontend/src --include="*.js" 2>/dev/null | grep -v "REMOVIDO\|legado\|//" | wc -l)
if [ $COUNT -gt 0 ]; then
    echo "   ⚠️  Ainda existem $COUNT referências a 'licenciados'"
    grep -r "licenciados" /app/frontend/src --include="*.js" | grep -v "REMOVIDO\|legado" | head -5
else
    echo "   ✅ Nenhuma referência a 'licenciados' encontrada"
fi

# 4. Verificar database name no backend
echo ""
echo "4️⃣ Verificando nome do banco de dados..."
if grep -q "agitomil" /app/backend/server.py 2>/dev/null; then
    echo "   ⚠️  Referência a 'agitomil' encontrada em server.py"
else
    echo "   ✅ Sem referências no server.py"
fi

# 5. Resumo
echo ""
echo "======================================================"
echo "🎯 RESUMO DA LIMPEZA"
echo "======================================================"
echo "✅ Total de alterações: $TOTAL"
echo ""
echo "📊 Verificação final:"
REMAINING=$(grep -r "agito" /app/frontend/src --include="*.js" -i 2>/dev/null | grep -v "agitoauto" | grep -v "node_modules" | wc -l)
echo "   Referências restantes (exceto agitoauto): $REMAINING"
echo ""
if [ $REMAINING -lt 50 ]; then
    echo "✅ Limpeza bem-sucedida!"
else
    echo "⚠️  Ainda há muitas referências. Verificação manual necessária."
fi
echo ""
