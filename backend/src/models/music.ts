export interface Genre {
    slug: string;
    name: string;
    created_at: Date;
}

export interface Artist {
    id: string;
    name: string;
    created_at: Date;
}

export interface Music {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    year: number | null;
    genre_slug: string;
    created_at: Date;
}

export interface MusicDTO extends Music {
    genre: string; // mapped from genre_slug
}

