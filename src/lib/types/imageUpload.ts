export type TodoImage = {
	id: string;
	file: File | null;
	preview: string;
	isExisting?: boolean;
	isUploading?: boolean;
};
