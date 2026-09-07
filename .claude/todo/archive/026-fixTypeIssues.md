See my type issues below and fix them one by one. Every time think also when checking types in the /src/lib/types folder if there are no types duplicating and everything is clean and nice. If you see anywhere outside /src/lib/types folder inline types in a file where they are used then organise them to /src/lib/types folder into correct file and import them where used.

klarity@Klarity---MacMini-M1 svelte-todo-kanban % npm run check

> svelte-todo-kanban@0.8.1 check
> NODE_OPTIONS='--max-old-space-size=4096' svelte-kit sync && NODE_OPTIONS='--max-old-space-size=4096' svelte-check --tsconfig ./tsconfig.json

Loading svelte-check in workspace: /Users/klarity/Documents/GitHub/svelte-todo-kanban
Getting Svelte diagnostics...

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/stores/user.svelte.ts:20:54
Error: Cannot find name 'DEFAULT_LOCALE'. 
        const isDarkMode = $derived(() => user()?.dark_mode || false);
        const userLocale = $derived(() => user()?.locale || DEFAULT_LOCALE);

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/api/auth/token/+server.ts:21:44
Error: Property 'username' does not exist on type '{ id: string; name?: string | null | undefined; email?: string | null | undefined; image?: string | null | undefined; } & User'. 
                                'x-hasura-user-email': session.user.email || '',
                                'x-hasura-user-username': session.user.username || ''
                        },

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/activity/BoardActivityList.svelte:170:4
Warn: noninteractive element cannot have nonnegative tabIndex value
https://svelte.dev/e/a11y_no_noninteractive_tabindex (svelte)
                        {@const clickable = isClickable(log)}
                        <div
                                class="group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50 {clickable
                                        ? 'cursor-pointer'
                                        : ''}"
                                onclick={() => clickable && handleActivityClick(log)}
                                role={clickable ? 'button' : undefined}
                                tabindex={clickable ? 0 : undefined}
                                onkeydown={(e) => {
                                        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                                                e.preventDefault();
                                                handleActivityClick(log);
                                        }
                                }}
                        >
                                <div class="mt-0.5 flex-shrink-0">
                                        <Icon class="h-4 w-4 {getActionColor(log.action_type)}" />
                                </div>
                                <div class="min-w-0 flex-1">
                                        <div class="flex items-start justify-between gap-2">
                                                <div class="min-w-0 flex-1">
                                                        <div class="flex items-center gap-2">
                                                                {#if log.user?.image}
                                                                        <img
                                                                                src={log.user.image}
                                                                                alt={log.user.name || log.user.username}
                                                                                class="h-5 w-5 rounded-full"
                                                                        />
                                                                {/if}
                                                                <span class="font-medium text-sm">
                                                                        {log.user?.name || log.user?.username || 'Unknown user'}
                                                                </span>
                                                        </div>
                                                        <p class="mt-1 text-sm text-foreground">
                                                                {formatActivityDescription(log)}
                                                        </p>
                                                        {#if log.todo?.list?.name}
                                                                <p class="mt-0.5 text-xs text-muted-foreground">
                                                                        {$t('todo.in')} {log.todo.list.name}
                                                                </p>
                                                        {/if}
                                                </div>
                                                <time class="flex-shrink-0 text-xs text-muted-foreground">
                                                        {getRelativeTime(log.created_at)}
                                                </time>
                                        </div>
                                </div>
                        </div>
                {/each}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/activity/BoardActivityList.svelte:87:55
Error: Object literal may only specify known properties, and 'field' does not exist in type 'PayloadDefault'. (ts)
                                if (log.field_name) {
                                        return `${$t('activity.actions.updated_field', { field: log.field_name })} in "${todoTitle}"`;
                                }

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/activity/BoardActivityView.svelte:46:50
Error: Object literal may only specify known properties, and 'boardName' does not exist in type 'PayloadDefault'. (ts)
                        <DialogDescription>
                                {$t('activity.board_activity_description', { boardName })}
                        </DialogDescription>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/activity/BoardActivityView.svelte:52:42
Error: Object literal may only specify known properties, and 'count' does not exist in type 'PayloadDefault'. (ts)
                        <p class="text-sm text-muted-foreground">
                                {$t('activity.showing_activities', { count: activityLogStore.logs.length })}
                        </p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/NotificationPanel.svelte:143:6
Warn: Visible, non-interactive elements with a click event must be accompanied by a keyboard event handler. Consider whether an interactive element such as `<button type="button">` or `<a>` might be more appropriate
https://svelte.dev/e/a11y_click_events_have_key_events (svelte)
                                {#each notifications as notification (notification.id)}
                                        <div
                                                class="flex items-start gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
                                                onclick={() => handleNotificationClick(notification)}
                                        >
                                                <span class="text-xl flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification.type)}
                                                </span>

                                                <div class="flex-1 min-w-0">
                                                        <div class="flex items-start justify-between gap-2">
                                                                <div class="flex-1 min-w-0">
                                                                        {#if notification.todo}
                                                                                <p class="text-xs font-semibold line-clamp-1">
                                                                                        {notification.todo.title}
                                                                                </p>
                                                                        {/if}
                                                                        <p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                                                {notification.content || `${notification.type} notification`}
                                                                        </p>
                                                                        <p class="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                                <Clock class="h-3 w-3" />
                                                                                {formatDate(notification.created_at)}
                                                                        </p>
                                                                </div>

                                                                <div class="flex gap-1 flex-shrink-0">
                                                                        {#if !notification.is_read}
                                                                                <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        class="h-7 w-7"
                                                                                        onclick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleMarkAsRead(notification.id);
                                                                                        }}
                                                                                >
                                                                                        <Check class="h-3 w-3" />
                                                                                </Button>
                                                                        {/if}
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                class="h-7 w-7 text-destructive hover:text-destructive"
                                                                                onclick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDelete(notification.id);
                                                                                }}
                                                                        >
                                                                                <Trash2 class="h-3 w-3" />
                                                                        </Button>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                {/each}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/NotificationPanel.svelte:143:6
Warn: `<div>` with a click handler must have an ARIA role
https://svelte.dev/e/a11y_no_static_element_interactions (svelte)
                                {#each notifications as notification (notification.id)}
                                        <div
                                                class="flex items-start gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
                                                onclick={() => handleNotificationClick(notification)}
                                        >
                                                <span class="text-xl flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification.type)}
                                                </span>

                                                <div class="flex-1 min-w-0">
                                                        <div class="flex items-start justify-between gap-2">
                                                                <div class="flex-1 min-w-0">
                                                                        {#if notification.todo}
                                                                                <p class="text-xs font-semibold line-clamp-1">
                                                                                        {notification.todo.title}
                                                                                </p>
                                                                        {/if}
                                                                        <p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                                                {notification.content || `${notification.type} notification`}
                                                                        </p>
                                                                        <p class="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                                <Clock class="h-3 w-3" />
                                                                                {formatDate(notification.created_at)}
                                                                        </p>
                                                                </div>

                                                                <div class="flex gap-1 flex-shrink-0">
                                                                        {#if !notification.is_read}
                                                                                <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        class="h-7 w-7"
                                                                                        onclick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleMarkAsRead(notification.id);
                                                                                        }}
                                                                                >
                                                                                        <Check class="h-3 w-3" />
                                                                                </Button>
                                                                        {/if}
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                class="h-7 w-7 text-destructive hover:text-destructive"
                                                                                onclick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDelete(notification.id);
                                                                                }}
                                                                        >
                                                                                <Trash2 class="h-3 w-3" />
                                                                        </Button>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                {/each}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/NotificationPanel.svelte:71:63
