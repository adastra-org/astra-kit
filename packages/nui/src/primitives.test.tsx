import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  callbackPrimitive,
  clearNuiMocks,
  emitPrimitive,
  mockNui,
  normalizeNotify,
  normalizeProgress,
  normalizeSkillCheck,
  usePrimitiveEvent,
} from './index'

let root: Root | null = null
beforeEach(() => clearNuiMocks())
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

describe('mensajes Lua -> UI', () => {
  test('emitPrimitive entrega { action, data } al hook tipado', () => {
    const got: unknown[] = []
    function Probe() {
      usePrimitiveEvent('notify:show', (d) => got.push(d))
      return null
    }
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    act(() => root!.render(<Probe />))
    act(() => emitPrimitive('notify:show', { description: 'Listo' }))
    act(() => emitPrimitive('notify:dismiss', { id: 'x' }))
    expect(got).toEqual([{ description: 'Listo' }])
  })

  test('acciones sin datos no piden argumento', () => {
    const seen: unknown[] = []
    const on = (e: MessageEvent) => seen.push(e.data)
    window.addEventListener('message', on)
    emitPrimitive('textui:hide')
    window.removeEventListener('message', on)
    expect(seen).toEqual([{ action: 'textui:hide', data: undefined }])
  })
})

describe('callbacks UI -> Lua', () => {
  test('callbackPrimitive llama fetchNui con el evento y el cuerpo tipados', async () => {
    const handler = mock((_d: unknown) => ({}))
    mockNui('alert:result', handler)
    callbackPrimitive('alert:result', { id: 'a', result: 'confirm' })
    await Promise.resolve()
    expect(handler).toHaveBeenCalledWith({ id: 'a', result: 'confirm' })
  })

  test('un callback que falla no tira la UI', async () => {
    const err = mock(() => {})
    const real = console.error
    console.error = err
    mockNui('progress:end', () => {
      throw new Error('boom')
    })
    callbackPrimitive('progress:end', { id: 'p', status: 'completed' })
    await new Promise((r) => setTimeout(r, 0))
    console.error = real
    expect(err).toHaveBeenCalled()
  })
})

describe('normalización', () => {
  test('notify: defaults, tipo inválido y duración como string', () => {
    const n = normalizeNotify({ description: 'hola' })
    expect(n).toMatchObject({ type: 'info', duration: 4000 })
    expect(n.id).toMatch(/^notify-\d+$/)
    expect(
      normalizeNotify({ description: 'x', type: 'otro' as never }).type,
    ).toBe('info')
    expect(
      normalizeNotify({ description: 'x', duration: '1500' as never }).duration,
    ).toBe(1500)
    expect(normalizeNotify({ description: 'x', duration: -5 }).duration).toBe(0)
    expect(normalizeNotify({ id: 'k', description: 'x' }).id).toBe('k')
  })

  test('progress: duración mínima, cancelKey en minúscula, kind válido', () => {
    expect(normalizeProgress({ id: 'p', duration: 0 }).duration).toBe(50)
    expect(
      normalizeProgress({ id: 'p', duration: 1, cancelKey: 'X' }).cancelKey,
    ).toBe('x')
    expect(normalizeProgress({ id: 'p', duration: 1 })).toMatchObject({
      kind: 'bar',
      canCancel: false,
      cancelKey: 'x',
    })
    expect(
      normalizeProgress({ id: 'p', duration: 1, kind: 'circle' }).kind,
    ).toBe('circle')
  })

  test('skillcheck: rondas y teclas por defecto, descarta dificultades inválidas', () => {
    expect(normalizeSkillCheck({ id: 's' })).toEqual({
      id: 's',
      rounds: ['easy'],
      keys: ['e'],
    })
    expect(
      normalizeSkillCheck({
        id: 's',
        rounds: ['hard', 'nope' as never, 'easy'],
        keys: ['W', 'A'],
      }),
    ).toEqual({ id: 's', rounds: ['hard', 'easy'], keys: ['w', 'a'] })
  })
})
