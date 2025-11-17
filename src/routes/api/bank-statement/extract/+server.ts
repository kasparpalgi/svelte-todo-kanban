/** @file src/routes/api/bank-statement/extract/+server.ts */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { PDFParse } from 'pdf-parse';
import type { RequestHandler } from './$types';

interface PaymentRecord {
	date: string; // YYYY-MM-DD
	vendor: string;
	amount: number;
	reference: string | null;
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
		console.log(`[BankStatementExtract] Extracting text from PDF: ${fileName}`);
		const parser = new PDFParse({ data: pdfBuffer });
		const pdfData = await parser.getText();
		const extractedText = pdfData.text;

		if (!extractedText || extractedText.trim().length < 10) {
			return json(
				{
					error: 'Could not extract text from bank statement PDF.'
				},
				{ status: 400 }
			);
		}

		console.log(
			`[BankStatementExtract] Extracted ${extractedText.length} characters from PDF`
		);

		// Use OpenAI to extract structured data
		const prompt = `You are an expert at extracting payment data from Estonian bank statements (KONTO VÄLJAVÕTE).

Extract ALL OUTGOING payments (negative amounts) from this bank statement. Return ONLY a valid JSON object:

{
  "payments": [
    {
      "date": "YYYY-MM-DD",  // Payment date (KUUPÄEV column)
      "vendor": "string",     // Recipient name (MAKSJA/SAAJA column - the company that received payment)
      "amount": number,       // Absolute value of payment (remove minus sign, e.g., -42.02 becomes 42.02)
      "reference": "string | null"  // Invoice reference if found in SELGITUS column
    }
  ]
}

CRITICAL RULES:
1. Extract ONLY OUTGOING payments (negative SUMMA values)
2. The vendor is from MAKSJA/SAAJA column - this is who RECEIVED the payment
3. Convert negative amounts to positive (e.g., -42.02 → 42.02)
4. Convert dates to YYYY-MM-DD format (e.g., 04.01.2025 → 2025-01-04)
5. Extract reference number from SELGITUS/VIITENUMBER if present
6. Ignore internal transfers, card payments (GOOGLE*, etc.)
7. Focus on business-to-business payments to Estonian companies

Estonian bank statement format:
- NR = Row number
- KUUPÄEV = Payment date
- MAKSJA/SAAJA = Payer/Recipient (vendor name for outgoing payments)
- SELGITUS / VIITENUMBER = Description / Reference number
- SUMMA = Amount (negative for outgoing payments)

Example bank statement line:
1215 04.01.2025 Enefit AS EE837700771009807601 765307025501 / 76508423728 1046365645 -42.02 6 209.62

Should extract:
{
  "date": "2025-01-04",
  "vendor": "Enefit AS",
  "amount": 42.02,
  "reference": "765307025501"
}

Bank statement text:
${extractedText.substring(0, 8000)}`;

		console.log(`[BankStatementExtract] Sending to OpenAI for extraction`);

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
				max_completion_tokens: 2000
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
		let paymentsData: { payments: PaymentRecord[] };
		try {
			paymentsData = JSON.parse(extractedDataStr);
		} catch (e) {
			console.error('Failed to parse AI response:', extractedDataStr);
			return json(
				{ error: 'Invalid response from AI service' },
				{ status: 500 }
			);
		}

		const processingTime = Date.now() - startTime;

		console.log(
			`[BankStatementExtract] Successfully extracted ${paymentsData.payments?.length || 0} payments from ${fileName} in ${processingTime}ms`
		);

		return json({
			success: true,
			payments: paymentsData.payments || [],
			fileName,
			processingTime,
			textLength: extractedText.length
		});
	} catch (error: any) {
		console.error('Bank statement extraction error:', error);

		return json(
			{
				error: 'Bank statement extraction failed',
				details: error.message,
				processingTime: Date.now() - startTime
			},
			{ status: 500 }
		);
	}
};
