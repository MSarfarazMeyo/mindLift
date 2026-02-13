export interface Goal {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  emoji: string;
}

export interface GoalsState {
  goals: Goal[];
  totalPoints: number;
}
