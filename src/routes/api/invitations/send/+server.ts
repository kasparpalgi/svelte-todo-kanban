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

/** Escape user-supplied values before interpolating them into HTML. */
function escapeHtml(value: string): string {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

async function getEmailTemplate(
	inviterName: string,
	boardName: string,
	invitationUrl: string,
	inviteeEmail: string,
	locale: string = 'et'
): Promise<EmailTemplate> {
	const translations = await loadTranslations(locale);

	const inviter = inviterName || getTranslation(translations, 'email.someone', 'Someone');

	const subject =
		getTranslation(
			translations,
			'email.invitation_subject',
			"You've been invited to collaborate in tasks' management in the project"
		) +
		' ' +
		boardName;

	const greeting = getTranslation(translations, 'email.greeting', 'Hi there!');

	const inviteText = getTranslation(
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
		'Create your account & join the board'
	);

	const stepsTitle = getTranslation(translations, 'email.steps_title', 'How to join:');

	const emailNoticeTitle = getTranslation(
		translations,
		'email.email_notice_title',
		'Use this email address'
	);
	const emailNoticeText = getTranslation(
		translations,
		'email.email_notice_text',
		'Your invitation is tied to this address. Create your account (or sign in) with it — using a different email means the invitation will not be found.'
	);

	const step1 = getTranslation(
		translations,
		'email.step_1',
		'Click the button below — it takes you straight to account creation with your email already filled in.'
	);
	const step2 = getTranslation(
		translations,
		'email.step_2',
		'Set a password, or continue with Google using the same email address.'
	);
	const step3 = getTranslation(
		translations,
		'email.step_3',
		"That's it — the invitation is accepted automatically and you land right on the board."
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

	const safeBoard = escapeHtml(boardName);
	const safeInviter = escapeHtml(inviter);
	const safeEmail = escapeHtml(inviteeEmail);
	const safeUrl = escapeHtml(invitationUrl);

	// Table-based, inline-styled layout for maximum email-client compatibility.
	const html = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light only">
	<title>${safeBoard}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f2f6;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f2f6;padding:24px 0;">
		<tr>
			<td align="center">
				<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(20,20,40,0.08);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
					<!-- Header -->
					<tr>
						<td style="background:linear-gradient(135deg,#241b4a 0%,#312a5c 55%,#4a4276 100%);padding:32px 32px;text-align:center;">
							<img src="https://todzz.eu/pwa-192x192.png" alt="ToDzz" width="44" height="44" style="width:44px;height:44px;border-radius:10px;vertical-align:middle;" />
							<span style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;vertical-align:middle;margin-left:10px;">ToDzz</span>
						</td>
					</tr>
					<!-- Body -->
					<tr>
						<td style="padding:32px 32px 8px 32px;color:#1f2233;">
							<p style="margin:0 0 8px 0;font-size:15px;color:#6b7280;">${greeting}</p>
							<h1 style="margin:0 0 16px 0;font-size:23px;line-height:1.3;color:#1f2233;">
								${safeInviter} ${inviteText}
							</h1>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
								<tr>
									<td style="background-color:#f5f4fb;border-left:4px solid #4a4276;border-radius:8px;padding:14px 18px;">
										<span style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;">${escapeHtml(getTranslation(translations, 'email.board_label', 'Board'))}</span><br>
										<span style="font-size:19px;font-weight:700;color:#241b4a;">${safeBoard}</span>
									</td>
								</tr>
							</table>
							<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4b5065;">${description}</p>

							<!-- Email notice -->
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
								<tr>
									<td style="background-color:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:16px 18px;">
										<p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#9a3412;">⚠️ ${emailNoticeTitle}</p>
										<p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:#7c2d12;">${emailNoticeText}</p>
										<p style="margin:0;font-size:15px;font-weight:700;color:#1f2233;background-color:#ffffff;border:1px solid #fed7aa;border-radius:6px;padding:8px 12px;display:inline-block;">${safeEmail}</p>
									</td>
								</tr>
							</table>

							<!-- Steps -->
							<p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#1f2233;text-transform:uppercase;letter-spacing:0.6px;">${stepsTitle}</p>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
								<tr>
									<td width="30" valign="top" style="padding:0 10px 14px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#241b4a;color:#ffffff;border-radius:50%;font-size:13px;font-weight:700;">1</span></td>
									<td valign="top" style="padding:0 0 14px 0;font-size:15px;line-height:1.5;color:#4b5065;">${step1}</td>
								</tr>
								<tr>
									<td width="30" valign="top" style="padding:0 10px 14px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#241b4a;color:#ffffff;border-radius:50%;font-size:13px;font-weight:700;">2</span></td>
									<td valign="top" style="padding:0 0 14px 0;font-size:15px;line-height:1.5;color:#4b5065;">${step2}</td>
								</tr>
								<tr>
									<td width="30" valign="top" style="padding:0 10px 0 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#16a34a;color:#ffffff;border-radius:50%;font-size:13px;font-weight:700;">3</span></td>
									<td valign="top" style="font-size:15px;line-height:1.5;color:#4b5065;">${step3}</td>
								</tr>
							</table>

							<!-- CTA -->
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;">
								<tr>
									<td align="center">
										<a href="${safeUrl}" style="display:inline-block;padding:14px 34px;background-color:#241b4a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">${buttonText}</a>
									</td>
								</tr>
							</table>
							<p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">${escapeHtml(getTranslation(translations, 'email.link_fallback', 'Button not working? Copy and paste this link:'))}<br><a href="${safeUrl}" style="color:#4a4276;word-break:break-all;">${safeUrl}</a></p>

							<p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">${expiryNotice}</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding:20px 32px 28px 32px;border-top:1px solid #ececf2;text-align:center;">
							<p style="margin:0;font-size:13px;line-height:1.5;color:#9ca3af;">${footerText} <a href="mailto:support@todzz.eu" style="color:#4a4276;">support@todzz.eu</a></p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;

	const text = `${greeting}

${inviter} ${inviteText}

${getTranslation(translations, 'email.board_label', 'Board')}: "${boardName}"

${description}

${emailNoticeTitle}
${emailNoticeText}
${inviteeEmail}

${stepsTitle}
1. ${step1}
2. ${step2}
3. ${step3}

${buttonText}:
${invitationUrl}

${expiryNotice}

---
${footerText} support@todzz.eu`;

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
			inviteeEmail,
			locale
		);

		console.log('EMAIL_FROM: ', EMAIL_FROM);

		const mailResponse = await transporter.sendMail({
			from: EMAIL_FROM,
			to: inviteeEmail,
			subject,
			text,
			html
		});

		console.log('resp: ', mailResponse);

		return json({ success: true });
	} catch (error) {
		console.error('[EMAIL] Failed to send invitation email:', error);
		return json({ error: 'Failed to send invitation email' }, { status: 500 });
	}
};
