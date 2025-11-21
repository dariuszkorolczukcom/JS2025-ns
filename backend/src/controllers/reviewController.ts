import { Request, Response } from 'express';
import { pool } from '../config/database';

// Get all reviews
const getAllReviews = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
    }
};

// Get review by ID
const getReviewById = async (req: Request, res: Response) => {
    try {
        const reviewId = req.params.id;
        const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch review', message: error.message });
    }
};

// Create new review
const createReview = async (req: Request, res: Response) => {
    try {
        const { userId, musicId, rating, comment } = req.body;
        
        // Validation
        if (!userId || !musicId || !rating) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['userId', 'musicId', 'rating']
            });
        }
        
        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: 'Rating must be between 1 and 5' 
            });
        }
        
        // Check if user exists
        const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if music entry exists
        const musicExists = await pool.query('SELECT id FROM music WHERE id = $1', [musicId]);
        if (musicExists.rows.length === 0) {
            return res.status(404).json({ error: 'Music entry not found' });
        }
        
        const result = await pool.query(
            `INSERT INTO reviews (user_id, music_id, rating, comment) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [userId, musicId, rating, comment || '']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create review', message: error.message });
    }
};

export default {
    getAllReviews,
    getReviewById,
    createReview
};
