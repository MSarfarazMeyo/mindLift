import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  Pet,
  MoodEntry,
  Habit,
  PetStats,
  MoodType,
  PetType,
} from '@/types/pet';
import { DEFAULT_HABITS, XP_PER_LEVEL } from '@/constants/petConfig';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const createDefaultPet = (): Pet => ({
  id: Date.now().toString(),
  name: 'Buddy',
  type: 'cat',
  level: 1,
  xp: 0,
  happiness: 80,
  health: 100,
  createdAt: new Date().toISOString(),
});

export const [PetProvider, usePet] = createContextHook(() => {
  const [pet, setPet] = useState<Pet>(createDefaultPet());
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const addPoints = useStore((state) => state.addPoints);
  const queryClient = useQueryClient();

  const getCurrentUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  };

  const petQuery = useQuery({
    queryKey: ['pet'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return createDefaultPet();

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        const defaultPet = createDefaultPet();
        const { data: newPet } = await supabase
          .from('pets')
          .insert({
            id: defaultPet.id,
            user_id: userId,
            name: defaultPet.name,
            type: defaultPet.type,
            level: defaultPet.level,
            xp: defaultPet.xp,
            happiness: defaultPet.happiness,
            health: defaultPet.health,
            created_at: defaultPet.createdAt,
          })
          .select()
          .single();
        return {
          ...defaultPet,
          createdAt: newPet?.created_at || defaultPet.createdAt,
        };
      }
      const petResult = { ...data, createdAt: data.created_at };
      return petResult;
    },
  });

  const moodsQuery = useQuery({
    queryKey: ['moods'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data } = await supabase
        .from('pet_mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      const mappedMoods = (data || []).map((entry) => ({
        ...entry,
        aiResponse: entry.ai_response,
      }));
      return mappedMoods;
    },
  });

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      if (!data || data.length === 0) {
        const defaultHabits = DEFAULT_HABITS.map((h, index) => ({
          id: `${userId}_habit_${index + 1}`,
          user_id: userId,
          name: h.title,
          icon: h.icon,
          xp_reward: h.xpReward,
          frequency: 'daily',
          category: 'wellness',
          completed: false,
          streak: 0,
          last_completed: null,
        }));
        const { data: upsertData, error: insertError } = await supabase
          .from('habits')
          .upsert(defaultHabits, { onConflict: 'id' })
          .select();

        // Verify the insert worked
        const { data: verifyData } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId);
        const mappedHabits = defaultHabits.map((h) => ({
          ...h,
          xpReward: h.xp_reward,
          lastCompleted: h.last_completed,
        }));
        return mappedHabits;
      }
      const today = new Date().toDateString();
      const mappedHabits = data.map((h) => {
        const lastCompletedDate = h.last_completed
          ? new Date(h.last_completed).toDateString()
          : null;
        const isNewDay = lastCompletedDate !== today;

        return {
          ...h,
          xpReward: h.xp_reward,
          lastCompleted: h.last_completed,
          completed: isNewDay ? false : h.completed, // Reset completed status if it's a new day
        };
      });
      return mappedHabits;
    },
  });

  const savePetMutation = useMutation({
    mutationFn: async (newPet: Pet) => {
      const userId = await getCurrentUserId();
      if (!userId) return newPet;

      const { data } = await supabase
        .from('pets')
        .update({
          name: newPet.name,
          type: newPet.type,
          level: newPet.level,
          xp: newPet.xp,
          happiness: newPet.happiness,
          health: newPet.health,
        })
        .eq('user_id', userId)
        .select()
        .single();

      return { ...newPet, createdAt: data?.created_at || newPet.createdAt };
    },
    onSuccess: (newPet) => {
      setPet(newPet);
      queryClient.invalidateQueries({ queryKey: ['pet'] });
    },
  });

  const { mutate: mutateMoods } = useMutation({
    mutationFn: async (newMood: MoodEntry) => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data: insertData, error: insertError } = await supabase
        .from('pet_mood_entries')
        .insert({
          id: newMood.id,
          user_id: userId,
          mood: newMood.mood,
          intensity: newMood.intensity,
          note: newMood.note,
          ai_response: newMood.aiResponse,
        })
        .select();

      const { data } = await supabase
        .from('pet_mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      return (data || []).map((entry) => ({
        ...entry,
        aiResponse: entry.ai_response,
      }));
    },
    onSuccess: (newMoods) => {
      setMoods(newMoods);
      queryClient.invalidateQueries({ queryKey: ['moods'] });
    },
  });

  const { mutate: mutateHabits } = useMutation({
    mutationFn: async (updatedHabit: Habit) => {
      const userId = await getCurrentUserId();
      if (!userId) return updatedHabit;

      const { data } = await supabase
        .from('habits')
        .update({
          completed: updatedHabit.completed,
          streak: updatedHabit.streak,
          last_completed: updatedHabit.lastCompleted,
        })
        .eq('id', updatedHabit.id)
        .eq('user_id', userId)
        .select()
        .single();

      return {
        ...updatedHabit,
        xpReward: data?.xp_reward || updatedHabit.xpReward,
      };
    },
    onSuccess: (updatedHabit) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h)),
      );
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  useEffect(() => {
    if (petQuery.data) {
      setPet(petQuery.data);
    }
  }, [petQuery.data]);

  useEffect(() => {
    if (moodsQuery.data) {
      setMoods(moodsQuery.data);
    }
  }, [moodsQuery.data]);

  useEffect(() => {
    if (habitsQuery.data) {
      setHabits(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  const { mutate: mutatePet } = savePetMutation;

  const addXP = useCallback(
    (amount: number) => {
      let newXP = pet.xp + amount;
      let newLevel = pet.level;
      let newHappiness = Math.min(100, pet.happiness + 5);
      let levelsGained = 0;

      while (newLevel < 5 && newXP >= XP_PER_LEVEL(newLevel)) {
        newXP -= XP_PER_LEVEL(newLevel);
        newLevel += 1;
        levelsGained += 1;
        newHappiness = Math.min(100, newHappiness + 10);
      }

      if (newLevel >= 5) {
        newXP = 0;
        newLevel = 5;
      }

      // Add 500 MindLift points for each level gained
      if (levelsGained > 0) {
        addPoints(levelsGained * 500);
      }

      const updatedPet = {
        ...pet,
        xp: newXP,
        level: newLevel,
        happiness: newHappiness,
      };

      mutatePet(updatedPet);
    },
    [pet, mutatePet, addPoints],
  );

  const addMood = useCallback(
    (mood: MoodType, intensity: number, note?: string, aiResponse?: string) => {
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      };

      const newMood: MoodEntry = {
        id: generateUUID(),
        mood,
        intensity,
        note,
        aiResponse,
        timestamp: new Date().toISOString(),
      };

      mutateMoods(newMood);
      addXP(15);
    },
    [mutateMoods, addXP],
  );

  const toggleHabit = useCallback(
    (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCompleting = !habit.completed;
      const today = new Date().toDateString();
      const lastCompletedDate = habit.lastCompleted
        ? new Date(habit.lastCompleted).toDateString()
        : null;
      const isNewDay = lastCompletedDate !== today;

      // Update local state immediately
      const updatedHabit = {
        ...habit,
        completed: isCompleting,
        streak: isCompleting && isNewDay ? habit.streak + 1 : habit.streak,
        lastCompleted: isCompleting
          ? new Date().toISOString()
          : habit.lastCompleted,
      };

      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? updatedHabit : h)),
      );

      if (isCompleting) {
        addXP(habit.xpReward);
      }

      // Sync to database
      mutateHabits(updatedHabit);
    },
    [habits, mutateHabits, addXP],
  );

  const updatePetName = useCallback(
    (name: string) => {
      const updatedPet = { ...pet, name };
      mutatePet(updatedPet);
    },
    [pet, mutatePet],
  );

  const updatePetType = useCallback(
    (type: PetType) => {
      const updatedPet = { ...pet, type };
      mutatePet(updatedPet);
    },
    [pet, mutatePet],
  );

  const getStats = useCallback((): PetStats => {
    // Use fresh query data instead of state to ensure accuracy
    const currentMoods = moodsQuery.data || [];
    const currentHabits = habitsQuery.data || [];

    const totalXP = pet.xp;

    // Count habits that have been completed at least once
    const habitsCompleted = currentHabits.filter((h) => h.lastCompleted).length;

    // Get current streaks from habits
    const streaks = currentHabits.map((h) => h.streak || 0);
    const currentStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const longestStreak = currentStreak;

    const createdDate = new Date(pet.createdAt);
    const today = new Date();
    const daysWithPet = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const stats = {
      totalXP,
      currentStreak,
      longestStreak,
      habitsCompleted,
      moodEntriesCount: currentMoods.length,
      daysWithPet: Math.max(1, daysWithPet),
    };

    return stats;
  }, [pet, moodsQuery.data, habitsQuery.data]);

  return {
    pet,
    moods,
    habits,
    addXP,
    addMood,
    toggleHabit,

    updatePetName,
    updatePetType,
    getStats,
    isLoading:
      petQuery.isLoading || moodsQuery.isLoading || habitsQuery.isLoading,
  };
});
