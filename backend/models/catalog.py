"""
Modelos Pydantic para o Sistema de Catálogo/Cardápio Digital
AgitoCoin - Substituindo AgitoAI
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# === ENUMS ===

class ProductStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    OUT_OF_STOCK = "out_of_stock"


class OrderType(str, Enum):
    PICKUP = "pickup"  # Retirada no balcão
    DELIVERY = "delivery"  # Entrega


class OrderStatus(str, Enum):
    PENDING = "pending"  # Aguardando aceitação
    ACCEPTED = "accepted"  # Aceito pelo lojista
    PREPARING = "preparing"  # Em preparação/separação
    READY_PICKUP = "ready_pickup"  # Pronto para retirada
    OUT_FOR_DELIVERY = "out_for_delivery"  # Saiu para entrega
    COMPLETED = "completed"  # Finalizado
    CANCELLED = "cancelled"  # Cancelado


class PaymentStatus(str, Enum):
    PENDING = "pending"  # Aguardando pagamento
    PAID = "paid"  # Pago (debitado do saldo)
    REFUNDED = "refunded"  # Reembolsado


# === MODELOS DE PRODUTO ===

class ProductVariation(BaseModel):
    """Variação de produto (ex: tamanhos, sabores)"""
    name: str  # Ex: "Grande", "Médio", "Pequeno"
    price_adjustment: float = 0.0  # Diferença de preço (+ ou -)
    is_available: bool = True


class ProductComplement(BaseModel):
    """Complemento/adicional do produto"""
    name: str  # Ex: "Queijo extra", "Bacon"
    price: float  # Preço do adicional
    is_available: bool = True


class ProductCategory(BaseModel):
    """Categoria de produtos"""
    category_id: str
    merchant_id: str  # ID do lojista
    name: str  # Ex: "Bebidas", "Pizzas", "Sobremesas"
    description: Optional[str] = None
    display_order: int = 0  # Ordem de exibição
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Product(BaseModel):
    """Produto do catálogo"""
    product_id: str
    merchant_id: str  # ID do lojista
    category_id: Optional[str] = None  # ID da categoria
    
    # Informações básicas
    name: str
    description: Optional[str] = None
    price: float
    
    # Imagens (base64 ou URLs)
    images: List[str] = Field(default_factory=list)
    
    # Estoque
    has_stock_control: bool = False
    stock_quantity: Optional[int] = None
    
    # Status
    status: ProductStatus = ProductStatus.AVAILABLE
    
    # Variações e complementos
    variations: List[ProductVariation] = Field(default_factory=list)
    complements: List[ProductComplement] = Field(default_factory=list)
    
    # Promoção
    has_promotion: bool = False
    promotion_price: Optional[float] = None
    promotion_description: Optional[str] = None
    
    # Metadados
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# === MODELOS DE CARRINHO E PEDIDO ===

class CartItemVariation(BaseModel):
    """Variação selecionada no item do carrinho"""
    name: str
    price_adjustment: float


class CartItemComplement(BaseModel):
    """Complemento selecionado no item do carrinho"""
    name: str
    price: float


class CartItem(BaseModel):
    """Item no carrinho"""
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    base_price: float
    quantity: int = 1
    
    # Variação e complementos selecionados
    selected_variation: Optional[CartItemVariation] = None
    selected_complements: List[CartItemComplement] = Field(default_factory=list)
    
    # Observações do cliente
    notes: Optional[str] = None
    
    # Preço total do item (base + variação + complementos) * quantidade
    total_price: float


class Cart(BaseModel):
    """Carrinho de compras"""
    cart_id: str
    user_id: str  # Cliente
    merchant_id: str  # Lojista
    items: List[CartItem] = Field(default_factory=list)
    
    # Totais
    subtotal: float = 0.0  # Soma dos itens
    delivery_fee: float = 0.0  # Taxa de entrega (se delivery)
    total: float = 0.0  # Subtotal + taxa de entrega
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Order(BaseModel):
    """Pedido finalizado"""
    order_id: str
    user_id: str  # Cliente
    merchant_id: str  # Lojista
    
    # Tipo de pedido
    order_type: OrderType  # pickup ou delivery
    
    # Itens
    items: List[CartItem]
    
    # Valores
    subtotal: float
    delivery_fee: float = 0.0
    total: float
    
    # Endereço de entrega (se delivery)
    delivery_address: Optional[Dict[str, Any]] = None
    
    # Status
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    
    # Atribuição (entregador se delivery)
    assigned_to: Optional[str] = None  # ID do sub-usuário (entregador)
    
    # Observações
    customer_notes: Optional[str] = None
    merchant_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    preparing_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    out_for_delivery_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


# === MODELOS DE REQUEST/RESPONSE ===

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ProductCreate(BaseModel):
    category_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    images: List[str] = Field(default_factory=list)
    has_stock_control: bool = False
    stock_quantity: Optional[int] = None
    variations: List[ProductVariation] = Field(default_factory=list)
    complements: List[ProductComplement] = Field(default_factory=list)
    has_promotion: bool = False
    promotion_price: Optional[float] = None
    promotion_description: Optional[str] = None


class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None
    has_stock_control: Optional[bool] = None
    stock_quantity: Optional[int] = None
    status: Optional[ProductStatus] = None
    variations: Optional[List[ProductVariation]] = None
    complements: Optional[List[ProductComplement]] = None
    has_promotion: Optional[bool] = None
    promotion_price: Optional[float] = None
    promotion_description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1
    selected_variation: Optional[CartItemVariation] = None
    selected_complements: List[CartItemComplement] = Field(default_factory=list)
    notes: Optional[str] = None


class CreateOrderRequest(BaseModel):
    merchant_id: str
    order_type: OrderType
    items: List[CartItem]
    delivery_address: Optional[Dict[str, Any]] = None
    customer_notes: Optional[str] = None


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus
    merchant_notes: Optional[str] = None


class AssignDeliveryRequest(BaseModel):
    deliverer_id: str  # ID do sub-usuário entregador


class MerchantSettingsUpdate(BaseModel):
    """Atualização das configurações de delivery/pickup do lojista"""
    accepts_pickup: Optional[bool] = None
    accepts_delivery: Optional[bool] = None
    delivery_fee: Optional[float] = None
    delivery_radius_km: Optional[float] = None
    estimated_delivery_time: Optional[int] = None
