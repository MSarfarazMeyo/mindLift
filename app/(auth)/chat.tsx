import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
// Groq API - Free tier with 6000 tokens/minute
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!; // Get from console.groq.com

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  isError?: boolean;
};

type ApiVersion = 'v1' | 'v1beta';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorText: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorText: (error as Error)?.message ?? 'Unknown error',
    };
  }
  componentDidCatch(error: unknown) {
    console.error('UI ErrorBoundary:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: Colors.light.text,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.light.textSecondary,
              textAlign: 'center',
            }}
          >
            {this.state.errorText}
          </Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const getInitialModel = (): { version: ApiVersion; model: string } | null => {
  if (Platform.OS === 'web') {
    try {
      const raw = (
        globalThis as unknown as { localStorage?: Storage }
      ).localStorage?.getItem('gemini_model_pref');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          version: ApiVersion;
          model: string;
        };
        if (parsed?.version && parsed?.model) return parsed;
      }
    } catch (e) {
      console.log('localStorage read model error', e);
    }
  }
  return null;
};

const saveModelPref = (pref: { version: ApiVersion; model: string }) => {
  if (Platform.OS === 'web') {
    try {
      (
        globalThis as unknown as { localStorage?: Storage }
      ).localStorage?.setItem('gemini_model_pref', JSON.stringify(pref));
    } catch (e) {
      console.log('localStorage write model error', e);
    }
  }
};

const SYSTEM_PROMPT = `You are a compassionate, professional AI mental health coach trained in Cognitive Behavioral Therapy (CBT) and evidence-based psychological methods. Your role is to help users manage stress, anxiety, and depression through supportive, therapeutic conversations.

Core Principles:
1. Active Listening & Validation: Acknowledge feelings without judgment.
2. CBT Techniques: Identify negative thoughts, challenge distortions, reframe with balanced perspectives, use Socratic questions.
3. Mindfulness & Grounding: Suggest breathing exercises, 5-4-3-2-1 grounding, and present-moment awareness when appropriate.
4. Goal Setting: Break problems into small, achievable steps and encourage action.
5. Safety First: If a user expresses suicidal thoughts or self-harm intentions, advise contacting emergency services (988 in US) or local crisis lines and a licensed professional immediately.
6. Boundaries: You support and coach, not diagnose. Encourage professional help for serious concerns.

Tone: Warm, empathetic, non-judgmental, and hopeful. Keep responses concise (2-4 sentences), ask open-ended questions, and empower the user.`;

