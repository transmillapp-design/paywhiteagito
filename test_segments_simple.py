#!/usr/bin/env python3
"""
Simple test for business segments ObjectId fix
"""

import requests
import json
import re

def test_business_segments_fix():
    """Test the business segments ObjectId fix"""
    
    print("\n=== TESTE URGENTE - CORRECAO ERRO 500 NA CRIACAO DE SEGMENTOS ===")
    print("CONTEXTO: Foi aplicada uma correcao critica no endpoint POST /api/master/business-segments")
    print("O problema era que estava retornando str(result.inserted_id) (ObjectId do MongoDB)")
    print("em vez de usar o segment_id (UUID) que ja havia sido criado.")
    print("")
    
    # Get base URL from frontend .env
    base_url = "https://api-decompose-1.preview.emergentagent.com/api"
    
    # Test 1: Login with master account
    print("--- TESTE 1: Login Master Account ---")
    
    master_login_data = {
        "email": "master@agitocoin.com",
        "password": "master123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=master_login_data)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data["access_token"]
            master_user = data["user"]
            
            print(f"✅ Login master funcionando - {master_user.get('full_name', 'Master')}")
            
            # Verify master account flag
            if master_user.get("is_master_account", False):
                print("✅ is_master_account = true confirmado")
            else:
                print("❌ is_master_account deveria ser true")
                
        else:
            print(f"❌ Login master falhou - Status: {response.status_code}")
            print("❌ ERRO CRITICO: Nao e possivel continuar teste sem acesso master")
            return False
            
    except Exception as e:
        print(f"❌ Erro no login master: {e}")
        return False
    
    # Test 2: Create new business segment - TESTE CRITICO DA CORRECAO
    print("\n--- TESTE 2: Criar Novo Segmento de Negocio (TESTE DA CORRECAO) ---")
    
    segment_data = {
        "name": "Teste Correcao ObjectId",
        "description": "Teste especifico da correcao do erro 500",
        "is_active": True
    }
    
    try:
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.post(f"{base_url}/master/business-segments", json=segment_data, headers=headers)
        
        created_segment_id = None
        
        if response.status_code in [200, 201]:
            response_data = response.json()
            
            print(f"✅ CORRECAO VALIDADA: Segmento criado com sucesso - Status: {response.status_code}")
            
            # Test 3: Validate response structure and UUID format
            print("\n--- TESTE 3: Validacao da Estrutura da Resposta ---")
            
            if "segment" in response_data:
                segment = response_data["segment"]
                created_segment_id = segment.get("id")
                
                # Validate UUID format (not ObjectId)
                if created_segment_id:
                    # UUID format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (36 chars with hyphens)
                    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    
                    if re.match(uuid_pattern, created_segment_id, re.IGNORECASE):
                        print(f"✅ ID no formato UUID correto: {created_segment_id}")
                    else:
                        # Check if it looks like MongoDB ObjectId (24 hex chars)
                        objectid_pattern = r'^[0-9a-f]{24}$'
                        if re.match(objectid_pattern, created_segment_id, re.IGNORECASE):
                            print(f"❌ ERRO: ID ainda e ObjectId MongoDB: {created_segment_id}")
                            return False
                        else:
                            print(f"❌ ID em formato invalido: {created_segment_id}")
                            return False
                else:
                    print("❌ Campo 'id' nao encontrado na resposta")
                    return False
                
                # Validate all required fields are present
                required_fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]
                missing_fields = []
                present_fields = []
                
                for field in required_fields:
                    if field in segment and segment[field] is not None:
                        present_fields.append(field)
                    else:
                        missing_fields.append(field)
                
                if not missing_fields:
                    print(f"✅ Todos os campos obrigatorios presentes: {', '.join(present_fields)}")
                else:
                    print(f"❌ Campos ausentes: {', '.join(missing_fields)}")
                    return False
                
                # Validate field values
                if segment.get("name") == segment_data["name"]:
                    print(f"✅ Nome correto: '{segment.get('name')}'")
                else:
                    print(f"❌ Nome incorreto: esperado '{segment_data['name']}', obtido '{segment.get('name')}'")
                    return False
                
                if segment.get("description") == segment_data["description"]:
                    print(f"✅ Descricao correta: '{segment.get('description')}'")
                else:
                    print(f"❌ Descricao incorreta: esperado '{segment_data['description']}', obtido '{segment.get('description')}'")
                    return False
                
                if segment.get("is_active") == segment_data["is_active"]:
                    print(f"✅ Status ativo correto: {segment.get('is_active')}")
                else:
                    print(f"❌ Status ativo incorreto: esperado {segment_data['is_active']}, obtido {segment.get('is_active')}")
                    return False
                
            else:
                print("❌ Campo 'segment' nao encontrado na resposta")
                return False
            
        else:
            print(f"❌ CORRECAO FALHOU: Erro na criacao do segmento - Status: {response.status_code}")
            
            # Try to get error details
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", "Sem detalhes do erro")
                print(f"❌ Detalhes do erro: {error_detail}")
                
                # Check if it's the old ObjectId error
                if "ObjectId" in str(error_detail) or "not JSON serializable" in str(error_detail):
                    print("❌ ERRO CRITICO: Ainda ha problema com ObjectId - Correcao nao funcionou")
                
            except:
                print(f"❌ Erro HTTP {response.status_code}: {response.text[:200]}")
            
            return False
            
    except Exception as e:
        print(f"❌ Erro na criacao do segmento: {e}")
        return False
    
    # Test 4: List business segments to verify the new segment appears
    print("\n--- TESTE 4: Listar Segmentos para Verificar Novo Segmento ---")
    
    try:
        headers = {"Authorization": f"Bearer {master_token}"}
        response = requests.get(f"{base_url}/master/business-segments", headers=headers)
        
        if response.status_code == 200:
            response_data = response.json()
            
            if "segments" in response_data:
                segments = response_data["segments"]
                
                print(f"✅ Lista de segmentos obtida - Total: {len(segments)} segmentos")
                
                # Look for our newly created segment
                test_segment = None
                for segment in segments:
                    if segment.get("name") == "Teste Correcao ObjectId":
                        test_segment = segment
                        break
                
                if test_segment:
                    print(f"✅ Novo segmento encontrado na lista: '{test_segment.get('name')}'")
                    
                    # Verify UUID format in the list as well
                    list_segment_id = test_segment.get("id")
                    if list_segment_id == created_segment_id:
                        print(f"✅ ID consistente entre criacao e listagem: {list_segment_id}")
                    else:
                        print(f"❌ ID inconsistente: criacao={created_segment_id}, lista={list_segment_id}")
                        return False
                    
                    # Verify UUID format in list
                    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    
                    if re.match(uuid_pattern, list_segment_id, re.IGNORECASE):
                        print(f"✅ ID na lista tambem esta no formato UUID correto: {list_segment_id}")
                    else:
                        print(f"❌ ID na lista em formato incorreto: {list_segment_id}")
                        return False
                    
                else:
                    print("❌ Novo segmento 'Teste Correcao ObjectId' nao encontrado na lista")
                    return False
                
            else:
                print("❌ Campo 'segments' nao encontrado na resposta da listagem")
                return False
        else:
            print(f"❌ Erro ao listar segmentos - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao listar segmentos: {e}")
        return False
    
    # Final Summary
    print(f"\n=== RESUMO FINAL DO TESTE DE CORRECAO DE OBJECTID ===")
    print("✅ RESULTADO: CORRECAO DO ERRO 500 OBJECTID VALIDADA COM SUCESSO")
    print("✅ ENDPOINT POST /api/master/business-segments funcionando corretamente")
    print("✅ RESPOSTA: Retorna UUID em vez de ObjectId MongoDB")
    print("✅ CAMPOS: Todos os campos obrigatorios presentes na resposta")
    print("✅ LISTAGEM: Novo segmento aparece corretamente na lista")
    print("✅ CONSISTENCIA: ID UUID consistente entre criacao e listagem")
    print("✅ PROBLEMA RESOLVIDO: Erro 500 relacionado a ObjectId foi corrigido")
    
    return True

if __name__ == "__main__":
    success = test_business_segments_fix()
    if success:
        print("\n✅ TESTE CONCLUIDO COM SUCESSO!")
    else:
        print("\n❌ TESTE FALHOU!")