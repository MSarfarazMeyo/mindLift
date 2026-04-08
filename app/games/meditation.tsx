import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useStore } from '../../lib/store';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Track = {
  id: string;
  title: string;
  duration: number;
  url: string;
};

const tracks: Track[] = [
  {
    id: '1',
    title: 'Deep Meditation',
    duration: 600,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Morning Calm',
    duration: 480,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: 'Inner Peace',
    duration: 720,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: '4',
    title: 'Tranquil Waters',
    duration: 540,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: '5',
    title: 'Zen Garden',
    duration: 660,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

export default function MeditationApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(tracks[0].duration);
  const [showTimer, setShowTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const breatheAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Persistent sound instance
  const soundRef = useRef<Audio.Sound | null>(null);
  // Mutex to prevent concurrent load/unload
  const loadLock = useRef(false);
  const isPlayingRef = useRef(false);
  const isTogglingRef = useRef(false);

  // playback status updater
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status) return;
      if ('isLoaded' in status && status.isLoaded) {
        setPosition((status.positionMillis || 0) / 1000);
        if ((status as any).didJustFinish) {
          // Add points for completing a song
          const { addPoints } = useStore.getState();
          addPoints(300);

          const nextTrack = (currentTrack + 1) % tracks.length;
          setCurrentTrack(nextTrack);
          setIsPlaying(false);
          isPlayingRef.current = false;
          setPosition(0);
        }
      } else if ('error' in status && status.error) {
        console.error('Playback status error:', status.error);
      }
    },
    [currentTrack],
  );

  // Safe load helper to avoid racing unload/load
  const safeLoad = useCallback(async <T,>(cb: () => Promise<T>) => {
    // simple spinlock
    while (loadLock.current) {
      // small delay
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 30));
    }
    loadLock.current = true;
    try {
      return await cb();
    } finally {
      loadLock.current = false;
    }
  }, []);

  const startBreathingAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnimation, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [breatheAnimation]);

  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  // Initialize audio mode and persistent sound instance
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
          });
        }

        if (!soundRef.current) {
          soundRef.current = new Audio.Sound();
          soundRef.current.setOnPlaybackStatusUpdate(
            onPlaybackStatusUpdate as any,
          );
        }

        // pre-load first track (but don't play)
        await loadTrack(currentTrack, false, 0);
      } catch (e) {
        console.error('Audio setup error', e);
      }
    };

    setup();
    startBreathingAnimation();
    startPulseAnimation();

    return () => {
      mounted = false;
      (async () => {
        try {
          if (soundRef.current) {
            await safeLoad(async () => {
              try {
                await soundRef.current?.stopAsync();
              } catch {}
              try {
                await soundRef.current?.unloadAsync();
              } catch {}
            });
          }
        } catch (e) {
          // ignore
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loadTrack with retry/backoff and downloadFirst
  const loadTrack = useCallback(
    async (index: number, autoPlay = false, retryAttempt = 0) => {
      // guard
      if (index < 0 || index >= tracks.length) return;

      await safeLoad(async () => {
        setIsLoading(true);
        const url = tracks[index].url;

        try {
          // stop existing playback if any
          if (soundRef.current) {
            try {
              const status = await soundRef.current.getStatusAsync();
              if (status.isLoaded && status.isPlaying)
                await soundRef.current.stopAsync();
            } catch (e) {
              /* ignore */
            }
            try {
              await soundRef.current.unloadAsync();
            } catch (e) {
              /* ignore */
            }
          }

          // small delay to let native side settle
          await new Promise((res) => setTimeout(res, 80));

          // load the audio file
          await soundRef.current!.loadAsync(
            { uri: url },
            { shouldPlay: autoPlay },
            true,
          );

          const status = await soundRef.current!.getStatusAsync();
          if (status.isLoaded) {
            setDuration(tracks[index].duration);
            setPosition((status.positionMillis || 0) / 1000);
            setIsLoading(false);
            if (autoPlay) {
              isPlayingRef.current = true;
              setIsPlaying(true);
            }
          } else {
            throw new Error('Sound failed to load');
          }
        } catch (err: any) {
          console.warn('loadTrack error', err);
          // detect networking/timeouts and retry a couple times with backoff
          const maxRetries = 3;
          if (retryAttempt < maxRetries) {
            const backoffMs = 500 * Math.pow(2, retryAttempt); // 500, 1000, 2000
            await new Promise((res) => setTimeout(res, backoffMs));
            return loadTrack(index, autoPlay, retryAttempt + 1);
          }

          setIsLoading(false);
          isPlayingRef.current = false;
          setIsPlaying(false);
          console.error(
            `Failed to load track after ${maxRetries} attempts`,
            err,
          );
        }
      });
    },
    [safeLoad],
  );

  // whenever currentTrack changes, load it (preserve playing intent)
  useEffect(() => {
    loadTrack(currentTrack, isPlayingRef.current).catch((e) =>
      console.error(e),
    );
  }, [currentTrack, loadTrack]);

  const handlePlayPause = useCallback(async () => {
    if (!soundRef.current || isLoading || isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        // attempt to load and play
        await loadTrack(currentTrack, true);
        isPlayingRef.current = true;
        setIsPlaying(true);
        return;
      }

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        isPlayingRef.current = false;
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        isPlayingRef.current = true;
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Error toggling playback', e);
      isPlayingRef.current = false;
      setIsPlaying(false);
    } finally {
      isTogglingRef.current = false;
    }
  }, [currentTrack, isLoading, loadTrack]);

  const handleNext = useCallback(async () => {
    if (isLoading) return;
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    setPosition(0);
    // loadTrack will run from effect
  }, [currentTrack, isLoading]);

  const handlePrevious = useCallback(async () => {
    if (isLoading) return;
    const prev = currentTrack === 0 ? tracks.length - 1 : currentTrack - 1;
    setCurrentTrack(prev);
    setPosition(0);
  }, [currentTrack, isLoading]);

  const selectTrack = useCallback(
    async (index: number) => {
      if (isLoading || index === currentTrack) return;
      setCurrentTrack(index);
      setPosition(0);
      isPlayingRef.current = false;
      setIsPlaying(false);
    },
    [currentTrack, isLoading],
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.gradientBackground}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton2}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>Meditation</Text>
              <TouchableOpacity
                onPress={() => setShowTimer(!showTimer)}
                style={styles.timerButton}
              >
                <Clock color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {showTimer && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Session Timer</Text>
                <View style={styles.timerOptions}>
                  {[5, 10, 15, 20, 30].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.timerOption,
                        timerMinutes === mins && styles.timerOptionActive,
                      ]}
                      onPress={() => setTimerMinutes(mins)}
                    >
                      <Text
                        style={[
                          styles.timerOptionText,
                          timerMinutes === mins && styles.timerOptionTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.visualizationContainer}>
              <Animated.View
                style={[
                  styles.breatheCircleOuter,
                  {
                    transform: [{ scale: breatheAnimation }],
                    opacity: breatheAnimation.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [0.3, 0.1],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.breatheCircleMiddle,
                  {
                    transform: [{ scale: breatheAnimation }],
                    opacity: breatheAnimation.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [0.5, 0.2],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.breatheCircleInner,
                  { transform: [{ scale: pulseAnimation }] },
                ]}
              />
            </View>

            <View style={styles.playerSection}>
              <Text style={styles.trackTitle}>
                {tracks[currentTrack].title}
              </Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(position / duration) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={handlePrevious}
                  style={styles.controlButton}
                >
                  <SkipBack color="#fff" size={28} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={[
                    styles.playButton,
                    isLoading && styles.playButtonDisabled,
                  ]}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isPlaying ? (
                    <Pause color="#1a1a2e" size={36} fill="#1a1a2e" />
                  ) : (
                    <Play color="#1a1a2e" size={36} fill="#1a1a2e" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNext}
                  style={styles.controlButton}
                >
                  <SkipForward color="#fff" size={28} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.trackListSection}>
              <Text style={styles.sectionTitle}>Meditation Sessions</Text>
              {tracks.map((track, index) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.trackItem,
                    currentTrack === index && styles.trackItemActive,
                  ]}
                  onPress={() => selectTrack(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trackInfo}>
                    <Text
                      style={[
                        styles.trackItemTitle,
                        currentTrack === index && styles.trackItemTitleActive,
                      ]}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackDuration}>
                      {formatTime(track.duration)}
                    </Text>
                  </View>
                  {isLoading && currentTrack === index ? (
                    <Text style={styles.sectionTitle2}>Loading...</Text>
                  ) : (
                    currentTrack === index &&
                    isPlaying && (
                      <View style={styles.playingIndicator}>
                        <View style={styles.bar} />
                        <View style={styles.bar} />
                        <View style={styles.bar} />
                      </View>
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f0f23' },
  gradientBackground: { flex: 1, backgroundColor: '#0f0f23' },

  backButton2: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#764ba2',
    borderRadius: 20,
    position: 'absolute',
    left: 20,
    top: 40,
    zIndex: 10,
  },
  container: { flex: 1, position: 'relative' as const },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 20 },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
    paddingLeft: 50,
  },
  timerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerContainer: { paddingHorizontal: 24, marginTop: 10, marginBottom: 20 },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  timerOptions: { flexDirection: 'row' as const, gap: 12 },
  timerOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timerOptionActive: {
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderColor: '#9370db',
  },
  timerOptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timerOptionTextActive: { color: '#fff' },
  visualizationContainer: {
    height: 280,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 20,
    position: 'relative' as const,
  },
  breatheCircleOuter: {
    position: 'absolute' as const,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#9370db',
  },
  breatheCircleMiddle: {
    position: 'absolute' as const,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#b19cd9',
  },
  breatheCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e6e6fa',
  },
  playerSection: { paddingHorizontal: 24, marginTop: 30 },
  trackTitle: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  progressContainer: { marginBottom: 32 },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: { height: '100%', backgroundColor: '#9370db', borderRadius: 2 },
  timeContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500' as const,
  },
  controls: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 24,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e6e6fa',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 8,
    shadowColor: '#9370db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playButtonDisabled: { opacity: 0.6 },
  trackListSection: { paddingHorizontal: 24, marginTop: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },

  sectionTitle2: {
    fontSize: 12,
    color: '#9370db',
  },
  trackItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trackItemActive: {
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    borderColor: 'rgba(147, 112, 219, 0.5)',
  },
  trackInfo: { flex: 1 },
  trackItemTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  trackItemTitleActive: { color: '#fff', fontWeight: '600' as const },
  trackDuration: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)' },
  playingIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    marginLeft: 12,
  },
  bar: { width: 3, height: 16, backgroundColor: '#9370db', borderRadius: 2 },
});
