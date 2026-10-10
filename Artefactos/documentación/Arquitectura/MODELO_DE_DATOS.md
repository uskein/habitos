# MODELO_DE_DATOS — App Hábitos

> Fuente de verdad del esquema **SQLite local** (SSOT del dispositivo, offline-first).
> Migraciones versionadas con **Prisma Migrate** desde el commit 1.

| Meta | Valor |
|---|---|
| Motor | SQLite (`expo-sqlite`) |
| PKs | UUIDv4 (no enumerables) |
| Auditoría | `created_at`, `updated_at`, `sync_status` en entidades sincronizables |
| Sync | Tabla `outbox` preparada para Fase 2 (diferida) |

---

## 1. Diagrama Entidad-Relación

```mermaid
erDiagram
    USER_PROFILE ||--o{ HABIT : posee
    USER_PROFILE ||--o{ GOAL : posee
    USER_PROFILE ||--o{ WELL_ENTRY : registra
    USER_PROFILE ||--o{ ACHIEVEMENT_UNLOCK : desbloquea
    USER_PROFILE ||--|| STREAK_CACHE : tiene
    HABIT ||--o{ HABIT_LOG : genera
    HABIT ||--o| HABIT_STREAK_CACHE : cachea
    HABIT ||--o{ HABIT_SCHEDULE : programa
    GOAL ||--o{ GOAL_UPDATE : progreso
    ACHIEVEMENT ||--o{ ACHIEVEMENT_UNLOCK : otorga

    USER_PROFILE {
        uuid id PK
        text display_name
        integer avatar_seed
        text locale
        text theme_mode
        timestamp created_at
    }
    HABIT {
        uuid id PK
        text name
        text icon
        text category "bienestar|meta|habito"
        text color_token
        text frequency "daily|custom"
        jsonb custom_days
        integer target_value
        text unit
        text reminder_time
        integer sort_order
        boolean is_archived
        timestamp created_at
        timestamp updated_at
        text sync_status
    }
    HABIT_SCHEDULE {
        uuid id PK
        uuid habit_id FK
        date scheduled_date
        timestamp created_at
    }
    HABIT_LOG {
        uuid id PK
        uuid habit_id FK
        date log_date
        boolean completed
        numeric value
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
        text sync_status
    }
    HABIT_STREAK_CACHE {
        uuid habit_id PK_FK
        integer current_streak
        integer best_streak
        date last_completed_date
        timestamp recomputed_at
    }
    GOAL {
        uuid id PK
        text title
        text description
        text category
        numeric target_value
        numeric current_value
        text unit
        date deadline
        text status "active|completed|abandoned"
        timestamp created_at
        timestamp updated_at
        text sync_status
    }
    GOAL_UPDATE {
        uuid id PK
        uuid goal_id FK
        numeric delta
        text note
        date entry_date
        timestamp created_at
    }
    WELL_ENTRY {
        uuid id PK
        date entry_date
        integer mood
        integer energy
        text note
        timestamp created_at
        timestamp updated_at
        text sync_status
    }
    ACHIEVEMENT {
        uuid id PK
        text key UK
        text title
        text description
        text icon
        jsonb criteria
    }
    ACHIEVEMENT_UNLOCK {
        uuid id PK
        uuid user_id FK
        uuid achievement_id FK
        timestamp unlocked_at
    }
    STREAK_CACHE {
        uuid user_id PK_FK
        integer global_current_streak
        integer global_best_streak
        timestamp recomputed_at
    }
    OUTBOX {
        uuid id PK
        text entity
        uuid entity_id
        text op "create|update|delete"
        jsonb payload
        timestamp created_at
        text status "pending|sent|failed"
    }
```

---

## 2. Diccionario de datos

