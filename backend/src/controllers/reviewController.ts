import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request, Response } from 'express';

const reviewsPath = path.join(__dirname, '../data/reviews.json');
const usersPath = path.join(__dirname, '../data/users.json');
const musicPath = path.join(__dirname, '../data/music.json');

// Helper function to read data from JSON file
const readReviews = () => {
    try {
        const data = fs.readFileSync(reviewsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const readUsers = () => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const readMusic = () => {
    try {
        const data = fs.readFileSync(musicPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper function to write data to JSON file
const writeReviews = (data: any) => {
    fs.writeFileSync(reviewsPath, JSON.stringify(data, null, 2));
};

// Get all reviews
const getAllReviews = (req: Request, res: Response) => {
    try {
        const reviews = readReviews();
        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
    }
};

// Get review by ID
const getReviewById = (req: Request, res: Response) => {
    try {
        const reviews = readReviews();
        const reviewId = parseInt(req.params.id);
        const review = reviews.find((r: any) => r.id === reviewId);
        
        if (!review) {
        return res.status(404).json({ error: 'Review not found' });
        }
        
        res.json(review);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch review', message: error.message });
    }
};

// Create new review
const createReview = (req: Request, res: Response) => {
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
        const users = readUsers();
        const user = users.find((u: any) => u.id === parseInt(userId));
        if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if music entry exists
        const music = readMusic();
        const musicEntry = music.find((m: any) => m.id === parseInt(musicId));
        if (!musicEntry) {
        return res.status(404).json({ error: 'Music entry not found' });
        }
        
        const reviews = readReviews();
        
        // Generate new ID
        const newId = reviews.length > 0 ? Math.max(...reviews.map((r: any) => r.id)) + 1 : 1;
        
        // Create new review
        const newReview = {
        id: newId,
        userId: parseInt(userId),
        musicId: parseInt(musicId),
        rating: parseInt(rating),
        comment: comment || '',
        createdAt: new Date().toISOString()
        };
        
        reviews.push(newReview);
        writeReviews(reviews);
        
        res.status(201).json(newReview);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create review', message: error.message });
    }
};

export default {
    getAllReviews,
    getReviewById,
    createReview
};
