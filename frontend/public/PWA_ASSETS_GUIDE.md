# Guia de Assets do PWA - EduSolo

Este guia explica como criar os assets necessários para o PWA do EduSolo.

## 📋 Assets Necessários

### 1. Ícones de Shortcuts (96x96px)

Criar ícones de 96x96px para cada módulo em `public/icons/`:

- ✅ `indices-fisicos-96x96.png` - Ícone com símbolo de beaker/tubo de ensaio
- ✅ `granulometria-96x96.png` - Ícone com símbolo de filtro/peneira
- ✅ `compactacao-96x96.png` - Ícone com símbolo de banco de dados/camadas
- ✅ `tensoes-96x96.png` - Ícone com símbolo de montanha/terreno

**Como criar:**
1. Use o logo base do EduSolo (`edusolo - logo.png`)
2. Sobreponha o ícone do módulo (da biblioteca Lucide React)
3. Exporte em 96x96px com fundo transparente ou colorido
4. Use as cores do gradiente de cada módulo (veja `Dashboard.tsx`)

**Cores sugeridas por módulo:**
- Índices Físicos: `from-blue-500 via-blue-600 to-indigo-600`
- Granulometria: `from-purple-500 via-purple-600 to-indigo-600`
- Compactação: `from-violet-500 via-fuchsia-500 to-pink-600`
- Tensões: `from-emerald-500 via-green-500 to-teal-600`

### 2. Screenshots

Criar screenshots em `public/screenshots/`:

- ✅ `screenshot-1.png` - 1280x720px (landscape/wide)
  - Captura da tela do Dashboard com todos os módulos visíveis
  - Desktop ou tablet em modo paisagem

- ✅ `screenshot-2.png` - 750x1334px (portrait/narrow)
  - Captura da tela de Índices Físicos em uso
  - Mobile em modo retrato

**Como criar:**
1. Abra o EduSolo no navegador
2. Use DevTools para definir o tamanho exato da tela
3. Tire um screenshot (F12 > Capturar screenshot)
4. Ou use ferramentas como:
   - Chrome DevTools Screenshot
   - Firefox Screenshot
   - Extensões como "Full Page Screen Capture"

**Dicas:**
- Use tema atrativo (preferencialmente o tema Terra Natural)
- Modo escuro geralmente fica mais bonito
- Certifique-se de que a interface está limpa (sem erros ou avisos)
- Mostre dados de exemplo interessantes

### 3. Ícones PWA Principais

Os ícones principais já existem:
- ✅ `pwa-192x192.png` - Ícone de 192x192px
- ✅ `pwa-512x512.png` - Ícone de 512x512px

**Para criar ícone maskable** (se necessário):
1. Use a ferramenta: https://maskable.app/
2. Carregue o logo do EduSolo
3. Ajuste para garantir que 80% da área do círculo está preenchida
4. Exporte como `pwa-512x512.png` (ou crie um separado `pwa-512x512-maskable.png`)

## 🎨 Ferramenta Rápida para Criar Ícones

Você pode usar o seguinte script Node.js para gerar ícones automaticamente:

```bash
npm install sharp
```

```javascript
// generate-icons.js
const sharp = require('sharp');
const { Beaker, Filter, Database, Mountain } = require('lucide-react');

const modules = [
  { name: 'indices-fisicos', color: '#5B65F0' },
  { name: 'granulometria', color: '#A855F7' },
  { name: 'compactacao', color: '#D946EF' },
  { name: 'tensoes', color: '#10B981' }
];

// Gerar ícones para cada módulo
modules.forEach(async (module) => {
  await sharp('edusolo - logo.png')
    .resize(96, 96)
    .tint({ r: parseInt(module.color.slice(1, 3), 16), 
            g: parseInt(module.color.slice(3, 5), 16), 
            b: parseInt(module.color.slice(5, 7), 16) })
    .toFile(`icons/${module.name}-96x96.png`);
});
```

## ✅ Checklist de Assets

Antes de fazer deploy, verifique:

- [ ] `/icons/indices-fisicos-96x96.png` existe
- [ ] `/icons/granulometria-96x96.png` existe
- [ ] `/icons/compactacao-96x96.png` existe
- [ ] `/icons/tensoes-96x96.png` existe
- [ ] `/screenshots/screenshot-1.png` existe (1280x720)
- [ ] `/screenshots/screenshot-2.png` existe (750x1334)
- [ ] `/pwa-192x192.png` existe
- [ ] `/pwa-512x512.png` existe

## 🚀 Testando o PWA

Após criar os assets:

1. Build do projeto: `npm run build`
2. Preview local: `npm run preview`
3. Abra no Chrome: `http://localhost:8080`
4. DevTools > Application > Manifest
5. Verifique se todos os ícones e screenshots aparecem
6. Teste a instalação do PWA
7. Teste os shortcuts (Android: pressionar e segurar o ícone)

## 📱 Testando Offline

1. Instale o PWA
2. Abra o app instalado e navegue por algumas páginas (para cachear)
3. DevTools > Network > Offline
4. Navegue pelas páginas cacheadas
5. Todas as funcionalidades devem funcionar offline
6. Reconecte e veja se sincroniza automaticamente

## 🎯 Recursos Úteis

- [PWA Builder](https://www.pwabuilder.com/) - Validar e gerar assets
- [Maskable.app](https://maskable.app/) - Editor de ícones maskable
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Debug de PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit de PWA

