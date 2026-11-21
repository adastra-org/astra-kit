import type { Page } from './pages'

const PAGES: { id: Page; label: string }[] = [
  { id: 'components', label: 'Componentes' },
  { id: 'hud', label: 'HUD' },
  { id: 'nui', label: 'Primitivas NUI' },
]

/** Navegación entre las páginas del lab. Usa el hash: funciona igual en Vite y dentro de un iframe publicado. */
export function LabNav({ current }: { current: Page }) {
  return (
    <nav
      aria-label="Páginas del lab"
      className="flex flex-wrap gap-x-3 gap-y-1"
    >
      {PAGES.map((p) => (
        <a
          key={p.id}
          href={`#${p.id}`}
          aria-current={p.id === current ? 'page' : undefined}
          className="text-caption text-ink-muted underline aria-[current=page]:text-ink aria-[current=page]:no-underline"
        >
          {p.label}
        </a>
      ))}
    </nav>
  )
}
