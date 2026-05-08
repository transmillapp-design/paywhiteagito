#!/usr/bin/env python3
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
