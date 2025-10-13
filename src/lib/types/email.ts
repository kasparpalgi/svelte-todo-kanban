export interface EmailTemplate {
	html: string;
	text: string;
	subject: string;
}

export interface InvitationEmailData {
	inviteeEmail: string;
	boardName: string;
	inviterName: string;
	invitationUrl: string;
	locale?: string;
}
