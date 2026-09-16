import { GameState } from '../types';

const STORE_KEY = 'puzzle_game_state_v3';

export const loadState = (): GameState => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.unlockedLevel === 'number') {
        if (parsed.settings) {
          if (!parsed.settings.theme || ['dark', 'forest', 'space', 'neon'].includes(parsed.settings.theme)) {
            parsed.settings.theme = 'wood';
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load state", e);
  }
  
  return {
    coins: 0,
    unlockedLevel: 1,
    levels: {},
    achievements: {},
    dailyReward: {
      lastClaimDate: '',
      dayStreak: 0,
    },
    settings: {
      sound: true,
      music: true,
      theme: 'wood',
    },
    stats: {
      totalPlayTime: 0,
      puzzlesSolved: 0,
      totalStars: 0,
    }
  };
};

export const saveState = (state: GameState) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
};
