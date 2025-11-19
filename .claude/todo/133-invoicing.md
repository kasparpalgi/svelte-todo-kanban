See how every task can have minimum, maximum (calculated average) and actual hours spent. Plus actual hours spent. Now we shall be able to generate invoice for the customer.

Each board shall have also customer invoice details - company name, code, vat, address, contact details. Also, hourly rate.

Also, under settings user shall edit details invoice from.

Then can add cards to invoice and manually edit the total hrs. and rate. Add custom invoice rows, too.

Then card will get invoiced hrs number new field.

---

# Implementation Status: COMPLETED

## Summary

A comprehensive invoicing feature has been implemented for the Kanban board application. Users can now:
- Configure their company details (invoice from) in settings
- Configure customer details per board (invoice to)
- Create invoices from board tasks or custom rows
- Track invoiced hours on tasks
- Manage invoice statuses (draft, sent, paid, cancelled)
- Calculate subtotals, tax, and totals automatically

## Database Changes

### New Tables Created
1. **invoices** - Stores invoice header information
   - invoice_number, board_id, user_id
   - invoice_date, due_date, status
   - customer_details (jsonb), invoice_from_details (jsonb)
   - subtotal, tax_rate, tax_amount, total
   - notes

2. **invoice_items** - Stores line items for invoices
   - invoice_id, todo_id (nullable for custom rows)
   - description, hours, rate, amount
   - sort_order

### Columns Added
- `todos.invoiced_hours` (numeric) - Tracks hours that have been invoiced
- `boards.customer_invoice_details` (jsonb) - Customer information for board
- `users.invoice_from_details` (jsonb) - User's company information

### Migration File
- Location: `hasura/migrations/default/1763210000000_add_invoicing_feature/`
- Contains both up.sql and down.sql for reversible migrations

## GraphQL Schema

### Fragments
- `InvoiceFields` - Complete invoice data with relationships
- `InvoiceItemFields` - Invoice item data with todo reference

### Queries
- `GetInvoices` - List all invoices with filtering
- `GetInvoiceById` - Get single invoice with items
- `GetBoardInvoices` - Get invoices for a specific board

### Mutations
- `CreateInvoice` - Create new invoice
- `UpdateInvoice` - Update invoice details
- `DeleteInvoice` - Delete an invoice
- `CreateInvoiceItem` - Add item to invoice
- `UpdateInvoiceItem` - Update invoice item
- `DeleteInvoiceItem` - Remove invoice item
- `UpdateTodoInvoicedHours` - Update invoiced hours on a task

## Stores

### invoices.svelte.ts
New store for managing invoice state with methods:
- `loadInvoices()` - Load all invoices
- `loadBoardInvoices(boardId)` - Load invoices for a board
- `loadInvoiceById(id)` - Load single invoice with items
- `createInvoice(data)` - Create new invoice
- `updateInvoice(id, updates)` - Update invoice
- `deleteInvoice(id)` - Delete invoice
- `addInvoiceItem(data)` - Add item to invoice
- `updateInvoiceItem(id, updates)` - Update item
- `deleteInvoiceItem(id)` - Delete item
- `updateTodoInvoicedHours(todoId, hours)` - Update task hours
- `calculateInvoiceTotals(items, taxRate)` - Calculate totals
- `generateInvoiceNumber()` - Generate invoice number

### listsBoards.svelte.ts (updated)
Added method:
- `updateBoardCustomerInvoiceDetails(boardId, details)` - Update customer info

### user.svelte.ts (updated)
Added method:
- `updateInvoiceFromDetails(userId, details)` - Update user invoice info

## Components

### Settings Components
1. **InvoiceSettings.svelte**
   - Location: `src/lib/components/settings/InvoiceSettings.svelte`
   - Form for user's company details (invoice from)
   - Fields: company name, code, VAT, address, contact details

2. **BoardCustomerInvoiceDetails.svelte**
   - Location: `src/lib/components/listBoard/BoardCustomerInvoiceDetails.svelte`
   - Form for customer details per board
   - Fields: company name, code, VAT, address, contact details, hourly rate

### Invoice Components
1. **InvoiceList.svelte**
   - Location: `src/lib/components/invoice/InvoiceList.svelte`
   - Displays list of invoices with status badges
   - Shows invoice number, customer, date, and total
   - Supports navigation to invoice details

2. **InvoiceEditor.svelte**
   - Location: `src/lib/components/invoice/InvoiceEditor.svelte`
   - Create/edit invoice form
   - Fields: invoice number, dates, status, tax rate, notes
   - Displays calculated totals (subtotal, tax, total)
   - Integrates with InvoiceItemsEditor

3. **InvoiceItemsEditor.svelte**
   - Location: `src/lib/components/invoice/InvoiceItemsEditor.svelte`
   - Add tasks from board to invoice
   - Add custom rows (non-task items)
   - Edit hours, rate, and amount per item
   - Remove items from invoice
   - Shows available hours for tasks (actual - invoiced)

## Routes

1. **Invoice List**
   - Path: `/[lang]/[username]/[board]/invoices/`
   - Shows all invoices for the board
   - Button to create new invoice

