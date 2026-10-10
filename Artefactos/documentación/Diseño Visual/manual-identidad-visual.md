# Manual de Identidad Visual — «Pulse Clay»

> **Single Source of Truth (SSOT)** de la identidad visual del proyecto *App Hábitos*.
> Toda decisión de UI debe consultar este documento. Si existe conflicto entre
> este manual y otro artefacto, **prevalece este manual**.

| Meta | Valor |
|---|---|
| Proyecto | App Hábitos (hábitos + metas + bienestar) |
| Plataforma | Móvil — iOS / Android (primary), responsive web secundario |
| Público | Jóvenes digitales, 18–35 años |
| Estilo definido | **Pulse Clay** — Claymorfismo lúdico energético |
| Versión | 1.0 |
| Fecha | 2026-10-09 |
| Prototipo aprobado | `Artefactos/documentación/Prototipos/prototipo-a-pulse-clay.html` |

---

## 1. Concepto de marca

**Metáfora:** arcilla moldeada. Los elementos de la interfaz son objetos
táctiles, "inflados" y prensables: cada interacción se siente física
(presión → hundimiento → rebote). La progresión de hábitos se materializa en
volúmenes (badges, rachas, barras) — *ganar se siente*.

**Personalidad:** motivadora, cálida, juguetona sin ser infantil.
**Emociones a evocar:** motivación/constancia · claridad/tranquilidad · diversión/gamificación.

**Wordmark (propuesto — aún no hay logo):** "Hábitos" en **Sora 800**, tracking `-0.03em`,
con la **"o" en `#6D4BF5`** (primary) y un **punto coral `#FF6B6B`** flotante a la
derecha, a altura de mayúscula (la "chispa" de la racha). Hasta existir logo oficial,
el wordmark tipográfico es el identificador único.

---

## 2. Tokens de diseño

### 2.1 Color — claro (valores canónicos)

| Rol semántico | HEX | Uso permitido | WCAG (par indicado) |
|---|---|---|---|
| `primary` | `#6D4BF5` | CTA, estado activo, foco, enlaces, barra de progreso | Blanco sobre `#6D4BF5` = **5.3:1 AA** |
| `primary-hover` | `#5B3AE0` | Hover de CTA (web) | — |
| `primary-active` | `#4F32CC` | Estado presionado | — |
| `primary-disabled` | `#C9BEFD` | Fondo de CTA deshabilitado (texto `#8B84A6`) | Solo UI, sin requisito texto |
| `primary-soft` | `#EDE9FE` | Fondos sutiles, indicador de tab activa, hover ghost | — |
| `secondary` | `#2EC4B6` | Bienestar/progreso: gráficos, fondos con **texto ink** `#0B2E2B` | `#0B2E2B` sobre `#2EC4B6` = **6.5:1 AA** |
| `accent-streak` | `#FF6B6B` | Rachas, retos, urgencia — **solo gráfico o sobre oscuro** | Sobre `#17122B` = 7.4:1; **prohibido como texto sobre claro** |
| `accent-award` | `#F59E0B` | Medallas, logros — **solo gráfico o badge con texto oscuro** | Sobre blanco 2.1:1 → **no texto** |
| `background` | `#F7F5FF` | Fondo de app (blanco lila) | — |
| `surface` | `#FFFFFF` | Cards, sheets, inputs, barras | — |
| `surface-alt` | `#EFEBFF` | Skeletons, chips inactivos, hover ghost | — |
| `text` | `#17122B` | Texto principal | Sobre `#F7F5FF` = **16.8:1 AAA** |
| `text-muted` | `#67617E` | Texto secundario, helpers, placeholders | Sobre `#F7F5FF` = **5.4:1 AA** |
| `border` | `#E4DFF3` | Bordes, separadores, bordes de input | — |
| `success` | `#22C55E` | Check, éxito (gráfico); en badges usar tint `#DCFCE7` + texto `#15803D` (4.6:1 AA) | — |
| `warning` | `#F59E0B` | Advertencias (gráfico); badge tint `#FEF3C7` + texto `#B45309` (4.5:1 AA) | — |
| `error` | `#DC2626` | Texto/borde de error y botón peligro sólido | Blanco sobre `#DC2626` = **5.0:1 AA** |
| `error-bright` | `#EF4444` | Iconos, bordes, estados gráficos | — |
| `white` | `#FFFFFF` | Texto sobre primary/error | — |
| `ink-on-secondary` | `#0B2E2B` | Texto sobre `secondary` | — |