export default function MentalHealthCoach(): React.ReactElement {
  const addChatPoints = useStore((state) => state.addChatPoints);
  const achievement = useStore((state) => state.achievement);
  const loadUserData = useStore((state) => state.loadUserData);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi there, I'm your personal mental health coach. This is a safe, judgment-free space where you can share what's on your mind. I'm here to support you using proven techniques like CBT. How are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(''); // No API key needed
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const initialModel = getInitialModel();
  const [apiVersion, setApiVersion] = useState<ApiVersion>(
    initialModel?.version ?? 'v1',
  );
  const [modelName, setModelName] = useState<string>(initialModel?.model ?? '');

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    console.log('Achievement data:', achievement);
  }, [achievement]);

  const parseGeminiText = (data: unknown): string => {
    try {
      const anyData = data as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const parts = anyData?.candidates?.[0]?.content?.parts ?? [];
      const textPart = parts.find((p) => typeof p?.text === 'string');
      const text =
        textPart?.text ??
        "I'm here to listen. Could you share a bit more about what you're experiencing?";
      return String(text);
    } catch (e) {
      console.log('Parse error', e);
      return "I'm here to listen. Could you share a bit more about what you're experiencing?";
    }
  };

  const sendRequest = async (
    messages: any[],
    signal: AbortSignal,
  ): Promise<Response> => {
    return fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal,
    });
  };

  const sendMessage = async (): Promise<void> => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setConnectionError(null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // Create conversation context
      const conversationContext = messages
        .slice(-5) // Last 5 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const chatMessages = [
        {
          role: 'system',
          content:
            'You are a compassionate mental health coach. Be supportive, empathetic, and helpful. Keep responses concise (2-3 sentences).',
        },
        ...messages.slice(-5).map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage.content,
        },
      ];

      const response = await sendRequest(chatMessages, controller.signal);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let parsed: unknown = errorText;
        try {
          parsed = JSON.parse(errorText);
        } catch {}
        console.error('API Error status:', response.status);
        console.error('API Error body:', parsed);
        if (response.status === 401 || response.status === 403) {
          setConnectionError('Service temporarily unavailable.');
        } else if (response.status === 429) {
          setConnectionError('Rate limited. Please wait and try again.');
        } else if (response.status >= 500) {
          setConnectionError('Service unavailable. Please try again later.');
        } else {
          setConnectionError('Request failed. Trying backup service...');
        }
        throw new Error(
          `API request failed: ${response.status} - ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`,
        );
      }

      const data = await response.json();
      let aiResponse = '';

      if (data?.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content.trim();
      } else {
        aiResponse =
          "I'm here to listen. Could you share a bit more about what you're experiencing?";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Award chat points after successful conversation
      try {
        await addChatPoints();
      } catch (error) {
        console.error('Error adding chat points:', error);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    } catch (error) {
      console.error('Error sending message:', error);

      // Extract actual error message
      let errorContent =
        "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";

      if (error instanceof Error) {
        const errorStr = error.message;

        // Extract quota exceeded message
        if (errorStr.includes('quota')) {
          errorContent =
            "Error: API quota exceeded. You've reached your free tier limit. Please check your billing at https://ai.google.dev/usage or try again tomorrow.";
        }
        // Extract rate limit message
        else if (errorStr.includes('429')) {
          const match = errorStr.match(/"message":"([^"]+)"/);
          if (match) {
            errorContent = `Error: ${match[1]}`;
          } else {
            errorContent =
              'Error: Rate limit exceeded. Please try again later.';
          }
        }
        // Extract other API errors
        else if (errorStr.includes('401') || errorStr.includes('403')) {
          errorContent =
            'Error: Invalid API key. Please check your Gemini API configuration.';
        } else if (errorStr.includes('404')) {
          errorContent =
            'Error: Model not found. The requested AI model is not available.';
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={['#6B7FD7', '#8B9FE8', '#F8F9FE']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={0}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingRight: 24,
              }}
            >
              <Animated.View
                style={[styles.header, { opacity: fadeAnim }]}
                testID="header"
              >
                <View style={styles.headerContent}>
                  <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.headerTitle}>Your Safe Space</Text>
                </View>

                <Text style={styles.headerSubtitle}>
                  Anonymous • Confidential • Supportive
                </Text>
              </Animated.View>

              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 10 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatTracker}>
              <View style={styles.trackerContent}>
                <Text style={styles.trackerTitle}>Daily Progress</Text>
                <Text style={styles.trackerText}>
                  {achievement?.chats_today || 0}/10 chats •{' '}
                  {achievement?.chat_points_today || 0}/1000 points
                </Text>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  index={index}
                />
              ))}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.light.primary}
                    />
                    <Text style={styles.loadingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  testID="chat-input"
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Share what's on your mind..."
                  placeholderTextColor={Colors.light.textSecondary}
                  multiline
                  maxLength={500}
                  editable={!isLoading && (achievement?.chats_today || 0) < 20}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={sendMessage}
                  testID="send-button"
                  disabled={
                    !inputText.trim() ||
                    isLoading ||
                    (achievement?.chats_today || 0) >= 20
                  }
                >
                  <Send
                    size={20}
                    color={
                      !inputText.trim() || isLoading
                        ? Colors.light.textSecondary
                        : '#FFFFFF'
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function MessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, index]);

  const isUser = message.role === 'user';

  return (
    <Animated.View
      style={[
        styles.messageBubbleContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        testID={`message-${message.role}`}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          message.isError && styles.errorBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser && styles.userMessageText,
            message.isError && styles.errorText,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' as const, color: '#FFFFFF' },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 36,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD8A8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8D5B00',
    marginBottom: 4,
  },
  bannerText: { fontSize: 13, color: '#8D5B00' },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  keyInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#FFD8A8',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.light.text,
  },
  saveKeyButton: {
    backgroundColor: '#8D5B00',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveKeyText: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 13 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 10 },
  messageBubbleContainer: { marginBottom: 16, maxWidth: '85%' },
  userMessageContainer: { alignSelf: 'flex-end' },
  aiMessageContainer: { alignSelf: 'flex-start' },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: Colors.light.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.light.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageText: { fontSize: 16, lineHeight: 22, color: Colors.light.text },
  userMessageText: { color: '#FFFFFF' },
  loadingContainer: { alignSelf: 'flex-start', marginBottom: 16 },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.aiBubble,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: Colors.light.border },
  errorBubble: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: '600' as const,
  },
  chatTracker: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
  },
  trackerContent: {
    alignItems: 'center',
  },
  trackerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  trackerText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});
