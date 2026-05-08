-- AgitoCash Database Schema (MySQL 8+)
-- Gerado automaticamente em: 2025-09-29 18:38:20

CREATE DATABASE IF NOT EXISTS agitocash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agitocash;

-- Tabela: digital_codes (11 registros)
CREATE TABLE digital_codes (
    digital_code VARCHAR(100) NOT NULL,
    qr_code VARCHAR(296) NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at VARCHAR(100) NOT NULL,
    expires_at VARCHAR(100) NOT NULL
);

-- Tabela: users (8 registros)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(110) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    user_type VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) NOT NULL,
    cashback_balance DECIMAL(10,2) NOT NULL,
    referral_code VARCHAR(100) NOT NULL,
    referred_by TEXT NULL,
    is_blocked BOOLEAN NOT NULL,
    created_at VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(100) NOT NULL,
    cashback_rate DECIMAL(10,2) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    cnpj VARCHAR(100) NOT NULL,
    address VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    business_segment VARCHAR(100) NOT NULL,
    menu_catalog_url VARCHAR(255) NOT NULL,
    referral_count INT NOT NULL,
    is_master_account BOOLEAN NOT NULL,
    platform_balance INT NOT NULL,
    hierarchical_role VARCHAR(100) NOT NULL,
    function VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL,
    is_verified BOOLEAN NOT NULL,
    cpf TEXT NULL,
    google_maps_url TEXT NULL,
    hierarchical_user_id VARCHAR(100) NOT NULL,
    profile_image TEXT NULL,
    theme VARCHAR(100) NOT NULL
);

-- Tabela: hierarchical_users (1 registros)
CREATE TABLE hierarchical_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) NOT NULL,
    cashback_balance DECIMAL(10,2) NOT NULL,
    commission_balance DECIMAL(10,2) NOT NULL,
    parent_user_id TEXT NULL,
    network_users JSON NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    password_hash VARCHAR(110) NOT NULL
);

-- Índices recomendados
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_digital_codes_merchant ON digital_codes(merchant_id);
CREATE INDEX idx_digital_codes_created ON digital_codes(created_at);
