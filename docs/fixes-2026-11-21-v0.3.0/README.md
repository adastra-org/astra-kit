# Fixes 2026-11-21 (v0.3.0)

Comentarios de Faku en el lab publicado (Astra Kit Lab y Astra HUD Pills). Se tilda solo lo verificado en el navegador.

## Notificaciones

- [~] Quedan hilos finos de goo entre toasts que se separan: rompen la estética. Ruptura del puente (`PINCH`) cuando el cuello baja del 30 % del radio; cubierto por test, falta verlo en movimiento.

## Progreso

- [x] Círculo: sin `%` y números más grandes.
- [x] Barra cancelable: más padding a los lados (más ancha).

## Text UI

- [x] La tecla (`E`) no sigue la regla de radios concéntricos (radio interno = radio externo - padding).
- [x] Sin tecla ("Zona segura") el texto no queda centrado.
- [x] Zona protegida: necesita color propio (`tone: 'safe'`, también `danger` e `info`).

## Menú contextual (Garaje)

- [x] Ícono a la izquierda de cada dato del ítem (Salud, Combustible).
- [~] Submenú ("Modificaciones"): sin animación al cambiar de sección y no parece un botón. Ítems con fondo y borde en reposo (verificado); la sección entra desde el lado con spring `snappy` (falta verla en movimiento).
- [x] Acción importante ("Vender"): con color, no necesariamente rojo.
- [x] Todas las acciones con texto secundario (en el ejemplo; el contrato lo deja opcional).

## Diálogo de input (Registro de vehículo)

- [x] Número: quitar los botones nativos de sumar/restar.
- [~] Select: dropdown propio con animación, no el nativo. Combobox propio verificado cerrado; la apertura con spring falta verla.
- [x] Fecha: formato dd/mm/yyyy.
- [~] Checkbox: más redondo y con animación. Forma verificada; la tilde se dibuja con spring (falta verla en movimiento).

## HUD (hilos del 2026-11-20 que otra sesión respondió como hechos sin aplicarlos)

- [x] Alertas: armado en 3 fases (orbe, después ícono a los 300 ms, después borde a los 500 ms). Captura a 200 ms: orbe vacío, sin borde.
- [x] Orbes de stats centrados con el minimapa, no pegados a la izquierda.
- [~] Íconos de alerta nacen del centro del velocímetro (Auto y Avión) y vuelven ahí al irse. `from` sin offset y `remove(id, to)` en el motor con test; falta verlo en movimiento.
- [x] Avión: al expandirse una pill se ocultan los íconos cerrados de la derecha en vez de empujar la fila contra la altitud.
