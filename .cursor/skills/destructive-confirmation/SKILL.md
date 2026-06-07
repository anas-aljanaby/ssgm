---
name: destructive-confirmation
description: Apply the GMS destructive delete/remove UX — modal stays open with loading, row highlight + exit animation, reusable hook. Use when adding or fixing delete buttons, ConfirmationModal flows, remove confirmations, or migrating instant-dismiss delete patterns.
---

# Destructive Confirmation (Delete in Modal)

Standard UX for **delete / remove** actions in GMS list pages and row actions. Reference implementation: `apps/web/src/components/pages/StaffPage.tsx`.

## UX flow (required)

```
User clicks Delete → ConfirmationModal opens
User clicks confirm → modal STAYS open, button shows spinner + "Deleting…"
                   → target row stays visible, tinted + "Deleting…" badge
API succeeds      → modal closes → row fades/slides out (~220ms) → removed from cache → success toast
API fails         → modal stays open → row restores → error toast → user can retry
```

While pending: block Cancel, backdrop click, and Escape.

## Do NOT

- Close the modal synchronously on confirm (before API completes)
- Hide/remove the row optimistically before success
- Use `window.confirm` for new work
- Skip loading feedback on the confirm button

## Building blocks

| File | Role |
|------|------|
| `apps/web/src/hooks/useDestructiveConfirmation.ts` | Target state, pending, row highlight, exit animation |
| `apps/web/src/components/common/ConfirmationModal.tsx` | Async confirm, spinner, `isConfirming`, dismiss guard |
| `apps/web/public/locales/{en,ar}/common.json` | `common.deleting` |

## When to use

- Table/list row delete (staff, platform orgs, beneficiaries, financials, etc.)
- Any destructive action where failure is possible and the item should remain visible until confirmed

## When to skip row animation

- Single-item detail pages with no list row (use hook + modal only; omit row classes)
- Inline nested items inside tabs (apply pending badge on the card/row container if one exists)

---

## Implementation checklist (list page)

### 1. Hook

```tsx
import { useDestructiveConfirmation } from '../../hooks/useDestructiveConfirmation';

const deletion = useDestructiveConfirmation<MyItem>({ getRowId: (item) => item.id });
```

### 2. Open + confirm handlers

```tsx
// Delete icon/button
onClick={() => deletion.open(item)}
disabled={rowBusy || deletion.isPending}

// Modal confirm — API only inside confirm(); cache update after success
const handleDelete = () =>
  deletion.confirm(async (item) => {
    await deleteMutation.mutateAsync(item.id);
  })
    .then((removed) => {
      if (!removed) return;
      setCache((current) => current.filter((x) => x.id !== removed.id));
      showSuccess(t('module.deleted'));
    })
    .catch((err) => showError(mapError(err)));
```

**Never** call `setDeleteTarget(null)` or filter the row out before `confirm()` resolves.

### 3. ConfirmationModal

```tsx
<ConfirmationModal
  isOpen={deletion.isOpen}
  onClose={deletion.close}
  onConfirm={handleDelete}
  isConfirming={deletion.isPending}
  title={t('module.delete_title')}
  message={t('module.delete_confirm', { name: displayName(deletion.target) })}
  confirmLabel={t('common.delete')}
  confirmingLabel={t('common.deleting')}
/>
```

`onConfirm` may return `Promise<void>` — modal awaits it. Pass `isConfirming` from the hook so pending state stays in sync when the parent owns the async work.

### 4. Row visual states

Per row inside `.map()`:

```tsx
const rowPending = deletion.isRowPending(item.id);
const rowExiting = deletion.isRowExiting(item.id);
const rowBusy = deletion.isRowBusy(item.id);
```

**Row `<tr>` / card classes:**

```tsx
className={`transition-all duration-200 ${
  rowExiting
    ? 'opacity-0 -translate-x-2 scale-[0.98]'
    : rowPending
      ? 'bg-red-50/70 dark:bg-red-900/15 opacity-80'
      : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
}`}
```

**Pending badge** (primary label cell, mirrors create "Saving" pattern):

```tsx
{rowPending && (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300/40 border-t-red-600 dark:border-red-700/40 dark:border-t-red-300" aria-hidden="true" />
    {t('common.deleting')}
  </span>
)}
```

### 5. Translations

Add module-specific `delete_title` and `delete_confirm` in `apps/web/public/locales/{en,ar}/<module>.json`.

Reuse `common.deleting`, `common.delete`, `common.cancel` — do not hardcode UI strings.

---

## Hook API

```tsx
const {
  target,        // item passed to deletion.open()
  isOpen,
  isPending,
  open,
  close,         // no-ops while pending
  confirm,       // async (item) => Promise<void> → returns item on success, throws on error
  isRowPending,
  isRowExiting,
  isRowBusy,
} = useDestructiveConfirmation<T>({ getRowId });
```

- `ROW_EXIT_MS` (220) — wait after API success before caller removes from cache
- Remove from TanStack cache **in `.then()` after `confirm` resolves**, not inside optimistic pre-delete state

---

## Migrating legacy patterns

Replace these anti-patterns:

| Legacy | Replace with |
|--------|----------------|
| `setDeleteTarget(null)` at start of `handleDelete` | Close via hook inside `confirm()` after API success |
| `deletingIds` filters row out immediately | `isRowPending` tints row; keep in list until success |
| `pendingDeleteIdsRef` + instant row hide | `deletion.isRowBusy(id)` disables delete button |
| `ConfirmationModal` without `isConfirming` | Pass `isConfirming={deletion.isPending}` |
| `window.confirm(...)` | `ConfirmationModal` + hook |

Pages still on legacy pattern (migrate when touched): `PlatformPage.tsx`, `BeneficiaryRowActions.tsx`, `TransactionRowActions.tsx`, various beneficiary tabs.

---

## ConfirmationModal contract

Already supports:

- `onConfirm: () => void | Promise<void>`
- `isConfirming?: boolean` — parent-controlled busy state
- `confirmingLabel?: string` — defaults to `t('common.deleting')`
- Backdrop / Escape / Cancel disabled while busy

Do not reintroduce a `hasConfirmed` one-shot disable without resetting on error — the hook + `isPending` handles double-submit prevention.

---

## Reference

| Module | File | Notes |
|--------|------|-------|
| Staff | `apps/web/src/components/pages/StaffPage.tsx` | Full table + modal + cache pattern |

Copy structure from StaffPage delete flow; adapt `displayName`, error mapping, and cache updater to the module.

---

## Verification

After implementing:

1. `npm run build:web` — zero TS errors
2. Browser: open confirm → click Delete → modal shows spinner, row shows "Deleting…"
3. On success: modal closes, row animates out, toast appears
4. On forced error (e.g. last-admin guard): modal stays, row restores, error toast
5. Arabic locale: `common.deleting` renders correctly (RTL)
