## Task: Update Hasura permissions for shared boards

### Problem
When I get invited to the board and accept invitation and open the board then I see in Kanban only completed (and those completed items are not at all that boards' items but another board's completed items) list and items under that and in list view I see no todo items at all.

### Root Cause
The Hasura permissions were only checking if the user is the board owner (`user_id: _eq: X-Hasura-User-Id`) but NOT checking if the user is a board member via the `board_members` table. This meant invited users couldn't properly access lists, todos, labels, comments, and uploads on shared boards.

### Solution Implemented

Updated permissions for the following tables to include board_members checks:

#### 1. **lists** table (`public_lists.yaml`)
- ✅ **insert**: Added board_members check
- ✅ **select**: Already had board_members check (was working)
- ✅ **update**: Added board_members check (was missing)
- ✅ **delete**: Added board_members check (was missing)

#### 2. **todos** table (`public_todos.yaml`)
- ✅ **insert**: Added board_members check through list.board relationship
- ✅ **select**: Already had board_members check (was working)
- ✅ **update**: Already had board_members check (was working)
- ✅ **delete**: Added board_members check (was missing)

#### 3. **labels** table (`public_labels.yaml`)
- ✅ **insert**: Added board_members check
- ✅ **select**: Added board_members check
- ✅ **update**: Added board_members check
- ✅ **delete**: Added board_members check

#### 4. **comments** table (`public_comments.yaml`)
- ✅ **insert**: Added board_members check through todo.list.board relationship
- ✅ **select**: Added board_members check through todo.list.board relationship
- ✅ **update**: Added board_members check through todo.list.board relationship
- ✅ **delete**: Added board_members check through todo.list.board relationship

#### 5. **uploads** table (`public_uploads.yaml`)
- ✅ **insert**: Added board_members check through todo.list.board relationship
- ✅ **select**: Added board_members check through todo.list.board relationship
- ✅ **delete**: Added board_members check through todo.list.board relationship

### Permission Pattern Applied

For all tables, the filter/check now uses:
```yaml
_or:
  - board:
      user_id:
        _eq: X-Hasura-User-Id
  - board:
      board_members:
        user_id:
          _eq: X-Hasura-User-Id
```

For nested relationships (comments, uploads via todo), the pattern is:
```yaml
todo:
  list:
    board:
      _or:
        - user_id:
            _eq: X-Hasura-User-Id
        - board_members:
            user_id:
              _eq: X-Hasura-User-Id
```

### Deployment
Metadata successfully applied to Hasura:
```bash
hasura metadata apply
```

### Testing Recommendation
Please test the following scenario:
1. User A creates a board
2. User A invites User B to the board
3. User B accepts the invitation
4. User B opens the shared board
5. User B should now see:
   - All lists from the board
   - All todos in those lists
   - All labels, comments, and uploads
   - Ability to create/update/delete items (based on their role)

### Status
✅ **COMPLETED** - All permissions updated and metadata applied to Hasura.