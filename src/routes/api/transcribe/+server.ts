/** @file src/routes/api/transcribe/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const audio = formData.get('audio') as File | null;
		const provider = (formData.get('provider') as string) || 'whisper';
		const groqApiKey = formData.get('groqApiKey') as string | null;

		if (!audio) {
			return json({ error: 'No audio file provided' }, { status: 400 });
		}

		let apiUrl: string;
		let apiKey: string;
		let model: string;

		if (provider === 'groq') {
			if (!groqApiKey) {
				return json({ error: 'Groq API key not configured' }, { status: 400 });
			}
			apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
			apiKey = groqApiKey;
			model = 'whisper-large-v3';
		} else {
			if (!OPENAI_API_KEY) {
				return json({ error: 'OpenAI API key not configured' }, { status: 500 });
			}
			apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
			apiKey = OPENAI_API_KEY;
			model = 'whisper-1';
		}

		const transcribeForm = new FormData();
		transcribeForm.append('file', audio, 'audio.webm');
		transcribeForm.append('model', model);
		transcribeForm.append('response_format', 'json');

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: { Authorization: `Bearer ${apiKey}` },
			body: transcribeForm
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('Transcription API error:', error);
			return json({ error: 'Transcription failed' }, { status: 500 });
		}

		const data = await response.json();
		return json({ text: data.text || '', success: true });
	} catch (error) {
		console.error('Transcribe API error:', error);
		return json({ error: 'Transcription service unavailable' }, { status: 500 });
	}
};
