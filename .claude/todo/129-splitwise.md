Create Splitwise app like functionality for the boards @file: src/routes/[lang]/[username]/[board]/expenses/+page.svelte to add expenses like in Splitwise. 

Add link at the bottom right of the Kanban board to go there.

Then list all expenses there (newer at the top) and summarise who ownes to the user how much and how much the user owns to others. 

Make it possible to:

1. Settle up
2. Add expense
3. Delete expense (only by the expense creator)

I have lready created a table 'expenses':

Columns:
id- uuid, primary key, unique, default: gen_random_uuid()
amount- numeric - eg. 20
created_by- uuid - this person paid 20
board_id- uuid
created_at- timestamp with time zone, default: now()
updated_at- timestamp with time zone, default: now()
deleted_at- timestamp with time zone, nullable

And table 'expense_splits':
Columns:
id- uuid, primary key, unique, default: gen_random_uuid()
expense_id- uuid
user_id- uuid
amount- numeric (must check when adding that all anounts and users between it is splitted totals the amount in 'expenses' taböe - by default split the expense evenly between all users)

(you need to create at /hasura folder the persmissions - I just created table, foreigh keys and relationships)

Must look good on mobile and desktop both.

As a long task, make it into smaller pieces, plan in this file throughly each step before execution.