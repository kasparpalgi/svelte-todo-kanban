/** @file src/routes/api/invitations/send/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM } from '$env/static/private';
import { PUBLIC_APP_ENV } from '$env/static/public';
import nodemailer from 'nodemailer';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { inviteeEmail, boardName, inviterName, invitationUrl } = await request.json();

		if (!inviteeEmail || !boardName || !invitationUrl) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const transporter = nodemailer.createTransport({
			host: EMAIL_SERVER_HOST,
			port: Number(EMAIL_SERVER_PORT),
			auth: {
				user: EMAIL_SERVER_USER,
				pass: EMAIL_SERVER_PASSWORD
			}
		});

		const subject = `You've been invited to join "${boardName}" on ToDzz`;
		const html = `
<!DOCTYPE html>
<html>
<head>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 30px;
			border-radius: 10px 10px 0 0;
			text-align: center;
		}
		.header h1 {
			margin: 0;
			font-size: 28px;
		}
		.content {
			background: #f9fafb;
			padding: 30px;
			border-radius: 0 0 10px 10px;
		}
		.button {
			display: inline-block;
			padding: 12px 30px;
			background: #667eea;
			color: white !important;
			text-decoration: none;
			border-radius: 6px;
			font-weight: 600;
			margin: 20px 0;
		}
		.button:hover {
			background: #764ba2;
		}
		.board-name {
			font-weight: 700;
			color: #667eea;
		}
		.footer {
			margin-top: 30px;
			text-align: center;
			color: #6b7280;
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>🎯 ToDzz</h1>
	</div>
	<div class="content">
		<h2>Board Invitation</h2>
		<p>Hi there!</p>
		<p>${inviterName || 'Someone'} has invited you to collaborate on the board <span class="board-name">"${boardName}"</span> on ToDzz.</p>
		<p>ToDzz is a collaborative task management tool that helps teams stay organized and productive.</p>
		<center>
			<a href="${invitationUrl}" class="button">Accept Invitation & Sign Up</a>
		</center>
		<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
			This invitation will expire in 7 days. If you don't want to accept this invitation, you can safely ignore this email.
		</p>
	</div>
	<div class="footer">
		<p>This email was sent from ToDzz. If you have any questions, please contact support.</p>
	</div>
</body>
</html>
		`;

		const text = `
${inviterName || 'Someone'} has invited you to collaborate on the board "${boardName}" on ToDzz.

ToDzz is a collaborative task management tool that helps teams stay organized and productive.

Click the link below to accept the invitation and sign up:
${invitationUrl}

This invitation will expire in 7 days. If you don't want to accept this invitation, you can safely ignore this email.
		`;

		// Send email
		await transporter.sendMail({
			from: EMAIL_FROM,
			to: inviteeEmail,
			subject,
			text,
			html
		});

		return json({ success: true });
	} catch (error) {
		console.error('Failed to send invitation email:', error);
		return json({ error: 'Failed to send invitation email' }, { status: 500 });
	}
};
