
import { TileType, Language, GameConfigType } from './types.ts';

export const ANIMALS = [
  "https://i.ibb.co/tPmbzQ60/removed-bg.png", // Pillow
  "https://i.ibb.co/dsP6tSVp/removed-bg.png", // Fairy Wand
  "https://i.ibb.co/gbqLhjsG/removed-bg.png", // Hourglass
  "https://i.ibb.co/kgnn698H/removed-bg.png", // Rose
  "https://i.ibb.co/zhj06347/removed-bg.png", // Thorns
  "https://i.ibb.co/JwWqVsPF/removed-bg.png", // Golden Plate
  "https://i.ibb.co/r2N3KG3j/removed-bg.png", // Crown
  "https://i.ibb.co/9mVn9976/removed-bg.png", // Spindle
  "https://i.ibb.co/6R0C6TKt/removed-bg.png", // Spinning Wheel
  "https://i.ibb.co/qYs9Prtj/removed-bg.png", // Shield
  "https://i.ibb.co/G3HtqnBj/removed-bg.png", // Castle
  "https://i.ibb.co/YFPZjdNP/removed-bg.png", // Sword
];

const COLORS = [
  'bg-[#FFECF0]', 'bg-[#F2FBE2]', 'bg-[#EBF9FF]', 'bg-[#FFFBE8]', 
  'bg-[#FFEDF4]', 'bg-[#F2F0FF]', 'bg-[#F4FFF4]', 'bg-[#FFF4FA]',
  'bg-[#F0FFFF]', 'bg-[#FFFFF0]', 'bg-[#F9F4FF]', 'bg-[#F4FFF8]'
];

export const TILE_TYPES: TileType[] = ANIMALS.map((icon, i) => ({
  id: i,
  icon: icon,
  label: `Item ${i}`,
  color: COLORS[i % COLORS.length]
}));

export const GAME_CONFIG = {
  SLOT_CAPACITY: 7,
  MATCH_COUNT: 3,
  BOARD_TILE_SIZE: 140, // 显著增大卡片尺寸
  SLOT_TILE_SIZE: 96,   // 相应增大槽位尺寸
  SLOT_GAP: 8,
  SLOT_PADDING: 14,
};

export const SLOT_BAR_WIDTH = (GAME_CONFIG.SLOT_TILE_SIZE * GAME_CONFIG.SLOT_CAPACITY) + (GAME_CONFIG.SLOT_GAP * (GAME_CONFIG.SLOT_CAPACITY - 1)) + (GAME_CONFIG.SLOT_PADDING * 2);

export const LEVEL_CONFIGS: GameConfigType[] = [
  { 
    slotNum: 7, composeNum: 3, typeNum: 3, levelBlockNum: 18, borderStep: 1, levelNum: 2, 
    randomBlocks: [1, 1], animals: [], bgColor: '#FFF5F7'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 4, levelBlockNum: 36, borderStep: 1, levelNum: 3, 
    randomBlocks: [1, 2], animals: [], bgColor: '#F6FFED'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 6, levelBlockNum: 54, borderStep: 1, levelNum: 5, 
    randomBlocks: [2, 2], animals: [], bgColor: '#E6F7FF'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 8, levelBlockNum: 72, borderStep: 1, levelNum: 7, 
    randomBlocks: [2, 3], animals: [], bgColor: '#FFFBE6'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 10, levelBlockNum: 90, borderStep: 1, levelNum: 9, 
    randomBlocks: [3, 3], animals: [], bgColor: '#FFF0F6'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 12, levelBlockNum: 108, borderStep: 1, levelNum: 11, 
    randomBlocks: [4, 4], animals: [], bgColor: '#F9F0FF'
  },
  { 
    slotNum: 7, composeNum: 3, typeNum: 12, levelBlockNum: 132, borderStep: 1, levelNum: 14, 
    randomBlocks: [5, 5], animals: [], bgColor: '#F6FFED'
  }
];

