See the test results below and one by one for each test think it something in the codebase needs to be fixed or the test needs to be fixed to pass. Or it is pointless test and should be changed.

C:\git\svelte-todo-kanban>npm run test

> svelte-todo-kanban@0.8.1 test
> npm run test:unit:all -- --run && npm run test:e2e














> svelte-todo-kanban@0.8.1 test:unit:all
> vitest --run

The following Vite config options will be overridden by SvelteKit:
  - root
The following Vite config options will be overridden by SvelteKit:
  - root

 RUN  v3.2.4 C:/git/svelte-todo-kanban

 ✓  server  src/lib/stores/trackerStats.logic.test.ts (9 tests) 14ms
 ✓  server  src/lib/utils/__tests__/imageUpload.test.ts (9 tests) 18ms
 ✓  server  src/demo.spec.ts (1 test) 5ms
 ✓  server  src/lib/stores/__tests__/logging-phase3.test.ts (29 tests) 20ms
The following Vite config options will be overridden by SvelteKit:                                                                                                                                        
  - root                                                                                                                                                                                                  
The following Vite config options will be overridden by SvelteKit:                                                                                                                                        
  - base                                                                                                                                                                                                  
 ✓  server  src/routes/api/github/webhook/__tests__/signature.test.ts (17 tests) 24ms
stderr | src/lib/server/__tests__/github.test.ts > GitHub Server Utilities > getGithubToken > should handle serverRequest errors gracefully
[getGithubToken] Error: Error: Database error
    at C:\git\svelte-todo-kanban\src\lib\server\__tests__\github.test.ts:82:47
    at file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runSuite (file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)
    at runSuite (file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)

