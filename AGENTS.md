# Kurumsal Bilgi ve Destek Asistanı

Employee portal that combines sourced answers to corporate questions with support request creation and tracking. Only the employee experience is in scope; there are no admin or support-agent screens.

## Sources of truth

- `PROJE_TANIMI.md`: product scope, terminology, business rules, and acceptance criteria. Read it before any change that affects behavior, data, wording, or scope. Do not put technology decisions in it.
- `.codex/skills/frontend-development/SKILL.md`: React, Radix UI, design tokens, typography, accessibility, and demo-data rules. Read and follow it for every UI task.
- Root `index.html`: original static prototype and the color and typography reference used by the skill. Do not edit it unless asked.

## Repository layout

```text
front-end/   React 19 + Vite 8 + TypeScript employee portal (Radix UI Themes, Radix Icons, oxlint)
back-end/    Express 4 + TypeScript REST API on Node's built-in node:sqlite, with Swagger UI
.codex/      Agent skill and MCP config (Penpot at localhost:4401, Playwright)
```

The two apps are not connected yet. The front-end keeps its state in `localStorage` (`src/app/store.ts`, demo records in `src/data.ts`) and makes no API calls. Wire it to the back-end only when the user asks.

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
npm test           # node:test via tsx, test/api.test.ts
npm run build
```

The back-end requires Node `>=22.13` for `node:sqlite`. Run the checks for every project you changed before finishing.

## Shared domain rules

These apply to both apps and must stay identical on each side:

- Request statuses, exactly: `Yeni`, `İnceleniyor`, `Kullanıcıdan Bilgi Bekleniyor`, `Devam Ediyor`, `Çözüldü`, `Kapatıldı`. Open statuses are the first four.
- Priorities: `Düşük`, `Normal`, `Yüksek`.
- New requests start in `Yeni` with one initial history entry, get a unique number, and are created only once per submission.
- Counters, lists, detail views, notifications, messages, and status history derive from the same records. Adding a message updates the request's last-updated time.
- Employees cannot change support-managed statuses.
- Attachments: PDF, PNG, JPG/JPEG, max 5 MB each. Only metadata is stored; file contents are never persisted.
- Assistant answers link to an existing source document section. When nothing matches, say so and offer a support request. Never invent documents, policies, or links.
- Label fictional users, documents, messages, and unavailable integrations (auth, AI, storage, notifications, live support) as demo behavior.
- Render user text as plain content, never as markup.

Known inconsistency: the category and subcategory lists in `front-end/src/data.ts` and `back-end/src/config/constants.ts` differ from the table in `PROJE_TANIMI.md` section 7.6. Do not change one side only; ask the user which list is authoritative before touching categories.

## Front-end work

1. Make changes inside `front-end/` unless the user asks for another project file.
2. Use Radix UI Themes and Radix Icons as the component foundation. Prefer Radix components for buttons, form controls, dialogs, dropdown menus, tabs, badges, avatars, and tooltips; style them with the project CSS tokens instead of rebuilding their behavior.
3. The Radix `Theme` is wrapped by `AppTheme` in `src/components/ThemeToggleButton.tsx`, which provides light and dark appearance. Keep `@radix-ui/themes/styles.css` imported once in `src/main.tsx`, and add dark-mode overrides to `src/styles/dark.css` for any new styles.
4. Routing is hash-based (`src/app/navigation.ts`); pages live in `src/pages/`, shared UI in `src/components/`, types in `src/types.ts`.
5. When implementing an approved Penpot screen, inspect the current design first and reproduce its responsive hierarchy and typography.
6. Check the affected flow at desktop and mobile widths.

## Back-end work

1. Make changes inside `back-end/` unless the user asks otherwise.
2. Follow the module layout: `src/modules/<feature>/<feature>.routes.ts` for Express routers and `<feature>.service.ts` for logic and SQL. Shared pieces live in `src/config/constants.ts`, `src/db/` (schema, seed, SQL helpers), `src/middleware/`, and `src/shared/`.
3. Root-level files in `src/` (`assistant.ts`, `constants.ts`, `db.ts`, `domain.ts`, `http.ts`, `sql.ts`) are legacy re-exports or unused copies. Do not add code to them; import from the module paths instead.
4. Routers receive `db` and an injectable `now` clock through `createApp` in `src/app.ts`. Keep that pattern so tests stay deterministic.
5. Every `/api` route except the public auth routes requires a bearer token via `requireAuth`. Throw `HttpError` with a Turkish user-facing message for client errors.
6. Use `?` placeholders for SQL parameters and wrap multi-step writes in the `transaction` helper.
7. When you add or change an endpoint, update `src/docs/openapi.ts` and add or adjust a test in `test/api.test.ts`.
8. The SQLite file defaults to `back-end/data/app.sqlite` (git-ignored) and can be overridden with `DATABASE_PATH`. Seeding runs only on an empty database. Use `:memory:` or a temp directory in tests.
9. CORS allows only `http://localhost:5173`. Authentication is demo-only (`deniz.yilmaz@ornek-kurum.com` / `kurumsaldemo`); do not present it as real.

## Boundaries

- Do not add admin or support-agent roles, real integrations, or new user roles unless explicitly requested.
- Do not add a second general-purpose UI library or an ORM without discussing it first.
- Do not commit `node_modules/`, `dist/`, `back-end/data/`, or `.playwright-mcp/`.
