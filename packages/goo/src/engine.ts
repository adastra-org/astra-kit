import { bridgePath, pillPath, type Box } from './geometry'
import {
  PRESETS,
  SPRING_DEFAULT,
  atRest,
  spring,
  stepSpring,
  type Spring,
  type SpringConfig,
  type SpringPreset,
} from './spring'

/** Lo que se le pide a una pill. Coordenadas en px del contenedor. */
export interface BlobTarget extends Box {
  id: string
  /** Pills del mismo grupo se conectan con puentes goo cuando se acercan. Sin grupo: nunca. */
  group?: string
  /** Spring propio: un preset del DS (`gentle` para lo que nace) o valores sueltos. Default: el del `<Goo>`. */
  spring?: SpringPreset | Partial<SpringConfig>
  /** Rigidez propia, encima de `spring` (p. ej. vecinas más lentas para que el líquido se note). */
  stiffness?: number
  /** Punto desde el que nace la pill al aparecer (p. ej. el centro de otra). Default: su propio centro. */
  from?: { x: number; y: number }
  /** Anticipación propia (ver `GooSettings.anticipation`). */
  anticipation?: number
  /** Arco propio (ver `GooSettings.arc`). */
  arc?: number
}

export interface BlobState extends Box {
  id: string
  group?: string
  /** 0 = cápsula exacta; sube con la velocidad del ancho. */
  neck: number
}

export interface GooFrame {
  blobs: ReadonlyMap<string, BlobState>
  /** Unión de todas las pills y puentes: un solo `d` para un solo `<path>`. */
  d: string
}

export interface GooSettings extends SpringConfig {
  /** Cuánto se afina el cuerpo por velocidad. 0 = sin cuello. */
  neck: number
  /** Separación (en diámetros de la pill más chica) a la que aparece el puente. */
  reach: number
  /** Sin animación: salta al objetivo (reduced motion). */
  instant: boolean
  /**
   * Anticipación: impulso inicial en contra del cambio: retrocede antes de ir. Con spring crítico,
   * 0.5 ≈ 7 % del recorrido hacia atrás; 1 ≈ 21 %.
   */
  anticipation: number
  /**
   * Arco: impulso perpendicular al desplazamiento, la trayectoria se curva (hacia arriba). 0.35 ≈ 13 % del recorrido
   * de comba. Solo afecta a cambios de posición.
   */
  arc: number
}

export interface GooOptions extends Partial<GooSettings> {
  /** Inyectables para tests; default rAF. */
  schedule?: (cb: (t: number) => void) => number
  cancel?: (id: number) => void
}

export const GOO_DEFAULT: GooSettings = {
  ...SPRING_DEFAULT,
  neck: 0.05,
  reach: 0.3,
  instant: false,
  anticipation: 0.5,
  arc: 0.35,
}

interface Blob {
  id: string
  group?: string
  spring?: SpringPreset | Partial<SpringConfig>
  stiffness?: number
  x: Spring
  y: Spring
  w: Spring
  h: Spring
  removing: boolean
}

const KEYS = ['x', 'y', 'w', 'h'] as const
const SETTINGS = [
  'stiffness',
  'damping',
  'mass',
  'neck',
  'reach',
  'instant',
  'anticipation',
  'arc',
] as const

/**
 * Motor goo. No sabe de React ni del DOM: recibe objetivos (`upsert` / `remove`), anima springs y emite un frame con el
 * `d` de la unión. El loop corre solo mientras algo se mueve: en reposo no queda ningún rAF pendiente.
 */
export class GooEngine {
  #blobs = new Map<string, Blob>()
  #listeners = new Set<(f: GooFrame) => void>()
  #opts: GooSettings = { ...GOO_DEFAULT }
  #schedule: (cb: (t: number) => void) => number
  #cancel: (id: number) => void
  #raf: number | null = null
  #last: number | null = null
  #frame: GooFrame = { blobs: new Map(), d: '' }
  #velW = new Map<string, number>()

  constructor(opts: GooOptions = {}) {
    this.#schedule =
      opts.schedule ?? ((cb) => globalThis.requestAnimationFrame(cb))
    this.#cancel = opts.cancel ?? ((id) => globalThis.cancelAnimationFrame(id))
    this.configure(opts)
  }

