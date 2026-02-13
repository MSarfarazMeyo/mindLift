import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { goalsService } from "@/services/goalsService";
import { getWeeklyCompletedGoalsCount } from '@/services/weeklyGoalsService';

export const useWeeklyGoalsCount = () => {
  return useQuery({
    queryKey: ['weeklyGoalsCount'],
    queryFn: getWeeklyCompletedGoalsCount,
  });
};

export const [GoalsProvider, useGoals] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: goalsService.getGoals,
  });

  const { data: totalPoints = 0, isLoading: pointsLoading } = useQuery({
    queryKey: ["totalPoints"],
    queryFn: goalsService.getTotalPoints,
  });

  const addGoalMutation = useMutation({
    mutationFn: ({ title, points, emoji }: { title: string; points: number; emoji: string }) =>
      goalsService.addGoal(title, points, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const toggleGoalMutation = useMutation({
    mutationFn: goalsService.toggleGoal,
    onMutate: (id) => {
      setTogglingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["totalPoints"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyGoalsCount"] });
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalsService.deleteGoal,
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["totalPoints"] });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const resetDailyMutation = useMutation({
    mutationFn: goalsService.resetDaily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const addGoal = useCallback(
    async (title: string, points: number, emoji: string) => {
      await addGoalMutation.mutateAsync({ title, points, emoji });
    },
    [addGoalMutation]
  );

  const toggleGoal = useCallback(
    async (id: string) => {
      const goal = goals.find((g) => g.id === id);
      await toggleGoalMutation.mutateAsync(id);
      return goal && !goal.completed;
    },
    [goals, toggleGoalMutation]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await deleteGoalMutation.mutateAsync(id);
    },
    [deleteGoalMutation]
  );

  const resetDaily = useCallback(async () => {
    await resetDailyMutation.mutateAsync();
  }, [resetDailyMutation]);

  return {
    goals,
    totalPoints,
    addGoal,
    toggleGoal,
    deleteGoal,
    resetDaily,
    isLoading: goalsLoading || pointsLoading,
    isAdding: addGoalMutation.isPending,
    togglingId,
    deletingId,
    isResetting: resetDailyMutation.isPending,
  };
});
