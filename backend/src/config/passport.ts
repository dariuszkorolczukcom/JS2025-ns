import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { pool } from './database';
import passport from 'passport';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        const query = 'SELECT id, role, email, username, first_name, last_name, phone FROM users WHERE id = $1'; 
        try {
            const user = await pool.query(query, [jwt_payload.user.id]);
            if (user.rows.length > 0) {
                return done(null, user.rows[0]);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    })
);
export const isAuthenticated = passport.authenticate('jwt', { session: false });

export default passport;
