# 📊 REGRAS DE COMISSÕES - SISTEMA LABELVIEW

## 🎯 HIERARQUIA E DISTRIBUIÇÃO

### **Estrutura Hierárquica:**
```
Master Labelview
    ↓
Unidade (Franquia)
    ↓
Regional (Divisão Geográfica)
    ↓
Consultor (Vendedor)
```

---

## 💰 COMISSÕES SOBRE MENSALIDADES

### **REGRA PRINCIPAL: COMISSÃO HIERÁRQUICA SUBTRATIVA**

A comissão do nível inferior **SAI** da comissão do nível superior.
**NÃO é adicional**, é uma **divisão** da comissão existente.

---

## 📝 EXEMPLO COMPLETO:

### **Cenário 1: Regional com 1 Consultor**

**Cadastro:**
1. Unidade cadastra Regional
   - Comissão sobre mensalidades: **25%**

2. Regional cadastra Consultor
   - Comissão sobre mensalidades: **10%**

**Cálculo em uma venda de R$ 100,00:**
```
Mensalidade do cliente: R$ 100,00
Comissão total disponível: 25% = R$ 25,00

DISTRIBUIÇÃO:
├─ Consultor recebe: 10% = R$ 10,00
└─ Regional recebe: (25% - 10%) = 15% = R$ 15,00

Total distribuído: R$ 25,00 (permanece 25%)
```

---

### **Cenário 2: Regional com Múltiplos Consultores**

**Cadastro:**
1. Regional tem 25% de comissão base

2. Cadastra Consultor A: 10% comissão
   - Consultor A ganha: 10%
   - Regional ganha: 15% (25% - 10%)

3. Cadastra Consultor B: 8% comissão
   - Consultor B ganha: 8%
   - Regional ganha: 17% (25% - 8%)

4. Cadastra Consultor C: 12% comissão
   - Consultor C ganha: 12%
   - Regional ganha: 13% (25% - 12%)

**Importante:** Cada consultor tem sua própria comissão, mas sempre subtrai da comissão do Regional.

---

## ⚠️ VALIDAÇÕES OBRIGATÓRIAS:

### **1. Consultor NÃO pode ter comissão maior que Regional:**
```
❌ ERRADO:
Regional: 25%
Consultor: 30% ← INVÁLIDO! Maior que regional

✅ CORRETO:
Regional: 25%
Consultor: 20% ← OK! Menor que regional
```

### **2. Consultor NÃO pode ter 100% da comissão do Regional:**
```
❌ ERRADO:
Regional: 25%
Consultor: 25% ← Regional ficaria com 0%

✅ CORRETO:
Regional: 25%
Consultor: 24% ← Regional fica com 1%
```

### **3. Comissão deve ser positiva:**
```
✅ Regional: 25%
✅ Consultor: 10%
✅ Regional líquido: 15% > 0
```

---

## 🔄 FLUXO DE COMISSÕES:

### **Quando Cliente Paga Mensalidade:**

```
1. Cliente paga: R$ 100,00
   ↓
2. Sistema calcula comissões:
   ├─ Busca comissão do Regional: 25%
   ├─ Busca comissão do Consultor: 10%
   └─ Calcula:
       • Consultor: R$ 10,00 (10%)
       • Regional: R$ 15,00 (25% - 10%)
   ↓
3. Credita nas carteiras Transmill:
   ├─ Consultor recebe: R$ 10,00
   └─ Regional recebe: R$ 15,00
```

---

## 📊 TAXA DE ADESÃO (DIFERENTE!):

### **REGRA: 100% para quem FECHA A VENDA**

A taxa de adesão **NÃO segue hierarquia**:
- ✅ 100% do valor vai para quem FECHOU a venda (quem cadastrou o cliente)
- ❌ Não há divisão com superiores
- ❌ Não há comissão para hierarquia acima

### **CENÁRIOS POSSÍVEIS:**

**Cenário 1: CONSULTOR cadastra o cliente**
```
Taxa de Adesão: R$ 100,00
↓
Consultor recebe: R$ 100,00 (100%)
Regional recebe: R$ 0,00
Unidade recebe: R$ 0,00
```

**Cenário 2: REGIONAL cadastra o cliente diretamente**
```
Taxa de Adesão: R$ 100,00
↓
Regional recebe: R$ 100,00 (100%)
Unidade recebe: R$ 0,00
```

