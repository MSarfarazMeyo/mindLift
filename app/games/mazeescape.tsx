import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  PanResponder,
  Platform,
  Switch,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  RotateCcw,
  Timer,
  ChevronUp,
  Zap,
  Coins,
  Star,
  Shield,
  Lightbulb,
  Target,
  Sparkles,
  Award,
  Smartphone,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MazeCell = 0 | 1;

type PowerUp = {
  x: number;
  y: number;
  type: 'speed' | 'wallBreaker' | 'timeFreeze';
  collected: boolean;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
  value: number;
};

function generateMaze(level: number): {
  maze: MazeCell[][];
  start: { x: number; y: number };
  end: { x: number; y: number };
  powerUps: PowerUp[];
  coins: Coin[];
} {
  const baseSize = 10;
  const size = Math.min(baseSize + Math.floor(level / 3) * 2, 20);

  const maze: MazeCell[][] = Array(size)
    .fill(0)
    .map(() => Array(size).fill(1));

  const stack: { x: number; y: number }[] = [];
  const start = { x: 1, y: 1 };

  maze[start.y][start.x] = 0;
  stack.push(start);

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    const shuffled = [...directions].sort(() => Math.random() - 0.5);
    let found = false;

    for (const dir of shuffled) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (
        nx > 0 &&
        nx < size - 1 &&
        ny > 0 &&
        ny < size - 1 &&
        maze[ny][nx] === 1
      ) {
        maze[ny][nx] = 0;
        maze[current.y + dir.dy / 2][current.x + dir.dx / 2] = 0;
        stack.push({ x: nx, y: ny });
        found = true;
        break;
      }
    }

    if (!found) {
      stack.pop();
    }
  }

  const end = { x: size - 2, y: size - 2 };
  maze[end.y][end.x] = 0;

  function hasPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): boolean {
    const visited = Array(size)
      .fill(0)
      .map(() => Array(size).fill(false));
    const queue: { x: number; y: number }[] = [from];
    visited[from.y][from.x] = true;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === to.x && current.y === to.y) {
        return true;
      }

      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < size &&
          neighbor.y >= 0 &&
          neighbor.y < size &&
          !visited[neighbor.y][neighbor.x] &&
          maze[neighbor.y][neighbor.x] === 0
        ) {
          visited[neighbor.y][neighbor.x] = true;
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  let pathAttempts = 0;
  while (!hasPath(start, end) && pathAttempts < 10) {
    console.log(
      `No path found on attempt ${pathAttempts + 1}, creating guaranteed path`,
    );
    let current = { x: start.x, y: start.y };

    while (current.x !== end.x || current.y !== end.y) {
      maze[current.y][current.x] = 0;

      if (current.x < end.x) {
        current.x++;
        maze[current.y][current.x] = 0;
      } else if (current.x > end.x) {
        current.x--;
        maze[current.y][current.x] = 0;
      } else if (current.y < end.y) {
        current.y++;
        maze[current.y][current.x] = 0;
      } else if (current.y > end.y) {
        current.y--;
        maze[current.y][current.x] = 0;
      }
    }
    maze[end.y][end.x] = 0;
    pathAttempts++;
  }

  if (!hasPath(start, end)) {
    console.log('Still no path, clearing more cells around path');
    for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
      for (
        let x = Math.min(start.x, end.x);
        x <= Math.max(start.x, end.x);
        x++
      ) {
        if (y >= 0 && y < size && x >= 0 && x < size) {
          maze[y][x] = 0;
        }
      }
    }
  }

  const powerUps: PowerUp[] = [];
  const coins: Coin[] = [];
  const powerUpTypes: ('speed' | 'wallBreaker' | 'timeFreeze')[] = [
    'speed',
    'wallBreaker',
    'timeFreeze',
  ];

  const numPowerUps = Math.min(1 + Math.floor(level / 2), 3);
  for (let i = 0; i < numPowerUps; i++) {
    let x: number = 0;
    let y: number = 0;
    let attempts = 0;
    do {
      x = 1 + Math.floor(Math.random() * (size - 2));
      y = 1 + Math.floor(Math.random() * (size - 2));
      attempts++;
    } while (
      attempts < 50 &&
      (maze[y][x] === 1 ||
        (x === start.x && y === start.y) ||
        (x === end.x && y === end.y))
    );

    if (maze[y][x] === 0) {
      powerUps.push({
        x,
        y,
        type: powerUpTypes[i % powerUpTypes.length],
        collected: false,
      });
    }
  }

  const numCoins = Math.min(5 + level * 2, 20);
  for (let i = 0; i < numCoins; i++) {
    let x: number = 0;
    let y: number = 0;
    let attempts = 0;
    do {
      x = 1 + Math.floor(Math.random() * (size - 2));
      y = 1 + Math.floor(Math.random() * (size - 2));
      attempts++;
    } while (
      attempts < 50 &&
      (maze[y][x] === 1 ||
        (x === start.x && y === start.y) ||
        (x === end.x && y === end.y) ||
        powerUps.some((p) => p.x === x && p.y === y))
    );

    if (maze[y][x] === 0) {
      coins.push({
        x,
        y,
        collected: false,
        value: 10,
      });
    }
  }

  return { maze, start, end, powerUps, coins };
}

