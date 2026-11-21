export type Page = 'components' | 'hud' | 'nui'

/** Página del lab: `#hud` / `#nui` (o `?page=` por compatibilidad); sin nada, los componentes. */
export function currentPage(): Page {
  const raw =
    location.hash.slice(1) || new URLSearchParams(location.search).get('page')
  return raw === 'hud' || raw === 'nui' ? raw : 'components'
}
