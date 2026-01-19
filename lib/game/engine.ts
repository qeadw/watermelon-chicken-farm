import {
  GameState,
  InputState,
  Player,
  Upgrades,
  GameArea,
  SeedType,
  GAME_WIDTH,
  GAME_HEIGHT,
  FOREST_WIDTH,
  FOREST_HEIGHT,
  FARM_WIDTH,
  FARM_HEIGHT,
  PLAYER_SIZE,
  SEED_CONFIGS,
  UPGRADE_DEFINITIONS,
  PLOT_COST,
  CHICKEN_COST,
} from '../types';
import { initializeForest, updateForest, collectSeed, checkTreeCollision, getNearbySeed } from './forest';
import {
  initializeFarm,
  updateFarm,
  plantSeed,
  harvestPlot,
  feedChicken,
  buyPlot,
  buyChicken,
  upgradeChicken,
  getNearbyPlot,
  getNearbyChicken,
  calculateOfflineProgress,
} from './farm';

const SAVE_KEY = 'watermelon-farm-save';

// Create initial game state
export function createInitialState(): GameState {
  return {
    player: {
      x: FOREST_WIDTH / 2,
      y: FOREST_HEIGHT / 2,
      speed: 150,
      seeds: { basic: 0, silver: 0, gold: 0, crystal: 0 },
      watermelons: 0,
      coins: 50, // Start with some coins
      eggs: 0,
    },
    forest: initializeForest(),
    farm: initializeFarm(),
    upgrades: {
      seedBagCapacity: 10,
      walkingSpeed: 1,
      plotFertility: 1,
      chickenHunger: 1,
      eggValue: 1,
    },
    currentArea: 'forest',
    lastUpdate: Date.now(),
    unlockedSeeds: ['basic'],
    totalCoinsEarned: 0,
    zoom: 1,
  };
}

