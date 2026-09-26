// No real poster art yet (coverImageUrl / backdropImageUrl are null until
// TMDB images are wired up) - a deterministic gradient + monogram stands in,
// same tone/initials for the same title every render.

const TONES: [string, string][] = [
    ['#3B4A63', '#151C29'],
    ['#4A3B2E', '#1E1712'],
    ['#5A2A2E', '#200F11'],
    ['#2E4A44', '#131F1C'],
    ['#3A3560', '#15112B'],
    ['#5B4A2B', '#221A0C'],
    ['#4B2F52', '#1C1020'],
    ['#28505C', '#0F1F26'],
];

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function posterGradient(seed: string): string {
    const [from, to] = TONES[hashString(seed) % TONES.length];
    return `linear-gradient(160deg, ${from}, ${to})`;
}

export function posterInitials(title: string): string {
    const words = title
        .replace(/&/g, '')
        .split(/\s+/)
        .filter((w) => w && w.toLowerCase() !== 'the');
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}
