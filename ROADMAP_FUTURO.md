# Roadmap Futuro - Transmill

## Fase 1: PWA para Clientes das Unidades Labelview (PRÓXIMA)
- Criar PWA customizado para cada unidade do Labelview
- Botões de nova cotação e serviços de assistência 24h
- Layout personalizado por unidade
- Login com credenciais Transmill (email/senha)
- **Status:** Aguardando início

---

## Fase 1.5: App de Mobilidade (SERVIDOR SEPARADO)

### Arquitetura
- **Servidor Emergent separado** para não pesar no Transmill
- Comunicação via API REST com Transmill
- Usuários (clientes e motoristas) usam **mesma conta Transmill**
- Pagamentos debitam/creditam **carteira Transmill**

### Documentação completa
Ver arquivo: `/app/INTEGRACAO_MOBILIDADE.md`

### Funcionalidades do Motorista
- [ ] Cadastro como motorista (usa conta Transmill existente)
- [ ] Perfil com dados do veículo (placa, modelo, cor, ano)
- [ ] Configurar valores: taxa mínima + valor por km
- [ ] Ficar online/offline para receber corridas
- [ ] Aceitar/recusar corridas
- [ ] Histórico de corridas e ganhos

### Funcionalidades do Cliente
- [ ] Acessa via Card "Mobilidade" no Transmill
- [ ] Solicitar corrida (origem → destino)
- [ ] Ver motoristas próximos
- [ ] Acompanhar corrida em tempo real
- [ ] Avaliar motorista
- [ ] Pagamento via carteira Transmill

### Fluxo de Pagamento
```
Cliente solicita corrida
    ↓
Motorista aceita
    ↓
Corrida finalizada
    ↓
Servidor Mobilidade → API Transmill
    ↓
Transmill debita cliente (-R$ 25,50)
Transmill credita motorista (+R$ 22,95)
Transmill recebe taxa (+R$ 2,55)
```

### Comunicação entre Servidores
- Transmill expõe endpoints para validar token e movimentar saldo
- Mobilidade valida usuários via API do Transmill
- Chave compartilhada para autenticação entre servidores

**Status:** Aguardando início

---

## Fase 2: Rede Social Transmill (FUTURO)
- Criar PWA customizado para cada unidade do Labelview
- Botões de nova cotação e serviços de assistência 24h
- Layout personalizado por unidade
- Login com credenciais Transmill (email/senha)
- **Status:** Aguardando início

---

## Fase 2: Rede Social Transmill (FUTURO)

### Referência: ButFlow (butflow.com.br)
Criar uma rede social inspirada no ButFlow, onde o perfil do usuário dá acesso aos serviços do Transmill.

### Funcionalidades da Rede Social:

#### Feed de Conteúdo
- [ ] Feed de vídeos curtos (estilo TikTok/Reels)
- [ ] Upload de vídeos
- [ ] Player de vídeo em tela cheia com scroll vertical
- [ ] Curtidas, comentários, compartilhamentos
- [ ] Salvar posts

#### Sistema de Perfil
- [ ] Perfil público com foto, bio, estatísticas
- [ ] Badge de verificação (Pessoa Física / Pessoa Jurídica / Empresa)
- [ ] Contador de: Seguindo, Seguidores, Curtidas, Visualizações
- [ ] Botões: Seguir, Mensagem
- [ ] Links: WhatsApp, site externo

#### Abas de Serviços no Perfil (integração com Transmill existente)
- [ ] 🏦 **Banco/Carteira** → Carteira XGate (já existe)
- [ ] 🛒 **Shopping** → Lojas Transmill (já existe)
- [ ] 🏥 **Saúde** → Telemedicina (já existe)
- [ ] 📱 **Internet** → Planos de Internet Móvel (já existe)
- [ ] 💼 **Serviços** → Prestadores de Serviço (já existe)
- [ ] 🎁 **Indicar** → Sistema de Indicação/Cashback (já existe)

#### Funcionalidades Adicionais (avaliar)
- [ ] 📺 Lives ao vivo
- [ ] 🚗 Mobilidade (tipo Uber)
- [ ] 📈 Investimentos
- [ ] 💬 Mensagens diretas (chat)

#### Navegação (Barra Inferior)
- [ ] 🏠 Feed
- [ ] 🔍 Descobrir (busca)
- [ ] ➕ Postar
- [ ] 💬 Mensagens
- [ ] 👤 Perfil

### Integrações Necessárias
- Cloudinary/AWS S3 - Armazenamento de vídeos
- FFmpeg - Processamento de vídeos
- WebRTC/Agora.io - Lives (se necessário)

### Estimativa de Tempo
- MVP Feed + Perfil + Serviços: 4-6 semanas
- Lives: +3-4 semanas
- Chat/Mensagens: +1-2 semanas

---

## Observações
- Data de criação deste documento: 2025-12-26
- Aguardando sinal do usuário para iniciar cada fase
- A Fase 2 só começará após conclusão da Fase 1

---

## Fase 3: Sistema White Label de Franquias (PLANEJADO)

### Visão Geral
Transformar o Transmill em plataforma White Label onde cada franquia estadual terá:
- **Domínio próprio** (ex: transmillsp.com.br, transmillrj.com.br)
- **Logo e cores personalizadas**
- **Textos customizados**
- **Dados 100% isolados**
- **Serviços configuráveis por franquia**

### Funcionalidades do Master Transmill
- Criar e gerenciar franquias
- Definir quais serviços cada franquia pode oferecer
- Configurar taxas e comissões
- Dashboard consolidado de todas franquias

### Funcionalidades da Franquia
- Painel administrativo próprio (réplica do Master, dados filtrados)
- Configurar identidade visual (logo, cores, textos)
- PWA com branding próprio
- Gestão de usuários da franquia

### Serviços Configuráveis por Franquia
| Serviço | Descrição |
|---------|-----------|
| Mobilidade | Corridas P2P |
| Proteção Veicular | Proteção de veículos |
| Marketplace | Loja de produtos |
| Telemedicina | Consultas online |
| Internet | Planos de internet |
| Recarga | Recarga de celular |
| Pagamentos | Boletos e contas |
| PIX | Transferências PIX |
| Cashback | Sistema de cashback |
| Indicação | Programa de indicação |

### Documentação Completa
Ver arquivo: `/app/WHITELABEL_FRANQUIAS.md`

### Estimativa
- **Tempo:** 22-34 dias
- **Status:** PLANEJAMENTO

---

## Referências
- Site analisado: https://butflow.com.br
- Acesso sem login: https://butflow.com.br/butflow/app?guest=1
