import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { addGamePoints } from '@/lib/gamePoints';

const CELL_SIZE = 24;
const COLS = 15;
const ROWS = 20;
const PACMAN_SPEED = 3;
const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

type Position = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export default function PacManGame() {
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);
  const [dots, setDots] = useState<boolean[][]>(() =>
    MAZE.map((row) => row.map((cell) => cell === 0)),
  );
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 1, y: 1 });
  const pacmanDir = useRef<Direction>('right');
  const nextDir = useRef<Direction>('right');
  const mouthAnim = useRef(new Animated.Value(0)).current;

  const [ghosts, setGhosts] = useState<
    { pos: Position; color: string; dir: Direction }[]
  >([
    { pos: { x: 7, y: 8 }, color: GHOST_COLORS[0], dir: 'left' },
    { pos: { x: 6, y: 8 }, color: GHOST_COLORS[1], dir: 'right' },
    { pos: { x: 8, y: 8 }, color: GHOST_COLORS[2], dir: 'up' },
    { pos: { x: 7, y: 9 }, color: GHOST_COLORS[3], dir: 'down' },
  ]);
  const animationFrameId = useRef<number | undefined>(undefined);
  const lastUpdateTime = useRef<number>(Date.now());
  const lastGhostUpdate = useRef<number>(Date.now());

  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    return MAZE[y][x] === 0;
  }, []);

  const getRandomDirection = useCallback(
    (currentPos: Position, currentDir: Direction): Direction => {
      const directions: Direction[] = ['up', 'down', 'left', 'right'];
      const validDirs = directions.filter((dir) => {
        let newX = currentPos.x;
        let newY = currentPos.y;
        if (dir === 'up') newY--;
        if (dir === 'down') newY++;
        if (dir === 'left') newX--;
        if (dir === 'right') newX++;
        return isValidMove(newX, newY);
      });

      if (validDirs.length === 0) return currentDir;

      const filteredDirs = validDirs.filter((dir) => {
        if (currentDir === 'up' && dir === 'down') return false;
        if (currentDir === 'down' && dir === 'up') return false;
        if (currentDir === 'left' && dir === 'right') return false;
        if (currentDir === 'right' && dir === 'left') return false;
        return true;
      });

      const chooseFrom = filteredDirs.length > 0 ? filteredDirs : validDirs;
      return chooseFrom[Math.floor(Math.random() * chooseFrom.length)];
    },
    [isValidMove],
  );

  const checkCollision = useCallback(
    (pacman: Position, ghostList: typeof ghosts) => {
      for (const ghost of ghostList) {
        if (
          Math.abs(ghost.pos.x - pacman.x) < 0.7 &&
          Math.abs(ghost.pos.y - pacman.y) < 0.7
        ) {
          return true;
        }
      }
      return false;
    },
    [],
  );

  const gameLoop = useCallback(() => {
    if (gameOver || isRespawning) return;

    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = now;

    setPacmanPos((prevPos) => {
      let newX = prevPos.x;
      let newY = prevPos.y;
      const dir = nextDir.current;

      if (dir === 'up') newY -= PACMAN_SPEED * deltaTime;
      if (dir === 'down') newY += PACMAN_SPEED * deltaTime;
      if (dir === 'left') newX -= PACMAN_SPEED * deltaTime;
      if (dir === 'right') newX += PACMAN_SPEED * deltaTime;

      const cellX = Math.round(newX);
      const cellY = Math.round(newY);

      if (!isValidMove(cellX, cellY)) {
        const currentCellX = Math.round(prevPos.x);
        const currentCellY = Math.round(prevPos.y);

        if (dir === 'left' || dir === 'right') {
          newX = currentCellX;
        }
        if (dir === 'up' || dir === 'down') {
          newY = currentCellY;
        }

        return { x: newX, y: newY };
      }

      pacmanDir.current = dir;

      setDots((prevDots) => {
        if (prevDots[cellY]?.[cellX]) {
          const newDots = prevDots.map((row) => [...row]);
          newDots[cellY][cellX] = false;
          setScore((s) => s + 10);
          return newDots;
        }
        return prevDots;
      });

      return { x: newX, y: newY };
    });

    if (now - lastGhostUpdate.current > 280) {
      lastGhostUpdate.current = now;

      setGhosts((prevGhosts) => {
        return prevGhosts.map((ghost) => {
          let newGhostX = ghost.pos.x;
          let newGhostY = ghost.pos.y;

          if (ghost.dir === 'up') newGhostY--;
          if (ghost.dir === 'down') newGhostY++;
          if (ghost.dir === 'left') newGhostX--;
          if (ghost.dir === 'right') newGhostX++;

          if (
            !isValidMove(Math.round(newGhostX), Math.round(newGhostY)) ||
            Math.random() < 0.1
          ) {
            const newDir = getRandomDirection(ghost.pos, ghost.dir);
            newGhostX = ghost.pos.x;
            newGhostY = ghost.pos.y;

            if (newDir === 'up') newGhostY--;
            if (newDir === 'down') newGhostY++;
            if (newDir === 'left') newGhostX--;
            if (newDir === 'right') newGhostX++;

            return {
              ...ghost,
              dir: newDir,
              pos: { x: newGhostX, y: newGhostY },
            };
          }

          return {
            ...ghost,
            pos: { x: newGhostX, y: newGhostY },
          };
        });
      });
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameOver, isRespawning, isValidMove, getRandomDirection]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mouthAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(mouthAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [mouthAnim]);

  useEffect(() => {
    if (isRespawning || gameOver) return;

    if (checkCollision(pacmanPos, ghosts)) {
      setIsRespawning(true);

      setLives((prevLives) => {
        const newLives = Math.max(0, prevLives - 1);

        if (newLives === 0) {
          setGameOver(true);
          setIsRespawning(false);
          addGamePoints(score);
        } else {
          setTimeout(() => {
            setPacmanPos({ x: 1, y: 1 });
            setGhosts([
              { pos: { x: 7, y: 8 }, color: GHOST_COLORS[0], dir: 'left' },
              { pos: { x: 6, y: 8 }, color: GHOST_COLORS[1], dir: 'right' },
              { pos: { x: 8, y: 8 }, color: GHOST_COLORS[2], dir: 'up' },
              { pos: { x: 7, y: 9 }, color: GHOST_COLORS[3], dir: 'down' },
            ]);
            pacmanDir.current = 'right';
            nextDir.current = 'right';

            setTimeout(() => {
              setIsRespawning(false);
            }, 500);
          }, 100);
        }

        return newLives;
      });
    }
  }, [pacmanPos, ghosts, checkCollision, isRespawning, gameOver, score]);

  useEffect(() => {
    if (!gameOver && !isRespawning) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop, gameOver, isRespawning]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const threshold = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > threshold) {
            nextDir.current = 'right';
          } else if (dx < -threshold) {
            nextDir.current = 'left';
          }
        } else {
          if (dy > threshold) {
            nextDir.current = 'down';
          } else if (dy < -threshold) {
            nextDir.current = 'up';
          }
        }
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  const restartGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsRespawning(false);
    setDots(MAZE.map((row) => row.map((cell) => cell === 0)));
    setPacmanPos({ x: 1, y: 1 });
    pacmanDir.current = 'right';
    nextDir.current = 'right';
    setGhosts([
      { pos: { x: 7, y: 8 }, color: GHOST_COLORS[0], dir: 'left' },
      { pos: { x: 6, y: 8 }, color: GHOST_COLORS[1], dir: 'right' },
      { pos: { x: 8, y: 8 }, color: GHOST_COLORS[2], dir: 'up' },
      { pos: { x: 7, y: 9 }, color: GHOST_COLORS[3], dir: 'down' },
    ]);
    lastUpdateTime.current = Date.now();
    lastGhostUpdate.current = Date.now();
  };

  const mouthRotation = mouthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  let pacmanRotation = '0deg';
  if (pacmanDir.current === 'up') pacmanRotation = '-90deg';
  if (pacmanDir.current === 'down') pacmanRotation = '90deg';
  if (pacmanDir.current === 'left') pacmanRotation = '180deg';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color="#FFD700" size={24} />
        </TouchableOpacity>
        <Text style={styles.score}>SCORE: {score}</Text>
        <Text style={styles.lives}>{'❤️'.repeat(Math.max(0, lives))}</Text>
      </View>

      <View style={styles.gameContainer} {...panResponder.panHandlers}>
        <View style={styles.maze}>
          {MAZE.map((row, y) =>
            row.map((cell, x) => (
              <View
                key={`${x}-${y}`}
                style={[
                  styles.cell,
                  {
                    top: y * CELL_SIZE,
                    left: x * CELL_SIZE,
                    backgroundColor: cell === 1 ? '#1e3a8a' : 'transparent',
                  },
                ]}
              >
                {cell === 0 && dots[y][x] && <View style={styles.dot} />}
              </View>
            )),
          )}

          <Animated.View
            style={[
              styles.pacman,
              {
                left: pacmanPos.x * CELL_SIZE,
                top: pacmanPos.y * CELL_SIZE,
                transform: [{ rotate: pacmanRotation }],
              },
            ]}
          >
            <View style={styles.pacmanBody}>
              <Animated.View
                style={[
                  styles.pacmanMouth,
                  {
                    transform: [{ rotate: mouthRotation }],
                  },
                ]}
              />
            </View>
          </Animated.View>

          {ghosts.map((ghost, i) => (
            <View
              key={i}
              style={[
                styles.ghost,
                {
                  left: ghost.pos.x * CELL_SIZE,
                  top: ghost.pos.y * CELL_SIZE,
                  backgroundColor: ghost.color,
                },
              ]}
            >
              <View style={styles.ghostEyes}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.gameOverText}>👻 GAME OVER</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            <TouchableOpacity style={styles.button} onPress={restartGame}>
              <Text style={styles.buttonText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.hint}>Swipe to move Pac-Man</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  lives: {
    fontSize: 16,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maze: {
    position: 'relative',
    width: COLS * CELL_SIZE,
    height: ROWS * CELL_SIZE,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  pacman: {
    position: 'absolute',
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
  },
  pacmanBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFF00',
    borderRadius: CELL_SIZE / 2,
    overflow: 'hidden',
  },
  pacmanMouth: {
    position: 'absolute',
    right: -CELL_SIZE / 4,
    top: CELL_SIZE / 4,
    width: CELL_SIZE,
    height: CELL_SIZE / 2,
    backgroundColor: '#000',
    transformOrigin: 'left center',
  },
  ghost: {
    position: 'absolute',
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderTopLeftRadius: CELL_SIZE / 2,
    borderTopRightRadius: CELL_SIZE / 2,
    overflow: 'visible',
  },
  ghostEyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  hint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e3a8a',
    letterSpacing: 1,
  },
});
