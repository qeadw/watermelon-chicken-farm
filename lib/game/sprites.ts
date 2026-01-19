// Pixel art sprite generation using canvas
import { SeedType, ChickenType, SEED_CONFIGS, CHICKEN_CONFIGS } from '../types';

// Sprite cache to avoid regenerating
const spriteCache = new Map<string, HTMLCanvasElement>();

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
}

export function getPlayerSprite(): HTMLCanvasElement {
  const key = 'player';
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext('2d')!;
  const s = 3; // pixel size

  // Farmer character (8x8 pixels scaled up)
  const pixels = [
    '  1111  ',
    ' 111111 ',
    ' 1FFFF1 ',
    '  FOOF  ',
    '  FFFF  ',
    ' 222222 ',
    ' 22  22 ',
    ' 33  33 ',
  ];

  const colors: Record<string, string> = {
    '1': '#8B4513', // brown hat
    'F': '#FFDAB9', // skin
    'O': '#000000', // eyes
    '2': '#228B22', // green shirt
    '3': '#4169E1', // blue pants
  };

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (colors[pixel]) {
        drawPixel(ctx, x, y, colors[pixel], s);
      }
    });
  });

  spriteCache.set(key, canvas);
  return canvas;
}

export function getSeedSprite(type: SeedType): HTMLCanvasElement {
  const key = `seed-${type}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d')!;
  const s = 2;
  const config = SEED_CONFIGS[type];

  // Seed packet shape (8x8)
  const pixels = [
    '  2222  ',
    ' 222222 ',
    ' 211112 ',
    ' 211112 ',
    ' 211112 ',
    ' 222222 ',
    ' 222222 ',
    '  2222  ',
  ];

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (pixel === '2') {
        drawPixel(ctx, x, y, config.color, s);
      } else if (pixel === '1') {
        drawPixel(ctx, x, y, '#ffffff', s);
      }
    });
  });

  spriteCache.set(key, canvas);
  return canvas;
}

export function getWatermelonSprite(stage: 'seed' | 'growing' | 'mature'): HTMLCanvasElement {
  const key = `watermelon-${stage}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d')!;
  const s = 4;

  if (stage === 'seed') {
    // Small seedling
    const pixels = [
      '        ',
      '   11   ',
      '  1111  ',
      '   11   ',
      '   22   ',
      '   22   ',
      '  3333  ',
      '        ',
    ];
    const colors: Record<string, string> = { '1': '#228B22', '2': '#8B4513', '3': '#5c4033' };
    pixels.forEach((row, y) => {
      row.split('').forEach((pixel, x) => {
        if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
      });
    });
  } else if (stage === 'growing') {
    // Medium plant with small watermelon
    const pixels = [
      '  1111  ',
      ' 111111 ',
      '11111111',
      '  1221  ',
      ' 122221 ',
      ' 122221 ',
      '  1221  ',
      '  3333  ',
    ];
    const colors: Record<string, string> = { '1': '#228B22', '2': '#90EE90', '3': '#5c4033' };
    pixels.forEach((row, y) => {
      row.split('').forEach((pixel, x) => {
        if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
      });
    });
  } else {
    // Mature watermelon
    const pixels = [
      '   11   ',
      ' 112211 ',
      ' 123321 ',
      '12233221',
      '12233221',
      ' 123321 ',
      ' 112211 ',
      '   11   ',
    ];
    const colors: Record<string, string> = { '1': '#228B22', '2': '#32CD32', '3': '#90EE90' };
    pixels.forEach((row, y) => {
      row.split('').forEach((pixel, x) => {
        if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
      });
    });
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getChickenSprite(type: ChickenType, fed: boolean): HTMLCanvasElement {
  const key = `chicken-${type}-${fed}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d')!;
  const s = 4;
  const config = CHICKEN_CONFIGS[type];

  // Basic chicken shape (8x8)
  const pixels = [
    '   11   ',
    '  1111  ',
    ' 111E11 ',
    ' 1111B1 ',
    '11111111',
    '11111111',
    ' 1    1 ',
    ' L    L ',
  ];

  const baseColor = fed ? config.color : '#888888';
  const colors: Record<string, string> = {
    '1': baseColor,
    'E': '#000000', // eye
    'B': '#FF6600', // beak
    'L': '#FF6600', // legs
  };

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
    });
  });

  // Add special effects for higher tier chickens
  if (type === 'golden' && fed) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(0, 0, 32, 32);
  } else if (type === 'cosmic' && fed) {
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.fillRect(0, 0, 32, 32);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getTreeSprite(size: number): HTMLCanvasElement {
  const key = `tree-${size}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const width = 32 + size * 16;
  const height = 48 + size * 24;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  // Tree trunk
  ctx.fillStyle = '#8B4513';
  const trunkWidth = 8 + size * 4;
  const trunkHeight = 16 + size * 8;
  ctx.fillRect((width - trunkWidth) / 2, height - trunkHeight, trunkWidth, trunkHeight);

  // Tree foliage (circles)
  ctx.fillStyle = '#228B22';
  const foliageRadius = 16 + size * 8;
  ctx.beginPath();
  ctx.arc(width / 2, height - trunkHeight - foliageRadius / 2, foliageRadius, 0, Math.PI * 2);
  ctx.fill();

  // Add some darker spots for depth
  ctx.fillStyle = '#1a6b1a';
  for (let i = 0; i < 3 + size; i++) {
    const spotX = width / 2 + (Math.random() - 0.5) * foliageRadius;
    const spotY = height - trunkHeight - foliageRadius / 2 + (Math.random() - 0.5) * foliageRadius;
    ctx.beginPath();
    ctx.arc(spotX, spotY, foliageRadius / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getBushSprite(hasSeed: boolean): HTMLCanvasElement {
  const key = `bush-${hasSeed}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext('2d')!;
  const s = 3;

  // Bush shape (8x8)
  const pixels = [
    '  1111  ',
    ' 111111 ',
    '11111111',
    '11111111',
    '11111111',
    ' 111111 ',
    '  2222  ',
    '   22   ',
  ];

  const colors: Record<string, string> = {
    '1': hasSeed ? '#32CD32' : '#228B22',
    '2': '#5c4033',
  };

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
    });
  });

  // Add glowing seeds if present
  if (hasSeed) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(9, 9, 6, 6);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(10, 10, 4, 4);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getPlotSprite(empty: boolean): HTMLCanvasElement {
  const key = `plot-${empty}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d')!;

  // Dirt plot
  ctx.fillStyle = empty ? '#8B4513' : '#654321';
  ctx.fillRect(2, 2, 44, 44);

  // Border
  ctx.strokeStyle = '#5c4033';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 44, 44);

  // Soil lines
  ctx.strokeStyle = '#6B3E13';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(6, 10 + i * 10);
    ctx.lineTo(42, 10 + i * 10);
    ctx.stroke();
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getEggSprite(): HTMLCanvasElement {
  const key = 'egg';
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d')!;
  const s = 2;

  // Egg shape (8x8)
  const pixels = [
    '   11   ',
    '  1111  ',
    ' 111111 ',
    ' 111111 ',
    ' 111111 ',
    '  1111  ',
    '  1111  ',
    '   11   ',
  ];

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (pixel === '1') {
        drawPixel(ctx, x, y, '#FFFAF0', s);
      }
    });
  });

  // Highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(6, 4, 4, 4);

  spriteCache.set(key, canvas);
  return canvas;
}

export function getCoinSprite(): HTMLCanvasElement {
  const key = 'coin';
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d')!;
  const s = 2;

  // Coin shape (8x8)
  const pixels = [
    '  1111  ',
    ' 112211 ',
    '11222211',
    '12211221',
    '12211221',
    '11222211',
    ' 112211 ',
    '  1111  ',
  ];

  const colors: Record<string, string> = {
    '1': '#FFD700',
    '2': '#FFA500',
  };

  pixels.forEach((row, y) => {
    row.split('').forEach((pixel, x) => {
      if (colors[pixel]) drawPixel(ctx, x, y, colors[pixel], s);
    });
  });

  spriteCache.set(key, canvas);
  return canvas;
}

export function clearSpriteCache() {
  spriteCache.clear();
}
