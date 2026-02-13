import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { sendWelcomeEmail } from '../../lib/email';
import { getBaseUrl } from '../../lib/constants';
import { useStore } from '../../lib/store';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firstLoginStorage, loginEmailStorage } from '@/lib/utils';

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntryPassword, setSecureTextEntryPassword] = useState(true);
  const [secureTextEntryConfirmPassword, setSecureTextEntryConfirmPassword] =
    useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const [pushToken, setPushToken] = useState<any>(null);

  const resetStore = useStore((state) => state.reset);

  const availableGoals = [
    'Reduce Stress',
    'Improve Sleep',
    'Manage Anxiety',
    'Build Confidence',
    'Practice Mindfulness',
    'Track Mood',
    'Develop Healthy Habits',
  ];

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setPushToken(token ?? ''))
      .catch((error: any) => console.warn('expo push token error', error));
  }, []);

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!name || !username) {
      setError('Please fill in all required fields');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;

    try {
      setLoading(true);
      setError('');

      await AsyncStorage.setItem(
        'signup_data',
        JSON.stringify({
          email,
          password,
          name,
          username,
          age: age || null,
          goals: goals.length > 0 ? goals : null,
        }),
      );

      router.push('/(auth)/questions');
    } catch (e: any) {
      setError(e.message || 'An error occurred');
      Alert.alert(
        'Error',
        e.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Create Your Account</Text>
        <Text style={styles.stepDescription}>
          Start your journey to better mental health by creating an account
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            accessibilityLabel="Email input field"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntryPassword}
            editable={!loading}
            accessibilityLabel="Password input field"
          />
          <TouchableOpacity
            onPress={() => setSecureTextEntryPassword(!secureTextEntryPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>
              {secureTextEntryPassword ? (
                <AntDesign name="eye" size={24} color="grey" />
              ) : (
                <Entypo name="eye-with-line" size={24} color="black" />
              )}
            </Text>
          </TouchableOpacity>
          <Text style={styles.inputHint}>
            Must be at least 6 characters long
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#999999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextEntryConfirmPassword}
            editable={!loading}
            accessibilityLabel="Confirm password input field"
          />
          <TouchableOpacity
            onPress={() =>
              setSecureTextEntryConfirmPassword(!secureTextEntryConfirmPassword)
            }
            style={styles.eyeButton1}
          >
            <Text style={styles.eyeText}>
              {secureTextEntryConfirmPassword ? (
                <AntDesign name="eye" size={24} color="grey" />
              ) : (
                <Entypo name="eye-with-line" size={24} color="black" />
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
          accessibilityLabel="Next button"
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to login button"
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Tell Us About Yourself</Text>
      <Text style={styles.stepDescription}>
        Help us personalize your experience
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Full Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#999999"
          value={name}
          onChangeText={setName}
          editable={!loading}
          accessibilityLabel="Full name input field"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Username <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          placeholderTextColor="#999999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
          accessibilityLabel="Username input field"
        />
        <Text style={styles.inputHint}>Must be at least 3 characters long</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age (optional)"
          placeholderTextColor="#999999"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          editable={!loading}
          accessibilityLabel="Age input field"
        />
      </View>

      <View style={styles.goalsSection}>
        <Text style={styles.goalsTitle}>What are your goals?</Text>
        <Text style={styles.goalsSubtitle}>
          Select all that apply (optional)
        </Text>
        <View style={styles.goalsContainer}>
          {availableGoals.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalChip,
                goals.includes(goal) && styles.goalChipSelected,
              ]}
              onPress={() => toggleGoal(goal)}
              accessibilityLabel={`${goal} goal option`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: goals.includes(goal) }}
            >
              <Text
                style={[
                  styles.goalChipText,
                  goals.includes(goal) && styles.goalChipTextSelected,
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading}
          accessibilityLabel="Back button"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityLabel="Create account button"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressDot, step >= 1 && styles.progressDotActive]}
          >
            <Text
              style={[
                styles.progressText,
                step >= 1 && styles.progressTextActive,
              ]}
            >
              1
            </Text>
          </View>
          <View
            style={[
              styles.progressLine,
              step >= 2 && styles.progressLineActive,
            ]}
          />
          <View
            style={[styles.progressDot, step >= 2 && styles.progressDotActive]}
          >
            <Text
              style={[
                styles.progressText,
                step >= 2 && styles.progressTextActive,
              ]}
            >
              2
            </Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {step === 1 ? renderStep1() : renderStep2()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 12,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#3498db',
  },
  progressText: {
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  progressTextActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  progressLineActive: {
    backgroundColor: '#3498db',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '55%',
    transform: [{ translateY: -12 }],
  },
  eyeButton1: {
    position: 'absolute',
    right: 15,
    top: '70%',
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 24,
  },
  inputHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: '#fde8e8',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
  },
  goalsSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  goalsSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  goalChipSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  goalChipText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  goalChipTextSelected: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
});
