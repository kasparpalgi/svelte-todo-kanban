Goal: SIMPLE SOLUTION! In a most simple way we want to achieve the goal to know how many hours user has worked on each project and when possible even more precisely on what task.

From 'tracker_keywords' table we see what keywords are related to what board (project) or to what category (eg. entertainment, work, etc.). That's an idea. We can change that if there's better SQL structure to achieve that.

Idea is that if we can capture from keywrords:

Example 1:

project 1 - 10min
category work - 10min
category work - 10min
project 1 - 10min
category entertainment - 10min
category entertainment - 10min
project 1 - 10min
category unknown - 60min (we won't count it as it is too long unknown proportionally)
project 1 - 10min
--- overall, by skipping entertainment we can calculate the time spent on project 1

Example 2 (with task):

project 1 - 10min
category work - 10min
category work - 10min
project 1 - 10min
project 1, task 1 - <1min ('todos.title' is present in 'tracker_sessions.window_title' means user opened this task)
project 1 or category work - 10min
project 1, task 1 - <1min (after that today this is not present so user closed it and finished working on this task)

--------

Let's create a simple src/routes/[lang]/[username]/[board]/stats/+page.svelte route to display some overview of past day, 7 days to visualise and see if the approach makes sense.

Sample data to think:

query TrackerSessions($limit: Int = 5000, $offset: Int = 0, $order_by: [tracker_sessions_order_by!] = {}, $where: tracker_sessions_bool_exp = {}) {
  tracker_sessions(limit: $limit, offset: $offset, order_by: $order_by, where: $where) {
    id
    window_title
    start_time
    end_time
    duration_seconds
    tracker_app {
      id
      name
    }
  }
}

Variables: {
  "order_by": {
    "created_at": "desc"
  }
}

Sample data:

{
  "data": {
    "tracker_sessions": [
      {
        "id": 36596,
        "window_title": "● generate • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:07.596+00:00",
        "end_time": "2025-10-31T19:48:07.596+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36587,
        "window_title": "● generate keyword with • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:10.91+00:00",
        "end_time": "2025-10-31T19:48:10.91+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36589,
        "window_title": "● generate keyword wi • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:10.269+00:00",
        "end_time": "2025-10-31T19:48:10.269+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36599,
        "window_title": "● g • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:06.132+00:00",
        "end_time": "2025-10-31T19:48:06.132+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36575,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:46.273+00:00",
        "end_time": "2025-10-31T19:49:33.273+00:00",
        "duration_seconds": 47,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36591,
        "window_title": "● generate keyword • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:09.436+00:00",
        "end_time": "2025-10-31T19:48:09.436+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36603,
        "window_title": "Start with Klarity: track working hours | ToDzz - Google Chrome",
        "start_time": "2025-10-31T19:47:19.241+00:00",
        "end_time": "2025-10-31T19:47:21.241+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 54,
          "name": "chrome"
        }
      },
      {
        "id": 36592,
        "window_title": "● generate keywor • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:09.124+00:00",
        "end_time": "2025-10-31T19:48:09.124+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36580,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:48:39.222+00:00",
        "end_time": "2025-10-31T19:48:43.222+00:00",
        "duration_seconds": 4,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36581,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:48:38.473+00:00",
        "end_time": "2025-10-31T19:48:38.473+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36586,
        "window_title": "● generate keyword with L • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:11.552+00:00",
        "end_time": "2025-10-31T19:48:11.552+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36609,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:46:52.299+00:00",
        "end_time": "2025-10-31T19:47:08.299+00:00",
        "duration_seconds": 16,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36613,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:46:45.729+00:00",
        "end_time": "2025-10-31T19:46:46.729+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36574,
        "window_title": "● make the title of • Untitled-1 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:34.08+00:00",
        "end_time": "2025-10-31T19:49:36.08+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36583,
        "window_title": "",
        "start_time": "2025-10-31T19:48:37.204+00:00",
        "end_time": "2025-10-31T19:48:37.204+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36566,
        "window_title": "TodoItem.svelte - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:53.529+00:00",
        "end_time": "2025-10-31T19:50:37.529+00:00",
        "duration_seconds": 44,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36572,
        "window_title": "● make the title of • Untitled-1 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:38.507+00:00",
        "end_time": "2025-10-31T19:49:38.507+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36610,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:46:49.857+00:00",
        "end_time": "2025-10-31T19:46:51.857+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36573,
        "window_title": "Visual Studio Code",
        "start_time": "2025-10-31T19:49:36.191+00:00",
        "end_time": "2025-10-31T19:49:38.191+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36600,
        "window_title": "Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:00.641+00:00",
        "end_time": "2025-10-31T19:48:05.641+00:00",
        "duration_seconds": 5,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36595,
        "window_title": "● generate ke • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:08.091+00:00",
        "end_time": "2025-10-31T19:48:08.091+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36590,
        "window_title": "● generate keyword w • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:09.845+00:00",
        "end_time": "2025-10-31T19:48:09.845+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36570,
        "window_title": "README.md - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:41.428+00:00",
        "end_time": "2025-10-31T19:49:44.428+00:00",
        "duration_seconds": 3,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36582,
        "window_title": "Start with Klarity: track working hours | ToDzz - Google Chrome",
        "start_time": "2025-10-31T19:48:37.609+00:00",
        "end_time": "2025-10-31T19:48:37.609+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 54,
          "name": "chrome"
        }
      },
      {
        "id": 36579,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:48:44.203+00:00",
        "end_time": "2025-10-31T19:48:44.203+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36594,
        "window_title": "● generate key • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:08.375+00:00",
        "end_time": "2025-10-31T19:48:08.375+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36605,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:47:12.115+00:00",
        "end_time": "2025-10-31T19:47:12.115+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36571,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:38.82+00:00",
        "end_time": "2025-10-31T19:49:40.82+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36604,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:47:13.071+00:00",
        "end_time": "2025-10-31T19:47:19.071+00:00",
        "duration_seconds": 6,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36568,
        "window_title": "dateTime.svelte.ts - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:46.595+00:00",
        "end_time": "2025-10-31T19:49:50.595+00:00",
        "duration_seconds": 4,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36612,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:46:47.386+00:00",
        "end_time": "2025-10-31T19:46:49.386+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36593,
        "window_title": "● generate keyw • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:08.779+00:00",
        "end_time": "2025-10-31T19:48:08.779+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36597,
        "window_title": "● generat • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:07.247+00:00",
        "end_time": "2025-10-31T19:48:07.247+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36585,
        "window_title": "● generate keyword with LL • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:11.875+00:00",
        "end_time": "2025-10-31T19:48:11.875+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36576,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:45.771+00:00",
        "end_time": "2025-10-31T19:48:45.771+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36567,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:51.592+00:00",
        "end_time": "2025-10-31T19:49:52.592+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36601,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:47:22.523+00:00",
        "end_time": "2025-10-31T19:48:00.523+00:00",
        "duration_seconds": 38,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36588,
        "window_title": "● generate keyword with • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:10.588+00:00",
        "end_time": "2025-10-31T19:48:10.588+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36602,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:47:22.184+00:00",
        "end_time": "2025-10-31T19:47:22.184+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36606,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:47:11.811+00:00",
        "end_time": "2025-10-31T19:47:11.811+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36598,
        "window_title": "● gene • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:06.723+00:00",
        "end_time": "2025-10-31T19:48:06.723+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36578,
        "window_title": "Start with Klarity: track working hours | ToDzz - Google Chrome",
        "start_time": "2025-10-31T19:48:44.554+00:00",
        "end_time": "2025-10-31T19:48:44.554+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 54,
          "name": "chrome"
        }
      },
      {
        "id": 36577,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:48:45.344+00:00",
        "end_time": "2025-10-31T19:48:45.344+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36569,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:49:44.441+00:00",
        "end_time": "2025-10-31T19:49:46.441+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36608,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:47:09.226+00:00",
        "end_time": "2025-10-31T19:47:09.226+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36584,
        "window_title": "● generate keyword with LLM • Untitled-2 - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:48:12.19+00:00",
        "end_time": "2025-10-31T19:48:36.19+00:00",
        "duration_seconds": 24,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36548,
        "window_title": "New tab - Brave",
        "start_time": "2025-10-31T19:42:01.847+00:00",
        "end_time": "2025-10-31T19:42:04.847+00:00",
        "duration_seconds": 3,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36513,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:46:07.907+00:00",
        "end_time": "2025-10-31T19:46:07.907+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36522,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:45:00.375+00:00",
        "end_time": "2025-10-31T19:45:00.375+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36519,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:45:02.978+00:00",
        "end_time": "2025-10-31T19:45:03.978+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36537,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:42:31.882+00:00",
        "end_time": "2025-10-31T19:42:31.882+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36531,
        "window_title": "Login | Hasura - Brave",
        "start_time": "2025-10-31T19:42:43.431+00:00",
        "end_time": "2025-10-31T19:42:43.431+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36565,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:36:15.939+00:00",
        "end_time": "2025-10-31T19:36:16.939+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36516,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:45:58.099+00:00",
        "end_time": "2025-10-31T19:45:59.099+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36520,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:45:02.202+00:00",
        "end_time": "2025-10-31T19:45:02.202+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36563,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:36:19.649+00:00",
        "end_time": "2025-10-31T19:36:19.649+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36535,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:42:32.68+00:00",
        "end_time": "2025-10-31T19:42:32.68+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36542,
        "window_title": "Private New Tab - Brave",
        "start_time": "2025-10-31T19:42:12.102+00:00",
        "end_time": "2025-10-31T19:42:12.102+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36536,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:42:32.215+00:00",
        "end_time": "2025-10-31T19:42:32.215+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36564,
        "window_title": "Start with Klarity: track working hours | ToDzz - Brave",
        "start_time": "2025-10-31T19:36:16.964+00:00",
        "end_time": "2025-10-31T19:36:18.964+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36552,
        "window_title": "019-trackerIntegration.md - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:41:43.094+00:00",
        "end_time": "2025-10-31T19:41:50.094+00:00",
        "duration_seconds": 7,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36549,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:42:00.832+00:00",
        "end_time": "2025-10-31T19:42:00.832+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36517,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:45:05.229+00:00",
        "end_time": "2025-10-31T19:45:57.229+00:00",
        "duration_seconds": 52,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36551,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:41:50.348+00:00",
        "end_time": "2025-10-31T19:41:59.348+00:00",
        "duration_seconds": 9,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36547,
        "window_title": "New Tab - Brave",
        "start_time": "2025-10-31T19:42:05.098+00:00",
        "end_time": "2025-10-31T19:42:05.098+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36558,
        "window_title": "svelte-todo-kanban/tracker-sync at main · kasparpalgi/svelte-todo-kanban - Brave",
        "start_time": "2025-10-31T19:36:33.404+00:00",
        "end_time": "2025-10-31T19:36:37.404+00:00",
        "duration_seconds": 4,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36512,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:46:08.242+00:00",
        "end_time": "2025-10-31T19:46:22.242+00:00",
        "duration_seconds": 14,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36541,
        "window_title": "Google Search - Brave",
        "start_time": "2025-10-31T19:42:12.346+00:00",
        "end_time": "2025-10-31T19:42:12.346+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36555,
        "window_title": "GitHub Desktop",
        "start_time": "2025-10-31T19:36:51.55+00:00",
        "end_time": "2025-10-31T19:36:51.55+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 37,
          "name": "GitHubDesktop"
        }
      },
      {
        "id": 36523,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:45:00.039+00:00",
        "end_time": "2025-10-31T19:45:00.039+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36533,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:42:33.563+00:00",
        "end_time": "2025-10-31T19:42:33.563+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36554,
        "window_title": "svelte-todo-kanban/tracker-sync/README.md at main · kasparpalgi/svelte-todo-kanban - Brave",
        "start_time": "2025-10-31T19:36:51.95+00:00",
        "end_time": "2025-10-31T19:37:02.95+00:00",
        "duration_seconds": 11,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36543,
        "window_title": "New Private Tab - Brave",
        "start_time": "2025-10-31T19:42:11.139+00:00",
        "end_time": "2025-10-31T19:42:11.139+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36560,
        "window_title": "github.com/kasparpalgi/svelte-todo-kanban - Brave",
        "start_time": "2025-10-31T19:36:23.858+00:00",
        "end_time": "2025-10-31T19:36:23.858+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36528,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:42:52.663+00:00",
        "end_time": "2025-10-31T19:42:52.663+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36556,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:36:48.55+00:00",
        "end_time": "2025-10-31T19:36:50.55+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36534,
        "window_title": "Login | Hasura - Brave",
        "start_time": "2025-10-31T19:42:33.019+00:00",
        "end_time": "2025-10-31T19:42:33.019+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36539,
        "window_title": "api.todzz.eu/console - Brave",
        "start_time": "2025-10-31T19:42:21.109+00:00",
        "end_time": "2025-10-31T19:42:24.109+00:00",
        "duration_seconds": 3,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36511,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:46:23.011+00:00",
        "end_time": "2025-10-31T19:46:24.011+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36514,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:45:59.605+00:00",
        "end_time": "2025-10-31T19:46:07.605+00:00",
        "duration_seconds": 8,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36546,
        "window_title": "api.todzz.eu/console - Brave",
        "start_time": "2025-10-31T19:42:05.864+00:00",
        "end_time": "2025-10-31T19:42:07.864+00:00",
        "duration_seconds": 2,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36550,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:41:59.903+00:00",
        "end_time": "2025-10-31T19:41:59.903+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36526,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:42:54.294+00:00",
        "end_time": "2025-10-31T19:43:32.294+00:00",
        "duration_seconds": 38,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36532,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:42:34.168+00:00",
        "end_time": "2025-10-31T19:42:43.168+00:00",
        "duration_seconds": 9,
        "tracker_app": {
          "id": 56,
          "name": "vscode"
        }
      },
      {
        "id": 36530,
        "window_title": "Login | Hasura - Brave",
        "start_time": "2025-10-31T19:42:43.866+00:00",
        "end_time": "2025-10-31T19:42:46.866+00:00",
        "duration_seconds": 3,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36553,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:37:03.257+00:00",
        "end_time": "2025-10-31T19:41:42.257+00:00",
        "duration_seconds": 279,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36545,
        "window_title": "API Explorer | Hasura - Brave",
        "start_time": "2025-10-31T19:42:08.574+00:00",
        "end_time": "2025-10-31T19:42:08.574+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36525,
        "window_title": "Ditto",
        "start_time": "2025-10-31T19:43:33.019+00:00",
        "end_time": "2025-10-31T19:43:33.019+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 33,
          "name": "Ditto"
        }
      },
      {
        "id": 36515,
        "window_title": ".env - svelte-todo-kanban - Visual Studio Code",
        "start_time": "2025-10-31T19:45:59.269+00:00",
        "end_time": "2025-10-31T19:45:59.269+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36540,
        "window_title": "vGBpmAozUI6J2weE4qMRz8Zz0jkpgTlf - Google Search - Brave",
        "start_time": "2025-10-31T19:42:12.869+00:00",
        "end_time": "2025-10-31T19:42:20.869+00:00",
        "duration_seconds": 8,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36529,
        "window_title": "API Explorer | Hasura - Brave",
        "start_time": "2025-10-31T19:42:47.22+00:00",
        "end_time": "2025-10-31T19:42:52.22+00:00",
        "duration_seconds": 5,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36559,
        "window_title": "kasparpalgi/svelte-todo-kanban: Svelte 5 Kanban board. Lightweight nice looking with ShadCN. Github and Google Calendar integrated. Auth.js JWT and Hasura GraphQL (PostgreSQL) back-end. - Brave",
        "start_time": "2025-10-31T19:36:24.227+00:00",
        "end_time": "2025-10-31T19:36:33.227+00:00",
        "duration_seconds": 9,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36524,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:43:33.991+00:00",
        "end_time": "2025-10-31T19:44:59.991+00:00",
        "duration_seconds": 86,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36518,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:45:04.835+00:00",
        "end_time": "2025-10-31T19:45:04.835+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36538,
        "window_title": "Login | Hasura - Brave",
        "start_time": "2025-10-31T19:42:24.641+00:00",
        "end_time": "2025-10-31T19:42:31.641+00:00",
        "duration_seconds": 7,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36561,
        "window_title": "Untitled - Brave",
        "start_time": "2025-10-31T19:36:22.593+00:00",
        "end_time": "2025-10-31T19:36:23.593+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36544,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:42:09.536+00:00",
        "end_time": "2025-10-31T19:42:10.536+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36521,
        "window_title": "(43) WhatsApp - Brave",
        "start_time": "2025-10-31T19:45:01.348+00:00",
        "end_time": "2025-10-31T19:45:01.348+00:00",
        "duration_seconds": 0,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36557,
        "window_title": "svelte-todo-kanban/tracker-sync/README.md at main · kasparpalgi/svelte-todo-kanban - Brave",
        "start_time": "2025-10-31T19:36:37.537+00:00",
        "end_time": "2025-10-31T19:36:47.537+00:00",
        "duration_seconds": 10,
        "tracker_app": {
          "id": 30,
          "name": "Brave Browser"
        }
      },
      {
        "id": 36527,
        "window_title": "Task Switching",
        "start_time": "2025-10-31T19:42:53.226+00:00",
        "end_time": "2025-10-31T19:42:54.226+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 50,
          "name": "Windows Explorer"
        }
      },
      {
        "id": 36562,
        "window_title": "GitHub Desktop",
        "start_time": "2025-10-31T19:36:20.638+00:00",
        "end_time": "2025-10-31T19:36:21.638+00:00",
        "duration_seconds": 1,
        "tracker_app": {
          "id": 37,
          "name": "GitHubDesktop"
        }
      },
// etc

-----------

Keywords and categories to use (feel free if you see patterns add keywords/categories to make stat better):

