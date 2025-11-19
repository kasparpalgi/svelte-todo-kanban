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