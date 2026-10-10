# PLAN_DE_SPRINTS — App Hábitos (Orquestador)

> **Fase:** Orquestador · **Paso 1** · Aprobado por el usuario
> **Fecha:** 2026-10-09 · **Base:** `ESTRUCTURA_DIRECTORIOS.md`, `README_ARQUITECTURA.md`, `BLUEPRINTS_DE_PANTALLAS.md`, `FLUJOS_DE_USUARIO.md`

---

## 1. Módulos y dependencias

| ID | Módulo | Contenido | Depende de | Complejidad |
|---|---|---|---|---|
| **M0** | Fundación | Monorepo Expo, estructura de `ESTRUCTURA_DIRECTORIOS.md`, design tokens Pulse Clay, `.env`, git | — | Media |
| **M1** | Design System | Componentes DS (botones, inputs, chips, cards, sheets, toast, badges, progress, skeleton, empty, avatar, tab bar, FAB) + `COMPONENTS_SHOWCASE` | M0 | **Alta** |
| **M2** | Núcleo de datos | SQLite (12 tablas), repositorios (`HabitRepository`, `GoalRepository`, `WellbeingRepository`, `AchievementRepository`, `AuthRepository`), Zod en `packages/shared`, outbox | M0 | **Alta** |
| **M3** | Onboarding + Lock | HU-1…HU-3, PIN scrypt + biometría, `RATE_LIMITED`, overlay global AppState (R4) | M1, M2 | Media |
| **M4** | Tab Hoy | Feed, StreakCard, Progress, HabitCard, `toggleLog` + microinteracciones (HU-5, HU-6, HU-12), 4 estados | M1, M2 | **Alta** |
| **M5** | Tab Plan | Chips-tabs Hábitos/Metas, `goal/[id]`, `habit/[id]`, archivar (HU-7…HU-10) | M1, M2 | Media |
| **M6** | Sheets de creación | `new-habit`, `new-goal`, `check-in` con validación Zod y upsert (HU-4, HU-9, HU-11) | M2, M4 | Media |
| **M7** | Logros + Celebración | Vitrina, medallas, `evaluateAndUnlock`, modal 4 s (HU-13, R5) | M4 | Baja |
| **M8** | Perfil + Ajustes | Avatar, seguridad, datos/export, toggles, bloquear ahora | M3 | Baja |
| **M9** | Flujos e integración | Los 9 flujos completos (F1–F9), incl. críticos F6/F8 | M3–M8 | **Alta** |
| **M10** | Pulido | Performance (60 fps Reanimated), WCAG AA, reduce-motion (R8), lazy | M9 | Media |
| **M11** | Entrega | README dev, guía de contribución, build EAS/producción, CI | M10 | Baja |

## 2. Cronograma (7 sprints × 2 semanas)

| Sprint | Módulos | Hitos del orquestador | Criterio de salida |
|---|---|---|---|
| **S0** | M0 + M1 | 🔵 **Paso 3 — Aprobación Design System** | `expo start` sin errores + showcase visual aprobado |
| **S1** | M2 + M3 | — | Onboarding completo → llega a Hoy; lock con PIN/biometría |
| **S2** | M4 + M6 (new-habit) | — | F2 «Crear hábito y marcarlo» jugable de punta a punta |
| **S3** | M5 + M6 (resto) | — | F3 (check-in) y F4 (meta) completos |
| **S4** | M7 + M8 | — | Vitrina + perfil con 4 estados cada pantalla |
| **S5** | M9 | 🔵 **Paso 5 — Aprobación de Flujos** | F1–F9 verificados manualmente, incl. rollback F6/F8 |
| **S6** | M10 + M11 | 🔵 **Paso 10 — Aprobación de Entrega** | Build de producción instalable + documentación dev |

## 3. Reglas de ejecución por tarea (save-guards)

1. Toda pantalla se implementa con sus **4 estados** (Loading/Empty/Success/Error) — `BLUEPRINTS_DE_PANTALLAS.md`.
2. Todo componente usa **exclusivamente** tokens de `manual-identidad-visual.md` (`core/theme/theme.ts`; hex literales prohibidos fuera de ese archivo).
3. Navegación estricta por **R1–R9** de `ARQUITECTURA_INFORMACION.md`.
4. Datos solo vía repositorios de `CONTRATOS_API.md`; SQL exclusivamente en `core/data` + `core/repositories`.
5. Validación continua: `tsc --noEmit` limpio + `expo start` sin errores rojos al cierre de cada sprint.
6. Backend/REST **no entra** en este plan (Fase 2; el outbox ya queda preparado en M2).
7. `core/domain` nunca importa React ni RN (regla 1 de `ESTRUCTURA_DIRECTORIOS.md`).

