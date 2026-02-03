import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../../lib/store';
import { useMusic } from '@/hooks/useMusic';

type GameId =
  | 'memory'
  | 'meditation'
  | 'breathe'
  | 'gratitude'
  | 'thought'
  | 'focus'
  | 'bubble'
  | 'emotiPet'
  | 'voiceemotionscanner'
  | 'mazeescape'
  | 'tictactoe'
  | 'gemcatcher'
  | 'breakout'
  | 'endlessrunner'
  | 'colormatch'
  | 'birdybounce';

const games: any[] = [
  {
    id: 'bubble',
    title: 'Bubble Pop',
    description: 'Pop bubbles to earn points and improve your mood',
    icon: 'water',
    color: '#3498db',
    points: '75-150',
    image:
      'https://images.unsplash.com/photo-1489659639091-8b687bc4386e?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'memory',
    title: 'Mindful Memory',
    description: 'Match pairs of emotions and train your memory',
    icon: 'grid',
    color: '#3498db',
    points: '100-200',
    image:
      'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'mazeescape',
    title: 'Maze Escape',
    description:
      'Navigate through challenging mazes to improve focus and problem-solving',
    icon: '👾',
    color: '#e9dde9ff',
    points: '100-300',
    image:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'meditation',
    title: 'Meditation Music',
    description: 'Relax with calming sounds and guided meditation',
    icon: 'musical-notes',
    color: '#9b59b6',
    points: '80-120',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'breathe',
    title: 'Anxiety CountDown',
    description: 'Practice guided breathing with animated bubbles',
    icon: 'water',
    color: '#2ecc71',
    points: '50-100',
    image:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'gratitude',
    title: 'Gratitude Garden',
    description: "Grow a garden by recording things you're grateful for",
    icon: 'leaf',
    color: '#e67e22',
    points: '75-150',
    image:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'emotiPet',
    title: 'EmotiPet: Wellness Companion',
    description: 'Care for your virtual pet and earn 500 points per level up',
    icon: '🐱',
    color: '#ff6b6b',
    points: '500 per level',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'voiceemotionscanner',
    title: 'Voice Emotion Scanner',
    description: 'Analyze your emotional state through voice patterns',
    icon: '🎤',

    color: '#4ecdc4',
    points: '100-300',
    image:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
  },

  {
    id: 'thought',
    title: 'Thought Challenger',
    description: 'Challenge negative thoughts with cognitive techniques',
    icon: 'bulb',
    color: '#9b59b6',
    points: '100-200',
    image:
      'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80',
  },
  // {
  //   id: 'focus',
  //   title: 'Focus Flow',
  //   description: 'Improve concentration with mindful attention exercises',
  //   icon: 'eye',
  //   color: '#e74c3c',
  //   points: '75-150',
  //   image:
  //     'https://images.unsplash.com/photo-1489659639091-8b687bc4386e?w=800&auto=format&fit=crop&q=80',
  // },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-toe game',
    description: 'Challenge AI in classic strategy game',
    icon: '🎯',
    color: '#3B82F6',
    points: '50-150',
    image:
      'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'gemcatcher',
    title: 'Gem Catcher',
    description: 'Catch falling gems while avoiding bombs',
    icon: '💎',
    color: '#10B981',
    points: '100-300',
    image:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: 'Break bricks with bouncing ball',
    icon: '🧱',
    color: '#F59E0B',
    points: '75-200',
    image:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'endlessrunner',
    title: 'Endless Runner',
    description: 'Jump over obstacles in endless adventure',
    icon: '🏃',
    color: '#EF4444',
    points: '80-250',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'colormatch',
    title: 'Color Match',
    description: 'Match colors to test your perception',
    icon: '🎨',
    color: '#8B5CF6',
    points: '60-180',
    image:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'birdybounce',
    title: 'Birdy Bounce',
    description: 'Guide bird through pipe obstacles',
    icon: '🐦',
    color: '#06B6D4',
    points: '90-300',
    image:
      'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=800&auto=format&fit=crop&q=80',
  },
];

