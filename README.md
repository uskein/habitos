# App Hábitos — Pulse Clay

App móvil **local-first** de hábitos, metas y bienestar con gamificación. **100 % offline**: SQLite como fuente de verdad, outbox preparado para sincronización futura (Fase 2).

- **Stack:** Expo SDK 57 · React Native 0.86 · Expo Router 5 · TypeScript 6 · expo-sqlite · TanStack Query · Reanimated 4 · Zod
- **Identidad visual:** «Pulse Clay» — SSOT en `apps/mobile/src/core/theme/theme.ts`
- **Docs fuente:** `Artefactos/documentación/` (producto, flujos, arquitectura, diseño)

---

## 📥 Descarga directa (para probar)

| Build | Tipo | versionCode | Enlace |
|-------|------|-------------|--------|
| **Preview (instalable)** | `.apk` | 4 | [⬇️ Descargar APK](https://expo.dev/artifacts/eas/m0EBwM3O1ckRRzvggOcfwxRCAXGAgu2NMQc55QqkNmk.apk) |
| **Production (Play Store)** | `.aab` | 4 | [📦 Ver en Expo](https://expo.dev/artifacts/eas/W18FWZJR3vIh89KA8LiKEPMZpSR0CZBMBhGTFA-6n0E.aab) |

> **Instalar el APK:** descarga el archivo en tu Android, abre el archivo y acepta la instalación. Requiere Android 8+ (API 26).

---

## 🚀 Puesta en marcha

```powershell
# 1. Clonar e instalar dependencias
git clone https://github.com/uskein/habitos.git
cd habitos
npm install                 # raíz del monorepo (instala todos los workspaces)

# 2. Desarrollo local
cd apps\mobile
npx expo start --dev-client # con el dev client instalado en el móvil
```

### Builds propios

```powershell
cd apps\mobile
npx eas-cli@latest build --platform android --profile development   # APK de desarrollo
npx eas-cli@latest build --platform android --profile preview       # APK de preview (instalable)
npx eas-cli@latest build --platform android --profile production    # AAB de producción (Play Store)
```

---

## 📱 Funcionalidades completas

### 🏠 Tabs principales (5)

| Tab | Icono | Descripción |
|-----|-------|-------------|
| **Hoy** | `today` | Feed del día: racha, progreso, tarjetas de hábitos (toggle + hold archivar), check-in bienestar, motivaciones (swipe guardar/descartar) |
| **Plan** | `list` | Chips Hábitos/Metas; lista de hábitos (cards con badge, meta, tramo, ✓ Hoy) + metas (GoalCard con progreso, barra, %); **long-press → eliminar meta** |
| **Top Hitos** ⭐ | `sparkles` | **Nueva** — Hero del hito más reciente (foto full-bleed + velo + badge ¡Nuevo! + kicker + Ver detalle) + grid 2-cols creativo (foto/placeholder + chip fecha + título + meta) + tap → detalle; 4 estados R9 |
| **Logros** | `trophy` | Vitrina de medallas (nivel + calendario + medallas custom), botón ❄ freeze racha, CelebrationWatcher modal 4s |
| **Perfil** | `person-circle` | Avatar (picker + gradiente fallback), nombre, PIN/biometría (scrypt + backoff), datos/export/import backup cifrado, bloquear ahora, crédito + link git |

### 🔄 Flujos jugables (F1–F23)

**V1 (F1–F9):** Primer arranque, crear/marcar hábito, check-in, progreso de meta, rutina de regreso, PIN ×5 → rate-limited, nombre inválido, rollback BD, check-in duplicado.

**V2 (F10–F19):** Hitos (crear/detalle/carrusel/actividad), medallas custom, motivaciones swipe, stats extendidas.

**V2.1 (F20–F23):** Racha con freeze, backup cifrado, hito compartible, horarios por hábito.

**V2.2 (M26–M28):** Fix compartir hito, hora dispositivo real, Plan UI, ChipsTabs fix, tab Top Hitos.

---

### 🧩 Módulos V2 (M12–M28)

| ID | Módulo | Highlights |
|----|--------|------------|
| M12 | Base V2 | 4 deps nuevas, migración 5 tablas, repos milestone/motivation |
| M13 | Foto + crédito | `imageStore` FileSystem, `ClayAvatarPicker`, avatar + link git |
| M14 | Loader PIN | Overlay blur + spinner 800ms lineal, haptic, pad deshabilitado |
| M15 | Hitos creación | `new-hito` formSheet (Zod: 1-80 chars, ≥1 liga, ≤10 fotos), tx atómica |
| M16 | Hitos detalle | `hito/[id]` carrusel (ClayCarousel), comentarios ≤500, accesos cruzados, borrar + limpieza FS |
| M17 | Plan enriquecido | GoalCard barra progreso, notas `goal/[id]`, stats meta (ClayBars 7d + Victory hora pico) |
| M18 | Medallas custom | `evaluateEvent` extensible, `new-logro` sheet, pestaña Mis logros, semillas bloqueadas |
| M19 | Motivaciones | `motivationQueueService` puro, `new-motivacion` preview, SwipeCard Hoy (stamps, deshacer) |
| M20 | Stats extendidas | Tasa 30d, distribución hora (Skia), tendencia, filtro tramo + ChipsTabs |
| M22 | Racha freeze | 2/mes, auto-consume al romper, botón ❄ Logros, contador StreakCard |
| M23 | Backup cifrado | scrypt(N=16384) + AES-256-GCM (`@noble/ciphers`), export/import Zod+tx+rollback, fotos base64 |
| M24 | Hito compartible | Skia 1080×1080 offscreen → PNG → expo-sharing, `SHARE_RENDER_FAILED` retry in-situ |
| M25 | Horarios por hábito | `time_slot` (morning/afternoon/evening/null), orden en Hoy, filtro stats, chips new-habit |
| **M26** | **Fix SHARE + hora** | 3-tier typeface fallback, `setEmbolden(1)` fix JSI, `deviceHour()` UTC→local global |
| **M27** | **Plan UI + ChipsTabs** | Listas pegadas a tabs, long-press eliminar metas, `flexGrow:0` elimina contenedor vacío |
| **M28** | **Top Hitos** | Tab 5 (sparkles): hero + grid 2-cols + 4 estados R9 + detalle |

---

## 🛠 Comandos

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `npm run typecheck` | `apps/mobile` o `packages/shared` | `tsc --noEmit` |
| `npm test` | `apps/mobile` | Jest (jest-expo): dominio puro |
| `npx expo-doctor` | `apps/mobile` | Diagnóstico del proyecto (21 checks) |
| `npx expo export --platform android` | `apps/mobile` | Bundle de verificación |
| `npm run android` | `apps/mobile` | Dev server + abre en Android |

---

## 🏗 Arquitectura en 30 seg

- **Rutas** en `app/` (Expo Router): `(tabs)/` Hoy·Plan·Top Hitos·Logros·Perfil, `(modals)/` sheets, `goal/[id]`, `habit/[id]`, `hito/[id]`.
- **Pantallas** siempre con 4 estados: Loading (Skeleton) · Empty · Success · Error (retry in-situ, R9).
- **Datos** solo vía repositorios (`src/core/repositories/`); SQL exclusivamente ahí y en `src/core/data/`. Contratos: `CONTRATOS_API.md`.
- **Escrituras transaccionales:** `toggleLog` y `addProgress` atómicas (rollback + outbox + evaluación logros).
- **Seguridad:** PIN hash scrypt en SecureStore (nunca SQLite), backoff 5 fallos → `RATE_LIMITED`, auto-lock AppState (R4).
- **Zod v4:** `.partial()` no admite schemas con `.refine()` — derivar del shape base (`habit.schema.ts`).

---

## 📚 Documentación

| Doc | Contenido |
|-----|-----------|
| `Artefactos/documentación/Producto y Flujos/` | HU, sitemap R1–R13, blueprints, flujos F1–F23 |
| `Artefactos/documentación/Diseño Visual/manual-identidad-visual.md` | Design System Pulse Clay |
| `Artefactos/documentación/Arquitectura/` | Stack, modelo de datos, contratos, estructura |
| `Artefactos/documentación/Orquestador/PLAN_DE_SPRINTS.md` | Plan, decisiones y bitácora completa |

---

## 🏷 Versión actual

- **Git tag / commit:** `a53b0fd` (main)
- **versionCode:** 4
- **appVersion:** 1.0.0
- **SDK:** Expo 57 / RN 0.86
- **Build IDs EAS:** `fa2baec7` (AAB) · `6e2b5cfa` (APK preview)

---

## 📄 Licencia

Proyecto privado — desarrollado por y para **Uskein**.

---

> **¿Problemas al instalar?** Asegúrate de tener "Orígenes desconocidos" habilitado en Ajustes → Seguridad. El APK es firmado con credenciales de Expo EAS (keystore remoto).