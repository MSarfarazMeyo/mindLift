import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { supabase, supabaseAdmin } from './supabase';
import { DAILY_GOALS } from '@/components/journalTab/GoalsTab';

// Interfaces
interface MoodEntry {
  id?: string;
  date: string;
  mood: number;
  note: string;
  user_id?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  mood: string;
  sleep: string;
  activities: string;
  notes: string;
  user_id?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: 'monthly' | 'yearly' | 'lifetime' | 'trial';
  status: 'active' | 'canceled' | 'expired';
  start_date: string;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  type: 'monthly' | 'yearly' | 'lifetime' | 'trial';
  description: string;
  features: string[];
  is_popular?: boolean;
}

interface Achievement {
  // id?: string;
  // user_id: string;
  // total_points: number;
  // login_streak: number;
  // questions_answered: number;
  // notes_written: number;
  // last_login_date?: string | null;
  // last_questions_date?: string | null;
  // created_at?: string;
  // updated_at?: string;

  id?: string;
  user_id: string;
  total_points: number;
  login_streak: number;
  questions_answered: number;
  notes_written: number;
  last_login_date?: string | null;
  last_questions_date?: string | null;
  created_at?: string;
  updated_at?: string;

  last_journal_date?: string | null;
  last_goals_date?: string | null;
  last_chat_date?: string | null;

  goals_added: number;
  chats_today: number;
  chat_points_today: number;
}

type AchievementType = 'questions' | 'journal' | 'goals';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  subscription: any;
  subscription_id?: string | null;
  payment_id?: string | null;
  on_boarded?: boolean;
  created_at?: string;
  profile_completed?: boolean;
}

interface AppState {
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  userProfile: UserProfile | null;
  achievement: Achievement | null;
  subscription: Subscription | null;
  subscriptionPlans: SubscriptionPlan[];
  loading: boolean;
  loadingSubscription: boolean;
  error: string | null;

  // Mood entry operations
  addMoodEntry: (entry: Omit<MoodEntry, 'user_id'>) => Promise<void>;
  updateMoodEntry: (
    id: string,
    updates: Partial<Omit<MoodEntry, 'id' | 'user_id'>>,
  ) => Promise<void>;
  deleteMoodEntry: (id: string) => Promise<void>;

  // Journal entry operations
  updateJournalEntry: (
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'user_id'>>,
  ) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Profile operations
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: any }>;

  // Stats and achievements
  getMoodStats: () => {
    positivePercentage: number;
    streak: number;
    avgMood: number;
  };
  addPoints: (points: number) => Promise<void>;
  addChatPoints: () => Promise<void>;
  updateLoginStreak: () => Promise<void>;
  getRank: () => string;
  getNextRank: () => { rank: string; pointsNeeded: number };
  canDoJournalAction: (type: AchievementType) => boolean;
  addJournalAndAchievementEntry: (
    type: AchievementType,
    payload: any,
    points: number,
    count?: number,
  ) => Promise<void>;

  syncAchievements: () => Promise<void>;
  resetAchievements: () => Promise<void>;

  // General operations
  loadUserData: () => Promise<void>;
  reset: () => Promise<{ success: boolean; error?: any }>;
}

// Helper functions
const getDefaultAchievement = (userId: string): any => ({
  user_id: userId,
  total_points: 0,
  login_streak: 0,
  questions_answered: 0,
  notes_written: 0,
  goals_added: 0,
  chats_today: 0,
  chat_points_today: 0,
  last_goals_date: null,
  last_login_date: null,
  last_questions_date: null,
  last_chat_date: null,
});

const getRankFromPoints = (points: number): string => {
  if (points >= 50000) return 'Mythic';
  if (points >= 36000) return 'Legend';
  if (points >= 26000) return 'Grandmaster';
  if (points >= 20000) return 'Master';
  if (points >= 16000) return 'Champion';
  if (points >= 12000) return 'Elite';
  if (points >= 8000) return 'Diamond';
  if (points >= 4000) return 'Emerald';
  if (points >= 2000) return 'Gold';
  if (points >= 1000) return 'Silver';
  if (points >= 500) return 'Bronze';
  return 'Novice';
};

