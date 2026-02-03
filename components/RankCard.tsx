import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rankColors, rankIcons, getMinPointsForRank } from '../constants/ranks';
import { Achievement } from '../types/achievements';

interface RankCardProps {
    currentRank: string;
    nextRank: { rank: string; pointsNeeded: number };
    achievement: Achievement;
}

export function RankCard({ currentRank, nextRank, achievement }: RankCardProps) {
    const progressToNextRank = useMemo(() => {
        if (!currentRank || !nextRank) return 0;

        const currentRankMinPoints = getMinPointsForRank(currentRank);
        const nextRankMinPoints = nextRank.rank === currentRank
            ? currentRankMinPoints
            : getMinPointsForRank(nextRank.rank);

        const pointsInCurrentRank = achievement.total_points - currentRankMinPoints;
        const pointsNeededForNextRank = nextRankMinPoints - currentRankMinPoints;

        return pointsNeededForNextRank > 0
            ? (pointsInCurrentRank / pointsNeededForNextRank) * 100
            : 100;
    }, [achievement, currentRank, nextRank]);



    return (
        <View style={styles.rankCard}>
            <View
                style={[
                    styles.rankIconContainer,
                    { backgroundColor: rankColors[currentRank] },
                ]}
            >
                <Ionicons name={rankIcons[currentRank] as any} size={40} color="#ffffff" />
            </View>
            <Text style={styles.rankTitle}>{currentRank} Rank</Text>
            {nextRank.pointsNeeded > 0 && (
                <Text style={styles.rankProgress}>
                    {nextRank.pointsNeeded} points to {nextRank.rank}
                </Text>
            )}
            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBar,
                        {
                            width: `${progressToNextRank}%`,
                            backgroundColor: rankColors[currentRank],
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rankCard: {
        margin: 20,
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rankIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    rankTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    rankProgress: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 12,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#ecf0f1',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    progressPercentage: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '600',
        position: 'absolute',
        right: 4,
        top: -18,
        backgroundColor: 'transparent',
    },
});