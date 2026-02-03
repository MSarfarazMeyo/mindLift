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
import { RotateCcw, Settings, X } from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';

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
  const [controlMode, setControlMode] = useState<ControlMode>('tilt');
  const [showSettings, setShowSettings] = useState(false);
  
  const [paddleX, setPaddleX] = useState((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
  const [ball, setBall] = useState<Ball>({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2,
    vx: 4,
    vy: -4,
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const animationFrameId = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const paddleVelocityRef = useRef<number>(0);
  const swipeStartXRef = useRef<number>(0);

  const GAME_TOP = insets.top + 80;
  const GAME_BOTTOM = SCREEN_HEIGHT - insets.bottom - 100;
  const PADDLE_Y = GAME_BOTTOM - 40;

  const initBricks = () => {
    const newBricks: Brick[] = [];
    const brickWidth = (SCREEN_WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
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
    setBricks(newBricks);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setPaddleX((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
    setBall({
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT / 2,
      vx: 4,
      vy: -4,
    });
    setParticles([]);
    initBricks();
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  useEffect(() => {
    const initBricksCallback = () => {
      const newBricks: Brick[] = [];
      const brickWidth = (SCREEN_WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
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
      setBricks(newBricks);
    };
    initBricksCallback();
  }, [GAME_TOP]);

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
    setParticles(prev => [...prev, ...newParticles]);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => controlMode === 'swipe' && gameStarted && !gameOver,
    onMoveShouldSetPanResponder: () => controlMode === 'swipe' && gameStarted && !gameOver,
    onPanResponderGrant: (evt) => {
      if (controlMode === 'swipe') {
        const touchX = evt.nativeEvent.pageX;
        const paddleCenter = paddleX + PADDLE_WIDTH / 2;
        swipeStartXRef.current = touchX - paddleCenter;
      }
    },
    onPanResponderMove: (evt) => {
      if (controlMode === 'swipe') {
        const touchX = evt.nativeEvent.pageX;
        const newX = touchX - swipeStartXRef.current - PADDLE_WIDTH / 2;
        setPaddleX(Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newX)));
      }
    },
  });

  useEffect(() => {
    if (Platform.OS === 'web' || controlMode !== 'tilt') {
      return;
    }

    let subscription: { remove: () => void } | undefined;
    
    const setupAccelerometer = async () => {
      try {
        await Accelerometer.setUpdateInterval(16);
        
        subscription = Accelerometer.addListener(accelerometerData => {
          if (!gameStarted || gameOver) return;
          
          const { x } = accelerometerData;
          const tiltSensitivity = 25;
          paddleVelocityRef.current = x * tiltSensitivity;
          
          setPaddleX(prev => {
            const newX = prev + paddleVelocityRef.current;
            return Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newX));
          });
        });
      } catch (error) {
        console.error('Error setting up accelerometer:', error);
      }
    };

    setupAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [gameStarted, gameOver, controlMode]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 16.67, 2);
      lastTimeRef.current = now;

      setBall(prevBall => {
        let newBall = { ...prevBall };
        newBall.x += newBall.vx * deltaTime;
        newBall.y += newBall.vy * deltaTime;

        if (newBall.x <= BALL_SIZE / 2 || newBall.x >= SCREEN_WIDTH - BALL_SIZE / 2) {
          newBall.vx *= -1;
          newBall.x = Math.max(BALL_SIZE / 2, Math.min(SCREEN_WIDTH - BALL_SIZE / 2, newBall.x));
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        }

        if (newBall.y <= GAME_TOP + BALL_SIZE / 2) {
          newBall.vy *= -1;
          newBall.y = GAME_TOP + BALL_SIZE / 2;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        }

        if (
          newBall.y + BALL_SIZE / 2 >= PADDLE_Y &&
          newBall.y - BALL_SIZE / 2 <= PADDLE_Y + PADDLE_HEIGHT &&
          newBall.x >= paddleX &&
          newBall.x <= paddleX + PADDLE_WIDTH
        ) {
          newBall.vy = -Math.abs(newBall.vy);
          const hitPos = (newBall.x - paddleX) / PADDLE_WIDTH;
          newBall.vx = (hitPos - 0.5) * 8;
          newBall.y = PADDLE_Y - BALL_SIZE / 2;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        }

        if (newBall.y > GAME_BOTTOM + 50) {
          setGameOver(true);
          setGameStarted(false);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          }
        }

        return newBall;
      });

      setBricks(prevBricks => {
        let bricksChanged = false;
        const newBricks = prevBricks.map(brick => {
          if (!brick.visible) return brick;

          if (
            ball.x + BALL_SIZE / 2 >= brick.x &&
            ball.x - BALL_SIZE / 2 <= brick.x + brick.width &&
            ball.y + BALL_SIZE / 2 >= brick.y &&
            ball.y - BALL_SIZE / 2 <= brick.y + brick.height
          ) {
            bricksChanged = true;
            const newHits = brick.hits - 1;

            if (newHits <= 0) {
              createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
              setCombo(prev => {
                const newCombo = prev + 1;
                setScore(s => s + 10 * newCombo);
                if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
                comboTimeoutRef.current = setTimeout(() => setCombo(0), 1000);
                return newCombo;
              });
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              }
              return { ...brick, visible: false };
            } else {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              }
              return { ...brick, hits: newHits };
            }
          }
          return brick;
        });

        if (bricksChanged) {
          setBall(prev => ({ ...prev, vy: -prev.vy }));
        }

        if (newBricks.every(b => !b.visible)) {
          setGameOver(true);
          setGameStarted(false);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        }

        return newBricks;
      });

      setParticles(prevParticles => {
        return prevParticles
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02,
          }))
          .filter(p => p.life > 0);
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, gameOver, ball.x, ball.y, paddleX, GAME_TOP, GAME_BOTTOM, PADDLE_Y]);

  const allBricksGone = bricks.every(b => !b.visible);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={[styles.background, { backgroundColor: '#0A0E27' }]} />
      <StatusBar style="light" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        
        {combo > 1 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>x{combo} COMBO!</Text>
          </View>
        )}
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setShowSettings(true)}
            style={styles.iconButton}
          >
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={resetGame}
            style={styles.iconButton}
          >
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.gameArea, { top: GAME_TOP }]}>
        {bricks.map((brick, index) => (
          brick.visible && (
            <View
              key={index}
              style={[
                styles.brick,
                {
                  left: brick.x,
                  top: brick.y,
                  width: brick.width,
                  height: brick.height,
                  backgroundColor: brick.color,
                  opacity: brick.hits === 3 ? 1 : brick.hits === 2 ? 0.7 : 0.4,
                },
              ]}
            >
              {brick.hits > 1 && (
                <View style={styles.brickHitIndicator}>
                  <Text style={styles.brickHitText}>{brick.hits}</Text>
                </View>
              )}
            </View>
          )
        ))}

        {particles.map((particle, index) => (
          <View
            key={`particle-${index}`}
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

        <View
          style={[
            styles.ball,
            {
              left: ball.x - BALL_SIZE / 2,
              top: ball.y - BALL_SIZE / 2,
            },
          ]}
        />

        <View
          style={[
            styles.paddle,
            {
              left: paddleX,
              top: PADDLE_Y,
            },
          ]}
        />
      </View>

      {!gameStarted && !gameOver && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setGameStarted(true)}
        >
          <View style={styles.startCard}>
            <Text style={styles.startTitle}>BREAKOUT</Text>
            <Text style={styles.startSubtitle}>
              {Platform.OS === 'web' ? 'Not available on web - use native device' : 
               controlMode === 'tilt' ? 'Tilt your phone to move paddle' : 'Swipe to move paddle'}
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
            <TouchableOpacity onPress={resetGame} style={styles.playAgainButton}>
              <Text style={styles.playAgainText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
                onPress={() => {
                  setControlMode('tilt');
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                }}
              >
                <Text style={[
                  styles.controlOptionText,
                  controlMode === 'tilt' && styles.controlOptionTextActive,
                ]}>
                  Tilt
                </Text>
                <Text style={[
                  styles.controlOptionDesc,
                  controlMode === 'tilt' && styles.controlOptionDescActive,
                ]}>
                  Move by tilting your phone
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlOption,
                  controlMode === 'swipe' && styles.controlOptionActive,
                ]}
                onPress={() => {
                  setControlMode('swipe');
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                }}
              >
                <Text style={[
                  styles.controlOptionText,
                  controlMode === 'swipe' && styles.controlOptionTextActive,
                ]}>
                  Swipe
                </Text>
                <Text style={[
                  styles.controlOptionDesc,
                  controlMode === 'swipe' && styles.controlOptionDescActive,
                ]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  scoreContainer: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B93B0',
    letterSpacing: 1,
  },
  score: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
    textShadowColor: 'rgba(255, 200, 87, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameArea: {
    ...StyleSheet.absoluteFillObject,
  },
  brick: {
    position: 'absolute',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  brickHitIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brickHitText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
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
