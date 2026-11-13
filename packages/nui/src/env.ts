declare global {
  interface Window {
    /** Solo existe dentro del cliente de FiveM (CEF). */
    invokeNative?: unknown
    /** Lo inyecta FiveM en la página de la NUI. */
    GetParentResourceName?: () => string
  }
}

/** `true` en un navegador normal (vite dev, lab, tests); `false` dentro del juego. */
export function isEnvBrowser(): boolean {
  return typeof window === 'undefined' || !window.invokeNative
}

/** Nombre del resource dueño de la NUI. Fuera del juego: `nui-frame-app` (el que usa FiveM por defecto en dev). */
export function getParentResourceName(): string {
  if (typeof window === 'undefined') return 'nui-frame-app'
  return window.GetParentResourceName?.() ?? 'nui-frame-app'
}
