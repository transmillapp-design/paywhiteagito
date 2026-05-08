# 🏢 HIERARQUIA DO SISTEMA LABELVIEW

## 📊 Estrutura Hierárquica

O sistema Labelview possui uma estrutura hierárquica bem definida para controle de acesso e gestão:

```
┌─────────────────────────────────────────────┐
│          MASTER LABELVIEW                    │
│  (Acesso Total ao Sistema)                   │
│  Email: protecao@agitomil.com                │
└─────────────────┬───────────────────────────┘
                  │
                  ├─── UNIDADE 1 (Franquia)
                  │    │ 📝 CADASTRA: Regionais, Consultores, Clientes
                  │    │ 👁️ VISUALIZA: TODOS os dados
                  │    │
                  │    ├─── Regional Sul (Mini Agência)
                  │    │    │ 📝 Cadastra: Consultores, Clientes
                  │    │    │ 👁️ Vê: Seus dados + dados dos Consultores
                  │    │    ├─── Consultor A
                  │    │    │    └─── 📝 Cadastra: Clientes
                  │    │    ├─── Consultor B
                  │    │    │    └─── 📝 Cadastra: Clientes
                  │    │    └─── Consultor C
                  │    │         └─── 📝 Cadastra: Clientes
                  │    │
                  │    ├─── Regional Norte (Mini Agência)
                  │    │    └─── Consultores (cadastram clientes)...
                  │    │
                  │    └─── Regional Sudeste (Mini Agência)
                  │         └─── Consultores (cadastram clientes)...
                  │
                  ├─── UNIDADE 2 (Franquia)
                  │    └─── Regionais (Mini Agências)...
                  │         └─── Consultores...
                  │
                  └─── UNIDADE N (Franquia)
                       └─── Regionais (Mini Agências)...
                            └─── Consultores...
                            
┌─────────────────────────────────────────────┐
│  COLABORADORES (Funcionários Internos)      │
│  - Financeiro, Comercial, Operacional       │
│  - Trabalham para o Master Labelview        │
│  - NÃO gerenciam a rede externa             │
└─────────────────────────────────────────────┘
```

---

## 👑 NÍVEL 1: MASTER LABELVIEW

### Descrição
- **Posição**: Topo da hierarquia
- **Tipo**: Administrador geral do sistema
- **Identificação**: `is_labelview_master = true`

### Permissões
- ✅ **Acesso TOTAL ao sistema**
- ✅ Criar, editar e excluir Unidades (franquias)
- ✅ Visualizar todas as Unidades e seus dados
- ✅ Gerenciar todas as Regionais de todas as Unidades
- ✅ Gerenciar todos os Colaboradores do sistema
- ✅ Acesso a relatórios gerais e consolidados
- ✅ Configurações globais do sistema
- ✅ Gestão de comissões e regras gerais

### Funcionalidades Exclusivas
- Dashboard completo com visão geral
- Cadastro de novas Unidades (franquias)
- Definição de regras de negócio
- Controle financeiro global
- Gestão de contratos e licenças

---

## 🏪 NÍVEL 2: UNIDADE (FRANQUIA)

### Descrição
- **Posição**: Segundo nível da hierarquia
- **Tipo**: Franquia do Master Labelview
- **Identificação**: `is_labelview_unidade = true`
- **Relação**: Pertence ao Master, gerencia Regionais, Consultores e Colaboradores

### Características
- Possui identidade visual própria (logo + paleta de cores)
- CNPJ próprio e dados empresariais
- Responsável legal designado
- Área de atuação definida

### Permissões e Cadastros
**O que a Unidade CADASTRA:**
- ✅ **Regionais** (criar, editar, excluir)
- ✅ **Colaboradores** (criar, editar, excluir)
- ✅ **Clientes** (cadastrar e gerenciar)

**O que a Unidade VISUALIZA:**
- ✅ **Acesso a TUDO abaixo da Unidade**
- ✅ **TODOS os dados cadastrados pelos Regionais**
- ✅ **TODOS os dados cadastrados pelos Colaboradores**
- ✅ **TODOS os clientes** (próprios + dos Regionais + dos Colaboradores)
- ✅ Contratos, vendas e comissões de todos
- ✅ Relatórios consolidados da Unidade
- ✅ Gestão financeira completa

