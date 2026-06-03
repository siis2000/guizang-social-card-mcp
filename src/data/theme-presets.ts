import type { VisualSystem } from "./layout-recipes.js";

export interface ThemePreset {
  id: string;
  name: string;
  system: VisualSystem;
  colors: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "ink-classic", name: "Ink Classic", system: "editorial", colors: { "--paper": "#f3f0e8", "--paper-2": "#ebe6da", "--ink": "#0a0a0b", "--muted": "#68625a", "--line": "rgba(10,10,11,.22)", "--accent": "#111111", "--accent-soft": "#d8d2c6" } },
  { id: "indigo-porcelain", name: "Indigo Porcelain", system: "editorial", colors: { "--paper": "#f2f4f5", "--paper-2": "#e5ebef", "--ink": "#0a1f3d", "--muted": "#5f6d78", "--line": "rgba(10,31,61,.20)", "--accent": "#315d93", "--accent-soft": "#d7e1ec" } },
  { id: "forest-ink", name: "Forest Ink", system: "editorial", colors: { "--paper": "#f5f1e8", "--paper-2": "#e8dfcf", "--ink": "#16251b", "--muted": "#5d665d", "--line": "rgba(22,37,27,.22)", "--accent": "#2e6b4f", "--accent-soft": "#d4dfd2" } },
  { id: "kraft-paper", name: "Kraft Paper", system: "editorial", colors: { "--paper": "#eedfc7", "--paper-2": "#dfc9a8", "--ink": "#2a1e13", "--muted": "#755f49", "--line": "rgba(42,30,19,.24)", "--accent": "#9b5a2e", "--accent-soft": "#d5b58f" } },
  { id: "dune", name: "Dune", system: "editorial", colors: { "--paper": "#f0e6d2", "--paper-2": "#ded0b7", "--ink": "#1f1a14", "--muted": "#6f6557", "--line": "rgba(31,26,20,.22)", "--accent": "#8f7650", "--accent-soft": "#d4c2a4" } },
  { id: "midnight-ink", name: "Midnight Ink", system: "editorial", colors: { "--paper": "#0e0d0c", "--paper-2": "#1a1714", "--ink": "#ece2cf", "--muted": "#9a8c75", "--line": "rgba(236,226,207,.22)", "--accent": "#d4a04a", "--accent-soft": "#3a2a14" } },
  { id: "ikb-blue", name: "IKB Blue", system: "swiss", colors: { "--paper": "#fafaf8", "--ink": "#0a0a0a", "--grey-1": "#f0f0ee", "--grey-2": "#d4d4d2", "--grey-3": "#737373", "--accent": "#002FA7", "--accent-on": "#ffffff" } },
  { id: "lemon-yellow", name: "Lemon Yellow", system: "swiss", colors: { "--paper": "#fafaf8", "--ink": "#0a0a0a", "--grey-1": "#f0f0ee", "--grey-2": "#d4d4d2", "--grey-3": "#737373", "--accent": "#FFD500", "--accent-on": "#0a0a0a" } },
  { id: "lemon-green", name: "Lemon Green", system: "swiss", colors: { "--paper": "#fafaf8", "--ink": "#0a0a0a", "--grey-1": "#f0f0ee", "--grey-2": "#d4d4d2", "--grey-3": "#737373", "--accent": "#C5E803", "--accent-on": "#0a0a0a" } },
  { id: "safety-orange", name: "Safety Orange", system: "swiss", colors: { "--paper": "#fafaf8", "--ink": "#0a0a0a", "--grey-1": "#f0f0ee", "--grey-2": "#d4d4d2", "--grey-3": "#737373", "--accent": "#FF6B35", "--accent-on": "#ffffff" } },
  { id: "vermilion-ink", name: "Vermilion Ink", system: "neochinese", colors: { "--neo-paper": "#f5efe0", "--neo-ink": "#1a1a1a", "--neo-accent": "#c23b22", "--neo-gold": "#b8963e" } },
  { id: "celadon", name: "Celadon", system: "neochinese", colors: { "--neo-paper": "#e8ede4", "--neo-ink": "#1e2b23", "--neo-accent": "#5b8c6f", "--neo-gold": "#8a9e6b" } },
  { id: "ochre", name: "Ochre", system: "neochinese", colors: { "--neo-paper": "#f0e4d0", "--neo-ink": "#231711", "--neo-accent": "#a0522d", "--neo-gold": "#c2984a" } },
  { id: "indigo", name: "Indigo", system: "neochinese", colors: { "--neo-paper": "#1b2440", "--neo-ink": "#f0ebe0", "--neo-accent": "#d4a94e", "--neo-gold": "#d4a94e" } },
  { id: "bamboo", name: "Bamboo", system: "neochinese", colors: { "--neo-paper": "#edf2e8", "--neo-ink": "#162318", "--neo-accent": "#4a7c59", "--neo-gold": "#7a9b5a" } },
];

export function getThemes(system?: VisualSystem): ThemePreset[] {
  if (!system) return THEME_PRESETS;
  return THEME_PRESETS.filter((t) => t.system === system);
}

export function getTheme(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.id === id);
}

export function getDefaultTheme(system: VisualSystem): ThemePreset {
  return THEME_PRESETS.find((t) => t.system === system) ?? THEME_PRESETS[0];
}