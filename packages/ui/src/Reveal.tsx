import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Entrada y salida de un bloque al cambiar `open` (p. ej. `visible` de `useNuiVisibility`). Anima solo en el cambio de
 * estado: en reposo no hay loop ni rAF. 180 ms, ease-out de marca, 8 px desde abajo; con reduced motion solo opacidad.
 * `className` va al contenedor animado.
 */
export function Reveal({
  open,
  className,
  children,
}: {
  open: boolean
  className?: string
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const y = reduce ? 0 : 8
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-adastra="Reveal"
          className={className}
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y }}
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
