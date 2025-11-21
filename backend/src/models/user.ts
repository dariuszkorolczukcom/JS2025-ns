export type UserRole = 'ADMIN' | 'EDITOR' | 'USER';

export interface User {
    id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    last_login_at: Date | null;
}

export interface UserWithPassword extends User {
    password_hash: string;
}

export interface UserDTO {
    id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: UserRole;
    created_at: Date;
}
