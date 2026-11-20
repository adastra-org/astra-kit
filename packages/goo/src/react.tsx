import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  GooEngine,
  type BlobState,
  type BlobTarget,
  type GooSettings,
} from './engine'

const Ctx = createContext<GooEngine | null>(null)

const reducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/** El motor del `<Goo>` más cercano. */
export function useGooEngine(): GooEngine {
  const e = use(Ctx)
  if (!e) throw new Error('useGooEngine: falta un <Goo> arriba')
  return e
}

export type GooProps = Partial<GooSettings> & {
  /** Color de la unión. Un rol del DS, p. ej. `var(--surface-raised)`. */
  fill?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Capa goo: un solo `<svg>` con un solo `<path>` (la unión de todas las pills y puentes) detrás del contenido. El `d` se
 * escribe por ref en cada frame: React no re-renderiza durante la animación. Con reduced motion salta al objetivo.
 */
export function Goo({
  fill = 'var(--surface-raised)',
  className,
  style,
  children,
  ...settings
}: GooProps) {
  const [engine] = useState(() => new GooEngine())
  const path = useRef<SVGPathElement>(null)
  const { stiffness, damping, mass, neck, reach, instant, anticipation, arc } =
    settings

  useLayoutEffect(() => {
    engine.configure({
      stiffness,
      damping,
      mass,
      neck,
      reach,
      anticipation,
      arc,
      instant: instant ?? reducedMotion(),
    })
  }, [
    engine,
    stiffness,
    damping,
    mass,
    neck,
    reach,
    instant,
    anticipation,
    arc,
  ])

  useLayoutEffect(
    () =>
      engine.subscribe((f) => {
        path.current?.setAttribute('d', f.d)
      }),
    [engine],
  )
  useEffect(() => () => engine.stop(), [engine])

  return (
    <Ctx value={engine}>
      <div
        data-adastra="Goo"
        className={className}
        // Números tabulares en todo el HUD: los valores cambian y no deben mover lo que los rodea.
        style={{
          position: 'relative',
          fontVariantNumeric: 'tabular-nums',
          ...style,
        }}
      >
        <svg
          aria-hidden
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <path ref={path} fill={fill} />
        </svg>
        {children}
      </div>
    </Ctx>
  )
}

export type GooBlobProps = BlobTarget & {
  className?: string
  /** Contenido de la pill. Se recorta a la forma actual (radio = alto / 2), así se revela al estirarse. */
  children?: ReactNode
  /** Etiqueta accesible si el contenido es solo visual. */
  label?: string
}

/**
 * Una pill dentro de `<Goo>`. Declara su caja objetivo; el motor la anima y el contenido sigue a la forma por ref
 * (transform + tamaño), recortado. Al desmontarse, la forma se encoge hasta su centro.
 */
export function GooBlob({
  id,
  x,
  y,
  w,
  h,
  group,
  spring,
  stiffness,
  from,
  anticipation,
  arc,
  className,
  children,
  label,
}: GooBlobProps) {
  const engine = useGooEngine()
  const el = useRef<HTMLDivElement>(null)
  const fromRef = useRef(from)
  // Un objeto literal cambia de identidad en cada render: el efecto depende de su contenido.
  const springKey = typeof spring === 'object' ? JSON.stringify(spring) : spring

  useLayoutEffect(() => {
    engine.upsert({
      id,
      x,
      y,
      w,
      h,
      group,
      spring: typeof spring === 'object' ? { ...spring } : spring,
      stiffness,
      anticipation,
      arc,
      from: fromRef.current,
    })
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `spring` entra por `springKey`
  }, [engine, id, x, y, w, h, group, springKey, stiffness, anticipation, arc])

  useLayoutEffect(() => () => engine.remove(id), [engine, id])

  useLayoutEffect(
    () =>
      engine.subscribe((f) => {
        const s = f.blobs.get(id)
        if (el.current && s) place(el.current, s)
      }),
    [engine, id],
  )

  return (
    <div
      ref={el}
      data-goo={id}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={className}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'hidden',
        width: 0,
        height: 0,
      }}
    >
      {children}
    </div>
  )
}

function place(node: HTMLElement, s: BlobState) {
  node.style.transform = `translate(${s.x}px, ${s.y}px)`
  node.style.width = `${s.w}px`
  node.style.height = `${s.h}px`
  node.style.borderRadius = `${Math.min(s.w, s.h) / 2}px`
}
