// Seed types and their properties
export type SeedType = 'basic' | 'silver' | 'gold' | 'crystal';

export interface SeedConfig {
  type: SeedType;
  growTime: number; // in seconds
  yield: number; // watermelons produced
  color: string;
  unlockCost: number;
}

export const SEED_CONFIGS: Record<SeedType, SeedConfig> = {
  basic: { type: 'basic', growTime: 30, yield: 1, color: '#4a7c23', unlockCost: 0 },
  silver: { type: 'silver', growTime: 60, yield: 3, color: '#a8a8a8', unlockCost: 100 },
  gold: { type: 'gold', growTime: 120, yield: 8, color: '#ffd700', unlockCost: 500 },
  crystal: { type: 'crystal', growTime: 300, yield: 25, color: '#00ffff', unlockCost: 2000 },
};

// Chicken types
export type ChickenType = 'basic' | 'fat' | 'golden' | 'cosmic';

export interface ChickenConfig {
  type: ChickenType;
  eggsPerMinute: number;
  feedDuration: number; // how long chicken stays fed (seconds)
  upgradeCost: number;
  color: string;
}

export const CHICKEN_CONFIGS: Record<ChickenType, ChickenConfig> = {
  basic: { type: 'basic', eggsPerMinute: 1, feedDuration: 60, upgradeCost: 0, color: '#ffffff' },
  fat: { type: 'fat', eggsPerMinute: 3, feedDuration: 90, upgradeCost: 200, color: '#ffcc00' },
  golden: { type: 'golden', eggsPerMinute: 10, feedDuration: 120, upgradeCost: 1000, color: '#ffd700' },
  cosmic: { type: 'cosmic', eggsPerMinute: 50, feedDuration: 180, upgradeCost: 5000, color: '#ff00ff' },
};

// Game entities
export interface Seed {
  id: string;
  type: SeedType;
  x: number;
  y: number;
  respawnTime: number;
  collected: boolean;
}

export interface Plot {
  id: number;
  planted: boolean;
  seedType: SeedType | null;
  plantedAt: number | null;
  growthProgress: number; // 0-1
  fertilityLevel: number; // multiplier for growth speed
  x: number;
  y: number;
}

export interface Chicken {
  id: number;
  type: ChickenType;
  fedUntil: number; // timestamp when chicken becomes hungry
  eggsProduced: number;
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  speed: number;
  seeds: Partial<Record<SeedType, number>>;
  watermelons: number;
  coins: number;
  eggs: number;
}

export interface Upgrades {
  seedBagCapacity: number; // max seeds per type
  walkingSpeed: number; // speed multiplier
  plotFertility: number; // growth speed multiplier
  chickenHunger: number; // feed duration multiplier
  eggValue: number; // coins per egg
}

export type GameArea = 'forest' | 'farm';

export interface ForestState {
  seeds: Seed[];
  trees: { x: number; y: number; size: number }[];
  bushes: { x: number; y: number }[];
}

export interface FarmState {
  plots: Plot[];
  chickens: Chicken[];
}

export interface GameState {
  player: Player;
  forest: ForestState;
  farm: FarmState;
  upgrades: Upgrades;
  currentArea: GameArea;
  lastUpdate: number;
  unlockedSeeds: SeedType[];
  totalCoinsEarned: number;
  zoom: number;
}

// Input state
export interface InputState {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}

// Upgrade definitions
export interface UpgradeDefinition {
  id: keyof Upgrades;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effect: number; // value added per level
}

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'seedBagCapacity',
    name: 'Seed Bag',
    description: 'Carry more seeds',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 5,
  },
  {
    id: 'walkingSpeed',
    name: 'Walking Speed',
    description: 'Move faster',
    baseCost: 75,
    costMultiplier: 1.8,
    maxLevel: 8,
    effect: 0.2,
  },
  {
    id: 'plotFertility',
    name: 'Plot Fertility',
    description: 'Faster growth',
    baseCost: 100,
    costMultiplier: 2,
    maxLevel: 10,
    effect: 0.15,
  },
  {
    id: 'chickenHunger',
    name: 'Chicken Feed',
    description: 'Chickens stay fed longer',
    baseCost: 80,
    costMultiplier: 1.6,
    maxLevel: 10,
    effect: 0.2,
  },
  {
    id: 'eggValue',
    name: 'Egg Value',
    description: 'Eggs worth more',
    baseCost: 150,
    costMultiplier: 2.2,
    maxLevel: 15,
    effect: 0.5,
  },
];

// Game constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 32;
export const PLAYER_SIZE = 24;
export const FOREST_WIDTH = 1600;
export const FOREST_HEIGHT = 1200;
export const FARM_WIDTH = 800;
export const FARM_HEIGHT = 600;
export const SEED_RESPAWN_TIME = 15; // seconds
export const EGG_TO_COIN_RATE = 1; // coins per egg
export const PLOT_COST = 100;
export const CHICKEN_COST = 150;
