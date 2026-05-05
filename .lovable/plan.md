# Plan: Zonas de Santa Marta + filtro por tipo en el mapa

## 1. Insertar zonas georreferenciadas (migración SQL `INSERT`)

Agregaré ~30 zonas reales de Santa Marta a la tabla `zones`, distribuidas en los 3 tipos del enum `zone_kind`:

**Costeras (coastal)** — ~12
- Playa Blanca, Playa Cristal, Neguanje, Cabo San Juan, Bahía Concha, Bonito Gordo, Inca Inca, Los Cocos, Playa Salguero, Pozos Colorados, Playa Grande, El Rodadero

**Urbanas (urban)** — ~10
- Centro Histórico, Bastidas, Pescaíto, Mamatoco, Manzanares, Gaira, Taganga (casco), Bonda, 11 de Noviembre, María Eugenia

**Rurales (rural)** — ~8
- Minca, Calabazo, Don Diego, Guachaca, Buritaca, Tigrera, La Tagua, Palomino (vía)

Cada fila incluye `id` (slug), `name`, `kind`, `lat`, `lng`, `meters`, `status` inicial (mezcla `critical` / `vulnerable`), `hazard_level` y `description` corta para SEO/Google. Uso `INSERT ... ON CONFLICT (id) DO NOTHING` para no romper datos existentes.

## 2. Filtro por tipo de zona en `ConquestMap`

En `src/components/marvi/ConquestMap.tsx`:
- Agregar estado `kindFilter: "all" | "coastal" | "urban" | "rural"`.
- Botones tipo pill flotantes arriba del mapa (Todas / Costeras / Urbanas / Rurales) usando los estilos glass existentes.
- Filtrar `zones` por `kindFilter` antes de renderizar los `CircleMarker`.
- Diferenciar visualmente cada tipo:
  - `coastal` → círculo (actual)
  - `urban` → cuadrado (usar `Marker` con `divIcon` cuadrado)
  - `rural` → triángulo/diamante (`divIcon`)
- Color sigue indicando estado (crítica/vulnerable/protegida); la forma indica tipo.
- Tooltip muestra también el tipo: `Costera · Crítica · 320m`.
- Actualizar la leyenda para incluir las 3 formas + colores de estado.

## 3. Detalles técnicos

- Migración: solo `INSERT` (sin cambios de schema). Coordenadas verificadas para Santa Marta (lat ~11.0–11.3, lng ~-74.4 a -73.6).
- `divIcon` de Leaflet con HTML+Tailwind inline para las formas urbana/rural.
- Sin cambios en RLS (ya permite SELECT público en `zones`).
- Sin cambios en tipos (`marvi-types.ts` ya tiene `ZoneKind`).

## 4. Resultado

- El mapa de la Home muestra la red completa de zonas reales de Santa Marta.
- El usuario puede filtrar por Costera / Urbana / Rural.
- Las descripciones y nombres reales hacen que cada zona sea fácil de googlear.
