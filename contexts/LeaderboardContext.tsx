import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';

export type LeaderboardEntry = {
  id: string;
  level: number;
  score: number;
  time: number;
  efficiency: number;
  hintsUsed: number;
  timestamp: number;
  comboMultiplier: number;
};

const LEADERBOARD_KEY = '@maze_game_leaderboard';

export const [LeaderboardProvider, useLeaderboard] = createContextHook(() => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const stored = await AsyncStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LeaderboardEntry[];
        setEntries(parsed);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLeaderboard = async (newEntries: LeaderboardEntry[]) => {
    try {
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  };

  const addEntry = useCallback((entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const updatedEntries = [...entries, newEntry]
      .sort((a, b) => {
        if (a.level !== b.level) return b.level - a.level;
        if (a.score !== b.score) return b.score - a.score;
        return a.time - b.time;
      })
      .slice(0, 100);

    setEntries(updatedEntries);
    saveLeaderboard(updatedEntries);
  }, [entries]);

  const getTopScores = useCallback((limit: number = 10) => {
    return [...entries]
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.time - b.time;
      })
      .slice(0, limit);
  }, [entries]);

  const getFastestTimes = useCallback((limit: number = 10) => {
    return [...entries]
      .filter(entry => entry.level >= 1)
      .sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        return b.score - a.score;
      })
      .slice(0, limit);
  }, [entries]);

  const getHighestLevel = useCallback(() => {
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.level));
  }, [entries]);

  const getTotalGames = useCallback(() => {
    return entries.length;
  }, [entries]);

  const getAverageScore = useCallback(() => {
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length);
  }, [entries]);

  const clearLeaderboard = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(LEADERBOARD_KEY);
      setEntries([]);
    } catch (error) {
      console.error('Failed to clear leaderboard:', error);
    }
  }, []);

  return useMemo(() => ({
    entries,
    isLoading,
    addEntry,
    getTopScores,
    getFastestTimes,
    getHighestLevel,
    getTotalGames,
    getAverageScore,
    clearLeaderboard,
  }), [entries, isLoading, addEntry, getTopScores, getFastestTimes, getHighestLevel, getTotalGames, getAverageScore, clearLeaderboard]);
});
