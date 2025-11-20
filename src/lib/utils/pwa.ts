/** @file src/lib/utils/pwa.ts */

/**
 * PWA utility functions for detecting platform capabilities and installation status
 */

import { browser } from '$app/environment';

/**
 * Check if the app is running as an installed PWA
 */
export function isInstalledPWA(): boolean {
	if (!browser) return false;

	// Check if running in standalone mode
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone === true || // iOS
		document.referrer.includes('android-app://') // Android TWA
	);
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
	if (!browser) return false;

	const userAgent = window.navigator.userAgent.toLowerCase();
	return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Check if the device is Android
 */
export function isAndroid(): boolean {
	if (!browser) return false;

	const userAgent = window.navigator.userAgent.toLowerCase();
	return /android/.test(userAgent);
}

/**
 * Check if the browser is Safari
 */
export function isSafari(): boolean {
	if (!browser) return false;

	const userAgent = window.navigator.userAgent.toLowerCase();
	return /safari/.test(userAgent) && !/chrome/.test(userAgent);
}

/**
 * Check if PWA installation is supported (beforeinstallprompt available)
 */
export function isInstallPromptSupported(): boolean {
	if (!browser) return false;

	// Chromium-based browsers support beforeinstallprompt
	return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}

/**
 * Check if the user has dismissed the install prompt
 */
export function hasUserDismissedInstall(): boolean {
	if (!browser) return false;

	const dismissed = localStorage.getItem('pwa-install-dismissed');
	if (!dismissed) return false;

	// Check if dismissed more than 7 days ago
	const dismissedDate = new Date(dismissed);
	const daysSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

	return daysSinceDismissal < 7;
}

/**
 * Mark the install prompt as dismissed
 */
export function dismissInstallPrompt(): void {
	if (!browser) return;

	localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
	if (!browser) return false;

	return 'serviceWorker' in navigator;
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
	if (!browser) return true;

	return navigator.onLine;
}

/**
 * Get the platform name for display purposes
 */
export function getPlatformName(): string {
	if (isIOS()) return 'iOS';
	if (isAndroid()) return 'Android';
	return 'Desktop';
}