**Restrições:**
- ❌ **NÃO** pode acessar dados de outras Unidades
- ❌ **NÃO** pode criar novas Unidades

### Dados Cadastrados
- **Empresa**: Nome fantasia, Razão Social, CNPJ, Inscrições
- **Responsável**: Nome, CPF, Email, Documentos (RG/CNH)
- **Visual**: Logo 510x510px, 2 cores (primária e secundária)
- **Endereço**: Completo com CEP
- **Documentos**: Contrato Social, CNPJ, Nota Fiscal
- **Acesso**: Email e senha próprios

---

## 🗺️ NÍVEL 3: REGIONAL

### Descrição
- **Posição**: Terceiro nível da hierarquia
- **Tipo**: Divisão geográfica ou operacional da Unidade
- **Relação**: Pertence a uma Unidade específica

### Características
- Área geográfica definida (Ex: Sul, Norte, Sudeste)
- Equipe de Consultores e Colaboradores própria
- Metas e objetivos específicos
- Cadastra dados que a Unidade pode visualizar

### Permissões e Cadastros
**O que a Regional CADASTRA:**
- ✅ **Colaboradores** (criar, editar, excluir)
- ✅ **Clientes** (cadastrar e gerenciar)

**O que a Regional VISUALIZA:**
- ✅ **TUDO que cadastrou diretamente** (seus Colaboradores e Clientes)
- ✅ **TODOS os dados cadastrados pelos SEUS Colaboradores**
- ✅ **TODOS os clientes dos seus Colaboradores**
- ✅ Relatórios consolidados da Regional
- ✅ Gestão de comissões da Regional

**Importante:**
- ⚠️ Todos os dados cadastrados pela Regional são visíveis pela Unidade
- ⚠️ Todos os dados dos Colaboradores são visíveis pela Regional e Unidade

**Restrições:**
- ❌ **NÃO** pode acessar outras Regionais
- ❌ **NÃO** pode criar Unidades ou Regionais

---

## 👥 NÍVEL 4: COLABORADORES

### Descrição
- **Posição**: Nível operacional da hierarquia
- **Tipo**: Funcionários das Regionais
- **Identificação**: `is_labelview_employee = true`
- **Relação**: Pertence a uma Regional específica

### Tipos de Colaboradores

#### 💰 Financeiro
- Gestão financeira
- Controle de receitas e despesas
- Comissões e pagamentos

#### 💼 Comercial
- Vendas e negócios
- Relacionamento com clientes
- Prospecção e fechamento

#### ⚙️ Operacional
- Operações e logística
- Execução de serviços
- Suporte técnico

### Permissões e Cadastros
**O que o Colaborador CADASTRA:**
- ✅ **Clientes** (cadastrar e gerenciar apenas seus próprios)

**O que o Colaborador VISUALIZA:**
- ✅ Acesso ao próprio perfil
- ✅ **APENAS os clientes que cadastrou diretamente**
- ✅ Visualizar dados da própria Regional
- ✅ Relatórios pessoais
- ✅ Suas comissões

**Importante:**
- ⚠️ Todos os clientes cadastrados são visíveis pela Regional
- ⚠️ Todos os clientes cadastrados são visíveis pela Unidade

**Restrições:**
- ❌ **NÃO** pode acessar clientes de outros Colaboradores
- ❌ **NÃO** pode criar ou editar estrutura (Regionais, outros Colaboradores)
- ❌ **NÃO** pode modificar dados da Unidade ou Regional

### Dados Cadastrados
- **Pessoais**: Nome, CPF, WhatsApp, Foto
- **Endereço**: Completo
- **Tipo**: Financeiro, Comercial ou Operacional
- **Regional**: Vinculação à Regional
- **Comissão**: Percentual definido
- **Documentos**: RG/CNH (frente e verso)
- **Acesso**: Email e senha provisória

### Sobre os Tipos de Colaboradores
- **Financeiro**: Gestão financeira + cadastra clientes
- **Comercial**: Vendas e negócios + cadastra clientes  
- **Operacional**: Operações e logística + cadastra clientes
- **Todos os tipos** podem cadastrar e gerenciar seus próprios clientes

