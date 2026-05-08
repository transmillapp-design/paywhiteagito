"""
Módulo Social/Feed - Transmill API
Endpoints para rede social, vídeos, likes, comentários e pontos

Endpoints migrados do server.py:
- GET /api/social/stats - Estatísticas do usuário
- POST /api/social/videos - Upload de vídeo
- GET /api/social/videos - Listar vídeos
- POST /api/social/videos/like - Curtir vídeo
- POST /api/social/videos/comment - Comentar vídeo
- GET /api/social/videos/{video_id}/comments - Listar comentários
- POST /api/social/videos/view - Registrar visualização
- POST /api/social/points/convert - Converter pontos
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["Social"])

# Dependências injetadas
_db = None
_get_current_user = None


def init_social_routes(database, auth_dependency):
    """Inicializa as rotas do módulo social"""
    global _db, _get_current_user
    _db = database
    _get_current_user = auth_dependency
    logger.info("✅ Social routes configuradas")


# ============================================
# MODELOS
# ============================================

class VideoCreate(BaseModel):
    video_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class CommentCreate(BaseModel):
    video_id: str
    content: str

class LikeRequest(BaseModel):
    video_id: str

class ViewRequest(BaseModel):
    video_id: str

class ConvertPointsRequest(BaseModel):
    points: int


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

@router.get("/stats")
async def get_social_stats(request: Request):
    """
    Retorna estatísticas do usuário no módulo social
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        
        # Contar vídeos do usuário
        total_videos = await _db.social_videos.count_documents({"user_id": user_id})
        
        # Contar likes recebidos
        user_videos = await _db.social_videos.find({"user_id": user_id}).to_list(length=1000)
        video_ids = [v.get('id') for v in user_videos]
        total_likes = await _db.social_likes.count_documents({"video_id": {"$in": video_ids}})
        
        # Contar visualizações
        total_views = await _db.social_views.count_documents({"video_id": {"$in": video_ids}})
        
        # Pontos do usuário
        user_doc = await _db.users.find_one({"id": user_id})
        social_points = user_doc.get('social_points', 0) if user_doc else 0
        
        return {
            "success": True,
            "stats": {
                "total_videos": total_videos,
                "total_likes": total_likes,
                "total_views": total_views,
                "social_points": social_points
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao buscar stats: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/videos")
async def create_video(request: Request, video: VideoCreate):
    """
    Cria um novo vídeo no feed social
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        
        video_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": current_user.get('full_name') or current_user.get('email'),
            "user_avatar": current_user.get('avatar_url'),
            "video_url": video.video_url,
            "thumbnail_url": video.thumbnail_url,
            "description": video.description,
            "tags": video.tags or [],
            "likes_count": 0,
            "comments_count": 0,
            "views_count": 0,
            "status": "active",
            "created_at": datetime.utcnow()
        }
        
        await _db.social_videos.insert_one(video_doc)
        
        # Remover _id para retornar
        if '_id' in video_doc:
            del video_doc['_id']
        video_doc['created_at'] = video_doc['created_at'].isoformat()
        
        # Adicionar pontos ao usuário
        await _db.users.update_one(
            {"id": user_id},
            {"$inc": {"social_points": 10}}  # 10 pontos por vídeo
        )
        
        logger.info(f"✅ [SOCIAL] Vídeo criado: {video_doc['id']} por {user_id}")
        
        return {
            "success": True,
            "video": video_doc,
            "points_earned": 10
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao criar vídeo: {str(e)}")
        return {"success": False, "message": str(e)}


@router.get("/videos")
async def get_videos(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None
):
    """
    Lista vídeos do feed social
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        # Filtro
        filtro = {"status": "active"}
        if user_id:
            filtro["user_id"] = user_id
        
        # Paginação
        skip = (page - 1) * limit
        
        # Buscar vídeos
        videos = await _db.social_videos.find(filtro).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
        # Total
        total = await _db.social_videos.count_documents(filtro)
        
        # Verificar likes do usuário atual
        current_user_id = current_user.get('id')
        video_ids = [v.get('id') for v in videos]
        user_likes = await _db.social_likes.find({
            "user_id": current_user_id,
            "video_id": {"$in": video_ids}
        }).to_list(length=1000)
        liked_ids = set(l.get('video_id') for l in user_likes)
        
        # Processar vídeos
        result = []
        for video in videos:
            if '_id' in video:
                del video['_id']
            if video.get('created_at'):
                video['created_at'] = video['created_at'].isoformat() if hasattr(video['created_at'], 'isoformat') else str(video['created_at'])
            video['is_liked'] = video.get('id') in liked_ids
            result.append(video)
        
        return {
            "success": True,
            "videos": result,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao listar vídeos: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/videos/like")
async def like_video(request: Request, like: LikeRequest):
    """
    Curte ou descurte um vídeo
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        video_id = like.video_id
        
        # Verificar se já curtiu
        existing_like = await _db.social_likes.find_one({
            "user_id": user_id,
            "video_id": video_id
        })
        
        if existing_like:
            # Descurtir
            await _db.social_likes.delete_one({"_id": existing_like['_id']})
            await _db.social_videos.update_one(
                {"id": video_id},
                {"$inc": {"likes_count": -1}}
            )
            action = "unliked"
        else:
            # Curtir
            await _db.social_likes.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "video_id": video_id,
                "created_at": datetime.utcnow()
            })
            await _db.social_videos.update_one(
                {"id": video_id},
                {"$inc": {"likes_count": 1}}
            )
            
            # Dar pontos ao dono do vídeo
            video = await _db.social_videos.find_one({"id": video_id})
            if video and video.get('user_id') != user_id:
                await _db.users.update_one(
                    {"id": video.get('user_id')},
                    {"$inc": {"social_points": 1}}  # 1 ponto por like
                )
            
            action = "liked"
        
        # Buscar contagem atualizada
        video = await _db.social_videos.find_one({"id": video_id})
        likes_count = video.get('likes_count', 0) if video else 0
        
        return {
            "success": True,
            "action": action,
            "likes_count": likes_count
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao curtir vídeo: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/videos/comment")
async def comment_video(request: Request, comment: CommentCreate):
    """
    Adiciona comentário em um vídeo
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        
        comment_doc = {
            "id": str(uuid.uuid4()),
            "video_id": comment.video_id,
            "user_id": user_id,
            "user_name": current_user.get('full_name') or current_user.get('email'),
            "user_avatar": current_user.get('avatar_url'),
            "content": comment.content,
            "created_at": datetime.utcnow()
        }
        
        await _db.social_comments.insert_one(comment_doc)
        
        # Atualizar contagem de comentários no vídeo
        await _db.social_videos.update_one(
            {"id": comment.video_id},
            {"$inc": {"comments_count": 1}}
        )
        
        # Dar pontos ao dono do vídeo
        video = await _db.social_videos.find_one({"id": comment.video_id})
        if video and video.get('user_id') != user_id:
            await _db.users.update_one(
                {"id": video.get('user_id')},
                {"$inc": {"social_points": 2}}  # 2 pontos por comentário
            )
        
        # Remover _id
        if '_id' in comment_doc:
            del comment_doc['_id']
        comment_doc['created_at'] = comment_doc['created_at'].isoformat()
        
        return {
            "success": True,
            "comment": comment_doc
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao comentar: {str(e)}")
        return {"success": False, "message": str(e)}


@router.get("/videos/{video_id}/comments")
async def get_video_comments(request: Request, video_id: str):
    """
    Lista comentários de um vídeo
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        comments = await _db.social_comments.find({"video_id": video_id}).sort("created_at", -1).to_list(length=100)
        
        result = []
        for comment in comments:
            if '_id' in comment:
                del comment['_id']
            if comment.get('created_at'):
                comment['created_at'] = comment['created_at'].isoformat() if hasattr(comment['created_at'], 'isoformat') else str(comment['created_at'])
            result.append(comment)
        
        return {
            "success": True,
            "comments": result,
            "total": len(result)
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao listar comentários: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/videos/view")
async def register_view(request: Request, view: ViewRequest):
    """
    Registra visualização de um vídeo
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        video_id = view.video_id
        
        # Verificar se já visualizou recentemente (últimas 24h)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        existing_view = await _db.social_views.find_one({
            "user_id": user_id,
            "video_id": video_id,
            "created_at": {"$gte": yesterday}
        })
        
        if not existing_view:
            # Registrar visualização
            await _db.social_views.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "video_id": video_id,
                "created_at": datetime.utcnow()
            })
            
            # Atualizar contagem
            await _db.social_videos.update_one(
                {"id": video_id},
                {"$inc": {"views_count": 1}}
            )
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao registrar view: {str(e)}")
        return {"success": False, "message": str(e)}


