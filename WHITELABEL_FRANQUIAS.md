# 🏢 TRANSMILL WHITE LABEL - Sistema de Franquias
## Documento de Planejamento e Especificação Técnica

**Versão:** 1.0  
**Data:** 13/01/2026  
**Status:** PLANEJAMENTO  

---

## 📋 SUMÁRIO EXECUTIVO

O sistema Transmill será transformado em uma plataforma White Label, permitindo que cada franquia estadual opere com:
- Domínio próprio
- Identidade visual personalizada (logo, cores, textos)
- Dados completamente isolados
- Serviços configuráveis por franquia

---

## 🏗️ ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER TRANSMILL                              │
│              app.transmill.com.br (Super Admin)                  │
│                                                                  │
│  • Criar/Gerenciar Franquias                                    │
│  • Definir serviços disponíveis por franquia                    │
│  • Ver estatísticas consolidadas                                │
│  • Gerenciar planos e preços                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Central
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   FRANQUIA SP   │  │   FRANQUIA RJ   │  │   FRANQUIA MG   │
│                 │  │                 │  │                 │
│ transmillsp.    │  │ transmillrj.    │  │ transmillmg.    │
│ com.br          │  │ com.br          │  │ com.br          │
│                 │  │                 │  │                 │
│ ✅ Mobilidade   │  │ ✅ Mobilidade   │  │ ❌ Mobilidade   │
│ ✅ Proteção     │  │ ❌ Proteção     │  │ ✅ Proteção     │
│ ✅ Marketplace  │  │ ✅ Marketplace  │  │ ✅ Marketplace  │
│ ❌ Telemedicina │  │ ✅ Telemedicina │  │ ✅ Telemedicina │
│                 │  │                 │  │                 │
│ Logo: ████      │  │ Logo: ████      │  │ Logo: ████      │
│ Cor:  #FF0000   │  │ Cor:  #00FF00   │  │ Cor:  #0000FF   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │    MONGODB        │
                    │                   │
                    │ • franquias       │
                    │ • users           │
                    │ • transactions    │
                    │ • rides           │
                    │ (todos com        │
                    │  franquia_id)     │
                    └───────────────────┘
```

---

## 📊 MODELO DE DADOS

### Coleção: `franquias`

```javascript
{
  "id": "fra_uuid",
  "codigo": "SP",                    // Código único da franquia
  "nome": "Transmill São Paulo",
  "nome_fantasia": "TSP",
  "cnpj": "00.000.000/0001-00",
  "estado": "SP",
  
  // Domínio e Acesso
  "dominio": "transmillsp.com.br",
  "dominio_ativo": true,
  
  // Identidade Visual
  "branding": {
    "logo_url": "https://cloudinary.com/.../logo_sp.png",
    "logo_escuro_url": "https://cloudinary.com/.../logo_sp_dark.png",
    "favicon_url": "https://cloudinary.com/.../favicon_sp.ico",
    "cores": {
      "primaria": "#005B9C",
      "secundaria": "#CEAE31",
      "terciaria": "#6B8239",
      "fundo_claro": "#F5F5F5",
      "fundo_escuro": "#293618",
      "texto_claro": "#333333",
      "texto_escuro": "#FFFFFF"
    },
    "textos": {
      "nome_exibicao": "Transmill SP",
      "slogan": "Sua plataforma financeira em SP",
      "rodape": "© 2026 Transmill SP - Todos os direitos reservados",
      "suporte_email": "suporte@transmillsp.com.br",
      "suporte_whatsapp": "11999999999"
    }
  },
  
  // PWA Configuração
  "pwa": {
    "nome": "Transmill São Paulo",
    "nome_curto": "TSP",
    "descricao": "App financeiro para São Paulo",
    "cor_tema": "#005B9C",
    "cor_fundo": "#FFFFFF",
    "icone_192": "https://...",
    "icone_512": "https://..."
  },
  
  // Serviços Habilitados
  "servicos": {
    "mobilidade": true,
    "protecao_veicular": true,
    "marketplace": true,
    "telemedicina": false,
    "internet": true,
    "recarga_celular": true,
    "pagamento_contas": true,
    "pix": true,
    "transferencias": true,
    "cashback": true,
    "indicacao": true,
    "labelview": false
  },
  
  // Configurações Financeiras
  "financeiro": {
    "taxa_plataforma": 10.0,         // % que Master Transmill recebe
    "taxa_franquia": 5.0,            // % que franquia recebe
    "cashback_padrao": 5.0
  },
  
  // Administrador da Franquia
  "admin": {
    "user_id": "user_uuid",
    "nome": "João Silva",
    "email": "admin@transmillsp.com.br",
    "telefone": "11999999999"
  },
  
  // Endereço
  "endereco": {
    "logradouro": "Av. Paulista",
    "numero": "1000",
    "complemento": "Sala 100",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  },
  
  // Controle
  "ativo": true,
  "created_at": "2026-01-13T00:00:00Z",
  "updated_at": "2026-01-13T00:00:00Z"
}
```

### Modificação nas Coleções Existentes

Todas as coleções que precisam ser isoladas por franquia receberão o campo:

```javascript
{
  // ... campos existentes ...
  "franquia_id": "fra_uuid"  // NULL = dados do Master Transmill
}
```

**Coleções afetadas:**
- `users`
- `transactions`
- `rides` (mobilidade)
- `driver_profiles`
- `orders`
- `products`
- `services`
- `protecao_veicular`
- `notifications`

---

## 🖥️ PAINÉIS DO SISTEMA

### 1. Painel Master Transmill (Super Admin)

**URL:** `app.transmill.com.br/master`

**Funcionalidades:**
- Dashboard com estatísticas de TODAS as franquias
- CRUD de Franquias (criar, editar, ativar/desativar)
- Configurar serviços por franquia
- Ver usuários de todas franquias
- Relatórios consolidados
- Configurar taxas e comissões
- Gerenciar planos globais

### 2. Painel da Franquia (Admin Franquia)

**URL:** `[dominio-franquia]/admin`

**Funcionalidades:**
- Dashboard com estatísticas da SUA franquia apenas
- Gerenciar usuários da franquia
- Ver transações da franquia
- Configurar identidade visual (logo, cores, textos)
- Relatórios da franquia
- Suporte aos clientes da franquia

### 3. App do Cliente (por Franquia)

**URL:** `[dominio-franquia]`

**Funcionalidades:**
- Identidade visual da franquia
- Apenas serviços habilitados para a franquia
- PWA com branding da franquia
- Dados isolados

---

## 🎨 SISTEMA DE TEMAS DINÂMICOS

### Fluxo de Carregamento

```
1. Cliente acessa: transmillsp.com.br
                      │
