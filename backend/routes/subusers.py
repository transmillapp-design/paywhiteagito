"""
Módulo Subusers (Colaboradores) - Transmill API
Gerenciamento de sub-usuários para lojistas e contas master

Endpoints:
- POST /api/subusers - Criar colaborador
- GET /api/subusers - Listar colaboradores
- GET /api/subusers/{id} - Obter colaborador
- PUT /api/subusers/{id} - Atualizar colaborador
- DELETE /api/subusers/{id} - Remover colaborador
- POST /api/auth/subuser-login - Login de colaborador
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
from passlib.hash import bcrypt
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Subusers"])

# Dependências injetadas
_db = None
_get_current_user = None
_create_access_token = None


def init_subusers_routes(database, auth_dependency, token_fn):
    """Inicializa as rotas do módulo subusers"""
    global _db, _get_current_user, _create_access_token
    _db = database
    _get_current_user = auth_dependency
    _create_access_token = token_fn
    logger.info("✅ Subusers routes configuradas")


# ============================================
# MODELOS
# ============================================

class SubUserPermissions(BaseModel):
    """Permissões granulares para sub-usuários"""
    can_create_sales: bool = False
    can_view_sales: bool = False
    can_cancel_sales: bool = False
    can_view_balance: bool = False
    can_make_withdrawals: bool = False
    can_view_transactions: bool = False
    can_manage_products: bool = False
    can_manage_services: bool = False
    can_view_customers: bool = False
    can_manage_customers: bool = False
    can_view_reports: bool = False
    can_export_data: bool = False
    can_manage_settings: bool = False
    can_manage_subusers: bool = False


class SubUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: str  # 'vendedor', 'gerente', 'financeiro', 'admin', 'custom'
    permissions: Optional[SubUserPermissions] = None
    is_active: bool = True


class SubUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[SubUserPermissions] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class SubUserLogin(BaseModel):
    email: EmailStr
    password: str


# Permissões pré-definidas por role
ROLE_PERMISSIONS = {
    "vendedor": SubUserPermissions(
        can_create_sales=True,
        can_view_sales=True,
        can_view_customers=True,
        can_view_balance=True
    ),
    "gerente": SubUserPermissions(
        can_create_sales=True,
        can_view_sales=True,
        can_cancel_sales=True,
        can_view_balance=True,
        can_view_transactions=True,
        can_view_customers=True,
        can_manage_customers=True,
        can_manage_products=True,
        can_manage_services=True,
        can_view_reports=True,
        can_export_data=True
    ),
    "financeiro": SubUserPermissions(
        can_view_balance=True,
        can_make_withdrawals=True,
        can_view_transactions=True,
        can_view_sales=True,
        can_view_reports=True,
        can_export_data=True
    ),
    "admin": SubUserPermissions(
        can_create_sales=True,
        can_view_sales=True,
        can_cancel_sales=True,
        can_view_balance=True,
        can_make_withdrawals=True,
        can_view_transactions=True,
        can_manage_products=True,
        can_manage_services=True,
        can_view_customers=True,
        can_manage_customers=True,
        can_view_reports=True,
        can_export_data=True,
        can_manage_settings=True,
        can_manage_subusers=True
    )
}


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_user_from_request(request: Request):
    """Obtém usuário a partir do request"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if _get_current_user:
            return await _get_current_user(token)
    return None


# ============================================
# ENDPOINTS
# ============================================

