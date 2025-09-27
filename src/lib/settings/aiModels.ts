/** @file src/lib/settings/aiModels.ts */
export const aiModels = [
	{ value: 'gpt-5', label: 'GPT 5' },
	{ value: 'gpt-5-mini', label: 'GPT 5 Mini' },
	{ value: 'gpt-5-nano', label: 'GPT 5 Nano' }
];

// Pricing per token calulated from per-million-token pricing (27/09/2025).
export const modelPricing = {
	'gpt-5': {
		input: 1.25 / 1_000_000, // $1.25 per mil
		cachedInput: 0.125 / 1_000_000,
		output: 10 / 1_000_000
	},
	'gpt-5-mini': {
		input: 0.25 / 1_000_000,
		cachedInput: 0.025 / 1_000_000,
		output: 2 / 1_000_000
	},
	'gpt-5-nano': {
		input: 0.05 / 1_000_000,
		cachedInput: 0.005 / 1_000_000,
		output: 0.4 / 1_000_000
	}
};