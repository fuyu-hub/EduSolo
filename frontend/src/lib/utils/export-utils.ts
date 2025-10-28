import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import katex from 'katex';

/**
 * SISTEMA DE RENDERIZAÇÃO DE SÍMBOLOS MATEMÁTICOS EM PDF
 * 
 * Este módulo implementa renderização avançada de símbolos matemáticos em PDFs,
 * preservando os símbolos Unicode originais e aplicando formatação apropriada.
 * 
 * FUNCIONALIDADES:
 * 
 * 1. Símbolos Gregos:
 *    - São renderizados 35% maiores que o texto normal
 *    - Suportados: γ, σ, τ, φ, ω, μ, ε, δ, α, β, θ, ρ, Δ, Γ, Σ, Φ, Ω, Θ
 * 
 * 2. Subscritos:
 *    - Detectados após underscore (_) ou diretamente após símbolo
 *    - Exemplo: γ_sat, σ_v renderiza "sat" e "v" menores e abaixo
 *    - Tamanho: 65% do texto base
 * 
 * 3. Superscritos (linha/apóstrofo):
 *    - Detectados como apóstrofo após símbolo
 *    - Exemplo: σ' renderiza o apóstrofo menor e elevado
 *    - Tamanho: 75% do texto base
 * 
 * 4. Combinações:
 *    - Suporta combinações complexas: Δσ_v, γ_sat, σ'_v, etc.
 *    - Múltiplos símbolos consecutivos são tratados individualmente
 * 
 * EXEMPLO DE USO:
 *    Input: "Peso específico γ_sat = 18.5 kN/m³"
 *    Output: Texto normal + γ (grande) + "sat" (pequeno, abaixo) + = 18.5 kN/m³
 * 
 * As funções principais são aplicadas automaticamente em:
 * - Labels e valores de entrada (inputs)
 * - Labels e valores de resultados (results)
 * - Labels e valores de resumo (summary)
 * - Títulos de tabelas (tables)
 */

export type ThemeColor = "soil" | "blue" | "green" | "purple" | "pink" | "orange" | "cyan" | "amber" | "indigo" | "red" | "slate";
export type ThemeMode = "light" | "dark";
export type PageOrientation = "portrait" | "landscape";
export type PaperSize = "A4" | "Letter";
export type PageMargins = "normal" | "narrow" | "wide";

export interface PrintSettings {
  pageOrientation?: PageOrientation;
  pageMargins?: PageMargins;
  includeLogo?: boolean;
  includeDate?: boolean;
  includeFormulas?: boolean;
  paperSize?: PaperSize;
  useDynamicTheme?: boolean; // Se true, usa o tema atual; se false, usa tema fixo
  fixedTheme?: string; // Tema fixo quando useDynamicTheme é false
  includeCustomTitle?: boolean; // Se true, permite adicionar título personalizado no PDF
}

export interface ExportData {
  moduleName: string;
  moduleTitle: string;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string; highlight?: boolean }[];
  summary?: { label: string; value: string }[]; // Resumo da análise
  formulas?: { label: string; formula: string; description?: string; latex?: boolean }[]; // Fórmulas (suporta LaTeX)
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
  chartImage?: string; // Base64 image de gráficos
  customFileName?: string; // Nome customizado para o arquivo
  customTitle?: string; // Título personalizado do relatório (aparece no cabeçalho do PDF)
  theme?: { color: ThemeColor; mode: ThemeMode }; // Tema atual do app (pode ser dinâmico)
  printSettings?: PrintSettings; // Configurações de impressão
}

/**
 * Obtém o tema correto para usar no PDF baseado nas configurações
 * Se useDynamicTheme = true, usa o tema atual passado
 * Se useDynamicTheme = false, usa o tema fixo configurado
 */
export function getPDFTheme(
  currentTheme: { color: ThemeColor; mode: ThemeMode } | undefined,
  printSettings: PrintSettings | undefined
): { color: ThemeColor; mode: ThemeMode } {
  // Se não há printSettings ou deve usar tema dinâmico, usa o tema atual
  if (!printSettings || printSettings.useDynamicTheme) {
    return currentTheme || { color: 'indigo', mode: 'light' };
  }
  
  // Usa tema fixo configurado
  return {
    color: (printSettings.fixedTheme as ThemeColor) || 'indigo',
    mode: 'light' // PDFs sempre em modo claro
  };
}

