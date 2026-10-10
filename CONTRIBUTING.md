# Contribuir en App Hábitos

## Reglas de oro

1. **Fuente de verdad:** la documentación en `Artefactos/documentación/` (producto, flujos, arquitectura, diseño). Si el código contradice un MD, gana el MD — o se aprueba un cambio en el plan.
2. **Hex literals solo en `src/core/theme/theme.ts`** — cualquier otro color se toma de `palette`/`badgeTints`/`darkPalette`.
3. **SQL solo en `src/core/repositories/` y `src/core/data/`** (contrato `CONTRATOS_API.md`).
4. **Cada pantalla con 4 estados:** Loading · Empty · Success · Error.
5. **Español** en respuestas, nombres de archivo, UI y docs (`lang="es"`).

## Flujo de trabajo

```powershell
# 1. Instalar (raíz del monorepo)
npm install

# 2. Desarrollo
cd apps\mobile
npx expo start --dev-client          # o npx expo start --tunnel

# 3. Antes de cada commit (obligatorio)
npm run typecheck                     # apps/mobile
npm test                              # Jest: dominio puro
npm run typecheck                     # packages/shared
npx expo-doctor                       # 21 checks
```

## Convenciones de código

- TypeScript estricto (`noUncheckedIndexedAccess` activo) — nada de `any`.
- Zod v4: `.partial()` **no** se aplica sobre schemas con `.refine()`; deriva del shape base (ver `packages/shared/src/schemas/habit.schema.ts`).
- Primitivas UI en `src/ui/primitives/` (prefijo `Clay*`); features en `src/features/<area>/`.
- Hooks de datos con TanStack Query: claves en array `['habits']`, `['goals']`, `['achievements']`, `['streak']`.
- Cada decisión no obvia se registra en `Artefactos/documentación/Orquestador/PLAN_DE_SPRINTS.md` (§5 Bitácora).

## Seguridad

- PIN = scrypt en SecureStore — **nunca** en SQLite, nunca en logs.
- Sin claves ni tokens en el repositorio; `.env` está en `.gitignore`.

## Commits

Formato corto en inglés: `feat: …`, `fix: …`, `chore: …`, `docs: …`. Un commit por unidad de cambio.
