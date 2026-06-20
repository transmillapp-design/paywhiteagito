# Forçar variáveis Cloudinary corretas ANTES de tudo
# REBUILD FORÇADO v2.34.68 - 2025-12-12 02:49:58
#
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    ⚠️  IMPORTANTE - VERSIONAMENTO ⚠️                          ║
# ╠══════════════════════════════════════════════════════════════════════════════╣
# ║  Ao atualizar a versão do sistema, TODOS os arquivos abaixo devem ser       ║
# ║  atualizados para manter consistência:                                       ║
# ║                                                                              ║
# ║  1. /app/backend/server.py (linha ~141) - FastAPI version                   ║
# ║  2. /app/backend/server.py (linhas ~6997 e ~7015) - endpoint /api/health    ║
# ║  3. /app/frontend/src/App.js - FRONTEND_VERSION e BUILD log                 ║
# ║  4. Routers modulares em /app/backend/routes/                                    ║
# ║                                                                              ║
# ║  Se o VERSION.txt não for atualizado, o frontend mostrará:                  ║
# ║  "⚠️ Versões diferentes! Backend: vX.X.X, Frontend: vY.Y.Y"                 ║
# ║                                                                              ║
# ║  Formato do VERSION.txt (3 linhas):                                         ║
# ║    Linha 1: vX.Y.Z (versão)                                                 ║
# ║    Linha 2: YYYY-MM-DD HH:MM:SS (data)                                      ║
# ║    Linha 3: Descrição da mudança                                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
import sys
sys.path.insert(0, '/app/backend')
import set_cloudinary_env

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, Form, File, UploadFile
import base64
import re
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Load environment variables from .env file
load_dotenv()
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from brazilian_locations import get_all_states, get_cities_by_state, get_all_cities
import jwt
from jwt.exceptions import PyJWTError as JWTError
from passlib.hash import bcrypt
import random
import string
import json
import base64
import re
import pydantic
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio

# Web Push Notifications
from pywebpush import webpush, WebPushException

# Import XGate service
from services.xgate_service import xgate_service
from services.usdt_service import USDTService

# Import Cloudinary service
sys.path.append('/app/backend')
from services.cloudinary_service import upload_file_to_cloudinary

# Import Labelview dependencies
# labelview import removido (feature descontinuada)

# Importar modelos do catálogo
from models.catalog import (
    Product, ProductCategory, Cart, CartItem, Order,
    ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate,
    AddToCartRequest, CreateOrderRequest, UpdateOrderStatusRequest,
    AssignDeliveryRequest, MerchantSettingsUpdate,
    ProductStatus, OrderType, OrderStatus, PaymentStatus
)

# Importar modelos de mobilidade
from models.mobility_models import (
    DriverProfile, DriverProfileCreate, DriverProfileUpdate,
    Ride, RideRequest, RideEstimate, RideEstimateResponse,
    RideStatus, RatingRequest, LocationUpdate, NearbyDriversRequest,
    DriverWithPrice, RideCalculation, Location, Vehicle, DriverPricing
)

# Importar rotas de mobilidade
from routes import mobility_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Corrigir problema de serialização do MongoDB ObjectId
# For Pydantic v2 compatibility
try:
    from pydantic.json import ENCODERS_BY_TYPE
    ENCODERS_BY_TYPE[ObjectId] = str
except ImportError:
    # Fallback for older Pydantic versions
    try:
        pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
    except AttributeError:
        # For Pydantic v2, we'll handle ObjectId serialization differently
        pass

