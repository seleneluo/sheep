
import { TileData, GameConfigType } from '../types.ts';
import { GAME_CONFIG, TILE_TYPES } from '../constants.tsx';

/**
 * Checks if a tile is locked by any tile "above" it.
 */
export const checkIsLocked = (tile: TileData, allTiles: TileData[], movingId?: string | null): boolean => {
  if (tile.status !== 'board') return false;

  const { TILE_SIZE } = GAME_CONFIG;
  const tolerance = 4;

  const tileIdx = allTiles.findIndex(t => t.id === tile.id);

  for (let i = 0; i < allTiles.length; i++) {
    const other = allTiles[i];
    
    if (other.id === tile.id || other.id === movingId) continue;
    if (other.status !== 'board' && other.status !== 'staging') continue;

    const isAbove = other.layer > tile.layer || (other.layer === tile.layer && i > tileIdx);

    if (isAbove) {
      const hasOverlap = (
        tile.x < other.x + TILE_SIZE - tolerance &&
        tile.x + TILE_SIZE > other.x + tolerance &&
        tile.y < other.y + TILE_SIZE - tolerance &&
        tile.y + TILE_SIZE > other.y + tolerance
      );

      if (hasOverlap) return true;
    }
  }
  
  return false;
};

interface Position {
  x: number;
  y: number;
  l: number;
}

/**
 * Predefined layout patterns to make the game look structured.
 */
const PATTERNS = {
  // A solid square block
  square: (layer: number, size: number = 3): Position[] => {
    const pos: Position[] = [];
    for (let i = -size; i <= size; i++) {
      for (let j = -size; j <= size; j++) {
        pos.push({ x: i, y: j, l: layer });
      }
    }
    return pos;
  },
  // A diamond shape
  diamond: (layer: number, size: number = 4): Position[] => {
    const pos: Position[] = [];
    for (let i = -size; i <= size; i++) {
      for (let j = -size; j <= size; j++) {
        if (Math.abs(i) + Math.abs(j) <= size) {
          pos.push({ x: i, y: j, l: layer });
        }
      }
    }
    return pos;
  },
  // A cross/plus shape
  cross: (layer: number, size: number = 4): Position[] => {
    const pos: Position[] = [];
    for (let i = -size; i <= size; i++) {
      pos.push({ x: i, y: 0, l: layer });
      if (i !== 0) pos.push({ x: 0, y: i, l: layer });
    }
    return pos;
  },
  // Concentric rings
  rings: (layer: number, radius: number = 3): Position[] => {
    const pos: Position[] = [];
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const dist = Math.sqrt(i * i + j * j);
        if (dist >= radius - 1 && dist <= radius + 0.5) {
          pos.push({ x: i, y: j, l: layer });
        }
      }
    }
    return pos;
  },
  // A simple pyramid effect (shrinking size as layers go up)
  pyramid: (layer: number, baseSize: number = 4): Position[] => {
    const size = Math.max(0, baseSize - layer);
    const pos: Position[] = [];
    for (let i = -size; i <= size; i++) {
      for (let j = -size; j <= size; j++) {
        pos.push({ x: i, y: j, l: layer });
      }
    }
    return pos;
  }
};

/**
 * Generates a layout using structured patterns.
 */
export const generateLevelFromConfig = (config: GameConfigType): TileData[] => {
  const tiles: TileData[] = [];
  const selectedTypes = TILE_TYPES.slice(0, config.typeNum);
  
  // Create a pool of triplet type IDs
  const totalBlocksTarget = config.levelBlockNum * config.levelNum;
  const tripletsCount = Math.ceil(totalBlocksTarget / 3);
  const pool: number[] = [];
  
  for (let i = 0; i < tripletsCount; i++) {
    const typeId = selectedTypes[i % selectedTypes.length].id;
    pool.push(typeId, typeId, typeId);
  }

  // Shuffle the pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const { TILE_SIZE } = GAME_CONFIG;
  const halfTile = TILE_SIZE / 2;
  
  // Pick a random primary pattern for the whole stack or per layer
  const patternKeys = Object.keys(PATTERNS) as (keyof typeof PATTERNS)[];
  const mainPatternKey = patternKeys[Math.floor(Math.random() * patternKeys.length)];

  // Generate potential positions
  let potentialPositions: Position[] = [];
  for (let l = 0; l < config.levelNum; l++) {
    const layerSubX = (l % 2 === 0 ? 0 : halfTile / 2); // Micro staggered offset
    const layerSubY = (l % 2 === 0 ? 0 : halfTile / 2);
    
    // Sometimes mix patterns per layer for variety
    const currentPatternKey = Math.random() > 0.7 
      ? patternKeys[Math.floor(Math.random() * patternKeys.length)] 
      : mainPatternKey;
      
    const positions = PATTERNS[currentPatternKey](l, 3 + (config.typeNum / 4));
    
    positions.forEach(p => {
      potentialPositions.push({
        x: p.x * halfTile + layerSubX,
        y: p.y * halfTile + layerSubY,
        l: p.l
      });
    });
  }

  // Shuffle potential positions so tiles are placed randomly within the structure
  for (let i = potentialPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [potentialPositions[i], potentialPositions[j]] = [potentialPositions[j], potentialPositions[i]];
  }

  // Fill structure with pool
  let poolIdx = 0;
  potentialPositions.forEach((pos, idx) => {
    if (poolIdx < pool.length) {
      tiles.push({
        id: `tile-${idx}`,
        typeId: pool[poolIdx++],
        layer: pos.l,
        x: Math.floor(pos.x - halfTile),
        y: Math.floor(pos.y - halfTile),
        status: 'board',
        isLocked: false,
      });
    }
  });

  // If there are left over pool items (shouldn't happen with enough potential positions, but for safety):
  while (poolIdx < pool.length) {
    const randX = (Math.random() - 0.5) * TILE_SIZE * 6;
    const randY = (Math.random() - 0.5) * TILE_SIZE * 6;
    tiles.push({
      id: `scatter-${poolIdx}`,
      typeId: pool[poolIdx++],
      layer: 0,
      x: Math.floor(randX - halfTile),
      y: Math.floor(randY - halfTile),
      status: 'board',
      isLocked: false,
    });
  }

  return tiles;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};
