import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AntDesign, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firstLoginStorage, loginEmailStorage } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';
import { getBaseUrl } from '@/lib/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const updateLoginStreak = useStore((state) => state.updateLoginStreak);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [resendEmailLoading, setResendEmailLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const createProfile = async (user: any) => {
    const { id, email, user_metadata } = user;

    const { data, error } = await supabase.from('profiles').insert({
      id,
      email: email || '',
      username: user_metadata?.username || '',
      name: user_metadata?.name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return data;
  };

  const createAchievements = async (userId: string) => {
    const { data, error } = await supabase.from('achievements').insert({
      user_id: userId,
      total_points: 0,
      login_streak: 0,
      questions_answered: 0,
      notes_written: 0,
      goals_added: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return data;
  };

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      console.error(signInError);

      if (signInError) {
        if (
          signInError.message &&
          signInError.message.toLowerCase().includes('email not confirmed')
        ) {
          await loginEmailStorage('set', email); // Save the email for resend
          setIsEmailUnverified(true);
          throw new Error(
            'Your email is not verified. Please verify it first.',
          );
        }

        throw signInError;
      }

      if (data?.user) {
        const { user } = data;
        const { id, email, user_metadata } = user;

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single();

        if (!profile) {
          await createProfile(user);
          await createAchievements(id);
          await sendWelcomeEmail({
            to: email || '',
            name: user_metadata?.name || '',
            goals: user_metadata?.goals?.length > 0 ? user_metadata.goals : undefined,
          });
          await loginEmailStorage('remove');
        }

        updateLoginStreak();
        router.replace('/(app)/(tabs)');
        return;
      } else {
        throw new Error('Something went wrong. Please try again.');
      }
    } catch (e: any) {
      console.warn(e);

      setError(e.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendEmailLoading(true);

      const storedEmail = email || (await loginEmailStorage('get'));
      if (!storedEmail) {
        Alert.alert('Email Missing', 'Please enter your email address first.');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: storedEmail,
        options: {
          emailRedirectTo: `${getBaseUrl()}/verify-email`,
        },
      });

      if (error) throw error;

      setIsEmailUnverified(false);
      router.push('/verify-email');

      Alert.alert(
        'Success',
        'Verification email sent! Please check your inbox.',
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification email',
      );
    } finally {
      setResendEmailLoading(false);
    }
  };

  return (
    <>
      {initialLoading ? (
        <View style={styles.loaderContainer}>
          <Image
            source={require('../../assets/images/mindlift.png')}
            style={styles.logo}
          />
          <ActivityIndicator
            size="large"
            color="#3498db"
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Image
              source={require('../../assets/images/mindlift.png')}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>MINDLIFT</Text>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Continue your journey to mental wellness
            </Text>

            <View style={styles.inputContainer}>
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

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  editable={!loading}
                  accessibilityLabel="Password input field"
                />
                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>
                    {secureTextEntry ? (
                      <AntDesign name="eye" size={24} color="grey" />
                    ) : (
                      <Entypo name="eye-with-line" size={24} color="black" />
                    )}
                  </Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Login button"
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={() => router.push('/signup')}
              disabled={loading}
              accessibilityLabel="Create account button"
            >
              <Text style={styles.signUpButtonText}>Create New Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
              disabled={loading}
              accessibilityLabel="Forgot password button"
            >
              <Text style={styles.forgotPasswordText}>
                Forgot your password?
              </Text>
            </TouchableOpacity>

            {isEmailUnverified && (
              <TouchableOpacity
                disabled={resendEmailLoading}
                style={[
                  styles.button,
                  { backgroundColor: '#f39c12', marginTop: 10 },
                ]}
                onPress={handleResendVerification}
              >
                <Text style={styles.buttonText}>Resend Verification Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 16,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
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
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 20,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '40%',
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 24,
  },
  signUpButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: '#fde8e8',
    padding: 10,
    borderRadius: 8,
  },
  forgotPassword: {
    marginTop: 20,
    padding: 10,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
