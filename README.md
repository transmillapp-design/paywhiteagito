# 🪙 AgitoCoin - Plataforma Digital com Cripto Exchange

**AgitoCoin** é uma plataforma completa de pagamentos digitais e cripto exchange que oferece cashback, PIX e conversão para USDT em uma única solução.

## ✨ Funcionalidades Principais

### 💰 **Sistema de Pagamentos**
- **Carteira Digital** para clientes e lojistas
- **Depósitos via PIX** (integração XGate real)
- **Pagamentos via QR Code** com split payment
- **Sistema de Cashback** configurável (1-10%)
- **Saques para bancos** com taxa de 3,99%

### 🔗 **Cripto Exchange**
- **Conversão BRL → USDT** via XGate
- **Taxas de câmbio** em tempo real
- **Carteira USDT** integrada

### 👥 **Gestão de Usuários**
- **3 tipos de usuário:** Clientes, Lojistas, Master
- **Sistema de indicações** com bônus automáticos
- **Dashboard hierárquico** para gerenciamento
- **Autenticação JWT** segura

### 📱 **Interface Moderna**
- **PWA** (Progressive Web App)
- **Tema escuro/claro** personalizável
- **Responsivo** (desktop, tablet, mobile)
- **Notificações** em tempo real

## 🏗 **Arquitetura Técnica**

### **Frontend**
- **React 18** + **Tailwind CSS**
- **PWA** com service workers
- **Responsive design** mobile-first
- **Context API** para estado global

### **Backend**
- **FastAPI** + **Python 3.11**
- **MongoDB** como banco de dados
- **JWT** para autenticação
- **Webhook** para PIX em tempo real

### **Integrações**
- **XGate API** - PIX real e conversão USDT
- **Asaas API** - Backup para pagamentos (mockado)

## 🚀 **Como Executar**

### **Pré-requisitos**
```bash
# Node.js 18+
node --version

# Python 3.11+
python --version

# MongoDB 5.0+
mongod --version
```

### **Instalação**

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/agitocoin.git
cd agitocoin
```

2. **Configure o Backend**
```bash
cd backend
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

3. **Configure o Frontend**
```bash
cd frontend
yarn install

# Configure a URL do backend
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

4. **Execute os Serviços**
```bash
# Terminal 1 - MongoDB
mongod

# Terminal 2 - Backend
cd backend
python server.py

# Terminal 3 - Frontend
cd frontend
yarn start
```

## 📋 **Credenciais de Teste**

### **Contas Demo Disponíveis:**
- **Cliente:** `cliente@demo.com` / `demo123`
- **Lojista:** `lojista@demo.com` / `demo123`
- **Master:** `master@agitocoin.com` / `master123`

### **Usuários Hierárquicos:**
- **Sócio Operador:** `socio.operador@agitocoin.com` / `socio123`
- **Mini Agência:** `mini.agencia@agitocoin.com` / `agencia123`
- **Consultor:** `consultor@agitocoin.com` / `consultor123`

## 🔧 **Configuração XGate (PIX Real)**

Para ativar o PIX real via XGate, configure no `.env`:

```env
XGATE_API_URL=https://api.xgateglobal.com
XGATE_EMAIL=seu_email@empresa.com
XGATE_PASSWORD=sua_senha_xgate
XGATE_ENVIRONMENT=production
XGATE_MOCK_MODE=false
```

**Sem credenciais XGate:** O sistema funciona em modo mock para desenvolvimento.

## 🌐 **Deploy em Produção**

### **Variáveis de Ambiente Obrigatórias:**
```env
# Backend
MONGO_URL=mongodb://sua_instancia/agitocoin
JWT_SECRET_KEY=chave_secreta_producao
XGATE_EMAIL=email_producao@empresa.com
XGATE_PASSWORD=senha_producao

# Frontend
REACT_APP_BACKEND_URL=https://seu-dominio.com
```

### **Build do Frontend:**
```bash
cd frontend
yarn build
```

### **Docker (Opcional):**
```bash
docker-compose up -d
```

## 📊 **Estrutura do Projeto**

```
agitocoin/
├── backend/                 # API FastAPI
│   ├── server.py           # Servidor principal
│   ├── services/           # Serviços (XGate, etc)
│   └── requirements.txt    # Dependências Python
├── frontend/               # App React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Context API
│   │   └── hooks/          # Hooks customizados
│   └── package.json        # Dependências Node.js
├── tests/                  # Testes automatizados
└── README.md              # Esta documentação
```

## 🔐 **Segurança**

- **JWT tokens** com expiração configurável
- **Validação de CPF/CNPJ** nos cadastros
- **Rate limiting** nas APIs sensíveis
- **Webhooks** assinados para PIX
- **Sanitização** de inputs do usuário

## 📈 **Monitoramento**

### **Health Check:**
```bash
curl https://seu-dominio.com/api/health
```

### **Logs do Sistema:**
```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Frontend logs (build)
yarn build --verbose
```

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 **Suporte**

- **Email:** suporte@agitocoin.com
- **WhatsApp:** +55 11 99999-9999
- **Documentação:** [docs.agitocoin.com](https://docs.agitocoin.com)

---

## 🎯 **Roadmap 2025**

- [ ] **App Mobile** nativo (React Native)
- [ ] **Mais criptomoedas** (BTC, ETH, BNB)
- [ ] **API pública** para desenvolvedores
- [ ] **Programa de afiliados** avançado
- [ ] **Cartão de débito** físico e virtual

**Desenvolvido com ❤️ para revolucionar os pagamentos digitais no Brasil!**