stderr | src/lib/server/__tests__/github.test.ts > GitHub Server Utilities > getGithubToken > should handle decryption errors gracefully
[getGithubToken] Error: Error: Decryption failed
    at C:\git\svelte-todo-kanban\src\lib\server\__tests__\github.test.ts:106:11
    at mockCall (file:///C:/git/svelte-todo-kanban/node_modules/@vitest/spy/dist/index.js:96:15)
    at decryptToken (file:///C:/git/svelte-todo-kanban/node_modules/tinyspy/dist/index.js:47:80)
    at Module.getGithubToken (C:\git\svelte-todo-kanban\src\lib\server\github.ts:33:10)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at C:\git\svelte-todo-kanban\src\lib\server\__tests__\github.test.ts:109:19
    at file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20

 ✓  server  src/lib/server/__tests__/github.test.ts (15 tests) 56ms
stderr | src/lib/stores/__tests__/todoFiltering.svelte.test.ts > TodoFilteringStore > LocalStorage Persistence > should handle corrupted localStorage gracefully
Failed to load filtering preferences: [SyntaxError: Unexpected token 'i', "invalid-json" is not valid JSON]
 ✓  client (chromium)  src/lib/stores/__tests__/todoFiltering.svelte.test.ts (18 tests) 24ms                                                                                                              
 ❯  client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts (8 tests | 5 failed) 137ms
   ✓ TodosStore > Initial State > should initialize with default values 1ms
   × TodosStore > addTodo > should add a new todo and update the store state 131ms
     → The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
   ✓ TodosStore > addTodo > should not add a todo with an empty title 0ms
   × TodosStore > addTodo > should handle API errors gracefully 1ms
     → The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
   × TodosStore > updateTodo > should update an existing todo 1ms
     → The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
   ✓ TodosStore > updateTodo > should not update a non-existent todo 1ms
   × TodosStore > deleteTodo > should delete a todo and remove it from the store 1ms
     → The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
   × TodosStore > toggleTodo > should toggle a todo to completed 1ms
     → The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')
    at get_hooks (C:\git\svelte-todo-kanban\.svelte-kit\generated\server\internal.js:36:77)
    at C:\git\svelte-todo-kanban\node_modules\@sveltejs\kit\src\runtime\server\index.js:108:35
    at Server.init (C:\git\svelte-todo-kanban\node_modules\@sveltejs\kit\src\runtime\server\index.js:164:5)
    at file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:530:18
 ✓  server  src/lib/stores/__tests__/invitations.test.ts (15 tests) 16ms                                                                                                                                  
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Basic Logging > should support all log levels                                                                                          
[Test] Warn message undefined                                                                                                                                                                             
[Test] Error message undefined                                                                                                                                                                            
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Basic Logging > should respect log level filters                                                                                       
[Test] Error message undefined                                                                                                                                                                            
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Basic Logging > should limit in-memory logs to maxLogs                                                                                 
[LoggingStore] Rate limit exceeded for component: Test

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Data Sanitization > should redact sensitive fields
[Test] Login failed {
  email: 'user@example.com',
  password: '[REDACTED]',
  token: '[REDACTED]',
  apiKey: '[REDACTED]'
}

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Data Sanitization > should redact nested sensitive fields
[Test] Auth error {
  user: {
    id: '123',
    email: 'user@example.com',
    auth: { token: '[REDACTED]', refreshToken: '[REDACTED]' }
  }
}

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Data Sanitization > should handle arrays with sensitive data
[Test] Multiple errors {
  users: [
    { id: '1', password: '[REDACTED]' },
    { id: '2', password: '[REDACTED]' }
  ]
}

stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should batch logs and flush after timeout                                                                       
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should batch logs and flush after timeout                                                                       
[Test] Error 1 undefined                                                                                                                                                                                  
                                                                                                                                                                                                          
stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should batch logs and flush after timeout                                                                       
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should flush immediately when batch size reached                                                                
[Test] Error 0 undefined                                                                                                                                                                                  
[Test] Error 1 undefined                                                                                                                                                                                  
[Test] Error 2 undefined                                                                                                                                                                                  
[Test] Error 3 undefined                                                                                                                                                                                  
[Test] Error 4 undefined                                                                                                                                                                                  
[Test] Error 5 undefined                                                                                                                                                                                  
[Test] Error 6 undefined                                                                                                                                                                                  
[Test] Error 7 undefined
[Test] Error 8 undefined
[Test] Error 9 undefined
[Test] Error 10 undefined
[Test] Error 11 undefined
[Test] Error 12 undefined
[Test] Error 13 undefined
[Test] Error 14 undefined
[Test] Error 15 undefined
[Test] Error 16 undefined
[Test] Error 17 undefined
[Test] Error 18 undefined
[Test] Error 19 undefined
[Test] Error 20 undefined
[Test] Error 21 undefined
[Test] Error 22 undefined
[Test] Error 23 undefined
[Test] Error 24 undefined
[Test] Error 25 undefined
[Test] Error 26 undefined
[Test] Error 27 undefined
[Test] Error 28 undefined
[Test] Error 29 undefined
[Test] Error 30 undefined
[Test] Error 31 undefined
[Test] Error 32 undefined
[Test] Error 33 undefined
[Test] Error 34 undefined
[Test] Error 35 undefined
[Test] Error 36 undefined
[Test] Error 37 undefined
[Test] Error 38 undefined
[Test] Error 39 undefined
[Test] Error 40 undefined
[Test] Error 41 undefined
[Test] Error 42 undefined
[Test] Error 43 undefined
[Test] Error 44 undefined
[Test] Error 45 undefined
[Test] Error 46 undefined
[Test] Error 47 undefined
[Test] Error 48 undefined
[Test] Error 49 undefined

stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should flush immediately when batch size reached                                                                
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should only persist ERROR and WARN levels                                                                       
[Test] Error message undefined                                                                                                                                                                            
                                                                                                                                                                                                          
stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should only persist ERROR and WARN levels                                                                       
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include user_id when set                                                                                 
[Test] Error with user undefined                                                                                                                                                                          
                                                                                                                                                                                                          
stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include user_id when set                                                                                 
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include session_id
[Test] Error with session undefined

stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include session_id                                                                                       
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should handle database failures gracefully                                                                      
[Test] This will fail to save undefined                                                                                                                                                                   
                                                                                                                                                                                                          
stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should handle database failures gracefully                                                                      
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should track recent errors from logs                                                                                   
[Test] Error 1 undefined                                                                                                                                                                                  
[Test] Error 2 undefined                                                                                                                                                                                  
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should track warnings from logs                                                                                        
[Test] Error undefined                                                                                                                                                                                    
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should group logs by component
[ComponentA] Message 3 undefined

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should maintain log order (newest first)
[Test] Error 0 undefined
[Test] Error 1 undefined
[Test] Error 2 undefined
[Test] Error 3 undefined
[Test] Error 4 undefined
[Test] Error 5 undefined
[Test] Error 6 undefined
[Test] Error 7 undefined
[Test] Error 8 undefined
[Test] Error 9 undefined
[Test] Error 10 undefined
[Test] Error 11 undefined
[Test] Error 12 undefined
[Test] Error 13 undefined
[Test] Error 14 undefined

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Export Functionality > should export logs as JSON
[Test] Error message undefined

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > Clear Functionality > should clear all logs
[Test] Message 2 undefined

stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should set user ID
[Test] Error undefined

stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should set user ID                                                                                                
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
stderr | src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should clear user ID                                                                                              
[Test] Error undefined                                                                                                                                                                                    
                                                                                                                                                                                                          
stdout | src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should clear user ID                                                                                              
[LoggingStore] Skipping log flush - user not authenticated                                                                                                                                                
                                                                                                                                                                                                          
 ❯  server  src/lib/stores/__tests__/logging.test.ts (21 tests | 14 failed) 124ms                                                                                                                         
   × LoggingStore > Basic Logging > should add logs to in-memory store 33ms                                                                                                                               
     → expected [] to have a length of 1 but got +0                                                                                                                                                       
   × LoggingStore > Basic Logging > should support all log levels 7ms                                                                                                                                     
     → expected [ …(2) ] to have a length of 3 but got 2
   ✓ LoggingStore > Basic Logging > should respect log level filters 4ms
   ✓ LoggingStore > Basic Logging > should limit in-memory logs to maxLogs 5ms
   ✓ LoggingStore > Data Sanitization > should redact sensitive fields 3ms
   ✓ LoggingStore > Data Sanitization > should redact nested sensitive fields 3ms
   ✓ LoggingStore > Data Sanitization > should handle arrays with sensitive data 3ms
   × LoggingStore > Database Persistence > should batch logs and flush after timeout 9ms
     → expected "spy" to be called 2 times, but got 0 times
   × LoggingStore > Database Persistence > should flush immediately when batch size reached 8ms
     → expected "spy" to be called 50 times, but got 0 times
   × LoggingStore > Database Persistence > should only persist ERROR and WARN levels 4ms
     → expected "spy" to be called 2 times, but got 0 times
   × LoggingStore > Database Persistence > should include user_id when set 4ms
     → expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

   × LoggingStore > Database Persistence > should include session_id 5ms
     → expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

   ✓ LoggingStore > Database Persistence > should handle database failures gracefully 4ms
   × LoggingStore > Log Filtering > should track recent errors from logs 3ms
     → expected [ …(2) ] to have a length of 4 but got 2
   × LoggingStore > Log Filtering > should track warnings from logs 4ms
     → expected [] to have a length of 2 but got +0
   × LoggingStore > Log Filtering > should group logs by component 3ms
     → expected [ { id: 'test-uuid-28xd0rn', …(7) } ] to have a length of 2 but got 1
   ✓ LoggingStore > Log Filtering > should maintain log order (newest first) 2ms
   × LoggingStore > Export Functionality > should export logs as JSON 6ms
     → expected [ { id: 'test-uuid-72qdbfz', …(6) } ] to have a length of 2 but got 1
   × LoggingStore > Clear Functionality > should clear all logs 3ms
     → expected [ { id: 'test-uuid-4xiv2rw', …(7) } ] to have a length of 2 but got 1
   × LoggingStore > User ID Management > should set user ID 4ms
     → expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

   × LoggingStore > User ID Management > should clear user ID 4ms
     → expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0


PWA v1.0.3
mode      generateSW
precache  1 entries (0.00 KiB)
files generated
  dev-dist/sw.js
  dev-dist/workbox-5ffe50d4.js
warnings                                                                                                                                                                                                  
  One of the glob patterns doesn't match any files. Please remove or fix the following: {                                                                                                                 
  "globDirectory": "C:/git/svelte-todo-kanban/dev-dist",                                                                                                                                                  
  "globPattern": "client/**/*.{js,css,ico,png,svg,webp,woff,woff2}",                                                                                                                                      
  "globIgnores": [                                                                                                                                                                                        
    "server/**",                                                                                                                                                                                          
    "sw.js",                                                                                                                                                                                              
    "workbox-*.js"
  ]
}
  One of the glob patterns doesn't match any files. Please remove or fix the following: {
  "globDirectory": "C:/git/svelte-todo-kanban/dev-dist",
  "globPattern": "prerendered/**/*.{html,json}",
  "globIgnores": [
    "server/**",
    "sw.js",
    "workbox-*.js"
  ]
}
  One of the glob patterns doesn't match any files. Please remove or fix the following: {
  "globDirectory": "C:/git/svelte-todo-kanban/dev-dist",
  "globPattern": "client/*.webmanifest",
  "globIgnores": [
    "server/**",
    "sw.js",
    "workbox-*.js"
  ]
}

