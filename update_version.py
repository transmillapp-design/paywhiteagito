#!/usr/bin/env python3
"""
Sistema de Versionamento Automático - Transmill
Atualiza a versão em todos os arquivos do sistema de forma sincronizada

Uso:
    python update_version.py 2.8.1 "Mensagem do changelog"
    python update_version.py 2.9.0 "Nova feature X"
    python update_version.py 3.0.0 "Breaking changes"
"""

import sys
import re
from datetime import datetime
from pathlib import Path

# Cores para terminal
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def update_version_txt(version, message):
    """Atualiza VERSION.txt"""
    version_file = Path('/app/VERSION.txt')
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    content = f"v{version}\n{timestamp}\n{message}\n"
    
    version_file.write_text(content, encoding='utf-8')
    print(f"{GREEN}✅ VERSION.txt atualizado{RESET}")

def update_backend_version(version):
    """Atualiza versão no backend (server.py)"""
    server_file = Path('/app/backend/server.py')
    content = server_file.read_text(encoding='utf-8')
    
    # Atualizar FastAPI title
    content = re.sub(
        r'app = FastAPI\(title="Transmill API", version="[\d\.]+"',
        f'app = FastAPI(title="Transmill API", version="{version}"',
        content
    )
    
    # Atualizar health check
    content = re.sub(
        r'"version": "[\d\.]+"',
        f'"version": "{version}"',
        content
    )
    
    server_file.write_text(content, encoding='utf-8')
    print(f"{GREEN}✅ Backend (server.py) atualizado{RESET}")

def update_frontend_version(version):
    """Atualiza versão no frontend (App.js)"""
    app_file = Path('/app/frontend/src/App.js')
    content = app_file.read_text(encoding='utf-8')
    
    # Atualizar FRONTEND_VERSION
    content = re.sub(
        r"const FRONTEND_VERSION = 'v[\d\.]+'",
        f"const FRONTEND_VERSION = 'v{version}'",
        content
    )
    
    # Atualizar console.log da versão
    content = re.sub(
        r"console\.log\('✅ VERSÃO FRONTEND: v[\d\.]+",
        f"console.log('✅ VERSÃO FRONTEND: v{version}",
        content
    )
    
    # Atualizar BUILD message
    content = re.sub(
        r"console\.log\('🚀 BUILD v[\d\.]+",
        f"console.log('🚀 BUILD v{version}",
        content
    )
    
    app_file.write_text(content, encoding='utf-8')
    print(f"{GREEN}✅ Frontend (App.js) atualizado{RESET}")

def show_version_summary(version):
    """Mostra resumo das atualizações"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}🎉 VERSÃO ATUALIZADA COM SUCESSO!{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"\n{YELLOW}📦 Nova Versão: v{version}{RESET}")
    print(f"\n{BLUE}Arquivos atualizados:{RESET}")
    print(f"  • /app/VERSION.txt")
    print(f"  • /app/backend/server.py")
    print(f"  • /app/frontend/src/App.js")
    print(f"\n{YELLOW}🚀 Próximos passos:{RESET}")
    print(f"  1. Revisar as mudanças: git diff")
    print(f"  2. Testar localmente")
    print(f"  3. Commit: git add . && git commit -m 'v{version}'")
    print(f"  4. Deploy em produção")
    print(f"\n{BLUE}{'='*60}{RESET}\n")

def main():
    if len(sys.argv) < 3:
        print(f"{RED}❌ Uso incorreto!{RESET}")
        print(f"\n{YELLOW}Uso:{RESET}")
        print(f'  python update_version.py <versão> "<mensagem>"')
        print(f"\n{YELLOW}Exemplos:{RESET}")
        print(f'  python update_version.py 2.8.1 "Correção de bugs"')
        print(f'  python update_version.py 2.9.0 "Nova feature: X"')
        print(f'  python update_version.py 3.0.0 "Breaking changes"')
        sys.exit(1)
    
    version = sys.argv[1].replace('v', '')  # Remove 'v' se existir
    message = ' '.join(sys.argv[2:])
    
    # Validar formato da versão
    if not re.match(r'^\d+\.\d+\.\d+$', version):
        print(f"{RED}❌ Formato de versão inválido!{RESET}")
        print(f"{YELLOW}Use o formato: X.Y.Z (exemplo: 2.8.1){RESET}")
        sys.exit(1)
    
    print(f"\n{BLUE}🔄 Atualizando versão do sistema...{RESET}\n")
    
    # Atualizar todos os arquivos
    update_version_txt(version, message)
    update_backend_version(version)
    update_frontend_version(version)
    
    # Mostrar resumo
    show_version_summary(version)

if __name__ == '__main__':
    main()
