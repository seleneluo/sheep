
import { TileType, Language, GameConfigType } from './types.ts';

export const ANIMALS = [
  "🐔", "🐟", "🦆", "🐶", "🐱", "🐴", "🐑", "🐦", "🐧", "🐊", 
  "🐺", "🐒", "🐳", "🐬", "🐢", "🦖", "🦒", "🦁", "🐍", "🐭", "🐂"
];

const COLORS = [
  'bg-rose-100', 'bg-sky-100', 'bg-emerald-100', 'bg-amber-100', 
  'bg-violet-100', 'bg-pink-100', 'bg-indigo-100', 'bg-orange-100',
  'bg-teal-100', 'bg-green-100', 'bg-cyan-100', 'bg-fuchsia-100'
];

export const GET_TILE_TYPES = (animals: string[]): TileType[] => 
  animals.map((icon, index) => ({
    id: index,
    icon,
    label: `Animal-${index}`,
    color: COLORS[index % COLORS.length]
  }));

export const TILE_TYPES = GET_TILE_TYPES(ANIMALS);

/**
 * Difficulty Tuning:
 * Fewer unique types (typeNum) = Much easier to find matches.
 * Fewer levels (levelNum) = Thinner stacks, easier to reach bottom tiles.
 */
export const GAME_CONFIGS: Record<string, GameConfigType> = {
  easy: {
    slotNum: 7,
    composeNum: 3,
    typeNum: 4, // Very few types, almost always solvable
    levelBlockNum: 10,
    borderStep: 1,
    levelNum: 3, // Only 3 layers
    randomBlocks: [3, 3],
    animals: ANIMALS,
  },
  middle: {
    slotNum: 7,
    composeNum: 3,
    typeNum: 6,
    levelBlockNum: 12,
    borderStep: 1,
    levelNum: 5,
    randomBlocks: [4, 4],
    animals: ANIMALS,
  },
  hard: {
    slotNum: 7,
    composeNum: 3,
    typeNum: 8,
    levelBlockNum: 14,
    borderStep: 1,
    levelNum: 6,
    randomBlocks: [5, 5],
    animals: ANIMALS,
  },
  lunatic: {
    slotNum: 7,
    composeNum: 3,
    typeNum: 10,
    levelBlockNum: 16,
    borderStep: 2,
    levelNum: 8,
    randomBlocks: [6, 6],
    animals: ANIMALS,
  },
  yang: {
    slotNum: 7,
    composeNum: 3,
    typeNum: 12, // Reduced from 18 to make "Yang" difficulty actually playable
    levelBlockNum: 20,
    borderStep: 2,
    levelNum: 10,
    randomBlocks: [7, 7],
    animals: ANIMALS,
  }
};

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' }
];

export const GAME_CONFIG = {
  TILE_SIZE: 44, // Slightly smaller for better mobile density
  SLOT_CAPACITY: 7,
  MATCH_COUNT: 3,
  SLOT_GAP: 4,      
  SLOT_PADDING: 8, 
  BOARD_TOP_OFFSET: 80,
};

export const SLOT_BAR_WIDTH = 
  (GAME_CONFIG.SLOT_CAPACITY * GAME_CONFIG.TILE_SIZE) + 
  ((GAME_CONFIG.SLOT_CAPACITY - 1) * GAME_CONFIG.SLOT_GAP) + 
  (GAME_CONFIG.SLOT_PADDING * 2);

export const TRANSLATIONS: Record<Language, any> = {
  'en': {
    title: 'SHEEP MATCH',
    startGame: 'START GAME',
    selectDifficulty: 'Difficulty',
    selectLanguage: 'Language',
    level: 'LEVEL',
    remain: 'REMAIN',
    undo: 'Undo',
    shuffle: 'Shuffle',
    moveOut: 'Move Out',
    slotFull: 'Slot Full!',
    gameOver: 'GAME OVER',
    gameOverDesc: 'The pen is full! Try again.',
    restart: 'Restart',
    victory: 'VICTORY',
    victoryDesc: 'Perfect clear!',
    continue: 'Next Level',
    difficultyNames: {
      easy: 'Easy',
      middle: 'Middle',
      hard: 'Hard',
      lunatic: 'Lunatic',
      yang: 'Sheep A Sheep'
    }
  },
  'zh-CN': {
    title: '羊了个羊',
    startGame: '开始游戏',
    selectDifficulty: '难度选择',
    selectLanguage: '语言设置',
    level: '关卡',
    remain: '剩余',
    undo: '撤销',
    shuffle: '洗牌',
    moveOut: '移出',
    slotFull: '槽位已满！',
    gameOver: '游戏结束',
    gameOverDesc: '槽位已满，再接再厉！',
    restart: '重新开始',
    victory: '挑战成功',
    victoryDesc: '太棒了！你完美清理了这片牧场。',
    continue: '下一关',
    difficultyNames: {
      easy: '简单',
      middle: '中等',
      hard: '困难',
      lunatic: '天狱',
      yang: '羊了个羊'
    }
  },
  'ja': {
    title: '羊が羊',
    startGame: 'スタート',
    selectDifficulty: '難易度',
    selectLanguage: '言語',
    level: 'レベル',
    remain: '残り',
    undo: '元に戻す',
    shuffle: 'シャッフル',
    moveOut: '移動',
    slotFull: '満杯！',
    gameOver: 'ゲームオーバー',
    gameOverDesc: 'スロットがいっぱいです。',
    restart: '再開',
    victory: '勝利',
    victoryDesc: 'パーフェクトクリア！',
    continue: '次へ',
    difficultyNames: {
      easy: '簡単',
      middle: '普通',
      hard: '困難',
      lunatic: '地獄',
      yang: '羊レベル'
    }
  },
  'ko': {
    title: '양그양',
    startGame: '시작',
    selectDifficulty: '난이도',
    selectLanguage: '언어',
    level: '레벨',
    remain: '남음',
    undo: '취소',
    shuffle: '셔플',
    moveOut: '꺼내기',
    slotFull: '가득 참!',
    gameOver: '게임 오버',
    gameOverDesc: '슬롯이 가득 찼습니다.',
    restart: '다시 시작',
    victory: '승리',
    victoryDesc: '완벽합니다!',
    continue: '다음',
    difficultyNames: {
      easy: '쉬움',
      middle: '보통',
      hard: '어려움',
      lunatic: '광기',
      yang: '양 레벨'
    }
  },
  'zh-TW': {},
  'es': {},
  'fr': {}
};