Error: Object literal may only specify known properties, and 'count' does not exist in type 'PayloadDefault'. (ts)
                if (diffMins < 1) return $t('notifications.just_now');
                if (diffMins < 60) return $t('notifications.minutes_ago', { count: diffMins });
                if (diffHours < 24) return $t('notifications.hours_ago', { count: diffHours });

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/NotificationPanel.svelte:72:62
Error: Object literal may only specify known properties, and 'count' does not exist in type 'PayloadDefault'. (ts)
                if (diffMins < 60) return $t('notifications.minutes_ago', { count: diffMins });
                if (diffHours < 24) return $t('notifications.hours_ago', { count: diffHours });
                if (diffDays < 7) return $t('notifications.days_ago', { count: diffDays });

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/NotificationPanel.svelte:73:59
Error: Object literal may only specify known properties, and 'count' does not exist in type 'PayloadDefault'. (ts)
                if (diffHours < 24) return $t('notifications.hours_ago', { count: diffHours });
                if (diffDays < 7) return $t('notifications.days_ago', { count: diffDays });

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/UnifiedNotificationBell.svelte:297:7
Warn: Visible, non-interactive elements with a click event must be accompanied by a keyboard event handler. Consider whether an interactive element such as `<button type="button">` or `<a>` might be more appropriate
https://svelte.dev/e/a11y_click_events_have_key_events (svelte)
                                        {#each notifications as notification (notification.id)}
                                                <div
                                                        class="flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer hover:bg-muted/50 transition-colors {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
                                                        onclick={() => handleNotificationClick(notification)}
                                                >
                                                        <span class="text-base flex-shrink-0">{getNotificationIcon(notification.type)}</span>

                                                        <div class="flex-1 min-w-0">
                                                                <p class="text-muted-foreground line-clamp-2">
                                                                        {formatNotificationMessage(notification)}
                                                                </p>
                                                                <p class="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                                                                        <Clock class="h-3 w-3" />
                                                                        {formatDatetime(notification.created_at)}
                                                                </p>
                                                        </div>

                                                        <div class="flex gap-1 flex-shrink-0">
                                                                {#if !notification.is_read}
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                class="h-6 w-6"
                                                                                onclick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleMarkAsRead(notification.id);
                                                                                }}
                                                                        >
                                                                                <Check class="h-3 w-3" />
                                                                        </Button>
                                                                {/if}
                                                                <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        class="h-6 w-6 text-destructive hover:text-destructive"
                                                                        onclick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDelete(notification.id);
                                                                        }}
                                                                >
                                                                        <Trash2 class="h-3 w-3" />
                                                                </Button>
                                                        </div>
                                                </div>
                                        {/each}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/lib/components/notifications/UnifiedNotificationBell.svelte:297:7
