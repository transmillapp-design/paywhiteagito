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
    resource_type: str = "auto"
) -> Optional[str]:
    """
    Upload de arquivo para o Cloudinary
    
    Args:
        file_content: Conteúdo do arquivo em bytes
        filename: Nome do arquivo
        folder: Pasta no Cloudinary (padrão: labelview)
        resource_type: Tipo de recurso (auto, image, raw, video)
    
    Returns:
        URL do arquivo no Cloudinary ou None em caso de erro
    
    Raises:
        Exception: Se as credenciais do Cloudinary não estiverem configuradas
    """
    # Verificar se as credenciais estão configuradas
    if not _cloud_name or not _api_key or not _api_secret:
        error_msg = f"Cloudinary não configurado: cloud_name={'SET' if _cloud_name else 'MISSING'}, api_key={'SET' if _api_key else 'MISSING'}, api_secret={'SET' if _api_secret else 'MISSING'}"
        logger.error(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    try:
        logger.info(f"📤 Iniciando upload para Cloudinary: {filename} ({len(file_content)} bytes)")
        
        # Upload para Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            public_id=filename.rsplit('.', 1)[0],  # Remove extensão para public_id
            overwrite=True,
            invalidate=True
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
