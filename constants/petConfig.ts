export const PET_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Newborn' },
  { level: 2, xpRequired: 100, title: 'Growing' },
  { level: 3, xpRequired: 300, title: 'Thriving' },
  { level: 4, xpRequired: 600, title: 'Flourishing' },
  { level: 5, xpRequired: 1000, title: 'Radiant' },
];

export const XP_PER_LEVEL = (level: number): number => {
  if (level >= 5) return 0;
  return PET_LEVELS[level].xpRequired;
};

export const getPetEmoji = (type: any, level: number): string => {
  const petEmojis: Record<any, string[]> = {
    cat: ['🐱', '😺', '😸', '😻', '😽'],
    fox: ['🦊', '🦊', '🦊', '🦊', '🦊'],
    dragon: ['🐉', '🐉', '🐲', '🐲', '🐲'],
    robot: ['🤖', '🤖', '🤖', '🤖', '🤖'],
  };
  return petEmojis[type][Math.min(level - 1, 4)];
};

export const MOOD_CONFIG = {
  happy: { emoji: '😊', color: '#48BB78', label: 'Happy' },
  calm: { emoji: '😌', color: '#4299E1', label: 'Calm' },
  anxious: { emoji: '😰', color: '#ED8936', label: 'Anxious' },
  sad: { emoji: '😢', color: '#4299E1', label: 'Sad' },
  stressed: { emoji: '😫', color: '#F56565', label: 'Stressed' },
  excited: { emoji: '🤩', color: '#9F7AEA', label: 'Excited' },
  tired: { emoji: '😴', color: '#718096', label: 'Tired' },
  angry: { emoji: '😠', color: '#F56565', label: 'Angry' },
};

export const DEFAULT_HABITS = [
  { id: 'h1', title: 'Drink Water', icon: '💧', xpReward: 10 },
  { id: 'h2', title: 'Meditate', icon: '🧘', xpReward: 20 },
  { id: 'h3', title: 'Exercise', icon: '🏃', xpReward: 30 },
  { id: 'h4', title: 'Journal', icon: '📝', xpReward: 20 },
  { id: 'h5', title: 'Read', icon: '📚', xpReward: 15 },
  { id: 'h6', title: 'Sleep 8hrs', icon: '😴', xpReward: 25 },
];