const getNextRankInfo = (points: number) => {
  const ranks = [
    { threshold: 0, name: 'Novice' },
    { threshold: 200, name: 'Bronze' },
    { threshold: 500, name: 'Silver' },
    { threshold: 1000, name: 'Gold' },
    { threshold: 2000, name: 'Platinum' },
    { threshold: 3500, name: 'Diamond' },
    { threshold: 5500, name: 'Master' },
    { threshold: 10000, name: 'Grandmaster' },
  ];

  let currentRankIndex = 0;
  let nextRankIndex = 1;

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (points >= ranks[i].threshold) {
      currentRankIndex = i;
      nextRankIndex = Math.min(i + 1, ranks.length - 1);
      break;
    }
  }

  return {
    rank: ranks[nextRankIndex].name,
    pointsNeeded: ranks[nextRankIndex].threshold - points,
  };
};

const initialState = {
  moodEntries: [],
  journalEntries: [],
  userProfile: null,
  achievement: null,
  subscription: null,
  subscriptionPlans: [],
  loading: false,
  loadingSubscription: false,
  error: null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addJournalAndAchievementEntry: async (
        type,
        payload,
        points,
        count = 1,
      ) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const today = format(new Date(), 'yyyy-MM-dd');

          // --- Insert only if journal or goals ---
          const entryWithUserId = { ...payload, user_id: user.id };
          const { data, error } = await supabase
            .from('journal_entries')
            .insert(entryWithUserId)
            .select()
            .single();
          if (error) throw error;
          set((state) => ({ journalEntries: [data, ...state.journalEntries] }));

          // --- Update achievement ---
          const state = get();
          if (!state.achievement) return;

          const achievement = { ...state.achievement };

          switch (type) {
            case 'questions':
              achievement.questions_answered += count;
              achievement.last_questions_date = today;
              break;
            case 'journal':
              achievement.notes_written += count;
              achievement.last_journal_date = today;
              break;
            case 'goals':
              achievement.goals_added += count;
              achievement.last_goals_date = today;
              break;
          }

          achievement.total_points += points;

          set({ achievement });
          await get().syncAchievements();
        } catch (error) {
          console.error(`Error adding ${type} entry:`, error);
          set({ error: `Failed to add ${type} entry` });
          throw error;
        }
      },

      // Mood Entry Operations
      addMoodEntry: async (entry) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const entryWithUserId = { ...entry, user_id: user.id };
          const { data, error } = await supabase
            .from('mood_entries')
            .insert(entryWithUserId)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            moodEntries: [...state.moodEntries, data],
          }));
        } catch (error) {
          console.error('Error adding mood entry:', error);
          set({ error: 'Failed to add mood entry' });
          throw error;
        }
      },

      canDoJournalAction: (type: AchievementType) => {
        const achievement = get().achievement;
        if (!achievement) return true;

        const today = format(new Date(), 'yyyy-MM-dd');

        switch (type) {
          case 'questions':
            return achievement.last_questions_date !== today;

          case 'journal':
            return achievement.last_journal_date !== today;

          case 'goals':
            return achievement.last_goals_date !== today;

          default:
            return true;
        }
      },

      updateMoodEntry: async (id, updates) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('mood_entries')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            moodEntries: state.moodEntries.map((entry) =>
              entry.id === id ? { ...entry, ...data } : entry,
            ),
          }));
        } catch (error) {
          console.error('Error updating mood entry:', error);
          set({ error: 'Failed to update mood entry' });
          throw error;
        }
      },

      deleteMoodEntry: async (id) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('mood_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            moodEntries: state.moodEntries.filter((entry) => entry.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting mood entry:', error);
          set({ error: 'Failed to delete mood entry' });
          throw error;
        }
      },

      updateJournalEntry: async (id, updates) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('journal_entries')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            journalEntries: state.journalEntries.map((entry) =>
              entry.id === id ? { ...entry, ...data } : entry,
            ),
          }));
        } catch (error) {
          console.error('Error updating journal entry:', error);
          set({ error: 'Failed to update journal entry' });
          throw error;
        }
      },

      deleteJournalEntry: async (id) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            journalEntries: state.journalEntries.filter(
              (entry) => entry.id !== id,
            ),
          }));
        } catch (error) {
          console.error('Error deleting journal entry:', error);
          set({ error: 'Failed to delete journal entry' });
          throw error;
        }
      },

      // Profile Operations
      updateProfile: async (profile) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', user.id);

          if (error) throw error;

          set((state) => ({
            userProfile: state.userProfile
              ? { ...state.userProfile, ...profile }
              : null,
          }));
        } catch (error) {
          console.error('Error updating profile:', error);
          set({ error: 'Failed to update profile' });
          throw error;
        }
      },

      deleteAccount: async () => {
        try {
          set({ loading: true, error: null });
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // Delete user data in sequence
          const deleteOperations = [
            // Delete mood entries
            supabase.from('mood_entries').delete().eq('user_id', user.id),
            // Delete journal entries
            supabase.from('journal_entries').delete().eq('user_id', user.id),
            // Delete achievements
            supabase.from('achievements').delete().eq('user_id', user.id),
            // Delete subscriptions
            supabase.from('subscriptions').delete().eq('user_id', user.id),
            // Delete profile
            supabase.from('profiles').delete().eq('id', user.id),
          ];

          // Execute all delete operations
          const results = await Promise.allSettled(deleteOperations);

          // Check if any critical operations failed
          const failedOperations = results.filter(
            (result) =>
              result.status === 'rejected' ||
              (result.status === 'fulfilled' && result.value.error),
          );

          if (failedOperations.length > 0) {
            console.warn(
              'Some data deletion operations failed:',
              failedOperations,
            );
            // Continue with account deletion even if some data couldn't be deleted
          }

          // Delete the actual auth user account
          const { error: deleteUserError } =
            await supabaseAdmin.auth.admin.deleteUser(user.id);

          if (deleteUserError) {
            // If admin delete fails, try regular sign out
            console.warn(
              'Admin delete failed, signing out instead:',
              deleteUserError,
            );
            await supabase.auth.signOut();
          }

          // Clear local storage and reset state
          const onBoarded = await AsyncStorage.getItem('on_boarded');
          await AsyncStorage.clear();
          if (onBoarded) {
            await AsyncStorage.setItem('on_boarded', onBoarded);
          }
          set(initialState);

          return { success: true };
        } catch (error) {
          console.error('Error deleting account:', error);
          set({ error: 'Failed to delete account', loading: false });
          return { success: false, error };
        } finally {
          set({ loading: false });
        }
      },

      // Mood statistics
      getMoodStats: () => {
        const entries = get().moodEntries;
        if (entries.length === 0)
          return { positivePercentage: 0, streak: 0, avgMood: 0 };

        const positiveCount = entries.filter((entry) => entry.mood >= 4).length;
        const positivePercentage = (positiveCount / entries.length) * 100;

        let streak = 0;
        const today = new Date();
        const dates = new Set(entries.map((e) => e.date));

        while (streak < entries.length) {
          const dateStr = format(
            new Date(today.setDate(today.getDate() - streak)),
            'yyyy-MM-dd',
          );
          if (!dates.has(dateStr)) break;
          streak++;
        }

        const avgMood =
          entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
        return { positivePercentage, streak, avgMood };
      },

      // Achievement actions
      addPoints: async (points) => {
        try {
          const state = get();
          if (!state.achievement) return;

          const newPoints = Math.max(
            0,
            state.achievement.total_points + points,
          );

          set({
            achievement: {
              ...state.achievement,
              total_points: newPoints,
            },
          });

          await get().syncAchievements();
        } catch (error) {
          console.error('Error adding points:', error);
          set({ error: 'Failed to add points' });
          throw error;
        }
      },

      addChatPoints: async () => {
        try {
          const state = get();
          if (!state.achievement) return;

          const today = format(new Date(), 'yyyy-MM-dd');
          const achievement = { ...state.achievement };

          // Ensure chat fields exist with defaults
          achievement.chats_today = achievement.chats_today || 0;
          achievement.chat_points_today = achievement.chat_points_today || 0;
          achievement.last_chat_date = achievement.last_chat_date || null;

          // Reset daily counters if it's a new day
          if (achievement.last_chat_date !== today) {
            achievement.chats_today = 0;
            achievement.chat_points_today = 0;
            achievement.last_chat_date = today;
          }

          // Increment chat count
          achievement.chats_today += 1;

          // Award points every 10 chats, max 1000 points per day
          if (
            achievement.chats_today % 10 === 0 &&
            achievement.chat_points_today < 1000
          ) {
            const pointsToAdd = Math.min(
              500,
              1000 - achievement.chat_points_today,
            );
            achievement.total_points += pointsToAdd;
            achievement.chat_points_today += pointsToAdd;
          }

          set({ achievement });
          await get().syncAchievements();
        } catch (error) {
          console.error('Error adding chat points:', error);
          set({ error: 'Failed to add chat points' });
          throw error;
        }
      },

      updateLoginStreak: async () => {
        try {
          const state = get();
          if (!state.achievement) return;

          const today = format(new Date(), 'yyyy-MM-dd');
          if (state.achievement.last_login_date === today) return;

          const yesterday = format(
            new Date(new Date().setDate(new Date().getDate() - 1)),
            'yyyy-MM-dd',
          );
          const streak =
            state.achievement.last_login_date === yesterday
              ? state.achievement.login_streak + 1
              : 1;

          const pointsToAdd = 100 + 50 * streak;

          set({
            achievement: {
              ...state.achievement,
              last_login_date: today,
              login_streak: streak,
              total_points: Math.max(
                0,
                state.achievement.total_points + pointsToAdd,
              ),
            },
          });

          await get().syncAchievements();
        } catch (error) {
          console.error('Error updating login streak:', error);
          set({ error: 'Failed to update login streak' });
          throw error;
        }
      },

      getRank: () => {
        const achievement = get().achievement;
        return achievement
          ? getRankFromPoints(achievement.total_points)
          : 'Novice';
      },

      getNextRank: () => {
        const achievement = get().achievement;
        return achievement
          ? getNextRankInfo(achievement.total_points)
          : { rank: 'Bronze', pointsNeeded: 200 };
      },

      resetAchievements: async () => {
        try {
          set({ loading: true, error: null });
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ achievement: null, loading: false });
            return;
          }

          const state = get();
          const currentAchievement =
            state.achievement || getDefaultAchievement(user.id);

          // Try to update existing record
          const { data, error: updateError } = await supabase
            .from('achievements')
            .upsert({
              ...currentAchievement,
              total_points: 0,
              login_streak: 0,
              questions_answered: 0,
              notes_written: 0,
              goals_added: 0,
              chats_today: 0,
              chat_points_today: 0,
              last_goals_date: null,
              last_login_date: null,
              last_questions_date: null,
              last_chat_date: null,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (updateError) {
            // If update fails, try to insert
            const { data: insertData, error: insertError } = await supabase
              .from('achievements')
              .insert({
                ...currentAchievement,
                total_points: 0,
                login_streak: 0,
                questions_answered: 0,
                notes_written: 0,
                goals_added: 0,
                chats_today: 0,
                chat_points_today: 0,
                last_goals_date: null,
                last_login_date: null,
                last_questions_date: null,
                last_chat_date: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (insertError) throw insertError;
            set({ achievement: insertData, loading: false });
          } else {
            set({ achievement: data, loading: false });
          }
        } catch (error) {
          console.error('Error syncing achievements:', error);
          set({ error: 'Failed to sync achievements', loading: false });
          throw error;
        }
      },

      syncAchievements: async () => {
        try {
          set({ loading: true, error: null });
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ achievement: null, loading: false });
            return;
          }

          const state = get();
          const currentAchievement =
            state.achievement || getDefaultAchievement(user.id);

          // Try to update existing record
          const { data, error: updateError } = await supabase
            .from('achievements')
            .upsert({
              ...currentAchievement,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (updateError) {
            // If update fails, try to insert
            const { data: insertData, error: insertError } = await supabase
              .from('achievements')
              .insert({
                ...currentAchievement,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (insertError) throw insertError;
            set({ achievement: insertData, loading: false });
          } else {
            set({ achievement: data, loading: false });
          }
        } catch (error) {
          console.error('Error syncing achievements:', error);
          set({ error: 'Failed to sync achievements', loading: false });
          throw error;
        }
      },

      // General actions
      loadUserData: async () => {
        try {
          set({ loading: true, error: null });
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            set(initialState);
            return;
          }

          // Execute all requests in parallel
          const [
            profileResponse,
            achievementResponse,
            moodEntriesResponse,
            journalEntriesResponse,
            subscriptionResponse,
          ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase
              .from('achievements')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('mood_entries')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false }),
            supabase
              .from('journal_entries')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false }),
            supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          // Check for errors
          if (profileResponse.error) throw profileResponse.error;
          if (achievementResponse.error) throw achievementResponse.error;
          if (moodEntriesResponse.error) throw moodEntriesResponse.error;
          if (journalEntriesResponse.error) throw journalEntriesResponse.error;

          // Handle achievement data
          let achievement = achievementResponse.data
            ? {
                ...getDefaultAchievement(user.id),
                ...achievementResponse.data,
                last_login_date:
                  achievementResponse.data.last_login_date || null,
                last_questions_date:
                  achievementResponse.data.last_questions_date || null,
                chats_today: achievementResponse.data.chats_today || 0,
                chat_points_today:
                  achievementResponse.data.chat_points_today || 0,
                last_chat_date: achievementResponse.data.last_chat_date || null,
              }
            : getDefaultAchievement(user.id);

          // Reset daily chat counters if it's a new day
          const today = format(new Date(), 'yyyy-MM-dd');
          if (
            achievement.last_chat_date &&
            achievement.last_chat_date !== today
          ) {
            achievement.chats_today = 0;
            achievement.chat_points_today = 0;
          }

          // Update login streak if needed
          if (
            !achievement.last_login_date ||
            achievement.last_login_date !== today
          ) {
            const yesterday = format(
              new Date(new Date().setDate(new Date().getDate() - 1)),
              'yyyy-MM-dd',
            );
            const streak =
              achievement.last_login_date === yesterday
                ? achievement.login_streak + 1
                : 1;

            achievement = {
              ...achievement,
              last_login_date: today,
              login_streak: streak,
              total_points: achievement.total_points + 100 + 50 * streak,
            };

            // Update in database
            await supabase.from('achievements').upsert(achievement);
          }

          set({
            userProfile: profileResponse.data,
            achievement,
            moodEntries: moodEntriesResponse.data || [],
            journalEntries: journalEntriesResponse.data || [],
            subscription:
              subscriptionResponse.error?.code === '42P01'
                ? null
                : subscriptionResponse.data || null,
            loading: false,
          });
        } catch (error) {
          console.error('Error loading user data:', error);
          set({ error: 'Failed to load user data', loading: false });
          throw error;
        }
      },

      reset: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Error signing out from Supabase:', error);
          }
          const onBoarded = await AsyncStorage.getItem('on_boarded');
          await AsyncStorage.clear();
          if (onBoarded) {
            await AsyncStorage.setItem('on_boarded', onBoarded);
          }
          set(initialState);
          return { success: true };
        } catch (error) {
          console.error('Error resetting store:', error);
          return { success: false, error };
        }
      },
    }),
    {
      name: 'mindwell-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        achievement: state.achievement,
        subscription: state.subscription,
      }),
    },
  ),
);
