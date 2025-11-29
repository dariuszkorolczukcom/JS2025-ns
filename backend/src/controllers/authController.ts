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