# Kurumsal Bilgi ve Destek Asistanı

## Front-end work

For every task that creates, changes, or reviews the user interface:

1. Read `PROJE_TANIMI.md` for product scope, terminology, business rules, and acceptance criteria.
2. Read `.codex/skills/frontend-development/SKILL.md` and follow its React, Vite, TypeScript, Radix UI, design, typography, accessibility, demo-data, and validation guidance.
3. Make application changes inside `front-end/` unless the user explicitly requests another project file.

The front-end represents the employee experience only. Preserve the exact request statuses and keep assistant sources, requests, counters, notifications, messages, and status history consistent with the same client-side data.

Use Radix UI Themes and Radix Icons as the component foundation. Prefer Radix components for buttons, form controls, dialogs, dropdown menus, tabs, badges, avatars, tooltips, and other matching interface patterns; extend them with project CSS tokens instead of rebuilding their interaction behavior from scratch.

When implementing an approved Penpot screen, inspect the current design before coding and reproduce its responsive hierarchy and typography. Clearly label fictional content and unavailable integrations as demo behavior.

Use the existing project scripts for validation:

```powershell
cd front-end
npm run lint
npm run build
```
