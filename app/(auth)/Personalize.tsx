import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressDots } from '@/components/ui-custom/ProgressDots';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { router } from 'expo-router';

type GoalType =
  | 'reduce-stress'
  | 'improve-mood'
  | 'better-sleep'
  | 'self-awareness'
  | 'daily-calm'
  | 'all';

const goals = [
  { id: 'reduce-stress', label: 'Reduce stress & anxiety' },
  { id: 'improve-mood', label: 'Improve my mood' },
  { id: 'better-sleep', label: 'Sleep better' },
  { id: 'self-awareness', label: 'Increase self-awareness' },
  { id: 'daily-calm', label: 'Find moments of calm' },
  { id: 'all', label: 'All of the above' },
];

const Personalize = () => {
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);
  const navigation = useNavigation();

  const toggleGoal = (goalId: GoalType) => {
    if (goalId === 'all') {
      setSelectedGoals(['all']);
      return;
    }

    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(
        selectedGoals.filter((id) => id !== goalId && id !== 'all'),
      );
    } else {
      const newGoals = selectedGoals.filter((id) => id !== 'all');
      setSelectedGoals([...newGoals, goalId]);
    }
  };

  const handleContinue = () => {
    router.push('/welcome');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="gray" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 2 of 4</Text>
        </View>

        <Text style={styles.title}>Personalize Your Experience</Text>
        <Text style={styles.subtitle}>
          Select the goals that matter most to you. We'll tailor your MindLift AI
          experience based on your preferences.
        </Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>What are your main goals?</Text>
          <View style={styles.goalsGrid}>
            {goals.map((goal, index) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(goal.id as GoalType) &&
                  styles.selectedGoalButton,
                ]}
                onPress={() => toggleGoal(goal.id as GoalType)}
              >
                <Text style={styles.goalText}>{goal.label}</Text>
                {selectedGoals.includes(goal.id as GoalType) && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingVertical: 48
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    color: 'gray',
  },
  content: {
    alignItems: 'center',
  },
  stepIndicator: {
    backgroundColor: 'rgba(200, 200, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  stepText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  card: {
    width: '100%',
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalButton: {
    width: '48%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedGoalButton: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkIcon: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 4,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
});

export default Personalize;
