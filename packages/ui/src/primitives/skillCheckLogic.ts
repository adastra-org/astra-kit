import type { SkillDifficulty } from '@adastrarp/nui'

/** Ancho de la zona en grados y tiempo de una vuelta completa, por dificultad. */
export const DIFFICULTY: Record<
  SkillDifficulty,
  { zone: number; duration: number }
> = {
  easy: { zone: 64, duration: 2200 },
  medium: { zone: 44, duration: 1700 },
  hard: { zone: 28, duration: 1300 },
}

/** La zona nunca arranca pegada al inicio: hay que dar tiempo a leer la tecla antes del primer cruce posible. */
const ZONE_FROM = 70

export interface Round {
  difficulty: SkillDifficulty
  /** Grados desde arriba, en sentido horario. */
  zoneStart: number
  zoneSize: number
  duration: number
  key: string
}

export function createRound(
  difficulty: SkillDifficulty,
  keys: string[],
  rand: () => number = Math.random,
): Round {
  const { zone, duration } = DIFFICULTY[difficulty]
  const room = 360 - zone - ZONE_FROM
  return {
    difficulty,
    zoneStart: ZONE_FROM + Math.floor(rand() * room),
    zoneSize: zone,
    duration,
    key: keys[Math.floor(rand() * keys.length)] ?? keys[0] ?? 'e',
  }
}

/** Ángulo del marcador a los `elapsed` ms (0 a 360). */
export const markerAngle = (elapsed: number, duration: number): number =>
  Math.min(360, Math.max(0, (elapsed / duration) * 360))

export const inZone = (angle: number, round: Round): boolean =>
  angle >= round.zoneStart && angle <= round.zoneStart + round.zoneSize

/**
 * Qué hace una tecla en una ronda. La correcta en zona acierta; la correcta fuera de zona o cualquier otra tecla de
 * la lista falla; una tecla que no está en la lista se ignora (no castiga un roce a otra tecla del juego).
 */
export function judgeKey(
  pressed: string,
  angle: number,
  round: Round,
  keys: string[],
): 'hit' | 'miss' | 'ignore' {
  const k = pressed.toLowerCase()
  if (!keys.includes(k)) return 'ignore'
  return k === round.key.toLowerCase() && inZone(angle, round) ? 'hit' : 'miss'
}
