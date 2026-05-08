#!/usr/bin/env python3
"""
Test script for CPF functionality
"""

import sys
import os
sys.path.append('/app')

from backend_test import AgitoCoinTester

def main():
    print("🎯 INICIANDO TESTE ESPECÍFICO DA FUNCIONALIDADE CPF")
    print("=" * 80)
    
    tester = AgitoCoinTester()
    
    try:
        success = tester.test_cpf_functionality_complete()
        
        # Print summary
        total_tests = len(tester.test_results)
        successful_tests = len([r for r in tester.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"\n📊 RESUMO DOS TESTES:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        if success:
            print("\n✅ RESULTADO FINAL: FUNCIONALIDADE CPF FUNCIONANDO 100% PERFEITAMENTE!")
            return True
        else:
            print("\n❌ RESULTADO FINAL: PROBLEMAS IDENTIFICADOS NA FUNCIONALIDADE CPF")
            return False
            
    except Exception as e:
        print(f"\n❌ ERRO DURANTE O TESTE: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)