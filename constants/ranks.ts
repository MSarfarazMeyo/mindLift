export const rankColors: Record<string, string> = {
    Novice: '#95a5a6',
    Bronze: '#cd7f32',
    Silver: '#c0c0c0',
    Gold: '#ffd700',
    Emerald: '#50c878',
    Diamond: '#b9f2ff',
    Elite: '#8e44ad',
    Champion: '#e67e22',
    Master: '#9370db',
    Grandmaster: '#ff4500',
    Legend: '#1abc9c',
    Mythic: '#ff1493',
};

export const rankIcons: Record<string, string> = {
    Novice: 'leaf-outline',
    Bronze: 'medal-outline',
    Silver: 'medal-outline',
    Gold: 'medal-outline',
    Emerald: 'sparkles-outline',
    Diamond: 'diamond-outline',
    Elite: 'flame-outline',
    Champion: 'shield-checkmark-outline',
    Master: 'trophy-outline',
    Grandmaster: 'trophy',
    Legend: 'star',
    Mythic: 'infinite',
};

export function getMinPointsForRank(rank: string): number {
    const rankThresholds: Record<string, number> = {
        Bronze: 500,
        Silver: 1000,
        Gold: 2000,
        Emerald: 4000,
        Diamond: 8000,
        Elite: 12000,
        Champion: 16000,
        Master: 20000,
        Grandmaster: 26000,
        Legend: 36000,
        Mythic: 50000,
    };
    return rankThresholds[rank] || 0;
}

export function getMaxPointsForRank(rank: string): number {
    const rankMaxThresholds: Record<string, number> = {
        Novice: 499,
        Bronze: 999,
        Silver: 1999,
        Gold: 3999,
        Emerald: 7999,
        Diamond: 11999,
        Elite: 15999,
        Champion: 19999,
        Master: 25999,
        Grandmaster: 35999,
        Legend: 49999,
        Mythic: Infinity,
    };
    return rankMaxThresholds[rank] || Infinity;
}