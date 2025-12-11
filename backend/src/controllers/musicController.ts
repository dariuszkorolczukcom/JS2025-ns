import { Request, Response } from 'express';
import { pool } from '../config/database';
import { MusicDTO } from '../models/music';

// Get all music entries
const getAllMusic = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const sortBy = (req.query.sortBy as string) || 'created_at';
        const sortOrder = (req.query.sortOrder as string) || 'desc';
        const search = req.query.search as string;
        const genre = req.query.genre as string;
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;

        // Validation for sort
        const validSortFields = ['title', 'artist', 'album', 'year', 'created_at'];
        const validSortOrders = ['asc', 'desc'];
        
        const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

        const whereConditions: string[] = [];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(title ILIKE $${paramIndex} OR artist ILIKE $${paramIndex} OR album ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (genre) {
            whereConditions.push(`genre_slug = $${paramIndex}`);
            queryParams.push(genre);
            paramIndex++;
        }

        if (year) {
            whereConditions.push(`year = $${paramIndex}`);
            queryParams.push(year);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM music ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        // Get data
        const dataQuery = `
            SELECT id, title, artist, album, year, genre_slug as genre, created_at 
            FROM music 
            ${whereClause} 
            ORDER BY ${safeSortBy} ${safeSortOrder} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const result = await pool.query<MusicDTO>(dataQuery, [...queryParams, limit, offset]);

        // Set pagination headers
        res.set('X-Total-Count', totalCount.toString());
        res.set('X-Total-Pages', totalPages.toString());
        res.set('X-Current-Page', page.toString());
        res.set('X-Per-Page', limit.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page');

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
        
        if (typeof title !== 'string' || typeof artist !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid field types',
                message: 'title and artist must be strings'
            });
        }
        
        if (year !== undefined && year !== null && (typeof year !== 'number' || year < 0 || year > new Date().getFullYear() + 1)) {
            return res.status(400).json({ 
                error: 'Invalid year',
                message: 'year must be a valid number'
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
            [title, artist, album || null, year || null, genreSlug]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create music entry', message: error.message });
    }
};

// Update music entry
const updateMusic = async (req: Request, res: Response) => {
    try {
        const musicId = req.params.id;
        const { title, artist, album, year, genre } = req.body;
        
        // Check if music entry exists
        const musicCheck = await pool.query('SELECT id FROM music WHERE id = $1', [musicId]);
        if (musicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Music entry not found' });
        }
        
        // Validation - at least one field must be provided
        if (!title && !artist && album === undefined && year === undefined && genre === undefined) {
            return res.status(400).json({ 
                error: 'At least one field must be provided for update',
                updatable: ['title', 'artist', 'album', 'year', 'genre']
            });
        }
        
        // Validate field types
        if (title !== undefined && typeof title !== 'string') {
            return res.status(400).json({ error: 'title must be a string' });
        }
        if (artist !== undefined && typeof artist !== 'string') {
            return res.status(400).json({ error: 'artist must be a string' });
        }
        if (year !== undefined && year !== null && (typeof year !== 'number' || year < 0 || year > new Date().getFullYear() + 1)) {
            return res.status(400).json({ error: 'year must be a valid number' });
        }
        
        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (artist !== undefined) {
            updates.push(`artist = $${paramIndex++}`);
            values.push(artist);
        }
        if (album !== undefined) {
            updates.push(`album = $${paramIndex++}`);
            values.push(album || null);
        }
        if (year !== undefined) {
            updates.push(`year = $${paramIndex++}`);
            values.push(year || null);
        }
        
        let genreSlug: string | undefined;
        if (genre !== undefined) {
            genreSlug = genre ? genre.toLowerCase().replace(/\s+/g, '-') : 'unknown';
            const genreName = genre || 'Unknown';
            
            // Ensure genre exists
            await pool.query(
                'INSERT INTO genres (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
                [genreSlug, genreName]
            );
            
            updates.push(`genre_slug = $${paramIndex++}`);
            values.push(genreSlug);
        }
        
        values.push(musicId);
        
        const result = await pool.query<MusicDTO>(
            `UPDATE music 
            SET ${updates.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING id, title, artist, album, year, genre_slug as genre, created_at`,
            values
        );
        
        res.json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update music entry', message: error.message });
    }
};

// Delete music entry
const deleteMusic = async (req: Request, res: Response) => {
    try {
        const musicId = req.params.id;
        
        // Check if music entry exists
        const musicCheck = await pool.query('SELECT id FROM music WHERE id = $1', [musicId]);
        if (musicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Music entry not found' });
        }
        
        // Delete music entry (CASCADE will handle related reviews)
        await pool.query('DELETE FROM music WHERE id = $1', [musicId]);
        
        res.status(200).json({ message: 'Music entry deleted successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete music entry', message: error.message });
    }
};

// Get all genres
const getGenres = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT slug, name FROM genres ORDER BY name ASC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch genres', message: error.message });
    }
};

export default {
    getAllMusic,
    getMusicById,
    createMusic,
    updateMusic,
    deleteMusic,
    getGenres
};