Warn: `<div>` with a click handler must have an ARIA role
https://svelte.dev/e/a11y_no_static_element_interactions (svelte)
                                        {#each notifications as notification (notification.id)}
                                                <div
                                                        class="flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer hover:bg-muted/50 transition-colors {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
                                                        onclick={() => handleNotificationClick(notification)}
                                                >
                                                        <span class="text-base flex-shrink-0">{getNotificationIcon(notification.type)}</span>

                                                        <div class="flex-1 min-w-0">
                                                                <p class="text-muted-foreground line-clamp-2">
                                                                        {formatNotificationMessage(notification)}
                                                                </p>
                                                                <p class="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                                                                        <Clock class="h-3 w-3" />
                                                                        {formatDatetime(notification.created_at)}
                                                                </p>
                                                        </div>

                                                        <div class="flex gap-1 flex-shrink-0">
                                                                {#if !notification.is_read}
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                class="h-6 w-6"
                                                                                onclick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleMarkAsRead(notification.id);
                                                                                }}
                                                                        >
                                                                                <Check class="h-3 w-3" />
                                                                        </Button>
                                                                {/if}
                                                                <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        class="h-6 w-6 text-destructive hover:text-destructive"
                                                                        onclick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDelete(notification.id);
                                                                        }}
                                                                >
                                                                        <Trash2 class="h-3 w-3" />
                                                                </Button>
                                                        </div>
                                                </div>
                                        {/each}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/[board]/CardModal.svelte:19:6
Warn: `cardDetailView` is updated, but is not declared with `$state(...)`. Changing its value will not correctly trigger updates
https://svelte.dev/e/non_reactive_update (svelte)
        let isClosing = $state(false);
        let cardDetailView: { save: () => Promise<void> };

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/StatsPeriodTabs.svelte:26:23
Error: Type '"Today"' has no properties in common with type 'PayloadDefault'. (ts)
                >
                        {$t('stats.today', 'Today')}
                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/StatsPeriodTabs.svelte:34:22
Error: Type '"Last 7 Days"' has no properties in common with type 'PayloadDefault'. (ts)
                >
                        {$t('stats.week', 'Last 7 Days')}
                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/StatsPeriodTabs.svelte:42:23
Error: Type '"Last 30 Days"' has no properties in common with type 'PayloadDefault'. (ts)
                >
                        {$t('stats.month', 'Last 30 Days')}
                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownChart.svelte:47:7
Warn: Self-closing HTML tags for non-void elements are ambiguous — use `<div ...></div>` rather than `<div ... />`
https://svelte.dev/e/element_invalid_self_closing_tag (svelte)
                                        <div class="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                <div
                                                        class="bg-primary h-full transition-all duration-300"
                                                        style="width: {(item.totalSeconds / maxDuration) * 100}%"
                                                />
                                        </div>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownChart.svelte:57:5
Error: This expression is not callable.
  Type 'Readable<TranslationFunction<Params<PayloadDefault, DefaultProps>>> & { get: TranslationFunction<Params<PayloadDefault, DefaultProps>>; }' has no call signatures. (ts)
                <p class="text-sm text-muted-foreground text-center py-4">
                        {t('stats.noData', 'No data available')}
                </p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownTable.svelte:54:6
