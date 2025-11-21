import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

// Get all users
const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, email, username, first_name, last_name, role, created_at FROM users');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
};

// Get user by ID
const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const result = await pool.query('SELECT id, email, username, first_name, last_name, role, created_at FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch user', message: error.message });
    }
};

// Create new user
const createUser = async (req: Request, res: Response) => {
    try {
        const { username, first_name, last_name, email, password, role } = req.body;
        
        // Validation
        if (!email || !password || !username) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['username', 'email', 'password']
            });
        }
        
        // Check if user already exists
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const result = await pool.query(
            `INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, true) 
            RETURNING id, email, username, first_name, last_name, role, created_at`,
            [email, username, hashedPassword, first_name, last_name, role?.toUpperCase()] 
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
};

export default {
    getAllUsers,
    getUserById,
    createUser
};
