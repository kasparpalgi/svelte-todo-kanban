/** @file src/lib/utils/linkifyText.ts */
export function linkifyText(text: string): string {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	return text.replace(urlRegex, (url) => {
		return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${url}</a>`;
	});
}
