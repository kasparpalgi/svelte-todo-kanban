/** @file src/lib/server/log.ts */
/**
 * `loggingStore` is browser-only — `log()` returns early when `!browser`, so every call
 * from a `+server.ts` was a silent no-op and endpoint failures left no trace anywhere.
 * This writes to stdout/stderr instead, where `docker logs` / CapRover can see it.
 */

type Level = 'info' | 'warn' | 'error';

function safe(data: unknown): string {
	try {
		return JSON.stringify(data);
	} catch {
		return String(data);
	}
}

function emit(level: Level, component: string, message: string, data?: unknown) {
	const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
	const line = `[${new Date().toISOString()}] ${level.toUpperCase()} [${component}] ${message}`;
	if (data === undefined) out(line);
	else out(line, safe(data));
}

export const serverLog = {
	info: (component: string, message: string, data?: unknown) =>
		emit('info', component, message, data),
	warn: (component: string, message: string, data?: unknown) =>
		emit('warn', component, message, data),
	error: (component: string, message: string, data?: unknown) =>
		emit('error', component, message, data)
};
