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
  SPRING_DEFAULT,
  atRest,
  spring,
  stepSpring,
  type Spring,
  type SpringConfig,
} from './spring'
export { row } from './layout'
