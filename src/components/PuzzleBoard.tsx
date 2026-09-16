import { useState, useEffect, forwardRef, useImperativeHandle, useId } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface PuzzleBoardRef {
  solveOne: () => void;
  undo: () => void;
  reset: () => void;
  getState: () => { placed: (number|null)[], tray: (number|null)[] };
}

interface PuzzleBoardProps {
  imageUrl: string;
  columns: number;
  rows: number;
  onWin: () => void;
  isWon: boolean;
  onMove: (moves: number) => void;
  onPlaySound: (type: 'swap' | 'click') => void;
  showHint?: boolean;
  isPreview?: boolean;
  countdown?: number;
  savedState?: { placed: (number|null)[], tray: (number|null)[] } | null;
}

interface PuzzleShape {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const PuzzleBoard = forwardRef<PuzzleBoardRef, PuzzleBoardProps>(({ imageUrl, columns, rows, onWin, isWon, onMove, onPlaySound, showHint, isPreview, countdown, savedState }, ref) => {
  const totalPieces = columns * rows;
  const uniqueId = useId().replace(/:/g, ''); 
  const [generation, setGeneration] = useState(0);
  const [placed, setPlaced] = useState<(number | null)[]>(savedState ? savedState.placed : Array(totalPieces).fill(null));
  const [tray, setTray] = useState<(number | null)[]>(savedState ? savedState.tray : []);
  const [history, setHistory] = useState<{ placed: (number|null)[], tray: (number|null)[] }[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<{ id: number, source: { type: 'tray' | 'board', index: number } } | null>(null);
  const [shapes, setShapes] = useState<Record<number, PuzzleShape>>({});

  const generatePuzzle = () => {
    setGeneration(g => g + 1);
    let initialTray = Array.from({ length: totalPieces }, (_, i) => i);
    
    // Shuffle Tray
    for (let i = initialTray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialTray[i], initialTray[j]] = [initialTray[j], initialTray[i]];
    }
    
    // Jigsaw Shapes Generation
    const horizEdges: number[][] = [];
    for (let r = 0; r < rows - 1; r++) {
      const row = [];
      for (let c = 0; c < columns; c++) {
        row.push(Math.random() > 0.5 ? 1 : -1);
      }
      horizEdges.push(row);
    }
    const vertEdges: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < columns - 1; c++) {
         row.push(Math.random() > 0.5 ? 1 : -1);
      }
      vertEdges.push(row);
    }

    const newShapes: Record<number, PuzzleShape> = {};
    for (let i = 0; i < totalPieces; i++) {
       const r = Math.floor(i / columns);
       const c = i % columns;
       newShapes[i] = {
         top: r === 0 ? 0 : -horizEdges[r - 1][c],
         right: c === columns - 1 ? 0 : vertEdges[r][c],
         bottom: r === rows - 1 ? 0 : horizEdges[r][c],
         left: c === 0 ? 0 : -vertEdges[r][c - 1]
       };
    }
    setShapes(newShapes);

    if (savedState && placed.length === totalPieces) {
      setPlaced(savedState.placed);
      setTray(savedState.tray);
      setHistory([]);
    } else {
      setPlaced(Array(totalPieces).fill(null));
      setTray(initialTray);
      setHistory([]);
      onMove(0);
    }
    setSelectedPiece(null);
  };

  useEffect(() => {
    generatePuzzle();
  }, [imageUrl, columns, rows]);

  const checkWin = (currentPlaced: (number|null)[]) => {
    if (currentPlaced.every((val, idx) => val === idx)) {
      setTimeout(onWin, 500);
    }
  };

  const saveState = () => {
    setHistory(h => [...h, { placed: [...placed], tray: [...tray] }]);
  };

  const handlePieceClick = (id: number, source: { type: 'tray' | 'board', index: number }) => {
    if (isWon || isPreview) return;
    
    // Prevent selecting a piece that is locked in its correct position
    if (source.type === 'board' && placed[source.index] === source.index) return;
    
    if (selectedPiece?.id === id) {
      setSelectedPiece(null);
      onPlaySound('click');
      return;
    }
    
    setSelectedPiece({ id, source });
    onPlaySound('click');
  };

