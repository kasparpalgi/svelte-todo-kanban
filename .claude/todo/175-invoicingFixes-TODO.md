> Run with: Sonnet 4.6 / medium

# Invoicing fixes

## Original Requirement

[NEVER REMOVE]

- * Invoice number default to YYMMDDS (Y-year, M-month, D-day, S-sequence) so if issueing the second invoice today then 2609102.

- Date make EU not us, instead 09/10/2026 -> 10/09/2026 and reuse the nice datepicker whe have when setting card due date

- Invoice due set by default 5 days

- Make it possible to add invoice custom fields

- Under settings shall be possible to also add my company name, address, etc from who the invoice is and I may have multiple companies from where I invoice. Some may be VAT registered, some not so also set vat rate (default 0) for each company.

- All invoice settings bring uder invoices page not general settings.

- When adding customer to invoice then shall be able to also tie that invoice customer with todzz user and with one or more board.

- When I clicked, create invoice:

Not-NULL violation. null value in column "invoice_id" of relation "invoice_items" violates not-null constraint: {"response":{"errors":[{"message":"Not-NULL violation. null value in column \"invoice_id\" of relation \"invoice_items\" violates not-null constraint","extensions":{"path":"$.selectionSet.insert_invoice_items.args.objects","code":"constraint-violation"}}],"status":200,"headers":{}},"request":{"query":"\n mutation CreateInvoiceWithItems($invoice: invoices_insert_input!, $items: [invoice_items_insert_input!]!) {\n insert_invoices_one(object: $invoice) {\n ...InvoiceFields\n }\n insert_invoice_items(objects: $items) {\n returning {\n ...InvoiceItemFields\n }\n }\n}\n fragment ClientFields on clients {\n id\n user_id\n name\n company_name\n email\n phone\n address\n vat_number\n currency\n default_rate\n notes\n created_at\n updated_at\n}\nfragment InvoiceItemFields on invoice_items {\n id\n invoice_id\n todo_id\n title\n hours\n hourly_rate\n amount\n created_at\n}\nfragment InvoiceFields on invoices {\n id\n user_id\n client_id\n board_id\n invoice_number\n issued_date\n due_date\n currency\n hourly_rate\n total_hours\n total_amount\n notes\n status\n created_at\n updated_at\n client {\n ...ClientFields\n }\n items {\n ...InvoiceItemFields\n }\n}","variables":{"invoice":{"board_id":"1df24d9c-65c7-46b7-a4ac-51cbfbf78774","client_id":"34674b14-51ec-479a-8dd6-910846fbed21","invoice_number":"002","issued_date":"2026-09-10","due_date":null,"currency":"EUR","hourly_rate":20,"total_hours":1.3,"total_amount":26,"notes":null,"status":"draft"},"items":[{"todo_id":"96f55764-6de1-4821-b87a-7aac1e285872","title":"Website updates","hours":1,"hourly_rate":20,"amount":20},{"todo_id":"5a0a012c-ae0f-4c65-9f7f-63cfd84511dd","title":"From old spreadsheet","hours":0.3,"hourly_rate":20,"amount":6}]}}}
TekDok | ToDzz

_From Kanban card `231d2019-83bd-4c02-9551-b3f56f72a28b`._

_GitHub issue #175 — end the commit subject with `(#175)`._

---

## Plan

### 1. Bug Fix: Nested insert for invoice items (CRITICAL)
- Change `CREATE_INVOICE_WITH_ITEMS` mutation to nested insert via `items` relationship
- Remove `$items` param; embed `items: { data: [...] }` inside invoice insert input
- Update `invoicingStore.createInvoice` to send items nested in invoice object
- Run `npm run generate`

### 2. Invoice number YYMMDDS default
- Add `GET_INVOICES_ISSUED_TODAY` aggregate query
- Add `getNextInvoiceNumber()` to `invoicingStore`
- Auto-populate `form.invoiceNumber` when reaching `invoice-details` step

### 3. Due date default +5 days
- Compute `dueDate = issuedDate + 5 days` when entering `invoice-details` step

### 4. EU date format + calendar picker
- Replace `<Input type="date">` with CalendarPrimitive + Popover (same as card due date)
- Use `formatLocaleDate` for display; get `lang` from page params

### 5. Custom invoice fields
- Add `custom_fields` jsonb column to `invoices` table (Hasura migration)
- Update Hasura permissions metadata
- Add UI to add/remove custom fields in invoice form and view

### 6. Invoice companies (sender)
- Create `invoice_companies` migration: id, user_id, name, address, vat_number, vat_rate, is_default
- Add `company_id` FK to `invoices` table
- Create `InvoiceCompaniesManagement.svelte` + store methods
- Add GraphQL queries/mutations + run generate

### 7. Move invoice settings to invoices page
- Remove `ClientsManagement` from general settings page
- Add invoices settings section on invoices page (manage clients + companies)
- Update "go_to_settings" link/text

### 8. Customer-user linking
- Add `linked_user_id` to `clients` table (migration)
- Add `client_boards` junction table (client_id, board_id)
- Update `ClientsManagement` form with user search + board selection
- Update GraphQL queries

---

## Log

- [x] 1. Bug fix: nested insert — `CREATE_INVOICE_WITH_ITEMS` now uses `items: { data: [...] }` nested in invoice; removed separate `insert_invoice_items`
- [x] 2. Invoice number YYMMDDS — `getNextInvoiceNumber()` queries `invoices_aggregate` for today's date; auto-fills when entering invoice-details step
- [x] 3. Due date +5 days default — `form.dueDate = addDays(issuedDate, 5)` on init and reset
- [x] 4. EU date format + calendar picker — replaced `<Input type="date">` with `CalendarPrimitive` + `Popover` + `formatLocaleDate`; takes `lang` prop
- [x] 5. Custom invoice fields — `custom_fields` jsonb added to `invoices` table (migration 1796000000000); UI with add/remove key-value pairs in dialog
- [x] 6. Invoice companies — `invoice_companies` table (migration 1796000001000); full CRUD store + `InvoiceCompaniesManagement.svelte`; company selector in invoice dialog; `company_id` on invoices
- [x] 7. Move settings to invoices page — `ClientsManagement` removed from general settings; new `InvoiceSettings.svelte` tab panel (clients + companies) accessible via ⚙ button on invoices page; "go to settings" button now opens inline settings
- [x] 8. Customer-user linking — `linked_user_id` added to `clients` table (migration 1796000001000); user dropdown in `ClientsManagement` form
