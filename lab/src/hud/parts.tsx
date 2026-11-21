import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { PRESETS } from '@adastrarp/goo'
import { toneOf, type Tone } from './tone'

const stroke = {
  accent: 'stroke-accent',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
} as const
const text = {
  accent: 'text-ink',
  warning: 'text-warning',
  danger: 'text-danger',
} as const

/** Anillo de progreso. El valor se mueve con un spring (física), no con una transición CSS. */
export function Ring({
  size,
  width,
  value,
  tone,
  initial,
}: {
  size: number
  width: number
  value: number
  tone: Tone
  /** Valor con el que arranca el spring (p. ej. 0 para que el borde se dibuje al aparecer). Default: `value`. */
  initial?: number
}) {
  const r = (size - width) / 2
  const c = 2 * Math.PI * r
  const v = useSpring(initial ?? value, { stiffness: 220, damping: 26 })
  useEffect(() => v.set(value), [v, value])
  const offset = useTransformOffset(v, c)
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={width}
        className="stroke-border"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={c}
        style={{ strokeDashoffset: offset }}
        className={stroke[tone]}
      />
    </svg>
  )
}

function useTransformOffset(v: MotionValue<number>, c: number) {
  return useTransform(v, (x) => c * (1 - Math.min(1, Math.max(0, x))))
}

// Armado de una alerta en 3 fases: el orbe nace (goo), después el ícono y por último el borde se dibuja.
const ICON_AT = 300
const RING_AT = 500

/** Contenido de una pill de estado: cabeza (anillo + ícono) y cuerpo (etiqueta + valor). Ancho fijo; el goo lo revela. */
export function StatContent({
  icon,
  label,
  value,
  size = 40,
  bodyWidth = 96,
}: {
  icon: ReactNode
  label: string
  value: number
  size?: number
  bodyWidth?: number
}) {
  const tone = toneOf(value)
  return (
    <div
      className="flex items-center"
      style={{ width: size + bodyWidth, height: size }}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Ring size={size} width={3} value={value / 100} tone={tone} />
        <span
          className={`absolute inset-0 grid place-items-center ${text[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-col pl-2">
        <span className="text-eyebrow text-ink-muted!">{label}</span>
        <span className={`text-data ${text[tone]}`}>{Math.round(value)} %</span>
      </div>
    </div>
  )
}

/**
 * Cabeza con un número grande (velocímetro). El cuerpo se calcula para el peor caso (3 cifras en Unbounded, que es
 * ancha): ~0.27 del diámetro, así queda aire de sobra contra el anillo y el tamaño no salta entre 99 y 100.
 */
export function ValueContent({
  size,
  value,
  unit,
  ring,
}: {
  size: number
  value: number
  unit: string
  ring: number
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Ring size={size} width={4} value={ring} tone="accent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span
          className="text-ink tabular-nums"
          style={{
            font: `700 ${Math.round(size * 0.27)}px/1 var(--font-heading)`,
          }}
        >
          {Math.round(value)}
        </span>
        <span className="text-eyebrow text-ink-muted!">{unit}</span>
      </div>
    </div>
  )
}

/** Orbe de alerta: solo ícono, color de estado. Se arma en 3 fases (orbe, ícono, borde) para no verse roto al nacer. */
export function AlertContent({
  icon,
  tone,
  size = 40,
}: {
  icon: ReactNode
  tone: Tone
  size?: number
}) {
  const reduce = useReducedMotion()
  const [ring, setRing] = useState(Boolean(reduce))
  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setRing(true), RING_AT)
    return () => clearTimeout(t)
  }, [reduce])
  return (
    <div
      className={`relative grid place-items-center ${text[tone]}`}
      style={{ width: size, height: size }}
    >
      {ring && (
        <Ring
          size={size}
          width={3}
          value={1}
          initial={reduce ? 1 : 0}
          tone={tone}
        />
      )}
      <motion.span
        className="grid place-items-center"
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          ...PRESETS.gentle,
          delay: ICON_AT / 1000,
        }}
      >
        {icon}
      </motion.span>
    </div>
  )
}

/** Pill de texto (calle, altitud). */
export function TextContent({
  width,
  height = 40,
  children,
}: {
  width: number
  height?: number
  children: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 text-body-sm text-ink"
      style={{ width, height }}
    >
      {children}
    </div>
  )
}
