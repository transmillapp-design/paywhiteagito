#!/usr/bin/env python3
"""
FIPE API Integration Test
Test the new FIPE integration with api.invertexto.com
"""

import sys
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🎯 TESTE CRÍTICO: IMPORTAÇÃO DE DADOS DA API FIPE")
    print("=" * 80)
    
    # Initialize tester
    tester = AgitoCoinTester()
    
    # Run FIPE test
    success = tester.test_fipe_api_integration_critical()
    
    if success:
        print("\n✅ TESTE FIPE CONCLUÍDO COM SUCESSO!")
        return 0
    else:
        print("\n❌ TESTE FIPE FALHOU!")
        return 1

if __name__ == "__main__":
    exit(main())