# Design Decisions

The approved design system for the GMS frontend redesign.

**Rules for this document:**
- Only decisions **manually approved by Anas** are recorded here. Nothing goes in on assumption.
- Each entry is a decision we've committed to and will apply consistently site-wide.
- Once an entry is here, treat it as binding for all new work unless a later approved entry supersedes it.

---

## 1. Corner radius — two-tier system

**Approved:** 2026-07-20

Lean boxier-but-deliberate over pill-round. Round enough to feel considered, square
enough to read as serious institutional software (the visual register of Linear,
Stripe dashboard, Salesforce — not consumer/startup). The goal is **two clear tiers**
(large surfaces softer than the controls inside them), not one uniform radius.

| Element | Radius | Tailwind |
| --- | --- | --- |
| Panels, cards, modals, hero banners | 12px | `rounded-xl` |
| Buttons, inputs, selects, tabs, filter pills | 8px | `rounded-lg` |
| Inner segmented-control buttons | 6px | `rounded-md` |
| Icon chips (KPI/list icon tiles) | 10px | `rounded-[10px]` |
| Status badges, chips, avatars, dots, progress rings | full pill | `rounded-full` |

**Rationale:** A small functional control should be *tighter* than the large surface
it sits on — equal radius flattens hierarchy and reads consumer. Full pill is reserved
for status/identity elements only, never for buttons or inputs.

**First applied in:** Digital Marketing page — `DigitalMarketing.tsx` (tab nav),
`CampaignsTab.tsx`, `MarketingDashboard.tsx`.

---

## 2. Dark theme deferred — but colors must go through semantic tokens

**Approved:** 2026-07-20

Dark mode is **not** being built as a deliverable right now. However, every color in
new work **must** be defined through a named semantic token (CSS variable / Tailwind
theme color), never a hardcoded hex literal (`bg-[#123f3c]`, `text-[#173b38]`, etc.).

**Rationale:** Deferring the dark *theme* costs nothing. Deferring the *token layer*
is what hurts — hardcoded hex has no dark equivalent, so retrofitting dark mode later
means hunting hundreds of literal colors across every component. With tokens, adding
dark mode becomes editing ~20 variable values in one place, not touching components.
Tokens also enforce consistency in light-only mode (one brand green, not three).

**What this means in practice:**
- Define a named palette (brand, surfaces, borders, text tiers, semantic
  success/warn/danger) once, at the theme layer.
- Reference tokens everywhere: `bg-[#123f3c]` → `bg-surface-brand` (or equivalent).
- No new component ships with arbitrary hex color values.
- Dark mode can be added later by supplying dark values for the same tokens.

**Open item:** decide whether new work adopts the existing legacy token names
(`dark-card`, `dark-foreground`, seen in legacy components) or a fresh token set.
This must be settled before the design is rolled to more pages.
