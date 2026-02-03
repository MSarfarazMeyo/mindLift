import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, RotateCcw } from 'lucide-react-native';

interface ColorOption {
  id: string;
  rgb: string;
  name: string;
}

const generateRandomColor = (): ColorOption => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return {
    id: Math.random().toString(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    name: `rgb(${r}, ${g}, ${b})`,
  };
};

const generateColors = (count: number): ColorOption[] => {
  const colors: ColorOption[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(generateRandomColor());
  }
  return colors;
};

export default function ColorMatchGame() {
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetColor, setTargetColor] = useState<ColorOption>(generateRandomColor());
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(4);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const targetScaleAnim = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackColor, setFeedbackColor] = useState('#4ADE80');

  const startNewRound = useCallback(() => {
    const newTarget = generateRandomColor();
    setTargetColor(newTarget);
    
    const wrongColors = generateColors(difficulty - 1);
    const allColors = [...wrongColors, newTarget].sort(() => Math.random() - 0.5);
    setColorOptions(allColors);

    Animated.spring(targetScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [difficulty, targetScaleAnim]);

  useEffect(() => {
    startNewRound();
  }, [difficulty, startNewRound]);

  const showFeedback = (text: string, color: string) => {
    setFeedbackText(text);
    setFeedbackColor(color);
    feedbackOpacity.setValue(0);
    
    Animated.sequence([
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleColorPress = (color: ColorOption) => {
    if (gameOver) return;

    if (color.rgb === targetColor.rgb) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const newScore = score + 1;
      setScore(newScore);
      
      showFeedback('Perfect! 🎯', '#4ADE80');
      
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
      ]).start();

      if (newScore > 0 && newScore % 5 === 0 && difficulty < 6) {
        setDifficulty(prev => prev + 1);
      } else {
        setTimeout(() => startNewRound(), 500);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const newLives = lives - 1;
      setLives(newLives);
      
      showFeedback('Wrong! 💔', '#EF4444');
      
      Animated.sequence([
        Animated.timing(targetScaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(targetScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
      ]).start();

      if (newLives <= 0) {
        setGameOver(true);
      }
    }
  };

  const restartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setDifficulty(4);
    startNewRound();
  };

  const renderHearts = () => {
    return (
      <View style={styles.heartsContainer}>
        {[...Array(3)].map((_, i) => (
          <Heart
            key={i}
            size={28}
            color={i < lives ? '#EF4444' : '#334155'}
            fill={i < lives ? '#EF4444' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  if (gameOver) {
    return (
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          <Text style={styles.finalScore}>Final Score</Text>
          <Text style={styles.scoreNumber}>{score}</Text>
          
          <Pressable
            onPress={restartGame}
            style={({ pressed }) => [
              styles.restartButton,
              pressed && styles.restartButtonPressed,
            ]}
          >
            <RotateCcw size={24} color="#FFF" />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <Animated.View style={[styles.feedbackContainer, { opacity: feedbackOpacity }]}>
        <Text style={[styles.feedbackText, { color: feedbackColor }]}>
          {feedbackText}
        </Text>
      </Animated.View>

      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={styles.score}>{score}</Text>
        </Animated.View>
        {renderHearts()}
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.instructionText}>Match this color:</Text>
        
        <Animated.View style={{ transform: [{ scale: targetScaleAnim }] }}>
          <View
            style={[
              styles.targetColor,
              { backgroundColor: targetColor.rgb },
            ]}
          />
        </Animated.View>

        <Text style={styles.tapText}>Tap the matching color below</Text>

        <View style={styles.optionsGrid}>
          {colorOptions.map((color) => (
            <Pressable
              key={color.id}
              onPress={() => handleColorPress(color)}
              style={({ pressed }) => [
                styles.colorOption,
                { backgroundColor: color.rgb },
                pressed && styles.colorOptionPressed,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.levelText}>Level {Math.floor(score / 5) + 1}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  score: {
    fontSize: 56,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: -2,
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  targetColor: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tapText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 48,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 380,
  },
  colorOption: {
    width: 85,
    height: 85,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  colorOptionPressed: {
    transform: [{ scale: 0.95 }],
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -1,
  },
  finalScore: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: '#FFF',
    marginBottom: 48,
    letterSpacing: -3,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  restartButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  restartButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  feedbackContainer: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: '800' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
