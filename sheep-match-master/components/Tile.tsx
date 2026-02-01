
import React from 'react';
import { TileData, TileType } from '../types.ts';
import { TILE_TYPES, GAME_CONFIG } from '../constants.tsx';

interface TileProps {
  tile: TileData;
  onClick: (tile: TileData) => void;
  targetPos?: { x: number; y: number } | null;
}

const Tile: React.FC<TileProps> = ({ tile, onClick, targetPos }) => {
  const type = TILE_TYPES.find(t => t.id === tile.typeId) as TileType;
  
  const isStaging = tile.status === 'staging';
  const isSlot = tile.status === 'slot';
  const isMoving = !!targetPos;
  const isLocked = tile.isLocked && tile.status === 'board';

  // Strict Layering using z-index
  let zIndex = tile.layer * 10;
  if (isMoving) zIndex = 10000;
  else if (isStaging) zIndex = 5000;
  else if (isSlot) zIndex = 100;

  const style: React.CSSProperties = {
    left: targetPos ? targetPos.x : tile.x,
    top: targetPos ? targetPos.y : tile.y,
    width: GAME_CONFIG.TILE_SIZE,
    height: GAME_CONFIG.TILE_SIZE,
    zIndex: zIndex,
    opacity: tile.status === 'eliminated' ? 0 : 1,
    // THE CORE FIX: Completely disable pointer events if locked
    pointerEvents: (isLocked || isMoving || isSlot) ? 'none' : 'auto',
    position: 'absolute',
    boxSizing: 'border-box'
  };

  if (tile.status === 'eliminated' || (isSlot && !isMoving)) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isLocked && !isMoving) onClick(tile);
      }}
      className={`
        ${type.color}
        rounded-xl border-b-[5px] border-r-[1.5px] border-black/10 flex items-center justify-center select-none 
        transition-all duration-300 ease-in-out transform shadow-md
        ${isLocked 
          ? "grayscale-[0.4] brightness-[0.8] scale-[0.98]" 
          : isMoving 
            ? "shadow-2xl scale-110 border-white ring-4 ring-emerald-400/30"
            : "hover:scale-105 active:scale-95 border-white cursor-pointer hover:shadow-xl brightness-100"
        }
      `}
      style={style}
    >
      {/* Icon - Semi-visible pattern when locked */}
      <div className={`text-4xl transition-all duration-300 ${isLocked ? 'opacity-30 scale-90' : 'opacity-100 scale-100'}`}>
        {type.icon}
      </div>

      {/* Softer Mask: dark enough to look 'underneath' but transparent enough to see the icon */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-black/25 z-30 pointer-events-none transition-opacity duration-300"></div>
      )}

      {/* Surface Gloss: Only for active tiles */}
      {!isLocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none z-10"></div>
      )}
      
      {/* Edge depth effect */}
      <div className={`absolute -bottom-1 -right-0.5 w-full h-full rounded-xl border-b-4 border-r-2 border-black/10 pointer-events-none -z-10`}></div>
    </div>
  );
};

export default Tile;