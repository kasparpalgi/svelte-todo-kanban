/** @file src/routes/api/transcribe-podcast/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB Groq limit

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { audioUrl, groqApiKey } = await request.json();

		if (!audioUrl) {
			return json({ error: 'audioUrl is required' }, { status: 400 });
		}
		if (!groqApiKey) {
			return json({ error: 'groqApiKey is required' }, { status: 400 });
		}

		// Download audio from URL
		const audioRes = await fetch(audioUrl);
		if (!audioRes.ok) {
			return json({ error: `Failed to fetch audio: ${audioRes.statusText}` }, { status: 400 });
		}

		const contentLength = Number(audioRes.headers.get('content-length') || '0');
		if (contentLength > MAX_BYTES) {
			return json(
				{ error: `Audio file too large (max 25 MB, got ${Math.round(contentLength / 1024 / 1024)} MB)` },
				{ status: 400 }
			);
		}

		const audioBuffer = await audioRes.arrayBuffer();
		if (audioBuffer.byteLength > MAX_BYTES) {
			return json(
				{ error: `Audio file too large (max 25 MB, got ${Math.round(audioBuffer.byteLength / 1024 / 1024)} MB)` },
				{ status: 400 }
			);
		}

		// Determine file extension from URL
		const urlPath = new URL(audioUrl).pathname;
		const ext = urlPath.split('.').pop()?.toLowerCase() || 'mp3';
		const filename = `podcast.${ext}`;

		const formData = new FormData();
		formData.append('file', new Blob([audioBuffer], { type: `audio/${ext}` }), filename);
		formData.append('model', 'whisper-large-v3-turbo');
		formData.append('response_format', 'text');

		const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
			method: 'POST',
			headers: { Authorization: `Bearer ${groqApiKey}` },
			body: formData
		});

		if (!groqRes.ok) {
			const errText = await groqRes.text();
			console.error('[transcribe-podcast] Groq error:', errText);
			return json({ error: 'Groq transcription failed: ' + errText }, { status: 500 });
		}

		const text = await groqRes.text();
		const transcription_md = text.trim();

		return json({ transcription_md, success: true });
	} catch (e) {
		console.error('[transcribe-podcast] Error:', e);
		return json({ error: 'Transcription service error' }, { status: 500 });
	}
};
