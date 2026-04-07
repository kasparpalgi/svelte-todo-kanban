/** @file src/routes/api/transcribe-podcast/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';

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
	const stream = new ReadableStream({
		async start(controller) {
			const sendProgress = (data: object) => {
				controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + '\n'));
			};

			const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'transcribe-'));
			const chunks: string[] = [];

			try {
				const { audioUrl: inputUrl, groqApiKey, language = 'en' } = await request.json();

				if (!inputUrl || !groqApiKey) {
					sendProgress({ error: 'Missing audioUrl or groqApiKey' });
					controller.close();
					return;
				}

				let audioUrl = inputUrl;

				// 1. URL validation
				try {
					new URL(audioUrl);
				} catch {
					sendProgress({ error: 'Invalid URL' });
					controller.close();
					return;
				}

				sendProgress({ step: 'downloading' });

				// 2. RSS/yt-dlp logic
				const isDirectAudio = /\.(mp3|m4a|wav|aac|ogg|flac)(\?|$)/i.test(audioUrl);
				const hasYtDlp = await commandExists('yt-dlp');

				if (!isDirectAudio) {
					if (hasYtDlp) {
						try {
							const { stdout } = await execAsync(`yt-dlp -g -f "bestaudio[ext=mp3]/bestaudio" "${audioUrl}"`);
							audioUrl = stdout.trim();
						} catch (e) {
							console.warn('[transcribe-podcast] yt-dlp failed:', e);
						}
					}

					if (!/\.(mp3|m4a|wav|aac|ogg|flac)(\?|$)/i.test(audioUrl)) {
						const res = await svelteFetch(audioUrl);
						if (res.ok) {
							const contentType = res.headers.get('content-type') || '';
							if (contentType.includes('xml') || contentType.includes('rss')) {
								const text = await res.text();
								const extracted = extractMp3FromRss(text);
								if (extracted) audioUrl = extracted;
							}
						}
					}
				}

				// 3. Download
				const audioRes = await svelteFetch(audioUrl);
				if (!audioRes.ok) {
					sendProgress({ error: `Failed to fetch audio: ${audioRes.statusText}` });
					controller.close();
					return;
				}

				const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
				const totalSize = audioBuffer.byteLength;

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

				// 4. Split
				const ffmpegPath = ffmpegStatic || (await commandExists('ffmpeg') ? 'ffmpeg' : null);

				if (totalSize > MAX_BYTES && ffmpegPath) {
					sendProgress({ step: 'splitting' });
					await execAsync(`"${ffmpegPath}" -i "${audioPath}" -f segment -segment_time 600 -c copy "${path.join(tempDir, 'chunk_%03d.' + ext)}"`);
					const files = await fs.readdir(tempDir);
					chunks.push(...files.filter(f => f.startsWith('chunk_')).sort().map(f => path.join(tempDir, f)));
					sendProgress({ step: 'chunks_found', count: chunks.length });
				} else if (totalSize > MAX_BYTES) {
					sendProgress({ error: 'Audio too large and ffmpeg not available' });
					controller.close();
					return;
				} else {
					chunks.push(audioPath);
				}

				// 5. Transcribe
				const transcriptions: string[] = [];
				for (let i = 0; i < chunks.length; i++) {
					sendProgress({ step: 'transcribing', current: i + 1, total: chunks.length });
					const chunkPath = chunks[i];
					const chunkBuffer = await fs.readFile(chunkPath);
					const formData = new FormData();
					formData.append('file', new Blob([new Uint8Array(chunkBuffer)], { type: `audio/${ext}` }), path.basename(chunkPath));
					formData.append('model', 'whisper-large-v3-turbo');
					formData.append('response_format', 'text');
					if (language) formData.append('language', language);

					const groqRes = await svelteFetch('https://api.groq.com/openai/v1/audio/transcriptions', {
						method: 'POST',
						headers: { Authorization: `Bearer ${groqApiKey}` },
						body: formData
					});

					if (!groqRes.ok) throw new Error(await groqRes.text());
					const text = await groqRes.text();
					transcriptions.push(text.trim());
				}

				const rawTranscription = transcriptions.join('\n\n');

				// 6. Polish
				sendProgress({ step: 'polishing' });
				let transcription_md = rawTranscription;

				try {
					const chatRes = await svelteFetch('https://api.groq.com/openai/v1/chat/completions', {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${groqApiKey}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							model: 'llama-3.3-70b-versatile',
							messages: [
								{
									role: 'system',
									content: 'You are a professional editor. Your task is to take a raw podcast transcription, fix any spelling or grammar mistakes, and format it into clean, readable Markdown. Preserve the original meaning and structure. Use headings, bullet points, and bold text where appropriate to make it easy to read. Do not add any introductory or concluding remarks; just return the formatted transcript.'
								},
								{
									role: 'user',
									content: `Please clean up and format this podcast transcript:\n\n${rawTranscription}`
								}
							],
							temperature: 0.1,
							max_completion_tokens: 8000
						})
					});

					if (chatRes.ok) {
						const chatData = await chatRes.json();
						const processedText = chatData.choices[0]?.message?.content?.trim();
						if (processedText) transcription_md = processedText;
					}
				} catch (chatErr) {
					console.error('[transcribe-podcast] AI polishing failed:', chatErr);
				}

				sendProgress({ success: true, transcription_md });
				controller.close();

			} catch (e) {
				console.error('[transcribe-podcast] Error:', e);
				sendProgress({ error: e instanceof Error ? e.message : 'Transcription service error' });
				controller.close();
			} finally {
				try {
					await fs.rm(tempDir, { recursive: true, force: true });
				} catch (cleanupErr) {
					console.error('[transcribe-podcast] Cleanup error:', cleanupErr);
				}
			}
		}
	});

	return new Response(stream, {
		headers: { 'Content-Type': 'application/x-ndjson' }
	});
};
