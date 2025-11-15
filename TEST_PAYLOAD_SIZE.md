# Payload Size Test

## Instructions

1. **Open Chrome DevTools**
   - F12 or Right-click → Inspect

2. **Go to Network Tab**
   - Click "Network" tab
   - Check "Preserve log"
   - Filter by: "Fetch/XHR" or type "graphql"

3. **Clear and Reload**
   - Clear (🚫 icon)
   - Hard reload page (Ctrl+Shift+R)

4. **Find the GraphQL Request**
   - Look for request to `/v1/graphql`
   - Should see request named "GetTodosMinimal" or "graphql"

5. **Check These Values**

### Request Analysis

| Metric | Value | Notes |
|--------|-------|-------|
| Query Name | ___________ | Should be "GetTodosMinimal" |
| Request Size | ___________ KB | How much data sent |
| Response Size | ___________ KB | **This is the key metric!** |
| Time | ___________ ms | Total request time |
| Number of Requests | ___________ | Count all graphql requests |

### Response Content Check

Click on the request → Preview tab → Look at the response:

```json
{
  "data": {
    "todos": [
      {
        "id": "...",
        "title": "...",
        "comments": ???,  // Should be MISSING in minimal fragment
        "uploads": ???,   // Should be MISSING in minimal fragment
        ...
      }
    ]
  }
}
```

## Expected Results

### Old Branch (Main)
- Response Size: ~500KB - 2MB (depends on number of todos/comments)
- Query Name: GetTodos
- Response includes: comments[], uploads[], full nested objects

### New Branch (Optimized)
- Response Size: ~150KB - 400KB (40-60% smaller)
- Query Name: GetTodosMinimal
- Response EXCLUDES: comments[], uploads[]

## What to Report

If new branch is NOT smaller:
❌ Optimization not working - minimal fragment not being used

If new branch IS smaller but slower:
❌ Network overhead, query processing, or rendering issue

If similar payload size:
❌ Types not regenerated or query not changed

## Additional Checks

### Performance Tab

1. Open DevTools → Performance
2. Click Record (●)
3. Reload page
4. Stop recording
5. Look for the "LCP" marker
6. What element is the LCP? ___________
7. What's blocking it? ___________

### Console Logs

Check for these logs:
```
[GraphQLClient] query: GetTodosMinimal
[GraphQLClient] query: GetTodoFull  (when opening card)
```

If you see `GetTodos` instead of `GetTodosMinimal`, the optimization isn't active.
