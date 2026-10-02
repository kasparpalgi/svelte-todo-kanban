/** @file src/lib/utils/splitwiseCsvParser.ts */

export interface SplitwiseExpense {
	date: string;
	description: string;
	category: string;
	cost: number;
	currency: string;
	splits: Map<string, number>; // userName -> amount (positive = owed, negative = owes)
}

export interface ParsedCsvData {
	expenses: SplitwiseExpense[];
	userNames: string[]; // All unique user names from CSV
}

/**
 * Parse Splitwise CSV format
 *
 * Format:
 * Date,Description,Category,Cost,Currency,User1,User2,User3,...
 * 2025-11-21,Lunch,General,43.00,EUR,-21.50,21.50,...
 *
 * Negative amounts = user owes money
 * Positive amounts = user is owed money
 */
export function parseSplitwiseCsv(csvText: string): ParsedCsvData {
	const lines = csvText.split('\n').filter(line => line.trim().length > 0);

	if (lines.length < 2) {
		throw new Error('CSV file is empty or invalid');
	}

	// Parse header
	const header = lines[0].split(',');
	if (header.length < 6) {
		throw new Error('Invalid CSV format: insufficient columns');
	}

	// First 5 columns are: Date, Description, Category, Cost, Currency
	// Rest are user names
	const userNames = header.slice(5).map(name => name.trim());

	if (userNames.length === 0) {
		throw new Error('No users found in CSV');
	}

	const expenses: SplitwiseExpense[] = [];

	// Parse each expense row (skip header)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();

		// Skip empty lines and total balance row
		if (!line || line.toLowerCase().includes('total balance')) {
			continue;
		}

		const columns = line.split(',');

		if (columns.length < 6) {
			continue; // Skip invalid rows
		}

		const date = columns[0].trim();
		const description = columns[1].trim();
		const category = columns[2].trim();
		const costStr = columns[3].trim();
		const currency = columns[4].trim();

		// Parse cost
		const cost = parseFloat(costStr);
		if (isNaN(cost) || cost <= 0) {
			continue; // Skip invalid expenses
		}

		// Parse user splits
		const splits = new Map<string, number>();
		for (let j = 0; j < userNames.length; j++) {
			const amountStr = columns[5 + j]?.trim();
			if (amountStr) {
				const amount = parseFloat(amountStr);
				if (!isNaN(amount) && Math.abs(amount) > 0.01) {
					splits.set(userNames[j], amount);
				}
			}
		}

		// Only add expenses with valid splits
		if (splits.size > 0) {
			expenses.push({
				date,
				description,
				category,
				cost,
				currency,
				splits
			});
		}
	}

	return {
		expenses,
		userNames
	};
}