stderr | src/lib/stores/__tests__/userSilentUpdate.test.ts > UserStore - Silent Updates > should ALWAYS show error message even when silent=true
[UserStore] Failed to update user settings - No user returned. UserId: user-123, Updates: ["settings"] { fullData: { update_users: { returning: [] } } }

stderr | src/lib/stores/__tests__/userSilentUpdate.test.ts > UserStore - Silent Updates > should ALWAYS show error message on network failure even when silent=true
[UserStore] Update error: Failed to update settings: Network error (UserId: user-123, Updates: ["settings"]) {
  error: Error: Network error
      at C:\git\svelte-todo-kanban\src\lib\stores\__tests__\userSilentUpdate.test.ts:149:40
      at processTicksAndRejections (node:internal/process/task_queues:105:5)
      at file:///C:/git/svelte-todo-kanban/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
}

 ❯  server  src/lib/stores/__tests__/userSilentUpdate.test.ts (7 tests | 3 failed) 11044ms
   × UserStore - Silent Updates > should show success message when silent=false (default) 5018ms
     → Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
   × UserStore - Silent Updates > should show success message when silent=false (explicit) 5007ms
     → Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
   × UserStore - Silent Updates > should NOT show success message when silent=true 1001ms
     → vi.mocked(...).mockResolvedValue is not a function
   ✓ UserStore - Silent Updates > should ALWAYS show error message even when silent=true 6ms
   ✓ UserStore - Silent Updates > should ALWAYS show error message on network failure even when silent=true 3ms
   ✓ UserStore - Silent Updates > should log silent flag in logging store 3ms
   ✓ UserStore - Silent Updates > should return success=true for silent updates 2ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 22 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Basic Logging > should add logs to in-memory store
