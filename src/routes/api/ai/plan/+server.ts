/** @file src/routes/api/ai/plan/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PLAN_THRESHOLD = 300;
const PLANNED_MARKER = '<!-- planned -->';

function htmlToText(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const POST: RequestHandler = async ({ request }) => {
	const { content, title, model = 'gpt-5-mini' } = await request.json();

	if (!content || typeof content !== 'string') {
		return json({ error: 'content is required' }, { status: 400 });
	}

	if (!OPENAI_API_KEY) {
		return json({ error: 'AI service not configured' }, { status: 500 });
	}

	// Idempotency guard — never plan twice
	if (content.includes(PLANNED_MARKER)) {
		return json({ changed: false, content });
	}

	const plainText = htmlToText(content);

	// Length gate — short cards don't need planning
	if (plainText.length < PLAN_THRESHOLD) {
		return json({ changed: false, content });
	}

	const titleContext = title ? `Task title: "${title}"\n\n` : '';
	const prompt = `${titleContext}The following is a raw voice note. Extract a clear, actionable task description from it.

IMPORTANT: Keep the SAME LANGUAGE as the voice note. Do NOT translate.

Voice note:
"""
${plainText}
"""

Return ONLY the task description formatted with HTML tags (<p>, <strong>, <ul>, <li>, <h2>, <h3>). No markdown. No explanation. No meta-commentary about what you did.`;

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				max_completion_tokens: 2000
			})
		});

		if (!response.ok) {
			console.error('Plan API: OpenAI error', await response.text());
			return json({ error: 'AI service error' }, { status: 500 });
		}

		const data = await response.json();
		const structuredHtml = data.choices[0]?.message?.content?.trim() || '';

		if (!structuredHtml) {
			return json({ changed: false, content });
		}

		const rawNoteHtml = `<h2>Raw voice note</h2><p>${plainText}</p>`;
		const plannedContent = `${PLANNED_MARKER}\n${structuredHtml}\n${rawNoteHtml}`;

		return json({ changed: true, content: plannedContent });
	} catch (error) {
		console.error('Plan API error:', error);
		return json({ error: 'AI service temporarily unavailable' }, { status: 500 });
	}
};