export default function MazeGame() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addEntry } = useLeaderboard();
  const [level, setLevel] = useState(1);
  const [mazeData, setMazeData] = useState(() => generateMaze(1));

  const mazeSize = mazeData.maze.length;
  const headerHeight = 140;
  const footerHeight = 140;
  const availableHeight =
    SCREEN_HEIGHT - insets.top - insets.bottom - headerHeight - footerHeight;
  const availableWidth = SCREEN_WIDTH - 40;
  const CELL_SIZE = Math.min(
    availableWidth / mazeSize,
    availableHeight / mazeSize,
  );
  const [playerPosition, setPlayerPosition] = useState(mazeData.start);
  const [isWinner, setIsWinner] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(mazeData.powerUps);
  const [coins, setCoins] = useState<Coin[]>(mazeData.coins);
  const [activePowerUp, setActivePowerUp] = useState<
    'speed' | 'wallBreaker' | 'timeFreeze' | null
  >(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);
  const [moveStreak, setMoveStreak] = useState(0);
  const [particles, setParticles] = useState<
    { id: string; x: number; y: number; color: string }[]
  >([]);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [perfectMoves, setPerfectMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [tiltControlEnabled, setTiltControlEnabled] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const lastMoveTime = useRef(0);
  const accelerometerSubscription = useRef<any>(null);

  const playerAnim = useRef(
    new Animated.ValueXY({ x: mazeData.start.x, y: mazeData.start.y }),
  ).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const powerUpAnimations = useRef<{ [key: string]: Animated.Value }>(
    {},
  ).current;
  const coinAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tiltControlEnabled && Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(50);
      accelerometerSubscription.current = Accelerometer.addListener(
        (accelerometerData) => {
          setAccelerometerData(accelerometerData);
        },
      );
    } else {
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
        accelerometerSubscription.current = null;
      }
    }

    return () => {
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, [tiltControlEnabled]);

  useEffect(() => {
    if (!tiltControlEnabled || isWinner || Platform.OS === 'web') return;

    const now = Date.now();
    if (now - lastMoveTime.current < 250) return;

    const threshold = 0.35;
    const { x, y } = accelerometerData;

    if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
      lastMoveTime.current = now;

      if (Math.abs(y) > Math.abs(x)) {
        if (y > threshold) {
          movePlayer(0, -1);
        } else if (y < -threshold) {
          movePlayer(0, 1);
        }
      } else {
        if (x > threshold) {
          movePlayer(1, 0);
        } else if (x < -threshold) {
          movePlayer(-1, 0);
        }
      }
    }
  }, [accelerometerData, tiltControlEnabled, isWinner]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && !isWinner) {
      const tickSpeed = activePowerUp === 'timeFreeze' ? 2000 : 1000;
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, tickSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isWinner, activePowerUp]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (powerUpTimeLeft > 0) {
      interval = setInterval(() => {
        setPowerUpTimeLeft((prev) => {
          if (prev <= 1) {
            setActivePowerUp(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [powerUpTimeLeft]);

  useEffect(() => {
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - mazeData.end.x, 2) +
        Math.pow(playerPosition.y - mazeData.end.y, 2),
    );

    if (distance < 0.8 && !isWinner) {
      setIsWinner(true);
      setIsRunning(false);

      if (bestTime === null || timer < bestTime) {
        setBestTime(timer);
      }

      const efficiency = totalMoves > 0 ? (perfectMoves / totalMoves) * 100 : 0;

      // Add score as MindLift points
      const { addPoints } = useStore.getState();
      addPoints(score);

      addEntry({
        level,
        score,
        time: timer,
        efficiency,
        hintsUsed,
        comboMultiplier,
      });

      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    }
  }, [
    playerPosition,
    isWinner,
    timer,
    bestTime,
    celebrationAnim,
    mazeData.end,
    level,
    score,
    hintsUsed,
    comboMultiplier,
    addEntry,
    perfectMoves,
    totalMoves,
  ]);

  const createParticle = (x: number, y: number, color: string) => {
    const id = Math.random().toString();
    setParticles((prev) => [...prev, { id, x, y, color }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 500);
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'success' | 'error') => {
    if (Platform.OS !== 'web') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    }
  };

  const showHintPath = () => {
    if (hintsUsed >= 3) return;

    setShowHint(true);
    setHintsUsed((prev) => prev + 1);

    Animated.sequence([
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(hintAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHint(false);
    });
  };

  const movePlayer = (dx: number, dy: number) => {
    if (isWinner) return;

    if (!isRunning) {
      setIsRunning(true);
    }

    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;

    if (
      newX < 0 ||
      newX >= mazeData.maze[0].length ||
      newY < 0 ||
      newY >= mazeData.maze.length
    ) {
      return;
    }

    const canMove =
      mazeData.maze[newY][newX] === 0 || activePowerUp === 'wallBreaker';

    if (canMove) {
      setPlayerPosition({ x: newX, y: newY });

      console.log('Moving to:', { x: newX, y: newY });
      setMoveStreak((prev) => prev + 1);
      setTotalMoves((prev) => prev + 1);
      setPerfectMoves((prev) => prev + 1);

      if (moveStreak > 0 && moveStreak % 10 === 0) {
        setComboMultiplier((prev) => Math.min(prev + 0.5, 3));
      }

      const coin = coins.find(
        (c) => c.x === newX && c.y === newY && !c.collected,
      );
      if (coin) {
        const coinKey = `${coin.x}-${coin.y}`;
        const anim = coinAnimations[coinKey] || new Animated.Value(1);
        coinAnimations[coinKey] = anim;

        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1.5,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setCoins((prev) =>
          prev.map((c) =>
            c.x === newX && c.y === newY ? { ...c, collected: true } : c,
          ),
        );
        const bonus = Math.floor(moveStreak / 5 + 1) * comboMultiplier;
        setScore((prev) => prev + Math.floor(coin.value * bonus));
        setTotalScore((prev) => prev + Math.floor(coin.value * bonus));
        createParticle(newX, newY, '#FFD700');
      }

      const powerUp = powerUps.find(
        (p) => p.x === newX && p.y === newY && !p.collected,
      );
      if (powerUp) {
        const powerUpKey = `${powerUp.x}-${powerUp.y}`;
        const anim = powerUpAnimations[powerUpKey] || new Animated.Value(1);
        powerUpAnimations[powerUpKey] = anim;

        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1.5,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setPowerUps((prev) =>
          prev.map((p) =>
            p.x === newX && p.y === newY ? { ...p, collected: true } : p,
          ),
        );
        setActivePowerUp(powerUp.type);
        setPowerUpTimeLeft(8);
        const powerUpBonus = Math.floor(50 * comboMultiplier);
        setScore((prev) => prev + powerUpBonus);
        setTotalScore((prev) => prev + powerUpBonus);
        createParticle(newX, newY, '#FF00FF');
      }

      const speed = activePowerUp === 'speed' ? 150 : 200;

      Animated.timing(playerAnim, {
        toValue: { x: newX, y: newY },
        duration: speed,
        useNativeDriver: true,
      }).start();
    } else {
      setMoveStreak(0);
      setComboMultiplier(1);
      setTotalMoves((prev) => prev + 1);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !tiltControlEnabled,
    onMoveShouldSetPanResponder: () => !tiltControlEnabled,
    onPanResponderGrant: () => {
      console.log('Pan responder granted');
    },
    onPanResponderMove: (_, gestureState) => {
      if (tiltControlEnabled) return;

      const { dx, dy } = gestureState;
      const threshold = 30;
      const now = Date.now();

      if (now - lastMoveTime.current < 150) return;

      console.log('Swipe movement:', { dx, dy });

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) {
          console.log('Moving right');
          lastMoveTime.current = now;
          movePlayer(1, 0);
        } else if (dx < -threshold) {
          console.log('Moving left');
          lastMoveTime.current = now;
          movePlayer(-1, 0);
        }
      } else {
        if (dy > threshold) {
          console.log('Moving down');
          lastMoveTime.current = now;
          movePlayer(0, 1);
        } else if (dy < -threshold) {
          console.log('Moving up');
          lastMoveTime.current = now;
          movePlayer(0, -1);
        }
      }
    },
    onPanResponderRelease: () => {
      console.log('Pan responder released');
    },
  });

  const resetGame = () => {
    setPlayerPosition(mazeData.start);
    setIsWinner(false);
    setTimer(0);
    setIsRunning(false);
    setScore(0);
    setPowerUps(mazeData.powerUps.map((p) => ({ ...p, collected: false })));
    setCoins(mazeData.coins.map((c) => ({ ...c, collected: false })));
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setMoveStreak(0);
    setShowHint(false);
    setHintsUsed(0);
    setPerfectMoves(0);
    setTotalMoves(0);
    setComboMultiplier(1);
    playerAnim.setValue({ x: mazeData.start.x, y: mazeData.start.y });
    celebrationAnim.setValue(0);
    scaleAnim.setValue(1);
    shakeAnim.setValue(0);
    hintAnim.setValue(0);
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    const newMaze = generateMaze(newLevel);
    setMazeData(newMaze);
    setPlayerPosition(newMaze.start);
    setIsWinner(false);
    setTimer(0);
    setIsRunning(false);
    setBestTime(null);
    setScore(0);
    setPowerUps(newMaze.powerUps);
    setCoins(newMaze.coins);
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setMoveStreak(0);
    setShowHint(false);
    setHintsUsed(0);
    setPerfectMoves(0);
    setTotalMoves(0);
    setComboMultiplier(1);
    playerAnim.setValue({ x: newMaze.start.x, y: newMaze.start.y });
    celebrationAnim.setValue(0);
    scaleAnim.setValue(1);
    shakeAnim.setValue(0);
    hintAnim.setValue(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton2}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.timerContainer}>
            <Timer size={18} color="#fff" />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
          <TouchableOpacity
            style={styles.leaderboardButton}
            onPress={() => router.push('/leaderboard')}
          >
            <Award size={20} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.levelContainer}>
            <ChevronUp size={14} color="#00F5FF" />
            <Text style={styles.levelText}>Lvl {level}</Text>
          </View>
        </View>
        {Platform.OS !== 'web' && (
          <View style={styles.controlToggle}>
            <Smartphone
              size={16}
              color={
                tiltControlEnabled ? '#00F5FF' : 'rgba(255, 255, 255, 0.5)'
              }
            />
            <Text style={styles.controlToggleText}>Tilt Control</Text>
            <Switch
              value={tiltControlEnabled}
              onValueChange={setTiltControlEnabled}
              trackColor={{
                false: 'rgba(255, 255, 255, 0.2)',
                true: 'rgba(0, 245, 255, 0.5)',
              }}
              thumbColor={tiltControlEnabled ? '#00F5FF' : '#f4f3f4'}
            />
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.scoreContainer}>
            <Star size={18} color="#FFD700" />
            <Text style={styles.scoreText}>{totalScore}</Text>
          </View>
          {comboMultiplier > 1 && (
            <View style={styles.comboContainer}>
              <Sparkles size={16} color="#FF6B6B" />
              <Text style={styles.comboText}>
                x{comboMultiplier.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {activePowerUp && (
        <View style={styles.powerUpIndicator}>
          <View style={styles.powerUpContent}>
            {activePowerUp === 'speed' && <Zap size={20} color="#FFD700" />}
            {activePowerUp === 'wallBreaker' && (
              <Shield size={20} color="#FF6B6B" />
            )}
            {activePowerUp === 'timeFreeze' && (
              <Timer size={20} color="#4ECDC4" />
            )}
            <Text style={styles.powerUpText}>
              {activePowerUp === 'speed' && 'Speed Boost'}
              {activePowerUp === 'wallBreaker' && 'Wall Breaker'}
              {activePowerUp === 'timeFreeze' && 'Time Freeze'}
            </Text>
            <Text style={styles.powerUpTimer}>{powerUpTimeLeft}s</Text>
          </View>
        </View>
      )}

      <View style={styles.statusBar}>
        {moveStreak >= 5 && (
          <View style={styles.streakIndicator}>
            <Text style={styles.streakText}>🔥 {moveStreak} moves</Text>
          </View>
        )}
        {!isWinner && isRunning && hintsUsed < 3 && (
          <TouchableOpacity style={styles.hintButton} onPress={showHintPath}>
            <Lightbulb size={18} color="#FFD700" />
            <Text style={styles.hintButtonText}>{3 - hintsUsed}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={styles.gameContainer}
        {...panResponder.panHandlers}
        collapsable={false}
      >
        <View style={styles.maze}>
          {mazeData.maze.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const isStart =
                  colIndex === mazeData.start.x &&
                  rowIndex === mazeData.start.y;
                const isEnd =
                  colIndex === mazeData.end.x && rowIndex === mazeData.end.y;

                const coin = coins.find(
                  (c) => c.x === colIndex && c.y === rowIndex,
                );
                const powerUp = powerUps.find(
                  (p) => p.x === colIndex && p.y === rowIndex,
                );
                const coinKey = `${colIndex}-${rowIndex}`;
                const coinAnim =
                  coinAnimations[coinKey] || new Animated.Value(1);
                if (!coinAnimations[coinKey])
                  coinAnimations[coinKey] = coinAnim;
                const powerUpAnim =
                  powerUpAnimations[coinKey] || new Animated.Value(1);
                if (!powerUpAnimations[coinKey])
                  powerUpAnimations[coinKey] = powerUpAnim;

                return (
                  <View
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        justifyContent: 'center' as const,
                        alignItems: 'center' as const,
                      },
                      cell === 1 ? styles.wall : styles.path,
                    ]}
                  >
                    {isStart && !isRunning && (
                      <View
                        style={[
                          styles.startIndicator,
                          {
                            width: CELL_SIZE * 0.8,
                            height: CELL_SIZE * 0.8,
                            borderRadius: CELL_SIZE * 0.4,
                          },
                        ]}
                      >
                        <Text style={styles.startText}>START</Text>
                      </View>
                    )}
                    {isEnd && (
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={[
                          styles.endIndicator,
                          {
                            width: CELL_SIZE * 0.8,
                            height: CELL_SIZE * 0.8,
                            borderRadius: CELL_SIZE * 0.4,
                          },
                        ]}
                      >
                        <Trophy size={CELL_SIZE * 0.5} color="#fff" />
                      </LinearGradient>
                    )}
                    {coin && !coin.collected && (
                      <Animated.View
                        style={[
                          styles.coinIndicator,
                          {
                            width: CELL_SIZE * 0.6,
                            height: CELL_SIZE * 0.6,
                            transform: [{ scale: coinAnim }],
                            opacity: coinAnim,
                          },
                        ]}
                      >
                        <Coins size={CELL_SIZE * 0.4} color="#FFD700" />
                      </Animated.View>
                    )}
                    {powerUp && !powerUp.collected && (
                      <Animated.View
                        style={[
                          styles.powerUpItem,
                          {
                            width: CELL_SIZE * 0.7,
                            height: CELL_SIZE * 0.7,
                            transform: [{ scale: powerUpAnim }],
                            opacity: powerUpAnim,
                          },
                        ]}
                      >
                        {powerUp.type === 'speed' && (
                          <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={[
                              styles.powerUpGradient,
                              { borderRadius: CELL_SIZE * 0.35 },
                            ]}
                          >
                            <Zap size={CELL_SIZE * 0.4} color="#fff" />
                          </LinearGradient>
                        )}
                        {powerUp.type === 'wallBreaker' && (
                          <LinearGradient
                            colors={['#FF6B6B', '#FF4757']}
                            style={[
                              styles.powerUpGradient,
                              { borderRadius: CELL_SIZE * 0.35 },
                            ]}
                          >
                            <Shield size={CELL_SIZE * 0.4} color="#fff" />
                          </LinearGradient>
                        )}
                        {powerUp.type === 'timeFreeze' && (
                          <LinearGradient
                            colors={['#4ECDC4', '#44A08D']}
                            style={[
                              styles.powerUpGradient,
                              { borderRadius: CELL_SIZE * 0.35 },
                            ]}
                          >
                            <Timer size={CELL_SIZE * 0.4} color="#fff" />
                          </LinearGradient>
                        )}
                      </Animated.View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <Animated.View
            style={[
              styles.player,
              {
                width: CELL_SIZE,
                height: CELL_SIZE,
                transform: [
                  {
                    translateX: Animated.multiply(playerAnim.x, CELL_SIZE),
                  },
                  {
                    translateY: Animated.multiply(playerAnim.y, CELL_SIZE),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={
                activePowerUp === 'speed'
                  ? ['#FFD700', '#FFA500']
                  : activePowerUp === 'wallBreaker'
                    ? ['#FF6B6B', '#FF4757']
                    : activePowerUp === 'timeFreeze'
                      ? ['#4ECDC4', '#44A08D']
                      : ['#00F5FF', '#0080FF']
              }
              style={[
                styles.playerInner,
                {
                  width: CELL_SIZE * 0.7,
                  height: CELL_SIZE * 0.7,
                  borderRadius: CELL_SIZE * 0.35,
                },
              ]}
            />
            {comboMultiplier > 1 && (
              <View style={styles.playerComboIndicator}>
                <Sparkles size={12} color="#FFD700" />
              </View>
            )}
          </Animated.View>

          {showHint && (
            <Animated.View
              style={[
                styles.hintPath,
                {
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: mazeData.end.x * CELL_SIZE,
                  top: mazeData.end.y * CELL_SIZE,
                  opacity: hintAnim,
                },
              ]}
            >
              <Target size={CELL_SIZE * 0.8} color="#FFD700" />
            </Animated.View>
          )}

          {particles.map((particle) => (
            <View
              key={particle.id}
              style={[
                styles.particle,
                {
                  left: particle.x * CELL_SIZE + CELL_SIZE / 2,
                  top: particle.y * CELL_SIZE + CELL_SIZE / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.particleInner,
                  { backgroundColor: particle.color },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {tiltControlEnabled ? 'Tilt your phone to move' : 'Swipe to move'} •
          Reach the trophy!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, { marginBottom: insets.bottom + 20 }]}
        onPress={resetGame}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.resetButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <RotateCcw size={24} color="#fff" />
          <Text style={styles.resetButtonText}>Restart</Text>
        </LinearGradient>
      </TouchableOpacity>

      {isWinner && (
        <View style={styles.winnerModalContainer}>
          <Animated.View
            style={[
              styles.winnerModal,
              {
                opacity: celebrationAnim,
                transform: [
                  {
                    scale: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#6B3FA0', '#9B4DCA', '#5B2C6F']}
              style={styles.winnerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Trophy size={64} color="#fff" />
              <Text style={styles.winnerTitle}>Victory!</Text>
              <Text style={styles.winnerTime}>Time: {formatTime(timer)}</Text>
              <Text style={styles.winnerScore}>Score: {score}</Text>
              {totalMoves > 0 && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statText}>Moves: {totalMoves}</Text>
                  <Text style={styles.statText}>
                    Efficiency: {Math.round((perfectMoves / totalMoves) * 100)}%
                  </Text>
                  {hintsUsed > 0 && (
                    <Text style={styles.statText}>Hints used: {hintsUsed}</Text>
                  )}
                </View>
              )}
              {bestTime === timer && (
                <Text style={styles.newRecord}>🏆 New Best Time!</Text>
              )}
              {hintsUsed === 0 && (
                <Text style={styles.achievement}>⭐ No Hints Used!</Text>
              )}
              {comboMultiplier >= 2 && (
                <Text style={styles.achievement}>🔥 Combo Master!</Text>
              )}
              <TouchableOpacity
                style={styles.nextLevelButton}
                onPress={nextLevel}
              >
                <Text style={styles.nextLevelText}>Next Level →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
    position: 'relative',
  },

  backButton2: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#764ba2',
    borderRadius: 20,
    position: 'absolute',
    left: 12,
    top: 60,
    zIndex: 10,
  },
  header: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  controlToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  controlToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 36,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00F5FF',
  },
  levelText: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  leaderboardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900' as const,
  },
  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  comboText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '900' as const,
  },
  powerUpIndicator: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  powerUpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  powerUpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
    flex: 1,
    marginLeft: 8,
  },
  powerUpTimer: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  streakIndicator: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  hintButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  bestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bestTimeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maze: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },

  wall: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  path: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  startIndicator: {
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#00F5FF',
  },
  startText: {
    color: '#00F5FF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  endIndicator: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  coinIndicator: {
    position: 'absolute' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  powerUpItem: {
    position: 'absolute' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  powerUpGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  player: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playerInner: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  playerComboIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  hintPath: {
    position: 'absolute' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  instructions: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  resetButton: {
    marginHorizontal: 20,
    overflow: 'hidden',
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  winnerModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  winnerModal: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  winnerGradient: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  winnerTitle: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winnerTime: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winnerScore: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '900' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  newRecord: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsContainer: {
    marginTop: 12,
    gap: 6,
    alignItems: 'center',
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  achievement: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700' as const,
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nextLevelButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextLevelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
