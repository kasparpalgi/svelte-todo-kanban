Goal: SIMPLE! In a most simple way we want to achieve the goal to know how many hours user has worked on each project and when possible even more precisely on what task.

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

