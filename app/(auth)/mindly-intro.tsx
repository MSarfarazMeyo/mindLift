import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressDots } from '@/components/ui-custom/ProgressDots';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { useRC } from '@/lib/revenuecat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MindlyIntro = () => {
  const router = useRouter();
  const ctx = useRC();
  const userProfile = useStore((state) => state.userProfile);

  const handleContinue = async () => {
    await AsyncStorage.setItem('on_boarded', 'true');

    router.push('/login');
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
      </View>

      <View style={styles.content}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 4 of 4</Text>
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.heartEmoji}>❤️</Text>
        </View>

        <Text style={styles.title}>Meet Mindly</Text>
        <Text style={styles.subtitle}>Your AI-Powered Companion</Text>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            Mindly isn't just a chatbot — it's your pocket therapist, self-care
            coach, and emotional support system, always ready to help you feel
            better, think clearer, and grow stronger.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#6366f1" />
            <Text style={styles.featureText}>24/7 emotional support</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={20} color="#6366f1" />
            <Text style={styles.featureText}>Personalized guidance</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
            <Text style={styles.featureText}>Safe & confidential</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Start Your Journey</Text>
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
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    color: 'gray',
  },
  content: {
    alignItems: 'center',
  },
  stepIndicator: {
    backgroundColor: 'rgba(200, 200, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  stepText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
  },
  iconContainer: {
    backgroundColor: 'rgba(230, 230, 250, 0.5)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 24,
  },
  heartEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default MindlyIntro;
