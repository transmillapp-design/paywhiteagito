"""
Sistema de Tabelas de Valores - Proteção Veicular Labelview
Base para criação de planos
"""
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Tipos de cobertura disponíveis
TIPOS_COBERTURA = [
    "Roubo/Furto",
    "Perda Total",
    "Assistencia 24hs",
    "Vidros, Farois e Lanternas",
    "Carro Reserva",
    "Colisão",
    "Danos materiais e Terceiros"
]

async def criar_tabela_valor(db, tipo_cobertura: str, dados: dict, criado_por: str):
    """Criar nova entrada na tabela de valores"""
    try:
        if tipo_cobertura not in TIPOS_COBERTURA:
            return {"success": False, "message": "Tipo de cobertura inválido"}
        
        tabela_id = str(uuid.uuid4())
        
        tabela_doc = {
            "id": tabela_id,
            "tipo_cobertura": tipo_cobertura,
            "valor_servico": float(dados.get("valor_servico", 0)),  # Valor que Labelview cobra
            "valor_fipe_min": float(dados.get("valor_fipe_min", 0)),  # Valor FIPE mínimo
            "valor_fipe_max": float(dados.get("valor_fipe_max", 0)),  # Valor FIPE máximo
            "descricao": dados.get("descricao", ""),
            "tipo_veiculo_assistencia": dados.get("tipo_veiculo_assistencia"),  # Tipo de veículo para Assistência 24hs
            "ativo": True,
            "criado_por": criado_por,
            "criado_em": datetime.utcnow(),
            "atualizado_em": datetime.utcnow()
        }
        
        await db.labelview_tabelas_valores.insert_one(tabela_doc)
        
        logger.info(f"✅ Tabela de valor criada: {tipo_cobertura} - Faixa FIPE: R$ {dados.get('valor_fipe_min')} - R$ {dados.get('valor_fipe_max')} - Valor Serviço: R$ {dados.get('valor_servico')}")
        
        return {
            "success": True,
            "message": "Tabela de valor criada com sucesso",
            "tabela_id": tabela_id
        }
        
    except Exception as e:
        logger.error(f"Erro ao criar tabela: {e}")
        return {"success": False, "message": str(e)}