**Cenário 3: UNIDADE cadastra o cliente diretamente**
```
Taxa de Adesão: R$ 100,00
↓
Unidade recebe: R$ 100,00 (100%)
Não paga comissão a ninguém
```

---

## 💡 RESUMO:

| Item | Regra |
|------|-------|
| **Mensalidades** | Comissão hierárquica subtrativa |
| **Taxa de Adesão** | 100% para quem cadastrou o cliente |
| **Validação** | Consultor < Regional |
| **Cálculo Mensalidades** | Regional líquido = Regional % - Consultor % |
| **Cálculo Taxa** | Quem fecha fica com 100% |

---

## 🎯 EXEMPLOS PRÁTICOS COMPLETOS:

### **Exemplo 1: Venda feita pelo CONSULTOR**

**Configuração:**
- Taxa de Adesão (plano): R$ 100,00
- Mensalidade: R$ 200,00
- Regional tem: 25% comissão
- Consultor tem: 10% comissão

**Venda realizada por: CONSULTOR**

**Distribuição:**
```
TAXA DE ADESÃO (R$ 100,00):
├─ Consultor: R$ 100,00 (100%) ✅
├─ Regional: R$ 0,00
└─ Unidade: R$ 0,00

MENSALIDADE (R$ 200,00):
├─ Consultor: R$ 20,00 (10%)
├─ Regional: R$ 30,00 (15% = 25% - 10%)
└─ Total pago: R$ 50,00
```

---

### **Exemplo 2: Venda feita pelo REGIONAL**

**Configuração:**
- Taxa de Adesão (plano): R$ 100,00
- Mensalidade: R$ 200,00
- Regional tem: 25% comissão

**Venda realizada por: REGIONAL (sem consultor)**

**Distribuição:**
```
TAXA DE ADESÃO (R$ 100,00):
├─ Regional: R$ 100,00 (100%) ✅
└─ Unidade: R$ 0,00

MENSALIDADE (R$ 200,00):
├─ Regional: R$ 50,00 (25%)
└─ Total pago: R$ 50,00
```

---

### **Exemplo 3: Venda feita pela UNIDADE**

**Configuração:**
- Taxa de Adesão (plano): R$ 100,00
- Mensalidade: R$ 200,00

**Venda realizada por: UNIDADE (diretamente)**

**Distribuição:**
```
TAXA DE ADESÃO (R$ 100,00):
└─ Unidade: R$ 100,00 (100%) ✅
   Não paga comissão a ninguém

MENSALIDADE (R$ 200,00):
└─ Unidade: R$ 200,00 (100%)
   Não paga comissão a ninguém
```

---

## ✅ IMPLEMENTAÇÃO NO CÓDIGO:

### **Frontend:**
- Validação ao cadastrar Consultor
- Impedir comissão > Regional
- Mostrar comissão líquida do Regional

### **Backend:**
- Validar hierarquia de comissões
- Calcular distribuição corretamente
- Registrar em logs para auditoria

---

---

## 🎯 DISTRIBUIÇÃO DO VALOR DA PROTEÇÃO (REGRA PRINCIPAL)

### **Como funciona quando cliente fecha a proteção:**

O valor total pago pelo cliente é dividido em:
1. **Valor da Tabela (Custo)** → Master Labelview
2. **Diferença (Markup)** → Distribuída entre Unidade, Regional, Consultor e Cashback

---

## 📋 ESTRUTURA DE DISTRIBUIÇÃO:

```
VALOR PAGO PELO CLIENTE
    ↓
├─ VALOR DA TABELA (Roubo/Furto + Adicionais)
│  └─ Master Labelview recebe 100% ✅
│
└─ DIFERENÇA (Markup = Valor Cliente - Valor Tabela)
   ├─ % Regional (se configurado)
   ├─ % Consultor (se configurado)
   ├─ 10% Cashback (distribuído segundo regras Transmill)
   └─ RESTANTE → Unidade
```

---

## 💰 EXEMPLO COMPLETO:

### **Dados:**
- Valor da Tabela (Master): R$ 100,00
  - Roubo/Furto: R$ 80,00
  - Adicionais: R$ 20,00
- Valor cobrado do Cliente: R$ 200,00
- Regional: 25% de comissão
- Consultor: 10% de comissão

