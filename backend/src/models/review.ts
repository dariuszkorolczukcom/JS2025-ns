export interface Review {
    id: string;
    user_id: string;
    music_id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: Date;
    updated_at: Date;
}

