import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  clearNuiMocks,
  debugData,
  emitNui,
  fetchNui,
  getParentResourceName,
  isEnvBrowser,
  mockNui,
  NuiError,
  requestScreenBlur,
  useNuiEvent,
  useNuiVisibility,
  useScreenBlur,
} from './index'

const realFetch = globalThis.fetch

/** Simula estar dentro del juego: `invokeNative` y `GetParentResourceName` existen. */
function enterGame(resource = 'astra_ui') {
  window.invokeNative = () => {}
  window.GetParentResourceName = () => resource
}
function leaveGame() {
  delete window.invokeNative
  delete window.GetParentResourceName
}

function stubFetch(body: string, init: ResponseInit = { status: 200 }) {
  const fn = mock(async (_url: string, _init?: RequestInit) => {
    return new Response(body, init)
  })
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

let root: Root | null = null
function mount(node: React.ReactNode) {
  const el = document.createElement('div')
  document.body.append(el)
  root = createRoot(el)
  act(() => root!.render(node))
}

afterEach(() => {
  act(() => root?.unmount())
  root = null
  leaveGame()
  clearNuiMocks()
  globalThis.fetch = realFetch
  document.body.innerHTML = ''
})

describe('env', () => {
  test('navegador: sin invokeNative', () => {
    expect(isEnvBrowser()).toBe(true)
    expect(getParentResourceName()).toBe('nui-frame-app')
  })
  test('juego: con invokeNative y nombre del resource', () => {
    enterGame('mi_resource')
    expect(isEnvBrowser()).toBe(false)
    expect(getParentResourceName()).toBe('mi_resource')
  })
})

describe('fetchNui', () => {
  test('en el juego: POST JSON a https://<resource>/<event> y parsea la respuesta', async () => {
    enterGame('astra_ui')
    const fn = stubFetch(JSON.stringify({ ok: true, items: [1, 2] }))
    const res = await fetchNui<{ ok: boolean; items: number[] }>('buy', {
      id: 7,
    })
    expect(res).toEqual({ ok: true, items: [1, 2] })
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('https://astra_ui/buy')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"id":7}')
    const headers = init?.headers as Record<string, string>
    expect(headers['Content-Type']).toContain('application/json')
  })
  test('sin data manda {}; cuerpo vacío resuelve undefined', async () => {
    enterGame()
    const fn = stubFetch('')
    expect(await fetchNui('close')).toBeUndefined()
    expect(fn.mock.calls[0]![1]?.body).toBe('{}')
  })
  test('status no ok -> NuiError', async () => {
    enterGame()
    stubFetch('nope', { status: 404 })
    const err = (await fetchNui('x').catch((e: unknown) => e)) as NuiError
    expect(err).toBeInstanceOf(NuiError)
    expect(err.status).toBe(404)
    expect(err.event).toBe('x')
  })
  test('navegador: usa el mock (valor o función) y no hace fetch', async () => {
    const fn = stubFetch('{}')
    mockNui('a', { ok: 1 })
    mockNui('b', (d: { n: number }) => d.n * 2)
    expect(await fetchNui('a')).toEqual({ ok: 1 })
    expect(await fetchNui('b', { n: 4 })).toBe(8)
    expect(fn).not.toHaveBeenCalled()
  })
  test('navegador sin mock: resuelve undefined', async () => {
    const debug = mock(() => {})
    const real = console.debug
    console.debug = debug
    expect(await fetchNui('sin-mock')).toBeUndefined()
    console.debug = real
    expect(debug).toHaveBeenCalled()
  })
  test('en el juego ignora los mocks', async () => {
    enterGame()
    mockNui('a', 'mock')
    stubFetch('"real"')
    expect(await fetchNui('a')).toBe('real')
  })
})

describe('useNuiEvent', () => {
  test('recibe data de su action y ignora el resto', () => {
    const got: unknown[] = []
    function C() {
      useNuiEvent<{ n: number }>('tick', (d) => got.push(d.n))
      return null
    }
    mount(<C />)
    act(() => {
      emitNui('tick', { n: 1 })
      emitNui('otra', { n: 99 })
      window.postMessage('texto suelto', '*')
    })
    expect(got).toEqual([1])
  })
  test('usa el handler del último render', () => {
    const calls: string[] = []
    function C({ tag }: { tag: string }) {
      useNuiEvent('ping', () => calls.push(tag))
      return null
    }
    mount(<C tag="uno" />)
    act(() => root!.render(<C tag="dos" />))
    act(() => emitNui('ping'))
    expect(calls).toEqual(['dos'])
  })
  test('se desuscribe al desmontar', () => {
    let n = 0
    function C() {
      useNuiEvent('ping', () => n++)
      return null
    }
    mount(<C />)
    act(() => root!.unmount())
    root = null
    emitNui('ping')
    expect(n).toBe(0)
  })
})