Warn: Self-closing HTML tags for non-void elements are ambiguous — use `<div ...></div>` rather than `<div ... />`
https://svelte.dev/e/element_invalid_self_closing_tag (svelte)
                                <div class="w-24 bg-secondary rounded-full h-2 overflow-hidden">
                                        <div
                                                class="bg-primary h-full transition-all duration-300"
                                                style="width: {item.percentage}%"
                                        />
                                </div>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownTable.svelte:45:30
Error: Type '"session"' has no properties in common with type 'PayloadDefault'. (ts)
                                                {item.sessionCount === 1
                                                        ? $t('stats.session', 'session')
                                                        : $t('stats.sessions', 'sessions')}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownTable.svelte:46:31
Error: Type '"sessions"' has no properties in common with type 'PayloadDefault'. (ts)
                                                        ? $t('stats.session', 'session')
                                                        : $t('stats.sessions', 'sessions')}
                                        </div>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/TimeBreakdownTable.svelte:71:24
Error: Type '"No data available"' has no properties in common with type 'PayloadDefault'. (ts)
                <div class="text-center py-6 text-muted-foreground">
                        {$t('stats.noData', 'No data available')}
                </div>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:67:33
Error: Type '"Custom Date Range"' has no properties in common with type 'PayloadDefault'. (ts)
                        <Calendar class="w-5 h-5" />
                        {$t('stats.customDateRange', 'Custom Date Range')}
                </CardTitle>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:70:33
Error: Type '"Select a custom date range or use presets"' has no properties in common with type 'PayloadDefault'. (ts)
                <CardDescription>
                        {$t('stats.selectDateRange', 'Select a custom date range or use presets')}
                </CardDescription>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:78:29
Error: Type '"Start Date"' has no properties in common with type 'PayloadDefault'. (ts)
                                <Label for="start-date" class="text-sm font-medium">
                                        {$t('stats.startDate', 'Start Date')}
                                </Label>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:90:27
Error: Type '"End Date"' has no properties in common with type 'PayloadDefault'. (ts)
                                <Label for="end-date" class="text-sm font-medium">
                                        {$t('stats.endDate', 'End Date')}
                                </Label>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:105:31
Error: Type '"Quick Presets"' has no properties in common with type 'PayloadDefault'. (ts)
                        <p class="text-sm font-medium">
                                {$t('stats.quickPresets', 'Quick Presets')}
                        </p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:114:25
Error: Type '"Today"' has no properties in common with type 'PayloadDefault'. (ts)
                                >
                                        {$t('stats.today', 'Today')}
                                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:122:29
Error: Type '"Last 7 Days"' has no properties in common with type 'PayloadDefault'. (ts)
                                >
                                        {$t('stats.last7Days', 'Last 7 Days')}
                                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:130:30
Error: Type '"Last 30 Days"' has no properties in common with type 'PayloadDefault'. (ts)
                                >
                                        {$t('stats.last30Days', 'Last 30 Days')}
                                </Button>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:138:32
Error: Type '"Date Range Information"' has no properties in common with type 'PayloadDefault'. (ts)
                        <p class="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                {$t('stats.dateRangeInfo', 'Date Range Information')}
                        </p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:141:37
Error: Type '"Start date is set to 00:00:00"' has no properties in common with type 'PayloadDefault'. (ts)
                        <ul class="list-disc list-inside space-y-1 text-xs">
                                <li>{$t('stats.dateRangeInfo1', 'Start date is set to 00:00:00')}</li>
                                <li>{$t('stats.dateRangeInfo2', 'End date is set to 23:59:59')}</li>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:142:37
Error: Type '"End date is set to 23:59:59"' has no properties in common with type 'PayloadDefault'. (ts)
                                <li>{$t('stats.dateRangeInfo1', 'Start date is set to 00:00:00')}</li>
                                <li>{$t('stats.dateRangeInfo2', 'End date is set to 23:59:59')}</li>
                                <li>{$t('stats.dateRangeInfo3', 'Changes apply immediately to statistics')}</li>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/DateRangePicker.svelte:143:37
Error: Type '"Changes apply immediately to statistics"' has no properties in common with type 'PayloadDefault'. (ts)
                                <li>{$t('stats.dateRangeInfo2', 'End date is set to 23:59:59')}</li>
                                <li>{$t('stats.dateRangeInfo3', 'Changes apply immediately to statistics')}</li>
                        </ul>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:73:8
