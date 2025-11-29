import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Review } from '../models/review';

// Get all reviews
const getAllReviews = async (req: Request, res: Response) => {
    try {
        const result = await pool.query<Review>('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
    }
};

// Get review by ID
const getReviewById = async (req: Request, res: Response) => {
    try {
        const reviewId = req.params.id;
        const result = await pool.query<Review>('SELECT * FROM reviews WHERE id = $1', [reviewId]);
        
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
        const { userId, musicId, rating, title, comment } = req.body;
        
        // Validation
        if (!userId || !musicId || rating === undefined) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['userId', 'musicId', 'rating']
            });
        }
        
        // Validate rating range
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: 'Rating must be a number between 1 and 5' 
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
        
        const result = await pool.query<Review>(
            `INSERT INTO reviews (user_id, music_id, rating, title, comment) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, musicId, rating, title || null, comment || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create review', message: error.message });
    }
};

// Update review
const updateReview = async (req: Request, res: Response) => {
    try {
        const reviewId = req.params.id;
        const { rating, title, comment } = req.body;
        
        // Check if review exists
        const reviewCheck = await pool.query('SELECT id FROM reviews WHERE id = $1', [reviewId]);
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        // Validation - at least one field must be provided
        if (rating === undefined && title === undefined && comment === undefined) {
            return res.status(400).json({ 
                error: 'At least one field must be provided for update',
                updatable: ['rating', 'title', 'comment']
            });
        }
        
        // Validate rating range if provided
        if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
            return res.status(400).json({ 
                error: 'Rating must be a number between 1 and 5' 
            });
        }
        
        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (rating !== undefined) {
            updates.push(`rating = $${paramIndex++}`);
            values.push(rating);
        }
        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title || null);
        }
        if (comment !== undefined) {
            updates.push(`comment = $${paramIndex++}`);
            values.push(comment || null);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(reviewId);
        
        const result = await pool.query<Review>(
            `UPDATE reviews 
            SET ${updates.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING *`,
            values
        );
        
        res.json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update review', message: error.message });
    }
};

// Delete review
const deleteReview = async (req: Request, res: Response) => {
    try {
        const reviewId = req.params.id;
        
        // Check if review exists
        const reviewCheck = await pool.query('SELECT id FROM reviews WHERE id = $1', [reviewId]);
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        // Delete review
        await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
        
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete review', message: error.message });
    }
};

export default {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
};