**Badge tint pattern (AA garantizado):**

| Badge | Background | Texto | Ratio |
|---|---|---|---|
| Racha/streak | `#FEE2E2` | `#B91C1C` | 5.3:1 |
| Completado | `#DCFCE7` | `#15803D` | 4.6:1 |
| Nivel/logro | `#FEF3C7` | `#B45309` | 4.5:1 |
| Info/meta | `#EDE9FE` | `#6D28D9` | 6.0:1 |

### 2.2 Color — modo oscuro

| Rol | HEX | Notas |
|---|---|---|
| `dark-bg` | `#12101C` | Fondo de app |
| `dark-surface` | `#1C1930` | Cards, inputs |
| `dark-border` | `#2E2947` | Bordes, divisores |
| `dark-text` | `#F2EFFF` | Sobre `dark-bg` = ~17:1 **AAA** |
| `dark-text-muted` | `#9B95B5` | Sobre `dark-surface` = 6.0:1 **AA** |
| `primary-dark` | `#8B78FF` | Botones sólidos en dark: **fondo `#8B78FF` + texto `#12101C`** (5.6:1 AA). Blanco solo ≥18.66px bold. |

### 2.3 CSS Custom Properties (claro)

```css
:root {
  /* color */
  --color-primary:#6D4BF5; --color-primary-hover:#5B3AE0; --color-primary-active:#4F32CC;
  --color-primary-disabled:#C9BEFD; --color-primary-disabled-text:#8B84A6;
  --color-primary-soft:#EDE9FE;
  --color-secondary:#2EC4B6; --color-ink-on-secondary:#0B2E2B;
  --color-accent-streak:#FF6B6B; --color-accent-award:#F59E0B;
  --color-bg:#F7F5FF; --color-surface:#FFFFFF; --color-surface-alt:#EFEBFF;
  --color-text:#17122B; --color-text-muted:#67617E; --color-border:#E4DFF3;
  --color-success:#22C55E; --color-warning:#F59E0B;
  --color-error:#DC2626; --color-error-bright:#EF4444;

  /* spacing (base 4) */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;

  /* radius */
  --radius-sm:12px; --radius-md:16px; --radius-lg:24px; --radius-xl:32px;
  --radius-pill:999px;

  /* shadows (clay) */
  --shadow-clay:0 8px 20px rgba(23,18,43,.08),
                inset 0 2px 0 rgba(255,255,255,.9),
                inset 0 -4px 8px rgba(109,75,245,.06);
  --shadow-clay-hover:0 14px 28px rgba(23,18,43,.12),
                inset 0 2px 0 rgba(255,255,255,.95),
                inset 0 -4px 8px rgba(109,75,245,.08);
  --shadow-press:inset 0 4px 10px rgba(23,18,43,.14),
                inset 0 2px 0 rgba(255,255,255,.6);
  --shadow-sheet:0 -16px 40px rgba(23,18,43,.20);
  --focus-ring:0 0 0 2px #FFFFFF, 0 0 0 5px #6D4BF5;

  /* motion */
  --ease-std:cubic-bezier(.2,.8,.2,1);
  --ease-clay:cubic-bezier(.34,1.56,.64,1);
  --dur-press:120ms; --dur-fast:180ms; --dur-base:240ms;
  --dur-sheet:320ms; --dur-slow:400ms;

  /* typography */
  --font-display:'Sora',sans-serif;
  --font-body:'Plus Jakarta Sans',sans-serif;
  --font-mono:'JetBrains Mono',monospace;

  /* z-index */
  --z-base:0; --z-raised:10; --z-sticky:100; --z-fab:200;
  --z-overlay:400; --z-toast:500;
}
```

