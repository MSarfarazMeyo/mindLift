import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressDots } from '@/components/ui-custom/ProgressDots';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { useRC } from '@/lib/revenuecat';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import * as StoreReview from 'expo-store-review';
import { showError } from '@/lib/toastMessage';

const Welcome = () => {
  const ctx = useRC();

  const router = useRouter();
  const userProfile = useStore((state) => state.userProfile);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (userProfile) {
        if (userProfile?.id) {
          try {
            await Purchases.logIn(userProfile.id);

            const customerInfo = await Purchases.getCustomerInfo();

            ctx.setCustomerInfo(customerInfo);
          } catch (error) {
            console.error(error);
          }
        }

        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (user?.id) {
          try {
            await Purchases.logIn(user.id);
            const customerInfo = await Purchases.getCustomerInfo();
            ctx.setCustomerInfo(customerInfo);
          } catch (error) {
            console.error(error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const requestReview = async () => {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    } else {
      showError('Error', 'Store review not available on this device');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="gray" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <ProgressDots totalSteps={4} currentStep={3} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
          <Ionicons name="heart" size={48} color="#e0e7ff" />
        </Animated.View>

        <Text style={styles.title}>Welcome to Your MindLift Journey</Text>
        <Text style={styles.subtitle}>
          You're all set! Your personalized mental wellness experience awaits
          you. Here's what to expect:
        </Text>

        <View style={styles.card}>
          {[
            'Daily supportive messages tailored to your goals',
            'Access to guided journaling prompts',
            'Mood tracking to monitor your progress',
            'Mindfulness exercises and interactive activities',
            'Regular check-ins to adjust your experience',
          ].map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={20} color="lavender" />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerText}>
          Take a moment each day for your mental wellbeing. Your journey to
          better mental health starts now.
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/mindly-intro')}
        >
          <Text style={styles.startButtonText}>Start Your Journey</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingVertical: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    color: 'gray',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(230, 230, 250, 0.5)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 10,
    elevation: 2,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listItemText: {
    marginLeft: 10,
  },
  footerText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    marginRight: 10,
  },
});

export default Welcome;
