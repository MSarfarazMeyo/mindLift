import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { addGamePoints } from '@/lib/gamePoints';
import { useMusic } from '@/hooks/useMusic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYER_SIZE = 50;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_GAP_MIN = 200;
const OBSTACLE_GAP_MAX = 400;
const GROUND_HEIGHT = 80;
const GRAVITY = 1.2;
const JUMP_VELOCITY = -28;
const GAME_SPEED = 5;

interface Obstacle {
  id: number;
  x: number;
  height: number;
}

export default function EndlessRunner() {
  const insets = useSafeAreaInsets();
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const { play, pause, isLoaded } = useMusic();

  const playerY = useRef<number>(
    SCREEN_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE - 100,
  );
  const playerVelocity = useRef<number>(0);
  const obstacles = useRef<Obstacle[]>([]);
  const nextObstacleId = useRef<number>(0);
  const scrollOffset = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);

  const playerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isLoaded && gameStarted && !gameOver) {
      play('endlessrunner');
    }
    return () => {
      if (isLoaded) {
        pause('endlessrunner');
      }
    };
  }, [isLoaded, gameStarted, gameOver]);

  const playableHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
  const groundY = playableHeight - GROUND_HEIGHT;

  const resetGame = useCallback(() => {
    playerY.current = SCREEN_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE - 100;
    playerVelocity.current = 0;
    obstacles.current = [];
    scrollOffset.current = 0;
    nextObstacleId.current = 0;
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  }, []);

  const jump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);

      return;
    }

    if (gameOver) {
      resetGame();
      return;
    }

    if (playerY.current >= groundY - PLAYER_SIZE - 5) {
      playerVelocity.current = JUMP_VELOCITY;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      Animated.sequence([
        Animated.timing(playerAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(playerAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameStarted, gameOver, groundY, resetGame, playerAnim]);

  const checkCollision = useCallback((): boolean => {
    const playerLeft = 100;
    const playerRight = playerLeft + PLAYER_SIZE;
    const playerTop = playerY.current;
    const playerBottom = playerY.current + PLAYER_SIZE;

    for (const obstacle of obstacles.current) {
      const obstacleLeft = obstacle.x - scrollOffset.current;
      const obstacleRight = obstacleLeft + OBSTACLE_WIDTH;
      const obstacleTop = groundY - obstacle.height;
      const obstacleBottom = groundY;

      if (
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom
      ) {
        return true;
      }
    }

    return false;
  }, [groundY]);

  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;

    playerVelocity.current += GRAVITY;
    playerY.current += playerVelocity.current;

    if (playerY.current >= groundY - PLAYER_SIZE) {
      playerY.current = groundY - PLAYER_SIZE;
      playerVelocity.current = 0;
    }

    if (playerY.current < insets.top) {
      playerY.current = insets.top;
      playerVelocity.current = 0;
    }

    scrollOffset.current += GAME_SPEED;
    const newScore = Math.floor(scrollOffset.current / 10);
    if (newScore > score && newScore % 10 === 0) {
      addGamePoints(50);
    }
    setScore(newScore);

    if (
      obstacles.current.length === 0 ||
      obstacles.current[obstacles.current.length - 1].x <
        scrollOffset.current + SCREEN_WIDTH - OBSTACLE_GAP_MIN
    ) {
      const gap =
        OBSTACLE_GAP_MIN +
        Math.random() * (OBSTACLE_GAP_MAX - OBSTACLE_GAP_MIN);
      const height = 60 + Math.random() * 120;
      obstacles.current.push({
        id: nextObstacleId.current++,
        x: scrollOffset.current + SCREEN_WIDTH + gap,
        height,
      });
    }

    obstacles.current = obstacles.current.filter(
      (obstacle) => obstacle.x > scrollOffset.current - OBSTACLE_WIDTH - 100,
    );

    if (checkCollision()) {
      addGamePoints(Math.floor(score / 2));
      setGameOver(true);
      if (isLoaded) {
        pause('endlessrunner');
      }
      if (score > highScore) {
        setHighScore(score);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    animationFrame.current = requestAnimationFrame(gameLoop);
  }, [
    gameStarted,
    gameOver,
    score,
    highScore,
    checkCollision,
    groundY,
    insets.top,
  ]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationFrame.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  const renderObstacles = () => {
    return obstacles.current.map((obstacle) => {
      const x = obstacle.x - scrollOffset.current;
      if (x < -OBSTACLE_WIDTH || x > SCREEN_WIDTH) return null;

      return (
        <View
          key={obstacle.id}
          style={[
            styles.obstacle,
            {
              left: x,
              bottom: GROUND_HEIGHT + insets.bottom,
              height: obstacle.height,
              width: OBSTACLE_WIDTH,
            },
          ]}
        />
      );
    });
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={jump}>
      <LinearGradient
        colors={['#FF6B9D', '#C06C84', '#6C5B7B', '#355C7D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 20 }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ArrowLeft color="rgba(255, 255, 255, 0.9)" size={24} />
      </TouchableOpacity>

      <View style={[styles.scoreContainer, { top: insets.top + 20 }]}>
        <Text style={styles.scoreText}>{score}</Text>
        {highScore > 0 && (
          <Text style={styles.highScoreText}>Best: {highScore}</Text>
        )}
      </View>

      {!gameStarted && (
        <View style={styles.startPrompt}>
          <Text style={styles.startTitle}>ENDLESS RUNNER</Text>
          <Text style={styles.startText}>Tap to Start</Text>
        </View>
      )}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Game Over</Text>
          <Text style={styles.gameOverScore}>Score: {score}</Text>
          {score === highScore && score > 0 && (
            <Text style={styles.newRecord}>New Record! 🎉</Text>
          )}
          <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.restartText}>Tap to Restart</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.gameArea}>
        {renderObstacles()}

        <Animated.View
          style={[
            styles.player,
            {
              bottom: groundY - playerY.current + insets.bottom,
              transform: [
                {
                  rotate: playerAnim.interpolate({
                    inputRange: [-10, 0],
                    outputRange: ['-15deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        />

        <View
          style={[
            styles.ground,
            {
              height: GROUND_HEIGHT + insets.bottom,
              bottom: 0,
            },
          ]}
        >
          <View style={styles.groundPattern}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.groundSegment,
                  {
                    left:
                      (i * 60 - (scrollOffset.current % 60)) %
                      (SCREEN_WIDTH + 60),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  scoreContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  highScoreText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  startPrompt: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  startTitle: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: 'white',
    letterSpacing: 4,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  startText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  gameOverContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginHorizontal: 30,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 24,
    zIndex: 20,
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: 'white',
    marginBottom: 16,
  },
  gameOverScore: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  newRecord: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#FFD700',
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  restartText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
  player: {
    position: 'absolute',
    left: 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  obstacle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  groundPattern: {
    flex: 1,
    flexDirection: 'row',
  },
  groundSegment: {
    position: 'absolute',
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: 10,
    borderRadius: 2,
  },
});