@router.post("/subusers")
async def create_subuser(request: Request, subuser_data: SubUserCreate):
    """
    Criar sub-usuário (colaborador) - Apenas Master e Lojistas
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Não autorizado")
        
        user_type = current_user.get('user_type')
        if user_type not in ['master', 'lojista']:
            raise HTTPException(
                status_code=403, 
                detail="Apenas contas Master e Lojistas podem criar sub-usuários"
            )
        
        user_id = current_user.get('id')
        user_email = current_user.get('email')
        
        # Verificar se email já existe
        existing_user = await _db.users.find_one({"email": subuser_data.email})
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Este email já está cadastrado como usuário principal"
            )
        
        existing_subuser = await _db.subusers.find_one({
            "email": subuser_data.email,
            "parent_user_id": user_id
        })
        if existing_subuser:
            raise HTTPException(
                status_code=400, 
                detail="Este email já está cadastrado como colaborador"
            )
        
        # Definir permissões
        if subuser_data.role in ROLE_PERMISSIONS and not subuser_data.permissions:
            permissions = ROLE_PERMISSIONS[subuser_data.role].dict()
        elif subuser_data.permissions:
            permissions = subuser_data.permissions.dict()
        else:
            permissions = ROLE_PERMISSIONS["vendedor"].dict()
        
        # Criar sub-usuário
        subuser_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        subuser = {
            "id": subuser_id,
            "parent_user_id": user_id,
            "parent_user_type": user_type,
            "parent_email": user_email,
            "full_name": subuser_data.full_name,
            "email": subuser_data.email,
            "phone": subuser_data.phone,
            "password_hash": bcrypt.hash(subuser_data.password),
            "role": subuser_data.role,
            "permissions": permissions,
            "is_active": subuser_data.is_active,
            "created_at": now,
            "updated_at": now,
            "created_by": user_id,
            "last_login": None
        }
        
        await _db.subusers.insert_one(subuser)
        
        logger.info(f"✅ [SUBUSER] Criado: {subuser_data.email} por {user_email}")
        
        return {
            "success": True,
            "message": f"Colaborador {subuser_data.full_name} criado com sucesso",
            "subuser_id": subuser_id,
            "subuser": {
                "id": subuser_id,
                "full_name": subuser_data.full_name,
                "email": subuser_data.email,
                "role": subuser_data.role,
                "permissions": permissions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro ao criar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/subusers")
async def list_subusers(request: Request):
    """
    Listar todos os sub-usuários do usuário logado
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Não autorizado")
        
        user_id = current_user.get('id')
        
        subusers = await _db.subusers.find(
            {"parent_user_id": user_id}
        ).sort("created_at", -1).to_list(length=100)
        
        result = []
        for subuser in subusers:
            if '_id' in subuser:
                del subuser['_id']
            if 'password_hash' in subuser:
                del subuser['password_hash']
            # Converter datas
            if subuser.get('created_at'):
                subuser['created_at'] = subuser['created_at'].isoformat() if hasattr(subuser['created_at'], 'isoformat') else str(subuser['created_at'])
            if subuser.get('updated_at'):
                subuser['updated_at'] = subuser['updated_at'].isoformat() if hasattr(subuser['updated_at'], 'isoformat') else str(subuser['updated_at'])
            if subuser.get('last_login'):
                subuser['last_login'] = subuser['last_login'].isoformat() if hasattr(subuser['last_login'], 'isoformat') else str(subuser['last_login'])
            result.append(subuser)
        
        return {
            "success": True,
            "subusers": result,
            "total": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro ao listar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/subusers/{subuser_id}")
async def get_subuser(request: Request, subuser_id: str):
    """
    Obter detalhes de um sub-usuário específico
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Não autorizado")
        
        user_id = current_user.get('id')
        
        subuser = await _db.subusers.find_one({
            "id": subuser_id,
            "parent_user_id": user_id
        })
        
        if not subuser:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        if '_id' in subuser:
            del subuser['_id']
        if 'password_hash' in subuser:
            del subuser['password_hash']
        
        return {
            "success": True,
            "subuser": subuser
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro ao buscar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.put("/subusers/{subuser_id}")
async def update_subuser(request: Request, subuser_id: str, update_data: SubUserUpdate):
    """
    Atualizar dados de um sub-usuário
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Não autorizado")
        
        user_id = current_user.get('id')
        
        # Verificar se subuser existe
        subuser = await _db.subusers.find_one({
            "id": subuser_id,
            "parent_user_id": user_id
        })
        
        if not subuser:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        # Construir update
        update_fields = {}
        
        if update_data.full_name:
            update_fields['full_name'] = update_data.full_name
        if update_data.phone:
            update_fields['phone'] = update_data.phone
        if update_data.role:
            update_fields['role'] = update_data.role
            # Atualizar permissões se mudou o role
            if update_data.role in ROLE_PERMISSIONS and not update_data.permissions:
                update_fields['permissions'] = ROLE_PERMISSIONS[update_data.role].dict()
        if update_data.permissions:
            update_fields['permissions'] = update_data.permissions.dict()
        if update_data.is_active is not None:
            update_fields['is_active'] = update_data.is_active
        if update_data.password:
            update_fields['password_hash'] = bcrypt.hash(update_data.password)
        
        if not update_fields:
            return {"success": True, "message": "Nenhuma alteração necessária"}
        
        update_fields['updated_at'] = datetime.now(timezone.utc)
        
        await _db.subusers.update_one(
            {"id": subuser_id},
            {"$set": update_fields}
        )
        
        logger.info(f"✅ [SUBUSER] Atualizado: {subuser_id}")
        
        return {
            "success": True,
            "message": "Colaborador atualizado com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro ao atualizar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.delete("/subusers/{subuser_id}")
async def delete_subuser(request: Request, subuser_id: str):
    """
    Remover um sub-usuário
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            raise HTTPException(status_code=401, detail="Não autorizado")
        
        user_id = current_user.get('id')
        
        # Verificar se subuser existe
        subuser = await _db.subusers.find_one({
            "id": subuser_id,
            "parent_user_id": user_id
        })
        
        if not subuser:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        # Deletar
        await _db.subusers.delete_one({"id": subuser_id})
        
        logger.info(f"✅ [SUBUSER] Removido: {subuser_id}")
        
        return {
            "success": True,
            "message": f"Colaborador {subuser.get('full_name')} removido com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro ao remover: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/auth/subuser-login")
async def subuser_login(login_data: SubUserLogin):
    """
    Login de sub-usuário (colaborador)
    """
    try:
        # Buscar subuser pelo email
        subuser = await _db.subusers.find_one({"email": login_data.email})
        
        if not subuser:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Verificar se está ativo
        if not subuser.get('is_active', True):
            raise HTTPException(
                status_code=403, 
                detail="Conta desativada. Entre em contato com seu administrador."
            )
        
        # Verificar senha
        if not bcrypt.verify(login_data.password, subuser.get('password_hash', '')):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Buscar dados do usuário pai
        parent_user = await _db.users.find_one({"id": subuser.get('parent_user_id')})
        if not parent_user:
            raise HTTPException(status_code=404, detail="Conta principal não encontrada")
        
        # Atualizar último login
        await _db.subusers.update_one(
            {"id": subuser.get('id')},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        # Criar token (usando ID do parent com flag de subuser)
        token_data = {
            "sub": subuser.get('parent_user_id'),  # ID do usuário pai
            "subuser_id": subuser.get('id'),
            "subuser_role": subuser.get('role'),
            "is_subuser": True
        }
        
        access_token = _create_access_token(data=token_data)
        
        logger.info(f"✅ [SUBUSER] Login: {login_data.email}")
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": subuser.get('id'),
                "full_name": subuser.get('full_name'),
                "email": subuser.get('email'),
                "role": subuser.get('role'),
                "permissions": subuser.get('permissions', {}),
                "is_subuser": True,
                "parent_user_id": subuser.get('parent_user_id'),
                "parent_email": subuser.get('parent_email'),
                "user_type": parent_user.get('user_type')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [SUBUSER] Erro no login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