export interface ExcelExportData {
  moduleName: string;
  moduleTitle: string;
  sheets: {
    name: string;
    data: { label: string; value: string | number }[];
  }[];
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
}

/**
 * Interface para representar um segmento de texto formatado
 */
interface TextoFormatado {
  texto: string;
  tamanho: 'normal' | 'grande' | 'pequeno';
  tipo: 'simbolo' | 'texto' | 'subscrito' | 'superscrito';
}

/**
 * Analisa texto e identifica símbolos matemáticos, subscritos e superscritos
 * Retorna array de segmentos formatados
 */
function analisarTextoMatematico(texto: string): TextoFormatado[] {
  const segmentos: TextoFormatado[] = [];
  const simbolosGrecos = ['γ', 'σ', 'τ', 'φ', 'ω', 'μ', 'ε', 'δ', 'α', 'β', 'θ', 'ρ', 'Δ', 'Γ', 'Σ', 'Φ', 'Ω', 'Θ'];
  
  // Padrões complexos: γsat, γ_sat, σ'v, σ'_v, Δσv, Δσ_v, etc.
  // Captura: símbolo(s) + apóstrofo opcional + underscore opcional + subscrito opcional
  // Subscrito pode ser: letras minúsculas ou números (sat, sub, n, d, v, h, w, 0, 1, etc.)
  const padraoComplexo = /([γσταφωμεδαβθρΔΓΣΦΩΘ]{1,2})(['']?)(_)?([a-z0-9]+)?/gi;
  
  let ultimoIndice = 0;
  let match;
  let encontrouPadrao = false;
  
  while ((match = padraoComplexo.exec(texto)) !== null) {
    // Ignorar matches vazios ou apenas com o símbolo sem subscrito
    const temConteudoRelevante = match[2] || match[4]; // tem apóstrofo ou subscrito
    
    // Se tem só o símbolo sem nada relevante, pular (será processado depois)
    if (!temConteudoRelevante && match[0].length <= 2) {
      // É apenas um ou dois símbolos isolados, processar depois
      continue;
    }
    
    encontrouPadrao = true;
    
    // Adicionar texto antes do match (se houver)
    if (match.index > ultimoIndice) {
      const textoAntes = texto.substring(ultimoIndice, match.index);
      if (textoAntes) {
        // Processar texto antes para símbolos isolados
        for (let i = 0; i < textoAntes.length; i++) {
          const char = textoAntes[i];
          if (simbolosGrecos.includes(char)) {
            segmentos.push({ texto: char, tamanho: 'grande', tipo: 'simbolo' });
          } else {
            // Adicionar caracteres normais
            if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo === 'texto') {
              segmentos[segmentos.length - 1].texto += char;
            } else {
              segmentos.push({ texto: char, tamanho: 'normal', tipo: 'texto' });
            }
          }
        }
      }
    }
    
    // Processar símbolos (pode ser Δσ - dois símbolos)
    const simbolos = match[1];
    for (const simbolo of simbolos) {
      segmentos.push({ 
        texto: simbolo, 
        tamanho: 'grande', 
        tipo: 'simbolo' 
      });
    }
    
    // Apóstrofo (linha) - tamanho normal ao lado do símbolo
    if (match[2]) {
      segmentos.push({ 
        texto: match[2] === '\u2019' ? "'" : match[2], 
        tamanho: 'normal', 
        tipo: 'superscrito' 
      });
    }
    
    // Subscrito (menor)
    if (match[4]) {
      segmentos.push({ 
        texto: match[4], 
        tamanho: 'pequeno', 
        tipo: 'subscrito' 
      });
    }
    
    ultimoIndice = match.index + match[0].length;
  }
  
  // Adicionar texto restante
  if (ultimoIndice < texto.length) {
    const textoRestante = texto.substring(ultimoIndice);
    if (textoRestante) {
      // Processar caractere por caractere para capturar símbolos isolados
      for (let i = 0; i < textoRestante.length; i++) {
        const char = textoRestante[i];
        if (simbolosGrecos.includes(char)) {
          segmentos.push({ texto: char, tamanho: 'grande', tipo: 'simbolo' });
          encontrouPadrao = true;
        } else {
          if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo === 'texto') {
            segmentos[segmentos.length - 1].texto += char;
          } else {
            segmentos.push({ texto: char, tamanho: 'normal', tipo: 'texto' });
          }
        }
      }
    }
  }
  
  // Se não encontrou nenhum padrão matemático, retornar o texto completo como normal
  if (!encontrouPadrao) {
    return [{ texto, tamanho: 'normal', tipo: 'texto' }];
  }
  
  return segmentos;
}

