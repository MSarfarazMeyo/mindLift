import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';

import { BOMB_COLOR, GEM_COLORS, GAME_CONFIG } from '@/constants/game';
import type { GameObject, GameState, Particle } from '@/types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(GAME_CONFIG.INITIAL_LIVES);
  const [combo, setCombo] = useState<number>(0);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const objectsRef = useRef<GameObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [basketX, setBasketX] = useState<number>(SCREEN_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2);
  
  const spawnRate = useRef<number>(GAME_CONFIG.INITIAL_SPAWN_RATE);
  const objectSpeed = useRef<number>(GAME_CONFIG.INITIAL_SPEED);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const basketAnim = useRef(new Animated.Value(1)).current;

  const accelerometerSubscription = useRef<{ remove: () => void } | null>(null);

  const spawnObject = useCallback(() => {
    const isBomb = Math.random() < 0.25;
    const newObject: GameObject = {
      id: Date.now().toString() + Math.random(),
      x: Math.random() * (SCREEN_WIDTH - GAME_CONFIG.OBJECT_SIZE),
      y: -GAME_CONFIG.OBJECT_SIZE,
      speed: objectSpeed.current,
      type: isBomb ? 'bomb' : 'gem',
      color: isBomb ? BOMB_COLOR : GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
    };
    objectsRef.current = [...objectsRef.current, newObject];
    setObjects(objectsRef.current);
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / GAME_CONFIG.PARTICLE_COUNT;
      newParticles.push({
        id: Date.now().toString() + i,
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color,
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameOver');
    if (score > highScore) {
      setHighScore(score);
    }
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
    }
  }, [score, highScore]);

  const checkCollision = useCallback(
    (obj: GameObject) => {
      const basketCenterX = basketX + GAME_CONFIG.BASKET_WIDTH / 2;
      const basketTop = SCREEN_HEIGHT - GAME_CONFIG.BASKET_HEIGHT - 100 - insets.bottom;
      
      const objCenterX = obj.x + GAME_CONFIG.OBJECT_SIZE / 2;
      const objBottom = obj.y + GAME_CONFIG.OBJECT_SIZE;

      if (objBottom >= basketTop && objBottom <= basketTop + 30) {
        const distance = Math.abs(objCenterX - basketCenterX);
        if (distance < GAME_CONFIG.BASKET_WIDTH / 2 + GAME_CONFIG.OBJECT_SIZE / 2) {
          return true;
        }
      }
      return false;
    },
    [basketX, insets.bottom]
  );

  const handleCatch = useCallback(
    (obj: GameObject) => {
      if (obj.type === 'gem') {
        const newCombo = combo + 1;
        const points = 10 * newCombo;
        setScore((prev) => prev + points);
        setCombo(newCombo);
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        createParticles(obj.x + GAME_CONFIG.OBJECT_SIZE / 2, obj.y, obj.color);
        
        Animated.sequence([
          Animated.timing(basketAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(basketAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        if (comboTimeoutRef.current) {
          clearTimeout(comboTimeoutRef.current);
        }
        comboTimeoutRef.current = setTimeout(() => {
          setCombo(0);
        }, GAME_CONFIG.COMBO_TIMEOUT);
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setCombo(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        createParticles(obj.x + GAME_CONFIG.OBJECT_SIZE / 2, obj.y, '#FF4757');
        
        if (newLives <= 0) {
          endGame();
        }
      }
    },
    [combo, lives, createParticles, basketAnim, endGame]
  );

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setCombo(0);
    setObjects([]);
    objectsRef.current = [];
    setParticles([]);
    setBasketX(SCREEN_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2);
    spawnRate.current = GAME_CONFIG.INITIAL_SPAWN_RATE;
    objectSpeed.current = GAME_CONFIG.INITIAL_SPEED;

    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(16);
      accelerometerSubscription.current = Accelerometer.addListener((data) => {
        setBasketX((prevX) => {
          const tiltSpeed = data.x * 15;
          const newX = prevX + tiltSpeed;
          return Math.max(0, Math.min(newX, SCREEN_WIDTH - GAME_CONFIG.BASKET_WIDTH));
        });
      });
    }

    spawnTimerRef.current = setInterval(() => {
      spawnObject();
      if (spawnRate.current > GAME_CONFIG.MIN_SPAWN_RATE) {
        spawnRate.current -= GAME_CONFIG.SPAWN_RATE_DECREASE;
        clearInterval(spawnTimerRef.current!);
        spawnTimerRef.current = setInterval(spawnObject, spawnRate.current);
      }
      if (objectSpeed.current < GAME_CONFIG.MAX_SPEED) {
        objectSpeed.current += GAME_CONFIG.SPEED_INCREASE;
      }
    }, spawnRate.current);
  }, [spawnObject]);

  useEffect(() => {
    if (gameState === 'playing') {
      let animationFrameId: number;
      
      const gameLoop = () => {
        objectsRef.current = objectsRef.current
          .map((obj) => ({
            ...obj,
            y: obj.y + obj.speed,
          }))
          .filter((obj) => {
            if (checkCollision(obj)) {
              handleCatch(obj);
              return false;
            }
            if (obj.y > SCREEN_HEIGHT) {
              if (obj.type === 'gem') {
                const newLives = lives - 1;
                setLives(newLives);
                setCombo(0);
                if (newLives <= 0) {
                  endGame();
                }
              }
              return false;
            }
            return true;
          });
        
        setObjects([...objectsRef.current]);

        setParticles((prevParticles) =>
          prevParticles
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.2,
              life: p.life - 0.02,
            }))
            .filter((p) => p.life > 0)
        );
        
        animationFrameId = requestAnimationFrame(gameLoop);
      };
      
      animationFrameId = requestAnimationFrame(gameLoop);
      
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [gameState, checkCollision, handleCatch, lives, endGame]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, []);

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.titleContainer}>
        <Sparkles size={48} color="#FFD93D" fill="#FFD93D" />
        <Text style={styles.title}>Gem Catcher</Text>
        <Text style={styles.subtitle}>Catch gems, avoid bombs!</Text>
      </View>

      {highScore > 0 && (
        <View style={styles.highScoreContainer}>
          <Trophy size={24} color="#FFD93D" />
          <Text style={styles.highScoreText}>Best: {highScore}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          startGame();
        }}
      >
        <Text style={styles.playButtonText}>Start Game</Text>
      </Pressable>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Tilt your device to move the basket</Text>
        <Text style={styles.instructionText}>Catch colorful gems to score</Text>
        <Text style={styles.instructionText}>Avoid black bombs!</Text>
      </View>
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.gameOverContainer}>
      <Text style={styles.gameOverTitle}>Game Over!</Text>
      <View style={styles.scoreContainer}>
        <Text style={styles.finalScoreLabel}>Score</Text>
        <Text style={styles.finalScore}>{score}</Text>
      </View>
      
      {score === highScore && score > 0 && (
        <View style={styles.newRecordBadge}>
          <Trophy size={20} color="#FFD93D" />
          <Text style={styles.newRecordText}>New Record!</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          startGame();
        }}
      >
        <Text style={styles.playButtonText}>Play Again</Text>
      </Pressable>

      <Pressable
        style={styles.menuButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setGameState('menu');
        }}
      >
        <Text style={styles.menuButtonText}>Main Menu</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {gameState === 'menu' && renderMenu()}
      {gameState === 'gameOver' && renderGameOver()}

      {gameState === 'playing' && (
        <View style={styles.gameArea}>
          <View style={[styles.hud, { paddingTop: insets.top + 16 }]}>
            <View style={styles.hudLeft}>
              <Text style={styles.scoreText}>{score}</Text>
              {combo > 1 && (
                <View style={styles.comboContainer}>
                  <Text style={styles.comboText}>x{combo}</Text>
                </View>
              )}
            </View>
            <View style={styles.livesContainer}>
              {Array.from({ length: GAME_CONFIG.INITIAL_LIVES }).map((_, i) => (
                <Heart
                  key={i}
                  size={28}
                  color="#fff"
                  fill={i < lives ? '#FF6B9D' : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </View>
          </View>

          {objects.map((obj) => (
            <View
              key={obj.id}
              style={[
                styles.object,
                {
                  left: obj.x,
                  top: obj.y,
                  backgroundColor: obj.color,
                  borderRadius: obj.type === 'gem' ? 8 : GAME_CONFIG.OBJECT_SIZE / 2,
                  transform: [{ rotate: obj.type === 'gem' ? '45deg' : '0deg' }],
                },
              ]}
            />
          ))}

          {particles.map((particle) => (
            <View
              key={particle.id}
              style={[
                styles.particle,
                {
                  left: particle.x,
                  top: particle.y,
                  backgroundColor: particle.color,
                  opacity: particle.life,
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.basket,
              {
                left: basketX,
                bottom: 100 + insets.bottom,
                transform: [{ scale: basketAnim }],
              },
            ]}
          >
            <View style={styles.basketTop} />
            <View style={styles.basketBody} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#fff',
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '600' as const,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  highScoreText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#4ECDC4',
    letterSpacing: 0.5,
  },
  instructions: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#fff',
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 24,
  },
  finalScoreLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  finalScore: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#fff',
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,217,61,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
  },
  newRecordText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFD93D',
  },
  menuButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comboContainer: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comboText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#2D3436',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  object: {
    position: 'absolute',
    width: GAME_CONFIG.OBJECT_SIZE,
    height: GAME_CONFIG.OBJECT_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  basket: {
    position: 'absolute',
    width: GAME_CONFIG.BASKET_WIDTH,
    height: GAME_CONFIG.BASKET_HEIGHT,
  },
  basketTop: {
    width: '100%',
    height: 8,
    backgroundColor: '#8B4513',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  basketBody: {
    width: '100%',
    flex: 1,
    backgroundColor: '#D2691E',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B4513',
  },
});
