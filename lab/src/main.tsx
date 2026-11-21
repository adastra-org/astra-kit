import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { HudLab } from './hud/HudLab'
import { NuiLab } from './nui/NuiLab'
import './styles.css'

// `?page=hud` abre el prototipo del HUD (pills + goo); `?page=nui`, las primitivas NUI; sin parámetro, los componentes.
const page = new URLSearchParams(location.search).get('page')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page === 'hud' ? <HudLab /> : page === 'nui' ? <NuiLab /> : <App />}
  </StrictMode>,
)