/**
 * Renderiza texto com símbolos matemáticos formatados no PDF
 */
function renderizarTextoMatematico(
  doc: jsPDF, 
  texto: string, 
  x: number, 
  y: number, 
  tamanhoBase: number = 10
): number {
  const segmentos = analisarTextoMatematico(texto);
  let posX = x;
  
  for (let i = 0; i < segmentos.length; i++) {
    const segmento = segmentos[i];
    let tamanhoFonte = tamanhoBase;
    let offsetY = 0;
    let espacamentoExtra = 0;
    
    switch (segmento.tamanho) {
      case 'grande':
        tamanhoFonte = tamanhoBase * 1.35; // 35% maior para símbolos
        // Adicionar pequeno espaço antes de símbolos (exceto no início)
        if (i > 0 && segmentos[i - 1].tipo === 'texto') {
          espacamentoExtra = tamanhoBase * 0.1;
        }
        break;
      case 'pequeno':
        tamanhoFonte = tamanhoBase * 0.65; // 35% menor para subscritos
        offsetY = tamanhoBase * 0.3; // Descer um pouco
        break;
      case 'normal':
        if (segmento.tipo === 'superscrito') {
          tamanhoFonte = tamanhoBase * 0.75;
          offsetY = -tamanhoBase * 0.25; // Subir um pouco
        }
        break;
    }
    
    posX += espacamentoExtra;
    doc.setFontSize(tamanhoFonte);
    const larguraTexto = doc.getTextWidth(segmento.texto);
    doc.text(segmento.texto, posX, y + offsetY);
    posX += larguraTexto;
    
    // Adicionar pequeno espaço depois de subscritos antes de texto normal
    if (segmento.tipo === 'subscrito' && i < segmentos.length - 1 && segmentos[i + 1].tipo === 'texto') {
      posX += tamanhoBase * 0.15;
    }
  }
  
  // Retornar posição X final
  return posX;
}

/**
 * Calcula a largura total que um texto formatado ocupará
 * Útil para centralização e alinhamento
 */
function calcularLarguraTextoMatematico(
  doc: jsPDF,
  texto: string,
  tamanhoBase: number = 10
): number {
  const segmentos = analisarTextoMatematico(texto);
  let larguraTotal = 0;
  
  for (let i = 0; i < segmentos.length; i++) {
    const segmento = segmentos[i];
    let tamanhoFonte = tamanhoBase;
    let espacamentoExtra = 0;
    
    switch (segmento.tamanho) {
      case 'grande':
        tamanhoFonte = tamanhoBase * 1.35;
        if (i > 0 && segmentos[i - 1].tipo === 'texto') {
          espacamentoExtra = tamanhoBase * 0.1;
        }
        break;
      case 'pequeno':
        tamanhoFonte = tamanhoBase * 0.65;
        break;
      case 'normal':
        if (segmento.tipo === 'superscrito') {
          tamanhoFonte = tamanhoBase * 0.75;
        }
        break;
    }
    
    const tamanhoAnterior = doc.getFontSize();
    doc.setFontSize(tamanhoFonte);
    larguraTotal += espacamentoExtra + doc.getTextWidth(segmento.texto);
    doc.setFontSize(tamanhoAnterior);
    
    if (segmento.tipo === 'subscrito' && i < segmentos.length - 1 && segmentos[i + 1].tipo === 'texto') {
      larguraTotal += tamanhoBase * 0.15;
    }
  }
  
  return larguraTotal;
}

/**
 * Renderiza LaTeX para SVG usando KaTeX e retorna o HTML
 * @param latex - String LaTeX para renderizar
 * @param displayMode - Se true, renderiza em modo display (centralizado)
 * @returns HTML string com o SVG renderizado
 */
