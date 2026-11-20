// Núcleo sin React: geometría, springs y motor. Sirve para un HUD en otro framework o para tests.
export {
  GOO_DEFAULT,
  GooEngine,
  type BlobState,
  type BlobTarget,
  type GooFrame,
  type GooOptions,
  type GooSettings,
} from './engine'
export {
  bridgePath,
  circlePath,
  metaballPath,
  pillEnds,
  pillPath,
  rectPath,
  type Box,
  type Circle,
} from './geometry'
export {
  PRESETS,
  SPRING_DEFAULT,
  atRest,
  critical,
  dampingRatio,
  spring,
  stepSpring,
  type Spring,
  type SpringConfig,
  type SpringPreset,
} from './spring'
export { row } from './layout'