Error: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. (ts)
                for (const i of range) {
                        if (i - prev === 2) {
                                rangeWithDots.push(prev + 1);

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:75:15
Error: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. (ts)
                                rangeWithDots.push(prev + 1);
                        } else if (i - prev !== 1) {
                                rangeWithDots.push('...');

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:149:38
Error: Type '"Detailed view of all tracked sessions and their allocations"' has no properties in common with type 'PayloadDefault'. (ts)
                <CardDescription>
                        {$t('stats.sessionBreakdownDesc', 'Detailed view of all tracked sessions and their allocations')}
                </CardDescription>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:158:34
Error: Type '"Search Sessions"' has no properties in common with type 'PayloadDefault'. (ts)
                                <label for="session-search" class="text-sm font-medium">
                                        {$t('stats.searchSessions', 'Search Sessions')}
                                </label>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:163:49
Error: Type '"Search by window title or reason..."' has no properties in common with type 'PayloadDefault'. (ts)
                                        type="text"
                                        placeholder={$t('stats.searchPlaceholder', 'Search by window title or reason...')}
                                        bind:value={searchQuery}

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:195:73
Error: Type '"Total Sessions"' has no properties in common with type 'PayloadDefault'. (ts)
                        <div class="text-center">
                                <p class="text-xs text-muted-foreground">{$t('stats.totalSessions', 'Total Sessions')}</p>
                                <p class="text-lg font-bold">{sessions.length}</p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:199:67
Error: Type '"Matched"' has no properties in common with type 'PayloadDefault'. (ts)
                        <div class="text-center">
                                <p class="text-xs text-muted-foreground">{$t('stats.matched', 'Matched')}</p>
                                <p class="text-lg font-bold text-blue-600 dark:text-blue-400">

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:205:69
Error: Type '"Unmatched"' has no properties in common with type 'PayloadDefault'. (ts)
                        <div class="text-center">
                                <p class="text-xs text-muted-foreground">{$t('stats.unmatched', 'Unmatched')}</p>
                                <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/SessionBreakdown.svelte:227:38
Error: Type '"No sessions found matching your search."' has no properties in common with type 'PayloadDefault'. (ts)
                                        <AlertCircle class="w-4 h-4" />
                                        <p>{$t('stats.noSessionsFound', 'No sessions found matching your search.')}</p>
                                </div>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:52:43
Error: Argument of type '"today" | "week" | "month" | "custom"' is not assignable to parameter of type '"today" | "week" | "month"'.
  Type '"custom"' is not assignable to type '"today" | "week" | "month"'. (ts)
        onMount(async () => {
                await trackerStatsStore.loadStatsPeriod(selectedPeriod);
        });

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:140:24
Error: Type '"Time Statistics"' has no properties in common with type 'PayloadDefault'. (ts)
                                <ChartColumn class="w-8 h-8" />
                                {$t('stats.title', 'Time Statistics')}
                        </h1>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:143:30
Error: Type '"Track your time spent on projects and categories"' has no properties in common with type 'PayloadDefault'. (ts)
                        <p class="text-muted-foreground mt-1">
                                {$t('stats.description', 'Track your time spent on projects and categories')}
                        </p>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:148:20
Error: Type '"today" | "week" | "month" | "custom"' is not assignable to type '"today" | "week" | "month"'.
  Type '"custom"' is not assignable to type '"today" | "week" | "month"'. (ts)

        <StatsPeriodTabs {selectedPeriod} on:periodChange={handlePeriodChange} />

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:180:60
Error: Type '"Loading..."' has no properties in common with type 'PayloadDefault'. (ts)
                                <Loader2 class="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                                <p class="text-muted-foreground">{$t('common.loading', 'Loading...')}</p>
                        </CardContent>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:189:27
Error: Type '"Error"' has no properties in common with type 'PayloadDefault'. (ts)
                                        <h3 class="font-semibold text-red-900 dark:text-red-100">
                                                {$t('common.error', 'Error')}
                                        </h3>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:201:30
Error: Type '"Total Time"' has no properties in common with type 'PayloadDefault'. (ts)
                                                <Clock class="w-4 h-4" />
                                                {$t('stats.totalTime', 'Total Time')}
                                        </CardTitle>

/Users/klarity/Documents/GitHub/svelte-todo-kanban/src/routes/[lang]/[username]/stats/+page.svelte:211:8
Error: Type '"tracked"' has no properties in common with type 'PayloadDefault'. (ts)
                                                        'stats.tracked',
                                                        'tracked'
                                                )}

====================================
svelte-check found 44 errors and 8 warnings in 13 files