function renderizarLatex(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html',
      strict: false,
      trust: false,
      fleqn: false, // Não alinhar à esquerda
    });
  } catch (error) {
    console.error('Erro ao renderizar LaTeX:', error);
    return latex; // Fallback para texto simples
  }
}

/**
 * Renderiza fórmula LaTeX no PDF
 * Esta função cria um elemento temporário, renderiza o LaTeX e adiciona ao PDF
 */
async function renderizarLatexNoPDF(
  doc: jsPDF,
  latex: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 9
): Promise<number> {
  console.log('    🔄 Renderizando LaTeX:', latex.substring(0, 40));
  
  try {
    // Criar container para renderização
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.visibility = 'hidden';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';
    document.body.appendChild(container);
    
    // Criar elemento para LaTeX com tamanho maior para melhor qualidade
    const tempDiv = document.createElement('div');
    tempDiv.style.fontSize = `${fontSize * 2.5}px`; // 2.5x para qualidade sem ser gigante
    tempDiv.style.fontFamily = 'KaTeX_Main, Times New Roman, serif';
    tempDiv.style.display = 'inline-block';
    tempDiv.style.padding = '6px 8px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.color = '#000000'; // Preto puro
    tempDiv.className = 'katex-black'; // Classe para garantir preto
    container.appendChild(tempDiv);
    
    // Adicionar estilo inline para forçar cor preta em todos os elementos
    const style = document.createElement('style');
    style.textContent = `
      .katex-black,
      .katex-black * {
        color: #000000 !important;
        fill: #000000 !important;
      }
      .katex-black .katex-html {
        color: #000000 !important;
      }
      .katex-black .mord,
      .katex-black .mrel,
      .katex-black .mop,
      .katex-black .mbin,
      .katex-black .mopen,
      .katex-black .mclose,
      .katex-black .mpunct {
        color: #000000 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Renderizar LaTeX
    try {
      const html = katex.renderToString(latex, {
        displayMode: false,
        throwOnError: true,
        output: 'html',
        strict: false,
        trust: false,
        minRuleThickness: 0.06, // Linha mais grossa para melhor visualização
      });
      tempDiv.innerHTML = html;
      console.log('    ✓ LaTeX renderizado');
    } catch (katexError) {
      console.error('    ✗ Erro KaTeX:', katexError);
      document.body.removeChild(container);
      document.head.removeChild(style);
      throw katexError;
    }
    
    // Aguardar fontes e renderização
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Capturar como imagem em alta qualidade
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 3, // Boa qualidade sem exagero
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Máxima qualidade PNG
      
      // Calcular dimensões finais mantendo tamanho natural da fórmula
      // Scale ajustado para que fórmulas fiquem no tamanho correto (similar a texto 10-11pt)
      const targetScale = 11; // Converte pixels para mm (aumentado para reduzir tamanho final)
      let finalWidth = canvas.width / targetScale;
      let finalHeight = canvas.height / targetScale;
      
      // Limitar a um tamanho máximo razoável (70% da largura disponível)
      const maxFormWidth = maxWidth * 0.7;
      if (finalWidth > maxFormWidth) {
        const ratio = maxFormWidth / finalWidth;
        finalWidth = maxFormWidth;
        finalHeight = finalHeight * ratio;
      }
      
      console.log('    📐 Canvas:', canvas.width, 'x', canvas.height, '→ PDF:', finalWidth.toFixed(1), 'x', finalHeight.toFixed(1), 'mm');
      console.log('    📍 Posição no PDF: x=', x, 'y=', y);
      console.log('    🖼️  Dados da imagem:', imgData.substring(0, 50) + '...');
      
      // Adicionar imagem ao PDF
      doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
      console.log('    ✅ Imagem adicionada ao PDF!');
      
      // Limpar
      document.body.removeChild(container);
      document.head.removeChild(style);
      
      console.log('    ✓ LaTeX inserido no PDF');
      return finalHeight + 2;
    } catch (canvasError) {
      console.error('    ✗ Erro canvas:', canvasError);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      throw canvasError;
    }
  } catch (error) {
    console.error('    ✗ Erro LaTeX:', error);
    // Fallback: texto simples formatado
    doc.setFontSize(fontSize);
    doc.setFont('courier', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(latex, maxWidth);
    let currentY = y;
    lines.forEach((line: string) => {
      doc.text(line, x, currentY);
      currentY += 6;
    });
    console.log('    ⚠️ Fallback: texto simples');
    return lines.length * 6;
  }
}

/**
 * Obtém paleta de cores baseada no tema selecionado
 */
function obterPaletaCores(theme?: { color: ThemeColor; mode: ThemeMode }) {
  const themeColor = theme?.color || 'indigo';
  // Forçar sempre tema claro para PDFs
  const themeMode = 'light';
  
  // Cores primárias por tema (usando as cores mais escuras da paleta)
  const colorMap: Record<ThemeColor, { r: number; g: number; b: number }> = {
    soil: { r: 72, g: 48, b: 30 },        // Terra Natural - cor mais escura (28 60% 30%)
    blue: { r: 30, g: 58, b: 138 },       // Blue - tom mais escuro
    green: { r: 20, g: 108, b: 64 },      // Green - tom mais escuro (148 85% 25%)
    purple: { r: 91, g: 33, b: 182 },     // Purple - tom mais escuro
    pink: { r: 157, g: 23, b: 77 },       // Pink - tom mais escuro
    orange: { r: 154, g: 52, b: 18 },     // Orange - tom mais escuro
    cyan: { r: 8, g: 145, b: 178 },       // Cyan - tom mais escuro
    amber: { r: 146, g: 64, b: 14 },      // Amber - tom mais escuro (32 92% 28%)
    indigo: { r: 55, g: 48, b: 163 },     // Indigo - tom mais escuro (244 88% 30%)
    red: { r: 153, g: 27, b: 27 },        // Red - tom mais escuro (2 80% 29%)
    slate: { r: 30, g: 41, b: 59 },       // Slate - tom mais escuro (0 0% 15%)
  };
  
  const primaryColor = colorMap[themeColor];
  
  // PDFs sempre em modo claro
  return {
    // Cor primária do tema
    primary: primaryColor,
    
    // Cor mais escura para cabeçalhos (já estamos usando a cor mais escura, então mantém igual)
    primaryDark: primaryColor,
    
    // Fundo do cabeçalho principal
    headerBg: primaryColor,
    
    // Texto do cabeçalho
    headerText: { r: 255, g: 255, b: 255 },
    
    // Fundo do título do módulo
    moduleTitleBg: { r: 245, g: 245, b: 250 },
    
    // Texto do título do módulo
    moduleTitleText: primaryColor,
    
    // Fundo das seções
    sectionHeaderBg: primaryColor,
    
    // Fundo alternado dos itens
    itemBg: { r: 250, g: 250, b: 252 },
    
    // Fundo de destaque
    highlightBg: { r: 255, g: 245, b: 230 },
    
    // Texto normal
    text: { r: 0, g: 0, b: 0 },
    
    // Texto secundário
    textSecondary: { r: 100, g: 100, b: 100 },
    
    // Fundo da página
    pageBg: { r: 255, g: 255, b: 255 },
    
    // Linhas e bordas
    border: { r: 200, g: 200, b: 200 },
  };
}

/**
 * Exporta para PDF e retorna como Blob ou salva diretamente
 * @param data - Dados para exportação
 * @param returnBlob - Se true, retorna Blob; se false, salva direto e retorna boolean
 */
export async function exportToPDF(data: ExportData, returnBlob: boolean = false): Promise<boolean | Blob> {
  try {
    // Configurações de impressão com valores padrão
    const printSettings = data.printSettings || {};
    const orientation = printSettings.pageOrientation || 'portrait';
    const format = printSettings.paperSize || 'A4';
    const includeLogo = printSettings.includeLogo !== false; // padrão true
    const includeDate = printSettings.includeDate !== false; // padrão true
    const marginsType = printSettings.pageMargins || 'normal';
    const allowCustomTitle = printSettings.includeCustomTitle === true;
    
    // Definir margens baseado na configuração
    // narrow = 1.27cm = 12.7mm, normal = 2.0cm = 20mm, wide = 2.54cm = 25.4mm
    const marginValues = {
      narrow: 12.7,
      normal: 20,
      wide: 25.4
    };
    const margin = marginValues[marginsType];
    
    const doc = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: format === 'Letter' ? 'letter' : 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });
    
    // Usar helvetica que é mais confiável
    doc.setFont('helvetica');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = margin;

    // Obter tema correto (dinâmico ou fixo) baseado nas configurações
    const themeToUse = getPDFTheme(data.theme, data.printSettings);
    
    // Obter paleta de cores baseada no tema
    const colors = obterPaletaCores(themeToUse);

    // Cabeçalho com fundo colorido (tema) - sempre incluir
    doc.setFillColor(colors.headerBg.r, colors.headerBg.g, colors.headerBg.b);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Nome EduSolo - condicional
    if (includeLogo) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('EduSolo', margin, yPosition + 5);
      
      // Subtítulo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Análise Geotécnica', margin, yPosition + 12);

      // Título personalizado (abaixo da logo), se habilitado
      let effectiveCustomTitle = '';
      if (allowCustomTitle) {
        // Preferir o customTitle recebido; caso contrário, usar o último salvo
        effectiveCustomTitle = (data.customTitle || '').trim() || (localStorage.getItem('edusolo_last_custom_report_title') || '').trim();
      }
      if (effectiveCustomTitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
        doc.text(effectiveCustomTitle, margin, yPosition + 20);
      }
    }
    
    // Data - condicional
    if (includeDate) {
      const currentDate = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text(currentDate, pageWidth - margin, yPosition + 8, { align: 'right' });
    }
    
    // Resetar cor do texto
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    yPosition = 45;

    // Título do módulo com fundo
    doc.setFillColor(colors.moduleTitleBg.r, colors.moduleTitleBg.g, colors.moduleTitleBg.b);
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.moduleTitleText.r, colors.moduleTitleText.g, colors.moduleTitleText.b);
    doc.text(data.moduleTitle, margin + 5, yPosition + 3);
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    yPosition += 16;

    // Seção de Dados de Entrada
    if (data.inputs.length > 0) {
      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('DADOS DE ENTRADA', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      for (const input of data.inputs) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
        
        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, input.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        renderizarTextoMatematico(doc, input.value, margin + 90, yPosition, 10);
        
        yPosition += 7;
      }
      yPosition += 3;
    }

    // Seção de Resultados
    if (data.results.length > 0) {
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('RESULTADOS', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const result of data.results) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(result.value, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');

        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, result.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        
        if (numLines === 1) {
          renderizarTextoMatematico(doc, result.value, margin + 90, yPosition, 10);
        } else {
          // Para textos com quebra de linha, renderizar linha por linha
          let currentY = yPosition;
          for (const linha of valueLines) {
            renderizarTextoMatematico(doc, linha, margin + 90, currentY, 10);
            currentY += lineHeight;
          }
        }
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        
        yPosition += totalHeight;
      }
      yPosition += 3;
    }

    // Seção de Resumo da Análise
    if (data.summary && data.summary.length > 0) {
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('RESUMO DA ANÁLISE', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      
      for (const item of data.summary) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Calcular altura necessária para textos longos
        const maxWidth = pageWidth - margin - 95;
        const valueLines = doc.splitTextToSize(item.value, maxWidth);
        const numLines = valueLines.length;
        const lineHeight = 7;
        const totalHeight = numLines * lineHeight;

        // Verificar se precisa de nova página
        if (yPosition + totalHeight > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Fundo alternado
        doc.setFillColor(colors.itemBg.r, colors.itemBg.g, colors.itemBg.b);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, totalHeight + 2, 'F');

        // Renderizar label com símbolos matemáticos
        doc.setFont('helvetica', 'normal');
        const labelPosX = renderizarTextoMatematico(doc, item.label, margin + 5, yPosition, 10);
        doc.setFontSize(10);
        doc.text(':', labelPosX, yPosition);
        
        // Renderizar valor com símbolos matemáticos
        doc.setFont('helvetica', 'bold');
        if (numLines === 1) {
          renderizarTextoMatematico(doc, item.value, margin + 90, yPosition, 10);
        } else {
          // Para textos com quebra de linha, renderizar linha por linha
          let currentY = yPosition;
          for (const linha of valueLines) {
            renderizarTextoMatematico(doc, linha, margin + 90, currentY, 10);
            currentY += lineHeight;
          }
        }
        
        yPosition += totalHeight;
      }
      yPosition += 3;
    }

    // Seção de Fórmulas (se includeFormulas estiver ativo)
    if (printSettings.includeFormulas && data.formulas && data.formulas.length > 0) {
      console.log('📐 Renderizando fórmulas:', data.formulas.length, 'fórmulas');
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da seção
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('FÓRMULAS UTILIZADAS', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;

      doc.setFontSize(10);
      
      // Processar cada fórmula sequencialmente
      for (let i = 0; i < data.formulas.length; i++) {
        const item = data.formulas[i];
        console.log(`Processando fórmula ${i + 1}/${data.formulas.length}: ${item.label}, LaTeX: ${item.latex}`);
        
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const maxWidth = pageWidth - 2 * margin - 20;
        
        // Renderizar label primeiro (sem fundo fixo)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b);
        renderizarTextoMatematico(doc, item.label, margin + 5, yPosition, 10);
        yPosition += 7;

        // Renderizar fórmula - LaTeX ou texto simples
        if (item.latex) {
          // Usar LaTeX para renderização profissional
          console.log('  → Usando LaTeX:', item.formula.substring(0, 50) + '...');
          try {
            const alturaFormula = await renderizarLatexNoPDF(
              doc,
              item.formula,
              margin + 10,
              yPosition,
              maxWidth - 10,
              10
            );
            console.log('  ✓ LaTeX renderizado, altura:', alturaFormula);
            yPosition += alturaFormula;
          } catch (error) {
            console.error('  ✗ Erro ao renderizar LaTeX:', error);
            // Fallback para texto simples
            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
            const formulaLines = doc.splitTextToSize(item.formula, maxWidth);
            for (const linha of formulaLines) {
              renderizarTextoMatematico(doc, linha, margin + 10, yPosition, 9);
              yPosition += 6;
            }
            console.log('  → Fallback: texto simples usado');
          }
        } else {
          // Renderização tradicional com símbolos Unicode
          console.log('  → Usando Unicode');
          doc.setFont('courier', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
          const formulaLines = doc.splitTextToSize(item.formula, maxWidth);
          for (const linha of formulaLines) {
            renderizarTextoMatematico(doc, linha, margin + 10, yPosition, 9);
            yPosition += 6;
          }
        }

        // Descrição (se houver)
        if (item.description) {
          yPosition += 2;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(colors.textSecondary.r, colors.textSecondary.g, colors.textSecondary.b);
          const descLines = doc.splitTextToSize(item.description, maxWidth);
          for (const linha of descLines) {
            doc.text(linha, margin + 10, yPosition);
            yPosition += 5;
          }
        }

        yPosition += 5;
      }
      yPosition += 3;
      console.log('✓ Todas as fórmulas processadas');
    }

    // Adicionar tabelas se disponíveis (ANTES do gráfico)
    if (data.tables && data.tables.length > 0) {
      console.log(`Processando ${data.tables.length} tabelas...`);
      
      for (const table of data.tables) {
        console.log(`Tabela: ${table.title}, Headers: ${table.headers.length}, Rows: ${table.rows.length}`);
        
        yPosition += 5;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Cabeçalho da tabela
        doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
        doc.text(table.title.toUpperCase(), margin + 3, yPosition + 5.5);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        yPosition += 10;

        // Headers e linhas mantêm símbolos Unicode
        const headersFormatados = table.headers;
        const rowsFormatadas = table.rows;

        // Usar autoTable para criar a tabela
        try {
          autoTable(doc, {
            startY: yPosition,
            head: [headersFormatados],
            body: rowsFormatadas,
            theme: 'grid',
            headStyles: {
              fillColor: [colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b],
              textColor: [colors.headerText.r, colors.headerText.g, colors.headerText.b],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
              lineWidth: 0.1,
              lineColor: [colors.primary.r, colors.primary.g, colors.primary.b]
            },
            bodyStyles: {
              fontSize: 8,
              lineWidth: 0.1,
              lineColor: [colors.border.r, colors.border.g, colors.border.b],
              textColor: [colors.text.r, colors.text.g, colors.text.b],
            },
            alternateRowStyles: {
              fillColor: [248, 248, 252]
            },
            margin: { left: margin, right: margin },
          });

          // @ts-ignore - lastAutoTable é adicionado pelo plugin
          yPosition = doc.lastAutoTable.finalY + 8;
          console.log(`Tabela ${table.title} adicionada com sucesso`);
        } catch (tableError) {
          console.error(`Erro ao adicionar tabela ${table.title}:`, tableError);
          // Se falhar, continuar sem a tabela
          yPosition += 10;
        }
      }
    } else {
      console.log("Nenhuma tabela para adicionar ao PDF");
    }

    // Adicionar gráfico se disponível (DEPOIS das tabelas - última coisa)
    if (data.chartImage) {
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 110; // Altura maior para o gráfico ampliado
      const titleHeight = 10;
      const totalHeight = imgHeight + titleHeight + 20; // Total com margens
      
      yPosition += 5;
      
      // Só criar nova página se não houver espaço suficiente
      if (yPosition + totalHeight > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho do gráfico
      doc.setFillColor(colors.sectionHeaderBg.r, colors.sectionHeaderBg.g, colors.sectionHeaderBg.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.headerText.r, colors.headerText.g, colors.headerText.b);
      doc.text('GRÁFICO', margin + 3, yPosition + 5.5);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPosition += 12;
      
      // Borda ao redor do gráfico
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, imgWidth, imgHeight);
      
      doc.addImage(data.chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    }

    // Rodapé em todas as páginas
    // @ts-ignore - método existe em runtime
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      

      const footerY = pageHeight - 12;
      
      // Linha superior do rodapé
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textSecondary.r, colors.textSecondary.g, colors.textSecondary.b);
      doc.text(
        'Gerado por EduSolo - Sistema de Análise Geotécnica',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.text(
        `${i} / ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }

    // Salvar PDF com nome customizado ou padrão
    let fileName: string;
    if (data.customFileName) {
      // Remove extensão .pdf se já estiver presente
      fileName = data.customFileName.endsWith('.pdf') 
        ? data.customFileName 
        : `${data.customFileName}.pdf`;
    } else {
      // Nome padrão: [Módulo] - EduSolo - [Data]
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '-');
      fileName = `${data.moduleTitle} - EduSolo - ${dateStr}.pdf`;
    }
    
    // Se solicitado, retornar Blob; caso contrário, salvar direto
    if (returnBlob) {
      const blob = doc.output('blob') as Blob;
      return blob;
    } else {
      doc.save(fileName);
      return true;
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return false;
  }
}