---

## 🔐 REGRAS DE ACESSO

### Princípio de Hierarquia
```
Master > Unidade > Regional (Mini Agência) > Consultor
```

### Controle de Acesso e Cadastros
1. **Master**: 
   - Acessa TUDO do sistema
   - **Cadastra**: Unidades + Colaboradores (funcionários internos do Master)

2. **Unidade**: 
   - **Cadastra**: Regionais (Mini Agências), Consultores, Clientes
   - **Visualiza**: TODA sua estrutura (Regionais + Consultores)
   - **Visualiza**: TODOS os dados dos Regionais
   - **Visualiza**: TODOS os dados dos Consultores
   - **Visualiza**: TODOS os clientes (próprios + Regionais + Consultores)
   
3. **Regional (Mini Agência)**: 
   - **Cadastra**: Consultores, Clientes
   - **Visualiza**: TUDO que cadastrou diretamente
   - **Visualiza**: TODOS os dados dos SEUS Consultores
   - **Visualiza**: TODOS os clientes dos Consultores
   - ⚠️ Dados cadastrados visíveis pela Unidade
   
4. **Consultor**: 
   - **Cadastra**: Clientes (apenas os seus)
   - **Visualiza**: APENAS seus próprios clientes
   - **NÃO vê**: Clientes de outros Consultores
   - ⚠️ Clientes cadastrados visíveis pela Regional e Unidade

---

## 👔 COLABORADORES (FUNCIONÁRIOS INTERNOS DO MASTER)

### Descrição
- **Posição**: Funcionários do Master Labelview (NÃO fazem parte da hierarquia de franquias)
- **Tipo**: Equipe interna da empresa Master
- **Identificação**: `is_labelview_employee = true`
- **Relação**: Trabalham para o Master Labelview

### Tipos de Colaboradores (Funcionários Internos)
- 💰 **Financeiro**: Gestão financeira do sistema Master
- 💼 **Comercial**: Vendas e negócios do Master
- ⚙️ **Operacional**: Operações e suporte do Master

### Acesso ao Sistema
- ✅ Acesso ao dashboard Master conforme classificação
- ✅ Permissões específicas por tipo (Financeiro, Comercial, Operacional)
- ✅ Visualizam dados conforme sua função
- ❌ NÃO gerenciam Unidades, Regionais ou Consultores (isso é função do Master)

### Diferença Colaborador vs Consultor
- **Colaboradores**: Funcionários INTERNOS do Master Labelview (equipe fixa)
- **Consultores**: Profissionais EXTERNOS nas Regionais das Unidades (rede de vendas)

### Transparência de Dados
- ⚠️ **CRÍTICO**: Unidade tem acesso TOTAL aos dados de Regionais e Consultores
- ⚠️ **CRÍTICO**: Regional tem acesso aos dados de seus Consultores
- ⚠️ **CRÍTICO**: Todos os CLIENTES cadastrados são visíveis pelos níveis superiores
- Consultores cadastram clientes que ficam visíveis para Regional e Unidade

### Quem Cadastra O Quê
- **Master**: Unidades + Colaboradores (funcionários internos)
- **Unidade**: Regionais (Mini Agências) + Consultores + Clientes
- **Regional (Mini Agência)**: Consultores + Clientes
- **Consultor**: Clientes (apenas)

### Isolamento de Dados
- Cada nível visualiza dados do seu escopo e abaixo
- Unidades são completamente isoladas umas das outras
- Regionais de diferentes Unidades não se veem
- Consultores de diferentes Regionais não se veem
- Consultor A não vê clientes de Consultor B
- Colaboradores (internos) não gerenciam a rede externa

---

## 📋 FLUXO DE CADASTRO

### 1. Master cadastra Unidade
```
Master → Dashboard → Pessoas → Unidades → Nova Unidade
```

### 2. Unidade cadastra Regional
```
Unidade Login → Dashboard → Regionais → Nova Regional
```

### 3. Regional/Unidade cadastra Consultor
```
Login → Dashboard → Pessoas → Consultores → Novo Consultor
```

