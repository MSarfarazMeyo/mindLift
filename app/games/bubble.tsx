import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Pause, Play, Home } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 80;
const MAX_BUBBLES = 15;
const INITIAL_SPAWN_INTERVAL = 1500;
const MIN_SPAWN_INTERVAL = 800;

type BubbleType = 'normal' | 'bonus' | 'mega' | 'speed';

type Bubble = {
  id: string;
  x: number;
  y: number;
  color: string;
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
  size: number;
  type: BubbleType;
  points: number;
};

type Particle = {
  id: string;
  x: number;
  y: number;
  color: string;
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
};

const COLORS = [
  '#FF6B9D',
  '#FEC368',
  '#95E1D3',
  '#A8D8FF',
  '#C896FF',
  '#FFB6D9',
  '#B4E7CE',
  '#FFE156',
];

const BUBBLE_COLORS: Record<BubbleType, string> = {
  normal: COLORS[0],
  bonus: '#FFD700',
  mega: '#FF4500',
  speed: '#00CED1',
};

export default function BubblePopGame() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [highScore, setHighScore] = useState(0);
  const [spawnInterval, setSpawnIntervalState] = useState(
    INITIAL_SPAWN_INTERVAL,
  );
  const [bubblesPopped, setBubblesPopped] = useState(0);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);

  const bgMusic = useRef<Audio.Sound | null>(null);
  const popSound = useRef<Audio.Sound | null>(null);
  const bonusSound = useRef<Audio.Sound | null>(null);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const milestoneOpacity = useRef(new Animated.Value(0)).current;
  const scoreRef = useRef(0);

  console.log('score', score);
  console.log('highScore', highScore);

  useEffect(() => {
    // AsyncStorage.removeItem('bubble_highscore');

    loadSounds();
    loadHighScore();
    return () => {
      if (bgMusic.current) {
        bgMusic.current.unloadAsync();
      }
      if (popSound.current) {
        popSound.current.unloadAsync();
      }
      if (bonusSound.current) {
        bonusSound.current.unloadAsync();
      }
    };
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('bubble_highscore');
      if (saved) {
        setHighScore(parseInt(saved, 10));
      }
    } catch (error) {
      console.log('Error loading high score:', error);
    }
  };

  const saveHighScore = async (newScore: number) => {
    try {
      console.log('newScore', newScore);
      console.log('newScore score', score);

      await AsyncStorage.setItem('bubble_highscore', newScore.toString());
      setHighScore(newScore);
    } catch (error) {
      console.log('Error saving high score:', error);
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      spawnIntervalRef.current = setInterval(() => {
        setBubbles((prev) => {
          if (prev.length >= MAX_BUBBLES) return prev;
          return [...prev, createBubble()];
        });
      }, spawnInterval);

      gameTimer.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        if (gameTimer.current) clearInterval(gameTimer.current);
      };
    } else if (isPaused) {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      if (gameTimer.current) clearInterval(gameTimer.current);
    }
  }, [gameStarted, gameOver, isPaused, spawnInterval]);

  useEffect(() => {
    const elapsed = 60 - timeRemaining;
    let newInterval = spawnInterval;

    if (timeRemaining <= 30) {
      newInterval = Math.max(MIN_SPAWN_INTERVAL * 0.6, 500);
    } else if (elapsed > 0 && elapsed % 15 === 0) {
      newInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        INITIAL_SPAWN_INTERVAL - (elapsed / 15) * 150,
      );
    }

    if (newInterval !== spawnInterval) {
      setSpawnIntervalState(newInterval);

      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = setInterval(() => {
          setBubbles((prev) => {
            if (prev.length >= MAX_BUBBLES) return prev;
            return [...prev, createBubble()];
          });
        }, newInterval);
      }
    }
  }, [timeRemaining, gameStarted, gameOver, isPaused]);

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      const { sound: bg } = await Audio.Sound.createAsync(
        {
          uri: 'https://www.bensound.com/bensound-music/bensound-slowmotion.mp3',
        },
        { shouldPlay: false, isLooping: true, volume: 0.3 },
      );
      bgMusic.current = bg;
      console.log('Background music loaded successfully');

      const { sound: pop } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg' },
        { shouldPlay: false, volume: 0.5 },
      );
      popSound.current = pop;
      console.log('Pop sound loaded successfully');

      const { sound: bonus } = await Audio.Sound.createAsync(
        {
          uri: 'https://actions.google.com/sounds/v1/cartoon/cowbell_rattle.ogg',
        },
        { shouldPlay: false, volume: 0.6 },
      );
      bonusSound.current = bonus;
      console.log('Bonus sound loaded successfully');
    } catch (error) {
      // console.error('Error loading sounds:', error);
    }
  };

  const createBubble = (): Bubble => {
    const x = Math.random() * (SCREEN_WIDTH - BUBBLE_SIZE);
    const y = SCREEN_HEIGHT + BUBBLE_SIZE;
    let baseSize = BUBBLE_SIZE + Math.random() * 40;

    if (timeRemaining <= 30) {
      baseSize = baseSize * 0.75;
    }

    const rand = Math.random();
    let type: BubbleType;
    let size: number;
    let color: string;
    let points: number;

    if (timeRemaining <= 30) {
      if (rand < 0.03) {
        type = 'mega';
        size = baseSize * 1.5;
        color = BUBBLE_COLORS.mega;
        points = 50;
      } else if (rand < 0.1) {
        type = 'bonus';
        size = baseSize * 1.2;
        color = BUBBLE_COLORS.bonus;
        points = 30;
      } else if (rand < 0.5) {
        type = 'speed';
        size = baseSize * 0.7;
        color = BUBBLE_COLORS.speed;
        points = 20;
      } else {
        type = 'normal';
        size = baseSize;
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
        points = 10;
      }
    } else {
      if (rand < 0.05) {
        type = 'mega';
        size = baseSize * 1.5;
        color = BUBBLE_COLORS.mega;
        points = 50;
      } else if (rand < 0.15) {
        type = 'bonus';
        size = baseSize * 1.2;
        color = BUBBLE_COLORS.bonus;
        points = 30;
      } else if (rand < 0.25) {
        type = 'speed';
        size = baseSize * 0.7;
        color = BUBBLE_COLORS.speed;
        points = 20;
      } else {
        type = 'normal';
        size = baseSize;
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
        points = 10;
      }
    }

    return {
      id: Math.random().toString(),
      x,
      y,
      color,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
      size,
      type,
      points,
    };
  };

  const animateBubble = (bubble: Bubble) => {
    let speedMultiplier = bubble.type === 'speed' ? 0.6 : 1;

    if (timeRemaining <= 30) {
      speedMultiplier *= 0.5;
    }

    Animated.parallel([
      Animated.spring(bubble.scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(bubble.translateY, {
        toValue: -(SCREEN_HEIGHT + 200),
        duration: (8000 + Math.random() * 4000) * speedMultiplier,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    });
  };

  const animatedBubblesRef = useRef(new Set<string>());

  useEffect(() => {
    bubbles.forEach((bubble) => {
      if (!animatedBubblesRef.current.has(bubble.id)) {
        animatedBubblesRef.current.add(bubble.id);
        animateBubble(bubble);
      }
    });
  }, [bubbles]);

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50 + Math.random() * 30;
      const particle: Particle = {
        id: Math.random().toString(),
        x,
        y,
        color,
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
      };

      Animated.parallel([
        Animated.timing(particle.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setParticles((prev) => prev.filter((p) => p.id !== particle.id));
      });

      newParticles.push(particle);
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const showMilestoneText = (text: string) => {
    setShowMilestone(text);
    milestoneOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(milestoneOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(milestoneOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMilestone(null);
    });
  };

  const popBubble = useCallback(
    async (
      bubble: Bubble,
      currentCombo: number,
      currentBubblesPopped: number,
    ) => {
      Animated.parallel([
        Animated.spring(bubble.scale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 100,
        }),
        Animated.timing(bubble.opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      createParticles(
        bubble.x + bubble.size / 2,
        bubble.y + bubble.size / 2,
        bubble.color,
      );

      if (comboTimer.current) {
        clearTimeout(comboTimer.current);
      }

      const newCombo = currentCombo + 1;
      setCombo(newCombo);

      const comboBonus = newCombo > 1 ? (newCombo - 1) * 5 : 0;
      const earnedPoints = bubble.points + comboBonus;
      setScore((prev) => {
        const newScore = prev + earnedPoints;
        scoreRef.current = newScore;
        return newScore;
      });

      const newBubblesPopped = currentBubblesPopped + 1;
      setBubblesPopped(newBubblesPopped);

      if (newBubblesPopped === 25) {
        showMilestoneText('25 Bubbles! 🎯');
      } else if (newBubblesPopped === 50) {
        showMilestoneText('50 Bubbles! 🔥');
      } else if (newBubblesPopped === 100) {
        showMilestoneText('100 Bubbles! 💯');
      } else if (newCombo === 5) {
        showMilestoneText('5x Combo! ⚡');
      } else if (newCombo === 10) {
        showMilestoneText('10x Combo! 🌟');
      }

      comboTimer.current = setTimeout(() => {
        setCombo(0);
      }, 1000);

      const sound =
        bubble.type === 'normal' ? popSound.current : bonusSound.current;
      if (sound) {
        try {
          await sound.replayAsync();
        } catch (error) {
          console.log('Error playing sound:', error);
        }
      }

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 150);
    },
    [],
  );

  const endGame = async () => {
    setGameOver(true);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (gameTimer.current) clearInterval(gameTimer.current);

    // Use ref to get the actual current score
    const currentScore = scoreRef.current;

    // Add score as MindLift points
    const { addPoints } = useStore.getState();
    addPoints(currentScore);

    if (currentScore > highScore) {
      await saveHighScore(currentScore);
    }

    if (bgMusic.current) {
      try {
        await bgMusic.current.stopAsync();
      } catch (error) {
        console.log('Error stopping background music:', error);
      }
    }
  };

  const startGame = async () => {
    setGameStarted(true);
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setBubbles([]);
    setTimeRemaining(60);
    setBubblesPopped(0);
    setSpawnIntervalState(INITIAL_SPAWN_INTERVAL);

    if (bgMusic.current) {
      try {
        const status = await bgMusic.current.getStatusAsync();
        console.log('Music status before play:', status);

        if (status.isLoaded && !status.isPlaying) {
          await bgMusic.current.setPositionAsync(0);
          await bgMusic.current.playAsync();
          console.log('Background music started playing');
        }
      } catch (error) {
        console.error('Error playing background music:', error);
      }
    } else {
      console.warn('Background music not loaded');
    }
  };

  const restartGame = () => {
    setGameOver(false);
    setGameStarted(false);
    setIsPaused(false);
    setBubblesPopped(0);
  };

  const togglePause = async () => {
    setIsPaused((prev) => !prev);

    if (bgMusic.current) {
      try {
        if (isPaused) {
          await bgMusic.current.playAsync();
        } else {
          await bgMusic.current.pauseAsync();
        }
      } catch (error) {
        console.log('Error toggling background music:', error);
      }
    }
  };

  const goToMainMenu = async () => {
    setGameStarted(false);
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setBubbles([]);
    setTimeRemaining(60);
    setBubblesPopped(0);
    setSpawnIntervalState(INITIAL_SPAWN_INTERVAL);

    if (bgMusic.current) {
      try {
        await bgMusic.current.stopAsync();
      } catch (error) {
        console.log('Error stopping background music:', error);
      }
    }
  };

  if (!gameStarted) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton2}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.startContainer}>
          <Sparkles size={80} color="#fff" strokeWidth={2} />
          <Text style={styles.title}>Bubble Pop!</Text>
          <Text style={styles.subtitle}>Tap the bubbles to pop them</Text>
          {highScore > 0 && (
            <View style={styles.highScoreMainContainer}>
              <Text style={styles.highScoreMainLabel}>High Score</Text>
              <Text style={styles.highScoreMainValue}>{highScore}</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={startGame}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </Pressable>
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Bubble Types:</Text>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBubble,
                  { backgroundColor: BUBBLE_COLORS.normal },
                ]}
              />
              <Text style={styles.legendText}>Normal (10 pts)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBubble,
                  { backgroundColor: BUBBLE_COLORS.speed },
                ]}
              />
              <Text style={styles.legendText}>Speed (20 pts)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBubble,
                  { backgroundColor: BUBBLE_COLORS.bonus },
                ]}
              />
              <Text style={styles.legendText}>Bonus (30 pts)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendBubble,
                  { backgroundColor: BUBBLE_COLORS.mega },
                ]}
              />
              <Text style={styles.legendText}>Mega (50 pts)</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (gameOver) {
    const isNewHighScore = score > highScore && score > 0;

    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton2}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          {isNewHighScore && (
            <View style={styles.newHighScoreBadge}>
              <Text style={styles.newHighScoreText}>🏆 New High Score! 🏆</Text>
            </View>
          )}
          <View style={styles.finalScoreContainer}>
            <Text style={styles.finalScoreLabel}>Final Score</Text>
            <Text style={styles.finalScoreValue}>{score}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bubbles Popped</Text>
              <Text style={styles.statValue}>{bubblesPopped}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>High Score</Text>
              <Text style={styles.statValue}>{Math.max(score, highScore)}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.playAgainButton,
              pressed && styles.playAgainButtonPressed,
            ]}
            onPress={restartGame}
          >
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.mainMenuButton,
              pressed && styles.mainMenuButtonPressed,
            ]}
            onPress={goToMainMenu}
          >
            <Home size={24} color="#667eea" />
            <Text style={styles.mainMenuButtonText}>Main Menu</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <TouchableOpacity onPress={goToMainMenu} style={styles.backButton2}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View
          style={[
            styles.timerContainer,
            timeRemaining <= 30 && styles.timerContainerWarning,
          ]}
        >
          <Text style={styles.timerLabel}>Time</Text>
          <Text
            style={[
              styles.timerValue,
              timeRemaining <= 30 && styles.timerValueWarning,
            ]}
          >
            {Math.floor(timeRemaining / 60)}:
            {String(timeRemaining % 60).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        {combo > 1 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>Combo x{combo}!</Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.pauseButton,
          pressed && styles.pauseButtonPressed,
        ]}
        onPress={togglePause}
      >
        {isPaused ? (
          <Play size={28} color="#fff" />
        ) : (
          <Pause size={28} color="#fff" />
        )}
      </Pressable>

      {showMilestone && (
        <Animated.View
          style={[styles.milestoneContainer, { opacity: milestoneOpacity }]}
        >
          <Text style={styles.milestoneText}>{showMilestone}</Text>
        </Animated.View>
      )}

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseMenu}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <Pressable
              style={({ pressed }) => [
                styles.resumeButton,
                pressed && styles.resumeButtonPressed,
              ]}
              onPress={togglePause}
            >
              <Play size={24} color="#667eea" />
              <Text style={styles.resumeButtonText}>Resume</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.mainMenuButtonPause,
                pressed && styles.mainMenuButtonPausePressed,
              ]}
              onPress={goToMainMenu}
            >
              <Home size={24} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.mainMenuButtonPauseText}>Main Menu</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.gameArea} pointerEvents="box-none">
        {bubbles.map((bubble) => (
          <Animated.View
            key={bubble.id}
            style={[
              styles.bubbleContainer,
              {
                left: bubble.x,
                top: bubble.y,
                width: bubble.size,
                height: bubble.size,
                transform: [
                  { scale: bubble.scale },
                  { translateY: bubble.translateY },
                ],
              },
            ]}
          >
            <Pressable
              onPress={() => popBubble(bubble, combo, bubblesPopped)}
              style={styles.bubblePressable}
            >
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: bubble.color,
                    opacity: bubble.opacity,
                  },
                ]}
              >
                <View style={styles.bubbleShine} />
                {bubble.type !== 'normal' && (
                  <View style={styles.bubbleIcon}>
                    <Text style={styles.bubbleIconText}>
                      {bubble.type === 'mega'
                        ? '💥'
                        : bubble.type === 'bonus'
                          ? '⭐'
                          : '⚡'}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>
        ))}

        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  header2: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#764ba2',
  },
  backButton2: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#764ba2',
    borderRadius: 20,
    position: 'absolute',
    left: 20,
    top: 30,
    zIndex: 10,
  },
  title2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },

  subtitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingRight: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timerLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 2,
  },
  comboContainer: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#FFE156',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  comboText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  bubbleContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  bubblePressable: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleShine: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '30%',
    height: '30%',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 40,
  },
  gameOverTitle: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  finalScoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  finalScoreLabel: {
    fontSize: 20,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  finalScoreValue: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 8,
  },
  playAgainButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playAgainButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  playAgainButtonText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  mainMenuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainMenuButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  mainMenuButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  pauseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  pauseButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  pauseTitle: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#667eea',
    marginBottom: 12,
  },
  resumeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resumeButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  resumeButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  mainMenuButtonPause: {
    backgroundColor: '#667eea',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mainMenuButtonPausePressed: {
    transform: [{ scale: 0.95 }],
  },
  mainMenuButtonPauseText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  highScoreMainContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  highScoreMainLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  highScoreMainValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFD700',
    marginTop: 4,
  },
  legendContainer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
  },
  legendTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  legendText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  bubbleIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleIconText: {
    fontSize: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginTop: 4,
  },
  newHighScoreBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newHighScoreText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#667eea',
  },
  milestoneContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 50,
  },
  milestoneText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#667eea',
    textAlign: 'center',
  },
  timerContainerWarning: {
    backgroundColor: 'rgba(255, 69, 58, 0.3)',
  },
  timerValueWarning: {
    color: '#FFE156',
  },
});
