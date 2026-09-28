# Kurumsal Bilgi ve Destek Asistanı

Employee portal that combines sourced answers to corporate questions with support request creation and tracking, plus a demo support-staff role that works team queues (`PROJE_TANIMI.md` section 17). There are no admin screens.

## Sources of truth

- `PROJE_TANIMI.md`: product scope, terminology, business rules, and acceptance criteria. Read it before any change that affects behavior, data, wording, or scope. Do not put technology decisions in it.
- `.codex/skills/frontend-development/SKILL.md`: React, Radix UI, design tokens, typography, and accessibility. Read and follow it for every UI task.
- Root `index.html`: original static prototype and the color and typography reference used by the skill. Do not edit it unless asked.
- `.cursor/rules/`: scoped rules for Turkish text, API modules, the database, tests, React state, and styles. They load when their glob matches. Do not copy them into this file.

## Repository layout

```text
front-end/   React 19 + Vite 8 + TypeScript employee portal
             (Radix UI Themes, Radix Icons, TanStack Query, oxlint)
back-end/    Express 4 + TypeScript REST API on node:sqlite, with Zod and Swagger UI
.codex/      Agent skill and MCP config (Penpot at localhost:4401, Playwright)
```

The front-end calls the back-end through `front-end/src/api/`. Server state is cached with TanStack Query. `localStorage` holds only the bearer token (`kurumsal-destek-token`) and the theme (`portal-appearance`). The API base URL is `VITE_API_URL`, defaulting to `http://localhost:3001`. Start the back-end before the front-end.

## Commands

Run commands from the matching directory. The shell is PowerShell on Windows.

```powershell
cd front-end
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build    # tsc -b && vite build

cd back-end
npm run dev        # tsx watch, http://localhost:3001, Swagger at /api-docs
npm run typecheck
npm test           # node:test via tsx, test/api.test.ts and test/support.test.ts
npm run build
```

The back-end requires Node `>=22.13` for `node:sqlite`. Run the checks for every project you changed before finishing.

## Shared domain rules

These apply to both apps and must stay identical. Status and priority unions live in `back-end/src/config/constants.ts` and `front-end/src/types.ts` (lists also in `front-end/src/app/navigation.ts`).

- Request statuses, exactly: `Yeni`, `İnceleniyor`, `Kullanıcıdan Bilgi Bekleniyor`, `Devam Ediyor`, `Çözüldü`, `Kapatıldı`. Open statuses are the first four.
- Priorities: `Düşük`, `Normal`, `Yüksek`.
- New requests start in `Yeni` with one initial history entry, get a unique number, and are created only once per submission.
- Counters, lists, detail views, notifications, messages, and status history derive from the same records. Adding a message updates the request's last-updated time.
- Employees cannot change support-managed statuses, assignments, or internal notes. Only assigned support staff change status, following `STATUS_TRANSITIONS` in `constants.ts`; the one automatic change is Kullanıcıdan Bilgi Bekleniyor → İnceleniyor when the employee replies.
- Internal notes and internal timeline rows (`visibility` `'internal'`) are never returned by employee endpoints.
- Attachments: PDF, PNG, JPG/JPEG, max 5 MB each. Only metadata is stored; file contents are never persisted.
- Assistant answers link to an existing source document section. When nothing matches, say so and offer a support request. Never invent documents, policies, or links.
- Label fictional users, documents, messages, and unavailable integrations (auth, AI, storage, notifications, live support) as demo behavior.
- Render user text as plain content, never as markup.

## Front-end work

1. Make changes inside `front-end/` unless the user asks for another project file.
2. Use Radix UI Themes and Radix Icons as the component foundation. Prefer Radix components for buttons, form controls, dialogs, dropdown menus, tabs, badges, avatars, and tooltips; style them with the project CSS tokens instead of rebuilding their behavior.
3. The Radix `Theme` is wrapped by `AppTheme` in `src/components/ThemeToggleButton.tsx`, which provides light and dark appearance. Keep `@radix-ui/themes/styles.css` imported once in `src/main.tsx`, and add dark-mode overrides to `src/styles/dark.css` for any new styles.
4. Routing is hash-based (`src/app/navigation.ts`); pages live in `src/pages/`, shared UI in `src/components/`, domain types in `src/types.ts`, and HTTP calls in `src/api/`.
5. `QueryClientProvider` is created in `src/main.tsx`. Pages own their queries and mutations. After a write, invalidate every query the write changes (`requests`, `request`, `notifications`, `conversations`).
6. When implementing an approved Penpot screen, inspect the current design first and reproduce its responsive hierarchy and typography.
7. Check the affected flow at desktop and mobile widths.

## Back-end work

1. Make changes inside `back-end/` unless the user asks otherwise.
2. Follow the module layout: `src/modules/<feature>/<feature>.routes.ts` for Express routers, `<feature>.service.ts` for logic and SQL, and `<feature>.schema.ts` for Zod input schemas parsed with `parseInput` from `src/shared/validate.ts`. Shared pieces live in `src/config/constants.ts`, `src/db/` (schema, seed, SQL helpers), `src/middleware/`, and `src/shared/`.
3. Import shared code from the module paths (`src/config/constants.ts`, `src/db/`, `src/shared/`, and `src/modules/`).
4. Routers receive `db` and an injectable `now` clock through `createApp` in `src/app.ts`. Keep that pattern so tests stay deterministic.
5. Every `/api` route except the public auth routes requires a bearer token via `requireAuth`. Employee routers are mounted behind `requireRole("employee")`, `/api/support` behind `requireRole("support")`; a wrong role gets 403. Throw `HttpError` with a Turkish user-facing message for client errors.
6. Use `?` placeholders for SQL parameters and wrap multi-step writes in the `transaction` helper.
7. When you add or change an endpoint, update `src/docs/openapi.ts` and add or adjust a test in `test/api.test.ts` (employee) or `test/support.test.ts` (support staff).
8. The SQLite file defaults to `back-end/data/app.sqlite` (git-ignored) and can be overridden with `DATABASE_PATH`. Seeding runs only on an empty database; schema changes after that are applied by numbered migrations tracked with `PRAGMA user_version` (`src/db/migrations.ts`). Use `:memory:` or a temp directory in tests.
9. CORS allows a single origin: `CORS_ORIGIN`, defaulting to `http://localhost:5173`. Authentication is demo-only: employee `deniz.yilmaz@ornek-kurum.com`, support staff `ahmet.kaya@`, `elif.demir@` (BT Destek Ekibi) and `zeynep.arslan@ornek-kurum.com` (İnsan Kaynakları Ekibi), all with `kurumsaldemo`. Do not present it as real.

## Boundaries

- Do not add admin screens, real integrations, or roles beyond employee and support unless explicitly requested. Support staff scope is limited to `PROJE_TANIMI.md` section 17.
- Do not add a second general-purpose UI library or an ORM without discussing it first.
- Do not commit `node_modules/`, `dist/`, `back-end/data/`, or `.playwright-mcp/`.
