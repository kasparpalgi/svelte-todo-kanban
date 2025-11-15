/** @file src/routes/api/ai/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { aiModels } from '$lib/settings/aiModels';
import { calculateCost } from '$lib/utils/aiCostUtils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();

	try {
		const { text, type = 'correct', model = 'gpt-5-mini', context } = await request.json();

		if (!text || typeof text !== 'string') {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		if (!OPENAI_API_KEY) {
			return json({ error: 'AI service not configured' }, { status: 500 });
		}

		const validModels = aiModels.map((m) => m.value);
		const selectedModel = validModels.includes(model) ? model : 'gpt-5-mini';

		let prompt = '';
		if (type === 'correct') {
			prompt = `Fix grammar, punctuation, and spelling in this voice-to-text transcription. Keep the original meaning and tone. Only return the corrected text, nothing else`;
			if (context) {
				prompt += `. ${context}`;
			}
			prompt += `:\n\n"${text}"`;
		} else if (type === 'summarize') {
			prompt = `You are a helpful assistant that creates concise summaries of web page content. Read the following web page content and provide a clear, informative summary in 2-3 sentences. Focus on the main topic and key points. Only return the summary, nothing else.\n\nWeb page content:\n\n"${text}"`;
		} else {
			prompt = `Improve this voice-to-text transcription by fixing grammar, adding proper punctuation, and making it more readable while keeping the original meaning`;
			if (context) {
				prompt += `. ${context}`;
			}
			prompt += `:\n\n"${text}"`;
		}

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: selectedModel,
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
		const processingTime = Date.now() - startTime;
		const inputTokens = data.usage?.prompt_tokens || 0;
		const outputTokens = data.usage?.completion_tokens || 0;
		const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens || 0;

		const cost = await calculateCost(selectedModel, inputTokens, outputTokens, cachedTokens);

		return json({
			original: text,
			corrected: correctedText,
			changed: correctedText !== text,
			model: selectedModel,
			processingTime,
			cost,
			tokens: {
				input: inputTokens,
				output: outputTokens,
				cached: cachedTokens,
				total: inputTokens + outputTokens
			},
			success: true
		});
	} catch (error) {
		console.error('AI API error:', error);
		return json(
			{
				error: 'AI service temporarily unavailable',
				processingTime: Date.now() - startTime
			},
			{ status: 500 }
		);
	}
};
