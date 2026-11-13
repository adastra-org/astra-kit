import { useEffect } from 'react'
import { fetchNui } from './fetch'

/** Callback Lua que aplica el blur del mundo. Ver el snippet del README. */
export const SCREEN_BLUR_EVENT = 'adastra:screenblur'

/**
 * Pide a Lua el blur del juego (`TriggerScreenblurFadeIn(ms)` / `TriggerScreenblurFadeOut(ms)`).
 * `backdrop-filter` no puede difuminar el mundo (no está en el DOM): lo hace el motor desde Lua.
 * Firma verificada en los natives de GTA: `BOOL TRIGGER_SCREENBLUR_FADE_IN(float transitionTime)`, tiempo en ms.
 */
export function requestScreenBlur(enabled: boolean, ms = 250): Promise<void> {
  return fetchNui(SCREEN_BLUR_EVENT, { enabled, ms }).then(() => undefined)
}

/**
 * Blur del mundo mientras `active`. Solo habla con Lua al cambiar `active` (y a `false` al desmontar):
 * nada en loop. Úsalo en menús modales; no en HUD.
 */
export function useScreenBlur(active: boolean, ms = 250): void {
  useEffect(() => {
    if (!active) return
    const report = (error: unknown) =>
      console.error('[nui] screenblur falló', error)
    requestScreenBlur(true, ms).catch(report)
    return () => {
      requestScreenBlur(false, ms).catch(report)
    }
  }, [active, ms])
}
