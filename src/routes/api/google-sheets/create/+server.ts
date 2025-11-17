/** @file src/routes/api/google-sheets/create/+server.ts */
import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import type { RequestHandler } from './$types';

interface InvoiceRow {
	vendor_name: string;
	invoice_number: string;
	invoice_date: string;
	total_amount: number | string;
	amount_without_vat: number | string;
	payment_date: string;
	fileName: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session || !session.accessToken) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { invoices, title } = await request.json();

		if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
			return json({ error: 'Invoices array is required' }, { status: 400 });
		}

		// Initialize OAuth2 client with the access token
		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({
			access_token: session.accessToken
		});

		const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

		// Create spreadsheet title
		const spreadsheetTitle = title || `Invoices ${new Date().toISOString().split('T')[0]}`;

		console.log(`[GoogleSheets] Creating spreadsheet: ${spreadsheetTitle}`);

		// Create new spreadsheet
		const spreadsheet = await sheets.spreadsheets.create({
			requestBody: {
				properties: {
					title: spreadsheetTitle
				},
				sheets: [
					{
						properties: {
							title: 'Invoices',
							gridProperties: {
								frozenRowCount: 1 // Freeze header row
							}
						}
					}
				]
			}
		});

		const spreadsheetId = spreadsheet.data.spreadsheetId;

		if (!spreadsheetId) {
			return json({ error: 'Failed to create spreadsheet' }, { status: 500 });
		}

		console.log(`[GoogleSheets] Spreadsheet created: ${spreadsheetId}`);

		// Prepare header row
		const headers = [
			'Makse saaja',
			'Arve number',
			'Arve kuupäev',
			'Arve summa',
			'Summa ilma km-ta',
			'Tasumise kuupäev',
			'Faili nimi'
		];

		// Prepare data rows
		const rows: any[][] = [headers];

		for (const invoice of invoices as InvoiceRow[]) {
			rows.push([
				invoice.vendor_name || '',
				invoice.invoice_number || '',
				invoice.invoice_date || '',
				invoice.total_amount || '',
				invoice.amount_without_vat || '',
				invoice.payment_date || '',
				invoice.fileName || ''
			]);
		}

		// Write data to spreadsheet
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: 'Invoices!A1',
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: rows
			}
		});

		// Format the spreadsheet
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					// Make header row bold
					{
						repeatCell: {
							range: {
								sheetId: 0,
								startRowIndex: 0,
								endRowIndex: 1
							},
							cell: {
								userEnteredFormat: {
									textFormat: {
										bold: true
									},
									backgroundColor: {
										red: 0.9,
										green: 0.9,
										blue: 0.9
									}
								}
							},
							fields: 'userEnteredFormat(textFormat,backgroundColor)'
						}
					},
					// Auto-resize columns
					{
						autoResizeDimensions: {
							dimensions: {
								sheetId: 0,
								dimension: 'COLUMNS',
								startIndex: 0,
								endIndex: 7
							}
						}
					}
				]
			}
		});

		console.log(`[GoogleSheets] Data written and formatted`);

		const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

		return json({
			success: true,
			spreadsheetId,
			spreadsheetUrl,
			rowCount: invoices.length
		});
	} catch (error: any) {
		console.error('Google Sheets API error:', error);

		let errorMessage = 'Failed to create spreadsheet';
		let enableUrl = null;

		if (error.code === 401) {
			errorMessage = 'Google Sheets access token expired. Please sign in again.';
		} else if (error.code === 403 && error.message?.includes('Google Sheets API has not been used')) {
			// Extract project ID from error message
			const projectIdMatch = error.message.match(/project (\d+)/);
			const projectId = projectIdMatch ? projectIdMatch[1] : null;

			if (projectId) {
				enableUrl = `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=${projectId}`;
				errorMessage = 'Google Sheets API is not enabled for your project. Please enable it in Google Cloud Console.';
			} else {
				errorMessage = 'Google Sheets API is not enabled. Please enable it in your Google Cloud Console.';
			}
		} else if (error.message) {
			errorMessage = error.message;
		}

		return json({
			error: errorMessage,
			enableUrl
		}, { status: error.code || 500 });
	}
};
