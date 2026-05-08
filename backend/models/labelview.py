from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from uuid import uuid4

# ============================================
# COLABORADORES E EQUIPE
# ============================================

class LabelviewEmployee(BaseModel):
    """Colaborador/Funcionário da Labelview"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    full_name: str
    cpf: str
    email: EmailStr
    phone: str
    role: str  # gerente_regional, consultor, funcionario, etc
    regional: Optional[str] = None  # Região de atuação
    commission_percentage: float = 0.0  # % de comissão
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class LabelviewRegionalManager(BaseModel):
    """Gerente Regional"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    employee_id: str  # Referência ao colaborador
    full_name: str
    email: EmailStr
    phone: str
    regional: str  # Sul, Sudeste, Norte, etc
    cities: List[str] = []  # Cidades sob gestão
    commission_percentage: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LabelviewConsultant(BaseModel):
    """Consultor de vendas"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    employee_id: Optional[str] = None  # Se for funcionário
    full_name: str
    email: EmailStr
    phone: str
    cpf: str
    regional: Optional[str] = None
    manager_id: Optional[str] = None  # Gerente responsável
    commission_percentage: float = 0.0
    total_sales: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================
# COMISSÕES E DISTRIBUIÇÃO
# ============================================

class LabelviewCommissionRules(BaseModel):
    """Regras de comissão e distribuição"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    labelview_percentage: float = 50.0  # LabelView
    agitoauto_percentage: float = 20.0  # AgitoAuto
    mini_agency_percentage: float = 10.0  # Mini Agência (se indicado)
    consultant_percentage: float = 10.0  # Consultor (se indicado)
    cashback_percentage: float = 10.0  # Total cashback
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

# ============================================
# CLIENTES E CONTRATOS
# ============================================

class VehicleData(BaseModel):
    """Dados do veículo"""
    plate: str
    fipe_code: Optional[str] = None
    brand: str
    model: str
    year: int
    color: str
    chassis: Optional[str] = None
    renavam: Optional[str] = None
    fipe_value: float = 0.0
    
class VehiclePhotos(BaseModel):
    """Fotos da vistoria"""
    front: Optional[str] = None
    back: Optional[str] = None
    right_side: Optional[str] = None
    left_side: Optional[str] = None
    dashboard: Optional[str] = None
    document: Optional[str] = None
    cnh: Optional[str] = None
    others: List[str] = []

class LabelviewClient(BaseModel):
    """Cliente com proteção veicular"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    # Dados pessoais
    full_name: str
    cpf: str
    rg: Optional[str] = None
    birth_date: Optional[str] = None
    email: EmailStr
    phone: str
    
    # Endereço
    cep: str
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    
    # Dados do veículo
    vehicle: VehicleData
    vehicle_photos: VehiclePhotos
    
    # Contrato
    contract_id: Optional[str] = None
    contract_signed_at: Optional[datetime] = None
    contract_signature: Optional[str] = None  # Base64 ou URL
    contract_ip: Optional[str] = None
    
    # Proteção
    protection_plan: str  # Nome do plano/combo
    protection_value: float
    payment_day: int  # Dia do mês para cobrança (1-31)
    start_date: datetime
    next_payment_date: datetime
    is_active: bool = True
    
    # Rastreador
    tracker_id: Optional[str] = None
    tracker_number: Optional[str] = None
    
    # Indicação
    consultant_id: Optional[str] = None
    mini_agency_id: Optional[str] = None
    
    # Financeiro
    total_paid: float = 0.0
    payments_count: int = 0
    last_payment_date: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# ============================================
# ATIVIDADES E SOLICITAÇÕES
# ============================================

class ServiceRequest(BaseModel):
    """Solicitação de serviço/assistência"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: str
    type: str  # assistencia_24h, sinistro, oficina, troca_vidros, assistencia_terceiros
    status: str = "pending"  # pending, in_progress, completed, cancelled
    description: str
    location: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent
    
    # Atribuição
    assigned_to: Optional[str] = None  # ID do funcionário
    provider_id: Optional[str] = None  # ID do fornecedor
    
    # Datas
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Custos
    estimated_cost: float = 0.0
    final_cost: float = 0.0
    
    # Documentação
    photos: List[str] = []
    documents: List[str] = []
    notes: Optional[str] = None

# ============================================
# RASTREADORES
# ============================================

class Tracker(BaseModel):
    """Rastreador"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    number: str  # Número de série/identificação
    company: str  # Empresa fornecedora
    model: Optional[str] = None
    status: str = "available"  # available, installed, maintenance
    client_id: Optional[str] = None  # Cliente que está usando
    vehicle_plate: Optional[str] = None
    installation_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================
# CONTRATOS
# ============================================

class ContractTemplate(BaseModel):
    """Modelo de contrato"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    version: str = "1.0"
    content: str  # HTML ou texto do contrato com placeholders
    pdf_url: Optional[str] = None  # URL do PDF template
    variables: List[str] = []  # Lista de variáveis substituíveis {nome}, {cpf}, etc
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# ============================================
# FORNECEDORES
# ============================================

class Provider(BaseModel):
    """Fornecedor de serviços"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    type: str  # rastreador, assistencia_24h, hotel, eletricista, mecanico, 
               # oficina_mecanica, oficina_pintura, loja_acessorios
    cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    
    # Endereço
    cep: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    
    # Detalhes
    services: List[str] = []  # Serviços que oferece
    coverage_cities: List[str] = []  # Cidades que atende
    rating: float = 0.0
    is_active: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# ============================================
# PAGAMENTOS
# ============================================

class ProtectionPayment(BaseModel):
    """Registro de pagamento de proteção"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: str
    amount: float
    payment_date: datetime
    reference_month: str  # "2025-01" formato
    status: str = "paid"  # paid, pending, failed
    
    # Distribuição
    labelview_amount: float
    agitoauto_amount: float
    mini_agency_amount: float = 0.0
    consultant_amount: float = 0.0
    cashback_amount: float = 0.0
    
    transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# TABELA DE PREÇOS LABELVIEW
# ============================================

class LabelviewServicePriceTable(BaseModel):
    """Tabela de preços dos serviços Labelview por faixa FIPE"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    # Tipo de serviço
    service_type: str  # roubo_furto_pt, assistencia_24h, vidros_farois_lanternas, 
                       # carro_reserva, colisao, danos_materiais_terceiros
    
    # Valores
    valor_servico: float  # Valor que a Labelview cobra pelo serviço
    valor_fipe_min: float  # Valor FIPE mínimo da faixa (ex: 10000.00)
    valor_fipe_max: float  # Valor FIPE máximo da faixa (ex: 20000.00)
    
    # Descrição
    descricao: Optional[str] = None  # Detalhes sobre o serviço nesta faixa
    
    # Controle
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None  # ID do usuário master que criou
