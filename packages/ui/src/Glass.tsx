import { useId, type CSSProperties, type HTMLAttributes, type Ref } from 'react'
import { cx } from './cx'

/**
 * - `fake` (default): sin blur. Tinte alto de la superficie + brillo interno + borde en gradiente + ruido. Casi gratis.
 * - `backdrop`: `backdrop-filter` real. Solo tiene sentido si detrás hay DOM (teléfono con wallpaper, lab).
 *
 * Por qué fake es el default: la NUI es CEF transparente compuesto ENCIMA del frame del juego; el juego no está en el DOM,
 * así que `backdrop-filter` nunca difumina el mundo. Para el blur del mundo, `useScreenBlur` de `@adastra/nui`.
 */
export type GlassMode = 'fake' | 'backdrop'

type GlassBase = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: React.ReactNode
  ref?: Ref<HTMLDivElement>
  /** Fuerza la versión sólida (sin transparencia, ruido ni blur). Igual que `data-glass="solid"` en `<html>`. */
  solid?: boolean
}

export type GlassProps = GlassBase &
  (
    | { mode?: 'fake'; refraction?: never }
    | {
        mode: 'backdrop'
        /**
         * Refracción por SVG `feDisplacementMap` sobre lo que hay detrás. `true` = 14 px de desplazamiento, o un número
         * (0–40). Solo en `backdrop` y solo Chromium; en fake no existe.
         */
        refraction?: boolean | number
      }
  )

const DEFAULT_SCALE = 14

function scaleOf(refraction: boolean | number | undefined): number {
  if (!refraction) return 0
  const n = refraction === true ? DEFAULT_SCALE : refraction
  return Math.min(40, Math.max(0, n))
}

/** Superficie translúcida opt-in. El texto encima pasa AA en el peor caso (ver `@adastra/tokens` `glass.css`). */
export function Glass({
  mode = 'fake',
  refraction,
  solid = false,
  className,
  style,
  children,
  ...rest
}: GlassProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const scale = mode === 'backdrop' ? scaleOf(refraction) : 0
  const filterId = `adastra-refract-${uid}`

  const merged: CSSProperties | undefined =
    scale > 0
      ? ({ ...style, '--glass-refract': `url(#${filterId})` } as CSSProperties)
      : style

  return (
    <div
      data-adastra="Glass"
      data-mode={mode}
      data-solid={solid || undefined}
      className={cx('ad-glass', className)}
      style={merged}
      {...rest}
    >
      {scale > 0 && (
        <svg
          aria-hidden
          focusable="false"
          width="0"
          height="0"
          style={{ position: 'absolute' }}
        >
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="2"
              seed="7"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
      {children}
    </div>
  )
}
