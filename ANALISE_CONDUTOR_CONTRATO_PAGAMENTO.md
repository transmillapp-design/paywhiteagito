# 📋 ANÁLISE COMPLETA: Condutor, Contrato e Pagamento de Adesão

## ✅ O QUE JÁ EXISTE - TELA DE CONDUTOR

### Arquivo: `/app/frontend/src/components/ProtecaoVeicularPage.js`
### Step 4: Condutor (Cadastro Transmill)

**Campos existentes:**
✅ **Seção 1: Dados Pessoais e Acesso**
- Nome Completo
- CPF
- Data de Nascimento
- Telefone
- Situação do Condutor (Proprietário/Terceiro)
- Senha de Acesso
- Confirmar Senha

✅ **Seção 2: Dados PIX para Saque**
- Tipo da Chave PIX (CPF/Email/Telefone/Aleatória)
- Chave PIX

✅ **Seção 3: Endereço Completo**
- CEP
- Rua/Avenida
- Número
- Complemento
- Bairro
- Cidade
- Estado

**Botão existente:**
- ✅ "Gerar PDF do Plano" (linha 1541)
- ✅ Botão "Próximo" para avançar

---

## ❌ O QUE FALTA IMPLEMENTAR

### 1. **LEITURA E ACEITE DO DOCUMENTO PDF**

**Situação atual:** 
- Existe botão "Gerar PDF do Plano"
- NÃO existe visualização do PDF na tela
- NÃO existe checkbox de aceite
- NÃO existe validação de leitura

**O que precisa:**
1. **Componente de Visualização de PDF**
   - Mostrar PDF inline (usando react-pdf ou iframe)
   - Scroll automático ou manual
   - Indicador de que chegou ao fim do documento
   
2. **Checkbox de Aceite**
   ```
   ☐ Li e concordo com os termos do contrato de proteção veicular
   ```
   - Habilitado apenas após scroll até o fim
   - Obrigatório para avançar
   
3. **Armazenar aceite no backend**
   - Campo `termos_aceitos: boolean`
   - Campo `termos_aceitos_em: datetime`
   - Campo `termos_versao: string`

---

### 2. **ASSINATURA DIGITAL DO CONTRATO**

**Situação atual:**
- ❌ NÃO existe campo de assinatura
- ❌ NÃO existe canvas para desenhar
- ❌ NÃO existe captura de assinatura

**O que precisa:**
1. **Canvas de Assinatura**
   - Área retangular para desenhar com mouse/dedo
   - Botão "Limpar" para refazer
   - Botão "Confirmar Assinatura"
   - Preview da assinatura
   
2. **Armazenar assinatura**
   - Converter canvas para base64
   - Salvar no backend
   - Campo `assinatura_digital_url: string` (base64 ou URL)
   - Campo `assinado_em: datetime`

**Bibliotecas sugeridas:**
- `react-signature-canvas`
- `signature_pad`

---

### 3. **TERMO DO CONTRATO (TEXTO)**

**Situação atual:**
- ❌ NÃO existe texto do termo
- ❌ NÃO existe exibição do contrato

**O que precisa:**
Você mencionou que já enviou o texto. Preciso que me envie:
- [ ] Texto completo do termo de adesão
- [ ] Cláusulas do contrato
- [ ] Condições gerais

**Onde será exibido:**
1. **Modal de Termos e Condições**
   - Texto completo rolável
   - Seções: Cláusulas, Direitos, Deveres, Cancelamento
   
2. **PDF gerado**
   - Incluir termo completo no PDF
   - Com espaço para assinatura

---

### 4. **UPLOAD DE DOCUMENTOS (SE CLIENTE NÃO TEM CONTA TRANSMILL)**

**Situação atual:**
- ✅ Campos de cadastro existem (nome, CPF, telefone, etc.)
- ❌ NÃO tem upload de documentos

**Documentos necessários para abertura de conta:**
1. **RG ou CNH** (frente e verso)
2. **Comprovante de Endereço**
3. **Selfie com documento** (validação)

**O que precisa:**
```javascript
// Componente de Upload
<div className="space-y-4">
  <UploadDocumento 
    label="RG ou CNH - Frente"
    tipo="documento_frente"
    onUpload={(file) => handleUpload(file)}
  />
  <UploadDocumento 
    label="RG ou CNH - Verso"
    tipo="documento_verso"
    onUpload={(file) => handleUpload(file)}
  />
  <UploadDocumento 
    label="Comprovante de Endereço"
    tipo="comprovante_endereco"
    onUpload={(file) => handleUpload(file)}
  />
  <UploadDocumento 
    label="Selfie com Documento"
    tipo="selfie_documento"
    onUpload={(file) => handleUpload(file)}
    allowCamera={true}
  />
</div>
```

