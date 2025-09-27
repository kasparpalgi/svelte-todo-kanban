/** @file src/lib/utils/usdToEur.ts */

async function getCurrentExchangeRate(): Promise<number> {
	try {
		const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data.rates.EUR;
	} catch (error) {
		console.error('Failed to fetch exchange rate from Frankfurter: ', error);
		try {
			const backupResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
			if (backupResponse.ok) {
				const backupData = await backupResponse.json();
				return backupData.rates.EUR;
			}
		} catch (backupError) {
			console.error('Backup exchange rate API also failed:', backupError);
		}

		return 0.8592;
	}
}

let cachedRate = 0.8592;
let lastFetched = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12hrs

export async function getCachedExchangeRate(): Promise<number> {
	const now = Date.now();

	if (now - lastFetched > CACHE_DURATION) {
		const newRate = await getCurrentExchangeRate();
		if (newRate && newRate > 0) {
			cachedRate = newRate;
			lastFetched = now;
			console.log(`Exchange rate updated: 1 USD = ${cachedRate} EUR`);
		}
	}

	return cachedRate;
}

export async function convertUsdToEur(usdAmount: number): Promise<number> {
	const rate = await getCachedExchangeRate();
	return usdAmount * rate;
}

export async function refreshExchangeRate(): Promise<number> {
	lastFetched = 0;
	return await getCachedExchangeRate();
}
