#!/usr/bin/env node

/**
 * Script de verificação de configuração SPA
 * Verifica se todos os arquivos necessários estão configurados corretamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuração de SPA para React Router...\n');

let hasErrors = false;

// Verificar vite.config.ts
console.log('1️⃣  Verificando vite.config.ts...');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
  
  if (viteConfig.includes('historyApiFallback')) {
    console.log('   ✅ historyApiFallback configurado');
  } else {
    console.log('   ❌ historyApiFallback NÃO encontrado');
    hasErrors = true;
  }
  
  if (viteConfig.includes('base: "/"') || viteConfig.includes('base:"/"')) {
    console.log('   ✅ base: "/" configurado');
  } else {
    console.log('   ⚠️  base não está definido como "/"');
  }
} else {
  console.log('   ❌ vite.config.ts não encontrado');
  hasErrors = true;
}

// Verificar arquivo _redirects
console.log('\n2️⃣  Verificando _redirects (Netlify)...');
const redirectsPath = path.join(__dirname, 'public', '_redirects');
if (fs.existsSync(redirectsPath)) {
  const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
  if (redirectsContent.includes('/*') && redirectsContent.includes('/index.html')) {
    console.log('   ✅ _redirects configurado corretamente');
  } else {
    console.log('   ⚠️  _redirects existe mas pode estar mal configurado');
  }
} else {
  console.log('   ⚠️  _redirects não encontrado (OK se não usar Netlify)');
}

// Verificar render.yaml em public
console.log('\n3️⃣  Verificando render.yaml em public/ (Render.com)...');
const renderYamlPublicPath = path.join(__dirname, 'public', 'render.yaml');
if (fs.existsSync(renderYamlPublicPath)) {
  const renderYaml = fs.readFileSync(renderYamlPublicPath, 'utf-8');
  if (renderYaml.includes('rewrite') && renderYaml.includes('/index.html')) {
    console.log('   ✅ render.yaml configurado corretamente');
  } else {
    console.log('   ⚠️  render.yaml existe mas pode estar mal configurado');
  }
} else {
  console.log('   ⚠️  render.yaml não encontrado em public/');
}

// Verificar render.yaml na raiz do projeto
console.log('\n4️⃣  Verificando render.yaml na raiz do projeto...');
const renderYamlRootPath = path.join(__dirname, '..', 'render.yaml');
if (fs.existsSync(renderYamlRootPath)) {
  const renderYaml = fs.readFileSync(renderYamlRootPath, 'utf-8');
  if (renderYaml.includes('runtime: static') || renderYaml.includes('runtime:static')) {
    console.log('   ✅ runtime: static encontrado');
  } else {
    console.log('   ⚠️  runtime não está definido como "static"');
  }
  
  if (renderYaml.includes('routes:')) {
    console.log('   ✅ Seção routes encontrada');
  } else {
    console.log('   ❌ Seção routes NÃO encontrada');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  render.yaml não encontrado na raiz do projeto');
}

// Verificar se dist existe e contém index.html
console.log('\n5️⃣  Verificando build (dist/)...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('   ✅ dist/index.html encontrado');
  } else {
    console.log('   ❌ dist/index.html NÃO encontrado');
    hasErrors = true;
  }
  
  // Verificar se os arquivos de configuração foram copiados para dist
  const distRedirects = path.join(distPath, '_redirects');
  const distRenderYaml = path.join(distPath, 'render.yaml');
  
  if (fs.existsSync(distRedirects)) {
    console.log('   ✅ _redirects copiado para dist/');
  }
  
  if (fs.existsSync(distRenderYaml)) {
    console.log('   ✅ render.yaml copiado para dist/');
  }
} else {
  console.log('   ⚠️  dist/ não encontrado. Execute: npm run build');
}

// Verificar App.tsx para BrowserRouter
console.log('\n6️⃣  Verificando App.tsx...');
const appPath = path.join(__dirname, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf-8');
  if (appContent.includes('BrowserRouter')) {
    console.log('   ✅ BrowserRouter encontrado');
  } else if (appContent.includes('HashRouter')) {
    console.log('   ⚠️  HashRouter encontrado (não recomendado para produção)');
  } else {
    console.log('   ❌ Nenhum Router encontrado');
    hasErrors = true;
  }
} else {
  console.log('   ❌ App.tsx não encontrado');
  hasErrors = true;
}

// Resumo
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ ERROS ENCONTRADOS - Corrija os problemas acima');
  console.log('\n📖 Consulte DEPLOY_TROUBLESHOOTING.md para mais informações');
  process.exit(1);
} else {
  console.log('✅ CONFIGURAÇÃO OK - Pronto para deploy!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "fix: configurar rotas SPA"');
  console.log('   3. git push');
  console.log('   4. Aguarde o deploy no Render.com (5-10 min)');
  console.log('   5. Limpe o cache do navegador');
  process.exit(0);
}

