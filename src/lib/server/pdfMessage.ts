/** @file src/lib/server/pdfMessage.ts
 * Chat Completions user message carrying a PDF as file input. OpenAI reads the PDF
 * itself (text and page images), so the server needs no PDF parser — pdf-parse
 * cannot run on Cloudflare Workers (no DOMMatrix, #218).
 */
export function pdfMessage(prompt: string, pdfBase64: string, fileName?: string) {
	return {
		role: 'user',
		content: [
			{
				type: 'file',
				file: {
					filename: fileName || 'document.pdf',
					file_data: `data:application/pdf;base64,${pdfBase64}`
				}
			},
			{ type: 'text', text: prompt }
		]
	};
}
