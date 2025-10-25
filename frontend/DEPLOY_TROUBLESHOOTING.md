# Guia de Troubleshooting - Rotas SPA

Este guia ajuda a resolver problemas com rotas em Single Page Applications (SPAs) como React Router.

## Problema: Erro 404 ao acessar rotas diretamente

Quando você acessa `/indices-fisicos` diretamente (através de refresh ou link direto), o servidor tenta encontrar esse arquivo fisicamente, mas ele não existe. O React Router só funciona quando o `index.html` é carregado primeiro.

## Soluções por Plataforma

### 1. Render.com (Configuração Atual)

O projeto está configurado para Render.com. Verifique:

#### A. Arquivo `render.yaml` (raiz do projeto)
```yaml
# Frontend - React + Vite
- type: web
  name: edusolo-frontend
  runtime: static
  buildCommand: "cd frontend && npm install && npm run build"
  staticPublishPath: ./frontend/dist
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
```

#### B. Arquivo `frontend/public/render.yaml`
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

**Importante:** Após atualizar esses arquivos:
1. Commit as mudanças
2. Push para o repositório
3. Aguarde o Render.com fazer o redeploy automático (5-10 minutos)
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

### 2. Netlify

Se usar Netlify, o arquivo `_redirects` já está configurado:
```
/*    /index.html   200
```

### 3. Vercel

Crie um arquivo `vercel.json` na raiz do frontend:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4. Desenvolvimento Local (Vite)

O arquivo `vite.config.ts` já está configurado com:
```typescript
server: {
  historyApiFallback: true,
},
preview: {
  historyApiFallback: true,
}
```

## Testando Localmente

### Teste em Desenvolvimento:
```bash
cd frontend
npm run dev
```
Acesse: http://localhost:8080/indices-fisicos

### Teste do Build (Preview):
```bash
cd frontend
npm run build
npm run preview
```
Acesse: http://localhost:8080/indices-fisicos

## Checklist de Verificação

- [ ] Arquivo `render.yaml` atualizado na raiz do projeto
- [ ] Arquivo `render.yaml` criado em `frontend/public/`
- [ ] Commit feito das alterações
- [ ] Push para o repositório
- [ ] Aguardado redeploy no Render.com (verificar logs)
- [ ] Cache do navegador limpo
- [ ] Testado em aba anônima/privada
- [ ] Testado diretamente na URL (ex: `seu-site.com/indices-fisicos`)

## Verificando Logs no Render.com

1. Acesse o dashboard do Render.com
2. Selecione o serviço `edusolo-frontend`
3. Clique em "Logs"
4. Verifique se há erros no build ou deploy
5. Procure por mensagens como "Deploy succeeded"

## Comandos Úteis

### Limpar cache e reconstruir:
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Verificar se o arquivo está no dist:
```bash
ls frontend/dist/
# Deve conter: index.html, assets/, render.yaml, _redirects
```

## Ainda Não Funciona?

Se após todas essas verificações o problema persistir, verifique:

1. **URL da aplicação**: Certifique-se de estar acessando a URL correta do Render
2. **DNS/CDN Cache**: Se usar domínio customizado, pode levar até 48h para propagar
3. **Browser Cache**: Use modo anônimo ou limpe completamente o cache
4. **Service Worker**: Se houver um service worker antigo, pode estar causando problemas

### Forçar limpeza do Service Worker:
1. Abra DevTools (F12)
2. Vá em Application > Service Workers
3. Clique em "Unregister" em todos os service workers
4. Recarregue a página

## Contato de Suporte

Se nenhuma dessas soluções funcionar, verifique:
- Logs do Render.com para erros específicos
- Console do navegador (F12) para erros JavaScript
- Network tab para ver se os arquivos estão sendo carregados corretamente

