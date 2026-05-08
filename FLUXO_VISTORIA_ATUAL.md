# 📋 FLUXO COMPLETO DA VISTORIA - SITUAÇÃO ATUAL

## ✅ O QUE JÁ EXISTE

### 1. **Tela de Vistoria (Cliente)**
**Arquivo:** `/app/frontend/src/components/VistoriaVeiculo.js`

**Funcionalidades:**
- ✅ Interface passo a passo para captura de fotos
- ✅ Até 14 fotos do veículo (conforme tipo cadastrado)
- ✅ Foto da CNH
- ✅ Foto do Comprovante de Endereço
- ✅ Preview da foto modelo ao lado da captura
- ✅ Barra de progresso (X de Y fotos)
- ✅ Grid de miniaturas
- ✅ Upload automático ao tirar foto
- ✅ Botão "Finalizar Vistoria"

**Fluxo:**
1. Cliente aceita o plano
2. Sistema redireciona para tela de vistoria
3. Cliente tira foto seguindo o modelo
4. Foto é enviada automaticamente para backend
5. Cliente avança para próxima foto
6. Ao finalizar todas as fotos, clica em "Finalizar Vistoria"
7. Status muda para "em_analise"
8. Cliente recebe mensagem: "Vistoria finalizada! Aguarde a aprovação do Master Labelview."

---

### 2. **Painel Master - Modelos de Documentos**
**Arquivo:** `/app/frontend/src/components/MasterLabelviewDashboard.js`

**Funcionalidades:**
- ✅ Nova aba "Modelos de Documentos"
- ✅ Upload de imagem modelo CNH
- ✅ Upload de imagem modelo Comprovante
- ✅ Preview e gerenciamento (trocar/remover)

---

### 3. **Backend - Endpoints Existentes**
**Arquivo:** `/app/backend/server.py`

✅ **Criação e Upload:**
- `POST /api/protecao/vistoria/criar` - Criar vistoria
- `POST /api/protecao/vistoria/upload-foto` - Upload de foto individual
- `PUT /api/protecao/vistoria/{id}/finalizar` - Finalizar envio (status → "em_analise")

✅ **Gerenciamento de Modelos:**
- `POST /api/labelview/modelos-documentos/upload` - Upload modelo CNH/Comprovante
- `GET /api/labelview/modelos-documentos` - Buscar modelos
- `DELETE /api/labelview/modelos-documentos/{tipo}` - Remover modelo

✅ **Aprovação (Backend pronto):**
- `PUT /api/protecao/vistoria/foto/status` - Aprovar/rejeitar foto individual
- `POST /api/protecao/vistoria/{id}/aprovar-completo` - Aprovar vistoria completa

---

## ❌ O QUE FALTA IMPLEMENTAR

### **TELA DE VISUALIZAÇÃO E APROVAÇÃO (MASTER)**

**Localização sugerida:** Nova tab "Vistorias Pendentes" no painel Master

#### Componentes Necessários:

1. **Lista de Vistorias Pendentes**
   - Card com dados do cliente
   - Status da vistoria
   - Botão "Analisar Vistoria"

2. **Tela de Análise de Fotos**
   Layout em grid mostrando:
   - **Coluna 1:** Foto modelo (referência)
   - **Coluna 2:** Foto enviada pelo cliente
   - **Coluna 3:** Ações
     - ✅ Botão "Aprovar"
     - ❌ Botão "Rejeitar" (com campo de motivo)
   
3. **Indicadores Visuais**
   - Foto aprovada: borda verde + ícone check
   - Foto rejeitada: borda vermelha + ícone X
   - Foto pendente: borda amarela + ícone relógio

4. **Botão Final**
   - "Aprovar Vistoria Completa" (habilitado apenas se todas aprovadas)
   - Ao clicar: muda status para "aprovada_completa"
   - Cliente recebe notificação

---

## 🔄 FLUXO COMPLETO (COM A PARTE FALTANTE)

### **Etapa 1: Cliente envia fotos** ✅ PRONTO
1. Cliente tira 14+ fotos do veículo + CNH + Comprovante
2. Fotos são salvas no MongoDB (collection `vistorias`)
3. Status: `em_analise`