### 2.4 Tokens JSON

```json
{
  "color": {
    "primary": {"value": "#6D4BF5", "role": "CTA, activo, foco, progreso"},
    "primaryHover": {"value": "#5B3AE0", "role": "hover CTA"},
    "primaryActive": {"value": "#4F32CC", "role": "press CTA"},
    "primaryDisabled": {"value": "#C9BEFD", "role": "deshabilitado fondo"},
    "primarySoft": {"value": "#EDE9FE", "role": "superficie sutil"},
    "secondary": {"value": "#2EC4B6", "role": "bienestar, progreso (con ink #0B2E2B)"},
    "accentStreak": {"value": "#FF6B6B", "role": "rachas (gráfico)"},
    "accentAward": {"value": "#F59E0B", "role": "logros (gráfico)"},
    "background": {"value": "#F7F5FF", "role": "fondo app"},
    "surface": {"value": "#FFFFFF", "role": "cards, sheets, inputs"},
    "surfaceAlt": {"value": "#EFEBFF", "role": "skeletons, chips, ghost hover"},
    "text": {"value": "#17122B", "role": "texto primario"},
    "textMuted": {"value": "#67617E", "role": "texto secundario"},
    "border": {"value": "#E4DFF3", "role": "bordes y divisores"},
    "success": {"value": "#22C55E", "role": "éxito"},
    "warning": {"value": "#F59E0B", "role": "advertencia"},
    "error": {"value": "#DC2626", "role": "error y destructivo sólido"},
    "errorBright": {"value": "#EF4444", "role": "iconos/bordes de error"}
  },
  "dark": {
    "bg": "#12101C", "surface": "#1C1930", "border": "#2E2947",
    "text": "#F2EFFF", "textMuted": "#9B95B5", "primary": "#8B78FF",
    "primaryInk": "#12101C"
  },
  "spacing": [4, 8, 12, 16, 20, 24, 32, 40],
  "radius": {"sm": 12, "md": 16, "lg": 24, "xl": 32, "pill": 999},
  "motion": {
    "easeStd": "cubic-bezier(.2,.8,.2,1)",
    "easeClay": "cubic-bezier(.34,1.56,.64,1)",
    "durations": {"press": 120, "fast": 180, "base": 240, "sheet": 320, "slow": 400}
  },
  "typography": {
    "display": {"family": "Sora", "weights": [700, 800], "scale": [34, 26, 20]},
    "body": {"family": "Plus Jakarta Sans", "weights": [400, 500, 600], "scale": [16, 14, 12]},
    "mono": {"family": "JetBrains Mono", "weights": [500, 700], "usage": "numerals, streaks, tiempo", "feature": "tabular-nums"}
  },
  "breakpoints": {"xs": 0, "sm": 480, "md": 768, "lg": 1024, "xl": 1280},
  "zIndex": {"base": 0, "raised": 10, "sticky": 100, "fab": 200, "overlay": 400, "toast": 500}
}
```

### 2.5 Tipografía — escala móvil

| Token | Familia | Peso | Tamaño / line-height | Uso |
|---|---|---|---|---|
| `display-34` | Sora | 800 | 34 / 1.1 | Pantalla principal, hitos |
| `title-26` | Sora | 700 | 26 / 1.15 | Títulos de pantalla |
| `heading-20` | Sora | 700 | 20 / 1.25 | Secciones, cards destacadas |
| `body-16` | Plus Jakarta Sans | 400/600 | 16 / 1.5 | Texto principal, botones |
| `body-sm-14` | Plus Jakarta Sans | 500 | 14 / 1.45 | Descripciones, listas |
| `label-12` | Plus Jakarta Sans | 600 | 12 / 1.3 · uppercase +0.08em | Labels, chips |
| `mono-20` | JetBrains Mono | 700 | 20 / 1.2 · `tabular-nums` | Streaks, métricas, tiempo |

