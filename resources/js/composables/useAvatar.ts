const BASE = 'https://api.dicebear.com/10.x';

export type AvatarStyle =
    | 'pixel-art'
    | 'pixel-art-neutral'
    | 'lorelei'
    | 'lorelei-neutral'
    | 'bottts'
    | 'adventurer'
    | 'adventurer-neutral'
    | 'fun-emoji';

export const AVATAR_STYLES: { value: AvatarStyle; label: string; description: string }[] = [
    { value: 'pixel-art', label: 'Pixel Art (feminine)', description: 'Retro pixel sprite with feminine features' },
    { value: 'pixel-art-neutral', label: 'Pixel Art (neutral)', description: 'Retro pixel sprite, gender-neutral' },
    { value: 'lorelei', label: 'Lorelei (feminine)', description: 'Illustrated portrait with feminine features' },
    { value: 'lorelei-neutral', label: 'Lorelei (neutral)', description: 'Illustrated portrait, gender-neutral' },
    { value: 'adventurer', label: 'Adventurer (masculine)', description: 'Cartoon adventurer with masculine features' },
    { value: 'adventurer-neutral', label: 'Adventurer (neutral)', description: 'Cartoon adventurer, gender-neutral' },
    { value: 'bottts', label: 'Robot', description: 'Quirky retro robot' },
    { value: 'fun-emoji', label: 'Emoji', description: 'Fun emoji-style face' },
];

/**
 * Returns a deterministic DiceBear avatar URL for a given seed and style.
 * The seed should be a stable unique identifier such as a profile_uuid or avatar_seed.
 */
export function avatarUrl(seed: string, style: AvatarStyle | string = 'pixel-art'): string {
    return `${BASE}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/** Resolves the effective seed for a user, preferring avatar_seed over profile_uuid. */
export function resolveAvatarSeed(user: { profile_uuid?: string | null; avatar_seed?: string | null }): string {
    return user.avatar_seed ?? user.profile_uuid ?? 'default';
}