  const handleSlotClick = (slotIdx: number) => {
    if (isWon || isPreview) return;
    
    // If slot contains correctly placed piece, ignore clicks
    if (placed[slotIdx] === slotIdx) return;
    
    if (placed[slotIdx] !== null) {
      handlePieceClick(placed[slotIdx]!, { type: 'board', index: slotIdx });
      return;
    }
    
    if (selectedPiece) {
      saveState();
      const newPlaced = [...placed];
      const newTray = [...tray];
      
      newPlaced[slotIdx] = selectedPiece.id;
      
      if (selectedPiece.source.type === 'tray') {
        newTray[selectedPiece.source.index] = null;
      } else {
        newPlaced[selectedPiece.source.index] = null;
      }
      
      setPlaced(newPlaced);
      setTray(newTray);
      setSelectedPiece(null);
      
      // Check if newly placed piece is in correct spot
      if (selectedPiece.id === slotIdx) {
        onPlaySound('star'); // Satisfying chime for locked piece
      } else {
        onPlaySound('swap');
      }
      
      onMove(history.length + 1);
      checkWin(newPlaced);
    }
  };

  const handleTraySlotClick = (slotIdx: number) => {
    if (isWon || isPreview || !selectedPiece) return;
    
    if (tray[slotIdx] !== null) {
      handlePieceClick(tray[slotIdx]!, { type: 'tray', index: slotIdx });
      return;
    }
    
    saveState();
    const newPlaced = [...placed];
    const newTray = [...tray];
    
    newTray[slotIdx] = selectedPiece.id;
    
    if (selectedPiece.source.type === 'tray') {
      newTray[selectedPiece.source.index] = null;
    } else {
      newPlaced[selectedPiece.source.index] = null;
    }
    
    setPlaced(newPlaced);
    setTray(newTray);
    setSelectedPiece(null);
    onPlaySound('swap');
    onMove(history.length + 1);
  };

  useImperativeHandle(ref, () => ({
    solveOne: () => {
      if (isWon) return;
      
      let targetSlotIdx = -1;
      for(let i=0; i<totalPieces; i++) {
         if(placed[i] !== i) {
           targetSlotIdx = i;
           break;
         }
      }
      if (targetSlotIdx === -1) return;
      
      const targetPieceId = targetSlotIdx;
      
      saveState();
      const newPlaced = [...placed];
      const newTray = [...tray];
      
      const currentSlot = newPlaced.indexOf(targetPieceId);
      const isIndTray = newTray.indexOf(targetPieceId);
      
      if (currentSlot !== -1) {
        newPlaced[currentSlot] = null;
      } else if (isIndTray !== -1) {
        newTray[isIndTray] = null;
      }
      
      const existingAtTarget = newPlaced[targetSlotIdx];
      if (existingAtTarget !== null) {
        const emptyIdx = newTray.indexOf(null);
        if(emptyIdx !== -1) newTray[emptyIdx] = existingAtTarget;
      }
      
      newPlaced[targetSlotIdx] = targetPieceId;
      
      setPlaced(newPlaced);
      setTray(newTray);
      setSelectedPiece(null);
      onPlaySound('star');
      onMove(history.length + 1);
      checkWin(newPlaced);
    },
    undo: () => {
      if (isWon || history.length === 0) return;
      const prevState = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setPlaced(prevState.placed);
      setTray(prevState.tray);
      onMove(history.length - 1);
      onPlaySound('swap');
      setSelectedPiece(null);
    },
    reset: () => {
      generatePuzzle();
      onPlaySound('swap');
    },
    getState: () => {
      return { placed, tray };
    }
  }));