### 2.1 `USER_PROFILE` — perfil local (uno por dispositivo en MVP)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid PK | — | Fijo, generado en onboarding |
| `display_name` | text | NOT NULL, ≤ 40 chars | Nombre mostrado |
| `avatar_seed` | integer | NOT NULL | Semilla para gradiente de iniciales (design system) |
| `locale` | text | default `'es'` | i18n futuro |
| `theme_mode` | text | `light\|dark\|system` | Tema Pulse Clay |
| `created_at` | timestamp | default now | — |

### 2.2 `HABIT` — hábito configurado

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid PK | — | — |
| `name` | text | NOT NULL, 1–60 chars | Nombre del hábito |
| `icon` | text | NOT NULL | Emoji o clave de icono |
| `category` | text | `bienestar\|meta\|habito` | Clasificación de la app |
| `color_token` | text | token del design system | Color del icono (p. ej. `primary-soft`) |
| `frequency` | text | `daily\|custom` | — |
| `custom_days` | json | array `[0..6]` si custom | 0=domingo |
| `target_value` | integer | NULL o ≥ 1 | Meta numérica opcional (p. ej. 3 km) |
| `unit` | text | ≤ 12 chars | km, páginas, min… |
| `reminder_time` | text | `HH:mm` o NULL | Hora local de recordatorio |
| `sort_order` | integer | NOT NULL | Orden manual en el feed |
| `is_archived` | boolean | default false | Soft archive |
| `created_at`/`updated_at` | timestamp | — | — |
| `sync_status` | text | `pending\|synced\|deleted` | Outbox Fase 2 |

### 2.3 `HABIT_LOG` — registro diario (★ fuente de verdad)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | uuid PK | — | — |
| `habit_id` | uuid FK | ON DELETE CASCADE | — |
| `log_date` | date | **UNIQUE(habit_id, log_date)** | Día lógico (local) |
| `completed` | boolean | NOT NULL | ¿Se completó ese día? |
| `value` | numeric | NULL | Valor numérico si aplica |
| `completed_at` | timestamp | NULL | Marca exacta (para UI "hace 2 h") |
| `updated_at` | timestamp | — | Base del conflicto LWW futuro |
| `sync_status` | text | — | — |

> ⚠ **La restricción UNIQUE es anti-fraude de racha a nivel de esquema:**
> impide doble check del mismo día incluso con un bug de UI.

### 2.4 `HABIT_STREAK_CACHE` / `STREAK_CACHE` — cachés recalculables

| Campo | Tipo | Descripción |
|---|---|---|
| `habit_id` / `user_id` | uuid PK/FK | — |
| `current_streak` | integer | Racha actual (días consecutivos) |
| `best_streak` | integer | Récord histórico |
| `last_completed_date` | date | Base del cálculo incremental |
| `recomputed_at` | timestamp | Auditoría de recálculo |

> **Regla ADR-006:** estas tablas **nunca** son fuente de verdad; se recalculan
> desde `habit_logs` dentro de la transacción de `toggleLog` y pueden regenerarse
> al 100% en cualquier momento.

### 2.5 `GOAL` + `GOAL_UPDATE` — metas

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `GOAL.title` | text | NOT NULL, ≤ 80 | — |
| `GOAL.target_value` | numeric | > 0 | Objetivo final |
| `GOAL.current_value` | numeric | ≥ 0 | Acumulado (derivable de updates; cacheado) |
| `GOAL.deadline` | date | NULL | Fecha límite opcional |
| `GOAL.status` | text | `active\|completed\|abandoned` | — |
| `GOAL_UPDATE.delta` | numeric | ≠ 0 | Aporte (+/-) |
| `GOAL_UPDATE.entry_date` | date | NOT NULL | Día del aporte |

### 2.6 `WELL_ENTRY` — check-in de bienestar

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `entry_date` | date | **UNIQUE** | 1 entrada por día (MVP) |
| `mood` | integer | 1–5 | Ánimo |
| `energy` | integer | 1–5 | Energía |
| `note` | text | ≤ 500 | Nota libre |

