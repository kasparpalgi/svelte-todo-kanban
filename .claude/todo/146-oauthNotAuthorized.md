When I go to auth and click Google icon then first screen is where it asks "Choose an account", I click on my logged in Google account but then it says:

Google hasn't verified this app
The app is requesting access to sensitive info in your Google Account. Until the developer (kaspar.lemmo@gmail.com) verifies this app with Google, you shouldn't use it.

If you're the developer, submit a verification request to remove this screen. Learn more

>>>>

I can click "Advanced" -> "Go to todzz.eu (unsafe)" but it is not nice.

So I went to Google Cloud console and saw that I am not verified becuse I was requesting access to restricted data. I corrected that and all looks good in the Google Cloud side now.

I request only:


But noticed that Google is telling me in the OAuth user cap text:

"If your users are seeing the 'unverified app' screen, it is because your OAuth request includes additional scopes that haven't been approved."

So the warning is coming from the code requesting a scope that isn't approved yet. Check what scopes the app is actually requesting in the OAuth flow — likely something beyond basic email/profile/openid snuck in.

Look in the codebase for where we configure the Google OAuth scopes and share it here in this file — then fix and provide list what scopes we request now.

I have in the google cloud console these scopes:

Your non-sensitive scopes

.../auth/calendar.app.created	Make secondary Google Calendars and see, create, change and delete events on them	
.../auth/userinfo.email	See your primary Google Account email address	
.../auth/userinfo.profile	See your personal info, including any personal info you've made publicly available	
openid	Associate you with your personal info on Google	

---

## Fix (2026-04-04)

**Root cause**: `src/hooks.server.ts:54` was requesting two unapproved sensitive scopes alongside basic auth:
- `https://www.googleapis.com/auth/drive.readonly` — sensitive, not approved
- `https://www.googleapis.com/auth/spreadsheets` — sensitive, not approved

These were used by the `invoices/import` feature (Google Drive browsing + Sheets export) via `session.accessToken`.

**Fix applied**: Removed both sensitive scopes from the sign-in OAuth flow. The sign-in now requests only approved scopes:

```
openid
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/userinfo.email
```

**Side effect**: The `/invoices/import` page (Google Drive file picker + Sheets creation) will no longer work because it relies on `session.accessToken` having those scopes. To restore that functionality, it would need its own incremental OAuth flow (like the Google Calendar integration uses via `/api/google-calendar` + `/api/google-calendar/callback`).
