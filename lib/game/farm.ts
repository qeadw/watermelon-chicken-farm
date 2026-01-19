import {
  FarmState,
  Plot,
  Chicken,
  SeedType,
  ChickenType,
  Upgrades,
  SEED_CONFIGS,
  CHICKEN_CONFIGS,
  FARM_WIDTH,
  FARM_HEIGHT,
  EGG_TO_COIN_RATE,
} from '../types';

// Initialize farm with starting plots and chickens
export function initializeFarm(): FarmState {
  const plots: Plot[] = [];
  const chickens: Chicken[] = [];

  // Start with 2 garden plots
  const plotStartX = 100;
  const plotStartY = 150;
  const plotSpacing = 60;

  for (let i = 0; i < 2; i++) {
    plots.push({
      id: i,
      planted: false,
      seedType: null,
      plantedAt: null,
      growthProgress: 0,
      fertilityLevel: 1,
      x: plotStartX + (i % 4) * plotSpacing,
      y: plotStartY + Math.floor(i / 4) * plotSpacing,
    });
  }

  // Start with 1 basic chicken
  chickens.push({
    id: 0,
    type: 'basic',
    fedUntil: 0, // starts hungry
    eggsProduced: 0,
    x: 500,
    y: 200,
  });

  return { plots, chickens };
}

// Update farm state (grow plants, produce eggs)
export function updateFarm(
  farm: FarmState,
  upgrades: Upgrades,
  deltaTime: number
): { farm: FarmState; eggsProduced: number; coinsEarned: number } {
  const now = Date.now();
  const deltaSeconds = deltaTime / 1000;
  let totalEggsProduced = 0;

  // Update plots - grow plants
  const updatedPlots = farm.plots.map(plot => {
    if (!plot.planted || !plot.seedType || !plot.plantedAt) return plot;

    const seedConfig = SEED_CONFIGS[plot.seedType];
    const growTime = seedConfig.growTime / (plot.fertilityLevel * upgrades.plotFertility);
    const elapsed = (now - plot.plantedAt) / 1000;
    const progress = Math.min(1, elapsed / growTime);

    return { ...plot, growthProgress: progress };
  });

  // Update chickens - produce eggs
  const updatedChickens = farm.chickens.map(chicken => {
    if (now < chicken.fedUntil) {
      // Chicken is fed, produce eggs
      const config = CHICKEN_CONFIGS[chicken.type];
      const eggsThisTick = (config.eggsPerMinute / 60) * deltaSeconds;
      totalEggsProduced += eggsThisTick;
      return {
        ...chicken,
        eggsProduced: chicken.eggsProduced + eggsThisTick,
      };
    }
    return chicken;
  });

  const coinsEarned = totalEggsProduced * EGG_TO_COIN_RATE * upgrades.eggValue;

  return {
    farm: { ...farm, plots: updatedPlots, chickens: updatedChickens },
    eggsProduced: totalEggsProduced,
    coinsEarned,
  };
}

// Plant a seed in a plot
export function plantSeed(
  farm: FarmState,
  plotId: number,
  seedType: SeedType
): FarmState {
  const updatedPlots = farm.plots.map(plot => {
    if (plot.id === plotId && !plot.planted) {
      return {
        ...plot,
        planted: true,
        seedType,
        plantedAt: Date.now(),
        growthProgress: 0,
      };
    }
    return plot;
  });

  return { ...farm, plots: updatedPlots };
}

// Harvest a mature watermelon
export function harvestPlot(
  farm: FarmState,
  plotId: number
): { farm: FarmState; watermelons: number } {
  let watermelonsHarvested = 0;

  const updatedPlots = farm.plots.map(plot => {
    if (plot.id === plotId && plot.planted && plot.growthProgress >= 1 && plot.seedType) {
      watermelonsHarvested = SEED_CONFIGS[plot.seedType].yield;
      return {
        ...plot,
        planted: false,
        seedType: null,
        plantedAt: null,
        growthProgress: 0,
      };
    }
    return plot;
  });

  return {
    farm: { ...farm, plots: updatedPlots },
    watermelons: watermelonsHarvested,
  };
}

// Feed a chicken with watermelons
export function feedChicken(
  farm: FarmState,
  chickenId: number,
  upgrades: Upgrades
): { farm: FarmState; watermelonsUsed: number } {
  let watermelonsUsed = 0;

  const updatedChickens = farm.chickens.map(chicken => {
    if (chicken.id === chickenId) {
      const config = CHICKEN_CONFIGS[chicken.type];
      const feedDuration = config.feedDuration * upgrades.chickenHunger * 1000;
      watermelonsUsed = 1;
      return {
        ...chicken,
        fedUntil: Date.now() + feedDuration,
      };
    }
    return chicken;
  });

  return {
    farm: { ...farm, chickens: updatedChickens },
    watermelonsUsed,
  };
}

