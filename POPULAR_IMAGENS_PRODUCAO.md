# 🎯 Como Popular Imagens em Produção

## ❗ Problema Identificado

Você está acessando um **banco de dados de PRODUÇÃO** que NÃO tem as imagens. O banco LOCAL tem as imagens, mas o de produção está vazio.

## ✅ Solução: Chamar Endpoint no Navegador

Criei um endpoint especial que popula as imagens diretamente no banco de produção. Você pode chamar pelo navegador!

---

## 📋 Passo a Passo

### Método 1: Via Console do Navegador (MAIS FÁCIL)

1. **Abra o console do navegador** (F12)

2. **Cole e execute este código:**

```javascript
fetch('https://app.transmill.com.br/api/setup/populate-vehicle-images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ RESULTADO:', data);
  
  if (data.success) {
    console.log('🎉 SUCESSO!');
    console.log(`   - Total de tipos: ${data.total_tipos}`);
    console.log(`   - Atualizados: ${data.atualizados}`);
    console.log(`   - Já tinham: ${data.ja_tinham}`);
    console.log('');
    console.log('📋 Detalhes:');
    data.detalhes.forEach(d => {
      console.log(`   ${d.tipo}: ${d.status} (${d.imagens} imagens)`);
    });
    console.log('');
    console.log('✅ Agora faça:');
    console.log('   1. Fazer logout');
    console.log('   2. Limpar cache (Ctrl+Shift+R)');
    console.log('   3. Fazer login novamente');
    console.log('   4. Editar um tipo de veículo');
    console.log('   5. As imagens devem aparecer!');
  } else {
    console.error('❌ ERRO:', data.error);
  }
})
.catch(error => {
  console.error('❌ Erro na requisição:', error);
});
```

3. **Aguarde a resposta**

4. **Se retornar sucesso:**
   - Fazer **logout**
   - Limpar cache: **Ctrl+Shift+R** (Windows) ou **Cmd+Shift+R** (Mac)
   - Fazer **login** novamente
   - **Editar um tipo de veículo**
   - As **imagens devem aparecer**!

---

### Método 2: Via Postman/Insomnia

**URL:** `https://app.transmill.com.br/api/setup/populate-vehicle-images`  
**Método:** `POST`  
**Headers:** Nenhum necessário  
**Body:** Vazio

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Operação concluída com sucesso!",
  "total_tipos": 5,
  "atualizados": 5,
  "ja_tinham": 0,
  "detalhes": [
    {
      "tipo": "Carro Leve",
      "status": "atualizado",
      "imagens": 14,
      "conjunto": "carros_suv"
    },
    ...
  ]
}
```

---

### Método 3: Via cURL (Terminal/CMD)

```bash
curl -X POST https://app.transmill.com.br/api/setup/populate-vehicle-images
```

---

## 🔍 Verificação

Após chamar o endpoint, verifique:

1. **Console deve mostrar:**
   ```
   ✅ SUCESSO!
      - Total de tipos: 5
      - Atualizados: 5 (ou número de tipos que foram atualizados)
   ```

2. **Faça logout e login novamente**

3. **Edite um tipo de veículo**

4. **As imagens DEVEM aparecer!**

---

## ⚠️ Se der erro

### Erro: "Arquivo de imagens não encontrado"

**Solução:** O arquivo `/app/IMAGENS_VISTORIA_REFERENCIA.json` não está no servidor de produção.

**Como resolver:**
1. Copie o arquivo do repositório para o servidor
2. Ou crie o arquivo manualmente (veja estrutura abaixo)

### Erro: "Nenhum tipo de veículo encontrado"

**Solução:** Os tipos de veículos não estão cadastrados no banco.

**Como resolver:**
1. Cadastre os 5 tipos manualmente pelo painel Master
2. Depois chame o endpoint novamente

---

## 📊 Estrutura do Arquivo de Imagens

Se o arquivo não existir, crie `/app/IMAGENS_VISTORIA_REFERENCIA.json` com este conteúdo:

```json
{
  "carros_suv": {
    "tipo": "Carros, SUVs, Aplicativos",
    "imagens": [
      {"nome": "Bancos dianteiros", "url": "https://images.unsplash.com/photo-1682858110563-3f609263d418?..."},
      {"nome": "Bancos traseiros", "url": "https://images.unsplash.com/photo-1697055407542-e134e54cccf8?..."},
      {"nome": "Frente do veiculo", "url": "https://images.unsplash.com/photo-1649932759854-68a5c10c4220?..."},
      ... (14 imagens no total)
    ]
  },
  "moto": {
    "tipo": "Motocicletas",
    "imagens": [
      {"nome": "Frente da moto", "url": "https://images.unsplash.com/photo-1588627541420-fce3f661b779?..."},
      ... (9 imagens no total)
    ]
  },
  "caminhao": {
    "tipo": "Caminhões",
    "imagens": [
      {"nome": "Volante e velocimetro", "url": "https://images.pexels.com/photos/5024803/pexels-photo-5024803.jpeg"},
      ... (11 imagens no total)
    ]
  }
}
```

*O arquivo completo já existe em `/app/IMAGENS_VISTORIA_REFERENCIA.json` com todas as 62 URLs*

---

## 🎯 Resumo

```
1. Abrir console (F12)
2. Colar o código JavaScript
3. Executar (Enter)
4. Aguardar "✅ SUCESSO!"
5. Logout
6. Limpar cache (Ctrl+Shift+R)
7. Login
8. Editar tipo de veículo
9. ✅ Imagens devem aparecer!
```

---

## 🔒 Segurança

**IMPORTANTE:** Este endpoint NÃO requer autenticação para facilitar o uso. Depois de popular as imagens, você pode:

1. Remover o endpoint do código (linhas no `server.py`)
2. Ou deixar - ele só atualiza se os tipos não tiverem imagens

---

## 📞 Suporte

Se após chamar o endpoint as imagens ainda não aparecerem:

1. Verifique o console do navegador (F12) após editar um tipo
2. Verifique Network → `tipos-veiculo` → Response
3. Deve ter `imagens_vistoria` com array de objetos
4. Cada objeto deve ter `nome` e `url`

Me informe o resultado e continuamos o debug!

---

**Criado em:** 2025-12-03  
**Versão:** 1.0  
**Endpoint:** `/api/setup/populate-vehicle-images`
