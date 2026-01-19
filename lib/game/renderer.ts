import {
  GameState,
  GAME_WIDTH,
  GAME_HEIGHT,
  FOREST_WIDTH,
  FOREST_HEIGHT,
  FARM_WIDTH,
  FARM_HEIGHT,
  SEED_CONFIGS,
  CHICKEN_CONFIGS,
  UPGRADE_DEFINITIONS,
  PLOT_COST,
  CHICKEN_COST,
  SeedType,
} from '../types';
import {
  getPlayerSprite,
  getSeedSprite,
  getWatermelonSprite,
  getChickenSprite,
  getTreeSprite,
  getBushSprite,
  getPlotSprite,
  getEggSprite,
  getCoinSprite,
} from './sprites';
import { getInteractionHint } from './engine';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(state: GameState): void {
    this.ctx.save();

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply zoom and camera
    const zoom = state.zoom;
    this.ctx.scale(zoom, zoom);

    // Calculate camera offset to center on player
    const worldWidth = state.currentArea === 'forest' ? FOREST_WIDTH : FARM_WIDTH;
    const worldHeight = state.currentArea === 'forest' ? FOREST_HEIGHT : FARM_HEIGHT;

    const camX = Math.max(0, Math.min(worldWidth - this.width / zoom, state.player.x - this.width / (2 * zoom)));
    const camY = Math.max(0, Math.min(worldHeight - this.height / zoom, state.player.y - this.height / (2 * zoom)));

    this.ctx.translate(-camX, -camY);

    if (state.currentArea === 'forest') {
      this.renderForest(state);
    } else {
      this.renderFarm(state);
    }

    // Render player
    this.renderPlayer(state);

    this.ctx.restore();

    // Render UI (not affected by camera)
    this.renderUI(state);
  }

  private renderForest(state: GameState): void {
    // Draw grass background
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, FOREST_WIDTH, FOREST_HEIGHT);

    // Draw some grass variation
    this.ctx.fillStyle = '#3d6a37';
    for (let x = 0; x < FOREST_WIDTH; x += 40) {
      for (let y = 0; y < FOREST_HEIGHT; y += 40) {
        if ((x + y) % 80 === 0) {
          this.ctx.fillRect(x, y, 40, 40);
        }
      }
    }

    // Draw trees (background)
    for (const tree of state.forest.trees) {
      const sprite = getTreeSprite(tree.size);
      this.ctx.drawImage(sprite, tree.x - sprite.width / 2, tree.y - sprite.height + 20);
    }

    // Draw bushes with seeds
    for (const seed of state.forest.seeds) {
      const hasSeed = !seed.collected && state.unlockedSeeds.includes(seed.type);
      const bushSprite = getBushSprite(hasSeed);
      this.ctx.drawImage(bushSprite, seed.x - 12, seed.y - 12);

      // Draw seed indicator above bush
      if (hasSeed) {
        const seedSprite = getSeedSprite(seed.type);
        this.ctx.drawImage(seedSprite, seed.x - 8, seed.y - 32);
      }
    }

    // Draw boundary indicator
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, FOREST_WIDTH - 20, FOREST_HEIGHT - 20);
  }

  private renderFarm(state: GameState): void {
    // Draw farm background
    this.ctx.fillStyle = '#c4a76c';
    this.ctx.fillRect(0, 0, FARM_WIDTH, FARM_HEIGHT);

    // Draw barn area
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(50, 50, 100, 80);
    this.ctx.fillStyle = '#a52a2a';
    this.ctx.fillRect(50, 30, 100, 20);

    // Draw chicken coop area
    this.ctx.fillStyle = '#deb887';
    this.ctx.fillRect(400, 100, 200, 150);
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(400, 100, 200, 150);

    // Coop label
    this.ctx.fillStyle = '#4a3520';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Chicken Coop', 450, 90);

    // Draw garden plots
    for (const plot of state.farm.plots) {
      const plotSprite = getPlotSprite(!plot.planted);
      this.ctx.drawImage(plotSprite, plot.x, plot.y);

      if (plot.planted && plot.seedType) {
        let stage: 'seed' | 'growing' | 'mature';
        if (plot.growthProgress < 0.3) stage = 'seed';
        else if (plot.growthProgress < 1) stage = 'growing';
        else stage = 'mature';

        const plantSprite = getWatermelonSprite(stage);
        this.ctx.drawImage(plantSprite, plot.x + 8, plot.y + 8);

        // Draw progress bar if not mature
        if (plot.growthProgress < 1) {
          this.ctx.fillStyle = '#333';
          this.ctx.fillRect(plot.x, plot.y - 8, 48, 6);
          this.ctx.fillStyle = '#4CAF50';
          this.ctx.fillRect(plot.x + 1, plot.y - 7, 46 * plot.growthProgress, 4);
        }
      }
    }

    // Draw chickens
    const now = Date.now();
    for (const chicken of state.farm.chickens) {
      const fed = now < chicken.fedUntil;
      const sprite = getChickenSprite(chicken.type, fed);
      this.ctx.drawImage(sprite, chicken.x, chicken.y);

      // Draw fed indicator
      if (fed) {
        const timeLeft = Math.ceil((chicken.fedUntil - now) / 1000);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`${timeLeft}s`, chicken.x + 8, chicken.y - 5);
      } else {
        // Hungry indicator
        this.ctx.fillStyle = '#ff6666';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('!', chicken.x + 12, chicken.y - 5);
      }
    }

    // Draw area labels
    this.ctx.fillStyle = '#4a3520';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Garden', 140, 140);
  }

  private renderPlayer(state: GameState): void {
    const sprite = getPlayerSprite();
    this.ctx.drawImage(sprite, state.player.x - 12, state.player.y - 12);

    // Draw interaction indicator
    const hint = getInteractionHint(state);
    if (hint) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(state.player.x - 50, state.player.y - 40, 100, 20);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(hint, state.player.x, state.player.y - 26);
      this.ctx.textAlign = 'left';
    }
  }

  private renderUI(state: GameState): void {
    // Main resources panel (top left)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 200, 100);
    this.ctx.strokeStyle = '#4a3520';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(10, 10, 200, 100);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Coins: ${Math.floor(state.player.coins)}`, 20, 35);

    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillText(`Watermelons: ${state.player.watermelons}`, 20, 55);

    this.ctx.fillStyle = '#FFFAF0';
    this.ctx.fillText(`Eggs: ${Math.floor(state.player.eggs)}`, 20, 75);

    // Seed inventory
    let seedY = 95;
    const seedTypes: SeedType[] = ['basic', 'silver', 'gold', 'crystal'];
    for (const seedType of seedTypes) {
      if (state.unlockedSeeds.includes(seedType)) {
        const count = state.player.seeds[seedType] || 0;
        this.ctx.fillStyle = SEED_CONFIGS[seedType].color;
        this.ctx.fillText(`${seedType}: ${count}/${state.upgrades.seedBagCapacity}`, 20, seedY);
        seedY += 15;
      }
    }
    // Adjust panel size based on seeds
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 100, 200, state.unlockedSeeds.length * 15 + 10);

    // Area indicator (top center)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(this.width / 2 - 60, 10, 120, 30);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(state.currentArea === 'forest' ? 'FOREST' : 'FARM', this.width / 2, 32);
    this.ctx.textAlign = 'left';

    // Controls hint (bottom)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, this.height - 50, this.width - 20, 40);
    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('WASD: Move | E: Interact | Tab: Switch Area | 1-5: Upgrades | Scroll: Zoom', 20, this.height - 25);

    // Shop panel (right side)
    this.renderShop(state);
  }

  private renderShop(state: GameState): void {
    const shopX = this.width - 220;
    const shopY = 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(shopX, shopY, 210, 350);
    this.ctx.strokeStyle = '#4a3520';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(shopX, shopY, 210, 350);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('SHOP', shopX + 85, shopY + 20);

    // Upgrades
    let y = shopY + 45;
    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '11px monospace';
    this.ctx.fillText('Upgrades (1-5):', shopX + 10, y);
    y += 18;

    for (let i = 0; i < UPGRADE_DEFINITIONS.length; i++) {
      const upgrade = UPGRADE_DEFINITIONS[i];
      const currentLevel = Math.floor(
        (state.upgrades[upgrade.id] - (upgrade.id === 'seedBagCapacity' ? 10 : 1)) / upgrade.effect
      );
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
      const maxed = currentLevel >= upgrade.maxLevel;

      this.ctx.fillStyle = maxed ? '#666' : (state.player.coins >= cost ? '#fff' : '#888');
      this.ctx.fillText(
        `${i + 1}. ${upgrade.name} Lv${currentLevel}${maxed ? ' MAX' : ` - ${cost}c`}`,
        shopX + 10,
        y
      );
      y += 16;
    }

    // Buy plots
    y += 10;
    const plotCost = PLOT_COST * (state.farm.plots.length + 1);
    this.ctx.fillStyle = state.player.coins >= plotCost ? '#90EE90' : '#666';
    this.ctx.fillText(`6. Buy Plot - ${plotCost}c`, shopX + 10, y);
    y += 16;

    // Buy chickens
    const chickenCost = CHICKEN_COST * (state.farm.chickens.length + 1);
    this.ctx.fillStyle = state.player.coins >= chickenCost ? '#FFD700' : '#666';
    this.ctx.fillText(`7. Buy Chicken - ${chickenCost}c`, shopX + 10, y);
    y += 20;

    // Seed unlocks
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillText('Unlock Seeds:', shopX + 10, y);
    y += 18;

    const seedTypes: SeedType[] = ['silver', 'gold', 'crystal'];
    let keyNum = 8;
    for (const seedType of seedTypes) {
      const config = SEED_CONFIGS[seedType];
      const unlocked = state.unlockedSeeds.includes(seedType);

      if (unlocked) {
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(`${keyNum}. ${seedType} (Unlocked)`, shopX + 10, y);
      } else {
        this.ctx.fillStyle = state.player.coins >= config.unlockCost ? config.color : '#666';
        this.ctx.fillText(`${keyNum}. ${seedType} - ${config.unlockCost}c`, shopX + 10, y);
      }
      y += 16;
      keyNum++;
    }

    // Chicken upgrades
    y += 10;
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillText('Click chicken to upgrade', shopX + 10, y);
  }
}
