"""
Script para testar a nova integração com API FIPE (Invertexto)
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from fipe_integration import FIPEIntegration

def test_get_marcas():
    print("\n🔍 TESTE 1: Buscar marcas de carros")
    print("=" * 50)
    marcas = FIPEIntegration.get_marcas("carros")
    print(f"✅ Total de marcas encontradas: {len(marcas)}")
    if marcas:
        print(f"Exemplo: {marcas[0]}")
    return len(marcas) > 0

def test_get_modelos():
    print("\n🔍 TESTE 2: Buscar modelos da marca Fiat (ID 21)")
    print("=" * 50)
    modelos_data = FIPEIntegration.get_modelos("carros", "21")
    modelos = modelos_data.get('modelos', [])
    print(f"✅ Total de modelos encontrados: {len(modelos)}")
    if modelos:
        print(f"Exemplo: {modelos[0]}")
    return len(modelos) > 0

def test_get_anos():
    print("\n🔍 TESTE 3: Buscar anos de um modelo")
    print("=" * 50)
    # Primeiro, buscar um modelo
    modelos_data = FIPEIntegration.get_modelos("carros", "21")
    modelos = modelos_data.get('modelos', [])
    
    if modelos:
        modelo = modelos[0]
        modelo_codigo = modelo['codigo']
        fipe_code = modelo.get('fipe_code', '')
        print(f"Testando com: {modelo['nome']} (Código FIPE: {fipe_code})")
        
        if fipe_code:
            anos = FIPEIntegration.get_anos("carros", "21", str(modelo_codigo), fipe_code)
            print(f"✅ Total de anos encontrados: {len(anos)}")
            if anos:
                print(f"Exemplo: {anos[0]}")
            return len(anos) > 0
    
    print("❌ Não foi possível testar anos (sem fipe_code)")
    return False

def test_buscar_multiplos():
    print("\n🔍 TESTE 4: Buscar múltiplos veículos (limitado)")
    print("=" * 50)
    print("Buscando 2 modelos de 3 marcas populares...")
    veiculos = FIPEIntegration.buscar_multiplos_veiculos(
        tipo="carros",
        limite_por_marca=2,
        importacao_completa=False
    )
    print(f"✅ Total de veículos encontrados: {len(veiculos)}")
    if veiculos:
        print(f"Exemplo: {veiculos[0]}")
    return len(veiculos) > 0

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚗 TESTE DA NOVA INTEGRAÇÃO FIPE - Invertexto")
    print("=" * 50)
    
    resultados = []
    
    try:
        resultados.append(("Buscar marcas", test_get_marcas()))
        resultados.append(("Buscar modelos", test_get_modelos()))
        resultados.append(("Buscar anos", test_get_anos()))
        resultados.append(("Buscar múltiplos veículos", test_buscar_multiplos()))
    except Exception as e:
        print(f"\n❌ ERRO DURANTE OS TESTES: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)
    
    for nome, sucesso in resultados:
        status = "✅ PASSOU" if sucesso else "❌ FALHOU"
        print(f"{nome}: {status}")
    
    total_sucesso = sum(1 for _, s in resultados if s)
    print(f"\nTotal: {total_sucesso}/{len(resultados)} testes passaram")
    
    if total_sucesso == len(resultados):
        print("\n🎉 TODOS OS TESTES PASSARAM!")
    else:
        print("\n⚠️ ALGUNS TESTES FALHARAM")