**Backend necessário:**
- Endpoint: `POST /api/protecao/upload-documento-cliente`
- Salvar em collection `documentos_clientes`

---

### 5. **PAGAMENTO DA TAXA DE ADESÃO (CARTEIRA TRANSMILL)**

**Situação atual:**
- ✅ Taxa de adesão existe (configurada pela Unidade)
- ✅ Valor é mostrado no resumo
- ❌ NÃO existe botão de pagamento
- ❌ NÃO existe integração com carteira Transmill

**O que precisa:**

#### A. **Após Assinatura do Contrato**
Adicionar novo step ou modal:

```
┌────────────────────────────────────────────────────┐
│  ✅ Contrato Assinado com Sucesso!                │
│                                                    │
│  Agora você precisa pagar a Taxa de Adesão       │
│                                                    │
│  💰 Valor: R$ 150,00                              │
│  💳 Forma de pagamento: Saldo Transmill           │
│                                                    │
│  Seu saldo atual: R$ 200,00                       │
│                                                    │
│  [ 💰 Pagar Taxa de Adesão ]                      │
└────────────────────────────────────────────────────┘
```

#### B. **Backend: Endpoint de Pagamento**
```python
@app.post("/api/protecao/pagar-taxa-adesao")
async def pagar_taxa_adesao(
    cliente_id: str,
    valor_adesao: float,
    indicador_id: str,  # ID do consultor/regional/unidade
    user: User = Depends(get_current_user)
):
    """
    1. Verificar saldo do cliente
    2. Debitar da carteira do cliente
    3. Creditar na carteira do indicador
    4. SEM cashback (importante!)
    5. Registrar transação
    6. Ativar contrato
    """
```

#### C. **Fluxo de Transferência**
```
Cliente paga R$ 150,00 (taxa de adesão)
  ↓
Debita R$ 150,00 da carteira do cliente
  ↓
Credita R$ 150,00 na carteira do INDICADOR
  (pode ser Unidade, Regional ou Consultor)
  ↓
🚫 SEM CASHBACK (0% de retorno)
  ↓
Ativa contrato de proteção veicular
```

---

### 6. **ÁREA LABELVIEW NO PERFIL DO CLIENTE**

**Situação atual:**
- ❌ NÃO existe botão "Labelview" no menu do cliente
- ❌ NÃO existe tela de resumo da proteção

**O que precisa:**

#### A. **Adicionar botão no menu do perfil**
Arquivo: `/app/frontend/src/components/UserProfile.js`

```javascript
{user.user_type === 'cliente' && user.tem_protecao_ativa && (
  <Card className="mt-6">
    <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
      <CardTitle className="flex items-center gap-2">
        <Shield size={24} />
        Minha Proteção Veicular
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <Button
        onClick={() => navigate('/minha-protecao-labelview')}
        className="w-full bg-[#2fa31c] hover:bg-[#25881a]"
      >
        <Shield size={20} className="mr-2" />
        Acessar Área Labelview
      </Button>
    </CardContent>
  </Card>
)}
```

#### B. **Nova rota e componente: MinhaProtecaoLabelview.js**

