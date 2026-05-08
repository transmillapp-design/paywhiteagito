# 🚗 Guia Completo - Integração FIPE e Criação de Planos

## 📋 Suas Dúvidas Respondidas

### 1️⃣ Qual dado o cliente precisa informar para identificar o veículo na API FIPE?

Para consultar a API FIPE, o cliente precisa informar **4 dados em sequência**:

```
1. TIPO DE VEÍCULO → Carro, Moto ou Caminhão
2. MARCA → Ex: Chevrolet, Volkswagen, Ford, Honda
3. MODELO → Ex: Onix 1.0, Gol 1.6, Civic 2.0
4. ANO/MODELO → Ex: 2024-1 (ano-modelo), 2023-1, 32000-1 (zero km)
```

**Fluxo de Consulta Encadeada:**

```javascript
// Passo 1: Cliente escolhe TIPO
TIPO: Carro

// Passo 2: Sistema busca MARCAS daquele tipo
API: GET /api/labelview/fipe/marcas/carros
Retorna: [Chevrolet, Fiat, Ford, Honda, ...]

// Passo 3: Cliente escolhe MARCA → Sistema busca MODELOS
API: GET /api/labelview/fipe/modelos/carros/21  // 21 = código Chevrolet
Retorna: [Onix 1.0, Onix 1.4, Cruze, ...]

// Passo 4: Cliente escolhe MODELO → Sistema busca ANOS
API: GET /api/labelview/fipe/anos/carros/21/5678  // 5678 = código Onix
Retorna: [2024-1, 2023-1, 2022-1, ...]

// Passo 5: Cliente escolhe ANO → Sistema busca VALOR
API: GET /api/labelview/fipe/valor/carros/21/5678/2024-1
Retorna: {
  valor: "R$ 54.876,00",
  marca: "Chevrolet",
  modelo: "Onix 1.0",
  ano: "2024"
}
```

---

### 2️⃣ Como funciona a API FIPE? Salva dados ou consulta em tempo real?

A API FIPE funciona de **DUAS FORMAS** no seu sistema:

#### ✅ **OPÇÃO A: Consulta em Tempo Real (Recomendado)**

**Como funciona:**
- Cliente informa os dados → Sistema consulta API FIPE externa
- Retorna valor atualizado do mês atual
- **NÃO salva** nada no banco
- Sempre valores frescos e atualizados

**Vantagens:**
- ✅ Valores sempre atualizados
- ✅ Não ocupa espaço no banco
- ✅ Não precisa manutenção

**Desvantagens:**
- ⚠️ Depende de API externa
- ⚠️ Pode ter limite de requisições

#### ✅ **OPÇÃO B: Tabela FIPE Própria (Já Implementado)**

**Como funciona:**
- Sistema importa veículos da API FIPE
- Salva no banco de dados local (MongoDB)
- Consulta no próprio banco, não na API externa

**Vantagens:**
- ✅ Rápido (consulta local)
- ✅ Não depende de API externa
- ✅ Sem limite de consultas

**Desvantagens:**
- ⚠️ Precisa atualizar mensalmente
- ⚠️ Ocupa espaço no banco

**Endpoints já implementados:**
```javascript
// Importar todos os veículos para o banco
POST /api/labelview/fipe/importar-completo

// Consultar veículos salvos no banco
GET /api/labelview/fipe/veiculos
```

---

## 🎯 Fluxo Completo de Criação de Plano

### Passo a Passo que o Cliente Verá:

