# 📋 RESUMO: Correção do Cálculo de Planos

## 🎯 Problema Corrigido

**ANTES (ERRADO):**
- Sistema somava TODAS as coberturas no valor do plano
- Adicionais entravam no cálculo logo na criação
- Cliente via valor inflacionado

**AGORA (CORRETO):**
- Sistema soma APENAS coberturas principais
- Adicionais ficam disponíveis mas não somam no plano
- Cliente escolhe adicionais na cotação
- Cálculo: `Valor Tabela + (Valor Tabela × Percentual / 100)`

---

## ✅ O que foi implementado

### 1. **Frontend Atualizado** (`CriarPlanoUnidade.js`)

**Separação visual:**
- 🟢 **Coberturas PRINCIPAIS** (entram no valor):
  - Roubo/Furto (obrigatória)
  - Colisão
  - Danos materiais e Terceiros

- 🟠 **ADICIONAIS** (só na cotação):
  - Assistência 24hs
  - Vidros, Faróis e Lanternas
  - Carro Reserva

### 2. **Backend Atualizado** (`server.py`)

**Endpoint:** `POST /api/labelview/planos/criar-automatico`

**Novo formato de request:**
```json
{
  "tipo_veiculo": "Carros Leves",
  "coberturas_principais": [
    {
      "tipo_cobertura": "Roubo/Furto",
      "percentual": 20,
      "tipo": "principal"
    }
  ],
  "adicionais": [
    {
      "tipo_cobertura": "Assistencia 24hs",
      "percentual": 15,
      "tipo": "adicional"
    }
  ]
}
```

**Novo formato no banco:**
```json
{
  "id": "uuid",
  "unidade_id": "uuid",
  "tipo_veiculo": "Carros Leves",
  "valor_fipe_min": 0,
  "valor_fipe_max": 10000,
  "coberturas_principais": [...],  // NOVO
  "adicionais": [...],              // NOVO
  "valor_total_mensal": 120.00,    // Soma APENAS principais
  "valor_total_anual": 1440.00
}
```

### 3. **Compatibilidade com Formato Antigo**

✅ Sistema aceita AMBOS os formatos:
- Planos antigos: campo `coberturas`
- Planos novos: campos `coberturas_principais` + `adicionais`

**Backend detecta automaticamente:**
```python
# Se tem formato novo, usa novo
coberturas_principais = plano.get('coberturas_principais', [])

# Se não tem, usa formato antigo
if not coberturas_principais and plano.get('coberturas'):
    coberturas_principais = plano.get('coberturas', [])
```

### 4. **Script de Limpeza**

**Arquivo:** `/app/limpar_planos_antigos.py`

**Uso:**
```bash
cd /app
python limpar_planos_antigos.py
```

**O que faz:**
- Lista todos os planos existentes
- Deleta TODOS os planos antigos
- Permite começar do zero com regra correta

---

## 🚀 Como Testar (Passo a Passo)

### Etapa 1: Limpar Planos Antigos (se existirem)

```bash
cd /app
python limpar_planos_antigos.py
```

### Etapa 2: Criar Novo Plano

1. Faça login como **Unidade**:
   - Email: `agitoauto@agitomil.com`
   - Senha: `demo123`

2. Clique em **"Planos"** no menu lateral

3. Clique em **"Criar Novos Planos"**

4. Preencha o formulário:
   - **Tipo de veículo:** Carros Leves
   - **Coberturas PRINCIPAIS:**
     - ✅ Roubo/Furto: 20%
     - ✅ Colisão: 15% (opcional)
   - **ADICIONAIS:**
     - ✅ Assistência 24hs: 10% (opcional)

5. Clique em **"Criar Planos"**

6. Sistema criará **12 planos** (um para cada faixa FIPE)

### Etapa 3: Verificar Cálculo

**Exemplo de cálculo correto:**

