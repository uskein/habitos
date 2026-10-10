# README_ARQUITECTURA — App Hábitos

> **Fuente de verdad** de la arquitectura técnica aprobada. Complementa al
> `manual-identidad-visual.md` (identidad visual). Toda implementación debe
> alinearse con este documento y sus ADR.

| Meta | Valor |
|---|---|
| Proyecto | App Hábitos (hábitos + metas + bienestar) |
| Plataforma | Móvil — iOS / Android (Expo/React Native) |
| Modelo operativo | **Local-first (100% offline en MVP)** |
| Versión | 1.0 |
| Fecha | 2026-10-09 |
| Estado | Aprobado |

---

## 1. Stack aprobado

### 1.1 Fase 1 — MVP (offline-first)

| Capa | Tecnología | Rol |
|---|---|---|
| Cliente | **React Native + Expo** (SDK actual) | App móvil iOS/Android |
| Animación | **Reanimated 3** | Springs/transforms en UI thread (60fps) |
| Render nativo | **react-native-skia** | Sombras clay (`inset`) — fidelidad al design system |
| Navegación | **expo-router** | Tabs + modals tipo bottom sheet |
| Bottom sheets | **@gorhom/bottom-sheet** + gesture-handler | Patrón de modales Pulse Clay |
| Blur | **expo-blur** | Tab bar translúcida (fallback sólido en gama baja) |
| Persistencia | **SQLite (`expo-sqlite`)** | **SSOT local** — funciona sin internet |
| KV / preferencias | **MMKV** | Clave-valor rápida |
| Credenciales | **expo-secure-store** | PIN hasheado (scrypt), biometría |
| Estado servidor/local | **TanStack Query** | Orquesta lecturas asíncronas de repositorios |
| Estado global UI | **Zustand** | Sesión, tema, onboarding, flags |
| Formularios | **react-hook-form + Zod** | Validación con schemas compartidos |
| Contratos | **Zod en `packages/shared`** | Tipos únicos cliente→servidor futuro |
| Migraciones | **Prisma Migrate (SQLite)** | Esquema versionado desde el commit 1 |
| Fuentes | **Sora · Plus Jakarta Sans · JetBrains Mono** (TTF propias) | Tipografía del manual visual |
| Tests | **Jest** (+ Maestro E2E futuro) | Unit: domain/ repos |

### 1.2 Fase 2 — diferida (sync opcional, NO implementar aún)

| Capa | Tecnología |
|---|---|
| Backend | Node.js + **NestJS** (monolito modular) |
| BD servidor | **PostgreSQL 16+** |
| Cache/jobs | **Redis + BullMQ** |
| API | REST + WebSocket (gateways Nest) |
| Auth cloud | JWT RS256 (15min) + refresh rotación |
| Infra | Docker Compose (api + postgres + redis) |

## 2. Patrones arquitectónicos

- **Cliente:** Clean Architecture ligera en 3 capas:
  - `core/domain/` — entidades y reglas de negocio **puras** (sin I/O, sin React/RN).
  - `core/data/` + `core/repositories/` — implementación sobre SQLite/MMKV/SecureStore tras interfaces.
  - `features/*` + `app/` — presentación (hooks + components + screens thin).
- **Comunicación MVP:** sin red. Las pantallas consultan **repositorios**, nunca SQLite directamente. Añadir sync = nueva implementación del repositorio, no cambio de arquitectura.
- **Sync futuro (diseñado, no implementado):** tabla `outbox` en SQLite + `updated_at` + `sync_status`; motor de sync sube outbox y baja deltas (`last-write-wins`).
- **Estado (jerarquía estricta):**

```
Animación        → Reanimated shared values   (hilo UI, cero re-renders)
Datos local      → TanStack Query             (cachea repositorios)
Global de UI     → Zustand                    (session, theme, flags)
Formularios      → react-hook-form + Zod
Persistencia KV  → MMKV
Persistencia RL  → SQLite
```

## 3. Decisiones de diseño (ADR resumidos)

Ver `ADR-*.md` dentro de este documento (sección 4). Resumen:

| ADR | Decisión | Estado |
|---|---|---|
| ADR-001 | Local-first con SQLite como SSOT; NestJS/Postgres diferidos | ✅ Aprobada |
| ADR-002 | React Native + Expo (no Flutter ni nativo) | ✅ Aprobada |
| ADR-003 | Sombras clay vía Skia encapsuladas en `<ClaySurface>` | ✅ Aprobada |
| ADR-004 | Monorepo ligero npm workspaces (`apps/` + `packages/shared`) | ✅ Aprobada |
| ADR-005 | Auth MVP local (PIN+biometría); cuentas cloud en Fase 2 | ✅ Aprobada |
| ADR-006 | Streaks como caché recalculable; `habit_logs` = fuente de verdad | ✅ Aprobada |
| ADR-007 | Zod como validador único en ambos lados del contrato | ✅ Aprobada |

## 4. Architecture Decision Records

### ADR-001 — Local-first con SQLite

