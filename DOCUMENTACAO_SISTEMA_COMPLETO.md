# 📚 DOCUMENTAÇÃO COMPLETA - SISTEMA TRANSMILL + LABELVIEW

## 🎯 VISÃO GERAL DO SISTEMA

### **TRANSMILL**
Plataforma de meio de pagamento e distribuição de cashback.
- Carteira digital
- Sistema de cashback
- Marketplace
- Gestão financeira

### **LABELVIEW**
Sistema de proteção veicular integrado ao Transmill.
- Gestão de contratos de proteção veicular
- Hierarquia de vendas (Master → Unidade → Regional → Consultor)
- Sistema de comissionamento
- CRM de clientes e leads

---

## 🏗️ ARQUITETURA DO SISTEMA

```
TRANSMILL (Plataforma Base)
    ↓
LABELVIEW (Sistema de Proteção Veicular)
    ↓
Hierarquia: Master → Unidade → Regional → Consultor
```

### **Integração**:
- Todas as contas Labelview são **também contas Transmill**
- Um único login dá acesso a ambos os sistemas
- Cashback e pagamentos são processados pelo Transmill
- Labelview usa a carteira digital do Transmill

---

## 👥 HIERARQUIA LABELVIEW

### 1. **MASTER LABELVIEW** (Topo)
**Conta:** protecao@agitomil.com
**Permissões:**
- ✅ Acesso TOTAL ao sistema
- ✅ Criar e gerenciar Unidades
- ✅ Visualizar TUDO (todas Unidades, Regionais, Consultores)
- ✅ Configurar tabelas de valores
- ✅ Definir comissões
- ✅ Painel master com visão geral

**O que pode fazer:**
- Cadastrar novas Unidades (franquias)
- Ver todos os dados de todas as Unidades
- Configurar valores e comissões
- Enviar notificações para todos

---

### 2. **UNIDADE** (Franquia)
**Tipo:** Franquia do Master Labelview
**Cadastrado por:** Master
**Precisa de:** Email + Senha (cria conta Transmill + Labelview)

**Dados Obrigatórios:**
- Nome Fantasia
- Razão Social
- CNPJ
- Responsável (nome, CPF, email)
- Chave PIX
- Logo (identidade visual)
- Taxa de Adesão
- Intervalo de vencimento (ex: dia 1 a 15)
- **Email e Senha** para acesso

**Permissões:**
- ✅ Criar e gerenciar suas Regionais
- ✅ Criar e gerenciar seus Consultores
- ✅ Ver TODOS os dados de suas Regionais e Consultores
- ✅ Ver contratos, vendas e clientes cadastrados por qualquer um abaixo dela
- ✅ Configurar seus próprios planos de proteção
- ❌ NÃO pode ver outras Unidades
- ❌ NÃO pode criar novas Unidades

**Identidade Visual:**
- Cada Unidade tem logo próprio
- Define 2 cores (primária e secundária)
- Identidade usada nos contratos e comunicações

---

### 3. **REGIONAL** (Mini Agência)
**Tipo:** Divisão geográfica/operacional da Unidade
**Cadastrado por:** Master ou Unidade
**Precisa de:** Email + Senha (cria conta Transmill + Labelview)

**Pode ser:**
- **Pessoa Física** (CPF, RG, dados pessoais)
- **Pessoa Jurídica** (CNPJ, Razão Social, Inscrição)

**Dados Obrigatórios:**
- Unidade vinculada
- Natureza (Física ou Jurídica)
- Dados conforme natureza
- Nome de exibição
- Comissionamento (adesão e mensalidade)
- **Email e Senha** para acesso

**Permissões:**
- ✅ Criar e gerenciar seus Consultores
- ✅ Ver dados de seus Consultores
- ✅ Cadastrar clientes e leads
- ✅ Ver suas próprias vendas e contratos
- ❌ NÃO pode ver outras Regionais
- ❌ NÃO pode criar novas Regionais

**Comissionamento:**
- 🎯 **Adesão:** Recebe 100% se vender diretamente (rede direta)
- 💰 **Mensalidade:** Recebe % configurado sobre mensalidades recorrentes
- Pode ser valor fixo (R$) ou percentual (%)

---

### 4. **CONSULTOR** (Vendedor)
**Tipo:** Vendedor individual
**Cadastrado por:** Master, Unidade ou Regional
**Precisa de:** Email + Senha (cria conta Transmill + Labelview)

**Pode ser:**
- **Pessoa Física** (CPF, RG, dados pessoais)
- **Pessoa Jurídica** (CNPJ, Razão Social)

