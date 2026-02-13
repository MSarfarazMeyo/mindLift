import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Plus, RotateCcw, Trash2, Flame, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useGoals } from '@/contexts/GoalsContext';
import { goalTrackerColors } from '@/constants/colors';
import { Goal } from '@/types/goal';
const Colors = goalTrackerColors;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function GoalCard({
  goal,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(goal.completed ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: goal.completed ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [goal.completed, checkAnim]);

  const handlePress = useCallback(() => {
    if (isToggling) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(goal.id);
  }, [goal.id, onToggle, scaleAnim, isToggling]);

  const handleDelete = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDelete(goal.id);
    });
  }, [goal.id, onDelete, slideAnim]);

  const handleLongPress = useCallback(() => {
    if (isDeleting) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }, [goal.title, handleDelete, isDeleting]);

  const opacity = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.goalCard,
        {
          transform: [{ scale: scaleAnim }, { translateX: slideAnim }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={styles.goalCardInner}
        testID={`goal-card-${goal.id}`}
        disabled={isToggling || isDeleting}
      >
        <View style={styles.goalLeft}>
          <View
            style={[
              styles.checkbox,
              goal.completed && styles.checkboxCompleted,
            ]}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={goal.completed ? "#fff" : Colors.gold} />
            ) : (
              goal.completed && <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          <Text
            style={[
              styles.goalTitle,
              goal.completed && styles.goalTitleCompleted,
            ]}
            numberOfLines={1}
          >
            {goal.title}
          </Text>
        </View>
        <View style={styles.goalRight}>
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <>
              <Star size={14} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.goalPoints}>+{goal.points}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const MemoizedGoalCard = React.memo(GoalCard);

export default function GoalsScreen({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goals, totalPoints, toggleGoal, deleteGoal, resetDaily, isLoading, togglingId, deletingId, isResetting } =
    useGoals();
  const [pointsAnim] = useState(() => new Animated.Value(0));
  const fabScale = useRef(new Animated.Value(1)).current;

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;

  useEffect(() => {
    Animated.timing(pointsAnim, {
      toValue: totalPoints,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [totalPoints, pointsAnim]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleGoal(id);
    },
    [toggleGoal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteGoal(id);
    },
    [deleteGoal],
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Goals',
      'Mark all goals as incomplete? Your points are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }
            resetDaily();
          },
        },
      ],
    );
  }, [resetDaily]);

  const handleAddPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // router.push("/add-goal");
    setActiveTab('add-goal');
  }, [router, fabScale]);

  const renderItem = useCallback(
    ({ item }: { item: Goal }) => (
      <MemoizedGoalCard
        goal={item}
        onToggle={handleToggle}
        onDelete={handleDelete}
        isToggling={togglingId === item.id}
        isDeleting={deletingId === item.id}
      />
    ),
    [handleToggle, handleDelete, togglingId, deletingId],
  );

  const keyExtractor = useCallback((item: Goal) => item.id, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Goals</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount}/{totalCount} completed today
            </Text>
          </View>
          {goals.length > 0 && (
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetButton}
              testID="reset-button"
              disabled={isResetting}
            >
              {isResetting ? (
                <ActivityIndicator size="small" color={Colors.textSecondary} />
              ) : (
                <RotateCcw size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.pointsRow}>
            <Flame size={22} color={Colors.gold} />
            <Text style={styles.pointsText}>{totalPoints}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to add your first goal
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Animated.View
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 24,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleAddPress}
          style={styles.fabButton}
          activeOpacity={0.8}
          testID="add-goal-button"
        >
          <Plus size={28} color={Colors.background} strokeWidth={3} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  pointsLabel: {
    fontSize: 16,
    color: Colors.goldDark,
    fontWeight: '600' as const,
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  goalCard: {
    marginBottom: 10,
  },
  goalCardInner: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textTertiary,
  },
  goalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  goalPoints: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 24,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