async def listar_tabelas_por_tipo(db, tipo_cobertura: str):
    """Listar todas as tabelas de um tipo específico"""
    try:
        if tipo_cobertura not in TIPOS_COBERTURA:
            return {"success": False, "message": "Tipo de cobertura inválido"}
        
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": tipo_cobertura,
            "ativo": True
        }).sort("valor_fipe_min", 1)  # Ordenar por valor FIPE mínimo
        
        tabelas = []
        async for tabela in cursor:
            tabela_dict = dict(tabela)
            tabela_dict.pop('_id', None)
            
            # Serializar datas
            if 'criado_em' in tabela_dict and isinstance(tabela_dict['criado_em'], datetime):
                tabela_dict['criado_em'] = tabela_dict['criado_em'].isoformat()
            if 'atualizado_em' in tabela_dict and isinstance(tabela_dict['atualizado_em'], datetime):
                tabela_dict['atualizado_em'] = tabela_dict['atualizado_em'].isoformat()
            
            tabelas.append(tabela_dict)
        
        return {
            "success": True,
            "tipo_cobertura": tipo_cobertura,
            "tabelas": tabelas,
            "total": len(tabelas)
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar tabelas: {e}")
        return {"success": False, "message": str(e)}


async def buscar_valor_na_tabela(db, tipo_cobertura: str, valor_fipe: float, tipo_veiculo_assistencia: str = None):
    """Buscar valor de serviço baseado no valor FIPE do veículo"""
    try:
        # Para Assistência 24hs, buscar também por tipo de veículo
        query = {
            "tipo_cobertura": tipo_cobertura,
            "ativo": True,
            "valor_fipe_min": {"$lte": valor_fipe},
            "valor_fipe_max": {"$gte": valor_fipe}
        }
        
        # Se for Assistência 24hs e tiver tipo de veículo, adicionar ao filtro
        if tipo_cobertura == "Assistencia 24hs" and tipo_veiculo_assistencia:
            query["tipo_veiculo_assistencia"] = tipo_veiculo_assistencia
        
        tabela = await db.labelview_tabelas_valores.find_one(query)
        
        if tabela:
            servicos_inclusos = tabela.get('servicos_inclusos', {})
            
            # ✅ IMPORTANTE: Não usar a descrição técnica da tabela (contém preços do Master)
            # Usar apenas serviços inclusos formatados para o cliente
            descricao = ''
            
            # Se tiver serviços inclusos, formatar como lista
            if servicos_inclusos and servicos_inclusos.get('servicos'):
                servicos_lista = servicos_inclusos.get('servicos', [])
                titulo = servicos_inclusos.get('titulo', '')
                observacoes = servicos_inclusos.get('observacoes', '')
                
                # Criar descrição formatada apenas com serviços
                descricao_formatada = []
                if titulo:
                    descricao_formatada.append(titulo)
                if servicos_lista:
                    descricao_formatada.append("• " + "\n• ".join(servicos_lista))
                if observacoes:
                    descricao_formatada.append(f"Obs: {observacoes}")
                
                descricao = "\n".join(descricao_formatada) if descricao_formatada else ''
            
            return {
                "success": True,
                "valor_servico": tabela.get('valor_servico'),
                "descricao": descricao,  # ✅ Agora só contém serviços, não preços
                "servicos_inclusos": servicos_inclusos,  # ✅ Objeto completo para frontend usar
                "tipo_veiculo_assistencia": tabela.get('tipo_veiculo_assistencia'),
                "faixa": f"R$ {tabela.get('valor_fipe_min'):.2f} - R$ {tabela.get('valor_fipe_max'):.2f}"
            }
        
        return {
            "success": False,
            "message": f"Nenhuma tabela encontrada para {tipo_cobertura} com valor FIPE R$ {valor_fipe:.2f}"
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar valor: {e}")
        return {"success": False, "message": str(e)}


async def importar_assistencia_24h(db, criado_por: str):
    """
    Importar valores fixos de Assistência 24 Horas por tipo de veículo
    Gera 60 registros: 5 tipos × 12 faixas de R$ 10.000
    """
    try:
        # Definir tipos de veículos e seus valores fixos
        tipos_veiculos = [
            {"tipo": "Carros Leves", "valor": 9.90},
            {"tipo": "Aplicativos", "valor": 9.90},
            {"tipo": "Moto", "valor": 9.90},
            {"tipo": "SUV, Pickup, Van", "valor": 15.90},
            {"tipo": "Caminhão", "valor": 49.90}
        ]
        
        # Definir faixas de valor FIPE (12 faixas de R$ 10.000)
        faixas_fipe = []
        for i in range(12):
            valor_min = i * 10000
            valor_max = (i + 1) * 10000
            faixas_fipe.append({"min": valor_min, "max": valor_max})
        
        registros_criados = 0
        tipo_cobertura = "Assistencia 24hs"
        
        # Remover registros antigos de Assistência 24hs para evitar duplicação
        await db.labelview_tabelas_valores.delete_many({
            "tipo_cobertura": tipo_cobertura
        })
        logger.info(f"🗑️ Registros antigos de {tipo_cobertura} removidos")
        
        # Criar 60 registros (5 tipos × 12 faixas)
        for tipo_veiculo in tipos_veiculos:
            for faixa in faixas_fipe:
                tabela_id = str(uuid.uuid4())
                
                tabela_doc = {
                    "id": tabela_id,
                    "tipo_cobertura": tipo_cobertura,
                    "tipo_veiculo_assistencia": tipo_veiculo["tipo"],
                    "valor_servico": tipo_veiculo["valor"],
                    "valor_fipe_min": float(faixa["min"]),
                    "valor_fipe_max": float(faixa["max"]),
                    "descricao": f"{tipo_veiculo['tipo']} - R$ {tipo_veiculo['valor']:.2f} (Faixa FIPE: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f})",
                    "ativo": True,
                    "criado_por": criado_por,
                    "criado_em": datetime.utcnow(),
                    "atualizado_em": datetime.utcnow()
                }
                
                await db.labelview_tabelas_valores.insert_one(tabela_doc)
                registros_criados += 1
        
        logger.info(f"✅ Assistência 24h importada: {registros_criados} registros criados")
        
        return {
            "success": True,
            "message": f"Assistência 24h importada com sucesso! {registros_criados} registros criados.",
            "registros_criados": registros_criados,
            "tipos_veiculos": len(tipos_veiculos),
            "faixas_por_tipo": len(faixas_fipe)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao importar Assistência 24h: {e}")
        return {"success": False, "message": str(e)}


async def importar_vidros_farois_lanternas(db, criado_por: str):
    """
    Importar valores fixos de Vidros, Faróis e Lanternas
    Gera 60 registros: 5 tipos × 12 faixas de R$ 10.000
    VALOR ÚNICO: R$ 5,00 para TODOS os tipos de veículos
    """
    try:
        # Valor ÚNICO para TODOS os tipos
        valor_unico = 5.00
        
        # Definir tipos de veículos
        tipos_veiculos = [
            "Carros Leves",
            "Aplicativos",
            "Moto",
            "SUV, Pickup, Van",
            "Caminhão"
        ]
        
        # Definir faixas de valor FIPE (12 faixas de R$ 10.000)
        faixas_fipe = []
        for i in range(12):
            valor_min = i * 10000
            valor_max = (i + 1) * 10000
            faixas_fipe.append({"min": valor_min, "max": valor_max})
        
        registros_criados = 0
        tipo_cobertura = "Vidros, Farois e Lanternas"
        
        # Remover registros antigos para evitar duplicação
        await db.labelview_tabelas_valores.delete_many({
            "tipo_cobertura": tipo_cobertura
        })
        logger.info(f"🗑️ Registros antigos de {tipo_cobertura} removidos")
        
        # Criar 60 registros (5 tipos × 12 faixas)
        for tipo_veiculo in tipos_veiculos:
            for faixa in faixas_fipe:
                tabela_id = str(uuid.uuid4())
                
                tabela_doc = {
                    "id": tabela_id,
                    "tipo_cobertura": tipo_cobertura,
                    "tipo_veiculo_assistencia": tipo_veiculo,
                    "valor_servico": valor_unico,
                    "valor_fipe_min": float(faixa["min"]),
                    "valor_fipe_max": float(faixa["max"]),
                    "descricao": f"{tipo_veiculo} - R$ {valor_unico:.2f} (Faixa FIPE: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f})",
                    "ativo": True,
                    "criado_por": criado_por,
                    "criado_em": datetime.utcnow(),
                    "atualizado_em": datetime.utcnow()
                }
                
                await db.labelview_tabelas_valores.insert_one(tabela_doc)
                registros_criados += 1
        
        logger.info(f"✅ Vidros, Faróis e Lanternas importados: {registros_criados} registros criados")
        
        return {
            "success": True,
            "message": f"Vidros, Faróis e Lanternas importados com sucesso! {registros_criados} registros criados.",
            "registros_criados": registros_criados,
            "tipos_veiculos": len(tipos_veiculos),
            "faixas_por_tipo": len(faixas_fipe),
            "valor_unico": valor_unico
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao importar Vidros, Faróis e Lanternas: {e}")
        return {"success": False, "message": str(e)}



async def importar_carro_reserva(db, criado_por: str):
    """
    Importar valores fixos de Carro Reserva
    Gera 36 registros: 3 tipos × 12 faixas de R$ 10.000
    VALOR ÚNICO: R$ 3,50 para TODOS os tipos de veículos
    NÃO ATENDE: Moto e Caminhão (apenas Carros Leves, Aplicativos, SUV/Pickup/Van)
    """
    try:
        # Valor ÚNICO para TODOS os tipos
        valor_unico = 3.50
        
        # Definir tipos de veículos - SEM Moto e Caminhão
        tipos_veiculos = [
            "Carros Leves",
            "Aplicativos",
            "SUV, Pickup, Van"
        ]
        
        # Definir faixas de valor FIPE (12 faixas de R$ 10.000)
        faixas_fipe = []
        for i in range(12):
            valor_min = i * 10000
            valor_max = (i + 1) * 10000
            faixas_fipe.append({"min": valor_min, "max": valor_max})
        
        registros_criados = 0
        tipo_cobertura = "Carro Reserva"
        
        # Remover registros antigos para evitar duplicação
        await db.labelview_tabelas_valores.delete_many({
            "tipo_cobertura": tipo_cobertura
        })
        logger.info(f"🗑️ Registros antigos de {tipo_cobertura} removidos")
        
        # Criar 36 registros (3 tipos × 12 faixas)
        for tipo_veiculo in tipos_veiculos:
            for faixa in faixas_fipe:
                tabela_id = str(uuid.uuid4())
                
                tabela_doc = {
                    "id": tabela_id,
                    "tipo_cobertura": tipo_cobertura,
                    "tipo_veiculo_assistencia": tipo_veiculo,
                    "valor_servico": valor_unico,
                    "valor_fipe_min": float(faixa["min"]),
                    "valor_fipe_max": float(faixa["max"]),
                    "descricao": f"{tipo_veiculo} - R$ {valor_unico:.2f} (Faixa FIPE: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f})",
                    "ativo": True,
                    "criado_por": criado_por,
                    "criado_em": datetime.utcnow(),
                    "atualizado_em": datetime.utcnow()
                }
                
                await db.labelview_tabelas_valores.insert_one(tabela_doc)
                registros_criados += 1
        
        logger.info(f"✅ Carro Reserva importado: {registros_criados} registros criados")
        
        return {
            "success": True,
            "message": f"Carro Reserva importado com sucesso! {registros_criados} registros criados.",
            "registros_criados": registros_criados,
            "tipos_veiculos": len(tipos_veiculos),
            "faixas_por_tipo": len(faixas_fipe),
            "valor_unico": valor_unico,
            "observacao": "Serviço não disponível para Moto e Caminhão"
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao importar Carro Reserva: {e}")
        return {"success": False, "message": str(e)}



async def importar_colisao(db, criado_por: str):
    """
    Importar valores fixos de Colisão
    Gera 60 registros: 5 tipos × 12 faixas de R$ 10.000
    VALOR ÚNICO: R$ 3,50 para TODOS os tipos de veículos
    """
    try:
        # Valor ÚNICO para TODOS os tipos
        valor_unico = 3.50
        
        # Definir tipos de veículos
        tipos_veiculos = [
            "Carros Leves",
            "Aplicativos",
            "Moto",
            "SUV, Pickup, Van",
            "Caminhão"
        ]
        
        # Definir faixas de valor FIPE (12 faixas de R$ 10.000)
        faixas_fipe = []
        for i in range(12):
            valor_min = i * 10000
            valor_max = (i + 1) * 10000
            faixas_fipe.append({"min": valor_min, "max": valor_max})
        
        registros_criados = 0
        tipo_cobertura = "Colisão"
        
        # Remover registros antigos para evitar duplicação
        await db.labelview_tabelas_valores.delete_many({
            "tipo_cobertura": tipo_cobertura
        })
        logger.info(f"🗑️ Registros antigos de {tipo_cobertura} removidos")
        
        # Criar 60 registros (5 tipos × 12 faixas)
        for tipo_veiculo in tipos_veiculos:
            for faixa in faixas_fipe:
                tabela_id = str(uuid.uuid4())
                
                tabela_doc = {
                    "id": tabela_id,
                    "tipo_cobertura": tipo_cobertura,
                    "tipo_veiculo_assistencia": tipo_veiculo,
                    "valor_servico": valor_unico,
                    "valor_fipe_min": float(faixa["min"]),
                    "valor_fipe_max": float(faixa["max"]),
                    "descricao": f"{tipo_veiculo} - R$ {valor_unico:.2f} (Faixa FIPE: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f})",
                    "ativo": True,
                    "criado_por": criado_por,
                    "criado_em": datetime.utcnow(),
                    "atualizado_em": datetime.utcnow()
                }
                
                await db.labelview_tabelas_valores.insert_one(tabela_doc)
                registros_criados += 1
        
        logger.info(f"✅ Colisão importada: {registros_criados} registros criados")
        
        return {
            "success": True,
            "message": f"Colisão importada com sucesso! {registros_criados} registros criados.",
            "registros_criados": registros_criados,
            "tipos_veiculos": len(tipos_veiculos),
            "faixas_por_tipo": len(faixas_fipe),
            "valor_unico": valor_unico
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao importar Colisão: {e}")
        return {"success": False, "message": str(e)}


async def importar_danos_materiais_terceiros(db, criado_por: str):
    """
    Importar valores de Danos Materiais e Terceiros com limites de cobertura
    Gera 180 registros: 3 limites × 5 tipos × 12 faixas de R$ 10.000
    
    Limites de cobertura:
    - R$ 30.000 → R$ 17,90
    - R$ 60.000 → R$ 25,00
    - R$ 100.000 → R$ 30,00
    """
    try:
        # Definir limites de cobertura e seus valores
        limites_cobertura = [
            {"limite": 30000, "valor": 17.90},
            {"limite": 60000, "valor": 25.00},
            {"limite": 100000, "valor": 30.00}
        ]
        
        # Definir tipos de veículos
        tipos_veiculos = [
            "Carros Leves",
            "Aplicativos",
            "Moto",
            "SUV, Pickup, Van",
            "Caminhão"
        ]
        
        # Definir faixas de valor FIPE (12 faixas de R$ 10.000)
        faixas_fipe = []
        for i in range(12):
            valor_min = i * 10000
            valor_max = (i + 1) * 10000
            faixas_fipe.append({"min": valor_min, "max": valor_max})
        
        registros_criados = 0
        tipo_cobertura = "Danos materiais e Terceiros"
        
        # Remover registros antigos para evitar duplicação
        await db.labelview_tabelas_valores.delete_many({
            "tipo_cobertura": tipo_cobertura
        })
        logger.info(f"🗑️ Registros antigos de {tipo_cobertura} removidos")
        
        # Criar 180 registros (3 limites × 5 tipos × 12 faixas)
        for limite_cob in limites_cobertura:
            for tipo_veiculo in tipos_veiculos:
                for faixa in faixas_fipe:
                    tabela_id = str(uuid.uuid4())
                    
                    tabela_doc = {
                        "id": tabela_id,
                        "tipo_cobertura": tipo_cobertura,
                        "tipo_veiculo_assistencia": tipo_veiculo,
                        "limite_cobertura_dmt": limite_cob["limite"],
                        "valor_servico": limite_cob["valor"],
                        "valor_fipe_min": float(faixa["min"]),
                        "valor_fipe_max": float(faixa["max"]),
                        "descricao": f"{tipo_veiculo} - Limite R$ {limite_cob['limite']:,.2f} - R$ {limite_cob['valor']:.2f} (Faixa FIPE: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f})",
                        "ativo": True,
                        "criado_por": criado_por,
                        "criado_em": datetime.utcnow(),
                        "atualizado_em": datetime.utcnow()
                    }
                    
                    await db.labelview_tabelas_valores.insert_one(tabela_doc)
                    registros_criados += 1
        
        logger.info(f"✅ Danos Materiais e Terceiros importados: {registros_criados} registros criados")
        
        return {
            "success": True,
            "message": f"Danos Materiais e Terceiros importados com sucesso! {registros_criados} registros criados.",
            "registros_criados": registros_criados,
            "limites_cobertura": len(limites_cobertura),
            "tipos_veiculos": len(tipos_veiculos),
            "faixas_por_tipo": len(faixas_fipe)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao importar Danos Materiais e Terceiros: {e}")
        return {"success": False, "message": str(e)}

