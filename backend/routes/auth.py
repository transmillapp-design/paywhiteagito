"""
Módulo de Autenticação - Transmill API
Endpoints: login, registro, recuperação de senha
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from passlib.hash import bcrypt
import logging
import uuid

logger = logging.getLogger(__name__)

# Router
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

# ============================================
# MODELS
# ============================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    reset_code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

# ============================================
# HELPER FUNCTIONS (serão importadas do server.py)
# ============================================

# Database e funções auxiliares são injetadas via setup_auth_routes()
_db = None
_create_access_token = None
_check_reset_attempts = None
_generate_reset_code = None
_send_email = None


def setup_auth_routes(db, create_access_token_fn, check_reset_attempts_fn, generate_reset_code_fn, send_email_fn):
    """Configura as dependências do módulo auth"""
    global _db, _create_access_token, _check_reset_attempts, _generate_reset_code, _send_email
    _db = db
    _create_access_token = create_access_token_fn
    _check_reset_attempts = check_reset_attempts_fn
    _generate_reset_code = generate_reset_code_fn
    _send_email = send_email_fn
    logger.info("✅ Auth routes configuradas")


# ============================================
# ENDPOINTS
# ============================================

@auth_router.post("/login")
async def login_user(login_data: UserLogin):
    """Login de usuário"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    user = await _db.users.find_one({"email": login_data.email})
    logger.info(f"Login attempt for: {login_data.email}")
    
    if not user or not bcrypt.verify(login_data.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Para conta master, recalcular saldo da plataforma
    if user.get('is_master_account', False):
        commission_total = await _db.transactions.aggregate([
            {"$match": {"user_id": user['id'], "transaction_type": "platform_commission"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        
        withdrawal_total = await _db.transactions.aggregate([
            {"$match": {"user_id": user['id'], "transaction_type": {"$in": ["withdrawal", "withdrawal_fee"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        
        total_commission = commission_total[0]['total'] if commission_total else 0
        total_withdrawn = withdrawal_total[0]['total'] if withdrawal_total else 0
        current_balance = total_commission - total_withdrawn
        
        await _db.users.update_one(
            {"id": user['id']},
            {"$set": {"platform_balance": current_balance}}
        )
        user['platform_balance'] = current_balance
    
    access_token = _create_access_token(data={"sub": user['id']})
    
    # Remove password_hash and _id before returning
    user_dict = {k: v for k, v in user.items() if k not in ['password_hash', '_id']}
    
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }
    
    if user.get('must_change_password') is not None:
        response["must_change_password"] = user.get('must_change_password')
    
    if user.get('profile_complete') is not None:
        response["profile_complete"] = user.get('profile_complete')
    
    return response


@auth_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Envia código de recuperação para o email do usuário"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user = await _db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="Email não encontrado no sistema")
        
        can_request = await _check_reset_attempts(request.email)
        if not can_request:
            raise HTTPException(
                status_code=429, 
                detail="Limite de tentativas excedido. Você pode solicitar nova recuperação apenas 2 vezes por mês"
            )
        
        reset_code = _generate_reset_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        reset_data = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "code": reset_code,
            "expires_at": expires_at,
            "used": False,
            "attempts": 0,
            "created_at": datetime.now(timezone.utc)
        }
        
        await _db.password_reset_codes.insert_one(reset_data)
        
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
        
        email_sent = await _send_email(request.email, subject, body)
        
        if email_sent:
            return {"message": "Código enviado para seu email com sucesso"}
        else:
            raise HTTPException(status_code=500, detail="Erro ao enviar email. Tente novamente")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro em forgot_password: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@auth_router.post("/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    """Verifica se o código de recuperação é válido"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        reset_entry = await _db.password_reset_codes.find_one({
            "email": request.email,
            "code": request.reset_code,
            "used": False
        })
        
        if not reset_entry:
            raise HTTPException(status_code=400, detail="Código inválido ou já utilizado")
        
        if datetime.now(timezone.utc) > reset_entry["expires_at"]:
            raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código")
        
        return {"message": "Código válido", "valid": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro em verify_reset_code: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@auth_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Define nova senha usando o código de recuperação"""
    if not _db:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        reset_entry = await _db.password_reset_codes.find_one({
            "email": request.email,
            "code": request.reset_code,
            "used": False
        })
        
        if not reset_entry:
            raise HTTPException(status_code=400, detail="Código inválido ou já utilizado")
        
        if datetime.now(timezone.utc) > reset_entry["expires_at"]:
            raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código")
        
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
        
        user = await _db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        new_password_hash = bcrypt.hash(request.new_password)
        
        await _db.users.update_one(
            {"email": request.email},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        await _db.password_reset_codes.update_one(
            {"_id": reset_entry["_id"]},
            {"$set": {"used": True}}
        )
        
        return {"message": "Senha alterada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro em reset_password: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
