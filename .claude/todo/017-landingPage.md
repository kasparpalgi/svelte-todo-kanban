ToDzz - Open-Source Free Kanban todo lists.

Simple, modern looking and fast. Easy to use.

Google OAuth login.

Because developers love GitHub, but clients don't. Trello's pricey. Jira's bonkers. Here's something that actually makes sense.

GitHub-Integrated Task Management - A proper task management solution that bridges the gap between developers and clients.

A clean, intuitive Kanban board that syncs seamlessly with GitHub issues while providing a friendly interface that clients actually enjoy using. Best of both worlds. 

You can also import existing tasks from GitHub if you start using ToDzz in the middle of a project.

Efficient task management with ToDzz - the Open-Source, customisable, and privacy-first kanban.

Boards - create as many boards for different projects or sub-projects. Then create columns under the board. They usually indicate the stage of the todo item eg. backlog, todo, doing & review but you can use them as you wish. Then organuse tasks / todo items in columns. Usually the idea of the Kanban board is that all the tasks start from the left and shall move to the right where the last column is always buildt-in "complete" column. 

Tasks have titl, description, attached images/files, priority (low, medium, high), labels, and due dates. Keep track of your projects and todos visually.

ToDzz has GitHub integration


WeKan has several features to protect your data and keep it secure. WeKan is designed with security in mind.

WeKan is an open-source project, which means that its source code is available for anyone to inspect and audit for security vulnerabilities. This makes it less likely that there are hidden security holes that could be exploited by attackers.

How to use?
1. Sign up here and use it as a free SaaS project. Free forever for early adopters.
2. 3€ per month (unlimited boards, unlimited users) hosted in your Hetzner server. Includes software updates and health checks.
3. Click here to get the source code and host it for free in your server.
4. 100€ one-time free and I will set it up in your server (eg. ~3.50€ per month in Hetzner)
5. 200 one-time fee and it will be installed in your server fully branded with your company identity including your company colors and more.
6. Do you see any feature missing? Contact and get estimated.

Features:
* Kanban and list view
* Multilingual
* Drag'n'drop tasks
* Fully integrated with GitHub
* Multiplatform mobile app via PWA (progressive web app)
* Estimate minimum/maximum hours of work for each thask and track hours spent on each task. See total average hours estimated for the whole project or some parts of the project.
* Voice + AI note taking - Dictate tasks and let AI correct and enhance your notes. Research mode for intelligent task creation.
* Google Calendar integration
* Multilingual support
* Multi-user collaboration. Invite new users to the board via email with different rights.
* Comments (also synced with GitHub issues)
* File uploads
* Rich text editing
* Priorities
* Due dates
* Keyboard shortcuts
* Label management
* Private/public boards
* Early adopters can vote for the next new features
* Data export (thaks to Hasura)

Technology used:
* Svelte 5 - Svelte is considered "best" by many developers due to its simplicity, efficiency, and excellent developer experience, which leads to faster performance and smaller bundle sizes. It stands out by compiling code at build time, eliminating the need for a virtual DOM and resulting in leaner, faster applications. 
* Hasura - open-source API engine. Get most of your backend API (GraphQL) out of the box and back-end development is INSANE FAST. More than 10x faster in most cases! It runs in top of PostgreSQL.
* Auth.js with JWT tokens
* Drag & Drop: @dnd-kit/svelte
* Rich Text: Svelte Tip-Tap
* Testing: Playwright (E2E), Vitest (unit/component)
* i18n for multilang