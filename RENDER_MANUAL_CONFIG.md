# Configuração Manual no Render.com

Se o problema de 404 persistir mesmo após o deploy com o `render.yaml` atualizado, você pode precisar configurar as rotas manualmente no painel do Render.com.

## 📋 Passo a Passo - Configuração Manual

### 1️⃣ Acesse o Dashboard do Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Faça login na sua conta
3. Localize o serviço `edusolo-frontend`

### 2️⃣ Configurar Rewrites/Redirects

#### Opção A: Via Settings (Recomendado)

1. Clique no serviço `edusolo-frontend`
2. Vá em **Settings** (configurações)
3. Role até a seção **Redirects/Rewrites**
4. Clique em **Add Rewrite Rule**
5. Configure:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
6. Clique em **Save Changes**

#### Opção B: Via render.yaml (Já Configurado)

O arquivo `render.yaml` já está configurado com:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### 3️⃣ Verificar Build Command

No painel do Render, verifique se o **Build Command** está correto:

```bash
cd frontend && npm ci && npm run build
```

### 4️⃣ Verificar Publish Directory

Certifique-se de que o **Publish Directory** está configurado como:

```
./frontend/dist
```

### 5️⃣ Forçar um Novo Deploy

Após fazer qualquer alteração:

1. Vá em **Manual Deploy**
2. Clique em **Deploy latest commit**
3. Aguarde o build completar (5-10 minutos)
4. Verifique os logs para erros

## 🔍 Verificando os Logs

Durante o deploy, verifique se:

1. ✅ O build completa com sucesso
2. ✅ Arquivos são copiados para `dist/`
3. ✅ Os arquivos `_redirects` e `render.yaml` estão em `dist/`
4. ✅ Não há erros de permissão ou paths

### Exemplo de Log Bem-Sucedido:

```
==> Building...
npm ci
npm run build
✓ built in 13.63s

==> Uploading build...
==> Build successful 🎉

==> Deploying...
==> Deploy successful!
```

## 🧪 Testando Após o Deploy

### 1. Limpar Cache do Navegador

**Chrome/Edge:**
- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"

**Ou use Modo Anônimo:**
- Pressione `Ctrl + Shift + N`

### 2. Testar as Rotas Diretamente

Acesse diretamente no navegador:

```
https://seu-app.onrender.com/
https://seu-app.onrender.com/indices-fisicos
https://seu-app.onrender.com/granulometria
https://seu-app.onrender.com/compactacao
```

Todas devem carregar sem erro 404.

### 3. Verificar no DevTools

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Acesse uma rota direta (ex: `/indices-fisicos`)
4. Verifique se:
   - `index.html` é carregado (status 200)
   - Não há erros 404
   - JavaScript carrega corretamente

## ⚠️ Problemas Comuns

### Problema 1: Cache do CDN

**Sintoma:** Mudanças não aparecem mesmo após deploy

**Solução:**
1. No painel do Render, vá em **Settings**
2. Role até **CDN**
3. Clique em **Purge Cache**
4. Aguarde 5 minutos
5. Teste novamente

### Problema 2: Service Worker Antigo

**Sintoma:** Aplicação carrega versão antiga

**Solução:**
1. Abra DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Clique em **Unregister** em todos os service workers
4. Recarregue a página

### Problema 3: Variáveis de Ambiente

**Sintoma:** API não conecta ou erros de configuração

**Solução:**
1. Vá em **Environment**
2. Verifique se `VITE_API_URL` está configurado
3. O valor deve ser a URL do backend (ex: `https://edusolo-api.onrender.com`)

### Problema 4: Build Command Falha

**Sintoma:** Deploy falha durante o build

**Solução:**
```bash
# Tente usar npm install em vez de npm ci
cd frontend && npm install && npm run build

# Ou limpe o cache
cd frontend && rm -rf node_modules package-lock.json && npm install && npm run build
```

## 🔄 Alternativa: Deletar e Recriar o Serviço

Se absolutamente nada funcionar:

1. **Backup**: Anote todas as configurações atuais
2. **Delete** o serviço `edusolo-frontend`
3. **Recrie** usando:
   - **Type:** Static Site
   - **Repository:** Seu repositório
   - **Branch:** main
   - **Build Command:** `cd frontend && npm ci && npm run build`
   - **Publish Directory:** `./frontend/dist`
4. Adicione as variáveis de ambiente novamente
5. Deploy

## 📞 Suporte Adicional

Se o problema persistir:

1. **Logs do Render:** Copie os logs completos do build
2. **Console do Navegador:** Screenshot dos erros no console (F12)
3. **Network Tab:** Screenshot da aba Network mostrando os requests

### Informações Úteis para Debug:

- URL da aplicação: `______________________`
- Data/hora do último deploy: `______________________`
- Versão do Node: `20.11.0`
- Comando de build: `cd frontend && npm ci && npm run build`
- Publish directory: `./frontend/dist`

## ✅ Checklist Final

Antes de buscar suporte, verifique:

- [ ] `render.yaml` commitado e pushed
- [ ] Build completa sem erros
- [ ] `dist/` contém `index.html` e arquivos de configuração
- [ ] Rewrite rule configurada (manual ou via YAML)
- [ ] Cache do navegador limpo
- [ ] Testado em modo anônimo
- [ ] CDN cache purgado (se aplicável)
- [ ] Service workers desregistrados
- [ ] Variáveis de ambiente configuradas

## 🎯 Resultado Esperado

Após seguir todos os passos:

✅ `https://seu-app.onrender.com/` → Carrega a home  
✅ `https://seu-app.onrender.com/indices-fisicos` → Carrega a página sem 404  
✅ `https://seu-app.onrender.com/qualquer-rota` → React Router controla  
✅ Refresh (F5) em qualquer página → Funciona normalmente  

---

**Última atualização:** Outubro 2025  
**Testado com:** Render.com Static Sites, React 18, Vite 5, React Router 6