| Item | Valor Tabela | Percentual | Valor Final | Inclui no Plano? |
|------|-------------|-----------|-------------|------------------|
| Roubo/Furto | R$ 100,00 | 20% | R$ 120,00 | ✅ SIM |
| Colisão | R$ 50,00 | 15% | R$ 57,50 | ✅ SIM |
| **SUBTOTAL** | | | **R$ 177,50** | **Valor do Plano** |
| Assistência 24hs | R$ 30,00 | 10% | R$ 33,00 | ❌ NÃO (só cotação) |

**Valor do Plano:** R$ 177,50/mês  
**Se cliente quiser assistência:** R$ 177,50 + R$ 33,00 = R$ 210,50/mês

---

## 📊 Fórmula de Cálculo

### Para cada cobertura:
```
Valor Final = Valor Tabela × (1 + Percentual / 100)
```

### Exemplos:
```
Valor Tabela = R$ 100,00
Percentual = 20%

Valor Final = 100 × (1 + 20/100)
Valor Final = 100 × 1.20
Valor Final = R$ 120,00
```

### Valor Total do Plano:
```
Valor Plano = Soma(Todas as Coberturas Principais)
```

---

## 🔍 Verificação no Banco de Dados

### Verificar planos criados:
```bash
mongosh agitomil_db --eval "db.labelview_planos.find({}).limit(1).pretty()"
```

### Contar planos:
```bash
mongosh agitomil_db --eval "db.labelview_planos.countDocuments({})"
```

### Verificar estrutura:
```bash
mongosh agitomil_db --eval "
  db.labelview_planos.findOne({}, {
    coberturas_principais: 1,
    adicionais: 1,
    valor_total_mensal: 1
  })
"
```

---

## ⚠️ IMPORTANTE para Produção

### Quando fizer o deploy:

1. **Limpe os planos antigos:**
   ```bash
   cd /app
   python limpar_planos_antigos.py
   ```

2. **Oriente a Unidade:**
   - "Os planos antigos foram removidos"
   - "Crie novos planos com a regra correta"
   - "Agora o cálculo está correto"

3. **Não há risco de quebra:**
   - Sistema tem compatibilidade com formato antigo
   - Se existirem planos antigos, continuarão funcionando
   - Mas recomenda-se limpeza para evitar confusão

---

## 📝 Arquivos Modificados

### Frontend:
- ✅ `/app/frontend/src/components/CriarPlanoUnidade.js`
- ✅ `/app/frontend/src/components/MasterLabelviewDashboard.js`
- ✅ `/app/frontend/src/components/UnidadeMenu.js`

### Backend:
- ✅ `/app/backend/server.py` (linhas 18970-19100)

### Scripts:
- ✅ `/app/limpar_planos_antigos.py` (novo)
- ✅ `/app/migrar_planos_antigos.py` (novo - backup)

---

## ✅ Status Final

- ✅ Cálculo corrigido (Valor Tabela + Percentual)
- ✅ Separação entre principais e adicionais
- ✅ Interface visual clara e intuitiva
- ✅ Compatibilidade com formato antigo
- ✅ Script de limpeza pronto
- ✅ Frontend e Backend sincronizados
- ✅ Documentação completa

---

## 🎓 Fluxo Completo

```
1. UNIDADE CRIA PLANO
   ↓
2. Define percentuais para principais e adicionais
   ↓
3. Sistema calcula 12 planos (faixas FIPE)
   ↓
4. Valor = Soma(apenas principais)
   ↓
5. CLIENTE FAZ COTAÇÃO
   ↓
6. Vê valor do plano base
   ↓
7. Escolhe adicionais (se quiser)
   ↓
8. Sistema soma: Plano + Adicionais escolhidos
   ↓
9. VALOR FINAL para o cliente
```

---

**Criado em:** 20/11/2025  
**Desenvolvedor:** Agente IA Emergent  
**Status:** ✅ Implementado e Testado
