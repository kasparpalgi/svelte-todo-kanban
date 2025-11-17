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

CRITICAL RULES:
1. "Makse saaja" (Payment recipient) is the SELLER/VENDOR who ISSUED the invoice and will RECEIVE the payment.
   This is NOT the buyer/customer. Look for the company/person who is selling and will be paid.

2. "Arve kuupäev" (Invoice date) is THE DATE THE INVOICE WAS ISSUED. This is usually near the top of the invoice.
   Look for: "Kuupäev:", "Arve kuupäev:", "Date:", or any date near the invoice number.
   This is DIFFERENT from due date (maksetähtaeg) or payment date.

3. DO NOT extract payment date from invoices - leave it as null. Payment dates come from bank statements.

Extract the following information from the invoice text below. Return ONLY a valid JSON object:

{
  "vendor_name": "string | null",  // Makse saaja - The SELLER/VENDOR who issued the invoice
  "invoice_number": "string | null",  // Arve number / Invoice number / Arve nr
  "invoice_date": "YYYY-MM-DD | null",  // Arve kuupäev - WHEN THE INVOICE WAS ISSUED (usually at top)
  "total_amount": number | null,  // Arve summa / Total amount / Kokku (as number, e.g., 123.45)
  "amount_without_vat": number | null,  // Summa ilma km-ta / Amount without VAT
  "payment_date": null,  // Always null for invoices (comes from bank statements)
  "confidence": "high" | "medium" | "low"
}

CRITICAL - Finding invoice date:
- Look at the TOP of the invoice for the issue date
- Common locations: near invoice number, near vendor info, labeled "Kuupäev:" or "Date:"
- This is NOT the due date (maksetähtaeg), NOT the delivery date
- Format: Convert to YYYY-MM-DD (e.g., "15.01.2025" → "2025-01-15")

Rules:
- vendor_name: SELLER who issued invoice (e.g., "OÜ Lonitseera"), NOT buyer
- invoice_number: Any invoice reference number (may contain letters/slashes)
- invoice_date: Issue date from TOP of invoice (NOT due date, NOT payment date)
- total_amount: Final amount to pay (with VAT if applicable), as NUMBER without €
- amount_without_vat: Amount before VAT (if shown), as NUMBER
- payment_date: ALWAYS null for invoices
- confidence: "high" if all main fields clear, "medium" if some missing, "low" if uncertain

Estonian terms:
- Müüja/Teenusepakkuja/Makse saaja = Seller (extract this as vendor_name)
- Ostja/Saaja/Klient = Buyer (IGNORE - do not use for vendor_name)
- Arve nr/number = Invoice number
- Kuupäev/Arve kuupäev = Invoice issue date (IMPORTANT - find this!)
- Kokku/Summa/Tasuda = Total amount
- Ilma käibemaksuta/ilma km-ta = Without VAT
- Maksetähtaeg = Due date (NOT invoice date - ignore this)

Example:
ARVE / INVOICE
Kuupäev: 15.01.2025
Arve nr: 12345

Müüja: OÜ Example Company
Ostja: Eesti Kirjanduse Selts

Kokku: 500.00 EUR

Should extract:
vendor_name: "OÜ Example Company"
invoice_number: "12345"
invoice_date: "2025-01-15"
total_amount: 500.00
payment_date: null

Invoice text:
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
