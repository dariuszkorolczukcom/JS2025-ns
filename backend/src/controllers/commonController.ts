import { Request, Response } from 'express';

export const index = async (req: Request, res: Response) => {
    var endpoints:any = {
        auth: '/api/auth',
        music: '/api/music',
    }
    if (req.user && req.user.permissions.includes('users:read')) {
        endpoints['users'] = '/api/users';
    }
    if (req.user && req.user.permissions.includes('reviews:read')) {
        endpoints['reviews'] = '/api/reviews';
    }
    var data = { 
        message: 'MusicWeb API is running',
        version: '1.0.0',
        endpoints: endpoints
    }
    res.json(data);
}