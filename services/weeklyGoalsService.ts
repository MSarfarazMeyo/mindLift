import { supabase } from '@/lib/supabase';

export const getWeeklyCompletedGoalsCount = async (): Promise<number> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('created_at', startOfWeek.toISOString())
    .lte('created_at', endOfWeek.toISOString());

  if (error) {
    console.error('Error fetching weekly goals:', error);
    return 0;
  }

  return count || 0;
};
