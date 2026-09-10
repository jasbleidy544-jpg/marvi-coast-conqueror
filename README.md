# MARVI

Necesito crear una aplicación móvil y web funcional llamada MARVI, enfocada en la limpieza y sostenibilidad de playas, basada en un sistema de juego y conquista territorial. La app debe ser visualmente atractiva, profesional y totalmente funcional.

FUNCIONALIDADES PRINCIPALES:

1. MAPA Y CONQUISTA DE TERRITORIOS:

◦ Mostrar un mapa interactivo donde la costa está dividida en zonas/metros de playa.

◦ Las zonas empiezan en estado "Crítico/Sucia".

◦ El usuario puede seleccionar una zona para "Conquistarla". Debe limpiarla y reportarla.

◦ REGLA IMPORTANTE: Para mantener la zona, el usuario debe ingresar y trabajar en ella durante 7 días seguidos. Si falta un día, la zona se "ensucia virtualmente" y queda vulnerable. Si cumple los 7 días, la zona se marca como "Protegida" y aparece su nombre como "Guardián".

2. SISTEMA DE COMPETENCIA:

◦ Si un usuario pasa por una zona que ya tiene dueño, puede intentar quitársela.

◦ LA REGLA DE ORO: Gana la zona quien tenga MÁS TONELADAS DE RESIDUOS RECOLECTADOS en total. Si yo tengo más toneladas que el dueño actual, me quedo con su metro de playa automáticamente.

◦ El sistema debe comparar las estadísticas de toneladas para definir al ganador.

3. SECCIÓN DE PATROCINIOS Y MARCAS:

◦ Panel especial donde marcas locales de Santa Marta pueden ver el rendimiento y estadísticas de los usuarios.

◦ Las marcas pueden "Adoptar" al usuario que tenga más metros conquistados y más toneladas recolectadas.

◦ Al adoptar, la marca aparece en el mapa junto al usuario y su territorio como respaldo oficial.

4. EVENTOS Y TORNEOS ESPECIALES:

◦ Crear competiciones programadas como el "Reto Limpia-Playa" o torneos mensuales.

◦ En estos eventos, los usuarios tienen tiempo límite para conquistar la mayor cantidad de zonas posible.

◦ Estas actividades serán patrocinadas para dar premios y visibilidad.

5. SISTEMA DE PUNTOS, RANKING Y LOGROS:

◦ Medir puntos, cantidad de residuos en toneladas/kilos y metros de playa protegidos.

◦ Ranking general y por zonas.

◦ Insignias: "Defensor de la Bahía", "Rey de la Costa", etc.

6. REPORTES:

◦ Formulario para reportar basura, subir fotos y registrar cantidad de residuos.

OBJETIVO: Que la app MARVI sea totalmente funcional, navegable, con mapa en tiempo real y que toda la lógica de competencia por toneladas y días funcione correctamente.

DISEÑO: Colores que representen el mar, la arena y la ecología. Interface moderna estilo juego/gamer.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://marvi-coast-conqueror.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/acbc7ba6-df63-4a9c-9d76-8d840497bd3d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
