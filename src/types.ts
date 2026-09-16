export type Theme = 'wood' | 'sakura' | 'sky' | 'mint';
export type Screen = 'start' | 'home' | 'level_select' | 'game' | 'settings' | 'achievements';

export interface LevelData {
  stars: number;
  score: number;
}

export interface SavedGame {
  level: number;
  placed: (number | null)[];
  tray: (number | null)[];
  timeLeft: number;
  moves: number;
}

export interface GameState {
  coins: number;
  unlockedLevel: number;
  levels: Record<number, LevelData>;
  achievements: Record<string, boolean>;
  dailyReward: {
    lastClaimDate: string;
    dayStreak: number;
  };
  settings: {
    sound: boolean;
    music: boolean;
    theme: Theme;
  };
  stats: {
    totalPlayTime: number; // in seconds
    puzzlesSolved: number;
    totalStars: number;
  };
  savedGame?: SavedGame | null;
}

