'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, InputState, GAME_WIDTH, GAME_HEIGHT, SeedType } from '@/lib/types';
import {
  createInitialState,
  loadGame,
  saveGame,
  updateGame,
  handleInteraction,
  switchArea,
  buyUpgrade,
  buyNewPlot,
  buyNewChicken,
  unlockSeedType,
  handleZoom,
  upgradeSelectedChicken,
} from '@/lib/game/engine';
import { Renderer } from '@/lib/game/renderer';
import { getNearbyChicken } from '@/lib/game/farm';

const SAVE_KEY = 'watermelon-farm-save';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({ keys: new Set(), mouseX: 0, mouseY: 0, mouseDown: false });
  const rendererRef = useRef<Renderer | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const saveBufferRef = useRef('');
  const skipSaveRef = useRef(false);

  // Initialize game
  useEffect(() => {
    // Load saved game or create new
    const savedState = loadGame();
    gameStateRef.current = savedState || createInitialState();
    setIsLoaded(true);

    // Auto-save every 10 seconds
    const saveInterval = setInterval(() => {
      if (gameStateRef.current) {
        saveGame(gameStateRef.current);
      }
    }, 10000);

    return () => {
      clearInterval(saveInterval);
      // Save on unmount (unless importing)
      if (gameStateRef.current && !skipSaveRef.current) {
        saveGame(gameStateRef.current);
      }
    };
  }, []);

  // Setup renderer
  useEffect(() => {
    if (!canvasRef.current || !isLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new Renderer(ctx, GAME_WIDTH, GAME_HEIGHT);
  }, [isLoaded]);

  // Input handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    inputRef.current.keys.add(e.key);

    // Save code detection
    if (e.key.length === 1) {
      saveBufferRef.current = (saveBufferRef.current + e.key).slice(-4);
      if (saveBufferRef.current.toLowerCase() === 'save') {
        setShowSaveModal(true);
        saveBufferRef.current = '';
        return;
      }
    }

    // Prevent default for game keys
    if (['w', 'a', 's', 'd', 'e', 'Tab', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }

    if (!gameStateRef.current) return;

    // Handle single-press actions
    if (e.key.toLowerCase() === 'e') {
      gameStateRef.current = handleInteraction(gameStateRef.current);
    } else if (e.key === 'Tab') {
      gameStateRef.current = switchArea(gameStateRef.current);
    } else if (e.key >= '1' && e.key <= '5') {
      // Upgrades
      const index = parseInt(e.key) - 1;
      gameStateRef.current = buyUpgrade(gameStateRef.current, index);
    } else if (e.key === '6') {
      // Buy plot
      gameStateRef.current = buyNewPlot(gameStateRef.current);
    } else if (e.key === '7') {
      // Buy chicken
      gameStateRef.current = buyNewChicken(gameStateRef.current);
    } else if (e.key === '8') {
      // Unlock silver seed
      gameStateRef.current = unlockSeedType(gameStateRef.current, 'silver');
    } else if (e.key === '9') {
      // Unlock gold seed
      gameStateRef.current = unlockSeedType(gameStateRef.current, 'gold');
    } else if (e.key === '0') {
      // Unlock crystal seed
      gameStateRef.current = unlockSeedType(gameStateRef.current, 'crystal');
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    inputRef.current.keys.delete(e.key);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!gameStateRef.current) return;
    gameStateRef.current = handleZoom(gameStateRef.current, -Math.sign(e.deltaY));
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!gameStateRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check if clicking on a chicken in farm area
    if (gameStateRef.current.currentArea === 'farm') {
      // Calculate world position from screen position
      const zoom = gameStateRef.current.zoom;
      const worldWidth = 800;
      const worldHeight = 600;
      const camX = Math.max(0, Math.min(worldWidth - GAME_WIDTH / zoom, gameStateRef.current.player.x - GAME_WIDTH / (2 * zoom)));
      const camY = Math.max(0, Math.min(worldHeight - GAME_HEIGHT / zoom, gameStateRef.current.player.y - GAME_HEIGHT / (2 * zoom)));

      const worldX = mouseX / zoom + camX;
      const worldY = mouseY / zoom + camY;

      // Find chicken at click position
      for (const chicken of gameStateRef.current.farm.chickens) {
        if (worldX >= chicken.x && worldX <= chicken.x + 32 &&
            worldY >= chicken.y && worldY <= chicken.y + 32) {
          gameStateRef.current = upgradeSelectedChicken(gameStateRef.current, chicken.id);
          break;
        }
      }
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleWheel, handleClick]);

  // Game loop
  useEffect(() => {
    if (!isLoaded) return;

    let animationId: number;

    const gameLoop = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 100); // Cap delta time
      lastTimeRef.current = currentTime;

      if (gameStateRef.current && rendererRef.current) {
        // Update game state
        gameStateRef.current = updateGame(gameStateRef.current, inputRef.current, deltaTime);

        // Render
        rendererRef.current.render(gameStateRef.current);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isLoaded]);

  const exportSave = () => {
    const saveData = localStorage.getItem(SAVE_KEY);
    if (!saveData) {
      alert('No save data found!');
      return;
    }
    const blob = new Blob([saveData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermelon-farm-save-${new Date().toISOString().split('T')[0]}.sav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const saveData = event.target?.result as string;
        // Validate it's an obfuscated save
        if (!saveData.startsWith('WF1:')) {
          alert('Invalid save file format!');
          return;
        }

        // Prevent save on unmount
        skipSaveRef.current = true;
        gameStateRef.current = null;

        localStorage.setItem(SAVE_KEY, saveData);
        alert('Save imported successfully! Refreshing...');
        window.location.reload();
      } catch {
        alert('Invalid save file!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="game-canvas"
        tabIndex={0}
      />
      {showSaveModal && (
        <div className="save-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={(e) => e.stopPropagation()}>
            <h2>💾 Save Management</h2>
            <p>Export your save to back it up, or import a previous save.</p>
            <div className="save-buttons">
              <button onClick={exportSave} className="export-btn">📥 Export Save</button>
              <label className="import-btn">
                📤 Import Save
                <input type="file" accept=".sav" onChange={importSave} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setShowSaveModal(false)} className="close-btn">Close</button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .game-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100vh;
          background: #1a1a2e;
        }
        .game-canvas {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          max-width: 100%;
          max-height: 100vh;
          border: 4px solid #4a3520;
          border-radius: 4px;
        }
        .save-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .save-modal {
          background: #1a1a2e;
          padding: 30px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          color: white;
        }
        .save-modal h2 {
          margin-bottom: 10px;
        }
        .save-modal p {
          color: #aaa;
          margin-bottom: 20px;
        }
        .save-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .export-btn, .import-btn, .close-btn {
          padding: 12px;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          text-align: center;
        }
        .export-btn {
          background: #4a9;
        }
        .import-btn {
          background: #49a;
        }
        .close-btn {
          background: #666;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