  configure(opts: Partial<GooSettings>): void {
    for (const k of SETTINGS) {
      const v = opts[k]
      if (v !== undefined)
        (this.#opts as unknown as Record<string, unknown>)[k] = v
    }
    this.#changed()
  }

  get settings(): Readonly<GooSettings> {
    return this.#opts
  }

  get frame(): GooFrame {
    return this.#frame
  }

  /** true mientras hay un rAF pendiente. */
  get running(): boolean {
    return this.#raf !== null
  }

  subscribe(fn: (f: GooFrame) => void): () => void {
    this.#listeners.add(fn)
    fn(this.#frame)
    return () => {
      this.#listeners.delete(fn)
    }
  }

  upsert(t: BlobTarget): void {
    let b = this.#blobs.get(t.id)
    const born = !b
    if (!b) {
      const cx = t.from?.x ?? t.x + t.w / 2
      const cy = t.from?.y ?? t.y + t.h / 2
      b = {
        id: t.id,
        x: spring(cx),
        y: spring(cy),
        w: spring(0),
        h: spring(0),
        removing: false,
      }
      this.#blobs.set(t.id, b)
    }
    b.group = t.group
    b.spring = t.spring
    b.stiffness = t.stiffness
    b.removing = false
    const moved = b.x.target !== t.x || b.y.target !== t.y
    const resized = b.w.target !== t.w || b.h.target !== t.h
    b.x.target = t.x
    b.y.target = t.y
    b.w.target = t.w
    b.h.target = t.h
    // Al nacer no hay anticipación (no hay de dónde retroceder), sí arco.
    if (moved || resized)
      this.#impulse(b, born ? 0 : t.anticipation, t.arc, moved, resized)
    this.#changed()
  }

  /** Se encoge hasta su centro (o hasta `to`, p. ej. el centro del que nació) y desaparece. */
  remove(id: string, to?: { x: number; y: number }): void {
    const b = this.#blobs.get(id)
    if (!b || b.removing) return
    b.removing = true
    b.x.target = to ? to.x : b.x.target + b.w.target / 2
    b.y.target = to ? to.y : b.y.target + b.h.target / 2
    b.w.target = 0
    b.h.target = 0
    this.#changed()
  }

  /** Corta el loop (desmontaje). El motor sigue usable: el próximo cambio lo arranca. */
  stop(): void {
    if (this.#raf !== null) this.#cancel(this.#raf)
    this.#raf = null
    this.#last = null
  }

  #config(b: Blob): SpringConfig {
    const own = typeof b.spring === 'string' ? PRESETS[b.spring] : b.spring
    const { stiffness, damping, mass } = this.#opts
    return {
      stiffness: b.stiffness ?? own?.stiffness ?? stiffness,
      damping: own?.damping ?? damping,
      mass: own?.mass ?? mass,
    }
  }

  /**
   * Física de los principios de animación: la anticipación es un impulso en contra del cambio y el arco uno
   * perpendicular al desplazamiento. Ambos escalan con ω = √(k/m), así se ven igual con cualquier spring.
   */
  #impulse(
    b: Blob,
    anticipation: number | undefined,
    arc: number | undefined,
    moved: boolean,
    resized: boolean,
  ) {
    if (this.#opts.instant) return
    const { stiffness, mass } = this.#config(b)
    const omega = Math.sqrt(stiffness / (mass > 0 ? mass : 1))
    const a = anticipation ?? this.#opts.anticipation
    const keys = [
      ...(moved ? (['x', 'y'] as const) : []),
      ...(resized ? (['w', 'h'] as const) : []),
    ]
    if (a > 0)
      for (const k of keys)
        b[k].velocity -= a * omega * (b[k].target - b[k].value)
    const c = arc ?? this.#opts.arc
    if (moved && c > 0) {
      const dx = b.x.target - b.x.value
      const dy = b.y.target - b.y.value
      // Perpendicular de igual largo que el recorrido, con la comba hacia arriba (y negativa).
      let px = -dy
      let py = dx
      if (py > 0 || (py === 0 && px < 0)) {
        px = -px
        py = -py
      }
      b.x.velocity += c * omega * px
      b.y.velocity += c * omega * py
    }
  }

  #changed() {
    if (this.#opts.instant) return this.#settleAll()
    if (this.#raf !== null) return
    const resting = [...this.#blobs.values()].every((b) =>
      KEYS.every((k) => atRest(b[k])),
    )
    if (resting) {
      this.#reap()
      this.#emit()
    } else this.#raf = this.#schedule(this.#tick)
  }

  #tick = (t: number) => {
    this.#raf = null
    const dt =
      this.#last === null ? 1 / 60 : Math.min(1 / 30, (t - this.#last) / 1000)
    this.#last = t
    let resting = true
    for (const b of this.#blobs.values()) {
      const cfg = this.#config(b)
      const w0 = b.w.value
      for (const k of KEYS) if (!stepSpring(b[k], dt, cfg)) resting = false
      this.#velW.set(b.id, dt > 0 ? (b.w.value - w0) / dt : 0)
    }
    this.#reap()
    if (resting) {
      this.#last = null
      this.#velW.clear()
    } else this.#raf = this.#schedule(this.#tick)
    this.#emit()
  }

  #settleAll() {
    this.stop()
    for (const b of this.#blobs.values())
      for (const k of KEYS) {
        b[k].value = b[k].target
        b[k].velocity = 0
      }
    this.#velW.clear()
    this.#reap()
    this.#emit()
  }

  #reap() {
    for (const [id, b] of this.#blobs)
      if (b.removing && atRest(b.w) && atRest(b.h)) this.#blobs.delete(id)
  }

  #emit() {
    const states = new Map<string, BlobState>()
    let d = ''
    for (const b of this.#blobs.values()) {
      const box = {
        x: b.x.value,
        y: b.y.value,
        w: Math.max(0, b.w.value),
        h: Math.max(0, b.h.value),
      }
      const v = Math.abs(this.#velW.get(b.id) ?? 0)
      const neck = Math.min(0.65, (v * this.#opts.neck) / Math.max(box.h, 1))
      states.set(b.id, { id: b.id, group: b.group, ...box, neck })
      d += pillPath(box, neck)
    }
    const list = [...states.values()]
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!
        const c = list[j]!
        if (!a.group || a.group !== c.group) continue
        const r = Math.min(a.h, c.h, a.w, c.w) / 2
        if (r > 0) d += bridgePath(a, c, r * 2 * this.#opts.reach)
      }
    this.#frame = { blobs: states, d }
    for (const fn of this.#listeners) fn(this.#frame)
  }
}
