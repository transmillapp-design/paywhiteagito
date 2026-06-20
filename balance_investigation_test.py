#!/usr/bin/env python3
"""
INVESTIGAÇÃO URGENTE: Inconsistência entre saldos dos cards e extrato
Teste específico para verificar discrepâncias entre saldos apresentados nos cards do dashboard 
e os valores calculados baseados no histórico de transações.
"""

import requests
import json
import time
from typing import Dict, Any, List
from decimal import Decimal, ROUND_HALF_UP

class BalanceInvestigationTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.investigation_results = []
        
    def log_investigation(self, step: str, success: bool, details: str = "", data: Any = None):
        """Log investigation results"""
        result = {
            "step": step,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.investigation_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {step}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user and return token and user data"""
        login_data = {
            "email": email,
            "password": password
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "token": data["access_token"],
                "user": data["user"],
                "success": True
            }
        else:
            return {
                "success": False,
                "error": f"Status: {response.status_code}, Error: {response.text}"
            }

    def get_user_balance(self, token: str) -> Dict[str, Any]:
        """Get user balance from cards"""
        response = self.make_request("GET", "/user/balance", token=token)
        
        if response.status_code == 200:
            return {
                "success": True,
                "balance_data": response.json()
            }
        else:
            return {
                "success": False,
                "error": f"Status: {response.status_code}, Error: {response.text}"
            }

    def get_transaction_history(self, token: str) -> Dict[str, Any]:
        """Get user transaction history"""
        response = self.make_request("GET", "/transactions/history", token=token)
        
        if response.status_code == 200:
            return {
                "success": True,
                "transactions": response.json()
            }
        else:
            return {
                "success": False,
                "error": f"Status: {response.status_code}, Error: {response.text}"
            }

    def calculate_balance_from_transactions(self, transactions: List[Dict]) -> Dict[str, Decimal]:
        """Calculate balance manually based on transaction history"""
        balance = Decimal('0.00')
        cashback_balance = Decimal('0.00')
        platform_balance = Decimal('0.00')
        
        transaction_summary = {
            'deposits': [],
            'payments': [],
            'withdrawals': [],
            'cashbacks': [],
            'sales': [],
            'referral_bonuses': [],
            'platform_commissions': [],
            'withdrawal_fees': [],
            'other': []
        }
        
        for transaction in transactions:
            tx_type = transaction.get('transaction_type', '')
            amount = Decimal(str(transaction.get('amount', 0)))
            cashback_amount = Decimal(str(transaction.get('cashback_amount', 0)))
            
            # Categorize and calculate based on transaction type
            if tx_type == 'deposit':
                balance += amount
                transaction_summary['deposits'].append({
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type == 'payment':
                balance -= amount  # Debit payment amount
                cashback_balance += cashback_amount  # Credit cashback
                transaction_summary['payments'].append({
                    'amount': amount,
                    'cashback': cashback_amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type == 'withdrawal':
                balance -= amount
                transaction_summary['withdrawals'].append({
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type == 'withdrawal_fee':
                balance -= amount
                transaction_summary['withdrawal_fees'].append({
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type == 'sale':
                balance += amount
                transaction_summary['sales'].append({
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type in ['referral_bonus_client', 'referral_bonus_merchant']:
                cashback_balance += amount
                transaction_summary['referral_bonuses'].append({
                    'amount': amount,
                    'type': tx_type,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            elif tx_type == 'platform_commission':
                platform_balance += amount
                transaction_summary['platform_commissions'].append({
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
                
            else:
                transaction_summary['other'].append({
                    'type': tx_type,
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'created_at': transaction.get('created_at', '')
                })
        
        return {
            'calculated_balance': balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            'calculated_cashback_balance': cashback_balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            'calculated_platform_balance': platform_balance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            'transaction_summary': transaction_summary
        }

    def compare_balances(self, card_balance: Dict, calculated_balance: Dict, user_type: str) -> Dict[str, Any]:
        """Compare card balance with calculated balance"""
        
        card_main = Decimal(str(card_balance.get('balance', 0)))
        card_cashback = Decimal(str(card_balance.get('cashback_balance', 0)))
        card_total = Decimal(str(card_balance.get('total', 0)))
        
        calc_main = calculated_balance['calculated_balance']
        calc_cashback = calculated_balance['calculated_cashback_balance']
        calc_total = calc_main + calc_cashback
        
        # Calculate differences
        main_diff = card_main - calc_main
        cashback_diff = card_cashback - calc_cashback
        total_diff = card_total - calc_total
        
        # Determine if there are discrepancies (tolerance of 0.01 for rounding)
        tolerance = Decimal('0.01')
        
        discrepancies = {
            'main_balance': abs(main_diff) > tolerance,
            'cashback_balance': abs(cashback_diff) > tolerance,
            'total_balance': abs(total_diff) > tolerance
        }
        
        return {
            'user_type': user_type,
            'card_balances': {
                'balance': float(card_main),
                'cashback_balance': float(card_cashback),
                'total': float(card_total)
            },
            'calculated_balances': {
                'balance': float(calc_main),
                'cashback_balance': float(calc_cashback),
                'total': float(calc_total)
            },
            'differences': {
                'balance': float(main_diff),
                'cashback_balance': float(cashback_diff),
                'total': float(total_diff)
            },
            'discrepancies_found': any(discrepancies.values()),
            'discrepancy_details': discrepancies,
            'transaction_summary': calculated_balance['transaction_summary']
        }

    def investigate_user_balance(self, email: str, password: str, user_type: str) -> Dict[str, Any]:
        """Complete balance investigation for a user"""
        
        print(f"\n{'='*60}")
        print(f"INVESTIGANDO USUÁRIO: {email} ({user_type})")
        print(f"{'='*60}")
        
        # Step 1: Login
        login_result = self.login_user(email, password)
        if not login_result['success']:
            self.log_investigation(f"Login {user_type}", False, login_result['error'])
            return {"success": False, "error": "Login failed"}
        
        token = login_result['token']
        user_data = login_result['user']
        
        self.log_investigation(f"Login {user_type}", True, 
                             f"Login realizado para: {user_data.get('full_name', email)}")
        
        # Step 2: Get card balance
        balance_result = self.get_user_balance(token)
        if not balance_result['success']:
            self.log_investigation(f"Card Balance {user_type}", False, balance_result['error'])
            return {"success": False, "error": "Balance retrieval failed"}
        
        card_balance = balance_result['balance_data']
        self.log_investigation(f"Card Balance {user_type}", True, 
                             f"Saldo Principal: R$ {card_balance['balance']:.2f}, "
                             f"Cashback: R$ {card_balance['cashback_balance']:.2f}, "
                             f"Total: R$ {card_balance['total']:.2f}")
        
        # Step 3: Get transaction history
        history_result = self.get_transaction_history(token)
        if not history_result['success']:
            self.log_investigation(f"Transaction History {user_type}", False, history_result['error'])
            return {"success": False, "error": "Transaction history retrieval failed"}
        
        transactions = history_result['transactions']
        self.log_investigation(f"Transaction History {user_type}", True, 
                             f"{len(transactions)} transações encontradas")
        
        # Step 4: Calculate balance from transactions
        calculated_result = self.calculate_balance_from_transactions(transactions)
        
        calc_balance = calculated_result['calculated_balance']
        calc_cashback = calculated_result['calculated_cashback_balance']
        calc_total = calc_balance + calc_cashback
        
        self.log_investigation(f"Calculated Balance {user_type}", True, 
                             f"Calculado - Principal: R$ {calc_balance:.2f}, "
                             f"Cashback: R$ {calc_cashback:.2f}, "
                             f"Total: R$ {calc_total:.2f}")
        
        # Step 5: Compare balances
        comparison = self.compare_balances(card_balance, calculated_result, user_type)
        
        if comparison['discrepancies_found']:
            discrepancy_details = []
            if comparison['discrepancy_details']['main_balance']:
                discrepancy_details.append(f"Principal: R$ {comparison['differences']['balance']:.2f}")
            if comparison['discrepancy_details']['cashback_balance']:
                discrepancy_details.append(f"Cashback: R$ {comparison['differences']['cashback_balance']:.2f}")
            if comparison['discrepancy_details']['total_balance']:
                discrepancy_details.append(f"Total: R$ {comparison['differences']['total']:.2f}")
            
            self.log_investigation(f"Balance Comparison {user_type}", False, 
                                 f"🚨 DISCREPÂNCIAS ENCONTRADAS: {', '.join(discrepancy_details)}")
        else:
            self.log_investigation(f"Balance Comparison {user_type}", True, 
                                 "✅ Saldos dos cards batem com o extrato")
        
        return {
            "success": True,
            "user_data": user_data,
            "comparison": comparison,
            "raw_transactions": transactions
        }

    def test_new_transaction_flow(self) -> Dict[str, Any]:
        """Test a complete transaction flow to verify balance updates"""
        
        print(f"\n{'='*60}")
        print("TESTANDO FLUXO COMPLETO DE TRANSAÇÃO")
        print(f"{'='*60}")
        
        # Login as cliente and lojista
        cliente_login = self.login_user("cliente@demo.com", "demo123")
        lojista_login = self.login_user("lojista@demo.com", "demo123")
        
        if not cliente_login['success'] or not lojista_login['success']:
            self.log_investigation("Transaction Flow Setup", False, "Falha no login dos usuários")
            return {"success": False}
        
        cliente_token = cliente_login['token']
        lojista_token = lojista_login['token']
        
        # Get initial balances
        cliente_initial = self.get_user_balance(cliente_token)
        lojista_initial = self.get_user_balance(lojista_token)
        
        if not cliente_initial['success'] or not lojista_initial['success']:
            self.log_investigation("Initial Balance Check", False, "Falha ao obter saldos iniciais")
            return {"success": False}
        
        self.log_investigation("Initial Balances", True, 
                             f"Cliente: R$ {cliente_initial['balance_data']['total']:.2f}, "
                             f"Lojista: R$ {lojista_initial['balance_data']['balance']:.2f}")
        
        # Generate QR Code from lojista
        qr_request = {"amount": 25.50}
        qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=lojista_token)
        
        if qr_response.status_code != 200:
            self.log_investigation("QR Generation", False, f"Falha ao gerar QR: {qr_response.status_code}")
            return {"success": False}
        
        qr_data = qr_response.json()
        self.log_investigation("QR Generation", True, 
                             f"QR Code gerado para R$ {qr_data['amount']:.2f}")
        
        # Process payment
        payment_request = {
            "amount": qr_data['amount'],
            "qr_code": qr_data['qr_code']
        }
        
        payment_response = self.make_request("POST", "/transactions/payment", payment_request, token=cliente_token)
        
        if payment_response.status_code != 200:
            self.log_investigation("Payment Processing", False, 
                                 f"Falha no pagamento: {payment_response.status_code} - {payment_response.text}")
            return {"success": False}
        
        payment_data = payment_response.json()
        self.log_investigation("Payment Processing", True, 
                             f"Pagamento processado - Cashback: R$ {payment_data['cashback_earned']:.2f}")
        
        # Get final balances
        cliente_final = self.get_user_balance(cliente_token)
        lojista_final = self.get_user_balance(lojista_token)
        
        if not cliente_final['success'] or not lojista_final['success']:
            self.log_investigation("Final Balance Check", False, "Falha ao obter saldos finais")
            return {"success": False}
        
        # Calculate expected changes
        payment_amount = Decimal(str(qr_data['amount']))
        cashback_earned = Decimal(str(payment_data['cashback_earned']))
        
        expected_cliente_balance_change = -payment_amount
        expected_cliente_cashback_change = cashback_earned
        
        # Verify balance changes
        cliente_balance_change = (Decimal(str(cliente_final['balance_data']['balance'])) - 
                                Decimal(str(cliente_initial['balance_data']['balance'])))
        cliente_cashback_change = (Decimal(str(cliente_final['balance_data']['cashback_balance'])) - 
                                 Decimal(str(cliente_initial['balance_data']['cashback_balance'])))
        
        balance_correct = abs(cliente_balance_change - expected_cliente_balance_change) <= Decimal('0.01')
        cashback_correct = abs(cliente_cashback_change - expected_cliente_cashback_change) <= Decimal('0.01')
        
        if balance_correct and cashback_correct:
            self.log_investigation("Balance Update Verification", True, 
                                 f"✅ Saldos atualizados corretamente - "
                                 f"Balance: R$ {cliente_balance_change:.2f}, "
                                 f"Cashback: R$ {cliente_cashback_change:.2f}")
        else:
            self.log_investigation("Balance Update Verification", False, 
                                 f"❌ Saldos não atualizaram corretamente - "
                                 f"Expected Balance: R$ {expected_cliente_balance_change:.2f}, "
                                 f"Actual: R$ {cliente_balance_change:.2f}, "
                                 f"Expected Cashback: R$ {expected_cliente_cashback_change:.2f}, "
                                 f"Actual: R$ {cliente_cashback_change:.2f}")
        
        return {
            "success": True,
            "payment_amount": float(payment_amount),
            "cashback_earned": float(cashback_earned),
            "balance_changes": {
                "cliente_balance": float(cliente_balance_change),
                "cliente_cashback": float(cliente_cashback_change)
            },
            "verification_passed": balance_correct and cashback_correct
        }

    def run_complete_investigation(self):
        """Run complete balance investigation"""
        
        print("🚨 INVESTIGAÇÃO URGENTE: INCONSISTÊNCIA ENTRE SALDOS DOS CARDS E EXTRATO")
        print("="*80)
        
        try:
            # Investigation 1: Cliente
            print(f"\n📋 INVESTIGAÇÃO 1: CLIENTE")
            cliente_result = self.investigate_user_balance("cliente@demo.com", "demo123", "cliente")
            
            # Investigation 2: Lojista  
            print(f"\n📋 INVESTIGAÇÃO 2: LOJISTA")
            lojista_result = self.investigate_user_balance("lojista@demo.com", "demo123", "lojista")
            
            # Investigation 3: Master (if accessible)
            print(f"\n📋 INVESTIGAÇÃO 3: CONTA MASTER")
            try:
                master_result = self.investigate_user_balance("master@agitocash.com", "master123", "master")
            except Exception as e:
                self.log_investigation("Master Investigation", False, f"Erro ao investigar master: {str(e)}")
                master_result = {"success": False}
            
            # Investigation 4: Test new transaction flow
            print(f"\n📋 INVESTIGAÇÃO 4: FLUXO DE NOVA TRANSAÇÃO")
            transaction_test = self.test_new_transaction_flow()
            
            # Summary
            print(f"\n{'='*80}")
            print("📊 RESUMO DA INVESTIGAÇÃO")
            print(f"{'='*80}")
            
            total_discrepancies = 0
            
            if cliente_result.get('success') and cliente_result['comparison']['discrepancies_found']:
                total_discrepancies += 1
                print(f"❌ CLIENTE: Discrepâncias encontradas")
                self.print_detailed_discrepancy(cliente_result['comparison'])
            elif cliente_result.get('success'):
                print(f"✅ CLIENTE: Saldos consistentes")
            
            if lojista_result.get('success') and lojista_result['comparison']['discrepancies_found']:
                total_discrepancies += 1
                print(f"❌ LOJISTA: Discrepâncias encontradas")
                self.print_detailed_discrepancy(lojista_result['comparison'])
            elif lojista_result.get('success'):
                print(f"✅ LOJISTA: Saldos consistentes")
            
            if master_result.get('success') and master_result['comparison']['discrepancies_found']:
                total_discrepancies += 1
                print(f"❌ MASTER: Discrepâncias encontradas")
                self.print_detailed_discrepancy(master_result['comparison'])
            elif master_result.get('success'):
                print(f"✅ MASTER: Saldos consistentes")
            
            if transaction_test.get('success') and not transaction_test['verification_passed']:
                total_discrepancies += 1
                print(f"❌ NOVA TRANSAÇÃO: Saldos não atualizaram corretamente")
            elif transaction_test.get('success'):
                print(f"✅ NOVA TRANSAÇÃO: Saldos atualizaram corretamente")
            
            print(f"\n🎯 CONCLUSÃO: {total_discrepancies} discrepâncias encontradas")
            
            if total_discrepancies == 0:
                print("✅ SISTEMA FUNCIONANDO CORRETAMENTE - Não há inconsistências entre saldos dos cards e extrato")
            else:
                print("🚨 PROBLEMAS IDENTIFICADOS - Há inconsistências que precisam ser corrigidas")
            
            return {
                "cliente": cliente_result,
                "lojista": lojista_result,
                "master": master_result,
                "transaction_test": transaction_test,
                "total_discrepancies": total_discrepancies
            }
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NA INVESTIGAÇÃO: {e}")
            self.log_investigation("Critical Investigation Error", False, str(e))
            return {"success": False, "error": str(e)}

    def print_detailed_discrepancy(self, comparison: Dict[str, Any]):
        """Print detailed discrepancy information"""
        print(f"\n  📊 DETALHES DA DISCREPÂNCIA ({comparison['user_type'].upper()}):")
        print(f"     Cards    | Calculado | Diferença")
        print(f"     ---------|-----------|----------")
        
        card_bal = comparison['card_balances']
        calc_bal = comparison['calculated_balances']
        diff = comparison['differences']
        
        print(f"  Principal: R$ {card_bal['balance']:8.2f} | R$ {calc_bal['balance']:8.2f} | R$ {diff['balance']:8.2f}")
        print(f"  Cashback:  R$ {card_bal['cashback_balance']:8.2f} | R$ {calc_bal['cashback_balance']:8.2f} | R$ {diff['cashback_balance']:8.2f}")
        print(f"  Total:     R$ {card_bal['total']:8.2f} | R$ {calc_bal['total']:8.2f} | R$ {diff['total']:8.2f}")
        
        # Print transaction summary
        tx_summary = comparison['transaction_summary']
        print(f"\n  📋 RESUMO DE TRANSAÇÕES:")
        for tx_type, transactions in tx_summary.items():
            if transactions:
                total_amount = sum(Decimal(str(tx.get('amount', 0))) for tx in transactions)
                print(f"     {tx_type.replace('_', ' ').title()}: {len(transactions)} transações, Total: R$ {total_amount:.2f}")

if __name__ == "__main__":
    tester = BalanceInvestigationTester()
    results = tester.run_complete_investigation()