#!/usr/bin/env python3
"""
Test script specifically for USDT router fix validation
"""

import sys
import os
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🚨 EXECUTANDO TESTE ESPECÍFICO: CORREÇÃO DO ROUTER USDT")
    print("=" * 80)
    
    tester = AgitoCoinTester()
    
    # Run the specific USDT router fix test
    try:
        result = tester.test_usdt_router_fix_validation()
        
        print("\n" + "=" * 80)
        print("📊 RESULTADO FINAL")
        print("=" * 80)
        
        if result:
            print("✅ TESTE CONCLUÍDO COM SUCESSO!")
            print("✅ Correção do router USDT funcionando")
        else:
            print("❌ TESTE FALHOU!")
            print("❌ Problema de router ainda existe")
            
    except Exception as e:
        print(f"❌ ERRO DURANTE O TESTE: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()