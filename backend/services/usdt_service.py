"""
Serviço para operações USDT no AgitoCoin
"""
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient
from models.usdt_operations import USDTOperation, ExternalWallet, USDT_FEE_RATE, MAX_DEPOSIT_AMOUNT, MIN_OPERATION_AMOUNT
from services.xgate_service import XGateService

logger = logging.getLogger(__name__)

class USDTService:
    def __init__(self, xgate_email: str = None, xgate_password: str = None, xgate_api_url: str = None):
        # MongoDB connection
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db_name = os.environ.get('DB_NAME', 'transmill')
        self.db = client[db_name]
        # XGate por white label (fallback para .env)
        self.xgate_service = XGateService(email=xgate_email, password=xgate_password, api_url=xgate_api_url)
        
    def calculate_usdt_fee(self, amount_brl: float) -> Tuple[float, float]:
        """
        Calcula taxa e valor líquido para operações USDT
        
        Args:
            amount_brl: Valor em reais
            
        Returns:
            Tuple[taxa_brl, valor_liquido_brl]
        """
        fee_amount = amount_brl * USDT_FEE_RATE
        net_amount = amount_brl - fee_amount
        return fee_amount, net_amount
    
    async def get_usdt_rate(self) -> float:
        """Obtém cotação USDT/BRL via XGate"""
        try:
            # Usar a mesma API do XGate para cotação
            rate_data = await self.xgate_service.get_usdt_rate()
            return float(rate_data.get('rate', 5.50))  # Fallback 5.50 se API falhar
        except Exception as e:
            logger.error(f"Erro ao obter cotação USDT: {e}")
            return 5.50  # Cotação fallback
    
    async def create_usdt_deposit(self, user_id: str, amount_brl: float) -> Dict:
        """
        Cria depósito USDT com taxa
        
        Args:
            user_id: ID do usuário
            amount_brl: Valor em reais a ser depositado
            
        Returns:
            Dict com dados da operação
        """
        try:
            # Validações
            if amount_brl < MIN_OPERATION_AMOUNT:
                raise ValueError(f"Valor mínimo: R$ {MIN_OPERATION_AMOUNT}")
            
            if amount_brl > MAX_DEPOSIT_AMOUNT:
                raise ValueError(f"Valor máximo por operação: R$ {MAX_DEPOSIT_AMOUNT:,.2f}")
            
            # Obter cotação USDT
            usdt_rate = await self.get_usdt_rate()
            
            # Calcular taxa e valor líquido
            fee_amount, net_amount = self.calculate_usdt_fee(amount_brl)
            amount_usdt = net_amount / usdt_rate
            
            # Criar operação
            operation = USDTOperation(
                user_id=user_id,
                operation_type='deposit',
                amount_brl=amount_brl,
                amount_usdt=amount_usdt,
                fee_amount_brl=fee_amount,
                net_amount_brl=net_amount,
                usdt_rate=usdt_rate,
                status='pending'
            )
            
            # Salvar no banco
            self.db.usdt_operations.insert_one(operation.to_dict())
            
            logger.info(f"Depósito USDT criado: {operation.operation_id} - Usuário: {user_id} - Valor: R$ {amount_brl}")
            
            return {
                'success': True,
                'operation_id': operation.operation_id,
                'amount_brl': amount_brl,
                'fee_amount': fee_amount,
                'net_amount': net_amount,
                'amount_usdt': amount_usdt,
                'usdt_rate': usdt_rate,
                'message': 'Depósito USDT criado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar depósito USDT: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Erro ao processar depósito USDT'
            }
    
    async def confirm_usdt_deposit(self, operation_id: str) -> Dict:
        """Confirma depósito USDT e credita saldo"""
        try:
            # Buscar operação
            operation_data = self.db.usdt_operations.find_one({'operation_id': operation_id})
            if not operation_data:
                raise ValueError("Operação não encontrada")
            
            operation = USDTOperation.from_dict(operation_data)
            
            if operation.status != 'pending':
                raise ValueError("Operação já processada")
            
            # Creditar saldo líquido para o usuário
            user = self.db.users.find_one({'user_id': operation.user_id})
            if not user:
                raise ValueError("Usuário não encontrado")
            
            current_balance = float(user.get('balance', 0))
            new_balance = current_balance + operation.net_amount_brl
            
            # Atualizar saldo do usuário
            self.db.users.update_one(
                {'user_id': operation.user_id},
                {'$set': {'balance': new_balance}}
            )
            
            # Creditar comissão para master
            await self._credit_master_commission(operation.fee_amount_brl, 'Taxa conversão USDT')
            
            # Criar transações no extrato
            await self._create_deposit_transactions(operation)
            
            # Atualizar status da operação
            self.db.usdt_operations.update_one(
                {'operation_id': operation_id},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Depósito USDT confirmado: {operation_id}")
            
            return {
                'success': True,
                'message': 'Depósito USDT confirmado com sucesso',
                'new_balance': new_balance
            }
            
        except Exception as e:
            logger.error(f"Erro ao confirmar depósito USDT: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def create_withdrawal(self, user_id: str, amount_brl: float, currency: str = 'BRL') -> Dict:
        """
        Cria saque com taxa (BRL ou USDT)
        
        Args:
            user_id: ID do usuário
            amount_brl: Valor do saque em reais
            currency: 'BRL' ou 'USDT'
        """
        try:
            # Validações
            user = self.db.users.find_one({'user_id': user_id})
            if not user:
                raise ValueError("Usuário não encontrado")
            
            current_balance = float(user.get('balance', 0))
            
            # Calcular taxa
            fee_amount, net_amount = self.calculate_usdt_fee(amount_brl)
            
            if amount_brl > current_balance:
                raise ValueError("Saldo insuficiente")
            
            # Obter cotação se for USDT
            usdt_rate = await self.get_usdt_rate() if currency == 'USDT' else 0
            amount_usdt = net_amount / usdt_rate if currency == 'USDT' else 0
            
            # Criar operação
            operation = USDTOperation(
                user_id=user_id,
                operation_type='withdrawal',
                amount_brl=amount_brl,
                amount_usdt=amount_usdt,
                fee_amount_brl=fee_amount,
                net_amount_brl=net_amount,
                usdt_rate=usdt_rate,
                status='pending',
                metadata={'currency': currency}
            )
            
            # Salvar no banco
            self.db.usdt_operations.insert_one(operation.to_dict())
            
            return {
                'success': True,
                'operation_id': operation.operation_id,
                'amount_brl': amount_brl,
                'fee_amount': fee_amount,
                'net_amount': net_amount,
                'currency': currency,
                'message': f'Saque em {currency} criado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar saque: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def create_external_transfer(self, user_id: str, amount_usdt: float, wallet_address: str) -> Dict:
        """Cria transferência para carteira externa"""
        try:
            # Validar carteira
            if not self._validate_wallet_address(wallet_address):
                raise ValueError("Endereço de carteira inválido")
            
            # Obter cotação
            usdt_rate = await self.get_usdt_rate()
            amount_brl = amount_usdt * usdt_rate
            
            # Calcular taxa
            fee_amount, net_amount_brl = self.calculate_usdt_fee(amount_brl)
            net_usdt = amount_usdt - (fee_amount / usdt_rate)
            
            # Verificar saldo
            user = self.db.users.find_one({'user_id': user_id})
            if not user:
                raise ValueError("Usuário não encontrado")
            
            current_balance = float(user.get('balance', 0))
            if amount_brl > current_balance:
                raise ValueError("Saldo insuficiente")
            
            # Criar operação (requer aprovação)
            operation = USDTOperation(
                user_id=user_id,
                operation_type='external_transfer',
                amount_brl=amount_brl,
                amount_usdt=amount_usdt,
                fee_amount_brl=fee_amount,
                net_amount_brl=net_amount_brl,
                usdt_rate=usdt_rate,
                status='pending',
                external_wallet=wallet_address,
                requires_approval=True,
                metadata={'net_usdt': net_usdt}
            )
            
            # Salvar no banco
            self.db.usdt_operations.insert_one(operation.to_dict())
            
            return {
                'success': True,
                'operation_id': operation.operation_id,
                'amount_usdt': amount_usdt,
                'fee_amount': fee_amount,
                'net_usdt': net_usdt,
                'requires_approval': True,
                'message': 'Transferência criada. Aguardando aprovação do master.'
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar transferência externa: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_pending_approvals(self) -> List[Dict]:
        """Obtém operações pendentes de aprovação"""
        try:
            operations = self.db.usdt_operations.find({
                'requires_approval': True,
                'status': 'pending'
            }).sort('created_at', -1)
            
            result = []
            for op_data in operations:
                operation = USDTOperation.from_dict(op_data)
                
                # Buscar dados do usuário
                user = self.db.users.find_one({'user_id': operation.user_id})
                user_name = user.get('full_name', 'N/A') if user else 'N/A'
                
                result.append({
                    **operation.to_dict(),
                    'user_name': user_name
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Erro ao buscar aprovações pendentes: {e}")
            return []
    
    async def approve_operation(self, operation_id: str, master_user_id: str) -> Dict:
        """Aprova operação pelo master"""
        try:
            operation_data = self.db.usdt_operations.find_one({'operation_id': operation_id})
            if not operation_data:
                raise ValueError("Operação não encontrada")
            
            operation = USDTOperation.from_dict(operation_data)
            
            if operation.status != 'pending':
                raise ValueError("Operação já processada")
            
            # Atualizar operação
            self.db.usdt_operations.update_one(
                {'operation_id': operation_id},
                {
                    '$set': {
                        'status': 'processing',
                        'approved_by': master_user_id,
                        'approved_at': datetime.utcnow()
                    }
                }
            )
            
            # Processar conforme tipo
            if operation.operation_type == 'external_transfer':
                await self._process_external_transfer(operation)
            elif operation.operation_type == 'withdrawal':
                await self._process_withdrawal(operation)
            
            return {
                'success': True,
                'message': 'Operação aprovada com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao aprovar operação: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _validate_wallet_address(self, address: str) -> bool:
        """Valida endereço de carteira USDT"""
        # TRC20 addresses start with 'T' and are 34 characters
        if address.startswith('T') and len(address) == 34:
            return True
        # ERC20 addresses start with '0x' and are 42 characters  
        if address.startswith('0x') and len(address) == 42:
            return True
        return False
    
    async def _credit_master_commission(self, amount: float, description: str):
        """Credita comissão para conta master"""
        try:
            # Buscar conta master
            master = self.db.users.find_one({'is_master_account': True})
            if master:
                current_balance = float(master.get('balance', 0))
                new_balance = current_balance + amount
                
                self.db.users.update_one(
                    {'user_id': master['user_id']},
                    {'$set': {'balance': new_balance}}
                )
                
                # Criar transação no extrato master
                self.db.transactions.insert_one({
                    'transaction_id': str(uuid.uuid4()),
                    'user_id': master['user_id'],
                    'type': 'credit',
                    'amount': amount,
                    'description': f'Comissão - {description}',
                    'status': 'completed',
                    'created_at': datetime.utcnow()
                })
                
        except Exception as e:
            logger.error(f"Erro ao creditar comissão master: {e}")
    
    async def _create_deposit_transactions(self, operation: USDTOperation):
        """Cria transações do depósito no extrato"""
        import uuid
        try:
            # Transação de crédito (valor líquido)
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'credit',
                'amount': operation.net_amount_brl,
                'description': 'Depósito PIX USDT',
                'status': 'completed',
                'created_at': operation.created_at,
                'metadata': {
                    'operation_id': operation.operation_id,
                    'usdt_amount': operation.amount_usdt,
                    'usdt_rate': operation.usdt_rate
                }
            })
            
            # Transação de taxa (débito)
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'debit',
                'amount': operation.fee_amount_brl,
                'description': 'Taxa conversão depósito USDT',
                'status': 'completed',
                'created_at': operation.created_at,
                'metadata': {
                    'operation_id': operation.operation_id,
                    'fee_percentage': operation.fee_percentage
                }
            })
            
        except Exception as e:
            logger.error(f"Erro ao criar transações do depósito: {e}")
    
    async def _process_external_transfer(self, operation: USDTOperation):
        """Processa transferência externa aprovada"""
        try:
            # Debitar saldo do usuário
            user = self.db.users.find_one({'user_id': operation.user_id})
            current_balance = float(user.get('balance', 0))
            new_balance = current_balance - operation.amount_brl
            
            self.db.users.update_one(
                {'user_id': operation.user_id},
                {'$set': {'balance': new_balance}}
            )
            
            # Creditar comissão para master
            await self._credit_master_commission(operation.fee_amount_brl, 'Transferência USDT')
            
            # Criar transações
            import uuid
            # Débito do valor total
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'debit',
                'amount': operation.net_amount_brl,
                'description': 'Transferência USDT Externa',
                'status': 'completed',
                'created_at': datetime.utcnow(),
                'metadata': {
                    'operation_id': operation.operation_id,
                    'wallet_address': operation.external_wallet,
                    'usdt_amount': operation.metadata.get('net_usdt', 0)
                }
            })
            
            # Débito da taxa
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'debit',
                'amount': operation.fee_amount_brl,
                'description': 'Taxa transferência USDT',
                'status': 'completed',
                'created_at': datetime.utcnow(),
                'metadata': {
                    'operation_id': operation.operation_id,
                    'fee_percentage': operation.fee_percentage
                }
            })
            
            # Atualizar status
            self.db.usdt_operations.update_one(
                {'operation_id': operation.operation_id},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow()
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar transferência externa: {e}")
            raise e
    
    async def _process_withdrawal(self, operation: USDTOperation):
        """Processa saque aprovado"""
        try:
            # Debitar saldo do usuário
            user = self.db.users.find_one({'user_id': operation.user_id})
            current_balance = float(user.get('balance', 0))
            new_balance = current_balance - operation.amount_brl
            
            self.db.users.update_one(
                {'user_id': operation.user_id},
                {'$set': {'balance': new_balance}}
            )
            
            # Creditar comissão para master
            await self._credit_master_commission(operation.fee_amount_brl, 'Taxa de saque')
            
            # Criar transações
            import uuid
            currency = operation.metadata.get('currency', 'BRL')
            
            # Débito do saque
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'debit',
                'amount': operation.net_amount_brl,
                'description': f'Saque {currency}',
                'status': 'completed',
                'created_at': datetime.utcnow(),
                'metadata': {
                    'operation_id': operation.operation_id,
                    'currency': currency
                }
            })
            
            # Débito da taxa
            self.db.transactions.insert_one({
                'transaction_id': str(uuid.uuid4()),
                'user_id': operation.user_id,
                'type': 'debit',
                'amount': operation.fee_amount_brl,
                'description': 'Taxa de saque',
                'status': 'completed',
                'created_at': datetime.utcnow(),
                'metadata': {
                    'operation_id': operation.operation_id,
                    'fee_percentage': operation.fee_percentage
                }
            })
            
            # Atualizar status
            self.db.usdt_operations.update_one(
                {'operation_id': operation.operation_id},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow()
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar saque: {e}")
            raise e