### **Etapa 2: Master recebe notificação** ⚠️ FALTA IMPLEMENTAR
1. Master vê alerta: "X vistorias pendentes de aprovação"
2. Acessa aba "Vistorias Pendentes"

### **Etapa 3: Master analisa fotos** ❌ FALTA CRIAR INTERFACE
1. Master clica em "Analisar Vistoria"
2. Vê cada foto lado a lado com o modelo
3. Aprova ou rejeita cada foto individualmente
4. Se rejeitar, informa o motivo

### **Etapa 4: Master finaliza aprovação** ❌ FALTA CRIAR INTERFACE
1. Após aprovar todas as fotos
2. Clica em "Aprovar Vistoria Completa"
3. Sistema chama endpoint: `POST /api/protecao/vistoria/{id}/aprovar-completo`
4. Status muda para `aprovada_completa`

### **Etapa 5: Cliente é notificado** ⚠️ SISTEMA DE NOTIFICAÇÃO JÁ EXISTE
1. Cliente recebe notificação no app Transmill
2. Pode prosseguir para próxima etapa (assinatura do contrato)

---

## 📊 ESTRUTURA DE DADOS (MongoDB)

### Collection: `vistorias`

```json
{
  "id": "uuid",
  "cliente_id": "uuid_cliente",
  "cotacao_id": "uuid_cotacao",
  "tipo_veiculo_id": "uuid_tipo",
  "status": "em_analise",  // ou "aprovada_completa", "rejeitada"
  "fotos": [
    {
      "tipo": "Frente do veículo",
      "url": "data:image/jpeg;base64,...",
      "data_hora": "2025-11-21T21:00:00",
      "status": "aprovada",  // ou "pendente", "rejeitada"
      "motivo_rejeicao": ""
    },
    {
      "tipo": "CNH",
      "url": "data:image/jpeg;base64,...",
      "data_hora": "2025-11-21T21:05:00",
      "status": "pendente"
    }
  ],
  "status_aprovacao": "aprovada_completa",
  "aprovada_em": "2025-11-21T21:30:00",
  "aprovada_por": "uuid_master",
  "created_at": "2025-11-21T20:45:00"
}
```

---

## 🎯 PRÓXIMAS AÇÕES NECESSÁRIAS

### **1. Criar Componente: `VistoriaAprovacaoMaster.js`**
- Lista de vistorias pendentes
- Interface de análise foto a foto
- Botões de aprovação/rejeição
- Modal para informar motivo de rejeição

### **2. Adicionar Tab no Painel Master**
- Botão "Vistorias Pendentes" no menu lateral
- Badge com contador de vistorias pendentes

### **3. Integrar com Sistema de Notificações**
- Notificar cliente quando vistoria for aprovada
- Notificar cliente se alguma foto for rejeitada

### **4. Criar Endpoint: GET /api/labelview/vistorias/pendentes**
- Retorna lista de vistorias com status "em_analise"
- Incluir dados do cliente e fotos

---

## 💡 SUGESTÕES DE MELHORIAS FUTURAS

1. **Zoom nas fotos:** Permitir Master dar zoom para ver detalhes
2. **Comparação lado a lado:** Slider para comparar modelo vs foto enviada
3. **Histórico de rejeições:** Mostrar quantas vezes uma foto foi rejeitada
4. **Notificação em tempo real:** WebSocket para avisar Master de nova vistoria
5. **Relatório PDF:** Gerar PDF da vistoria aprovada
6. **Assinatura digital:** Cliente assinar digitalmente confirmando as fotos

---

## 📝 RESUMO DO STATUS

| Componente | Status | Observação |
|------------|--------|------------|
| Tela de Vistoria (Cliente) | ✅ 100% | Totalmente funcional |
| Upload de Fotos | ✅ 100% | Backend funcionando |
| Modelos de Documentos | ✅ 100% | Master pode cadastrar |
| **Interface de Aprovação (Master)** | ❌ 0% | **FALTA CRIAR** |
| Endpoints de Aprovação | ✅ 100% | Backend pronto |
| Notificações | ⚠️ 50% | Sistema existe, falta integrar |
