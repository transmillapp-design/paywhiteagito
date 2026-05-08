"""
Módulo de Franquias - Transmill API
Endpoints: CRUD de franquias, estatísticas, taxas
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

# Router
franquias_router = APIRouter(prefix="/api", tags=["franquias"])

# ============================================
# MODELS
# ============================================

class FranquiaCreate(BaseModel):
    nome: str
    slug: str
    estado: str
    cidades: Optional[List[str]] = []
    cor_primaria: Optional[str] = "#1a59ad"
    cor_secundaria: Optional[str] = "#ffffff"
    cor_texto: Optional[str] = "#ffffff"
    logo_url: Optional[str] = ""
    email_contato: Optional[str] = ""
    telefone_contato: Optional[str] = ""

class FranquiaUpdate(BaseModel):
    nome: Optional[str] = None
    estado: Optional[str] = None
    cidades: Optional[List[str]] = None
    cor_primaria: Optional[str] = None
    cor_secundaria: Optional[str] = None
    cor_texto: Optional[str] = None
    logo_url: Optional[str] = None
    email_contato: Optional[str] = None
    telefone_contato: Optional[str] = None
    ativo: Optional[bool] = None

class TaxaGlobal(BaseModel):
    taxa_pix: Optional[float] = None
    taxa_cartao: Optional[float] = None
    taxa_boleto: Optional[float] = None
    taxa_saque: Optional[float] = None
    taxa_adesao_padrao: Optional[float] = None

class TaxaPersonalizada(BaseModel):
    franquia_id: str
    taxa_pix: Optional[float] = None
    taxa_cartao: Optional[float] = None
    taxa_boleto: Optional[float] = None
    taxa_saque: Optional[float] = None
    taxa_adesao: Optional[float] = None

class MovimentacaoBolsao(BaseModel):
    franquia_id: str
    tipo: str  # "entrada" ou "saida"
    valor: float
    descricao: str
    origem: Optional[str] = "manual"

# ============================================
# Dependências injetáveis
# ============================================

_db = None
_get_current_user = None

def setup_franquias_routes(db, get_current_user_fn):
    """Configura as dependências do módulo de franquias"""
    global _db, _get_current_user
    _db = db
    _get_current_user = get_current_user_fn
    logger.info("✅ Franquias routes configuradas")


def _is_master(user: dict) -> bool:
    """Verifica se o usuário é master"""
    return user.get('is_labelview_master') or user.get('user_type') == 'labelview_master'


# ============================================
# ENDPOINTS - CRUD Franquias
# ============================================

@franquias_router.get("/franquias")
async def listar_franquias(current_user: dict = Depends(lambda: _get_current_user)):
    """Lista todas as franquias (apenas para master)"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        if not _is_master(current_user):
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode listar franquias.")
        
        franquias = await _db.franquias.find(
            {},
            {"_id": 0}
        ).sort("nome", 1).to_list(length=500)
        
        return {
            "success": True,
            "franquias": franquias,
            "total": len(franquias)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar franquias: {e}")
        return {"success": False, "error": str(e)}


@franquias_router.post("/franquias")
async def criar_franquia(
    request: Request,
    current_user: dict = Depends(lambda: _get_current_user)
):
    """Cria uma nova franquia (apenas para master)"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        if not _is_master(current_user):
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode criar franquias.")
        
        data = await request.json()
        
        nome = data.get('nome')
        slug = data.get('slug')
        estado = data.get('estado')
        
        if not nome or not slug or not estado:
            return {"success": False, "error": "Nome, slug e estado são obrigatórios"}
        
        existente = await _db.franquias.find_one({"slug": slug})
        if existente:
            return {"success": False, "error": f"Já existe uma franquia com o slug '{slug}'"}
        
        franquia = {
            "id": str(uuid.uuid4()),
            "nome": nome,
            "slug": slug.lower().replace(" ", "-"),
            "estado": estado.upper(),
            "cidades": data.get('cidades', []),
            "logo_url": data.get('logo_url', ''),
            "cor_primaria": data.get('cor_primaria', '#1a59ad'),
            "cor_secundaria": data.get('cor_secundaria', '#ffffff'),
            "cor_texto": data.get('cor_texto', '#ffffff'),
            "email_contato": data.get('email_contato', ''),
            "telefone_contato": data.get('telefone_contato', ''),
            "endereco": data.get('endereco', {}),
            "ativo": True,
            "is_demo": data.get('is_demo', False),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get('id')
        }
        
        await _db.franquias.insert_one(franquia)
        
        logger.info(f"✅ Franquia criada: {nome} ({slug})")
        
        return {
            "success": True,
            "message": f"Franquia '{nome}' criada com sucesso!",
            "franquia": {k: v for k, v in franquia.items() if k != '_id'}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar franquia: {e}")
        return {"success": False, "error": str(e)}


@franquias_router.get("/franquias/{slug}")
async def obter_franquia(slug: str):
    """Obtém dados de uma franquia pelo slug (público para PWA)"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        franquia = await _db.franquias.find_one(
            {"slug": slug, "ativo": True},
            {"_id": 0}
        )
        
        if not franquia:
            return {"success": False, "error": "Franquia não encontrada"}
        
        return {
            "success": True,
            "franquia": franquia
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter franquia: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# ENDPOINTS - Admin Franquias Stats
# ============================================

@franquias_router.get("/admin/franquias/stats")
async def get_franquias_stats(current_user: dict = Depends(lambda: _get_current_user)):
    """Retorna estatísticas gerais de todas as franquias para o painel admin"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        if not _is_master(current_user):
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode ver estatísticas globais.")
        
        # Contar franquias
        total_franquias = await _db.franquias.count_documents({})
        franquias_ativas = await _db.franquias.count_documents({"ativo": True})
        
        # Contar clientes (labelview_clientes primeiro, depois clientes_protecao)
        total_clientes = await _db.labelview_clientes.count_documents({"status": {"$nin": ["cancelado", "inativo"]}})
        if total_clientes == 0:
            total_clientes = await _db.clientes_protecao.count_documents({"status": {"$ne": "cancelado"}})
        
        # Calcular movimentações do mês atual
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        pipeline_entradas = [
            {"$match": {
                "tipo": "entrada",
                "data": {"$gte": inicio_mes},
                "origem": {"$in": ["pagamento_pix", "pagamento_boleto", "pagamento_cartao", "mensalidade"]}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
        ]
        
        pipeline_saidas = [
            {"$match": {
                "tipo": "saida",
                "data": {"$gte": inicio_mes}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
        ]
        
        entradas_result = await _db.movimentacoes_bolsao.aggregate(pipeline_entradas).to_list(1)
        saidas_result = await _db.movimentacoes_bolsao.aggregate(pipeline_saidas).to_list(1)
        
        entradas_mes = entradas_result[0]["total"] if entradas_result else 0
        saidas_mes = saidas_result[0]["total"] if saidas_result else 0
        
        # Calcular saldo do bolsão
        pipeline_saldo = [
            {"$group": {
                "_id": None,
                "entradas": {"$sum": {"$cond": [{"$eq": ["$tipo", "entrada"]}, "$valor", 0]}},
                "saidas": {"$sum": {"$cond": [{"$eq": ["$tipo", "saida"]}, "$valor", 0]}}
            }}
        ]
        saldo_result = await _db.movimentacoes_bolsao.aggregate(pipeline_saldo).to_list(1)
        saldo_bolsao = 0
        if saldo_result:
            saldo_bolsao = saldo_result[0].get("entradas", 0) - saldo_result[0].get("saidas", 0)
        
        receita_mes = entradas_mes
        
        return {
            "success": True,
            "stats": {
                "totalFranquias": total_franquias,
                "franquiasAtivas": franquias_ativas,
                "totalClientes": total_clientes,
                "saldoBolsao": saldo_bolsao,
                "entradasMes": entradas_mes,
                "saidasMes": saidas_mes,
                "receitaMes": receita_mes,
                "movimentacoesMes": entradas_mes + saidas_mes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar stats de franquias: {e}")
        return {"success": False, "error": str(e)}



# ============================================
# ENDPOINTS - MANIFESTS PWA
# ============================================

@franquias_router.get("/franquia/{slug}/manifest-transmill.json")
async def manifest_transmill_franquia(slug: str):
    """
    Gera manifest.json dinâmico para o PWA Transmill da franquia.
    PWA: Carteira, Mobilidade, Internet, Lojas
    """
    from fastapi.responses import JSONResponse
    
    if _db is None:
        return JSONResponse(content={"error": "Database não configurado"}, status_code=500)
    
    try:
        franquia = await _db.franquias.find_one({"slug": slug, "ativo": True})
        
        if not franquia:
            franquia = {"nome": "Transmill", "cor_primaria": "#005B9C", "logo_url": ""}
        
        nome = franquia.get('nome', 'Transmill')
        cor = franquia.get('cor_primaria', '#005B9C')
        
        manifest = {
            "short_name": nome,
            "name": f"{nome} - Ecossistema",
            "description": f"{nome} - Plataforma completa com carteira digital, mobilidade, internet e mais!",
            "id": f"/franquia/{slug}/app",
            "start_url": f"/franquia/{slug}/login",
            "scope": f"/franquia/{slug}/",
            "display": "standalone",
            "theme_color": cor,
            "background_color": cor,
            "orientation": "portrait-primary",
            "lang": "pt-BR",
            "categories": ["finance", "business", "shopping"],
            "icons": [
                {"src": "/icon-72x72.png", "sizes": "72x72", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any"}
            ],
            "shortcuts": [
                {"name": "Login", "short_name": "Entrar", "description": "Fazer login", "url": f"/franquia/{slug}/login"}
            ]
        }
        
        if franquia.get('logo_url'):
            manifest['icons'] = [
                {"src": franquia['logo_url'], "sizes": "192x192", "type": "image/png", "purpose": "any"},
                {"src": franquia['logo_url'], "sizes": "512x512", "type": "image/png", "purpose": "any"}
            ]
        
        return JSONResponse(content=manifest, media_type="application/manifest+json")
        
    except Exception as e:
        logger.error(f"Erro ao gerar manifest transmill: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@franquias_router.get("/franquia/{slug}/manifest-protecao.json")
async def manifest_protecao_franquia(slug: str):
    """
    Gera manifest.json dinâmico para o PWA de Proteção Veicular da franquia.
    """
    from fastapi.responses import JSONResponse
    
    if _db is None:
        return JSONResponse(content={"error": "Database não configurado"}, status_code=500)
    
    try:
        franquia = await _db.franquias.find_one({"slug": slug, "ativo": True})
        
        if not franquia:
            franquia = {"nome": "Proteção Veicular", "cor_primaria": "#1a59ad", "logo_url": ""}
        
        nome = franquia.get('nome', 'Proteção')
        cor = franquia.get('cor_primaria', '#1a59ad')
        
        manifest = {
            "short_name": f"{nome} Proteção",
            "name": f"{nome} - Proteção Veicular",
            "description": f"{nome} - Sua proteção veicular. Contrato, assistência 24h e muito mais!",
            "id": f"/franquia/{slug}/protecao",
            "start_url": f"/franquia/{slug}/protecao",
            "scope": f"/franquia/{slug}/protecao",
            "display": "standalone",
            "theme_color": cor,
            "background_color": cor,
            "orientation": "portrait-primary",
            "lang": "pt-BR",
            "categories": ["auto", "insurance", "utilities"],
            "icons": [
                {"src": "/icon-72x72.png", "sizes": "72x72", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any"},
                {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any"}
            ],
            "shortcuts": [
                {"name": "Minha Proteção", "short_name": "Proteção", "description": "Ver proteção", "url": f"/franquia/{slug}/protecao"},
                {"name": "Assistência 24h", "short_name": "Assistência", "description": "Solicitar assistência", "url": f"/franquia/{slug}/protecao/assistencia"}
            ]
        }
        
        if franquia.get('logo_url'):
            manifest['icons'] = [
                {"src": franquia['logo_url'], "sizes": "192x192", "type": "image/png", "purpose": "any"},
                {"src": franquia['logo_url'], "sizes": "512x512", "type": "image/png", "purpose": "any"}
            ]
        
        return JSONResponse(content=manifest, media_type="application/manifest+json")
        
    except Exception as e:
        logger.error(f"Erro ao gerar manifest protecao: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
