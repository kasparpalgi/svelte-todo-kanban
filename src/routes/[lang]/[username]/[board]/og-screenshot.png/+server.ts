/** @file src/routes/[lang]/[username]/[board]/og-screenshot.png/+server.ts */
import { error, type RequestEvent } from '@sveltejs/kit';
import { chromium } from 'playwright';
import { PUBLIC_APP_URL } from '$env/static/public';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Generates a screenshot for OG image using Playwright
 */
async function generateScreenshot(options: {
	type: 'card' | 'board';
	username: string;
	boardAlias: string;
	cardAlias?: string;
	lang: string;
}): Promise<Buffer> {
	const { type, username, boardAlias, cardAlias, lang } = options;

	// Build the URL to screenshot
	let url = `${PUBLIC_APP_URL}/${lang}/${username}/${boardAlias}`;
	if (type === 'card' && cardAlias) {
		url += `?card=${cardAlias}`;
	}

	// Add a special query parameter to indicate we're generating OG image
	url += (url.includes('?') ? '&' : '?') + 'og-preview=true';

	const browser = await chromium.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	try {
		const context = await browser.newContext({
			viewport: {
				width: type === 'card' ? 1200 : OG_IMAGE_WIDTH,
				height: type === 'card' ? 1200 : OG_IMAGE_HEIGHT
			},
			deviceScaleFactor: 2 // Higher quality
		});

		const page = await context.newPage();

		// Navigate to the page with authentication token
		await page.goto(url, {
			waitUntil: 'networkidle',
			timeout: 30000
		});

		// Wait a bit for any animations to settle
		await page.waitForTimeout(500);

		let screenshot: Buffer;

		if (type === 'card') {
			// Wait for card modal to appear
			try {
				await page.waitForSelector('[data-card-modal]', { timeout: 10000 });

				// Take screenshot of the card modal only
				const modalElement = await page.$('[data-card-modal]');
				if (!modalElement) {
					throw new Error('Card modal not found');
				}

				const box = await modalElement.boundingBox();
				if (!box) {
					throw new Error('Card modal has no bounding box');
				}

				// Take screenshot of modal and resize to OG dimensions
				screenshot = (await modalElement.screenshot({
					type: 'png'
				})) as Buffer;

				// Close context and resize image
				await context.close();

				// For now, return as-is. In production, you'd want to resize to 1200x630
				return screenshot;
			} catch (err) {
				console.error('Failed to capture card modal, falling back to full page:', err);
				// Fallback to full page screenshot
				screenshot = (await page.screenshot({
					type: 'png',
					clip: {
						x: 0,
						y: 0,
						width: OG_IMAGE_WIDTH,
						height: OG_IMAGE_HEIGHT
					}
				})) as Buffer;
			}
		} else {
			// Take screenshot of the board
			try {
				await page.waitForSelector('[data-board-container]', { timeout: 10000 });

				const boardElement = await page.$('[data-board-container]');
				if (!boardElement) {
					throw new Error('Board container not found');
				}

				screenshot = (await page.screenshot({
					type: 'png',
					clip: {
						x: 0,
						y: 0,
						width: OG_IMAGE_WIDTH,
						height: OG_IMAGE_HEIGHT
					},
					fullPage: false
				})) as Buffer;
			} catch (err) {
				console.error('Failed to capture board, falling back to full page:', err);
				// Fallback to full page screenshot
				screenshot = (await page.screenshot({
					type: 'png',
					clip: {
						x: 0,
						y: 0,
						width: OG_IMAGE_WIDTH,
						height: OG_IMAGE_HEIGHT
					}
				})) as Buffer;
			}
		}

		await context.close();
		return screenshot;
	} finally {
		await browser.close();
	}
}

/**
 * GET endpoint to serve OG screenshot image
 */
export async function GET({ url, params }: RequestEvent) {
	const { username, board: boardAlias, lang } = params;
	const type = url.searchParams.get('type') as 'card' | 'board' | null;
	const cardAlias = url.searchParams.get('cardAlias');

	if (!type || !username || !boardAlias) {
		throw error(400, 'Missing required parameters');
	}

	if (type === 'card' && !cardAlias) {
		throw error(400, 'Card alias required for card screenshots');
	}

	try {
		const screenshotBuffer = await generateScreenshot({
			type,
			username,
			boardAlias,
			cardAlias: cardAlias || undefined,
			lang: lang || 'en'
		});

		// Return the image directly
		return new Response(screenshotBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=86400, s-maxage=2592000' // Cache for 24h (browsers), 30d (CDN)
			}
		});
	} catch (err) {
		console.error('OG image generation error:', err);
		throw error(500, 'Failed to generate OG image');
	}
}
