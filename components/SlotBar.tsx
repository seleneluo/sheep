
import React, { useMemo, useEffect, useState } from 'react';
import { TileData, TileType, Language } from '../types.ts';
import { TILE_TYPES, GAME_CONFIG, TRANSLATIONS, SLOT_BAR_WIDTH } from '../constants.tsx';

interface SlotBarProps {
  slotTiles: TileData[];
  language: Language;
  matchingTypeId: number | null;
}

const SlotBar: React.FC<SlotBarProps> = ({ slotTiles, language, matchingTypeId }) => {
  const capacity = GAME_CONFIG.SLOT_CAPACITY;
  const placeholders = Array.from({ length: capacity });
  const t = TRANSLATIONS[language];
  const tileSize = GAME_CONFIG.TILE_SIZE;
  const gap = GAME_CONFIG.SLOT_GAP;
  const padding = GAME_CONFIG.SLOT_PADDING;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Internal scaling factor to fit the bar within the viewport width
  const scale = useMemo(() => {
    const maxWidth = windowWidth * 0.95;
    return Math.min(1, maxWidth / SLOT_BAR_WIDTH);
  }, [windowWidth, SLOT_BAR_WIDTH]);

  return (
    <div 
      className="relative flex flex-col items-center justify-center"
      style={{ 
        width: SLOT_BAR_WIDTH * scale, 
        height: 80 * scale,
        transition: 'all 0.3s ease'
      }}
    >
      <style>{`
        @keyframes star-pop {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--tw-tx), var(--tw-ty)) scale(1.2) rotate(180deg); opacity: 0; }
        }
        @keyframes tile-vanish-core {
          0% { opacity: 1; transform: translateY(-50%) scale(1); filter: brightness(1); }
          30% { opacity: 1; transform: translateY(-50%) scale(1.1); filter: brightness(1.5); }
          100% { opacity: 0; transform: translateY(-50%) scale(0.8); filter: brightness(2); }
        }
        .star-particle {
          position: absolute;
          font-size: 18px;
          pointer-events: none;
          animation: star-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 100;
        }
        .animate-tile-vanish {
          animation: tile-vanish-core 0.5s forwards ease-in-out;
        }
      `}</style>
      
      <div 
        className="relative h-20 bg-emerald-800/20 backdrop-blur-md border-4 border-emerald-900/30 rounded-2xl shadow-2xl origin-center"
        style={{ 
            width: SLOT_BAR_WIDTH, 
            transform: `scale(${scale})`,
            position: 'absolute'
        }}
      >
        {/* Slot Placeholders */}
        <div className="absolute inset-0">
          {placeholders.map((_, i) => (
            <div 
              key={`ph-${i}`} 
              style={{ 
                width: tileSize, 
                height: tileSize,
                left: i * (tileSize + gap) + padding,
                top: '50%',
                transform: 'translateY(-50%)',
                position: 'absolute'
              }}
              className="bg-emerald-900/10 rounded-lg border-2 border-dashed border-emerald-900/20"
            />
          ))}
        </div>

        {/* Active Tiles in Slot */}
        <div className="relative h-full">
          {slotTiles.map((tile, index) => {
            const type = TILE_TYPES.find(t => t.id === tile.typeId) as TileType;
            const itemLeft = index * (tileSize + gap) + padding;
            const isEliminating = matchingTypeId === tile.typeId;
            
            return (
              <div
                key={tile.id}
                style={{ 
                  width: tileSize, 
                  height: tileSize,
                  left: itemLeft,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                  zIndex: isEliminating ? 50 : 10
                }}
                className={`
                  ${type.color} 
                  border-2 border-slate-300 rounded-lg flex items-center justify-center shadow-md 
                  transition-all duration-300 ease-out
                  ${isEliminating ? 'animate-tile-vanish' : 'animate-in zoom-in'}
                `}
              >
                <span className="text-xl">
                  {type.icon}
                </span>

                {isEliminating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="star-particle" style={{ '--tw-tx': '-25px', '--tw-ty': '-25px' } as any}>✨</span>
                    <span className="star-particle" style={{ '--tw-tx': '25px', '--tw-ty': '-25px' } as any}>⭐</span>
                    <span className="star-particle" style={{ '--tw-tx': '-25px', '--tw-ty': '25px' } as any}>🌟</span>
                    <span className="star-particle" style={{ '--tw-tx': '25px', '--tw-ty': '25px' } as any}>✨</span>
                    <span className="star-particle" style={{ '--tw-tx': '0px', '--tw-ty': '-35px' } as any}>⭐</span>
                    <span className="star-particle" style={{ '--tw-tx': '0px', '--tw-ty': '35px' } as any}>🌟</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {slotTiles.length >= capacity - 1 && (
        <div className="absolute top-full mt-2 w-full text-center text-red-600 font-bold animate-pulse text-xs">
          {t.slotFull}
        </div>
      )}
    </div>
  );
};

export default SlotBar;