### **Cálculo:**

**1. Master Labelview:**
```
Valor da Tabela = R$ 100,00
Master recebe: R$ 100,00 ✅
```

**2. Diferença (Markup):**
```
Diferença = R$ 200,00 - R$ 100,00 = R$ 100,00
```

**3. Distribuição da Diferença (R$ 100,00):**
```
├─ Regional: 25% de R$ 100,00 = R$ 25,00
├─ Consultor: 10% de R$ 100,00 = R$ 10,00
├─ Cashback: 10% de R$ 100,00 = R$ 10,00
└─ Unidade: R$ 100,00 - R$ 25,00 - R$ 10,00 - R$ 10,00 = R$ 55,00
```

**RESUMO FINAL:**
```
Master Labelview: R$ 100,00 (valor da tabela)
Regional: R$ 25,00 (25% da diferença)
Consultor: R$ 10,00 (10% da diferença)
Cashback: R$ 10,00 (10% da diferença)
Unidade: R$ 55,00 (restante da diferença)

TOTAL: R$ 200,00 ✅
```

---

## 🔄 CENÁRIOS DIFERENTES:

### **Cenário 1: Venda com TODOS os envolvidos**
```
Master: Valor da tabela
Regional: % da diferença
Consultor: % da diferença
Cashback: 10% da diferença
Unidade: Restante
```

### **Cenário 2: Venda SEM Consultor (Regional vende direto)**
```
Master: Valor da tabela
Regional: % da diferença (SÓ O DELE, mais que com consultor)
Cashback: 10% da diferença
Unidade: Restante
```

### **Cenário 3: Venda pela UNIDADE (sem Regional/Consultor)**
```
Master: Valor da tabela
Cashback: 10% da diferença
Unidade: Restante (90% da diferença)
```

---

## 📊 IMPORTANTE:

1. **Master sempre recebe o VALOR DA TABELA**
   - Roubo/Furto + Adicionais
   - Valor calculado pelos percentuais cadastrados
   - Independente do valor cobrado do cliente

2. **Diferença (Markup) é distribuída**
   - % Regional (da diferença, não do total)
   - % Consultor (da diferença, não do total)
   - 10% Cashback fixo (da diferença)
   - Restante = Unidade

3. **Cashback sempre 10% da DIFERENÇA**
   - Não é do valor total
   - É da diferença/markup
   - Distribuído segundo regras Transmill

---

## 🧮 FÓRMULAS:

```
VALOR_TABELA = Roubo/Furto + Adicionais (%)
DIFERENÇA = VALOR_CLIENTE - VALOR_TABELA
MARKUP = DIFERENÇA

Master = VALOR_TABELA
Regional = DIFERENÇA × % Regional
Consultor = DIFERENÇA × % Consultor
Cashback = DIFERENÇA × 10%
Unidade = DIFERENÇA - Regional - Consultor - Cashback
```

---

## ⚠️ VALIDAÇÕES:

1. ✅ Valor Cliente deve ser >= Valor Tabela
2. ✅ Comissões são % da DIFERENÇA, não do valor total
3. ✅ Cashback sempre 10% da diferença
4. ✅ Soma total = Valor pago pelo cliente

---

## 📈 EXEMPLO DETALHADO COM VALORES REAIS:

### **Proteção para veículo de R$ 50.000,00**

**Configuração do Plano:**
- Roubo/Furto: 15% = R$ 7.500,00
- Adicional Vidros: 5% = R$ 2.500,00
- **Valor da Tabela (Master)**: R$ 10.000,00

**Valor cobrado do Cliente:** R$ 15.000,00

**Distribuição:**
```
1. Master Labelview:
   └─ R$ 10.000,00 (valor da tabela) ✅

2. Diferença (Markup):
   └─ R$ 15.000,00 - R$ 10.000,00 = R$ 5.000,00

3. Da diferença de R$ 5.000,00:
   ├─ Regional (25%): R$ 1.250,00
   ├─ Consultor (10%): R$ 500,00
   ├─ Cashback (10%): R$ 500,00
   └─ Unidade: R$ 2.750,00

TOTAL: R$ 15.000,00 ✅
```

---

**ÚLTIMA ATUALIZAÇÃO:** 2024
**AUTOR:** Sistema Labelview
