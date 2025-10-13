/** @file src/routes/api/invitations/send/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	EMAIL_SERVER_HOST,
	EMAIL_SERVER_PORT,
	EMAIL_SERVER_USER,
	EMAIL_SERVER_PASSWORD,
	EMAIL_FROM
} from '$env/static/private';
import nodemailer from 'nodemailer';
import type { EmailTemplate, InvitationEmailData } from '$lib/types/email';

async function loadTranslations(locale: string) {
	try {
		const translations = await import(`../../../../lib/locales/${locale}/common.json`);
		return translations.default || translations;
	} catch (error) {
		console.error(`[EMAIL] Failed to load translations for locale: ${locale}`, error);
		const fallback = await import(`../../../../lib/locales/et/common.json`);
		return fallback.default || fallback;
	}
}

function getTranslation(translations: any, key: string, fallback: string): string {
	const keys = key.split('.');
	let value: any = translations;

	for (const k of keys) {
		value = value?.[k];
		if (value === undefined) break;
	}

	const result = value || fallback;
	return result;
}

async function getEmailTemplate(
	inviterName: string,
	boardName: string,
	invitationUrl: string,
	locale: string = 'et'
): Promise<EmailTemplate> {
	const translations = await loadTranslations(locale);

	const subject =
		getTranslation(
			translations,
			'email.invitation_subject',
			"You've been invited to collaborate in tasks' management in the project"
		) +
		' ' +
		boardName;

	const greeting = getTranslation(translations, 'email.greeting', 'Hi there!');

	const inviteText =
		'<strong>' +
		(inviterName || 'Someone') +
		'</strong> ' +
		getTranslation(
			translations,
			'email.invite_text',
			'has invited you to see, manage and create new tasks. Comment existing tasks, see the work progress, report software bugs and much more.'
		);

	const description = getTranslation(
		translations,
		'email.description',
		'ToDzz is a collaborative task management tool that helps teams stay organised and productive. All the communication and materials related to a certain issue are under a single task (or card in Kanban board) and for developers it is also synced with GitHub issues.'
	);

	const buttonText = getTranslation(
		translations,
		'email.button_text',
		'Sign up and as you login, you can accept the invitation'
	);

	const expiryNotice = getTranslation(
		translations,
		'email.expiry_notice',
		"This invitation will expire in 7 days. If you don't want to accept this invitation, you can safely just delete this email."
	);

	const footerText = getTranslation(
		translations,
		'email.footer_text',
		'This email was sent from ToDzz.eu and if you have any questions, please contact'
	);

	const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            background: linear-gradient(135deg, oklch(0.184 0.056 286) 0%, oklch(0.24 0.048 286) 50%, oklch(0.35 0.042 286) 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .logo-image {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            vertical-align: middle;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .content h2 {
            color: oklch(0.184 0.056 286);
            margin: 0 0 20px 0;
        }
        .content p {
            color: #333;
            margin: 0 0 16px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: oklch(0.184 0.056 286);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background: oklch(0.24 0.048 286);
        }
        .board-name {
            font-weight: 700;
            color: oklch(0.184 0.056 286);
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
        <h1>
            <img src="https://todzz.eu/pwa-192x192.png" alt="ToDzz" class="logo-image" />
            ToDzz
        </h1>
    </div>
    <div class="content">
        <h2>Board Invitation</h2>
        <p>${greeting}</p>
        <p><strong>${inviterName || 'Someone'}</strong> ${inviteText.replace(/<\/?strong>/g, '')}</p>
        <p class="board-name">"${boardName}"</p>
        <p>${description}</p>
        <center>
            <a href="${invitationUrl}" class="button">${buttonText}</a>
        </center>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            ${expiryNotice}
        </p>
    </div>
    <div class="footer">
        <p>${footerText} <a href="mailto:support@todzz.eu">support@todzz.eu</a></p>
    </div>
</body>
</html>
    `;

	const inviteTextPlain = inviteText.replace(/<[^>]*>/g, '');

	const text = `
${greeting}

"${boardName}"

${inviteTextPlain}

${description}

${buttonText}:
${invitationUrl}

${expiryNotice}

---
${footerText} support@todzz.eu
    `;

	return { html, text, subject };
}

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		console.error('[EMAIL] Unauthorized: No session');
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const body: InvitationEmailData = await request.json();
		const { inviteeEmail, boardName, inviterName, invitationUrl } = body;
		const locale = body.locale || cookies.get('locale') || 'et';

		if (!inviteeEmail || !boardName || !invitationUrl) {
			console.log('[EMAIL] Missing required fields');
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

		const { subject, html, text } = await getEmailTemplate(
			inviterName,
			boardName,
			invitationUrl,
			locale
		);

		const mailResponse = await transporter.sendMail({
			from: EMAIL_FROM,
			to: inviteeEmail,
			subject,
			text,
			html
		});

		return json({ success: true });
	} catch (error) {
		console.error('[EMAIL] Failed to send invitation email:', error);
		return json({ error: 'Failed to send invitation email' }, { status: 500 });
	}
};
