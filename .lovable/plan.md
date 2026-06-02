## 1. Mapa libre con conquista por área

**Base de datos** (migración):
- Borrar todas las filas de `zones`, `reports`, `check_ins` y `sponsor_adoptions` (limpieza total).
- Adaptar tabla `zones` para que cualquier usuario pueda crear una zona conquistada:
  - Cambiar `id` a `uuid default gen_random_uuid()`.
  - Añadir columna `radius_m int not null default 200` (radio de protección del territorio).
  - Política RLS de INSERT para `authenticated` (con `guardian_id = auth.uid()`).
- Reemplazar la función `conquer_zone(_zone_id)` por:
  - `claim_territory(_lat, _lng, _name, _radius_m default 200)` — valida que `auth.uid()` esté a menos de 100 m de las coordenadas (GPS real), rechaza si ya existe un territorio activo dentro del radio salvo que el retador tenga más toneladas que el dueño actual (en ese caso lo reemplaza), y devuelve el nuevo `zone_id`.
- Ajustar `check_in_zone` y `report_cleanup` para usar el `radius_m` del territorio (no el fijo de 500 m).

**Frontend `ConquestMap.tsx`**:
- Quitar los filtros costera/urbana/rural y la leyenda de formas.
- Pintar cada territorio como un `<Circle>` con radio real (`zone.radius_m`) y color por estado (crítica/vulnerable/protegida) — sin pines centrales.
- Mostrar un `Tooltip` permanente encima del círculo con el texto **"Guardián · <display_name>"**.
- Añadir botón flotante **"Conquistar mi ubicación"**: pide GPS, abre un modal pequeño para ponerle nombre al territorio y llama a `claim_territory`. Al éxito, el círculo aparece con el nombre del nuevo guardián.
- Click sobre cualquier círculo abre el `ZoneSheet` existente para check-in / reportar / retar.

## 2. Fix del bug "no deja subir foto" en `Reportar.tsx`

- Reemplazar el `<input>` oculto envuelto en `<label>` por dos botones explícitos:
  - **"Tomar foto"** → input con `capture="environment"`.
  - **"Subir desde galería"** → input sin `capture`.
  El truco actual (label + capture) bloquea la galería en varios navegadores móviles y por eso "no pasa nada".
- Manejar errores de la edge function de análisis sin bloquear el botón de enviar: si la IA falla por red/timeout, mostrar aviso pero permitir enviar igual (la validación GPS + foto sigue siendo obligatoria).
- Añadir `console.error` y `toast` con el mensaje real de Supabase Storage para depurar si el bucket o las políticas fallan en producción.

## 3. Detalles técnicos

- Archivos modificados:
  - `supabase/migrations/<nueva>.sql` (limpieza + claim_territory + radius).
  - `src/components/marvi/ConquestMap.tsx` (círculos + tooltip permanente + botón conquistar).
  - Nuevo `src/components/marvi/ClaimTerritoryDialog.tsx`.
  - `src/lib/marvi-queries.ts` (hook `useClaimTerritory`, tipos).
  - `src/pages/Reportar.tsx` (dos botones foto, manejo de errores).
- Sin cambios en autenticación ni en el flujo de IA de detección de imágenes generadas.

## Lo que NO se toca

- Diseño visual general, racha de 7 días, ranking, panel de misiones, sistema de roles.
