export interface LogEntry {
	id: string;
	timestamp: Date;
	level: 'debug' | 'info' | 'warn' | 'error';
	component: string;
	message: string;
	data?: any;
	userAgent?: string;
	url?: string;
}

export interface EncryptedData {
	encrypted: string;
	iv: string;
	authTag: string;
}