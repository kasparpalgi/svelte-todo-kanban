# Under invoicing I can now add my companies from where to create invoices, but there is no IBAN or SWIFT or bank details possible to add where the payment shall be made.

## Original Requirement

[NEVER REMOVE]

Add iban and swift

_From Kanban card `e1f6a17f-6940-4916-a46f-3c63ee1d08be`._

_GitHub issue #176 — end the commit subject with `(#176)`._

## Plan

1. Migration: add `iban` and `swift` (nullable text) columns to `invoice_companies`.
2. Hasura metadata: add `iban`, `swift` to insert/select/update permission column lists for `public_invoice_companies.yaml`.
3. GraphQL: add `iban`, `swift` to `InvoiceCompanyFields` fragment in `documents.ts`; run `npm run generate`.
4. UI: add IBAN and SWIFT input fields to `InvoiceCompaniesManagement.svelte` form (state, openEdit, openCreate, payload) and display them in the company list.
5. i18n: add `invoice_companies.iban` / `invoice_companies.swift` keys to en/et/cs locales.
6. `npm run check` must pass.

## Log

- Investigated: companies managed via `InvoiceCompaniesManagement.svelte` + `invoiceCompanies.svelte.ts` store + `invoice_companies` Postgres table (migration `1796000001000_create_invoice_companies`). No PDF/invoice-render step currently surfaces company details, so scope is limited to storing + displaying IBAN/SWIFT on the company record.
- Added migration `1796000002000_add_iban_swift_to_invoice_companies` (nullable `iban`, `swift` text columns) and applied it via `hasura migrate apply --all-databases`.
- Updated `public_invoice_companies.yaml` insert/select/update permission column lists to include `iban`/`swift`; applied via `hasura metadata apply`.
- Added `iban`, `swift` to `InvoiceCompanyFields` GraphQL fragment; ran `npm run generate` to refresh generated types.
- Updated `InvoiceCompaniesManagement.svelte`: form state, create/edit population, save payload, and list display now include IBAN and SWIFT/BIC fields.
- Added `invoice_companies.iban` / `invoice_companies.swift` i18n keys to en/et/cs locales.
- Verified: `npm run check` shows only pre-existing unrelated errors/warnings (og-image routes, todos store, a11y warnings) — no new errors from this change. `npx vitest run --project=server` — 201 tests passed (no invoicing store tests existed to update). E2E/browser projects can't run in this sandbox (Playwright browsers not installed, pre-existing).
- Task complete.
