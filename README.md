# App Hábitos — Pulse Clay

App móvil local-first de hábitos, metas y bienestar con gamificación. **100 % offline**: SQLite como fuente de verdad, outbox preparado para sincronización futura (Fase 2).

- **Stack:** Expo SDK 57 · React Native 0.86 · Expo Router 5 · TypeScript 6 · expo-sqlite · TanStack Query · Reanimated 4 · Zod
- **Identidad visual:** «Pulse Clay» — SSOT en `apps/mobile/src/core/theme/theme.ts`
- **Docs fuente:** `Artefactos/documentación/` (producto, flujos, arquitectura, diseño)

## Estructura (npm workspaces)

```
apps/mobile/     App Expo (rutas en app/, lógica en src/)
apps/server/     Backend REST (Fase 2 — congelado)
packages/shared/ Schemas Zod, constants y tipos compartidos
Artefactos/      Documentación aprobada (fuente de verdad)
```

## Requisitos

- Node ≥ 22 y npm 10
- Cuenta en [expo.dev](https://expo.dev) (para EAS builds)
- Expo Go **no** sirve: la app usa `react-native-mmkv` → necesita development build

## Puesta en marcha

```powershell
npm install                 # raíz del monorepo (instala todos los workspaces)
cd apps\mobile
npx expo start --dev-client # con el dev client instalado en el móvil
```

### Instalar en el dispositivo

```powershell
cd apps\mobile
npx eas-cli@latest build --platform android --profile development   # APK de desarrollo
npx eas-cli@latest build --platform android --profile production    # APK de producción
```

## Comandos

| Comando | Dónde | Qué hace |
|---|---|---|
| `npm run typecheck` | `apps/mobile` o `packages/shared` | `tsc --noEmit` |
| `npm test` | `apps/mobile` | Jest (jest-expo): dominio puro |
| `npx expo-doctor` | `apps/mobile` | Diagnóstico del proyecto (21 checks) |
| `npx expo export --platform android` | `apps/mobile` | Bundle de verificación |
| `npm run android` | `apps/mobile` | Dev server + abre en Android |

## Arquitectura en 30 segundos

- **Rutas** en `app/` (Expo Router): `(tabs)/` Hoy·Plan·Logros·Perfil, `(modals)/` sheets de creación, `goal/[id]`, `habit/[id]`.
- **Pantallas** siempre con 4 estados: Loading (Skeleton) · Empty · Success · Error (retry in-situ, R9).
- **Datos** solo vía repositorios (`src/core/repositories/`); SQL exclusivamente ahí y en `src/core/data/`. Contratos: `CONTRATOS_API.md`.
- **Escrituras transaccionales:** `toggleLog` y `addProgress` son atómicos (rollback + outbox + evaluación de logros).
- **Seguridad:** PIN como hash scrypt en SecureStore (nunca SQLite), backoff 5 fallos → `RATE_LIMITED`, auto-lock por AppState (R4).
- **Zod v4:** `.partial()` no admite schemas con `.refine()` — derivar del shape base (ver `habit.schema.ts`).

## Flujos (F1–F9)

Aprobados en device (Paso 5, `FLUJOS_DE_USUARIO.md`): primer arranque, crear/marcar hábito, check-in, progreso de meta, rutina de regreso, PIN ×5, nombre inválido, rollback de BD, check-in duplicado.

## V2 — Mejoras (M12–M25)

- **Fotos** (HU-14/17): avatar de perfil e imágenes de hito en `FileSystem` (UUID, ≤250 KB/2 MB).
- **Hitos** (HU-17/18): creación con ligazones y hasta 10 fotos, detalle con carrusel, actividad antes/después.
- **Plan enriquecido** (HU-19/20): notas de avance y stats de meta.
- **Medallas custom** (HU-21–23): criterios `habit_count`/`goal_complete`/`combined`, crear/editar/borrar.
- **Motivaciones** (HU-24/25): cola descartable en Hoy con «Deshacer».
- **Stats extendidas** (HU-26): tasa 30 d, distribución por hora, tendencia y filtro por tramo.
- **Racha con freeze** (HU-27): 2 freezes/mes, automático al romper racha, manual ❄ en Logros.
- **Backup cifrado** (HU-28): export/import con scrypt + AES-256-GCM (`(modals)/backup`).
- **Hito compartible** (HU-29): tarjeta 1080×1080 renderizada con Skia → sheet nativo.
- **Horarios por hábito** (HU-30): tramo mañana/tarde/noche, orden en Hoy y filtro de stats.

## Documentación

| Doc | Contenido |
|---|---|
| `Artefactos/documentación/Producto y Flujos/` | HU, sitemap R1–R9, blueprints, flujos F1–F9 |
| `Artefactos/documentación/Diseño Visual/manual-identidad-visual.md` | Design System Pulse Clay |
| `Artefactos/documentación/Arquitectura/` | Stack, modelo de datos, contratos, estructura |
| `Artefactos/documentación/Orquestador/PLAN_DE_SPRINTS.md` | Plan, decisiones y bitácora |