### 2.6 Breakpoints (mobile-first)

| Token | Ancho | Aplicación |
|---|---|---|
| `xs` | < 480 | Móvil compacto (base de diseño) |
| `sm` | ≥ 480 | Móvil grande |
| `md` | ≥ 768 | Tablet |
| `lg` | ≥ 1024 | Web escritorio |
| `xl` | ≥ 1280 | Desktop amplio |

### 2.7 Sombbras y elevación

| Nivel | Token | Aplicación |
|---|---|---|
| 0 | ninguna | Elementos planos sobre fondo |
| 1 | `--shadow-clay` | Cards, botones, inputs |
| 2 | `--shadow-clay-hover` | Cards/botones en hover (web) |
| press | `--shadow-press` | Estado `:active` de todo elemento clay |
| sheet | `--shadow-sheet` | Bottom sheets y drawers |

---

## 3. Reglas de uso y PROHIBICIONES de color

| Color | ✅ Permitido | ❌ Prohibido |
|---|---|---|
| `primary #6D4BF5` | Un CTA primario por pantalla/visión; estados activos; iconos de énfasis; progreso | Fondo de pantalla completo; párrafos largos de texto; mezclar con otros violetas no tokenizados |
| `secondary #2EC4B6` | Gráficos de bienestar; fondos de chips con texto `#0B2E2B`; acentos de progreso | **Como texto sobre fondos claros** (2.2:1); competir con primary como CTA principal |
| `accent-streak #FF6B6B` | Iconos, badges tint, ilustraciones de racha | Texto sobre claro; CTA primario; fondos grandes |
| `accent-award #F59E0B` | Iconos de medalla, badges tint | Texto sobre claro; CTA |
| `error #DC2626` | Solo acciones destructivas y mensajes de error | Decoración; énfasis de marca |
| `background #F7F5FF` | Único fondo base de app | Usar blanco puro `#FFF` como fondo de pantalla (solo superficies) |
| `text #17122B` | Texto primario | Sobre fondos `primary`/oscuros sin verificar contraste |
| `text-muted #67617E` | Texto secundario ≥12px | Títulos; texto sobre `surface-alt` sin check |

**Reglas generales:**
- Máximo **2 colores saturados visibles por pantalla** además de primary.
- Todo par texto/fondo nuevo debe verificarse ≥ 4.5:1 (normal) o ≥ 3:1 (≥18.66px bold o componentes UI) antes de aprobarse.
- Gradientes decorativos: solo `primary → secondary` al 135° y ≤ 20% de opacidad en fondos.

---

## 4. Sistema de componentes — especificaciones estrictas

### 4.1 Elementos de acción

| Componente | Medidas | Estados (orden: default → …) |
|---|---|---|
| **Botón primario** | alto 52, padding-x 26, radius pill, texto 16/600 blanco | `#6D4BF5` → hover `#5B3AE0` + `translateY(-2px)` → active `#4F32CC` + `--shadow-press` + `scale(.97)` → focus `--focus-ring` → disabled bg `#C9BEFD` texto `#8B84A6` sin sombra |
| **Botón secundario** | igual, bg `surface`, borde 1.5 `border`, texto primary | hover: borde → primary; active: `--shadow-press` |
| **Botón ghost** | sin fondo, texto primary | hover: bg `primary-soft` |
| **Botón peligro** | bg `#DC2626`, texto blanco | active `#B91C1C`; variant glass: bg `rgba(239,68,68,.1)` + texto `#DC2626` |
| **Botón de icono** | 44×44, radius 14, icono 22 stroke 1.8 | hover borde primary; active `scale(.94)` |
| **FAB** | 56×56 circle, icono + 26 | sombra `0 10px 24px rgba(109,75,245,.45)`; active `scale(.94)` |

- **Un solo CTA primario por pantalla visible.** Todo lo demás: secundario/ghost.
- `min-width` del CTA principal: 160px. Texto de botón: verbo en infinitivo, ≤ 22 caracteres.