describe('debugData', () => {
  test('en el navegador despacha tras el delay y se puede cancelar', async () => {
    const got: string[] = []
    const on = (e: MessageEvent) => {
      if (e.data?.action) got.push(e.data.action)
    }
    window.addEventListener('message', on)
    debugData([{ action: 'a' }], 5)
    const cancel = debugData([{ action: 'b' }], 5)
    cancel()
    await new Promise((r) => setTimeout(r, 30))
    window.removeEventListener('message', on)
    expect(got).toEqual(['a'])
  })
  test('en el juego no hace nada', async () => {
    enterGame()
    let n = 0
    const on = () => n++
    window.addEventListener('message', on)
    debugData([{ action: 'a' }], 1)
    await new Promise((r) => setTimeout(r, 20))
    window.removeEventListener('message', on)
    expect(n).toBe(0)
  })
})

describe('useNuiVisibility', () => {
  function Probe({ spy }: { spy: (v: boolean) => void }) {
    const { visible } = useNuiVisibility()
    spy(visible)
    return null
  }
  const key = (k: string) =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))

  test('show / hide desde Lua', () => {
    let v = false
    mount(<Probe spy={(x) => (v = x)} />)
    expect(v).toBe(false)
    act(() => emitNui('show'))
    expect(v).toBe(true)
    act(() => emitNui('hide'))
    expect(v).toBe(false)
  })
  test('Escape visible -> oculta y llama fetchNui("close")', () => {
    const close = mock(() => ({}))
    mockNui('close', close)
    let v = false
    mount(<Probe spy={(x) => (v = x)} />)
    act(() => emitNui('show'))
    act(() => key('Escape'))
    expect(v).toBe(false)
    expect(close).toHaveBeenCalledTimes(1)
  })
  test('Escape con la UI oculta no llama a Lua', () => {
    const close = mock(() => ({}))
    mockNui('close', close)
    mount(<Probe spy={() => {}} />)
    act(() => key('Escape'))
    expect(close).not.toHaveBeenCalled()
  })
  test('otras teclas no cierran', () => {
    const close = mock(() => ({}))
    mockNui('close', close)
    let v = false
    mount(<Probe spy={(x) => (v = x)} />)
    act(() => emitNui('show'))
    act(() => key('Enter'))
    expect(v).toBe(true)
    expect(close).not.toHaveBeenCalled()
  })
  test('opciones: acciones y evento propios, escape off', () => {
    const closeIt = mock(() => ({}))
    mockNui('cerrar', closeIt)
    let api: ReturnType<typeof useNuiVisibility> | undefined
    function C() {
      api = useNuiVisibility({
        showAction: 'abrir',
        hideAction: 'ocultar',
        closeEvent: 'cerrar',
        escape: false,
      })
      return null
    }
    mount(<C />)
    act(() => emitNui('abrir'))
    expect(api!.visible).toBe(true)
    act(() => key('Escape'))
    expect(api!.visible).toBe(true)
    act(() => api!.close())
    expect(api!.visible).toBe(false)
    expect(closeIt).toHaveBeenCalledTimes(1)
  })
})

describe('screen blur', () => {
  test('requestScreenBlur manda { enabled, ms } al callback adastra:screenblur', async () => {
    enterGame('astra_ui')
    const fn = stubFetch('{}')
    await requestScreenBlur(true, 300)
    expect(fn.mock.calls[0]![0]).toBe('https://astra_ui/adastra:screenblur')
    expect(fn.mock.calls[0]![1]?.body).toBe('{"enabled":true,"ms":300}')
  })
  test('useScreenBlur: in al activarse, out al desmontar, nada si inactivo', () => {
    const sent: { enabled: boolean; ms: number }[] = []
    mockNui('adastra:screenblur', (d: { enabled: boolean; ms: number }) => {
      sent.push(d)
      return {}
    })
    function C({ on }: { on: boolean }) {
      useScreenBlur(on, 100)
      return null
    }
    mount(<C on={false} />)
    expect(sent).toEqual([])
    act(() => root!.render(<C on />))
    expect(sent).toEqual([{ enabled: true, ms: 100 }])
    act(() => root!.unmount())
    root = null
    expect(sent).toEqual([
      { enabled: true, ms: 100 },
      { enabled: false, ms: 100 },
    ])
  })
})

beforeEach(() => {
  leaveGame()
})
