import { GameState } from '../types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  state: GameState;
  onUpdate: (settings: GameState['settings']) => void;
  onBack: () => void;
  onReset: () => void;
}

export function SettingsView({ state, onUpdate, onBack, onReset }: SettingsViewProps) {
  const s = state.settings;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-theme-medium/20 rounded-full transition-colors opacity-80 hover:opacity-100"
        >
          <ArrowLeft className="w-6 h-6 text-theme-text" />
        </button>
        <h2 className="text-2xl font-bold text-theme-text">Settings</h2>
      </div>

      <div className="space-y-4 text-theme-text">
        <div className="bg-theme-medium/10 border border-theme-medium/20 rounded-2xl p-4 flex justify-between items-center">
          <span className="font-bold">Sound Effects</span>
          <button 
            onClick={() => onUpdate({ ...s, sound: !s.sound })}
            className={cn("w-12 h-6 rounded-full transition-colors relative", s.sound ? "bg-theme-brand" : "bg-theme-dark/20")}
          >
            <div className={cn("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all", s.sound ? "left-6" : "left-0.5")} />
          </button>
        </div>

        <div className="bg-theme-medium/10 border border-theme-medium/20 rounded-2xl p-4 flex justify-between items-center">
          <span className="font-bold">Music</span>
          <button 
            onClick={() => onUpdate({ ...s, music: !s.music })}
            className={cn("w-12 h-6 rounded-full transition-colors relative", s.music ? "bg-theme-brand" : "bg-theme-dark/20")}
          >
            <div className={cn("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all", s.music ? "left-6" : "left-0.5")} />
          </button>
        </div>

        <div className="pt-8">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                onReset();
              }
            }}
            className="w-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Reset Progress
          </button>
        </div>
      </div>
    </div>
  );
}
