#!/usr/bin/env python3
"""
Run PIX Deposit Investigation Test
"""

import sys
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🚨 INICIANDO INVESTIGAÇÃO URGENTE DO SISTEMA PIX")
    print("=" * 80)
    
    # Initialize tester
    tester = AgitoCoinTester()
    
    # Run the PIX deposit investigation
    success = tester.test_pix_deposit_urgent_investigation()
    
    print("\n" + "=" * 80)
    if success:
        print("✅ INVESTIGAÇÃO CONCLUÍDA: Sistema PIX funcionando corretamente")
    else:
        print("❌ INVESTIGAÇÃO CONCLUÍDA: Problemas identificados no sistema PIX")
    
    # Print all test results
    print(f"\nRESUMO DETALHADO DOS TESTES:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    
    return success

if __name__ == "__main__":
    main()