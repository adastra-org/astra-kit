import { afterEach, describe, expect, test } from 'bun:test'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  Button,
  Chip,
  Field,
  Glass,
  IconButton,
  Kbd,
  keyCaps,
  Panel,
} from './index'

let root: Root | null = null
let host: HTMLElement
function mount(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
  return host
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

describe('Glass', () => {
  test('default = fake, sin SVG ni variable de refracción', () => {
    mount(<Glass>hola</Glass>)
    const el = host.querySelector<HTMLElement>('.ad-glass')!
    expect(el.dataset.mode).toBe('fake')
    expect(el.querySelector('svg')).toBeNull()
    expect(el.style.getPropertyValue('--glass-refract')).toBe('')
    expect(el.textContent).toBe('hola')
  })
  test('backdrop sin refraction: sin filtro SVG', () => {
    mount(<Glass mode="backdrop" />)
    const el = host.querySelector<HTMLElement>('.ad-glass')!
    expect(el.dataset.mode).toBe('backdrop')
    expect(el.querySelector('filter')).toBeNull()
  })
  test('backdrop + refraction: filtro con id válido y variable que lo referencia', () => {
    mount(<Glass mode="backdrop" refraction={20} />)
    const el = host.querySelector<HTMLElement>('.ad-glass')!
    const filter = el.querySelector('filter')!
    expect(filter.id).toMatch(/^adastra-refract-[A-Za-z0-9_-]+$/)
    expect(el.style.getPropertyValue('--glass-refract')).toBe(
      `url(#${filter.id})`,
    )
    expect(el.querySelector('feDisplacementMap')!.getAttribute('scale')).toBe(
      '20',
    )
    expect(el.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
  test('refraction se limita a 0–40 y 0 no crea filtro', () => {
    mount(<Glass mode="backdrop" refraction={999} />)
    expect(host.querySelector('feDisplacementMap')!.getAttribute('scale')).toBe(
      '40',
    )
    act(() => root!.render(<Glass mode="backdrop" refraction={0} />))
    expect(host.querySelector('filter')).toBeNull()
  })
  test('solid marca data-solid; className y props pasan al div', () => {
    mount(<Glass solid className="p-4" id="g" />)
    const el = host.querySelector<HTMLElement>('#g')!
    expect(el.hasAttribute('data-solid')).toBe(true)
    expect(el.className).toBe('ad-glass p-4')
  })
  test('dos Glass con refraction no comparten id', () => {
    mount(
      <>
        <Glass mode="backdrop" refraction />
        <Glass mode="backdrop" refraction />
      </>,
    )
    const ids = [...host.querySelectorAll('filter')].map((f) => f.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('Panel', () => {
  test('sólido por defecto; glass es opt-in', () => {
    mount(<Panel title="Inventario">x</Panel>)
    expect(host.querySelector('.ad-glass')).toBeNull()
    act(() =>
      root!.render(
        <Panel title="Inventario" glass="fake">
          x
        </Panel>,
      ),
    )
    expect(host.querySelector('.ad-glass')).not.toBeNull()
  })
  test('region etiquetada por su título', () => {
    mount(<Panel title="Inventario" />)
    const region = host.querySelector('[role="region"]')!
    const labelId = region.getAttribute('aria-labelledby')!
    expect(host.querySelector(`[id="${labelId}"]`)!.textContent).toBe(
      'Inventario',
    )
  })
})

describe('Button / IconButton / Chip', () => {
  test('Button es type=button por defecto', () => {
    mount(<Button>Ok</Button>)
    expect(host.querySelector('button')!.type).toBe('button')
  })
  test('IconButton expone label como nombre accesible', () => {
    mount(<IconButton label="Cerrar" icon={<i />} />)
    const b = host.querySelector('button')!
    expect(b.getAttribute('aria-label')).toBe('Cerrar')
    expect(b.title).toBe('Cerrar')
  })
  test('Chip: aria-pressed, o aria-selected si es tab', () => {
    mount(<Chip selected>Todos</Chip>)
    expect(host.querySelector('button')!.getAttribute('aria-pressed')).toBe(
      'true',
    )
    act(() =>
      root!.render(
        <Chip role="tab" selected={false}>
          Todos
        </Chip>,
      ),
    )
    const tab = host.querySelector('button')!
    expect(tab.getAttribute('aria-selected')).toBe('false')
    expect(tab.hasAttribute('aria-pressed')).toBe(false)
  })
})

describe('Kbd', () => {
  test('keyCaps separa por + y respeta la tecla +', () => {
    expect(keyCaps('Ctrl+K')).toEqual(['Ctrl', 'K'])
    expect(keyCaps('E')).toEqual(['E'])
    expect(keyCaps('Ctrl++')).toEqual(['Ctrl', '+'])
  })
  test('texto plano para lectores de pantalla', () => {
    mount(<Kbd keys="Shift+F5" />)
    expect(host.querySelector('.sr-only')!.textContent).toBe('Shift + F5')
    expect(host.querySelectorAll('kbd')).toHaveLength(2)
  })
})

describe('Field', () => {
  test('label asociado y sin aria-invalid', () => {
    mount(<Field label="Nombre" />)
    const input = host.querySelector('input')!
    expect(host.querySelector('label')!.htmlFor).toBe(input.id)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })
  test('error: aria-invalid + aria-describedby al mensaje; hint se oculta', () => {
    mount(<Field label="Patente" hint="Seis caracteres" error="Ya existe" />)
    const input = host.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const msg = host.querySelector(
      `[id="${input.getAttribute('aria-describedby')}"]`,
    )!
    expect(msg.textContent).toContain('Ya existe')
    expect(host.textContent).not.toContain('Seis caracteres')
  })
  test('hint se asocia cuando no hay error', () => {
    mount(<Field label="Patente" hint="Seis caracteres" />)
    const input = host.querySelector('input')!
    expect(
      host.querySelector(`[id="${input.getAttribute('aria-describedby')}"]`)!
        .textContent,
    ).toBe('Seis caracteres')
  })
})
