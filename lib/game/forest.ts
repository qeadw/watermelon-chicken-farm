import {
  ForestState,
  Seed,
  SeedType,
  FOREST_WIDTH,
  FOREST_HEIGHT,
  SEED_RESPAWN_TIME,
  SEED_CONFIGS,
} from '../types';

// Generate unique ID
let seedIdCounter = 0;
function generateSeedId(): string {
  return `seed-${seedIdCounter++}`;
}

// Determine seed type based on distance from center (rarer seeds further out)
function getSeedTypeForPosition(x: number, y: number): SeedType {
  const centerX = FOREST_WIDTH / 2;
  const centerY = FOREST_HEIGHT / 2;
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
  const normalizedDistance = distance / maxDistance;

  // Probability distribution based on distance
  const rand = Math.random();

  if (normalizedDistance > 0.8) {
    // Outer areas: higher chance of rare seeds
    if (rand < 0.1) return 'crystal';
    if (rand < 0.35) return 'gold';
    if (rand < 0.65) return 'silver';
    return 'basic';
  } else if (normalizedDistance > 0.5) {
    // Middle areas
    if (rand < 0.02) return 'crystal';
    if (rand < 0.15) return 'gold';
    if (rand < 0.45) return 'silver';
    return 'basic';
  } else {
    // Center/starting area: mostly basic seeds
    if (rand < 0.01) return 'gold';
    if (rand < 0.15) return 'silver';
    return 'basic';
  }
}

// Initialize forest with trees, bushes, and seeds
export function initializeForest(): ForestState {
  const trees: { x: number; y: number; size: number }[] = [];
  const bushes: { x: number; y: number }[] = [];
  const seeds: Seed[] = [];

  // Generate trees (avoiding center where player starts)
  const numTrees = 40;
  for (let i = 0; i < numTrees; i++) {
    let x, y;
    do {
      x = Math.random() * (FOREST_WIDTH - 100) + 50;
      y = Math.random() * (FOREST_HEIGHT - 100) + 50;
    } while (
      // Avoid center starting area
      (x > FOREST_WIDTH / 2 - 100 && x < FOREST_WIDTH / 2 + 100 &&
       y > FOREST_HEIGHT / 2 - 100 && y < FOREST_HEIGHT / 2 + 100)
    );

    trees.push({
      x,
      y,
      size: Math.floor(Math.random() * 3), // 0, 1, or 2
    });
  }

  // Generate bushes with seeds
  const numBushes = 60;
  for (let i = 0; i < numBushes; i++) {
    let x, y;
    do {
      x = Math.random() * (FOREST_WIDTH - 60) + 30;
      y = Math.random() * (FOREST_HEIGHT - 60) + 30;
    } while (
      // Avoid center starting area and trees
      (x > FOREST_WIDTH / 2 - 80 && x < FOREST_WIDTH / 2 + 80 &&
       y > FOREST_HEIGHT / 2 - 80 && y < FOREST_HEIGHT / 2 + 80) ||
      trees.some(t => Math.abs(t.x - x) < 40 && Math.abs(t.y - y) < 40)
    );

    bushes.push({ x, y });

    // Create a seed at this bush
    seeds.push({
      id: generateSeedId(),
      type: getSeedTypeForPosition(x, y),
      x,
      y,
      respawnTime: 0,
      collected: false,
    });
  }

  return { trees, bushes, seeds };
}

// Update forest state (respawn seeds)
export function updateForest(forest: ForestState, deltaTime: number): ForestState {
  const now = Date.now();
  const updatedSeeds = forest.seeds.map(seed => {
    if (seed.collected && seed.respawnTime <= now) {
      // Respawn the seed
      return {
        ...seed,
        collected: false,
        type: getSeedTypeForPosition(seed.x, seed.y),
      };
    }
    return seed;
  });

  return { ...forest, seeds: updatedSeeds };
}

// Try to collect a seed near the player
export function collectSeed(
  forest: ForestState,
  playerX: number,
  playerY: number,
  unlockedSeeds: SeedType[]
): { forest: ForestState; collectedSeed: Seed | null } {
  const collectionRadius = 40;
  const now = Date.now();

  let collectedSeed: Seed | null = null;

  const updatedSeeds = forest.seeds.map(seed => {
    if (collectedSeed) return seed; // Already collected one
    if (seed.collected) return seed;

    // Check if seed type is unlocked
    if (!unlockedSeeds.includes(seed.type)) return seed;

    const distance = Math.sqrt((seed.x - playerX) ** 2 + (seed.y - playerY) ** 2);
    if (distance <= collectionRadius) {
      collectedSeed = seed;
      return {
        ...seed,
        collected: true,
        respawnTime: now + SEED_RESPAWN_TIME * 1000,
      };
    }
    return seed;
  });

  return {
    forest: { ...forest, seeds: updatedSeeds },
    collectedSeed,
  };
}

// Get uncollected seeds for rendering
export function getVisibleSeeds(forest: ForestState): Seed[] {
  return forest.seeds.filter(seed => !seed.collected);
}

// Check collision with trees (for movement blocking)
export function checkTreeCollision(
  forest: ForestState,
  x: number,
  y: number,
  radius: number
): boolean {
  return forest.trees.some(tree => {
    const trunkRadius = 10 + tree.size * 5;
    const distance = Math.sqrt((tree.x - x) ** 2 + (tree.y + 20 - y) ** 2);
    return distance < radius + trunkRadius;
  });
}

// Get nearby seeds for UI indication
export function getNearbySeed(
  forest: ForestState,
  playerX: number,
  playerY: number,
  unlockedSeeds: SeedType[]
): Seed | null {
  const interactionRadius = 50;

  for (const seed of forest.seeds) {
    if (seed.collected) continue;
    if (!unlockedSeeds.includes(seed.type)) continue;

    const distance = Math.sqrt((seed.x - playerX) ** 2 + (seed.y - playerY) ** 2);
    if (distance <= interactionRadius) {
      return seed;
    }
  }

  return null;
}
