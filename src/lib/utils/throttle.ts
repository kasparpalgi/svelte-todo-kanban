/**
 * Throttles a function to run at most once per specified interval
 * @param func - The function to throttle
 * @param limit - The minimum time interval between function calls in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean = false;
	let lastResult: ReturnType<T>;

	return function (this: any, ...args: Parameters<T>): void {
		if (!inThrottle) {
			lastResult = func.apply(this, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}