2. Backend identifica franquia pelo domínio
                      │
3. Retorna configurações de branding
                      │
4. Frontend aplica:
   • CSS Variables com cores
   • Logo no header
   • Textos personalizados
   • Manifest.json dinâmico
```

### Implementação CSS

```css
:root {
  /* Cores injetadas dinamicamente */
  --cor-primaria: var(--franquia-primaria, #005B9C);
  --cor-secundaria: var(--franquia-secundaria, #CEAE31);
  --cor-fundo: var(--franquia-fundo, #F5F5F5);
  --cor-texto: var(--franquia-texto, #333333);
}
```

### Manifest.json Dinâmico

```javascript
// Endpoint: GET /api/manifest.json
// Retorna manifest baseado no domínio

{
  "name": "Transmill São Paulo",      // Dinâmico
  "short_name": "TSP",                // Dinâmico
  "theme_color": "#005B9C",           // Dinâmico
  "background_color": "#FFFFFF",      // Dinâmico
  "icons": [
    { "src": "/api/pwa/icon-192.png" } // Dinâmico
  ]
}
```

---

## 🔧 SERVIÇOS CONFIGURÁVEIS

### Lista de Serviços

| Serviço | Descrição | Configurável |
|---------|-----------|--------------|
| `mobilidade` | Corridas P2P (tipo Uber) | ✅ |
| `protecao_veicular` | Proteção de veículos | ✅ |
| `marketplace` | Loja de produtos | ✅ |
| `telemedicina` | Consultas médicas online | ✅ |
| `internet` | Planos de internet | ✅ |
| `recarga_celular` | Recarga de celular | ✅ |
| `pagamento_contas` | Pagamento de boletos | ✅ |
| `pix` | Transferências PIX | ✅ |
| `transferencias` | Transferências internas | ✅ |
| `cashback` | Sistema de cashback | ✅ |
| `indicacao` | Programa de indicação | ✅ |
| `labelview` | Sistema Labelview | ✅ |

### Lógica no Frontend

```javascript
// Verificar se serviço está habilitado
const servicoAtivo = (servico) => {
  return franquia?.servicos?.[servico] === true;
};

// No componente
{servicoAtivo('mobilidade') && (
  <CardMobilidade />
)}
```

---

## 📡 ENDPOINTS DA API

### Franquias (Master)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/master/franquias` | Listar todas franquias |
| POST | `/api/master/franquias` | Criar franquia |
| GET | `/api/master/franquias/{id}` | Detalhes da franquia |
| PUT | `/api/master/franquias/{id}` | Atualizar franquia |
| DELETE | `/api/master/franquias/{id}` | Desativar franquia |
| PUT | `/api/master/franquias/{id}/servicos` | Configurar serviços |
| PUT | `/api/master/franquias/{id}/branding` | Configurar visual |
| GET | `/api/master/franquias/stats` | Estatísticas consolidadas |

### Identificação de Franquia

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/franquia/identificar` | Identifica franquia pelo domínio |
| GET | `/api/franquia/config` | Retorna configurações públicas |
| GET | `/api/manifest.json` | Manifest dinâmico para PWA |
| GET | `/api/pwa/icon-{size}.png` | Ícones dinâmicos |

---

## 🔒 SEGURANÇA E ISOLAMENTO

### Middleware de Franquia

```python
async def get_franquia_from_request(request: Request):
    """
    Identifica a franquia baseado no domínio da requisição.
    """
    host = request.headers.get("host", "")
    
    # Buscar franquia pelo domínio
    franquia = await db.franquias.find_one({
        "dominio": host,
        "ativo": True
    })
    
    return franquia
```

### Filtro Automático de Dados

```python
async def get_users_da_franquia(franquia_id: str):
    """
    Retorna apenas usuários da franquia especificada.
    """
    return await db.users.find({
        "franquia_id": franquia_id
    }).to_list(1000)
```

---

## 📱 PWA POR FRANQUIA

### Instalação Independente

Cada franquia terá seu próprio PWA instalável:

- **Nome:** Personalizado (ex: "Transmill SP")
- **Ícone:** Logo da franquia
- **Cores:** Tema da franquia
- **Splash Screen:** Branding da franquia

### Service Worker

```javascript
// service-worker.js
const FRANQUIA_ID = self.__FRANQUIA_ID__;
const CACHE_NAME = `transmill-${FRANQUIA_ID}-v1`;
```

---

## 📅 FASES DE IMPLEMENTAÇÃO

### Fase 1: Infraestrutura (5-7 dias)
- [ ] Criar coleção `franquias` no MongoDB
- [ ] Implementar middleware de identificação
- [ ] Adicionar `franquia_id` nas coleções existentes
- [ ] Criar endpoints básicos de CRUD de franquias

### Fase 2: Painel Master de Franquias (5-7 dias)
- [ ] Tela de listagem de franquias
- [ ] Formulário de criação de franquia
- [ ] Configuração de serviços por franquia
- [ ] Upload de logo e configuração de cores
- [ ] Dashboard consolidado

### Fase 3: Sistema de Temas (3-5 dias)
- [ ] CSS Variables dinâmicas
- [ ] Componente de carregamento de tema
- [ ] Manifest.json dinâmico
- [ ] Ícones dinâmicos para PWA

### Fase 4: Isolamento de Dados (3-5 dias)
- [ ] Migrar dados existentes (adicionar franquia_id)
- [ ] Filtros automáticos em todas queries
- [ ] Validação de acesso por franquia

### Fase 5: Painel da Franquia (3-5 dias)
- [ ] Replicar painel Master com filtros
- [ ] Configurações de branding
- [ ] Relatórios da franquia

### Fase 6: Testes e Ajustes (3-5 dias)
- [ ] Testes com múltiplas franquias
- [ ] Configuração de domínios
- [ ] Ajustes de performance

**Tempo Total Estimado: 22-34 dias**

---

## 💰 MODELO DE NEGÓCIO

### Fluxo Financeiro

```
Cliente paga R$ 100,00
        │
        ▼
┌───────────────────┐
│ Taxa Plataforma   │ → R$ 10,00 (10%) → Master Transmill
│ (Master Transmill)│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Taxa Franquia     │ → R$ 5,00 (5%) → Franquia SP
│                   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Valor Líquido     │ → R$ 85,00 → Prestador/Lojista
│                   │
└───────────────────┘
```

---

## 📝 NOTAS IMPORTANTES

1. **Domínios:** Cada franquia é responsável por registrar e configurar seu próprio domínio, apontando para os servidores Transmill.

2. **Dados:** Os dados são 100% isolados. Uma franquia NÃO consegue ver dados de outra.

3. **Serviços:** O Master Transmill tem controle total sobre quais serviços cada franquia pode oferecer.

4. **Branding:** Cada franquia pode personalizar completamente sua identidade visual sem afetar outras franquias.

5. **Escalabilidade:** O sistema suporta número ilimitado de franquias usando a mesma infraestrutura.

---

## 🔗 DOCUMENTOS RELACIONADOS

- `/app/ROADMAP_FUTURO.md` - Roadmap geral do projeto
- `/app/INTEGRACAO_MOBILIDADE.md` - Documentação do módulo de mobilidade
- `/app/version.json` - Controle de versões

---

**Documento criado em:** 13/01/2026  
**Última atualização:** 13/01/2026  
**Autor:** Agente E1 - Emergent Labs
