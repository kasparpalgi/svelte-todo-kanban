/** @file src/routes/api/transcribe-podcast/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB Groq limit

/**
 * Check if a command is available in the system
 */
async function commandExists(command: string): Promise<boolean> {
	try {
		await execAsync(`${command} --version`);
		return true;
	} catch {
		return false;
	}
}

/**
 * Extract the first MP3 URL from an RSS feed string
 */
function extractMp3FromRss(rssText: string): string | null {
	const mp3Regex = /https?:\/\/[^"'\s]+\.(?:mp3|m4a|wav)(?:\?[^"'\s]*)?/gi;
	const match = rssText.match(mp3Regex);
	return match ? match[0] : null;
}

export const POST: RequestHandler = async ({ request, fetch: svelteFetch }) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'transcribe-'));
	const chunks: string[] = [];

	try {
		const { audioUrl: inputUrl, groqApiKey } = await request.json();

		if (!inputUrl) {
			return json({ error: 'audioUrl is required' }, { status: 400 });
		}
		if (!groqApiKey) {
			return json({ error: 'groqApiKey is required' }, { status: 400 });
		}

		let audioUrl = inputUrl;

		// 1. Basic URL validation
		try {
			new URL(audioUrl);
		} catch {
			return json({ error: `Invalid URL: ${audioUrl.substring(0, 100)}...` }, { status: 400 });
		}

		// 2. Check if it's an RSS feed or needs yt-dlp
		const isDirectAudio = /\.(mp3|m4a|wav|aac|ogg|flac)(\?|$)/i.test(audioUrl);
		const hasYtDlp = await commandExists('yt-dlp');

		if (!isDirectAudio) {
			if (hasYtDlp) {
				try {
					console.log('[transcribe-podcast] Using yt-dlp to get direct URL for:', audioUrl);
					const { stdout } = await execAsync(`yt-dlp -g -f "bestaudio[ext=mp3]/bestaudio" "${audioUrl}"`);
					audioUrl = stdout.trim();
				} catch (e) {
					console.warn('[transcribe-podcast] yt-dlp failed, falling back to RSS check:', e);
				}
			}

			// If still not clearly direct audio, try to check if it's an RSS feed
			if (!/\.(mp3|m4a|wav|aac|ogg|flac)(\?|$)/i.test(audioUrl)) {
				const res = await svelteFetch(audioUrl);
				if (res.ok) {
					const contentType = res.headers.get('content-type') || '';
					if (contentType.includes('xml') || contentType.includes('rss')) {
						const text = await res.text();
						const extracted = extractMp3FromRss(text);
						if (extracted) {
							console.log('[transcribe-podcast] Extracted MP3 from RSS:', extracted);
							audioUrl = extracted;
						}
					}
				}
			}
		}

		// 3. Download the audio file
		console.log('[transcribe-podcast] Fetching audio from:', audioUrl);
		const audioRes = await svelteFetch(audioUrl);
		if (!audioRes.ok) {
			return json({ error: `Failed to fetch audio: ${audioRes.statusText}` }, { status: 400 });
		}

		const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
		const totalSize = audioBuffer.byteLength;
		console.log('[transcribe-podcast] Downloaded audio size:', Math.round(totalSize / 1024 / 1024), 'MB');

		// 4. Determine file extension
		let ext = 'mp3';
		try {
			const urlPath = new URL(audioUrl).pathname;
			ext = urlPath.split('.').pop()?.toLowerCase() || 'mp3';
			if (!['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac'].includes(ext)) ext = 'mp3';
		} catch {
			ext = 'mp3';
		}

		const audioPath = path.join(tempDir, `original.${ext}`);
		await fs.writeFile(audioPath, audioBuffer);

		// 5. Split if too large or just use as is
		const hasFfmpeg = await commandExists('ffmpeg');
		if (totalSize > MAX_BYTES && hasFfmpeg) {
			console.log('[transcribe-podcast] Splitting large file with ffmpeg...');
			// Split into 10-minute chunks (600 seconds)
			// Using copy codec for speed
			await execAsync(`ffmpeg -i "${audioPath}" -f segment -segment_time 600 -c copy "${path.join(tempDir, 'chunk_%03d.' + ext)}"`);
			const files = await fs.readdir(tempDir);
			chunks.push(...files.filter(f => f.startsWith('chunk_')).sort().map(f => path.join(tempDir, f)));
		} else if (totalSize > MAX_BYTES) {
			// Fallback: simple byte splitting for MP3 (crude but might work)
			console.warn('[transcribe-podcast] No ffmpeg, using crude byte splitting for large file...');
			let offset = 0;
			let i = 0;
			while (offset < totalSize) {
				const end = Math.min(offset + MAX_BYTES - 1024, totalSize); // Leave some room
				const chunkPath = path.join(tempDir, `chunk_${String(i).padStart(3, '0')}.${ext}`);
				await fs.writeFile(chunkPath, audioBuffer.subarray(offset, end));
				chunks.push(chunkPath);
				offset = end;
				i++;
			}
		} else {
			chunks.push(audioPath);
		}

		// 6. Transcribe chunks with Groq
		console.log(`[transcribe-podcast] Transcribing ${chunks.length} chunks...`);
		const transcriptions: string[] = [];

		for (const chunkPath of chunks) {
			const chunkBuffer = await fs.readFile(chunkPath);
			const formData = new FormData();
			const filename = path.basename(chunkPath);
			formData.append('file', new Blob([new Uint8Array(chunkBuffer)], { type: `audio/${ext}` }), filename);
			formData.append('model', 'whisper-large-v3-turbo');
			formData.append('response_format', 'text');

			const groqRes = await svelteFetch('https://api.groq.com/openai/v1/audio/transcriptions', {
				method: 'POST',
				headers: { Authorization: `Bearer ${groqApiKey}` },
				body: formData
			});

			if (!groqRes.ok) {
				const errText = await groqRes.text();
				console.error('[transcribe-podcast] Groq error for chunk:', filename, errText);
				throw new Error('Groq transcription failed: ' + errText);
			}

			const text = await groqRes.text();
			transcriptions.push(text.trim());
		}

		const transcription_md = transcriptions.join('\n\n');
		return json({ transcription_md, success: true });

	} catch (e) {
		console.error('[transcribe-podcast] Error:', e);
		return json({ 
			error: e instanceof Error ? e.message : 'Transcription service error',
			details: e instanceof Error ? e.stack : undefined
		}, { status: 500 });
	} finally {
		// Cleanup temp files
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch (cleanupErr) {
			console.error('[transcribe-podcast] Cleanup error:', cleanupErr);
		}
	}
};
