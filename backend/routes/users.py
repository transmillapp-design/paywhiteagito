"""
Módulo Users - Transmill API
Endpoints para perfil de usuário, saldo, documentos
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.hash import bcrypt
from datetime import datetime, timezone
import logging
import uuid
import jwt
import os
import base64

logger = logging.getLogger(__name__)

# Router
users_router = APIRouter(prefix="/api/user", tags=["users"])

# Security
security = HTTPBearer()

# Configurações
_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"
_cloudinary_upload = None


def setup_users_routes(db, cloudinary_upload_fn=None):
    """Configura as dependências do módulo users"""
    global _db, _SECRET_KEY, _cloudinary_upload
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    _cloudinary_upload = cloudinary_upload_fn
    logger.info("✅ Users routes configuradas")


async def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extrai e valida usuário do token JWT"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_doc = await _db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        user_doc.pop('_id', None)
        user_doc.pop('password_hash', None)
        return user_doc
        
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


# ============================================
# ENDPOINTS - PERFIL
# ============================================

@users_router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_user_from_token)):
    """Retorna o perfil completo do usuário logado"""
    try:
        user_id = current_user.get('id')
        
        # Buscar usuário com dados completos
        user = await _db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return {
            "success": True,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.put("/profile-data")
async def update_user_profile_data(request_data: dict, current_user: dict = Depends(get_user_from_token)):
    """Atualiza dados do perfil do usuário"""
    try:
        user_id = current_user.get('id')
        
        # Campos permitidos para atualização
        allowed_fields = [
            'full_name', 'phone', 'cpf', 'cnpj', 'birth_date',
            'address', 'city', 'state', 'zip_code', 'country',
            'pix_key', 'pix_key_type', 'bio', 'occupation'
        ]
        
        update_data = {k: v for k, v in request_data.items() if k in allowed_fields and v is not None}
        
        if not update_data:
            return {"success": False, "error": "Nenhum campo válido para atualizar"}
        
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await _db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Perfil atualizado com sucesso"}
        else:
            return {"success": False, "error": "Nenhuma alteração realizada"}
        
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.put("/password")
async def update_user_password(request_data: dict, current_user: dict = Depends(get_user_from_token)):
    """Atualiza a senha do usuário"""
    try:
        user_id = current_user.get('id')
        current_password = request_data.get('current_password')
        new_password = request_data.get('new_password')
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Senha atual e nova são obrigatórias")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")
        
        # Buscar usuário com senha
        user = await _db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Verificar senha atual
        stored_hash = user.get('password_hash') or user.get('hashed_password')
        if not bcrypt.verify(current_password, stored_hash):
            raise HTTPException(status_code=401, detail="Senha atual incorreta")
        
        # Atualizar senha
        new_hash = bcrypt.hash(new_password)
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "password_hash": new_hash,
                "hashed_password": new_hash,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": "Senha atualizada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar senha: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - SALDO
# ============================================

@users_router.get("/balance")
async def get_user_balance(current_user: dict = Depends(get_user_from_token)):
    """Retorna o saldo atual do usuário"""
    try:
        user_id = current_user.get('id')
        
        # Buscar saldo
        user = await _db.users.find_one({"id": user_id}, {"_id": 0, "balance": 1, "pending_balance": 1})
        
        balance = user.get('balance', 0) if user else 0
        pending = user.get('pending_balance', 0) if user else 0
        
        return {
            "success": True,
            "balance": balance,
            "pending_balance": pending,
            "available_balance": balance,
            "currency": "BRL"
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar saldo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - IMAGEM DE PERFIL
# ============================================

@users_router.put("/profile-image")
async def update_profile_image_url(request_data: dict, current_user: dict = Depends(get_user_from_token)):
    """Atualiza a URL da imagem de perfil"""
    try:
        user_id = current_user.get('id')
        image_url = request_data.get('profile_image_url') or request_data.get('image_url')
        
        if not image_url:
            raise HTTPException(status_code=400, detail="URL da imagem é obrigatória")
        
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "profile_image_url": image_url,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": "Imagem atualizada", "profile_image_url": image_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar imagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.post("/profile-image-upload")
async def upload_profile_image(request_data: dict, current_user: dict = Depends(get_user_from_token)):
    """Upload de imagem de perfil via base64"""
    try:
        user_id = current_user.get('id')
        image_base64 = request_data.get('image') or request_data.get('image_base64')
        
        if not image_base64:
            raise HTTPException(status_code=400, detail="Imagem base64 é obrigatória")
        
        # Se temos cloudinary configurado, fazer upload
        if _cloudinary_upload:
            try:
                result = _cloudinary_upload(
                    image_base64,
                    folder=f"transmill/profiles/{user_id}",
                    public_id=f"profile_{user_id}",
                    overwrite=True
                )
                image_url = result.get('secure_url') or result.get('url')
            except Exception as e:
                logger.error(f"Erro no upload cloudinary: {e}")
                # Fallback: salvar base64 diretamente
                image_url = image_base64
        else:
            image_url = image_base64
        
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "profile_image_url": image_url,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": "Imagem enviada", "profile_image_url": image_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - DOCUMENTOS
# ============================================

@users_router.put("/documents")
async def update_user_documents(request_data: dict, current_user: dict = Depends(get_user_from_token)):
    """Atualiza documentos do usuário (KYC)"""
    try:
        user_id = current_user.get('id')
        
        documents = {
            "document_front_url": request_data.get('document_front_url'),
            "document_back_url": request_data.get('document_back_url'),
            "selfie_url": request_data.get('selfie_url'),
            "proof_of_address_url": request_data.get('proof_of_address_url'),
            "kyc_status": "pending",
            "kyc_submitted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remover campos vazios
        documents = {k: v for k, v in documents.items() if v is not None}
        
        await _db.users.update_one(
            {"id": user_id},
            {"$set": documents}
        )
        
        return {"success": True, "message": "Documentos enviados para análise"}
        
    except Exception as e:
        logger.error(f"Erro ao atualizar documentos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.get("/kyc-status")
async def get_kyc_status(current_user: dict = Depends(get_user_from_token)):
    """Retorna o status de verificação KYC do usuário"""
    try:
        user_id = current_user.get('id')
        
        user = await _db.users.find_one(
            {"id": user_id},
            {"_id": 0, "kyc_status": 1, "kyc_submitted_at": 1, "kyc_verified_at": 1, "kyc_rejection_reason": 1}
        )
        
        return {
            "success": True,
            "kyc_status": user.get('kyc_status', 'not_submitted'),
            "submitted_at": user.get('kyc_submitted_at'),
            "verified_at": user.get('kyc_verified_at'),
            "rejection_reason": user.get('kyc_rejection_reason')
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar KYC: {e}")
        raise HTTPException(status_code=500, detail=str(e))
