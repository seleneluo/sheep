
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TileData, MoveAction, Language, GameConfigType } from './types.ts';
import { generateLevelFromConfig, checkIsLocked, shuffleArray } from './utils/gameLogic.ts';
import { GAME_CONFIG, TRANSLATIONS, SLOT_BAR_WIDTH, GAME_CONFIGS, LANGUAGES } from './constants.tsx';
import Tile from './components/Tile.tsx';
import SlotBar from './components/SlotBar.tsx';

const App: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<keyof typeof GAME_CONFIGS>('easy'); // Default set to 'easy'
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [gameState, setGameState] = useState<'home' | 'playing' | 'won' | 'lost'>('home');
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [matchingTypeId, setMatchingTypeId] = useState<number | null>(null);
  const [movingTileId, setMovingTileId] = useState<string | null>(null);
  const [targetSlotPos, setTargetSlotPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<MoveAction[]>([]);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('game_lang');
    return (saved as Language) || 'zh-CN';
  });
  const [isLevelLoading, setIsLevelLoading] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const matchTimerRef = useRef<number | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS['zh-CN'];

  const [skills, setSkills] = useState({
    undo: 2, // Buffed to 2 for ease
    shuffle: 3, // Buffed to 3 for ease
    moveOut: 2 // Buffed to 2 for ease
  });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshLocks = useCallback((currentTiles: TileData[], movingId?: string | null) => {
    return currentTiles.map(tile => ({
      ...tile,
      isLocked: checkIsLocked(tile, currentTiles, movingId)
    }));
  }, []);

  // UI Geometry Constants
  const hudHeight = 80;
  const bottomUiHeight = 220; // Fixed space for slot and skills
  
  const gameAreaHeight = windowSize.height - hudHeight - bottomUiHeight;
  const gameCenterY = hudHeight + (gameAreaHeight / 2);
  const gameCenterX = windowSize.width / 2;

  // Responsive scaling factor for the board stack
  const boardScale = useMemo(() => {
    const designBoardWidth = 360; 
    const designBoardHeight = 360;
    const scaleW = (windowSize.width * 0.85) / designBoardWidth;
    const scaleH = (gameAreaHeight * 0.85) / designBoardHeight;
    // Don't let it get too huge or too small
    return Math.min(Math.max(Math.min(scaleW, scaleH), 0.6), 1.2);
  }, [windowSize.width, gameAreaHeight]);

  const initLevel = useCallback((lvl: number, diff: keyof typeof GAME_CONFIGS) => {
    setIsLevelLoading(true);
    const config = GAME_CONFIGS[diff];
    const newTiles = generateLevelFromConfig(config);
    const processedTiles = refreshLocks(newTiles, null);
    
    setTiles(processedTiles);
    setGameState('playing');
    setIsProcessingMatch(false);
    setMatchingTypeId(null);
    setMovingTileId(null);
    setHistory([]);
    setSkills({ undo: 2, shuffle: 3, moveOut: 2 });
    
    setTimeout(() => setIsLevelLoading(false), 300);
  }, [refreshLocks]);

  const handleRestart = () => {
    setLevel(1);
    initLevel(1, difficulty);
  };

  const handleNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    initLevel(nextLvl, difficulty);
  };

  useEffect(() => {
    if (gameState === 'playing' && tiles.length === 0 && !isLevelLoading) {
      initLevel(level, difficulty);
    }
  }, [level, gameState, initLevel, tiles.length, isLevelLoading, difficulty]);

  const boardTiles = useMemo(() => tiles.filter(t => t.status === 'board'), [tiles]);
  const slotTiles = useMemo(() => {
    return tiles
      .filter(t => t.status === 'slot')
      .sort((a, b) => a.layer - b.layer);
  }, [tiles]);
  const stagingTiles = useMemo(() => tiles.filter(t => t.status === 'staging'), [tiles]);

  useEffect(() => {
    if (gameState !== 'playing' || isLevelLoading || movingTileId || isProcessingMatch) return;

    const typeCounts: Record<number, number> = {};
    slotTiles.forEach(tile => {
      typeCounts[tile.typeId] = (typeCounts[tile.typeId] || 0) + 1;
    });

    const matchEntry = Object.entries(typeCounts).find(([_, count]) => count >= GAME_CONFIG.MATCH_COUNT);

    if (matchEntry) {
      const typeId = Number(matchEntry[0]);
      setIsProcessingMatch(true);
      setMatchingTypeId(typeId);

      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);

      matchTimerRef.current = window.setTimeout(() => {
        setTiles(prev => {
          const updated = prev.map(tile => {
            if (tile.status === 'slot' && tile.typeId === typeId) {
              return { ...tile, status: 'eliminated' as const };
            }
            return tile;
          });

          const remainingInSlot = updated
            .filter(t => t.status === 'slot')
            .sort((a, b) => a.layer - b.layer);
          
          return updated.map(t => {
            if (t.status === 'slot') {
              const newIdx = remainingInSlot.findIndex(rs => rs.id === t.id);
              return { ...t, layer: newIdx };
            }
            return t;
          });
        });
        
        setIsProcessingMatch(false);
        setMatchingTypeId(null);
        setHistory([]); 
        matchTimerRef.current = null;
      }, 500); 
    } else {
      if (slotTiles.length >= GAME_CONFIG.SLOT_CAPACITY) {
        setGameState('lost');
      } else {
        const activeTiles = tiles.filter(t => t.status === 'board' || t.status === 'slot' || t.status === 'staging');
        if (tiles.length > 0 && activeTiles.length === 0) {
          setGameState('won');
        }
      }
    }
  }, [tiles, movingTileId, gameState, isLevelLoading, slotTiles, isProcessingMatch]);

  const handleTileClick = (clickedTile: TileData) => {
    if (
      gameState !== 'playing' || 
      clickedTile.isLocked || 
      (clickedTile.status !== 'board' && clickedTile.status !== 'staging') ||
      slotTiles.length >= GAME_CONFIG.SLOT_CAPACITY || 
      isProcessingMatch || 
      movingTileId || 
      isLevelLoading
    ) return;

    setTiles(prev => refreshLocks(prev, clickedTile.id));
    setMovingTileId(clickedTile.id);

    let insertIdx = slotTiles.length;
    for (let i = slotTiles.length - 1; i >= 0; i--) {
      if (slotTiles[i].typeId === clickedTile.typeId) {
        insertIdx = i + 1;
        break;
      }
    }

    const currentUiScale = Math.min(1, (windowSize.width * 0.95) / SLOT_BAR_WIDTH);
    const trayLeft = (windowSize.width - (SLOT_BAR_WIDTH * currentUiScale)) / 2;
    const trayBottomY = windowSize.height - 100; // Bottom of slot area
    const trayTopY = trayBottomY + 10;
    const { TILE_SIZE, SLOT_GAP, SLOT_PADDING } = GAME_CONFIG;
    
    const targetX = trayLeft + (SLOT_PADDING * currentUiScale) + (insertIdx * (TILE_SIZE + SLOT_GAP) * currentUiScale);
    const targetY = trayTopY;

    setTargetSlotPos({ 
      x: (targetX / boardScale) - (gameCenterX / boardScale), 
      y: (targetY / boardScale) - (gameCenterY / boardScale) 
    });

    setHistory(prev => [...prev, {
      tileId: clickedTile.id,
      fromX: clickedTile.x,
      fromY: clickedTile.y,
      fromLayer: clickedTile.layer
    }]);

    setTimeout(() => {
      setTiles(prev => {
        const currentSlot = prev.filter(t => t.status === 'slot').sort((a, b) => a.layer - b.layer);
        let logicalInsertAt = -1;
        for (let i = currentSlot.length - 1; i >= 0; i--) {
          if (currentSlot[i].typeId === clickedTile.typeId) {
            logicalInsertAt = i;
            break;
          }
        }

        const nextSlotOrder = [...currentSlot];
        if (logicalInsertAt === -1) {
          nextSlotOrder.push({ ...clickedTile, status: 'slot' as const, layer: currentSlot.length });
        } else {
          nextSlotOrder.splice(logicalInsertAt + 1, 0, { ...clickedTile, status: 'slot' as const, layer: logicalInsertAt + 1 });
        }

        const idToLayerMap = new Map(nextSlotOrder.map((s, i) => [s.id, i]));
        const updated = prev.map(t => {
          if (t.id === clickedTile.id) {
            return { ...t, status: 'slot' as const, layer: idToLayerMap.get(t.id) || 0 };
          }
          if (t.status === 'slot') {
            return { ...t, layer: idToLayerMap.get(t.id) ?? t.layer };
          }
          return t;
        });

        return refreshLocks(updated, null);
      });
      setMovingTileId(null);
      setTargetSlotPos(null);
    }, 450);
  };

  const handleUndo = () => {
    if (history.length === 0 || skills.undo <= 0 || movingTileId || isProcessingMatch) return;
    const lastMove = history[history.length - 1];
    setTiles(prev => {
      const updated = prev.map(t => {
        if (t.id === lastMove.tileId) {
          return { ...t, status: 'board' as const, x: lastMove.fromX, y: lastMove.fromY, layer: lastMove.fromLayer };
        }
        return t;
      });
      return refreshLocks(updated, null);
    });
    setHistory(prev => prev.slice(0, -1));
    setSkills(prev => ({ ...prev, undo: prev.undo - 1 }));
  };

  const handleShuffle = () => {
    if (skills.shuffle <= 0 || boardTiles.length === 0 || movingTileId || isProcessingMatch) return;
    const currentBoard = tiles.filter(t => t.status === 'board');
    const shuffledTypes = shuffleArray(currentBoard.map(t => t.typeId));
    setTiles(prev => {
      let shuffledIdx = 0;
      const updated = prev.map(t => {
        if (t.status === 'board') {
          return { ...t, typeId: shuffledTypes[shuffledIdx++] };
        }
        return t;
      });
      return refreshLocks(updated, null);
    });
    setSkills(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
  };

  const handleMoveOut = () => {
    if (skills.moveOut <= 0 || slotTiles.length === 0 || movingTileId || isProcessingMatch) return;
    const tilesToMove = slotTiles.slice(0, 3);
    const tileIds = tilesToMove.map(t => t.id);
    const { TILE_SIZE } = GAME_CONFIG;

    setTiles(prev => {
      const updated = prev.map(t => {
        if (tileIds.includes(t.id)) {
          const idx = tileIds.indexOf(t.id);
          return { 
            ...t, 
            status: 'staging' as const, 
            x: (idx - 1) * (TILE_SIZE + 20),
            y: 180, 
            layer: 5000 
          };
        }
        return t;
      });
      return refreshLocks(updated, null);
    });
    setSkills(prev => ({ ...prev, moveOut: prev.moveOut - 1 }));
    setHistory([]); 
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('game_lang', lang);
    setShowLangModal(false);
  };

  if (gameState === 'home') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-emerald-50 flex flex-col items-center justify-center p-6 select-none font-sans">
        <style>{`
          @keyframes sheep-jump {
            0%, 100% { transform: translateY(0) scale(1, 1); }
            30% { transform: translateY(-40px) scale(0.9, 1.1); }
            50% { transform: translateY(-60px) scale(0.8, 1.2); }
            80% { transform: translateY(5px) scale(1.1, 0.9); }
          }
          .animate-sheep-home {
            animation: sheep-jump 1.8s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 text-4xl">☁️</div>
          <div className="absolute top-20 right-20 text-4xl">☁️</div>
          <div className="absolute bottom-40 left-20 text-4xl">🌿</div>
          <div className="absolute bottom-20 right-10 text-4xl">🌿</div>
        </div>
        <div className="relative z-10 text-center mb-8 animate-in fade-in slide-in-from-bottom duration-1000">
          <h1 className="text-6xl sm:text-8xl font-black text-emerald-900 drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)] mb-4 tracking-tighter">
            {t.title}
          </h1>
          <div className="w-48 sm:w-64 h-2.5 bg-emerald-500 mx-auto rounded-full opacity-60 shadow-sm"></div>
        </div>
        <div className="relative z-10 mb-12 animate-sheep-home">
          <div className="text-[120px] sm:text-[160px] drop-shadow-2xl">🐑</div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/10 rounded-full blur-xl"></div>
        </div>
        <div className="relative z-10 flex flex-col gap-5 w-full max-w-xs px-4">
          <button 
            onClick={() => initLevel(1, difficulty)}
            className="w-full py-5 bg-emerald-600 text-white rounded-[40px] font-black text-2xl sm:text-3xl hover:bg-emerald-700 shadow-2xl shadow-emerald-200 border-b-[10px] border-emerald-800 active:border-b-0 active:translate-y-2 transition-all tracking-wider"
          >
            {t.startGame}
          </button>
          <div className="flex gap-4">
            <button onClick={() => setShowDiffModal(true)} className="flex-1 py-3 bg-white text-emerald-900 rounded-[28px] font-black border-b-[6px] border-slate-200 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base">
              📊 {t.selectDifficulty}
            </button>
            <button onClick={() => setShowLangModal(true)} className="flex-1 py-3 bg-white text-emerald-900 rounded-[28px] font-black border-b-[6px] border-slate-200 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base">
              🌐 {t.selectLanguage}
            </button>
          </div>
        </div>
        {showDiffModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md p-6 animate-in fade-in">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300 border-b-[12px] border-emerald-600">
              <h3 className="text-3xl font-black text-emerald-900 mb-8 text-center">{t.selectDifficulty}</h3>
              <div className="flex flex-col gap-3">
                {Object.keys(GAME_CONFIGS).map(key => (
                  <button key={key} onClick={() => { setDifficulty(key as any); setShowDiffModal(false); }} className={`py-5 rounded-3xl font-black transition-all border-2 text-xl ${difficulty === key ? 'bg-emerald-600 text-white border-emerald-800 shadow-inner scale-[1.02]' : 'bg-emerald-50 text-emerald-900 border-emerald-100 hover:border-emerald-200'}`}>
                    {t.difficultyNames[key]}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowDiffModal(false)} className="mt-8 w-full py-2 text-slate-400 font-bold hover:text-slate-600 tracking-widest uppercase text-xs">Close</button>
            </div>
          </div>
        )}
        {showLangModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md p-6 animate-in fade-in">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300 border-b-[12px] border-emerald-600">
              <h3 className="text-3xl font-black text-emerald-900 mb-8 text-center">{t.selectLanguage}</h3>
              <div className="grid grid-cols-2 gap-4">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`py-8 rounded-3xl font-black transition-all border-2 flex flex-col items-center gap-3 ${language === lang.code ? 'bg-emerald-600 text-white border-emerald-800 scale-[1.02]' : 'bg-emerald-50 text-emerald-900 border-emerald-100 hover:border-emerald-200'}`}>
                    <span className="text-4xl">{lang.flag}</span>
                    <span className="text-base font-bold">{lang.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowLangModal(false)} className="mt-8 w-full py-2 text-slate-400 font-bold hover:text-slate-600 tracking-widest uppercase text-xs">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-emerald-50 flex flex-col">
      {/* HUD - Always Top */}
      <div className="h-20 w-full px-4 flex justify-between items-center z-[500] relative">
        <button onClick={() => initLevel(level, difficulty)} className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full border-4 border-white shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all">
          🔄
        </button>
        <div className="bg-white/95 backdrop-blur-md border-4 border-emerald-900/10 rounded-[30px] px-6 py-1 shadow-xl flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest leading-none">{t.level}</span>
            <span className="text-xl font-black text-emerald-900 leading-tight">{level}</span>
          </div>
          <div className="h-6 w-[1.5px] bg-emerald-900/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest leading-none">{t.remain}</span>
            <span className="text-xl font-black text-emerald-900 leading-tight">{boardTiles.length + stagingTiles.length}</span>
          </div>
        </div>
        <button onClick={() => setGameState('home')} className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full border-4 border-white shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all">
          🏠
        </button>
      </div>

      {/* Main Playing Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute transition-transform duration-300 pointer-events-none"
          style={{ 
            left: '50%', 
            top: '50%',
            transform: `translate(-50%, -50%) scale(${boardScale})`,
            width: 0,
            height: 0,
            overflow: 'visible'
          }}
        >
          <div className="relative pointer-events-auto">
            {tiles.map(tile => (
              <Tile 
                key={tile.id} 
                tile={tile} 
                onClick={handleTileClick} 
                targetPos={movingTileId === tile.id ? targetSlotPos : null} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls Area (Skills + SlotBar) */}
      <div className="h-[220px] w-full flex flex-col items-center justify-center gap-6 z-[600] pb-4 pointer-events-none">
        {/* Skills Bar */}
        <div className="flex gap-4 sm:gap-6 pointer-events-auto scale-90 sm:scale-100">
          <button onClick={handleMoveOut} disabled={skills.moveOut === 0 || slotTiles.length === 0} className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl bg-white border-b-8 shadow-2xl transition-all ${skills.moveOut > 0 ? 'border-blue-500 hover:scale-105 active:translate-y-1' : 'opacity-40 grayscale border-slate-300'}`}>
            <div className="w-10 h-10 flex items-center justify-center text-3xl">📤</div>
            <span className="text-[9px] font-black text-blue-900 uppercase tracking-tighter">{t.moveOut} ({skills.moveOut})</span>
          </button>
          <button onClick={handleUndo} disabled={skills.undo === 0 || history.length === 0} className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl bg-white border-b-8 shadow-2xl transition-all ${skills.undo > 0 ? 'border-amber-500 hover:scale-105 active:translate-y-1' : 'opacity-40 grayscale border-slate-300'}`}>
            <div className="w-10 h-10 flex items-center justify-center text-3xl">↩️</div>
            <span className="text-[9px] font-black text-amber-900 uppercase tracking-tighter">{t.undo} ({skills.undo})</span>
          </button>
          <button onClick={handleShuffle} disabled={skills.shuffle === 0 || boardTiles.length === 0} className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl bg-white border-b-8 shadow-2xl transition-all ${skills.shuffle > 0 ? 'border-purple-500 hover:scale-105 active:translate-y-1' : 'opacity-40 grayscale border-slate-300'}`}>
            <div className="w-10 h-10 flex items-center justify-center text-3xl">🔀</div>
            <span className="text-[9px] font-black text-purple-900 uppercase tracking-tighter">{t.shuffle} ({skills.shuffle})</span>
          </button>
        </div>

        {/* Slot Bar */}
        <div className="pointer-events-auto relative">
          <SlotBar slotTiles={slotTiles} language={language} matchingTypeId={matchingTypeId} />
        </div>
      </div>

      {/* End Game Modals */}
      {gameState === 'lost' && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl border-b-[16px] border-red-500">
            <div className="text-7xl mb-6">😵</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">{t.gameOver}</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">{t.gameOverDesc}</p>
            <button onClick={handleRestart} className="w-full py-5 bg-red-500 text-white rounded-[32px] font-black text-2xl shadow-2xl active:translate-y-1 transition-all uppercase tracking-wide">
              {t.restart}
            </button>
          </div>
        </div>
      )}
      {gameState === 'won' && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl border-b-[16px] border-emerald-500">
            <div className="text-7xl mb-6">💎🏆</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">{t.victory}</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">{t.victoryDesc}</p>
            <button onClick={handleNextLevel} className="w-full py-5 bg-emerald-600 text-white rounded-[32px] font-black text-2xl shadow-2xl active:translate-y-1 transition-all uppercase tracking-wide">
              {t.continue}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
