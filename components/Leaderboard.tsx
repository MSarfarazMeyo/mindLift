import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardUser } from '@/types/achievements';

export function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabaseAdmin
                    .from('achievements')
                    .select(`
            id,
            user_id,
            total_points,
            login_streak,
            questions_answered,
            notes_written,
            last_login_date,
            last_questions_date,
            profiles:user_id (
              name, 
              email,
              username
            )
          `)
                    .order('total_points', { ascending: false })
                    .limit(100);

                if (error) throw error;

                const sortedData: any = [...(data || [])].sort(
                    (a: any, b: any) => b.total_points - a.total_points
                );

                sortedData.forEach((user: any, index: any) => {
                    user.rank = index + 1;
                });

                setLeaderboardData(sortedData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" color="#3498db" />;
    }

    if (error) {
        return <Text style={styles.errorText}>Error: {error}</Text>;
    }

    return (
        <View style={styles.leaderboardContainer}>
            <Text style={styles.leaderboardTitle}>Top 100 Players</Text>
            <ScrollView>
                {leaderboardData.map((player: LeaderboardUser) => (
                    <View key={player.id} style={styles.leaderboardItem}>
                        <View style={styles.leaderboardRank}>
                            <Text style={styles.leaderboardRankLabel}>{player.rank}</Text>
                        </View>
                        <Text style={styles.leaderboardName}>
                            {player?.profiles?.name ||
                                player.profiles?.username ||
                                player.profiles?.email ||
                                'Anonymous'}
                        </Text>
                        <Text style={styles.leaderboardPoints}>
                            {player.total_points} points
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    leaderboardContainer: {
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
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 4,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leaderboardRank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    leaderboardRankLabel: {
        fontSize: 14,
        color: '#fff',
    },
    leaderboardName: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: 'bold',
    },
    leaderboardPoints: {
        fontSize: 14,
        color: '#7f8c8d',
        marginRight: 12,
    },
    errorText: {
        fontSize: 16,
        color: '#e74c3c',
        textAlign: 'center',
    },
});
