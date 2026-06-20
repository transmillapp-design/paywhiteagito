#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   MONITORAMENTO EM TEMPO REAL - NOVA COTAÇÃO RAFAEL      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Link do Consultor Rafael:${NC}"
echo -e "   https://app.transmill.com.br/cotacao?ref=CONS_BA143B1B"
echo ""
echo -e "${BLUE}🔍 Monitorando logs em tempo real...${NC}"
echo -e "${BLUE}   (Pressione Ctrl+C para parar)${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Monitorar logs do backend em tempo real
tail -f /var/log/supervisor/backend.out.log | grep --line-buffered -E "cotacao|consultor|rafael|CONS_BA143B1B|POST.*api|GET.*api|Error|erro|❌|✅|🔍" | while read line; do
    # Colorir baseado no conteúdo
    if echo "$line" | grep -qi "error\|erro\|❌"; then
        echo -e "${RED}[$(date +%H:%M:%S)] $line${NC}"
    elif echo "$line" | grep -qi "success\|✅"; then
        echo -e "${GREEN}[$(date +%H:%M:%S)] $line${NC}"
    elif echo "$line" | grep -qi "post\|get"; then
        echo -e "${CYAN}[$(date +%H:%M:%S)] $line${NC}"
    else
        echo -e "${YELLOW}[$(date +%H:%M:%S)] $line${NC}"
    fi
done