@router.post("/points/convert")
async def convert_points(request: Request, convert: ConvertPointsRequest):
    """
    Converte pontos sociais em saldo
    """
    try:
        current_user = await get_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Não autorizado"}
        
        user_id = current_user.get('id')
        points = convert.points
        
        # Verificar se tem pontos suficientes
        user = await _db.users.find_one({"id": user_id})
        current_points = user.get('social_points', 0) if user else 0
        
        if points > current_points:
            return {"success": False, "message": "Pontos insuficientes"}
        
        if points < 100:
            return {"success": False, "message": "Mínimo de 100 pontos para conversão"}
        
        # Taxa de conversão: 100 pontos = R$ 1,00
        valor = points / 100
        
        # Debitar pontos e creditar saldo
        await _db.users.update_one(
            {"id": user_id},
            {
                "$inc": {
                    "social_points": -points,
                    "balance": valor
                }
            }
        )
        
        # Registrar transação
        await _db.social_points_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "points": points,
            "value": valor,
            "type": "conversion",
            "created_at": datetime.utcnow()
        })
        
        logger.info(f"✅ [SOCIAL] Pontos convertidos: {points} pts -> R$ {valor:.2f} | User: {user_id}")
        
        return {
            "success": True,
            "points_converted": points,
            "value_credited": valor,
            "remaining_points": current_points - points
        }
        
    except Exception as e:
        logger.error(f"❌ [SOCIAL] Erro ao converter pontos: {str(e)}")
        return {"success": False, "message": str(e)}


# ============================================
# NOTA: Os endpoints /master/social/* permanecem em server.py
# pois usam prefix diferente (/api/master/social/ vs /api/social/)
# ============================================
