# CONTRATOS_API — App Hábitos

> La "API" del MVP son las **interfaces de repositorio locales** (SQLite).
> Los endpoints REST de Fase 2 se diseñan aquí pero **no se implementan** hasta
> aprobar la fase cloud. Contratos Zod compartidos en `packages/shared`.

---

## 1. Convención general

- **Validación:** todo input pasa por un schema Zod (`whitelist` + `transform`) antes de tocar datos.
- **Identificadores:** UUIDv4 en todas las entidades.
- **Errores (repositorios locales):** se lanzan `AppError { code, message }` con códigos del paquete `shared`:

| Code | HTTP futuro | Significado |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Input inválido (detalles del ZodIssues) |
| `NOT_FOUND` | 404 | Entidad inexistente |
| `CONFLICT` | 409 | Violación de unicidad lógica (p. ej. log ya existe y la operación no es upsert) |
| `UNAUTHORIZED` | 401 | PIN bloqueado / sesión cloud requerida |
| `RATE_LIMITED` | 429 | Backoff de intentos de PIN |
| `INTERNAL` | 500 | Fallo inesperado |

---

## 2. Contratos locales (MVP — los que se implementan)

### 2.1 HabitRepository

```ts
interface HabitRepository {
  /** Feed "hoy": hábitos activos + estado del log de la fecha */
  listByDate(date: string /* YYYY-MM-DD */): Promise<HabitWithLog[]>;

  /** Detalle con historial reciente */
  getById(habitId: string): Promise<Habit | null>;

  /** Crea hábito (validado con CreateHabitInput Zod) */
  create(input: CreateHabitInput): Promise<Habit>;

  /** Actualiza campos editables */
  update(habitId: string, input: UpdateHabitInput): Promise<Habit>;

  /** Marca/desmarca el log del día — TRANSACCIONAL (ver §4) */
  toggleLog(habitId: string, date: string): Promise<HabitLog>;

  /** Historial para calendario/gráfico */
  getHistory(habitId: string, from: string, to: string): Promise<HabitLog[]>;

  /** Soft-archive (no borra logs) */
  archive(habitId: string): Promise<void>;

  /** Borro físico (CASCADE sobre logs y caché) */
  delete(habitId: string): Promise<void>;
}
```

**Schemas Zod (ejemplo — `packages/shared/src/schemas/habit.schema.ts`):**

```ts
const CreateHabitInput = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().min(1).max(8),
  category: z.enum(['bienestar', 'meta', 'habito']),
  colorToken: z.enum(['primary-soft', 'success-soft', 'warning-soft', 'accent-soft']),
  frequency: z.enum(['daily', 'custom']),
  customDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  targetValue: z.number().int().positive().nullable().optional(),
  unit: z.string().max(12).nullable().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
}).strict();
```

### 2.2 GoalRepository

```ts
interface GoalRepository {
  list(status?: 'active' | 'completed' | 'abandoned'): Promise<Goal[]>;
  create(input: CreateGoalInput): Promise<Goal>;
  /** Registra aporte (+/-) y actualiza current_value en la misma transacción */
  addProgress(goalId: string, delta: number, note?: string): Promise<Goal>;
  setStatus(goalId: string, status: GoalStatus): Promise<Goal>;
  delete(goalId: string): Promise<void>;
}
```

### 2.3 WellbeingRepository

```ts
interface WellbeingRepository {
  /** 1 check-in por día (UNIQUE entry_date) — crea o actualiza */
  upsertEntry(date: string, mood: number, energy: number, note?: string): Promise<WellEntry>;
  getEntry(date: string): Promise<WellEntry | null>;
  getMonth(year: number, month: number): Promise<WellEntry[]>; // calendario
}
```

### 2.4 AchievementRepository + evaluación

```ts
interface AchievementRepository {
  listCatalog(): Promise<Achievement[]>;
  listUnlocked(): Promise<AchievementUnlock[]>;
  /** Evalúa criterios contra el estado actual — idempotente (UNIQUE) */
  evaluateAndUnlock(event: AchievementEvent): Promise<AchievementUnlock | null>;
}
```

