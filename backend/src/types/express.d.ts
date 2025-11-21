import { AuthUser } from '../models/authUser';

declare global {
    namespace Express {
        interface User extends AuthUser {}
    }
}