### 4. Regional/Unidade cadastra Colaborador
```
Login → Dashboard → Pessoas → Colaboradores → Novo Colaborador
```

### 5. Consultor cadastra Cliente
```
Consultor Login → Dashboard → Clientes → Novo Cliente
(Dados visíveis pela Unidade e Regional)
```

---

## 💾 ESTRUTURA NO BANCO DE DADOS

### Campos de Identificação
```javascript
{
  // Master
  "is_labelview_master": true,
  "user_type": "labelview_master",
  
  // Unidade
  "is_labelview_unidade": true,
  "user_type": "labelview_unidade",
  "master_id": "id_do_master",
  
  // Regional
  "is_labelview_regional": true,
  "user_type": "labelview_regional",
  "unidade_id": "id_da_unidade",
  
  // Consultor
  "is_labelview_consultor": true,
  "user_type": "labelview_consultor",
  "regional_id": "id_da_regional",
  "unidade_id": "id_da_unidade",
  
  // Colaborador
  "is_labelview_employee": true,
  "user_type": "labelview_employee",
  "regional_id": "id_da_regional",
  "unidade_id": "id_da_unidade",
  "cargo": "Financeiro | Comercial | Operacional"
}

// Dados cadastrados por Consultores (visíveis pela Unidade)
{
  "tipo": "cliente | contrato | venda",
  "cadastrado_por": "id_do_consultor",
  "regional_id": "id_da_regional",
  "unidade_id": "id_da_unidade",  // Permite Unidade acessar
  "created_at": "timestamp",
  "dados": { ... }
}
```

---

## 🎨 IDENTIDADE VISUAL

### Master
- Cores padrão do sistema
- Azul: #1a59ad
- Verde: #2fa31c
- Cinza/Bege: #e3dcda

### Unidades
- Logo personalizado (510x510px)
- 2 cores personalizadas (primária e secundária)
- Branding próprio no sistema

### Aplicação
- Dashboard usa as cores da Unidade logada
- Emails e documentos com logo da Unidade
- Interface personalizada por Unidade

---

## 📊 RELATÓRIOS E DASHBOARDS

### Master Dashboard
- Visão geral de todas as Unidades
- Consolidado de Regionais
- Total de Colaboradores
- Receitas e comissões gerais
- Gráficos e métricas globais

### Unidade Dashboard
- Dados da própria Unidade
- Suas Regionais e performance
- Seus Consultores e Colaboradores
- **TODOS os clientes cadastrados pelos Consultores**
- **TODOS os contratos e vendas das Regionais**
- **TODOS os dados cadastrados por Regionais e Consultores**
- Receitas e comissões consolidadas
- Relatórios completos da Unidade

### Regional Dashboard
- Dados da Regional
- Consultores e Colaboradores da Regional
- **Clientes cadastrados pelos Consultores da Regional**
- **Contratos e vendas da Regional**
- Metas e resultados
- Comissões dos Consultores

### Consultor Dashboard
- Dados pessoais
- **Clientes cadastrados** (visíveis pela Unidade)
- **Contratos e vendas realizadas** (visíveis pela Unidade)
- Comissões recebidas
- Metas individuais

### Colaborador Dashboard
- Dados pessoais
- Tarefas atribuídas
- Comissões recebidas (se aplicável)
- Metas individuais

---

## 🔄 CASOS DE USO

### Exemplo 1: Master cria Unidade "São Paulo"
```
1. Master acessa dashboard
2. Vai em Pessoas > Unidades
3. Clica em "Nova Unidade"
4. Preenche dados da empresa (CNPJ, Nome)
5. Adiciona responsável
6. Faz upload do logo
7. Define cores da marca
8. Cadastra endereço
9. Anexa documentos
10. Define email e senha de acesso
11. Unidade "São Paulo" criada
```

### Exemplo 2: Unidade "São Paulo" cria Regional "Zona Sul"
```
1. Unidade faz login
2. Acessa Regionais
3. Cria "Regional Zona Sul"
4. Define área de atuação
5. Configura metas
6. Regional ativa e pronta para Colaboradores
```

