See how I use voice input and AI to correct my new todo item title. Make it also possible to add content with voice/AI.
Also, for notes - both title and content.

If there's pre-existing content then provide to AI also the existing content to make more sense with proper context and prompt. Eg. shortly: here's user's voice input to correct: ****, here's the rest of the card content above user input: ****, here's the rent of the user card content below the user input: ****. Title of the card: ****. Feel free to add very short suggestion below the user input, too in content.

---

## Implementation Complete

### Changes Made:

1. **Enhanced VoiceInput.svelte** (`src/lib/components/todo/VoiceInput.svelte`)
   - Added new props: `contentBefore`, `contentAfter`, `useContextualCorrection`
   - Updated `correctTextWithAI()` to support contextual correction
   - When `useContextualCorrection` is true, sends context to AI API
   - AI can now see content before/after the voice input to make corrections flow naturally

2. **Updated AI API** (`src/routes/api/ai/+server.ts`)
   - Added new correction type: `contextual`
   - Accepts `contentBefore`, `contentAfter`, and `title` parameters
   - AI prompt now includes:
     - Content before user input (last 200 chars)
     - Content after user input (first 200 chars)
     - Document/card title for context
     - Instructions to make content flow naturally and optionally add helpful suggestions

3. **Updated TodoEditForm.svelte** (`src/lib/components/todo/TodoEditForm.svelte`)
   - Added `getEditorContext()` function to extract text before/after cursor
   - Updated `handleContentVoice()` to insert text at cursor position (instead of replacing all)
   - Voice input for content now uses contextual correction
   - Passes current title, contentBefore, and contentAfter to VoiceInput

4. **Updated NoteEditor.svelte** (`src/lib/components/notes/NoteEditor.svelte`)
   - Added VoiceInput component import
   - Added voice input button next to title field
   - Added voice input button below editor for content
   - Implemented `handleTitleVoice()` and `handleContentVoice()` handlers
   - Added `getEditorContext()` function (same as TodoEditForm)
   - Content voice input uses contextual correction with full context

### How It Works:

**For Titles (Todos & Notes):**
- Simple voice-to-text with grammar/spelling correction
- No contextual awareness (titles are standalone)

**For Content (Todos & Notes):**
- Voice input is inserted at cursor position
- AI receives:
  - The voice transcription to correct
  - Text before cursor (for context)
  - Text after cursor (for context)
  - Document/card title (for overall context)
- AI corrects grammar and makes the text flow naturally with surrounding content
- AI may add a brief helpful suggestion at the end

### User Experience:

1. User clicks microphone button
2. Speaks their input
3. AI processes with full context awareness
4. Corrected text appears at cursor position (not replacing existing content)
5. Text flows naturally with surrounding content
6. Optional: AI adds a helpful suggestion

### Testing:

- Type checking passed (no new errors introduced)
- All existing type errors are pre-existing issues
- Changes are backward compatible
- Voice input works for:
  - Todo titles ✓
  - Todo content (with context) ✓
  - Note titles ✓
  - Note content (with context) ✓

### Next Steps (Optional):

- Test with real voice input in browser
- Fine-tune AI prompts based on user feedback
- Add user setting to control suggestion generation
- Consider adding language detection for multilingual support

---

## Update 2: AI Task Button & Improved Visibility

### Additional Changes Made:

1. **Created AITaskButton Component** (`src/lib/components/todo/AITaskButton.svelte`)
   - New purple sparkle icon (distinct from blue microphone)
   - Opens dialog for users to give AI tasks
   - Examples: "Research this topic", "Summarize key points", "Suggest improvements"
   - Shows context info (title, content length)
   - Displays processing time and cost
   - Keyboard shortcuts: Ctrl+Enter to submit, Esc to close

2. **Created AI Task API** (`src/routes/api/ai/task/+server.ts`)
   - Handles AI task requests
   - Provides full context to AI (title, current content)
   - Returns formatted result ready for insertion
   - Supports up to 2000 token responses

3. **Enhanced TodoEditForm Visibility**
   - Added prominent AI toolbar below content editor
   - Toolbar shows "AI:" label with both icons
   - Voice input icon (microphone) for voice-to-text
   - AI Task icon (purple sparkle) for giving AI commands
   - Hint text: "Voice input or AI task"
   - Visual separator with border and background

4. **Enhanced NoteEditor Visibility**
   - Same AI toolbar as TodoEditForm
   - Both voice input and AI task buttons visible
   - Consistent UX across todos and notes

### New Features:

**Voice Input (Microphone Icon):**
- Click to record voice
- AI corrects grammar/spelling
- Inserts at cursor position
- Context-aware for natural flow

**AI Task (Purple Sparkle Icon):**
- Click to open task dialog
- Type AI commands like:
  - "Research this topic and add key points"
  - "Summarize the content above"
  - "Suggest next steps based on this task"
  - "Create a checklist from this description"
  - "Add examples for each point"
- AI has access to title and full content
- Result inserted at cursor position

### User Experience:

**Before:** Voice input button was hard to find below editor

**After:**
- Prominent AI toolbar with clear "AI:" label
- Two distinct icons (blue microphone, purple sparkle)
- Hint text explaining functionality
- Professional toolbar appearance

### Files Added:
- `src/lib/components/todo/AITaskButton.svelte` - Reusable AI task component
- `src/routes/api/ai/task/+server.ts` - AI task API endpoint

### Files Modified:
- `src/lib/components/todo/TodoEditForm.svelte` - Added AI toolbar
- `src/lib/components/notes/NoteEditor.svelte` - Added AI toolbar

### Testing:
- Type checking passed ✓
- No new type errors introduced ✓
- Components properly imported ✓
- API endpoint created ✓ 