### 4.2 Navegación

| Componente | Especificación |
|---|---|
| Bottom tab bar | alto 64 + `safe-area-inset-bottom`; 3–5 tabs; icono 24, label 11/600; activo: `primary` + indicador pill `primary-soft`; inactivo `text-muted` |
| Top app bar | 56px; back con hitbox 44; título `heading-20` |
| Chips-tabs | alto 38, pill, scroll-x; activo bg primary + texto blanco; inactivo bg `surface-alt` + `text-muted` |
| Drawer | ancho ≤ 80%, radius derecha 24, backdrop `rgba(18,16,28,.55)` + blur 4 |
| Paginación | scroll infinito + botón "Cargar más" (secundario). Nunca números en móvil. |

### 4.3 Contenedores y superposiciones

| Componente | Especificación |
|---|---|
| Bottom sheet | radius top 24; handle 36×4 `#D8D2EE`; padding 12/24/36; sombra `--shadow-sheet`; backdrop `rgba(18,16,28,.55)` blur 4; **siempre** arrastre para cerrar + backdrop tap |
| Card clay | bg surface, radius 24, padding 16–20, `--shadow-clay`; pressed `--shadow-press` + `scale(.985)` |
| Tooltip | bg `#17122B`, texto `#F7F5FF`, radius 12, máx 260, punta 6px; en móvil: long-press o info icon |
| Accordion | item radius 16; chevron 180° / 200ms `ease-std` |
| Modal | En móvil **usar bottom sheet**; modales centrados solo en `md+` |

### 4.4 Entrada de datos

| Componente | Medidas | Estados |
|---|---|---|
| Input | alto 52, radius 16, borde 1.5 `border`, bg surface | default → hover borde `#CFC6F2` → focus borde primary + ring `rgba(109,75,245,.18)` → error borde `#EF4444` + msg 12 `#DC2626` → success borde `#22C55E` |
| Label | 13/600 `text` · Helper 12 `text-muted` (error: `#DC2626` con icono) | — |
| Checkbox | 24, radius 8, clay inset; marcado bg primary + check blanco 160ms `ease-clay` | indeterminate: guion primary |
| Radio | 24 circle, dot 10 primary, `ease-clay` 180ms | — |
| Toggle | 52×32 pill; knob 26 blanco; off `#D8D2EE` → on primary; 180ms | — |
| Select | patrón nativo; si custom → bottom sheet de filas 52px con check | — |
| Date picker | sheet calendario; día activo pill primary; hoy anillo `secondary` | — |
| Stepper | ± 44px circle bg `surface-alt` texto primary; valor mono tabular | botón deshabilitado en min/max |

### 4.5 Feedback

| Componente | Especificación |
|---|---|
| Toast | sobre tab bar, bg `#17122B`, texto `#F7F5FF`, radius 16, icono de estado, 4s o swipe; **máx 1 visible** |
| Badge | patrón tint + texto oscuro (§2.1); alto 24, pill, 11.5/700 |
| Progress | track `#DDD5FB`, fill gradiente `primary` 135°, alto 10, pill, animación 400ms |
| Spinner | 24–28px, arco ¾ primary, 800ms lineal |
| Skeleton | bg `surface-alt` con shimmer `primary-soft`, radius 12 |
| Empty state | blob pastel animado + `heading` + copy muted + CTA secundario |

### 4.6 Elementos de usuario

- Avatar: 40/48 circle, anillo 2px surface, fallback iniciales gradiente `primary → secondary`, estado online punto `#22C55E`.
- Fila de usuario: min-height 64, avatar 44, nombre 15/600, sub 14 muted, chevron.

### 4.7 Movimiento

