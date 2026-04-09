export const HACHURAS_OPCOES = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "argila", label: "Argila" },
  { value: "silte", label: "Silte" },
  { value: "areia", label: "Areia" },
  { value: "areia-siltosa", label: "Areia Siltosa" },
  { value: "areia-argilosa", label: "Areia Argilosa" },
  { value: "silte-argiloso", label: "Silte Argiloso" },
  { value: "areia-siltoargilosa", label: "Areia Siltoargilosa" },
];

export function HachurasDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none">
      <defs>
        {/* Argila: Linhas diagonais mais esparsas e sólidas (Ângulo invertido) */}
        <pattern id="hachura-argila" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="30" stroke="#000" strokeWidth="1.5" />
        </pattern>

        {/* Silte (Grid sem aleatoriedade, símbolo '=' fixo, espessura e raio refinados mais finos) */}
        <pattern id="hachura-silte" width="30" height="30" patternUnits="userSpaceOnUse">
          <line x1="8" y1="12" x2="22" y2="12" stroke="#000" strokeWidth="1" />
          <line x1="8" y1="18" x2="22" y2="18" stroke="#000" strokeWidth="1" />
        </pattern>

        {/* Areia (Alta densidade, aleatoriedade 100% e espessura/raio bem menor) */}
        <pattern id="hachura-areia" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="0.8" fill="#000" />
          <circle cx="20" cy="8" r="0.6" fill="#000" />
          <circle cx="8" cy="18" r="0.5" fill="#000" />
          <circle cx="25" cy="22" r="0.8" fill="#000" />
          <circle cx="12" cy="27" r="0.6" fill="#000" />
          <circle cx="27" cy="12" r="0.5" fill="#000" />
          <circle cx="2" cy="25" r="0.8" fill="#000" />
          <circle cx="15" cy="15" r="0.5" fill="#000" />
          <circle cx="22" cy="2" r="0.8" fill="#000" />
          <circle cx="2" cy="15" r="0.6" fill="#000" />
        </pattern>

        {/* Solo Impermeável: Hachura cruzada ou padrão massivo */}
        <pattern id="hachura-impermeavel" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="20" stroke="#000" strokeWidth="2" opacity="0.8" />
          <line x1="0" y1="0" x2="20" y2="0" stroke="#000" strokeWidth="2" opacity="0.8" />
        </pattern>

      </defs>
    </svg>
  );
}

export function inferirHachura(nomeDaCamada: string, isImpermeavel: boolean = false): string {
  if (isImpermeavel) return "impermeavel";
  
  const nomeLower = nomeDaCamada.toLowerCase();
  
  if (nomeLower.includes("areia") && nomeLower.includes("silt") && nomeLower.includes("argil")) {
    return "areia-siltoargilosa";
  }
  if (nomeLower.includes("areia") && nomeLower.includes("silt")) {
    return "areia-siltosa";
  }
  if (nomeLower.includes("areia") && nomeLower.includes("argil")) {
    return "areia-argilosa";
  }
  if (nomeLower.includes("silt") && nomeLower.includes("argil")) {
    return "silte-argiloso";
  }
  if (nomeLower.includes("areia")) {
    return "areia";
  }
  if (nomeLower.includes("argila")) {
    return "argila";
  }
  if (nomeLower.includes("silt")) {
    return "silte";
  }
  
  return "nenhuma";
}

export function RenderHachura({ hachura }: { hachura?: string | null }) {
  if (!hachura || hachura === "nenhuma") return null;

  const camadasRender = [];
  const hachuraStr = hachura.toLowerCase();

  if (hachuraStr.includes("argila") || hachuraStr.includes("argilos") || hachuraStr.includes("argiloso") || hachuraStr.includes("argilosa")) camadasRender.push("argila");
  if (hachuraStr.includes("silte") || hachuraStr.includes("siltos") || hachuraStr.includes("siltoso") || hachuraStr.includes("siltosa") || hachuraStr.includes("silto")) camadasRender.push("silte");
  if (hachuraStr.includes("areia") || hachuraStr.includes("arenos") || hachuraStr.includes("arenoso") || hachuraStr.includes("arenosa") || hachuraStr.includes("areno")) camadasRender.push("areia");
  if (hachuraStr === "impermeavel") camadasRender.push("impermeavel");

  if (camadasRender.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {camadasRender.map((tipo) => (
        <rect key={tipo} width="100%" height="100%" fill={`url(#hachura-${tipo})`} />
      ))}
    </svg>
  );
}
