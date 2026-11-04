export type UserRole = 'admin' | 'accountant' | 'investor';

export interface User {
    id: number;
    name: string;
    username: string;
    phone?: string | null;
    role: UserRole;
    role_label?: string;
    created_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
