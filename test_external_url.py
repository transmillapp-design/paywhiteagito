#!/usr/bin/env python3
"""
AgitoCash External URL Investigation
Test demo accounts on production URL: https://login-reset.emergent.host/
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import AgitoCashTester

def main():
    print("🚨 INVESTIGAÇÃO CRÍTICA: CONTAS DEMO NA URL EXTERNA")
    print("URL EXTERNA: https://login-reset.emergent.host/")
    print("PROBLEMA RELATADO: Contas demo não aparecem/funcionam na URL externa")
    print("=" * 80)
    
    # Initialize tester with external URL
    tester = AgitoCashTester("https://login-reset.emergent.host/api")
    
    # Run the external URL investigation
    tester.run_external_url_investigation()

if __name__ == "__main__":
    main()