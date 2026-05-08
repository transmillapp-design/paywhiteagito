#!/usr/bin/env python3
"""
Script de Exportação Completa do AgitoCash
Gera: SQL Schema + Dados + Documentação
Para migração MongoDB → MySQL
"""

import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

class AgitoCashExporter:
    def __init__(self):
        self.mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.db_name = 'agitocash'
        self.export_dir = '/app/database_export'
        
    async def export_complete_database(self):
        """Exportação completa do banco de dados"""
        
        # Criar diretório de exportação
        os.makedirs(self.export_dir, exist_ok=True)
        
        client = AsyncIOMotorClient(self.mongo_url)
        db = client[self.db_name]
        
        print("🚀 INICIANDO EXPORTAÇÃO COMPLETA DO AGITOCASH")
        print("=" * 60)
        
        # 1. Análise e estrutura
        await self._analyze_structure(db)
        
        # 2. Gerar schema MySQL
        await self._generate_mysql_schema(db)
        
        # 3. Exportar todos os dados
        await self._export_all_data(db)
        
        # 4. Gerar scripts de migração
        await self._generate_migration_scripts(db)
        
        # 5. Documentação
        await self._generate_documentation(db)
        
        client.close()
        
        print("\n✅ EXPORTAÇÃO CONCLUÍDA!")
        print(f"📁 Arquivos salvos em: {self.export_dir}")
        
    async def _analyze_structure(self, db):
        """Análise detalhada da estrutura"""
        print("\n📊 ANALISANDO ESTRUTURA...")
        
        collections = await db.list_collection_names()
        structure = {}
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            
            if count > 0:
                # Analisar todos os documentos para encontrar todos os campos possíveis
                all_docs = await collection.find({}).to_list(None)
                fields = {}
                
                for doc in all_docs:
                    for key, value in doc.items():
                        if key not in fields:
                            fields[key] = {
                                'type': type(value).__name__,
                                'nullable': False,
                                'examples': []
                            }
                        
                        # Detectar se campo pode ser nulo
                        if value is None:
                            fields[key]['nullable'] = True
                        
                        # Adicionar exemplos (máximo 3)
                        if len(fields[key]['examples']) < 3 and value is not None:
                            if value not in fields[key]['examples']:
                                fields[key]['examples'].append(value)
                
                structure[collection_name] = {
                    'count': count,
                    'fields': fields
                }
        
        # Salvar análise
        with open(f'{self.export_dir}/database_structure.json', 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2, default=str, ensure_ascii=False)
        
        print(f"✅ Estrutura analisada: {len(collections)} collections")
        
    async def _generate_mysql_schema(self, db):
        """Gerar schema MySQL equivalente"""
        print("\n🗄️ GERANDO SCHEMA MYSQL...")
        
        # Mapeamento de tipos MongoDB → MySQL
        type_mapping = {
            'str': 'VARCHAR(255)',
            'int': 'INT',
            'float': 'DECIMAL(10,2)',
            'bool': 'BOOLEAN',
            'datetime': 'DATETIME',
            'list': 'JSON',
            'dict': 'JSON',
            'ObjectId': 'VARCHAR(24)'
        }
        
        sql_schema = [
            "-- AgitoCash Database Schema (MySQL 8+)",
            "-- Gerado automaticamente em: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "",
            "CREATE DATABASE IF NOT EXISTS agitocash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
            "USE agitocash;",
            ""
        ]
        
        collections = await db.list_collection_names()
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            
            if count > 0:
                # Analisar campos
                sample_docs = await collection.find({}).limit(10).to_list(10)
                fields = {}
                
                for doc in sample_docs:
                    for key, value in doc.items():
                        if key not in fields:
                            fields[key] = {
                                'type': type(value).__name__,
                                'nullable': value is None,
                                'max_length': 0
                            }
                        
                        # Calcular tamanho máximo para strings
                        if isinstance(value, str) and len(value) > fields[key]['max_length']:
                            fields[key]['max_length'] = len(value)
                
                # Gerar CREATE TABLE
                table_sql = [f"-- Tabela: {collection_name} ({count} registros)"]
                table_sql.append(f"CREATE TABLE {collection_name} (")
                
                field_definitions = []
                
                for field_name, field_info in fields.items():
                    if field_name == '_id':
                        continue  # Pular _id do MongoDB
                    
                    if field_name == 'id':
                        field_def = "    id VARCHAR(36) PRIMARY KEY"
                    else:
                        mysql_type = type_mapping.get(field_info['type'], 'TEXT')
                        
                        # Ajustar tamanho de VARCHAR
                        if mysql_type == 'VARCHAR(255)' and field_info['max_length'] > 255:
                            mysql_type = 'TEXT'
                        elif mysql_type == 'VARCHAR(255)' and field_info['max_length'] > 0:
                            mysql_type = f"VARCHAR({max(field_info['max_length'] + 50, 100)})"
                        
                        nullable = "NULL" if field_info['nullable'] else "NOT NULL"
                        field_def = f"    {field_name} {mysql_type} {nullable}"
                    
                    field_definitions.append(field_def)
                
                table_sql.append(",\n".join(field_definitions))
                table_sql.append(");")
                table_sql.append("")
                
                sql_schema.extend(table_sql)
        
        # Adicionar índices e relacionamentos
        sql_schema.extend([
            "-- Índices recomendados",
            "CREATE INDEX idx_users_email ON users(email);",
            "CREATE INDEX idx_users_referral_code ON users(referral_code);",
            "CREATE INDEX idx_users_user_type ON users(user_type);",
            "CREATE INDEX idx_digital_codes_merchant ON digital_codes(merchant_id);",
            "CREATE INDEX idx_digital_codes_created ON digital_codes(created_at);",
            ""
        ])
        
        # Salvar schema
        with open(f'{self.export_dir}/mysql_schema.sql', 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_schema))
        
        print("✅ Schema MySQL gerado")
        
    async def _export_all_data(self, db):
        """Exportar todos os dados"""
        print("\n📦 EXPORTANDO DADOS...")
        
        collections = await db.list_collection_names()
        all_data = {}
        
        for collection_name in collections:
            collection = db[collection_name]
            documents = await collection.find({}).to_list(None)
            
            # Converter ObjectId para string e limpar dados
            clean_documents = []
            for doc in documents:
                clean_doc = {}
                for key, value in doc.items():
                    if key == '_id':
                        continue  # Pular _id do MongoDB
                    
                    # Converter tipos problemáticos
                    if hasattr(value, 'isoformat'):  # datetime
                        clean_doc[key] = value.isoformat()
                    elif str(type(value)) == "<class 'bson.objectid.ObjectId'>":
                        clean_doc[key] = str(value)
                    else:
                        clean_doc[key] = value
                
                clean_documents.append(clean_doc)
            
            all_data[collection_name] = clean_documents
        
        # Salvar dados em JSON
        with open(f'{self.export_dir}/complete_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, default=str, ensure_ascii=False)
        
        # Gerar INSERT statements para MySQL
        mysql_inserts = [
            "-- Dados do AgitoCash para MySQL",
            "-- Gerado em: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "",
            "USE agitocash;",
            ""
        ]
        
        for collection_name, documents in all_data.items():
            if documents:
                mysql_inserts.append(f"-- Dados da tabela: {collection_name}")
                
                for doc in documents:
                    if doc:  # Verificar se documento não está vazio
                        fields = list(doc.keys())
                        values = []
                        
                        for value in doc.values():
                            if value is None:
                                values.append('NULL')
                            elif isinstance(value, str):
                                # Escapar aspas simples
                                escaped_value = value.replace("'", "''")
                                values.append(f"'{escaped_value}'")
                            elif isinstance(value, (list, dict)):
                                # Converter para JSON
                                json_value = json.dumps(value, default=str, ensure_ascii=False)
                                escaped_json = json_value.replace("'", "''")
                                values.append(f"'{escaped_json}'")
                            else:
                                values.append(str(value))
                        
                        insert_sql = f"INSERT INTO {collection_name} ({', '.join(fields)}) VALUES ({', '.join(values)});"
                        mysql_inserts.append(insert_sql)
                
                mysql_inserts.append("")
        
        # Salvar INSERTs
        with open(f'{self.export_dir}/mysql_data.sql', 'w', encoding='utf-8') as f:
            f.write('\n'.join(mysql_inserts))
        
        print(f"✅ Dados exportados: {sum(len(docs) for docs in all_data.values())} registros")
        
    async def _generate_migration_scripts(self, db):
        """Gerar scripts de migração automatizados"""
        print("\n🔄 GERANDO SCRIPTS DE MIGRAÇÃO...")
        
        migration_script = '''#!/usr/bin/env python3
"""
Script de Migração Automática: MongoDB → MySQL
AgitoCash Database Migration
"""

import mysql.connector
import json
import os
from datetime import datetime

class AgitoCashMigration:
    def __init__(self, mysql_config):
        self.mysql_config = mysql_config
        
    def run_migration(self):
        """Executar migração completa"""
        print("🚀 INICIANDO MIGRAÇÃO AGITOCASH")
        
        # 1. Conectar ao MySQL
        conn = mysql.connector.connect(**self.mysql_config)
        cursor = conn.cursor()
        
        # 2. Executar schema
        print("📄 Executando schema...")
        with open('mysql_schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        for statement in schema_sql.split(';'):
            if statement.strip():
                cursor.execute(statement)
        
        # 3. Importar dados
        print("📦 Importando dados...")
        with open('complete_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for table_name, records in data.items():
            if records:
                print(f"  Importando {len(records)} registros para {table_name}")
                
                for record in records:
                    fields = list(record.keys())
                    placeholders = ', '.join(['%s'] * len(fields))
                    sql = f"INSERT INTO {table_name} ({', '.join(fields)}) VALUES ({placeholders})"
                    
                    values = []
                    for value in record.values():
                        if isinstance(value, (list, dict)):
                            values.append(json.dumps(value))
                        else:
                            values.append(value)
                    
                    cursor.execute(sql, values)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ MIGRAÇÃO CONCLUÍDA!")

# Exemplo de uso:
if __name__ == "__main__":
    mysql_config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'sua_senha',
        'database': 'agitocash',
        'charset': 'utf8mb4'
    }
    
    migration = AgitoCashMigration(mysql_config)
    migration.run_migration()
'''
        
        with open(f'{self.export_dir}/migrate_to_mysql.py', 'w', encoding='utf-8') as f:
            f.write(migration_script)
        
        print("✅ Scripts de migração gerados")
        
    async def _generate_documentation(self, db):
        """Gerar documentação completa"""
        print("\n📚 GERANDO DOCUMENTAÇÃO...")
        
        collections = await db.list_collection_names()
        
        documentation = [
            "# Documentação da Base de Dados AgitoCash",
            "",
            f"**Gerado em:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Fonte:** MongoDB (`{self.db_name}`)",
            f"**Destino:** MySQL 8+",
            "",
            "## Visão Geral",
            "",
            f"O banco de dados AgitoCash contém {len(collections)} collections principais:",
            ""
        ]
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            documentation.append(f"- **{collection_name}**: {count} registros")
        
        documentation.extend([
            "",
            "## Estrutura Detalhada",
            ""
        ])
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            
            if count > 0:
                documentation.extend([
                    f"### {collection_name}",
                    "",
                    f"**Registros:** {count}",
                    ""
                ])
                
                # Analisar campos
                sample = await collection.find_one()
                if sample:
                    documentation.append("**Campos:**")
                    documentation.append("")
                    documentation.append("| Campo | Tipo | Descrição |")
                    documentation.append("|-------|------|-----------|")
                    
                    for key, value in sample.items():
                        if key != '_id':
                            type_name = type(value).__name__
                            description = self._get_field_description(collection_name, key)
                            documentation.append(f"| `{key}` | {type_name} | {description} |")
                    
                    documentation.append("")
        
        documentation.extend([
            "",
            "## Arquivos de Exportação",
            "",
            "1. **`database_structure.json`** - Análise completa da estrutura",
            "2. **`mysql_schema.sql`** - Schema MySQL equivalente", 
            "3. **`complete_data.json`** - Todos os dados em JSON",
            "4. **`mysql_data.sql`** - INSERTs para MySQL",
            "5. **`migrate_to_mysql.py`** - Script de migração automatizada",
            "",
            "## Como Usar",
            "",
            "1. Execute o schema MySQL: `mysql < mysql_schema.sql`",
            "2. Execute a migração: `python migrate_to_mysql.py`",
            "3. Ou importe os dados: `mysql < mysql_data.sql`",
            ""
        ])
        
        with open(f'{self.export_dir}/README.md', 'w', encoding='utf-8') as f:
            f.write('\n'.join(documentation))
        
        print("✅ Documentação gerada")
    
    def _get_field_description(self, collection, field):
        """Gerar descrições dos campos"""
        descriptions = {
            'users': {
                'id': 'Identificador único (UUID)',
                'email': 'Email do usuário',
                'password_hash': 'Hash da senha (bcrypt)', 
                'full_name': 'Nome completo',
                'phone': 'Telefone',
                'user_type': 'Tipo: cliente, lojista, master, hierarchical',
                'balance': 'Saldo principal',
                'cashback_balance': 'Saldo de cashback',
                'referral_code': 'Código de indicação',
                'referred_by': 'Indicado por (referral_code)',
                'is_blocked': 'Usuário bloqueado',
                'created_at': 'Data de criação'
            },
            'digital_codes': {
                'digital_code': 'Código digital único',
                'qr_code': 'Código QR correspondente',
                'merchant_id': 'ID do lojista',
                'amount': 'Valor da transação',
                'created_at': 'Data de criação',
                'expires_at': 'Data de expiração'
            },
            'hierarchical_users': {
                'role': 'Papel: socio_operador, mini_agencia, consultor',
                'commission_balance': 'Saldo de comissões',
                'network_users': 'Usuários da rede (JSON)',
                'parent_user_id': 'ID do usuário pai',
                'is_active': 'Usuário ativo'
            }
        }
        
        return descriptions.get(collection, {}).get(field, 'Campo do sistema')

# Executar exportação
if __name__ == "__main__":
    asyncio.run(AgitoCashExporter().export_complete_database())