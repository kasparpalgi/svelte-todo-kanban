> Run with: Sonnet 4.6 / medium

# Invoicing

## Original Requirement

[NEVER REMOVE]

Make it possible to add clients company data and assing client user for the board admins and then invoice according to hours spent but possible to decide the list and then not all of the cards maybe eg. "Invoice" but let user decide. When invoiced moves to "Completed" list that every board has anyway built in.

_From Kanban card `41e26b4c-cfb5-4e2d-bac7-cac77b3da1b3`, moved to the agent list._

_GitHub issue #133 — end the commit subject with `(#133)`._

## Analysis

- Existing: `invoices` and `invoice_items` tables exist in Hasura metadata (empty stubs, no migrations)
- Todos already have `actual_hours`, `min_hours`, `max_hours`, `comment_hours` fields
- Boards have members with roles (owner/editor/viewer)
- Pattern: board-scoped pages at `/[lang]/[username]/[board]/expenses/` — follow same for invoices

## Implementation Plan

### Phase 1: Database
1. Create `clients` table (id, user_id, name, company_name, email, address, vat_number, currency, default_rate, phone, notes)
2. Add `client_id` to `boards` table
3. Create/fill `invoices` table (id, user_id, client_id, board_id, invoice_number, issued_date, due_date, currency, hourly_rate, total_hours, total_amount, notes, status)
4. Create/fill `invoice_items` table (id, invoice_id, todo_id, title, hours, hourly_rate, amount)
5. Hasura metadata/permissions for all new tables

### Phase 2: GraphQL & Store
6. Add GraphQL operations in `documents.ts`
7. Run `npm run generate`
8. Create `clients.svelte.ts` store
9. Create `invoicing.svelte.ts` store (invoices + invoice items)

### Phase 3: UI
10. `ClientsManagement.svelte` component (CRUD for clients)
11. Settings page section or `/[lang]/clients` route
12. Board settings: assign client dropdown in BoardManagement.svelte
13. `/[lang]/[username]/[board]/invoices` route - list + create
14. `CreateInvoiceDialog.svelte` - pick lists/todos, set rate, preview, confirm
15. After invoicing: move todos to "Completed" list

### Phase 4: Quality
16. i18n translations
17. npm run check + npm test

## Progress Log

- [ ] Phase 1: DB migrations + Hasura metadata
- [ ] Phase 2: GraphQL + stores
- [ ] Phase 3: UI components + routes
- [ ] Phase 4: QA
