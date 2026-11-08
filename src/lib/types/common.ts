export interface LogEntry {
	id: string;
	timestamp: Date;
	level: 'debug' | 'info' | 'warn' | 'error';
	component: string;
	message: string;
	data?: any;
	userAgent?: string;
	url?: string;
	/** Failed attempts to save this entry to the `logs` table. */
	attempts?: number;
}

export interface EncryptedData {
	encrypted: string;
	iv: string;
	authTag: string;
}