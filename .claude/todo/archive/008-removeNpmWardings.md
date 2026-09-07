Run `npm run check` and remove any problems and warnings.

## Task: Remove all accessibility warnings from npm run check

### Problem
After fixing type errors, `npm run check` was showing 7 accessibility warnings across 2 files.

### Initial State
**7 warnings** in:
- CardLabelManager.svelte (3 warnings)
- [card]/+page.svelte (4 warnings)

### Fixes Applied

#### 1. **CardLabelManager.svelte**

**Issue 1** (Line 144): `<div>` with role="menuitem" missing tabindex
```svelte
// Before
<div role="menuitem" onclick={...}>
  Create new label
</div>

// After - Changed to semantic button element
<button type="button" class="... w-full ..." onclick={...}>
  Create new label
</button>
```

**Issue 2** (Line 157): `<div>` with click handlers needs keyboard handler
```svelte
// Before
<div onclick={(e) => e.stopPropagation()}>

// After - Removed unnecessary event handlers (children handle their own events)
<div class="space-y-2 p-2">
```

#### 2. **[card]/+page.svelte**

**Issue 1** (Line 240): Backdrop div with click handler needs keyboard handler
```svelte
// Before
<div onclick={handleBackdropClick} role="button" tabindex="-1">

// After - Added keyboard handler for Enter and Space keys
<div
  onclick={handleBackdropClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeModal();
    }
  }}
  role="button"
  tabindex="-1"
>
```

**Issue 2** (Line 247): Inner dialog div missing tabindex and keyboard handler
```svelte
// Before
<div onclick={(e) => e.stopPropagation()}>

// After - Added role, tabindex, and keyboard handler
<div
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => e.stopPropagation()}
  role="dialog"
  tabindex="-1"
>
```

### Summary

**Before**: 0 errors, 7 warnings
**After**: 0 errors, 0 warnings ✅

All accessibility warnings resolved by:
1. Converting non-semantic divs to `<button>` elements where appropriate
2. Adding proper keyboard event handlers for interactive elements
3. Adding required ARIA attributes (role, tabindex)
4. Removing unnecessary event propagation handlers

### Status
✅ **COMPLETED** - All warnings fixed. Project passes `npm run check` with zero errors and zero warnings.