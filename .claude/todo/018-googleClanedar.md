When I add a due date here src/lib/components/todo/CardDetailView.svelte or when there is already a due date then display a checkbox "Add to Google calendar" and add to Google calendar. Not sure if user shall also first under src/routes/[[lang]]/settings/+page.svelte do the Google Oauth first like with Github you can see or when user logs in at src/routes/signin/+page.svelte with Google Oauth then we already have access to the user's Google calendar.

<Popover bind:open={datePickerOpen}>
					<PopoverTrigger>
						<Button
							variant="outline"
							class={cn(
								'w-full justify-start text-left font-normal',
								!selectedDate && 'text-muted-foreground'
							)}
						>
							<CalendarIcon class="mr-2 h-4 w-4" />
							{selectedDate ? formatDate(selectedDate, lang) : $t('card.pick_date')}
						</Button>
					</PopoverTrigger>
					<PopoverContent class="w-auto p-0" align="start">
						<CalendarPrimitive
							type="single"
							value={selectedDate}
							locale={lang}
							onValueChange={(date: DateValue | undefined) => {
								selectedDate = date;
								datePickerOpen = false;
							}}
						/>
					</PopoverContent>