import { afterEach, describe, expect, test } from 'bun:test'
import type { InputDialogData, InputValue } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Alert } from './Alert'
import { InputDialog } from './InputDialog'

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
})
const key = (k: string, shiftKey = false) =>
  act(() => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true }),
    )
  })
const click = (el: Element) => act(async () => (el as HTMLElement).click())
const buttons = () => [...host.querySelectorAll('button')]
const byText = (t: string) => buttons().find((b) => b.textContent === t)!
const change = (el: HTMLInputElement | HTMLSelectElement, value: string) =>
  act(() => {
    const proto =
      el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
    el.dispatchEvent(
      new Event(el instanceof HTMLSelectElement ? 'change' : 'input', {
        bubbles: true,
      }),
    )
  })
const field = (name: string) =>
  host.querySelector<HTMLInputElement & HTMLSelectElement>(`[name="${name}"]`)!

describe('<Alert>', () => {
  test('alertdialog modal con título y contenido enlazados', () => {
    mount(
      <Alert
        data={{ id: 'a', title: 'Salir', content: 'Se pierde todo' }}
        onResult={() => {}}
      />,
    )
    const dlg = host.querySelector('[role="alertdialog"]')!
    expect(dlg.getAttribute('aria-modal')).toBe('true')
    expect(
      host.querySelector(`#${dlg.getAttribute('aria-labelledby')}`)!
        .textContent,
    ).toBe('Salir')
    expect(
      host.querySelector(`#${dlg.getAttribute('aria-describedby')}`)!
        .textContent,
    ).toBe('Se pierde todo')
  })

  test('confirmar, cancelar y Escape', async () => {
    const out: string[] = []
    mount(
      <Alert data={{ id: 'a', title: 'T' }} onResult={(r) => out.push(r)} />,
    )
    await click(byText('Aceptar'))
    await click(byText('Cancelar'))
    await key('Escape')
    expect(out).toEqual(['confirm', 'cancel', 'cancel'])
  })

  test('foco inicial: confirmar; en `danger`, cancelar', () => {
    mount(<Alert data={{ id: 'a', title: 'T' }} onResult={() => {}} />)
    expect(document.activeElement).toBe(byText('Aceptar'))
    act(() => root!.unmount())
    root = null
    document.body.innerHTML = ''
    mount(
      <Alert
        data={{ id: 'a', title: 'T', danger: true, confirmLabel: 'Borrar' }}
        onResult={() => {}}
      />,
    )
    expect(document.activeElement).toBe(byText('Cancelar'))
  })

  test('cancel: false deja un solo botón', () => {
    mount(
      <Alert
        data={{ id: 'a', title: 'T', cancel: false }}
        onResult={() => {}}
      />,
    )
    expect(buttons().map((b) => b.textContent)).toEqual(['Aceptar'])
  })

  test('Tab da la vuelta dentro del diálogo (último -> primero, primero -> último)', async () => {
    mount(<Alert data={{ id: 'a', title: 'T' }} onResult={() => {}} />)
    expect(document.activeElement).toBe(byText('Aceptar'))
    await key('Tab')
    expect(document.activeElement).toBe(byText('Cancelar'))
    await key('Tab', true)
    expect(document.activeElement).toBe(byText('Aceptar'))
  })
})

const form: InputDialogData = {
  id: 'f',
  title: 'Registro',
  fields: [
    { id: 'name', type: 'text', label: 'Nombre', required: true },
    { id: 'age', type: 'number', label: 'Edad', min: 18, max: 99 },
    {
      id: 'kind',
      type: 'select',
      label: 'Tipo',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
    { id: 'terms', type: 'checkbox', label: 'Acepto', default: false },
    { id: 'born', type: 'date', label: 'Nacimiento' },
  ],
}

describe('<InputDialog>', () => {
  test('cada campo tiene label; el foco arranca en el primero', () => {
    mount(<InputDialog data={form} onResult={() => {}} />)
    expect(
      host.querySelector('[role="dialog"]')!.getAttribute('aria-modal'),
    ).toBe('true')
    for (const f of form.fields) {
      expect(
        host.querySelector(`label[for="${field(f.id).id}"]`),
      ).not.toBeNull()
    }
    expect(host.textContent).toContain('Edad (opcional)')
    expect(document.activeElement).toBe(field('name'))
  })

  test('envía valores tipados', async () => {
    let got: Record<string, InputValue> | null | undefined
    mount(<InputDialog data={form} onResult={(v) => (got = v)} />)
    await change(field('name'), 'Faku')
    await change(field('age'), '30')
    await change(field('kind'), 'b')
    await click(field('terms'))
    await change(field('born'), '1990-05-01')
    await click(byText('Aceptar'))
    expect(got).toEqual({
      name: 'Faku',
      age: 30,
      kind: 'b',
      terms: true,
      born: '1990-05-01',
    })
  })

  test('vacíos opcionales: number/select/date -> null; checkbox -> false', async () => {
    let got: Record<string, InputValue> | null | undefined
    mount(<InputDialog data={form} onResult={(v) => (got = v)} />)
    await change(field('name'), 'x')
    await click(byText('Aceptar'))
    expect(got).toEqual({
      name: 'x',
      age: null,
      kind: null,
      terms: false,
      born: null,
    })
  })

  test('valida required y rango: muestra el error, no envía y enfoca el campo', async () => {
    let got: unknown = 'sin respuesta'
    mount(<InputDialog data={form} onResult={(v) => (got = v)} />)
    await change(field('age'), '5')
    await click(byText('Aceptar'))
    expect(got).toBe('sin respuesta')
    expect(field('name').getAttribute('aria-invalid')).toBe('true')
    expect(host.textContent).toContain('Error: Este campo es obligatorio.')
    expect(host.textContent).toContain('Error: El mínimo es 18.')
    expect(document.activeElement).toBe(field('name'))
    // corregir limpia el error del campo
    await change(field('name'), 'Faku')
    expect(field('name').getAttribute('aria-invalid')).toBeNull()
  })

  test('cancelar y Escape devuelven null', async () => {
    const out: unknown[] = []
    mount(<InputDialog data={form} onResult={(v) => out.push(v)} />)
    await click(byText('Cancelar'))
    await key('Escape')
    expect(out).toEqual([null, null])
  })

  test('checkbox requerido sin marcar es un error', async () => {
    let got: unknown = 'sin respuesta'
    mount(
      <InputDialog
        data={{
          id: 'f',
          title: 'T',
          fields: [
            { id: 'ok', type: 'checkbox', label: 'Acepto', required: true },
          ],
        }}
        onResult={(v) => (got = v)}
      />,
    )
    await click(byText('Aceptar'))
    expect(got).toBe('sin respuesta')
    expect(host.textContent).toContain('Debes marcar esta casilla.')
  })
})
