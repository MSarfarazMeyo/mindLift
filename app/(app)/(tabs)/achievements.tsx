import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/lib/store';
import { RankCard } from '@/components/RankCard';
import { StatsContainer } from '@/components/StatsContainer';
import { RankTimerDisplay } from '@/components/RankTimerDisplay';
import { RanksList } from '@/components/RanksList';
import { Leaderboard } from '@/components/Leaderboard';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { achievement, resetAchievements } = useStore();

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const currentRank = store.getRank();
  const nextRank = store.getNextRank();
  const userProfile = useStore((state) => state.userProfile);

  if (!achievement) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>

      <RankCard
        currentRank={currentRank}
        nextRank={nextRank}
        achievement={achievement as any}
      />

      <RankTimerDisplay userProfile={userProfile} />

      <StatsContainer achievement={achievement as any} />

      <RanksList currentRank={currentRank} />

      <TouchableOpacity
        style={styles.leaderboardButton}
        onPress={() => setShowLeaderboardModal(true)}
      >
        <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
      </TouchableOpacity>

      <Modal
        visible={showLeaderboardModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLeaderboardModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Leaderboard</Text>
            <TouchableOpacity
              onPress={() => setShowLeaderboardModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <Leaderboard />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#3498db',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  leaderboardButton: {
    backgroundColor: '#3498db',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  leaderboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  modalHeader: {
    marginTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 10,
  },
});
