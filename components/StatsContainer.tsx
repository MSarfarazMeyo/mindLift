import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '@/types/achievements';

interface StatsContainerProps {
    achievement: Achievement;
}

export function StatsContainer({ achievement }: StatsContainerProps) {
    return (
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#3498db" />
                <Text style={styles.statValue}>{achievement.total_points}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#e74c3c" />
                <Text style={styles.statValue}>{achievement.login_streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                <Text style={styles.statValue}>{achievement.questions_answered}</Text>
                <Text style={styles.statLabel}>Questions</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
    },
});