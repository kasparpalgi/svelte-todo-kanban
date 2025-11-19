/** @file src/lib/utils/formatCost.ts */

/**
 * Format cost for display, showing cents for small amounts
 * @param cost - Cost as string (e.g., "0.000607")
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted cost string (e.g., "0.6 cent" or "€1.23")
 */
export function formatCost(cost: string | number, locale: string = 'en'): string {
	const numericCost = typeof cost === 'string' ? parseFloat(cost) : cost;

	if (isNaN(numericCost) || numericCost === 0) {
		return '€0';
	}

	// If less than 1 cent (0.01), show in cents
	if (numericCost < 0.01) {
		const cents = (numericCost * 100).toFixed(1);
		// Remove trailing .0
		const formattedCents = cents.endsWith('.0') ? cents.slice(0, -2) : cents;

		if (locale === 'et') {
			return `${formattedCents} sent`;
		}
		return `${formattedCents} cent`;
	}

	// If less than 1 euro, show in cents without decimal
	if (numericCost < 1) {
		const cents = Math.round(numericCost * 100);
		if (locale === 'et') {
			return `${cents} senti`;
		}
		return `${cents} cents`;
	}

	// Otherwise show in euros
	return `€${numericCost.toFixed(2)}`;
}
