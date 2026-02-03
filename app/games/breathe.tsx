import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';

type BreathingPattern = {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfterExhale?: number;
  points: number;
  colors: string[];
};

const PATTERNS: BreathingPattern[] = [
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Deep relaxation technique',
    inhale: 4,
    hold: 7,
    exhale: 8,
    points: 150,
    colors: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal breathing for focus',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4,
    points: 100,
    colors: ['#4facfe', '#00f2fe', '#43e97b'],
  },
  {
    id: 'calm',
    name: 'Calm Breathing',
    description: 'Simple and soothing',
    inhale: 4,
    hold: 0,
    exhale: 6,
    points: 200,
    colors: ['#fa709a', '#fee140', '#30cfd0'],
  },
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

export default function AnxietyCountdownGame() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(
    PATTERNS[0],
  );
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [countdown, setCountdown] = useState(selectedPattern.inhale);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'holdAfterExhale':
        return 'Hold';
    }
  };

  const animateCircle = useCallback(
    (duration: number, targetScale: number) => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: targetScale,
          duration: duration * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: targetScale > 0.5 ? 0.9 : 0.6,
          duration: duration * 1000,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scaleAnim, opacityAnim],
  );

  const nextPhase = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (phase === 'inhale') {
      if (selectedPattern.hold > 0) {
        setPhase('hold');
        setCountdown(selectedPattern.hold);
        animateCircle(selectedPattern.hold, 1);
      } else {
        setPhase('exhale');
        setCountdown(selectedPattern.exhale);
        animateCircle(selectedPattern.exhale, 0.3);
      }
    } else if (phase === 'hold') {
      setPhase('exhale');
      setCountdown(selectedPattern.exhale);
      animateCircle(selectedPattern.exhale, 0.3);
    } else if (phase === 'exhale') {
      if (
        selectedPattern.holdAfterExhale &&
        selectedPattern.holdAfterExhale > 0
      ) {
        setPhase('holdAfterExhale');
        setCountdown(selectedPattern.holdAfterExhale);
        animateCircle(selectedPattern.holdAfterExhale, 0.3);
      } else {
        const newCycleCount = completedCycles + 1;
        setCompletedCycles(newCycleCount);

        if (newCycleCount >= 4) {
          setIsActive(false);
          setPhase('inhale');
          setCountdown(selectedPattern.inhale);
          scaleAnim.setValue(0.3);
          opacityAnim.setValue(0.6);
          setShowCompletion(true);

          Animated.timing(celebrationOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        } else {
          setPhase('inhale');
          setCountdown(selectedPattern.inhale);
          animateCircle(selectedPattern.inhale, 1);
        }
      }
    } else if (phase === 'holdAfterExhale') {
      const newCycleCount = completedCycles + 1;
      setCompletedCycles(newCycleCount);

      if (newCycleCount >= 4) {
        setIsActive(false);
        setPhase('inhale');
        setCountdown(selectedPattern.inhale);
        scaleAnim.setValue(0.3);
        opacityAnim.setValue(0.6);
        setShowCompletion(true);

        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        setPhase('inhale');
        setCountdown(selectedPattern.inhale);
        animateCircle(selectedPattern.inhale, 1);
      }
    }
  }, [
    phase,
    selectedPattern,
    animateCircle,
    completedCycles,
    scaleAnim,
    opacityAnim,
    celebrationOpacity,
  ]);

  useEffect(() => {
    if (!isActive) return;

    if (countdown === 0) {
      nextPhase();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isActive, nextPhase]);

  const toggleActive = () => {
    if (!isActive) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setPhase('inhale');
      setCountdown(selectedPattern.inhale);
      animateCircle(selectedPattern.inhale, 1);
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsActive(false);
    setPhase('inhale');
    setCountdown(selectedPattern.inhale);
    setCompletedCycles(0);
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0.6);

    if (showCompletion) {
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowCompletion(false));
    }
  };

  const changePattern = (pattern: BreathingPattern) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPattern(pattern);
    setIsActive(false);
    setPhase('inhale');
    setCountdown(pattern.inhale);
    setCompletedCycles(0);
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0.6);

    if (showCompletion) {
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowCompletion(false));
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log('Setting up audio...');

        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });
        }

        console.log('Creating sound...');
        const audioUrl =
          'https://www.bensound.com/bensound-music/bensound-relaxing.mp3';

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false, isLooping: true, volume: 0.3 },
          (status) => {
            if (status.isLoaded) {
              console.log('Playback status:', {
                isPlaying: status.isPlaying,
                positionMillis: status.positionMillis,
              });
            } else if ('error' in status) {
              console.log('Sound error:', status.error);
            }
          },
        );

        soundRef.current = sound;
        console.log('Sound loaded successfully');
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        console.log('Unloading sound...');
        soundRef.current
          .unloadAsync()
          .catch((err) => console.error('Error unloading:', err));
      }
    };
  }, []);

  const toggleMusic = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!soundRef.current) {
      console.log('Sound not initialized yet');
      return;
    }

    try {
      const status = await soundRef.current.getStatusAsync();
      console.log(
        'Current sound status:',
        status.isLoaded ? 'loaded' : 'not loaded',
      );

      if (!status.isLoaded) {
        console.log('Sound not loaded - reloading...');
        const audioUrl =
          'https://www.bensound.com/bensound-music/bensound-relaxing.mp3';
        await soundRef.current.loadAsync(
          { uri: audioUrl },
          { shouldPlay: true, isLooping: true, volume: 0.3 },
        );
        setIsMusicPlaying(true);
        console.log('Sound loaded and playing');
        return;
      }

      if (status.isPlaying) {
        console.log('Pausing music...');
        await soundRef.current.pauseAsync();
        setIsMusicPlaying(false);
        console.log('Music paused successfully');
      } else {
        console.log('Playing music...');
        await soundRef.current.playAsync();
        setIsMusicPlaying(true);
        console.log('Music playing successfully');
      }
    } catch (error) {
      console.error('Error toggling music:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error message:', errMsg);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, position: 'relative' }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[
          selectedPattern.colors[0] as string,
          selectedPattern.colors[1] as string,
          selectedPattern.colors[2] as string,
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backButton2,
          { backgroundColor: selectedPattern.colors[1] },
        ]}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Breathe</Text>
        <Text style={styles.subtitle}>Find your calm</Text>
        <TouchableOpacity
          style={styles.musicButton}
          onPress={toggleMusic}
          activeOpacity={0.7}
        >
          {isMusicPlaying ? (
            <Volume2 color="#fff" size={24} />
          ) : (
            <VolumeX color="#fff" size={24} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
          <View style={styles.countdownContainer}>
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.cycleText}>
              {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={reset}
            activeOpacity={0.7}
          >
            <RotateCcw color="#fff" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={toggleActive}
            activeOpacity={0.7}
          >
            {isActive ? (
              <Pause color="#fff" size={32} fill="#fff" />
            ) : (
              <Play color="#fff" size={32} fill="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.patternsContainer}>
        <Text style={styles.patternsTitle}>Breathing Patterns</Text>
        <View style={styles.patternsList}>
          {PATTERNS.map((pattern) => (
            <TouchableOpacity
              key={pattern.id}
              style={[
                styles.patternCard,
                selectedPattern.id === pattern.id && styles.patternCardActive,
              ]}
              onPress={() => changePattern(pattern)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.patternName,
                  selectedPattern.id === pattern.id && styles.patternNameActive,
                ]}
              >
                {pattern.name}
              </Text>
              <Text
                style={[
                  styles.patternDescription,
                  selectedPattern.id === pattern.id &&
                    styles.patternDescriptionActive,
                ]}
              >
                {pattern.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showCompletion && (
        <Animated.View
          style={[styles.completionOverlay, { opacity: celebrationOpacity }]}
        >
          <View style={styles.completionCard}>
            <Text style={styles.completionEmoji}>✨</Text>
            <Text style={styles.completionTitle}>Well Done!</Text>
            <Text style={styles.completionMessage}>
              You&apos;ve completed your breathing session and earned{' '}
              {selectedPattern.points} points! Your mind and body thank you.
            </Text>
            <TouchableOpacity
              style={styles.completionButton}
              onPress={() => {
                // Add points to store
                const { addPoints } = useStore.getState();
                addPoints(selectedPattern.points);
                reset();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.completionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative' as const,
  },

  backButton2: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 10,
  },

  musicButton: {
    position: 'absolute' as const,
    top: 60,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '400',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  circleContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  breathingCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  countdownContainer: {
    alignItems: 'center',
    gap: 8,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 72,
  },
  cycleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  patternsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  patternsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  patternsList: {
    gap: 12,
  },
  patternCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  patternNameActive: {
    color: '#fff',
  },
  patternDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  patternDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  completionOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  completionMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  completionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  completionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
