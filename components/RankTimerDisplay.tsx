import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';


export function RankTimerDisplay({ userProfile }: any) {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    const { resetAchievements } = useStore()

    useEffect(() => {
        if (!userProfile || !userProfile.created_at) return;

        const calculateResetTime = () => {
            const now = new Date();
            const baseDate = new Date(userProfile.created_at);

            const diff = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
            const cycleDay = diff % 30;
            const daysLeft = 30 - cycleDay;

            const nextResetDate = new Date();
            nextResetDate.setDate(now.getDate() + daysLeft);
            nextResetDate.setHours(0, 0, 0, 0);

            const updateTimer = () => {
                const now = new Date().getTime();
                const timeLeft = nextResetDate.getTime() - now;

                if (timeLeft <= 0) {
                    resetAchievements()
                    setTimeUntilReset(`${30}d ${0}h ${0}m ${0}s`);

                    return;
                }

                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);

                setTimeUntilReset(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        };

        return calculateResetTime();
    }, [userProfile]);

    return (
        <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
                <Ionicons name="time-outline" size={20} color="#3498db" />
                <Text style={styles.timerTitle}>Rank Reset Timer</Text>
            </View>
            <Text style={styles.timerText}>{timeUntilReset || 'Calculating...'}</Text>
            <Text style={styles.timerDescription}>
                Ranks reset after every 30 days
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    timerCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    timerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginLeft: 8,
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3498db',
        textAlign: 'center',
        marginVertical: 8,
        fontFamily: 'monospace',
    },
    timerDescription: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 4,
    },
});
