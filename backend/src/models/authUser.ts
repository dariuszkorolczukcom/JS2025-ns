export interface AuthUser {
    id: string;
    role: string;
    username?: string;
    permissions: string[];
}
