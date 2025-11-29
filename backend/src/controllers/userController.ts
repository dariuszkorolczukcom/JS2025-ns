import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { UserDTO, UserRole } from '../models/user';

// Get all users
const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query<UserDTO>('SELECT id, email, username, first_name, last_name, role, created_at FROM users');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
};

// Get user by ID
const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const result = await pool.query<UserDTO>('SELECT id, email, username, first_name, last_name, role, created_at FROM users WHERE id = $1', [userId]);
        
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
        const result = await pool.query<UserDTO>(
            `INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, true) 
            RETURNING id, email, username, first_name, last_name, role, created_at`,
            [email, username, hashedPassword, first_name || null, last_name || null, (role as UserRole)?.toUpperCase() || 'USER'] 
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
};

// Update user
const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const { username, first_name, last_name, email, role, is_active, phone } = req.body;
        
        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Validation - at least one field must be provided
        if (!username && !email && first_name === undefined && last_name === undefined && role === undefined && is_active === undefined && phone === undefined) {
            return res.status(400).json({ 
                error: 'At least one field must be provided for update',
                updatable: ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'phone']
            });
        }
        
        // Check if email or username already exists (if being updated)
        if (email || username) {
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
                [email || '', username || '', userId]
            );
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ error: 'User with this email or username already exists' });
            }
        }
        
        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (username !== undefined) {
            updates.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (first_name !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(first_name || null);
        }
        if (last_name !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(last_name || null);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone || null);
        }
        if (role !== undefined) {
            updates.push(`role = $${paramIndex++}`);
            values.push((role as UserRole)?.toUpperCase() || 'USER');
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(userId);
        
        const result = await pool.query<UserDTO>(
            `UPDATE users 
            SET ${updates.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING id, email, username, first_name, last_name, role, created_at`,
            values
        );
        
        res.json(result.rows[0]);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user', message: error.message });
    }
};

// Delete user
const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        
        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Delete user (CASCADE will handle related records)
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user', message: error.message });
    }
};

export default {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
