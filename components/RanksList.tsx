import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rankColors, rankIcons, getMinPointsForRank, getMaxPointsForRank } from '@/constants/ranks';

interface RanksListProps {
    currentRank: string;
}

export function RanksList({ currentRank }: RanksListProps) {
    return (
        <View style={styles.ranksList}>
            <Text style={styles.ranksTitle}>Rank Levels</Text>
            {Object.entries(rankColors).map(([rank, color]) => (
                <View key={rank} style={styles.rankItem}>
                    <View style={[styles.rankDot, { backgroundColor: color }]}>
                        <Ionicons name={rankIcons[rank] as any} size={20} color="#ffffff" />
                    </View>
                    <View style={styles.rankInfo}>
                        <Text style={styles.rankName}>{rank}</Text>
                        <Text style={styles.rankPoints}>
                            {rank === 'Novice'
                                ? '0–499'
                                : rank === 'Mythic'
                                    ? '50000+'
                                    : `${getMinPointsForRank(rank)}–${getMaxPointsForRank(rank)}`}{' '}
                            points
                        </Text>
                    </View>
                    {currentRank === rank && (
                        <View style={styles.currentRankBadge}>
                            <Text style={styles.currentRankText}>Current</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    ranksList: {
        margin: 20,
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ranksTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    rankDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankInfo: {
        flex: 1,
    },
    rankName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    rankPoints: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    currentRankBadge: {
        backgroundColor: '#3498db',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    currentRankText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
