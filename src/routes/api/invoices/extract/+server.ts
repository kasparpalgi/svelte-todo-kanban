/** @file src/routes/api/invoices/extract/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { PDFParse } from 'pdf-parse';
import type { RequestHandler } from './$types';

interface InvoiceData {
	vendor_name: string | null; // Makse saaja
	invoice_number: string | null; // Arve number
	invoice_date: string | null; // Arve kuupäev (YYYY-MM-DD)
	total_amount: number | null; // Arve summa
	amount_without_vat: number | null; // Summa ilma km-ta
	payment_date: string | null; // Tasumise kuupäev (YYYY-MM-DD) - from payment slip
	confidence: 'high' | 'medium' | 'low';
	raw_text_preview: string; // First 500 chars of extracted text
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const startTime = Date.now();

	try {
		const session = await locals.auth();

		if (!session) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { pdfBase64, fileName } = await request.json();

		if (!pdfBase64) {
			return json({ error: 'PDF content is required' }, { status: 400 });
		}

		if (!OPENAI_API_KEY) {
			return json({ error: 'AI service not configured' }, { status: 500 });
		}

		// Convert base64 to buffer
		const pdfBuffer = Buffer.from(pdfBase64, 'base64');

		// Extract text from PDF
		console.log(`[InvoiceExtract] Extracting text from PDF: ${fileName}`);
		const parser = new PDFParse({ data: pdfBuffer });
		const pdfData = await parser.getText();
		const extractedText = pdfData.text;

		if (!extractedText || extractedText.trim().length < 10) {
			return json(
				{
					error:
						'Could not extract text from PDF. The file might be a scanned image or encrypted.',
					suggestion:
						'Try using a text-based PDF or ensure the PDF is not password protected.'
				},
				{ status: 400 }
			);
		}

		console.log(
			`[InvoiceExtract] Extracted ${extractedText.length} characters from PDF`
		);

		// Use OpenAI to extract structured data
		const prompt = `You are an expert at extracting structured data from invoices and payment slips, especially Estonian invoices.

Extract the following information from the invoice/payment slip text below. Return ONLY a valid JSON object with these exact fields (use null if information is not found):

{
  "vendor_name": "string | null",  // Makse saaja / Vendor / Recipient
  "invoice_number": "string | null",  // Arve number / Invoice number
  "invoice_date": "YYYY-MM-DD | null",  // Arve kuupäev / Invoice date
  "total_amount": number | null,  // Arve summa / Total amount (as a number, e.g., 123.45)
  "amount_without_vat": number | null,  // Summa ilma km-ta / Amount without VAT (optional)
  "payment_date": "YYYY-MM-DD | null",  // Tasumise kuupäev / Payment date (if this is a payment slip)
  "confidence": "high" | "medium" | "low"  // Your confidence in the extraction
}

Rules:
- Extract amounts as numbers (e.g., 123.45, not "123.45€")
- Convert dates to YYYY-MM-DD format
- Use null for missing fields
- Set confidence based on how clear the data is
- Look for Estonian terms: "Makse saaja", "Arve number", "Arve kuupäev", "Summa", "km" (VAT)
- Also look for English terms: "Invoice", "Total", "Amount", "Date", "Vendor"

Invoice/Payment slip text:
${extractedText.substring(0, 4000)}`;

		console.log(`[InvoiceExtract] Sending to OpenAI for extraction`);

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				response_format: { type: 'json_object' },
				max_completion_tokens: 500
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI API error:', error);
			return json({ error: 'AI service error' }, { status: 500 });
		}

		const data = await response.json();
		const extractedDataStr = data.choices[0]?.message?.content?.trim();

		if (!extractedDataStr) {
			return json({ error: 'No data extracted from AI' }, { status: 500 });
		}

		// Parse the JSON response
		let invoiceData: InvoiceData;
		try {
			invoiceData = JSON.parse(extractedDataStr);
		} catch (e) {
			console.error('Failed to parse AI response:', extractedDataStr);
			return json(
				{ error: 'Invalid response from AI service' },
				{ status: 500 }
			);
		}

		// Add raw text preview
		invoiceData.raw_text_preview = extractedText.substring(0, 500);

		const processingTime = Date.now() - startTime;

		console.log(
			`[InvoiceExtract] Successfully extracted data from ${fileName} in ${processingTime}ms`
		);

		return json({
			success: true,
			data: invoiceData,
			fileName,
			processingTime,
			textLength: extractedText.length
		});
	} catch (error: any) {
		console.error('Invoice extraction error:', error);

		return json(
			{
				error: 'Invoice extraction failed',
				details: error.message,
				processingTime: Date.now() - startTime
			},
			{ status: 500 }
		);
	}
};
