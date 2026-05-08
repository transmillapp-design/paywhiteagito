#!/usr/bin/env python3
"""
XGate Integration Testing Script
Test the new XGate routes implemented in AgitoCash
"""

import sys
import os
sys.path.append('/app')

from backend_test import AgitoCashTester

def main():
    print("🚨 TESTE URGENTE: INTEGRAÇÃO XGATE AGITOCASH")
    print("=" * 80)
    
    # Initialize tester
    tester = AgitoCashTester()
    
    # Run XGate integration tests
    try:
        success = tester.test_xgate_integration_urgent()
        
        # Print detailed summary
        tester.print_test_summary()
        
        if success:
            print("\n✅ INTEGRAÇÃO XGATE: TODOS OS TESTES PASSARAM")
            return 0
        else:
            print("\n❌ INTEGRAÇÃO XGATE: ALGUNS TESTES FALHARAM")
            return 1
            
    except Exception as e:
        print(f"\n❌ ERRO DURANTE TESTE XGATE: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())