/**
 * Cria uma URL de Blob para um Blob de PDF
 * Esta URL pode ser usada para visualizar ou baixar o PDF
 */
export function createPDFBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function formatNumberForExport(value: number | null | undefined, precision: number = 2): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(precision);
}

export function formatPercentageForExport(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Gera nome padrão para arquivo PDF no formato: [Nome do Módulo] - EduSolo - [Data]
 * @param moduleTitle - Nome do módulo (ex: "Índices Físicos", "Granulometria")
 * @returns Nome do arquivo formatado (ex: "Índices Físicos - EduSolo - 25/10/25")
 */
export function generateDefaultPDFFileName(moduleTitle: string): string {
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '/');
  
  return `${moduleTitle} - EduSolo - ${dateStr}`;
}

export async function captureChartAsImage(elementId: string): Promise<string | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return null;

    // Dinamicamente importar html2canvas apenas quando necessário
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    return null;
  }
}

export async function exportToExcel(data: ExcelExportData): Promise<boolean> {
  try {
    // Dinamicamente importar xlsx apenas quando necessário
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();
    
    // Adicionar sheets de dados
    data.sheets.forEach((sheet, index) => {
      const wsData: any[][] = [];
      
      // Cabeçalho
      wsData.push([data.moduleTitle]);
      wsData.push([]);
      wsData.push([sheet.name]);
      wsData.push([]);
      
      // Dados
      sheet.data.forEach(item => {
        wsData.push([item.label, item.value]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Estilizar a primeira linha
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name.substring(0, 31));
    });
    
    // Adicionar tabelas se existirem
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach((table, index) => {
        const wsData: any[][] = [];
        
        // Título da tabela
        wsData.push([table.title]);
        wsData.push([]);
        
        // Headers
        wsData.push(table.headers);
        
        // Rows
        table.rows.forEach(row => {
          wsData.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Ajustar largura das colunas
        const colWidths = table.headers.map(() => ({ wch: 15 }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(
          workbook, 
          ws, 
          table.title.substring(0, 31)
        );
      });
    }
    
    // Salvar arquivo
    const fileName = `${data.moduleName}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    return false;
  }
}

