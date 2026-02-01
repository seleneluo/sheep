
export type Language = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr';

export interface TileData {
  id: string;
  typeId: number;
  layer: number;
  x: number;
  y: number;
  status: 'board' | 'slot' | 'eliminated' | 'staging';
  isLocked: boolean;
}

export interface GameConfigType {
  slotNum: number;
  composeNum: number;
  typeNum: number;
  levelBlockNum: number;
  borderStep: number;
  levelNum: number;
  randomBlocks: number[];
  animals: string[];
}

export interface TileType {
  id: number;
  icon: string;
  label: string;
  color: string;
}

export interface MoveAction {
  tileId: string;
  fromX: number;
  fromY: number;
  fromLayer: number;
}
