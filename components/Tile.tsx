
import React, { memo } from 'react';
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

  let zIndex = tile.layer * 10;
  if (isMoving) zIndex = 20000; 
  else if (isStaging) zIndex = 5000;
  else if (isSlot) zIndex = 100;

  // 关键修复：减去一半的 Tile 尺寸，确保布局以 (0,0) 为真正的中心
  const offsetX = GAME_CONFIG.BOARD_TILE_SIZE / 2;
  const offsetY = GAME_CONFIG.BOARD_TILE_SIZE / 2;

  const style: React.CSSProperties = {
    left: (targetPos ? targetPos.x : tile.x) - offsetX,
    top: (targetPos ? targetPos.y : tile.y) - offsetY,
    width: GAME_CONFIG.BOARD_TILE_SIZE,
    height: GAME_CONFIG.BOARD_TILE_SIZE,
    zIndex: zIndex,
    opacity: tile.status === 'eliminated' ? 0 : 1,
    pointerEvents: (isMoving || isSlot) ? 'none' : 'auto',
    position: 'absolute',
    boxSizing: 'border-box',
    transition: isMoving 
      ? 'all 220ms cubic-bezier(0.18, 0.89, 0.32, 1.28)' 
      : 'all 60ms ease-out',
    transform: isMoving 
      ? `scale(${GAME_CONFIG.SLOT_TILE_SIZE / GAME_CONFIG.BOARD_TILE_SIZE}) translateZ(0)` 
      : 'scale(1) translateZ(0)',
    transformOrigin: 'center center', // 改为中心缩放
    willChange: isMoving ? 'transform, left, top' : 'auto',
  };

  if (tile.status === 'eliminated' || (isSlot && !isMoving)) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isLocked && !isMoving && !isSlot) onClick(tile);
      }}
      className={`
        ${type.color}
        rounded-[32px] border-b-[10px] border-r-[5px] border-black/10 flex items-center justify-center select-none 
        transform shadow-2xl overflow-hidden
        ${isLocked 
          ? "grayscale-[0.5] brightness-[0.75] scale-[0.98]" 
          : isMoving 
            ? "shadow-none border-white/50 brightness-110"
            : "hover:scale-105 active:scale-95 border-white/80 cursor-pointer brightness-100"
        }
      `}
      style={style}
    >
      <img 
        src={type.icon} 
        alt={type.label}
        className={`w-full h-full object-contain p-5 transition-opacity duration-100 pointer-events-none ${isLocked ? 'opacity-40' : 'opacity-100'}`}
        style={{ 
          imageRendering: 'auto',
          transform: 'translateZ(0)'
        }}
      />
      {isLocked && (
        <div className="absolute inset-0 rounded-[32px] bg-black/20 z-30 pointer-events-none"></div>
      )}
      <div className={`absolute -bottom-1 -right-0.5 w-full h-full rounded-[32px] border-b-2 border-r-1 border-black/5 pointer-events-none -z-10`}></div>
    </div>
  );
};

export default memo(Tile);