| Regla | Valor |
|---|---|
| Easing estándar | `cubic-bezier(.2,.8,.2,1)` — entradas, salidas, cambios |
| Easing clay (rebote) | `cubic-bezier(.34,1.56,.64,1)` — solo: press, check, badge, stepper |
| Duraciones | press 120 · fast 180 · base 240 · sheet 320 · stagger 400 |
| Stagger máximo | 6 elementos, 40ms de diferencia |
| Prohibido | Parallax pesado, animaciones infinitas en contenido, shake > 3 ciclos |
| Accesibilidad | `prefers-reduced-motion: reduce` → anular spring, parallax y loop; conservar opacidad ≤100ms |

**Microinteracciones firma:** check de hábito con pop + anillo; “+1 🔥” flotante al sumar racha; fill de progreso con `ease-clay`; FAB `scale(.94)` al presionar.

---

## 5. Guías de accesibilidad

### 5.1 Contraste — pares aprobados (WCAG 2.1)

| Par | Ratio | Nivel |
|---|---|---|
| `#17122B` sobre `#F7F5FF` | 16.8:1 | AAA |
| `#17122B` sobre `#FFFFFF` | 17.4:1 | AAA |
| `#67617E` sobre `#F7F5FF` | 5.4:1 | AA |
| `#FFFFFF` sobre `#6D4BF5` | 5.3:1 | AA |
| `#6D4BF5` sobre `#FFFFFF` | 5.3:1 | AA |
| `#FFFFFF` sobre `#DC2626` | 5.0:1 | AA |
| `#0B2E2B` sobre `#2EC4B6` | 6.5:1 | AA |
| Badges tint (§2.1) | 4.5–6.0:1 | AA |
| Dark: `#F2EFFF`/`#12101C` | ~17:1 | AAA |
| Dark: `#9B95B5`/`#1C1930` | 6.0:1 | AA |
| Dark: `#12101C`/`#8B78FF` | 5.6:1 | AA |

### 5.2 Focus states (obligatorio)

- Focus normativo de dos tonos: `box-shadow: 0 0 0 2px #FFF, 0 0 0 5px #6D4BF5` (dark: `0 0 0 2px #12101C, 0 0 0 5px #8B78FF`).
- Nunca eliminar el outline sin proporcionar sustituto visible.
- Orden de foco lógico en DOM; elementos no interactivos con `tabindex="-1"`.

### 5.3 Táctil y movimiento

- Todo target táctil ≥ **44×44px** (mín. separación 8px entre targets).
- Zonas de polgar: acciones primarias en tercio inferior; nunca arriba-izquierda para acciones críticas.
- Gestos siempre con alternativa visible (botón).
- Soportar `prefers-reduced-motion` y escalado de fuente hasta 200% sin rotura.

---

## 6. Do's and Don'ts

**✅ Sí**
- Radios del sistema (12/16/24/32/pill) — nunca valores arbitrarios.
- Sombras clay duales en todo elemento elevado; `--shadow-press` en toda interacción.
- Mono + `tabular-nums` para cualquier número que cambie en pantalla.
- Un CTA primario por pantalla; jerarquía primary → secondary → ghost.
- Tint badges con texto oscuro para estados.

**❌ No**
- No usar `#FF6B6B`/`#F59E0B` como texto sobre fondos claros.
- No usar `secondary` como color de CTA principal ni como texto en claro.
- No mezclar más de 2 saturados + primary en una misma pantalla.
- No inventar colores, sombras, radios ni fuentes fuera de este manual.
- No usar glassmorphism, neumorphism ni gradientes ajenos al par `primary → secondary`.
- No animar contenido infinitamente ni sin `prefers-reduced-motion`.
- No usar modales centrados en móvil.

---

## 7. Integración futura

- **Web:** tokens como CSS custom properties (§2.3) en `:root`; tema oscuro en `[data-theme="dark"]`.
- **React Native:** mapear a `StyleSheet` / tema (colores hex literales, sombras vía `shadow*`/`elevation`).
- **Tailwind:** extender `theme.extend.colors` con los nombres semánticos (`primary`, `surface`, `text-muted`…).
- El prototipo A (`prototipo-a-pulse-clay.html`) es la **referencia visual executable** de este manual.

---

*Documento generado como SSOT — edición solo mediante proceso de diseño con validación de usuario.*
