"""
Modelos e estruturas para Sistema de Proteção Veicular
"""
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel

# ==========================================
# COTAÇÃO
# ==========================================

class VeiculoCotacao(BaseModel):
    marca: str
    modelo: str
    ano: str
    valor_fipe: float
    codigo_fipe: Optional[str] = None

class PlanoSelecionado(BaseModel):
    plano_id: str
    nome: str
    tipo: str  # Principal ou Adicional
    valor_mensal: float
    composicao: Optional[str] = None

class Cotacao(BaseModel):
    id: Optional[str] = None
    cliente_id: str
    cliente_email: str
    cliente_nome: str
    veiculo: VeiculoCotacao
    plano_principal: PlanoSelecionado
    planos_adicionais: List[PlanoSelecionado] = []
    valor_total_mensal: float
    status: str = "rascunho"  # rascunho, aguardando_vistoria, em_analise, aguardando_contrato, ativo, cancelado
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ==========================================
# VISTORIA
# ==========================================

class FotoVistoria(BaseModel):
    campo: str  # "Frente do veículo", "Traseira", etc
    url: str  # URL da imagem no servidor
    data_base64: Optional[str] = None
    geolocalizacao: Optional[Dict] = None  # {latitude, longitude}
    data_hora: datetime
    status: str = "pendente"  # pendente, aprovado, rejeitado
    motivo_rejeicao: Optional[str] = None
    aprovado_por: Optional[str] = None
    aprovado_em: Optional[datetime] = None

class Vistoria(BaseModel):
    id: Optional[str] = None
    cotacao_id: str
    cliente_id: str
    fotos: List[FotoVistoria] = []
    status: str = "pendente"  # pendente, em_analise, aprovado, rejeitado
    total_fotos: int = 14
    fotos_aprovadas: int = 0
    created_at: Optional[datetime] = None
    finalizado_em: Optional[datetime] = None

# ==========================================
# CONTRATO
# ==========================================

class Contrato(BaseModel):
    id: Optional[str] = None
    cotacao_id: str
    cliente_id: str
    cliente_email: str
    cliente_nome: str
    dia_vencimento: int  # 1 a 15
    contrato_texto: str
    assinatura_digital: str  # Base64 da assinatura (canvas)
    aceite_termos: bool = False
    assinado_em: Optional[datetime] = None
    ip_assinatura: Optional[str] = None
    dados_empresa: Optional[Dict] = None  # Dados do Master Labelview

# ==========================================
# PROTEÇÃO ATIVA
# ==========================================

class ProtecaoAtiva(BaseModel):
    id: Optional[str] = None
    cliente_id: str
    cliente_email: str
    cotacao_id: str
    vistoria_id: str
    contrato_id: str
    veiculo: VeiculoCotacao
    plano_principal: PlanoSelecionado
    planos_adicionais: List[PlanoSelecionado] = []
    valor_mensal: float
    dia_vencimento: int
    status: str = "ativa"  # ativa, suspensa, cancelada, inadimplente
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    proximo_vencimento: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ==========================================
# NOTIFICAÇÃO
# ==========================================

class NotificacaoVistoria(BaseModel):
    id: Optional[str] = None
    tipo: str = "vistoria_pendente"
    cotacao_id: str
    vistoria_id: str
    cliente_nome: str
    veiculo_info: str  # "Fiat Uno 2024"
    created_at: datetime
    lida: bool = False
    destinatario: str = "master_labelview"
