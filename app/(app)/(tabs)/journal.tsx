import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useStore } from '../../../lib/store';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { showError, showInfo, showSuccess } from '@/lib/toastMessage';
import JournalTab from '@/components/journalTab/JournalTab';
import QuestionsTab from '@/components/journalTab/QuestionsTab';
import GoalsTab, { DAILY_GOALS } from '@/components/journalTab/GoalsTab';
import WeeklyReportTab, { ratings } from '@/components/EnhancedWeeklyReport';
const screenWidth = Dimensions.get('window').width;

type Rating = 'Poor' | 'Fair' | 'Neutral' | 'Very Good' | 'Excellent';

export default function JournalScreen() {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    (params.tab as string) || 'journal',
  );
  const [journalEntry, setJournalEntry] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [sleep, setSleep] = useState<string>('');
  const [activities, setActivities] = useState<string>('');
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);
  const [loading, setLoding] = useState<boolean>(false);

  const [questionResponses, setQuestionResponses] = useState<
    Record<number, Rating>
  >({});

  const { journalEntries, addJournalAndAchievementEntry } = useStore();

  const showPointsNotification = (points: number) => {
    Alert.alert('Points Gained', `You have gained ${points} points!`);
  };

  const handleSaveJournal = async () => {
    if (!journalEntry.trim()) {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }

    try {
      setLoding(true);

      const entry = {
        id: Crypto.randomUUID(),
        date: new Date().toISOString(),
        mood,
        sleep,
        activities,
        notes: journalEntry,
      };

      try {
        setActiveTab('report');
        showPointsNotification(100);

        await addJournalAndAchievementEntry('journal', entry, 100);
      } catch (error) {
        console.warn(
          'Could not update achievements, but journal was saved:',
          error,
        );
        Alert.alert(
          'Partial Success',
          'Journal saved, but points could not be updated. Please check your permissions.',
        );
      }

      setJournalEntry('');
      setMood('');
      setSleep('');
      setActivities('');
      setActiveTab('report');
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string };
      console.error('Error saving journal:', supabaseError);
      Alert.alert(
        'Error',
        supabaseError.code === '42501'
          ? 'Permission denied. Please check your account settings.'
          : 'Failed to save journal entry',
      );
    } finally {
      setLoding(false);
    }
  };

  const handleQuestionRating = (questionIndex: number, rating: Rating) => {
    setQuestionResponses((prev) => ({
      ...prev,
      [questionIndex]: rating,
    }));
  };

  const handleGoalComplete = async (goalId: string) => {
    try {
      setLoding(true);
      if (completedGoals.includes(goalId)) {
        showInfo(
          'Already Completed',
          'You have already completed this goal today!',
        );
        return;
      }

      const goal = DAILY_GOALS.find((g) => g.id === goalId);
      if (!goal) return;

      const newCompletedGoals = [...completedGoals, goalId];
      setCompletedGoals(newCompletedGoals);
      // Check if all goals are completed
      if (newCompletedGoals.length === DAILY_GOALS.length) {
        // Save goal completion to journal entries for tracking
        const goalEntry = {
          id: Crypto.randomUUID(),
          date: new Date().toISOString(),
          mood: '',
          sleep: '',
          activities: '',
          notes: `Goal completed: ${goal.title} - ${goal.description} (+${goal.points} points)`,
        };

        showPointsNotification(30 * newCompletedGoals.length);
        setActiveTab('report');

        await addJournalAndAchievementEntry(
          'goals',
          goalEntry,
          newCompletedGoals.length * 30,
          newCompletedGoals.length,
        );
      } else {
        showSuccess('Goal Completed', 'You have earned 30n points!');
      }
    } catch (error) {
    } finally {
      setLoding(false);
    }
  };

  const handleSubmitResponses = async () => {
    if (Object.keys(questionResponses).length < questions.length) {
      showError('Error', 'Please answer all questions');
      return;
    }

    try {
      setLoding(true);
      const formattedNotes = `Daily questionnaire completed with responses:\n${questions
        .map(
          (question, index) =>
            `  - ${question}: ${questionResponses[index] || 'Not answered'}`,
        )
        .join('\n')}`;

      const entry = {
        id: Crypto.randomUUID(),
        date: new Date().toISOString(),
        mood,
        sleep,
        activities,
        notes: formattedNotes,
      };

      showPointsNotification(50 * questions.length);
      setQuestionResponses({});
      setActiveTab('report');
      await addJournalAndAchievementEntry(
        'questions',
        entry,
        questions.length * 50,
        questions.length,
      );
    } catch (error) {
      console.error('Error submitting responses:', error);
      Alert.alert('Error', 'Failed to submit responses');
    } finally {
      setLoding(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal & Check-in</Text>
        <Text style={styles.subtitle}>Track your journey to wellness</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={[
          styles.tabsContainer,
          { minWidth: screenWidth },
        ]}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.activeTab]}
          onPress={() => setActiveTab('journal')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'journal' && styles.activeTabText,
            ]}
          >
            Journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
          onPress={() => setActiveTab('questions')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'questions' && styles.activeTabText,
            ]}
          >
            Daily Questions
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
          onPress={() => setActiveTab('goals')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'goals' && styles.activeTabText,
            ]}
          >
            Goals
          </Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'report' && styles.activeTabText,
            ]}
          >
            Weekly Report
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {activeTab === 'journal' ? (
        <JournalTab
          journalEntry={journalEntry}
          setJournalEntry={setJournalEntry}
          mood={mood}
          setMood={setMood}
          sleep={sleep}
          setSleep={setSleep}
          activities={activities}
          setActivities={setActivities}
          loading={loading}
          handleSaveJournal={handleSaveJournal}
        />
      ) : activeTab === 'questions' ? (
        <QuestionsTab
          questions={questions}
          ratings={ratings}
          questionResponses={questionResponses}
          handleQuestionRating={handleQuestionRating}
          handleSubmitResponses={handleSubmitResponses}
          loading={loading}
        />
      ) : activeTab === 'goals' ? (
        <GoalsTab
          completedGoals={completedGoals}
          handleGoalComplete={handleGoalComplete}
          loading={loading}
        />
      ) : (
        <WeeklyReportTab />
      )}
    </ScrollView>
  );
}

export const questions = [
  'How would you rate your overall mood today?',
  'How well did you sleep last night?',
  'How would you rate your anxiety level today?',
  'How productive do you feel today?',
  'How satisfied are you with your social interactions today?',
  'How would you rate your energy level today?',
  'How well did you manage stress today?',
  'How mindful or present were you throughout the day?',
  'How would you rate your self-care practices today?',
  'How optimistic do you feel about tomorrow?',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  tabs: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 20,
  },

  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  wellnessContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  wellnessScoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  wellnessScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  wellnessRating: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  wellnessGreat: {
    color: '#2ecc71',
  },
  wellnessGood: {
    color: '#27ae60',
  },
  wellnessFair: {
    color: '#f39c12',
  },
  wellnessPoor: {
    color: '#e74c3c',
  },
});