// Save game state to localStorage
export function saveGame(state: GameState): void {
  try {
    const saveData = {
      ...state,
      lastUpdate: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

// Load game state from localStorage
export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as GameState;

    // Calculate offline progress
    const { farm, eggsProduced, coinsEarned } = calculateOfflineProgress(
      state.farm,
      state.upgrades,
      state.lastUpdate
    );

    return {
      ...state,
      farm,
      player: {
        ...state.player,
        eggs: state.player.eggs + eggsProduced,
        coins: state.player.coins + coinsEarned,
      },
      lastUpdate: Date.now(),
    };
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

// Main game update function
export function updateGame(
  state: GameState,
  input: InputState,
  deltaTime: number
): GameState {
  let newState = { ...state };

  // Update player movement
  newState = updatePlayerMovement(newState, input, deltaTime);

  // Update forest
  newState.forest = updateForest(newState.forest, deltaTime);

  // Update farm
  const farmUpdate = updateFarm(newState.farm, newState.upgrades, deltaTime);
  newState.farm = farmUpdate.farm;
  newState.player = {
    ...newState.player,
    eggs: newState.player.eggs + farmUpdate.eggsProduced,
    coins: newState.player.coins + farmUpdate.coinsEarned,
  };
  newState.totalCoinsEarned += farmUpdate.coinsEarned;

  newState.lastUpdate = Date.now();

  return newState;
}

// Update player movement based on input
function updatePlayerMovement(
  state: GameState,
  input: InputState,
  deltaTime: number
): GameState {
  const speed = state.player.speed * state.upgrades.walkingSpeed * (deltaTime / 1000);
  let dx = 0;
  let dy = 0;

  if (input.keys.has('w') || input.keys.has('W') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('s') || input.keys.has('S') || input.keys.has('ArrowDown')) dy += 1;
  if (input.keys.has('a') || input.keys.has('A') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('d') || input.keys.has('D') || input.keys.has('ArrowRight')) dx += 1;

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
  }

  let newX = state.player.x + dx * speed;
  let newY = state.player.y + dy * speed;

  // Get bounds based on current area
  const bounds = state.currentArea === 'forest'
    ? { minX: PLAYER_SIZE, maxX: FOREST_WIDTH - PLAYER_SIZE, minY: PLAYER_SIZE, maxY: FOREST_HEIGHT - PLAYER_SIZE }
    : { minX: PLAYER_SIZE, maxX: FARM_WIDTH - PLAYER_SIZE, minY: PLAYER_SIZE, maxY: FARM_HEIGHT - PLAYER_SIZE };

  // Clamp to bounds
  newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
  newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

  // Check tree collisions in forest
  if (state.currentArea === 'forest' && checkTreeCollision(state.forest, newX, newY, PLAYER_SIZE / 2)) {
    // Try to slide along obstacles
    if (!checkTreeCollision(state.forest, newX, state.player.y, PLAYER_SIZE / 2)) {
      newY = state.player.y;
    } else if (!checkTreeCollision(state.forest, state.player.x, newY, PLAYER_SIZE / 2)) {
      newX = state.player.x;
    } else {
      newX = state.player.x;
      newY = state.player.y;
    }
  }

  return {
    ...state,
    player: { ...state.player, x: newX, y: newY },
  };
}

// Handle interaction (E key)
export function handleInteraction(state: GameState): GameState {
  if (state.currentArea === 'forest') {
    return handleForestInteraction(state);
  } else {
    return handleFarmInteraction(state);
  }
}

// Forest interaction: collect seeds
function handleForestInteraction(state: GameState): GameState {
  const { forest, collectedSeed } = collectSeed(
    state.forest,
    state.player.x,
    state.player.y,
    state.unlockedSeeds
  );

  if (collectedSeed) {
    const seedType = collectedSeed.type;
    const currentAmount = state.player.seeds[seedType] || 0;

    // Check seed bag capacity
    if (currentAmount < state.upgrades.seedBagCapacity) {
      return {
        ...state,
        forest,
        player: {
          ...state.player,
          seeds: {
            ...state.player.seeds,
            [seedType]: currentAmount + 1,
          },
        },
      };
    }
  }

  return { ...state, forest };
}

// Farm interaction: plant, harvest, or feed
function handleFarmInteraction(state: GameState): GameState {
  // Check for nearby plot
  const nearbyPlot = getNearbyPlot(state.farm, state.player.x, state.player.y);
  if (nearbyPlot) {
    if (!nearbyPlot.planted) {
      // Plant a seed (try highest tier first)
      const seedTypes: SeedType[] = ['crystal', 'gold', 'silver', 'basic'];
      for (const seedType of seedTypes) {
        const seedCount = state.player.seeds[seedType] || 0;
        if (seedCount > 0 && state.unlockedSeeds.includes(seedType)) {
          return {
            ...state,
            farm: plantSeed(state.farm, nearbyPlot.id, seedType),
            player: {
              ...state.player,
              seeds: {
                ...state.player.seeds,
                [seedType]: seedCount - 1,
              },
            },
          };
        }
      }
    } else if (nearbyPlot.growthProgress >= 1) {
      // Harvest mature watermelon
      const { farm, watermelons } = harvestPlot(state.farm, nearbyPlot.id);
      return {
        ...state,
        farm,
        player: {
          ...state.player,
          watermelons: state.player.watermelons + watermelons,
        },
      };
    }
    return state;
  }

  // Check for nearby chicken
  const nearbyChicken = getNearbyChicken(state.farm, state.player.x, state.player.y);
  if (nearbyChicken && state.player.watermelons > 0) {
    // Feed the chicken
    const { farm, watermelonsUsed } = feedChicken(state.farm, nearbyChicken.id, state.upgrades);
    if (watermelonsUsed > 0) {
      return {
        ...state,
        farm,
        player: {
          ...state.player,
          watermelons: state.player.watermelons - watermelonsUsed,
        },
      };
    }
  }

  return state;
}

// Switch between areas
export function switchArea(state: GameState): GameState {
  const newArea: GameArea = state.currentArea === 'forest' ? 'farm' : 'forest';

  // Reset player position for new area
  const newX = newArea === 'forest' ? FOREST_WIDTH / 2 : FARM_WIDTH / 2;
  const newY = newArea === 'forest' ? FOREST_HEIGHT / 2 : FARM_HEIGHT / 2;

  return {
    ...state,
    currentArea: newArea,
    player: { ...state.player, x: newX, y: newY },
  };
}

// Buy upgrade
export function buyUpgrade(state: GameState, upgradeIndex: number): GameState {
  const upgradeDef = UPGRADE_DEFINITIONS[upgradeIndex];
  if (!upgradeDef) return state;

  const currentLevel = Math.floor(
    (state.upgrades[upgradeDef.id] - (upgradeDef.id === 'seedBagCapacity' ? 10 : 1)) / upgradeDef.effect
  );

  if (currentLevel >= upgradeDef.maxLevel) return state;

  const cost = Math.floor(upgradeDef.baseCost * Math.pow(upgradeDef.costMultiplier, currentLevel));

  if (state.player.coins < cost) return state;

  return {
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins - cost,
    },
    upgrades: {
      ...state.upgrades,
      [upgradeDef.id]: state.upgrades[upgradeDef.id] + upgradeDef.effect,
    },
  };
}

// Buy new plot
export function buyNewPlot(state: GameState): GameState {
  const cost = PLOT_COST * (state.farm.plots.length + 1);
  if (state.player.coins < cost) return state;

  return {
    ...state,
    player: { ...state.player, coins: state.player.coins - cost },
    farm: buyPlot(state.farm),
  };
}

// Buy new chicken
export function buyNewChicken(state: GameState): GameState {
  const cost = CHICKEN_COST * (state.farm.chickens.length + 1);
  if (state.player.coins < cost) return state;

  return {
    ...state,
    player: { ...state.player, coins: state.player.coins - cost },
    farm: buyChicken(state.farm),
  };
}

// Upgrade selected chicken
export function upgradeSelectedChicken(state: GameState, chickenId: number): GameState {
  const { farm, cost, success } = upgradeChicken(state.farm, chickenId);
  if (!success || state.player.coins < cost) return state;

  return {
    ...state,
    player: { ...state.player, coins: state.player.coins - cost },
    farm,
  };
}

// Unlock new seed type
export function unlockSeedType(state: GameState, seedType: SeedType): GameState {
  if (state.unlockedSeeds.includes(seedType)) return state;

  const cost = SEED_CONFIGS[seedType].unlockCost;
  if (state.player.coins < cost) return state;

  return {
    ...state,
    player: { ...state.player, coins: state.player.coins - cost },
    unlockedSeeds: [...state.unlockedSeeds, seedType],
  };
}

// Handle zoom
export function handleZoom(state: GameState, delta: number): GameState {
  const newZoom = Math.max(0.5, Math.min(2, state.zoom + delta * 0.1));
  return { ...state, zoom: newZoom };
}

// Get interaction hint for UI
export function getInteractionHint(state: GameState): string | null {
  if (state.currentArea === 'forest') {
    const nearbySeed = getNearbySeed(
      state.forest,
      state.player.x,
      state.player.y,
      state.unlockedSeeds
    );
    if (nearbySeed) {
      const currentCount = state.player.seeds[nearbySeed.type] || 0;
      if (currentCount < state.upgrades.seedBagCapacity) {
        return `Press E to collect ${nearbySeed.type} seed`;
      } else {
        return 'Seed bag full!';
      }
    }
  } else {
    const nearbyPlot = getNearbyPlot(state.farm, state.player.x, state.player.y);
    if (nearbyPlot) {
      if (!nearbyPlot.planted) {
        const hasSeeds = Object.values(state.player.seeds).some(count => count && count > 0);
        if (hasSeeds) {
          return 'Press E to plant';
        } else {
          return 'No seeds to plant';
        }
      } else if (nearbyPlot.growthProgress >= 1) {
        return 'Press E to harvest';
      } else {
        return `Growing: ${Math.floor(nearbyPlot.growthProgress * 100)}%`;
      }
    }

    const nearbyChicken = getNearbyChicken(state.farm, state.player.x, state.player.y);
    if (nearbyChicken) {
      const now = Date.now();
      if (now < nearbyChicken.fedUntil) {
        const timeLeft = Math.ceil((nearbyChicken.fedUntil - now) / 1000);
        return `Fed for ${timeLeft}s`;
      } else if (state.player.watermelons > 0) {
        return 'Press E to feed';
      } else {
        return 'Need watermelon to feed';
      }
    }
  }

  return null;
}
