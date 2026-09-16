import { useState, useEffect, useRef } from 'react';
import { GameState, SavedGame } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PuzzleBoard, PuzzleBoardRef } from './PuzzleBoard';
import { ArrowLeft, Home, Loader2, Sparkles, Eye, Wand2, Coins, Undo2, RotateCcw, Clock, Move, Star, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';

interface GameViewProps {
  key?: string;
  level: number;
  state: GameState;
  onBack: (savedGame?: SavedGame | null) => void;
  onHome: (savedGame?: SavedGame | null) => void;
  onComplete: (coins: number, stars: number, score: number) => void;
  onNextLevel: () => void;
  onSpendCoins: (amount: number) => boolean;
  playSound: (type: 'click' | 'win' | 'star' | 'swap') => void;
}

type Phase = 'loading' | 'preview' | 'playing' | 'paused' | 'won' | 'lost';

const PUZZLE_IMAGES = [
  10, 15, 28, 29, 37, 43, 54, 57, 58, 59, 
  103, 104, 119, 122, 133, 137, 145, 146, 152, 160, 
  175, 180, 190, 200, 211, 219, 220, 225, 230, 237, 
  240, 248, 249, 250, 260, 274, 281, 288, 301, 302, 
  307, 310, 311, 318, 324, 327, 334, 338, 342, 349, 
  350, 364, 365, 367, 370, 376, 379, 386, 389, 395, 
  403, 411, 413, 425, 429, 433, 439, 445, 447, 452, 
  453, 466, 473, 488, 493, 503, 514, 517, 525, 529, 
  532, 547, 548, 550, 558, 564, 577, 582, 588, 593, 
  594, 611, 619, 625, 628, 634, 646, 650, 659, 668, 
  674, 680, 684, 696, 703, 715, 718, 724, 733, 744, 
  755, 764, 766, 770, 777, 786, 795, 804, 815, 824, 
  829, 835, 839, 846, 856, 866, 870, 874, 883, 894, 
  903, 912, 913, 923, 935, 944, 955, 962, 977, 982, 
  995, 1002, 1011, 1012, 1015, 1016, 1018, 1019, 1020, 
  1021, 1022, 1023, 1024, 1025
];

export function GameView({ level, state, onBack, onHome, onComplete, onNextLevel, onSpendCoins, playSound }: GameViewProps) {
  const puzzleRef = useRef<PuzzleBoardRef>(null);
  
  // We no longer restore from saved games as we want the game to always start fresh
  const hasSavedGame = false;
  const initialHasSaved = useRef(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [countdown, setCountdown] = useState(7);
  const [startTime, setStartTime] = useState(0);
  
  const initialTimeLimit = Math.max(45, 180 - ((level - 1) * 5));
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit);
  
  const [moves, setMoves] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [lastStarsEarned, setLastStarsEarned] = useState(0);
  
  const getGridSize = (lvl: number) => {
    if (lvl <= 3) return { columns: 3, rows: 2 };
    if (lvl <= 8) return { columns: 4, rows: 3 };
    if (lvl <= 15) return { columns: 5, rows: 3 };
    if (lvl <= 30) return { columns: 5, rows: 4 };
    if (lvl <= 50) return { columns: 6, rows: 4 };
    if (lvl <= 100) return { columns: 6, rows: 5 };
    if (lvl <= 200) return { columns: 7, rows: 5 };
    if (lvl <= 400) return { columns: 8, rows: 6 };
    return { columns: Math.min(10, 4 + Math.floor(lvl / 100)), rows: Math.min(8, 3 + Math.floor(lvl / 100)) };
  };

  const { columns, rows } = getGridSize(level);

  // Use picsum photos to get a perfectly sized, unique real image for each level.
  // Multiplying by 100 to get a decent resolution.
  const imageId = PUZZLE_IMAGES[(level - 1) % PUZZLE_IMAGES.length];
  const imageUrl = `https://picsum.photos/id/${imageId}/800/600`;

  useEffect(() => {
    setMoves(0);
    setTimeLeft(initialTimeLimit);
    setCountdown(7);
    setPhase('loading');

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setPhase('preview');
    };
    img.onerror = () => {
      setPhase('preview');
    };
  }, [imageUrl, initialTimeLimit]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'preview') {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setPhase('playing');
            setStartTime(Date.now());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'playing') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPhase('lost');
            playSound('click');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, playSound]);

  const handleWin = () => {
    if (phase === 'won' || phase === 'lost') return;
    playSound('win');
    setPhase('won');
    
    const expectedMoves = (columns * rows) * 2;
    const timeTakenS = initialTimeLimit - timeLeft;
    
    let earnedStars = 1;
    if (moves <= expectedMoves && timeTakenS <= expectedMoves * 3) earnedStars = 3;
    else if (moves <= expectedMoves * 1.5) earnedStars = 2;

    const basePts = (columns * rows) * 10;
    const timeBonus = Math.max(0, 100 - timeTakenS);
    const score = basePts + timeBonus;

    setLastStarsEarned(earnedStars);
    setLastCoinsEarned(basePts);
    
    // Clear saved game when winning
    onComplete(basePts, earnedStars, score);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#60a5fa', '#facc15', '#c084fc']
    });
  };

  const saveCurrentState = (): SavedGame | null => {
    return null;
  };

  const handleBack = () => {
    onBack(null);
  };

  const handleHome = () => {
    onHome(null);
  };

  const handlePeek = () => {
    if (state.coins >= 20 && !isPeeking && onSpendCoins(20)) {
      setIsPeeking(true);
      setTimeout(() => setIsPeeking(false), 3000);
    }
  };

  const handleSolveOne = () => {
    if (state.coins >= 50 && onSpendCoins(50)) {
      puzzleRef.current?.solveOne();
    }
  };

  const handleRestart = () => {
    playSound('click');
    setPhase('loading');
    setMoves(0);
    setTimeLeft(initialTimeLimit);
    setCountdown(7);
    setIsPeeking(false);
    puzzleRef.current?.reset();

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setPhase('preview');
    };
    img.onerror = () => {
      setPhase('preview');
    };
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="w-full relative flex flex-col flex-1 min-h-[100dvh] -mt-[64px] pt-[72px] pb-2 px-1 sm:px-2 z-0"
    >
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />

      <div className="w-full flex w-full max-w-none flex-col flex-1 relative z-10">
      
        {/* Top UI Bar */}
        <div className="w-full flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <button onClick={handleBack} className="p-2 bg-theme-card-bg hover:bg-theme-medium/40 border-2 border-theme-medium shadow-lg rounded-full transition-colors active:scale-95 text-theme-text cursor-pointer" title="Levels">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={handleHome} className="p-2 bg-theme-card-bg hover:bg-theme-medium/40 border-2 border-theme-medium shadow-lg rounded-full transition-colors active:scale-95 text-theme-text cursor-pointer" title="Home">
              <Home className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex bg-theme-card-bg/90 backdrop-blur-md border-[3px] border-theme-medium shadow-2xl rounded-2xl overflow-hidden text-theme-text">
            <div className="px-3 py-2 border-r border-theme-medium flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-theme-text/70 tracking-widest uppercase">Level</span>
              <span className="font-bold font-mono text-base">{level}</span>
            </div>
            <div className="px-3 py-2 border-r border-theme-medium flex flex-col items-center justify-center text-center hidden sm:flex">
              <span className="text-[9px] font-bold text-theme-text/70 tracking-widest uppercase flex items-center gap-1"><Clock className="w-3 h-3"/>Time</span>
              <span className={cn("font-bold font-mono text-base", timeLeft <= 10 && "text-red-400 animate-pulse")}>{formatTime(timeLeft)}</span>
            </div>
            <div className="px-3 py-2 border-r border-theme-medium flex flex-col items-center justify-center text-center hidden sm:flex">
              <span className="text-[9px] font-bold text-theme-text/70 tracking-widest uppercase flex items-center gap-1"><Move className="w-3 h-3"/>Moves</span>
              <span className="font-bold font-mono text-base">{moves}</span>
            </div>
            <button onClick={handlePeek} disabled={state.coins < 20 || isPeeking || phase === 'lost' || phase === 'paused' || phase === 'won'} className="px-3 py-2 border-r border-theme-medium flex flex-col items-center justify-center hover:bg-theme-medium/20 transition-colors disabled:opacity-50 cursor-pointer">
              <span className="text-[9px] font-bold text-theme-text tracking-widest uppercase flex items-center gap-0.5"><Eye className="w-3 h-3 text-amber-400"/>Peek</span>
              <span className="font-bold font-mono text-[10px] text-amber-400 flex items-center mt-1"><Coins className="w-3 h-3 mr-0.5" />20</span>
            </button>
            <button onClick={handleSolveOne} disabled={state.coins < 50 || phase === 'lost' || phase === 'paused' || phase === 'won'} className="px-3 py-2 border-r border-theme-medium flex flex-col items-center justify-center hover:bg-theme-medium/20 transition-colors disabled:opacity-50 cursor-pointer">
              <span className="text-[9px] font-bold text-theme-text tracking-widest uppercase flex items-center gap-0.5"><Wand2 className="w-3 h-3 text-indigo-400"/>Hint</span>
              <span className="font-bold font-mono text-[10px] text-indigo-400 flex items-center mt-1"><Coins className="w-3 h-3 mr-0.5" />50</span>
            </button>
            <button onClick={handleRestart} disabled={phase === 'loading' || phase === 'preview'} className="px-4 py-2 border-r border-theme-medium flex flex-col items-center justify-center hover:bg-theme-medium/20 transition-colors disabled:opacity-50 text-orange-400 cursor-pointer" title="Restart Level">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={() => setPhase('paused')} disabled={phase !== 'playing'} className="px-4 py-2 flex flex-col items-center justify-center hover:bg-theme-medium/20 transition-colors disabled:opacity-50 text-emerald-400 cursor-pointer">
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 w-full flex flex-col justify-center items-center overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 text-[#E8DCC0]/50 py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin" />
              </motion.div>
            )}

            {(phase === 'preview' || phase === 'playing' || phase === 'won' || phase === 'lost' || phase === 'paused') && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex items-center justify-center relative"
              >
                 <PuzzleBoard 
                   ref={puzzleRef}
                   imageUrl={imageUrl}
                   columns={columns}
                   rows={rows}
                   onWin={handleWin}
                   isWon={phase === 'won'}
                   onMove={setMoves}
                   onPlaySound={playSound}
                   showHint={isPeeking || phase === 'preview'}
                   isPreview={phase === 'preview' || phase === 'lost' || phase === 'paused'}
                   countdown={countdown}
                   savedState={hasSavedGame ? { placed: state.savedGame!.placed, tray: state.savedGame!.tray } : undefined}
                 />

                 {phase === 'preview' && (
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-2">
                     <div className="bg-theme-card-bg/95 backdrop-blur-md border-[2px] border-theme-medium text-theme-text font-mono px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3">
                       <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                       <span className="text-xs sm:text-sm">Memorizing: <strong className="text-orange-400 font-bold font-mono text-base sm:text-lg">{countdown}s</strong></span>
                     </div>
                     <button
                       onClick={() => {
                         setPhase('playing');
                         setStartTime(Date.now());
                       }}
                       className="px-4 py-1.5 bg-theme-brand hover:opacity-90 active:scale-95 text-theme-bg text-xs font-bold rounded-xl shadow-lg border border-theme-medium/50 transition-all cursor-pointer"
                     >
                       Skip Preview
                     </button>
                   </div>
                 )}
                 
                 {phase === 'paused' && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-xl"
                   >
                     <div className="bg-[#2D1B11] border-[4px] border-[#5E3A22] p-8 rounded-3xl shadow-2xl text-center max-w-[90%] w-[400px]">
                        <div className="w-20 h-20 bg-[#E8DCC0]/10 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
                          <Pause className="w-10 h-10 text-theme-text" />
                        </div>
                        <h3 className="text-3xl font-black text-theme-text mb-8 tracking-tight">Game Paused</h3>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => setPhase('playing')}
                            className="w-full py-4 px-4 bg-theme-brand hover:opacity-90 text-theme-bg rounded-2xl font-bold shadow-xl shadow-black/30 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Play className="w-5 h-5" /> Resume
                          </button>
                          <button
                            onClick={handleRestart}
                            className="w-full py-4 px-4 bg-theme-dark hover:bg-theme-medium text-theme-text rounded-2xl font-bold shadow-xl shadow-black/30 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-5 h-5" /> Restart Level
                          </button>
                          <button
                            onClick={handleHome}
                            className="w-full py-4 px-4 bg-black/30 hover:bg-black/50 text-theme-text/70 rounded-2xl font-bold active:scale-95 transition-all outline-none cursor-pointer"
                          >
                            Quit to Menu
                          </button>
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {phase === 'lost' && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl w-[100vw] h-[100vh]"
                   >
                     <div className="bg-[#2D1B11] border-[4px] border-[#5E3A22] p-8 rounded-3xl shadow-2xl text-center max-w-[90%] w-[400px]">
                        <div className="w-20 h-20 bg-red-900/50 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                          <Clock className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-3xl font-black text-theme-text mb-2 tracking-tight">Time's Up!</h3>
                        <p className="text-red-300/80 mb-8">You ran out of time on level {level}.</p>
                        
                        <div className="space-y-3">
                          <button
                            onClick={handleRestart}
                            className="w-full py-4 px-4 bg-theme-brand hover:opacity-90 text-theme-bg rounded-2xl font-bold shadow-xl shadow-black/30 active:scale-95 transition-all outline-none cursor-pointer"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={handleHome}
                            className="w-full py-4 px-4 bg-black/30 hover:bg-black/50 text-theme-text/70 rounded-2xl font-bold active:scale-95 transition-all outline-none cursor-pointer"
                          >
                            Back to Home
                          </button>
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {phase === 'won' && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl w-[100vw] h-[100vh]"
                   >
                     <div className="bg-[#2D1B11] border-[4px] border-[#5E3A22] p-8 rounded-3xl shadow-2xl text-center max-w-[90%] w-[400px]">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-3">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-theme-text mb-1 tracking-tight">Level {level} Cleared!</h3>
                         <p className="text-theme-text/70 text-xs font-semibold mb-5 uppercase tracking-wider">Moves: {moves} | Time Left: {formatTime(timeLeft)}</p>
                        
                        <div className="flex justify-center gap-2 mb-6">
                           {[1,2,3].map(s => (
                             <motion.div
                               key={s}
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               transition={{ delay: 0.3 + (s * 0.1), type: 'spring' }}
                             >
                               <Star className={cn("w-10 h-10 transition-colors", s <= lastStarsEarned ? "text-yellow-400 fill-yellow-400" : "text-white/10 fill-white/10")} />
                             </motion.div>
                           ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-8 bg-black/40 py-2 rounded-xl border border-black/50">
                           <Coins className="w-6 h-6 text-amber-400" />
                           <span className="text-xl font-bold text-amber-400">+{lastCoinsEarned} Coins</span>
                        </div>
                        
                        <div className="space-y-3">
                          <button
                            onClick={onNextLevel}
                            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-900/30 active:scale-95 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer"
                          >
                            Next Level <Play className="w-6 h-6 fill-white" />
                          </button>
                          <button
                            onClick={handleHome}
                            className="w-full py-4 px-4 bg-black/30 hover:bg-black/50 text-theme-text/70 rounded-2xl font-bold active:scale-95 transition-all outline-none cursor-pointer"
                          >
                            Back to Home
                          </button>
                        </div>
                     </div>
                   </motion.div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls removed as requested */}
      </div>
    </div>
  );
}
