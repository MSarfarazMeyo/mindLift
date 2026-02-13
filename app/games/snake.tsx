import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  Dimensions,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { addGamePoints } from '@/lib/gamePoints';

const GRID_SIZE = 20;
const CELL_SIZE = Dimensions.get('window').width / GRID_SIZE;
const INITIAL_SPEED = 150;
const MIN_SPEED = 70;
const SPEED_DECREASE = 3;
const COMBO_TIME = 2000;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type FoodType = 'normal' | 'golden';

export default function SnakeGame() {
  const insets = useSafeAreaInsets();
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [foodType, setFoodType] = useState<FoodType>('normal');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const directionRef = useRef<Direction>('RIGHT');
  const lastFoodTime = useRef<number>(Date.now());
  const foodScale = useRef(new Animated.Value(1)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(foodScale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(foodScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [foodScale]);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('snakeHighScore');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          setHighScore(parsed);
        }
      }
    } catch (e) {
      console.log('Failed to load high score', e);
      await AsyncStorage.removeItem('snakeHighScore');
    }
  };

  const saveHighScore = useCallback(
    async (newScore: number) => {
      try {
        if (newScore > highScore) {
          await AsyncStorage.setItem('snakeHighScore', String(newScore));
          setHighScore(newScore);
        }
      } catch (e) {
        console.log('Failed to save high score', e);
      }
    },
    [highScore],
  );

  const generateFood = useCallback((snakePositions: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snakePositions.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y,
      )
    );

    const isGolden = Math.random() < 0.15;
    setFoodType(isGolden ? 'golden' : 'normal');

    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    directionRef.current = 'RIGHT';
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
    lastFoodTime.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [generateFood]);

  const showCombo = useCallback(() => {
    comboOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(comboOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [comboOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < 10 && absDy < 10) return;

        if (absDx > absDy) {
          if (dx > 0 && directionRef.current !== 'LEFT') {
            directionRef.current = 'RIGHT';
          } else if (dx < 0 && directionRef.current !== 'RIGHT') {
            directionRef.current = 'LEFT';
          }
        } else {
          if (dy > 0 && directionRef.current !== 'UP') {
            directionRef.current = 'DOWN';
          } else if (dy < 0 && directionRef.current !== 'DOWN') {
            directionRef.current = 'UP';
          }
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    }),
  ).current;

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let newHead: Position;

        switch (directionRef.current) {
          case 'UP':
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case 'DOWN':
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case 'LEFT':
            newHead = { x: head.x - 1, y: head.y };
            break;
          case 'RIGHT':
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE ||
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          )
        ) {
          setIsGameOver(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          const now = Date.now();
          const timeSinceLastFood = now - lastFoodTime.current;
          const isCombo = timeSinceLastFood < COMBO_TIME;

          let points = foodType === 'golden' ? 30 : 10;
          let newCombo = 0;

          if (isCombo) {
            newCombo = combo + 1;
            points += newCombo * 5;
            setCombo(newCombo);
            showCombo();
          } else {
            setCombo(0);
          }

          setScore((prev) => {
            const newScore = prev + points;
            saveHighScore(newScore);
            addGamePoints(points);
            return newScore;
          });

          setSpeed((prevSpeed) =>
            Math.max(MIN_SPEED, prevSpeed - SPEED_DECREASE),
          );

          lastFoodTime.current = now;
          setFood(generateFood(newSnake));

          if (foodType === 'golden') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [
    isGameOver,
    isPaused,
    food,
    generateFood,
    combo,
    foodType,
    speed,
    saveHighScore,
    showCombo,
  ]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HIGH</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>LEVEL</Text>
            <Text style={styles.statValue}>{Math.floor(score / 100) + 1}</Text>
          </View>
        </View>
        {combo > 0 && (
          <Animated.View
            style={[styles.comboContainer, { opacity: comboOpacity }]}
          >
            <Text style={styles.comboText}>
              🔥 {combo}x COMBO! +{combo * 5}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.gameBoard} {...panResponder.panHandlers}>
          <View style={styles.gridOverlay} />

          {snake.map((segment, index) => (
            <View
              key={`snake-${index}`}
              style={[
                styles.snakeSegment,
                {
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                },
                index === 0 && styles.snakeHead,
              ]}
            >
              <LinearGradient
                colors={
                  index === 0 ? ['#00f260', '#0575e6'] : ['#00f260', '#00c853']
                }
                style={styles.segmentGradient}
              />
            </View>
          ))}

          <Animated.View
            style={[
              styles.food,
              {
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                transform: [{ scale: foodScale }],
              },
            ]}
          >
            <LinearGradient
              colors={
                foodType === 'golden'
                  ? ['#FFD700', '#FFA500']
                  : ['#f953c6', '#b91d73']
              }
              style={styles.foodGradient}
            >
              <Text style={styles.foodEmoji}>
                {foodType === 'golden' ? '⭐' : '🍎'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {(isGameOver || isPaused) && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.gameOverTitle}>
              {isGameOver ? 'GAME OVER' : 'SNAKE'}
            </Text>
            {isGameOver && (
              <>
                <Text style={styles.finalScore}>Final Score: {score}</Text>
                {score > highScore && (
                  <Text style={styles.newHighScore}>🏆 NEW HIGH SCORE! 🏆</Text>
                )}
                <Text style={styles.levelReached}>
                  Level Reached: {Math.floor(score / 100) + 1}
                </Text>
              </>
            )}
            {!isGameOver && (
              <Text style={styles.instructions}>
                Swipe to control the snake
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={resetGame}
            >
              <LinearGradient
                colors={['#f953c6', '#b91d73']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isGameOver ? 'PLAY AGAIN' : 'START GAME'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 12,
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: 2,
    opacity: 0.7,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#00f260',
    textShadowColor: '#00f260',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  comboContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(249, 83, 198, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f953c6',
  },
  comboText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#f953c6',
    textShadowColor: '#f953c6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBoard: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 96, 0.3)',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  snakeSegment: {
    position: 'absolute',
    padding: 2,
  },
  segmentGradient: {
    flex: 1,
    borderRadius: 4,
    shadowColor: '#00f260',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  snakeHead: {
    zIndex: 10,
  },
  food: {
    position: 'absolute',
    padding: 2,
    zIndex: 5,
  },
  foodGradient: {
    flex: 1,
    borderRadius: CELL_SIZE / 2,
    shadowColor: '#f953c6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodEmoji: {
    fontSize: CELL_SIZE * 0.7,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 12, 41, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    padding: 32,
  },
  gameOverTitle: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: '#f953c6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#00f260',
    marginBottom: 12,
  },
  newHighScore: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  levelReached: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
  },
  instructions: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 32,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#f953c6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },
  buttonGradient: {
    paddingHorizontal: 48,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: 1,
  },
});
