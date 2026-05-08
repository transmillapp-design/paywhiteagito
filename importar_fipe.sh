#!/bin/bash

echo "=========================================="
echo "IMPORTADOR FIPE - Base de Dados Local"
echo "=========================================="
echo ""

cd /app/backend

echo "🚀 Iniciando importação da Tabela FIPE..."
echo "📊 Isso pode levar alguns minutos..."
echo ""

python3 fipe_importer.py

echo ""
echo "=========================================="
echo "✅ Importação concluída!"
echo "=========================================="
echo ""
echo "💡 Para usar:"
echo "   - Abra o painel Master Labelview"
echo "   - Vá em: Pessoas > Tipo de Veículo > Tabela FIPE"
echo "   - Clique em 'Atualizar'"
echo ""