### Exemplo 3: Regional adiciona Colaborador Comercial
```
1. Regional (ou Unidade) acessa Colaboradores
2. Clica em "Novo Colaborador"
3. Preenche dados pessoais
4. Seleciona tipo "Comercial" (card azul)
5. Define regional "Zona Sul"
6. Configura comissão 5%
7. Faz upload de documentos
8. Gera senha provisória
9. Colaborador pode fazer login
```

---

## ⚠️ IMPORTANTE

### Segurança
- Cada nível tem autenticação própria
- Senhas criptografadas (bcrypt)
- Tokens JWT para sessões
- Validação de permissões em cada requisição

### Auditoria
- Todos os cadastros registram quem criou
- Data e hora de criação
- Histórico de modificações
- Rastreabilidade completa

### Integridade
- Exclusão em cascata (Unidade > Regional > Colaborador)
- Dados isolados por Unidade
- Backup regular
- Validações de dados obrigatórios

---

## 🔍 TRANSPARÊNCIA DE DADOS - UNIDADE

### ⚠️ REGRA CRÍTICA: Acesso Total da Unidade

**A Unidade (franquia) tem acesso a TODOS os dados cadastrados por:**
- ✅ Suas Regionais
- ✅ Seus Consultores
- ✅ Seus Colaboradores

### O que a Unidade pode visualizar:

#### 📊 Dados de Regionais
- Performance de cada Regional
- Metas e resultados
- Equipe (Consultores e Colaboradores)
- Relatórios financeiros

#### 👥 Dados de Consultores
- **Clientes**: Todos os clientes cadastrados por cada Consultor
- **Contratos**: Todos os contratos fechados
- **Vendas**: Histórico completo de vendas
- **Comissões**: Valores gerados e pagos
- **Performance**: Métricas de desempenho
- **Atendimentos**: Histórico de interações

#### 💼 Dados de Colaboradores
- Atividades realizadas
- Tarefas e projetos
- Performance operacional
- Comissões (se aplicável)

### Fluxo de Dados

```
Consultor cadastra Cliente
         ↓
Cliente fica visível para:
  1. Consultor (criador)
  2. Regional (superior do Consultor)
  3. Unidade (proprietária da estrutura) ✅
  4. Master (acesso total)

Regional cadastra Contrato
         ↓
Contrato fica visível para:
  1. Regional (criador)
  2. Unidade (proprietária) ✅
  3. Master (acesso total)
```

### Implementação Técnica

**Todos os dados devem ter:**
```javascript
{
  "unidade_id": "id_da_unidade",  // OBRIGATÓRIO
  "regional_id": "id_da_regional",
  "cadastrado_por": "id_do_usuario",
  "tipo_cadastrador": "consultor | regional | colaborador",
  "created_at": "timestamp"
}
```

**Query para Unidade visualizar dados:**
```javascript
// A Unidade vê TUDO com seu unidade_id
db.clientes.find({ "unidade_id": unidade_id })
db.contratos.find({ "unidade_id": unidade_id })
db.vendas.find({ "unidade_id": unidade_id })
```

**Query para Consultor visualizar dados:**
```javascript
// Consultor vê apenas seus próprios dados
db.clientes.find({ "cadastrado_por": consultor_id })
db.contratos.find({ "cadastrado_por": consultor_id })
```

### Benefícios dessa Estrutura

1. **Controle Total**: Unidade monitora toda operação
2. **Transparência**: Dados consolidados em tempo real
3. **Gestão Eficiente**: Decisões baseadas em dados completos
4. **Comissões**: Cálculo preciso de comissões de todos
5. **Relatórios**: Visão 360° da Unidade

### Privacidade entre Níveis

✅ **Unidade vê dados de Consultores**: SIM
❌ **Consultor A vê dados de Consultor B**: NÃO
❌ **Regional A vê dados de Regional B**: NÃO
❌ **Unidade X vê dados de Unidade Y**: NÃO

---

## 📞 CONTATOS

### Acesso Master
- Email: protecao@agitomil.com
- Senha: demo123
- Acesso: `/labelview/login`

### Suporte
- Sistema: AgitoMil / Labelview
- Proteção Veicular

---

**Última atualização**: Novembro 2025
**Versão do documento**: 1.0
