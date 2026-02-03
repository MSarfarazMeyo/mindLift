export type PetType = "cat" | "fox" | "dragon" | "robot";

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  level: number;
  xp: number;
  happiness: number;
  health: number;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  intensity: number;
  note?: string;
  aiResponse?: string;
  timestamp: string;
}

export type MoodType =
  | "happy"
  | "calm"
  | "anxious"
  | "sad"
  | "stressed"
  | "excited"
  | "tired"
  | "angry";

export interface Habit {
  id: string;
  title: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  streak: number;
  lastCompleted?: string;
  lastResetDate?: string;
}

export interface PetStats {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  habitsCompleted: number;
  moodEntriesCount: number;
  daysWithPet: number;
}