AssertionError: expected [] to have a length of 1 but got +0

- Expected
+ Received

- 1
+ 0

 ❯ src/lib/stores/__tests__/logging.test.ts:69:30
     67|    loggingStore.info('TestComponent', 'Test message', { foo: 'bar' });
     68|
     69|    expect(loggingStore.logs).toHaveLength(1);
       |                              ^
     70|    expect(loggingStore.logs[0]).toMatchObject({
     71|     level: 'info',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Basic Logging > should support all log levels
AssertionError: expected [ …(2) ] to have a length of 3 but got 2

- Expected
+ Received

- 3
+ 2

 ❯ src/lib/stores/__tests__/logging.test.ts:85:30
     83|
     84|    // Debug is not enabled by default
     85|    expect(loggingStore.logs).toHaveLength(3);
       |                              ^
     86|    expect(loggingStore.logs.map((log) => log.level)).toEqual(['error', 'warn', 'info']);
     87|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should batch logs and flush after timeout
AssertionError: expected "spy" to be called 2 times, but got 0 times
 ❯ src/lib/stores/__tests__/logging.test.ts:179:27
    177|
    178|    // Now it should have flushed
    179|    expect(client.request).toHaveBeenCalledTimes(2);
       |                           ^
    180|   });
    181|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should flush immediately when batch size reached
AssertionError: expected "spy" to be called 50 times, but got 0 times
 ❯ src/lib/stores/__tests__/logging.test.ts:191:27
    189|    await vi.runAllTimersAsync();
    190|
    191|    expect(client.request).toHaveBeenCalledTimes(50);
       |                           ^
    192|   });
    193|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should only persist ERROR and WARN levels
AssertionError: expected "spy" to be called 2 times, but got 0 times
 ❯ src/lib/stores/__tests__/logging.test.ts:205:27
    203| 
    204|    // Should only call for warn and error (info is not persisted)
    205|    expect(client.request).toHaveBeenCalledTimes(2);
       |                           ^
    206|   });
    207|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include user_id when set
