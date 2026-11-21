import { useEffect, useState } from 'react'
import { App } from './App'
import { HudLab } from './hud/HudLab'
import { currentPage } from './LabNav'
import { NuiLab } from './nui/NuiLab'

/** `#hud` abre el prototipo del HUD (pills + goo); `#nui`, las primitivas NUI; sin hash, los componentes. */
export function Root() {
  const [page, setPage] = useState(currentPage)
  useEffect(() => {
    const sync = () => {
      setPage(currentPage())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  return page === 'hud' ? <HudLab /> : page === 'nui' ? <NuiLab /> : <App />
}
