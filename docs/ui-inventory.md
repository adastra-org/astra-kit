# Inventario de UI del server

Relevado del repo del server (`resources/`) el 2026-11-20: 73 recursos con `ui_page` más las primitivas de ox_lib, que
usan casi todos los scripts. Sirve para priorizar qué cubre astra-kit. Los números son archivos `.lua` que llaman a cada
primitiva.

## Prioridad 1: primitivas de ox_lib (una skin cubre cientos de scripts)

`qbx_core` `Notify` termina en `lib.notify`, así que reskinear ox_lib cubre casi todo el feedback del server.

| Primitiva                         | Archivos | Pieza del kit                      |
| --------------------------------- | -------- | ---------------------------------- |
| `lib.notify` + `qbx_core:Notify`  | 245      | Toast pill (nace del borde, goo)   |
| `lib.callback` (sin UI)           | 210      | -                                  |
| `lib.progressBar` / `Circle`      | 60       | Pill de progreso / orbe con anillo |
| `lib.showTextUI`                  | 56       | Pill de tecla (`Kbd` + texto)      |
| `lib.registerContext`             | 43       | Menú contextual (panel de pills)   |
| `lib.inputDialog`                 | 39       | Diálogo con `Field`                |
| `lib.registerMenu`                | 21       | Lista con teclado                  |
| `lib.alertDialog`                 | 19       | Confirmación                       |
| `lib.skillCheck`                  | 14       | Minijuego: anillo con zona         |
| radial (`qbx_radialmenu`, ox_lib) | 5        | Radial de orbes (goo)              |

Más `ox_target` (ojo) y `ox_inventory` (inventario completo): los dos se ven en cada sesión.

## Prioridad 2: HUD (siempre en pantalla)

`qbx_hud`, `Radar` (radar y AWACS), `dex_postal`, `pma-voice` / `mm_radio` (voz y radio), `qbx_seatbelt`, `EAS`,
`forge-defcon`, `BaltouRadiation`. El prototipo de pills ya cubre estado, velocímetro y alertas.

## Prioridad 3: pantallas por caso de uso

| Caso                  | Recursos                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Teléfono              | `npwd` + `npwd_qbx_garages`, `npwd_qbx_mail`                                                                   |
| Tablets y MDT         | `core_mdw` (policía, incluye multas), `dispatch`, `ld-tunertablet`, `sf_camerasecurity`, `spy-bodycam`         |
| Banco y dinero        | `Renewed-Banking` (cuentas, facturas en `client/menus.lua`), `dw-bossmenu`, `qbx_management`, `scratchcard`    |
| Compras y alquileres  | `qbx_vehiclesales`, `ry_rent`, `renzu_motels`, `renzu_customs`, `qbx_pawnshop`                                 |
| Menús in-game         | `PauseMenu`, `qbx_scoreboard`, `dw-jobcenter`, `yecoyz_duty`, `sh-guidebook`, `qbx_spawn`                      |
| Personaje e identidad | `illenium-appearance`, `qbx_idcard`, `bl_idcard`, `stevo_policebadge`, `MugShotBase64`                         |
| Interacción           | `karma-interaction`, `renzu_contextmenu`, `Syn_Sit`, `gs_weaponcarry`                                          |
| Minijuegos            | `mhacking`, `ultra-voltlab`, `qbx_bankrobbery`, `qbx_storerobbery`, `qbx_lapraces`, `atiya-piano`              |
| Medios y objetos      | `hypnonema`, `tgg-remotetv`, `xsound`, `Boombox`, `ps-camera`, `pl_printer`, `kurlie_notepad`, `SG-ItemViewer` |

No hay un recurso de facturación propio: las multas viven en `core_mdw` y las facturas en `Renewed-Banking`.

## Fuera de alcance

Herramientas de dev (`astra_debug`, `astra_glassdemo`, `dolu_tool`, `draggy`, `fivem-greenscreener`,
`jraxion_handlingeditor`), anticheat (`FYAC`), librerías sin pantalla propia (`fmLib`, `lc_utils`, `r_bridge`, `oxmysql`,
`screencapture`, `runcode`).

## Orden propuesto

1. Skin de ox_lib (toast, progreso, text UI, contexto, input, alerta, skill check). Una PR que cambia la cara de todo.
2. `ox_target` y `ox_inventory`.
3. HUD real (`qbx_hud` sobre `@adastrarp/goo`), radio y voz.
4. Banco (`Renewed-Banking`) y tablet policial (`core_mdw` + `dispatch`): las dos pantallas grandes más usadas.
5. Menú de pausa, scoreboard, centro de empleos, después el resto por uso.
