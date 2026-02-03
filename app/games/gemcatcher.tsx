import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Trophy, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { addGamePoints } from '@/lib/gamePoints';
import { useMusic } from '@/hooks/useMusic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ---------------- CONFIG ---------------- */

const CONFIG = {
  LIVES: 3,
  BASKET_WIDTH: 90,
  BASKET_HEIGHT: 60,
  OBJECT_SIZE: 40,
  SPAWN_RATE: 900,
  SPEED: 3,
};

type GameState = 'menu' | 'playing' | 'gameOver';

interface GameObject {
  id: string;
  x: number;
  y: number;
  speed: number;
  type: 'gem' | 'bomb';
  color: string;
}

const GEM_COLORS = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#FFD93D'];

const BOMB_COLOR = '#2D3436';

/* ============================= */

export default function GameScreen() {
  const insets = useSafeAreaInsets();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CONFIG.LIVES);
  const [highScore, setHighScore] = useState(0);
  const { play, pause, isLoaded } = useMusic();

  useEffect(() => {
    const loadHighScore = async () => {
      const saved = await AsyncStorage.getItem('gemcatcher-highscore');
      console.log('saved', saved);

      if (saved) {
        const score = parseInt(saved);
        setHighScore(score);
        highScoreRef.current = score;
      }
    };
    loadHighScore();
  }, []);

  /* ---- Authoritative refs ---- */

  const objectsRef = useRef<GameObject[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(CONFIG.LIVES);
  const highScoreRef = useRef(0);

  /* Basket position */
  const basketXRef = useRef(SCREEN_WIDTH / 2 - CONFIG.BASKET_WIDTH / 2);
  const basketAnim = useRef(new Animated.Value(basketXRef.current)).current;

  const rafRef = useRef<number | null>(null);
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);
  const accelSub = useRef<any>(null);

  useEffect(() => {
    if (isLoaded && gameState === 'playing') {
      play('gemcatcher');
    }
    return () => {
      if (isLoaded) {
        pause('gemcatcher');
      }
    };
  }, [isLoaded, gameState]);

  /* ---------------- COLLISION ---------------- */

  const basketTop = SCREEN_HEIGHT - CONFIG.BASKET_HEIGHT - 100 - insets.bottom;

  const isColliding = (obj: GameObject) => {
    return (
      obj.y + CONFIG.OBJECT_SIZE >= basketTop &&
      obj.y <= basketTop + CONFIG.BASKET_HEIGHT &&
      obj.x + CONFIG.OBJECT_SIZE >= basketXRef.current &&
      obj.x <= basketXRef.current + CONFIG.BASKET_WIDTH
    );
  };

  /* ---------------- GAME LOOP ---------------- */

  const gameLoop = useCallback(() => {
    const nextObjects: GameObject[] = [];

    for (const obj of objectsRef.current) {
      obj.y += obj.speed;

      // CATCH
      if (isColliding(obj)) {
        if (obj.type === 'gem') {
          scoreRef.current += 10;
          addGamePoints(10);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          livesRef.current -= 1;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        continue;
      }

      // MISS (only after passing basket fully)
      if (obj.y > basketTop + CONFIG.BASKET_HEIGHT) {
        if (obj.type === 'gem') {
          livesRef.current -= 1;
        }
        continue;
      }

      nextObjects.push(obj);
    }

    objectsRef.current = nextObjects;

    // Sync UI
    setObjects([...nextObjects]);
    setScore(scoreRef.current);
    setLives(livesRef.current);

    if (livesRef.current <= 0) {
      endGame();
      return;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  /* ---------------- SPAWN ---------------- */

  const spawnObject = () => {
    const isBomb = Math.random() < 0.25;

    objectsRef.current.push({
      id: Math.random().toString(),
      x: Math.random() * (SCREEN_WIDTH - CONFIG.OBJECT_SIZE),
      y: -CONFIG.OBJECT_SIZE,
      speed: CONFIG.SPEED,
      type: isBomb ? 'bomb' : 'gem',
      color: isBomb
        ? BOMB_COLOR
        : GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
    });
  };

  /* ---------------- GAME CONTROL ---------------- */

  const startGame = () => {
    setGameState('playing');

    scoreRef.current = 0;
    livesRef.current = CONFIG.LIVES;
    objectsRef.current = [];

    setScore(0);
    setLives(CONFIG.LIVES);
    setObjects([]);

    spawnTimer.current = setInterval(spawnObject, CONFIG.SPAWN_RATE);

    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(16);
      accelSub.current = Accelerometer.addListener((data) => {
        const dx = data.x * 18;

        basketXRef.current = Math.max(
          0,
          Math.min(basketXRef.current + dx, SCREEN_WIDTH - CONFIG.BASKET_WIDTH),
        );

        basketAnim.setValue(basketXRef.current);
      });
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    setGameState('gameOver');

    console.log('scoreRef.current', scoreRef.current);
    console.log('highScore', highScore);

    if (Number(scoreRef.current) > Number(highScoreRef.current)) {
      console.log('ccccccccccccccccccccccccccccccccccc');

      setHighScore(scoreRef.current);
      highScoreRef.current = scoreRef.current;
      await AsyncStorage.setItem(
        'gemcatcher-highscore',
        scoreRef.current.toString(),
      );
    }

    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    accelSub.current?.remove();
    if (isLoaded) {
      pause('gemcatcher');
    }
  };

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => {
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      accelSub.current?.remove();
    };
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={StyleSheet.absoluteFillObject}
      />

      {gameState === 'menu' && (
        <View style={styles.center}>
          <Sparkles size={48} color="#FFD93D" />
          <Text style={styles.title}>Gem Catcher</Text>
          <Text style={styles.description}>
            Catch colorful gems to score points!
          </Text>
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              💎 Catch gems: +10 points
            </Text>
            <Text style={styles.instructionText}>💣 Avoid bombs: -1 life</Text>
            <Text style={styles.instructionText}>
              📱 Tilt device to move basket
            </Text>
            <Text style={styles.instructionText}>
              ❤️ Don't miss gems or lose lives
            </Text>
          </View>
          {highScore > 0 && (
            <Text style={styles.menuHighScore}>Best: {highScore}</Text>
          )}
          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {gameState === 'gameOver' && (
        <View style={styles.center}>
          <Trophy size={40} color="#FFD93D" />
          <Text style={styles.title}>Final Score: {score}</Text>
          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Play Again</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setGameState('menu')}
          >
            <Text style={styles.secondaryButtonText}>Main Menu</Text>
          </Pressable>
        </View>
      )}

      {gameState === 'playing' && (
        <>
          <View style={styles.hud}>
            <Text style={styles.score}>{score}</Text>
            <View style={{ flexDirection: 'row' }}>
              {Array.from({ length: CONFIG.LIVES }).map((_, i) => (
                <Heart
                  key={i}
                  size={26}
                  color="#fff"
                  fill={i < lives ? '#FF6B9D' : 'transparent'}
                />
              ))}
            </View>
          </View>

          {objects.map((o) => (
            <View
              key={o.id}
              style={[
                styles.object,
                {
                  left: o.x,
                  top: o.y,
                },
              ]}
            >
              {o.type === 'gem' ? (
                <View style={[styles.diamond, { backgroundColor: o.color }]}>
                  <View style={styles.diamondHighlight} />
                </View>
              ) : (
                <View style={styles.bomb} />
              )}
            </View>
          ))}

          <Animated.View
            style={[
              styles.basket,
              {
                transform: [{ translateX: basketAnim }],
                bottom: 100 + insets.bottom,
              },
            ]}
          />
        </>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 42, color: '#fff', fontWeight: '900', margin: 20 },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  buttonText: { fontSize: 20, fontWeight: '800', color: '#4ECDC4' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },

  hud: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  score: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  highScoreText: {
    fontSize: 24,
    color: '#FFD93D',
    fontWeight: '600',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  instructions: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuHighScore: {
    fontSize: 18,
    color: '#FFD93D',
    fontWeight: '600',
    marginBottom: 10,
  },

  object: {
    position: 'absolute',
    width: CONFIG.OBJECT_SIZE,
    height: CONFIG.OBJECT_SIZE,
  },

  diamond: {
    width: CONFIG.OBJECT_SIZE,
    height: CONFIG.OBJECT_SIZE,
    transform: [{ rotate: '45deg' }],
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  diamondHighlight: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 5,
    position: 'absolute',
    top: 6,
    left: 6,
  },

  bomb: {
    width: CONFIG.OBJECT_SIZE,
    height: CONFIG.OBJECT_SIZE,
    borderRadius: CONFIG.OBJECT_SIZE / 2,
    backgroundColor: '#2D3436',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },

  basket: {
    position: 'absolute',
    width: CONFIG.BASKET_WIDTH,
    height: CONFIG.BASKET_HEIGHT,
    backgroundColor: '#D2691E',
    borderRadius: 12,
  },
});
