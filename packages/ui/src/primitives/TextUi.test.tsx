import { afterEach, describe, expect, test } from 'bun:test'
import { emitPrimitive } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { NuiPrimitives } from './NuiPrimitives'
import { TextUi } from './TextUi'

let root: Root | null = null
let host: HTMLElement
function mount(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  delete (window as { matchMedia?: unknown }).matchMedia
})
const wait = (ms: number) =>
  act(() => new Promise<void>((r) => setTimeout(r, ms)))

describe('<TextUi>', () => {
  test('tecla en Kbd y texto; es un status sin foco', () => {
    mount(<TextUi data={{ key: 'e', text: 'Abrir' }} />)
    const el = host.querySelector('[role="status"]')!
    expect(el.querySelector('kbd')!.textContent).toBe('E')
    expect(el.textContent).toContain('Abrir')
    expect(el.querySelector('button, a, input, [tabindex]')).toBeNull()
  })

  test('sin tecla, solo texto', () => {
    mount(<TextUi data={{ text: 'Sin tecla' }} />)
    expect(host.querySelector('kbd')).toBeNull()
    expect(host.textContent).toBe('Sin tecla')
  })

  test('host: textui:show lo muestra y un segundo show lo reemplaza', async () => {
    mount(<NuiPrimitives />)
    expect(host.querySelector('[data-adastra="TextUi"]')).toBeNull()
    await act(async () =>
      emitPrimitive('textui:show', { key: 'E', text: 'Abrir' }),
    )
    expect(host.querySelector('[data-adastra="TextUi"]')).not.toBeNull()
    // Esperar a que termine la entrada: happy-dom rechaza (unhandled) las animaciones que motion cancela a medias.
    await wait(300)
    // un segundo show reemplaza el texto
    await act(async () =>
      emitPrimitive('textui:show', { key: 'G', text: 'Guardar' }),
    )
    expect(host.querySelectorAll('[data-adastra="TextUi"]').length).toBe(1)
    expect(host.textContent).toContain('Guardar')
    // `textui:hide` no se verifica acá: la salida es de `Reveal` (AnimatePresence) y happy-dom no termina la animación.
  })
})
