import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useGoals } from '@/contexts/GoalsContext';
import { GOAL_EMOJIS } from '@/constants/emojis';
import { goalTrackerColors } from '@/constants/colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const Colors = goalTrackerColors;

const POINT_OPTIONS = [5, 10, 15, 25, 50];

export default function AddGoalScreen({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addGoal } = useGoals();

  const [title, setTitle] = useState<string>('');
  const [selectedPoints, setSelectedPoints] = useState<number>(10);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🎯');
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleSave = useCallback(() => {
    if (!title.trim()) return;

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addGoal(title.trim(), selectedPoints, selectedEmoji);
    setActiveTab('goals');
  }, [title, selectedPoints, selectedEmoji, addGoal, router, buttonScale]);

  return (
    <View style={[styles.container]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setActiveTab('goals')}
          style={styles.closeButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Goal</Text>
        <TouchableOpacity
          onPress={() => setActiveTab('goals')}
          style={styles.closeButton}
          testID="close-modal"
        >
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>What's your goal?</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Read for 30 minutes"
          placeholderTextColor={Colors.textTertiary}
          maxLength={50}
        />

        <Text style={styles.sectionLabel}>Pick an emoji</Text>
        <View style={styles.emojiGrid}>
          {GOAL_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                selectedEmoji === emoji && styles.emojiOptionSelected,
              ]}
              onPress={() => {
                setSelectedEmoji(emoji);
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Point value</Text>
        <View style={styles.pointsGrid}>
          {POINT_OPTIONS.map((points) => (
            <TouchableOpacity
              key={points}
              style={[
                styles.pointOption,
                selectedPoints === points && styles.pointOptionSelected,
              ]}
              onPress={() => {
                setSelectedPoints(points);
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              }}
            >
              <Text
                style={[
                  styles.pointText,
                  selectedPoints === points && styles.pointTextSelected,
                ]}
              >
                {points}
              </Text>
              <Text
                style={[
                  styles.pointSuffix,
                  selectedPoints === points && styles.pointSuffixSelected,
                ]}
              >
                pts
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              !title.trim() && styles.saveButtonDisabled,
            ]}
            disabled={!title.trim()}
            activeOpacity={0.8}
            testID="save-goal-button"
          >
            <Check size={20} color={Colors.background} strokeWidth={3} />
            <Text style={styles.saveButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surfaceLight,
  },
  emojiText: {
    fontSize: 22,
  },
  pointsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  pointOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pointOptionSelected: {
    borderColor: Colors.gold,
    backgroundColor: '#E8F0FE',
  },
  pointText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  pointTextSelected: {
    color: Colors.gold,
  },
  pointSuffix: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  pointSuffixSelected: {
    color: Colors.goldDark,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 100,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
