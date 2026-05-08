#!/usr/bin/env python3
"""
Teste específico do login da conta lojista demo
"""

import sys
import os
sys.path.append('/app')

from backend_test import AgitoCoinTester

if __name__ == "__main__":
    print("🎯 TESTE ESPECÍFICO DO LOGIN DA CONTA LOJISTA DEMO")
    print("Conforme solicitado na revisão")
    print("")
    
    tester = AgitoCoinTester()
    success = tester.test_lojista_login_specific()
    
    if success:
        print("\n🎉 LOGIN DO LOJISTA FUNCIONANDO PERFEITAMENTE!")
        print("✅ Todas as validações passaram")
        print("✅ Sistema pronto para uso")
    else:
        print("\n⚠️ PROBLEMAS IDENTIFICADOS NO LOGIN DO LOJISTA!")
        print("❌ Correções necessárias")