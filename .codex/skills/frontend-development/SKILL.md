---
name: frontend-development
description: Build, revise, or review the React, Vite, and TypeScript employee portal in this project. Use for UI implementation, responsive behavior, accessibility, client-side state, demo data, and translating the approved Penpot design into the front-end. Do not use for backend services, real authentication, admin panels, or infrastructure work.
---

# Front-end Development

Develop the employee-facing **Kurumsal Bilgi ve Destek Asistanı** in the `front-end/` directory.

## Product source of truth

Read `PROJE_TANIMI.md` before changes that affect product behavior, navigation, data, terminology, or scope. Preserve these product invariants:

- The product combines sourced corporate answers with support request creation and tracking.
- The current scope contains only the employee experience. Do not introduce administrator or support-agent screens unless the user explicitly requests them.
- Label fictional users, documents, messages, requests, and assistant behavior clearly as demo or sample content.
- Do not present unavailable authentication, AI, file storage, notifications, or live support integrations as working services.
- Keep request counts, status labels, notifications, timelines, messages, and detail views consistent with the same API records. The front-end reads them through TanStack Query; do not keep a second client-side copy.
- Use these request statuses exactly: `Yeni`, `İnceleniyor`, `Kullanıcıdan Bilgi Bekleniyor`, `Devam Ediyor`, `Çözüldü`, `Kapatıldı`.

## Technical baseline

- Work inside `front-end/` unless the task explicitly requires another project file.
- Use React, Vite, and TypeScript. Keep TypeScript types explicit at component boundaries and for shared domain data.
- Use Radix UI Themes as the application component foundation and Radix Icons for interface icons. Prefer Radix components for controls, overlays, menus, tabs, badges, avatars, and tooltips; keep their keyboard interaction and focus behavior intact while styling them with the project tokens.
- Import `@radix-ui/themes/styles.css` once at the application entry point and wrap the application in a Radix `Theme`. Do not mix in a second general-purpose component library.
- Follow the existing package scripts and conventions. Prefer existing dependencies; add a dependency only when it provides clear value for the requested feature.
- Keep domain data and state separate from presentation components. Derive counters and filtered lists from query results instead of duplicating values.
- Prefer small components with clear responsibilities. Introduce shared components only when multiple screens need the same behavior or visual pattern.
- Demo users, documents, and requests live in the back-end seed. Do not add a second copy under `front-end/src`.

The current front-end layout is:

```text
src/
├── app/          Application shell, navigation, routes
├── api/          HTTP calls to the back-end
├── components/   Reusable visual components
├── pages/        Route screens
├── types.ts      Shared domain types
└── styles/       Global styles and design tokens
```

Do not reorganize working code solely to match this layout.

## Design implementation

- When a task refers to the Penpot design, inspect the current design or its exported measurements before implementation and reproduce its hierarchy, spacing, typography, colors, and responsive intent.
- Preserve the product's visual character: simple, modern, trustworthy, orderly, readable, and task focused.
- Use semantic HTML and reusable design values. Avoid scattered one-off colors, spacing values, and status styles when a shared token or component is appropriate.
- Treat desktop and mobile as intentional layouts. Forms become one column on small screens; request tables become readable cards; navigation remains operable.
- Do not use decorative motion or oversized marketing typography that competes with employee tasks.

## Color system

Treat the root `index.html` as the color source of truth. Preserve its core palette as semantic CSS variables:

```css
:root {
  --color-bg: #f6f8fb;
  --color-surface: #ffffff;
  --color-ink: #0f172a;
  --color-muted: #475569;
  --color-soft: #64748b;
  --color-line: #e2e8f0;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-nav: #111d35;
  --color-nav-active: #1e3154;
}
```

Use the same semantic pairs for request statuses. Always show the status text with the color treatment.

| Request status | Text | Background |
| --- | --- | --- |
| `Yeni` | `#1d4ed8` | `#dbeafe` |
| `İnceleniyor` | `#6d28d9` | `#ede9fe` |
| `Kullanıcıdan Bilgi Bekleniyor` | `#92400e` | `#fef3c7` |
| `Devam Ediyor` | `#0369a1` | `#e0f2fe` |
| `Çözüldü` | `#047857` | `#d1fae5` |
| `Kapatıldı` | `#475569` | `#e2e8f0` |

Preserve the supporting colors and their meanings:

| Purpose | Color |
| --- | --- |
| High priority and inline error text | `#b91c1c` |
| Normal priority | `#334155` |
| Low priority | `#64748b` |
| Danger border | `#fecaca` |
| Danger hover/background | `#fef2f2` |
| Error toast | `#991b1b` |
| Form control border | `#cbd5e1` |
| Keyboard focus outline | `#93c5fd` |
| Unread notification background | `#f8fbff` |
| Notification icon background/text | `#dbeafe` / `#2563eb` |

