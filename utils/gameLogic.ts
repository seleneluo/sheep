
import { TileData, GameConfigType } from '../types.ts';
import { GAME_CONFIG, TILE_TYPES } from '../constants.tsx';

export const checkIsLocked = (tile: TileData, allTiles: TileData[], movingIds: string[] = []): boolean => {
  if (tile.status !== 'board') return false;
  const { BOARD_TILE_SIZE } = GAME_CONFIG;
  const tolerance = 25; // 适当增加容差
  const tileIdx = allTiles.findIndex(t => t.id === tile.id);
  for (let i = 0; i < allTiles.length; i++) {
    const other = allTiles[i];
    if (other.id === tile.id || movingIds.includes(other.id)) continue;
    if (other.status !== 'board' && other.status !== 'staging') continue;
    const isAbove = other.layer > tile.layer || (other.layer === tile.layer && i > tileIdx);
    if (isAbove) {
      const hasOverlap = (
        tile.x < other.x + BOARD_TILE_SIZE - tolerance &&
        tile.x + BOARD_TILE_SIZE > other.x + tolerance &&
        tile.y < other.y + BOARD_TILE_SIZE - tolerance &&
        tile.y + BOARD_TILE_SIZE > other.y + tolerance
      );
      if (hasOverlap) return true;
    }
  }
  return false;
};

interface Position { x: number; y: number; l: number; }

const PATTERNS = {
  grid: (layer: number, size: number, spacing: number): Position[] => {
    const pos: Position[] = [];
    const offsetX = (layer % 2 === 0) ? 0 : spacing * 0.5;
    const offsetY = (layer % 2 === 0) ? 0 : spacing * 0.5;
    const limit = size;
    for (let i = -limit; i <= limit; i++) {
      for (let j = -limit; j <= limit; j++) {
        const jitterX = (Math.random() - 0.5) * 10;
        const jitterY = (Math.random() - 0.5) * 10;
        pos.push({ x: i * spacing + offsetX + jitterX, y: j * spacing + offsetY + jitterY, l: layer });
      }
    }
    return pos;
  },
  ring: (layer: number, radius: number, count: number): Position[] => {
    const pos: Position[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (layer * 0.5);
      const jitter = (Math.random() - 0.5) * 8;
      pos.push({ 
        x: Math.cos(angle) * (radius + jitter), 
        y: Math.sin(angle) * (radius + jitter), 
        l: layer 
      });
    }
    return pos;
  },
  diamond: (layer: number, size: number, spacing: number): Position[] => {
    const pos: Position[] = [];
    const limit = size;
    for (let i = -limit; i <= limit; i++) {
      for (let j = -limit; j <= limit; j++) {
        if (Math.abs(i) + Math.abs(j) <= limit) {
          const jitterX = (Math.random() - 0.5) * 10;
          const jitterY = (Math.random() - 0.5) * 10;
          pos.push({ x: i * spacing + jitterX, y: j * spacing + jitterY, l: layer });
        }
      }
    }
    return pos;
  }
};

export const generateLevelFromConfig = (config: GameConfigType): TileData[] => {
  let rawPositions: Position[] = [];
  const spacing = 88; // 紧凑布局
  for (let l = 0; l < config.levelNum; l++) {
    let layerPos: Position[] = [];
    if (l % 3 === 0) layerPos = PATTERNS.grid(l, 3 + Math.floor(l / 5), spacing);
    else if (l % 3 === 1) layerPos = PATTERNS.ring(l, 100 + l * 25, 10 + l * 4);
    else layerPos = PATTERNS.diamond(l, 4 + Math.floor(l / 5), spacing);
    rawPositions.push(...layerPos);
  }
  
  for (let i = rawPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawPositions[i], rawPositions[j]] = [rawPositions[j], rawPositions[i]];
  }
  
  const tripletsCount = Math.floor(config.levelBlockNum / 3);
  const totalTiles = tripletsCount * 3;
  
  // 补足位置
  if (rawPositions.length < totalTiles) {
    const extraNeeded = totalTiles - rawPositions.length;
    for (let i = 0; i < extraNeeded; i++) {
      rawPositions.push({ 
        x: (Math.random() - 0.5) * 400, 
        y: (Math.random() - 0.5) * 400, 
        l: Math.floor(Math.random() * config.levelNum) 
      });
    }
  }

  const finalPositions = rawPositions.slice(0, totalTiles);
  
  // 居中校正：找到所有位置的包围盒中心，然后平移所有坐标
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  finalPositions.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  finalPositions.forEach(p => {
    p.x -= centerX;
    p.y -= centerY;
  });

  const pool: number[] = [];
  const activeTypes = TILE_TYPES.slice(0, config.typeNum);
  for (let i = 0; i < tripletsCount; i++) {
    const typeId = activeTypes[i % activeTypes.length].id;
    pool.push(typeId, typeId, typeId);
  }
  
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  
  return finalPositions.map((pos, idx) => ({
    id: `tile-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    typeId: pool[idx],
    layer: pos.l,
    x: pos.x,
    y: pos.y,
    status: 'board',
    isLocked: false,
  }));
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};
