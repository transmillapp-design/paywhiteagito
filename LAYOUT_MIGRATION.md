# LAYOUT MIGRATION - OLD DASHBOARDS TO NEW MINIMALIST LAYOUT

## Status: MIGRATED ✅

Data: 14/10/2025

## O Que Mudou:

### ANTES (Versão Antiga - DESCONTINUADA):
- ClientDashboard.js - Dashboard antigo com abas (Sacar, Indicar, Pedidos, Docs, Perfil)
- MerchantDashboard.js - Dashboard antigo com abas (Catálogo, Pedidos, Docs, Perfil)
- ServiceProviderDashboard.js - Dashboard antigo com abas

### AGORA (Versão Nova - EM USO):
- MinimalistHomePage.js - Página inicial única para TODOS os usuários
- Rodapé com 5 botões adaptativos por tipo de usuário
- Rotas separadas para cada funcionalidade

## Estrutura do Novo Layout:

### Para CLIENTE:
- Home: `/` (MinimalistHomePage)
- Rodapé: Carteira | Indicar | Pagar | Lojas | Serviços
- Rotas:
  - `/indicar` - Sistema de indicação isolado
  - `/meus-pedidos` - Lista de pedidos do cliente
  - `/payment` - Pagamento
  - `/lojas` - Catálogo de lojas
  - `/prestadores` - Lista de prestadores

### Para LOJISTA:
- Home: `/` (MinimalistHomePage)
- Rodapé: Carteira | **Pedidos** | Cobrar | Lojas | Serviços
- Rotas:
  - `/pedidos-lojista` - **NOVO!** Lista e gerenciamento de pedidos
  - `/pos` - Sistema de cobrança
  - `/lojas` - Catálogo de lojas
  - `/prestadores` - Lista de prestadores

### Para SERVICE PROVIDER:
- Home: `/` (MinimalistHomePage)
- Rodapé: Carteira | **Agenda** | Cobrar | Lojas | Serviços
- Rotas:
  - `/provider-schedule` - Agenda de agendamentos
  - `/pos` - Sistema de cobrança

## Rotas Antigas (REDIRECIONAM PARA /):

```javascript
/dashboard → /
/client-dashboard → /
/merchant-dashboard → /
/service-provider-dashboard → /
```

## Componentes Comentados (Não Removidos):

```javascript
// app/frontend/src/App.js
// import ClientDashboard from './components/ClientDashboard';
// import MerchantDashboard from './components/MerchantDashboard';
// import ServiceProviderDashboard from './components/ServiceProviderDashboard';
```

**Motivo:** Mantidos comentados para referência, caso alguma funcionalidade antiga precise ser migrada.

## Único Dashboard Antigo Mantido:

- **MasterDashboard** - Para administradores/master
- Rota: `/master-dashboard`
- Motivo: Funcionalidades administrativas específicas

## Sistema de Pedidos:

### Cliente:
1. Navega catálogo: `/catalog/{merchant_id}`
2. Adiciona produtos ao carrinho
3. Finaliza: `/checkout` (MinimalistCheckout.js)
4. Visualiza: `/meus-pedidos` (MeusPedidosPage.js)

### Lojista:
1. Botão "Pedidos" no rodapé
2. Visualiza: `/pedidos-lojista` (MinimalistMerchantOrders.js)
3. Gerencia status dos pedidos
4. Contato direto com cliente via WhatsApp

## Design Pattern:

**Mobile-First Minimalista:**
- Gradiente roxo/azul no header
- Cards arredondados (rounded-2xl)
- Sombras suaves
- Scrollbars estilizadas
- Animações de transição
- Responsive (max-w-md mx-auto)

## Vantagens da Migração:

✅ UX consistente em toda aplicação
✅ Layout único para todos os tipos de usuário
✅ Navegação mais intuitiva via rodapé
✅ Performance melhorada (menos componentes pesados)
✅ Manutenção mais fácil (um layout ao invés de 3)
✅ Mobile-first design
✅ Código mais limpo e organizado

## Próximos Passos:

1. ✅ Migração concluída
2. ⏳ Testar com todos os tipos de usuário
3. ⏳ Remover completamente arquivos antigos após confirmação
4. ⏳ Documentar todas as rotas novas

---

**IMPORTANTE:** Todos os usuários agora usam o mesmo layout base (MinimalistHomePage) com funcionalidades adaptativas por tipo de usuário. Não há mais dashboards separados.
