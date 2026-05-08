from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class CreditCardFees(BaseModel):
    """Taxas de cartão de crédito configuradas pelo Master"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    installment_1: float = 2.59  # Taxa para 1x
    installment_2: float = 3.19  # Taxa para 2x
    installment_3: float = 3.79  # Taxa para 3x
    installment_4: float = 4.39  # Taxa para 4x
    installment_5: float = 4.99  # Taxa para 5x
    installment_6: float = 5.59  # Taxa para 6x
    installment_7: float = 6.19  # Taxa para 7x
    installment_8: float = 6.79  # Taxa para 8x
    installment_9: float = 7.39  # Taxa para 9x
    installment_10: float = 7.99  # Taxa para 10x
    installment_11: float = 8.59  # Taxa para 11x
    installment_12: float = 9.19  # Taxa para 12x
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None  # ID do master que atualizou

class CreditCardDeposit(BaseModel):
    """Dados para depósito via cartão de crédito"""
    amount: float = Field(..., gt=0, description="Valor do depósito em BRL")
    installments: int = Field(..., ge=1, le=12, description="Número de parcelas")
    card_number: str = Field(..., min_length=13, max_length=19)
    card_holder: str = Field(..., min_length=3)
    card_expiry: str = Field(..., pattern=r"^\d{2}/\d{2}$")  # MM/YY
    card_cvv: str = Field(..., min_length=3, max_length=4)

class CreditCardDepositResponse(BaseModel):
    """Resposta do depósito via cartão"""
    success: bool
    message: str
    transaction_id: Optional[str] = None
    amount_charged: Optional[float] = None  # Valor total cobrado (com taxa)
    fee_percentage: Optional[float] = None
    fee_amount: Optional[float] = None
    installments: Optional[int] = None
    installment_value: Optional[float] = None

class PaymentMethodPreferences(BaseModel):
    """Preferências de pagamento do lojista/prestador"""
    accept_wallet_payment: bool = True
    accept_usdt_payment: bool = False

from uuid import uuid4