```
PASSO 1: Escolher Tipo de Veículo
┌─────────────────────────────┐
│  [ ] Carro                  │
│  [ ] Moto                   │
│  [ ] Caminhão               │
└─────────────────────────────┘

PASSO 2: Dados do Veículo

Opção A - PLACA:
┌─────────────────────────────┐
│ Placa: [ABC-1234]           │
│ [Buscar por Placa] ← API    │
└─────────────────────────────┘

Opção B - MARCA/MODELO/ANO (mais comum):
┌─────────────────────────────┐
│ Marca: [Chevrolet ▼]        │
│ Modelo: [Onix 1.0 ▼]        │
│ Ano: [2024 ▼]               │
│ [Consultar Valor FIPE]      │
└─────────────────────────────┘

↓

PASSO 3: Sistema Consulta FIPE
┌─────────────────────────────┐
│ Valor FIPE: R$ 54.876,00    │
│ Faixa: R$ 50.000 - R$ 60.000│
└─────────────────────────────┘

↓

PASSO 4: Sistema Busca nas Tabelas de Valores
Vai em cada serviço e busca o preço baseado na faixa:

┌────────────────────────────────────────┐
│ Roubo/Furto (Caminhão):      R$ 150,00│
│ Assistência 24h (Caminhão):  R$ 49,90 │
│ Vidros, Faróis (Caminhão):   R$ 5,00  │
│ Carro Reserva: Não atende Caminhão ❌  │
│ Colisão (Caminhão):          R$ 3,50  │
│ Danos Mat. (R$30k):          R$ 17,90 │
│                                        │
│ TOTAL DO PLANO:             R$ 226,30 │
└────────────────────────────────────────┘

↓

PASSO 5: Cliente Escolhe Coberturas
[✓] Roubo/Furto
[✓] Assistência 24h
[ ] Vidros, Faróis
[✓] Colisão
[✓] Danos Materiais (Limite: R$ 30.000)

TOTAL SELECIONADO: R$ 220,80

[Gerar Plano]
```

---

## 💻 Como Implementar no Sistema

### Endpoint que você precisa chamar:

```javascript
// 1. Consultar valor FIPE (tempo real ou banco local)
const consultarValorFipe = async (tipo, marca, modelo, ano) => {
  // Opção A: Tempo real (recomendado)
  const response = await axios.get(
    `${API}/labelview/fipe/valor/${tipo}/${marca}/${modelo}/${ano}`
  );
  
  return response.data.valor; // Ex: "R$ 54.876,00"
}

// 2. Buscar valores nas tabelas baseado no valor FIPE
const buscarValoresServicos = async (tipoVeiculo, valorFipe) => {
  const servicos = [
    'Roubo/Furto',
    'Assistencia 24hs',
    'Vidros, Farois e Lanternas',
    'Carro Reserva',
    'Colisão',
    'Danos materiais e Terceiros'
  ];
  
  const valores = {};
  
  for (const servico of servicos) {
    const response = await axios.post(
      `${API}/labelview/tabelas/buscar-valor`,
      {
        tipo_cobertura: servico,
        valor_fipe: parseFloat(valorFipe.replace(/[^0-9,]/g, '').replace(',', '.')),
        tipo_veiculo_assistencia: tipoVeiculo // Ex: "Carros Leves", "Caminhão"
      }
    );
    
    if (response.data.success) {
      valores[servico] = response.data.valor_servico;
    }
  }
  
  return valores;
}

// 3. Uso completo
const criarPlano = async () => {
  // 1. Cliente informa dados
  const tipo = "carros";
  const marca = "21"; // Código Chevrolet
  const modelo = "5678"; // Código Onix
  const ano = "2024-1";
  
  // 2. Consultar FIPE
  const valorFipe = await consultarValorFipe(tipo, marca, modelo, ano);
  console.log("Valor FIPE:", valorFipe); // R$ 54.876,00
  
  // 3. Buscar valores dos serviços
  const tipoVeiculo = "Carros Leves"; // Mapear de "carros" para "Carros Leves"
  const valores = await buscarValoresServicos(tipoVeiculo, valorFipe);
  
  console.log("Valores encontrados:", valores);
  /*
  {
    "Roubo/Furto": 85.00,
    "Assistencia 24hs": 9.90,
    "Vidros, Farois e Lanternas": 5.00,
    "Carro Reserva": 3.50,
    "Colisão": 3.50,
    "Danos materiais e Terceiros": 17.90
  }
  */
  
  // 4. Calcular total
  const total = Object.values(valores).reduce((sum, val) => sum + val, 0);
  console.log("Total do Plano:", total); // R$ 124,80
  
  // 5. Salvar plano no banco
  const plano = {
    cliente_id: "...",
    veiculo: {
      tipo: "Carro",
      marca: "Chevrolet",
      modelo: "Onix 1.0",
      ano: 2024,
      valor_fipe: 54876.00
    },
    coberturas: valores,
    valor_total: total,
    data_criacao: new Date()
  };
  
  // Salvar no MongoDB
  await axios.post(`${API}/labelview/planos`, plano);
}
```