  const getPiecePath = (shape: PuzzleShape) => {
      const seg = (xStart: number, yStart: number, xEnd: number, yEnd: number, type: number) => {
          if (type === 0) return `L ${xEnd} ${yEnd}`;
          const uX = (xEnd - xStart) / 100;
          const uY = (yEnd - yStart) / 100;
          const vX = uY;
          const vY = -uX;

          const p1x = xStart + 40*uX; const p1y = yStart + 40*uY;
          const p2x = xStart + 35*uX + 5*vX*type; const p2y = yStart + 35*uY + 5*vY*type;
          const p3x = xStart + 30*uX + 20*vX*type; const p3y = yStart + 30*uY + 20*vY*type;
          const p4x = xStart + 50*uX + 20*vX*type; const p4y = yStart + 50*uY + 20*vY*type;
          const p5x = xStart + 70*uX + 20*vX*type; const p5y = yStart + 70*uY + 20*vY*type;
          const p6x = xStart + 65*uX + 5*vX*type; const p6y = yStart + 65*uY + 5*vY*type;
          const p7x = xStart + 60*uX; const p7y = yStart + 60*uY;
          const p8x = xEnd; const p8y = yEnd;
          
          return `L ${p1x} ${p1y} C ${p2x} ${p2y}, ${p3x} ${p3y}, ${p4x} ${p4y} C ${p5x} ${p5y}, ${p6x} ${p6y}, ${p7x} ${p7y} L ${p8x} ${p8y}`;
      };

      let path = `M 0 0 `;
      path += seg(0, 0, 100, 0, shape.top) + ' ';
      path += seg(100, 0, 100, 100, shape.right) + ' ';
      path += seg(100, 100, 0, 100, shape.bottom) + ' ';
      path += seg(0, 100, 0, 0, shape.left);
      return path + ' Z';
  };

  const renderPiece = (pieceId: number, source: { type: 'tray' | 'board', index: number }) => {
    const correctCol = pieceId % columns;
    const correctRow = Math.floor(pieceId / columns);
    const isSelected = selectedPiece?.id === pieceId;
    const isLocked = source.type === 'board' && pieceId === source.index;
    const shape = shapes[pieceId];

    if (!shape) return null;

    const pathData = getPiecePath(shape);
    const clipId = `clip-${uniqueId}-${generation}-${pieceId}`;

    return (
      <motion.div
        layout
        layoutId={`piece-${pieceId}`}
        onClick={(e) => { e.stopPropagation(); if(!isPreview) handlePieceClick(pieceId, source); }}
        whileHover={{ scale: isWon || isPreview || isLocked ? 1 : 1.05 }}
        whileTap={{ scale: isWon || isPreview || isLocked ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          !isWon && !isPreview && !isLocked && "cursor-pointer",
          isSelected ? "z-30 scale-95" : (isLocked ? "z-0" : "z-10"),
          !isWon && !isLocked && "drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
        )}
      >
        <svg
          viewBox="-30 -30 160 160"
          className="absolute pointer-events-none"
          style={{
            width: '160%',
            height: '160%'
          }}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={pathData} transform="translate(50, 50) scale(1.04) translate(-50, -50)" />
            </clipPath>
          </defs>
          <image 
             href={imageUrl}
             width={`${columns * 100}`}
             height={`${rows * 100}`}
             x={`${-correctCol * 100}`}
             y={`${-correctRow * 100}`}
             clipPath={`url(#${clipId})`}
             preserveAspectRatio="none"
          />
          <path 
            d={pathData} 
            fill="none" 
            stroke={isWon || isLocked ? "transparent" : "rgba(255,255,255,0.4)"} 
            strokeWidth={isWon || isLocked ? "0" : "1.5"} 
            className="transition-all duration-1000"
            transform="translate(50, 50) scale(1.04) translate(-50, -50)"
          />
          {isSelected && (
            <path 
              d={pathData} 
              fill="rgba(255, 215, 0, 0.3)" 
              stroke="rgba(255, 215, 0, 0.8)" 
              strokeWidth="3" 
              transform="translate(50, 50) scale(1.04) translate(-50, -50)"
            />
          )}
        </svg>
      </motion.div>
    );
  };

  const activePieces = tray
    .map((val, idx) => ({ val, idx }))
    .filter((item): item is { val: number, idx: number } => item.val !== null);

  const half = Math.ceil(activePieces.length / 2);
  const leftTray = activePieces.slice(0, half);
  const rightTray = activePieces.slice(half);

  const handleReturnToTray = () => {
    if (isWon || isPreview || !selectedPiece) return;
    if (selectedPiece.source.type === 'board') {
      const firstEmptyIdx = tray.indexOf(null);
      if (firstEmptyIdx !== -1) {
        handleTraySlotClick(firstEmptyIdx);
      }
    }
  };

  const canReturnPiece = selectedPiece && selectedPiece.source.type === 'board';

