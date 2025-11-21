import { Request, Response } from 'express';

export const index = async (req: Request, res: Response) => {
    var endpoints = {
        users: '/api/users',
        music: '/api/music',
        reviews: '/api/reviews',
        auth: '/api/auth'
    }
    var data = { 
        message: 'MusicWeb API is running',
        version: '1.0.0',
        endpoints: endpoints
    }
    res.json(data);
}