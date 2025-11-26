Create Splitwise app like functionality for the boards @file: src/routes/[lang]/[username]/[board]/expenses/+page.svelte to add expenses like in Splitwise. 

Add link at the bottom right of the Kanban board to go there.

Then list all expenses there (newer at the top) and summarise who ownes to the user how much and how much the user owns to others. 

Make it possible to:

1. Settle up
2. Add expense
3. Delete expense

I have lready created a table 'expenses':

Columns:
id- uuid, primary key, unique, default: gen_random_uuid()
amount- numeric - eg. 20
split- jsonb (here add maybe like [{ user: 'uuid', amount: 10 }, { user: 'uuid', amount: 10 }])
created_by- uuid - this person paid 20
board_id- uuid
created_at- timestamp with time zone, default: now()
updated_at- timestamp with time zone, default: now()
deleted_at- timestamp with time zone

(you need to create at /hasura folder the persmissions - I just created table, foreigh keys and relationships)

Must look good on mobile and desktop both.

As a long task, make it into smaller pieces, plan in this file throughly each step before execution.