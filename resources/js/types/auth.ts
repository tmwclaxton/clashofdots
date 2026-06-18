export type User = {
    id: number;
    name: string;
    game_display_name: string | null;
    email: string;
    avatar?: string;
    avatar_style?: string;
    avatar_seed?: string | null;
    profile_uuid?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    isAdmin: boolean;
};