2. **New Invoice**
   - Path: `/[lang]/[username]/[board]/invoices/new/`
   - Create new invoice form
   - Add tasks or custom rows

3. **Invoice Detail/Edit**
   - Path: `/[lang]/[username]/[board]/invoices/[invoiceId]/`
   - View/edit existing invoice
   - Print button for generating PDF

## Hasura Metadata

### Permissions
All tables have row-level security:
- Users can only access invoices for boards they own or are members of
- Invoice items inherit permissions from parent invoice
- Board owners/editors can create/edit invoices
- Only board owners can delete invoices

### Relationships
- `invoices.board` - Link to board
- `invoices.user` - Link to creator
- `invoices.invoice_items` - Array of items
- `invoice_items.invoice` - Parent invoice
- `invoice_items.todo` - Linked task (if applicable)
- `todos.invoice_items` - Array of invoice items
- `boards.invoices` - Array of invoices
- `users.invoices` - Array of invoices

## Features

### Invoice Creation
1. Select board
2. Configure customer details (if not already set)
3. Add tasks from board (shows hours: actual, invoiced, available)
4. Or add custom rows with description, hours, rate
5. Edit hours/rate/amount per item
6. Set tax rate (calculates automatically)
7. Add notes
8. Save as draft/sent/paid

### Task Hours Tracking
- Tasks show: min_hours, max_hours, actual_hours, invoiced_hours
- When adding task to invoice, defaults to:
  - Actual hours - invoiced hours (if actual exists)
  - Average of min/max (if estimates exist)
  - Manual entry otherwise
- After invoicing, invoiced_hours field is updated

### Invoice Number Generation
- Format: `INV-YYYYMM-####`
- Example: `INV-202511-0001`
- Auto-increments based on existing invoices

### Status Management
- **Draft**: Work in progress, editable
- **Sent**: Sent to customer, editable
- **Paid**: Payment received, editable
- **Cancelled**: Cancelled invoice

## Next Steps (To Complete Setup)

1. **Start Hasura and Apply Migrations**:
   ```bash
   cd hasura
   docker-compose up -d
   hasura migrate apply --all-databases
   hasura metadata apply
   ```

2. **Generate TypeScript Types**:
   ```bash
   npm run generate
   ```
   This will resolve all type errors by generating types for the new tables.

3. **Test the Feature**:
   - Configure user invoice details in Settings
   - Configure customer details in board settings
   - Create a test invoice with tasks
   - Add custom rows
   - Verify calculations
   - Test all CRUD operations

4. **Optional Enhancements** (Future):
   - PDF export functionality
   - Email invoice to customer
   - Invoice templates/themes
   - Payment tracking integration
   - Recurring invoices
   - Invoice reminders
   - Multi-currency support
   - Invoice preview before sending

## File Summary

### Created Files
- `hasura/migrations/default/1763210000000_add_invoicing_feature/up.sql`
- `hasura/migrations/default/1763210000000_add_invoicing_feature/down.sql`
- `hasura/metadata/databases/default/tables/public_invoices.yaml`
- `hasura/metadata/databases/default/tables/public_invoice_items.yaml`
- `src/lib/stores/invoices.svelte.ts`
- `src/lib/components/settings/InvoiceSettings.svelte`
- `src/lib/components/listBoard/BoardCustomerInvoiceDetails.svelte`
- `src/lib/components/invoice/InvoiceList.svelte`
- `src/lib/components/invoice/InvoiceEditor.svelte`
- `src/lib/components/invoice/InvoiceItemsEditor.svelte`
- `src/routes/[lang]/[username]/[board]/invoices/+page.svelte`
- `src/routes/[lang]/[username]/[board]/invoices/new/+page.svelte`
- `src/routes/[lang]/[username]/[board]/invoices/[invoiceId]/+page.svelte`

### Modified Files
- `src/lib/graphql/documents.ts` (added invoice operations, updated TODO_FRAGMENT)
- `src/lib/stores/listsBoards.svelte.ts` (added updateBoardCustomerInvoiceDetails)
- `src/lib/stores/user.svelte.ts` (added updateInvoiceFromDetails)
- `hasura/metadata/databases/default/tables/public_todos.yaml` (added invoiced_hours)
- `hasura/metadata/databases/default/tables/public_boards.yaml` (added customer_invoice_details)
- `hasura/metadata/databases/default/tables/public_users.yaml` (added invoice_from_details)
- `hasura/metadata/databases/default/tables/tables.yaml` (registered new tables)

## Notes

- Type errors in `npm run check` are expected until migrations are applied and types are regenerated
- All components follow the project's established patterns (store factory pattern, optimistic updates, error handling)
- Hasura permissions ensure data security at the database level
- Invoice numbers are unique per user
- All monetary values use numeric type for precision
- JSONB fields provide flexibility for invoice details (can be extended without migrations)

---

**Implementation Date**: 2025-11-19
**Status**: Ready for migration and testing
**Branch**: claude/complete-todo-task-01HaodEDmNZ77rukgV2LyKEt
