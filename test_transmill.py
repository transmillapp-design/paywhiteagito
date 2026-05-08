#!/usr/bin/env python3
"""
Test script for Transmill complete pre-deploy verification
"""

import sys
import os
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🔍 VERIFICAÇÃO COMPLETA PRÉ-DEPLOY - SISTEMA TRANSMILL")
    print("=" * 80)
    
    # Initialize tester with correct URL
    tester = AgitoCoinTester('http://localhost:8001/api')
    
    # Run the test
    try:
        success = tester.test_transmill_complete_pre_deploy_verification()
        
        print('\n' + '='*80)
        if success:
            print('✅ RESULTADO FINAL: Sistema 100% funcional e pronto para deploy!')
        else:
            print('❌ RESULTADO FINAL: Problemas identificados - correções necessárias')
        print('='*80)
        
        return success
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)