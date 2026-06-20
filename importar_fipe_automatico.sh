#!/bin/bash

echo "=========================================="
echo "IMPORTADOR AUTOMÁTICO FIPE"
echo "Tentará importar a cada hora até conseguir"
echo "=========================================="
echo ""

MAX_TENTATIVAS=24  # Tentar por 24 horas
TENTATIVA=1
SUCESSO=0

while [ $TENTATIVA -le $MAX_TENTATIVAS ] && [ $SUCESSO -eq 0 ]; do
    echo "🔄 Tentativa $TENTATIVA de $MAX_TENTATIVAS"
    echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    cd /app/backend
    
    # Executar importação
    python3 fipe_importer.py > /tmp/fipe_import.log 2>&1
    
    # Verificar se teve sucesso (mais de 0 veículos)
    TOTAL=$(grep "✅ Total:" /tmp/fipe_import.log | grep -oP '\d+' | head -1)
    
    if [ ! -z "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
        echo "✅ SUCESSO! $TOTAL veículos importados!"
        echo ""
        cat /tmp/fipe_import.log
        SUCESSO=1
    else
        echo "❌ Rate limit ainda ativo ou erro na importação"
        echo "💤 Aguardando 1 hora para próxima tentativa..."
        echo ""
        
        if [ $TENTATIVA -lt $MAX_TENTATIVAS ]; then
            sleep 3600  # Aguardar 1 hora (3600 segundos)
        fi
    fi
    
    TENTATIVA=$((TENTATIVA + 1))
done

if [ $SUCESSO -eq 1 ]; then
    echo "=========================================="
    echo "✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ Não foi possível importar após $MAX_TENTATIVAS tentativas"
    echo "=========================================="
fi
