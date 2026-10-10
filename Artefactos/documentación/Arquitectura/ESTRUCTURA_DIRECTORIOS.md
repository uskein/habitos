# ESTRUCTURA_DIRECTORIOS — App Hábitos

> Mapa físico del repositorio (monorepo ligero npm workspaces).
> Reglas de dependencia obligatorias al final del documento.

```
proyecto-app-habitos/
├── apps/
│   ├── mobile/                          # ★ App Expo (React Native) — FASE 1 (MVP)
│   │   ├── app/                         # Rutas expo-router: SHells finos de pantalla
│   │   │   ├── _layout.tsx              #   Layout raíz: providers (Query, Theme, Sheet)
│   │   │   ├── (tabs)/                  #   Bottom tabs del design system
│   │   │   │   ├── _layout.tsx          #     Tab bar Pulse Clay (iconos 24, indicador)
│   │   │   │   ├── index.tsx            #     "Hoy" — feed de hábitos + progreso del día
│   │   │   │   ├── plan.tsx             #     "Plan" — metas y calendario
│   │   │   │   ├── achievements.tsx     #     "Logros" — medallas y rachas
│   │   │   │   └── profile.tsx          #     "Perfil" — ajustes, bloqueo PIN, tema
│   │   │   └── (modals)/                #   Bottom sheets (no tabs)
│   │   │       ├── new-habit.tsx        #     Crear/editar hábito
│   │   │       ├── new-goal.tsx         #     Crear/editar meta
│   │   │       └── check-in.tsx         #     Check-in de bienestar (mood/energía)
│   │   ├── src/
│   │   │   ├── core/                    # ★ Infraestructura — sin importaciones de features
│   │   │   │   ├── domain/              #   Entidades + services PUROS (sin I/O, sin React)
│   │   │   │   │   ├── entities/        #     habit.ts, goal.ts, wellEntry.ts, achievement.ts
│   │   │   │   │   └── services/        #     streakCalculator.ts, levelService.ts, reminderPlanner.ts
│   │   │   │   ├── data/                #   Acceso a datos
│   │   │   │   │   ├── database.ts      #     Inicialización expo-sqlite + pragma
│   │   │   │   │   ├── migrations/      #     Generados por Prisma Migrate (versionados)
│   │   │   │   │   └── seeds/           #     achievements.json (catálogo de logros)
│   │   │   │   ├── repositories/        #   Implementaciones de interfaces (transacciones)
│   │   │   │   │   ├── habitRepository.ts
│   │   │   │   │   ├── goalRepository.ts
│   │   │   │   │   └── wellbeingRepository.ts
│   │   │   │   ├── storage/             #   MMKV (prefs) + SecureStore (PIN scrypt)
│   │   │   │   └── theme/               #   theme.ts DERIVADO del manual visual (tokens)
│   │   │   ├── features/                # ★ Módulos de negocio (Clean Architecture)
│   │   │   │   ├── habits/              #   useHabits.ts (TanStack), HabitCard, HabitForm
│   │   │   │   ├── goals/               #   useGoals.ts, GoalCard, progress logic
│   │   │   │   ├── wellbeing/           #   useWellbeing.ts, MoodPicker, WellCalendar
│   │   │   │   ├── achievements/        #   useAchievements.ts, AchievementBadge
│   │   │   │   ├── onboarding/          #   Flujo de bienvenida + permiso notificaciones
│   │   │   │   └── settings/            #   Tema, idioma, bloqueo, exportar datos
│   │   │   ├── ui/                      # ★ Design system Pulse Clay (ver manual visual)
│   │   │   │   ├── primitives/          #   ClaySurface (Skia), ClayButton, ClayCard,
│   │   │   │   │                        #   ClayInput, ClayToggle, ClayCheckbox, ClayRadio
│   │   │   │   ├── feedback/            #   Toast, Badge (tint pattern), Progress, Spinner,
│   │   │   │   │                        #   EmptyState (blob animado)
│   │   │   │   ├── overlays/            #   Sheet wrappers (@gorhom), Tooltip
│   │   │   │   └── navigation/          #   TabBar, AppBar, ChipsTabs
│   │   │   ├── hooks/                   #   Compartidos: useReducedMotion, useHaptics
│   │   │   └── lib/                     #   Utilidades: dates.ts, format.ts, ids.ts (uuid)
│   │   ├── assets/
│   │   │   └── fonts/                   #   Sora-*.ttf, PlusJakartaSans-*.ttf, JetBrainsMono-*.ttf
│   │   ├── __tests__/                   #   Jest: domain/ (unit) + ui/ (componentes)
│   │   ├── app.json                     #   Config Expo (permisos, iconos, bundle id)
│   │   ├── eas.json                     #   Perfiles EAS: preview/production
│   │   ├── babel.config.js              #   reanimated plugin (último)
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── server/                          # NestJS — FASE 2 (carpeta protegida)
│       └── .gitkeep                     #   ⚠ No implementar hasta aprobar Fase 2
├── packages/
│   └── shared/                          # ★ Contratos únicos cliente↔servidor
│       ├── src/
│       │   ├── schemas/                 #   Zod: habit.schema.ts, goal.schema.ts,
│       │   │                            #   wellEntry.schema.ts, sync.schema.ts
│       │   ├── types/                   #   Tipos derivados (z.infer) y enums
│       │   └── constants/               #   Códigos de error, límites, categorías
│       ├── tsconfig.json
│       └── package.json
├── Artefactos/
│   └── documentación/                   #   Artefactos de diseño y arquitectura
│       ├── Diseño Visual/               #   SSOT visual + Brand Book + prototipos
│       ├── Arquitectura/                #   Este corpus documental
│       └── Prototipos/                  #   prototipo-a/b (validación visual)
├── .github/
│   └── workflows/
│       └── ci.yml                       #   lint → typecheck → test → eas check
├── package.json                         #   npm workspaces (apps/*, packages/*)
├── .editorconfig / .prettierrc          #   Formato unificado
├── .env.example                         #   Variables documentadas (sin secretos)
├── opencode.json                        #   references de contexto (visual + arquitectura)
└── README.md
```

## Reglas de dependencia (enforceables con ESLint `import/no-restricted-paths`)

1. `core/domain/**` no importa React, RN, expo ni `features/` (puro TS → unit-test rápido).
2. `core/repositories/**` implementa interfaces definidas en `core/domain` o `packages/shared`; nunca se importan desde `app/` ni `features/` sin pasar por hooks.
3. `features/*` puede importar `core/*` y `ui/*`; **no** importa de otros `features/*` (si hace falta, extraer a `core` o `shared`).
4. `ui/**` no importa de `features/` ni de `core/repositories` (primitivas puras de presentación).
5. `app/` (rutas) solo importa `features/*` y `ui/navigation` — shells finos.
6. `apps/server/**` está congelado hasta Fase 2 (solo `.gitkeep`).
7. Los tokens visuales se importan **solo** desde `core/theme` (nunca hex literales fuera de ese archivo).
