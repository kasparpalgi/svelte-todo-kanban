/** @file src/lib/utils/aiCostUtils.ts */
import { modelPricing } from '$lib/settings/aiModels';
import { convertUsdToEur } from '$lib/utils/usdToEur';

export async function calculateCost(
	model: string,
	inputTokens: number,
	outputTokens: number,
	cachedTokens: number = 0
): Promise<string> {
	const pricing = modelPricing[model as keyof typeof modelPricing];
	if (!pricing) return '0.000';

	const regularInputTokens = Math.max(0, inputTokens - cachedTokens);
	let costUSD = regularInputTokens * pricing.input + outputTokens * pricing.output;

	if (cachedTokens > 0) {
		costUSD += cachedTokens * pricing.cachedInput;
	}

	const costEUR = await convertUsdToEur(costUSD);

	if (costEUR >= 0.001) {
		return costEUR.toFixed(3);
	} else if (costEUR >= 0.000001) {
		return costEUR.toFixed(6);
	} else {
		return costEUR.toFixed(9);
	}
}

