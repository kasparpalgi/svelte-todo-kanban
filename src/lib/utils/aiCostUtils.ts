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

export function calculateCostUSD(
	model: string,
	inputTokens: number,
	outputTokens: number,
	cachedTokens: number = 0
): string {
	const pricing = modelPricing[model as keyof typeof modelPricing];
	if (!pricing) return '0.000';

	const regularInputTokens = Math.max(0, inputTokens - cachedTokens);
	let costUSD = regularInputTokens * pricing.input + outputTokens * pricing.output;

	if (cachedTokens > 0) {
		costUSD += cachedTokens * pricing.cachedInput;
	}

	if (costUSD >= 0.001) {
		return costUSD.toFixed(3);
	} else if (costUSD >= 0.000001) {
		return costUSD.toFixed(6);
	} else {
		return costUSD.toFixed(9);
	}
}

export async function getCostBreakdown(
	model: string,
	inputTokens: number,
	outputTokens: number,
	cachedTokens: number = 0
) {
	const pricing = modelPricing[model as keyof typeof modelPricing];
	if (!pricing) {
		return {
			model,
			inputTokens: 0,
			outputTokens: 0,
			cachedTokens: 0,
			costs: {
				inputUSD: '0.000',
				outputUSD: '0.000',
				cachedUSD: '0.000',
				totalUSD: '0.000',
				totalEUR: '0.000'
			}
		};
	}

	const regularInputTokens = Math.max(0, inputTokens - cachedTokens);

	const inputCostUSD = regularInputTokens * pricing.input;
	const outputCostUSD = outputTokens * pricing.output;
	const cachedCostUSD = cachedTokens * pricing.cachedInput;
	const totalUSD = inputCostUSD + outputCostUSD + cachedCostUSD;

	const totalEUR = await convertUsdToEur(totalUSD);

	return {
		model,
		inputTokens: regularInputTokens,
		outputTokens,
		cachedTokens,
		costs: {
			inputUSD: inputCostUSD.toFixed(6),
			outputUSD: outputCostUSD.toFixed(6),
			cachedUSD: cachedCostUSD.toFixed(6),
			totalUSD: totalUSD.toFixed(6),
			totalEUR: totalEUR.toFixed(6)
		}
	};
}
