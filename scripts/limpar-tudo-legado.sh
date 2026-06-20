#!/bin/bash

echo "🧹 LIMPEZA COMPLETA: AGITOCOIN/AGITOMIL → TRANSMILL"
echo "===================================================="
echo ""

# Backup
echo "📦 Criando backup de segurança..."
BACKUP_DIR="/tmp/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /app/frontend/src $BACKUP_DIR/
cp -r /app/backend $BACKUP_DIR/
echo "✅ Backup criado em: $BACKUP_DIR"
echo ""

# Contador
TOTAL_CHANGES=0

# 1. Frontend - Substituir em arquivos JS/JSX
echo "1️⃣ Limpando Frontend..."
echo "   a) Substituindo 'agitocoin' → 'transmill' (case insensitive)..."
FRONTEND_COUNT=$(find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -i "agitocoin" {} \; | wc -l)
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/[Aa][Gg][Ii][Tt][Oo][Cc][Oo][Ii][Nn]/transmill/g' {} \;
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/AGITOCOIN/TRANSMILL/g' {} \;
echo "      ✅ $FRONTEND_COUNT referências processadas"
TOTAL_CHANGES=$((TOTAL_CHANGES + FRONTEND_COUNT))

echo "   b) Substituindo 'agitomil' → 'transmill' (case insensitive)..."
AGITOMIL_COUNT=$(find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -i "agitomil" {} \; | grep -v "agitoauto" | wc -l)
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/[Aa][Gg][Ii][Tt][Oo][Mm][Ii][Ll]/transmill/g' {} \;
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/AGITOMIL/TRANSMILL/g' {} \;
echo "      ✅ $AGITOMIL_COUNT referências processadas"
TOTAL_CHANGES=$((TOTAL_CHANGES + AGITOMIL_COUNT))

echo "   c) Substituindo 'Agito Coin' → 'Transmill'..."
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/Agito Coin/Transmill/g' {} \;
find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/AgitoCoin/Transmill/g' {} \;
echo "      ✅ Textos UI atualizados"

# 2. Frontend HTML
echo ""
echo "2️⃣ Limpando HTML público..."
HTML_COUNT=$(grep -i "agito" /app/frontend/public/index.html | wc -l)
sed -i 's/[Aa][Gg][Ii][Tt][Oo][Cc][Oo][Ii][Nn]/transmill/g' /app/frontend/public/index.html
sed -i 's/[Aa][Gg][Ii][Tt][Oo][Mm][Ii][Ll]/transmill/g' /app/frontend/public/index.html
echo "   ✅ $HTML_COUNT referências processadas"
TOTAL_CHANGES=$((TOTAL_CHANGES + HTML_COUNT))

# 3. Backend Python
echo ""
echo "3️⃣ Limpando Backend..."
echo "   a) Comentários e strings..."
BACKEND_COUNT=$(find /app/backend -type f -name "*.py" -exec grep -i "agito" {} \; | grep -v "agitoauto" | wc -l)
# Não mexer em emails @agitomil.com ou dados do banco
find /app/backend -type f -name "*.py" -exec sed -i 's/agitocoin/transmill/g' {} \;
find /app/backend -type f -name "*.py" -exec sed -i 's/AGITOCOIN/TRANSMILL/g' {} \;
echo "      ✅ $BACKEND_COUNT referências processadas"
TOTAL_CHANGES=$((TOTAL_CHANGES + BACKEND_COUNT))

# 4. Verificar nome do banco (NÃO ALTERAR - apenas informar)
echo ""
echo "4️⃣ Verificando nome do banco de dados..."
if grep -q "agitomil" /app/backend/server.py 2>/dev/null; then
    echo "   ⚠️  ATENÇÃO: Banco de dados ainda usa 'agitomil'"
    echo "      Isso NÃO foi alterado por segurança"
    echo "      Alterar nome do banco requer migração manual"
else
    echo "   ✅ Nome do banco correto"
fi

# 5. Limpar comentários específicos
echo ""
echo "5️⃣ Removendo comentários legados..."
find /app/frontend/src -type f -name "*.js" -exec sed -i '/\/\/ .*[Aa]gito[Cc]oin/d' {} \;
find /app/frontend/src -type f -name "*.js" -exec sed -i '/\/\/ .*[Aa]gito[Mm]il/d' {} \;
find /app/backend -type f -name "*.py" -exec sed -i '/# .*[Aa]gito[Cc]oin/d' {} \;
find /app/backend -type f -name "*.py" -exec sed -i '/# .*[Aa]gito[Mm]il/d' {} \;
echo "   ✅ Comentários removidos"

# 6. Verificação final
echo ""
echo "======================================================"
echo "📊 VERIFICAÇÃO FINAL"
echo "======================================================"
REMAINING_FRONTEND=$(find /app/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -i "agito" {} \; | grep -v "agitoauto" | wc -l)
REMAINING_BACKEND=$(find /app/backend -type f -name "*.py" -exec grep -i "agito" {} \; | grep -v "agitoauto" | wc -l)

echo "Frontend: $REMAINING_FRONTEND referências restantes (exceto agitoauto)"
echo "Backend:  $REMAINING_BACKEND referências restantes (exceto agitoauto)"
echo ""
echo "Total de mudanças aplicadas: $TOTAL_CHANGES"
echo ""

if [ $REMAINING_FRONTEND -lt 20 ] && [ $REMAINING_BACKEND -lt 20 ]; then
    echo "✅ LIMPEZA BEM-SUCEDIDA!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Reiniciar frontend e backend"
    echo "   2. Testar aplicação"
    echo "   3. Verificar console do navegador"
else
    echo "⚠️  Ainda há referências. Verificação manual recomendada."
fi

echo ""
echo "💾 Backup disponível em: $BACKUP_DIR"
echo ""
