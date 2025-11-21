import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserWithPassword } from '../models/user';


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