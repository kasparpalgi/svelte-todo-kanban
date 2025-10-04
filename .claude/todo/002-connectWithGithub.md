Connect with github from [lang]/settings used to work but now takes me to http://localhost:5173/api/Fgithub?userId=9f479879-c36d-45b2-8473-146616c2ccae and there I see error page.

  GET http://localhost:5173/api/Fgithub?userId=9f479879-c36d-45b2-8473-146616c2ccae 404 (Not Found)

## Root Cause

Found a typo in `src/lib/components/settings/GithubIntegration.svelte:48`
- The URL was `/api/Fgithub?userId=${user.id}` (incorrect)
- Should be `/api/github?userId=${user.id}` (correct)

## Fix Applied

Changed line 48 in GithubIntegration.svelte from:
```typescript
window.location.href = `/api/Fgithub?userId=${user.id}`;
```

To:
```typescript
window.location.href = `/api/github?userId=${user.id}`;
```

## Testing

- Ran `npm run check` - no new errors introduced
- The GitHub OAuth flow should now correctly redirect to `/api/github` which exists at `src/routes/api/github/+server.ts`
- The route handles the OAuth initialization and redirects to GitHub's authorization page

## Status

✅ Fixed - The GitHub integration button now correctly redirects to the existing API route.