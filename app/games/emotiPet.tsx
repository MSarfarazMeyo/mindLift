import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePet } from '@/contexts/PetContext';
import Colors from '@/constants/colors';
import { MOOD_CONFIG } from '@/constants/petConfig';
import { MoodType, PetType } from '@/types/pet';
// Groq API - Free tier with 6000 tokens/minute
const GROQ_API_URL = process.env.EXPO_PUBLIC_GROQ_API_URL!;
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY!;
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    pet,
    habits,
    toggleHabit,
    moods,
    isLoading,
    addMood,
    updatePetName,
    updatePetType,
    getStats,
  } = usePet();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [note, setNote] = useState<string>('');
  const [editingName, setEditingName] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(pet.name);

  const generateAIResponseMutation = useMutation({
    mutationFn: async (params: {
      mood: MoodType;
      intensity: number;
      note?: string;
    }) => {
      const prompt = `A user is checking in with their emotional support companion pet. They're feeling ${params.mood} (intensity: ${params.intensity}/10)${params.note ? `. They shared: "${params.note}"` : ''}. 
      
      As their supportive AI companion pet, respond with a warm, empathetic, and encouraging message (2-3 sentences). Be genuine and specific to their mood.`;

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "I'm here for you! 💜";
    },
  });

  const handleHabitPress = (habitId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleHabit(habitId);
  };

  const handleMoodSelect = (mood: MoodType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMood(mood);
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    generateAIResponseMutation.mutate(
      { mood: selectedMood, intensity, note: note || undefined },
      {
        onSuccess: (aiResponse) => {
          addMood(selectedMood, intensity, note || undefined, aiResponse);
          setSelectedMood(null);
          setIntensity(5);
          setNote('');
        },
        onError: (error) => {
          console.error('save data error', error);
        },
      },
    );
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      updatePetName(newName.trim());
      setEditingName(false);
    }
  };

  const handlePetTypeSelect = (type: PetType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updatePetType(type);
  };

  const today = new Date().toDateString();
  const todayMood =
    moods.find((m) => new Date(m.timestamp).toDateString() === today) || null;
  const completedCount = habits.filter((h) => h.completed).length;
  const stats = getStats();
  const moodsArray = Object.entries(MOOD_CONFIG) as [
    MoodType,
    (typeof MOOD_CONFIG)[MoodType],
  ][];

  const petTypes: { type: PetType; emoji: string; label: string }[] = [
    { type: 'cat', emoji: '🐱', label: 'Cat' },
    { type: 'fox', emoji: '🦊', label: 'Fox' },
    { type: 'dragon', emoji: '🐉', label: 'Dragon' },
    { type: 'robot', emoji: '🤖', label: 'Robot' },
  ];

  console.log('habits', habits);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  console.log('generateAIResponseMutation', generateAIResponseMutation);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.purpleLight, Colors.light.background]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.greeting}>Your Emotional Support Companion</Text>
        </View>
        <Text style={styles.subtitle}>Growing together, one day at a time</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.petSection}>
          <View style={styles.petContainer}>
            <View style={styles.petCircle}>
              <Text style={styles.petEmoji}>😸</Text>
            </View>
          </View>

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petStatus}>Thriving • Level {pet.level}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={[styles.statValue, { color: Colors.light.green }]}>
                100%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>{pet.xp}/600</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(pet.xp / 600) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((pet.xp / 600) * 100)}% to Flourishing
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editNameButton}
            onPress={() => setEditingName(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.editNameButtonText}>✏️ Edit Name</Text>
          </TouchableOpacity>

          {editingName && (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                placeholder="Enter name"
                placeholderTextColor={Colors.light.textSecondary}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {todayMood && (
          <View style={styles.moodCard}>
            <Text style={styles.moodCardTitle}>Today&apos;s Check-in</Text>
            <Text style={styles.moodText}>
              You&apos;re feeling {todayMood.mood} today
            </Text>
            {todayMood.aiResponse && (
              <View style={styles.aiResponseBox}>
                <Text style={styles.aiResponseLabel}>
                  💭 Your companion says:
                </Text>
                <Text style={styles.aiResponseText}>
                  {todayMood.aiResponse}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Habits</Text>
            <Text style={styles.sectionSubtitle}>
              {completedCount}/{habits.length} completed
            </Text>
          </View>

          <View style={styles.habitsList}>
            {habits.map((habit: any) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  habit.completed && styles.habitCardCompleted,
                ]}
                onPress={() => handleHabitPress(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitLeft}>
                  <View
                    style={[
                      styles.habitCheckbox,
                      habit.completed && styles.habitCheckboxChecked,
                    ]}
                  >
                    {habit.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitTitle,
                        habit.completed && styles.habitTitleCompleted,
                      ]}
                    >
                      {habit.icon} {habit.name}
                    </Text>
                    {habit.streak > 0 && habit.completed && (
                      <Text style={styles.habitStreak}>
                        🔥 day {habit.streak} streak
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.habitXP}>
                  <Text style={styles.habitXPText}>+{habit.xpReward} XP</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {moodsArray.map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.moodButton,
                  (selectedMood === key ||
                    (todayMood && todayMood.mood === key)) &&
                    styles.moodButtonSelected,
                  (selectedMood === key ||
                    (todayMood && todayMood.mood === key)) && {
                    borderColor: config.color,
                  },
                ]}
                onPress={() => handleMoodSelect(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{config.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    (selectedMood === key ||
                      (todayMood && todayMood.mood === key)) &&
                      styles.moodLabelSelected,
                    (selectedMood === key ||
                      (todayMood && todayMood.mood === key)) && {
                      color: config.color,
                    },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(selectedMood || todayMood) && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>
                How intense is this feeling?
              </Text>
              <View style={styles.intensityContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.intensityButton,
                      (todayMood
                        ? todayMood.intensity === value
                        : intensity === value) &&
                        styles.intensityButtonSelected,
                    ]}
                    onPress={() => {
                      if (!todayMood && Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      if (!todayMood) setIntensity(value);
                    }}
                    disabled={!!todayMood}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        (todayMood
                          ? todayMood.intensity === value
                          : intensity === value) &&
                          styles.intensityTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.detailsTitle}>
                Want to share more? (Optional)
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What's on your mind?"
                placeholderTextColor={Colors.light.textSecondary}
                value={todayMood ? todayMood.note || '' : note}
                onChangeText={todayMood ? undefined : setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!todayMood}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (generateAIResponseMutation.isPending || todayMood) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={generateAIResponseMutation.isPending || !!todayMood}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.light.purple, Colors.light.pink]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitText}>
                    {todayMood
                      ? 'Already checked in today'
                      : generateAIResponseMutation.isPending
                        ? 'Getting response...'
                        : 'Submit Check-in'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {generateAIResponseMutation.isError && (
                <Text style={styles.errorText}>
                  Failed to get AI response. Please try again.
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Pet Type</Text>
          <View style={styles.petTypesGrid}>
            {petTypes.map((petType) => (
              <TouchableOpacity
                key={petType.type}
                style={[
                  styles.petTypeButton,
                  pet.type === petType.type && styles.petTypeButtonSelected,
                ]}
                onPress={() => handlePetTypeSelect(petType.type)}
                activeOpacity={0.7}
              >
                <Text style={styles.petTypeEmoji}>{petType.emoji}</Text>
                <Text
                  style={[
                    styles.petTypeLabel,
                    pet.type === petType.type && styles.petTypeLabelSelected,
                  ]}
                >
                  {petType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.daysWithPet}</Text>
              <Text style={styles.statLabel}>Days Together</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.habitsCompleted}</Text>
              <Text style={styles.statLabel}>Habits Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.moodEntriesCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pet.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  petSection: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petEmoji: {
    fontSize: 60,
  },
  petName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  petStatus: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 20,
  },

  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.purple,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  editNameButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editNameButtonText: {
    fontSize: 16,
    color: Colors.light.purple,
    fontWeight: '600' as const,
  },
  nameEditContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  nameInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: Colors.light.purple,
    minWidth: 160,
  },
  saveButton: {
    backgroundColor: Colors.light.purple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '700' as const,
  },

  moodCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  moodCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  aiResponseBox: {
    backgroundColor: Colors.light.purpleLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  aiResponseLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.purple,
    marginBottom: 6,
  },
  aiResponseText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  habitCardCompleted: {
    backgroundColor: Colors.light.greenLight,
    borderColor: Colors.light.green,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  habitCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
  },
  habitCheckboxChecked: {
    backgroundColor: Colors.light.green,
    borderColor: Colors.light.green,
  },
  checkmark: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  habitTitleCompleted: {
    opacity: 0.7,
  },
  habitStreak: {
    fontSize: 13,
    color: Colors.light.orange,
    fontWeight: '600' as const,
  },
  habitXP: {
    backgroundColor: Colors.light.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  habitXPText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.purple,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.border,
    gap: 8,
  },
  moodButtonSelected: {
    backgroundColor: Colors.light.purpleLight,
    borderWidth: 3,
  },
  moodEmoji: {
    fontSize: 40,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  moodLabelSelected: {
    fontWeight: '700' as const,
  },
  detailsSection: {
    gap: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonSelected: {
    backgroundColor: Colors.light.purple,
    borderColor: Colors.light.purple,
  },
  intensityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  intensityTextSelected: {
    color: Colors.light.card,
    fontWeight: '700' as const,
  },
  noteInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 120,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  errorText: {
    color: Colors.light.red,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  petTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  petTypeButton: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.border,
    gap: 8,
  },
  petTypeButtonSelected: {
    backgroundColor: Colors.light.purpleLight,
    borderColor: Colors.light.purple,
  },
  petTypeEmoji: {
    fontSize: 48,
  },
  petTypeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  petTypeLabelSelected: {
    color: Colors.light.purple,
    fontWeight: '700' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.purple,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
});