### 2.5 AuthRepository (local)

```ts
interface AuthRepository {
  isPinConfigured(): Promise<boolean>;
  setupPin(pin: string): Promise<void>;            // scrypt → SecureStore
  verifyPin(pin: string): Promise<boolean>;        // backoff tras 5 fallos
  unlockWithBiometrics(): Promise<boolean>;        // expo-local-authentication
  lock(): void;                                    // auto-lock en background
}
```

---

## 3. Transacción de negocio `toggleLog`

```
toggleLog(habitId, date):
  BEGIN TRANSACTION
    upsert habit_log(habit_id=habitId, log_date=date)  -- UNIQUE defiende
    recompute habit_streak_cache (incremental)
    recompute streak_cache (global)
    outbox.insert(entity='habit_log', op, payload)
    achievement.evaluateAndUnlock({type:'habit_completed', habitId, date})
  COMMIT
```

---

## 4. API REST — Fase 2 (diseñada, diferida)

> ⚠ **No implementar** hasta aprobar la Fase 2 (ADR-001).

### 4.1 Autenticación

| Método | Ruta | Éxito | Errores | Payload |
|---|---|---|---|---|
| POST | `/auth/register` | 201 | 409 email existe · 422 validación | `{email, password}` → `{userId, accessToken, refreshToken}` |
| POST | `/auth/login` | 200 | 401 credenciales · 422 | idem |
| POST | `/auth/refresh` | 200 | 401 refresh inválido/reusado | `{refreshToken}` → nuevos tokens |

- Access JWT **RS256**, TTL 15 min; refresh rotación con detección de reuso (familia de token).

### 4.2 Sincronización (batch)

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| POST | `/sync/batch` | 200 | 401 · 413 payload grande · 422 ops inválidas |

**Request:**
```json
{
  "ops": [
    {"entity": "habit_log", "entityId": "uuid", "op": "create",
     "payload": {"habitId": "uuid", "logDate": "2026-10-09", "completed": true},
     "updatedAt": "2026-10-09T14:02:00Z"}
  ],
  "cursor": "opaque-cursor-o-null"
}
```

**Response 200:**
```json
{
  "applied": ["op-uuid-1"],
  "conflicts": [
    {"opId": "op-uuid-2", "reason": "LWW_REMOTE_WINS", "serverVersion": {}}
  ],
  "serverOps": [ { "entity": "habit", "payload": { } } ],
  "nextCursor": "opaque"
}
```

- Estrategia MVP social: **last-write-wins** por `updatedAt`; `habit_logs` idempotentes por `(habitId, logDate)`.

### 4.3 Entidades (pull)

| Método | Ruta | Éxito | Notas |
|---|---|---|---|
| GET | `/habits?since=ISO8601` | 200 | Deltas desde timestamp |
| GET | `/goals?since=` | 200 | — |
| GET | `/wellbeing?month=YYYY-MM` | 200 | — |
| GET | `/achievements` | 200 | Catálogo + unlocks del usuario |

### 4.4 Social (posterior)

| Método | Ruta | Éxito |
|---|---|---|
| GET | `/leaderboard?scope=friends\|global` | 200 |
| POST | `/challenges` | 201 | Retos entre amigos |

### 4.5 Envelope de error (todas las rutas)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [ { "path": "name", "message": "Required" } ] } }
```

| Código | HTTP |
|---|---|
| `VALIDATION_ERROR` | 422 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `INTERNAL` | 500 |

Rate limiting global (Throttler) + límite estricto en `/sync/batch` (máx 500 ops/petición).

---

## 5. Security by Design (resumen de contratos)

- Validación Zod en **cada** borde de entrada (repositorios y futuros endpoints).
- SQL solo con prepared statements (Prisma/expo-sqlite parametrizado).
- UUIDs no enumerables; sin endpoints de enumeración.
- Payloads de sync acotados (tamaño y nº de ops).
- En Fase 2: autorización por recurso (`userId` del token, nunca del body), RBAC mínimo (user/admin).
