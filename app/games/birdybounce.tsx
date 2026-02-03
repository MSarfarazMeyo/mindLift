import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { addGamePoints } from '@/lib/gamePoints';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BIRD_SIZE = 40;
const PIPE_WIDTH = 60;
const PIPE_GAP = 240;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const GAME_SPEED = 3;

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

export default function FlappyBirdGame() {
  const insets = useSafeAreaInsets();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  const [pipes, setPipes] = useState<Pipe[]>([]);

  const velocityRef = useRef(0);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sounds = useRef<{ [key: string]: Audio.Sound }>({});

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: popSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg' });
        const { sound: boingSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg' });
        const { sound: clangSound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg' });
        
        sounds.current = {
          pop: popSound,
          boing: boingSound,
          clang: clangSound,
        };
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      Object.values(sounds.current).forEach(sound => {
        sound.unloadAsync();
      });
    };
  }, []);

  const playSound = async (soundName: string) => {
    try {
      const sound = sounds.current[soundName];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const gameHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
  const groundHeight = 80;
  const playableHeight = gameHeight - groundHeight;

  const startGame = () => {
    console.log('Starting game');
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setBirdY(playableHeight / 2);
    velocityRef.current = 0;
    setPipes([
      {
        x: SCREEN_WIDTH,
        topHeight: Math.random() * (playableHeight - PIPE_GAP - 100) + 50,
        scored: false,
      },
    ]);
  };

  const jump = () => {
    if (!gameStarted) {
      startGame();
      return;
    }
    if (gameOver) return;

    playSound('boing');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    velocityRef.current = JUMP_VELOCITY;
    console.log('Bird jumped, velocity:', JUMP_VELOCITY);
  };

  const restartGame = () => {
    console.log('Restarting game');
    playSound('pop');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startGame();
  };

  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      velocityRef.current += GRAVITY;

      setBirdY((prevY) => {
        const newY = prevY + velocityRef.current;

        if (newY < 0 || newY > playableHeight - BIRD_SIZE) {
          console.log('Bird hit boundary, game over');
          playSound('clang');
          addGamePoints(Math.floor(score / 2));
          setGameOver(true);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          return prevY;
        }

        return newY;
      });

      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((pipe) => ({
          ...pipe,
          x: pipe.x - GAME_SPEED,
        }));

        newPipes.forEach((pipe) => {
          if (
            !pipe.scored &&
            pipe.x + PIPE_WIDTH < SCREEN_WIDTH / 2 - BIRD_SIZE / 2
          ) {
            pipe.scored = true;
            playSound('pop');
            addGamePoints(10);
            setScore((s) => {
              console.log('Score increased:', s + 1);
              return s + 1;
            });
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        });

        newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH);

        if (
          newPipes.length === 0 ||
          newPipes[newPipes.length - 1].x < SCREEN_WIDTH - 200
        ) {
          newPipes.push({
            x: SCREEN_WIDTH,
            topHeight: Math.random() * (playableHeight - PIPE_GAP - 100) + 50,
            scored: false,
          });
        }

        const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2;
        const birdRight = birdLeft + BIRD_SIZE;
        const birdTop = birdY;
        const birdBottom = birdY + BIRD_SIZE;

        for (const pipe of newPipes) {
          if (
            birdRight > pipe.x &&
            birdLeft < pipe.x + PIPE_WIDTH &&
            (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP)
          ) {
            console.log('Bird hit pipe, game over');
            playSound('clang');
            addGamePoints(Math.floor(score / 2));
            setGameOver(true);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            break;
          }
        }

        return newPipes;
      });
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, birdY, playableHeight]);

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.safeAreaTop, { height: insets.top }]} />

      <Pressable
        style={[styles.container, { height: playableHeight }]}
        onPress={jump}
      >
        <View style={styles.sky}>
          <View style={styles.skyGradient} />
        </View>

        {!gameStarted && !gameOver && (
          <View style={styles.startOverlay}>
            <Text style={styles.title}>Birdy Bounce</Text>
            <Text style={styles.instruction}>Tap to Start</Text>
          </View>
        )}

        {gameStarted && (
          <>
            <View
              style={[
                styles.bird,
                {
                  top: birdY,
                  left: SCREEN_WIDTH / 2 - BIRD_SIZE / 2,
                  transform: [
                    {
                      rotate: `${Math.min(Math.max(velocityRef.current * 3, -30), 90)}deg`,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.birdBody} />
              <View style={styles.birdWing} />
            </View>

            {pipes.map((pipe, index) => (
              <View key={index}>
                <View
                  style={[
                    styles.pipe,
                    styles.pipeTop,
                    {
                      left: pipe.x,
                      height: pipe.topHeight,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pipe,
                    styles.pipeBottom,
                    {
                      left: pipe.x,
                      top: pipe.topHeight + PIPE_GAP,
                      height: playableHeight - pipe.topHeight - PIPE_GAP,
                    },
                  ]}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{score}</Text>
            </View>
          </>
        )}

        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverCard}>
              <Text style={styles.gameOverTitle}>Game Over</Text>
              <Text style={styles.finalScore}>{score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
              <Pressable style={styles.restartButton} onPress={restartGame}>
                <Text style={styles.restartButtonText}>Play Again</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>

      <View style={[styles.ground, { height: groundHeight + insets.bottom }]}>
        <View style={styles.groundPattern} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#4ECDC4',
  },
  safeAreaTop: {
    backgroundColor: '#87CEEB',
  },
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#87CEEB',
    overflow: 'hidden',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
  },
  skyGradient: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  },
  birdBody: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    backgroundColor: '#FFD700',
    borderRadius: BIRD_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  birdWing: {
    position: 'absolute',
    right: -5,
    top: BIRD_SIZE / 3,
    width: 15,
    height: 10,
    backgroundColor: '#FFA500',
    borderRadius: 5,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
  },
  pipeTop: {
    top: 0,
    backgroundColor: '#4CAF50',
    borderBottomWidth: 4,
    borderBottomColor: '#388E3C',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: '#66BB6A',
    borderRightColor: '#2E7D32',
  },
  pipeBottom: {
    backgroundColor: '#4CAF50',
    borderTopWidth: 4,
    borderTopColor: '#388E3C',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: '#66BB6A',
    borderRightColor: '#2E7D32',
  },
  ground: {
    width: SCREEN_WIDTH,
    backgroundColor: '#8B4513',
  },
  groundPattern: {
    flex: 1,
    backgroundColor: '#D2691E',
    borderTopWidth: 4,
    borderTopColor: '#A0522D',
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  instruction: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    position: 'absolute',
    top: 40,
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
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gameOverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  restartButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