## 4. Estado del orquestador

```
faseActual: "Paso 4 → 5" → S5 completado (M1–M9 con sus 4 estados + F1–F9)
progreso: 78%
esperaActiva: PASO 5 (Aprobación de Flujos) — F1–F9 verificables, pendiente prueba manual en device
errores: []
decisiones:
  - Skills 1–3 previas aceptadas (nombres reales: identidad-visual-expressiva.html, manual-identidad-visual.md)
  - Plan de 7 sprints aprobado
  - @types/react fijado a ^19.3.0 (TS 6.0.3 + RN 0.86: la ~19.2.4 rompe la resolución JSX)
  - experiments.typedRoutes deshabilitado (el CLI hoisted en monorepo npm no resuelve expo-router/_ctx-shared)
  - Fuentes del DS como TTF variables locales en assets/fonts (sin @expo-google-fonts)
  - expo.install.exclude=@types/react para silenciar el mismatch menor en doctor
  - newArchEnabled/edgeToEdgeEnabled quitados de app.json (campos inválidos en SDK 57; son default)
  - Design System aprobado por el usuario (Paso 3 ✔)
  - Migrador SQL propio versionado (_migrations) en vez de Prisma CLI — mismo contrato MODELO §5
    (versionada en git, aplicada en arranque); Prisma queda como generador offline futuro
  - react-native-worklets fijado a 0.10.1 exacto (árbol npm workspaces con copia anidada 0.10.4
    → regenerar lock limpio: borrar package-lock + node_modules anidados + npm install)
  - MMKV v4 (nitro): createMMKV/getBoolean/getString/getNumber/set/remove
  - @noble/hashes v2: sin toHex → helper bytesToHex local; hexToBytes/utf8ToBytes desde utils.js
  - SessionGate global en _layout (boot → onboarding/lock/app) en vez de Redirects de ruta
  - Detalles goal/[id] y habit/[id] como rutas stack FUERA de (tabs) (tab bar solo en R1)
  - Contrato de repositorios intacto: statsRepository y sessionBus son agregados internos
    (no tocan repositoryInterfaces); changePin vive en pinStore, no en AuthRepository
  - Bloqueo inmediato desde Perfil vía sessionBus (emitter JS simple) → SessionGate
  - usuario profile sin updated_at (esquema MODELO) → updateName no lo usa
  - expo-linear-gradient instalado para avatar con gradiente del DS
  - S5: CelebrationWatcher observa la caché de medallas (nuevos unlocks) → modal 4 s (R5);
    sin tocar contratos — invalidación de ['achievements'] en toggle/create/upsert
  - S5: CheckInCard mini-card en Hoy (F3/F9 precarga el sheet); CTA disabled con Zod (F7)
  - S5: rutas goal/[id] e habit/[id] declaradas en Stack; modals change-pin/edit-profile como formSheet
```

## 5. Bitácora de validación

| Check | Resultado |
|---|---|
| `tsc --noEmit` (apps/mobile + packages/shared) | ✔ limpio (S1–S4) |
| `expo-doctor` | ✔ 21/21 |
| `expo install --check` | ✔ up to date |
| `expo start` (Metro) | ✔ Waiting on port, 0 errores |
| `expo export --platform android` | ✔ bundle hbc 5.5 MB (S1) → 5.6 MB (S4) |
| Smoke tests dominio (streakCalculator) | ✔ 7/7 (racha viva/rota/mejor/dup/vacío) |
| S1 criterio: onboarding HU-1…HU-3 + lock F6 | ✔ código completo; jugable en device (pendiente manual Fase S5) |
| S2 criterio: F2 crear hábito → marcarlo | ✔ código completo (Hoy 4 estados, FAB, new-habit Zod→BD, toast) |
| S3 criterio: F4 progreso de meta + HU-7/HU-8 | ✔ código completo (Plan 4 estados, goal/[id] delta, habit/[id] calendario, new-goal, check-in F9) |
| S4 criterio: HU-12/HU-13 + Perfil seguridad | ✔ código completo (Logros nivel/calendario/medallas, Perfil editar PIN/bio/lock/bloquear ahora) |
| Guard hex literales (solo `theme.ts`) | ✔ sin hex fuera del SSOT (tokens dangerSoft/awardSoft/secondarySoft/textFaded añadidos) |
| S5 criterio: F1–F9 + celebración R5 | ✔ código completo (C5 tablas F1; F2 FAB+sheet+toggle; F3 mini-card+sheet; F4 delta meta; F5 R4; F6 backoff; F7 CTA disabled; F8 transacción+toast; F9 upsert) |
| Checklist F1–F9 en device | ⏳ PENDIENTE — prueba manual al inicio del Paso 5 |