### 2.7 `ACHIEVEMENT` + `ACHIEVEMENT_UNLOCK` — gamificación

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `ACHIEVEMENT.key` | text | **UNIQUE** | Clave inmutable (`streak_7`, `first_habit`…) |
| `ACHIEVEMENT.criteria` | json | — | `{type, threshold, scope}` evaluado por `levelService` |
| `UNLOCK.user_id + achievement_id` | — | **UNIQUE juntos** | Idempotente: no se desbloquea 2 veces |

---

## 3. Índices

| Tabla | Índice | Consulta que protege |
|---|---|---|
| `habit_logs` | `(habit_id, log_date DESC)` | Historial/calendario del hábito |
| `habit_logs` | `(log_date)` | Feed "hoy" global |
| `habit` | `(is_archived, sort_order)` | Lista activa ordenada |
| `well_entries` | `(entry_date)` | Calendario mensual de bienestar |
| `goal` | `(status)` | Metas activas |
| `outbox` | `(status)` | Drain de sync futuro |

## 4. Transacción atómica de `toggleLog(habitId, date)`

```
BEGIN;
  UPSERT habit_log (UNIQUE habit_id+log_date) → completed = !prev
  IF completed: HABIT_STREAK_CACHE ← recalcular (incremental)
  UPSERT STREAK_CACHE (global)
  INSERT OUTBOX (op=create|update, entity=habit_log)
  FOR each ACHIEVEMENT con criteria aplicable:
      INSERT ACHIEVEMENT_UNLOCK si cumple y no existe (UNIQUE defiende)
COMMIT;   -- cualquier fallo revierte TODO
```

## 5. Estrategia de migraciones y seeds

- **Prisma Migrate**: carpeta `apps/mobile/src/core/data/migrations/` versionada en git; aplicada en arranque (`migrate` en dev, `migrate deploy` en producción).
- **Seeds idempotentes**: catálogo `achievements` desde `seeds/achievements.json` con `INSERT OR IGNORE` por `key`.
- **Regla**: nunca editar una migración ya aplicada → siempre `prisma migrate dev` + nueva migración.

## 6. Cifrado y protección de datos

- Sandbox de la app (sin acceso de terceros); Android `allowBackup=false`.
- PIN/biometría: hash **scrypt** + salt en **SecureStore** (Keychain/Keystore) — nunca en SQLite.
- Evaluación pendiente (backlog): **SQLCipher** para cifrar el archivo SQLite completo.
- Datos exportados (función "exportar datos") solo bajo acción explícita del usuario.

---

## V2 — Tablas nuevas y extensiones (2026-10-10)

### 2.8 `MILESTONE` + `MILESTONE_IMAGE` + `MILESTONE_LINK`

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `MILESTONE.id` | uuid PK | — | — |
| `MILESTONE.user_id` | uuid | FK `USER_PROFILE.id` | — |
| `MILESTONE.title` | text | NOT NULL, ≤80 | Nombre del hito |
| `MILESTONE.note` | text | NULL, ≤500 | Comentario del hito |
| `MILESTONE.occurred_at` | date | NOT NULL | Fecha del logro |
| `MILESTONE.created_at` | timestamp | default now | — |
| `MILESTONE.sync_state` | text | `pending\|synced` | Outbox Fase 2 |
| `MILESTONE_IMAGE.id` | uuid PK | — | — |
| `MILESTONE_IMAGE.milestone_id` | uuid | FK **ON DELETE CASCADE** | — |
| `MILESTONE_IMAGE.uri` | text | NOT NULL | Ruta FileSystem (UUID) |
| `MILESTONE_IMAGE.position` | integer | NOT NULL | Orden en carrusel |
| `MILESTONE_LINK.milestone_id` | uuid | FK CASCADE, PK juntos | — |
| `MILESTONE_LINK.entity_type` | text | `habit\|goal` | Ligazón |
| `MILESTONE_LINK.entity_id` | uuid | PK juntos | Hábito o meta |

