# Error

## Original Requirement

[NEVER REMOVE]

Logged in in a new browser with Google and it loaded the board but:

Failed to update settings: check constraint of an insert/update permission has failed: {"response":{"errors":[{"message":"check constraint of an insert/update permission has failed","extensions":{"path":"$","code":"permission-error"}}],"status":200,"headers":{}},"request":{"query":"mutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) { update_users(where: $where, set: $set) { affected_rows returning { ...UserFields } } } fragment UserFields on users { id name username image email locale dark_mode settings default_labels emailVerified created_at updated_at }","variables":{"where":{"id":{"_eq":"[REDACTED_USER_ID]"}},"_set":{"settings":{"tokens":{"groq":{"api_key":"[REDACTED]"},"github":{"username":"[REDACTED]","encrypted":"[REDACTED]","connectedAt":"[REDACTED]"},"google_calendar":{"email":"[REDACTED]","encrypted":"[REDACTED]","expires_at":"[REDACTED]","connectedAt":"[REDACTED]","refresh_token":"[REDACTED]"}},"ai_model":"gpt-5-mini","viewMode":"kanban","lastBoardAlias":"todo-app","auto_ai_correct":false,"speech_provider":"groq"}}}}} — (payload redacted: the `_set.settings` object contained the user's full settings JSON, which failed a Postgres check constraint on the `users.settings` column during an update_users mutation.)

Also, can't see any other boards I have in a board switcher. See also all other errors at /admin/logs and Sentry and fix all. Also all tests shall pass. Make all green and nice.

_From Kanban card `f387f908-f1b8-4637-826b-109e385fc05b`._

_GitHub issue #178 — end the commit subject with `(#178)`._
