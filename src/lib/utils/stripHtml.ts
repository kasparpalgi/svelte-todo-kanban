/** @file src/lib/utils/stripHtml.ts - Strips HTML tags & returns plain text */
export function stripHtml(html: string): string {
	if (!html) return '';

	let text = html.replace(/<[^>]*>/g, '');

	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	text = text.replace(/\s+/g, ' ').trim();

	return text;
}
