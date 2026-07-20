# SiteGrade — Design System

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atelier (UI/UX Designer)

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color Tokens](#2-color-tokens)
3. [Typography](#3-typography)
4. [Spacing Scale](#4-spacing-scale)
5. [Border Radius & Shadows](#5-border-radius--shadows)
6. [Component Inventory](#6-component-inventory)
7. [Dark Mode Strategy](#7-dark-mode-strategy)
8. [Responsive Breakpoints](#8-responsive-breakpoints)
9. [Animation Guidelines](#9-animation-guidelines)
10. [Iconography](#10-iconography)

---

## 1. Design Principles

1. **Dark First** — SiteGrade is dark-mode-first. Every component designed for dark backgrounds.
2. **Score as Hero** — The score ring is the most important visual element. Everything else supports it.
3. **Density with Clarity** — Audit results are information-dense. Use spacing, hierarchy, progressive disclosure.
4. **Motion with Purpose** — Animations guide attention and provide feedback. No decorative-only motion.
5. **Accessible by Default** — All text passes WCAG AA contrast. Keyboard navigation works everywhere.

---

## 2. Color Tokens

### Primary Palette (Indigo)

```
--color-primary-50:   #EEF2FF    ← lightest tint
--color-primary-100:  #E0E7FF
--color-primary-200:  #C7D2FE
--color-primary-300:  #A5B4FC
--color-primary-400:  #818CF8
--color-primary-500:  #6366F1    ← main brand indigo
--color-primary-600:  #4F46E5    ← primary CTA buttons
--color-primary-700:  #4338CA
--color-primary-800:  #3730A3
--color-primary-900:  #312E81
```

### Accent (Cyan)

```
--color-accent-400:   #22D3EE
--color-accent-500:   #06B6D4    ← secondary accent
--color-accent-600:   #0891B2
```

### Semantic — Score Colors

```
--color-score-good:   #10B981    ← Emerald 500  (score 90–100)
--color-score-warn:   #F59E0B    ← Amber 500    (score 50–89)
--color-score-poor:   #EF4444    ← Red 500      (score 0–49)
```

### Semantic — Severity Colors

```
--color-critical:     #DC2626    ← Red 600
--color-serious:      #EA580C    ← Orange 600
--color-moderate:     #D97706    ← Amber 600
--color-minor:        #65A30D    ← Lime 600
```

### Neutral (Dark Mode Base)

```
--color-bg-base:      #0F0F14    ← page background
--color-bg-surface:   #1A1A24    ← card background
--color-bg-elevated:  #242433    ← modal, dropdown
--color-bg-overlay:   rgba(0,0,0,0.6)  ← modal backdrop

--color-border:        #2E2E3E    ← default border
--color-border-muted:  #1E1E2E    ← subtle divider
--color-border-focus:  #6366F1    ← focus ring

--color-text-primary:    #F8F8FC  ← headings, body
--color-text-secondary:  #A0A0B8  ← muted text
--color-text-disabled:   #5A5A72  ← disabled
```

### Functional Colors

```
--color-success:  #10B981    ← success toasts
--color-warning:  #F59E0B    ← warning toasts
--color-error:    #EF4444    ← error toasts, destructive
--color-info:     #3B82F6    ← info toasts
```

---

## 3. Typography

### Font Families

```
--font-sans: 'Inter', system-ui, -apple-system, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 12px | 16px | 400 | Badges, labels, metadata |
| `--text-sm` | 14px | 20px | 400 | Secondary, table cells, hints |
| `--text-base` | 16px | 24px | 400 | Body, inputs |
| `--text-lg` | 18px | 28px | 400 | Lead paragraphs |
| `--text-xl` | 20px | 28px | 500 | Subtitles |
| `--text-2xl` | 24px | 32px | 600 | Card/modals titles |
| `--text-3xl` | 30px | 36px | 700 | Page titles (H2) |
| `--text-4xl` | 36px | 40px | 700 | Section headings (H1) |
| `--text-5xl` | 48px | 52px | 800 | Hero sub-headline |
| `--text-6xl` | 56px | 60px | 800 | Hero headline |

---

## 4. Spacing Scale

Based on **4px base unit**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

---

## 5. Border Radius & Shadows

### Border Radius: 4px (badges), 8px (buttons/inputs), 12px (cards/panels), 16px (modals), 24px (score rings), 9999px (pills)

### Shadows (Dark Mode)

```
--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.4)
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)
--shadow-glow-primary:   0 0 20px rgba(99, 102, 241, 0.3)
--shadow-glow-score-good: 0 0 16px rgba(16, 185, 129, 0.3)
```

---

## 6. Component Inventory

| Component | Variants | Notes |
|-----------|----------|-------|
| **Button** | Primary, Secondary, Ghost, Destructive, Icon | Sizes: sm, md, lg, xl |
| **Input** | Default, Error, Disabled, URL-specific (xl) | With/without icons |
| **Badge** | Score, Severity, Plan, Status | Color-coded |
| **ScoreRing** | sm(40), md(60), lg(120), xl(160)px | Animated SVG |
| **CategoryCard** | Default, Compact, Expanded | With ScoreRing |
| **IssueItem** | Collapsed, Expanded (AI panel) | Severity color-coded |
| **ProgressBar** | Default, Animated (audit running) | Indigo, animated |
| **DataTable** | Sortable, Paginated | Audit history |
| **Modal** | Default, Confirmation | AnimatePresence exit |
| **Toast** | Success, Error, Warning, Info | Auto-dismiss 5s |
| **Tabs** | Underline (results), Pill (settings) | |
| **Skeleton** | Card, Row, ScoreRing, Text | Loading states |
| **Avatar** | Image, Initials fallback | 32, 40, 56px |
| **Tooltip** | Default | Score explanations |
| **CodeBlock** | Syntax highlighted | AI code examples, JetBrains Mono |
| **EmptyState** | Default | No audits/results |
| **Banner** | Info, Warning, Error | System messages |

---

## 7. Dark Mode Strategy

Dark-mode-first. All color tokens defined for dark backgrounds. No light mode toggle in v1.
`prefers-color-scheme: dark` respected by default. Score colors maintain WCAG AA on dark backgrounds.

Light mode planned for Phase 3 with Tailwind's `dark:` prefix.

---

## 8. Responsive Breakpoints

```
--breakpoint-sm:  640px   ← large mobile
--breakpoint-md:  768px   ← tablet
--breakpoint-lg:  1024px  ← small desktop
--breakpoint-xl:  1280px  ← desktop
--breakpoint-2xl: 1536px  ← large desktop
```

Mobile-first: base = mobile. Breakpoints add desktop styles.

### Layout by Breakpoint

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Dashboard sidebar | Hamburger menu | Hamburger menu | Fixed 240px |
| Score rings | Horizontal scroll | 3×2 grid | 6×1 row |
| Category cards | 1 column | 2 columns | 3 columns |
| Pricing cards | 1 column | 3 columns | 3 columns |

---

## 9. Animation Guidelines

### Principles
- Purpose-driven, fast (micro-interactions 150-200ms, transitions 200-300ms, entrances 300-500ms)
- Respect `prefers-reduced-motion: reduce`

### Animation Catalog

| Element | Animation | Duration | Tool |
|---------|-----------|----------|------|
| Score ring fill | stroke-dashoffset | 1000ms | Framer Motion |
| Page transitions | fade + slide-up | 300ms | Framer Motion |
| Modal open/close | scale + fade | 200/150ms | Framer Motion |
| Button press | scale(0.97) | 100ms | Framer Motion whileTap |
| Issue expand | height auto | 300ms | Framer Motion |
| Toast enter/exit | slide-right + fade | 300/200ms | Framer Motion |
| Progress bar | width transition | variable | CSS |

---

## 10. Iconography

SiteGrade uses **Lucide Icons** (shadcn/ui ecosystem).

**Category Icons:** Zap (Performance), Search (SEO), Accessibility (A11y), Shield (Security), Layout (UX), CheckCircle (Best Practices)

**Sizes:** 16px (inline), 20px (UI), 24px (standalone)
**Stroke width:** 1.5px (default), 2px (bold)

---

**Next:** See [API_INTEGRATIONS.md](API_INTEGRATIONS.md) for API integration details.