I'm not sure I already had at some point logout functionality but can't find it on the UI right ow. Add logout button at the very bottom right hand side in one line with left hand side "Save" button under settings.

---

UPDATE:

When I click sign out button then sometimes it takes me to the /signin page after that and in the console:

Uncaught (in promise) non-precached-url: non-precached-url :: [{"url":"/"}]
    at O.createHandlerBoundToURL (workbox-5ffe50d4.js:1:13220)
    at Object.createHandlerBoundToURL (workbox-5ffe50d4.js:1:14873)
    at sw.js:1:6401
    at sw.js:1:558

And if I stay longer and /signin route:

signin:20 
 POST https://filtering.adblock360.com/ab/set-current-domain net::ERR_CONNECTION_TIMED_OUT

D67COLDF.js:1 [ErrorBoundary] Unhandled promise rejection 
{reason: 'TypeError: Failed to fetch', stack: 'TypeError: Failed to fetch\n    at https://www.todz…2:4505\n    at https://www.todzz.eu/signin:22:4643', isNetworkError: true}
signin:25 
 GET https://filtering.adblock360.com/bm/manager-domain-data?domain=todzz.eu net::ERR_CONNECTION_TIMED_OUT
signin:25 Error sending request: TypeError: Failed to fetch
    at c.sendRequest (signin:25:2258)
    at c.sendGetRequest (signin:25:2158)
    at c.getDomainData (signin:25:1177)
    at signin:1425:9416
    at signin:1425:9589
    at signin:1425:9593
    at signin:1427:3
signin:1425 Manager initialization error: TypeError: Failed to fetch
    at c.sendRequest (signin:25:2258)
    at c.sendGetRequest (signin:25:2158)
    at c.getDomainData (signin:25:1177)
    at signin:1425:9416
    at signin:1425:9589
    at signin:1425:9593
    at signin:1427:3
background.js:1 Uncaught (in promise) Error: Attempting to use a disconnected port object
    at background.js:1:83571
Error in event handler: Error: Attempting to use a disconnected port object
    at chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/background.js:1:70841

But when I go to the main root page it takes me back to the board and I am still logged in.

Sometimes it just reloads the settings page and I stay in settings page and console:

workbox-5ffe50d4.js:1 Uncaught (in promise) non-precached-url: non-precached-url :: [{"url":"/"}]
    at O.createHandlerBoundToURL (workbox-5ffe50d4.js:1:13220)
    at Object.createHandlerBoundToURL (workbox-5ffe50d4.js:1:14873)
    at sw.js:1:6401
    at sw.js:1:558