### 2.9 `MOTIVATION` + `MOTIVATION_SHOW`

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `MOTIVATION.id` | uuid PK | — | — |
| `MOTIVATION.user_id` | uuid | FK perfil | — |
| `MOTIVATION.text` | text | NOT NULL, ≤140 | Texto de la card |
| `MOTIVATION.emoji` | text | default `🔥` | — |
| `MOTIVATION.goal_id` | uuid | FK `GOAL.id`, NULL | Meta ligada (opcional) |
| `MOTIVATION.trigger_type` | text | `no_streak\|morning\|missed_day` | Cuándo se encola |
| `MOTIVATION.active` | integer | default 1 | — |
| `MOTIVATION.created_at` | timestamp | default now | — |
| `MOTIVATION_SHOW.(motivation_id, shown_on)` | — | **PK juntos** | Historial/no repetir |

### 2.10 `ACHIEVEMENT` — columnas nuevas (migración V2)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `is_custom` | integer | default 0 | 1 = creado por el usuario (borrable) |
| `progress_style` | text | `bar\|level\|hidden` | Cómo se muestra el avance |
| `unlock_mode` | text | `auto\|review` | Automático o con revisión |
| `criteria` (ampliado) | json | `{type, threshold, habit_ids?:uuid[], goal_ids?:uuid[], mode?:'any'\|'all'}` | Compatibilidad total con V1 |

### 2.11 `STATS_CACHE`

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `key` | text PK | `goal:<id>:day` / `habit:<id>:hour` / `milestone:activity` | — |
| `payload` | json | — | Series y agregados |
| `computed_at` | timestamp | — | Freshness |

### 2.12 Extensión `USER_PROFILE`

| Campo | Tipo | Descripción |
|---|---|---|
| `photo_uri` | text NULL | Path FileSystem del avatar; NULL ⇒ gradiente + iniciales (fallback V1) |

### Índices nuevos

| Tabla | Índice | Consulta protegida |
|---|---|---|
| `MILESTONE` | `(user_id, occurred_at DESC)` | Lista de hitos |
| `MILESTONE_IMAGE` | `(milestone_id, position)` | Carrusel ordenado |
| `MOTIVATION` | `(goal_id, active)` | Cola por meta |
| `HABIT_LOG` | `(habit_id, created_at)` | Stats por hora |
| `GOAL_UPDATE` | `(goal_id, created_at)` | Stats por hora de metas |
| `STATS_CACHE` | `(computed_at)` | Limpieza de caché vieja |

### Migración V2
Versión `_migrations` **siguiente a la V1** (mismo migrador versionado): `ALTER TABLE` de 3 columnas en `ACHIEVEMENT`, `ALTER TABLE USER_PROFILE ADD photo_uri`, `CREATE TABLE` de las 5 nuevas + índices. Idempotente y transaccional (rollback ⇒ versión anterior intacta).

### 2.13 Mejoras V2.1 (aprobadas 2026-10-10 � HU-27�HU-30)

| Elemento | Tipo | Detalle |
|---|---|---|
| `HABIT.time_slot` | text NULL (`morning`\|`afternoon`\|`evening`) | Tramo horario opcional; ordena �Hoy� y filtra stats |
| `STREAK_FREEZE` | tabla | `id, user_id, used_date` � m�x. 2 usos/mes; `UNIQUE(user_id, used_date)` |
| `HABIT.reminder_at` | (reservado) | No se implementa en V2 � solo time_slot |
| Backup | sin tabla | Export/import JSON cifrado con fotos (archivo, no BD) |
| Compartir hito | sin tabla | Render Skia 1080�1080 en memoria + expo-sharing |

**Migraci�n V2.1:** `ALTER TABLE HABIT ADD time_slot` + `CREATE TABLE STREAK_FREEZE` + �ndice � misma versi�n `_migrations` encadenada.
