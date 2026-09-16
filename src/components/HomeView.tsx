import { GameState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Grid, Trophy, Gift, Star, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface HomeViewProps {
  state: GameState;
  onPlay: () => void;
  onSelectLevel: (level: number) => void;
  onDailyReward: (amount: number) => void;
  onAchievements: () => void;
}

export function HomeView({ state, onPlay, onSelectLevel, onDailyReward, onAchievements }: HomeViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const canClaimDaily = state.dailyReward.lastClaimDate !== today;
  const dailyAmount = (state.dailyReward.dayStreak % 5 + 1) * 50;
  
  const [showLevels, setShowLevels] = useState(false);
  const totalLevels = 800;
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 flex flex-col items-center pt-12 pb-24">
      
      {/* Game Title */}
      <motion.div 
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         className="text-center mb-6"
      >
        <span className="text-sm font-extrabold tracking-[0.3em] text-theme-brand uppercase mb-4 block opacity-80">Jigsaw Mastery</span>
        <h1 className="text-6xl md:text-8xl font-sans font-extrabold text-theme-text tracking-tighter drop-shadow-sm">
          Picture <span className="text-transparent bg-clip-text bg-gradient-to-br from-theme-brand to-theme-accent">Puzzle</span>
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Play Now Hero Card */}
        <motion.button
           initial={{ scale: 0.95, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           onClick={onPlay}
           className="w-full min-h-[260px] relative overflow-hidden rounded-[2.5rem] bg-theme-card-bg/90 backdrop-blur border border-theme-medium/20 p-8 shadow-sm hover:shadow-2xl hover:shadow-theme-brand/10 transition-all active:scale-[0.98] group text-center flex flex-col justify-center items-center"
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-theme-medium/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-theme-brand transition-all duration-300">
               <Play className="w-8 h-8 text-theme-brand ml-2 group-hover:text-theme-bg transition-colors" />
            </div>
            <h2 className="text-3xl font-medium text-theme-text tracking-tight mb-2">Continue</h2>
            <p className="text-theme-text/60 font-medium text-sm tracking-wide">Level {state.unlockedLevel}</p>
          </div>
        </motion.button>
        
        {/* Right Side Cards */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowLevels(!showLevels)}
              className={cn(
                "border rounded-[2rem] p-6 flex flex-col justify-center items-center text-center transition-all active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden group",
                showLevels ? "bg-theme-brand text-theme-bg border-transparent" : "bg-theme-card-bg/90 backdrop-blur text-theme-text border-theme-medium/20 hover:shadow-xl hover:shadow-theme-brand/10"
              )}
            >
              <Grid className={cn("w-8 h-8 mb-4 transition-transform group-hover:scale-110", showLevels ? "text-theme-bg" : "text-theme-brand")} />
              <span className="font-medium text-lg">Levels</span>
              <span className={cn("text-xs font-medium mt-2", showLevels ? "text-theme-bg/60" : "text-theme-text/40")}>{state.unlockedLevel} / 800</span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={onAchievements}
              className="bg-theme-card-bg/90 backdrop-blur border-theme-medium/20 border rounded-[2rem] p-6 flex flex-col justify-center items-center text-center transition-all active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-theme-brand/10"
            >
              <Trophy className="w-8 h-8 text-theme-brand mb-4 transition-transform group-hover:scale-110" />
              <span className="font-medium text-theme-text text-lg">Awards</span>
              <span className="text-xs text-theme-text/40 font-medium mt-2 md:whitespace-nowrap">{state.stats.totalStars} Stars</span>
            </motion.button>
          </div>
          
          {/* Levels Grid section loaded directly under the levels button */}
          <AnimatePresence>
            {showLevels && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="w-full overflow-hidden"
              >
                <div className="bg-theme-card-bg/40 backdrop-blur-sm border border-theme-medium/10 p-6 rounded-[2rem] shadow-sm">
                  <h3 className="text-lg font-medium text-theme-text mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-theme-medium/10 flex items-center justify-center">
                      <Grid className="w-3.5 h-3.5 text-theme-brand" /> 
                    </div>
                    Select Level
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 pb-2 styled-scrollbar">
                    {levels.map((level, i) => {
                      const isUnlocked = level <= state.unlockedLevel;
                      const isLatest = level === state.unlockedLevel;
                      const levelData = state.levels[level];
                      const stars = levelData?.stars || 0;

                      return (
                        <motion.button
                          key={level}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (i % 20) * 0.01 }}
                          disabled={!isUnlocked}
                          onClick={() => onSelectLevel(level)}
                          className={cn(
                             "relative aspect-square rounded-[1rem] flex flex-col items-center justify-center transition-all border overflow-hidden group",
                             isUnlocked
                               ? "bg-theme-card-bg border-theme-medium/20 hover:border-theme-brand/30 active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                               : "bg-theme-card-bg/30 border-theme-medium/10 opacity-50 cursor-not-allowed",
                             isLatest && "ring-2 ring-theme-brand ring-offset-2 ring-offset-transparent border-transparent"
                          )}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="text-base font-semibold text-theme-text mb-0.5">{level}</span>
                              {stars > 0 && (
                                <div className="flex justify-center w-full gap-0.5">
                                   {[1,2].map(s => (
                                     <Star key={s} className={cn("w-1.5 h-1.5", s <= stars ? "text-amber-400 fill-amber-400" : "text-theme-medium/10 fill-theme-medium/10")} />
                                   ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <Lock className="w-3.5 h-3.5 opacity-30 text-theme-text" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {canClaimDaily && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => onDailyReward(dailyAmount)}
              className="w-full bg-theme-brand text-theme-bg rounded-[2rem] p-6 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-theme-brand/20 group overflow-hidden relative"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/10 p-3 rounded-2xl">
                  <Gift className="w-6 h-6 text-theme-bg" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-theme-bg text-lg tracking-tight">Daily Reward</div>
                  <div className="text-xs font-medium text-theme-bg/50 tracking-wide mt-1">Day {state.dailyReward.dayStreak + 1}</div>
                </div>
              </div>
              <div className="font-medium text-xl text-theme-bg relative z-10 bg-white/10 px-4 py-2 rounded-full border border-white/5 group-hover:bg-theme-bg group-hover:text-theme-brand transition-colors tracking-tight">+{dailyAmount}</div>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