For the sidebar and brand treatment, use `#111d35` as the base, `#1e3154` for active navigation, `#2a3b59` for separators, `#d6e1f2` for prominent navigation text, `#c4d1e5` for normal navigation text, `#9fb1cd` for subdued sidebar text, `#60a5fa` for the active indicator, and `#3b82f6` for the brand mark and count accents.

- Use `--color-primary` for primary actions and links; use `--color-primary-hover` for their hover state.
- Prefer semantic variables or status mappings over repeating raw hex values in components.
- Do not invent additional status colors when one of the existing semantic pairs applies.
- Check text/background contrast and keep focus, error, priority, and status meaning visible without relying on color alone.

## Typography

Treat the root `index.html` as the typography source of truth when translating the existing portal into React. Use **Inter** with the same loaded weights and fallback stack:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

:root {
  font-size: 16px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}
```

Preserve the typography tokens defined in `index.html`:

| Token | Value | Intended use |
| --- | --- | --- |
| `--title` | `1.75rem` (`28px`) | Page titles; `1.5rem` (`24px`) at `max-width: 600px` |
| `--section` | `1.25rem` (`20px`) | Major section headings |
| `--card-title` | `1rem` (`16px`) | Card and panel headings |
| `--body` | `.875rem` (`14px`) | Default body, controls, and navigation copy |
| `--label` | `.8125rem` (`13px`) | Form and field labels |
| `--small` | `.75rem` (`12px`) | Metadata, helper text, and eyebrows |
| `--answer` | `1rem` (`16px`) | Assistant answer content |

Apply the same heading metrics:

```css
body { font-size: var(--body); line-height: 1.45; }
h1 { font-size: var(--title); line-height: 2.25rem; font-weight: 600; letter-spacing: -.035em; }
h2 { font-size: var(--section); line-height: 1.75rem; font-weight: 600; letter-spacing: -.02em; }
h3 { font-size: var(--card-title); line-height: 1.5rem; font-weight: 600; }
.small { font-size: var(--small); line-height: 1rem; }
.field-label { font-size: var(--label); line-height: 1.125rem; font-weight: 500; }
```

- Load and use only the weights present in `index.html`: `400`, `500`, `600`, and `700`.
- Use `500` for navigation, form labels, and secondary emphasis; `600` for headings, short labels, and primary actions; `700` only for compact brand or avatar emphasis.
- Keep the existing `.eyebrow` treatment: `.75rem`, weight `600`, uppercase, and `.08em` letter spacing.
- Preserve compact selector-specific sizes from `index.html` for metadata, badges, navigation counts, chat labels, and table content instead of enlarging the whole interface to a marketing scale.
- Use `font-variant-numeric: tabular-nums` for request numbers, counters, dates, times, and aligned table values.
- Let users zoom text without clipping. Avoid fixed text container heights unless the design requires a verified single-line label.
- Do not communicate request state through typography or color alone; always render the exact status text.

## Interaction and data rules

- Assistant answers that claim to be verified must point to an existing, openable document source and section.
- When no information is available, say so and offer support request creation.
- Before transferring assistant context into a request, show the question, answer, and sources and let the user remove that context.
- Validate required request fields and accepted attachment metadata. Do not imply that file contents persist when no storage exists.
- A valid submission creates one unique request in `Yeni` status and adds its initial history record.
- Adding a request message updates the record's last-updated time immediately.
- Employees may read request status and history but may not directly change support-managed statuses.
- Render user-provided text as content; never interpret it as executable markup.

## Accessibility and states

- Use proper landmarks, headings, labels, buttons, and links. Give icon-only controls accessible names.
- Use the appropriate Radix component when it provides the required accessible interaction. Supply visible labels or accessible names for icon-only controls and meaningful dialog titles and descriptions.
- Ensure keyboard access, visible focus, sufficient contrast, and status meaning that does not depend on color alone.
- Manage focus when dialogs or source panels open and return focus to the trigger when they close.
- Provide clear loading, empty, success, validation, unavailable, and unknown-request states when the feature can enter them.
- Keep long answers, subjects, filenames, and source excerpts within their containers without hiding essential content.

## Completion checks

Run checks relevant to the files changed:

```powershell
cd front-end
npm run lint
npm run build
```

Also inspect the affected flow at desktop and mobile widths. Confirm that demo labels remain visible, request data stays consistent across screens, and no primary action is left inert without an explicit demo explanation.
