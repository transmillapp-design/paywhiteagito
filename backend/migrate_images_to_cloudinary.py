"""
Script de Migração de Imagens para Cloudinary
Migra todas as imagens base64 do MongoDB para Cloudinary
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')
import set_cloudinary_env

from motor.motor_asyncio import AsyncIOMotorClient
from services.cloudinary_service import upload_file_to_cloudinary
import base64
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()

# Conectar ao MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'transmill')
db = client[db_name]

def base64_to_bytes(base64_string: str) -> bytes:
    """Converte string base64 para bytes"""
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    return base64.b64decode(base64_string)

def is_base64_image(value):
    """Verifica se o valor é uma imagem base64"""
    if not isinstance(value, str):
        return False
    return value.startswith('data:image/') and 'base64,' in value

async def migrate_user_images():
    """Migra imagens de usuários do MongoDB para Cloudinary"""
    
    logger.info("🚀 Iniciando migração de imagens para Cloudinary")
    
    # Buscar todos os usuários
    users = await db.users.find({}).to_list(None)
    logger.info(f"📊 Total de usuários encontrados: {len(users)}")
    
    migrated_count = 0
    error_count = 0
    
    for user in users:
        user_id = user.get('id')
        email = user.get('email')
        logger.info(f"\n👤 Processando usuário: {email} (ID: {user_id})")
        
        update_fields = {}
        
        try:
            # Migrar profile_image
            if 'profile_image' in user and is_base64_image(user['profile_image']):
                logger.info(f"  📸 Migrando profile_image...")
                image_bytes = base64_to_bytes(user['profile_image'])
                cloudinary_url = await upload_file_to_cloudinary(
                    file_content=image_bytes,
                    filename=f"profile_{user_id}",
                    folder="users/profile",
                    resource_type="image"
                )
                if cloudinary_url:
                    update_fields['profile_image'] = cloudinary_url
                    logger.info(f"  ✅ profile_image migrado: {cloudinary_url}")
                else:
                    logger.error(f"  ❌ Erro ao migrar profile_image")
                    error_count += 1
            
            # Migrar rg_front
            if 'rg_front' in user and is_base64_image(user['rg_front']):
                logger.info(f"  📄 Migrando rg_front...")
                image_bytes = base64_to_bytes(user['rg_front'])
                cloudinary_url = await upload_file_to_cloudinary(
                    file_content=image_bytes,
                    filename=f"rg_front_{user_id}",
                    folder="users/documents",
                    resource_type="image"
                )
                if cloudinary_url:
                    update_fields['rg_front'] = cloudinary_url
                    logger.info(f"  ✅ rg_front migrado: {cloudinary_url}")
                else:
                    logger.error(f"  ❌ Erro ao migrar rg_front")
                    error_count += 1
            
            # Migrar rg_back
            if 'rg_back' in user and is_base64_image(user['rg_back']):
                logger.info(f"  📄 Migrando rg_back...")
                image_bytes = base64_to_bytes(user['rg_back'])
                cloudinary_url = await upload_file_to_cloudinary(
                    file_content=image_bytes,
                    filename=f"rg_back_{user_id}",
                    folder="users/documents",
                    resource_type="image"
                )
                if cloudinary_url:
                    update_fields['rg_back'] = cloudinary_url
                    logger.info(f"  ✅ rg_back migrado: {cloudinary_url}")
                else:
                    logger.error(f"  ❌ Erro ao migrar rg_back")
                    error_count += 1
            
            # Migrar admin_rg_front
            if 'admin_rg_front' in user and is_base64_image(user['admin_rg_front']):
                logger.info(f"  📄 Migrando admin_rg_front...")
                image_bytes = base64_to_bytes(user['admin_rg_front'])
                cloudinary_url = await upload_file_to_cloudinary(
                    file_content=image_bytes,
                    filename=f"admin_rg_front_{user_id}",
                    folder="users/documents",
                    resource_type="image"
                )
                if cloudinary_url:
                    update_fields['admin_rg_front'] = cloudinary_url
                    logger.info(f"  ✅ admin_rg_front migrado: {cloudinary_url}")
                else:
                    logger.error(f"  ❌ Erro ao migrar admin_rg_front")
                    error_count += 1
            
            # Migrar admin_rg_back
            if 'admin_rg_back' in user and is_base64_image(user['admin_rg_back']):
                logger.info(f"  📄 Migrando admin_rg_back...")
                image_bytes = base64_to_bytes(user['admin_rg_back'])
                cloudinary_url = await upload_file_to_cloudinary(
                    file_content=image_bytes,
                    filename=f"admin_rg_back_{user_id}",
                    folder="users/documents",
                    resource_type="image"
                )
                if cloudinary_url:
                    update_fields['admin_rg_back'] = cloudinary_url
                    logger.info(f"  ✅ admin_rg_back migrado: {cloudinary_url}")
                else:
                    logger.error(f"  ❌ Erro ao migrar admin_rg_back")
                    error_count += 1
            
            # Atualizar usuário no banco se houver campos migrados
            if update_fields:
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": update_fields}
                )
                migrated_count += 1
                logger.info(f"  ✅ Usuário atualizado com {len(update_fields)} imagens migradas")
            else:
                logger.info(f"  ℹ️  Nenhuma imagem base64 encontrada para migrar")
        
        except Exception as e:
            logger.error(f"  ❌ Erro ao processar usuário {email}: {str(e)}", exc_info=True)
            error_count += 1
            continue
    
    logger.info(f"\n{'='*80}")
    logger.info(f"✅ MIGRAÇÃO CONCLUÍDA!")
    logger.info(f"📊 Total de usuários: {len(users)}")
    logger.info(f"✅ Usuários migrados: {migrated_count}")
    logger.info(f"❌ Erros: {error_count}")
    logger.info(f"{'='*80}\n")

async def main():
    """Função principal"""
    try:
        await migrate_user_images()
    except Exception as e:
        logger.error(f"❌ Erro fatal na migração: {str(e)}", exc_info=True)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
