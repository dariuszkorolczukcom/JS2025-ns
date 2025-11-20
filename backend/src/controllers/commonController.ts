import { Request, Response } from 'express';

export const profile = async (req: Request, res: Response) => {
    res.json(req.user);
}