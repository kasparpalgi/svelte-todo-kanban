/** @file src/routes/api/og-image/+server.ts */
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { chromium } from 'playwright';
import { uploadStreamToBackblaze } from '$lib/server/upload';
import { PUBLIC_APP_URL } from '$env/static/public';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

interface ScreenshotOptions {
	type: 'card' | 'board';
	username: string;
	boardAlias: string;
	cardAlias?: string;
	lang?: string;
}

/**
 * Generates a screenshot for OG image using Playwright
 */
async function generateScreenshot(options: ScreenshotOptions): Promise<Buffer> {
	const { type, username, boardAlias, cardAlias, lang = 'en' } = options;

	// Build the URL to screenshot
	let url = `${PUBLIC_APP_URL}/${lang}/${username}/${boardAlias}`;
	if (type === 'card' && cardAlias) {
		url += `?card=${cardAlias}`;
	}

	const browser = await chromium.launch({
		headless: true
	});

	try {
		const context = await browser.newContext({
			viewport: {
				width: OG_IMAGE_WIDTH,
				height: OG_IMAGE_HEIGHT
			},
			deviceScaleFactor: 1
		});

		const page = await context.newPage();

		// Navigate to the page
		await page.goto(url, {
			waitUntil: 'networkidle',
			timeout: 30000
		});

		let screenshot: Buffer;

		if (type === 'card') {
			// Wait for card modal to appear
			await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

			// Take screenshot of the card modal only
			const modalElement = await page.$('[role="dialog"]');
			if (!modalElement) {
				throw new Error('Card modal not found');
			}

			screenshot = (await modalElement.screenshot({
				type: 'png'
			})) as Buffer;
		} else {
			// Take screenshot of the board
			// Wait for board to load
			await page.waitForSelector('[data-board-container]', { timeout: 10000 });

			const boardElement = await page.$('[data-board-container]');
			if (!boardElement) {
				throw new Error('Board container not found');
			}

			screenshot = (await boardElement.screenshot({
				type: 'png'
			})) as Buffer;
		}

		await context.close();
		return screenshot;
	} finally {
		await browser.close();
	}
}

/**
 * POST endpoint to generate OG image screenshot
 */
export async function POST({ request, locals }: RequestEvent) {
	try {
		// Verify authentication
		const session = await locals.auth();
		if (!session) {
			throw error(401, 'Not authenticated');
		}

		const body = await request.json();
		const { type, username, boardAlias, cardAlias, lang } = body as ScreenshotOptions;

		// Validate input
		if (!type || !username || !boardAlias) {
			throw error(400, 'Missing required parameters');
		}

		if (type === 'card' && !cardAlias) {
			throw error(400, 'Card alias required for card screenshots');
		}

		// Generate screenshot
		const screenshotBuffer = await generateScreenshot({
			type,
			username,
			boardAlias,
			cardAlias,
			lang
		});

		// Create a File object from the buffer
		const fileName = `og-${type}-${boardAlias}${cardAlias ? `-${cardAlias}` : ''}-${Date.now()}.png`;
		const file = new File([screenshotBuffer], fileName, { type: 'image/png' });

		// Upload to Backblaze
		const uploadResult = await uploadStreamToBackblaze(file);

		if (!uploadResult.success) {
			throw error(500, 'Failed to upload screenshot');
		}

		return json({
			success: true,
			url: uploadResult.url
		});
	} catch (err) {
		console.error('OG image generation error:', err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
}

/**
 * GET endpoint to retrieve OG image URL (checks for existing or generates new)
 */
export async function GET({ url }: RequestEvent) {
	const type = url.searchParams.get('type') as 'card' | 'board' | null;
	const username = url.searchParams.get('username');
	const boardAlias = url.searchParams.get('boardAlias');
	const cardAlias = url.searchParams.get('cardAlias');
	const lang = url.searchParams.get('lang') || 'en';

	if (!type || !username || !boardAlias) {
		throw error(400, 'Missing required parameters');
	}

	if (type === 'card' && !cardAlias) {
		throw error(400, 'Card alias required for card screenshots');
	}

	// For now, we'll generate on-demand
	// In production, you'd want to check a cache/database first
	try {
		const screenshotBuffer = await generateScreenshot({
			type,
			username,
			boardAlias,
			cardAlias,
			lang
		});

		// Return the image directly
		return new Response(screenshotBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
			}
		});
	} catch (err) {
		console.error('OG image generation error:', err);
		throw error(500, 'Failed to generate OG image');
	}
}
