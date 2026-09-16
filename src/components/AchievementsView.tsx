import { GameState } from '../types';
import { ArrowLeft, Trophy, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AchievementsViewProps {
  state: GameState;
  onBack: () => void;
}

const ACHIEVEMENT_LIST = [
  { id: 'first_win', name: 'First Steps', description: 'Complete your first puzzle', requiredLevels: 1 },
  { id: 'novice', name: 'Novice Puzzler', description: 'Complete 10 levels', requiredLevels: 10 },
  { id: 'expert', name: 'Expert Solver', description: 'Complete 50 levels', requiredLevels: 50 },
  { id: 'master', name: 'Puzzle Master', description: 'Complete all 100 levels', requiredLevels: 100 },
];

export function AchievementsView({ state, onBack }: AchievementsViewProps) {
  const levelsComplete = Math.max(0, state.unlockedLevel - 1);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <button
           onClick={onBack}
           className="p-2 hover:bg-theme-medium/20 rounded-full transition-colors opacity-80 hover:opacity-100"
        >
          <ArrowLeft className="w-6 h-6 text-theme-text" />
        </button>
         <div>
          <h2 className="text-2xl font-bold text-theme-text">Achievements</h2>
          <div className="text-sm text-theme-text/70">
            {levelsComplete} levels completed
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {ACHIEVEMENT_LIST.map((ach, i) => {
          const isUnlocked = levelsComplete >= ach.requiredLevels;
          const progress = Math.min(100, Math.round((levelsComplete / ach.requiredLevels) * 100));

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-4 border rounded-2xl flex items-center gap-4 transition-all",
                isUnlocked 
                  ? "bg-theme-medium/10 border-theme-medium/20 shadow-md"
                  : "bg-theme-dark/10 border-theme-medium/10 opacity-70 grayscale"
              )}
            >
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0", isUnlocked ? "bg-amber-500/20" : "bg-theme-medium/10")}>
                 {isUnlocked ? <Trophy className="w-8 h-8 text-amber-500" /> : <Lock className="w-8 h-8 text-theme-text/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-theme-text truncate">{ach.name}</h3>
                <p className="text-sm text-theme-text/60 truncate">{ach.description}</p>
                <div className="mt-2 h-1.5 bg-theme-medium/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex-col items-end flex flex-shrink-0 w-16">
                 {isUnlocked ? (
                   <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                 ) : (
                   <span className="text-xs font-bold text-theme-text/40">{progress}%</span>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
