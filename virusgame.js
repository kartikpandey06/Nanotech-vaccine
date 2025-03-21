import React, { useState, useEffect, useRef } from 'react';

// Add viewport meta tag for proper mobile scaling
const addViewportMeta = () => {
  if (typeof document !== 'undefined') {
    // Check if viewport meta tag already exists
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    } else {
      // Update existing viewport meta
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
  }
};

const CatchTheVirusGame = () => {
  const gameAreaRef = useRef(null);
  const requestRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [score, setScore] = useState(0);
  const [virusesKilled, setVirusesKilled] = useState(0);
  const [baseSpeed, setBaseSpeed] = useState(0.5);

  // Use refs for positions to avoid state batching issues
  const spermPosRef = useRef({ x: 100, y: 100 });
  const virusesRef = useRef([{ 
    id: 0,
    pos: { x: 300, y: 300 },
    direction: { dx: 1, dy: 1 } 
  }]);

  // For rendering UI (not used for game logic)
  const [spermPos, setSpermPos] = useState({ x: 100, y: 100 });
  const [viruses, setViruses] = useState([{
    id: 0,
    pos: { x: 300, y: 300 }
  }]);

  // Set up game and detect device type
  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    addViewportMeta();

    // Initialize with random virus position
    if (gameAreaRef.current) {
      const width = gameAreaRef.current.clientWidth;
      const height = gameAreaRef.current.clientHeight;

      const initialVirus = {
        id: 0,
        pos: {
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 40) + 20
        },
        direction: { dx: 1, dy: 1 }
      };

      virusesRef.current = [initialVirus];
      setViruses([{
        id: initialVirus.id,
        pos: initialVirus.pos
      }]);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Set up input handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameAreaRef.current && gameActive) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        spermPosRef.current = newPos;
        setSpermPos(newPos);
      }
    };

    const handleTouchMove = (e) => {
      if (gameAreaRef.current && gameActive && e.touches && e.touches[0]) {
        e.preventDefault(); // Prevent scrolling while playing
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newPos = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
        spermPosRef.current = newPos;
        setSpermPos(newPos);
      }
    };

    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('mousemove', handleMouseMove);
      gameAreaRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameAreaRef.current.addEventListener('touchstart', handleTouchMove, { passive: false });
    }

    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('mousemove', handleMouseMove);
        gameAreaRef.current.removeEventListener('touchmove', handleTouchMove);
        gameAreaRef.current.removeEventListener('touchstart', handleTouchMove);
      }
    };
  }, [gameActive]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    let lastTime = 0;
    let lastVirusAdded = 0;

    const gameLoop = (timestamp) => {
      // Calculate time delta
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if (!gameActive) {
        return;
      }

      // Move viruses
      moveViruses(deltaTime);

      // Check collision
      checkCollision();

      // Update score
      setScore(prev => {
        const newScore = prev + 1;

        // Add new virus every 200 points
        if (Math.floor(newScore / 200) > Math.floor(prev / 200)) {
          addNewVirus();

          // Increase speed every 200 points (up to a limit)
          if (baseSpeed < 1.5) {
            setBaseSpeed(prevSpeed => prevSpeed + 0.1);
          }
        }

        return newScore;
      });

      // Continue game loop
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    if (gameActive) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameActive]);

  // Add a new virus
  const addNewVirus = () => {
    if (!gameAreaRef.current) return;

    const gameWidth = gameAreaRef.current.clientWidth;
    const gameHeight = gameAreaRef.current.clientHeight;

    // Create a new virus at a random position
    // Try to place it away from the current sperm position
    const spermPos = spermPosRef.current;
    let x, y;

    // Keep trying until we get a position that's not too close to the sperm
    do {
      x = Math.random() * (gameWidth - 40) + 20;
      y = Math.random() * (gameHeight - 40) + 20;
    } while (
      Math.sqrt(Math.pow(x - spermPos.x, 2) + Math.pow(y - spermPos.y, 2)) < 100
    );

    const newVirus = {
      id: Date.now(), // Unique ID
      pos: { x, y },
      direction: { 
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
      }
    };

    // Update refs and state
    virusesRef.current = [...virusesRef.current, newVirus];
    setViruses(prev => [...prev, { id: newVirus.id, pos: newVirus.pos }]);

    console.log(`Added new virus at (${x.toFixed(1)}, ${y.toFixed(1)}). Total: ${virusesRef.current.length}`);
  };

  // Move all viruses
  const moveViruses = (deltaTime) => {
    if (!gameAreaRef.current) return;

    const gameWidth = gameAreaRef.current.clientWidth;
    const gameHeight = gameAreaRef.current.clientHeight;

    // Move each virus
    const updatedViruses = virusesRef.current.map(virus => {
      const { pos, direction } = virus;
      const { dx, dy } = direction;

      // Use current direction with occasional changes
      const speed = baseSpeed * (1 + Math.random() * 0.2); // Add some variation

      // Small chance to change direction
      if (Math.random() < 0.01) {
        direction.dx = (Math.random() - 0.5) * 2;
        direction.dy = (Math.random() - 0.5) * 2;
      }

      // Calculate new position
      let newX = pos.x + dx * speed * deltaTime;
      let newY = pos.y + dy * speed * deltaTime;

      // Bounce off walls
      if (newX < 20 || newX > gameWidth - 20) {
        direction.dx = -dx;
        newX = newX < 20 ? 20 : gameWidth - 20;
      }

      if (newY < 20 || newY > gameHeight - 20) {
        direction.dy = -dy;
        newY = newY < 20 ? 20 : gameHeight - 20;
      }

      // Update position
      pos.x = newX;
      pos.y = newY;

      return { ...virus };
    });

    // Update ref and state
    virusesRef.current = updatedViruses;
    setViruses(updatedViruses.map(v => ({ id: v.id, pos: v.pos })));
  };

  // Collision detection between sperm and any virus
  const checkCollision = () => {
    const spermPos = spermPosRef.current;
    let collision = false;
    let virusIdToRemove = null;

    // Check collision with any virus
    for (const virus of virusesRef.current) {
      const virusPos = virus.pos;

      // Calculate distance between centers
      const dx = spermPos.x - virusPos.x;
      const dy = spermPos.y - virusPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Combined radius: sperm (6px) + virus (10px) = ~16px
      const collisionThreshold = 16;

      if (distance < collisionThreshold) {
        console.log(`COLLISION DETECTED with virus ${virus.id}! Distance: ${distance.toFixed(2)}`);
        collision = true;
        virusIdToRemove = virus.id;
        break;
      }
    }

    // If collision detected, remove that virus and increment kill counter
    if (collision && virusIdToRemove !== null) {
      const updatedViruses = virusesRef.current.filter(v => v.id !== virusIdToRemove);
      virusesRef.current = updatedViruses;
      setViruses(prev => prev.filter(v => v.id !== virusIdToRemove));
      setVirusesKilled(prev => prev + 1);

      // Check if all viruses are killed
      if (updatedViruses.length === 0) {
        console.log("All viruses killed! Game over!");
        setGameActive(false);
        return;
      }

      // Add a replacement virus after a short delay (optional)
      setTimeout(() => {
        if (gameActive) {
          addNewVirus();
        }
      }, 1000);
    }
  };

  // Reset the game to play again
  const resetGame = () => {
    if (!gameAreaRef.current) return;

    const gameWidth = gameAreaRef.current.clientWidth;
    const gameHeight = gameAreaRef.current.clientHeight;

    // Reset with a single virus
    const initialVirus = {
      id: Date.now(),
      pos: {
        x: Math.random() < 0.5 ? 
            Math.random() * gameWidth * 0.3 : 
            gameWidth - (Math.random() * gameWidth * 0.3),
        y: Math.random() < 0.5 ? 
            Math.random() * gameHeight * 0.3 : 
            gameHeight - (Math.random() * gameHeight * 0.3)
      },
      direction: { 
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
      }
    };

    virusesRef.current = [initialVirus];
    setViruses([{
      id: initialVirus.id,
      pos: initialVirus.pos
    }]);

    // Reset score, killed count, and speed
    setScore(0);
    setVirusesKilled(0);
    setBaseSpeed(0.5);
    setGameActive(true);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-4 text-center">
        <h1 className="text-xl md:text-2xl font-bold mb-2">Catch the Virus Game</h1>
        <div className="flex justify-center gap-4">
          <p className="text-base md:text-lg">Score: {score}</p>
          <p className="text-base md:text-lg text-red-600 font-semibold">Viruses Killed: {virusesKilled}</p>
        </div>
        <p className="text-xs mt-1">Speed Level: {Math.round((baseSpeed - 0.5) * 10) + 1}</p>

        {!gameActive && (
          <div className="mt-4">
            <p className="text-lg md:text-xl font-bold text-red-500">Game Over!</p>
            <p className="text-sm mb-2">You've killed all the viruses!</p>
            <button 
              onClick={resetGame} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div 
        ref={gameAreaRef}
        className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden touch-none"
        style={{ maxWidth: "600px", height: "min(400px, 60vh)" }}
      >
        {/* Sperm */}
        <div
          className="absolute"
          style={{
            left: `${spermPos.x}px`,
            top: `${spermPos.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <div className="relative">
            <div className="bg-blue-400 w-6 h-6 rounded-full"></div>
            <div 
              className="absolute bg-blue-400 w-2 h-8 rounded-full"
              style={{ left: '10px', top: '4px', transform: 'rotate(30deg)' }}
            ></div>
          </div>
        </div>

        {/* Viruses */}
        {viruses.map(virus => (
          <div
            key={virus.id}
            className="absolute"
            style={{
              left: `${virus.pos.x}px`,
              top: `${virus.pos.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5
            }}
          >
            <div className="relative">
              <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
                {/* Virus spikes */}
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-green-500 w-2 h-4 rounded-full"
                    style={{ 
                      transform: `rotate(${i * 45}deg) translateY(-6px)`,
                      transformOrigin: 'center center',
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Debug display (uncomment for debugging) */}
        {/* 
        <div className="absolute bottom-2 left-2 text-xs bg-white bg-opacity-70 p-1 rounded">
          Sperm: ({Math.round(spermPos.x)}, {Math.round(spermPos.y)}) | 
          Virus: ({Math.round(virusPos.x)}, {Math.round(virusPos.y)})
        </div> 
        */}

        {/* Game instructions overlay */}
        <div className="absolute top-2 left-2 text-xs md:text-sm text-gray-600 bg-white bg-opacity-70 p-1 rounded">
          {isMobile ? 
            "Touch and drag to control the blue sperm. Catch the green viruses!" :
            "Move your cursor to control the blue sperm. Try to catch all the viruses!"}
        </div>

        {/* Virus count display */}
        <div className="absolute top-2 right-2 text-xs md:text-sm font-bold text-green-700 bg-white bg-opacity-70 p-1 rounded">
          Active Viruses: {viruses.length}
        </div>
      </div>

      {/* Mobile-friendly notice */}
      <div className="mt-4 text-xs md:text-sm text-gray-600 text-center max-w-xs">
        {gameActive ? 
          "Tap and drag in the game area to catch viruses. Speed increases every 200 points!" :
          "You've won! Tap Play Again to restart the game."
        }
      </div>
    </div>
  );
};

export default CatchTheVirusGame;