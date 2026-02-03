export interface Achievement {
    id: string;
    user_id: string;
    total_points: number;
    login_streak: number;
    questions_answered: number;
    notes_written: number;
    goals_added: number;
    last_goals_date: string | null;
    last_login_date: string | null;
    last_questions_date: string | null;
}

export interface LeaderboardUser extends Achievement {
    rank: number;
    profiles: {
        name?: string;
        email?: string;
        username?: string;
    };
}