AssertionError: expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

 ❯ src/lib/stores/__tests__/logging.test.ts:214:27
    212|    await vi.advanceTimersByTimeAsync(10000);
    213|
    214|    expect(client.request).toHaveBeenCalledWith(
       |                           ^
    215|     expect.anything(),
    216|     expect.objectContaining({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Database Persistence > should include session_id
AssertionError: expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

 ❯ src/lib/stores/__tests__/logging.test.ts:229:27
    227|    await vi.advanceTimersByTimeAsync(10000);
    228|
    229|    expect(client.request).toHaveBeenCalledWith(
       |                           ^
    230|     expect.anything(),
    231|     expect.objectContaining({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should track recent errors from logs
AssertionError: expected [ …(2) ] to have a length of 4 but got 2

- Expected
+ Received

- 4
+ 2

 ❯ src/lib/stores/__tests__/logging.test.ts:260:30
    258|
    259|    // Make sure logs are actually stored
    260|    expect(loggingStore.logs).toHaveLength(4);
       |                              ^
    261|
    262|    // Check errors manually since $derived may not work in test environment

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should track warnings from logs
AssertionError: expected [] to have a length of 2 but got +0

- Expected
+ Received

- 2
+ 0

 ❯ src/lib/stores/__tests__/logging.test.ts:276:21
    274|
    275|    const warnings = loggingStore.logs.filter((log) => log.level === 'warn');
    276|    expect(warnings).toHaveLength(2);
       |                     ^
    277|    expect(warnings[0].message).toBe('Warning 2');
    278|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Log Filtering > should group logs by component
AssertionError: expected [ { id: 'test-uuid-28xd0rn', …(7) } ] to have a length of 2 but got 1

- Expected
+ Received

- 2
+ 1

 ❯ src/lib/stores/__tests__/logging.test.ts:289:27
    287|    const componentBLogs = loggingStore.logs.filter((log) => log.component === 'ComponentB');
    288|
    289|    expect(componentALogs).toHaveLength(2);
       |                           ^
    290|    expect(componentBLogs).toHaveLength(1);
    291|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Export Functionality > should export logs as JSON
AssertionError: expected [ { id: 'test-uuid-72qdbfz', …(6) } ] to have a length of 2 but got 1

- Expected
+ Received

- 2
+ 1

 ❯ src/lib/stores/__tests__/logging.test.ts:322:22
    320|    expect(data).toHaveProperty('sessionId');
    321|    expect(data.userId).toBe('user-123');
    322|    expect(data.logs).toHaveLength(2);
       |                      ^
    323|   });
    324|  });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > Clear Functionality > should clear all logs
AssertionError: expected [ { id: 'test-uuid-4xiv2rw', …(7) } ] to have a length of 2 but got 1

- Expected
+ Received

- 2
+ 1

 ❯ src/lib/stores/__tests__/logging.test.ts:333:30
    331|    loggingStore.error('Test', 'Message 2');
    332|
    333|    expect(loggingStore.logs).toHaveLength(2);
       |                              ^
    334|
    335|    loggingStore.clear();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should set user ID
AssertionError: expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

 ❯ src/lib/stores/__tests__/logging.test.ts:350:27
    348|    vi.advanceTimersByTime(10000);
    349|
    350|    expect(client.request).toHaveBeenCalledWith(
       |                           ^
    351|     expect.anything(),
    352|     expect.objectContaining({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/22]⎯

 FAIL   server  src/lib/stores/__tests__/logging.test.ts > LoggingStore > User ID Management > should clear user ID
AssertionError: expected "spy" to be called with arguments: [ Anything, ObjectContaining{…} ]

Number of calls: 0

 ❯ src/lib/stores/__tests__/logging.test.ts:368:27
    366|    vi.advanceTimersByTime(10000);
    367|
    368|    expect(client.request).toHaveBeenCalledWith(
       |                           ^
    369|     expect.anything(),
    370|     expect.objectContaining({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/22]⎯

 FAIL   server  src/lib/stores/__tests__/userSilentUpdate.test.ts > UserStore - Silent Updates > should show success message when silent=false (default)
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/lib/stores/__tests__/userSilentUpdate.test.ts:36:2
     34|  });
     35|
     36|  it('should show success message when silent=false (default)', async () => {
       |  ^
     37|   const { userStore } = await import('../user.svelte');
     38|   const { request } = await import('$lib/graphql/client');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/22]⎯

 FAIL   server  src/lib/stores/__tests__/userSilentUpdate.test.ts > UserStore - Silent Updates > should show success message when silent=false (explicit)
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/lib/stores/__tests__/userSilentUpdate.test.ts:61:2
     59|  });
     60|
     61|  it('should show success message when silent=false (explicit)', async () => {
       |  ^
     62|   const { userStore } = await import('../user.svelte');
     63|   const { request } = await import('$lib/graphql/client');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/22]⎯

 FAIL   server  src/lib/stores/__tests__/userSilentUpdate.test.ts > UserStore - Silent Updates > should NOT show success message when silent=true
TypeError: vi.mocked(...).mockResolvedValue is not a function
 ❯ src/lib/stores/__tests__/userSilentUpdate.test.ts:101:22
     99|   };
    100|
    101|   vi.mocked(request).mockResolvedValue({
       |                      ^
    102|    update_users: {
    103|     returning: [mockUser]

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/22]⎯

 FAIL   client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts > TodosStore > addTodo > should add a new todo and update the store state
 FAIL   client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts > TodosStore > addTodo > should handle API errors gracefully
 FAIL   client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts > TodosStore > updateTodo > should update an existing todo
 FAIL   client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts > TodosStore > deleteTodo > should delete a todo and remove it from the store
 FAIL   client (chromium)  src/lib/stores/__tests__/todos.svelte.test.ts > TodosStore > toggleTodo > should toggle a todo to completed
SyntaxError: The requested module '/node_modules/@sveltejs/kit/src/runtime/app/environment/index.js?v=aa8d71b0' does not provide an export named 'dev'
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/22]⎯


 Test Files  3 failed | 8 passed (11)
      Tests  22 failed | 127 passed (149)
   Start at  20:43:31
   Duration  12.33s (transform 6.24s, setup 1.82s, collect 27.19s, tests 11.48s, environment 3ms, prepare 22.16s)

20:43:43 [vite] (ssr) Error when evaluating SSR module /src/routes/+layout.server.ts: Vite module runner has been closed.
      at SSRCompatModuleRunner.getModuleInformation (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1047:26)
      at SSRCompatModuleRunner.cachedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1040:18)
      at request (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1069:94)
      at C:\git\svelte-todo-kanban\src\lib\graphql\client.ts:4:1
      at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
      at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
      at async eval (C:\git\svelte-todo-kanban\src\lib\utils\getTopBoardPath.ts:2:1)
      at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
      at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
      at async eval (C:\git\svelte-todo-kanban\src\routes\+layout.server.ts:5:1)
      at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
      at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
      at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
      at async SSRCompatModuleRunner.import (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:991:10)
      at async instantiateModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18600:10)
      at async loud_ssr_load_module (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:71:11)
      at async resolve (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:98:18)
      at async resolve (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:134:24)
      at async Object.get_page_options (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/static_analysis/index.js:224:19)
      at async Array.<anonymous> (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:218:29)
      at async Promise.all (index 0)
      at async internal_respond (C:\git\svelte-todo-kanban\node_modules\@sveltejs\kit\src\runtime\server\respond.js:328:20)
      at async file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:562:22
Error: Vite module runner has been closed.
    at SSRCompatModuleRunner.getModuleInformation (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1047:26)
    at SSRCompatModuleRunner.cachedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1040:18)
    at request (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1069:94)
    at C:\git\svelte-todo-kanban\src\lib\graphql\client.ts:4:1
    at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
    at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
    at async eval (C:\git\svelte-todo-kanban\src\lib\utils\getTopBoardPath.ts:2:1)
    at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
    at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
    at async eval (C:\git\svelte-todo-kanban\src\routes\+layout.server.ts:5:1)
    at async ESModulesEvaluator.runInlinedModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:905:3)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1112:59)
    at async SSRCompatModuleRunner.directRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18627:22)
    at async SSRCompatModuleRunner.cachedRequest (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:1030:73)
    at async SSRCompatModuleRunner.import (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/module-runner.js:991:10)
    at async instantiateModule (file:///C:/git/svelte-todo-kanban/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:18600:10)
    at async loud_ssr_load_module (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:71:11)
    at async resolve (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:98:18)
    at async resolve (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:134:24)
    at async Object.get_page_options (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/static_analysis/index.js:224:19)
    at async Array.<anonymous> (file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:218:29)
    at async Promise.all (index 0)
    at async internal_respond (C:\git\svelte-todo-kanban\node_modules\@sveltejs\kit\src\runtime\server\respond.js:328:20)
    at async file:///C:/git/svelte-todo-kanban/node_modules/@sveltejs/kit/src/exports/vite/dev/index.js:562:22