---

## 🗂️ Estrutura de Dados Recomendada

### Coleção: `labelview_planos`

```javascript
{
  _id: ObjectId("..."),
  numero_plano: "PLAN-2024-001",
  cliente_id: "uuid-cliente",
  
  // Dados do Veículo
  veiculo: {
    tipo: "Carro",
    marca: "Chevrolet",
    modelo: "Onix 1.0 Flex",
    ano: 2024,
    placa: "ABC-1234",
    codigo_fipe: "012345-6",
    valor_fipe: 54876.00,
    tipo_veiculo_labelview: "Carros Leves" // Para buscar nas tabelas
  },
  
  // Coberturas Selecionadas
  coberturas: [
    {
      tipo_cobertura: "Roubo/Furto",
      valor_servico: 85.00,
      faixa_fipe: "R$ 50.000 - R$ 60.000"
    },
    {
      tipo_cobertura: "Assistencia 24hs",
      valor_servico: 9.90,
      faixa_fipe: "R$ 50.000 - R$ 60.000"
    }
  ],
  
  // Valores
  valor_total_mensal: 94.90,
  valor_total_anual: 1138.80,
  
  // Status
  status: "ativo", // ativo, cancelado, suspenso
  forma_pagamento: "mensal", // mensal, anual
  
  // Datas
  data_criacao: ISODate("2024-01-15"),
  data_inicio_vigencia: ISODate("2024-02-01"),
  data_fim_vigencia: ISODate("2025-02-01"),
  
  // Auditoria
  criado_por: "uuid-usuario",
  atualizado_em: ISODate("2024-01-15")
}
```

---

## ✅ Resumo das Respostas

### Pergunta 1: Qual dado precisa informar?
**Resposta:**
- Tipo de Veículo (Carro/Moto/Caminhão)
- Marca (escolhe de uma lista)
- Modelo (escolhe de uma lista)
- Ano/Modelo (escolhe de uma lista)

**OU alternativamente:**
- Placa do veículo (se tiver integração com API de placa)

### Pergunta 2: API salva dados ou não?
**Resposta:**
- **API FIPE Externa:** NÃO salva, consulta em tempo real
- **Seu Sistema:** PODE salvar localmente para consulta rápida
- **Recomendação:** Use tempo real para valores sempre atualizados

### Pergunta 3: Consegue consultar mesmo sem salvar?
**Resposta:**
- ✅ **SIM!** A API FIPE é pública e gratuita
- ✅ Seu backend já tem os endpoints implementados
- ✅ Pode consultar quantas vezes quiser

---

## 🚀 Próximos Passos

Para implementar o sistema de criação de planos:

1. **Criar componente de seleção de veículo**
   - Dropdowns encadeados (Tipo → Marca → Modelo → Ano)
   - Consulta em tempo real na API FIPE

2. **Criar endpoint de busca de valores**
   - Recebe: valor_fipe + tipo_veiculo
   - Retorna: valores de todos os serviços

3. **Criar componente de seleção de coberturas**
   - Checkboxes com valores
   - Cálculo de total em tempo real

4. **Criar endpoint de criação de plano**
   - Salva plano completo no banco
   - Gera número único de plano

Quer que eu implemente alguma dessas partes? 😊
