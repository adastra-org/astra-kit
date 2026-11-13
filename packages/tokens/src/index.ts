export { generateCss } from './generate'
export {
  blend,
  contrast,
  luminance,
  resolveTheme,
  type TokenFile,
} from './tokens'

/** Temas del DS. Void es el default (`:root`); Dawn va bajo `[data-theme="light"]`. */
export const THEMES = {
  dark: { name: 'Void', selector: ':root' },
  light: { name: 'Dawn', selector: '[data-theme="light"]' },
} as const

export type ThemeId = keyof typeof THEMES
