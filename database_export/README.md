# Documentação da Base de Dados AgitoCash

**Gerado em:** 2025-09-29 18:38:20
**Fonte:** MongoDB (`agitocash`)
**Destino:** MySQL 8+

## Visão Geral

O banco de dados AgitoCash contém 3 collections principais:

- **digital_codes**: 11 registros
- **users**: 8 registros
- **hierarchical_users**: 1 registros

## Estrutura Detalhada

### digital_codes

**Registros:** 11

**Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `digital_code` | str | Código digital único |
| `qr_code` | str | Código QR correspondente |
| `merchant_id` | str | ID do lojista |
| `amount` | float | Valor da transação |
| `created_at` | str | Data de criação |
| `expires_at` | str | Data de expiração |

### users

**Registros:** 8

**Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | str | Identificador único (UUID) |
| `email` | str | Email do usuário |
| `password_hash` | str | Hash da senha (bcrypt) |
| `full_name` | str | Nome completo |
| `phone` | str | Telefone |
| `user_type` | str | Tipo: cliente, lojista, master, hierarchical |
| `balance` | float | Saldo principal |
| `cashback_balance` | float | Saldo de cashback |
| `referral_code` | str | Código de indicação |
| `referred_by` | NoneType | Indicado por (referral_code) |
| `is_blocked` | bool | Usuário bloqueado |
| `created_at` | str | Data de criação |

### hierarchical_users

**Registros:** 1

**Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | str | Campo do sistema |
| `email` | str | Campo do sistema |
| `full_name` | str | Campo do sistema |
| `phone` | str | Campo do sistema |
| `whatsapp` | str | Campo do sistema |
| `state` | str | Campo do sistema |
| `city` | str | Campo do sistema |
| `role` | str | Papel: socio_operador, mini_agencia, consultor |
| `balance` | float | Campo do sistema |
| `cashback_balance` | float | Campo do sistema |
| `commission_balance` | float | Saldo de comissões |
| `parent_user_id` | NoneType | ID do usuário pai |
| `network_users` | list | Usuários da rede (JSON) |
| `is_active` | bool | Usuário ativo |
| `created_at` | datetime | Campo do sistema |
| `created_by` | str | Campo do sistema |
| `password_hash` | str | Campo do sistema |


## Arquivos de Exportação

1. **`database_structure.json`** - Análise completa da estrutura
2. **`mysql_schema.sql`** - Schema MySQL equivalente
3. **`complete_data.json`** - Todos os dados em JSON
4. **`mysql_data.sql`** - INSERTs para MySQL
5. **`migrate_to_mysql.py`** - Script de migração automatizada

## Como Usar

1. Execute o schema MySQL: `mysql < mysql_schema.sql`
2. Execute a migração: `python migrate_to_mysql.py`
3. Ou importe os dados: `mysql < mysql_data.sql`
