import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { questions } from '@/app/(app)/(tabs)/journal';
import { useAlternativeQuoteAPI } from '@/hooks/useQuoteByScore';
import { ActivityIndicator } from 'react-native';
import DailyQuestionsPieChart from './piechart';
import { useWeeklyGoalsCount } from '@/contexts/GoalsContext';

export const ratings = [
  'Poor',
  'Fair',
  'Neutral',
  'Very Good',
  'Excellent',
] as const;
type Rating = (typeof ratings)[number];

interface WeeklyStats {
  totalEntries: number;
  journalEntries: number;
  questionsCompleted: number;
  goalsCompleted: number;
  averageWellnessScore: number;
  moodTrend: string;
  sleepAverage: string;
  mostCommonActivities: string[];
  weeklyStreak: number;
  improvementAreas: string[];
}

const WeeklyReportTab = () => {
  const { journalEntries } = useStore();
  const { data: weeklyGoalsCount = 0 } = useWeeklyGoalsCount();

  console.log('weeklyGoalsCount', weeklyGoalsCount);

  // Calculate weekly date range
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Filter entries for current week
  const weeklyEntries = journalEntries.filter((entry: any) => {
    const entryDate = new Date(entry.date || entry.created_at);
    return entryDate >= startOfWeek && entryDate <= endOfWeek;
  });

  // Helper functions
  const isRating = (value: string): value is Rating => {
    return ratings.includes(value as Rating);
  };

  const parseQuestionResponses = (notes: string): Record<number, Rating> => {
    const result: Record<number, Rating> = {};
    notes
      .split('\n')
      .slice(1)
      .forEach((line) => {
        const match = line.match(/  - (.*?): (.*)/);
        if (match) {
          const question = match[1];
          const response = match[2];
          if (isRating(response)) {
            const questionIndex = questions.findIndex((q) => q === question);
            if (questionIndex !== -1) {
              result[questionIndex] = response;
            }
          }
        }
      });
    return result;
  };

  const calculateWellnessScore = (notes: string): number => {
    const ratingValues: Record<Rating, number> = {
      Poor: 1,
      Fair: 2,
      Neutral: 3,
      'Very Good': 4,
      Excellent: 5,
    };

    const responses = parseQuestionResponses(notes);
    const validResponses = Object.values(responses)
      .filter((response): response is Rating => isRating(response))
      .map((response) => ratingValues[response]);

    if (validResponses.length === 0) return 1.0;

    const averageScore =
      validResponses.reduce((sum, score) => sum + score, 0) /
      validResponses.length;
    return parseFloat(averageScore.toFixed(1));
  };

  // Calculate comprehensive weekly statistics
  const calculateWeeklyStats = (): WeeklyStats => {
    const journalOnlyEntries = weeklyEntries.filter(
      (entry) =>
        !entry.notes.includes('Daily questionnaire completed') &&
        !entry.notes.includes('Goal completed:'),
    );

    const questionEntries = weeklyEntries.filter((entry) =>
      entry.notes.includes('Daily questionnaire completed'),
    );

    const goalEntries = weeklyEntries.filter((entry) =>
      entry.notes.includes('Goal completed:'),
    );

    // Use actual goals count from database

    // Calculate average wellness score from all question entries
    const wellnessScores = questionEntries.map((entry) =>
      calculateWellnessScore(entry.notes),
    );
    const averageWellnessScore =
      wellnessScores.length > 0
        ? wellnessScores.reduce((sum, score) => sum + score, 0) /
          wellnessScores.length
        : 0;

    // Analyze mood trends
    const moods = journalOnlyEntries
      .map((entry) => entry.mood)
      .filter((mood) => mood && mood.trim() !== '');

    const moodTrend =
      moods.length > 0
        ? moods.length >= 3
          ? 'Consistent tracking'
          : 'Limited data'
        : 'No mood data';

    // Analyze sleep patterns
    const sleepEntries = journalOnlyEntries
      .map((entry) => entry.sleep)
      .filter((sleep) => sleep && sleep.trim() !== '');

    const sleepAverage =
      sleepEntries.length > 0
        ? `${sleepEntries.length} entries logged`
        : 'No sleep data';

    // Extract most common activities
    const allActivities = journalOnlyEntries
      .flatMap((entry) =>
        entry.activities
          ? entry.activities.split(',').map((a) => a.trim())
          : [],
      )
      .filter((activity) => activity !== '');

    const activityCounts = allActivities.reduce(
      (acc, activity) => {
        acc[activity] = (acc[activity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommonActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity);

    // Calculate weekly streak (days with any entry)
    const uniqueDays = new Set(
      weeklyEntries.map((entry: any) => {
        const date = new Date(entry.date || entry.created_at);
        return date.toDateString();
      }),
    );
    const weeklyStreak = uniqueDays.size;

    // Identify improvement areas based on wellness scores
    const improvementAreas: string[] = [];
    if (averageWellnessScore < 3) {
      improvementAreas.push('Overall wellness needs attention');
    }
    if (moods.length < 3) {
      improvementAreas.push('More consistent mood tracking');
    }
    if (sleepEntries.length < 3) {
      improvementAreas.push('Better sleep logging habits');
    }
    if (weeklyGoalsCount < 5) {
      improvementAreas.push('Increase goal completion frequency');
    }

    return {
      totalEntries: weeklyEntries.length,
      journalEntries: journalOnlyEntries.length,
      questionsCompleted: questionEntries.length,
      goalsCompleted: weeklyGoalsCount,
      averageWellnessScore,
      moodTrend,
      sleepAverage,
      mostCommonActivities,
      weeklyStreak,
      improvementAreas,
    };
  };

  const weeklyStats = calculateWeeklyStats();

  // Get most recent question responses for pie chart
  const mostRecentQuestionEntry = weeklyEntries
    .filter((entry) => entry.notes.includes('Daily questionnaire completed'))
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

  const { quote, loading } = useAlternativeQuoteAPI(
    weeklyStats.averageWellnessScore,
  );

  const getIconByLevel = (level: any) => {
    switch (level) {
      case 'SAD':
        return {
          name: 'emoticon-sad-outline',
          lib: 'MaterialCommunityIcons',
          color: '#9CA3AF',
        };
      case 'LOW':
        return { name: 'mood-bad', lib: 'MaterialIcons', color: '#F59E0B' };
      case 'NEUTRAL':
        return { name: 'meh', lib: 'FontAwesome5', color: '#6B7280' };
      case 'GOOD':
        return { name: 'mood', lib: 'MaterialIcons', color: '#10B981' };
      case 'EXCELLENT':
        return {
          name: 'emoticon-excited-outline',
          lib: 'MaterialCommunityIcons',
          color: '#3B82F6',
        };
      default:
        return { name: 'help-outline', lib: 'MaterialIcons', color: '#9CA3AF' };
    }
  };

  const wellnessRating =
    weeklyStats.averageWellnessScore >= 4
      ? 'Excellent'
      : weeklyStats.averageWellnessScore >= 3.5
        ? 'Very Good'
        : weeklyStats.averageWellnessScore >= 3
          ? 'Good'
          : weeklyStats.averageWellnessScore >= 2
            ? 'Fair'
            : 'Poor';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.reportTitle}>Weekly Wellness Report</Text>
      <Text style={styles.dateRange}>
        {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
      </Text>

      {/* Weekly Wellness Score */}
      <View style={styles.wellnessContainer}>
        <Text style={styles.sectionTitle}>Weekly Wellness Score</Text>

        <View style={styles.circularProgress}>
          <View
            style={[
              styles.progressCircle,
              {
                borderColor:
                  wellnessRating === 'Excellent'
                    ? '#2ecc71'
                    : wellnessRating === 'Very Good'
                      ? '#27ae60'
                      : wellnessRating === 'Good'
                        ? '#f39c12'
                        : wellnessRating === 'Fair'
                          ? '#e67e22'
                          : '#e74c3c',
              },
            ]}
          >
            <Text style={styles.wellnessScore}>
              {weeklyStats.averageWellnessScore > 0
                ? weeklyStats.averageWellnessScore.toFixed(1)
                : 'N/A'}
            </Text>
            <Text
              style={[
                styles.wellnessRating,
                {
                  color:
                    wellnessRating === 'Excellent'
                      ? '#2ecc71'
                      : wellnessRating === 'Very Good'
                        ? '#27ae60'
                        : wellnessRating === 'Good'
                          ? '#f39c12'
                          : wellnessRating === 'Fair'
                            ? '#e67e22'
                            : '#e74c3c',
                },
              ]}
            >
              {wellnessRating}
            </Text>
          </View>
        </View>

        {/* Motivational Quote */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading inspiring quote...</Text>
          </View>
        ) : quote ? (
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
        ) : null}
      </View>

      {/* Weekly Activity Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>This Week's Activity</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{weeklyStats.weeklyStreak}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="notebook-edit"
              size={24}
              color="#10B981"
            />
            <Text style={styles.statNumber}>{weeklyStats.journalEntries}</Text>
            <Text style={styles.statLabel}>Journal Entries</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="quiz" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {weeklyStats.questionsCompleted}
            </Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome5 name="trophy" size={24} color="#8B5CF6" />
            <Text style={styles.statNumber}>{weeklyGoalsCount}</Text>
            <Text style={styles.statLabel}>Goals Achieved</Text>
          </View>
        </View>
      </View>

      {/* Weekly Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Weekly Insights</Text>

        <View style={styles.insightItem}>
          <Ionicons name="trending-up" size={20} color="#10B981" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Activity Consistency</Text>
            <Text style={styles.insightValue}>
              {weeklyStats.weeklyStreak === 7
                ? 'Perfect week! 🎉'
                : weeklyStats.weeklyStreak >= 5
                  ? 'Great consistency!'
                  : weeklyStats.weeklyStreak >= 3
                    ? 'Good progress'
                    : 'Room for improvement'}
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={20}
            color="#EF4444"
          />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Top Activities</Text>
            <Text style={styles.insightValue}>
              {weeklyStats.mostCommonActivities.length > 0
                ? weeklyStats.mostCommonActivities.join(', ')
                : 'No activities logged this week'}
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <MaterialIcons name="psychology" size={20} color="#8B5CF6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Wellness Journey</Text>
            <Text style={styles.insightValue}>
              {weeklyStats.averageWellnessScore >= 4
                ? 'Thriving this week!'
                : weeklyStats.averageWellnessScore >= 3
                  ? 'Steady progress'
                  : weeklyStats.averageWellnessScore >= 2
                    ? 'Building momentum'
                    : 'Focus on self-care'}
            </Text>
          </View>
        </View>
      </View>

      {/* Areas for Growth */}
      {weeklyStats.improvementAreas.length > 0 && (
        <View style={styles.improvementContainer}>
          <Text style={styles.sectionTitle}>Growth Opportunities</Text>
          {weeklyStats.improvementAreas.map((area, index) => (
            <View key={index} style={styles.improvementItem}>
              <MaterialIcons
                name="lightbulb-outline"
                size={18}
                color="#F59E0B"
              />
              <Text style={styles.improvementText}>{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weekly Goals Progress */}
      <View style={styles.goalsProgressContainer}>
        <Text style={styles.sectionTitle}>Weekly Goal Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((weeklyGoalsCount / 14) * 100, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {weeklyGoalsCount} goals completed this week
          {weeklyGoalsCount >= 14 && ' 🎯 Amazing!'}
        </Text>
      </View>

      {/* Pie Chart for Latest Questionnaire */}
      {mostRecentQuestionEntry && (
        <View style={styles.chartContainer}>
          <DailyQuestionsPieChart
            questionResponses={parseQuestionResponses(
              mostRecentQuestionEntry.notes,
            )}
          />
        </View>
      )}

      {/* Weekly Encouragement */}
      <View style={styles.encouragementContainer}>
        <Text style={styles.encouragementTitle}>
          {weeklyStats.weeklyStreak === 7
            ? 'Perfect Week!'
            : weeklyStats.weeklyStreak >= 5
              ? 'Strong Week!'
              : weeklyStats.weeklyStreak >= 3
                ? 'Good Progress!'
                : 'Keep Building!'}
        </Text>
        <Text style={styles.encouragementText}>
          {weeklyStats.weeklyStreak === 7
            ? "You've been consistent every day this week. Your dedication is inspiring!"
            : weeklyStats.weeklyStreak >= 5
              ? "You're showing great commitment to your wellness journey!"
              : weeklyStats.weeklyStreak >= 3
                ? "You're building healthy habits. Keep up the momentum!"
                : 'Every small step counts. Tomorrow is a new opportunity to grow!'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#2c3e50',
  },
  dateRange: {
    fontSize: 14,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 20,
  },
  wellnessContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2c3e50',
  },
  circularProgress: {
    alignItems: 'center',
    marginVertical: 15,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  wellnessScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  wellnessRating: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#7f8c8d',
  },
  quoteContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#2c3e50',
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'right',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  insightContent: {
    marginLeft: 15,
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  insightValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  improvementContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  improvementText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  goalsProgressContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  chartContainer: {
    margin: 15,
  },
  encouragementContainer: {
    backgroundColor: '#e8f4fd',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 60,
  },
  encouragementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default WeeklyReportTab;