**Dados Obrigatórios:**
- Unidade vinculada
- Regional vinculada (opcional)
- Natureza (Física ou Jurídica)
- Dados conforme natureza
- Nome de exibição
- Comissionamento (adesão e mensalidade)
- **Email e Senha** para acesso

**Permissões:**
- ✅ Cadastrar clientes
- ✅ Criar leads no CRM
- ✅ Vender contratos de proteção
- ✅ Ver suas próprias vendas
- ✅ Receber comissões por vendas
- ❌ NÃO pode ver outros Consultores
- ❌ NÃO pode criar novos Consultores

**Comissionamento:**
- 🎯 **Adesão:** Recebe 100% se vender diretamente (rede direta)
- 💰 **Mensalidade:** Recebe % configurado sobre mensalidades recorrentes
- Comissão de mensalidade deduzida da Regional (se houver)

---

## 🔐 SISTEMA DE LOGIN E ACESSO

### **Como Funciona:**

1. **Cadastro no Painel Master:**
   - Master cadastra Unidade no painel Labelview
   - Unidade cadastra Regional no painel Labelview
   - Regional cadastra Consultor no painel Labelview

2. **Criação Automática de Conta:**
   - Sistema cria conta no **Transmill**
   - Sistema cria acesso ao **Labelview**
   - Mesmo email/senha para ambos

3. **Senha Provisória:**
   - Ao cadastrar, é gerada uma senha provisória
   - Senha é exibida **UMA ÚNICA VEZ** em modal
   - Usuário deve copiar e guardar
   - No primeiro login, deve alterar a senha

4. **Acesso ao Sistema:**
   ```
   URL: https://app.transmill.com.br
   
   Login com email/senha
       ↓
   Acessa Transmill (dashboard principal)
       ↓
   Menu Perfil → "Labelview"
       ↓
   Painel Labelview (conforme hierarquia)
   ```

---

## 💰 SISTEMA DE COMISSIONAMENTO

### **Regra de Ouro:**
🎯 **ADESÃO:** Fica 100% com quem indicou o cliente **DIRETAMENTE** (rede direta)
💰 **MENSALIDADE:** Distribui conforme hierarquia configurada

---

### **Como Funciona:**

**Exemplo:** Cliente contrata proteção de R$ 1.000,00/mês com taxa de adesão de R$ 500,00

**Taxa de Adesão (R$ 500,00):**
- ✅ **100% para quem indicou o cliente diretamente**
- ❌ **NÃO** divide com outros níveis da hierarquia
- **Cenários:**
  - Se Consultor vendeu direto → Consultor recebe R$ 500,00 (100%)
  - Se Regional vendeu direto → Regional recebe R$ 500,00 (100%)
  - Se Unidade vendeu direto → Unidade recebe R$ 500,00 (100%)

**Mensalidade Recorrente (R$ 1.000,00/mês):**
- Regional configurado com 20% = R$ 200,00/mês
- Consultor configurado com 5% = R$ 50,00/mês
- **Distribuição:**
  - Consultor recebe: R$ 50,00
  - Regional recebe: R$ 200 - R$ 50 = R$ 150,00 (deduzido o consultor)
  - Unidade recebe o restante

**Pagamento:**
- Comissões creditadas na carteira Transmill
- Disponível para saque ou uso na plataforma
- Mensalidades pagas recorrentemente

---

## 📊 REGRAS DE VISIBILIDADE

### **O que cada nível VÊ:**

**Master:**
- ✅ Todas as Unidades
- ✅ Todas as Regionais
- ✅ Todos os Consultores
- ✅ Todos os clientes e contratos
- ✅ Todos os dados financeiros

**Unidade:**
- ✅ Suas próprias Regionais
- ✅ Seus próprios Consultores
- ✅ TODOS os clientes cadastrados por suas Regionais
- ✅ TODOS os contratos vendidos por seus Consultores
- ❌ Outras Unidades

**Regional:**
- ✅ Seus próprios Consultores
- ✅ Clientes cadastrados por seus Consultores
- ✅ Suas próprias vendas
- ❌ Outras Regionais
- ❌ Unidade (não vê dados da Unidade)

**Consultor:**
- ✅ Apenas seus próprios clientes
- ✅ Apenas suas próprias vendas
- ✅ Seus leads e contratos
- ❌ Outros Consultores
- ❌ Regional/Unidade

---

## 📝 FLUXO DE CADASTRO COMPLETO

### **1. Master Cadastra Unidade:**

