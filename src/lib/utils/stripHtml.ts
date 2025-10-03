/** @file src/lib/utils/stripHtml.ts - Strips HTML tags & returns plain text & adds spacing between elements */
export function stripHtml(html: string): string {
	if (!html) return '';

	let text = html
		.replace(/<\/p>/gi, '. ')
		.replace(/<\/div>/gi, '. ')
		.replace(/<\/h[1-6]>/gi, '. ')
		.replace(/<\/li>/gi, '. ')
		.replace(/<br\s*\/?>/gi, '. ');

	text = text.replace(/<[^>]*>/g, '');

	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	text = text
		.replace(/\.\s*\.\s*/g, '. ')
		.replace(/\s+/g, ' ')
		.replace(/^\.\s*/, '')
		.trim();

	return text;
}
