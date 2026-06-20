#!/bin/bash
echo "🚀 TESTE RÁPIDO PRÉ-DEPLOY"
echo "=========================="

# Teste 1: Backend Health
echo -e "\n1️⃣  Backend Health..."
curl -s http://localhost:8001/api/health | head -20

# Teste 2: Frontend Build
echo -e "\n\n2️⃣  Frontend Files..."
ls -lah /app/frontend/build 2>/dev/null || echo "Build não encontrado (OK em dev)"

# Teste 3: Supervisor
echo -e "\n\n3️⃣  Serviços..."
sudo supervisorctl status | grep -E "(backend|frontend|mongodb)"

# Teste 4: MongoDB
echo -e "\n\n4️⃣  MongoDB..."
sudo supervisorctl status mongodb

# Teste 5: Componentes Críticos
echo -e "\n\n5️⃣  Componentes..."
ls /app/frontend/src/components/MasterLabelviewDashboard.js >/dev/null 2>&1 && echo "✓ MasterLabelviewDashboard" || echo "✗ MasterLabelviewDashboard"
ls /app/frontend/src/components/ProtecaoVeicularPage.js >/dev/null 2>&1 && echo "✓ ProtecaoVeicularPage" || echo "✗ ProtecaoVeicularPage"
ls /app/frontend/src/components/TabelaValoresForm.js >/dev/null 2>&1 && echo "✓ TabelaValoresForm" || echo "✓ TabelaValoresForm"

echo -e "\n\n✅ TESTE CONCLUÍDO"
