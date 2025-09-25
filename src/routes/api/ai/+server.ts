/** @file src/routes/api/ai/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	console.log('start AI');
	try {
		const { text, type = 'correct' } = await request.json();

		if (!text || typeof text !== 'string') {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		if (!OPENAI_API_KEY) {
			return json({ error: 'AI service not configured' }, { status: 500 });
		}

		const prompt =
			type === 'correct'
				? `Fix grammar, punctuation, and spelling in this voice-to-text transcription. Keep the original meaning and tone. Only return the corrected text, nothing else:

"${text}"`
				: `Improve this voice-to-text transcription by fixing grammar, adding proper punctuation, and making it more readable while keeping the original meaning:

"${text}"`;

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-5-mini',
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				max_completion_tokens: 500
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI API error:', error);
			return json({ error: 'AI service error' }, { status: 500 });
		}

		const data = await response.json();
		const correctedText = data.choices[0]?.message?.content?.trim() || text;

		console.log(correctedText);

		return json({
			original: text,
			corrected: correctedText,
			changed: correctedText !== text,
			success: true
		});
	} catch (error) {
		console.error('AI API error:', error);
		return json({ error: 'AI service temporarily unavailable' }, { status: 500 });
	}
};
