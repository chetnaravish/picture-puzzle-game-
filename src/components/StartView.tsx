import { motion } from 'motion/react';
import { Play, Shapes } from 'lucide-react';

interface StartViewProps {
  onStart: () => void;
}

export function StartView({ onStart }: StartViewProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.6 }}
          className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/30"
        >
          <Shapes className="w-16 h-16 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl font-black text-[#3D2314] mb-4 tracking-tight">
            Picture Puzzle
          </h1>
          <p className="text-[#3D2314]/70 text-lg">Reconstruct reality piece by piece.</p>
        </motion.div>
      </div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onStart}
        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-xl shadow-indigo-600/30"
      >
        <Play className="w-6 h-6 mr-2 fill-white" />
        Start Game
      </motion.button>
    </div>
  );
}
