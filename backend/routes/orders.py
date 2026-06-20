"""
Orders & Catalog Routes
Migrado de server.py para router modular.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import logging
import os

from routes.deps import get_current_user, get_current_master_user, verify_token, security

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


@router.get("/catalog/{merchant_id}")
async def get_merchant_catalog(merchant_id: str):
    """Ver catálogo público de um lojista (sem autenticação necessária)"""
    try:
        # Buscar dados do lojista
        merchant = await db.users.find_one({"id": merchant_id, "user_type": "lojista"})
        if not merchant:
            raise HTTPException(status_code=404, detail="Lojista não encontrado")
        
        # Buscar categorias ativas
        categories = await db.product_categories.find({
            "merchant_id": merchant_id,
            "is_active": True
        }).sort("display_order", 1).to_list(1000)
        
        # Buscar produtos ativos
        products = await db.products.find({
            "merchant_id": merchant_id,
            "is_active": True
        }).sort("display_order", 1).to_list(1000)
        
        # Serializar ObjectId
        for cat in categories:
            if "_id" in cat:
                cat["_id"] = str(cat["_id"])
        
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
        
        return {
            "success": True,
            "merchant": {
                "id": merchant["id"],
                "fantasy_name": merchant.get("fantasy_name", ""),
                "store_slug": merchant.get("store_slug", ""),
                "whatsapp": merchant.get("whatsapp"),
                "accepts_pickup": merchant.get("accepts_pickup", True),
                "accepts_delivery": merchant.get("accepts_delivery", False),
                "delivery_fee": merchant.get("delivery_fee", 0.0),
                "delivery_radius_km": merchant.get("delivery_radius_km", 5.0),
                "estimated_delivery_time": merchant.get("estimated_delivery_time", 30),
                "city": merchant.get("city"),
                "state": merchant.get("state"),
                "street": merchant.get("street"),
                "neighborhood": merchant.get("neighborhood"),
                "number": merchant.get("number")
            },
            "categories": categories,
            "products": products,
            "total_products": len(products)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar catálogo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/catalog/slug/{store_slug}")
async def get_merchant_catalog_by_slug(store_slug: str):
    """Ver catálogo público de um lojista usando slug amigável (sem autenticação necessária)"""
    try:
        # Buscar lojista pelo slug
        merchant = await db.users.find_one({"store_slug": store_slug, "user_type": "lojista"})
        if not merchant:
            raise HTTPException(status_code=404, detail="Loja não encontrada")
        
        merchant_id = merchant["id"]
        
        # Buscar categorias ativas
        categories = await db.product_categories.find({
            "merchant_id": merchant_id,
            "is_active": True
        }).sort("display_order", 1).to_list(1000)
        
        # Buscar produtos ativos
        products = await db.products.find({
            "merchant_id": merchant_id,
            "is_active": True
        }).sort("display_order", 1).to_list(1000)
        
        # Serializar ObjectId
        for cat in categories:
            if "_id" in cat:
                cat["_id"] = str(cat["_id"])
        
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
        
        return {
            "success": True,
            "merchant": {
                "id": merchant["id"],
                "fantasy_name": merchant.get("fantasy_name", ""),
                "store_slug": merchant.get("store_slug", ""),
                "whatsapp": merchant.get("whatsapp"),
                "accepts_pickup": merchant.get("accepts_pickup", True),
                "accepts_delivery": merchant.get("accepts_delivery", False),
                "delivery_fee": merchant.get("delivery_fee", 0.0),
                "delivery_radius_km": merchant.get("delivery_radius_km", 5.0),
                "estimated_delivery_time": merchant.get("estimated_delivery_time", 30),
                "city": merchant.get("city"),
                "state": merchant.get("state"),
                "street": merchant.get("street"),
                "neighborhood": merchant.get("neighborhood"),
                "number": merchant.get("number")
            },
            "categories": categories,
            "products": products,
            "total_products": len(products)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar catálogo por slug: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ============================================
# SISTEMA DE PEDIDOS - ORDERS
# ============================================

@router.post("/orders/create")
async def create_order(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Criar novo pedido (cliente)"""
    try:
        user_id = verify_token(credentials)
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        data = await request.json()
        merchant_id = data.get('merchant_id')
        order_type = data.get('order_type', 'pickup')  # pickup ou delivery
        items = data.get('items', [])
        delivery_address = data.get('delivery_address')
        customer_notes = data.get('customer_notes')
        payment_method = data.get('payment_method', 'wallet')  # wallet ou usdt
        
        if not merchant_id or not items:
            raise HTTPException(status_code=400, detail="merchant_id e items são obrigatórios")
        
        # Buscar lojista
        merchant = await db.users.find_one({"id": merchant_id, "user_type": "lojista"})
        if not merchant:
            raise HTTPException(status_code=404, detail="Lojista não encontrado")
        
        # Verificar formas de pagamento aceitas
        accept_wallet = merchant.get('accept_wallet_payment', True)
        accept_usdt = merchant.get('accept_usdt_payment', False)
        
        if payment_method == 'wallet' and not accept_wallet:
            raise HTTPException(status_code=400, detail="Lojista não aceita pagamento via saldo")
        
        if payment_method == 'usdt' and not accept_usdt:
            raise HTTPException(status_code=400, detail="Lojista não aceita pagamento via USDT")
        
        # Calcular totais
        subtotal = sum(item.get('total_price', 0) for item in items)
        delivery_fee = 0
        
        if order_type == 'delivery':
            delivery_fee = merchant.get('delivery_fee', 0)
            if not delivery_address or not delivery_address.get('street'):
                raise HTTPException(status_code=400, detail="Endereço de entrega obrigatório")
        
        total = subtotal + delivery_fee
        
        # Processar pagamento
        if payment_method == 'wallet':
            # Pagamento via saldo
            if user.get('balance', 0) < total:
                raise HTTPException(status_code=400, detail="Saldo insuficiente")
            
            # Debitar do cliente
            await db.users.update_one(
                {'id': user_id},
                {'$inc': {'balance': -total}}
            )
            
            # Creditar ao lojista
            await db.users.update_one(
                {'id': merchant_id},
                {'$inc': {'balance': total}}
            )
            
        elif payment_method == 'usdt':
            # Pagamento via USDT
            user_usdt_balance = user.get('usdt_balance', 0)
            
            # Get USDT rate
            usdt_rate = 5.45  # Mock rate - 1 USDT = 5.45 BRL
            usdt_amount = total / usdt_rate
            
            if user_usdt_balance < usdt_amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Saldo USDT insuficiente. Necessário: {usdt_amount:.2f} USDT, Disponível: {user_usdt_balance:.2f} USDT"
                )
            
            # Debitar USDT do cliente
            await db.users.update_one(
                {'id': user_id},
                {'$inc': {'usdt_balance': -usdt_amount}}
            )
            
            # Creditar USDT ao lojista
            await db.users.update_one(
                {'id': merchant_id},
                {'$inc': {'usdt_balance': usdt_amount}}
            )
            
            # Record USDT transaction
            usdt_transaction = {
                'id': str(uuid.uuid4()),
                'from_user_id': user_id,
                'to_user_id': merchant_id,
                'amount_usdt': usdt_amount,
                'amount_brl': total,
                'usdt_rate': usdt_rate,
                'type': 'order_payment',
                'created_at': datetime.utcnow()
            }
            await db.usdt_transactions.insert_one(usdt_transaction)
        
        # Criar pedido
        order_id = str(uuid.uuid4())
        order = {
            "order_id": order_id,
            "customer_id": user_id,
            "customer_name": user.get('full_name', ''),
            "customer_phone": user.get('phone', ''),
            "merchant_id": merchant_id,
            "merchant_name": merchant.get('fantasy_name', ''),
            "order_type": order_type,
            "items": items,
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "total": total,
            "payment_method": payment_method,
            "status": "pending",  # pending, confirmed, preparing, ready, delivering, completed, cancelled
            "payment_status": "paid",  # Já pago
            "delivery_address": delivery_address,
            "customer_notes": customer_notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.orders.insert_one(order)
        
        logger.info(f"Pedido criado: {order_id} - Cliente: {user_id} - Lojista: {merchant_id} - Pagamento: {payment_method}")
        
        # Criar notificação para o lojista sobre NOVO PEDIDO (usar user_notifications)
        notification_data = {
            "id": str(uuid.uuid4()),
            "user_id": merchant_id,
            "type": "new_order",
            "title": "🔔 Novo Pedido!",
            "message": f"Novo pedido de {user.get('full_name', 'Cliente')} - R$ {total:.2f} ({payment_method.upper()})",
            "image": None,
            "priority": "high",
            "data": {
                "order_id": order_id,
                "customer_id": user_id,
                "customer_name": user.get('full_name', ''),
                "total": total,
                "order_type": order_type,
                "payment_method": payment_method,
                "items_count": len(items)
            },
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        
        await db.user_notifications.insert_one(notification_data)
        logger.info(f"Notificação de novo pedido criada para lojista {merchant_id}")
        
        # Remover _id para serialização
        if "_id" in order:
            del order["_id"]
        
        return {
            "success": True,
            "message": "Pedido criado com sucesso",
            "order_id": order_id,
            "order": order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar pedido: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/orders/my-orders")
async def get_my_orders(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Listar pedidos do cliente"""
    try:
        user_id = verify_token(credentials)
        
        # Buscar pedidos do cliente ordenados por data (mais recentes primeiro)
        orders = await db.orders.find(
            {"customer_id": user_id}
        ).sort("created_at", -1).to_list(100)
        
        # Serializar ObjectId
        for order in orders:
            if "_id" in order:
                order["_id"] = str(order["_id"])
        
        return {
            "success": True,
            "orders": orders,
            "total": len(orders)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar pedidos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Detalhes de um pedido específico"""
    try:
        user_id = verify_token(credentials)
        user = await db.users.find_one({"id": user_id})
        
        # Buscar pedido
        order = await db.orders.find_one({"order_id": order_id})
        
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
        # Verificar permissão (cliente do pedido ou lojista)
        if order['customer_id'] != user_id and order['merchant_id'] != user_id:
            raise HTTPException(status_code=403, detail="Sem permissão para ver este pedido")
        
        # Serializar ObjectId
        if "_id" in order:
            order["_id"] = str(order["_id"])
        
        return {
            "success": True,
            "order": order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar pedido: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/orders/merchant/list")
async def get_merchant_orders(
    status: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Listar pedidos do lojista"""
    try:
        user_id = verify_token(credentials)
        user = await db.users.find_one({"id": user_id})
        
        if not user or user.get('user_type') != 'lojista':
            raise HTTPException(status_code=403, detail="Apenas lojistas podem acessar")
        
        # Filtro de status (opcional)
        query = {"merchant_id": user_id}
        if status:
            query["status"] = status
        
        # Buscar pedidos
        orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
        
        # Serializar dados para JSON
        for order in orders:
            # Converter ObjectId para string
            if "_id" in order:
                order["_id"] = str(order["_id"])
            
            # Adicionar campo 'id' para compatibilidade com frontend
            if "order_id" in order:
                order["id"] = order["order_id"]
            
            # Converter datetime para string ISO
            if "created_at" in order and hasattr(order["created_at"], "isoformat"):
                order["created_at"] = order["created_at"].isoformat()
            if "updated_at" in order and hasattr(order["updated_at"], "isoformat"):
                order["updated_at"] = order["updated_at"].isoformat()
        
        return {
            "success": True,
            "orders": orders,
            "total": len(orders)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar pedidos do lojista: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Atualizar status do pedido (apenas lojista)"""
    try:
        user_id = verify_token(credentials)
        user = await db.users.find_one({"id": user_id})
        
        if not user or user.get('user_type') != 'lojista':
            raise HTTPException(status_code=403, detail="Apenas lojistas podem atualizar status")
        
        data = await request.json()
        new_status = data.get('status')
        
        if not new_status:
            raise HTTPException(status_code=400, detail="Status é obrigatório")
        
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Status inválido. Use: {', '.join(valid_statuses)}")
        
        # Buscar pedido
        order = await db.orders.find_one({"order_id": order_id, "merchant_id": user_id})
        
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
        # Atualizar status
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"Status do pedido {order_id} atualizado para {new_status}")
        
        # Criar notificação para o cliente (usar user_notifications para não conflitar com master)
        status_messages = {
            'confirmed': 'Seu pedido foi confirmado e está sendo preparado!',
            'preparing': 'Seu pedido está sendo preparado.',
            'ready': 'Seu pedido está pronto!',
            'delivering': 'Seu pedido saiu para entrega!',
            'completed': 'Seu pedido foi entregue. Obrigado!',
            'cancelled': 'Seu pedido foi cancelado.'
        }
        
        if new_status in status_messages:
            notification_data = {
                "id": str(uuid.uuid4()),
                "user_id": order.get('customer_id'),
                "type": "order_status",
                "title": f"Pedido #{order_id[:8]}",
                "message": status_messages[new_status],
                "image": None,
                "priority": "medium",
                "data": {
                    "order_id": order_id,
                    "status": new_status,
                    "merchant_id": user_id
                },
                "is_read": False,
                "created_at": datetime.utcnow()
            }
            
            await db.user_notifications.insert_one(notification_data)
            logger.info(f"Notificação de pedido criada para cliente {order.get('customer_id')}")
        
        return {
            "success": True,
            "message": "Status atualizado com sucesso",
            "order_id": order_id,
            "status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