// Buy a new garden plot
export function buyPlot(farm: FarmState): FarmState {
  const plotSpacing = 60;
  const plotStartX = 100;
  const plotStartY = 150;
  const newId = farm.plots.length;

  const newPlot: Plot = {
    id: newId,
    planted: false,
    seedType: null,
    plantedAt: null,
    growthProgress: 0,
    fertilityLevel: 1,
    x: plotStartX + (newId % 4) * plotSpacing,
    y: plotStartY + Math.floor(newId / 4) * plotSpacing,
  };

  return { ...farm, plots: [...farm.plots, newPlot] };
}

// Buy a new chicken
export function buyChicken(farm: FarmState): FarmState {
  const newId = farm.chickens.length;
  const coopStartX = 450;
  const coopStartY = 150;
  const spacing = 50;

  const newChicken: Chicken = {
    id: newId,
    type: 'basic',
    fedUntil: 0,
    eggsProduced: 0,
    x: coopStartX + (newId % 3) * spacing,
    y: coopStartY + Math.floor(newId / 3) * spacing,
  };

  return { ...farm, chickens: [...farm.chickens, newChicken] };
}

// Upgrade a chicken to the next tier
export function upgradeChicken(
  farm: FarmState,
  chickenId: number
): { farm: FarmState; cost: number; success: boolean } {
  const typeOrder: ChickenType[] = ['basic', 'fat', 'golden', 'cosmic'];
  let upgradeCost = 0;
  let success = false;

  const updatedChickens = farm.chickens.map(chicken => {
    if (chicken.id === chickenId) {
      const currentIndex = typeOrder.indexOf(chicken.type);
      if (currentIndex < typeOrder.length - 1) {
        const nextType = typeOrder[currentIndex + 1];
        upgradeCost = CHICKEN_CONFIGS[nextType].upgradeCost;
        success = true;
        return { ...chicken, type: nextType };
      }
    }
    return chicken;
  });

  return {
    farm: { ...farm, chickens: updatedChickens },
    cost: upgradeCost,
    success,
  };
}

// Get plot near player position
export function getNearbyPlot(
  farm: FarmState,
  playerX: number,
  playerY: number
): Plot | null {
  const interactionRadius = 50;

  for (const plot of farm.plots) {
    const distance = Math.sqrt((plot.x + 24 - playerX) ** 2 + (plot.y + 24 - playerY) ** 2);
    if (distance <= interactionRadius) {
      return plot;
    }
  }

  return null;
}

// Get chicken near player position
export function getNearbyChicken(
  farm: FarmState,
  playerX: number,
  playerY: number
): Chicken | null {
  const interactionRadius = 50;

  for (const chicken of farm.chickens) {
    const distance = Math.sqrt((chicken.x + 16 - playerX) ** 2 + (chicken.y + 16 - playerY) ** 2);
    if (distance <= interactionRadius) {
      return chicken;
    }
  }

  return null;
}

// Calculate offline progress
export function calculateOfflineProgress(
  farm: FarmState,
  upgrades: Upgrades,
  lastUpdate: number
): { farm: FarmState; eggsProduced: number; coinsEarned: number } {
  const now = Date.now();
  const offlineTime = now - lastUpdate;

  // Cap offline time to 24 hours
  const maxOfflineTime = 24 * 60 * 60 * 1000;
  const cappedOfflineTime = Math.min(offlineTime, maxOfflineTime);

  // Update plants growth
  const updatedPlots = farm.plots.map(plot => {
    if (!plot.planted || !plot.seedType || !plot.plantedAt) return plot;

    const seedConfig = SEED_CONFIGS[plot.seedType];
    const growTime = seedConfig.growTime / (plot.fertilityLevel * upgrades.plotFertility);
    const elapsed = (now - plot.plantedAt) / 1000;
    const progress = Math.min(1, elapsed / growTime);

    return { ...plot, growthProgress: progress };
  });

  // Calculate eggs produced during offline time
  let totalEggsProduced = 0;
  const updatedChickens = farm.chickens.map(chicken => {
    const config = CHICKEN_CONFIGS[chicken.type];

    // Calculate how much time the chicken was fed during offline period
    const fedTimeRemaining = Math.max(0, chicken.fedUntil - lastUpdate);
    const fedTimeDuringOffline = Math.min(fedTimeRemaining, cappedOfflineTime);

    const eggsProduced = (config.eggsPerMinute / 60000) * fedTimeDuringOffline;
    totalEggsProduced += eggsProduced;

    return {
      ...chicken,
      eggsProduced: chicken.eggsProduced + eggsProduced,
    };
  });

  const coinsEarned = totalEggsProduced * EGG_TO_COIN_RATE * upgrades.eggValue;

  return {
    farm: { ...farm, plots: updatedPlots, chickens: updatedChickens },
    eggsProduced: totalEggsProduced,
    coinsEarned,
  };
}
