"""
Modelos para operações USDT no AgitoCoin
"""
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class USDTOperation:
    """Modelo para operações USDT"""
    
    def __init__(self, 
                 operation_id: str = None,
                 user_id: str = None,
                 operation_type: str = None,  # 'deposit', 'withdrawal', 'external_transfer'
                 amount_brl: float = 0.0,
                 amount_usdt: float = 0.0,
                 fee_percentage: float = 3.99,
                 fee_amount_brl: float = 0.0,
                 net_amount_brl: float = 0.0,
                 usdt_rate: float = 0.0,
                 status: str = 'pending',  # 'pending', 'processing', 'completed', 'failed', 'cancelled'
                 external_wallet: str = None,
                 requires_approval: bool = False,
                 approved_by: str = None,
                 approved_at: datetime = None,
                 created_at: datetime = None,
                 completed_at: datetime = None,
                 metadata: Dict[str, Any] = None):
        
        self.operation_id = operation_id or str(uuid.uuid4())
        self.user_id = user_id
        self.operation_type = operation_type
        self.amount_brl = float(amount_brl)
        self.amount_usdt = float(amount_usdt)
        self.fee_percentage = float(fee_percentage)
        self.fee_amount_brl = float(fee_amount_brl)
        self.net_amount_brl = float(net_amount_brl)
        self.usdt_rate = float(usdt_rate)
        self.status = status
        self.external_wallet = external_wallet
        self.requires_approval = requires_approval
        self.approved_by = approved_by
        self.approved_at = approved_at
        self.created_at = created_at or datetime.utcnow()
        self.completed_at = completed_at
        self.metadata = metadata or {}
    
    def to_dict(self) -> dict:
        """Converte para dicionário"""
        return {
            'operation_id': self.operation_id,
            'user_id': self.user_id,
            'operation_type': self.operation_type,
            'amount_brl': self.amount_brl,
            'amount_usdt': self.amount_usdt,
            'fee_percentage': self.fee_percentage,
            'fee_amount_brl': self.fee_amount_brl,
            'net_amount_brl': self.net_amount_brl,
            'usdt_rate': self.usdt_rate,
            'status': self.status,
            'external_wallet': self.external_wallet,
            'requires_approval': self.requires_approval,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Cria instância a partir de dicionário"""
        # Converter strings de data para datetime
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        
        approved_at = None
        if data.get('approved_at'):
            approved_at = datetime.fromisoformat(data['approved_at'].replace('Z', '+00:00'))
        
        completed_at = None
        if data.get('completed_at'):
            completed_at = datetime.fromisoformat(data['completed_at'].replace('Z', '+00:00'))
        
        return cls(
            operation_id=data.get('operation_id'),
            user_id=data.get('user_id'),
            operation_type=data.get('operation_type'),
            amount_brl=data.get('amount_brl', 0.0),
            amount_usdt=data.get('amount_usdt', 0.0),
            fee_percentage=data.get('fee_percentage', 3.99),
            fee_amount_brl=data.get('fee_amount_brl', 0.0),
            net_amount_brl=data.get('net_amount_brl', 0.0),
            usdt_rate=data.get('usdt_rate', 0.0),
            status=data.get('status', 'pending'),
            external_wallet=data.get('external_wallet'),
            requires_approval=data.get('requires_approval', False),
            approved_by=data.get('approved_by'),
            approved_at=approved_at,
            created_at=created_at,
            completed_at=completed_at,
            metadata=data.get('metadata', {})
        )

class ExternalWallet:
    """Modelo para carteiras externas USDT"""
    
    def __init__(self,
                 wallet_id: str = None,
                 user_id: str = None,
                 wallet_address: str = None,
                 wallet_name: str = None,
                 network: str = 'TRC20',  # TRC20, ERC20, etc
                 is_validated: bool = False,
                 last_used: datetime = None,
                 created_at: datetime = None):
        
        self.wallet_id = wallet_id or str(uuid.uuid4())
        self.user_id = user_id
        self.wallet_address = wallet_address
        self.wallet_name = wallet_name
        self.network = network
        self.is_validated = is_validated
        self.last_used = last_used
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Converte para dicionário"""
        return {
            'wallet_id': self.wallet_id,
            'user_id': self.user_id,
            'wallet_address': self.wallet_address,
            'wallet_name': self.wallet_name,
            'network': self.network,
            'is_validated': self.is_validated,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Cria instância a partir de dicionário"""
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        
        last_used = None
        if data.get('last_used'):
            last_used = datetime.fromisoformat(data['last_used'].replace('Z', '+00:00'))
        
        return cls(
            wallet_id=data.get('wallet_id'),
            user_id=data.get('user_id'),
            wallet_address=data.get('wallet_address'),
            wallet_name=data.get('wallet_name'),
            network=data.get('network', 'TRC20'),
            is_validated=data.get('is_validated', False),
            last_used=last_used,
            created_at=created_at
        )

# Constantes
USDT_FEE_RATE = 0.0399  # 3.99%
MAX_DEPOSIT_AMOUNT = 100000.0  # R$ 100.000
MIN_OPERATION_AMOUNT = 10.0  # R$ 10

OPERATION_TYPES = {
    'deposit': 'Depósito PIX USDT',
    'withdrawal': 'Saque USDT',
    'external_transfer': 'Transferência USDT Externa'
}

OPERATION_STATUS = {
    'pending': 'Pendente',
    'processing': 'Processando', 
    'completed': 'Concluído',
    'failed': 'Falhou',
    'cancelled': 'Cancelado'
}