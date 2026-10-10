# GUIA_DEVOPS_SEGURIDAD — App Hábitos

> Entorno local, CI/CD, despliegue y protocolos de seguridad.
> MVP **offline-first** sin servidores; Fase 2 cloud diferida.

---

## 1. Entorno local

### 1.1 Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| Node.js | LTS ≥ 22 | Workspaces npm |
| npm | ≥ 10 | `npm workspaces` |
| Expo CLI | incluida (`npx expo`) | — |
| Xcode / Android Studio | actuales | Solo para simuladores/emuladores |
| Git | actual | — |

### 1.2 Puesta en marcha

```bash
git clone <repo> && cd proyecto-app-habitos
npm install                    # instala apps/* y packages/* (workspaces)
cd apps/mobile
npx prisma generate            # clientes de SQLite
npx prisma migrate dev         # aplica migraciones locales
npm run seed                   # catálogo de achievements
npm start                      # Expo dev server (Metro)
```

Scripts esperados en `apps/mobile/package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "seed": "node scripts/seed.js"
  }
}
```

### 1.3 Variables de entorno (`.env.example`)

```
# apps/mobile (Expo — solo variables EXPO_PUBLIC_* llegan al bundle)
EXPO_PUBLIC_APP_ENV=development        # development | preview | production
# (sin secretos en el cliente — SecureStore maneja credenciales en runtime)

# apps/server (FUTURE — Fase 2, no usar aún)
DATABASE_URL=postgresql://user:pass@localhost:5432/habitos
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
CORS_ORIGINS=https://app.example.com
```

**Regla:** nunca commitear `.env` (ir en `.gitignore`); los secretos de Fase 2 viven en el secret manager del proveedor, no en el repo.

---

## 2. CI/CD (GitHub Actions)

Pipeline en `.github/workflows/ci.yml`:

```
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node (LTS, cache npm)
      - npm ci
      - npm run lint --workspaces
      - npm run typecheck --workspaces
      - npm test --workspaces          # Jest: domain + repositories (in-memory SQLite)
  build-check:
    needs: quality
    steps:
      - npx expo-doctor
      - npx expo export --platform all  # verifica que el bundle compila
```

**Despliegue (solo en tags `v*`):**

```
tag v* → quality → build-check → eas build --profile production --platform all
                              → eas update --channel production   (OTA para JS fixes)
```

- `main` = channel **production**; `develop` = channel **preview** (builds internos tipo EAS).
- **OTA (`eas update`)** solo para cambios JS; cambios nativos requieren `eas build` nuevo (+ revisión de tienda).
- E2E smoke con **Maestro** (onboarding → crear hábito → marcar check) cuando madure el flujo.

---

## 3. Contenedores (Fase 2 — diferido)

- **Hoy no aplica** (app nativa; nada que containerizar en el MVP).
- Fase 2: `apps/server` con Dockerfile multi-stage (builder Node → runtime `node:slim`) + `docker-compose.yml` raíz:

```yaml
services:
  api:      { build: ./apps/server, ports: ["3000:3000"] }
  postgres: { image: postgres:16-alpine, volumes: ["pgdata:/var/lib/postgresql/data"] }
  redis:    { image: 7-alpine }
```

- Sin Kubernetes en el previsible futuro (ADR de pragmatismo).

---

## 4. Seguridad

### 4.1 Cliente (MVP — controles activos)

| Área | Control implementado |
|---|---|
| **Acceso al dispositivo** | PIN 6 dígitos + biometría (`expo-local-authentication`); hash **scrypt** con salt en **SecureStore** (Keychain/Keystore); auto-lock al pasar a background; backoff exponencial tras 5 fallos |
| **Datos en reposo** | SQLite en sandbox privada de la app; **`allowBackup=false`** en Android y exclusión de backup iCloud; backlog: evaluación de **SQLCipher** (cifrado del archivo completo) |
| **Datos en tránsito** | N/A en Fase 1 (sin red). Fase 2: TLS obligatorio + certificate pinning |
| **Inyección / inputs** | Prepared statements exclusivos (sin concatenación SQL); validación Zod whitelist en cada borde |
| **Permisos mínimo** | Único permiso: notificaciones (opt-in tras onboarding) — sin acceso a contactos, ubicación, micrófono, etc. |
| **Exportación de datos** | Solo bajo acción explícita del usuario; archivo local compartido manualmente |
| **Integridad de código** | Hermes bytecode (dificulta RE); Fase 2: Play Integrity API / detección root-jailbreak opcional |

### 4.2 OWASP Mobile Top 10 — mapeo

| # | Riesgo | Mitigación |
|---|---|---|
| M1 | Uso impropio de plataforma | `allowBackup=false`; flags de seguridad de Activity/TaskAffinity por defecto |
| M2 | Almacenamiento inseguro | SecureStore para PIN; sandbox SQLite; sin PII en logs |
| M3 | Comunicación insegura | N/A offline; pinning en Fase 2 |
| M4 | Autenticación insuficiente | scrypt + biometría + lockout/backoff |
| M5 | Criptografía insuficiente | scrypt (PIN); AES-GCM nativo del Keychain/Keystore; TLS 1.2+ futuro |
| M6 | Transcoding inseguro | N/A (sin upload) |
| M7 | Inyección cliente | Prepared statements + Zod (sin eval, sin SQL dinámico) |
| M8 | Tampering de código | Fase 2: Play Integrity; builds oficiales solo por EAS |
| M9 | Ingeniería inversa | Hermes; sin secretos en el bundle (solo `EXPO_PUBLIC_*` no sensibles) |
| M10 | Permisos excesivos | Lista blanca de permisos (notificaciones únicamente) |

### 4.3 Servidor (Fase 2 — checklist al implementar)

- JWT **RS256** (access 15 min) + refresh con rotación y detección de reuso.
- `helmet`, CORS whitelist estricta, **Throttler global** + límites duros en `/sync/batch`.
- Validación global (mismos Zod de `packages/shared`).
- Autorización por recurso: `userId` del token, **nunca** confiar en ids del body.
- PostgreSQL con TLS (`sslmode=require`), usuarios de BD con mínimo privilegio, credenciales en secret manager.
- Rate limiting y audit log en endpoints de auth.
- Backups PG automatizados + restauración probada (runbook).

### 4.4 Manejo de secretos

| Contexto | Dónde viven |
|---|---|
| Runtime dispositivo (PIN hash, salt) | SecureStore (Keychain/Keystore) — jamás en SQLite ni en logs |
| Cliente bundle | Solo `EXPO_PUBLIC_*` no sensibles |
| CI (EAS) | Credenciales EAS en el dashboard de Expo (no en repo) |
| Servidor Fase 2 | Secret manager / variables del orquestador; rotación documentada |

---

## 5. Runbook operativo MVP

| Evento | Acción |
|---|---|
| Bug en producción (JS) | Fix → `main` → `eas update --channel production` (minutos) |
| Cambio nativo | `eas build` nuevo → submit a tiendas |
| Regresión tras OTA | `eas update --channel production --republish` o rollback a versión anterior |
| Corrupción de caché de streaks | Herramienta dev: recompute total desde `habit_logs` (script `scripts/recompute-streaks.js`) |
| Próximo release | Tag `v*` → pipeline completo → QA en channel preview → promote |
