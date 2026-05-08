"""
Merchant Routes - Transmill API
Endpoints para lojistas: configurações, equipe, produtos, categorias, catálogo.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
import logging
from routes.auth_utils import get_user_from_request

logger = logging.getLogger(__name__)

merchant_router = APIRouter(prefix="/merchant", tags=["Merchant"])

db = None

def set_db(database):
    global db
    db = database

def set_auth_dependency(auth_func):
    pass  # Auth now handled via get_user_from_request

def check_merchant_access(user):
    """Verifica se o usuário é um lojista"""
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    user_data = user._data if hasattr(user, '_data') else user
    if user_data.get('user_type') != 'lojista':
        raise HTTPException(status_code=403, detail="Acesso apenas para lojistas")
    return True

# ============================================
# CONFIGURAÇÕES DO LOJISTA
# ============================================

@merchant_router.post("/cashback-rate")
async def update_cashback_rate(
    data: dict,
    request: Request = None
):
    """Atualiza a taxa de cashback do lojista"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        rate = data.get('rate', 0)
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"cashback_rate": rate, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "message": "Taxa de cashback atualizada", "rate": rate}
    except Exception as e:
        logger.error(f"Erro ao atualizar cashback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.put("/store-settings")
async def update_store_settings(
    settings: dict,
    request: Request = None
):
    """Atualiza configurações da loja"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        update_fields = {}
        allowed_fields = [
            "company_name", "address", "city", "state", "neighborhood",
            "whatsapp", "business_segment", "google_maps_url", "menu_catalog_url",
            "opening_hours", "description", "logo_url", "profile_image"
        ]
        
        for field in allowed_fields:
            if field in settings:
                update_fields[field] = settings[field]
        
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_fields}
        )
        
        return {"success": True, "message": "Configurações atualizadas"}
    except Exception as e:
        logger.error(f"Erro ao atualizar configurações: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# EQUIPE DO LOJISTA
# ============================================

@merchant_router.post("/team")
async def add_team_member(
    member_data: dict,
    request: Request = None
):
    """Adiciona um membro à equipe do lojista"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        member = {
            "id": str(uuid4()),
            "merchant_id": user_id,
            "name": member_data.get("name"),
            "email": member_data.get("email"),
            "role": member_data.get("role", "vendedor"),
            "permissions": member_data.get("permissions", []),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.merchant_team.insert_one(member)
        if "_id" in member:
            del member["_id"]
        
        return {"success": True, "member": member}
    except Exception as e:
        logger.error(f"Erro ao adicionar membro: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.get("/team")
async def get_team_members(request: Request = None):
    current_user = await get_user_from_request(request)
    """Lista membros da equipe do lojista"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        members = await db.merchant_team.find(
            {"merchant_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return {"success": True, "members": members, "total": len(members)}
    except Exception as e:
        logger.error(f"Erro ao listar equipe: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.put("/team/{member_id}")
async def update_team_member(
    member_id: str,
    member_data: dict,
    request: Request = None
):
    """Atualiza um membro da equipe"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        update_fields = {}
        for field in ["name", "email", "role", "permissions", "is_active"]:
            if field in member_data:
                update_fields[field] = member_data[field]
        
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.merchant_team.update_one(
            {"id": member_id, "merchant_id": user_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Membro não encontrado")
        
        return {"success": True, "message": "Membro atualizado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar membro: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.delete("/team/{member_id}")
async def delete_team_member(
    member_id: str,
    request: Request = None
):
    """Remove um membro da equipe"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        result = await db.merchant_team.delete_one(
            {"id": member_id, "merchant_id": user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Membro não encontrado")
        
        return {"success": True, "message": "Membro removido"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover membro: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.patch("/team/{member_id}/toggle")
async def toggle_team_member(
    member_id: str,
    request: Request = None
):
    """Ativa/desativa um membro da equipe"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        member = await db.merchant_team.find_one({"id": member_id, "merchant_id": user_id})
        if not member:
            raise HTTPException(status_code=404, detail="Membro não encontrado")
        
        new_status = not member.get("is_active", True)
        
        await db.merchant_team.update_one(
            {"id": member_id},
            {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "is_active": new_status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao alternar status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.get("/team/available-permissions")
async def get_available_permissions(request: Request = None):
    current_user = await get_user_from_request(request)
    """Lista permissões disponíveis para membros da equipe"""
    check_merchant_access(current_user)
    
    permissions = [
        {"id": "view_orders", "name": "Ver Pedidos", "description": "Visualizar pedidos da loja"},
        {"id": "manage_orders", "name": "Gerenciar Pedidos", "description": "Atualizar status de pedidos"},
        {"id": "view_products", "name": "Ver Produtos", "description": "Visualizar catálogo"},
        {"id": "manage_products", "name": "Gerenciar Produtos", "description": "Adicionar/editar produtos"},
        {"id": "view_reports", "name": "Ver Relatórios", "description": "Acessar relatórios de vendas"},
        {"id": "manage_cashback", "name": "Gerenciar Cashback", "description": "Configurar taxas de cashback"},
        {"id": "manage_team", "name": "Gerenciar Equipe", "description": "Adicionar/remover membros"}
    ]
    
    return {"success": True, "permissions": permissions}

# ============================================
# CATEGORIAS DE PRODUTOS
# ============================================

@merchant_router.post("/categories")
async def create_category(
    category_data: dict,
    request: Request = None
):
    """Cria uma nova categoria de produtos"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        category = {
            "id": str(uuid4()),
            "merchant_id": user_id,
            "name": category_data.get("name"),
            "description": category_data.get("description", ""),
            "image_url": category_data.get("image_url"),
            "order": category_data.get("order", 0),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.merchant_categories.insert_one(category)
        if "_id" in category:
            del category["_id"]
        
        return {"success": True, "category": category}
    except Exception as e:
        logger.error(f"Erro ao criar categoria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.get("/categories")
async def get_categories(request: Request = None):
    current_user = await get_user_from_request(request)
    """Lista categorias do lojista"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        categories = await db.merchant_categories.find(
            {"merchant_id": user_id},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"success": True, "categories": categories, "total": len(categories)}
    except Exception as e:
        logger.error(f"Erro ao listar categorias: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.put("/categories/{category_id}")
async def update_category(
    category_id: str,
    category_data: dict,
    request: Request = None
):
    """Atualiza uma categoria"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        update_fields = {}
        for field in ["name", "description", "image_url", "order", "is_active"]:
            if field in category_data:
                update_fields[field] = category_data[field]
        
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.merchant_categories.update_one(
            {"id": category_id, "merchant_id": user_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
        return {"success": True, "message": "Categoria atualizada"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar categoria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    request: Request = None
):
    """Remove uma categoria"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        result = await db.merchant_categories.delete_one(
            {"id": category_id, "merchant_id": user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
        return {"success": True, "message": "Categoria removida"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover categoria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PRODUTOS
# ============================================

@merchant_router.post("/products")
async def create_product(
    product_data: dict,
    request: Request = None
):
    """Cria um novo produto"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        product = {
            "id": str(uuid4()),
            "merchant_id": user_id,
            "category_id": product_data.get("category_id"),
            "name": product_data.get("name"),
            "description": product_data.get("description", ""),
            "price": float(product_data.get("price", 0)),
            "promotional_price": product_data.get("promotional_price"),
            "image_url": product_data.get("image_url"),
            "images": product_data.get("images", []),
            "is_available": True,
            "is_featured": product_data.get("is_featured", False),
            "order": product_data.get("order", 0),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.merchant_products.insert_one(product)
        if "_id" in product:
            del product["_id"]
        
        return {"success": True, "product": product}
    except Exception as e:
        logger.error(f"Erro ao criar produto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.get("/products")
async def get_products(
    category_id: Optional[str] = None,
    request: Request = None
):
    """Lista produtos do lojista"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        filtro = {"merchant_id": user_id}
        if category_id:
            filtro["category_id"] = category_id
        
        products = await db.merchant_products.find(
            filtro,
            {"_id": 0}
        ).sort("order", 1).to_list(500)
        
        return {"success": True, "products": products, "total": len(products)}
    except Exception as e:
        logger.error(f"Erro ao listar produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product_data: dict,
    request: Request = None
):
    """Atualiza um produto"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        update_fields = {}
        allowed_fields = [
            "category_id", "name", "description", "price", "promotional_price",
            "image_url", "images", "is_available", "is_featured", "order"
        ]
        
        for field in allowed_fields:
            if field in product_data:
                update_fields[field] = product_data[field]
        
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.merchant_products.update_one(
            {"id": product_id, "merchant_id": user_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
        return {"success": True, "message": "Produto atualizado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar produto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@merchant_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    request: Request = None
):
    """Remove um produto"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        result = await db.merchant_products.delete_one(
            {"id": product_id, "merchant_id": user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
        return {"success": True, "message": "Produto removido"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover produto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PEDIDOS DO LOJISTA
# ============================================

@merchant_router.post("/clear-completed-orders")
async def clear_completed_orders(request: Request = None):
    current_user = await get_user_from_request(request)
    """Limpa pedidos completados antigos"""
    check_merchant_access(current_user)
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        # Remover pedidos completados há mais de 30 dias
        from datetime import timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
        
        result = await db.orders.delete_many({
            "merchant_id": user_id,
            "status": "completed",
            "completed_at": {"$lt": cutoff_date.isoformat()}
        })
        
        return {
            "success": True,
            "message": f"{result.deleted_count} pedidos removidos"
        }
    except Exception as e:
        logger.error(f"Erro ao limpar pedidos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# QR CODE
# ============================================

@merchant_router.post("/qr-code")
async def generate_merchant_qr(qr_request: dict, current_user=Depends(lambda: None)):
    """Gera QR Code para venda do lojista"""
    user_data = current_user._data if hasattr(current_user, '_data') else (current_user if isinstance(current_user, dict) else {})
    user_id = user_data.get('id', getattr(current_user, 'id', ''))
    user_type = user_data.get('user_type', getattr(current_user, 'user_type', ''))
    
    if user_type != "lojista":
        raise HTTPException(status_code=403, detail="Apenas lojistas podem gerar QR codes")
    
    amount = qr_request.get('amount', 0) if isinstance(qr_request, dict) else getattr(qr_request, 'amount', 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Valor da venda deve ser maior que zero")
    
    from server import generate_qr_code, generate_digital_code
    company_name = user_data.get('company_name', getattr(current_user, 'company_name', ''))
    full_name = user_data.get('full_name', getattr(current_user, 'full_name', ''))
    cashback_rate = user_data.get('cashback_rate', getattr(current_user, 'cashback_rate', 0))
    
    merchant_data = {
        "company_name": company_name,
        "full_name": full_name,
        "cashback_rate": cashback_rate,
        "amount": amount
    }
    
    qr_code = generate_qr_code(user_id, merchant_data)
    digital_code = generate_digital_code(qr_code)
    
    from datetime import timedelta
    code_mapping = {
        "digital_code": digital_code,
        "qr_code": qr_code,
        "merchant_id": user_id,
        "amount": amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    }
    await db.digital_codes.insert_one(code_mapping)
    
    return {
        "qr_code": qr_code,
        "digital_code": digital_code,
        "merchant_id": user_id,
        "merchant_name": company_name or full_name,
        "cashback_rate": cashback_rate or 0.0,
        "amount": amount,
        "cashback_amount": amount * ((cashback_rate or 0.0) / 100)
    }

# NOTA: /api/catalog/* e /api/merchants permanecem em server.py
# pois usam prefixo diferente do merchant router (/api/merchant/)

logger.info("✅ Merchant routes configuradas")