```
1. Login: protecao@agitomil.com
2. Dashboard Labelview → Hierarquia → Unidades
3. Botão "Nova Unidade"
4. Preencher:
   - Dados da Empresa (CNPJ, Razão Social)
   - Dados do Responsável (CPF, Email)
   - Chave PIX para recebimentos
   - Logo (PNG 510x510px)
   - Cores (primária e secundária)
   - Taxa de Adesão
   - Intervalo de vencimento (ex: 1 a 15)
   - EMAIL e SENHA de acesso
5. Clicar "Cadastrar Unidade"
6. COPIAR credenciais do modal
7. Enviar para o responsável da Unidade
```

### **2. Unidade Cadastra Regional:**

```
1. Login com credenciais da Unidade
2. Menu Perfil → "Labelview"
3. Hierarquia → Regionais
4. Botão "Nova Regional"
5. Selecionar natureza (Física ou Jurídica)
6. Preencher dados conforme natureza
7. Configurar comissionamento
8. EMAIL e SENHA de acesso
9. Clicar "Cadastrar Regional"
10. COPIAR credenciais do modal
11. Enviar para o responsável da Regional
```

### **3. Regional Cadastra Consultor:**

```
1. Login com credenciais da Regional
2. Menu Perfil → "Labelview"
3. Hierarquia → Consultores
4. Botão "Novo Consultor"
5. Selecionar natureza (Física ou Jurídica)
6. Preencher dados conforme natureza
7. Configurar comissionamento
8. EMAIL e SENHA de acesso
9. Clicar "Cadastrar Consultor"
10. COPIAR credenciais do modal
11. Enviar para o Consultor
```

---

## ⚠️ PONTOS IMPORTANTES

### **Senha Provisória:**
- ✅ Exibida apenas UMA VEZ após cadastro
- ✅ Deve ser copiada imediatamente
- ✅ Modal permite copiar email e senha
- ✅ Botão "Copiar Tudo" copia formatado
- ⚠️ NÃO é possível recuperar depois

### **Primeiro Acesso:**
- ✅ Login em https://app.transmill.com.br
- ✅ Sistema solicita troca de senha
- ✅ Após trocar, acessa normalmente
- ✅ Menu Perfil → "Labelview" dá acesso ao painel

### **Estrutura de Email:**
- ✅ Deve ser único no sistema
- ✅ Mesmo email para Transmill e Labelview
- ✅ Usado para login e comunicações
- ⚠️ Não pode ser duplicado

---

## 🎨 IDENTIDADE VISUAL (Unidade)

Cada Unidade tem identidade própria:

**Logo:**
- Formato: PNG
- Tamanho recomendado: 510x510px
- Máximo: 5MB
- Usado em contratos e comunicações

**Cores:**
- **Primária:** Cor principal da marca
- **Secundária:** Cor complementar
- Usadas no painel e documentos

---

## 💳 SISTEMA FINANCEIRO

### **Transmill (Base):**
- Carteira digital BRL
- Saldo de cashback
- Histórico de transações
- Saques e transferências

### **Labelview (Integrado):**
- Taxa de Adesão → Transmill
- Mensalidades → Transmill
- Comissões → Carteira Transmill
- Split automático de pagamentos

---

## 📞 SUPORTE E DOCUMENTAÇÃO

### **Contas Demo:**
```
Master Labelview:
Email: protecao@agitomil.com
Senha: demo123

Unidade Demo:
Email: agitoauto@agitomil.com
Senha: demo123

Regional Demo:
Email: regional@agitomil.com
Senha: demo123

Consultor Demo:
Email: rafael@agitomil.com
Senha: demo123
```

### **URLs Importantes:**
- **Aplicação:** https://app.transmill.com.br
- **Limpeza de Cache:** https://app.transmill.com.br/clear-sw.html
- **Painel Labelview:** https://app.transmill.com.br/labelview
- **Painel Master:** https://app.transmill.com.br/master

---

## 🚀 ROADMAP

### **Implementado:**
- ✅ Sistema de hierarquia completo
- ✅ Login unificado Transmill + Labelview
- ✅ Cadastro com senha provisória
- ✅ Modal de credenciais
- ✅ Comissionamento configurável
- ✅ Identidade visual por Unidade
- ✅ Sistema de vencimentos
- ✅ Integração financeira

### **Próximas Funcionalidades:**
- ⏳ Dashboard de vendas por hierarquia
- ⏳ Relatórios de comissões
- ⏳ Sistema de metas
- ⏳ Integração com rastreadores
- ⏳ App mobile

---

**Sistema desenvolvido para Transmill/Labelview**
*Documentação atualizada: 24/11/2024*
