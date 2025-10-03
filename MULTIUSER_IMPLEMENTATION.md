# Multiuser Kanban Implementation Guide

## Overview
Complete implementation for transforming the Kanban app into a multiuser system with board sharing, invitations, and public boards.

## Files Created

### 2. GraphQL (Updated)

#### `src/lib/graphql/documents.ts`
**New Fragments:**
- `BOARD_MEMBER_FRAGMENT` - Member details with user info
- `BOARD_INVITATION_FRAGMENT` - Invitation details with board and inviter

**Updated Fragments:**
- `BOARD_FRAGMENT` - Now includes is_public, allow_public_comments, board_members

**New Queries:**
- `GET_BOARD_MEMBERS` - Fetch all members of a board
- `GET_BOARD_INVITATIONS` - Fetch pending invitations for a board
- `GET_MY_INVITATIONS` - Fetch current user's invitations
- `SEARCH_USERS` - Search users by email/username/name

**New Mutations:**
- `ADD_BOARD_MEMBER` - Add a user to a board
- `UPDATE_BOARD_MEMBER` - Change member role
- `REMOVE_BOARD_MEMBER` - Remove a member
- `CREATE_BOARD_INVITATION` - Send invitation
- `UPDATE_BOARD_INVITATION` - Accept/decline invitation
- `DELETE_BOARD_INVITATION` - Cancel invitation

### 3. Stores (Following Project Patterns)

#### `src/lib/stores/boardMembers.svelte.ts` (NEW)
Manages board members and invitations:
- `loadMembers(boardId)` - Fetch board members
- `inviteUser(boardId, emailOrUsername, role)` - Send invitation
- `updateMemberRole(memberId, role)` - Change member permissions
- `removeMember(memberId)` - Remove member from board
- `loadInvitations(boardId)` - Fetch pending invitations
- `cancelInvitation(invitationId)` - Cancel pending invitation
- `searchUsers(searchTerm)` - Find users to invite

**Features:**
- Optimistic updates
- Browser guards
- Error handling
- Factory pattern with $state

#### `src/lib/stores/invitations.svelte.ts` (NEW)
Manages user's own invitations:
- `loadMyInvitations()` - Fetch current user's pending invitations
- `acceptInvitation(invitationId)` - Accept invite (creates board_member)
- `declineInvitation(invitationId)` - Decline invite
- `pendingCount` - Derived count for badge

**Features:**
- Automatic board reload after acceptance
- Transaction handling (create member + update invitation)

#### `src/lib/stores/listsBoards.svelte.ts` (UPDATED)
Added multiuser support:
- Updated `updateBoard()` to accept `is_public` and `allow_public_comments`
- New `updateBoardVisibility()` helper method
- Board fragment now includes membership data

### 4. UI Components

#### `src/lib/components/listBoard/BoardMembers.svelte` (NEW)
Full-featured member management dialog:
- **Invite Section** (owner/editor only):
  - Search users by email/username
  - Role selector (editor/viewer)
  - Live search results dropdown
- **Current Members List**:
  - Avatar/initials display
  - Role badges with color coding
  - Role change dropdown (owner only)
  - Remove member button (owner only)
- **Pending Invitations**:
  - List of pending invites
  - Cancel button per invitation
  - Formatted dates (relative)

#### `src/lib/components/listBoard/BoardVisibilitySettings.svelte` (NEW)
Board sharing and visibility controls:
- **Public Access Toggle**:
  - Make board public/private
  - Warning about public visibility
- **Public URL Display**:
  - Generated shareable URL
  - Copy to clipboard button
  - Format: `/{username}/{boardAlias}`
- **Public Comments Toggle**:
  - Allow non-members to comment
  - Only shown when board is public

#### `src/lib/components/listBoard/InvitationNotifications.svelte` (NEW)
Bell icon with notification badge:
- Dropdown menu showing pending invitations
- Accept/Decline buttons per invitation
- Real-time count badge
- Auto-loads boards after accepting

#### `src/lib/components/listBoard/BoardManagement.svelte` (UPDATED)
Added to dropdown menu:
- "Manage Members" option (opens BoardMembers dialog)
- "Sharing & Visibility" option (opens BoardVisibilitySettings dialog)
- Integrated with existing board management UI

