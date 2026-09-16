import React, { useState, useEffect } from 'react';
import { HomeView } from './components/HomeView';
import { GameView } from './components/GameView';
import { SettingsView } from './components/SettingsView';
import { AchievementsView } from './components/AchievementsView';
import { loadState, saveState } from './lib/store';
import { GameState, Screen } from './types';
import { Coins, Star, Settings, Music, VolumeX } from 'lucide-react';
import { playSound, playBackgroundMusic } from './lib/audio';
import { cn } from './lib/utils';

export default function App() {
  const [state, setState] = useState<GameState>(loadState());
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    playBackgroundMusic(state.settings.music);
  }, [state.settings.music]);

  const handleSpendCoins = (amount: number): boolean => {
    if (state.coins >= amount) {
      if (state.settings.sound) playSound('click');
      setState(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  };

  const handleLevelComplete = (level: number, coinsEarned: number, starsEarned: number, score: number) => {
    if (state.settings.sound) playSound('win');
    setState(prev => {
      const nextLevel = level + 1;
      const currentHighest = prev.unlockedLevel;
      const newUnlocked = nextLevel > currentHighest ? nextLevel : currentHighest;
      
      const existingLevelData = prev.levels[level] || { stars: 0, score: 0 };
      const newStars = Math.max(existingLevelData.stars, starsEarned);
      const newScore = Math.max(existingLevelData.score, score);
      
      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        unlockedLevel: newUnlocked,
        levels: {
          ...prev.levels,
          [level]: { stars: newStars, score: newScore }
        },
        stats: {
          ...prev.stats,
          puzzlesSolved: prev.stats.puzzlesSolved + (existingLevelData.stars === 0 ? 1 : 0),
          totalStars: prev.stats.totalStars + (newStars - existingLevelData.stars)
        }
      };
    });
  };

  const getThemeClasses = () => {
    return 'text-theme-text selection:bg-theme-medium/30';
  };
  
  const getHeaderTheme = () => {
    return 'border-theme-brand/30 bg-theme-accent/90 text-theme-text shadow-md';
  };

  const getThemeStyle = (): React.CSSProperties => {
    return {};
  };

  return (
    <div className={`min-h-[100dvh] font-sans flex flex-col transition-colors duration-500 theme-${state.settings.theme} bg-theme-bg ${getThemeClasses()}`} style={getThemeStyle()}>
       <header className={`p-4 border-b backdrop-blur sticky top-0 z-50 flex justify-between items-center ${getHeaderTheme()}`}>
          <button 
            className="text-2xl font-black text-theme-text flex items-center gap-2 drop-shadow-sm transition-transform active:scale-95 cursor-pointer font-sans tracking-tight" 
            onClick={() => {
              if(state.settings.sound) playSound('click');
              setScreen('home');
            }}
          >
             <span className="bg-theme-dark text-theme-bg px-2 py-0.5 rounded-md">Picture</span> Puzzle
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-amber-200 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 shrink-0 tabular-nums">
                {state.coins.toLocaleString()}
              </span>
            </div>
            <button 
              onClick={() => {
                if(state.settings.sound) playSound('click');
                setState(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    music: !prev.settings.music
                  }
                }));
              }}
              className={cn("p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer", state.settings.music ? "text-indigo-400" : "text-gray-400")}
              title={state.settings.music ? "Mute Music" : "Play Music"}
            >
              {state.settings.music ? <Music className="w-5 h-5 opacity-80" /> : <VolumeX className="w-5 h-5 opacity-80" />}
            </button>
            <button 
              onClick={() => {
                if(state.settings.sound) playSound('click');
                setScreen('settings');
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5 opacity-80" />
            </button>
          </div>
       </header>

       <main className={cn("flex-1 w-full flex flex-col items-center justify-center", screen !== 'game' && "p-4")}>
          {screen === 'home' && (
             <HomeView
               state={state}
               onPlay={() => {
                 if(state.settings.sound) playSound('click');
                 setSelectedLevel(state.unlockedLevel);
                 setScreen('game');
               }}
               onSelectLevel={(lv) => {
                 if(state.settings.sound) playSound('click');
                 setSelectedLevel(lv);
                 setScreen('game');
               }}
               onDailyReward={(amount) => {
                 if(state.settings.sound) playSound('star');
                 setState(prev => ({
                   ...prev,
                   coins: prev.coins + amount,
                   dailyReward: {
                     ...prev.dailyReward,
                     lastClaimDate: new Date().toISOString().split('T')[0],
                     dayStreak: prev.dailyReward.dayStreak + 1
                   }
                 }));
               }}
               onAchievements={() => {
                 if(state.settings.sound) playSound('click');
                 setScreen('achievements');
               }}
             />
          )}

          {screen === 'achievements' && (
            <AchievementsView
              state={state}
              onBack={() => {
                if(state.settings.sound) playSound('click');
                setScreen('home');
              }}
            />
          )}
          
          {screen === 'game' && selectedLevel && (
             <GameView
               key={`level-${selectedLevel}`}
               level={selectedLevel}
               state={state}
               onBack={(savedGameData) => {
                 if(state.settings.sound) playSound('click');
                 const newState = { ...state, savedGame: savedGameData || state.savedGame };
                 setState(newState);
                 saveState(newState);
                 setScreen('home');
               }}
               onHome={(savedGameData) => {
                 if(state.settings.sound) playSound('click');
                 const newState = { ...state, savedGame: savedGameData || state.savedGame };
                 setState(newState);
                 saveState(newState);
                 setScreen('home');
               }}
               onComplete={(coins, stars, score) => {
                 handleLevelComplete(selectedLevel, coins, stars, score);
                 // clear saved game on win
                 setState(prev => {
                   const s = { ...prev, savedGame: null };
                   saveState(s);
                   return s;
                 });
               }}
               onNextLevel={() => {
                 if(state.settings.sound) playSound('click');
                 setSelectedLevel(prev => prev! + 1);
               }}
               onSpendCoins={handleSpendCoins}
               playSound={(type) => { if(state.settings.sound) playSound(type); }}
             />
          )}

          {screen === 'settings' && (
             <SettingsView 
               state={state}
               onUpdate={(newSettings) => setState(prev => ({ ...prev, settings: newSettings }))}
               onBack={() => {
                 if(state.settings.sound) playSound('click');
                 setScreen('home');
               }}
               onReset={() => {
                 if(state.settings.sound) playSound('click');
                 setState(loadState()); 
                 localStorage.clear();
                 window.location.reload();
               }}
             />
          )}
       </main>
    </div>
  )
}

