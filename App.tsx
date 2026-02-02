
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TileData, MoveAction, Language, GameConfigType } from './types.ts';
import { generateLevelFromConfig, checkIsLocked, shuffleArray } from './utils/gameLogic.ts';
import { GAME_CONFIG, TRANSLATIONS, SLOT_BAR_WIDTH, LEVEL_CONFIGS, LANGUAGES, ANIMALS } from './constants.tsx';
import Tile from './components/Tile.tsx';
import SlotBar from './components/SlotBar.tsx';

const App: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [gameState, setGameState] = useState<'home' | 'playing' | 'won' | 'lost'>('home');
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [matchingTypeId, setMatchingTypeId] = useState<number | null>(null);
  
  const [movingTiles, setMovingTiles] = useState<Record<string, { x: number; y: number }>>({});
  const [history, setHistory] = useState<MoveAction[]>([]);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('game_lang');
    return (saved as Language) || 'zh-CN';
  });
  const [isLevelLoading, setIsLevelLoading] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const matchTimerRef = useRef<number | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS['zh-CN'];

  const [skills, setSkills] = useState({ undo: 3, shuffle: 3, moveOut: 3 });

  useEffect(() => {
    const imagesToPreload = [
      "https://i.ibb.co/n8NZsdY4/removed-bg-visionforge-4b8ijht4g.png",
      ...ANIMALS
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshLocks = useCallback((currentTiles: TileData[], movingIds: string[] = []) => {
    return currentTiles.map(tile => ({
      ...tile,
      isLocked: checkIsLocked(tile, currentTiles, movingIds)
    }));
  }, []);

  const hudHeight = 80; 
  const bottomUiHeight = 180; 
  const gameAreaHeight = windowSize.height - hudHeight - bottomUiHeight;
  
  const boardScale = useMemo(() => {
    const designWidth = 1100;
    const designHeight = 1100;
    const padding = 20;
    const scaleW = (windowSize.width - padding) / designWidth;
    const scaleH = (gameAreaHeight - padding) / designHeight;
    return Math.min(Math.max(Math.min(scaleW, scaleH), 0.2), 1.2);
  }, [windowSize.width, gameAreaHeight]);

  const initLevel = useCallback((lvl: number) => {
    setIsLevelLoading(true);
    const configIndex = Math.min(Math.max(lvl, 1), 7) - 1;
    const config = LEVEL_CONFIGS[configIndex];
    const newTiles = generateLevelFromConfig(config);
    setTiles(refreshLocks(newTiles, []));
    setGameState('playing');
    setIsProcessingMatch(false);
    setMatchingTypeId(null);
    setMovingTiles({});
    setHistory([]);
    setSkills({ undo: 3, shuffle: 3, moveOut: 3 });
    setTimeout(() => setIsLevelLoading(false), 300);
  }, [refreshLocks]);

  const handleRestart = () => initLevel(level);

  const handleNextLevel = () => {
    if (level < 7) {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      initLevel(nextLvl);
    } else {
      setGameState('home'); 
      setLevel(1);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && tiles.length === 0 && !isLevelLoading) {
      initLevel(level);
    }
  }, [level, gameState, initLevel, tiles.length, isLevelLoading]);

  const boardTiles = useMemo(() => tiles.filter(t => t.status === 'board'), [tiles]);
  const slotTiles = useMemo(() => {
    return tiles.filter(t => t.status === 'slot').sort((a, b) => a.layer - b.layer);
  }, [tiles]);
  const stagingTiles = useMemo(() => tiles.filter(t => t.status === 'staging'), [tiles]);

  useEffect(() => {
    if (gameState !== 'playing' || isLevelLoading || Object.keys(movingTiles).length > 0 || isProcessingMatch) return;
    const typeCounts: Record<number, number> = {};
    slotTiles.forEach(tile => { typeCounts[tile.typeId] = (typeCounts[tile.typeId] || 0) + 1; });
    const matchEntry = Object.entries(typeCounts).find(([_, count]) => count >= GAME_CONFIG.MATCH_COUNT);
    
    if (matchEntry) {
      const typeId = Number(matchEntry[0]);
      setIsProcessingMatch(true);
      setMatchingTypeId(typeId);
      
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
      matchTimerRef.current = window.setTimeout(() => {
        setTiles(prev => {
          const targetIds = prev
            .filter(t => t.status === 'slot' && t.typeId === typeId)
            .sort((a, b) => a.layer - b.layer)
            .slice(0, GAME_CONFIG.MATCH_COUNT)
            .map(t => t.id);

          const updated: TileData[] = prev.map(tile => 
            targetIds.includes(tile.id) ? { ...tile, status: 'eliminated' as const } : tile
          );
          
          const remainingInSlot = updated.filter(t => t.status === 'slot').sort((a, b) => a.layer - b.layer);
          return updated.map(t => {
            if (t.status === 'slot') {
              const i = remainingInSlot.findIndex(rs => rs.id === t.id);
              return { ...t, layer: i };
            }
            return t;
          });
        });
        setIsProcessingMatch(false);
        setMatchingTypeId(null);
        setHistory([]); 
        matchTimerRef.current = null;
      }, 400); 
    } else if (slotTiles.length >= GAME_CONFIG.SLOT_CAPACITY) {
      setGameState('lost');
    } else {
      const activeTiles = tiles.filter(t => t.status === 'board' || t.status === 'slot' || t.status === 'staging');
      if (tiles.length > 0 && activeTiles.length === 0) setGameState('won');
    }
  }, [tiles, movingTiles, gameState, isLevelLoading, slotTiles, isProcessingMatch]);

  const handleTileClick = (clickedTile: TileData) => {
    if (gameState !== 'playing' || clickedTile.isLocked || (clickedTile.status !== 'board' && clickedTile.status !== 'staging') || isLevelLoading || movingTiles[clickedTile.id]) return;
    
    const activeSlotTilesCount = slotTiles.filter(t => t.typeId !== matchingTypeId).length;
    const totalCurrentSlotItems = activeSlotTilesCount + Object.keys(movingTiles).length;
    if (totalCurrentSlotItems >= GAME_CONFIG.SLOT_CAPACITY) return;

    const currentUiScale = Math.min(1, (windowSize.width * 0.95) / SLOT_BAR_WIDTH);
    const trayLeft = (windowSize.width - (SLOT_BAR_WIDTH * currentUiScale)) / 2;
    const trayBottomY = windowSize.height - 85; 
    const trayTopY = trayBottomY + 18;
    const { SLOT_TILE_SIZE, SLOT_GAP, SLOT_PADDING } = GAME_CONFIG;
    
    const targetX = trayLeft + (SLOT_PADDING * currentUiScale) + (totalCurrentSlotItems * (SLOT_TILE_SIZE + SLOT_GAP) * currentUiScale) + (SLOT_TILE_SIZE / 2 * currentUiScale);
    const targetY = trayTopY + (SLOT_TILE_SIZE / 2 * currentUiScale);
    
    const gameCenterX = windowSize.width / 2;
    const gameCenterY = hudHeight + (gameAreaHeight / 2);
    const boardRelativeTarget = { 
      x: (targetX / boardScale) - (gameCenterX / boardScale), 
      y: (targetY / boardScale) - (gameCenterY / boardScale) 
    };
    
    setMovingTiles(prev => ({ ...prev, [clickedTile.id]: boardRelativeTarget }));
    setHistory(prev => [...prev, { tileId: clickedTile.id, fromX: clickedTile.x, fromY: clickedTile.y, fromLayer: clickedTile.layer }]);

    setTimeout(() => {
      setTiles(prev => {
        const currentSlot = prev.filter(t => t.status === 'slot').sort((a, b) => a.layer - b.layer);
        let logicalInsertAt = -1;
        for (let i = currentSlot.length - 1; i >= 0; i--) { if (currentSlot[i].typeId === clickedTile.typeId) { logicalInsertAt = i; break; } }
        const nextSlotOrder = [...currentSlot];
        if (logicalInsertAt === -1) nextSlotOrder.push({ ...clickedTile, status: 'slot' as const, layer: currentSlot.length });
        else nextSlotOrder.splice(logicalInsertAt + 1, 0, { ...clickedTile, status: 'slot' as const, layer: logicalInsertAt + 1 });
        const idToLayerMap = new Map(nextSlotOrder.map((s, i) => [s.id, i]));
        
        const updated: TileData[] = prev.map(t => {
          if (t.id === clickedTile.id) return { ...t, status: 'slot' as const, layer: idToLayerMap.get(t.id) || 0 };
          if (t.status === 'slot') return { ...t, layer: idToLayerMap.get(t.id) ?? t.layer };
          return t;
        });
        return refreshLocks(updated, []);
      });
      setMovingTiles(prev => { const next = { ...prev }; delete next[clickedTile.id]; return next; });
    }, 190); 
  };

  const handleUndo = () => {
    if (history.length === 0 || skills.undo <= 0 || Object.keys(movingTiles).length > 0 || isProcessingMatch) return;
    const lastMove = history[history.length - 1];
    setTiles(prev => {
      const updated: TileData[] = prev.map(t => (t.id === lastMove.tileId) ? { ...t, status: 'board' as const, x: lastMove.fromX, y: lastMove.fromY, layer: lastMove.fromLayer } : t);
      return refreshLocks(updated, []);
    });
    setHistory(prev => prev.slice(0, -1));
    setSkills(prev => ({ ...prev, undo: prev.undo - 1 }));
  };

  const handleShuffle = () => {
    if (skills.shuffle <= 0 || boardTiles.length === 0 || Object.keys(movingTiles).length > 0 || isProcessingMatch) return;
    const currentBoard = tiles.filter(t => t.status === 'board');
    const shuffledTypes = shuffleArray(currentBoard.map(t => t.typeId));
    setTiles(prev => {
      let shuffledIdx = 0;
      const updated = prev.map(t => (t.status === 'board') ? { ...t, typeId: shuffledTypes[shuffledIdx++] } : t);
      return refreshLocks(updated, []);
    });
    setSkills(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
  };

  const handleMoveOut = () => {
    if (skills.moveOut <= 0 || slotTiles.length === 0 || Object.keys(movingTiles).length > 0 || isProcessingMatch) return;
    const tilesToMove = slotTiles.slice(0, 3);
    const tileIds = tilesToMove.map(t => t.id);
    
    // 计算底部功能键上方的本地 y 坐标
    const gameAreaBottomY = windowSize.height - bottomUiHeight;
    const gameCenterY = hudHeight + (gameAreaHeight / 2);
    // 关键：该坐标计算使 staging 始终在 UI 面板上方边缘附近
    const stagingY = (gameAreaBottomY - gameCenterY) / boardScale - 180;

    setTiles(prev => {
      const updated: TileData[] = prev.map(t => {
        if (tileIds.includes(t.id)) {
          const idx = tileIds.indexOf(t.id);
          return { 
            ...t, 
            status: 'staging' as const, 
            x: (idx - 1) * (GAME_CONFIG.BOARD_TILE_SIZE + 20), 
            y: stagingY, 
            layer: 10000 + idx // 确保在最顶层
          };
        }
        return t;
      });
      return refreshLocks(updated, []);
    });
    setSkills(prev => ({ ...prev, moveOut: prev.moveOut - 1 }));
    setHistory([]); 
  };

  const changeLanguage = (lang: Language) => { setLanguage(lang); localStorage.setItem('game_lang', lang); setShowLangModal(false); };

  const currentLevelConfig = LEVEL_CONFIGS[level - 1];

  if (gameState === 'home') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#FFF5F7] flex flex-col items-center select-none font-sans">
        <style>{`
          @keyframes hero-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes title-pulse {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.1); }
          }
          @keyframes petal-sway {
            0%, 100% { transform: rotate(-10deg) translateY(0); opacity: 0.5; }
            50% { transform: rotate(10deg) translateY(-8px); opacity: 0.8; }
          }
          .animate-float { animation: hero-float 10s ease-in-out infinite; }
          .animate-title { animation: title-pulse 4s ease-in-out infinite; }
          .petal-accent { 
            position: absolute; 
            pointer-events: none; 
            animation: petal-sway 6s ease-in-out infinite; 
          }
          .macaron-title {
            background: linear-gradient(to right, #FFB7B2, #FACADE, #B2E2F2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 950;
          }
          .hero-halo {
             background: radial-gradient(circle, rgba(255,182,193,0.3) 0%, rgba(212,226,244,0.1) 60%, transparent 95%);
          }
          .sharp-img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: auto;
            -webkit-font-smoothing: antialiased;
            display: block;
            margin: 0 auto;
            max-height: 80vh;
            max-width: 90vw;
            object-fit: contain;
          }
        `}</style>

        {[...Array(6)].map((_, i) => (
          <div key={`petal-${i}`} className="petal-accent" 
               style={{ 
                 left: `${[10, 85, 15, 90, 45, 75][i]}%`, 
                 top: `${[20, 15, 70, 85, 35, 60][i]}%`, 
                 fontSize: `${24 + i * 2}px`, 
                 animationDelay: `${-i * 1.5}s`
               }}>
            🌸
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[100vh] h-[100vh] hero-halo blur-[80px] rounded-full opacity-50"></div>
        </div>

        <div className="relative z-20 mt-16 sm:mt-24 text-center px-4 animate-title">
          <h1 className="text-6xl sm:text-7xl macaron-title tracking-[0.15em] italic uppercase">
            {t.title}
          </h1>
          <div className="w-20 h-1 bg-rose-100/30 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="relative flex items-center justify-center animate-float">
             <img 
                src="https://i.ibb.co/n8NZsdY4/removed-bg-visionforge-4b8ijht4g.png" 
                alt="Princess"
                className="sharp-img"
                loading="eager"
              />
          </div>
        </div>

        <div className="relative mt-auto mb-20 z-30 flex flex-col items-center gap-6">
          <button onClick={() => { setLevel(1); initLevel(1); }}
            className="px-16 py-6 bg-gradient-to-br from-[#FADADD] to-[#FFD1DC] text-[#9A6064] rounded-full font-black text-4xl hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(250,218,221,0.6)] border-b-[10px] border-[#E8A0A8] transition-all tracking-[0.2em]">
            {t.startGame}
          </button>
          
          <button onClick={() => setShowLangModal(true)} 
            className="px-12 py-3 bg-white/70 backdrop-blur-md text-[#8DA9D4] rounded-full font-bold border border-white/50 active:translate-y-0.5 transition-all shadow-md text-base uppercase tracking-widest flex items-center gap-3">
            <span className="text-xl">🌐</span> {t.selectLanguage}
          </button>
        </div>

        {showLangModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/5 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
            <div className="bg-white/95 rounded-[48px] p-10 w-full max-w-sm shadow-2xl border border-white/40 animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-[#8DA9D4] mb-8 text-center uppercase tracking-widest">{t.selectLanguage}</h3>
              <div className="grid grid-cols-1 gap-3">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => changeLanguage(lang.code)} 
                    className={`px-6 py-4 rounded-[24px] font-bold transition-all border flex items-center gap-4 ${language === lang.code ? 'bg-[#D4E2F4] text-white border-[#8DA9D4]' : 'bg-white text-[#8DA9D4] border-[#D4E2F4] hover:bg-rose-50'}`}>
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-lg">{lang.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowLangModal(false)} className="mt-8 w-full py-2 text-[#8DA9D4]/40 font-bold hover:text-[#8DA9D4] uppercase text-xs tracking-widest">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isFinalLevel = level === 7;
  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col transition-colors duration-1000"
      style={{ backgroundColor: currentLevelConfig?.bgColor || '#FFF5F7' }}
    >
      <div className="h-20 w-full px-6 flex justify-between items-center z-[1500] relative">
        <button onClick={() => setGameState('home')} className="w-12 h-12 bg-white/90 backdrop-blur-md shadow-lg rounded-xl flex items-center justify-center text-2xl text-[#8DA9D4] border border-white">🏠</button>
        <div className="bg-white/95 backdrop-blur-md border border-white rounded-full px-10 py-2 shadow-xl flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-[#9A6064]/60 uppercase tracking-widest">{t.level}</span>
            <span className="text-2xl font-black text-[#9A6064]">{level}/7</span>
          </div>
          <div className="h-8 w-px bg-rose-50"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-[#9A6064]/60 uppercase tracking-widest">{t.remain}</span>
            <span className="text-2xl font-black text-[#9A6064]">{boardTiles.length + stagingTiles.length}</span>
          </div>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center z-[1000]">
        <div className="relative pointer-events-none flex items-center justify-center"
             style={{ 
               width: 0, 
               height: 0, 
               transform: `scale(${boardScale})`, 
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
          <div className="relative pointer-events-auto flex items-center justify-center" style={{ width: 0, height: 0 }}>
            {tiles.map(tile => <Tile key={tile.id} tile={tile} onClick={handleTileClick} targetPos={movingTiles[tile.id] || null} />)}
          </div>
        </div>
      </div>

      <div className="h-[180px] w-full flex flex-col items-center justify-center gap-3 z-[500] pb-6 pointer-events-none">
        <div className="flex gap-4 pointer-events-auto scale-75 sm:scale-80">
          <button onClick={handleMoveOut} disabled={skills.moveOut === 0 || slotTiles.length === 0} className={`flex flex-col items-center gap-1.5 px-6 py-4 rounded-[28px] bg-white border-b-6 shadow-xl transition-all ${skills.moveOut > 0 ? 'border-blue-50 text-[#8DA9D4] active:scale-95' : 'opacity-30 grayscale'}`}>
            <div className="text-3xl">📤</div><span className="text-[10px] font-black uppercase tracking-widest">{t.moveOut}</span>
          </button>
          <button onClick={handleUndo} disabled={skills.undo === 0 || history.length === 0} className={`flex flex-col items-center gap-1.5 px-6 py-4 rounded-[28px] bg-white border-b-6 shadow-xl transition-all ${skills.undo > 0 ? 'border-yellow-50 text-[#D4C58D] active:scale-95' : 'opacity-30 grayscale'}`}>
            <div className="text-3xl">↩️</div><span className="text-[10px] font-black uppercase tracking-widest">{t.undo}</span>
          </button>
          <button onClick={handleShuffle} disabled={skills.shuffle === 0 || boardTiles.length === 0} className={`flex flex-col items-center gap-1.5 px-6 py-4 rounded-[28px] bg-white border-b-6 shadow-xl transition-all ${skills.shuffle > 0 ? 'border-purple-50 text-[#A98DD4] active:scale-95' : 'opacity-30 grayscale'}`}>
            <div className="text-3xl">🔀</div><span className="text-[10px] font-black uppercase tracking-widest">{t.shuffle}</span>
          </button>
        </div>
        <div className="pointer-events-auto relative"><SlotBar slotTiles={slotTiles} language={language} matchingTypeId={matchingTypeId} /></div>
      </div>

      {gameState === 'lost' && (
        <div className="fixed inset-0 z-[4000] bg-black/20 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[48px] p-12 max-w-[320px] w-full text-center shadow-2xl border-b-[12px] border-[#E8A0A8] animate-in zoom-in duration-300">
            <div className="text-6xl mb-8">🥀</div>
            <h2 className="text-2xl font-black text-[#9A6064] mb-3 uppercase tracking-tight">{t.gameOver}</h2>
            <p className="text-lg text-[#9A6064]/60 mb-10 font-bold">{t.gameOverDesc}</p>
            <button onClick={handleRestart} className="w-full py-5 bg-[#FADADD] text-[#9A6064] rounded-full font-black text-2xl shadow-xl active:translate-y-1 transition-all border-b-8 border-[#E8A0A8] uppercase tracking-widest">{t.restart}</button>
          </div>
        </div>
      )}
      {gameState === 'won' && (
        <div className="fixed inset-0 z-[4000] bg-white/40 backdrop-blur-3xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[56px] p-12 max-w-[400px] w-full text-center shadow-2xl border-b-[14px] border-[#D4E2F4] animate-in zoom-in duration-300">
            <div className="text-7xl mb-8">🏰</div>
            <h2 className="text-3xl font-black text-[#8DA9D4] mb-4 uppercase italic tracking-tighter">{t.victory}</h2>
            <div className="my-6 bg-[#F8FAFF] py-8 px-8 rounded-[40px] border border-rose-50 shadow-inner">
               <p className="text-base text-[#8DA9D4]/70 font-bold leading-relaxed">{t.journeySteps?.[level - 1]}</p>
            </div>
            <button onClick={handleNextLevel} className={`w-full py-5 ${isFinalLevel ? 'bg-[#FADADD] text-[#9A6064] border-[#E8A0A8]' : 'bg-[#D4E2F4] text-[#8DA9D4] border-[#B2C8E8]'} rounded-full font-black text-2xl shadow-xl border-b-10 transition-all active:translate-y-1 uppercase tracking-widest`}>{isFinalLevel ? t.finish : t.continue}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
