#!/usr/bin/env python3
"""
Test script for business segments ObjectId fix
"""

import sys
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🚨 EXECUTANDO TESTE ESPECÍFICO: CORREÇÃO ERRO 500 NA CRIAÇÃO DE SEGMENTOS")
    print("=" * 80)
    
    tester = AgitoCoinTester()
    
    # Run the specific test
    success = tester.test_business_segments_objectid_fix()
    
    # Print summary
    tester.print_test_summary()
    
    if success:
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
        sys.exit(0)
    else:
        print("\n❌ TESTE FALHOU!")
        sys.exit(1)

if __name__ == "__main__":
    main()