export const TRANSLATIONS: Record<Language, any> = {
  'zh-CN': {
    title: '睡美人',
    startGame: '唤醒公主',
    selectLanguage: '语言设置',
    level: '关卡',
    remain: '剩余',
    gameOver: '荆棘封锁了去路',
    gameOverDesc: '挑战失败',
    restart: '重新挑战',
    victory: '破晓时刻',
    journeyVictory: '',
    continue: '勇往直前',
    finish: '幸福终章',
    undo: '撤回',
    shuffle: '重排',
    moveOut: '移出',
    journeySteps: [
      "守卫已抱着长枪入梦，别惊动他们，继续往前走。",
      "马匹与猎狗正并肩沉睡，前方路还长，请加快脚步。",
      "檐下的鸽子正缩脖昏睡，不必停留，顺着走廊走下去。",
      "厨师与仆人们已静止在梦中，穿过厨房，终点就在前方。",
      "王座上的国王与王后已深眠百年，保持安静，跨过大厅。",
      "旋梯上的宫女正依偎入梦，坚持住，公主就在最后一扇门后。",
      "终于见到了沉睡的公主，献上真爱之吻，终结这漫长的诅咒。"
    ]
  },
  'zh-TW': {
    title: '睡美人',
    startGame: '喚醒公主',
    selectLanguage: '語言設置',
    level: '關卡',
    remain: '剩餘',
    gameOver: '荊棘封鎖了去路',
    gameOverDesc: '挑戰失敗',
    restart: '重新挑戰',
    victory: '破曉時刻',
    journeyVictory: '',
    continue: '勇往直前',
    finish: '重返莊園',
    undo: '撤銷',
    shuffle: '洗牌',
    moveOut: '移出',
    journeySteps: [
      "守衛已入夢，別驚動他們。",
      "馬匹沉睡，前方路長。",
      "鴿子昏睡，順廊而行。",
      "僕人靜止，終點在前。",
      "王室深眠，安靜跨廳。",
      "宮女入夢，就在門後。",
      "見到公主，終結詛咒。"
    ]
  },
  'en': {
    title: 'Sleeping Beauty',
    startGame: 'WAKE UP',
    selectLanguage: 'Language',
    level: 'LEVEL',
    remain: 'LEFT',
    gameOver: 'Thorns Blocked the Way',
    gameOverDesc: 'Challenge Failed',
    restart: 'Retry',
    victory: 'Dawn Light',
    journeyVictory: '',
    continue: 'Go Forward',
    finish: 'The End',
    undo: 'Undo',
    shuffle: 'Shuffle',
    moveOut: 'Move Out',
    journeySteps: [
      "Guards sleep with spears; walk softly.",
      "Horses and hounds dream; pick up pace.",
      "Doves are asleep; follow the corridor.",
      "Staff are frozen; the end is near.",
      "Royals sleep for a century; stay silent.",
      "Maidens are dreaming; behind the door.",
      "The Princess awaits; break the curse."
    ]
  },
  'ja': {
    title: '眠れる森の美女',
    startGame: '目覚めさせる',
    selectLanguage: '言語',
    level: 'レベル',
    remain: '残り',
    gameOver: '茨が道を阻む',
    gameOverDesc: '挑戦失敗',
    restart: '再挑戦',
    victory: 'おめでとう！',
    journeyVictory: '',
    continue: '勇気を持って進む',
    finish: '戻る',
    undo: '戻す',
    shuffle: '洗牌',
    moveOut: '移動',
    journeySteps: ["守衛の眠り...", "馬と猟犬...", "鳩の眠り...", "料理人の静止...", "王室の深き眠り...", "宮女の夢...", "真実의 愛。"]
  },
  'ko': {
    title: '잠자는 공주',
    startGame: '깨우기',
    selectLanguage: '언어',
    level: '레벨',
    remain: '남음',
    gameOver: '가시덩굴이 길을 막았습니다',
    gameOverDesc: '도전 실패',
    restart: '다시 도전',
    victory: '축하합니다!',
    journeyVictory: '',
    continue: '앞으로 전진',
    finish: '메인',
    undo: '되돌리기',
    shuffle: '섞기',
    moveOut: '꺼내기',
    journeySteps: ["경비병의 잠...", "말과 사냥개...", "비둘기의 잠...", "정지된 시간...", "왕실의 수면...", "공주님 근처...", "저주의 끝."]
  },
  'es': {
    title: 'Bella Durmiente',
    startGame: 'DESPERTAR',
    selectLanguage: 'Idioma',
    level: 'NIVEL',
    remain: 'RESTO',
    gameOver: 'Espinas bloquean el paso',
    gameOverDesc: 'Desafío fallido',
    restart: 'Reintentar',
    victory: '¡Victoria!',
    journeyVictory: '',
    continue: 'Seguir Adelante',
    finish: 'Inicio',
    undo: 'Deshacer',
    shuffle: 'Mezclar',
    moveOut: 'Sacar',
    journeySteps: ["Guardias duermen.", "Caballos sueñan.", "Palomas callan.", "Cocina quieta.", "Reyes duermen.", "Puerta final.", "El beso final."]
  },
  'fr': {
    title: 'Belle au Bois',
    startGame: 'RÉVEILLER',
    selectLanguage: 'Langue',
    level: 'NIVEAU',
    remain: 'RESTE',
    gameOver: 'Les ronces bloquent le passage',
    gameOverDesc: 'Échec du défi',
    restart: 'Réessayer',
    victory: 'Félicitations!',
    journeyVictory: '',
    continue: 'Aller de l\'avant',
    finish: 'Accueil',
    undo: 'Annuler',
    shuffle: 'Mélanger',
    moveOut: 'Sortir',
    journeySteps: ["Gardes dorment.", "Chevaux rêvent.", "Colombes se taisent.", "Cuisine gelée.", "Rois endormis.", "Porte finale.", "Le baiser."]
  }
};

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇭🇰' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }
];
