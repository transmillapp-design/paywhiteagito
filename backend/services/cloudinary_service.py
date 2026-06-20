"""
Serviço para upload de arquivos no Cloudinary
"""
import os
import cloudinary
import cloudinary.uploader
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Configurar Cloudinary
_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
_api_key = os.getenv('CLOUDINARY_API_KEY')
_api_secret = os.getenv('CLOUDINARY_API_SECRET')

logger.info(f"☁️ Cloudinary config: cloud_name={'SET' if _cloud_name else 'NOT SET'}, api_key={'SET' if _api_key else 'NOT SET'}, api_secret={'SET' if _api_secret else 'NOT SET'}")

cloudinary.config(
    cloud_name=_cloud_name,
    api_key=_api_key,
    api_secret=_api_secret,
    secure=True
)

async def upload_file_to_cloudinary(
    file_content: bytes,
    filename: str,
    folder: str = "labelview",
    resource_type: str = "auto",
    cloud_name: str = None,
    api_key: str = None,
    api_secret: str = None
) -> Optional[str]:
    """
    Upload de arquivo para o Cloudinary.
    Aceita credenciais por chamada (white label); se não informadas, usa o .env global.
    """
    # Resolver credenciais: white label -> fallback .env
    use_cloud = cloud_name or _cloud_name
    use_key = api_key or _api_key
    use_secret = api_secret or _api_secret

    # Verificar se as credenciais estão configuradas
    if not use_cloud or not use_key or not use_secret:
        error_msg = f"Cloudinary não configurado: cloud_name={'SET' if use_cloud else 'MISSING'}, api_key={'SET' if use_key else 'MISSING'}, api_secret={'SET' if use_secret else 'MISSING'}"
        logger.error(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    try:
        logger.info(f"📤 Iniciando upload para Cloudinary: {filename} ({len(file_content)} bytes)")
        
        # Upload para Cloudinary (config por chamada para suportar white label)
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            public_id=filename.rsplit('.', 1)[0],  # Remove extensão para public_id
            overwrite=True,
            invalidate=True,
            cloud_name=use_cloud,
            api_key=use_key,
            api_secret=use_secret
        )
        
        url = result.get('secure_url')
        logger.info(f"✅ Upload concluído: {url}")
        
        return url
        
    except Exception as e:
        logger.error(f"❌ Erro ao fazer upload para Cloudinary: {str(e)}", exc_info=True)
        raise  # Propagar o erro para o chamador


async def delete_file_from_cloudinary(public_id: str, resource_type: str = "image") -> bool:
    """
    Deleta arquivo do Cloudinary
    
    Args:
        public_id: ID público do arquivo no Cloudinary
        resource_type: Tipo de recurso (image, raw, video)
    
    Returns:
        True se deletado com sucesso, False caso contrário
    """
    try:
        logger.info(f"🗑️ Deletando arquivo do Cloudinary: {public_id}")
        
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        
        if result.get('result') == 'ok':
            logger.info(f"✅ Arquivo deletado com sucesso")
            return True
        else:
            logger.warning(f"⚠️ Resultado da deleção: {result}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro ao deletar arquivo do Cloudinary: {str(e)}", exc_info=True)
        return False
