export interface UploadProps {
	images: TodoImage[];
	isDragOver: boolean;
	onDragOver: (event: DragEvent) => void;
	onDragLeave: (event: DragEvent) => void;
	onDrop: (event: DragEvent) => void;
	onFileSelect: (event: Event) => void;
	onRemoveImage: (imageId: string) => void;
	fileInput?: HTMLInputElement;
}

export type TodoImage = {
	id: string;
	file: File | null;
	preview: string;
	isExisting?: boolean;
	isUploading?: boolean;
};
