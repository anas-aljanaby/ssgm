# Page Build Prompt (Stage 2 of 3 — design → BUILD → activate)

> **What you (the human) do here:** The agent reads the approved spec (`PAGE_SPECS/<page>.md`) and builds page **X** as a polished, fully interactive **static** frontend — good UI/UX/RTL/bilingual, working edit/save, modals, mock data, **no backend yet**. **Open the page in the browser** and check it looks right and the interactions work (tabs switch, modals open and collect input, edit/save toggles, Arabic + dark mode render). You're approving look-and-feel before the expensive backend stage. Expect it to look different from — and better than — the client's original.

---

## What this stage is

You implement the structure decided in Stage 1 (DESIGN) as a complete, interactive **static** frontend. "Static" means the UI is fully alive but data is mock/local — no database, no API routes, no real persistence. That's the next stage's job (`PAGE_ACTIVATION_PROMPT.md`).

**Required input:** `PAGE_SPECS/<page>.md` — the approved spec. If it doesn't exist or wasn't approved, stop and ask. Build to the spec; do not re-litigate the design decisions here. If you believe the spec is wrong, raise it and wait — don't silently deviate.

**Mindset.** The client's original page (`full.ssgm.app` / the copied component) is **content and intent reference only**. You are building fresh from the spec, not surgically editing a coherent page. Pull real labels, field names, and section content from the client page where the spec keeps them; ignore its bad layout, dead controls, and visual noise. It is expected that the result looks meaningfully different from the original.

## Context

Bilingual (Arabic/English), RTL-first non-profit ERP. React 19 + Vite + TypeScript + TailwindCSS + i18next + Recharts + Framer Motion. Desktop only. The design system already exists — reuse it.

## Reference patterns to copy (don't invent new ones)

- **Edit/save in a detail view:** `apps/web/src/components/pages/beneficiaries/tabs/OverviewTab.tsx` (the `isContactEditing` edit-toggle pattern) and `apps/web/src/components/pages/donors_individual/DonorDetailView.tsx` (header edit mode).
- **List + detail + tabs + modals fully wired:** the donor module (`apps/web/src/components/pages/donors_individual/`).
- Match these for layout primitives, spacing, button styles, table styles, modal structure, and empty/loading states.

---

## Build rules

1. **Implement the spec's structure exactly** — the tabs, sections, order, renames, cuts, and new components from `PAGE_SPECS/<page>.md`. Cut what the spec cuts; build what it adds.

2. **Make every Manual-Entry field interactive:**
   - Read-only detail fields get an edit-mode toggle (pencil), with save/cancel.
   - Wire form state with `useState`; save/cancel restores or commits local state.

3. **Data tables:** accept their rows as a prop (never hardcode inside the table). Provide add / edit / delete actions in the UI that mutate local state. Add proper empty states.

4. **Modals (add/edit):** every field wired to state, with real validation (required, formats). The submit handler calls an `onSubmit` prop — **do not** hardcode persistence or call any API. Give the submit button a loading state so it's ready for wiring later.

5. **Mock data:** keep page-level mock data in `apps/web/src/data/*` and pass it down as props/state. Shape it like the "data each component needs" notes in the spec, so the ACTIVATE stage can swap it for real hooks with minimal change.

6. **Computed fields:** compute from the local data; handle missing/empty gracefully (no crashes on `undefined`).

7. **Cross-module references:** if a real hook already exists for the referenced module, you may use it read-only; otherwise keep a mock value and add `// TODO: wire to <module> when activated`. Follow the cross-module UX convention:
   - **Render cross-module data normally** — no decorative "from <module>" badges or "synced" chips. Users care about the information, not which table it lives in.
   - **Linked / related records are clickable** and navigate (drill through) to the source module's page. This is the standard relational affordance and the main way "this lives elsewhere" is signaled.
   - **Fields owned and edited by another module are read-only here** — do not render an edit pencil that leads nowhere. Drop the edit affordance and instead link the value to the owning page (optionally with a subtle "Managed in <module>" caption) so the user knows where to change it.

8. **Bilingual / RTL is mandatory:** every user-facing string goes through `t()`. Add keys to **both** `apps/web/public/locales/ar/<namespace>.json` and `.../en/<namespace>.json`. Verify RTL layout and dark mode.

9. **Do not:** add a DB table, Zod schema, Hono route, or TanStack hook that calls the real API for this page's data; add mobile/touch layouts; add tests; introduce a new visual language.

10. **Clean up your own orphans:** remove imports, components, routes, and translation keys that the restructure made unused. Update the sidebar/route config (`App.tsx`, sidebar config) if the spec deleted/merged/renamed the page. Mention — don't delete — unrelated pre-existing dead code.

---

## Verification

1. **Build:** `npm run build:web` compiles with zero errors.
2. **Visual:** `npm run dev:web`; the page loads with no console errors, all tabs/sections render, modals open and collect input, edit/save works on local state, navigation has no dead links, Arabic + English + dark mode all render correctly.

## Deliverable

In chat: files changed/created/deleted (one line each), navigation/route changes, translation keys added/removed, confirmation the build passes. Then stop.

## What the human reviews here (point them at this)

> Open the page in the browser (`npm run dev:web`). Click through every tab, open the add/edit modals, toggle an edit field and save, switch to Arabic, toggle dark mode. You're checking it **looks and feels** like a real product and matches the spec's structure — not whether data persists (it won't yet). If it looks right, approve and run the ACTIVATION prompt; if the layout/UX is off, fix here before paying for backend.
