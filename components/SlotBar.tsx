
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
  const tileSize = GAME_CONFIG.SLOT_TILE_SIZE;
  const gap = GAME_CONFIG.SLOT_GAP;
  const padding = GAME_CONFIG.SLOT_PADDING;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scale = useMemo(() => {
    const maxWidth = windowWidth * 0.95;
    return Math.min(1, maxWidth / SLOT_BAR_WIDTH);
  }, [windowWidth, SLOT_BAR_WIDTH]);

  const renderModernFX = () => {
    const raysCount = 8;
    const starsCount = 12;

    const rays = Array.from({ length: raysCount }).map((_, i) => {
      const angle = (360 / raysCount) * i;
      return (
        <div 
          key={`ray-${i}`}
          className="absolute bg-white/80 rounded-full modern-ray"
          style={{ 
            '--tw-rot': `${angle}deg`,
            width: '2px',
            height: '40px',
            left: '50%',
            top: '50%',
            transformOrigin: 'bottom center',
          } as any}
        />
      );
    });

    const stars = Array.from({ length: starsCount }).map((_, i) => {
      const angle = (360 / starsCount) * i + (Math.random() * 15);
      const dist = 40 + Math.random() * 50;
      const tx = Math.cos((angle * Math.PI) / 180) * dist;
      const ty = Math.sin((angle * Math.PI) / 180) * dist;
      const size = 4 + Math.random() * 6;
      const delay = Math.random() * 0.1;

      return (
        <div 
          key={`star-${i}`}
          className="absolute bg-white modern-sparkle"
          style={{ 
            '--tw-tx': `${tx}px`, 
            '--tw-ty': `${ty}px`,
            '--tw-delay': `${delay}s`,
            width: size,
            height: size,
            left: '50%',
            top: '50%',
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', 
          } as any}
        />
      );
    });

    return [...rays, ...stars];
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center overflow-visible"
      style={{ 
        width: SLOT_BAR_WIDTH * scale, 
        height: 80 * scale,
      }}
    >
      <style>{`
        @keyframes modern-ray-out {
          0% { transform: translate(-50%, -100%) rotate(var(--tw-rot)) scaleY(0); opacity: 0; }
          20% { opacity: 1; transform: translate(-50%, -100%) rotate(var(--tw-rot)) scaleY(1.2); }
          100% { transform: translate(-50%, -250%) rotate(var(--tw-rot)) scaleY(0); opacity: 0; }
        }
        @keyframes modern-sparkle-out {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tw-tx)), calc(-50% + var(--tw-ty))) scale(0); opacity: 0; }
        }
        @keyframes modern-tile-vanish {
          0% { transform: translateY(-50%) scale(1); filter: brightness(1); opacity: 1; }
          40% { transform: translateY(-50%) scale(1.05); filter: brightness(1.5); opacity: 1; }
          100% { transform: translateY(-50%) scale(0); filter: brightness(2); opacity: 0; }
        }
        @keyframes ring-expand {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; border-width: 4px; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 1px; }
        }
        .modern-ray {
          animation: modern-ray-out 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modern-sparkle {
          animation: modern-sparkle-out 0.7s cubic-bezier(0.16, 1, 0.3, 1) var(--tw-delay) forwards;
        }
        .animate-modern-vanish {
          animation: modern-tile-vanish 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modern-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border-style: solid;
          border-color: rgba(255, 255, 255, 0.6);
          pointer-events: none;
          width: 80px;
          height: 80px;
          animation: ring-expand 0.5s ease-out forwards;
        }
        .slot-bar-glow {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      <div 
        className="relative h-20 bg-white/35 backdrop-blur-2xl border-2 border-white/60 rounded-[32px] slot-bar-glow origin-center overflow-visible transition-all duration-500"
        style={{ 
            width: SLOT_BAR_WIDTH, 
            transform: `scale(${scale})`,
            position: 'absolute'
        }}
      >
        <div className="absolute inset-0 flex items-center px-[10px] justify-between">
          {placeholders.map((_, i) => (
            <div 
              key={`ph-${i}`} 
              style={{ width: tileSize, height: tileSize }}
              className="bg-white/20 rounded-[20px] border border-white/30 shadow-inner"
            />
          ))}
        </div>

        <div className="relative h-full overflow-visible">
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
                  zIndex: isEliminating ? 2000 : 10,
                }}
                className={`
                  ${type.color} 
                  border-2 border-white/80 rounded-[20px] flex items-center justify-center shadow-md
                  transition-all duration-300 ease-out
                  ${isEliminating ? 'animate-modern-vanish' : 'animate-in fade-in zoom-in duration-300'}
                `}
              >
                <img 
                  src={type.icon} 
                  alt={type.label}
                  className="w-full h-full object-cover rounded-[18px] pointer-events-none"
                />

                {isEliminating && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                    <div className="modern-ring" />
                    {renderModernFX()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SlotBar;
