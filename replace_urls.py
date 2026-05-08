#!/usr/bin/env python3
"""
Script para substituir agitomil.com.br por agitomil.com.br
"""
import os
import re

def replace_in_file(filepath, old_text, new_text):
    """Substituir texto em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_text in content:
            new_content = content.replace(old_text, new_text)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"❌ Erro ao processar {filepath}: {e}")
        return False

def find_and_replace(root_dir, old_text, new_text, extensions):
    """Encontrar e substituir em todos os arquivos"""
    replaced_files = []
    
    for root, dirs, files in os.walk(root_dir):
        # Pular diretórios que não devem ser modificados
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'venv', '.venv', 'build', 'dist']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                if replace_in_file(filepath, old_text, new_text):
                    replaced_files.append(filepath)
    
    return replaced_files

if __name__ == "__main__":
    print("🔄 Iniciando substituição de URLs...\n")
    
    # Diretórios para processar
    directories = ['/app/frontend/src', '/app/backend', '/app']
    
    # Extensões de arquivo para processar
    extensions = ['.js', '.jsx', '.py', '.env', '.json', '.md', '.txt', '.ts', '.tsx']
    
    old_url = 'agitomil.com.br'
    new_url = 'agitomil.com.br'
    
    total_files = []
    
    for directory in directories:
        if os.path.exists(directory):
            print(f"📁 Processando: {directory}")
            replaced = find_and_replace(directory, old_url, new_url, extensions)
            total_files.extend(replaced)
            print(f"   ✅ {len(replaced)} arquivos modificados\n")
    
    print(f"\n{'='*60}")
    print(f"✅ SUBSTITUIÇÃO CONCLUÍDA!")
    print(f"{'='*60}")
    print(f"\n📊 Total de arquivos modificados: {len(total_files)}\n")
    
    if total_files:
        print("📝 Arquivos modificados:")
        for filepath in sorted(total_files):
            # Mostrar caminho relativo
            rel_path = filepath.replace('/app/', '')
            print(f"   • {rel_path}")
    
    print(f"\n{'='*60}")
    print(f"🎯 Todas as ocorrências de '{old_url}' foram substituídas por '{new_url}'")
    print(f"{'='*60}\n")
