export interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	start(): void;
	stop(): void;
	onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
	onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
	onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
	onend: ((this: SpeechRecognition, ev: Event) => any) | null;
	onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
	onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
	onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
	onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

export interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message?: string;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	readonly length: number;
	readonly isFinal: boolean;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
	readonly transcript: string;
	readonly confidence: number;
}
