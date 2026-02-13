import { supabase } from '@/lib/supabase';
import { Goal } from '@/types/goal';
import { addGamePoints } from '@/lib/gamePoints';

const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

export const goalsService = {
  async getGoals(): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const todayStart = getTodayDate();

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(g => ({
      id: g.id,
      title: g.title,
      points: g.points,
      completed: g.completed,
      createdAt: g.created_at,
      completedAt: g.completed_at || undefined,
      emoji: g.emoji,
    }));
  },

  async getTotalPoints(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const todayStart = getTodayDate();

    const { data } = await supabase
      .from('goals')
      .select('points')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('created_at', todayStart);

    return (data || []).reduce((sum, goal) => sum + goal.points, 0);
  },

  async addGoal(title: string, points: number, emoji: string): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, title, points, emoji })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      points: data.points,
      completed: data.completed,
      createdAt: data.created_at,
      completedAt: data.completed_at || undefined,
      emoji: data.emoji,
    };
  },

  async toggleGoal(id: string): Promise<void> {
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();

    if (!goal) throw new Error('Goal not found');

    const nowCompleted = !goal.completed;

    const { error } = await supabase
      .from('goals')
      .update({
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) throw error;

    // Update system points
    const pointsDelta = nowCompleted ? goal.points : -goal.points;
    await addGamePoints(pointsDelta);
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },

  async resetDaily(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('goals')
      .update({ completed: false, completed_at: null })
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
