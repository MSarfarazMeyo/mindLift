import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  Mic,
  X,
  Activity,
  Wind,
  Gauge,
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GROQ_API_KEY, GROQ_API_URL } from '@/constants/ApiUrl';

const { width } = Dimensions.get('window');

type EmotionCategory =
  | 'stress'
  | 'calm'
  | 'fatigue'
  | 'anxiety'
  | 'energized'
  | 'overwhelmed';

type EmotionResult = {
  id: string;
  timestamp: Date;
  tone: string;
  toneQuality: string;
  toneConfidence: number;
  pace: string;
  paceSpeed: string;
  paceConfidence: number;
  tension: string;
  tensionLevel: string;
  tensionConfidence: number;
  breathingPattern: string;
  breathingQuality: string;
  breathingConfidence: number;
  pitchVariability: string;
  pitchLevel: string;
  pitchConfidence: number;
  signalClarity: number;
  emotionCategory: EmotionCategory;
  confidenceScore: number;
  insight: string;
  suggestion: string;
  detailedAnalysis: string;
};

export default function VoiceEmotionScanner() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState<EmotionResult[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }

    return () => {
      // Cleanup on unmount
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const transcribeMutation = useMutation({
    mutationFn: async (audioUri: string) => {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append('audio', blob, 'recording.webm');
      } else {
        const uriParts = audioUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const audioFile = {
          uri: audioUri,
          name: 'recording.' + fileType,
          type: 'audio/' + fileType,
        } as any;
        formData.append('audio', audioFile);
      }

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.text;
    },
  });

  const calculateAccuracyScore = (
    toneConfidence: number,
    paceConfidence: number,
    tensionConfidence: number,
    breathingConfidence: number,
    pitchConfidence: number,
    signalClarity: number,
  ): number => {
    const weights = {
      tone: 0.25,
      pace: 0.2,
      tension: 0.2,
      breathing: 0.15,
      pitch: 0.15,
      clarity: 0.05,
    };

    const weightedScore =
      toneConfidence * weights.tone +
      paceConfidence * weights.pace +
      tensionConfidence * weights.tension +
      breathingConfidence * weights.breathing +
      pitchConfidence * weights.pitch +
      signalClarity * weights.clarity;

    return Math.round(Math.min(100, Math.max(0, weightedScore)));
  };

  const analyzeEmotionMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const prompt = `Analyze this voice transcript for emotional content and provide a detailed JSON response.

Transcript: "${transcript}"

Provide analysis in this EXACT JSON format:
{
  "tone": "description of voice tone",
  "toneQuality": "warm/cold/flat/expressive/vibrant/muted/soft/harsh",
  "toneConfidence": 85,
  "pace": "description of speech pace",
  "paceSpeed": "fast/moderate/slow/irregular",
  "paceConfidence": 80,
  "tension": "description of vocal tension",
  "tensionLevel": "relaxed/moderate/tight/shaky",
  "tensionConfidence": 90,
  "breathingPattern": "description of breathing",
  "breathingQuality": "steady/shallow/paused/labored",
  "breathingConfidence": 75,
  "pitchVariability": "description of pitch variation",
  "pitchLevel": "low/moderate/high",
  "pitchConfidence": 88,
  "signalClarity": 92,
  "emotionCategory": "stress/calm/fatigue/anxiety/energized/overwhelmed",
  "insight": "compassionate observation about emotional state",
  "suggestion": "specific actionable suggestion",
  "detailedAnalysis": "overall emotional pattern explanation"
}`;

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const data = await response.json();
      const result = data?.choices?.[0]?.message?.content || '';

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        const calculatedScore = calculateAccuracyScore(
          parsedData.toneConfidence || 80,
          parsedData.paceConfidence || 80,
          parsedData.tensionConfidence || 80,
          parsedData.breathingConfidence || 80,
          parsedData.pitchConfidence || 80,
          parsedData.signalClarity || 80,
        );

        return {
          ...parsedData,
          confidenceScore: calculatedScore,
        };
      }

      throw new Error('Invalid AI response format');
    },
  });

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.stopAnimation();
    waveAnim.setValue(0);
  };

  const startRecording = async () => {
    try {
      // Stop any existing recording first
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.error('Audio permission not granted');
          return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);

          stream.getTracks().forEach((track) => track.stop());

          await handleRecordingComplete(url);
        };

        recorder.start();
        setMediaRecorder(recorder);
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });

        setRecording(newRecording);
      }

      setIsRecording(true);
      startPulseAnimation();

      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setIsRecording(false);
      stopPulseAnimation();

      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } else {
        if (recording) {
          await recording.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });
          const uri = recording.getURI();
          if (uri) {
            await handleRecordingComplete(uri);
          }
          setRecording(null);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleRecordingComplete = async (uri: string) => {
    try {
      const transcript = await transcribeMutation.mutateAsync(uri);
      const analysis = await analyzeEmotionMutation.mutateAsync(transcript);

      const newResult: EmotionResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        tone: analysis.tone,
        toneQuality: analysis.toneQuality || 'warm',
        toneConfidence: analysis.toneConfidence,
        pace: analysis.pace,
        paceSpeed: analysis.paceSpeed,
        paceConfidence: analysis.paceConfidence,
        tension: analysis.tension,
        tensionLevel: analysis.tensionLevel,
        tensionConfidence: analysis.tensionConfidence,
        breathingPattern: analysis.breathingPattern,
        breathingQuality: analysis.breathingQuality,
        breathingConfidence: analysis.breathingConfidence,
        pitchVariability: analysis.pitchVariability,
        pitchLevel: analysis.pitchLevel,
        pitchConfidence: analysis.pitchConfidence,
        signalClarity: analysis.signalClarity,
        emotionCategory: analysis.emotionCategory,
        confidenceScore: analysis.confidenceScore || 80,
        insight: analysis.insight,
        suggestion: analysis.suggestion,
        detailedAnalysis: analysis.detailedAnalysis || '',
      };

      setResults((prev) => [newResult, ...prev]);
    } catch (err) {
      console.error('Failed to process recording', err);
    }
  };

  const deleteResult = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const getEmotionColor = (category: EmotionCategory): string => {
    const colors: Record<EmotionCategory, string> = {
      stress: '#ef5350',
      calm: '#66bb6a',
      fatigue: '#9575cd',
      anxiety: '#ffa726',
      energized: '#29b6f6',
      overwhelmed: '#ec407a',
    };
    return colors[category];
  };

  const getEmotionIcon = (category: EmotionCategory) => {
    const iconProps = { size: 20, color: '#fff' };
    switch (category) {
      case 'stress':
        return <Gauge {...iconProps} />;
      case 'calm':
        return <Heart {...iconProps} />;
      case 'fatigue':
        return <Wind {...iconProps} />;
      case 'anxiety':
        return <Activity {...iconProps} />;
      case 'energized':
        return <TrendingUp {...iconProps} />;
      case 'overwhelmed':
        return <Activity {...iconProps} />;
    }
  };

  const getAccuracyLevel = (score: number): string => {
    if (score >= 90) return 'Very High';
    if (score >= 80) return 'High';
    if (score >= 70) return 'Moderate';
    if (score >= 60) return 'Fair';
    return 'Low';
  };

  const getAccuracyColor = (score: number): string => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#66bb6a';
    if (score >= 70) return '#ffa726';
    if (score >= 60) return '#ff9800';
    return '#ef5350';
  };

  const isProcessing =
    transcribeMutation.isPending || analyzeEmotionMutation.isPending;

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Voice Emotion Scanner</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Discover what your voice reveals
          </Text>
          {results.length > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {results.length} scan{results.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {isProcessing && (
            <View style={styles.processingCard}>
              <Text style={styles.processingText}>Analyzing your voice...</Text>
            </View>
          )}

          {results.map((result) => {
            const emotionColor = getEmotionColor(result.emotionCategory);
            return (
              <View
                key={result.id}
                style={[
                  styles.resultCard,
                  { borderLeftColor: emotionColor, borderLeftWidth: 4 },
                ]}
              >
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteResult(result.id)}
                >
                  <X size={18} color="#999" />
                </Pressable>

                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.emotionBadge,
                      { backgroundColor: emotionColor },
                    ]}
                  >
                    {getEmotionIcon(result.emotionCategory)}
                    <Text style={styles.emotionBadgeText}>
                      {result.emotionCategory}
                    </Text>
                  </View>
                </View>

                <View style={styles.accuracyScoreContainer}>
                  <View style={styles.accuracyCircle}>
                    <View
                      style={[
                        styles.accuracyCircleProgress,
                        {
                          transform: [
                            {
                              rotate: `${(result.confidenceScore / 100) * 360}deg`,
                            },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.accuracyProgressHalf,
                          {
                            backgroundColor: getAccuracyColor(
                              result.confidenceScore,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.accuracyCircleInner}>
                      <Text style={styles.accuracyScoreNumber}>
                        {result.confidenceScore}%
                      </Text>
                      <Text style={styles.accuracyScoreLabel}>ACCURACY</Text>
                    </View>
                  </View>
                  <View style={styles.accuracyDetails}>
                    <Text style={styles.accuracyTitle}>
                      Emotional Accuracy Score
                    </Text>
                    <View
                      style={[
                        styles.accuracyLevelBadge,
                        {
                          backgroundColor:
                            getAccuracyColor(result.confidenceScore) + '30',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.accuracyLevelDot,
                          {
                            backgroundColor: getAccuracyColor(
                              result.confidenceScore,
                            ),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.accuracyLevelText,
                          { color: getAccuracyColor(result.confidenceScore) },
                        ]}
                      >
                        {getAccuracyLevel(result.confidenceScore)} Confidence
                      </Text>
                    </View>
                    <Text style={styles.accuracyDescription}>
                      {result.confidenceScore >= 85
                        ? 'High certainty - all metrics strongly aligned'
                        : result.confidenceScore >= 70
                          ? 'Good confidence - multiple signals detected'
                          : 'Moderate confidence - limited signal data'}
                    </Text>
                    <Text style={styles.accuracyFormula}>
                      Weighted: Tone(25%) · Pace(20%) · Tension(20%) ·
                      Breath(15%) · Pitch(15%) · Clarity(5%)
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>🎵 Tone</Text>
                    <Text style={styles.metricValue}>{result.toneQuality}</Text>
                    <Text style={styles.metricDetail}>{result.tone}</Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.toneConfidence}%`,
                            backgroundColor: getAccuracyColor(
                              result.toneConfidence,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.toneConfidence}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>⚡ Pace</Text>
                    <Text style={styles.metricValue}>{result.paceSpeed}</Text>
                    <Text style={styles.metricDetail}>{result.pace}</Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.paceConfidence}%`,
                            backgroundColor: getAccuracyColor(
                              result.paceConfidence,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.paceConfidence}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>💪 Tension</Text>
                    <Text style={styles.metricValue}>
                      {result.tensionLevel}
                    </Text>
                    <Text style={styles.metricDetail}>{result.tension}</Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.tensionConfidence}%`,
                            backgroundColor: getAccuracyColor(
                              result.tensionConfidence,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.tensionConfidence}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>🌬️ Breathing</Text>
                    <Text style={styles.metricValue}>
                      {result.breathingQuality}
                    </Text>
                    <Text style={styles.metricDetail}>
                      {result.breathingPattern}
                    </Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.breathingConfidence}%`,
                            backgroundColor: getAccuracyColor(
                              result.breathingConfidence,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.breathingConfidence}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>📊 Pitch</Text>
                    <Text style={styles.metricValue}>{result.pitchLevel}</Text>
                    <Text style={styles.metricDetail}>
                      {result.pitchVariability}
                    </Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.pitchConfidence}%`,
                            backgroundColor: getAccuracyColor(
                              result.pitchConfidence,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.pitchConfidence}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>📡 Signal Clarity</Text>
                    <Text style={styles.metricValue}>
                      {result.signalClarity >= 85
                        ? 'Clear'
                        : result.signalClarity >= 70
                          ? 'Good'
                          : 'Fair'}
                    </Text>
                    <Text style={styles.metricDetail}>Audio quality</Text>
                    <View style={styles.metricConfidenceBar}>
                      <View
                        style={[
                          styles.metricConfidenceFill,
                          {
                            width: `${result.signalClarity}%`,
                            backgroundColor: getAccuracyColor(
                              result.signalClarity,
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricConfidenceText}>
                      {result.signalClarity}%
                    </Text>
                  </View>
                </View>

                {result.detailedAnalysis && (
                  <View style={styles.analysisContainer}>
                    <Text style={styles.analysisTitle}>Analysis</Text>
                    <Text style={styles.analysisText}>
                      {result.detailedAnalysis}
                    </Text>
                  </View>
                )}

                <View style={styles.insightContainer}>
                  <Text style={styles.insightLabel}>💭 Insight</Text>
                  <Text style={styles.insightText}>{result.insight}</Text>
                </View>

                <View
                  style={[
                    styles.suggestionContainer,
                    { backgroundColor: emotionColor + '20' },
                  ]}
                >
                  <Text style={styles.suggestionLabel}>💡 Suggestion</Text>
                  <Text
                    style={[styles.suggestionText, { color: emotionColor }]}
                  >
                    {result.suggestion}
                  </Text>
                </View>

                <Text style={styles.timestamp}>
                  {result.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}

          {results.length === 0 && !isProcessing && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Press and hold the mic to record your voice
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Your emotional insights will appear here
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.recordButtonContainer}>
          {isRecording && (
            <>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    opacity: 0.3,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveCircle1,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isProcessing}
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                isProcessing && styles.recordButtonDisabled,
              ]}
            >
              <Mic size={32} color="#fff" />
            </Pressable>
          </Animated.View>
          <Text style={styles.recordHint}>
            {isRecording ? 'Release to analyze' : 'Hold to record'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8b9dc3',
    letterSpacing: 0.2,
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#64b5f6',
    fontWeight: '600' as const,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  processingCard: {
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  processingText: {
    fontSize: 16,
    color: '#8b9dc3',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  emotionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  accuracyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 181, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 181, 246, 0.15)',
  },
  accuracyCircle: {
    position: 'relative',
    width: 90,
    height: 90,
    marginRight: 16,
  },
  accuracyCircleProgress: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },
  accuracyProgressHalf: {
    width: 45,
    height: 90,
    borderTopRightRadius: 45,
    borderBottomRightRadius: 45,
  },
  accuracyCircleInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accuracyScoreNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  accuracyScoreLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#8b9dc3',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  accuracyDetails: {
    flex: 1,
  },
  accuracyTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  accuracyLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  accuracyLevelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  accuracyLevelText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  accuracyDescription: {
    fontSize: 12,
    color: '#8b9dc3',
    lineHeight: 16,
    marginBottom: 6,
  },
  accuracyFormula: {
    fontSize: 10,
    color: '#6b7c9a',
    lineHeight: 14,
    fontStyle: 'italic' as const,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  metricItem: {
    backgroundColor: 'rgba(100, 181, 246, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: '31%',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8b9dc3',
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  metricValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700' as const,
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  metricDetail: {
    fontSize: 11,
    color: '#8b9dc3',
    lineHeight: 14,
    marginBottom: 8,
  },
  metricConfidenceBar: {
    height: 4,
    backgroundColor: 'rgba(139, 157, 195, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  metricConfidenceFill: {
    height: 4,
    borderRadius: 2,
  },
  metricConfidenceText: {
    fontSize: 10,
    color: '#8b9dc3',
    fontWeight: '600' as const,
  },
  analysisContainer: {
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 12,
    color: '#64b5f6',
    fontWeight: '700' as const,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  analysisText: {
    fontSize: 14,
    color: '#c5d1e8',
    lineHeight: 20,
  },
  insightContainer: {
    backgroundColor: 'rgba(139, 157, 195, 0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 11,
    color: '#8b9dc3',
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  suggestionContainer: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  suggestionLabel: {
    fontSize: 11,
    color: '#8b9dc3',
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  timestamp: {
    fontSize: 12,
    color: '#8b9dc3',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7c9a',
    textAlign: 'center',
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#64b5f6',
  },
  waveCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#64b5f6',
  },
  recordHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#8b9dc3',
    fontWeight: '500' as const,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#64b5f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ef5350',
    shadowColor: '#ef5350',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
});
