import { Request, Response } from 'express';
import { pool } from '../config/database';

export const index = async (req: Request, res: Response) => {
    var endpoints:any = {
        auth: '/api/auth',
        music: '/api/music',
    }
    if (req.user && req.user.permissions && req.user.permissions.includes('users:read')) {
        endpoints['users'] = '/api/users';
    }
    if (req.user && req.user.permissions && req.user.permissions.includes('reviews:read')) {
        endpoints['reviews'] = '/api/reviews';
    }
    var data = { 
        message: 'MusicWeb API is running',
        version: '1.0.0',
        endpoints: endpoints
    }
    res.json(data);
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Check database connection
        const dbResult = await pool.query('SELECT NOW() as current_time');
        const dbStatus = dbResult.rows.length > 0 ? 'connected' : 'disconnected';
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                responseTime: 'ok'
            },
            uptime: process.uptime()
        });
    } catch (error: any) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: {
                status: 'disconnected',
                error: error.message
            }
        });
    }
}