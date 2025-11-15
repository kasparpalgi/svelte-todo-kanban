First study the current src/routes/[lang]/[username]/[board]/+page.svelte and all the stores and everything that is loaded before we user can see the board. Then plan into this file  how to improve initial load speed and then do the tasks one by one.

One idea:
1. First, Load immediatelly top 10 cards for each board
2. Once that done load in the background at the same time all the rest. Multiple fetches at the same time.