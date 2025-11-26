# Task 132: Import from Splitwise

## Original Requirement
See task 129 where Splitwise-like functionality was created. Now see in '_notes' folder how expenses exported from Splitwise look like in file 'import.csv' where there are just 2 users so it is clear that -X€ is me and the +X€ the other user on the board. Then see 'import2.csv' where there are expenses split between more than 2 users so we need to ask the names of the users behind these expenses.

Add button to expenses page 'Import from Splitwise' small somewhere. Then let the user to select file from the device to import.

Finally, make expenses to look like in UI € not $.

---

## Implementation Summary

### ✅ Completed Features

1. **CSV Parser Utility** (`src/lib/utils/splitwiseCsvParser.ts`)
   - Parses Splitwise CSV format
   - Handles Date, Description, Category, Cost, Currency columns
   - Extracts user columns and their split amounts
   - Detects simple 2-user vs complex multi-user cases
   - Auto-identifies current user in 2-user scenarios

2. **User Mapping Dialog** (`src/lib/components/expenses/UserMappingDialog.svelte`)
   - Modal dialog for multi-user CSV imports
   - Maps CSV usernames to board members
   - Uses native select dropdowns for better compatibility
   - Validates all users are mapped before proceeding

3. **Import Dialog** (`src/lib/components/expenses/ImportSplitwiseDialog.svelte`)
   - File upload interface for CSV files
   - Real-time CSV parsing and validation
   - Displays parsed data summary (expense count, user names)
   - Automatic handling for 2-user imports
   - Manual user mapping for complex imports
   - Error handling and user feedback

4. **Store Import Method** (`src/lib/stores/expenses.svelte.ts`)
   - `importFromSplitwise()` method added
   - Converts Splitwise amounts to internal format
   - Identifies payer (user with most positive amount)
   - Creates expense splits correctly
   - Batch imports with success/failure tracking
   - Returns detailed import results

5. **UI Integration** (`src/routes/[lang]/[username]/[board]/expenses/+page.svelte`)
   - "Import from Splitwise" button added above expense list
   - Small, unobtrusive button with Upload icon
   - Opens import dialog on click

6. **Currency Display** (Updated throughout)
   - Changed from USD ($) to EUR (€)
   - Updated `formatCurrency()` in `expenseCalculations.ts`
   - Updated validation messages in `expenses.svelte.ts`

---

## Files Created

1. `src/lib/utils/splitwiseCsvParser.ts` - CSV parsing logic
2. `src/lib/components/expenses/UserMappingDialog.svelte` - User mapping UI
3. `src/lib/components/expenses/ImportSplitwiseDialog.svelte` - Import dialog UI

## Files Modified

1. `src/lib/stores/expenses.svelte.ts` - Added `importFromSplitwise()` method
2. `src/routes/[lang]/[username]/[board]/expenses/+page.svelte` - Added import button and dialog
3. `src/lib/utils/expenseCalculations.ts` - Changed currency from USD to EUR

---

## How It Works

### Simple 2-User Import
1. User clicks "Import from Splitwise"
2. Selects CSV file with 2 users
3. System automatically identifies:
   - Current user (typically has more negative amounts)
   - Other board member (other user in CSV)
4. Imports all expenses automatically

### Multi-User Import
1. User clicks "Import from Splitwise"
2. Selects CSV file with 3+ users
3. User mapping dialog appears
4. User maps each CSV username to a board member
5. Imports expenses after mapping confirmed

### Expense Conversion Logic
- **Splitwise Format**: Negative = owes, Positive = is owed
- **Our Format**: Splits represent what each user owes
- **Payer Detection**: User with highest positive amount paid the expense
- **Split Calculation**: Users with negative amounts owe money (absolute value)

---

## Testing Instructions

### Test with 2-User CSV (import.csv)
1. Navigate to expenses page
2. Click "Import from Splitwise"
3. Upload `_notes/import.csv`
4. Should auto-import 16 expenses
5. Verify balances match the CSV totals

### Test with Multi-User CSV (import2.csv)
1. Navigate to expenses page
2. Click "Import from Splitwise"
3. Upload `_notes/import2.csv`
4. Map each CSV username to board members:
   - Kaspar Palgi → [Board Member 1]
   - mihkel → [Board Member 2]
   - euaebiu → [Board Member 3]
   - merit → [Board Member 4]
5. Click "Continue Import"
6. Should import 8 expenses
7. Verify balances are calculated correctly

---

## Technical Details

### CSV Format Expected
```
Date,Description,Category,Cost,Currency,User1,User2,User3,...
2025-11-21,Lunch,General,43.00,EUR,-21.50,21.50
```

- **Columns**: Fixed first 5 columns, then dynamic user columns
- **Amounts**: Positive = owed to user, Negative = user owes
- **Total Balance Row**: Automatically skipped during parsing

### Type Safety
- All TypeScript types properly defined
- Uses GraphQL generated types for board members
- Proper error handling throughout
- Browser guards in store methods

### Error Handling
- Invalid CSV format detection
- Missing users validation
- Split amount validation
- Network error handling
- User-friendly error messages

---

## Known Limitations

1. **Currency**: Assumes all amounts in CSV are in the board's currency
2. **Settlements**: Treats settlements as regular expenses
3. **Categories**: CSV categories are not imported (stored as description only)
4. **Dates**: Expense dates from CSV are not preserved (uses current date)

---

## Future Enhancements

- [ ] Preserve expense dates from CSV
- [ ] Import categories as labels
- [ ] Detect and handle settlements specially
- [ ] Support multiple currency conversions
- [ ] Add import preview before confirmation
- [ ] Add dry-run mode to preview changes
- [ ] Support undo/rollback of imports

---

## Status: ✅ Complete

All requirements have been implemented:
- ✅ CSV parser for Splitwise format
- ✅ User mapping for multi-user imports
- ✅ Import button on expenses page
- ✅ File upload and import flow
- ✅ Currency changed from $ to €
- ✅ Type checking passes (no new errors)
- ✅ Ready for testing with sample CSV files