**Layout da tela:**
```
┌──────────────────────────────────────────────────────────┐
│  🛡️ Minha Proteção Veicular Labelview                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  📋 Resumo do Contrato                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│  • Plano: Plano Completo                                 │
│  • Veículo: Honda Civic 2020                             │
│  • Valor Mensal: R$ 350,00                               │
│  • Vencimento: Todo dia 10                               │
│  • Status: ✅ Ativo                                      │
│                                                           │
│  💰 Pagamentos                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│  ┌──────────────────────────────┐                        │
│  │ Janeiro 2025                 │                        │
│  │ R$ 350,00 - ✅ Pago          │                        │
│  └──────────────────────────────┘                        │
│  ┌──────────────────────────────┐                        │
│  │ Fevereiro 2025               │                        │
│  │ R$ 350,00 - 🟡 Aguardando    │                        │
│  │ Vencimento: 10/02/2025       │                        │
│  │ [ 💳 Pagar Agora ]           │                        │
│  └──────────────────────────────┘                        │
│                                                           │
│  📄 Documentos                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│  • [ 📥 Download Contrato ]                              │
│  • [ 📥 Download Comprovante de Adesão ]                 │
│                                                           │
│  🆘 Solicitar Serviço                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│  [ 🚗 Nova Solicitação de Serviço ]                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### C. **Funcionalidades da Tela**

1. **Resumo do Contrato**
   - Dados do plano contratado
   - Veículo protegido
   - Valor mensal
   - Dia de vencimento
   - Status (ativo/suspenso/cancelado)

2. **Histórico de Pagamentos**
   - Lista de parcelas (pagas/pendentes)
   - Botão "Pagar Agora" para parcelas em aberto
   - Comprovantes de pagamento

3. **Botão "Pagar com Saldo Transmill"**
   - Mostra saldo atual
   - Desconta automaticamente da carteira
   - Sem cashback
   - Transfere para o indicador

4. **Documentos**
   - Download do contrato assinado
   - Download do comprovante de adesão
   - Vistoria realizada

5. **Solicitar Serviço**
   - Botão para abrir solicitação
   - Guincho, chaveiro, etc.

---

### 7. **BACKEND: ESTRUTURA DE DADOS NECESSÁRIA**

#### Collection: `contratos_protecao`
```javascript
{
  "id": "uuid",
  "cliente_id": "uuid",
  "cotacao_id": "uuid",
  "plano_id": "uuid",
  "indicador_id": "uuid", // Consultor/Regional/Unidade
  "tipo_indicador": "consultor", // ou "regional" ou "unidade"
  
  // Dados do contrato
  "numero_contrato": "LV-2025-00123",
  "valor_mensal": 350.00,
  "dia_vencimento": 10,
  "taxa_adesao": 150.00,
  
  // Termos e assinatura
  "termos_aceitos": true,
  "termos_aceitos_em": "2025-11-21T22:00:00",
  "termos_versao": "v1.0",
  "assinatura_digital_url": "data:image/png;base64,...",
  "assinado_em": "2025-11-21T22:05:00",
  
  // Pagamento da adesão
  "taxa_adesao_paga": true,
  "taxa_adesao_paga_em": "2025-11-21T22:10:00",
  "taxa_adesao_transacao_id": "uuid",
  
  // Status
  "status": "ativo", // ativo, suspenso, cancelado
  "ativado_em": "2025-11-21T22:10:00",
  
  // Documentos do cliente (se não tinha conta)
  "documentos_enviados": {
    "documento_frente_url": "...",
    "documento_verso_url": "...",
    "comprovante_endereco_url": "...",
    "selfie_documento_url": "..."
  },
  
  "created_at": "2025-11-21T21:00:00",
  "updated_at": "2025-11-21T22:10:00"
}
```

#### Collection: `parcelas_protecao`
```javascript
{
  "id": "uuid",
  "contrato_id": "uuid",
  "cliente_id": "uuid",
  "mes_referencia": "2025-01",
  "valor": 350.00,
  "data_vencimento": "2025-01-10",
  "status": "pago", // pendente, pago, atrasado, cancelado
  "pago_em": "2025-01-08T10:30:00",
  "transacao_id": "uuid",
  "comprovante_url": "..."
}
```

#### Collection: `transacoes_protecao`
```javascript
{
  "id": "uuid",
  "tipo": "taxa_adesao", // ou "mensalidade"
  "cliente_id": "uuid",
  "indicador_id": "uuid",
  "valor": 150.00,
  "status": "concluida",
  "cashback": 0, // SEMPRE 0 para proteção veicular
  "descricao": "Taxa de adesão - Contrato LV-2025-00123",
  "created_at": "2025-11-21T22:10:00"
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Frontend

#### 1. Componente: ContratoAssinatura.js (Novo)
- [ ] Visualizador de PDF inline
- [ ] Scroll tracking (detectar fim do documento)
- [ ] Checkbox "Li e concordo" (habilitado após scroll)
- [ ] Canvas de assinatura digital
- [ ] Botões: Limpar / Confirmar Assinatura
- [ ] Validação: não avança sem aceite e assinatura

#### 2. Componente: UploadDocumentosCliente.js (Novo)
- [ ] Upload de RG/CNH Frente
- [ ] Upload de RG/CNH Verso
- [ ] Upload de Comprovante de Endereço
- [ ] Upload de Selfie com Documento
- [ ] Captura via câmera (para selfie)
- [ ] Preview das imagens
- [ ] Validação de formato e tamanho

#### 3. Componente: PagamentoTaxaAdesao.js (Novo)
- [ ] Exibir valor da taxa de adesão
- [ ] Mostrar saldo atual do cliente
- [ ] Botão "Pagar com Saldo Transmill"
- [ ] Validação de saldo suficiente
- [ ] Loading durante pagamento
- [ ] Confirmação de sucesso

#### 4. Componente: MinhaProtecaoLabelview.js (Novo)
- [ ] Resumo do contrato
- [ ] Lista de parcelas (pagas/pendentes)
- [ ] Botão "Pagar Parcela" com saldo Transmill
- [ ] Download de documentos
- [ ] Botão "Solicitar Serviço"
- [ ] Cards informativos

#### 5. Atualizar: ProtecaoVeicularPage.js
- [ ] Adicionar step de assinatura (após condutor)
- [ ] Adicionar upload de documentos (condicional)
- [ ] Integrar com componente de assinatura
- [ ] Adicionar step de pagamento de adesão

#### 6. Atualizar: UserProfile.js
- [ ] Adicionar card "Minha Proteção Veicular"
- [ ] Botão "Acessar Área Labelview"
- [ ] Condição: apenas se cliente tem proteção ativa

### Backend

#### 1. Endpoints: Assinatura e Documentos
- [ ] `POST /api/protecao/salvar-assinatura`
- [ ] `POST /api/protecao/upload-documento-cliente`
- [ ] `GET /api/protecao/documentos-cliente/{cliente_id}`

#### 2. Endpoints: Pagamento de Adesão
- [ ] `POST /api/protecao/pagar-taxa-adesao`
- [ ] `GET /api/protecao/verificar-saldo/{cliente_id}`
- [ ] `POST /api/transactions/transferir-adesao` (sem cashback)

#### 3. Endpoints: Área do Cliente
- [ ] `GET /api/protecao/meu-contrato/{cliente_id}`
- [ ] `GET /api/protecao/minhas-parcelas/{cliente_id}`
- [ ] `POST /api/protecao/pagar-parcela/{parcela_id}`
- [ ] `GET /api/protecao/download-contrato/{contrato_id}`

#### 4. Lógica de Negócio
- [ ] Validar saldo antes de pagamento
- [ ] Debitar da carteira do cliente
- [ ] Creditar na carteira do indicador (sem cashback)
- [ ] Registrar transação
- [ ] Ativar contrato após pagamento
- [ ] Enviar notificação ao cliente

---

## ⏱️ ESTIMATIVA DE TEMPO

| Tarefa | Complexidade | Tempo |
|--------|--------------|-------|
| Componente ContratoAssinatura | Alta | 4h |
| Componente UploadDocumentos | Média | 2h |
| Componente PagamentoTaxaAdesao | Média | 3h |
| Componente MinhaProtecaoLabelview | Alta | 4h |
| Atualizar ProtecaoVeicularPage | Média | 2h |
| Endpoints Backend (assinatura/docs) | Média | 3h |
| Endpoints Backend (pagamento) | Alta | 4h |
| Endpoints Backend (área cliente) | Média | 2h |
| Lógica transações sem cashback | Média | 2h |
| Testes integração | Média | 2h |
| **TOTAL** | | **~28 horas** |

---

## 🚨 INFORMAÇÕES NECESSÁRIAS DO CLIENTE

Para continuar a implementação, preciso que você me envie:

1. **Texto completo do Termo de Adesão/Contrato**
   - [ ] Cláusulas
   - [ ] Direitos e deveres
   - [ ] Condições de cancelamento
   - [ ] Versão do termo (ex: v1.0)

2. **PDF do contrato modelo**
   - [ ] Arquivo PDF ou URL
   - [ ] Com campos que precisam ser preenchidos dinamicamente

3. **Regras de negócio específicas**
   - [ ] Valor mínimo/máximo da taxa de adesão
   - [ ] Dias de carência após assinatura
   - [ ] Regras de cancelamento
   - [ ] Penalidades por atraso

4. **Design/Layout desejado**
   - [ ] Cores específicas
   - [ ] Logo da Labelview
   - [ ] Fontes preferidas

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **Sem Cashback:** Taxa de adesão e mensalidades da proteção veicular NÃO geram cashback
2. **Transferência direta:** Valor vai 100% para o indicador (Consultor/Regional/Unidade)
3. **Validação de documentos:** Se cliente já tem conta Transmill ativa, pular upload de documentos
4. **Assinatura obrigatória:** Não pode ativar contrato sem assinatura digital
5. **Pagamento obrigatório:** Contrato só ativa após pagamento da taxa de adesão
