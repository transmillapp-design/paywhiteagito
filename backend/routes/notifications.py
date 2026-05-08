"""
Módulo Notifications - Transmill API
Gerenciamento de notificações: criação (master), listagem, leitura, contagem.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from routes.auth_utils import get_user_from_request
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

db = None


def set_db(database):
    global db
    db = database


class NotificationCreate(BaseModel):
    title: str
    message: str
    image: Optional[str] = None
    target_type: str = "all"
    target_user_id: Optional[str] = None
    priority: str = "media"


def _check_master(user):
    user_data = user._data if hasattr(user, '_data') else (user if isinstance(user, dict) else {})
    ut = user_data.get('user_type', getattr(user, 'user_type', ''))
    im = user_data.get('is_master_account', getattr(user, 'is_master_account', False))
    if ut != "master" and not im:
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")


def _uid(user):
    return user.id if hasattr(user, 'id') else (user.get('id') if isinstance(user, dict) else str(user))


# ============================================
# MASTER ENDPOINTS
# ============================================

@router.post("/master/create")
async def create_notification(notification_data: NotificationCreate, request: Request = None):
    current_user = await get_user_from_request(request)
    _check_master(current_user)
    uid = _uid(current_user)
    try:
        notification = {
            "id": str(uuid.uuid4()), "title": notification_data.title,
            "message": notification_data.message, "image": notification_data.image,
            "target_type": notification_data.target_type, "target_user_id": notification_data.target_user_id,
            "priority": notification_data.priority, "created_by": uid,
            "created_at": datetime.utcnow(), "is_active": True
        }

        recipients = []
        if notification_data.target_type == "all":
            users = await db.users.find({"user_type": {"$in": ["cliente", "lojista"]}}).to_list(None)
            recipients = [u["id"] for u in users]
        elif notification_data.target_type == "clients":
            users = await db.users.find({"user_type": "cliente"}).to_list(None)
            recipients = [u["id"] for u in users]
        elif notification_data.target_type == "merchants":
            users = await db.users.find({"user_type": "lojista"}).to_list(None)
            recipients = [u["id"] for u in users]
        elif notification_data.target_type == "individual":
            if not notification_data.target_user_id:
                raise HTTPException(status_code=400, detail="target_user_id obrigatório")
            user = await db.users.find_one({"id": notification_data.target_user_id})
            if not user:
                raise HTTPException(status_code=404, detail="Usuário não encontrado")
            recipients = [notification_data.target_user_id]
        else:
            raise HTTPException(status_code=400, detail="target_type: 'all', 'clients', 'merchants' ou 'individual'")

        notification["recipients"] = recipients
        notification["total_recipients"] = len(recipients)
        await db.notifications.insert_one(notification)

        user_notifications = [{
            "id": str(uuid.uuid4()), "notification_id": notification["id"],
            "user_id": rid, "title": notification_data.title,
            "message": notification_data.message, "image": notification_data.image,
            "priority": notification_data.priority, "is_read": False,
            "created_at": datetime.utcnow()
        } for rid in recipients]

        if user_notifications:
            await db.user_notifications.insert_many(user_notifications)

        return {"message": "Notificação criada com sucesso", "notification_id": notification["id"], "recipients_count": len(recipients)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar notificação: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/master/franquias")
async def send_to_franquias(data: dict, request: Request = None):
    current_user = await get_user_from_request(request)
    _check_master(current_user)
    uid = _uid(current_user)
    try:
        title = data.get('title')
        message = data.get('message')
        priority = data.get('priority', 'media')
        franquia_ids = data.get('franquia_ids', [])

        if not title or not message:
            raise HTTPException(status_code=400, detail="Título e mensagem obrigatórios")
        if not franquia_ids:
            raise HTTPException(status_code=400, detail="Selecione pelo menos uma franquia")

        franquias = await db.franquias.find({"id": {"$in": franquia_ids}}, {"slug": 1, "nome": 1}).to_list(100)
        slugs = [f.get('slug') for f in franquias if f.get('slug')]
        nomes = [f.get('nome') for f in franquias]

        users = await db.users.find({"$or": [{"franquia_slug": {"$in": slugs}}, {"franquia_id": {"$in": franquia_ids}}]}).to_list(None)
        recipients = [u["id"] for u in users]

        if not recipients:
            return {"success": True, "message": "Nenhum usuário encontrado", "recipients_count": 0}

        notification = {
            "id": str(uuid.uuid4()), "title": title, "message": message,
            "priority": priority, "target_type": "franquias",
            "target_franquias": franquia_ids, "target_franquias_nomes": nomes,
            "created_by": uid, "created_at": datetime.utcnow(), "is_active": True,
            "recipients": recipients, "total_recipients": len(recipients)
        }
        await db.notifications.insert_one(notification)

        un = [{"id": str(uuid.uuid4()), "notification_id": notification["id"], "user_id": rid,
               "title": title, "message": message, "priority": priority,
               "is_read": False, "created_at": datetime.utcnow()} for rid in recipients]
        if un:
            await db.user_notifications.insert_many(un)

        push_sent = 0
        for rid in recipients:
            u = await db.users.find_one({"id": rid})
            if u and u.get('push_subscription'):
                try:
                    from pywebpush import webpush
                    import json
                    vpk = os.environ.get('VAPID_PRIVATE_KEY', '')
                    ve = os.environ.get('VAPID_EMAIL', 'mailto:admin@transmill.com.br')
                    if vpk:
                        webpush(subscription_info=u['push_subscription'],
                                data=json.dumps({"title": title, "body": message, "icon": "/logo192.png"}),
                                vapid_private_key=vpk, vapid_claims={"sub": ve})
                        push_sent += 1
                except Exception:
                    pass

        return {"success": True, "message": f"Enviada para {len(recipients)} usuários",
                "recipients_count": len(recipients), "push_sent": push_sent, "franquias": nomes}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro notificação franquias: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/master/list")
async def get_all_notifications(request: Request = None):
    current_user = await get_user_from_request(request)
    _check_master(current_user)
    try:
        notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(None)
        return {"notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/master/{notification_id}")
async def delete_notification(notification_id: str, request: Request = None):
    current_user = await get_user_from_request(request)
    _check_master(current_user)
    try:
        result = await db.notifications.delete_one({"id": notification_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")
        await db.user_notifications.delete_many({"notification_id": notification_id})
        return {"message": "Notificação removida com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# USER ENDPOINTS
# ============================================

@router.get("")
async def get_user_notifications(request: Request = None, limit: int = 50):
    current_user = await get_user_from_request(request)
    uid = _uid(current_user)
    try:
        notifications = await db.user_notifications.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        unread = await db.user_notifications.count_documents({"user_id": uid, "is_read": False})
        return {"success": True, "notifications": notifications, "unread_count": unread}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, request: Request = None):
    current_user = await get_user_from_request(request)
    uid = _uid(current_user)
    try:
        result = await db.user_notifications.update_one({"id": notification_id, "user_id": uid}, {"$set": {"is_read": True}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")
        return {"message": "Notificação marcada como lida"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def unread_count(request: Request = None):
    current_user = await get_user_from_request(request)
    uid = _uid(current_user)
    try:
        count = await db.user_notifications.count_documents({"user_id": uid, "is_read": False})
        return {"success": True, "unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mark-all-read")
async def mark_all_read(request: Request = None):
    current_user = await get_user_from_request(request)
    uid = _uid(current_user)
    try:
        result = await db.user_notifications.update_many(
            {"user_id": uid, "is_read": False},
            {"$set": {"is_read": True, "updated_at": datetime.utcnow()}}
        )
        return {"success": True, "message": f"{result.modified_count} notificações lidas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


logger.info("✅ Notifications routes configuradas")