#### `src/lib/components/listBoard/BoardSwitcher.svelte` (UPDATED)
Enhanced board selector:
- 🌐 Globe icon for public boards
- "Shared" badge for boards where user is not owner
- Member count indicator (Users icon + count)
- Owner detection based on current user

### 5. Localization

#### `src/lib/locales/en/common.json` (UPDATED)
Added multiuser strings:
```json
{
  "board": {
    "members": "Members",
    "invitations": "Invitations",
    "sharing": "Sharing & Visibility",
    "owner": "Owner",
    "editor": "Editor",
    "viewer": "Viewer",
    "invite_user": "Invite User",
    "manage_members": "Manage Members",
    "make_public": "Make board public",
    "allow_public_comments": "Allow public comments",
    "public_board_notice": "Anyone with the link can view this board",
    "shared_board": "Shared",
    // ... and more
  }
}
```

## Next Steps - Hasura Configuration

### 1. Create Migrations
For each SQL file, run:
```bash
cd hasura
hasura migrate create <migration_name> --database-name default
# Copy the SQL content into the generated up.sql file
# Create appropriate down.sql for rollback
hasura migrate apply --database-name default
```

### 2. Update Hasura Metadata

#### Create `hasura/metadata/databases/default/tables/public_board_members.yaml`:
```yaml
table:
  name: board_members
  schema: public
object_relationships:
  - name: board
    using:
      foreign_key_constraint_on: board_id
  - name: user
    using:
      foreign_key_constraint_on: user_id
insert_permissions:
  - role: user
    permission:
      check:
        board:
          _or:
            - user_id: { _eq: X-Hasura-User-Id }
            - board_members:
                _and:
                  - user_id: { _eq: X-Hasura-User-Id }
                  - role: { _in: [owner, editor] }
      columns:
        - board_id
        - user_id
        - role
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - board_id
        - user_id
        - role
        - created_at
        - updated_at
      filter:
        board:
          _or:
            - user_id: { _eq: X-Hasura-User-Id }
            - board_members:
                user_id: { _eq: X-Hasura-User-Id }
            - is_public: { _eq: true }
update_permissions:
  - role: user
    permission:
      columns:
        - role
      filter:
        board:
          board_members:
            _and:
              - user_id: { _eq: X-Hasura-User-Id }
              - role: { _eq: owner }
delete_permissions:
  - role: user
    permission:
      filter:
        board:
          board_members:
            _and:
              - user_id: { _eq: X-Hasura-User-Id }
              - role: { _eq: owner }
```

#### Create `hasura/metadata/databases/default/tables/public_board_invitations.yaml`:
```yaml
table:
  name: board_invitations
  schema: public
object_relationships:
  - name: board
    using:
      foreign_key_constraint_on: board_id
  - name: inviter
    using:
      foreign_key_constraint_on: inviter_id
insert_permissions:
  - role: user
    permission:
      check:
        board:
          board_members:
            _and:
              - user_id: { _eq: X-Hasura-User-Id }
              - role: { _in: [owner, editor] }
      set:
        inviter_id: x-hasura-User-Id
      columns:
        - board_id
        - invitee_email
        - invitee_username
        - role
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - board_id
        - inviter_id
        - invitee_email
        - invitee_username
        - role
        - status
        - token
        - created_at
        - updated_at
        - expires_at
      filter:
        _or:
          - board:
              board_members:
                user_id: { _eq: X-Hasura-User-Id }
          - invitee_email: { _eq: X-Hasura-User-Email }
update_permissions:
  - role: user
    permission:
      columns:
        - status
      filter:
        _or:
          - board:
              board_members:
                _and:
                  - user_id: { _eq: X-Hasura-User-Id }
                  - role: { _eq: owner }
          - invitee_email: { _eq: X-Hasura-User-Email }
delete_permissions:
  - role: user
    permission:
      filter:
        board:
          board_members:
            _and:
              - user_id: { _eq: X-Hasura-User-Id }
              - role: { _eq: owner }
```

#### Update `hasura/metadata/databases/default/tables/public_boards.yaml`:
Add array relationships:
```yaml
array_relationships:
  - name: board_members
    using:
      foreign_key_constraint_on:
        column: board_id
        table:
          name: board_members
          schema: public
  - name: board_invitations
    using:
      foreign_key_constraint_on:
        column: board_id
        table:
          name: board_invitations
          schema: public
```

