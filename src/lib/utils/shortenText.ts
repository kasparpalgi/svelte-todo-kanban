export function shortenText(text: string, maxLength: number = 50): string {
	if (text.length <= maxLength) {
		return text;
	}

	let truncated = text.slice(0, maxLength);

	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > 0) {
		truncated = truncated.slice(0, lastSpace);
	}

	return truncated + '...';
}
