"""
Script para configurar variáveis de ambiente Cloudinary
Lê do arquivo .env - NÃO usa valores hardcoded
"""
import os

# Carregar do .env se disponível
from dotenv import load_dotenv
load_dotenv()

# Verificar se as variáveis estão configuradas (vindas do .env)
cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
api_key = os.environ.get('CLOUDINARY_API_KEY', '')
api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')

if cloud_name and api_key and api_secret:
    print(f"✅ Cloudinary configurado via ambiente: cloud_name={cloud_name}")
else:
    print("⚠️ Cloudinary não configurado - verifique as variáveis de ambiente no .env")
