/** @file src/routes/api/ai/task/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { aiModels } from '$lib/settings/aiModels';
import { calculateCost } from '$lib/utils/aiCostUtils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();

	try {
		const { task, title, content, model = 'gpt-5-mini' } = await request.json();

		if (!task || typeof task !== 'string') {
			return json({ error: 'Task is required' }, { status: 400 });
		}

		if (!OPENAI_API_KEY) {
			return json({ error: 'AI service not configured' }, { status: 500 });
		}

		const validModels = aiModels.map((m) => m.value);
		const selectedModel = validModels.includes(model) ? model : 'gpt-5-mini';

		// Build context for AI
		let contextInfo = '';
		if (title) {
			contextInfo += `\n\nDocument/Card Title: "${title}"`;
		}
		if (content) {
			// Strip HTML tags for cleaner context
			const cleanContent = content.replace(/<[^>]*>/g, '').trim();
			const contentPreview =
				cleanContent.length > 1000 ? cleanContent.slice(0, 1000) + '...' : cleanContent;
			contextInfo += `\n\nCurrent Content:\n${contentPreview}`;
		}

		const prompt = `You are an AI assistant helping a user with their task/note. The user has given you the following task:

"${task}"
${contextInfo}

Please complete this task thoughtfully. If it involves research or external information, clearly state that you're providing suggestions based on your knowledge (not live internet access). Your response should be helpful, well-formatted, and ready to be inserted into the document.`;

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
				max_completion_tokens: 2000
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI API error:', error);
			return json({ error: 'AI service error' }, { status: 500 });
		}

		const data = await response.json();

		// Debug logging to understand response structure
		console.log('OpenAI response structure:', {
			hasChoices: !!data.choices,
			choicesLength: data.choices?.length,
			firstChoice: data.choices?.[0],
			message: data.choices?.[0]?.message,
			content: data.choices?.[0]?.message?.content,
			contentType: typeof data.choices?.[0]?.message?.content,
			contentLength: data.choices?.[0]?.message?.content?.length
		});

		const result = data.choices[0]?.message?.content?.trim() || '';
		const processingTime = Date.now() - startTime;
		const inputTokens = data.usage?.prompt_tokens || 0;
		const outputTokens = data.usage?.completion_tokens || 0;
		const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens || 0;

		const cost = await calculateCost(selectedModel, inputTokens, outputTokens, cachedTokens);

		// Log if result is empty to help with debugging
		if (!result) {
			console.error('AI task returned empty result', {
				task,
				model: selectedModel,
				fullResponse: JSON.stringify(data, null, 2)
			});
		}

		return json({
			task,
			result,
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
		console.error('AI task API error:', error);
		return json(
			{
				error: 'AI service temporarily unavailable',
				processingTime: Date.now() - startTime
			},
			{ status: 500 }
		);
	}
};