- **Contexto:** el usuario exigió que la app funcione **local y sin internet**.
- **Decisión:** SQLite (`expo-sqlite`) es la SSOT en dispositivo. El backend NestJS/PostgreSQL se difiere a Fase 2 y queda desacoplado tras la abstracción de repositorios + tabla `outbox`.
- **Alternativas:** (a) BaaS Supabase/Firebase — requiere red; (b) SQLite + sync inmediato — sobreingeniería para MVP.
- **Consecuencias:** cero dependencia de red; pruebas más simples; la sync futura exige disciplina de `updated_at`/`sync_status` desde el día 1 (ya incorporada al esquema).

### ADR-002 — React Native + Expo

- **Contexto:** diseño Pulse Clay exige springs de alta fidelidad, blur y bottom sheets; equipo pequeño; web secundario futuro.
- **Decisión:** React Native gestionado con Expo (prebuild disponible si se necesita módulo nativo).
- **Alternativas:** Flutter (excelente para claymorphism pero introduce Dart y duplica el ecosistema web ya iniciado en HTML/CSS/TS); nativo (doble codebase inviable para MVP).
- **Consecuencias:** EAS para builds/OTA; Reanimated+Skia cubren el design system; `react-native-web` habilita el sitio secundario reutilizando código.

### ADR-003 — Sombras clay con Skia

- **Contexto:** el manual visual define sombras `inset` duales; RN core no soporta `box-shadow` con inset.
- **Decisión:** encapsular la simulación de clay (capas de sombra interior/exterior) en la primitiva `<ClaySurface>` implementada con `react-native-skia` (con fallback a `elevation`/`shadow*` en dispositivos sin Skia o con `reduce-motion`).
- **Alternativas:** librerías de sombra por capas de vistas (menos fiables, más layout thrash); ignorar inset (rompe la identidad).
- **Consecuencias:** un único punto de implementación; performance controlada (presupuesto: ≤2 capas de sombra en gama media).

### ADR-004 — Monorepo ligero

- **Contexto:** los contratos Zod deben compartirse entre cliente hoy y servidor mañana.
- **Decisión:** npm workspaces con `apps/mobile`, `apps/server` (placeholder Fase 2) y `packages/shared`.
- **Alternativas:** repo único sin workspaces (duplicaría tipos al llegar el backend); monorepo Nx/Turbo completo (sobreingeniería; Turbo opcional más adelante).
- **Consecuencias:** un solo `tsconfig` base; `shared` consumible por ambos apps.

### ADR-005 — Auth local en MVP

- **Contexto:** offline-first impide login en la nube.
- **Decisión:** PIN 6 dígitos + biometría (`expo-local-authentication`); hash scrypt en SecureStore; auto-lock en background; backoff tras fallos.
- **Alternativas:** sin autenticación (datos personales expuestos en dispositivo perdido); cuenta local obligatoria (fricción innecesaria).
- **Consecuencias:** Fase 2 añade cuentas cloud sin tocar el flujo local (el PIN local sigue como capa de dispositivo).

### ADR-006 — Streaks como caché

- **Contexto:** las rachas se derivan del histórico de `habit_logs`.
- **Decisión:** `habit_logs` con `UNIQUE(habit_id, log_date)` es la fuente de verdad; `habit_streak_cache` y `streak_cache` son **recalculables** (recompute-on-write dentro de la transacción de `toggleLog`).
- **Alternativas:** calcular en cada lectura (coste O(n) en feeds); confiar solo en el contador (frágil ante bugs).
- **Consecuencias:** corrección garantizada por la restricción unique; rendimiento O(1) en lecturas.

### ADR-007 — Zod como validador único

- **Contexto:** inputs de usuario y futuros payloads de sync deben validarse igual en cliente y servidor.
- **Decisión:** schemas Zod en `packages/shared`; whitelist+transform en cada borde; tipos TS derivados (`z.infer`).
- **Alternativas:** class-validator (solo backend); validación ad-hoc (deriva de contratos).
- **Consecuencias:** cero desincronización de contratos; refactor sencillo hacia NestJS (mismos schemas).

## 5. Presupuestos de rendimiento (binding)

- 60fps en animaciones de presión/check → **UI thread** exclusivamente.
- ≤ 2 capas de sombra clay por componente en Android gama media.
- ≤ 2 superficies con blur visibles simultáneamente.
- Bundle de app < 25MB; assets de fuente comprimidos (subset latin).
- Sin WebGL/Three.js.

## 6. Convenciones clave

- `core/domain` **nunca** importa React ni RN (unit-test puro con Jest).
- Pantallas (`app/`) = shells finos; lógica en `features/*` + hooks.
- SQL exclusivamente con prepared statements (Prisma/expo-sqlite parametrizado).
- Todo input validado con Zod antes de tocar datos.
- UUIDv4 como PK en todas las entidades (no enumerables).
- Los tokens visuales viven en `core/theme/theme.ts` (derivados del manual visual — SSOT).

## 7. Documentación relacionada

- `Artefactos/documentación/Diseño Visual/manual-identidad-visual.md` — identidad visual SSOT.
- `Artefactos/documentación/Arquitectura/ESTRUCTURA_DIRECTORIOS.md`
- `Artefactos/documentación/Arquitectura/MODELO_DE_DATOS.md`
- `Artefactos/documentación/Arquitectura/CONTRATOS_API.md`
- `Artefactos/documentación/Arquitectura/GUIA_DEVOPS_SEGURIDAD.md`
