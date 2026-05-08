#!/usr/bin/env python3
"""
Teste específico para validar correção do endpoint de bloqueio/desbloqueio hierárquico
"""

from backend_test import AgitoCashTester

def main():
    print("🚀 INICIANDO TESTE ESPECÍFICO DE BLOQUEIO HIERÁRQUICO")
    print("=" * 80)
    
    tester = AgitoCashTester()
    
    # Run the specific test
    success = tester.test_hierarchical_user_blocking_critical()
    
    # Print summary
    print("\n" + "=" * 80)
    print("🎯 RESUMO DO TESTE ESPECÍFICO")
    print("=" * 80)
    
    passed_tests = sum(1 for result in tester.test_results if result["success"])
    total_tests = len(tester.test_results)
    
    print(f"Total de testes executados: {total_tests}")
    print(f"Testes aprovados: {passed_tests}")
    print(f"Testes falharam: {total_tests - passed_tests}")
    print(f"Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%")
    
    if success:
        print("\n✅ CONCLUSÃO: CORREÇÃO DO ENDPOINT DE BLOQUEIO HIERÁRQUICO FUNCIONANDO")
    else:
        print("\n❌ CONCLUSÃO: PROBLEMA AINDA PERSISTE NO ENDPOINT DE BLOQUEIO HIERÁRQUICO")
    
    # Show failed tests if any
    failed_tests = [result for result in tester.test_results if not result["success"]]
    if failed_tests:
        print("\n❌ TESTES QUE FALHARAM:")
        for result in failed_tests:
            print(f"   • {result['test']}: {result['details']}")
    
    print("\n🎯 TESTE CONCLUÍDO!")

if __name__ == "__main__":
    main()