# Setup de Produção - AgitoCoin

## 🚨 IMPORTANTE: Banco de Dados de Produção

Quando você faz deploy na plataforma Emergent, o **banco de dados de produção está separado do banco local**. Por isso, após o deploy, o banco estará vazio e você precisará popular os dados iniciais.

---

## 📋 Passo a Passo para Popular o Banco de Produção

### Opção 1: Via Terminal da Plataforma (RECOMENDADO)

Se a plataforma Emergent permite acesso via terminal/SSH ao container em produção:

1. **Acesse o terminal do container em produção**
2. **Execute o script de seed:**
   ```bash
   cd /app
   python3 seed_production_data.py
   ```

3. **Verifique se os dados foram criados:**
   - Faça login com: `master@agitocoin.com` / `master123`
   - Acesse o painel master
   - Verifique se os tipos de prestadores e segmentos aparecem

---

### Opção 2: Via Interface Web (MANUAL)

Se não tiver acesso ao terminal, você pode criar manualmente:

#### 1. Criar Conta Master (se não existir)
- Use o endpoint de registro com dados específicos
- Ou peça suporte da plataforma Emergent

#### 2. Criar Tipos de Prestadores
No painel master, aba "Segmentos", adicione:

**Doméstico:**
- ⚡ Eletricista - Serviços elétricos residenciais e comerciais
- 🔧 Encanador - Serviços de encanamento e hidráulica
- 🧹 Diarista - Limpeza e organização de ambientes
- 🌿 Jardineiro - Cuidados com jardim e plantas

**Construção:**
- 🎨 Pintor - Pintura residencial e comercial
- 🧱 Pedreiro - Serviços de construção e reforma
- 🪚 Marceneiro - Móveis planejados e marcenaria

**Automotivo:**
- 🔩 Mecânico - Manutenção e reparos automotivos
- 🚗 Eletricista de Autos - Elétrica automotiva

**Beleza:**
- 💇 Cabeleireiro - Cortes e tratamentos capilares
- 💅 Manicure - Cuidados com unhas e estética das mãos

**Saúde:**
- 💪 Personal Trainer - Treinamento físico personalizado
- 🥗 Nutricionista - Orientação nutricional e dietas

**Educação:**
- 📚 Professor Particular - Aulas particulares e reforço escolar

**Tecnologia:**
- 💻 Desenvolvedor - Desenvolvimento de software e sistemas

#### 3. Criar Segmentos de Negócio
No painel master, aba "Segmentos", adicione:

- **Alimentação** - 5% cashback
- **Supermercados** - 3% cashback
- **Farmácias** - 4% cashback
- **Postos de Combustível** - 2% cashback
- **Vestuário** - 6% cashback
- **Eletrônicos** - 4% cashback
- **Saúde e Beleza** - 5% cashback
- **Educação** - 7% cashback
- **Entretenimento** - 8% cashback
- **Serviços Gerais** - 5% cashback

---

## 🔑 Credenciais Demo

Após executar o seed, estas contas estarão disponíveis:

| Tipo | Email | Senha |
|------|-------|-------|
| Master | master@agitocoin.com | master123 |
| Cliente | cliente@demo.com | demo123 |
| Lojista | lojista@demo.com | demo123 |
| Prestador | prestador@demo.com | demo123 |

---

## 📊 O Que o Script Cria

O script `seed_production_data.py` popula:

1. ✅ **1 Conta Master** - Para administração
2. ✅ **15 Tipos de Prestadores** - Categorias variadas
3. ✅ **10 Segmentos de Negócio** - Com % de cashback
4. ✅ **3 Contas Demo** - Cliente, Lojista e Prestador

---

## 🐛 Troubleshooting

### Tipos de Prestadores não aparecem no cadastro
**Problema:** Dropdown "Tipo de Prestador" vazio no formulário de registro

**Solução:** 
- O endpoint público `/api/public/service-provider-types` deve retornar dados
- Verifique se os tipos foram criados no banco de produção
- Execute o script de seed

### Painel Master não mostra prestadores
**Problema:** Aba "Usuários" mostra 0 prestadores

**Causas possíveis:**
1. Banco de produção vazio - Execute o seed
2. API não retorna dados - Verifique logs do backend
3. Frontend não está fazendo a requisição - Verifique console do browser

### Não consigo criar segmentos ou tipos
**Problema:** Botão "Criar" não funciona

**Solução:**
1. Verifique se está logado como conta master
2. Verifique se o token JWT está válido
3. Verifique logs de erro no console do browser
4. Verifique logs do backend

---

## 📞 Suporte

Se tiver problemas para executar o seed em produção:

1. **Discord Emergent:** https://discord.gg/VzKfwCXC4A
2. **Email:** support@emergent.sh
3. **Peça ajuda para:** "Executar script de seed no ambiente de produção"

---

## ✅ Checklist Pós-Deploy

- [ ] Deploy completado com sucesso
- [ ] Script de seed executado em produção
- [ ] Login master funciona
- [ ] Tipos de prestadores aparecem no cadastro
- [ ] Segmentos aparecem no painel master
- [ ] Prestador demo consegue fazer login
- [ ] Painel master mostra todos os dados corretamente

