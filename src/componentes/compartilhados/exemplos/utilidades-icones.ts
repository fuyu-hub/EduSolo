import {
  Droplets, Mountain, Leaf, FlaskConical, Beaker, Layers, Globe, Waves, Gem,
  TestTubes, Hammer, Compass, Microscope, BookMarked, type LucideIcon
} from "lucide-react";

export const ICON_OPTIONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "droplets", icon: Droplets, label: "Água" },
  { key: "mountain", icon: Mountain, label: "Terreno" },
  { key: "leaf", icon: Leaf, label: "Orgânico" },
  { key: "flask", icon: FlaskConical, label: "Frasco" },
  { key: "beaker", icon: Beaker, label: "Béquer" },
  { key: "layers", icon: Layers, label: "Camadas" },
  { key: "globe", icon: Globe, label: "Terra" },
  { key: "waves", icon: Waves, label: "Ondas" },
  { key: "gem", icon: Gem, label: "Mineral" },
  { key: "testtubes", icon: TestTubes, label: "Tubos" },
  { key: "hammer", icon: Hammer, label: "Martelo" },
  { key: "compass", icon: Compass, label: "Bússola" },
  { key: "microscope", icon: Microscope, label: "Microscópio" },
  { key: "bookmark", icon: BookMarked, label: "Marcador" },
];

export const COLOR_OPTIONS: { key: string; label: string; bg: string; text: string; border: string; gradient: string; hoverBorder: string; glow: string }[] = [
  { key: "blue", label: "Azul", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20", gradient: "from-blue-500/20 to-blue-600/5", hoverBorder: "hover:border-blue-500/40", glow: "group-hover:shadow-blue-500/10" },
  { key: "amber", label: "Âmbar", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20", gradient: "from-amber-500/20 to-amber-600/5", hoverBorder: "hover:border-amber-500/40", glow: "group-hover:shadow-amber-500/10" },
  { key: "emerald", label: "Verde", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20", gradient: "from-emerald-500/20 to-emerald-600/5", hoverBorder: "hover:border-emerald-500/40", glow: "group-hover:shadow-emerald-500/10" },
  { key: "rose", label: "Rosa", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20", gradient: "from-rose-500/20 to-rose-600/5", hoverBorder: "hover:border-rose-500/40", glow: "group-hover:shadow-rose-500/10" },
  { key: "violet", label: "Violeta", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500/20", gradient: "from-violet-500/20 to-violet-600/5", hoverBorder: "hover:border-violet-500/40", glow: "group-hover:shadow-violet-500/10" },
  { key: "cyan", label: "Ciano", bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500/20", gradient: "from-cyan-500/20 to-cyan-600/5", hoverBorder: "hover:border-cyan-500/40", glow: "group-hover:shadow-cyan-500/10" },
  { key: "orange", label: "Laranja", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/20", gradient: "from-orange-500/20 to-orange-600/5", hoverBorder: "hover:border-orange-500/40", glow: "group-hover:shadow-orange-500/10" },
  { key: "indigo", label: "Índigo", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500/20", gradient: "from-indigo-500/20 to-indigo-600/5", hoverBorder: "hover:border-indigo-500/40", glow: "group-hover:shadow-indigo-500/10" },
];

export function getIconComponent(iconName?: string): LucideIcon {
  return ICON_OPTIONS.find(o => o.key === iconName)?.icon || Hammer;
}

export function getColorTheme(colorName?: string) {
  return COLOR_OPTIONS.find(o => o.key === colorName) || COLOR_OPTIONS[0];
}

// Built-in themes (fixed for built-in examples)
export const builtInThemes = [
  { iconKey: "layers", colorKey: "amber" },
  { iconKey: "mountain", colorKey: "emerald" },
  { iconKey: "waves", colorKey: "cyan" },
  { iconKey: "flask", colorKey: "blue" },
  { iconKey: "leaf", colorKey: "rose" },
];
