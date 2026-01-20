export interface Note {
    id: string;
    title: string;
    content: string;
    folder?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
