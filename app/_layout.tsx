import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { useStore } from '@/lib/store';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { RCProvider } from '@/lib/revenuecat';
import { EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY } from '@/constants/ApiUrl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PetProvider } from '@/contexts/PetContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LeaderboardProvider } from '@/contexts/LeaderboardContext';
import { GoalsProvider } from '@/contexts/GoalsContext';
import {
  scheduleDailyReminder,
  scheduleWeeklyReport,
} from '@/lib/notifications';
import { StatusBar } from 'expo-status-bar';

if (__DEV__) {
  require('../ReactotronConfig');
}
const stripePublishableKey = EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const isDarkMode = colors.background === '#1e1e1e';
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useStore((state) => state.updateProfile);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  const [initialRoute, setInitialRoute] = useState<
    | '/welcome'
    | '/Personalize'
    | '/onboard'
    | '/feature'
    | '/About'
    | '/Paywall'
    | '/login'
    | '/verify-email'
    | '/(app)/(tabs)'
    | '/profile-setup'
    | '/leaderboard'
    | null
  >(null);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.warn(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    // Restore scheduled notifications on app startup
    if (Platform.OS !== 'web') {
      restoreNotifications();
    }

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const restoreNotifications = async () => {
    try {
      const dailyReminders = await AsyncStorage.getItem('dailyReminders');
      const weeklyReports = await AsyncStorage.getItem('weeklyReports');
      const reminderTime = await AsyncStorage.getItem('reminderTime');

      if (dailyReminders === 'true' && reminderTime) {
        const time = new Date(reminderTime);
        await scheduleDailyReminder(true, time.getHours(), time.getMinutes());
      }

      if (weeklyReports === 'true') {
        await scheduleWeeklyReport(true, 7, 19, 0);
      }
    } catch (error) {
      console.error('Error restoring notifications:', error);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log(
          'Auth state changed:',
          _event,
          session ? 'Session exists' : 'No session',
        );
        if (_event === 'SIGNED_IN') {
          checkSession();
        } else if (_event === 'SIGNED_OUT') {
          setInitialRoute('/login');
          setIsLoading(false);
        }
      },
    );

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (initialRoute && !isLoading) {
      router.replace(initialRoute);
    }
  }, [initialRoute, isLoading, router]);

  const checkSession = async () => {
    try {
      setIsLoading(true);

      const onBoarded = await AsyncStorage.getItem('on_boarded');
      if (onBoarded !== 'true') {
        setInitialRoute('/onboard');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log('No session found, redirecting to login');
        setInitialRoute('/login');
        return;
      }

      if (!session?.user?.user_metadata?.email_verified) {
        console.log('Email not verified');
        setInitialRoute('/verify-email');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('profile', profile);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      if (profile) {
        updateProfile(profile);
      }

      if (profile?.profile_completed) {
        console.log('Profile complete, going to main app');
        setInitialRoute('/(app)/(tabs)');
        return;
      }

      if (profile && !profile?.profile_completed) {
        console.log('Profile incomplete, going to profile setup');
        setInitialRoute('/profile-setup');
        return;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setError(
        'An error occurred while checking your session. Please try again.',
      );
      setInitialRoute('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (!stripePublishableKey) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Stripe configuration error: Missing publishable key
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <StripeProvider publishableKey={stripePublishableKey}>
        <View
          style={[
            styles.loadingContainer,
            isDarkMode && styles.loadingContainerDark,
          ]}
        >
          <ActivityIndicator
            size="large"
            color={isDarkMode ? '#ffffff' : '#3498db'}
          />
          <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>
            Loading MindLift...
          </Text>
        </View>
      </StripeProvider>
    );
  }

  if (error) {
    return (
      <StripeProvider publishableKey={stripePublishableKey}>
        <View
          style={[
            styles.errorContainer,
            isDarkMode && styles.errorContainerDark,
          ]}
        >
          <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              checkSession();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </StripeProvider>
    );
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <RCProvider>
        <QueryClientProvider client={queryClient}>
          <PetProvider>
            <LeaderboardProvider>
              <GoalsProvider>
                <GestureHandlerRootView>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(app)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="profile-setup"
                      options={{ headerShown: false }}
                    />
                  </Stack>
                  <Toast />
                  <StatusBar style="dark" />
                </GestureHandlerRootView>
              </GoalsProvider>
            </LeaderboardProvider>
          </PetProvider>
        </QueryClientProvider>
      </RCProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#2c3e50',
  },
  textDark: {
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
