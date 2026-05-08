"""
Módulo de Setup - Transmill API
Endpoints administrativos para configuração, manutenção e versão
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse
from passlib.hash import bcrypt
from datetime import datetime, timezone
import logging
import uuid
import os
import random
import string

logger = logging.getLogger(__name__)

# Router
setup_router = APIRouter(prefix="/api", tags=["setup"])

# Database
_db = None

def setup_setup_routes(db):
    """Configura as dependências do módulo setup"""
    global _db
    _db = db
    logger.info("✅ Setup routes configuradas")


# ============================================
# VERSION ENDPOINTS
# ============================================

@setup_router.get("/version")
@setup_router.get("/labelview/version-check")
async def get_version():
    """Retorna a versão atual do sistema"""
    try:
        version_file = os.path.join(os.path.dirname(__file__), '..', 'VERSION.txt')
        if os.path.exists(version_file):
            with open(version_file, 'r') as f:
                version = f.read().strip()
        else:
            version = "v2.38.35"
        
        return {
            "version": version,
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {"version": "unknown", "error": str(e)}


@setup_router.get("/setup/update-version/{nova_versao}")
async def update_version(nova_versao: str):
    """Atualiza a versão no arquivo VERSION.txt"""
    try:
        version_file = os.path.join(os.path.dirname(__file__), '..', 'VERSION.txt')
        
        # Garantir formato correto
        if not nova_versao.startswith('v'):
            nova_versao = f"v{nova_versao}"
        
        with open(version_file, 'w') as f:
            f.write(nova_versao)
        
        logger.info(f"✅ Versão atualizada para: {nova_versao}")
        
        return {
            "success": True,
            "message": f"Versão atualizada para {nova_versao}",
            "version": nova_versao
        }
    except Exception as e:
        logger.error(f"Erro ao atualizar versão: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# SETUP ENDPOINTS
# ============================================

@setup_router.post("/setup/create-labelview-master")
async def create_labelview_master_endpoint():
    """Cria usuário Master Labelview em produção"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        email = "labelview@transmill.com"
        password = "demo123"
        
        existing_user = await _db.users.find_one({"email": email})
        
        if existing_user:
            return {
                "success": True,
                "message": f"Usuário {email} já existe",
                "user_id": existing_user.get('id'),
                "user_type": existing_user.get('user_type')
            }
        
        user_id = str(uuid.uuid4())
        password_hash = bcrypt.hash(password)
        now = datetime.now(timezone.utc).isoformat()
        
        user = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": "Labelview Master",
            "user_type": "labelview_master",
            "is_labelview_master": True,
            "status": "active",
            "phone": "",
            "created_at": now,
            "updated_at": now
        }
        
        await _db.users.insert_one(user)
        
        logger.info(f"✅ Usuário Master Labelview criado: {email}")
        
        return {
            "success": True,
            "message": "Usuário Master Labelview criado com sucesso!",
            "user_id": user_id,
            "email": email,
            "password": password
        }
        
    except Exception as e:
        logger.error(f"Erro ao criar master: {e}")
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/check-urls")
async def check_urls():
    """Verifica as URLs de configuração do sistema"""
    return {
        "success": True,
        "urls": {
            "MONGO_URL": "SET" if os.environ.get('MONGO_URL') else "NOT_SET",
            "DB_NAME": os.environ.get('DB_NAME', 'NOT_SET'),
            "CLOUDINARY_CLOUD_NAME": "SET" if os.environ.get('CLOUDINARY_CLOUD_NAME') else "NOT_SET",
            "CLOUDINARY_API_KEY": "SET" if os.environ.get('CLOUDINARY_API_KEY') else "NOT_SET",
            "VAPID_PUBLIC_KEY": "SET" if os.environ.get('VAPID_PUBLIC_KEY') else "DEFAULT",
            "JWT_SECRET": "SET" if os.environ.get('JWT_SECRET') else "DEFAULT"
        }
    }


@setup_router.get("/setup/list-users-referral")
async def list_users_referral():
    """Lista usuários com seus códigos de referência"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        users = await _db.users.find(
            {},
            {"_id": 0, "email": 1, "full_name": 1, "referral_code": 1, "user_type": 1}
        ).to_list(length=100)
        
        return {
            "success": True,
            "users": users,
            "total": len(users)
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/fix-referral-codes")
@setup_router.post("/setup/fix-referral-codes")
async def fix_referral_codes():
    """Gera códigos de referência para usuários que não possuem"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        # Buscar usuários sem referral_code
        users_sem_codigo = await _db.users.find({
            "$or": [
                {"referral_code": {"$exists": False}},
                {"referral_code": None},
                {"referral_code": ""}
            ]
        }).to_list(length=1000)
        
        updated = 0
        for user in users_sem_codigo:
            # Gerar código único
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            
            await _db.users.update_one(
                {"id": user['id']},
                {"$set": {"referral_code": codigo}}
            )
            updated += 1
        
        return {
            "success": True,
            "message": f"Códigos gerados para {updated} usuários",
            "updated": updated
        }
        
    except Exception as e:
        logger.error(f"Erro ao gerar referral codes: {e}")
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/set-cnpj/{email}/{cnpj}")
async def set_cnpj(email: str, cnpj: str):
    """Define o CNPJ de um usuário"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        result = await _db.users.update_one(
            {"email": email},
            {"$set": {"cnpj": cnpj, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": f"CNPJ {cnpj} definido para {email}"}
        else:
            return {"success": False, "error": "Usuário não encontrado"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/fix-cnpj/{email}/{novo_cnpj}")
async def fix_cnpj(email: str, novo_cnpj: str):
    """Corrige o CNPJ de um usuário"""
    return await set_cnpj(email, novo_cnpj)


@setup_router.get("/setup/set-cpf/{email}/{cpf}")
async def set_cpf(email: str, cpf: str):
    """Define o CPF de um usuário"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        result = await _db.users.update_one(
            {"email": email},
            {"$set": {"cpf": cpf, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": f"CPF {cpf} definido para {email}"}
        else:
            return {"success": False, "error": "Usuário não encontrado"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/fix-cpf/{email}/{novo_cpf}")
async def fix_cpf(email: str, novo_cpf: str):
    """Corrige o CPF de um usuário"""
    return await set_cpf(email, novo_cpf)


@setup_router.post("/setup/update-unidade-data")
async def update_unidade_data(request: Request):
    """Atualiza dados de uma unidade"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        unidade_id = data.get('unidade_id')
        
        if not unidade_id:
            return {"success": False, "error": "unidade_id é obrigatório"}
        
        update_data = {k: v for k, v in data.items() if k != 'unidade_id' and v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await _db.labelview_unidades.update_one(
            {"id": unidade_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Unidade atualizada"}
        else:
            return {"success": False, "error": "Unidade não encontrada"}
            
    except Exception as e:
        logger.error(f"Erro ao atualizar unidade: {e}")
        return {"success": False, "error": str(e)}


@setup_router.get("/setup/update-unidade/{email}")
async def update_unidade_by_email(email: str):
    """Busca dados de unidade pelo email do usuário"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user = await _db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            return {"success": False, "error": "Usuário não encontrado"}
        
        unidade_id = user.get('unidade_id') or user.get('id')
        
        unidade = await _db.labelview_unidades.find_one({"id": unidade_id}, {"_id": 0})
        
        return {
            "success": True,
            "user": {k: v for k, v in user.items() if k != 'password_hash'},
            "unidade": unidade
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
