import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';


export const checkPermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if user is authenticated
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = req.user.id;
            const userRole = req.user.role;

            if (userRole === 'ADMIN') {
                return next();
            }

            const query = `
                SELECT 1 
                FROM (
                    SELECT permission_name FROM user_permissions WHERE user_id = $1
                    UNION
                    SELECT permission_name FROM role_permissions WHERE role = $2::user_role
                ) as combined_permissions
                WHERE permission_name = $3
            `;

            const result = await pool.query(query, [userId, userRole, requiredPermission]);

            if (result.rows.length > 0) {
                return next();
            }

            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });

        } catch (error: any) {
            console.error('Permission check error:', error);
            return res.status(500).json({ error: 'Internal server error during permission check' });
        }
    };
};

