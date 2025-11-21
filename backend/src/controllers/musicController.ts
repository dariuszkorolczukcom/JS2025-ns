import { Request, Response } from 'express';
import { pool } from '../config/database';
import { MusicDTO } from '../models/music';

// Get all music entries
const getAllMusic = async (req: Request, res: Response) => {
    try {
        const result = await pool.query<MusicDTO>('SELECT id, title, artist, album, year, genre_slug as genre, created_at FROM music ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch music', message: error.message });
    }
};

// Get music by ID
const getMusicById = async (req: Request, res: Response) => {
    try {
        const musicId = req.params.id;
        const result = await pool.query<MusicDTO>('SELECT id, title, artist, album, year, genre_slug as genre, created_at FROM music WHERE id = $1', [musicId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Music entry not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch music entry', message: error.message });
    }
};

// Create new music entry
const createMusic = async (req: Request, res: Response) => {
    try {
        const { title, artist, album, year, genre } = req.body;
        
        // Validation
        if (!title || !artist) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['title', 'artist']
            });
        }

        // Ensure genre exists
        const genreSlug = genre ? genre.toLowerCase().replace(/\s+/g, '-') : 'unknown';
        const genreName = genre || 'Unknown';
        
        await pool.query(
            'INSERT INTO genres (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
            [genreSlug, genreName]
        );
        
        const result = await pool.query<MusicDTO>(
            `INSERT INTO music (title, artist, album, year, genre_slug) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, title, artist, album, year, genre_slug as genre, created_at`,
            [title, artist, album || title, year || null, genreSlug]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create music entry', message: error.message });
    }
};

export default {
    getAllMusic,
    getMusicById,
    createMusic
};
