import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Clock, Star, TrendingUp, Award, Trash2, BarChart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useLeaderboard } from '@/contexts/LeaderboardContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'scores' | 'times' | 'stats';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('scores');
  const {
    getTopScores,
    getFastestTimes,
    getHighestLevel,
    getTotalGames,
    getAverageScore,
    clearLeaderboard,
    isLoading,
  } = useLeaderboard();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const topScores = getTopScores(10);
  const fastestTimes = getFastestTimes(10);
  const highestLevel = getHighestLevel();
  const totalGames = getTotalGames();
  const averageScore = getAverageScore();

  const renderScoresTab = () => (
    <View style={styles.tabContent}>
      {topScores.length === 0 ? (
        <View style={styles.emptyState}>
          <Trophy size={64} color="rgba(255, 215, 0, 0.3)" />
          <Text style={styles.emptyText}>No scores yet</Text>
          <Text style={styles.emptySubtext}>Start playing to see your scores here!</Text>
        </View>
      ) : (
        topScores.map((entry, index) => (
          <View key={entry.id} style={styles.leaderboardCard}>
            <LinearGradient
              colors={
                index === 0
                  ? ['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']
                  : index === 1
                  ? ['rgba(192, 192, 192, 0.2)', 'rgba(169, 169, 169, 0.1)']
                  : index === 2
                  ? ['rgba(205, 127, 50, 0.2)', 'rgba(184, 115, 51, 0.1)']
                  : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
              }
              style={styles.cardGradient}
            >
              <View style={styles.rankSection}>
                {index < 3 ? (
                  <View
                    style={[
                      styles.medalContainer,
                      index === 0
                        ? styles.goldMedal
                        : index === 1
                        ? styles.silverMedal
                        : styles.bronzeMedal,
                    ]}
                  >
                    <Trophy
                      size={24}
                      color={
                        index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                      }
                    />
                  </View>
                ) : (
                  <Text style={styles.rankText}>#{index + 1}</Text>
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.mainInfo}>
                  <View style={styles.scoreRow}>
                    <Star size={18} color="#FFD700" />
                    <Text style={styles.scoreValue}>{entry.score.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.levelText}>Level {entry.level}</Text>
                </View>

                <View style={styles.secondaryInfo}>
                  <View style={styles.statChip}>
                    <Clock size={12} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.statChipText}>{formatTime(entry.time)}</Text>
                  </View>
                  <View style={styles.statChip}>
                    <TrendingUp size={12} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.statChipText}>{entry.efficiency.toFixed(0)}%</Text>
                  </View>
                  {entry.comboMultiplier > 1 && (
                    <View style={styles.statChip}>
                      <Text style={styles.statChipText}>x{entry.comboMultiplier.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.timestampText}>{formatDate(entry.timestamp)}</Text>
              </View>
            </LinearGradient>
          </View>
        ))
      )}
    </View>
  );

  const renderTimesTab = () => (
    <View style={styles.tabContent}>
      {fastestTimes.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock size={64} color="rgba(78, 205, 196, 0.3)" />
          <Text style={styles.emptyText}>No times yet</Text>
          <Text style={styles.emptySubtext}>Complete levels to track your speed!</Text>
        </View>
      ) : (
        fastestTimes.map((entry, index) => (
          <View key={entry.id} style={styles.leaderboardCard}>
            <LinearGradient
              colors={
                index === 0
                  ? ['rgba(78, 205, 196, 0.2)', 'rgba(68, 160, 141, 0.1)']
                  : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
              }
              style={styles.cardGradient}
            >
              <View style={styles.rankSection}>
                {index === 0 ? (
                  <View style={[styles.medalContainer, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
                    <Clock size={24} color="#4ECDC4" />
                  </View>
                ) : (
                  <Text style={styles.rankText}>#{index + 1}</Text>
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.mainInfo}>
                  <View style={styles.scoreRow}>
                    <Clock size={18} color="#4ECDC4" />
                    <Text style={[styles.scoreValue, { color: '#4ECDC4' }]}>
                      {formatTime(entry.time)}
                    </Text>
                  </View>
                  <Text style={styles.levelText}>Level {entry.level}</Text>
                </View>

                <View style={styles.secondaryInfo}>
                  <View style={styles.statChip}>
                    <Star size={12} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.statChipText}>{entry.score.toLocaleString()}</Text>
                  </View>
                  <View style={styles.statChip}>
                    <TrendingUp size={12} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.statChipText}>{entry.efficiency.toFixed(0)}%</Text>
                  </View>
                </View>

                <Text style={styles.timestampText}>{formatDate(entry.timestamp)}</Text>
              </View>
            </LinearGradient>
          </View>
        ))
      )}
    </View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
            style={styles.statCardGradient}
          >
            <Award size={32} color="#FFD700" />
            <Text style={styles.statCardValue}>{highestLevel}</Text>
            <Text style={styles.statCardLabel}>Highest Level</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(78, 205, 196, 0.2)', 'rgba(68, 160, 141, 0.1)']}
            style={styles.statCardGradient}
          >
            <BarChart size={32} color="#4ECDC4" />
            <Text style={styles.statCardValue}>{totalGames}</Text>
            <Text style={styles.statCardLabel}>Games Played</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 71, 87, 0.1)']}
            style={styles.statCardGradient}
          >
            <Star size={32} color="#FF6B6B" />
            <Text style={styles.statCardValue}>{averageScore.toLocaleString()}</Text>
            <Text style={styles.statCardLabel}>Avg Score</Text>
          </LinearGradient>
        </View>

        {topScores.length > 0 && (
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.statCardGradient}
            >
              <Trophy size={32} color="#667eea" />
              <Text style={styles.statCardValue}>
                {topScores[0].score.toLocaleString()}
              </Text>
              <Text style={styles.statCardLabel}>Best Score</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {totalGames > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Clear Leaderboard',
              'Are you sure you want to clear all leaderboard data? This action cannot be undone.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => clearLeaderboard(),
                },
              ]
            );
          }}
        >
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.3)', 'rgba(255, 71, 87, 0.2)']}
            style={styles.clearButtonGradient}
          >
            <Trash2 size={20} color="#FF6B6B" />
            <Text style={styles.clearButtonText}>Clear Leaderboard</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Leaderboard',
          headerStyle: {
            backgroundColor: '#0f0c29',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <View style={[styles.container, { paddingTop: 0 }]}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'scores' && styles.activeTab]}
            onPress={() => setActiveTab('scores')}
          >
            <Trophy size={20} color={activeTab === 'scores' ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'} />
            <Text style={[styles.tabText, activeTab === 'scores' && styles.activeTabText]}>
              Top Scores
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'times' && styles.activeTab]}
            onPress={() => setActiveTab('times')}
          >
            <Clock size={20} color={activeTab === 'times' ? '#4ECDC4' : 'rgba(255, 255, 255, 0.5)'} />
            <Text style={[styles.tabText, activeTab === 'times' && styles.activeTabText]}>
              Fastest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <BarChart size={20} color={activeTab === 'stats' ? '#667eea' : 'rgba(255, 255, 255, 0.5)'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Stats
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'scores' && renderScoresTab()}
              {activeTab === 'times' && renderTimesTab()}
              {activeTab === 'stats' && renderStatsTab()}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  tabContent: {
    gap: 12,
  },
  leaderboardCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  rankSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  rankText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  medalContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  goldMedal: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  silverMedal: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderColor: '#C0C0C0',
  },
  bronzeMedal: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderColor: '#CD7F32',
  },
  infoSection: {
    flex: 1,
    gap: 8,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '900' as const,
  },
  levelText: {
    color: '#00F5FF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  secondaryInfo: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statChipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
    minHeight: 140,
    justifyContent: 'center',
  },
  statCardValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900' as const,
  },
  statCardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  clearButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
