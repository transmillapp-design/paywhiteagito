#!/usr/bin/env python3
"""
Script de Verificação Pré-Deploy
Valida que o sistema está pronto para produção
"""

import os
import sys
import subprocess
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_check(message, status):
    icon = f"{Colors.GREEN}✓{Colors.END}" if status else f"{Colors.RED}✗{Colors.END}"
    print(f"{icon} {message}")
    return status

def check_backend():
    """Verificar backend"""
    print(f"\n{Colors.BLUE}=== BACKEND ==={Colors.END}")
    
    checks = []
    
    # Sintaxe Python
    try:
        result = subprocess.run(
            ['python', '-m', 'py_compile', '/app/backend/server.py'],
            capture_output=True,
            timeout=10
        )
        checks.append(print_check("Sintaxe server.py", result.returncode == 0))
    except:
        checks.append(print_check("Sintaxe server.py", False))
    
    # Variáveis de ambiente
    env_file = Path('/app/backend/.env')
    mongo_url = os.getenv('MONGO_URL')
    checks.append(print_check("MONGO_URL configurada", mongo_url is not None))
    
    # Supervisor status
    try:
        result = subprocess.run(
            ['sudo', 'supervisorctl', 'status', 'backend'],
            capture_output=True,
            timeout=5
        )
        running = b'RUNNING' in result.stdout
        checks.append(print_check("Backend rodando", running))
    except:
        checks.append(print_check("Backend rodando", False))
    
    return all(checks)

def check_frontend():
    """Verificar frontend"""
    print(f"\n{Colors.BLUE}=== FRONTEND ==={Colors.END}")
    
    checks = []
    
    # .env existe
    env_file = Path('/app/frontend/.env')
    checks.append(print_check(".env existe", env_file.exists()))
    
    # REACT_APP_BACKEND_URL
    if env_file.exists():
        with open(env_file) as f:
            content = f.read()
            has_url = 'REACT_APP_BACKEND_URL' in content
            checks.append(print_check("REACT_APP_BACKEND_URL configurada", has_url))
    
    # Supervisor status
    try:
        result = subprocess.run(
            ['sudo', 'supervisorctl', 'status', 'frontend'],
            capture_output=True,
            timeout=5
        )
        running = b'RUNNING' in result.stdout
        checks.append(print_check("Frontend rodando", running))
    except:
        checks.append(print_check("Frontend rodando", False))
    
    # Componentes críticos
    critical_components = [
        '/app/frontend/src/components/MasterLabelviewDashboard.js',
        '/app/frontend/src/components/ProtecaoVeicularPage.js',
        '/app/frontend/src/components/MinimalistHomePage.js',
        '/app/frontend/src/components/TabelaValoresForm.js'
    ]
    
    for comp in critical_components:
        exists = Path(comp).exists()
        name = Path(comp).name
        checks.append(print_check(f"Componente {name}", exists))
    
    return all(checks)

def check_responsiveness():
    """Verificar configurações de responsividade"""
    print(f"\n{Colors.BLUE}=== RESPONSIVIDADE ==={Colors.END}")
    
    checks = []
    
    # Verificar Tailwind mobile-first
    files_to_check = [
        '/app/frontend/src/components/MasterLabelviewDashboard.js',
        '/app/frontend/src/components/ProtecaoVeicularPage.js'
    ]
    
    for file_path in files_to_check:
        if Path(file_path).exists():
            with open(file_path) as f:
                content = f.read()
                # Verificar classes responsivas do Tailwind
                has_mobile = 'max-w-md' in content or 'sm:' in content or 'md:' in content
                name = Path(file_path).stem
                checks.append(print_check(f"{name} - classes responsivas", has_mobile))
    
    return len(checks) > 0 and all(checks)

def check_database():
    """Verificar MongoDB"""
    print(f"\n{Colors.BLUE}=== DATABASE ==={Colors.END}")
    
    checks = []
    
    # MongoDB rodando
    try:
        result = subprocess.run(
            ['sudo', 'supervisorctl', 'status', 'mongodb'],
            capture_output=True,
            timeout=5
        )
        running = b'RUNNING' in result.stdout
        checks.append(print_check("MongoDB rodando", running))
    except:
        checks.append(print_check("MongoDB rodando", False))
    
    return all(checks)

def check_routes():
    """Verificar rotas principais"""
    print(f"\n{Colors.BLUE}=== ROTAS ==={Colors.END}")
    
    checks = []
    
    routes_file = Path('/app/frontend/src/App.js')
    if routes_file.exists():
        with open(routes_file) as f:
            content = f.read()
            
            critical_routes = [
                '/protecao-veicular',
                '/labelview/login',
                '/internet-movel'
            ]
            
            for route in critical_routes:
                has_route = route in content
                checks.append(print_check(f"Rota {route}", has_route))
    
    return all(checks)

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}   VERIFICAÇÃO PRÉ-DEPLOY - AGITOMIL{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    results = {
        'Backend': check_backend(),
        'Frontend': check_frontend(),
        'Database': check_database(),
        'Rotas': check_routes(),
        'Responsividade': check_responsiveness()
    }
    
    # Resumo
    print(f"\n{Colors.BLUE}=== RESUMO ==={Colors.END}")
    for check_name, passed in results.items():
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"{check_name}: {status}")
    
    all_passed = all(results.values())
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    if all_passed:
        print(f"{Colors.GREEN}✓ SISTEMA PRONTO PARA DEPLOY{Colors.END}")
        print(f"\n{Colors.BLUE}Deploy URLs:{Colors.END}")
        print(f"  • AgitoMil: https://agitomil.com.br")
        print(f"  • Labelview: https://agitomil.com.br/labelview/login")
    else:
        print(f"{Colors.RED}✗ CORREÇÕES NECESSÁRIAS ANTES DO DEPLOY{Colors.END}")
        sys.exit(1)
    
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
