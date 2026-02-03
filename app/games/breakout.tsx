import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  PanResponder,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { RotateCcw, Settings, X, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMusic } from '@/hooks/useMusic';
import { addGamePoints } from '@/lib/gamePoints';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const BALL_SIZE = 12;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 16;
const BRICK_ROWS = 6;
const BRICK_COLS = 6;
const BRICK_PADDING = 6;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  color: string;
  hits: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const BRICK_COLORS = [
  '#FF6B9D',
  '#C768DD',
  '#4ECDC4',
  '#44AF69',
  '#FFC857',
  '#FF8C42',
];

type ControlMode = 'tilt' | 'swipe';

export default function BreakoutGame() {
  const insets = useSafeAreaInsets();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [controlMode, setControlMode] = useState<ControlMode>('tilt');
  const [showSettings, setShowSettings] = useState(false);
  const { play, pause, isLoaded } = useMusic();

  // Refs for fast updates
  const paddleXRef = useRef((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
  const ballRef = useRef<Ball>({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2,
    vx: 4,
    vy: -4,
  });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);
  const swipeStartXRef = useRef<number>(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const [, forceRender] = useState(0);
  const render = () => forceRender((v) => v + 1);

  const GAME_TOP = insets.top + 80;
  const GAME_BOTTOM = SCREEN_HEIGHT - insets.bottom - 100;
  const PADDLE_Y = GAME_BOTTOM - 40;

  // Initialize bricks
  const initBricks = () => {
    const newBricks: Brick[] = [];
    const brickWidth =
      (SCREEN_WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
    const brickHeight = 28;
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: BRICK_PADDING + col * (brickWidth + BRICK_PADDING),
          y: GAME_TOP + 20 + row * (brickHeight + BRICK_PADDING),
          width: brickWidth,
          height: brickHeight,
          visible: true,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          hits: Math.min(row + 1, 3),
        });
      }
    }
    bricksRef.current = newBricks;
  };

  // Load high score
  const loadHighScore = async () => {
    try {
      const hs = await AsyncStorage.getItem('breakoutHighScore');
      if (hs) setHighScore(parseInt(hs, 10));
    } catch {}
  };

  const saveHighScore = async (newScore: number) => {
    try {
      if (newScore > highScore) {
        await AsyncStorage.setItem('breakoutHighScore', newScore.toString());
        setHighScore(newScore);
      }
    } catch {}
  };

  useEffect(() => {
    initBricks();
    loadHighScore();

    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  useEffect(() => {
    if (isLoaded && gameStarted && !gameOver) {
      play('breakout');
    }
    return () => {
      if (isLoaded) {
        pause('breakout');
      }
    };
  }, [isLoaded, gameStarted, gameOver]);

  const resetGame = () => {
    paddleXRef.current = (SCREEN_WIDTH - PADDLE_WIDTH) / 2;
    ballRef.current = {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT / 2,
      vx: 4,
      vy: -4,
    };
    particlesRef.current = [];
    setScore(0);
    setCombo(0);
    setGameOver(false);
    initBricks();
    render();
  };

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color,
        life: 1,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () =>
      controlMode === 'swipe' && gameStarted && !gameOver,
    onMoveShouldSetPanResponder: () =>
      controlMode === 'swipe' && gameStarted && !gameOver,
    onPanResponderGrant: (evt) => {
      if (controlMode === 'swipe') {
        const touchX = evt.nativeEvent.pageX;
        swipeStartXRef.current = touchX - paddleXRef.current - PADDLE_WIDTH / 2;
      }
    },
    onPanResponderMove: (evt) => {
      if (controlMode === 'swipe') {
        const touchX = evt.nativeEvent.pageX;
        const newX = touchX - swipeStartXRef.current - PADDLE_WIDTH / 2;
        paddleXRef.current = Math.max(
          0,
          Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newX),
        );
        render();
      }
    },
  });

  useEffect(() => {
    if (Platform.OS === 'web' || controlMode !== 'tilt') return;
    let subscription: { remove: () => void } | undefined;
    const setupAccelerometer = async () => {
      try {
        await Accelerometer.setUpdateInterval(16);
        subscription = Accelerometer.addListener((data) => {
          if (!gameStarted || gameOver) return;
          paddleXRef.current += data.x * 25;
          paddleXRef.current = Math.max(
            0,
            Math.min(SCREEN_WIDTH - PADDLE_WIDTH, paddleXRef.current),
          );
          render();
        });
      } catch {}
    };
    setupAccelerometer();
    return () => subscription?.remove();
  }, [gameStarted, gameOver, controlMode]);

  const gameLoop = () => {
    const ball = ballRef.current;
    const bricks = bricksRef.current;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x <= BALL_SIZE / 2 || ball.x >= SCREEN_WIDTH - BALL_SIZE / 2)
      ball.vx *= -1;
    if (ball.y <= GAME_TOP + BALL_SIZE / 2) ball.vy *= -1;

    // Paddle collision
    if (
      ball.y + BALL_SIZE / 2 >= PADDLE_Y &&
      ball.x >= paddleXRef.current &&
      ball.x <= paddleXRef.current + PADDLE_WIDTH
    ) {
      ball.vy = -Math.abs(ball.vy);
      const hit = (ball.x - paddleXRef.current) / PADDLE_WIDTH;
      ball.vx = (hit - 0.5) * 8;
    }

    // Brick collision
    for (const brick of bricks) {
      if (!brick.visible) continue;
      if (
        ball.x + BALL_SIZE / 2 >= brick.x &&
        ball.x - BALL_SIZE / 2 <= brick.x + brick.width &&
        ball.y + BALL_SIZE / 2 >= brick.y &&
        ball.y - BALL_SIZE / 2 <= brick.y + brick.height
      ) {
        brick.hits -= 1;
        ball.vy *= -1;
        if (brick.hits <= 0) {
          brick.visible = false;
          createParticles(
            brick.x + brick.width / 2,
            brick.y + brick.height / 2,
            brick.color,
          );
          setScore((s) => s + 10);
          addGamePoints(10);
        }
        break;
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current
      .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.02 }))
      .filter((p) => p.life > 0);

    // Game over
    if (ball.y > GAME_BOTTOM + 50) {
      setGameOver(true);
      setGameStarted(false);
      saveHighScore(score);
      if (isLoaded) {
        pause('breakout');
      }
      return;
    }

    render();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    resetGame();
    setGameStarted(true);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const allBricksGone = bricksRef.current.every((b) => !b.visible);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={[styles.background, { backgroundColor: '#0A0E27' }]} />
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.score}>{score}</Text>
          <Text style={[styles.scoreLabel, { marginTop: 4 }]}>
            HIGH: {highScore}
          </Text>
        </View>
        {combo > 1 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>x{combo} COMBO!</Text>
          </View>
        )}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.iconButton}
          >
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetGame} style={styles.iconButton}>
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.gameArea, { top: GAME_TOP }]}>
        {bricksRef.current.map(
          (brick, i) =>
            brick.visible && (
              <View
                key={i}
                style={[
                  styles.brick,
                  {
                    left: brick.x,
                    top: brick.y,
                    width: brick.width,
                    height: brick.height,
                    backgroundColor: brick.color,
                    opacity:
                      brick.hits === 3 ? 1 : brick.hits === 2 ? 0.7 : 0.4,
                  },
                ]}
              />
            ),
        )}

        {particlesRef.current.map((p, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: p.x,
                top: p.y,
                backgroundColor: p.color,
                opacity: p.life,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.ball,
            {
              left: ballRef.current.x - BALL_SIZE / 2,
              top: ballRef.current.y - BALL_SIZE / 2,
            },
          ]}
        />

        <View
          style={[styles.paddle, { left: paddleXRef.current, top: PADDLE_Y }]}
        />
      </View>

      {!gameStarted && !gameOver && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={startGame}
        >
          <View style={styles.startCard}>
            <Text style={styles.startTitle}>BREAKOUT</Text>
            <Text style={styles.startSubtitle}>
              {Platform.OS === 'web'
                ? 'Not available on web - use native device'
                : controlMode === 'tilt'
                  ? 'Tilt your phone to move paddle'
                  : 'Swipe to move paddle'}
            </Text>
            <Text style={styles.startHint}>Touch anywhere to start</Text>
          </View>
        </TouchableOpacity>
      )}

      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverTitle}>
              {allBricksGone ? 'YOU WIN!' : 'GAME OVER'}
            </Text>
            <Text style={styles.finalScore}>{score}</Text>
            <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
            <TouchableOpacity
              onPress={startGame}
              style={styles.playAgainButton}
            >
              <Text style={styles.playAgainText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* SETTINGS MODAL */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>SETTINGS</Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#8B93B0" />
              </TouchableOpacity>
            </View>
            <Text style={styles.settingLabel}>CONTROL MODE</Text>
            <View style={styles.controlOptions}>
              <TouchableOpacity
                style={[
                  styles.controlOption,
                  controlMode === 'tilt' && styles.controlOptionActive,
                ]}
                onPress={() => setControlMode('tilt')}
              >
                <Text
                  style={[
                    styles.controlOptionText,
                    controlMode === 'tilt' && styles.controlOptionTextActive,
                  ]}
                >
                  Tilt
                </Text>
                <Text
                  style={[
                    styles.controlOptionDesc,
                    controlMode === 'tilt' && styles.controlOptionDescActive,
                  ]}
                >
                  Move by tilting your phone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.controlOption,
                  controlMode === 'swipe' && styles.controlOptionActive,
                ]}
                onPress={() => setControlMode('swipe')}
              >
                <Text
                  style={[
                    styles.controlOptionText,
                    controlMode === 'swipe' && styles.controlOptionTextActive,
                  ]}
                >
                  Swipe
                </Text>
                <Text
                  style={[
                    styles.controlOptionDesc,
                    controlMode === 'swipe' && styles.controlOptionDescActive,
                  ]}
                >
                  Move by swiping on screen
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// STYLES REMAIN SAME
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  background: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  scoreContainer: { alignItems: 'flex-start' },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B93B0',
    letterSpacing: 1,
  },
  score: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  comboContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: 20,
  },
  comboText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFC857',
    textShadowColor: 'rgba(255,200,87,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameArea: { ...StyleSheet.absoluteFillObject },
  brick: { position: 'absolute', borderRadius: 6 },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },

  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 5,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 39, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  startCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  startTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 16,
    flexShrink: 0,
  },
  startSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B93B0',
    marginBottom: 8,
  },
  startHint: {
    fontSize: 14,
    color: '#4ECDC4',
    marginTop: 24,
  },
  gameOverCard: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 24,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: '900',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  finalScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B93B0',
    letterSpacing: 2,
    marginBottom: 40,
  },
  playAgainButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0E27',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  settingsCard: {
    backgroundColor: '#1A1F3A',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 147, 176, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B93B0',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  controlOptions: {
    gap: 12,
    marginBottom: 32,
  },
  controlOption: {
    backgroundColor: 'rgba(139, 147, 176, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  controlOptionActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderColor: '#4ECDC4',
  },
  controlOptionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B93B0',
    marginBottom: 4,
  },
  controlOptionTextActive: {
    color: '#FFFFFF',
  },
  controlOptionDesc: {
    fontSize: 14,
    color: '#8B93B0',
    opacity: 0.7,
  },
  controlOptionDescActive: {
    color: '#4ECDC4',
    opacity: 1,
  },
  doneButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0E27',
    letterSpacing: 1.5,
  },
});
