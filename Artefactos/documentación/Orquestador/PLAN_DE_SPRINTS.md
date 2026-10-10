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
faseActual: "Paso 4 (implementación V2)" — M12→M20 + S15 (M22-M25) COMPLETOS; M21 (pulido/entrega) en curso: validación técnica ✓ (tsc, doctor 21/21, Jest 36/36, export 7.2MB), faltan docs+CI+commit+builds EAS
progreso: V1 100% — V2: skills 1-3 completas; orquestador Pasos 0-3 ✓; implementación M12-M20 + S15 ✓; M21 en curso
esperaActiva: Paso 5 (aprobación de flujos V2 en device) y Paso 10 (entrega V2 con builds EAS)
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
  - EAS build falló ×1: sin git en la raíz EAS subía solo apps/mobile → 404 @habitos/shared;
    solución = git init en la raíz del monorepo (commit f9d6647) + eliminar .git anidado en apps/mobile
  - eas.json creado (development: devClient + apk interno); expo-dev-client ~57.0.19 instalado
  - BUG runtime en device: `UpdateHabitInput = CreateHabitInput.partial()` → Zod v4 prohíbe
    .partial() sobre schemas con .refine() (rompía el import de @habitos/shared y TODAS las
    rutas de expo-router); fix = separar HabitInputShape base + refines propios (smoke 4/4)
  - UI device: safe-area en tab bar (insets.bottom, RN v7 usa sceneStyle no sceneContainerStyle),
    safe top en AppBar, gutters 16→24 en 6 pantallas + 5 sheets (feedback del usuario en F1–F9)
  - S6/M10: reduce-motion (R8) con useReducedMotion en HabitCard (+1🔥/check pop),
    ClayButton (scale), ClayToggle (thumb/track), ClayCheckbox (pop) — valores directos sin timing
  - S6/M10: 3 fallos WCAG AA corregidos con tokens DS: textLocked→textMuted (sin opacity),
    kicker celebración→badgeTints.warning.text, +1🔥→badgeTints.danger.text
  - S6/M11: Jest con preset jest-expo (typecheck solo pasa con types:["jest","react","react-native"]
    en tsconfig — TS 6.0 no autoincluye @types del monorepo); 14 tests de dominio
  - S6/M11: @types/jest bajado a 29.5.14 (Expo SDK 57 lo exige; 30.0.0 rompe doctor)
  - S6/M11: README.md (raíz), CONTRIBUTING.md, .github/workflows/ci.yml (typecheck×2 + test)
  - V2/M12-M20: implementación completa (tsc ✓); stats compartidas: HourlyChart extraído a ui/feedback
    (victory-native 42: render prop {points, chartBounds}, tickCount exige {x,y})
  - V2/M22 (HU-27): computeStreak + freezesAvailable (default 0 = V1 intacto; los días congelados
    SUMAN a la racha, semántica "como si se completara"); auto-consume en recomputeStreaks global;
    StreakRepository (renombrado de StreakFreezeRepository) con consume/release/hasFreeze;
    FREEZE_MONTHLY_QUOTA=2 de shared; botón ❄ en Logros + contador en StreakCard
  - V2/M23 (HU-28): scrypt(N=16384) + AES-256-GCM vía @noble/ciphers (ESM-only →
    transformIgnorePatterns de Jest ampliado con @noble/*); formato MAGIC|salt|nonce|ciphertext;
    BACKUP_PASSWORD_INVALID vs BACKUP_CORRUPT distinguibles; fotos base64 dentro del JSON cifrado
    (helpers bytesToBase64/base64ToBytes propios — Hermes sin Buffer); import con validación Zod
    completa + tx con rollback + limpieza de fotos huérfanas en catch; modal (modals)/backup
  - V2/M24 (HU-29): milestoneShareService.render — Skia Surface.MakeOffscreen 1080×1080,
    gradiente Pulse Clay + foto clipRRect + textos con fuente default (Skia.Font(undefined, size);
    Typeface.MakeDefault no existe en Skia 2.6), encodeToBase64 PNG; SHARE_RENDER_FAILED con
    retry in-situ en hito/[id]
  - V2/M25 (HU-30): hourInSlot con wrap evening 20→4 (cobertura 24 h sin solaparse, test);
    time_slot en HABIT_COLS/toHabit/create/update; ORDER BY tramo en listByDate (null al final);
    getHabitStats + filtro timeSlot (caché por slot) con ChipsTabs en stats del hábito
  - V2/M23 nota: habit_schedule no la usa ningún repo → fuera del backup (solo tablas con datos)
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
| EAS build development (Android APK) | ✔ FINISHED — `Bw91xtSHzfo0yuAoa3Xk6vsE0Znd3JXszMOa24vKBfU.apk` (2026-10-10) |
| Bug Zod v4 `.partial()+.refine()` en device | ✔ fix HabitInputShape + smoke 4/4; usuario: app funciona |
| UI device: safe-area tab bar + gutters 24 | ✔ usuario: «quedó perfecto» (F1–F9 parcial: onboarding, crear/marcar hábito OK) |
| **PASO 5 — Flujos** | ✅ **APROBADO por el usuario (2026-10-10)** — F1–F9 en device |
| M10: reduce-motion R8 (4 componentes) | ✔ HabitCard, ClayButton, ClayToggle, ClayCheckbox con useReducedMotion |
| M10: WCAG AA contrastes | ✔ 3 fixes (textLocked, kicker celebración, +1🔥) — solo tokens del DS |
| `tsc --noEmit` post-M10/M11 | ✔ limpio (mobile + shared) |
| Jest (jest-expo) | ✔ 2 suites, 14/14 tests (streakCalculator, evaluateEvent idempotente) |
| `expo-doctor` | ✔ 21/21 (@types/jest @29.5.14) |
| `expo export --platform android` | ✔ bundle hbc 5.6 MB |
| README + CONTRIBUTING + CI workflow | ✔ raíz del monorepo (typecheck ×2 + jest en CI) |
| **EAS build production (AAB)** | ✔ FINISHED (2026-10-10) — `unfXweBKdIYXIQyweFWg4AaahcK4j3cHSP43UB8_VMc.aab` (versionCode 2) |
| **EAS build preview (APK instalable)** | ✔ FINISHED (2026-10-10) — `REr7f6OpnEdQeB323-fnQ-M9qLPevzhnH19LNgi_95s.apk` |
| **M10 + M11 (S6)** | ✅ COMPLETADOS — **Paso 10 (Entrega)** = espera activa final |
| **PASO 10 — Entrega V1** | ✅ **APROBADO por el usuario (2026-10-10)** — «ok me gusta» + AAB y APK FINISHED |
| Inicio V2 | 🔄 Pipeline de skills en orden (identidad → arquitectura → flujos → orquestador) con alcance: imagen de perfil, loading PIN, hitos+carrusel, plan con notas/estadísticas, logros y medallas personalizables, motivaciones descartables |
| **V2 · M12–M20 (S7–S13)** | ✅ COMPLETADOS (2026-10-10) — base, foto/perfil, loader PIN, hitos (lista+detalle), plan enriquecido, medallas custom, motivaciones, stats extendidas |
| **V2 · S15 — M22 racha con freeze** | ✔ computeStreak+freezes, auto-consume, botón ❄ Logros, contador StreakCard, 6 tests nuevos (16/16 suite streak) |
| **V2 · S15 — M23 backup cifrado** | ✔ scrypt+AES-GCM (@noble/ciphers), export/import Zod+tx rollback, modal (modals)/backup, 7 tests crypto (bugs base64 '+'/'/' y padding corregidos) |
| **V2 · S15 — M24 hito compartible** | ✔ Skia offscreen 1080×1080 → PNG → expo-sharing, SHARE_RENDER_FAILED retry in-situ |
| **V2 · S15 — M25 horarios por hábito** | ✔ time_slot end-to-end (create/update/ORDER BY tramo), filtro de stats con ChipsTabs, chips en new-habit, 4 tests hourInSlot (24 h sin solaparse) |
| `tsc --noEmit` post-V2 (mobile + shared) | ✔ limpio |
| Jest (jest-expo) post-V2 | ✔ 5 suites, 36/36 tests |
| `expo-doctor` post-V2 | ✔ 21/21 |
| `expo export --platform android` post-V2 | ✔ bundle hbc 7.2 MB |
| Reduced-motion/WCAG recheck (M21) | ⏳ pendiente de verificación |
| Docs/CI/commit/builds EAS (M21) | ⏳ en curso |

---

## V2 — Pipeline de skills (inicio 2026-10-10)

### Estado
`
faseActual: "V2 - Skills 1 (identidad) y 2 (arquitectura) COMPLETAS + Skill 3 (arquitecto-producto-flujos) Pasos 2-6 completos"
siguiente: aprobacion del Paso 6 -> orquestador-proyecto -> implementacion V2 -> Paso 10 V2
esperaActiva: aprobacion del Paso 6 (hub + 4 MD de Producto y Flujos extendidos)
`

### Decisiones V2 aprobadas
- Identidad: extender Pulse Clay (sin cambios de token); prototipo A (inmersivo) aprobado; manual SSOT extensido en section 8; showcase identidad-visual-v2.html.
- Loading PIN: overlay blur 10 + spinner clay 320/800 ms, pad visible deshabilitado, salida <=1 s con haptic.
- Charts: COMBINACION de las 3 (Views+Reanimated barras, Skia sparklines, victory-native drill-down) + alcance en habitos, metas E hitos.
- Motivaciones: swipe direccional con stamps (der=guardar, izq=descartar).
- Alineacion tecnico-visual V1: aprobada (con visuales de creacion: hito, motivacion, logro/medalla).
- Stack V2: +expo-image-picker, +expo-image-manipulator, +datetimepicker, +victory-native (4 deps nuevas; Skia ya estaba).
- Arquitectura V2: evaluateEvent extensible, motivationQueueService puro, stats_cache, FileSystem para fotos.
- DevOps/Seguridad V2: aprobada + icono "H" (letra blanca, fondo primary #6D4BF5) + credito "Desarrollado para y por Uskein" en Perfil + link git en Perfil.
- Remoto git creado y vinculado: https://github.com/uskein/habitos (privado, main con tracking).
- Iconos generados: icon.png 1024, adaptive foreground/background, favicon, splash-icon (fuente Sora) + registrados en app.json (icon, splash, adaptiveIcon).
- Documentacion arquitectonica V2 anadida a los 5 MD (ADR-008..012, tablas 2.8-2.12, contratos repos V2, runbook).
- Skill 3 (arquitecto-producto-flujos): Paso 2 aprobado = epis 6-12, HU-14..HU-26 + showcase Requerimientos/REQUERIMIENTOS_VISUAL.html.
- Skill 3 Paso 3 aprobado = sitemap 23 nodos (hitos, stats, creadores) + showcase ArquitecturaInformacion/ARQUITECTURA_INFORMACION_VISUAL.html; reglas nuevas R10-R13.
- Skill 3 Paso 4 aprobado = 12 blueprints V2 x 4 estados (48 estados) + storybook Blueprints/BLUEPRINTS_VISUAL.html con selector de estados.
- Skill 3 Paso 5 aprobado = 10 flujos F10-F19 (happy + borde) + simulacion jugable Flujos/FLUJOS_VISUAL.html.
- Skill 3 Paso 6 = hub INDICE_DOCUMENTACION.html + extension de los 4 MD de Producto y Flujos (epicas 6-12, R10-R13, 12 pantallas, F10-F19, reglas 6-10).
- Rutas de showcases V2 bajo carpeta "documentación" (con tilde) por coherencia con la carpeta existente.
- Remoto git https://github.com/uskein/habitos vinculado a origin/main (commits V1: f9d6647, f81a98d, 2208a5c, 617ddbb).

---

## V2 - Plan de sprints (Paso 1 del orquestador)

### Desglose en m�dulos (M12...M21), priorizado por dependencias

| Sprint | M�dulo | Tareas | HU / Flujos | Complejidad |
|---|---|---|---|---|
| S7 | **M12 � Base V2** | Instalar 4 deps (image-picker, image-manipulator, datetimepicker, victory-native); token `chartArea` en theme.ts; migraci�n de 5 tablas (milestone*, motivation*, achievement is_custom, stats_cache, photo_uri) en _migrations; repositorios `milestoneRepository`, `motivationRepository` + extensiones de `achievementRepository` | MODELO �2.8-2.12, CONTRATOS V2 | Media |
| S7 | **M13 � Foto + cr�dito** | `imageStore` (FileSystem + UUID, compresi�n 250 KB/2 MB); `ClayAvatarPicker`; foto de perfil en Perfil con 4 estados + fallback gradiente; cr�dito �Uskein� + link git (Linking) | HU-14/15, F10, BP 9 | Media |
| S8 | **M14 � Loader PIN** | `ClayLoader` overlay blur 10 + spinner 800 ms lineal; validate() con haptic success/error/timeout; pad deshabilitado; reduced-motion (frame est�tico); backoff F6 intacto | HU-16, F11, R13, BP 10 | Baja |
| S9 | **M15 � Hitos (creaci�n)** | sheet `new-hito` formSheet (Zod: nombre 1-80, >=1 liga, <=10 fotos); guardado transaccional hito+imagenes+links; lista `hitos/index` en stack con back R10 | HU-17, F12, BP 12/14 | Alta |
| S9 | **M16 � Hitos (detalle)** | `hito/[id]`: ClayCarousel (snap 320 ms, dots, contador), comentarios <=500; accesos cruzados habito->hitos, hito->stats; borrar con confirmacion + limpieza FileSystem | HU-18, F13, BP 13 | Alta |
| S10 | **M17 � Plan enriquecido** | Barra de progreso en GoalCard; notas en `goal/[id]` (tx GOAL_UPDATE); seccion stats meta: ClayBars 7 barras dia + Victory hora pico + empty/error retry | HU-19/20, F18, BP 18 | Media |
| S11 | **M18 � Medallas custom** | `evaluateEvent` extensivo (habit_ids/goal_ids, mode any|all); sheet `new-logro`; pestana Mis logros; edicion/borrado con confirmacion (semillas bloqueadas); CelebrationWatcher sin cambios de contrato | HU-21-23, F14/F15, BP 16/17 | Alta |
| S12 | **M19 � Motivaciones** | `motivationQueueService` puro (<=5, orden, exclusion MOTIVATION_SHOW); sheet `new-motivacion` con preview; SwipeCard en Hoy (umbral 90 px, stamps, deshacer, reduced-motion, botones accesibles) | HU-24/25, F16/F17, R11, BP 11/15 | Alta |
| S13 | **M20 � Stats extendidas** | `getHabitStats` (tasa 30 d, hora, tendencia Skia); stats en `habit/[id]`; actividad de hito (semana antes/despu�s) | HU-26, F19, BP 19 | Media |
| S14 | **M21 � Pulido y entrega V2** | Reduced-motion global, WCAG recheck, Jest nuevos (evaluateEvent extensivo, motivationQueue, milestone tx), tsc/doctor/export, docs (README/hub), CI, commit+push, builds EAS | Paso 8-10 | Media |

### Orden y dependencias

```
M12 (base) -> M13 (fotos)      M14 (loader)     [paralelizables]
M12 -> M15 -> M16 (hitos)      M12 -> M17 (plan)
M12 -> M18 (medallas)          M12 -> M19 (motivaciones)
M15 -> M20 (stats usan hitos)  M21 cierra todo
```

### Esperas activas del orquestador

- Paso 1: aprobacion de ESTE plan.
- Paso 3: aprobacion del Design System V2 implementado (componentes nuevos: ClayLoader, ClayCarousel, SwipeCard, ClayAvatarPicker, ClayBars).
- Paso 5: aprobacion de los flujos V2 integrados en device.
- Paso 10: aprobacion de la entrega V2 (builds EAS).
- Backend y integraciones 6-7: NO APLICAN (local-first; ADR-001 deja sync en Fase 2).

### Criterios de verificacion por sprint

1. `npx tsc --noEmit` limpio (apps/mobile + packages/shared).
2. `npx expo-doctor` >= 21/21 y `expo install --check` up to date.
3. Guard hex: literales SOLO en `src/core/theme/theme.ts`.
4. 4 estados por pantalla nueva (Loading/Empty/Success/Error-R9).
5. Jest: suites nuevas >= 14 + nuevas (sin romper las existentes).
6. `expo export --platform android` sin errores.

### Sprint adicional S15 � Mejoras aprobadas (2026-10-10)

El usuario selecciono las 4 mejoras sugeridas -> alcance V2 completo.

| Sprint | Modulo | Tareas | HU | Complejidad |
|---|---|---|---|---|
| S15 | **M22 � Racha con freeze** | Tabla streak_freeze (2/mes); boton estrella en Logros con confirmacion; streakCalculator: consume freeze al romper racha; contador mono en StreakCard | HU-27, F20 | Media |
| S15 | **M23 � Backup cifrado** | Perfil > Datos: exportar JSON cifrado (AES-GCM via @noble/ciphers o hash+XOR simple -> decision tecnica en M23) con fotos; importar con validacion Zod previa; 4 estados | HU-28, F21 | Alta |
| S15 | **M24 � Hito compartible** | Render Skia 1080x1080 (fondo gradiente + foto + texto + cr�dito) + expo-sharing; boton compartir en hito/[id] | HU-29, F22 | Media |
| S15 | **M25 � Horarios por habito** | habits.time_slot (morning/afternoon/evening/null); orden por tramo en Hoy; filtros de stats por tramo; chips en new-habit | HU-30, F23 | Media |

Orden: M20 -> M22/M24/M25 (independientes entre si) -> M23 -> M21 (entrega).

### Decisiones derivadas (documentadas)

- Las 4 mejoras amplian contratos -> seccion V2.1 anadida a REQUERIMIENTOS, MODELO_DE_DATOS (2.13), CONTRATOS_API (V2.1), BLUEPRINTS (1.2) y FLUJOS (F20-F23).
- Deps nuevas: expo-sharing (M24); @noble/ciphers valorado en M23.
- Presupuesto de deps V2: 5 deps (4 originales + expo-sharing).
