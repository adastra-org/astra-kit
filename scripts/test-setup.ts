// Preload de `bun test`: DOM global (happy-dom) para los tests de hooks y componentes.
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