# Custom JSON encoder for ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with fallback defaults
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
# Use timeouts CURTOS para startup rápido (conexão lazy)
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=1000,  # 1 segundo apenas
    connectTimeoutMS=1000,
    socketTimeoutMS=1000,
    maxPoolSize=10
)
db_name = os.environ.get('DB_NAME', 'transmill')
db = client[db_name]
logger.info(f"🔌 MongoDB configurado - Database: {db_name} (lazy connection)")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Email settings (SMTP)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USER = os.environ.get('EMAIL_USER', '')
EMAIL_PASS = os.environ.get('EMAIL_PASS', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', EMAIL_USER)

# Frontend URL for referral links
# IMPORTANTE: Em produção, SEMPRE usar app.transmill.com.br
_env_frontend_url = os.environ.get('FRONTEND_URL', '')
if _env_frontend_url and 'localhost' not in _env_frontend_url and 'emergent' not in _env_frontend_url:
    FRONTEND_URL = _env_frontend_url
else:
    # Forçar URL correta em produção (não usar agitomil)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://app.transmill.com.br')
# URL de produção para links de indicação (sempre usar esta)
PRODUCTION_URL = "https://app.transmill.com.br"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    # STARTUP CODE (before yield)
    logger.info("🚀 Application starting up...")
    
    try:
        await asyncio.wait_for(db.command('ping'), timeout=1.0)
        logger.info("✅ MongoDB conectado")
    except asyncio.TimeoutError:
        logger.warning("⚠️ MongoDB timeout - continuando")
    except Exception as e:
        logger.warning(f"⚠️ MongoDB indisponível - continuando: {str(e)}")
    
    yield  # App runs here
    
    # SHUTDOWN CODE (after yield)
    logger.info("🛑 Application shutting down...")

# Create the main app
app = FastAPI(title="Transmill API", version="2.38.51", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Configurar rotas de mobilidade
mobility_routes.set_db(db)

# Startup event handler para testar MongoDB (não bloqueia startup)


# Configure CORS to allow frontend access
# Permitir origens de desenvolvimento e produção
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://transmill.com.br",
    "https://www.transmill.com.br",
    "https://app.transmill.com.br",
    "http://app.transmill.com.br"
]

# Adicionar domínios Emergent automaticamente para preview/staging/produção
backend_url = os.environ.get('REACT_APP_BACKEND_URL', '')
frontend_env_url = os.environ.get('FRONTEND_URL', '')

# Adicionar domínios Emergent dinamicamente
for url in [backend_url, frontend_env_url]:
    if url and ('emergentagent.com' in url or 'emergent.host' in url):
        from urllib.parse import urlparse
        parsed = urlparse(url)
        base_domain = f"{parsed.scheme}://{parsed.netloc}"
        # Adicionar variações com e sem porta
        for domain in [base_domain, base_domain.replace(':8001', '').replace(':3000', '')]:
            if domain and domain not in allowed_origins:
                allowed_origins.append(domain)

# Adicionar padrões genéricos Emergent para garantir compatibilidade
emergent_patterns = [
    "https://*.emergentagent.com",
    "https://*.emergent.host"
]
# Log para debug
logger.info(f"🌐 CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Funções auxiliares para email
def generate_reset_code() -> str:
    """Gera código de 6 dígitos para recuperação de senha"""
    return ''.join(random.choices(string.digits, k=6))


def generate_slug(text: str) -> str:
    """Gera um slug amigável para URL a partir de um texto"""
    if not text:
        return ""
    
    # Converter para minúsculas
    slug = text.lower()
    
    # Remover acentos
    import unicodedata
    slug = ''.join(c for c in unicodedata.normalize('NFD', slug) 
                   if unicodedata.category(c) != 'Mn')
    
    # Substituir espaços e caracteres especiais por hífen
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    
    # Remover hífens no início e fim
    slug = slug.strip('-')
    
    # Limitar tamanho
    slug = slug[:50]
    
    return slug


def generate_referral_code(length: int = 8) -> str:
    """Gera um código de indicação único alfanumérico"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def validate_cpf(cpf: str) -> bool:
    """Valida formato e dígitos verificadores do CPF"""
    if not cpf:
        return False
    
    # Remove pontuação
    cpf_numbers = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf_numbers) != 11:
        return False
    
    # Verifica se não são todos os mesmos dígitos
    if len(set(cpf_numbers)) == 1:
        return False
    
    # Calcula primeiro dígito verificador
    soma = sum(int(cpf_numbers[i]) * (10 - i) for i in range(9))
    primeiro_digito = 11 - (soma % 11)
    if primeiro_digito >= 10:
        primeiro_digito = 0
    
    # Calcula segundo dígito verificador
    soma = sum(int(cpf_numbers[i]) * (11 - i) for i in range(10))
    segundo_digito = 11 - (soma % 11)
    if segundo_digito >= 10:
        segundo_digito = 0
    
    # Verifica dígitos verificadores
    return int(cpf_numbers[9]) == primeiro_digito and int(cpf_numbers[10]) == segundo_digito

def validate_pix_key(pix_key: str, pix_key_type: str) -> bool:
    """Valida chave PIX baseada no tipo"""
    import re
    
    if not pix_key or not pix_key_type:
        return False
    
    pix_key = pix_key.strip()
    
    if pix_key_type == 'cpf':
        return validate_cpf(pix_key)
    elif pix_key_type == 'cnpj':
        # Validar CNPJ básico (formato)
        cnpj_clean = re.sub(r'[^0-9]', '', pix_key)
        return len(cnpj_clean) == 14 and cnpj_clean.isdigit()
    elif pix_key_type == 'email':
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, pix_key) is not None
    elif pix_key_type == 'phone':
        # Remove caracteres especiais e verifica se tem 10 ou 11 dígitos
        phone_clean = re.sub(r'[^0-9]', '', pix_key)
        return len(phone_clean) in [10, 11]
    elif pix_key_type == 'random':
        # Chave aleatória deve ter 32 caracteres alfanuméricos
        return len(pix_key) == 32 and pix_key.replace('-', '').isalnum()
    
    return False

def validate_cep(cep: str) -> bool:
    """Valida formato do CEP brasileiro"""
    if not cep:
        return False
    
    # Remove caracteres especiais
    cep_clean = re.sub(r'[^0-9]', '', cep)
    
    # Verifica se tem 8 dígitos
    return len(cep_clean) == 8

def validate_base64_image(base64_string: str) -> bool:
    """Valida se a string é uma imagem base64 válida"""
    if not base64_string:
        return False
    
    # Verifica se começa com data:image/
    if not base64_string.startswith('data:image/'):
        return False
    
    # Verifica se contém base64,
    if ',base64,' not in base64_string and ';base64,' not in base64_string:
        return False
    
    return True

def base64_to_bytes(base64_string: str) -> bytes:
    """Converte string base64 para bytes"""
    # Remove o prefixo data:image/...;base64,
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    return base64.b64decode(base64_string)

async def send_email(to_email: str, subject: str, body: str) -> bool:
    """Envia email usando SMTP"""
    try:
        # Se não há configurações de email, simula o envio para desenvolvimento
        if not EMAIL_USER or not EMAIL_PASS:
            print(f"🔔 [EMAIL SIMULADO] Para: {to_email}")
            print(f"📧 Assunto: {subject}")
            print(f"📝 Corpo: {body}")
            return True
            
        # Configuração real do SMTP
        def send_email_sync():
            msg = MIMEMultipart()
            msg['From'] = EMAIL_FROM
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.starttls()
                server.login(EMAIL_USER, EMAIL_PASS)
                server.send_message(msg)
                
        # Executa em thread para não bloquear
        await asyncio.get_event_loop().run_in_executor(None, send_email_sync)
        return True
        
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")
        return False

async def check_reset_attempts(email: str) -> bool:
    """Verifica se o usuário já excedeu o limite de tentativas (2 por mês)"""
    # Data limite (30 dias atrás)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Contar tentativas no último mês
    attempts_count = await db.password_reset_codes.count_documents({
        "email": email,
        "created_at": {"$gte": thirty_days_ago}
    })
    
    return attempts_count < 2  # Máximo 2 tentativas por mês

async def find_socio_operador_by_state(state: str):
    """Encontra o Sócio Operador do estado especificado"""
    socio = await db.users.find_one({
        "hierarchical_role": "socio_operador",
        "state": state,
        "is_active": True
    })
    return socio

async def find_mini_agencia_by_city(state: str, city: str):
    """Encontra a Mini Agencia da cidade especificada"""
    mini_agencia = await db.users.find_one({
        "hierarchical_role": "mini_agencia", 
        "state": state,
        "city": city,
        "is_active": True
    })
    return mini_agencia

async def find_consultor_in_hierarchy(merchant_referrer_chain):
    """Encontra o Consultor na cadeia de indicação da loja"""
    # Navegar pela cadeia de indicação até encontrar um consultor
    current_user_id = merchant_referrer_chain
    
    while current_user_id:
        user = await db.users.find_one({"id": current_user_id})
        if not user:
            break
            
        # Verificar se é consultor
        if user.get("hierarchical_role") == "consultor":
            return user
            
        # Continuar na cadeia
        current_user_id = user.get("referred_by")
    
    return None

# Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    user_type: str  # 'cliente' or 'lojista'

class UserRegister(UserBase):
    password: str
    # Campo específico para clientes
    cpf: Optional[str] = None
    
    # Campos específicos para militares
    military_branch: Optional[str] = None  # 'exercito', 'marinha', 'aeronautica'
    military_status: Optional[str] = None  # 'ativo', 'inativo', 'pensionista', 'reservista'
    rg_militar: Optional[str] = None  # Identidade militar
    
    # Dados PIX para saque (obrigatório para todos)
    pix_key: str  # Chave PIX para recebimento de saques
    pix_key_type: str  # Tipo da chave: 'cpf', 'email', 'phone', 'random'
    
    # Endereço completo (obrigatório para todos)
    cep: str
    street: str  # Rua
    number: str  # Número
    neighborhood: str  # Bairro
    city: str
    state: str
    complement: Optional[str] = None  # Complemento (opcional)
    
    # Documentos obrigatórios
    rg_front: str  # Base64 da foto do RG frente
    rg_back: str   # Base64 da foto do RG verso
    
    # Campos específicos para lojistas e prestadores (CNPJ)
    company_name: Optional[str] = None
    cnpj: Optional[str] = None
    
    # Dados do sócio administrador (obrigatório para CNPJ)
    admin_name: Optional[str] = None  # Nome do sócio administrador
    admin_cpf: Optional[str] = None   # CPF do sócio administrador
    admin_email: Optional[str] = None # Email do sócio administrador
    admin_whatsapp: Optional[str] = None # WhatsApp do sócio administrador
    admin_rg_front: Optional[str] = None # RG frente do sócio
    admin_rg_back: Optional[str] = None  # RG verso do sócio
    
    # Campos específicos para lojistas
    whatsapp: Optional[str] = None
    cashback_rate: Optional[float] = Field(None, ge=1.0, le=10.0, description="Taxa de cashback entre 1% e 10% (obrigatório para lojistas)")
    business_segment: Optional[str] = None
    google_maps_url: Optional[str] = None
    
    # Configurações de Catálogo/Delivery
    accepts_pickup: Optional[bool] = True  # Aceita retirada no balcão
    accepts_delivery: Optional[bool] = False  # Aceita delivery
    delivery_fee: Optional[float] = 0.0  # Taxa de entrega fixa
    delivery_radius_km: Optional[float] = 5.0  # Raio de entrega em km
    estimated_delivery_time: Optional[int] = 30  # Tempo estimado em minutos
    
    # Sistema de indicações
    referral_code_used: Optional[str] = None  # Código de quem indicou
    
    # Imagens de perfil
    profile_image: Optional[str] = None  # Base64 da foto de perfil (cliente) ou logo (lojista)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class HierarchicalUserRegister(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    whatsapp: str
    state: str
    city: Optional[str] = None  # Obrigatório apenas para Mini Agencia
    role: str  # 'socio_operador', 'mini_agencia', 'consultor'
    password: str
    # Relacionamentos
    parent_user_id: Optional[str] = None  # ID do usuário superior na hierarquia

class HierarchicalUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: str
    whatsapp: str
    state: str
    city: Optional[str] = None
    role: str  # 'socio_operador', 'mini_agencia', 'consultor'
    # Balanços específicos
    balance: float = 0.0
    cashback_balance: float = 0.0
    usdt_balance: float = 0.0  # Saldo em USDT
    commission_balance: float = 0.0  # Comissões acumuladas
    # Relacionamentos
    parent_user_id: Optional[str] = None
    network_users: List[str] = Field(default_factory=list)  # IDs dos usuários na sua rede
    # Controle
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str  # ID do master que criou
    password_hash: str

# Team Member Models (Equipe: Funcionários e Entregadores)
class TeamMemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    permissions: List[str]  # Lista de áreas permitidas: 'pos', 'sales', 'orders', 'catalog', 'extract', etc.
    
class TeamMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None

class TeamMember(BaseModel):
    id: str
    merchant_id: str  # ID do lojista dono
    full_name: str
    email: str
    phone: str
    permissions: List[str]  # Lista de áreas que o membro pode acessar
    is_active: bool
    is_owner: bool = False
    created_at: str
    created_by: str  # ID do criador
class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    balance: float = 0.0
    cashback_balance: float = 0.0
    usdt_balance: float = 0.0  # Saldo em USDT
    platform_balance: float = 0.0  # Para conta master da plataforma
    platform_usdt_balance: float = 0.0  # Saldo USDT da plataforma (master)
    social_points: int = 0  # Pontos do sistema social
    is_verified: bool = False
    is_blocked: bool = False  # Status de bloqueio do usuário
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    password_hash: Optional[str] = None  # Hash da senha
    # Campo específico para clientes
    cpf: Optional[str] = None
    
    # Campos específicos para militares
    military_branch: Optional[str] = None  # 'exercito', 'marinha', 'aeronautica'
    military_status: Optional[str] = None  # 'ativo', 'inativo', 'pensionista', 'reservista'
    rg_militar: Optional[str] = None  # Identidade militar
    
    # Dados PIX para saque (obrigatório para todos)
    pix_key: Optional[str] = None  # Chave PIX para recebimento de saques
    pix_key_type: Optional[str] = None  # Tipo da chave: 'cpf', 'email', 'phone', 'random'
    
    # Endereço completo (obrigatório para todos)
    cep: Optional[str] = None
    street: Optional[str] = None  # Rua
    number: Optional[str] = None  # Número
    neighborhood: Optional[str] = None  # Bairro
    city: Optional[str] = None
    state: Optional[str] = None
    complement: Optional[str] = None  # Complemento (opcional)
    
    # Documentos obrigatórios
    rg_front: Optional[str] = None  # Base64 da foto do RG frente
    rg_back: Optional[str] = None   # Base64 da foto do RG verso
    
    # Campos específicos para lojistas e prestadores (CNPJ)
    company_name: Optional[str] = None
    cnpj: Optional[str] = None
    
    # Dados do sócio administrador (para CNPJ)
    admin_name: Optional[str] = None  # Nome do sócio administrador
    admin_cpf: Optional[str] = None   # CPF do sócio administrador
    admin_email: Optional[str] = None # Email do sócio administrador
    admin_whatsapp: Optional[str] = None # WhatsApp do sócio administrador
    admin_rg_front: Optional[str] = None # RG frente do sócio
    admin_rg_back: Optional[str] = None  # RG verso do sócio
    
    # Campos específicos para lojistas
    whatsapp: Optional[str] = None
    cashback_rate: Optional[float] = Field(None, ge=1.0, le=10.0, description="Taxa de cashback entre 1% e 10% (obrigatório para lojistas)")
    business_segment: Optional[str] = None
    google_maps_url: Optional[str] = None
    
    # Configurações de Catálogo/Delivery
    accepts_pickup: Optional[bool] = True  # Aceita retirada no balcão
    accepts_delivery: Optional[bool] = False  # Aceita delivery
    delivery_fee: Optional[float] = 0.0  # Taxa de entrega fixa
    delivery_radius_km: Optional[float] = 5.0  # Raio de entrega em km
    estimated_delivery_time: Optional[int] = 30  # Tempo estimado em minutos
    
    # Endereço da loja (campos legados - manter compatibilidade)
    address: Optional[str] = None
    # Sistema de indicações
    referral_code: str = Field(default_factory=lambda: ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)))
    referred_by: Optional[str] = None  # ID de quem indicou este usuário
    referral_count: int = 0  # Quantidade de pessoas que este usuário indicou
    is_master_account: bool = False  # Conta master da plataforma
    is_labelview_master: Optional[bool] = False  # Conta master do Labelview
    # Campos hierárquicos
    hierarchical_role: Optional[str] = None  # 'socio_operador', 'mini_agencia', 'consultor'
    hierarchical_user_id: Optional[str] = None  # ID do usuário hierárquico correspondente
    # Imagens de perfil
    profile_image: Optional[str] = None  # Base64 da foto de perfil (cliente) ou logo (lojista)
    # Preferências do usuário
    theme: Optional[str] = "light"  # 'dark' ou 'light' - padrão light

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    merchant_id: Optional[str] = None
    transaction_type: str  # 'deposit', 'payment', 'withdrawal', 'cashback', 'referral_bonus_client', 'referral_bonus_merchant', 'platform_commission', 'hierarchical_commission', 'hierarchical_cashback', 'manual_credit', 'manual_debit', 'socio_operador_bonus', 'mini_agencia_bonus', 'consultor_bonus'
    amount: float
    cashback_amount: float = 0.0
    description: str
    status: str = "completed"  # completed, pending, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Novos campos para lançamentos master
    created_by_master: bool = False
    master_user_id: Optional[str] = None

class DepositRequest(BaseModel):
    amount: float
    method: str  # 'pix' or 'card'

class PaymentRequest(BaseModel):
    amount: float
    qr_code: Optional[str] = None
    digital_code: Optional[str] = None

class WithdrawalRequest(BaseModel):
    amount: float
    pix_key: str
    pix_key_type: str  # 'cpf', 'email', 'phone', 'random'
    bank_name: str

class USDTTransferRequest(BaseModel):
    external_wallet: str
    amount: float
    password: str

class ApproveUserRequest(BaseModel):
    user_id: str
    approved: bool

class QRCodeRequest(BaseModel):
    amount: float

class DigitalCodeRequest(BaseModel):
    digital_code: str


class PaymentCodeRequest(BaseModel):
    code: str

class MerchantProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    cnpj: Optional[str] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    business_segment: Optional[str] = None
    google_maps_url: Optional[str] = None
    menu_catalog_url: Optional[str] = None
    cashback_rate: Optional[float] = Field(None, ge=1.0, le=10.0, description="Taxa de cashback entre 1% e 10% (obrigatório para lojistas)")
    
    # Configurações de entrega
    accepts_pickup: Optional[bool] = None
    accepts_delivery: Optional[bool] = None
    preparation_time: Optional[int] = Field(None, ge=10, le=180, description="Tempo de preparo em minutos (10-180)")

class NotificationCreate(BaseModel):
    title: str
    message: str
    image: Optional[str] = None  # Base64 image

# Novos modelos para funcionalidades master
class MasterTransactionCreate(BaseModel):
    user_id: str
    amount: float
    transaction_type: str  # 'manual_credit' ou 'manual_debit'
    description: str

class HierarchicalAgentUpdate(BaseModel):
    user_id: str
    hierarchical_role: str  # 'socio_operador', 'mini_agencia', 'consultor'
    state: Optional[str] = None  # Obrigatório para socio_operador
    city: Optional[str] = None   # Obrigatório para mini_agencia
    target_type: str  # 'all', 'clients', 'merchants', 'individual'
    target_user_id: Optional[str] = None  # Para notificação individual
    priority: Optional[str] = "normal"  # 'low', 'normal', 'high', 'urgent'

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: Optional[bool] = None

class DigitalPaymentRequest(BaseModel):
    amount: float
    digital_code: str

class ProfileImageUpdate(BaseModel):
    profile_image: str

class DocumentsUpdate(BaseModel):
    rg_front: Optional[str] = None
    rg_back: Optional[str] = None

class ProfileDataUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    cpf: Optional[str] = None  # CPF para clientes
    
    # Dados PIX para saque
    pix_key: Optional[str] = None
    pix_key_type: Optional[str] = None
    
    # Endereço completo
    cep: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    complement: Optional[str] = None
    
    # Campos para empresas (lojistas/prestadores)
    company_name: Optional[str] = None
    cnpj: Optional[str] = None
    whatsapp: Optional[str] = None
    business_segment: Optional[str] = None
    google_maps_url: Optional[str] = None
    
    # Dados do sócio administrador
    admin_name: Optional[str] = None
    admin_cpf: Optional[str] = None
    admin_email: Optional[str] = None
    admin_whatsapp: Optional[str] = None
    
    # Configurações
    theme: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

# Modelos para recuperação de senha
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    reset_code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class PasswordResetCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False
    attempts: int = 0

class CashbackRateUpdate(BaseModel):
    cashback_rate: float

class HierarchicalUserStatusUpdate(BaseModel):
    is_active: bool

# Utility functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def get_token_from_header(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract token string from Authorization header without Pydantic model validation"""
    return credentials.credentials

def decode_qr_code(qr_code: str):
    """Decodifica QR code Transmill para extrair dados do lojista"""
    try:
        if not qr_code.startswith("TRANSMILL_"):
            raise ValueError("QR Code inválido - não é do Transmill")
        
        # Extrair dados codificados
        encoded_data = qr_code.replace("TRANSMILL_", "")
        qr_json = base64.b64decode(encoded_data.encode()).decode()
        qr_data = json.loads(qr_json)
        
        # Validar timestamp (QR Code válido por 30 minutos)
        qr_time = datetime.fromisoformat(qr_data["timestamp"].replace('Z', '+00:00'))
        current_time = datetime.now(timezone.utc)
        time_diff = current_time - qr_time
        
        if time_diff.total_seconds() > 1800:  # 30 minutos
            raise ValueError("QR Code expirado")
        
        return qr_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QR Code inválido: {str(e)}")

def generate_qr_code(merchant_id: str, merchant_data: dict):
    """Gera QR code com dados do lojista e valor da venda codificados"""
    
    # Estrutura do QR Code com dados do lojista e valor
    qr_data = {
        "merchant_id": merchant_id,
        "merchant_name": merchant_data.get("company_name") or merchant_data.get("full_name"),
        "cashback_rate": merchant_data.get("cashback_rate", 0),
        "amount": merchant_data.get("amount", 0),  # Valor da venda
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "code": ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    }
    
    # Codificar dados em base64 para o QR Code
    qr_json = json.dumps(qr_data)
    qr_encoded = base64.b64encode(qr_json.encode()).decode()
    
    return f"TRANSMILL_{qr_encoded}"

def generate_digital_code(qr_code: str):
    """Gera código digitável baseado no QR Code para entrada manual"""
    
    # Usar os últimos 12 caracteres do QR Code codificado para criar código legível
    encoded_part = qr_code.replace("TRANSMILL_", "")
    
    # Pegar uma parte do hash para criar código mais curto
    import hashlib
    hash_obj = hashlib.md5(encoded_part.encode())
    hex_hash = hash_obj.hexdigest().upper()
    
    # Formato: AGITO-XXXX-XXXX-XXXX (16 caracteres + separadores)
    code_parts = [
        "AGITO",
        hex_hash[0:4],
        hex_hash[4:8], 
        hex_hash[8:12]
    ]
    
    return "-".join(code_parts)

def decode_digital_code(digital_code: str, qr_code: str):
    """Valida se o código digitável corresponde ao QR Code"""
    
    try:
        expected_digital_code = generate_digital_code(qr_code)
        return digital_code.upper().replace(" ", "").replace("-", "") == expected_digital_code.replace("-", "")
    except Exception:
        return False

def format_digital_code(code: str) -> str:
    """Formata código digitável removendo espaços e padronizando formato"""
    # Remove espaços, converte para maiúscula
    formatted = code.upper().strip().replace(" ", "")
    
    # Se já tem hífens, mantém o formato
    if "-" in formatted:
        return formatted
    
    # Se não tem hífens, adiciona no formato AGITO-XXXX-XXXX-XXXX
    if formatted.startswith("AGITO"):
        formatted = formatted.replace("AGITO", "")
        if len(formatted) >= 12:
            return f"AGITO-{formatted[0:4]}-{formatted[4:8]}-{formatted[8:12]}"
    
    return formatted

async def distribute_hierarchical_commissions(commission_amount: float, merchant_state: str, merchant_city: str, client_id: str, merchant_id: str, description: str) -> float:
    """
    Distribui comissões hierárquicas baseado na localização do lojista
    30% do cashback é distribuído:
    - Sócio Operador (Estado): 10% dos 30% = 1/3 da comissão
    - Mini Agência (Cidade): 5% dos 30% = 1/6 da comissão
    - Consultor (Rede): 5% dos 30% = 1/6 da comissão
    Retorna o valor total distribuído
    """
    total_distributed = 0.0
    
    try:
        # 1. Buscar Sócio Operador no mesmo estado
        socio_operador = await db.users.find_one({
            "hierarchical_role": "socio_operador",
            "user_type": "hierarchical",
            "is_active": True
        })
        
        if socio_operador:
            # Sócio Operador recebe 10% dos 30% = 1/3 da comissão total
            socio_operador_commission = commission_amount * (10.0 / 30.0)  # 33,33%
            
            await db.users.update_one(
                {"id": socio_operador["id"]},
                {"$inc": {"cashback_balance": socio_operador_commission}}
            )
            
            # Atualizar também a conta de cliente do sócio operador
            await db.users.update_one(
                {"hierarchical_user_id": socio_operador["id"]},
                {"$inc": {"cashback_balance": socio_operador_commission}}
            )
            
            # Criar transação para o sócio operador
            socio_operador_transaction = {
                "id": str(uuid.uuid4()),
                "user_id": socio_operador["id"],
                "transaction_type": "hierarchical_commission",
                "amount": socio_operador_commission,
                "description": f"Comissão Sócio Operador ({merchant_state}) - {description}",
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(socio_operador_transaction)
            
            total_distributed += socio_operador_commission
        
        # 2. Buscar Mini Agência na mesma cidade
        mini_agencia = await db.users.find_one({
            "hierarchical_role": "mini_agencia",
            "user_type": "hierarchical",
            "is_active": True
        })
        
        if mini_agencia:
            # Mini Agência recebe 5% dos 30% = 1/6 da comissão total
            mini_agencia_commission = commission_amount * (5.0 / 30.0)  # 16,67%
            
            await db.users.update_one(
                {"id": mini_agencia["id"]},
                {"$inc": {"cashback_balance": mini_agencia_commission}}
            )
            
            # Atualizar também a conta de cliente da mini agência
            await db.users.update_one(
                {"hierarchical_user_id": mini_agencia["id"]},
                {"$inc": {"cashback_balance": mini_agencia_commission}}
            )
            
            # Criar transação para a mini agência
            mini_agencia_transaction = {
                "id": str(uuid.uuid4()),
                "user_id": mini_agencia["id"],
                "transaction_type": "hierarchical_commission",
                "amount": mini_agencia_commission,
                "description": f"Comissão Mini Agência ({merchant_city}, {merchant_state}) - {description}",
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(mini_agencia_transaction)
            
            total_distributed += mini_agencia_commission
        
        # 3. Buscar Consultor que tenha o cliente ou lojista em sua rede
        # Verificar se o cliente foi indicado por alguém que é consultor
        client = await db.users.find_one({"id": client_id})
        merchant = await db.users.find_one({"id": merchant_id})
        
        consultor = None
        
        # Verificar se o cliente foi indicado por um consultor
        if client and client.get("referred_by"):
            referrer = await db.users.find_one({"id": client["referred_by"]})
            if referrer and referrer.get("hierarchical_role") == "consultor":
                consultor_user = await db.users.find_one({
                    "hierarchical_role": "consultor",
                    "user_type": "hierarchical",
                    "is_active": True
                })
                if consultor_user:
                    consultor = consultor_user
        
        # Se não encontrou consultor pelo cliente, verificar pelo lojista
        if not consultor and merchant and merchant.get("referred_by"):
            referrer = await db.users.find_one({"id": merchant["referred_by"]})
            if referrer and referrer.get("hierarchical_role") == "consultor":
                consultor_user = await db.users.find_one({
                    "hierarchical_role": "consultor",
                    "user_type": "hierarchical",
                    "is_active": True
                })
                if consultor_user:
                    consultor = consultor_user
        
        if consultor:
            # Consultor recebe 5% dos 30% = 1/6 da comissão total
            consultor_commission = commission_amount * (5.0 / 30.0)  # 16,67%
            
            await db.users.update_one(
                {"id": consultor["id"]},
                {"$inc": {"cashback_balance": consultor_commission}}
            )
            
            # Atualizar também a conta de cliente do consultor
            await db.users.update_one(
                {"hierarchical_user_id": consultor["id"]},
                {"$inc": {"cashback_balance": consultor_commission}}
            )
            
            # Criar transação para o consultor
            consultor_transaction = {
                "id": str(uuid.uuid4()),
                "user_id": consultor["id"],
                "transaction_type": "hierarchical_commission",
                "amount": consultor_commission,
                "description": f"Comissão Consultor (Rede de Indicações) - {description}",
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(consultor_transaction)
            
            total_distributed += consultor_commission
        
        logger.info(f"Distribuição hierárquica: R$ {total_distributed:.2f} distribuídos de R$ {commission_amount:.2f}")
        return total_distributed
        
    except Exception as e:
        # Em caso de erro, retornar 0 para que a comissão vá toda para a plataforma
        logger.error(f"Erro ao distribuir comissões hierárquicas: {str(e)}")
        return 0.0

async def get_current_master_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency para validar que o usuário é master"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_doc = await db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        if not user_doc.get("is_master_account", False):
            raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
        
        return User(**user_doc)
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

class DictObject:
    """Wrapper que permite acessar dict como objeto (dict.key) e como dict (dict.get('key'))"""
    def __init__(self, data: dict):
        self._data = data
    
    def __getattr__(self, key):
        return self._data.get(key)
    
    def get(self, key, default=None):
        return self._data.get(key, default)
    
    def __getitem__(self, key):
        return self._data[key]

async def get_current_user(user_id: str = Depends(verify_token)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    # Retornar dict completo com wrapper para compatibilidade
    # Permite acessar como user.id ou user.get('id')
    User(**user)  # Validação
    return DictObject(user)

# ============================================
# WHITE-LABEL HELPERS - FILTRO POR UNIDADE
# ============================================
# IMPORTANTE: O isolamento é por UNIDADE específica (unidade_id), 
# não por estado/cidade. Podem existir múltiplas unidades na mesma região.

async def get_franquia_filter(current_user) -> dict:
    """
    Retorna o filtro MongoDB para isolamento white-label.
    
    REGRA PRINCIPAL: Isolamento é por UNIDADE (unidade_id), não por região.
    Múltiplas unidades podem existir na mesma cidade/estado.
    
    Prioridade de filtro:
    1. unidade_id (mais específico - isolamento por unidade)
    2. franquia_id (isolamento por franquia)
    3. franquia_slug (compatibilidade)
    
    Retorna:
    - {"unidade_id": "id"} para consultores/regionais/clientes vinculados
    - {"franquia_id": "id"} se não tem unidade específica
    - {} se for master (vê tudo)
    """
    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    
    # Master vê tudo
    if user_data.get('is_master_account') or user_data.get('user_type') == 'transmill_master':
        return {}
    
    # Labelview Master também vê tudo
    if user_data.get('is_labelview_master') or user_data.get('user_type') == 'labelview_master':
        return {}
    
    # 1. PRIORIDADE: unidade_id (isolamento mais específico)
    # Se for unidade labelview, usar seu próprio ID
    if user_data.get('user_type') == 'labelview_unidade':
        return {"unidade_id": user_data.get('id')}
    
    # Se for consultor/regional, usar unidade_id vinculada
    unidade_id = user_data.get('unidade_id')
    if unidade_id:
        return {"unidade_id": unidade_id}
    
    # 2. Fallback: franquia_id
    franquia_id = user_data.get('franquia_id')
    if franquia_id:
        return {"franquia_id": franquia_id}
    
    # 3. Último fallback: franquia_slug (compatibilidade)
    franquia_slug = user_data.get('franquia_slug')
    if franquia_slug:
        return {"franquia_slug": franquia_slug}
    
    # Segurança: retorna filtro que não retorna nada
    return {"unidade_id": "__NONE__"}

async def get_franquia_context(current_user) -> dict:
    """
    Retorna o contexto completo da unidade/franquia do usuário.
    Usado para personalizar nomes de serviços (ex: "NomeUnidade Mobility")
    
    IMPORTANTE: O nome vem da UNIDADE, não da franquia genérica.
    Cada unidade tem sua própria identidade visual.
    
    Retorna:
    {
        "unidade_id": str,
        "unidade_nome": str,  # Nome da unidade específica
        "franquia_slug": str,
        "franquia_id": str,
        "is_master": bool
    }
    """
    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    
    context = {
        "unidade_id": user_data.get('unidade_id'),
        "unidade_nome": None,
        "franquia_slug": user_data.get('franquia_slug'),
        "franquia_id": user_data.get('franquia_id'),
        "franquia_nome": None,  # Mantido para compatibilidade
        "is_master": user_data.get('is_master_account', False) or user_data.get('user_type') == 'transmill_master' or user_data.get('is_labelview_master', False)
    }
    
    # Se for unidade labelview, usar seus próprios dados
    if user_data.get('user_type') == 'labelview_unidade':
        context["unidade_id"] = user_data.get('id')
        context["unidade_nome"] = user_data.get("nome_fantasia") or user_data.get("company_name") or user_data.get("full_name")
    
    # Buscar nome da unidade específica
    elif context["unidade_id"]:
        unidade = await db.users.find_one({"id": context["unidade_id"]})
        if unidade:
            context["unidade_nome"] = unidade.get("nome_fantasia") or unidade.get("company_name") or unidade.get("full_name")
    
    # Fallback: buscar da franquia
    if not context["unidade_nome"] and context["franquia_slug"]:
        franquia = await db.franquias.find_one({"slug": context["franquia_slug"]})
        if franquia:
            context["unidade_nome"] = franquia.get("nome", "Transmill")
    
    # Último fallback
    if not context["unidade_nome"]:
        context["unidade_nome"] = "Transmill"
    
    # Compatibilidade: franquia_nome = unidade_nome
    context["franquia_nome"] = context["unidade_nome"]
    
    return context

class UserActionRequest(BaseModel):
    user_id: str
    action: str  # "block", "unblock", "delete"

@api_router.get("/users/buscar-por-cpf")
async def buscar_usuario_por_cpf(
    cpf: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Busca um usuário pelo CPF
    Retorna dados do usuário se encontrado
    ISOLAMENTO: Só encontra usuários da mesma unidade/franquia
    """
    try:
        # Limpar CPF (remover pontos e traços)
        cpf_limpo = cpf.replace(".", "").replace("-", "").strip()
        
        logger.info(f"🔍 Buscando usuário por CPF: {cpf_limpo}")
        
        # Filtro de isolamento por unidade/franquia
        filtro = {"cpf": cpf_limpo}
        
        # Se não for master, filtra por unidade/franquia
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'master':
            unidade_id = current_user.get('unidade_id')
            franquia_slug = current_user.get('franquia_slug')
            
            if unidade_id:
                filtro["$or"] = [
                    {"unidade_id": unidade_id},
                    {"franquia_slug": franquia_slug}
                ]
            elif franquia_slug:
                filtro["franquia_slug"] = franquia_slug
        
        # Buscar usuário no banco
        usuario = await db.users.find_one(filtro)
        
        # Se não encontrou, buscar também em labelview_clientes
        if not usuario:
            filtro_cliente = {"cpf": cpf_limpo}
            if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'master':
                unidade_id = current_user.get('unidade_id')
                franquia_slug = current_user.get('franquia_slug')
                if unidade_id:
                    filtro_cliente["unidade_id"] = unidade_id
                elif franquia_slug:
                    filtro_cliente["franquia_slug"] = franquia_slug
            
            cliente = await db.labelview_clientes.find_one(filtro_cliente)
            if cliente:
                usuario = {
                    "id": cliente.get("id"),
                    "full_name": cliente.get("nome"),
                    "cpf": cliente.get("cpf"),
                    "email": cliente.get("email"),
                    "phone": cliente.get("telefone"),
                    "tipo": "cliente"
                }
        
        if usuario:
            # Remover campos sensíveis
            if '_id' in usuario:
                del usuario['_id']
            if 'password_hash' in usuario:
                del usuario['password_hash']
            
            logger.info(f"✅ Usuário encontrado: {usuario.get('full_name', usuario.get('email'))}")
            
            return {
                "success": True,
                "user": usuario,  # Compatibilidade com frontend
                "usuario": usuario,
                "encontrado": True
            }
        else:
            logger.info(f"⚠️  Usuário não encontrado com CPF: {cpf_limpo}")
            return {
                "success": True,
                "user": None,
                "encontrado": False,
                "message": "Usuário não encontrado"
            }
            
    except Exception as e:
        logger.error(f"❌ Erro ao buscar usuário por CPF: {str(e)}")
        return {
            "success": False,
            "user": None,
            "encontrado": False,
            "message": f"Erro ao buscar usuário: {str(e)}"
        }

        # === CAMPOS BÁSICOS ===
        if profile_data.full_name:
            update_fields["full_name"] = profile_data.full_name.strip()
        
        if profile_data.phone:
            # Validar formato do telefone (básico)
            phone_clean = re.sub(r'[^0-9]', '', profile_data.phone)
            if len(phone_clean) < 10 or len(phone_clean) > 11:
                raise HTTPException(status_code=400, detail="Número de telefone inválido")
            update_fields["phone"] = profile_data.phone
        
        if profile_data.cpf:
            # Validar CPF apenas para clientes
            if current_user.user_type == "cliente":
                if validate_cpf(profile_data.cpf):
                    update_fields["cpf"] = profile_data.cpf
                else:
                    raise HTTPException(status_code=400, detail="CPF inválido")
            else:
                raise HTTPException(status_code=400, detail="CPF é válido apenas para clientes")
        
        if profile_data.email:
            # Verificar se email já existe (se diferente do atual)
            if profile_data.email != current_user.email:
                existing_user = await db.users.find_one({"email": profile_data.email})
                if existing_user:
                    raise HTTPException(status_code=400, detail="Este email já está em uso")
                update_fields["email"] = profile_data.email
        
        # === DADOS PIX ===
        if profile_data.pix_key and profile_data.pix_key_type:
            if validate_pix_key(profile_data.pix_key, profile_data.pix_key_type):
                update_fields["pix_key"] = profile_data.pix_key
                update_fields["pix_key_type"] = profile_data.pix_key_type
            else:
                raise HTTPException(status_code=400, detail="Chave PIX inválida para o tipo informado")
        elif profile_data.pix_key or profile_data.pix_key_type:
            raise HTTPException(status_code=400, detail="Chave PIX e tipo da chave são obrigatórios em conjunto")
        
        # === ENDEREÇO COMPLETO ===
        address_fields = [profile_data.cep, profile_data.street, profile_data.number, 
                         profile_data.neighborhood, profile_data.city, profile_data.state]
        
        if any(address_fields):  # Se algum campo de endereço foi informado
            # Validar CEP se fornecido
            if profile_data.cep and not validate_cep(profile_data.cep):
                raise HTTPException(status_code=400, detail="CEP inválido")
            
            # Atualizar campos de endereço individualmente
            if profile_data.cep:
                update_fields["cep"] = profile_data.cep
            if profile_data.street:
                update_fields["street"] = profile_data.street.strip()
            if profile_data.number:
                update_fields["number"] = profile_data.number.strip()
            if profile_data.neighborhood:
                update_fields["neighborhood"] = profile_data.neighborhood.strip()
            if profile_data.city:
                update_fields["city"] = profile_data.city.strip()
            if profile_data.state:
                update_fields["state"] = profile_data.state.strip()
            if profile_data.complement:
                update_fields["complement"] = profile_data.complement.strip()
        
        # === CAMPOS PARA EMPRESAS (LOJISTAS/PRESTADORES) ===
        if current_user.user_type in ["lojista", "service_provider"]:
            if profile_data.company_name:
                update_fields["company_name"] = profile_data.company_name.strip()
            if profile_data.cnpj:
                update_fields["cnpj"] = profile_data.cnpj
            if profile_data.whatsapp:
                update_fields["whatsapp"] = profile_data.whatsapp
            if profile_data.business_segment:
                update_fields["business_segment"] = profile_data.business_segment
            if profile_data.google_maps_url:
                update_fields["google_maps_url"] = profile_data.google_maps_url
            
            # Dados do sócio administrador
            if profile_data.admin_name:
                update_fields["admin_name"] = profile_data.admin_name.strip()
            if profile_data.admin_cpf:
                if validate_cpf(profile_data.admin_cpf):
                    update_fields["admin_cpf"] = profile_data.admin_cpf
                else:
                    raise HTTPException(status_code=400, detail="CPF do sócio administrador é inválido")
            if profile_data.admin_email:
                update_fields["admin_email"] = profile_data.admin_email
            if profile_data.admin_whatsapp:
                update_fields["admin_whatsapp"] = profile_data.admin_whatsapp
        
        # === CONFIGURAÇÕES ===
        if profile_data.theme is not None and profile_data.theme in ["light", "dark"]:
            update_fields["theme"] = profile_data.theme
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Nenhum dado válido para atualizar")
        
        # Atualizar dados no banco
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_fields}
        )
        
        return {"message": "Dados pessoais atualizados com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar dados: {str(e)}")

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordUpdate, current_user = Depends(get_current_user)):
    """Endpoint alternativo para troca de senha (usado pelo frontend)"""
    try:
        # Verificar senha atual
        if not bcrypt.verify(password_data.current_password, current_user.get('password_hash')):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        
        # Validar nova senha
        if len(password_data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")
        
        if password_data.new_password == password_data.current_password:
            raise HTTPException(status_code=400, detail="A nova senha deve ser diferente da atual")
        
        # Gerar hash da nova senha
        new_password_hash = bcrypt.hash(password_data.new_password)
        
        # Atualizar senha no banco e remover senha provisória
        update_data = {
            "password_hash": new_password_hash,
            "must_change_password": False,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Se tinha senha provisória, remover
        await db.users.update_one(
            {"id": current_user.get('id')},
            {
                "$set": update_data,
                "$unset": {"temporary_password": ""}
            }
        )
        
        logger.info(f"✅ Senha trocada com sucesso para usuário {current_user.get('email')} - temporary_password removido")
        
        return {
            "success": True,
            "message": "Senha atualizada com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao trocar senha: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar senha: {str(e)}")

def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                # Garantir que datetime tenha timezone UTC
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
    return data


# =============================================================================
# SUB-USUÁRIOS - SISTEMA DE COLABORADORES
# =============================================================================

class SubUserPermissions(BaseModel):
    """Permissões granulares para sub-usuários"""
    # Vendas
    can_create_sales: bool = False
    can_view_sales: bool = False
    can_cancel_sales: bool = False
    
    # Financeiro
    can_view_balance: bool = False
    can_make_withdrawals: bool = False
    can_view_transactions: bool = False
    
    # Produtos/Serviços
    can_manage_products: bool = False
    can_manage_services: bool = False
    
    # Clientes
    can_view_customers: bool = False
    can_manage_customers: bool = False
    
    # Relatórios
    can_view_reports: bool = False
    can_export_data: bool = False
    
    # Configurações
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


# Authentication routes
@api_router.post("/auth/register")
async def register_user(user_data: UserRegister):
    try:
        # Verificar se email já existe
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email já está em uso")
        
        # === VALIDAÇÕES OBRIGATÓRIAS PARA TODOS ===
        
        # Validar chave PIX
        if not validate_pix_key(user_data.pix_key, user_data.pix_key_type):
            raise HTTPException(status_code=400, detail="Chave PIX inválida para o tipo informado")
        
        # Validar endereço completo
        if not validate_cep(user_data.cep):
            raise HTTPException(status_code=400, detail="CEP inválido")
        
        if not all([user_data.street, user_data.number, user_data.neighborhood, user_data.city, user_data.state]):
            raise HTTPException(status_code=400, detail="Endereço completo é obrigatório (rua, número, bairro, cidade, estado)")
        
        # Validar documentos RG
        if not validate_base64_image(user_data.rg_front):
            raise HTTPException(status_code=400, detail="Foto da frente do RG é obrigatória (formato: JPG, PNG ou PDF)")
        
        if not validate_base64_image(user_data.rg_back):
            raise HTTPException(status_code=400, detail="Foto do verso do RG é obrigatória (formato: JPG, PNG ou PDF)")
        
        # === VALIDAÇÕES ESPECÍFICAS POR TIPO DE USUÁRIO ===
        
        if user_data.user_type == "cliente":
            # Cliente precisa de CPF
            if not user_data.cpf:
                raise HTTPException(status_code=400, detail="CPF é obrigatório para clientes")
            if not validate_cpf(user_data.cpf):
                raise HTTPException(status_code=400, detail="CPF inválido")
                
        elif user_data.user_type in ["lojista", "service_provider"]:
            # Lojistas e prestadores precisam de CNPJ
            if not user_data.company_name or not user_data.cnpj:
                raise HTTPException(status_code=400, detail="Nome da empresa e CNPJ são obrigatórios para empresas")
            
            # Validar taxa de cashback para lojistas
            if user_data.user_type == "lojista":
                if user_data.cashback_rate is None:
                    raise HTTPException(status_code=400, detail="Taxa de cashback é obrigatória para lojistas")
                if user_data.cashback_rate < 1.0 or user_data.cashback_rate > 10.0:
                    raise HTTPException(status_code=400, detail="Taxa de cashback deve estar entre 1% e 10%")
            
            # Validar dados do sócio administrador
            if not all([user_data.admin_name, user_data.admin_cpf, user_data.admin_email, user_data.admin_whatsapp]):
                raise HTTPException(status_code=400, detail="Dados completos do sócio administrador são obrigatórios (nome, CPF, email, WhatsApp)")
            
            # Validar CPF do sócio
            if not validate_cpf(user_data.admin_cpf):
                raise HTTPException(status_code=400, detail="CPF do sócio administrador é inválido")
            
            # Validar RG do sócio
            if not validate_base64_image(user_data.admin_rg_front):
                raise HTTPException(status_code=400, detail="Foto da frente do RG do sócio administrador é obrigatória")
            
            if not validate_base64_image(user_data.admin_rg_back):
                raise HTTPException(status_code=400, detail="Foto do verso do RG do sócio administrador é obrigatória")
        
        # === UPLOAD DE IMAGENS PARA CLOUDINARY ===
        logger.info(f"📤 Fazendo upload de documentos para Cloudinary")
        
        # Gerar ID temporário para o usuário (será o ID final)
        temp_user_id = str(uuid.uuid4())
        
        # Upload RG frente
        rg_front_bytes = base64_to_bytes(user_data.rg_front)
        rg_front_url = await upload_file_to_cloudinary(
            file_content=rg_front_bytes,
            filename=f"rg_front_{temp_user_id}",
            folder="users/documents",
            resource_type="image"
        )
        if not rg_front_url:
            raise HTTPException(status_code=500, detail="Erro ao fazer upload do RG frente")
        
        # Upload RG verso
        rg_back_bytes = base64_to_bytes(user_data.rg_back)
        rg_back_url = await upload_file_to_cloudinary(
            file_content=rg_back_bytes,
            filename=f"rg_back_{temp_user_id}",
            folder="users/documents",
            resource_type="image"
        )
        if not rg_back_url:
            raise HTTPException(status_code=500, detail="Erro ao fazer upload do RG verso")
        
        logger.info(f"✅ Documentos RG enviados para Cloudinary")
        
        # Upload RG do sócio (se for lojista/prestador)
        admin_rg_front_url = None
        admin_rg_back_url = None
        if user_data.user_type in ["lojista", "service_provider"]:
            admin_rg_front_bytes = base64_to_bytes(user_data.admin_rg_front)
            admin_rg_front_url = await upload_file_to_cloudinary(
                file_content=admin_rg_front_bytes,
                filename=f"admin_rg_front_{temp_user_id}",
                folder="users/documents",
                resource_type="image"
            )
            
            admin_rg_back_bytes = base64_to_bytes(user_data.admin_rg_back)
            admin_rg_back_url = await upload_file_to_cloudinary(
                file_content=admin_rg_back_bytes,
                filename=f"admin_rg_back_{temp_user_id}",
                folder="users/documents",
                resource_type="image"
            )
            logger.info(f"✅ Documentos RG do sócio enviados para Cloudinary")
        
        # Upload foto de perfil (se fornecida)
        profile_image_url = None
        if user_data.profile_image:
            profile_image_bytes = base64_to_bytes(user_data.profile_image)
            profile_image_url = await upload_file_to_cloudinary(
                file_content=profile_image_bytes,
                filename=f"profile_{temp_user_id}",
                folder="users/profile",
                resource_type="image"
            )
            logger.info(f"✅ Foto de perfil enviada para Cloudinary")
        
        # Hash da senha
        hashed_password = bcrypt.hash(user_data.password)
        
        # Verificar código de indicação
        referrer_id = None
        if user_data.referral_code_used:
            referrer = await db.users.find_one({"referral_code": user_data.referral_code_used})
            if referrer:
                referrer_id = referrer["id"]
                # Atualizar contador de indicações do referrer
                await db.users.update_one(
                    {"id": referrer_id},
                    {"$inc": {"referral_count": 1}}
                )
        
        # Criar usuário com URLs do Cloudinary
        user_dict = user_data.dict(exclude={'password', 'referral_code_used'})
        user_dict['id'] = temp_user_id  # Usar o ID gerado anteriormente
        user_dict['password_hash'] = hashed_password
        user_dict['referred_by'] = referrer_id
        
        # Substituir base64 por URLs do Cloudinary
        user_dict['rg_front'] = rg_front_url
        user_dict['rg_back'] = rg_back_url
        
        if admin_rg_front_url:
            user_dict['admin_rg_front'] = admin_rg_front_url
        if admin_rg_back_url:
            user_dict['admin_rg_back'] = admin_rg_back_url
        if profile_image_url:
            user_dict['profile_image'] = profile_image_url
        
        user_obj = User(**user_dict)
        
        # Prepare data for mongo with password_hash
        prepared_data = prepare_for_mongo(user_obj.dict())
        prepared_data['password_hash'] = hashed_password
        await db.users.insert_one(prepared_data)
        
        logger.info(f"✅ Usuário {user_obj.email} registrado com sucesso (ID: {user_obj.id})")
        
        # Criar token de acesso
        access_token = create_access_token(data={"sub": user_obj.id})
        
        return {
            "message": "Usuário registrado com sucesso! Documentos em análise.",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_obj.dict(exclude={'password_hash', 'rg_front', 'rg_back', 'admin_rg_front', 'admin_rg_back'}),  # Não retornar documentos na resposta
            "referral_bonus": "R$ 5,00 bônus por indicação!" if referrer_id else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no registro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno no registro: {str(e)}")

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    logger.info(f"Login attempt for: {login_data.email}")
    logger.info(f"User found: {user is not None}")
    if user:
        logger.info(f"User has password_hash: {bool(user.get('password_hash'))}")
        password_check = bcrypt.verify(login_data.password, user.get('password_hash', ''))
        logger.info(f"Password check result: {password_check}")
    
    if not user or not bcrypt.verify(login_data.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Para conta master, recalcular saldo da plataforma
    if user.get('is_master_account', False):
        # Calcular total de comissões
        commission_total = await db.transactions.aggregate([
            {
                "$match": {
                    "user_id": user['id'],
                    "transaction_type": "platform_commission"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]).to_list(1)
        
        # Calcular saques da plataforma
        withdrawal_total = await db.transactions.aggregate([
            {
                "$match": {
                    "user_id": user['id'],
                    "transaction_type": {"$in": ["withdrawal", "withdrawal_fee"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]).to_list(1)
        
        total_commission = commission_total[0]['total'] if commission_total else 0
        total_withdrawn = withdrawal_total[0]['total'] if withdrawal_total else 0
        current_balance = total_commission - total_withdrawn
        
        # Atualizar saldo no banco
        await db.users.update_one(
            {"id": user['id']},
            {"$set": {"platform_balance": current_balance}}
        )
        
        # Atualizar no objeto user
        user['platform_balance'] = current_balance
    
    access_token = create_access_token(data={"sub": user['id']})
    
    # Remove password_hash before creating User object
    user_dict = {k: v for k, v in user.items() if k != 'password_hash'}
    
    # Prepare response with must_change_password at root level
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(**user_dict)
    }
    
    # Add must_change_password at root level if present
    if user.get('must_change_password') is not None:
        response["must_change_password"] = user.get('must_change_password')
    
    # Add profile_complete at root level if present
    if user.get('profile_complete') is not None:
        response["profile_complete"] = user.get('profile_complete')
    
    return response

# Rotas de recuperação de senha
@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Envia código de recuperação para o email do usuário"""
    try:
        # Verificar se o email existe no sistema
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="Email não encontrado no sistema")
        
        # Verificar limite de tentativas (2 por mês)
        can_request = await check_reset_attempts(request.email)
        if not can_request:
            raise HTTPException(
                status_code=429, 
                detail="Limite de tentativas excedido. Você pode solicitar nova recuperação apenas 2 vezes por mês"
            )
        
        # Gerar código de recuperação
        reset_code = generate_reset_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)  # 15 minutos
        
        # Salvar código no banco
        reset_data = PasswordResetCode(
            email=request.email,
            code=reset_code,
            expires_at=expires_at
        )
        
        await db.password_reset_codes.insert_one(reset_data.dict())
        
        # Preparar email
        subject = "Transmill - Código de Recuperação de Senha"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2fa31c;">Transmill</h1>
                <h2 style="color: #374151;">Recuperação de Senha</h2>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p>Olá,</p>
                <p>Você solicitou a recuperação da sua senha do Transmill.</p>
                <p>Seu código de verificação é:</p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #2fa31c; letter-spacing: 4px; 
                                background-color: white; padding: 15px 25px; border-radius: 8px; 
                                border: 2px solid #2fa31c;">{reset_code}</span>
                </div>
                
                <p><strong>⏰ Este código expira em 15 minutos.</strong></p>
                <p>Se você não solicitou esta recuperação, ignore este email.</p>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 12px;">
                <p>© 2025 Transmill - Plataforma de Serviços Digitais e Proteção Veicular</p>
            </div>
        </body>
        </html>
        """
        
        # Enviar email
        email_sent = await send_email(request.email, subject, body)
        
        if email_sent:
            return {"message": "Código enviado para seu email com sucesso"}
        else:
            raise HTTPException(status_code=500, detail="Erro ao enviar email. Tente novamente")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro em forgot_password: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    """Verifica se o código de recuperação é válido"""
    try:
        # Buscar código no banco
        reset_entry = await db.password_reset_codes.find_one({
            "email": request.email,
            "code": request.reset_code,
            "used": False
        })
        
        if not reset_entry:
            raise HTTPException(status_code=400, detail="Código inválido ou já utilizado")
        
        # Verificar expiração
        if datetime.now(timezone.utc) > reset_entry["expires_at"]:
            raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código")
        
        return {"message": "Código válido", "valid": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro em verify_reset_code: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Define nova senha usando o código de recuperação"""
    try:
        # Buscar e validar código
        reset_entry = await db.password_reset_codes.find_one({
            "email": request.email,
            "code": request.reset_code,
            "used": False
        })
        
        if not reset_entry:
            raise HTTPException(status_code=400, detail="Código inválido ou já utilizado")
        
        # Verificar expiração
        if datetime.now(timezone.utc) > reset_entry["expires_at"]:
            raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código")
        
        # Validar nova senha
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
        
        # Verificar se o usuário existe
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Hash da nova senha
        new_password_hash = bcrypt.hash(request.new_password)
        
        # Atualizar senha no banco
        await db.users.update_one(
            {"email": request.email},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        # Marcar código como usado
        await db.password_reset_codes.update_one(
            {"_id": reset_entry["_id"]},
            {"$set": {"used": True}}
        )
        
        return {"message": "Senha alterada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro em reset_password: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# User routes

# Merchant routes
# merchant_block1 endpoints moved to modular router

@api_router.get("/merchants")
async def list_merchants(
    franquia_slug: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Lista lojistas filtrados por franquia (white-label).
    Cada franquia só vê suas próprias lojas.
    """
    try:
        # Construir filtro base
        filtro = {"user_type": "lojista"}
        
        # Aplicar filtro de franquia
        franquia_filter = await get_franquia_filter(current_user)
        filtro.update(franquia_filter)
        
        # Override se franquia_slug foi passado explicitamente (para páginas públicas)
        if franquia_slug:
            filtro["franquia_slug"] = franquia_slug
        
        merchants = await db.users.find(filtro).to_list(100)
        
        # Obter contexto para branding
        context = await get_franquia_context(current_user)
        
        return {
            "success": True,
            "franquia_nome": context["franquia_nome"],
            "service_name": f"{context['franquia_nome']} Lojas",
            "merchants": [
                {
                    "id": m["id"],
                    "company_name": m.get("company_name", m["full_name"]),
                    "cashback_rate": m.get("cashback_rate", 0),
                    "logo_url": m.get("logo_url"),
                    "store_slug": m.get("store_slug"),
                    "address": m.get("address"),
                    "city": m.get("city"),
                    "state": m.get("state")
                }
                for m in merchants
            ]
        }
    except Exception as e:
        logger.error(f"Erro ao listar merchants: {str(e)}")
        return {"success": False, "merchants": [], "error": str(e)}

# Helper functions for geolocation
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância entre dois pontos geográficos usando a fórmula Haversine
    Retorna a distância em quilômetros
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Converter graus para radianos
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Fórmula Haversine
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Raio da Terra em km
    R = 6371
    return R * c

def get_default_coordinates(city: str, state: str) -> tuple:
    """
    Retorna coordenadas padrão baseadas na cidade e estado
    Para demonstração, usando coordenadas de centros urbanos conhecidos
    """
    coordinates_map = {
        # São Paulo
        ("São Paulo", "SP"): (-23.5505, -46.6333),
        ("Guarulhos", "SP"): (-23.4538, -46.5333),
        ("Campinas", "SP"): (-22.9099, -47.0626),
        ("São Bernardo do Campo", "SP"): (-23.6914, -46.5646),
        ("Osasco", "SP"): (-23.5329, -46.7918),
        
        # Rio de Janeiro
        ("Rio de Janeiro", "RJ"): (-22.9068, -43.1729),
        ("Niterói", "RJ"): (-22.8833, -43.1036),
        ("Duque de Caxias", "RJ"): (-22.7856, -43.3119),
        
        # Minas Gerais
        ("Belo Horizonte", "MG"): (-19.9167, -43.9345),
        ("Uberlândia", "MG"): (-18.9113, -48.2622),
        
        # Bahia
        ("Salvador", "BA"): (-12.9714, -38.5014),
        
        # Brasília
        ("Brasília", "DF"): (-15.7939, -47.8828),
        
        # Ceará
        ("Fortaleza", "CE"): (-3.7319, -38.5267),
        
        # Pernambuco
        ("Recife", "PE"): (-8.0476, -34.8770),
        
        # Rio Grande do Sul
        ("Porto Alegre", "RS"): (-30.0346, -51.2177),
        
        # Paraná
        ("Curitiba", "PR"): (-25.4284, -49.2733),
        
        # Santa Catarina
        ("Florianópolis", "SC"): (-27.5954, -48.5480),
        
        # Goiás
        ("Goiânia", "GO"): (-16.6869, -49.2648),
    }
    
    # Tentar encontrar coordenadas específicas
    key = (city, state)
    if key in coordinates_map:
        return coordinates_map[key]
    
    # Coordenadas padrão por estado (capitais)
    state_capitals = {
        "SP": (-23.5505, -46.6333),  # São Paulo
        "RJ": (-22.9068, -43.1729),  # Rio de Janeiro
        "MG": (-19.9167, -43.9345),  # Belo Horizonte
        "BA": (-12.9714, -38.5014),  # Salvador
        "DF": (-15.7939, -47.8828),  # Brasília
        "CE": (-3.7319, -38.5267),   # Fortaleza
        "PE": (-8.0476, -34.8770),   # Recife
        "RS": (-30.0346, -51.2177),  # Porto Alegre
        "PR": (-25.4284, -49.2733),  # Curitiba
        "SC": (-27.5954, -48.5480),  # Florianópolis
        "GO": (-16.6869, -49.2648),  # Goiânia
    }
    
    return state_capitals.get(state, (-23.5505, -46.6333))  # Default São Paulo

# Store endpoints moved to /app/backend/routes/stores.py

@api_router.get("/prestadores")
async def get_prestadores(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 50.0,
    service_type: Optional[str] = None,
    category: Optional[str] = None,
    franquia_slug: Optional[str] = None,
    limit: Optional[int] = 100,
    current_user = Depends(get_current_user)
):
    """Busca prestadores de serviço com geolocalização e white-label"""
    try:
        filtro = {"user_type": "service_provider"}
        franquia_filter = await get_franquia_filter(current_user)
        filtro.update(franquia_filter)

        if franquia_slug:
            filtro["franquia_slug"] = franquia_slug

        prestadores_cursor = db.users.find(filtro).limit(limit)
        prestadores = await prestadores_cursor.to_list(limit)

        context = await get_franquia_context(current_user)
        results = []

        for prestador in prestadores:
            provider_profile = await db.service_providers.find_one({"user_id": prestador["id"]})
            if not provider_profile:
                continue

            if service_type:
                provider_type_name = provider_profile.get("provider_type_name", "")
                if service_type.lower() not in provider_type_name.lower():
                    continue

            prestador_lat = provider_profile.get("address", {}).get("latitude")
            prestador_lng = provider_profile.get("address", {}).get("longitude")

            if not prestador_lat or not prestador_lng:
                address = provider_profile.get("address", {})
                city = address.get("city", "")
                state = address.get("state", "")
                if city and state:
                    prestador_lat, prestador_lng = get_default_coordinates(city, state)
                else:
                    prestador_lat, prestador_lng = -23.5505, -46.6333

            distance = None
            if lat is not None and lng is not None:
                distance = calculate_distance(lat, lng, prestador_lat, prestador_lng)
                if radius and distance > radius:
                    continue

            services_cursor = db.services.find({"user_id": prestador["id"], "is_available": True})
            services = await services_cursor.to_list(10)

            if category:
                services = [s for s in services if s.get("category", "").lower() == category.lower()]
                if not services:
                    continue

            rating_avg = provider_profile.get("rating_average", 4.5)
            rating_count = provider_profile.get("rating_count", 0)
            min_price = None
            if services:
                prices = [s.get("price", 0) for s in services if s.get("price")]
                if prices:
                    min_price = min(prices)

            categories = list(set([s.get("category", "Geral") for s in services]))
            address = provider_profile.get("address", {})

            prestador_data = {
                "id": prestador["id"],
                "name": provider_profile.get("fantasy_name", prestador.get("full_name", "")),
                "full_name": prestador.get("full_name", ""),
                "company_name": provider_profile.get("fantasy_name", ""),
                "description": provider_profile.get("profile_description", "Prestador de serviços"),
                "service_provider_type": provider_profile.get("provider_type_name", ""),
                "category": categories[0] if categories else "Geral",
                "categories": categories,
                "address": f"{address.get('street', '')}, {address.get('number', '')}",
                "street": address.get("street", ""),
                "number": address.get("number", ""),
                "neighborhood": address.get("neighborhood", ""),
                "city": address.get("city", ""),
                "state": address.get("state", ""),
                "whatsapp": prestador.get("whatsapp", ""),
                "profile_image": prestador.get("profile_image", ""),
                "latitude": prestador_lat,
                "longitude": prestador_lng,
                "distance": distance,
                "rating": rating_avg,
                "rating_count": rating_count,
                "price_from": min_price,
                "services_count": len(services),
                "services": [
                    {
                        "id": s.get("id"),
                        "name": s.get("name"),
                        "description": s.get("description"),
                        "price": s.get("price"),
                        "category": s.get("category"),
                        "estimated_duration": s.get("estimated_duration")
                    } for s in services[:3]
                ],
                "available": prestador.get("is_active", True),
                "tags": ["Prestador Transmill"] + categories[:2],
                "cashback_rate": provider_profile.get("cashback_rate", 8.0)
            }
            results.append(prestador_data)

        if lat is not None and lng is not None:
            results.sort(key=lambda x: x["distance"] if x["distance"] is not None else 999)

        return {
            "success": True,
            "franquia_nome": context["franquia_nome"],
            "service_name": f"{context['franquia_nome']} Prestadores",
            "prestadores": results,
            "total": len(results),
            "user_location": {
                "latitude": lat,
                "longitude": lng
            } if lat and lng else None
        }

    except Exception as e:
        logger.error(f"Erro ao buscar prestadores: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar prestadores: {str(e)}")

# Business Segments Management (Master only)
class BusinessSegment(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BusinessSegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class BusinessSegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# MASTER: business-segments endpoints migrados para routes/master.py

@api_router.get("/business-segments/active")
async def get_active_business_segments():
    """Lista segmentos ativos (endpoint público para formulários)"""
    try:
        segments_cursor = db.business_segments.find({"is_active": True}, {"_id": 0}).sort("name", 1)
        segments = await segments_cursor.to_list(100)
        
        return {
            "segments": [segment["name"] for segment in segments]
        }
    except Exception as e:
        logger.error(f"Erro ao buscar segmentos ativos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar segmentos ativos: {str(e)}")


# SISTEMA DE NOTIFICAÇÕES

# notifications endpoints moved to modular router

@api_router.post("/master/user-transaction")
async def create_user_transaction(
    transaction_data: MasterTransactionCreate,
    current_user: User = Depends(get_current_user)
):
    """Master cria lançamento manual na conta do usuário"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    try:
        # Verificar se usuário existe
        target_user = await db.users.find_one({"id": transaction_data.user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Validar tipo de transação
        if transaction_data.transaction_type not in ['manual_credit', 'manual_debit']:
            raise HTTPException(status_code=400, detail="Tipo de transação inválido")
        
        # Criar transação
        transaction = Transaction(
            user_id=transaction_data.user_id,
            transaction_type=transaction_data.transaction_type,
            amount=abs(transaction_data.amount),
            description=f"[MASTER] {transaction_data.description}",
            status="completed",
            created_by_master=True,
            master_user_id=current_user.id
        )
        
        # Atualizar saldo do usuário
        balance_change = transaction_data.amount if transaction_data.transaction_type == 'manual_credit' else -abs(transaction_data.amount)
        
        await db.users.update_one(
            {"id": transaction_data.user_id},
            {"$inc": {"balance": balance_change}}
        )
        
        # Salvar transação
        transaction_dict = prepare_for_mongo(transaction.dict())
        await db.transactions.insert_one(transaction_dict)
        
        return {
            "message": "Lançamento realizado com sucesso",
            "transaction_id": transaction.id,
            "new_balance": target_user["balance"] + balance_change
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar lançamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar lançamento: {str(e)}")

@api_router.get("/master/user-extract/{user_id}")
async def get_user_extract(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Master visualiza extrato de qualquer usuário"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    try:
        # Verificar se usuário existe
        target_user = await db.users.find_one({"id": user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Buscar transações do usuário
        transactions = await db.transactions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)  # Últimas 100 transações
        
        # Buscar saldo atual
        user_balance = await db.users.find_one(
            {"id": user_id},
            {"balance": 1, "cashback_balance": 1, "usdt_balance": 1}
        )
        
        return {
            "user_info": {
                "id": target_user["id"],
                "name": target_user["full_name"],
                "email": target_user["email"],
                "user_type": target_user["user_type"]
            },
            "balance": {
                "balance": user_balance.get("balance", 0),
                "cashback_balance": user_balance.get("cashback_balance", 0),
                "usdt_balance": user_balance.get("usdt_balance", 0),
                "total": user_balance.get("balance", 0) + user_balance.get("cashback_balance", 0)
            },
            "transactions": transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar extrato: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar extrato: {str(e)}")

@api_router.get("/master/hierarchical-extract")
async def get_hierarchical_extract(
    current_user: User = Depends(get_current_user)
):
    """Master visualiza extrato de comissões hierárquicas"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    try:
        # Buscar transações hierárquicas
        hierarchical_transactions = await db.transactions.find(
            {
                "transaction_type": {
                    "$in": ["socio_operador_bonus", "mini_agencia_bonus", "consultor_bonus"]
                }
            },
            {"_id": 0}
        ).sort("created_at", -1).to_list(200)
        
        # Agrupar por tipo e calcular totais
        totals = {
            "socio_operador": 0,
            "mini_agencia": 0,
            "consultor": 0
        }
        
        for transaction in hierarchical_transactions:
            if transaction["transaction_type"] == "socio_operador_bonus":
                totals["socio_operador"] += transaction["amount"]
            elif transaction["transaction_type"] == "mini_agencia_bonus":
                totals["mini_agencia"] += transaction["amount"]
            elif transaction["transaction_type"] == "consultor_bonus":
                totals["consultor"] += transaction["amount"]
        
        return {
            "transactions": hierarchical_transactions,
            "totals": totals,
            "grand_total": sum(totals.values())
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar extrato hierárquico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar extrato hierárquico: {str(e)}")

@api_router.post("/master/set-hierarchical-agent")
async def set_hierarchical_agent(
    agent_data: HierarchicalAgentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Master define usuário como agente hierárquico"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    try:
        # Verificar se usuário existe
        target_user = await db.users.find_one({"id": agent_data.user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Validar tipo de agente
        valid_roles = ["socio_operador", "mini_agencia", "consultor"]
        if agent_data.hierarchical_role not in valid_roles:
            raise HTTPException(status_code=400, detail="Tipo de agente inválido")
        
        # Validações específicas por tipo
        update_fields = {"hierarchical_role": agent_data.hierarchical_role}
        
        if agent_data.hierarchical_role == "socio_operador":
            if not agent_data.state:
                raise HTTPException(status_code=400, detail="Estado é obrigatório para Sócio Operador")
            
            # Verificar se já existe Sócio Operador no estado
            existing = await db.users.find_one({
                "hierarchical_role": "socio_operador",
                "state": agent_data.state,
                "id": {"$ne": agent_data.user_id}
            })
            if existing:
                raise HTTPException(status_code=400, detail=f"Já existe Sócio Operador no estado {agent_data.state}")
            
            update_fields["state"] = agent_data.state
        
        elif agent_data.hierarchical_role == "mini_agencia":
            if not agent_data.state or not agent_data.city:
                raise HTTPException(status_code=400, detail="Estado e cidade são obrigatórios para Mini Agencia")
            
            # Verificar se já existe Mini Agencia na cidade
            existing = await db.users.find_one({
                "hierarchical_role": "mini_agencia",
                "state": agent_data.state,
                "city": agent_data.city,
                "id": {"$ne": agent_data.user_id}
            })
            if existing:
                raise HTTPException(status_code=400, detail=f"Já existe Mini Agencia em {agent_data.city}/{agent_data.state}")
            
            update_fields["state"] = agent_data.state
            update_fields["city"] = agent_data.city
        
        # Atualizar usuário
        await db.users.update_one(
            {"id": agent_data.user_id},
            {"$set": update_fields}
        )
        
        return {
            "message": f"Usuário definido como {agent_data.hierarchical_role} com sucesso",
            "user_id": agent_data.user_id,
            "hierarchical_role": agent_data.hierarchical_role
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao definir agente hierárquico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao definir agente hierárquico: {str(e)}")

@api_router.get("/master/cashback-rules")
async def get_cashback_rules(
    current_user: User = Depends(get_current_user)
):
    """Master visualiza regras detalhadas de distribuição de cashback"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    return {
        "title": "Regras de Distribuição de Cashback - Transmill",
        "description": "Sistema hierárquico de distribuição de comissões por transação",
        "rules": [
            {
                "percentage": "50%",
                "recipient": "Comprador",
                "description": "Cliente que efetuou a compra recebe 50% do cashback da transação",
                "condition": "Sempre aplicado"
            },
            {
                "percentage": "10%",
                "recipient": "Indicador do Comprador",
                "description": "Usuário que indicou o comprador recebe 10% do cashback",
                "condition": "Se o comprador foi indicado por alguém"
            },
            {
                "percentage": "10%",
                "recipient": "Indicador da Loja",
                "description": "Usuário que indicou a loja recebe 10% do cashback",
                "condition": "Se a loja foi indicada por alguém"
            },
            {
                "percentage": "10%",
                "recipient": "Sócio Operador do Estado",
                "description": "Agente hierárquico responsável pelo estado onde a loja está localizada",
                "condition": "Se existe Sócio Operador cadastrado no estado, senão vai para Master"
            },
            {
                "percentage": "5%",
                "recipient": "Mini Agencia da Cidade",
                "description": "Agente hierárquico responsável pela cidade onde a loja está localizada",
                "condition": "Se existe Mini Agencia cadastrada na cidade, senão vai para Master"
            },
            {
                "percentage": "5%",
                "recipient": "Consultor",
                "description": "Consultor na cadeia hierárquica da loja (loja deve ser indicada por usuário indicado pelo consultor)",
                "condition": "Se existe Consultor na hierarquia da loja, senão vai para Master"
            },
            {
                "percentage": "10%",
                "recipient": "Master + Fallbacks",
                "description": "Conta Master recebe 10% fixo + valores dos agentes hierárquicos que não existem",
                "condition": "Sempre aplicado + fallbacks"
            }
        ],
        "examples": [
            {
                "scenario": "Compra R$ 100,00 com 5% cashback (R$ 5,00 total)",
                "distribution": {
                    "comprador": "R$ 2,50 (50%)",
                    "indicador_comprador": "R$ 0,50 (10%)",
                    "indicador_loja": "R$ 0,50 (10%)",
                    "socio_operador": "R$ 0,50 (10%) ou Master",
                    "mini_agencia": "R$ 0,25 (5%) ou Master",
                    "consultor": "R$ 0,25 (5%) ou Master",
                    "master": "R$ 0,50 (10%) + fallbacks"
                }
            }
        ],
        "notes": [
            "Total sempre soma 100% do cashback gerado",
            "Valores não distribuídos por falta de agentes vão para Master",
            "Distribuição é automática e instantânea",
            "Todas as transações são registradas no extrato"
        ]
    }

@api_router.post("/master/approve-user")
async def approve_user(
    approval_data: ApproveUserRequest,
    current_user: User = Depends(get_current_user)
):
    """Master aprova ou rejeita usuário após análise de compliance"""
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")
    
    try:
        # Verificar se usuário existe
        target_user = await db.users.find_one({"id": approval_data.user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Atualizar status de aprovação
        await db.users.update_one(
            {"id": approval_data.user_id},
            {"$set": {"is_approved": approval_data.approved, "approval_date": datetime.now(timezone.utc)}}
        )
        
        # Log da ação de compliance
        await db.compliance_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": approval_data.user_id,
            "master_id": current_user.id,
            "action": "approved" if approval_data.approved else "rejected",
            "timestamp": datetime.now(timezone.utc)
        })
        
        action = "aprovado" if approval_data.approved else "rejeitado"
        logger.info(f"Usuário {approval_data.user_id} {action} pelo master {current_user.id}")
        
        return {
            "success": True,
            "message": f"Usuário {action} com sucesso",
            "user_id": approval_data.user_id,
            "approved": approval_data.approved
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao aprovar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar aprovação: {str(e)}")

# Profile update endpoint
class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company_name: Optional[str] = None
    fantasy_name: Optional[str] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    cep: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    business_segment: Optional[str] = None
    google_maps_url: Optional[str] = None
    menu_catalog_url: Optional[str] = None  # URL do cardápio/catálogo AgitoAI
    profile_image: Optional[str] = None
    theme: Optional[str] = None  # 'light' ou 'dark'
    # Campos de administrador/responsável
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    admin_phone: Optional[str] = None
    admin_cpf: Optional[str] = None
    # Campos específicos de prestador de serviços
    service_type: Optional[str] = None
    working_hours: Optional[str] = None
    cashback_rate: Optional[float] = None
    company_type: Optional[str] = None  # 'pessoa_fisica' ou 'empresa'
    # Campo Labelview
    nome_fantasia: Optional[str] = None  # Nome fantasia para unidades Labelview

@api_router.post("/user/update-profile")
async def update_user_profile(profile_data: ProfileUpdateRequest, current_user: User = Depends(get_current_user)):
    """Atualiza perfil do usuário"""
    try:
        update_fields = {}
        
        # Campos comuns para todos os tipos de usuário
        if profile_data.full_name is not None:
            update_fields["full_name"] = profile_data.full_name
        if profile_data.phone is not None:
            update_fields["phone"] = profile_data.phone
        if profile_data.profile_image is not None:
            update_fields["profile_image"] = profile_data.profile_image
        if profile_data.email is not None:
            update_fields["email"] = profile_data.email
        if profile_data.whatsapp is not None:
            update_fields["whatsapp"] = profile_data.whatsapp
            
        # Campo de tema (para todos os usuários)
        if profile_data.theme is not None and profile_data.theme in ["light", "dark"]:
            update_fields["theme"] = profile_data.theme
        
        # Campos de endereço (para todos os tipos)
        if profile_data.cep is not None:
            update_fields["cep"] = profile_data.cep
        if profile_data.street is not None:
            update_fields["street"] = profile_data.street
        if profile_data.number is not None:
            update_fields["number"] = profile_data.number
        if profile_data.neighborhood is not None:
            update_fields["neighborhood"] = profile_data.neighborhood
        if profile_data.city is not None:
            update_fields["city"] = profile_data.city
        if profile_data.state is not None:
            update_fields["state"] = profile_data.state
        if profile_data.address is not None:
            update_fields["address"] = profile_data.address
            
        # Campos para Master/Empresa
        if current_user.is_master_account or current_user.user_type == "master":
            if profile_data.company_name is not None:
                update_fields["company_name"] = profile_data.company_name
            if profile_data.fantasy_name is not None:
                update_fields["fantasy_name"] = profile_data.fantasy_name
            if profile_data.admin_name is not None:
                update_fields["admin_name"] = profile_data.admin_name
            if profile_data.admin_email is not None:
                update_fields["admin_email"] = profile_data.admin_email
            if profile_data.admin_phone is not None:
                update_fields["admin_phone"] = profile_data.admin_phone
            if profile_data.admin_cpf is not None:
                update_fields["admin_cpf"] = profile_data.admin_cpf
            
        # Campos específicos de lojista
        if current_user.user_type == "lojista":
            if profile_data.company_name is not None:
                update_fields["company_name"] = profile_data.company_name
            if profile_data.business_segment is not None:
                update_fields["business_segment"] = profile_data.business_segment
            if profile_data.google_maps_url is not None:
                update_fields["google_maps_url"] = profile_data.google_maps_url
            if profile_data.menu_catalog_url is not None:
                update_fields["menu_catalog_url"] = profile_data.menu_catalog_url
            if profile_data.cashback_rate is not None:
                update_fields["cashback_rate"] = profile_data.cashback_rate
                
        # Campos específicos de prestador de serviços
        if current_user.user_type == "service_provider":
            if profile_data.company_name is not None:
                update_fields["company_name"] = profile_data.company_name
            if profile_data.fantasy_name is not None:
                update_fields["fantasy_name"] = profile_data.fantasy_name
            if profile_data.service_type is not None:
                update_fields["service_type"] = profile_data.service_type
            if profile_data.working_hours is not None:
                update_fields["working_hours"] = profile_data.working_hours
            if profile_data.google_maps_url is not None:
                update_fields["google_maps_url"] = profile_data.google_maps_url
            if profile_data.menu_catalog_url is not None:
                update_fields["menu_catalog_url"] = profile_data.menu_catalog_url
            if profile_data.cashback_rate is not None:
                update_fields["cashback_rate"] = profile_data.cashback_rate
            if profile_data.company_type is not None:
                update_fields["company_type"] = profile_data.company_type
            if profile_data.admin_name is not None:
                update_fields["admin_name"] = profile_data.admin_name
            if profile_data.admin_email is not None:
                update_fields["admin_email"] = profile_data.admin_email
            if profile_data.admin_phone is not None:
                update_fields["admin_phone"] = profile_data.admin_phone
                
        # Campos específicos de Labelview
        if current_user.user_type in ["labelview_master", "labelview_unidade", "labelview_regional"]:
            if profile_data.company_name is not None:
                update_fields["company_name"] = profile_data.company_name
            if profile_data.fantasy_name is not None:
                update_fields["fantasy_name"] = profile_data.fantasy_name
                update_fields["nome_fantasia"] = profile_data.fantasy_name  # Salvar em ambos campos
            if profile_data.nome_fantasia is not None:
                update_fields["nome_fantasia"] = profile_data.nome_fantasia
                update_fields["fantasy_name"] = profile_data.nome_fantasia  # Salvar em ambos campos
            if profile_data.admin_name is not None:
                update_fields["admin_name"] = profile_data.admin_name
            if profile_data.admin_email is not None:
                update_fields["admin_email"] = profile_data.admin_email
            if profile_data.admin_phone is not None:
                update_fields["admin_phone"] = profile_data.admin_phone
        
        # Também atualizar nome_fantasia para qualquer tipo de usuário que tenha esse campo
        if profile_data.nome_fantasia is not None:
            update_fields["nome_fantasia"] = profile_data.nome_fantasia
        
        if update_fields:
            await db.users.update_one(
                {"id": current_user.id},
                {"$set": update_fields}
            )
        
        return {"message": "Perfil atualizado com sucesso"}
        
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar perfil: {str(e)}")


# Referral System Routes
# referral endpoints moved to modular router

@api_router.get("/master/dashboard")
async def get_master_dashboard(current_user: User = Depends(get_current_user)):
    """Dashboard da conta master da plataforma"""
    
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    # Estatísticas gerais - incluir TODOS os tipos de usuários (exceto master)
    total_users = await db.users.count_documents({"is_master_account": {"$ne": True}})
    total_clients = await db.users.count_documents({"user_type": {"$in": ["cliente", "client"]}})
    total_merchants = await db.users.count_documents({"user_type": "lojista"})
    total_providers = await db.users.count_documents({"user_type": "service_provider"})
    total_franquias = await db.users.count_documents({"user_type": "labelview_unidade"})
    
    # Transações da plataforma
    platform_transactions_raw = await db.transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    platform_transactions = []
    for t in platform_transactions_raw:
        try:
            if not t.get("user_id") or not t.get("transaction_type") or not t.get("description"):
                continue
            t["amount"] = float(t.get("amount", 0))
            t["cashback_amount"] = float(t.get("cashback_amount", 0))
            platform_transactions.append(t)
        except Exception:
            continue
    
    total_commission = await db.transactions.aggregate([
        {"$match": {"user_id": current_user.id, "transaction_type": "platform_commission"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    commission_total = total_commission[0]["total"] if total_commission else 0
    
    return {
        "platform_stats": {
            "total_users": total_users,
            "total_clients": total_clients,
            "total_merchants": total_merchants,
            "total_providers": total_providers,
            "total_franquias": total_franquias,
            "platform_balance": getattr(current_user, 'platform_balance', 0.0),
            "platform_usdt_balance": getattr(current_user, 'platform_usdt_balance', 0.0),
            "total_commission": commission_total
        },
        "recent_transactions": platform_transactions
    }

# Novos endpoints para dashboard minimalista do master
@api_router.get("/master/total-balance")
async def get_master_total_balance(current_user: User = Depends(get_current_user)):
    """Obter saldo total de todas as carteiras (BRL + USDT)"""
    
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Somar saldo BRL de todos os usuários
        total_brl_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_balance": {"$sum": "$balance"},
                    "total_cashback": {"$sum": "$cashback_balance"}
                }
            }
        ]
        brl_result = await db.users.aggregate(total_brl_pipeline).to_list(1)
        
        # Somar saldo USDT de todos os usuários
        total_usdt_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_usdt": {"$sum": "$usdt_balance"}
                }
            }
        ]
        usdt_result = await db.users.aggregate(total_usdt_pipeline).to_list(1)
        
        total_brl = brl_result[0]["total_balance"] if brl_result else 0.0
        total_cashback = brl_result[0]["total_cashback"] if brl_result else 0.0
        total_usdt = usdt_result[0]["total_usdt"] if usdt_result else 0.0
        
        return {
            "success": True,
            "brl": round(total_brl, 2),
            "cashback": round(total_cashback, 2),
            "usdt": round(total_usdt, 6),
            "total_brl_with_cashback": round(total_brl + total_cashback, 2)
        }
        
    except Exception as e:
        logger.error(f"Erro ao calcular saldo total: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao calcular saldo total")

@api_router.get("/master/platform-revenue")
async def get_master_platform_revenue(current_user: User = Depends(get_current_user)):
    """Obter receita da plataforma (cashback + taxas de transações)"""
    
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Total de cashback distribuído
        cashback_pipeline = [
            {
                "$match": {
                    "transaction_type": {"$in": ["cashback", "referral_bonus", "hierarchical_commission"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        cashback_result = await db.transactions.aggregate(cashback_pipeline).to_list(1)
        total_cashback = cashback_result[0]["total"] if cashback_result else 0.0
        
        # Total de taxas de conversão de moedas
        conversion_fees_pipeline = [
            {
                "$match": {
                    "transaction_type": "conversion_fee"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        conversion_result = await db.transactions.aggregate(conversion_fees_pipeline).to_list(1)
        conversion_fees = conversion_result[0]["total"] if conversion_result else 0.0
        
        # Total de taxas de saque
        withdrawal_fees_pipeline = [
            {
                "$match": {
                    "transaction_type": "withdrawal_fee"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        withdrawal_result = await db.transactions.aggregate(withdrawal_fees_pipeline).to_list(1)
        withdrawal_fees = withdrawal_result[0]["total"] if withdrawal_result else 0.0
        
        total_fees = conversion_fees + withdrawal_fees
        
        return {
            "success": True,
            "cashback": round(abs(total_cashback), 2),
            "fees": {
                "conversion": round(abs(conversion_fees), 2),
                "withdrawal": round(abs(withdrawal_fees), 2),
                "total": round(abs(total_fees), 2)
            },
            "total_revenue": round(abs(total_cashback) + abs(total_fees), 2)
        }
        
    except Exception as e:
        logger.error(f"Erro ao calcular receita da plataforma: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao calcular receita da plataforma")

@api_router.get("/master/cashback-extract")
async def get_master_cashback_extract(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Obter extrato de movimentações de cashback"""
    
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Buscar transações de cashback
        transactions = await db.transactions.find(
            {
                "transaction_type": {"$in": ["cashback", "referral_bonus", "hierarchical_commission"]}
            }
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Contar total de transações
        total = await db.transactions.count_documents(
            {
                "transaction_type": {"$in": ["cashback", "referral_bonus", "hierarchical_commission"]}
            }
        )
        
        # Enriquecer com dados do usuário
        for trans in transactions:
            user = await db.users.find_one({"id": trans.get("user_id")})
            if user:
                trans["user_name"] = user.get("full_name", "Usuário")
                trans["user_email"] = user.get("email", "")
        
        return {
            "success": True,
            "transactions": transactions,
            "total": total,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar extrato de cashback: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar extrato")

@api_router.get("/master/fees-extract")
async def get_master_fees_extract(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Obter extrato de movimentações de taxas"""
    
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Buscar transações de taxas
        transactions = await db.transactions.find(
            {
                "transaction_type": {"$in": ["conversion_fee", "withdrawal_fee"]}
            }
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Contar total de transações
        total = await db.transactions.count_documents(
            {
                "transaction_type": {"$in": ["conversion_fee", "withdrawal_fee"]}
            }
        )
        
        # Enriquecer com dados do usuário
        for trans in transactions:
            user = await db.users.find_one({"id": trans.get("user_id")})
            if user:
                trans["user_name"] = user.get("full_name", "Usuário")
                trans["user_email"] = user.get("email", "")
        
        return {
            "success": True,
            "transactions": transactions,
            "total": total,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar extrato de taxas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar extrato")

@api_router.get("/master/all-transactions")
async def get_master_all_transactions(
    current_user: User = Depends(get_current_user),
    limit: int = 100,
    skip: int = 0,
    user_type: str = None,
    transaction_type: str = None
):
    """Obter TODAS as transações de TODAS as contas (clientes, lojistas, prestadores, hierarquia, master)"""
    
    # Check if user is master
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Construir filtro
        filter_query = {}
        
        if transaction_type:
            filter_query["transaction_type"] = transaction_type
        
        # Buscar todas as transações (excluir _id para evitar erro de serialização ObjectId)
        transactions = await db.transactions.find(filter_query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Contar total
        total = await db.transactions.count_documents(filter_query)
        
        # Enriquecer com dados do usuário
        for trans in transactions:
            user = await db.users.find_one({"id": trans.get("user_id")})
            if user:
                trans["user_name"] = user.get("full_name", "Usuário")
                trans["user_email"] = user.get("email", "")
                trans["user_type"] = user.get("user_type", "cliente")
                trans["user_phone"] = user.get("phone", "")
        
        # Calcular totais por tipo
        totals_by_type = await db.transactions.aggregate([
            {"$match": filter_query},
            {
                "$group": {
                    "_id": "$transaction_type",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(None)
        
        # Calcular total geral
        total_amount = sum([abs(t["total"]) for t in totals_by_type])
        
        return {
            "success": True,
            "transactions": transactions,
            "total": total,
            "total_amount": round(total_amount, 2),
            "totals_by_type": totals_by_type,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar todas as transações: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar transações")

# SISTEMA DE USUÁRIOS HIERÁRQUICOS

@api_router.post("/master/hierarchical-users")
async def create_hierarchical_user(
    user_data: HierarchicalUserRegister,
    current_user: User = Depends(get_current_user)
):
    """Criar usuário hierárquico (Sócio Operador, Mini Agencia, Consultor)"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Validar se email já existe
        existing_user = await db.users.find_one({"email": user_data.email})
        existing_hierarchical = await db.users.find_one({"email": user_data.email, "user_type": "hierarchical"})
        
        if existing_user or existing_hierarchical:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Validar campos específicos por role
        if user_data.role == "mini_agencia" and not user_data.city:
            raise HTTPException(status_code=400, detail="Cidade é obrigatória para Mini Agencia")
        
        # Hash da senha
        password_hash = bcrypt.hash(user_data.password)
        
        # Criar usuário hierárquico
        hierarchical_user = HierarchicalUser(
            **user_data.model_dump(exclude={"password"}),
            password_hash=password_hash,
            created_by=current_user.id
        )
        
        # Salvar no banco
        await db.hierarchical_users.insert_one(hierarchical_user.model_dump())
        
        # Criar conta de cliente padrão para o usuário hierárquico
        client_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            phone=user_data.phone,
            user_type="cliente",
            referral_code=f"HIER-{hierarchical_user.id[:8].upper()}",
            hierarchical_role=user_data.role,  # Campo adicional identificando status
            hierarchical_user_id=hierarchical_user.id,
            password_hash=password_hash
        )
        
        await db.users.insert_one(client_user.model_dump())
        
        logger.info(f"Usuário hierárquico criado: {user_data.email} ({user_data.role})")
        
        return {
            "message": "Usuário hierárquico criado com sucesso",
            "hierarchical_user_id": hierarchical_user.id,
            "client_account_id": client_user.id,
            "role": user_data.role,
            "referral_code": client_user.referral_code
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar usuário hierárquico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {str(e)}")

@api_router.get("/master/hierarchical-users")
async def get_hierarchical_users(
    current_user: User = Depends(get_current_user)
):
    """Listar todos os usuários hierárquicos"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        users = await db.users.find(
            {"user_type": "hierarchical"}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {
            "users": users,
            "total": len(users)
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar usuários hierárquicos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {str(e)}")

@api_router.get("/master/hierarchical-users/{user_id}")
async def get_hierarchical_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Obter detalhes de um usuário hierárquico específico"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        user = await db.users.find_one({"id": user_id, "user_type": "hierarchical"})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Obter estatísticas do usuário
        client_account = await db.users.find_one({"hierarchical_user_id": user_id})
        
        # Calcular comissões acumuladas (implementar lógica de acordo com hierarquia)
        commission_stats = await calculate_user_commissions(user_id, user["role"])
        
        return {
            "user": user,
            "client_account": client_account,
            "commission_stats": commission_stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter usuário hierárquico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter usuário: {str(e)}")

@api_router.put("/master/hierarchical-users/{user_id}/status")
async def update_hierarchical_user_status(
    user_id: str,
    request: HierarchicalUserStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    """Ativar/desativar usuário hierárquico"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        is_active = request.is_active
        
        # Atualizar na collection users (onde estão os usuários hierárquicos)
        result = await db.users.update_one(
            {"id": user_id, "user_type": "hierarchical"},
            {"$set": {"is_active": is_active}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Usuário hierárquico não encontrado")
        
        status_text = "ativado" if is_active else "desativado"
        logger.info(f"Usuário hierárquico {status_text}: {user_id}")
        
        return {"message": f"Usuário {status_text} com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {str(e)}")

@api_router.delete("/master/hierarchical-users/{user_id}")
async def delete_hierarchical_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletar usuário hierárquico"""
    # Check if user is master (by user_type or is_master_account flag)
    if current_user.user_type != "master" and not getattr(current_user, 'is_master_account', False):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    
    try:
        # Verificar se o usuário existe
        user = await db.users.find_one({"id": user_id, "user_type": "hierarchical"})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário hierárquico não encontrado")
        
        # Deletar o usuário da collection users
        result = await db.users.delete_one({"id": user_id, "user_type": "hierarchical"})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        logger.info(f"Usuário hierárquico deletado: {user_id} ({user.get('full_name', 'N/A')})")
        
        return {"message": f"Usuário {user.get('full_name', 'N/A')} deletado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar usuário hierárquico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar usuário: {str(e)}")

# Função auxiliar para calcular comissões
async def calculate_user_commissions(user_id: str, role: str):
    """Calcular comissões de acordo com a hierarquia"""
    # Implementar lógica específica para cada tipo de usuário
    # Esta é uma versão básica, será expandida
    
    if role == "socio_operador":
        # Buscar todas as transações do estado
        pass
    elif role == "mini_agencia":
        # Buscar todas as transações da cidade
        pass
    elif role == "consultor":
        # Buscar transações da rede de indicados
        pass
    
    return {
        "total_commissions": 0.0,
        "pending_commissions": 0.0,
        "paid_commissions": 0.0
    }

# ========================== XGate Integration Routes ==========================

# XGate Pydantic models
class XGateDepositRequest(BaseModel):
    amount: float = Field(..., description="Valor do depósito em BRL", gt=0)
    description: Optional[str] = Field(None, description="Descrição do depósito")

class XGateConversionRequest(BaseModel):
    brl_amount: float

# === PRESTADORES DE SERVIÇO MODELS ===
class ServiceProviderType(BaseModel):
    id: str = None
    name: str
    description: str = ""
    category: str  # saude, domestico, automotivo, beleza, consultoria, etc.
    icon: str = ""
    is_active: bool = True
    created_at: datetime = None

class ServiceProviderRegister(BaseModel):
    full_name: str
    fantasy_name: str = ""
    document: str  # CPF ou CNPJ
    document_type: str  # "cpf" ou "cnpj"
    email: str
    password: str
    phone: str
    address_street: str
    address_number: str
    address_complement: str = ""
    address_neighborhood: str
    address_city: str
    address_state: str
    address_zipcode: str
    provider_type_id: str
    profile_description: str = ""
    working_hours: str = ""  # JSON string with schedule
    accepts_emergency: bool = False
    cashback_rate: float = Field(..., ge=1.0, le=10.0, description="Taxa de cashback entre 1% e 10%")
    referral_code_used: Optional[str] = None

class Service(BaseModel):
    id: str = None
    provider_id: str
    name: str
    description: str
    price: float
    estimated_duration: int  # minutes
    category: str
    is_available: bool = True
    created_at: datetime = None

class ServiceAppointment(BaseModel):
    id: str = None
    client_id: str
    provider_id: str
    service_id: str
    appointment_date: datetime
    start_time: str
    end_time: str
    status: str = "pending"  # pending, confirmed, in_progress, completed, cancelled
    client_notes: str = ""
    provider_notes: str = ""
    total_value: float
    transaction_id: str = None
    created_at: datetime = None

class AppointmentStatusUpdate(BaseModel):
    appointment_id: str
    new_status: str
    notes: str = ""

# Test XGate connection
@api_router.get("/xgate/test-connection")
async def test_xgate_connection(current_user: User = Depends(get_current_user)):
    """Testar conexão com a API XGate"""
    try:
        # Use real XGate service
        result = await xgate_service.test_connection()
        
        if result.success:
            return {
                "success": True,
                "data": {
                    **result.data,
                    "user_id": current_user.email,
                    "connected_at": datetime.now(timezone.utc).isoformat()
                },
                "error": None,
                "status_code": result.status_code
            }
        else:
            return {
                "success": False,
                "data": None,
                "error": result.error,
                "status_code": result.status_code or 500
            }
    except Exception as e:
        logger.error(f"Erro ao testar XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Create XGate customer
@api_router.post("/xgate/create-customer")
async def create_xgate_customer(current_user: User = Depends(get_current_user)):
    """Criar cliente no sistema XGate"""
    try:
        # Mock customer creation
        mock_customer_id = f"XG_{current_user.id[:8]}_{int(datetime.now(timezone.utc).timestamp())}"
        
        # Save mock customer_id to user
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": {"xgate_customer_id": mock_customer_id}}
        )
        
        return {
            "success": True,
            "data": {
                "customer_id": mock_customer_id,
                "name": current_user.full_name,
                "email": current_user.email,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "mock_mode": True
            },
            "error": None,
            "status_code": 201
        }
    except Exception as e:
        logger.error(f"Erro ao criar cliente XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Create PIX deposit
@api_router.post("/xgate/pix-deposit")
async def create_pix_deposit(
    request: XGateDepositRequest, 
    current_user: User = Depends(get_current_user)
):
    """Criar depósito PIX via XGate - Implementação Real/Mock"""
    try:
        # Get or create XGate customer ID
        customer_id = getattr(current_user, 'xgate_customer_id', None)
        
        # Obter dados do usuário para criar customer na XGate
        customer_name = current_user.full_name
        customer_document = getattr(current_user, 'cpf', None) or getattr(current_user, 'cnpj', None)
        customer_phone = getattr(current_user, 'phone', None)
        
        # Create PIX deposit via XGate service
        result = await xgate_service.create_pix_deposit(
            customer_id=customer_id,
            amount=request.amount,
            description=request.description or f"Depósito Transmill - R$ {request.amount:.2f}",
            user_email=current_user.email,
            customer_name=customer_name,
            customer_document=customer_document,
            customer_phone=customer_phone
        )
        
        if result.success:
            # Salvar xgate_customer_id no usuário se retornado
            if result.data.get('customerId') and not customer_id:
                await db.users.update_one(
                    {"id": current_user.id},
                    {"$set": {"xgate_customer_id": result.data.get('customerId')}}
                )
            
            # Register transaction in internal system
            transaction_data = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "type": "deposit_pix_xgate",
                "amount": request.amount,
                "description": result.data.get("description", f"Depósito PIX XGate - R$ {request.amount:.2f}"),
                "status": "pending",  # Will be updated via webhook
                "xgate_deposit_id": result.data.get("id"),
                "pix_key": result.data.get("pix_key"),
                "qr_code": result.data.get("qr_code"),
                "expires_at": result.data.get("expires_at"),
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.transactions.insert_one(transaction_data)
            
            return {
                "success": True,
                "data": {
                    **result.data,
                    "customer_id": customer_id or result.data.get('customerId'),
                    "user_email": current_user.email
                },
                "error": None,
                "status_code": result.status_code
            }
        else:
            return {
                "success": False,
                "data": None,
                "error": result.error,
                "status_code": result.status_code or 500
            }
            
    except Exception as e:
        logger.error(f"Erro ao criar depósito PIX XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Get current exchange rate
@api_router.get("/xgate/exchange-rate")
async def get_exchange_rate(current_user: User = Depends(get_current_user)):
    """Obter taxa de câmbio BRL para USD atual"""
    try:
        # Simular taxa de câmbio (em produção, usar API real da XGate)
        # Taxa simulada: 1 USD = 5.50 BRL (pode variar)
        exchange_rate = 5.50
        
        return {
            "success": True,
            "data": {
                "rate": exchange_rate,
                "currency_pair": "USD/BRL",
                "timestamp": datetime.utcnow().isoformat(),
                "provider": "XGate"
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter taxa de câmbio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Convert BRL to USDT
@api_router.post("/xgate/convert-brl-usdt")
async def convert_brl_to_usdt(
    request: XGateConversionRequest,
    current_user: User = Depends(get_current_user)
):
    """Criar PIX para depósito com conversão BRL para USDT via XGate"""
    try:
        # Check if user has customer_id in XGate
        customer_id = getattr(current_user, 'xgate_customer_id', None)
        if not customer_id:
            # Create customer automatically
            customer_result = await create_xgate_customer(current_user)
            if not customer_result["success"]:
                return customer_result
            customer_id = customer_result["data"].get("customer_id")
        
        # Taxa de conversão atual
        exchange_rate = 5.50  # 1 USD = 5.50 BRL
        
        # Aplicar taxa de 3,99% usando USDTService
        usdt_service = USDTService()
        fee_amount, net_amount = usdt_service.calculate_usdt_fee(request.brl_amount)
        
        # Calcular USDT sobre valor líquido (após taxa)
        usdt_amount = net_amount / exchange_rate
        
        # Gerar QR Code visual usando o service
        qr_data = xgate_service._generate_pix_qr_code(request.brl_amount)
        
        # Usar dados do QR Code gerado
        pix_copy_paste = qr_data["pix_copy_paste"]
        qr_code_image = qr_data["qr_code_image"]
        pix_key = f"pix.transmill.usdt.{str(uuid.uuid4())[:8]}@xgate.com.br"
        
        # Criar registro da conversão pendente
        conversion_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "type": "deposit_conversion_usdt",
            "brl_amount": request.brl_amount,
            "fee_percentage": 3.99,
            "fee_amount": round(fee_amount, 2),
            "net_amount": round(net_amount, 2),
            "usdt_amount": round(usdt_amount, 6),
            "exchange_rate": exchange_rate,
            "status": "pending_payment",
            "pix_key": pix_key,
            "pix_code": pix_copy_paste,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.conversions.insert_one(conversion_data)
        
        return {
            "success": True,
            "data": {
                "amount": request.brl_amount,
                "fee_percentage": 3.99,
                "fee_amount": round(fee_amount, 2),
                "net_amount": round(net_amount, 2),
                "usdt_amount": round(usdt_amount, 6),
                "exchange_rate": exchange_rate,
                "qr_code_image": qr_code_image,
                "pix_copy_paste": pix_copy_paste,
                "pix_key": pix_key,
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
                "conversion_id": conversion_data["id"],
                "mock_mode": True
            },
            "error": None,
            "status_code": 200
        }
    except Exception as e:
        logger.error(f"Erro ao converter BRL para USDT: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Get exchange rate
@api_router.get("/xgate/exchange-rate")
async def get_exchange_rate(
    from_currency: str = "BRL",
    to_currency: str = "USDT",
    current_user: User = Depends(get_current_user)
):
    """Consultar taxa de câmbio BRL/USDT"""
    try:
        # Mock exchange rate for testing
        mock_rate = 5.23  # Example rate: 1 USDT = 5.23 BRL
        
        return {
            "success": True,
            "data": {
                "from_currency": from_currency,
                "to_currency": to_currency,
                "rate": mock_rate,
                "brl_usdt_rate": mock_rate,  # Add this field for frontend compatibility
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mock_mode": True
            },
            "error": None,
            "status_code": 200
        }
    except Exception as e:
        logger.error(f"Erro ao consultar taxa de câmbio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Get XGate deposit status
@api_router.get("/xgate/deposit-status/{deposit_id}")
async def get_deposit_status(
    deposit_id: str,
    current_user: User = Depends(get_current_user)
):
    """Consultar status de depósito XGate"""
    try:
        # Verify transaction belongs to user
        transaction = await db.transactions.find_one({
            "user_id": current_user.id,
            "xgate_deposit_id": deposit_id
        })
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Depósito não encontrado")
        
        # Check real status via XGate service
        result = await xgate_service.check_deposit_status(deposit_id)
        
        if result.success:
            # Update local transaction if status changed
            xgate_status = result.data.get("status")
            if xgate_status and xgate_status != transaction.get("status"):
                await db.transactions.update_one(
                    {"xgate_deposit_id": deposit_id},
                    {
                        "$set": {
                            "status": xgate_status,
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
            
            return {
                "success": True,
                "data": {
                    "deposit_id": deposit_id,
                    "status": xgate_status or transaction.get("status", "unknown"),
                    "amount": transaction.get("amount", 0),
                    "created_at": transaction.get("created_at"),
                    "updated_at": result.data.get("updated_at"),
                    "description": transaction.get("description", ""),
                    "pix_key": transaction.get("pix_key"),
                    "qr_code": transaction.get("qr_code"),
                    "expires_at": transaction.get("expires_at")
                }
            }
        else:
            # Return local data if XGate service fails
            return {
                "success": True,
                "data": {
                    "deposit_id": deposit_id,
                    "status": transaction.get("status", "unknown"),
                    "amount": transaction.get("amount", 0),
                    "created_at": transaction.get("created_at"),
                    "description": transaction.get("description", ""),
                    "note": "Status from local database (XGate service unavailable)"
                }
            }
            
    except Exception as e:
        logger.error(f"Erro ao consultar status do depósito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# Get user's XGate transactions
@api_router.get("/xgate/transactions")
async def get_xgate_transactions(current_user: User = Depends(get_current_user)):
    """Listar transações XGate do usuário"""
    try:
        # Buscar transações XGate do usuário
        transactions = await db.transactions.find({
            "user_id": current_user.id,
            "type": {"$in": ["deposit_pix_xgate", "conversion_brl_usdt"]}
        }).sort("created_at", -1).to_list(100)
        
        # Buscar conversões
        conversions = await db.conversions.find({
            "user_id": current_user.id
        }).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "data": {
                "deposits": transactions,
                "conversions": conversions
            }
        }
    except Exception as e:
        logger.error(f"Erro ao listar transações XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# XGate webhook endpoint (public - no authentication required)
class XGateWebhookPayload(BaseModel):
    event_type: str
    deposit_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    transaction_id: Optional[str] = None
    timestamp: Optional[str] = None

@api_router.post("/xgate/webhook")
async def xgate_webhook(payload: XGateWebhookPayload, request: Request):
    """Webhook para receber notificações do XGate (Público)"""
    try:
        logger.info(f"📡 XGate webhook received: {payload.event_type}")
        
        # Process webhook via XGate service
        webhook_data = payload.dict()
        result = await xgate_service.process_webhook(webhook_data)
        
        # Handle deposit completion
        if payload.event_type == "deposit.status_changed" and payload.status == "completed":
            if payload.deposit_id and payload.amount:
                # Find the transaction in our database
                transaction = await db.transactions.find_one({
                    "xgate_deposit_id": payload.deposit_id
                })
                
                if transaction:
                    # Update transaction status
                    await db.transactions.update_one(
                        {"xgate_deposit_id": payload.deposit_id},
                        {
                            "$set": {
                                "status": "completed",
                                "completed_at": datetime.now(timezone.utc)
                            }
                        }
                    )
                    
                    # Update user balance
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$inc": {"balance": payload.amount}}
                    )
                    
                    logger.info(f"✅ PIX deposit completed and balance updated: {payload.deposit_id} - R$ {payload.amount}")
                else:
                    logger.warning(f"⚠️ Transaction not found for deposit_id: {payload.deposit_id}")
        
        return {"status": "ok", "message": "Webhook processed successfully"}
        
    except Exception as e:
        logger.error(f"❌ Error processing XGate webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# Endpoint para sincronizar full_name com nome_fantasia
# ============================================================================
# 🏢 SISTEMA DE FRANQUIAS WHITE LABEL
# ============================================================================

@api_router.get("/franquias")
async def listar_franquias(
    current_user: dict = Depends(get_current_user)
):
    """
    Lista todas as franquias (apenas para master).
    """
    try:
        # Verificar se é master
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode listar franquias.")
        
        franquias = await db.franquias.find(
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


@api_router.post("/franquias")
async def criar_franquia(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma nova franquia (apenas para master).
    """
    try:
        # Verificar se é master
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode criar franquias.")
        
        data = await request.json()
        
        # Validar campos obrigatórios
        nome = data.get('nome')
        slug = data.get('slug')
        estado = data.get('estado')
        
        if not nome or not slug or not estado:
            return {"success": False, "error": "Nome, slug e estado são obrigatórios"}
        
        # Verificar se slug já existe
        existente = await db.franquias.find_one({"slug": slug})
        if existente:
            return {"success": False, "error": f"Já existe uma franquia com o slug '{slug}'"}
        
        # Criar franquia
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
        
        await db.franquias.insert_one(franquia)
        
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


@api_router.get("/franquias/{slug}")
async def obter_franquia(slug: str):
    """
    Obtém dados de uma franquia pelo slug.
    Endpoint público para o PWA carregar configurações.
    """
    try:
        franquia = await db.franquias.find_one(
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


@api_router.patch("/franquias/{franquia_id}")
async def atualizar_franquia(
    franquia_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza uma franquia (master ou admin da franquia).
    """
    try:
        # Verificar permissão
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        is_franquia_admin = current_user.get('user_type') == 'franquia_admin' and current_user.get('franquia_id') == franquia_id
        
        if not is_master and not is_franquia_admin:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        data = await request.json()
        
        # Campos permitidos para atualização
        campos_permitidos = [
            'nome', 'estado', 'cidades', 'logo_url', 'cor_primaria', 'cor_secundaria', 
            'cor_texto', 'email_contato', 'telefone_contato', 'endereco', 'ativo', 'is_demo'
        ]
        
        update_fields = {k: v for k, v in data.items() if k in campos_permitidos}
        update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = await db.franquias.update_one(
            {"id": franquia_id},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0:
            franquia = await db.franquias.find_one({"id": franquia_id}, {"_id": 0})
            return {"success": True, "message": "Franquia atualizada", "franquia": franquia}
        else:
            return {"success": False, "error": "Franquia não encontrada ou sem alterações"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar franquia: {e}")
        return {"success": False, "error": str(e)}


@api_router.delete("/franquias/{franquia_id}")
async def desativar_franquia(
    franquia_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Desativa uma franquia (apenas master).
    """
    try:
        # Verificar se é master
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode desativar franquias.")
        
        result = await db.franquias.update_one(
            {"id": franquia_id},
            {"$set": {"ativo": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Franquia desativada"}
        else:
            return {"success": False, "error": "Franquia não encontrada"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao desativar franquia: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# Upload de Logo da Franquia
# ============================================
@api_router.post("/franquias/{franquia_id}/logo")
async def upload_logo_franquia(
    franquia_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Faz upload da logo de uma franquia.
    A logo é salva no Cloudinary e a URL é atualizada na franquia.
    """
    try:
        # Verificar permissão
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        is_franquia_admin = current_user.get('user_type') == 'franquia_admin' and current_user.get('franquia_id') == franquia_id
        
        if not is_master and not is_franquia_admin:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        # Verificar se franquia existe
        franquia = await db.franquias.find_one({"id": franquia_id})
        if not franquia:
            raise HTTPException(status_code=404, detail="Franquia não encontrada")
        
        # Validar tipo de arquivo
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de arquivo não permitido. Use: {', '.join(allowed_types)}"
            )
        
        # Validar tamanho (max 5MB)
        content = await file.read()
        max_size = 5 * 1024 * 1024  # 5MB
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo: 5MB")
        
        # Gerar nome único para o arquivo
        import uuid as uuid_module
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        unique_filename = f"franquia_{franquia_id}_{uuid_module.uuid4().hex[:8]}.{file_extension}"
        
        logger.info(f"📤 Fazendo upload de logo para franquia {franquia_id}")
        
        # Upload para Cloudinary (usa credenciais do white label, fallback .env)
        _fr_doc = await db.franquias.find_one({"id": franquia_id})
        from routes.integracoes import cloudinary_kwargs_for_slug
        _cloud_kwargs = await cloudinary_kwargs_for_slug(_fr_doc.get("slug") if _fr_doc else None)
        logo_url = await upload_file_to_cloudinary(
            content,
            unique_filename,
            folder="franquias/logos",
            resource_type="image",
            **_cloud_kwargs
        )
        
        if not logo_url:
            raise HTTPException(status_code=500, detail="Erro ao fazer upload da logo")
        
        # Atualizar franquia com nova logo
        await db.franquias.update_one(
            {"id": franquia_id},
            {"$set": {
                "logo_url": logo_url,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"✅ Logo atualizada para franquia {franquia_id}: {logo_url}")
        
        return {
            "success": True,
            "message": "Logo atualizada com sucesso",
            "logo_url": logo_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer upload de logo: {e}")
        return {"success": False, "error": str(e)}


@api_router.delete("/franquias/{franquia_id}/logo")
async def remover_logo_franquia(
    franquia_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a logo de uma franquia.
    """
    try:
        # Verificar permissão
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode remover logos.")
        
        # Atualizar franquia removendo logo
        result = await db.franquias.update_one(
            {"id": franquia_id},
            {"$set": {
                "logo_url": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Logo removida com sucesso"}
        else:
            return {"success": False, "error": "Franquia não encontrada ou sem logo"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover logo: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# Solicitação de Franquia (Cadastro Público)
# ============================================
@api_router.post("/franquias/solicitacao")
async def criar_solicitacao_franquia(request: Request):
    """
    Recebe solicitação de cadastro de nova franquia (endpoint público).
    Cria uma solicitação pendente para análise do master.
    """
    try:
        data = await request.json()
        
        # Validar campos obrigatórios
        nome = data.get('nome')
        estado = data.get('estado')
        responsavel_nome = data.get('responsavel_nome')
        
        if not nome or not estado or not responsavel_nome:
            return {"success": False, "error": "Nome, estado e responsável são obrigatórios"}
        
        # Criar solicitação
        solicitacao = {
            "id": str(uuid.uuid4()),
            "status": "pendente",  # pendente, em_analise, aprovada, rejeitada
            
            # Dados da empresa
            "nome": nome,
            "slug": data.get('slug', ''),
            "razao_social": data.get('razao_social', ''),
            "cnpj": data.get('cnpj', ''),
            "inscricao_estadual": data.get('inscricao_estadual', ''),
            "estado": estado,
            "cidades": data.get('cidades', []),
            
            # Endereço
            "endereco": data.get('endereco', {}),
            
            # Responsável
            "responsavel_nome": responsavel_nome,
            "responsavel_cpf": data.get('responsavel_cpf', ''),
            "responsavel_rg": data.get('responsavel_rg', ''),
            "responsavel_telefone": data.get('responsavel_telefone', ''),
            "responsavel_email": data.get('responsavel_email', ''),
            
            # Contato
            "email_contato": data.get('email_contato', ''),
            "telefone_contato": data.get('telefone_contato', ''),
            
            # Identidade visual
            "cor_primaria": data.get('cor_primaria', '#1a59ad'),
            "cor_secundaria": data.get('cor_secundaria', '#ffffff'),
            "cor_texto": data.get('cor_texto', '#ffffff'),
            "logo_url": "",
            
            # Documentos (URLs serão preenchidas após upload)
            "documentos": {
                "contrato_social": "",
                "comprovante_endereco": "",
                "documento_responsavel": "",
                "logo": ""
            },
            
            # Observações
            "observacoes": data.get('observacoes', ''),
            
            # Metadados
            "origem": data.get('origem', 'formulario'),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.franquias_solicitacoes.insert_one(solicitacao)
        
        logger.info(f"✅ Nova solicitação de franquia: {nome} ({estado}) - ID: {solicitacao['id']}")
        
        return {
            "success": True,
            "message": "Solicitação enviada com sucesso!",
            "solicitacao_id": solicitacao['id']
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar solicitação de franquia: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/franquias/solicitacao/{solicitacao_id}/documento")
async def upload_documento_solicitacao(
    solicitacao_id: str,
    file: UploadFile = File(...),
    tipo: str = Form(...)
):
    """
    Faz upload de documento para uma solicitação de franquia.
    """
    try:
        # Verificar se solicitação existe
        solicitacao = await db.franquias_solicitacoes.find_one({"id": solicitacao_id})
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")
        
        # Validar tipo
        tipos_validos = ['logo', 'contrato_social', 'comprovante_endereco', 'documento_responsavel']
        if tipo not in tipos_validos:
            raise HTTPException(status_code=400, detail=f"Tipo inválido. Use: {', '.join(tipos_validos)}")
        
        # Validar arquivo
        content = await file.read()
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo: 10MB")
        
        # Upload para Cloudinary
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
        unique_filename = f"solicitacao_{solicitacao_id}_{tipo}_{uuid.uuid4().hex[:8]}.{file_extension}"
        
        file_url = await upload_file_to_cloudinary(
            content,
            unique_filename,
            folder="franquias/solicitacoes",
            resource_type="auto"
        )
        
        if not file_url:
            raise HTTPException(status_code=500, detail="Erro ao fazer upload do arquivo")
        
        # Atualizar solicitação
        update_field = f"documentos.{tipo}" if tipo != 'logo' else "logo_url"
        await db.franquias_solicitacoes.update_one(
            {"id": solicitacao_id},
            {"$set": {
                update_field: file_url,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"✅ Documento {tipo} enviado para solicitação {solicitacao_id}")
        
        return {
            "success": True,
            "message": "Documento enviado com sucesso",
            "url": file_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer upload de documento: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/admin/franquias/solicitacoes")
async def listar_solicitacoes_franquia(
    status: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista solicitações de franquias pendentes (apenas master).
    """
    try:
        # Verificar permissão
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        filtro = {}
        if status:
            filtro["status"] = status
        
        solicitacoes = await db.franquias_solicitacoes.find(
            filtro,
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=100)
        
        return {
            "success": True,
            "solicitacoes": solicitacoes,
            "total": len(solicitacoes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar solicitações: {e}")
        return {"success": False, "error": str(e)}


@api_router.patch("/admin/franquias/solicitacoes/{solicitacao_id}/status")
async def atualizar_status_solicitacao(
    solicitacao_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza status de uma solicitação de franquia.
    Se aprovada, cria a franquia automaticamente.
    """
    try:
        # Verificar permissão
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        data = await request.json()
        novo_status = data.get('status')
        
        if novo_status not in ['em_analise', 'aprovada', 'rejeitada']:
            return {"success": False, "error": "Status inválido"}
        
        # Buscar solicitação
        solicitacao = await db.franquias_solicitacoes.find_one({"id": solicitacao_id})
        if not solicitacao:
            return {"success": False, "error": "Solicitação não encontrada"}
        
        # Atualizar status
        await db.franquias_solicitacoes.update_one(
            {"id": solicitacao_id},
            {"$set": {
                "status": novo_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "atualizado_por": current_user.get('id')
            }}
        )
        
        # Se aprovada, criar franquia
        franquia_criada = None
        if novo_status == 'aprovada':
            franquia = {
                "id": str(uuid.uuid4()),
                "nome": solicitacao['nome'],
                "slug": solicitacao.get('slug') or solicitacao['nome'].lower().replace(' ', '-'),
                "estado": solicitacao['estado'],
                "cidades": solicitacao.get('cidades', []),
                "logo_url": solicitacao.get('logo_url', ''),
                "cor_primaria": solicitacao.get('cor_primaria', '#1a59ad'),
                "cor_secundaria": solicitacao.get('cor_secundaria', '#ffffff'),
                "cor_texto": solicitacao.get('cor_texto', '#ffffff'),
                "email_contato": solicitacao.get('email_contato', ''),
                "telefone_contato": solicitacao.get('telefone_contato', ''),
                "endereco": solicitacao.get('endereco', {}),
                "cnpj": solicitacao.get('cnpj', ''),
                "razao_social": solicitacao.get('razao_social', ''),
                "responsavel": {
                    "nome": solicitacao.get('responsavel_nome', ''),
                    "cpf": solicitacao.get('responsavel_cpf', ''),
                    "telefone": solicitacao.get('responsavel_telefone', ''),
                    "email": solicitacao.get('responsavel_email', '')
                },
                "ativo": True,
                "solicitacao_id": solicitacao_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get('id')
            }
            
            await db.franquias.insert_one(franquia)
            franquia_criada = {k: v for k, v in franquia.items() if k != '_id'}
            
            logger.info(f"✅ Franquia criada a partir da solicitação: {franquia['nome']}")
            
            # ========================================
            # CRIAR UNIDADE LABELVIEW AUTOMATICAMENTE
            # ========================================
            # Quando uma franquia é aprovada, criar automaticamente uma Unidade Labelview
            unidade_id = str(uuid.uuid4())
            unidade_labelview = {
                "id": unidade_id,
                "nome": franquia['nome'],
                "nome_fantasia": franquia['nome'],
                "slug": franquia['slug'],
                "franquia_id": franquia['id'],
                "estado": franquia['estado'],
                "cidade": franquia.get('endereco', {}).get('cidade', ''),
                "endereco": franquia.get('endereco', {}),
                "cnpj": franquia.get('cnpj', ''),
                "email": franquia.get('email_contato', ''),
                "telefone": franquia.get('telefone_contato', ''),
                "logo_url": franquia.get('logo_url', ''),
                "cor_primaria": franquia.get('cor_primaria', '#1a59ad'),
                "cor_secundaria": franquia.get('cor_secundaria', '#ffffff'),
                "ativo": True,
                "tipo": "franquia",  # Identifica que esta unidade veio de uma franquia
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.labelview_unidades.insert_one(unidade_labelview)
            logger.info(f"✅ Unidade Labelview criada automaticamente: {unidade_labelview['nome']} (ID: {unidade_id})")
            
            # Criar usuário admin para a franquia/unidade
            # Gerar senha temporária
            from passlib.hash import bcrypt as bcrypt_hash
            senha_temporaria = f"Trans{solicitacao.get('responsavel_cpf', '123456')[-4:]}!"
            
            usuario_franquia = {
                "id": str(uuid.uuid4()),
                "email": franquia.get('email_contato') or solicitacao.get('responsavel_email'),
                "password_hash": bcrypt_hash.hash(senha_temporaria),
                "full_name": solicitacao.get('responsavel_nome', franquia['nome']),
                "phone": franquia.get('telefone_contato', ''),
                "cpf": solicitacao.get('responsavel_cpf', ''),
                "user_type": "labelview_unidade",
                "is_labelview_unidade": True,
                "unidade_id": unidade_id,
                "franquia_id": franquia['id'],
                "franquia_slug": franquia['slug'],  # Importante para login via /franquia/{slug}/login
                "nome_fantasia": franquia['nome'],
                "estado": franquia['estado'],
                "logo_url": franquia.get('logo_url', ''),
                "cor_primaria": franquia.get('cor_primaria', '#1a59ad'),
                "cor_secundaria": franquia.get('cor_secundaria', '#ffffff'),
                "must_change_password": True,  # Forçar troca de senha no primeiro login
                "profile_complete": False,
                "ativo": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(usuario_franquia)
            logger.info(f"✅ Usuário admin da franquia criado: {usuario_franquia['email']}")
            
            # Adicionar info de acesso ao retorno
            franquia_criada["unidade_labelview_id"] = unidade_id
            franquia_criada["usuario_admin"] = {
                "email": usuario_franquia['email'],
                "senha_temporaria": senha_temporaria,
                "mensagem": "Envie essas credenciais ao responsável. A senha deve ser trocada no primeiro acesso."
            }
        
        return {
            "success": True,
            "message": f"Status atualizado para {novo_status}",
            "franquia_criada": franquia_criada
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/franquias/{franquia_id}/unidades")
async def listar_unidades_franquia(
    franquia_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista unidades vinculadas a uma franquia.
    """
    try:
        # Verificar permissão
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        is_franquia_admin = current_user.get('user_type') == 'franquia_admin' and current_user.get('franquia_id') == franquia_id
        
        if not is_master and not is_franquia_admin:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        unidades = await db.users.find(
            {
                "franquia_id": franquia_id,
                "user_type": "labelview_unidade"
            },
            {"_id": 0, "password_hash": 0}
        ).sort("nome_fantasia", 1).to_list(length=500)
        
        return {
            "success": True,
            "unidades": unidades,
            "total": len(unidades)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar unidades da franquia: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/franquias/{franquia_id}/vincular-unidade")
async def vincular_unidade_franquia(
    franquia_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Vincula uma unidade a uma franquia.
    """
    try:
        # Verificar se é master
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode vincular unidades.")
        
        data = await request.json()
        unidade_id = data.get('unidade_id')
        
        if not unidade_id:
            return {"success": False, "error": "unidade_id é obrigatório"}
        
        # Verificar se franquia existe
        franquia = await db.franquias.find_one({"id": franquia_id})
        if not franquia:
            return {"success": False, "error": "Franquia não encontrada"}
        
        # Vincular unidade à franquia
        result = await db.users.update_one(
            {"id": unidade_id, "user_type": "labelview_unidade"},
            {"$set": {
                "franquia_id": franquia_id,
                "franquia_nome": franquia.get('nome'),
                "franquia_slug": franquia.get('slug'),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Unidade {unidade_id} vinculada à franquia {franquia.get('nome')}")
            return {"success": True, "message": f"Unidade vinculada à franquia '{franquia.get('nome')}'"}
        else:
            return {"success": False, "error": "Unidade não encontrada"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao vincular unidade: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/franquias/criar-demo")
async def criar_franquia_demo(
    current_user: dict = Depends(get_current_user)
):
    """
    Cria a franquia demo (Transmill) com as configurações atuais.
    Endpoint de migração para transformar o sistema atual em franquia.
    """
    try:
        # Verificar se é master
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        # Verificar se já existe
        existente = await db.franquias.find_one({"slug": "transmill"})
        if existente:
            return {"success": False, "error": "Franquia demo já existe", "franquia": existente}
        
        # Criar franquia Transmill (demo)
        franquia_demo = {
            "id": str(uuid.uuid4()),
            "nome": "Transmill Auto",
            "slug": "transmill",
            "estado": "SP",
            "cidades": ["São Paulo"],
            "logo_url": "",
            "cor_primaria": "#1a59ad",
            "cor_secundaria": "#ffffff",
            "cor_texto": "#ffffff",
            "email_contato": "contato@transmill.com.br",
            "telefone_contato": "",
            "endereco": {},
            "ativo": True,
            "is_demo": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get('id')
        }
        
        await db.franquias.insert_one(franquia_demo)
        
        # Vincular todas as unidades existentes à franquia demo
        result = await db.users.update_many(
            {"user_type": "labelview_unidade", "franquia_id": {"$exists": False}},
            {"$set": {
                "franquia_id": franquia_demo['id'],
                "franquia_nome": "Transmill Auto",
                "franquia_slug": "transmill"
            }}
        )
        
        logger.info(f"✅ Franquia demo criada. {result.modified_count} unidades vinculadas.")
        
        return {
            "success": True,
            "message": f"Franquia demo criada! {result.modified_count} unidades vinculadas.",
            "franquia": {k: v for k, v in franquia_demo.items() if k != '_id'}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar franquia demo: {e}")
        return {"success": False, "error": str(e)}


# ============================================================================
# 📱 PWA DINÂMICO POR FRANQUIA - MOVIDO PARA /routes/franquias.py
# ============================================================================
# Os endpoints manifest-transmill.json e manifest-protecao.json foram movidos
# para o router franquias.py para melhor organização do código.

# ============================================
# ADMIN FRANQUIAS - ESTATÍSTICAS E FINANCEIRO
# ============================================

# Funções auxiliares para dados USDT do bolsão
async def _get_usdt_balance_bolsao():
    """Calcula o saldo USDT do bolsão"""
    try:
        pipeline = [
            {"$match": {"moeda": "USDT"}},
            {"$group": {
                "_id": None,
                "entradas": {"$sum": {"$cond": [{"$eq": ["$tipo", "entrada"]}, "$valor", 0]}},
                "saidas": {"$sum": {"$cond": [{"$eq": ["$tipo", "saida"]}, "$valor", 0]}}
            }}
        ]
        result = await db.movimentacoes_usdt.aggregate(pipeline).to_list(1)
        if result:
            return round(result[0].get("entradas", 0) - result[0].get("saidas", 0), 6)
        return 0.0
    except:
        return 0.0

async def _get_usdt_entradas_mes():
    """Calcula entradas USDT do mês"""
    try:
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        pipeline = [
            {"$match": {
                "moeda": "USDT",
                "tipo": "entrada",
                "data": {"$gte": inicio_mes}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
        ]
        result = await db.movimentacoes_usdt.aggregate(pipeline).to_list(1)
        return round(result[0]["total"], 6) if result else 0.0
    except:
        return 0.0

async def _get_usdt_saidas_mes():
    """Calcula saídas USDT do mês (transferências externas)"""
    try:
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        pipeline = [
            {"$match": {
                "moeda": "USDT",
                "tipo": "saida",
                "data": {"$gte": inicio_mes}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
        ]
        result = await db.movimentacoes_usdt.aggregate(pipeline).to_list(1)
        return round(result[0]["total"], 6) if result else 0.0
    except:
        return 0.0

async def _get_usdt_conversoes_mes():
    """Calcula volume de conversões USDT/BRL do mês"""
    try:
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        pipeline = [
            {"$match": {
                "tipo": {"$in": ["conversao_usdt_brl", "conversao_brl_usdt"]},
                "data": {"$gte": inicio_mes}
            }},
            {"$group": {
                "_id": "$tipo",
                "total_usdt": {"$sum": "$valor_usdt"},
                "total_brl": {"$sum": "$valor_brl"},
                "quantidade": {"$sum": 1}
            }}
        ]
        result = await db.conversoes_usdt.aggregate(pipeline).to_list(10)
        
        conversoes = {
            "usdt_para_brl": {"volume_usdt": 0, "volume_brl": 0, "quantidade": 0},
            "brl_para_usdt": {"volume_usdt": 0, "volume_brl": 0, "quantidade": 0}
        }
        
        for item in result:
            if item["_id"] == "conversao_usdt_brl":
                conversoes["usdt_para_brl"] = {
                    "volume_usdt": round(item.get("total_usdt", 0), 6),
                    "volume_brl": round(item.get("total_brl", 0), 2),
                    "quantidade": item.get("quantidade", 0)
                }
            elif item["_id"] == "conversao_brl_usdt":
                conversoes["brl_para_usdt"] = {
                    "volume_usdt": round(item.get("total_usdt", 0), 6),
                    "volume_brl": round(item.get("total_brl", 0), 2),
                    "quantidade": item.get("quantidade", 0)
                }
        
        return conversoes
    except:
        return {
            "usdt_para_brl": {"volume_usdt": 0, "volume_brl": 0, "quantidade": 0},
            "brl_para_usdt": {"volume_usdt": 0, "volume_brl": 0, "quantidade": 0}
        }

@api_router.get("/admin/franquias/stats")
async def get_franquias_stats(current_user: dict = Depends(get_current_user)):
    """
    Retorna estatísticas gerais de todas as franquias para o painel admin.
    Inclui saldo do bolsão, total de clientes, receitas, etc.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas master pode ver estatísticas globais.")
        
        # Contar franquias
        total_franquias = await db.franquias.count_documents({})
        franquias_ativas = await db.franquias.count_documents({"ativo": True})
        
        # Contar clientes em todas as franquias
        total_clientes = await db.users.count_documents({"user_type": "cliente"})
        
        # Calcular movimentações do mês atual
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Buscar movimentações financeiras do mês
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
        
        entradas_result = await db.movimentacoes_bolsao.aggregate(pipeline_entradas).to_list(1)
        saidas_result = await db.movimentacoes_bolsao.aggregate(pipeline_saidas).to_list(1)
        
        entradas_mes = entradas_result[0]["total"] if entradas_result else 0
        saidas_mes = saidas_result[0]["total"] if saidas_result else 0
        
        # Calcular saldo do bolsão (soma de todas as movimentações)
        pipeline_saldo = [
            {"$group": {
                "_id": None,
                "entradas": {"$sum": {"$cond": [{"$eq": ["$tipo", "entrada"]}, "$valor", 0]}},
                "saidas": {"$sum": {"$cond": [{"$eq": ["$tipo", "saida"]}, "$valor", 0]}}
            }}
        ]
        saldo_result = await db.movimentacoes_bolsao.aggregate(pipeline_saldo).to_list(1)
        saldo_bolsao = 0
        if saldo_result:
            saldo_bolsao = saldo_result[0].get("entradas", 0) - saldo_result[0].get("saidas", 0)
        
        # Receita do mês (pagamentos recebidos)
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
                "movimentacoesMes": entradas_mes + saidas_mes,
                # Dados USDT
                "saldoUsdt": await _get_usdt_balance_bolsao(),
                "entradasUsdtMes": await _get_usdt_entradas_mes(),
                "saidasUsdtMes": await _get_usdt_saidas_mes(),
                "conversoesUsdtMes": await _get_usdt_conversoes_mes()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar stats de franquias: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/admin/franquias/movimentacoes")
async def get_franquias_movimentacoes(
    limit: int = Query(50, ge=1, le=200),
    franquia_id: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),  # "entrada" ou "saida"
    current_user: dict = Depends(get_current_user)
):
    """
    Lista movimentações financeiras do bolsão.
    Pode filtrar por franquia e tipo.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Construir filtro
        filtro = {}
        if franquia_id:
            filtro["franquia_id"] = franquia_id
        if tipo:
            filtro["tipo"] = tipo
        
        # Buscar movimentações
        movimentacoes = await db.movimentacoes_bolsao.find(
            filtro,
            {"_id": 0}
        ).sort("data", -1).limit(limit).to_list(limit)
        
        # Formatar datas
        for mov in movimentacoes:
            if isinstance(mov.get("data"), datetime):
                mov["data"] = mov["data"].strftime("%d/%m/%Y %H:%M")
        
        return {
            "success": True,
            "movimentacoes": movimentacoes,
            "total": len(movimentacoes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar movimentações: {e}")
        return {"success": False, "error": str(e), "movimentacoes": []}


# ============================================
# ADMIN FRANQUIAS - USDT / CRIPTO
# ============================================

@api_router.get("/admin/franquias/usdt/movimentacoes")
async def get_usdt_movimentacoes(
    limit: int = Query(50, ge=1, le=200),
    tipo: Optional[str] = Query(None),  # "entrada", "saida", "conversao", "transferencia_externa"
    current_user: dict = Depends(get_current_user)
):
    """
    Lista movimentações USDT do bolsão.
    Inclui depósitos, conversões e transferências externas.
    """
    try:
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        filtro = {"moeda": "USDT"}
        if tipo:
            filtro["tipo"] = tipo
        
        movimentacoes = await db.movimentacoes_usdt.find(
            filtro,
            {"_id": 0}
        ).sort("data", -1).limit(limit).to_list(limit)
        
        for mov in movimentacoes:
            if isinstance(mov.get("data"), datetime):
                mov["data"] = mov["data"].strftime("%d/%m/%Y %H:%M")
        
        return {
            "success": True,
            "movimentacoes": movimentacoes,
            "total": len(movimentacoes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar movimentações USDT: {e}")
        return {"success": False, "error": str(e), "movimentacoes": []}


@api_router.get("/admin/franquias/usdt/conversoes")
async def get_usdt_conversoes(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista conversões USDT/BRL realizadas.
    """
    try:
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        conversoes = await db.conversoes_usdt.find(
            {},
            {"_id": 0}
        ).sort("data", -1).limit(limit).to_list(limit)
        
        for conv in conversoes:
            if isinstance(conv.get("data"), datetime):
                conv["data"] = conv["data"].strftime("%d/%m/%Y %H:%M")
        
        return {
            "success": True,
            "conversoes": conversoes,
            "total": len(conversoes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar conversões: {e}")
        return {"success": False, "error": str(e), "conversoes": []}


@api_router.get("/admin/franquias/usdt/transferencias-externas")
async def get_usdt_transferencias_externas(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista transferências USDT para carteiras externas.
    """
    try:
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        filtro = {}
        if status:
            filtro["status"] = status
        
        transferencias = await db.transferencias_usdt_externas.find(
            filtro,
            {"_id": 0}
        ).sort("data", -1).limit(limit).to_list(limit)
        
        for trans in transferencias:
            if isinstance(trans.get("data"), datetime):
                trans["data"] = trans["data"].strftime("%d/%m/%Y %H:%M")
        
        return {
            "success": True,
            "transferencias": transferencias,
            "total": len(transferencias)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar transferências externas: {e}")
        return {"success": False, "error": str(e), "transferencias": []}


@api_router.get("/admin/franquias/usdt/cotacao")
async def get_usdt_cotacao(current_user: dict = Depends(get_current_user)):
    """
    Retorna a cotação atual USDT/BRL.
    """
    try:
        # Tentar buscar cotação da XGate
        if xgate_service:
            try:
                cotacao_data = await xgate_service.get_usdt_rate()
                if cotacao_data.get('success'):
                    return {
                        "success": True,
                        "cotacao": {
                            "usdt_brl": cotacao_data.get('rate', 5.50),
                            "fonte": cotacao_data.get('fonte', 'XGate'),
                            "atualizado_em": datetime.now(timezone.utc).isoformat()
                        }
                    }
            except Exception as e:
                logger.warning(f"Erro ao buscar cotação XGate: {e}")
        
        # Fallback: cotação estimada
        return {
            "success": True,
            "cotacao": {
                "usdt_brl": 5.50,  # Cotação aproximada
                "fonte": "Estimativa",
                "atualizado_em": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar cotação: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/admin/franquias/usdt/registrar-movimentacao")
async def registrar_movimentacao_usdt(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra uma movimentação USDT no bolsão (entrada ou saída).
    """
    try:
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        data = await request.json()
        
        tipo = data.get('tipo')  # 'entrada' ou 'saida'
        valor = float(data.get('valor', 0))
        descricao = data.get('descricao', '')
        origem = data.get('origem', '')  # 'deposito_xgate', 'conversao', 'transferencia_externa'
        wallet_externa = data.get('wallet_externa', '')  # Para transferências externas
        tx_hash = data.get('tx_hash', '')  # Hash da transação na blockchain
        
        if tipo not in ['entrada', 'saida']:
            raise HTTPException(status_code=400, detail="Tipo deve ser 'entrada' ou 'saida'")
        
        if valor <= 0:
            raise HTTPException(status_code=400, detail="Valor deve ser maior que zero")
        
        movimentacao = {
            "id": str(uuid.uuid4()),
            "moeda": "USDT",
            "tipo": tipo,
            "valor": valor,
            "descricao": descricao,
            "origem": origem,
            "wallet_externa": wallet_externa,
            "tx_hash": tx_hash,
            "registrado_por": current_user.get('email'),
            "registrado_por_id": current_user.get('id'),
            "data": datetime.now(timezone.utc)
        }
        
        await db.movimentacoes_usdt.insert_one(movimentacao)
        
        movimentacao.pop('_id', None)
        movimentacao['data'] = movimentacao['data'].isoformat()
        
        logger.info(f"✅ Movimentação USDT registrada: {tipo} {valor} USDT - {descricao}")
        
        return {
            "success": True,
            "message": f"Movimentação USDT registrada: {tipo} de {valor} USDT",
            "movimentacao": movimentacao
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao registrar movimentação USDT: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/admin/franquias/usdt/registrar-conversao")
async def registrar_conversao_usdt(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra uma conversão USDT/BRL.
    """
    try:
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        data = await request.json()
        
        tipo = data.get('tipo')  # 'conversao_usdt_brl' ou 'conversao_brl_usdt'
        valor_usdt = float(data.get('valor_usdt', 0))
        valor_brl = float(data.get('valor_brl', 0))
        cotacao = float(data.get('cotacao', 0))
        descricao = data.get('descricao', '')
        
        if tipo not in ['conversao_usdt_brl', 'conversao_brl_usdt']:
            raise HTTPException(status_code=400, detail="Tipo de conversão inválido")
        
        if valor_usdt <= 0 or valor_brl <= 0:
            raise HTTPException(status_code=400, detail="Valores devem ser maiores que zero")
        
        conversao = {
            "id": str(uuid.uuid4()),
            "tipo": tipo,
            "valor_usdt": valor_usdt,
            "valor_brl": valor_brl,
            "cotacao": cotacao,
            "descricao": descricao,
            "registrado_por": current_user.get('email'),
            "registrado_por_id": current_user.get('id'),
            "data": datetime.now(timezone.utc)
        }
        
        await db.conversoes_usdt.insert_one(conversao)
        
        # Também registrar como movimentação
        if tipo == 'conversao_usdt_brl':
            # Saída de USDT, entrada de BRL
            await db.movimentacoes_usdt.insert_one({
                "id": str(uuid.uuid4()),
                "moeda": "USDT",
                "tipo": "saida",
                "valor": valor_usdt,
                "descricao": f"Conversão para BRL - R$ {valor_brl:.2f}",
                "origem": "conversao",
                "conversao_id": conversao["id"],
                "data": datetime.now(timezone.utc)
            })
            await db.movimentacoes_bolsao.insert_one({
                "id": str(uuid.uuid4()),
                "tipo": "entrada",
                "valor": valor_brl,
                "descricao": f"Conversão de USDT - {valor_usdt} USDT",
                "origem": "conversao_usdt",
                "conversao_id": conversao["id"],
                "data": datetime.now(timezone.utc)
            })
        else:
            # Entrada de USDT, saída de BRL
            await db.movimentacoes_usdt.insert_one({
                "id": str(uuid.uuid4()),
                "moeda": "USDT",
                "tipo": "entrada",
                "valor": valor_usdt,
                "descricao": f"Conversão de BRL - R$ {valor_brl:.2f}",
                "origem": "conversao",
                "conversao_id": conversao["id"],
                "data": datetime.now(timezone.utc)
            })
            await db.movimentacoes_bolsao.insert_one({
                "id": str(uuid.uuid4()),
                "tipo": "saida",
                "valor": valor_brl,
                "descricao": f"Conversão para USDT - {valor_usdt} USDT",
                "origem": "conversao_usdt",
                "conversao_id": conversao["id"],
                "data": datetime.now(timezone.utc)
            })
        
        conversao.pop('_id', None)
        conversao['data'] = conversao['data'].isoformat()
        
        logger.info(f"✅ Conversão registrada: {tipo} - {valor_usdt} USDT <-> R$ {valor_brl}")
        
        return {
            "success": True,
            "message": f"Conversão registrada: {valor_usdt} USDT <-> R$ {valor_brl:.2f}",
            "conversao": conversao
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao registrar conversão: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/admin/franquias/{franquia_id}/saldo")
async def get_franquia_saldo(
    franquia_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna o saldo atual de uma franquia específica no bolsão.
    """
    try:
        # Verificar se é master ou admin da franquia
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        is_franquia_admin = current_user.get('franquia_id') == franquia_id
        
        if not is_master and not is_franquia_admin:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Calcular saldo da franquia
        pipeline = [
            {"$match": {"franquia_id": franquia_id}},
            {"$group": {
                "_id": None,
                "entradas": {"$sum": {"$cond": [{"$eq": ["$tipo", "entrada"]}, "$valor", 0]}},
                "saidas": {"$sum": {"$cond": [{"$eq": ["$tipo", "saida"]}, "$valor", 0]}}
            }}
        ]
        
        result = await db.movimentacoes_bolsao.aggregate(pipeline).to_list(1)
        
        saldo = 0
        entradas = 0
        saidas = 0
        
        if result:
            entradas = result[0].get("entradas", 0)
            saidas = result[0].get("saidas", 0)
            saldo = entradas - saidas
        
        # Buscar dados da franquia
        franquia = await db.franquias.find_one({"id": franquia_id}, {"_id": 0, "nome": 1, "slug": 1})
        
        return {
            "success": True,
            "franquia_id": franquia_id,
            "franquia_nome": franquia.get("nome") if franquia else "Desconhecida",
            "saldo": saldo,
            "total_entradas": entradas,
            "total_saidas": saidas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar saldo da franquia: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/admin/franquias/movimentacao")
async def registrar_movimentacao(
    dados: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra uma nova movimentação financeira no bolsão.
    Usado para depósitos, retiradas, pagamentos de franquias, etc.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Validar dados obrigatórios
        tipo = dados.get("tipo")  # "entrada" ou "saida"
        valor = float(dados.get("valor", 0))
        descricao = dados.get("descricao", "")
        franquia_id = dados.get("franquia_id")
        origem = dados.get("origem", "manual")  # manual, pagamento_pix, repasse, etc.
        
        if tipo not in ["entrada", "saida"]:
            return {"success": False, "error": "Tipo deve ser 'entrada' ou 'saida'"}
        
        if valor <= 0:
            return {"success": False, "error": "Valor deve ser positivo"}
        
        # Buscar nome da franquia se informada
        franquia_nome = None
        if franquia_id:
            franquia = await db.franquias.find_one({"id": franquia_id}, {"_id": 0, "nome": 1})
            franquia_nome = franquia.get("nome") if franquia else None
        
        # Criar movimentação
        movimentacao = {
            "id": str(uuid.uuid4()),
            "tipo": tipo,
            "valor": valor,
            "descricao": descricao,
            "franquia_id": franquia_id,
            "franquia_nome": franquia_nome,
            "origem": origem,
            "data": datetime.now(timezone.utc),
            "registrado_por": current_user.get("id"),
            "registrado_por_nome": current_user.get("full_name", current_user.get("email"))
        }
        
        await db.movimentacoes_bolsao.insert_one(movimentacao)
        
        # Remover _id para retorno
        movimentacao.pop("_id", None)
        if isinstance(movimentacao.get("data"), datetime):
            movimentacao["data"] = movimentacao["data"].strftime("%d/%m/%Y %H:%M")
        
        logger.info(f"✅ Movimentação registrada: {tipo} R${valor} - {descricao}")
        
        return {
            "success": True,
            "message": f"Movimentação de {tipo} registrada com sucesso",
            "movimentacao": movimentacao
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao registrar movimentação: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/admin/franquias/saldos")
async def get_franquias_saldos(current_user: dict = Depends(get_current_user)):
    """
    Retorna o saldo de todas as franquias no bolsão.
    Para a tabela de saldos por franquia no admin panel.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Buscar todas as franquias ativas
        franquias = await db.franquias.find(
            {"ativo": True},
            {"_id": 0, "id": 1, "nome": 1, "slug": 1, "cor_primaria": 1}
        ).to_list(100)
        
        # Para cada franquia, calcular o saldo
        resultado = []
        for franquia in franquias:
            pipeline = [
                {"$match": {"franquia_id": franquia["id"]}},
                {"$group": {
                    "_id": None,
                    "entradas": {"$sum": {"$cond": [{"$eq": ["$tipo", "entrada"]}, "$valor", 0]}},
                    "saidas": {"$sum": {"$cond": [{"$eq": ["$tipo", "saida"]}, "$valor", 0]}}
                }}
            ]
            
            saldo_result = await db.movimentacoes_bolsao.aggregate(pipeline).to_list(1)
            
            saldo = 0
            if saldo_result:
                saldo = saldo_result[0].get("entradas", 0) - saldo_result[0].get("saidas", 0)
            
            resultado.append({
                "id": franquia["id"],
                "nome": franquia["nome"],
                "slug": franquia["slug"],
                "cor_primaria": franquia.get("cor_primaria", "#1a59ad"),
                "saldo": saldo
            })
        
        return {
            "success": True,
            "franquias_saldos": resultado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar saldos das franquias: {e}")
        return {"success": False, "error": str(e), "franquias_saldos": []}


@api_router.get("/admin/franquias/taxas")
async def get_taxas_configuradas(current_user: dict = Depends(get_current_user)):
    """
    Retorna as taxas configuradas para as franquias.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Buscar configuração de taxas (ou usar padrão)
        config = await db.config_taxas.find_one({"tipo": "global"}, {"_id": 0})
        
        if not config:
            config = {
                "tipo": "global",
                "taxa_pix": 0.5,  # 0.5%
                "taxa_cartao": 2.5,  # 2.5%
                "taxa_boleto": 3.50,  # R$ 3,50
                "repasse_franquia": 80,  # 80%
                "taxa_plataforma": 20  # 20%
            }
        
        return {
            "success": True,
            "taxas": config
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar taxas: {e}")
        return {"success": False, "error": str(e)}


@api_router.post("/admin/franquias/taxas")
async def atualizar_taxas(
    taxas: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza as taxas globais das franquias.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') == 'labelview_master'
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Atualizar ou inserir configuração
        await db.config_taxas.update_one(
            {"tipo": "global"},
            {"$set": {
                "tipo": "global",
                "taxa_pix": float(taxas.get("taxa_pix", 0.5)),
                "taxa_cartao": float(taxas.get("taxa_cartao", 2.5)),
                "taxa_boleto": float(taxas.get("taxa_boleto", 3.50)),
                "repasse_franquia": float(taxas.get("repasse_franquia", 80)),
                "taxa_plataforma": float(taxas.get("taxa_plataforma", 20)),
                "atualizado_em": datetime.now(timezone.utc),
                "atualizado_por": current_user.get("id")
            }},
            upsert=True
        )
        
        logger.info(f"✅ Taxas atualizadas por {current_user.get('email')}")
        
        return {
            "success": True,
            "message": "Taxas atualizadas com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao atualizar taxas: {e}")
        return {"success": False, "error": str(e)}


@api_router.get("/admin/franquias/taxas-personalizadas")
async def get_taxas_personalizadas(current_user: dict = Depends(get_current_user)):
    """
    Retorna todas as taxas personalizadas por franquia.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') in ['labelview_master', 'master']
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        # Buscar taxas personalizadas
        taxas = await db.taxas_personalizadas.find({}, {"_id": 0}).to_list(100)
        
        return {
            "success": True,
            "taxas_personalizadas": taxas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar taxas personalizadas: {e}")
        return {"success": False, "error": str(e), "taxas_personalizadas": []}


@api_router.post("/admin/franquias/taxas-personalizadas")
async def criar_taxa_personalizada(
    dados: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria ou atualiza taxa personalizada para uma franquia específica.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') in ['labelview_master', 'master']
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        franquia_id = dados.get("franquia_id")
        if not franquia_id:
            return {"success": False, "error": "ID da franquia é obrigatório"}
        
        # Buscar dados da franquia
        franquia = await db.franquias.find_one({"id": franquia_id}, {"_id": 0, "nome": 1})
        if not franquia:
            return {"success": False, "error": "Franquia não encontrada"}
        
        # Buscar taxas globais para usar como fallback
        config_global = await db.config_taxas.find_one({"tipo": "global"}, {"_id": 0})
        if not config_global:
            config_global = {
                "taxa_pix": 0.5,
                "taxa_cartao": 2.5,
                "taxa_boleto": 3.50,
                "repasse_franquia": 80,
                "taxa_plataforma": 20
            }
        
        # Criar documento de taxa personalizada
        taxa_personalizada = {
            "franquia_id": franquia_id,
            "franquia_nome": franquia.get("nome"),
            "taxa_pix": float(dados.get("taxa_pix") or config_global.get("taxa_pix", 0.5)),
            "taxa_cartao": float(dados.get("taxa_cartao") or config_global.get("taxa_cartao", 2.5)),
            "taxa_boleto": float(dados.get("taxa_boleto") or config_global.get("taxa_boleto", 3.50)),
            "repasse_franquia": float(dados.get("repasse_franquia") or config_global.get("repasse_franquia", 80)),
            "taxa_plataforma": float(dados.get("taxa_plataforma") or config_global.get("taxa_plataforma", 20)),
            "criado_em": datetime.now(timezone.utc),
            "criado_por": current_user.get("id")
        }
        
        # Upsert - atualiza se já existir
        await db.taxas_personalizadas.update_one(
            {"franquia_id": franquia_id},
            {"$set": taxa_personalizada},
            upsert=True
        )
        
        logger.info(f"✅ Taxa personalizada salva para franquia {franquia.get('nome')}")
        
        return {
            "success": True,
            "message": f"Taxa personalizada salva para {franquia.get('nome')}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar taxa personalizada: {e}")
        return {"success": False, "error": str(e)}


@api_router.delete("/admin/franquias/taxas-personalizadas/{franquia_id}")
async def excluir_taxa_personalizada(
    franquia_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove taxa personalizada de uma franquia.
    """
    try:
        # Verificar se é master
        is_master = current_user.get('is_labelview_master') or current_user.get('user_type') in ['labelview_master', 'master']
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado.")
        
        result = await db.taxas_personalizadas.delete_one({"franquia_id": franquia_id})
        
        if result.deleted_count > 0:
            logger.info(f"✅ Taxa personalizada removida para franquia {franquia_id}")
            return {"success": True, "message": "Taxa personalizada removida"}
        else:
            return {"success": False, "error": "Taxa não encontrada"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao excluir taxa personalizada: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# CADASTRO DE USUÁRIOS POR FRANQUIA
# ============================================

@api_router.post("/franquia/cadastro")
async def cadastro_franquia(dados: dict):
    """
    Endpoint para cadastro de novos usuários via franquia.
    Tipos suportados: clube_militar, militar, loja_parceira, prestador_servico
    """
    try:
        franquia_slug = dados.get("franquia_slug")
        franquia_id = dados.get("franquia_id")
        tipo_cadastro = dados.get("tipo_cadastro")
        user_type = dados.get("user_type")
        email = dados.get("email")
        password = dados.get("password")
        
        # Validar campos obrigatórios
        if not email or not password:
            return {"success": False, "message": "E-mail e senha são obrigatórios"}
        
        if not franquia_slug:
            return {"success": False, "message": "Franquia não identificada"}
        
        # Verificar se e-mail já existe
        existing_user = await db.users.find_one({"email": email.lower()})
        if existing_user:
            return {"success": False, "message": "Este e-mail já está cadastrado"}
        
        # Verificar se a franquia existe
        franquia = await db.franquias.find_one({"slug": franquia_slug, "ativo": True})
        if not franquia:
            return {"success": False, "message": "Franquia não encontrada ou inativa"}
        
        # Criar hash da senha
        password_hash = bcrypt.hash(password)
        
        # Montar dados do usuário baseado no tipo
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email.lower(),
            "password_hash": password_hash,
            "user_type": user_type,
            "franquia_slug": franquia_slug,
            "franquia_id": franquia_id,
            "tipo_cadastro": tipo_cadastro,
            "is_verified": False,  # Precisa de aprovação
            "is_blocked": False,
            "status": "pendente",  # pendente, aprovado, rejeitado
            "created_at": datetime.now(timezone.utc).isoformat(),
            "dados_cadastro": {}
        }
        
        # Mapear campos específicos por tipo
        if tipo_cadastro == "clube-militar":
            user_data["full_name"] = dados.get("nome_clube", "")
            user_data["company_name"] = dados.get("nome_clube", "")
            user_data["cnpj"] = dados.get("cnpj", "")
            user_data["dados_cadastro"] = {
                "nome_clube": dados.get("nome_clube"),
                "cnpj": dados.get("cnpj"),
                "responsavel": dados.get("responsavel"),
                "telefone": dados.get("telefone"),
                "endereco": dados.get("endereco"),
                "cidade": dados.get("cidade"),
                "estado": dados.get("estado")
            }
        
        elif tipo_cadastro == "militar":
            user_data["full_name"] = dados.get("nome_completo", "")
            user_data["cpf"] = dados.get("cpf", "")
            user_data["dados_cadastro"] = {
                "nome_completo": dados.get("nome_completo"),
                "cpf": dados.get("cpf"),
                "patente": dados.get("patente"),
                "forca": dados.get("forca"),
                "telefone": dados.get("telefone"),
                "cidade": dados.get("cidade"),
                "estado": dados.get("estado")
            }
        
        elif tipo_cadastro == "loja":
            user_data["full_name"] = dados.get("nome_loja", "")
            user_data["company_name"] = dados.get("nome_loja", "")
            user_data["cnpj"] = dados.get("cnpj", "")
            user_data["dados_cadastro"] = {
                "nome_loja": dados.get("nome_loja"),
                "cnpj": dados.get("cnpj"),
                "ramo_atividade": dados.get("ramo_atividade"),
                "responsavel": dados.get("responsavel"),
                "telefone": dados.get("telefone"),
                "endereco": dados.get("endereco"),
                "cidade": dados.get("cidade"),
                "estado": dados.get("estado")
            }
        
        elif tipo_cadastro == "prestador":
            user_data["full_name"] = dados.get("nome_empresa", "")
            user_data["company_name"] = dados.get("nome_empresa", "")
            user_data["cpf_cnpj"] = dados.get("cpf_cnpj", "")
            user_data["dados_cadastro"] = {
                "nome_empresa": dados.get("nome_empresa"),
                "cpf_cnpj": dados.get("cpf_cnpj"),
                "tipo_servico": dados.get("tipo_servico"),
                "responsavel": dados.get("responsavel"),
                "telefone": dados.get("telefone"),
                "endereco": dados.get("endereco"),
                "cidade": dados.get("cidade"),
                "estado": dados.get("estado")
            }
        
        # Salvar usuário
        await db.users.insert_one(user_data)
        
        logger.info(f"✅ Novo cadastro via franquia: {email} - Tipo: {tipo_cadastro} - Franquia: {franquia_slug}")
        
        return {
            "success": True,
            "message": "Cadastro realizado com sucesso! Aguarde a aprovação.",
            "user_id": user_data["id"]
        }
        
    except Exception as e:
        logger.error(f"Erro no cadastro via franquia: {e}")
        return {"success": False, "message": f"Erro ao realizar cadastro: {str(e)}"}


# Health check endpoint
@api_router.get("/test-cloudinary")
async def test_cloudinary_diagnostics():
    """
    Endpoint de diagnóstico detalhado para verificar a configuração do Cloudinary.
    Primeiro verifica as variáveis de ambiente, depois tenta um upload de teste.
    v2.38.10 - Com identificador de versão para debug de deploy
    """
    import base64
    import cloudinary
    
    DIAGNOSTICO_VERSION = "v2.38.10"
    
    # Passo 1: Verificar variáveis de ambiente diretamente
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = os.environ.get('CLOUDINARY_API_KEY')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
    
    env_status = {
        "CLOUDINARY_CLOUD_NAME": f"✅ {cloud_name[:4]}...{cloud_name[-4:]}" if cloud_name else "❌ NÃO CONFIGURADO",
        "CLOUDINARY_API_KEY": f"✅ {api_key[:4]}...{api_key[-4:]}" if api_key else "❌ NÃO CONFIGURADO",
        "CLOUDINARY_API_SECRET": f"✅ {api_secret[:4]}...{api_secret[-4:]}" if api_secret else "❌ NÃO CONFIGURADO"
    }
    
    # Se alguma variável não está configurada, retornar diagnóstico sem tentar upload
    if not cloud_name or not api_key or not api_secret:
        missing = [k for k, v in env_status.items() if "NÃO CONFIGURADO" in v]
        return {
            "success": False,
            "diagnostico_version": DIAGNOSTICO_VERSION,
            "step": "env_check",
            "message": f"Variáveis de ambiente faltando: {', '.join(missing)}",
            "env_status": env_status,
            "solution": "Configure as variáveis de ambiente do Cloudinary no servidor de produção"
        }
    
    # Passo 2: Reconfigurar Cloudinary com as variáveis atuais (para garantir)
    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
    except Exception as config_error:
        return {
            "success": False,
            "diagnostico_version": DIAGNOSTICO_VERSION,
            "step": "cloudinary_config",
            "message": f"Erro ao configurar Cloudinary SDK: {str(config_error)}",
            "env_status": env_status
        }
    
    # Passo 3: Tentar upload de teste diretamente com o SDK
    try:
        # Criar uma imagem PNG simples de 10x10 pixels
        test_image = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFklEQVR42mP8z8DwHwMFgHFUIBYAAEkqAukBZlAAAAAASUVORK5CYII=")
        
        logger.info(f"📤 [{DIAGNOSTICO_VERSION}] Testando upload para Cloudinary - tamanho: {len(test_image)} bytes")
        
        # Upload direto usando o SDK do Cloudinary (não usar a função wrapper)
        result = cloudinary.uploader.upload(
            test_image,
            folder="test",
            resource_type="image",
            public_id="test_diagnostico_direto",
            overwrite=True
        )
        
        url = result.get('secure_url')
        
        if url:
            return {
                "success": True,
                "diagnostico_version": DIAGNOSTICO_VERSION,
                "step": "upload_test",
                "message": "✅ Cloudinary está funcionando perfeitamente!",
                "test_url": url,
                "env_status": env_status,
                "cloudinary_response": {
                    "public_id": result.get('public_id'),
                    "format": result.get('format'),
                    "bytes": result.get('bytes')
                }
            }
        else:
            return {
                "success": False,
                "diagnostico_version": DIAGNOSTICO_VERSION,
                "step": "upload_test",
                "message": "Upload completou mas não retornou URL",
                "env_status": env_status,
                "cloudinary_response": result
            }
            
    except Exception as e:
        logger.error(f"❌ [{DIAGNOSTICO_VERSION}] Erro no teste do Cloudinary: {str(e)}", exc_info=True)
        return {
            "success": False,
            "diagnostico_version": DIAGNOSTICO_VERSION,
            "step": "upload_test",
            "message": f"Erro durante upload de teste: {str(e)}",
            "env_status": env_status,
            "error_details": str(e),
            "solution": "Verifique se as credenciais do Cloudinary estão corretas e se a conta está ativa"
        }


@api_router.get("/health")
@api_router.head("/health")
async def health_check():
    """Health check endpoint with MongoDB validation (with timeout)"""
    try:
        # Test MongoDB connection with timeout (2 segundos)
        await asyncio.wait_for(db.command('ping'), timeout=2.0)
        db_status = "connected"
    except asyncio.TimeoutError:
        logger.warning("Health check MongoDB timeout")
        db_status = "timeout"
    except Exception as e:
        logger.warning(f"Health check MongoDB error: {str(e)}")
        db_status = "unavailable"
    
    # Ler versão do arquivo VERSION.txt
    try:
        with open('/app/VERSION.txt', 'r') as f:
            version = f.readline().strip()
    except:
        version = "v2.38.41"
    
    # Sempre retorna healthy para não bloquear deployment
    # MongoDB sendo opcional durante startup
    return {
        "status": "healthy",
        "service": "Transmill API",
        "version": version,
        "build": "2026-02-01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }

# Simple health check (no DB dependency) for Kubernetes readiness probe
@app.get("/health")
@app.head("/health")
@app.get("/healthz")
@app.head("/healthz")
async def healthz():
    """Simple health check for Kubernetes probes - always returns OK"""
    # Ler versão do arquivo VERSION.txt
    try:
        with open('/app/VERSION.txt', 'r') as f:
            version = f.readline().strip()
    except:
        version = "v2.38.41"
    
    # Sempre retorna OK para não bloquear deploy
    # Responde em /health E /healthz
    return {
        "status": "ok", 
        "service": "transmill-api", 
        "version": version,
        "build": "2026-02-01",
        "ready": True
    }

# Readiness check com validação de DB (para usar após startup)
@app.get("/ready")
@app.head("/ready")
async def readiness_check():
    """Readiness check - only returns OK if MongoDB is actually connected"""
    try:
        await asyncio.wait_for(db.command('ping'), timeout=2.0)
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")

# === ENDPOINT ADMINISTRATIVO - FIX VÍNCULOS COMPLETO ===
        # ========== 1. CORRIGIR UNIDADES ==========
        logger.info("📋 1/4: Corrigindo UNIDADES...")
        usuarios_unidade = await db.users.find({'user_type': 'labelview_unidade'}).to_list(length=1000)
        resultado['unidades']['total'] = len(usuarios_unidade)
        
        logger.info(f"🔍 Encontrados {len(usuarios_unidade)} usuários tipo unidade")
        
        corrigidos = 0
        erros = []
        
        for user in usuarios_unidade:
            try:
                user_id = user.get('id')
                user_email = user.get('email')
                unidade_id_atual = user.get('unidade_id')
                
                logger.info(f"🔍 Processando unidade: {user_email} | unidade_id atual: {unidade_id_atual}")
                
                # FORÇAR CORREÇÃO: Setar unidade_id como próprio ID se não tiver ou se estiver diferente
                if not unidade_id_atual or unidade_id_atual != user_id:
                    logger.info(f"🔧 Unidade {user_email} precisa correção (atual: {unidade_id_atual}, deveria ser: {user_id})")
                
                # Buscar unidade correspondente - BUSCA NA COLEÇÃO USERS
                # IMPORTANTE: Unidades são salvas como usuários com user_type='labelview_unidade'
                unidade = None
                
                # 1. Buscar por email exato na coleção users
                unidade = await db.users.find_one({
                    'email': user_email,
                    'user_type': {'$ne': 'labelview_unidade'}  # Não deve ser o próprio usuário
                })
                
                # Se não encontrar, buscar qualquer registro com dados de unidade
                if not unidade:
                    # Buscar registros que tenham campos de unidade (nome_fantasia, cnpj, etc)
                    unidade = await db.users.find_one({
                        'nome_fantasia': {'$exists': True},
                        'cnpj': {'$exists': True},
                        'email': user_email
                    })
                    if unidade:
                        logger.info(f"✅ Unidade encontrada por EMAIL com dados completos: {user_email}")
                
                # 2. Se não encontrar, buscar por email em registros com nome_fantasia
                if not unidade:
                    unidades_todas = await db.users.find({
                        'nome_fantasia': {'$exists': True}
                    }).to_list(length=1000)
                    
                    for u in unidades_todas:
                        if u.get('email') == user_email:
                            unidade = u
                            logger.info(f"✅ Unidade encontrada na coleção users: {u.get('nome_fantasia')}")
                            break
                
                # 3. Buscar por nome similar (caso o usuário tenha o mesmo nome)
                if not unidade:
                    user_name = user.get('full_name', '').lower()
                    if user_name:
                        unidades_todas = await db.users.find({
                            'nome_fantasia': {'$exists': True}
                        }).to_list(length=1000)
                        
                        for u in unidades_todas:
                            unidade_nome = u.get('nome_fantasia', '').lower()
                            razao_social = u.get('razao_social', '').lower()
                            # Comparação similar
                            if (unidade_nome and (user_name in unidade_nome or unidade_nome in user_name or
                                razao_social and (user_name in razao_social or razao_social in user_name))):
                                unidade = u
                                logger.info(f"✅ Unidade encontrada por NOME similar: {u.get('nome_fantasia')}")
                                break
                
                if not unidade:
                    # Listar unidades disponíveis para debug
                    todas = await db.users.find({'nome_fantasia': {'$exists': True}}).to_list(length=10)
                    unidades_disponiveis = [f"{u.get('nome_fantasia', 'Sem nome')} ({u.get('email', 'Sem email')})" for u in todas]
                    
                    erro_msg = (f"Unidade não encontrada para usuário {user_email}. "
                               f"Unidades disponíveis: {', '.join(unidades_disponiveis[:3]) if unidades_disponiveis else 'Nenhuma'}")
                    erros.append(erro_msg)
                    logger.warning(f"⚠️ {erro_msg}")
                    logger.info(f"📊 Total de registros com nome_fantasia: {len(todas)}")
                    continue
                
                unidade_id = unidade.get('id')
                
                # Atualizar usuário
                result = await db.users.update_one(
                    {'id': user_id},
                    {
                        '$set': {
                            'unidade_id': unidade_id,
                            'is_labelview_unidade': True,
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    corrigidos += 1
                    logger.info(f"✅ Corrigido: {user_email} → unidade_id: {unidade_id}")
                
            except Exception as e:
                erros.append(f"Erro ao processar {user.get('email')}: {str(e)}")
                logger.error(f"❌ Erro ao processar {user.get('email')}: {e}")
        
        # Salvar resultado de unidades
        resultado['unidades']['corrigidos'] = corrigidos
        resultado['unidades']['erros'] = erros
        
        # ========== 2. CORRIGIR REGIONAIS ==========
        logger.info("📋 2/4: Corrigindo REGIONAIS...")
        usuarios_regional = await db.users.find({'user_type': 'labelview_regional'}).to_list(length=1000)
        
        regionais_validos = []
        for reg in usuarios_regional:
            email = reg.get('email', '')
            if 'agitomil' in email.lower():
                logger.warning(f"🗑️ Ignorando regional com email antigo: {email}")
                resultado['regionais']['erros'].append(f"Regional {email} ignorado (email antigo agitomil)")
            else:
                regionais_validos.append(reg)
        
        resultado['regionais']['total'] = len(regionais_validos)
        
        for user in regionais_validos:
            try:
                user_id = user.get('id')
                user_email = user.get('email')
                
                # Se já tem unidade_id e regional_id, pular
                if user.get('unidade_id') and user.get('regional_id'):
                    continue
                
                # Buscar unidade pai do regional
                unidade_id_regional = user.get('unidade_id')
                
                # Se não tem unidade_id, tentar encontrar pela hierarquia
                if not unidade_id_regional:
                    # Buscar por referred_by ou created_by
                    criador_id = user.get('referred_by') or user.get('created_by')
                    if criador_id:
                        criador = await db.users.find_one({'id': criador_id})
                        if criador and criador.get('user_type') == 'labelview_unidade':
                            unidade_id_regional = criador.get('id')
                
                if unidade_id_regional:
                    # Atualizar regional
                    result = await db.users.update_one(
                        {'id': user_id},
                        {
                            '$set': {
                                'unidade_id': unidade_id_regional,
                                'regional_id': user_id,  # Regional_id é o próprio ID
                                'updated_at': datetime.utcnow()
                            }
                        }
                    )
                    
                    if result.modified_count > 0:
                        resultado['regionais']['corrigidos'] += 1
                        logger.info(f"✅ Regional corrigido: {user_email} → unidade_id: {unidade_id_regional}")
                else:
                    resultado['regionais']['erros'].append(f"Unidade pai não encontrada para regional {user_email}")
                    
            except Exception as e:
                resultado['regionais']['erros'].append(f"Erro ao processar regional {user.get('email')}: {str(e)}")
                logger.error(f"❌ Erro ao processar regional: {e}")
        
        # ========== 3. CORRIGIR CONSULTORES (LÓGICA SIMPLIFICADA) ==========
        logger.info("📋 3/4: Corrigindo CONSULTORES...")
        usuarios_consultor = await db.users.find({'user_type': 'labelview_consultor'}).to_list(length=1000)
        resultado['consultores']['total'] = len(usuarios_consultor)
        
        # Buscar todas as unidades disponíveis
        unidades_disponiveis = await db.users.find({'nome_fantasia': {'$exists': True}}).to_list(length=100)
        
        for user in usuarios_consultor:
            try:
                user_id = user.get('id')
                user_email = user.get('email')
                
                logger.info(f"🔍 Processando consultor: {user_email} | unidade_id: {user.get('unidade_id')} | consultor_id: {user.get('consultor_id')}")
                
                # FORÇAR CORREÇÃO se não tiver os campos necessários
                tem_unidade = user.get('unidade_id')
                tem_consultor_id = user.get('consultor_id') == user_id
                
                if tem_unidade and tem_consultor_id:
                    logger.info(f"✅ Consultor {user_email} já está correto")
                    continue
                    
                logger.info(f"🔧 Consultor {user_email} precisa correção")
                
                unidade_id_consultor = user.get('unidade_id')
                regional_id_consultor = user.get('regional_id')
                
                # MÉTODO 1: Buscar pela hierarquia (referred_by ou created_by)
                if not unidade_id_consultor:
                    criador_id = user.get('referred_by') or user.get('created_by')
                    if criador_id:
                        criador = await db.users.find_one({'id': criador_id})
                        if criador:
                            if criador.get('user_type') == 'labelview_regional':
                                unidade_id_consultor = criador.get('unidade_id')
                                regional_id_consultor = criador.get('id')
                                logger.info(f"📍 Consultor vinculado via Regional: {user_email}")
                            elif criador.get('user_type') == 'labelview_unidade' or criador.get('nome_fantasia'):
                                unidade_id_consultor = criador.get('id')
                                regional_id_consultor = None
                                logger.info(f"🏢 Consultor vinculado DIRETO com Unidade: {user_email}")
                
                # MÉTODO 2: Se ainda não tem, vincular com a PRIMEIRA unidade disponível
                if not unidade_id_consultor and len(unidades_disponiveis) > 0:
                    unidade = unidades_disponiveis[0]
                    unidade_id_consultor = unidade.get('id')
                    regional_id_consultor = None
                    logger.info(f"🔧 Consultor vinculado automaticamente com única unidade: {user_email} → {unidade.get('nome_fantasia')}")
                
                if unidade_id_consultor:
                    update_data = {
                        'unidade_id': unidade_id_consultor,
                        'consultor_id': user_id,
                        'updated_at': datetime.utcnow()
                    }
                    
                    if regional_id_consultor:
                        update_data['regional_id'] = regional_id_consultor
                    else:
                        update_data['regional_id'] = None
                    
                    result = await db.users.update_one(
                        {'id': user_id},
                        {'$set': update_data}
                    )
                    
                    if result.modified_count > 0:
                        resultado['consultores']['corrigidos'] += 1
                        logger.info(f"✅ Consultor corrigido: {user_email} → unidade: {unidade_id_consultor}")
                else:
                    resultado['consultores']['erros'].append(f"Nenhuma unidade disponível para vincular consultor {user_email}")
                    
            except Exception as e:
                resultado['consultores']['erros'].append(f"Erro ao processar consultor {user.get('email')}: {str(e)}")
                logger.error(f"❌ Erro ao processar consultor: {e}")
        
        # ========== 4. CORRIGIR CLIENTES ==========
        logger.info("📋 4/4: Corrigindo CLIENTES...")
        # Clientes são users normais que foram indicados por consultores
        usuarios_cliente = await db.users.find({
            'user_type': {'$nin': ['labelview_master', 'labelview_unidade', 'labelview_regional', 'labelview_consultor']},
            'referred_by': {'$exists': True, '$ne': None}
        }).to_list(length=1000)
        
        # LIMPAR CLIENTES COM EMAIL INVÁLIDO
        clientes_validos = []
        for cli in usuarios_cliente:
            email = cli.get('email', '')
            if 'agitomil' in email.lower() or '@demo.com' in email.lower():
                logger.warning(f"🗑️ Ignorando cliente teste/antigo: {email}")
                resultado['clientes']['erros'].append(f"Cliente {email} ignorado (email teste/antigo)")
            else:
                clientes_validos.append(cli)
        
        resultado['clientes']['total'] = len(clientes_validos)
        
        for user in clientes_validos:
            try:
                user_id = user.get('id')
                user_email = user.get('email')
                
                # Se já tem unidade_id, pular
                if user.get('unidade_id'):
                    continue
                
                # Buscar quem indicou (consultor)
                referred_by = user.get('referred_by')
                if referred_by:
                    consultor = await db.users.find_one({'id': referred_by})
                    if consultor:
                        # Herdar unidade_id do consultor
                        unidade_id_cliente = consultor.get('unidade_id')
                        
                        if unidade_id_cliente:
                            result = await db.users.update_one(
                                {'id': user_id},
                                {
                                    '$set': {
                                        'unidade_id': unidade_id_cliente,
                                        'updated_at': datetime.utcnow()
                                    }
                                }
                            )
                            
                            if result.modified_count > 0:
                                resultado['clientes']['corrigidos'] += 1
                                logger.info(f"✅ Cliente corrigido: {user_email} → unidade: {unidade_id_cliente}")
                        else:
                            resultado['clientes']['erros'].append(f"Consultor {consultor.get('email')} não tem unidade_id")
                    else:
                        resultado['clientes']['erros'].append(f"Consultor indicador não encontrado para {user_email}")
                    
            except Exception as e:
                resultado['clientes']['erros'].append(f"Erro ao processar cliente {user.get('email')}: {str(e)}")
                logger.error(f"❌ Erro ao processar cliente: {e}")
        
        # ========== RESUMO FINAL ==========
        total_corrigidos = (resultado['unidades']['corrigidos'] + 
                           resultado['regionais']['corrigidos'] + 
                           resultado['consultores']['corrigidos'] + 
                           resultado['clientes']['corrigidos'])
        
        total_erros = (len(resultado['unidades']['erros']) + 
                      len(resultado['regionais']['erros']) + 
                      len(resultado['consultores']['erros']) + 
                      len(resultado['clientes']['erros']))
        
        logger.info(f"✅ CORREÇÃO COMPLETA FINALIZADA!")
        logger.info(f"📊 Total corrigido: {total_corrigidos}")
        logger.info(f"⚠️ Total de erros: {total_erros}")
        
        return {
            'success': True,
            'message': 'Correção completa concluída',
            'total_corrigidos': total_corrigidos,
            'total_erros': total_erros,
            'detalhes': resultado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao corrigir vínculos: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# === ENDPOINT ANTIGO MANTIDO PARA COMPATIBILIDADE ===
@api_router.post("/admin/fix-unidade-user")
async def fix_unidade_user_legacy(current_user: dict = Depends(get_current_user)):
    """Endpoint legado - redireciona para fix-all-labelview-users"""
    return await fix_all_labelview_users(current_user)


@api_router.post("/admin/cleanup-invalid-users")
async def cleanup_invalid_users(current_user: dict = Depends(get_current_user)):
    """Limpar usuários inválidos/antigos (emails agitomil, transmill, demo.com)"""
    try:
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Apenas Master pode limpar dados")
        
        logger.info("🧹 Iniciando limpeza COMPLETA de usuários inválidos")
        
        deletados = []
        erros = []
        
        # Lista de domínios/padrões para deletar
        padroes_invalidos = [
            '@agitomil',
            '@transmill', 
            '@demo.com',
            'agitomil.com',
            'transmill.com'
        ]
        
        logger.info(f"🔍 Buscando usuários com padrões: {padroes_invalidos}")
        
        # Buscar todos os usuários que correspondem aos padrões
        for padrao in padroes_invalidos:
            usuarios_encontrados = await db.users.find({
                'email': {'$regex': padrao, '$options': 'i'}
            }).to_list(length=1000)
            
            logger.info(f"📊 Encontrados {len(usuarios_encontrados)} usuários com '{padrao}'")
            
            for user in usuarios_encontrados:
                try:
                    email = user.get('email')
                    user_type = user.get('user_type', 'indefinido')
                    user_id = user.get('id')
                    
                    # Não deletar usuários Master
                    if user_type in ['labelview_master', 'master']:
                        logger.warning(f"⚠️ Pulando usuário Master: {email}")
                        continue
                    
                    result = await db.users.delete_one({'id': user_id})
                    
                    if result.deleted_count > 0:
                        deletados.append(f"{email} ({user_type})")
                        logger.info(f"🗑️ DELETADO: {email} ({user_type})")
                    
                except Exception as e:
                    erro_msg = f"Erro ao deletar {user.get('email')}: {str(e)}"
                    erros.append(erro_msg)
                    logger.error(f"❌ {erro_msg}")
        
        # Remover duplicatas da lista de deletados
        deletados = list(set(deletados))
        
        logger.info(f"✅ Limpeza concluída! Total deletado: {len(deletados)}")
        
        return {
            'success': True,
            'message': 'Limpeza concluída',
            'deletados': deletados,
            'total_deletados': len(deletados),
            'erros': erros
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro na limpeza: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/force-fix-consultor/{consultor_id}")
async def force_fix_consultor(
    consultor_id: str,
    unidade_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Forçar correção de consultor específico vinculando com unidade manualmente"""
    try:
        if not current_user.get('is_labelview_master') and current_user.get('user_type') != 'labelview_master':
            raise HTTPException(status_code=403, detail="Apenas Master")
        
        # Atualizar consultor
        result = await db.users.update_one(
            {'id': consultor_id, 'user_type': 'labelview_consultor'},
            {
                '$set': {
                    'unidade_id': unidade_id,
                    'consultor_id': consultor_id,
                    'regional_id': None,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Consultor {consultor_id} vinculado forçadamente com unidade {unidade_id}")
            return {'success': True, 'message': 'Consultor corrigido'}
        else:
            raise HTTPException(status_code=404, detail="Consultor não encontrado")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# === PRESTADORES DE SERVIÇO - ENDPOINTS PÚBLICOS ===
@api_router.get("/public/service-provider-types")
async def get_public_service_provider_types():
    """Listar tipos de prestadores ativos (endpoint público para registro)"""
    try:
        types = await db.service_provider_types.find({"is_active": True}).to_list(1000)
        
        for type_doc in types:
            if "_id" in type_doc:
                del type_doc["_id"]
            
        return {
            "success": True,
            "data": {
                "types": types,
                "total": len(types)
            }
        }
    except Exception as e:
        logger.error(f"Erro ao buscar tipos de prestadores públicos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# MASTER: service-provider-types endpoints migrados para routes/master.py

# === PRESTADORES DE SERVIÇO - CADASTRO E GESTÃO ===
@api_router.post("/auth/register-service-provider")
async def register_service_provider(provider_data: ServiceProviderRegister):
    """Cadastro de prestador de serviço"""
    try:
        # Verificar se email já existe
        existing_user = await db.users.find_one({"email": provider_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Verificar se documento já existe
        existing_provider = await db.service_providers.find_one({"document": provider_data.document})
        if existing_provider:
            raise HTTPException(status_code=400, detail="Documento já cadastrado")
        
        # Validar tipo de prestador existe
        provider_type = await db.service_provider_types.find_one({"id": provider_data.provider_type_id, "is_active": True})
        if not provider_type:
            raise HTTPException(status_code=400, detail="Tipo de prestador inválido ou inativo")
        
        # Validar documento
        if provider_data.document_type == "cpf" and not validate_cpf(provider_data.document):
            raise HTTPException(status_code=400, detail="CPF inválido")
        
        # Verificar código de indicação
        referrer_id = None
        if hasattr(provider_data, 'referral_code_used') and provider_data.referral_code_used:
            referrer = await db.users.find_one({"referral_code": provider_data.referral_code_used})
            if referrer:
                referrer_id = referrer["id"]
                # Atualizar contador de indicações do referrer
                await db.users.update_one(
                    {"id": referrer_id},
                    {"$inc": {"referral_count": 1}}
                )
        
        # Criar usuário base
        user_id = str(uuid.uuid4())
        password_hash = bcrypt.hash(provider_data.password)
        
        # Gerar código de indicação único para o novo usuário
        referral_code = generate_referral_code()
        while await db.users.find_one({"referral_code": referral_code}):
            referral_code = generate_referral_code()
        
        user_data = {
            "id": user_id,
            "full_name": provider_data.full_name,
            "email": provider_data.email,
            "password_hash": password_hash,
            "phone": provider_data.phone,
            "user_type": "service_provider",
            "balance": 0.0,
            "usdt_balance": 0.0,
            "cashback_balance": 0.0,
            "referral_code": referral_code,
            "referred_by": referrer_id,
            "referral_count": 0,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Criar perfil de prestador
        provider_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "fantasy_name": provider_data.fantasy_name,
            "document": provider_data.document,
            "document_type": provider_data.document_type,
            "provider_type_id": provider_data.provider_type_id,
            "provider_type_name": provider_type["name"],
            "address": {
                "street": provider_data.address_street,
                "number": provider_data.address_number,
                "complement": provider_data.address_complement,
                "neighborhood": provider_data.address_neighborhood,
                "city": provider_data.address_city,
                "state": provider_data.address_state,
                "zipcode": provider_data.address_zipcode
            },
            "profile_description": provider_data.profile_description,
            "working_hours": provider_data.working_hours,
            "accepts_emergency": provider_data.accepts_emergency,
            "cashback_rate": provider_data.cashback_rate,
            "rating_average": 0.0,
            "rating_count": 0,
            "status": "pending_approval",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Inserir no banco
        await db.users.insert_one(user_data)
        await db.service_providers.insert_one(provider_profile)
        
        return {
            "success": True,
            "message": "Prestador de serviço cadastrado com sucesso! Aguarde aprovação.",
            "data": {
                "user_id": user_id,
                "provider_id": provider_profile["id"],
                "status": "pending_approval"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no cadastro de prestador: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === PRESTADOR - PERFIL ===
@api_router.get("/prestador/profile")
async def get_prestador_profile(current_user: User = Depends(get_current_user)):
    """Obter perfil do prestador autenticado"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Buscar perfil do prestador
        provider = await db.service_providers.find_one({"user_id": current_user.id})
        if not provider:
            raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
        
        # Buscar tipo de prestador
        provider_type = await db.service_provider_types.find_one({"id": provider["provider_type_id"]})
        
        return {
            "success": True,
            "data": {
                "user_id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone,
                "balance": current_user.balance,
                "provider_id": provider["id"],
                "fantasy_name": provider.get("fantasy_name", ""),
                "document": provider["document"],
                "document_type": provider["document_type"],
                "provider_type": {
                    "id": provider["provider_type_id"],
                    "name": provider.get("provider_type_name", provider_type.get("name", "") if provider_type else ""),
                    "category": provider_type.get("category", "") if provider_type else ""
                },
                "address": provider.get("address", {}),
                "profile_description": provider.get("profile_description", ""),
                "working_hours": provider.get("working_hours", ""),
                "accepts_emergency": provider.get("accepts_emergency", False),
                "cashback_rate": provider.get("cashback_rate", 0.05),
                "google_maps_url": provider.get("google_maps_url", ""),
                "rating_average": provider.get("rating_average", 0.0),
                "rating_count": provider.get("rating_count", 0),
                "status": provider.get("status", "active"),
                "profile_image": current_user.profile_image
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar perfil de prestador: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.put("/prestador/profile")
async def update_prestador_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Atualizar perfil do prestador autenticado"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Atualizar dados do usuário
        user_updates = {}
        if "full_name" in profile_data:
            user_updates["full_name"] = profile_data["full_name"]
        if "phone" in profile_data:
            user_updates["phone"] = profile_data["phone"]
        
        if user_updates:
            await db.users.update_one(
                {"id": current_user.id},
                {"$set": user_updates}
            )
        
        # Atualizar dados do prestador
        provider_updates = {}
        if "fantasy_name" in profile_data:
            provider_updates["fantasy_name"] = profile_data["fantasy_name"]
        if "profile_description" in profile_data:
            provider_updates["profile_description"] = profile_data["profile_description"]
        if "working_hours" in profile_data:
            provider_updates["working_hours"] = profile_data["working_hours"]
        if "accepts_emergency" in profile_data:
            provider_updates["accepts_emergency"] = profile_data["accepts_emergency"]
        if "address" in profile_data:
            provider_updates["address"] = profile_data["address"]
        if "cashback_rate" in profile_data:
            # Validar cashback entre 0.01 e 0.10 (1% a 10%)
            cashback = float(profile_data["cashback_rate"])
            if 0.01 <= cashback <= 0.10:
                provider_updates["cashback_rate"] = cashback
        if "google_maps_url" in profile_data:
            provider_updates["google_maps_url"] = profile_data["google_maps_url"]
        
        if provider_updates:
            await db.service_providers.update_one(
                {"user_id": current_user.id},
                {"$set": provider_updates}
            )
        
        return {
            "success": True,
            "message": "Perfil atualizado com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil de prestador: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === SERVIÇOS - CRUD (PRESTADOR) ===
@api_router.post("/prestador/servicos")
async def create_service(
    service_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Criar novo serviço (prestador autenticado)"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Buscar perfil do prestador
        provider = await db.service_providers.find_one({"user_id": current_user.id})
        if not provider:
            raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
        
        service_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        service = {
            "id": service_id,
            "provider_id": provider["id"],
            "user_id": current_user.id,
            "name": service_data["name"],
            "description": service_data.get("description", ""),
            "price": float(service_data["price"]),
            "estimated_duration": int(service_data.get("estimated_duration", 60)),
            "category": service_data.get("category", "geral"),
            "is_available": service_data.get("is_available", True),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.services.insert_one(service)
        
        return {
            "success": True,
            "message": "Serviço criado com sucesso",
            "data": {
                "id": service_id,
                "name": service["name"],
                "price": service["price"],
                "estimated_duration": service["estimated_duration"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/prestador/servicos")
async def get_my_services(current_user: User = Depends(get_current_user)):
    """Listar serviços do prestador autenticado"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        services = await db.services.find({"user_id": current_user.id}).to_list(100)
        
        return {
            "success": True,
            "data": [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "description": s.get("description", ""),
                    "price": s["price"],
                    "estimated_duration": s.get("estimated_duration", 60),
                    "category": s.get("category", "geral"),
                    "is_available": s.get("is_available", True),
                    "created_at": s.get("created_at")
                }
                for s in services
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar serviços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.put("/prestador/servicos/{service_id}")
async def update_service(
    service_id: str,
    service_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Atualizar serviço existente"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Verificar se serviço pertence ao prestador
        service = await db.services.find_one({"id": service_id, "user_id": current_user.id})
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        updates = {}
        if "name" in service_data:
            updates["name"] = service_data["name"]
        if "description" in service_data:
            updates["description"] = service_data["description"]
        if "price" in service_data:
            updates["price"] = float(service_data["price"])
        if "estimated_duration" in service_data:
            updates["estimated_duration"] = int(service_data["estimated_duration"])
        if "category" in service_data:
            updates["category"] = service_data["category"]
        if "is_available" in service_data:
            updates["is_available"] = service_data["is_available"]
        
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.services.update_one(
            {"id": service_id},
            {"$set": updates}
        )
        
        return {
            "success": True,
            "message": "Serviço atualizado com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.delete("/prestador/servicos/{service_id}")
async def delete_service(
    service_id: str,
    current_user: User = Depends(get_current_user)
):
    """Desativar/deletar serviço"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Verificar se serviço pertence ao prestador
        service = await db.services.find_one({"id": service_id, "user_id": current_user.id})
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        # Desativar em vez de deletar
        await db.services.update_one(
            {"id": service_id},
            {"$set": {"is_available": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "success": True,
            "message": "Serviço desativado com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === SERVIÇOS - BUSCA PÚBLICA (CLIENTES) ===
@api_router.get("/servicos/search")
async def search_services(
    query: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None
):
    """Buscar serviços disponíveis (endpoint público)"""
    try:
        # Construir filtro de busca
        filter_query = {"is_available": True}
        
        if query:
            filter_query["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        
        if category:
            filter_query["category"] = category
        
        # Buscar serviços
        services = await db.services.find(filter_query).to_list(100)
        
        # Enriquecer com dados do prestador
        result = []
        for service in services:
            provider = await db.service_providers.find_one({"id": service["provider_id"]})
            if not provider:
                continue
            
            # Filtrar por localização se necessário
            if city and provider.get("address", {}).get("city", "").lower() != city.lower():
                continue
            if state and provider.get("address", {}).get("state", "").lower() != state.lower():
                continue
            
            user = await db.users.find_one({"id": provider["user_id"]})
            
            result.append({
                "id": service["id"],
                "name": service["name"],
                "description": service.get("description", ""),
                "price": service["price"],
                "estimated_duration": service.get("estimated_duration", 60),
                "category": service.get("category", "geral"),
                "provider": {
                    "id": provider["id"],
                    "name": provider.get("fantasy_name") or user.get("full_name", ""),
                    "rating_average": provider.get("rating_average", 0.0),
                    "rating_count": provider.get("rating_count", 0),
                    "address": {
                        "city": provider.get("address", {}).get("city", ""),
                        "state": provider.get("address", {}).get("state", ""),
                        "neighborhood": provider.get("address", {}).get("neighborhood", "")
                    },
                    "profile_image": user.get("profile_image")
                }
            })
        
        return {
            "success": True,
            "data": result,
            "count": len(result)
        }
    except Exception as e:
        logger.error(f"Erro ao buscar serviços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/servicos")
async def get_servicos(
    lat: Optional[float] = None,
    lng: Optional[float] = None, 
    radius: Optional[float] = 50.0,
    category: Optional[str] = None,
    query: Optional[str] = None,
    franquia_slug: Optional[str] = None,
    limit: Optional[int] = 100,
    current_user = Depends(get_current_user)
):
    """
    Busca serviços com suporte a geolocalização e white-label
    - lat, lng: Coordenadas do usuário para calcular distância
    - radius: Raio de busca em km (padrão: 50km)
    - category: Filtro por categoria de serviço
    - query: Busca por texto (nome ou descrição)
    - franquia_slug: Filtro por franquia (white-label)
    - limit: Limite de resultados (padrão: 100)
    """
    try:
        # Construir filtro de busca
        filter_query = {"is_available": True}
        
        # Aplicar filtro de franquia (white-label)
        franquia_filter = await get_franquia_filter(current_user)
        if franquia_filter:
            filter_query.update(franquia_filter)
        
        # Override se franquia_slug foi passado explicitamente
        if franquia_slug:
            filter_query["franquia_slug"] = franquia_slug
        
        if query:
            filter_query["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        
        if category:
            filter_query["category"] = {"$regex": category, "$options": "i"}
        
        # Obter contexto para branding
        context = await get_franquia_context(current_user)
        
        # Buscar serviços
        services_cursor = db.services.find(filter_query).limit(limit)
        services = await services_cursor.to_list(limit)
        
        # Processar resultados e calcular distâncias
        results = []
        for service in services:
            # Buscar dados do prestador
            prestador = await db.users.find_one({"id": service["user_id"]})
            if not prestador:
                continue
            
            # Buscar perfil do prestador para obter dados completos
            provider_profile = await db.service_providers.find_one({"user_id": prestador["id"]})
            if not provider_profile:
                continue
            
            # Obter coordenadas do prestador (do perfil ou padrão)
            prestador_lat = provider_profile.get("address", {}).get("latitude")
            prestador_lng = provider_profile.get("address", {}).get("longitude")
            
            # Se o prestador não tem coordenadas, usar coordenadas padrão
            if not prestador_lat or not prestador_lng:
                address = provider_profile.get("address", {})
                city = address.get("city", "")
                state = address.get("state", "")
                if city and state:
                    prestador_lat, prestador_lng = get_default_coordinates(city, state)
                else:
                    prestador_lat, prestador_lng = -23.5505, -46.6333
            
            # Calcular distância se coordenadas do usuário foram fornecidas
            distance = None
            if lat is not None and lng is not None:
                distance = calculate_distance(lat, lng, prestador_lat, prestador_lng)
                
                # Filtrar por raio se especificado
                if radius and distance > radius:
                    continue
            
            service_data = {
                "id": service["id"],
                "name": service["name"],
                "description": service.get("description", ""),
                "price": service.get("price", 0),
                "estimated_duration": service.get("estimated_duration", 60),
                "category": service.get("category", "Geral"),
                "cashback_rate": service.get("cashback_rate", 8.0),
                "rating": service.get("rating_average", 4.5),
                "available": service.get("is_available", True),
                "tags": [service.get("category", "Serviço"), "Cashback"],
                "provider": {
                    "id": prestador["id"],
                    "name": provider_profile.get("fantasy_name", prestador.get("full_name", "")),
                    "full_name": prestador.get("full_name", ""),
                    "company_name": provider_profile.get("fantasy_name", ""),
                    "service_provider_type": provider_profile.get("provider_type_name", ""),
                    "rating": provider_profile.get("rating_average", 4.5),
                    "rating_count": provider_profile.get("rating_count", 0),
                    "whatsapp": prestador.get("whatsapp", ""),
                    "profile_image": prestador.get("profile_image", ""),
                    "address": f"{provider_profile.get('address', {}).get('street', '')}, {provider_profile.get('address', {}).get('number', '')}",
                    "city": provider_profile.get("address", {}).get("city", ""),
                    "state": provider_profile.get("address", {}).get("state", ""),
                    "neighborhood": provider_profile.get("address", {}).get("neighborhood", ""),
                    "latitude": prestador_lat,
                    "longitude": prestador_lng,
                    "distance": distance
                }
            }
            
            results.append(service_data)
        
        # Ordenar por distância se coordenadas foram fornecidas
        if lat is not None and lng is not None:
            results.sort(key=lambda x: x["provider"]["distance"] if x["provider"]["distance"] is not None else 999)
        
        return {
            "success": True,
            "franquia_nome": context["franquia_nome"],
            "service_name": f"{context['franquia_nome']} Serviços",
            "services": results,
            "total": len(results),
            "user_location": {
                "latitude": lat,
                "longitude": lng
            } if lat and lng else None
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar serviços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar serviços: {str(e)}")

@api_router.get("/servicos/{service_id}")
async def get_service_details(service_id: str):
    """Obter detalhes de um serviço específico"""
    try:
        service = await db.services.find_one({"id": service_id})
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        provider = await db.service_providers.find_one({"id": service["provider_id"]})
        if not provider:
            raise HTTPException(status_code=404, detail="Prestador não encontrado")
        
        user = await db.users.find_one({"id": provider["user_id"]})
        
        return {
            "success": True,
            "data": {
                "id": service["id"],
                "name": service["name"],
                "description": service.get("description", ""),
                "price": service["price"],
                "estimated_duration": service.get("estimated_duration", 60),
                "category": service.get("category", "geral"),
                "is_available": service.get("is_available", True),
                "provider": {
                    "id": provider["id"],
                    "name": provider.get("fantasy_name") or user.get("full_name", ""),
                    "profile_description": provider.get("profile_description", ""),
                    "rating_average": provider.get("rating_average", 0.0),
                    "rating_count": provider.get("rating_count", 0),
                    "address": provider.get("address", {}),
                    "working_hours": provider.get("working_hours", ""),
                    "accepts_emergency": provider.get("accepts_emergency", False),
                    "profile_image": user.get("profile_image")
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === AGENDAMENTOS - CLIENTE ===
@api_router.post("/agendamentos")
async def create_appointment(
    appointment_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Criar novo agendamento (cliente)"""
    try:
        # Verificar se serviço existe
        service = await db.services.find_one({"id": appointment_data["service_id"]})
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        if not service.get("is_available", True):
            raise HTTPException(status_code=400, detail="Serviço não disponível")
        
        # Buscar prestador
        provider = await db.service_providers.find_one({"id": service["provider_id"]})
        if not provider:
            raise HTTPException(status_code=404, detail="Prestador não encontrado")
        
        appointment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Parse data/hora do agendamento
        appointment_datetime = datetime.fromisoformat(appointment_data["appointment_datetime"].replace('Z', '+00:00'))
        
        appointment = {
            "id": appointment_id,
            "client_id": current_user.id,
            "client_name": current_user.full_name,
            "client_phone": current_user.phone,
            "client_email": current_user.email,
            "provider_id": provider["id"],
            "provider_user_id": provider["user_id"],
            "service_id": service["id"],
            "service_name": service["name"],
            "appointment_datetime": appointment_datetime.isoformat(),
            "estimated_duration": service.get("estimated_duration", 60),
            "status": "pending",
            "total_value": float(service["price"]),
            "client_notes": appointment_data.get("client_notes", ""),
            "provider_notes": "",
            "transaction_id": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.appointments.insert_one(appointment)
        
        return {
            "success": True,
            "message": "Agendamento criado com sucesso! Aguarde confirmação do prestador.",
            "data": {
                "id": appointment_id,
                "service_name": service["name"],
                "provider_name": provider.get("fantasy_name") or provider.get("full_name", ""),
                "appointment_datetime": appointment_datetime.isoformat(),
                "total_value": service["price"],
                "status": "pending"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/agendamentos/meus")
async def get_my_appointments(current_user: User = Depends(get_current_user)):
    """Listar agendamentos do cliente autenticado"""
    try:
        appointments = await db.appointments.find({"client_id": current_user.id}).sort("appointment_datetime", -1).to_list(100)
        
        result = []
        for apt in appointments:
            # Buscar dados do prestador
            provider = await db.service_providers.find_one({"id": apt["provider_id"]})
            provider_user = await db.users.find_one({"id": apt["provider_user_id"]}) if provider else None
            
            result.append({
                "id": apt["id"],
                "service_name": apt.get("service_name", ""),
                "provider_name": provider.get("fantasy_name") if provider else "N/A",
                "appointment_datetime": apt["appointment_datetime"],
                "estimated_duration": apt.get("estimated_duration", 60),
                "status": apt["status"],
                "total_value": apt["total_value"],
                "client_notes": apt.get("client_notes", ""),
                "provider_notes": apt.get("provider_notes", ""),
                "provider_image": provider_user.get("profile_image") if provider_user else None,
                "created_at": apt.get("created_at")
            })
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Erro ao listar agendamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.put("/agendamentos/{appointment_id}/cancelar")
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancelar agendamento (cliente)"""
    try:
        # Verificar se agendamento pertence ao cliente
        appointment = await db.appointments.find_one({"id": appointment_id, "client_id": current_user.id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        if appointment["status"] in ["completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Agendamento não pode ser cancelado")
        
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Agendamento cancelado com sucesso"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao cancelar agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === AGENDAMENTOS - PRESTADOR ===
@api_router.get("/prestador/agendamentos")
async def get_provider_appointments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Listar agendamentos do prestador autenticado"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        filter_query = {"provider_user_id": current_user.id}
        if status:
            filter_query["status"] = status
        
        appointments = await db.appointments.find(filter_query).sort("appointment_datetime", 1).to_list(100)
        
        return {
            "success": True,
            "data": [
                {
                    "id": apt["id"],
                    "client_name": apt.get("client_name", ""),
                    "client_phone": apt.get("client_phone", ""),
                    "service_name": apt.get("service_name", ""),
                    "appointment_datetime": apt["appointment_datetime"],
                    "estimated_duration": apt.get("estimated_duration", 60),
                    "status": apt["status"],
                    "total_value": apt["total_value"],
                    "client_notes": apt.get("client_notes", ""),
                    "provider_notes": apt.get("provider_notes", ""),
                    "created_at": apt.get("created_at")
                }
                for apt in appointments
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar agendamentos do prestador: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.put("/prestador/agendamentos/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Atualizar status do agendamento (prestador)"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Verificar se agendamento pertence ao prestador
        appointment = await db.appointments.find_one({"id": appointment_id, "provider_user_id": current_user.id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        new_status = status_data.get("status")
        valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
        
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Status inválido")
        
        updates = {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if "provider_notes" in status_data:
            updates["provider_notes"] = status_data["provider_notes"]
        
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": updates}
        )
        
        return {
            "success": True,
            "message": f"Status atualizado para: {new_status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status do agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.post("/prestador/agendamentos/{appointment_id}/concluir")
async def complete_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Marcar agendamento como concluído e gerar QR Code para pagamento"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Verificar se agendamento pertence ao prestador
        appointment = await db.appointments.find_one({"id": appointment_id, "provider_user_id": current_user.id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        if appointment["status"] == "completed":
            raise HTTPException(status_code=400, detail="Agendamento já foi concluído")
        
        # Atualizar status para concluído
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {
                "status": "completed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Buscar dados do prestador para cashback
        provider = await db.service_providers.find_one({"user_id": current_user.id})
        if not provider:
            raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
        
        # Gerar QR Code para pagamento (similar ao sistema de lojistas)
        qr_code_data = f"AGITOCASH_PRESTADOR_{provider['id']}_{appointment['id']}_{appointment['total_value']}"
        digital_code = generate_digital_code(qr_code_data)
        
        # Salvar código digital
        await db.digital_codes.insert_one({
            "digital_code": digital_code,
            "qr_code": qr_code_data,
            "provider_id": provider["id"],
            "provider_user_id": current_user.id,
            "appointment_id": appointment_id,
            "amount": appointment["total_value"],
            "cashback_rate": provider.get("cashback_rate", 0.05),  # 5% padrão
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
            "used": False
        })
        
        return {
            "success": True,
            "message": "Agendamento concluído! QR Code gerado para pagamento.",
            "data": {
                "appointment_id": appointment_id,
                "qr_code": qr_code_data,
                "digital_code": digital_code,
                "amount": appointment["total_value"],
                "cashback_rate": provider.get("cashback_rate", 0.05),
                "provider_name": provider.get("fantasy_name") or current_user.full_name,
                "service_name": appointment.get("service_name", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao concluir agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === POS - GERAR QR CODE ===
@api_router.post("/prestador/pos/generate")
async def generate_pos_qrcode(
    payment_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Gerar QR Code para cobrança de serviço via POS"""
    try:
        if current_user.user_type != "service_provider":
            raise HTTPException(status_code=403, detail="Acesso permitido apenas para prestadores")
        
        # Buscar dados do prestador
        provider = await db.service_providers.find_one({"user_id": current_user.id})
        if not provider:
            raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
        
        amount = float(payment_data.get("amount", 0))
        description = payment_data.get("description", "Pagamento de serviço")
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Valor inválido")
        
        # Gerar QR Code
        qr_code_data = f"AGITOCASH_PRESTADOR_POS_{provider['id']}_{current_user.id}_{amount}_{datetime.now(timezone.utc).timestamp()}"
        digital_code = generate_digital_code(qr_code_data)
        
        # Salvar código digital
        await db.digital_codes.insert_one({
            "digital_code": digital_code,
            "qr_code": qr_code_data,
            "provider_id": provider["id"],
            "provider_user_id": current_user.id,
            "amount": amount,
            "description": description,
            "cashback_rate": provider.get("cashback_rate", 0.05),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
            "used": False,
            "type": "pos"
        })
        
        return {
            "success": True,
            "message": "QR Code gerado com sucesso!",
            "data": {
                "qr_code": qr_code_data,
                "digital_code": digital_code,
                "amount": amount,
                "description": description,
                "cashback_rate": provider.get("cashback_rate", 0.05),
                "provider_name": provider.get("fantasy_name") or current_user.full_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar QR Code POS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === PAGAMENTO DE AGENDAMENTO ===
@api_router.post("/agendamentos/{appointment_id}/pagamento")
async def process_appointment_payment(
    appointment_id: str,
    payment_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Processar pagamento de agendamento via QR Code/Código Digital"""
    try:
        # Buscar agendamento
        appointment = await db.appointments.find_one({"id": appointment_id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        if appointment["status"] != "completed":
            raise HTTPException(status_code=400, detail="Agendamento ainda não foi concluído pelo prestador")
        
        if appointment["transaction_id"]:
            raise HTTPException(status_code=400, detail="Agendamento já foi pago")
        
        # Validar código digital
        digital_code = payment_data.get("digital_code")
        if not digital_code:
            raise HTTPException(status_code=400, detail="Código digital é obrigatório")
        
        # Buscar e validar código
        code_doc = await db.digital_codes.find_one({
            "digital_code": format_digital_code(digital_code),
            "appointment_id": appointment_id,
            "used": False
        })
        
        if not code_doc:
            raise HTTPException(status_code=400, detail="Código inválido ou já utilizado")
        
        # Verificar expiração
        expires_at = datetime.fromisoformat(code_doc["expires_at"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Código expirado")
        
        # Verificar saldo do cliente
        if current_user.balance < appointment["total_value"]:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # Buscar prestador
        provider_user = await db.users.find_one({"id": appointment["provider_user_id"]})
        if not provider_user:
            raise HTTPException(status_code=404, detail="Prestador não encontrado")
        
        # Processar pagamento (mesma lógica dos lojistas)
        amount = appointment["total_value"]
        cashback_rate = code_doc.get("cashback_rate", 0.05)
        cashback_total = amount * cashback_rate
        
        # Distribuição (50% cliente, 10% indicador cliente, 10% indicador prestador, 30% plataforma)
        cashback_client = cashback_total * 0.50
        # TODO: Implementar distribuição para indicadores
        # cashback_referrer_client = cashback_total * 0.10
        # cashback_referrer_provider = cashback_total * 0.10
        # platform_fee = cashback_total * 0.30
        
        transaction_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Debitar do cliente
        new_balance_client = current_user.balance - amount
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"balance": new_balance_client}}
        )
        
        # Creditar ao prestador
        new_balance_provider = provider_user.get("balance", 0) + amount
        await db.users.update_one(
            {"id": provider_user["id"]},
            {"$set": {"balance": new_balance_provider}}
        )
        
        # Creditar cashback ao cliente
        new_cashback_client = current_user.cashback_balance + cashback_client
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"cashback_balance": new_cashback_client}}
        )
        
        # Registrar transação principal
        transaction = {
            "id": transaction_id,
            "user_id": current_user.id,
            "type": "payment_service",
            "amount": -amount,
            "description": f"Pagamento serviço: {appointment.get('service_name', '')}",
            "provider_id": appointment["provider_id"],
            "provider_user_id": appointment["provider_user_id"],
            "appointment_id": appointment_id,
            "balance_after": new_balance_client,
            "created_at": now.isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Registrar recebimento do prestador
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": provider_user["id"],
            "type": "received_service",
            "amount": amount,
            "description": f"Recebimento serviço: {appointment.get('service_name', '')}",
            "client_id": current_user.id,
            "appointment_id": appointment_id,
            "balance_after": new_balance_provider,
            "created_at": now.isoformat()
        })
        
        # Registrar cashback do cliente
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "type": "cashback",
            "amount": cashback_client,
            "description": f"Cashback serviço ({cashback_rate*100}%)",
            "appointment_id": appointment_id,
            "balance_after": new_cashback_client,
            "created_at": now.isoformat()
        })
        
        # TODO: Distribuir para indicadores se existirem (similar ao sistema de lojistas)
        
        # Marcar código como usado
        await db.digital_codes.update_one(
            {"digital_code": format_digital_code(digital_code)},
            {"$set": {"used": True}}
        )
        
        # Atualizar agendamento com transaction_id
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {"transaction_id": transaction_id}}
        )
        
        return {
            "success": True,
            "message": "Pagamento processado com sucesso!",
            "data": {
                "transaction_id": transaction_id,
                "amount": amount,
                "cashback_received": cashback_client,
                "new_balance": new_balance_client,
                "new_cashback_balance": new_cashback_client
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar pagamento de agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === SEED DATABASE (APENAS PARA DEPLOY INICIAL) ===
@api_router.post("/admin/seed-database")
async def seed_database(secret_key: str):
    """
    Endpoint para popular banco de dados com contas demo
    USAR APENAS UMA VEZ após deploy
    """
    # Chave secreta simples para evitar uso acidental
    if secret_key != "transmill_seed_2024":
        raise HTTPException(status_code=403, detail="Chave secreta inválida")
    
    try:
        # Senha padrão para todas as contas demo
        from passlib.hash import bcrypt
        password_hash = bcrypt.hash("demo123")
        
        results = []
        
        # 1. CLIENTE DEMO
        cliente_email = "cliente@demo.com"
        if not await db.users.find_one({"email": cliente_email}):
            cliente_id = str(uuid.uuid4())
            await db.users.insert_one({
                "id": cliente_id,
                "full_name": "Cliente Demo",
                "email": cliente_email,
                "password_hash": password_hash,
                "phone": "11999999999",
                "user_type": "cliente",
                "balance": 20.0,
                "cashback_balance": 2.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results.append("✅ Cliente criado")
        else:
            results.append("ℹ️ Cliente já existe")
        
        # 2. LOJISTA DEMO
        lojista_email = "lojista@demo.com"
        if not await db.users.find_one({"email": lojista_email}):
            lojista_id = str(uuid.uuid4())
            await db.users.insert_one({
                "id": lojista_id,
                "full_name": "Lojista Demo",
                "email": lojista_email,
                "password_hash": password_hash,
                "phone": "11988888888",
                "user_type": "lojista",
                "balance": 100.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            merchant_id = str(uuid.uuid4())
            await db.merchants.insert_one({
                "id": merchant_id,
                "user_id": lojista_id,
                "fantasy_name": "Loja Demo",
                "document": "12345678000199",
                "document_type": "cnpj",
                "address": {
                    "street": "Rua Demo",
                    "number": "100",
                    "neighborhood": "Centro",
                    "city": "São Paulo",
                    "state": "SP",
                    "zipcode": "01000-000"
                },
                "cashback_rate": 0.05,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results.append("✅ Lojista criado")
        else:
            results.append("ℹ️ Lojista já existe")
        
        # 3. PRESTADOR DEMO
        prestador_email = "prestador@demo.com"
        if not await db.users.find_one({"email": prestador_email}):
            prestador_id = str(uuid.uuid4())
            await db.users.insert_one({
                "id": prestador_id,
                "full_name": "José Silva Prestador",
                "email": prestador_email,
                "password_hash": password_hash,
                "phone": "11988776655",
                "user_type": "service_provider",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Criar tipo de prestador
            provider_type_id = str(uuid.uuid4())
            await db.service_provider_types.insert_one({
                "id": provider_type_id,
                "name": "Eletricista",
                "description": "Serviços elétricos",
                "category": "domestico",
                "icon": "⚡",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Criar perfil de prestador
            provider_id = str(uuid.uuid4())
            await db.service_providers.insert_one({
                "id": provider_id,
                "user_id": prestador_id,
                "fantasy_name": "JS Elétrica",
                "document": "12345678901",
                "document_type": "cpf",
                "provider_type_id": provider_type_id,
                "provider_type_name": "Eletricista",
                "address": {
                    "street": "Rua das Flores",
                    "number": "123",
                    "neighborhood": "Centro",
                    "city": "São Paulo",
                    "state": "SP",
                    "zipcode": "01000-000"
                },
                "profile_description": "Eletricista profissional com 10 anos de experiência",
                "working_hours": "Segunda a Sexta: 8h - 18h",
                "accepts_emergency": True,
                "cashback_rate": 0.05,
                "rating_average": 4.8,
                "rating_count": 24,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Criar serviços
            services = [
                {"name": "Instalação Elétrica Completa", "price": 350.00, "duration": 240},
                {"name": "Manutenção de Tomadas", "price": 80.00, "duration": 60},
                {"name": "Instalação de Chuveiro", "price": 120.00, "duration": 90}
            ]
            
            for svc in services:
                await db.services.insert_one({
                    "id": str(uuid.uuid4()),
                    "provider_id": provider_id,
                    "user_id": prestador_id,
                    "name": svc["name"],
                    "description": svc["name"],
                    "price": svc["price"],
                    "estimated_duration": svc["duration"],
                    "category": "eletrica",
                    "is_available": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
            
            results.append("✅ Prestador criado com 3 serviços")
        else:
            results.append("ℹ️ Prestador já existe")
        
        # 4. MASTER
        master_email = "master@transmill.com"
        if not await db.users.find_one({"email": master_email}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "full_name": "Master Admin",
                "email": master_email,
                "password_hash": bcrypt.hash("master123"),
                "phone": "11977777777",
                "user_type": "master",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "usdt_balance": 0.0,
                "is_active": True,
                "is_verified": True,
                "is_master_account": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results.append("✅ Master criado")
        else:
            results.append("ℹ️ Master já existe")
        
        return {
            "success": True,
            "message": "Seed concluído com sucesso!",
            "results": results,
            "accounts": {
                "cliente": "cliente@demo.com / demo123",
                "lojista": "lojista@demo.com / demo123",
                "prestador": "prestador@demo.com / demo123",
                "master": "master@transmill.com / master123"
            }
        }
        
    except Exception as e:
        logger.error(f"Erro no seed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

# Include router will be added at the end

# CORS Configuration removed - Kubernetes ingress handles CORS
# Mobile browsers reject duplicate CORS headers (FastAPI + K8s ingress)
# Letting K8s ingress handle CORS exclusively for mobile compatibility

# Startup event to ensure demo accounts exist

async def ensure_demo_accounts():
    """Ensure demo accounts exist with correct passwords"""
    demo_accounts = [
        {
            "id": "cliente-demo-001",
            "email": "cliente@demo.com",
            "password_hash": bcrypt.hash("demo123"),
            "full_name": "Cliente Demo",
            "phone": "11987654321",
            "user_type": "cliente",
            "balance": 100.00,
            "cashback_balance": 0.00,
            "referral_code": "Z9AAVSIM",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "lojista-demo-001", 
            "email": "lojista@demo.com",
            "password_hash": bcrypt.hash("demo123"),
            "full_name": "João Silva",
            "phone": "11988888888",
            "whatsapp": "11988888888",
            "user_type": "lojista",
            "balance": 500.00,
            "cashback_balance": 0.00,
            "cashback_rate": 5.0,
            "referral_code": "V7TM9YJF",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.utcnow().isoformat(),
            "company_name": "Loja Demo LTDA",
            "cnpj": "12.345.678/0001-90",
            "address": "Rua das Flores, 123",
            "state": "São Paulo",
            "city": "São Paulo", 
            "neighborhood": "Centro",
            "business_segment": "Alimentação",
            "menu_catalog_url": ""
        },
        {
            "id": "master-demo-001",
            "email": "master@transmill.com", 
            "password_hash": bcrypt.hash("master123"),
            "full_name": "Master Admin",
            "phone": "11999999999",
            "user_type": "master",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "is_master_account": True,
            "referral_code": "MASTER01",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    for account_data in demo_accounts:
        email = account_data["email"]
        existing_user = await db.users.find_one({"email": email})
        
        if not existing_user:
            await db.users.insert_one(account_data)
            print(f"✅ Created demo account: {email}")
        else:
            # Update password hash to ensure it's fresh
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": account_data["password_hash"]}}
            )
            print(f"✅ Updated demo account: {email}")

async def create_demo_accounts():
    """Cria contas demo se não existirem"""
    try:
        # Verificar se as contas demo já existem
        existing_accounts = await db.users.find({
            "email": {"$in": ["cliente@demo.com", "lojista@demo.com", "master@transmill.com"]}
        }).to_list(10)
        
        existing_emails = [acc["email"] for acc in existing_accounts]
        
        demo_accounts = []
        
        # Conta demo cliente
        if "cliente@demo.com" not in existing_emails:
            client_demo = {
                "id": str(uuid.uuid4()),
                "email": "cliente@demo.com",
                "full_name": "Cliente Demo",
                "phone": "11999999999",
                "user_type": "cliente",
                "cpf": "123.456.789-00",
                "balance": 100.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "password_hash": bcrypt.hash("demo123"),
                "referral_code": "Z9AAVSIM",
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": False,
                "profile_image": None
            }
            demo_accounts.append(client_demo)
            
        # Conta demo lojista
        if "lojista@demo.com" not in existing_emails:
            merchant_demo = {
                "id": str(uuid.uuid4()),
                "email": "lojista@demo.com",
                "full_name": "João Silva",
                "phone": "11988888888",
                "user_type": "lojista",
                "company_name": "Loja Demo LTDA",
                "cnpj": "12.345.678/0001-90",
                "address": "Rua das Flores, 123 - São Paulo",
                "whatsapp": "11988888888",
                "cashback_rate": 5.0,
                "state": "São Paulo",
                "city": "São Paulo",
                "neighborhood": "Centro",
                "business_segment": "Alimentação",
                "balance": 500.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "password_hash": bcrypt.hash("demo123"),
                "referral_code": "V7TM9YJF",
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": False,
                "profile_image": None
            }
            demo_accounts.append(merchant_demo)
            
        # Conta demo master
        if "master@transmill.com" not in existing_emails:
            master_demo = {
                "id": str(uuid.uuid4()),
                "email": "master@transmill.com",
                "full_name": "Transmill Master",
                "phone": "0000000000",
                "user_type": "platform",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "password_hash": bcrypt.hash("master123"),
                "referral_code": "TRANSMILL",
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": True,
                "profile_image": None
            }
            demo_accounts.append(master_demo)
            
        # Inserir contas que não existem
        if demo_accounts:
            await db.users.insert_many(demo_accounts)
            print(f"✅ Criadas {len(demo_accounts)} contas demo")
        else:
            print("✅ Contas demo já existem")
            
    except Exception as e:
        print(f"❌ Erro ao criar contas demo: {e}")

async def ensure_hierarchical_accounts():
    """Garante que as contas hierárquicas sempre existam"""
    
    hierarchical_accounts = [
        {
            "id": "socio-operador-001",
            "email": "socio.operador@transmill.com",
            "password_hash": bcrypt.hash("socio123"),
            "full_name": "Carlos Silva Operador",
            "phone": "11999001234",
            "user_type": "hierarchical",
            "hierarchical_role": "socio_operador",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "referral_code": "SOCIO001",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "state": "São Paulo",
            "city": "São Paulo",
            "whatsapp": "11999001234"
        },
        {
            "id": "mini-agencia-001", 
            "email": "mini.agencia@transmill.com",
            "password_hash": bcrypt.hash("agencia123"),
            "full_name": "Maria Santos Agência",
            "phone": "11999005678",
            "user_type": "hierarchical",
            "hierarchical_role": "mini_agencia",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "referral_code": "AGENCIA01",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "state": "Rio de Janeiro",
            "city": "Rio de Janeiro",
            "whatsapp": "11999005678"
        },
        {
            "id": "consultor-001",
            "email": "consultor@transmill.com", 
            "password_hash": bcrypt.hash("consultor123"),
            "full_name": "João Costa Consultor",
            "phone": "11999009999",
            "user_type": "hierarchical",
            "hierarchical_role": "consultor",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "referral_code": "CONSULT01",
            "referred_by": None,
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "state": "Minas Gerais",
            "city": "Belo Horizonte",
            "whatsapp": "11999009999"
        }
    ]
    
    for account_data in hierarchical_accounts:
        email = account_data["email"]
        existing_user = await db.users.find_one({"email": email})
        
        if not existing_user:
            await db.users.insert_one(account_data)
            print(f"✅ Conta hierárquica criada: {email} ({account_data['hierarchical_role']})")
        else:
            # Atualizar hash da senha se necessário
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": account_data["password_hash"]}}
            )
            print(f"✅ Conta hierárquica atualizada: {email}")

# =============================================================================
# USDT OPERATIONS APIs
# =============================================================================


@api_router.get("/pos/charge/{payment_code}")
async def get_charge_details(payment_code: str):
    """Obter detalhes de uma cobrança pelo código"""
    try:
        charge = await db.pos_charges.find_one({"payment_code": payment_code})
        
        if not charge:
            raise HTTPException(status_code=404, detail="Código de pagamento não encontrado")
        
        # Verificar se não expirou
        now = datetime.now(timezone.utc)
        if now > charge["expires_at"]:
            raise HTTPException(status_code=400, detail="Código de pagamento expirado")
        
        if charge["status"] != "pending":
            raise HTTPException(status_code=400, detail="Este código já foi processado")
        
        return {
            "success": True,
            "charge_id": charge["id"],
            "payment_code": payment_code,
            "amount": charge["amount"],
            "merchant_name": charge["merchant_name"],
            "description": charge["description"],
            "expires_at": charge["expires_at"].isoformat(),
            "customer_info": charge.get("customer_info", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar cobrança: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.post("/payment/process-code")
async def process_payment_code(
    request: PaymentCodeRequest,
    current_user: User = Depends(get_current_user)
):
    """Processar pagamento via código (clientes)"""
    try:
        # Verificar se é cliente
        if current_user.user_type != 'cliente':
            raise HTTPException(status_code=403, detail="Apenas clientes podem efetuar pagamentos")

        # Buscar cobrança
        charge = await db.pos_charges.find_one({"payment_code": request.code})
        
        if not charge:
            raise HTTPException(status_code=404, detail="Código de pagamento não encontrado")
        
        # Verificar se não expirou
        now = datetime.now(timezone.utc)
        if now > charge["expires_at"]:
            await db.pos_charges.update_one(
                {"_id": charge["_id"]},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=400, detail="Código de pagamento expirado")
        
        if charge["status"] != "pending":
            raise HTTPException(status_code=400, detail="Este código já foi processado")
        
        # Verificar saldo do cliente
        if current_user.balance < charge["amount"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Saldo insuficiente. Necessário: R$ {charge['amount']:.2f}, Disponível: R$ {current_user.balance:.2f}"
            )
        
        # Buscar dados do lojista/prestador
        merchant = await db.users.find_one({"id": charge["merchant_id"]})
        if not merchant:
            raise HTTPException(status_code=404, detail="Lojista/Prestador não encontrado")
        
        # Processar pagamento com distribuição de cashback
        payment_amount = charge["amount"]
        
        # Calcular cashback (usar taxa padrão do merchant ou 5%)
        cashback_percentage = merchant.get("cashback_rate", 5.0)
        total_cashback = (payment_amount * cashback_percentage) / 100
        
        # DISTRIBUIÇÃO DO CASHBACK CONFORME REGRAS DA PLATAFORMA:
        client_cashback = total_cashback * 0.50          # 50% para o cliente
        client_referrer_bonus = total_cashback * 0.10    # 10% para quem indicou o cliente
        hierarchical_commission = total_cashback * 0.30  # 30% para distribuição hierárquica
        platform_commission = total_cashback * 0.10      # 10% para plataforma
        
        # Debitar do cliente
        new_client_balance = current_user.balance - payment_amount
        new_client_cashback = current_user.cashback_balance + client_cashback
        
        # Creditar para o merchant
        new_merchant_balance = merchant["balance"] + payment_amount
        
        # Atualizar saldos
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {
                "balance": new_client_balance,
                "cashback_balance": new_client_cashback
            }}
        )
        
        await db.users.update_one(
            {"id": merchant["id"]},
            {"$inc": {"balance": payment_amount}}
        )
        
        # Marcar cobrança como paga
        await db.pos_charges.update_one(
            {"_id": charge["_id"]},
            {"$set": {
                "status": "paid",
                "paid_at": now,
                "paid_by": current_user.id
            }}
        )
        
        # Criar transações
        transactions_to_save = []
        
        # Transação do cliente (débito)
        client_transaction = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "transaction_type": "pos_payment",
            "amount": -payment_amount,
            "description": f"Pagamento POS - {charge['merchant_name']}",
            "balance_after": new_client_balance,
            "status": "completed",
            "created_at": now,
            "metadata": {
                "payment_code": request.code,
                "merchant_id": charge["merchant_id"],
                "merchant_name": charge["merchant_name"],
                "cashback_earned": client_cashback
            }
        }
        transactions_to_save.append(client_transaction)
        
        # Transação do cashback do cliente
        cashback_transaction = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "transaction_type": "cashback_pos",
            "amount": client_cashback,
            "description": f"Cashback {cashback_percentage}% - {charge['merchant_name']}",
            "cashback_balance_after": new_client_cashback,
            "status": "completed",
            "created_at": now,
            "metadata": {
                "payment_code": request.code,
                "merchant_id": charge["merchant_id"],
                "merchant_name": charge["merchant_name"]
            }
        }
        transactions_to_save.append(cashback_transaction)
        
        # Transação do merchant (crédito)
        merchant_transaction = {
            "id": str(uuid.uuid4()),
            "user_id": merchant["id"],
            "transaction_type": "pos_received",
            "amount": payment_amount,
            "description": f"Recebimento POS - {current_user.full_name}",
            "balance_after": new_merchant_balance,
            "status": "completed",
            "created_at": now,
            "metadata": {
                "payment_code": request.code,
                "client_id": current_user.id,
                "client_name": current_user.full_name
            }
        }
        transactions_to_save.append(merchant_transaction)
        
        # Distribuir bônus de indicação (se aplicável)
        if current_user.referred_by:
            referrer = await db.users.find_one({"id": current_user.referred_by})
            if referrer:
                await db.users.update_one(
                    {"id": referrer["id"]},
                    {"$inc": {"cashback_balance": client_referrer_bonus}}
                )
                
                referrer_transaction = {
                    "id": str(uuid.uuid4()),
                    "user_id": referrer["id"],
                    "transaction_type": "referral_bonus_pos",
                    "amount": client_referrer_bonus,
                    "description": f"Bônus indicação POS - {charge['merchant_name']}",
                    "status": "completed",
                    "created_at": now,
                    "metadata": {
                        "referred_user_id": current_user.id,
                        "merchant_name": charge["merchant_name"],
                        "payment_code": request.code
                    }
                }
                transactions_to_save.append(referrer_transaction)
        
        # Distribuir comissões hierárquicas
        distributed_hierarchical = await distribute_hierarchical_commissions(
            commission_amount=hierarchical_commission,
            merchant_state=merchant.get("state", "SP"),
            merchant_city=merchant.get("city", "São Paulo"),
            client_id=current_user.id,
            merchant_id=merchant["id"],
            description=f"POS {charge['merchant_name']}"
        )
        
        # Comissão da plataforma (+ sobras da hierarquia)
        total_platform_commission = platform_commission + (hierarchical_commission - distributed_hierarchical)
        if total_platform_commission > 0:
            platform_account = await db.users.find_one({"is_master_account": True})
            if platform_account:
                await db.users.update_one(
                    {"id": platform_account["id"]},
                    {"$inc": {"cashback_balance": total_platform_commission}}
                )
        
        # Salvar todas as transações
        if transactions_to_save:
            await db.transactions.insert_many(transactions_to_save)
        
        return {
            "success": True,
            "message": f"Pagamento de R$ {payment_amount:.2f} realizado com sucesso!",
            "payment": {
                "amount_paid": payment_amount,
                "merchant_name": charge["merchant_name"],
                "cashback_earned": client_cashback,
                "cashback_percentage": cashback_percentage,
                "payment_code": request.code,
                "paid_at": now.isoformat()
            },
            "new_balance": new_client_balance,
            "new_cashback_balance": new_client_cashback
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/pos/charges")
async def get_my_charges(current_user: User = Depends(get_current_user)):
    """Listar cobranças do lojista/prestador"""
    try:
        if current_user.user_type not in ['lojista', 'service_provider']:
            raise HTTPException(status_code=403, detail="Acesso restrito a lojistas e prestadores")

        charges_cursor = db.pos_charges.find({"merchant_id": current_user.id}).sort("created_at", -1)
        charges = await charges_cursor.to_list(50)
        
        # Formatar dados
        formatted_charges = []
        for charge in charges:
            formatted_charge = {
                "id": charge["id"],
                "payment_code": charge["payment_code"],
                "amount": charge["amount"],
                "description": charge["description"],
                "status": charge["status"],
                "created_at": charge["created_at"].isoformat(),
                "expires_at": charge["expires_at"].isoformat(),
                "customer_info": charge.get("customer_info", {}),
                "is_expired": datetime.now(timezone.utc) > charge["expires_at"],
                "paid_at": charge["paid_at"].isoformat() if charge.get("paid_at") else None
            }
            formatted_charges.append(formatted_charge)
        
        return {
            "success": True,
            "charges": formatted_charges,
            "total": len(formatted_charges)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar cobranças: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# ========================== SISTEMA DE AGENDA DOS PRESTADORES ==========================

class AvailabilitySlot(BaseModel):
    id: Optional[str] = None
    provider_id: str
    date: str  # YYYY-MM-DD format
    start_time: str  # HH:MM format  
    end_time: str  # HH:MM format
    is_available: bool = True
    is_recurring: bool = False  # Se é um horário que se repete semanalmente
    day_of_week: Optional[int] = None  # 0=domingo, 1=segunda, etc.
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AppointmentBooking(BaseModel):
    id: Optional[str] = None
    client_id: str
    provider_id: str
    service_id: Optional[str] = None
    appointment_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    status: str = "pending"  # pending, confirmed, completed, cancelled
    client_notes: Optional[str] = None
    provider_notes: Optional[str] = None
    service_name: Optional[str] = None
    service_price: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================
from models.social import (
    VideoPost, VideoLike, VideoComment, VideoView, SocialSettings,
    CreateVideoRequest, LikeVideoRequest, CommentVideoRequest, 
    ViewVideoRequest, UpdateSocialSettingsRequest, VideoType
)

async def get_social_settings():
    """Get social settings from database"""
    settings = await db.social_settings.find_one({})
    if not settings:
        # Create default settings
        default_settings = SocialSettings().dict()
        await db.social_settings.insert_one(default_settings)
        return default_settings
    
    # Remove MongoDB _id field to avoid serialization issues
    if '_id' in settings:
        del settings['_id']
    
    return settings

# Helper function to award points
async def award_points(user_id: str, points: int, description: str):
    """Award points to user and create transaction"""
    try:
        logger.info(f"Awarding {points} points to user {user_id} for: {description}")
        
        # Get user
        user = await db.users.find_one({'id': user_id})
        if not user:
            logger.error(f"User not found: {user_id}")
            return False
        
        # Initialize social_points if doesn't exist
        current_points = user.get('social_points', 0)
        new_points = current_points + points
        
        logger.info(f"User {user_id}: {current_points} -> {new_points} points")
        
        # Update user points
        update_result = await db.users.update_one(
            {'id': user_id},
            {'$set': {'social_points': new_points}}
        )
        
        logger.info(f"User update result: matched={update_result.matched_count}, modified={update_result.modified_count}")
        
        # Create points transaction
        transaction_result = await db.social_points_transactions.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'points': points,
            'description': description,
            'created_at': datetime.now(timezone.utc)
        })
        
        logger.info(f"Transaction created: {transaction_result.inserted_id}")
        
        return True
    except Exception as e:
        logger.error(f"Error awarding points: {e}")
        return False

# Social endpoints moved to /app/backend/routes/social.py

@api_router.post("/master/credit-card-fees")
async def update_credit_card_fees(
    fees_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update credit card fees configuration (Master only)"""
    try:
        user = await db.users.find_one({'id': current_user.id})
        if not user.get('is_master_account'):
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        # Validate fees data
        for i in range(1, 13):
            key = f'installment_{i}'
            if key not in fees_data:
                raise HTTPException(status_code=400, detail=f"Taxa para {i}x é obrigatória")
            if not isinstance(fees_data[key], (int, float)) or fees_data[key] < 0:
                raise HTTPException(status_code=400, detail=f"Taxa para {i}x deve ser um número positivo")
        
        # Update or create fees
        existing_fees = await db.credit_card_fees.find_one({})
        
        fees_update = {
            **fees_data,
            'updated_at': datetime.utcnow(),
            'updated_by': current_user.id
        }
        
        if existing_fees:
            await db.credit_card_fees.update_one(
                {'id': existing_fees['id']},
                {'$set': fees_update}
            )
        else:
            fees_update['id'] = str(uuid4())
            await db.credit_card_fees.insert_one(fees_update)
        
        return {
            'success': True,
            'message': 'Taxas de cartão de crédito atualizadas com sucesso',
            'fees': fees_update
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating credit card fees: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# CREDIT CARD DEPOSIT (MOCK)
# ============================================

@api_router.post("/deposit/credit-card")
async def deposit_via_credit_card(
    deposit_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Deposit via credit card (MOCK - always succeeds)"""
    try:
        amount = deposit_data.get('amount')
        installments = deposit_data.get('installments', 1)
        card_number = deposit_data.get('card_number')
        card_holder = deposit_data.get('card_holder')
        card_expiry = deposit_data.get('card_expiry')
        card_cvv = deposit_data.get('card_cvv')
        
        # Validations
        if not amount or amount < 100:
            raise HTTPException(status_code=400, detail="Valor mínimo para depósito: R$ 100,00")
        
        if not installments or installments < 1 or installments > 12:
            raise HTTPException(status_code=400, detail="Parcelas devem ser entre 1 e 12")
        
        if not all([card_number, card_holder, card_expiry, card_cvv]):
            raise HTTPException(status_code=400, detail="Todos os dados do cartão são obrigatórios")
        
        # Get fees
        fees = await db.credit_card_fees.find_one({})
        if not fees:
            raise HTTPException(status_code=500, detail="Taxas de cartão não configuradas")
        
        # Calculate fee
        fee_key = f'installment_{installments}'
        fee_percentage = fees.get(fee_key, 0)
        fee_amount = amount * (fee_percentage / 100)
        total_amount = amount + fee_amount
        installment_value = total_amount / installments
        
        # MOCK: Always succeed
        transaction_id = f"CC-{str(uuid4())[:8]}"
        
        # Credit user balance
        await db.users.update_one(
            {'id': current_user.id},
            {'$inc': {'balance': amount}}
        )
        
        # Record transaction
        transaction_record = {
            'id': str(uuid4()),
            'transaction_id': transaction_id,
            'user_id': current_user.id,
            'type': 'deposit_credit_card',
            'amount': amount,
            'fee_percentage': fee_percentage,
            'fee_amount': fee_amount,
            'total_charged': total_amount,
            'installments': installments,
            'installment_value': installment_value,
            'card_last_digits': card_number[-4:],
            'status': 'completed',
            'created_at': datetime.utcnow()
        }
        await db.transactions.insert_one(transaction_record)
        
        return {
            'success': True,
            'message': f'Depósito de R$ {amount:.2f} realizado com sucesso!',
            'transaction_id': transaction_id,
            'amount_deposited': amount,
            'amount_charged': total_amount,
            'fee_percentage': fee_percentage,
            'fee_amount': fee_amount,
            'installments': installments,
            'installment_value': installment_value,
            'new_balance': (await db.users.find_one({'id': current_user.id}))['balance']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing credit card deposit: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PAYMENT METHOD PREFERENCES
# ============================================

# MOBILITY ENDPOINTS - Migrados para routes/mobility_routes.py (v2.38.52)


# Include router AFTER all endpoints are defined
app.include_router(api_router)

# Labelview router removido (feature descontinuada)

# Include Debug routes  
from routes.debug import debug_router
app.include_router(debug_router, prefix="/api/debug", tags=["debug"])

from routes.production_cleanup import production_router
app.include_router(production_router)

# 🔧 CORREÇÃO v2.34.71: Endpoint para atualizar imagens de vistoria para 14 fotos
from routes.populate_images_endpoint import router as populate_images_router
app.include_router(populate_images_router, prefix="/api", tags=["admin"])

# =====================================================
# MÓDULOS REFATORADOS - v2.38.30
# =====================================================

# Auth routes (login, registro, recuperação de senha)
from routes.auth import auth_router, setup_auth_routes
setup_auth_routes(db, create_access_token, check_reset_attempts, generate_reset_code, send_email)
app.include_router(auth_router)
logger.info("✅ Auth router incluído")

# Franquias routes (CRUD de franquias)
from routes.franquias import franquias_router, setup_franquias_routes
setup_franquias_routes(db, get_current_user)
app.include_router(franquias_router)
logger.info("✅ Franquias router incluído")

# Transactions routes (pagamentos, saques)
from routes.transactions import transactions_router, setup_transactions_routes
setup_transactions_routes(db, get_current_user)
app.include_router(transactions_router)
logger.info("✅ Transactions router incluído")

# Suporte routes (chamados/tickets)
from routes.suporte import suporte_router, setup_suporte_routes
setup_suporte_routes(db, get_current_user)
app.include_router(suporte_router)
logger.info("✅ Suporte router incluído")

# Notifications module now uses new modular router (registered below)

# Setup routes (endpoints administrativos)
from routes.setup import setup_router, setup_setup_routes
setup_setup_routes(db)
app.include_router(setup_router)
logger.info("✅ Setup router incluído")

# PWA routes (push notifications, cliente PWA)
from routes.pwa import pwa_router, setup_pwa_routes
setup_pwa_routes(db)
app.include_router(pwa_router)
logger.info("✅ PWA router incluído")

# Labelview router removido (feature descontinuada)

# Users routes (perfil, saldo, documentos)
from routes.users import users_router, setup_users_routes
setup_users_routes(db)
app.include_router(users_router)
logger.info("✅ Users router incluído")

# Wallet routes (transações, pagamentos, saques)
from routes.wallet import wallet_router, setup_wallet_routes
setup_wallet_routes(db)
app.include_router(wallet_router)
logger.info("✅ Wallet router incluído")

# Admin routes (gestão de usuários, auditoria)
from routes.admin import admin_router, setup_admin_routes
setup_admin_routes(db)
app.include_router(admin_router)
logger.info("✅ Admin router incluído")

# XGate routes (PIX, USDT, conversões)
from routes.xgate import router as xgate_router, init_xgate_routes
init_xgate_routes(db, xgate_service, USDTService, get_current_user)
app.include_router(xgate_router, prefix="/api", tags=["XGate"])
logger.info("✅ XGate router incluído")

# Master routes (segmentos de negócio, tipos de prestador, planos)
from routes.master import master_router, set_db as set_master_db, set_auth_dependency as set_master_auth
set_master_db(db)
set_master_auth(get_current_user)
app.include_router(master_router, prefix="/api", tags=["Master"])
logger.info("✅ Master router incluído")

# Merchant routes (lojistas: equipe, produtos, categorias)
from routes.merchant import merchant_router, set_db as set_merchant_db, set_auth_dependency as set_merchant_auth
set_merchant_db(db)
set_merchant_auth(get_current_user)
app.include_router(merchant_router, prefix="/api", tags=["Merchant"])
logger.info("✅ Merchant router incluído")

# Services routes (prestadores e agendamentos)
from routes.services import services_router, set_db as set_services_db, set_auth_dependency as set_services_auth
set_services_db(db)
set_services_auth(get_current_user)
app.include_router(services_router, prefix="/api", tags=["Services"])
logger.info("✅ Services router incluído")

# Exports routes (PDF e Excel)
# Exports router removido (feature descontinuada)
# Criar função para buscar usuário por token
async def get_user_from_token(token: str):
    """Função auxiliar para buscar usuário a partir do token"""
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"id": user_id})
            if user:
                # Remover _id para evitar problemas de serialização
                if '_id' in user:
                    del user['_id']
                return user
    except Exception as e:
        logger.error(f"Erro ao validar token: {e}")
    return None

# Exports e Social routers removidos (features descontinuadas)

# Subusers routes (colaboradores)
from routes.subusers import router as subusers_router, init_subusers_routes
init_subusers_routes(db, get_user_from_token, create_access_token)
app.include_router(subusers_router, prefix="/api", tags=["Subusers"])
logger.info("✅ Subusers router incluído")

# Stores routes (lojas)
from routes.stores import router as stores_router, init_stores_routes
init_stores_routes(db, get_current_user, get_franquia_filter, get_franquia_context)
app.include_router(stores_router, prefix="/api", tags=["Stores"])
logger.info("✅ Stores router incluído")

# Auth utils for modular routers
from routes.auth_utils import set_db as set_auth_utils_db
set_auth_utils_db(db)

# Notifications routes
from routes.notifications import router as notifications_router, set_db as set_notif_db
set_notif_db(db)
app.include_router(notifications_router, prefix="/api", tags=["Notifications"])
logger.info("✅ Notifications router incluído")

# Referral routes
from routes.referral import router as referral_router, set_db as set_referral_db
set_referral_db(db)
app.include_router(referral_router, prefix="/api", tags=["Referral"])
logger.info("✅ Referral router incluído")

# Mobility routes (mobilidade urbana P2P)
from routes.mobility_routes import mobility_router, set_db as set_mobility_db
set_mobility_db(db)
app.include_router(mobility_router, prefix="/api", tags=["Mobility"])
logger.info("✅ Mobility router incluído")

# Integrações por franquia (credenciais de APIs - XGate, Maps, imagens, BaaS)
from routes.integracoes import router as integracoes_router, set_db as set_integracoes_db
set_integracoes_db(db)
app.include_router(integracoes_router, prefix="/api", tags=["Integracoes"])
logger.info("✅ Integrações router incluído")


# USDT wallet routes
from routes.usdt import router as usdt_router, set_db as set_usdt_db
set_usdt_db(db)
app.include_router(usdt_router, prefix="/api", tags=["USDT"])
logger.info("✅ USDT router incluído")

# Provider schedule & appointments routes
from routes.provider_schedule import router as provider_schedule_router, set_db as set_provider_schedule_db
set_provider_schedule_db(db)
app.include_router(provider_schedule_router, prefix="/api", tags=["ProviderSchedule"])
logger.info("✅ Provider Schedule router incluído")

# Orders & catalog routes
from routes.orders import router as orders_router, set_db as set_orders_db
set_orders_db(db)
app.include_router(orders_router, prefix="/api", tags=["Orders"])
logger.info("✅ Orders router incluído")

# Payment method preferences routes
from routes.payment_methods import router as payment_methods_router, set_db as set_payment_methods_db
set_payment_methods_db(db)
app.include_router(payment_methods_router, prefix="/api", tags=["PaymentMethods"])
logger.info("✅ Payment Methods router incluído")

# =====================================================
# ENDPOINTS SETUP, PWA e MASTER PUSH - MOVIDOS PARA ROUTERS
# =====================================================
# Os seguintes endpoints foram modularizados para melhor organização:
# 
# - /api/setup/* -> /app/backend/routes/setup.py
# - /api/version -> /app/backend/routes/setup.py
# - /api/pwa/* -> /app/backend/routes/pwa.py
# - /api/master/push/* -> /app/backend/routes/pwa.py
# - /api/labelview/* -> /app/backend/routes/labelview.py
# - /api/exports/* -> /app/backend/routes/exports.py
# - /api/social/* -> /app/backend/routes/social.py
# - /api/subusers/* -> /app/backend/routes/subusers.py
# - /api/stores/* -> /app/backend/routes/stores.py
#
# Os routers são configurados acima e incluídos automaticamente.
# =====================================================

# Entry point for direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, workers=1)
