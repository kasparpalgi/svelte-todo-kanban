I am already not loading everything at once when I open a board @file src/routes/[lang]/[username]/[board]/+page.svelte and I improved the loading speed but I still get Largest Contentful Paint (LCP) 6.82s sometimes. At most cases below 3s and often under 2s that I didn't have before downloadig content of the pages in multiple parts.

But now deep analyse again EVERYTHING that is loaded when I open the board and write here what is loaded initially and what later and what could be improved further. 

Create todo list what could be improved so that in the top is are the biggest wins and we move down to smaller wins. 

After that implement the first biggest win.

----

Here's also an example of how I have done speed improvement in another app but it is your analyse decision in how high to put or if to put into list this approach. From that app's README:

### Local caching for fast re-opening

The application caches the last ~200 properties, purchases, and property owners locally using **Dexie.js (IndexedDB)** with a 24-hour TTL. When you re-open a cached item, it loads instantly from IndexedDB while silently refreshing from the server in the background. The cache uses LRU (Least Recently Used) eviction when the 300-item limit is reached.

**Recent items tracking**: The last 10 accessed properties and purchases are stored in localStorage for quick access lists.

### Multi-part purchase loading

To improve load speed, purchases are loaded in multiple parts:

1. **Core data first**: Essential purchase info loads immediately (makes page interactive fast)
2. **Sections in parallel**: Comments, tasks, related properties, user access, and property owners load simultaneously in the background without blocking the UI
3. **Cache update**: Complete data is cached to IndexedDB for instant future access

This approach ensures the page is interactive within milliseconds while heavy data loads progressively.