export default function GamesScreen() {
  const { loadAll, unloadAll } = useMusic();

  useEffect(() => {
    loadAll(); // Load all music on app start
    return () => {
      unloadAll(); // Cleanup on close
    };
  }, []);

  const handleGameSelect = (gameId: GameId) => {
    router.push(`/games/${gameId}` as any);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wellness Games</Text>
        <Text style={styles.subtitle}>
          Have fun while improving your mental health
        </Text>
      </View>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Featured Game</Text>
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => handleGameSelect('memory')}
        >
          <Image
            source={{ uri: games[1].image }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTitle}>{games[1].title}</Text>
            <Text style={styles.featuredDescription}>
              {games[1].description}
            </Text>
            <View style={styles.featuredPoints}>
              <Ionicons name="trophy" size={16} color="#ffffff" />
              <Text style={styles.featuredPointsText}>
                {games[1].points} points
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.gamesContainer}>
        <Text style={styles.sectionTitle}>All Games</Text>

        <View style={styles.aiCoachContainer}>
          <TouchableOpacity
            style={styles.aiCoachCard}
            onPress={() => router.push('/chat')}
          >
            <View style={styles.aiCoachIcon}>
              <Text style={styles.heartEmoji}>❤️</Text>
            </View>
            <View style={styles.aiCoachInfo}>
              <Text style={styles.aiCoachTitle}>Mindly</Text>
              <Text style={styles.aiCoachSubtitle}>AI Powered Coach</Text>
              <View style={styles.aiCoachPoints}>
                <Ionicons name="trophy" size={14} color="#7f8c8d" />
                <Text style={styles.aiCoachPointsText}>
                  500 points per 10 chats • Max 1000/day
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
          </TouchableOpacity>
        </View>

        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleGameSelect(game.id)}
          >
            <View
              style={[
                styles.gameIconContainer,
                { backgroundColor: game.color },
              ]}
            >
              {game.id === 'emotiPet' ||
              game.id === 'voiceemotionscanner' ||
              game.id === 'mazeescape' ||
              game.id === 'tictactoe' ||
              game.id === 'gemcatcher' ||
              game.id === 'breakout' ||
              game.id === 'endlessrunner' ||
              game.id === 'colormatch' ||
              game.id === 'birdybounce' ? (
                <Text style={styles.gameIconText}>{game.icon}</Text>
              ) : (
                <Ionicons name={game.icon as any} size={24} color="#ffffff" />
              )}
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              <View style={styles.gamePoints}>
                <Ionicons name="trophy" size={14} color="#7f8c8d" />
                <Text style={styles.gamePointsText}>{game.points} points</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.sectionTitle}>Benefits of Mental Health Games</Text>
        <View style={styles.benefitCard}>
          <FontAwesome6 name="brain" size={24} color="blue" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Cognitive Enhancement</Text>
            <Text style={styles.benefitDescription}>
              Improve memory, attention, and problem-solving skills
            </Text>
          </View>
        </View>
        <View style={styles.benefitCard}>
          <Ionicons name="heart" size={24} color="#e74c3c" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Stress Reduction</Text>
            <Text style={styles.benefitDescription}>
              Lower anxiety and promote relaxation through mindful play
            </Text>
          </View>
        </View>
        <View style={styles.benefitCard}>
          <Ionicons name="happy" size={24} color="#2ecc71" />
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Mood Improvement</Text>
            <Text style={styles.benefitDescription}>
              Boost positive emotions and build emotional resilience
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 48,
  },
  header: {
    padding: 20,
    backgroundColor: '#3498db',
  },
  aiCoachContainer: {
    paddingBottom: 0,
  },
  aiCoachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiCoachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe6e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heartEmoji: {
    fontSize: 24,
  },
  aiCoachInfo: {
    flex: 1,
  },
  aiCoachTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  aiCoachSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  aiCoachPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiCoachPointsText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  featuredContainer: {
    padding: 20,
  },
  featuredCard: {
    borderRadius: 15,
    overflow: 'hidden',
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  featuredPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredPointsText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 6,
  },
  gamesContainer: {
    padding: 20,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  gamePoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gamePointsText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  gameIconText: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: undefined,
  },
  benefitsContainer: {
    padding: 20,
    marginBottom: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitContent: {
    marginLeft: 16,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});