  const renderTraySlot = (pieceId: number | null, globalIndex: number) => (
    <div 
      key={`tray-slot-${globalIndex}`} 
      onClick={() => handleTraySlotClick(globalIndex)}
      className="relative w-[calc(100%-8px)] aspect-square flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer max-h-full my-1 mx-1" 
    >
       {pieceId !== null && renderPiece(pieceId, { type: 'tray', index: globalIndex })}
    </div>
  );

  return (
    <LayoutGroup>
      <div className="flex flex-row gap-1 sm:gap-2 w-full h-full items-stretch justify-center max-w-none mx-auto pb-0 px-0">
        {/* Left Tray */}
        {!isWon && (
          <div 
            onClick={handleReturnToTray}
            className={cn(
               "w-[20vw] sm:w-[100px] lg:w-[140px] h-[calc(100vh-80px)] border-[3px] rounded-2xl p-1 flex flex-col gap-2 items-center justify-start shadow-xl transition-all flex-shrink-0 relative overflow-y-auto overflow-x-hidden no-scrollbar cursor-pointer",
               canReturnPiece ? "border-amber-600/60 shadow-[0_0_15px_rgba(217,119,6,0.2)] bg-[#583720] animate-pulse" : "border-[#2D1B11] bg-[#4A2E1B]",
               isPreview ? "opacity-50 pointer-events-none" : ""
            )}
          >
            {leftTray.map((item) => renderTraySlot(item.val, item.idx))}
          </div>
        )}

        {/* Board */}
        <div className="flex-1 w-full h-full flex items-center justify-center relative min-h-0 mx-auto px-1 sm:px-2">
          <div 
            className={cn(
               "relative rounded-xl transition-all duration-1000",
               isWon ? "border-0 shadow-[0_0_50px_rgba(255,215,0,0.4)]" : "border-[6px] sm:border-[12px] border-[#5E3A22] bg-[#2D1B11] shadow-2xl"
            )}
            style={{
              aspectRatio: `${columns}/${rows}`,
              height: '100%',
              maxHeight: 'calc(100vh - 80px)',
              maxWidth: `calc((100vh - 80px) * ${columns}/${rows})`,
              width: '100%'
            }}
          >
            {/* Faded Hint Image */}
            {!isWon && (
              <img 
                 src={imageUrl} 
                 className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm transition-opacity", isPreview ? "duration-0" : "duration-300 sepia-[20%]")} 
                 alt="hint" 
                 style={{ opacity: showHint ? (isPreview ? 1 : 0.3) : 0, zIndex: isPreview ? 20 : 0 }}
              />
            )}
            
            {isPreview && (
              <div className="absolute inset-0 z-30 pointer-events-none rounded-sm">
                {/* No text during preview as requested */}
              </div>
            )}
            
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: '0px'
              }}
            >
              {placed.map((pieceId, slotIdx) => (
                <div 
                  key={`slot-${slotIdx}`}
                  onClick={() => { if(!isPreview) handleSlotClick(slotIdx); }}
                  className="w-full h-full relative flex items-center justify-center"
                >
                  {/* Dashed border overlay so it doesn't affect absolute inset-0 child layout sizing */}
                  {!isWon && pieceId === null && (
                    <div className="absolute inset-0 border border-white/10 border-dashed pointer-events-none z-0" />
                  )}
                  {pieceId !== null && renderPiece(pieceId, { type: 'board', index: slotIdx })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Tray */}
        {!isWon && (
          <div 
            onClick={handleReturnToTray}
            className={cn(
               "w-[20vw] sm:w-[100px] lg:w-[140px] h-[calc(100vh-80px)] border-[3px] rounded-2xl p-1 flex flex-col gap-2 items-center justify-start shadow-xl transition-all flex-shrink-0 relative overflow-y-auto overflow-x-hidden no-scrollbar cursor-pointer",
               canReturnPiece ? "border-amber-600/60 shadow-[0_0_15px_rgba(217,119,6,0.2)] bg-[#583720] animate-pulse" : "border-[#2D1B11] bg-[#4A2E1B]",
               isPreview ? "opacity-50 pointer-events-none" : ""
            )}
          >
            {rightTray.map((item) => renderTraySlot(item.val, item.idx))}
          </div>
        )}
      </div>
    </LayoutGroup>
  );
});
