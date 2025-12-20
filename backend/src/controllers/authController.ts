import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserWithPassword, UserDTO } from '../models/user';


export const loginUser = async (req:any, res:any) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query<UserWithPassword>('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const permissions = await pool.query('SELECT permission_name FROM user_permissions WHERE user_id = $1', [user.rows[0].id]);

        const payload = {
            user: {
                id: user.rows[0].id,
                role: user.rows[0].role,
                username: user.rows[0].username,
                permissions: permissions.rows.map((permission: any) => permission.permission_name)
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
};

export const profile = async (req: Request, res: Response) => {
    res.json(req.user);
}

/**
 * Aktualizacja profilu zalogowanego użytkownika
 * 
 * @param req Request z danymi: username, email, first_name, last_name (opcjonalne)
 * @param res Response z zaktualizowanym użytkownikiem lub błędem
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username, email, first_name, last_name } = req.body;

        // Validation - at least one field must be provided
        if (!username && !email && first_name === undefined && last_name === undefined) {
            return res.status(400).json({ 
                error: 'At least one field must be provided for update',
                updatable: ['username', 'email', 'first_name', 'last_name']
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

        updates.push(`updated_at = NOW()`);
        values.push(userId);

        const result = await pool.query<UserDTO>(
            `UPDATE users 
            SET ${updates.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING id, email, username, first_name, last_name, role, created_at`,
            values
        );

        // Get updated permissions for response
        const permissions = await pool.query(
            'SELECT permission_name FROM user_permissions WHERE user_id = $1',
            [userId]
        );

        const updatedUser = {
            ...result.rows[0],
            permissions: permissions.rows.map((permission: any) => permission.permission_name)
        };

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }
};

/**
 * Zmiana hasła zalogowanego użytkownika
 * 
 * @param req Request z danymi: oldPassword, newPassword
 * @param res Response z komunikatem sukcesu lub błędem
 */
export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { oldPassword, newPassword } = req.body;

        // Validation
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['oldPassword', 'newPassword']
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long' 
            });
        }

        // Get current user with password
        const user = await pool.query<UserWithPassword>(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Check if new password is different from old
        const isSamePassword = await bcrypt.compare(newPassword, user.rows[0].password_hash);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password', message: error.message });
    }
};

/**
 * Rejestracja nowego użytkownika
 * 
 * @param req Request z danymi: email, password, username, first_name, last_name (opcjonalne)
 * @param res Response z utworzonym użytkownikiem lub błędem
 */
export const registerUser = async (req: Request, res: Response) => {
    const { email, password, username, first_name, last_name } = req.body;

    try {
        // Walidacja wymaganych pól
        if (!email || !password || !username) {
            return res.status(400).json({ 
                msg: 'Missing required fields',
                required: ['email', 'password', 'username']
            });
        }

        // Walidacja formatu email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email format' });
        }

        // Walidacja długości hasła
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
        }

        // Sprawdzenie czy użytkownik już istnieje
        const userExists = await pool.query<UserWithPassword>(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(409).json({ msg: 'User with this email or username already exists' });
        }

        // Hashowanie hasła
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Utworzenie nowego użytkownika
        const result = await pool.query<UserDTO>(
            `INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, true) 
            RETURNING id, email, username, first_name, last_name, role, created_at`,
            [email, username, passwordHash, first_name || null, last_name || null, 'USER']
        );

        const newUser = result.rows[0];

        // Automatyczne logowanie po rejestracji - generowanie tokenu JWT
        const permissions = await pool.query(
            'SELECT permission_name FROM user_permissions WHERE user_id = $1',
            [newUser.id]
        );

        const payload = {
            user: {
                id: newUser.id,
                role: newUser.role,
                username: newUser.username,
                permissions: permissions.rows.map((permission: any) => permission.permission_name)
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT signing error:', err);
                    return res.status(500).json({ msg: 'Failed to generate token' });
                }
                
                res.status(201).json({
                    token,
                    user: newUser
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', (err as Error).message);
        res.status(500).json({ msg: 'Server error during registration' });
    }
};