Update select permissions:
```yaml
select_permissions:
  - role: user
    permission:
      columns:
        # ... existing columns ...
        - is_public
        - allow_public_comments
      filter:
        _or:
          - user_id: { _eq: X-Hasura-User-Id }
          - board_members:
              user_id: { _eq: X-Hasura-User-Id }
          - is_public: { _eq: true }
```

Update insert permissions:
```yaml
insert_permissions:
  - role: user
    permission:
      columns:
        # ... existing columns ...
        - is_public
        - allow_public_comments
```

#### Update `hasura/metadata/databases/default/tables/public_todos.yaml`:
Update select/update/delete permissions to check board membership:
```yaml
select_permissions:
  - role: user
    permission:
      filter:
        _or:
          - user_id: { _eq: X-Hasura-User-Id }
          - list:
              board:
                _or:
                  - board_members:
                      user_id: { _eq: X-Hasura-User-Id }
                  - is_public: { _eq: true }
```

#### Update `hasura/metadata/databases/default/tables/public_comments.yaml`:
Update permissions to allow public commenting when enabled:
```yaml
insert_permissions:
  - role: user
    permission:
      check:
        _or:
          - todo:
              list:
                board:
                  board_members:
                    user_id: { _eq: X-Hasura-User-Id }
          - todo:
              list:
                board:
                  _and:
                    - is_public: { _eq: true }
                    - allow_public_comments: { _eq: true }
```

### 3. Apply Metadata
```bash
hasura metadata apply
```

### 4. Generate TypeScript Types
```bash
npm run generate
```

## Testing Checklist

- [ ] Create a board (user auto-added as owner)
- [ ] Invite another user via email
- [ ] Invite another user via username
- [ ] Accept invitation (check user becomes member)
- [ ] Decline invitation
- [ ] Change member role (owner only)
- [ ] Remove member (owner only)
- [ ] Make board public
- [ ] Access public board as non-member (read-only)
- [ ] Toggle public comments on/off
- [ ] Comment on public board as non-member
- [ ] Copy public URL
- [ ] View shared boards in BoardSwitcher
- [ ] View invitation notifications
- [ ] View member count badges
- [ ] Search for users in invite dialog

## Role Permissions Summary

| Action | Owner | Editor | Viewer | Public |
|--------|-------|--------|--------|--------|
| View board | ✅ | ✅ | ✅ | ✅ (if public) |
| Edit board settings | ✅ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Create/edit todos | ✅ | ✅ | ❌ | ❌ |
| Comment on todos | ✅ | ✅ | ✅ | ✅ (if enabled) |
| Delete board | ✅ | ❌ | ❌ | ❌ |

## Security Notes

- Board creator is automatically added as owner via database trigger
- All GraphQL operations are permission-controlled at Hasura level
- Invitation tokens are securely generated (32 bytes, base64)
- Invitations expire after 7 days by default
- Public boards are read-only for non-members
- Comments on public boards require `allow_public_comments` flag
- User cannot be added as owner via invitation (only editor/viewer)

## Future Enhancements (Optional)

1. **Email Notifications**:
   - Create `src/routes/api/invitations/send/+server.ts`
   - Use nodemailer to send invitation emails
   - Include invitation link with token

2. **Advanced Permissions**:
   - Per-list permissions
   - Custom roles
   - Board templates with default permissions

3. **Activity Log**:
   - Track member additions/removals
   - Track permission changes
   - Display in board settings

4. **Invitation Management**:
   - Resend invitations
   - Set custom expiration
   - Batch invitations

## Component Usage

### Adding Invitation Notifications to Layout
```svelte
<!-- In your main layout -->
<script>
  import InvitationNotifications from '$lib/components/listBoard/InvitationNotifications.svelte';
</script>

<header>
  <!-- ... other header items ... -->
  <InvitationNotifications />
</header>
```

The component is self-contained and will:
- Auto-load invitations on mount
- Show notification badge with count
- Handle accept/decline actions
- Reload boards after accepting

## Troubleshooting

### GraphQL Type Errors
If you get type errors after adding queries:
```bash
npm run generate
```

### Permission Denied Errors
Check Hasura permissions in console:
```bash
cd hasura
hasura console
```

### Board Creator Not Added as Owner
Verify the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'board_creator_as_owner';
```

### Missing UI Components
Ensure all shadcn-svelte components are installed:
- Dialog
- Alert
- Switch
- Select
- Badge
