export function formatDuration(duration: number): string {
	if (duration < 1000) {
		return `${Math.round(duration)}ms`;
	} else if (duration < 60000) {
		return `${(duration / 1000).toFixed(1)}sec`;
	} else {
		return `${(duration / 60000).toFixed(1)}min`;
	}
}
