import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/constants';
import { loginEmailStorage } from '@/lib/utils';

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = await loginEmailStorage('get');
      if (storedEmail) setEmail(storedEmail);
    };
    fetchEmail();
  }, []);

  const handleReturnToLogin = async () => {
    try {
      router.replace('/(auth)/login');
    } catch (error) {
      // Fallback to router if Updates fails
      router.replace('/');
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email, // You'll need to pass this or get it from params
        options: {
          emailRedirectTo: `${getBaseUrl()}/verify-email`,
        },
      });

      if (error) throw error;

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
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mindlift.png')}
        style={styles.image}
      />

      <Ionicons name="mail" size={64} color="#3498db" style={styles.icon} />

      <Text style={styles.title}>Verify Your Email</Text>

      <Text style={styles.description}>
        We've sent a verification link to your email address. Please check your
        inbox and click the link to verify your account.
      </Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Didn't receive the email?</Text>
        <Text style={styles.infoText}>
          • Check your spam folder{'\n'}• Make sure the email address was
          entered correctly{'\n'}• Wait a few minutes and check again
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReturnToLogin}>
        <Text style={styles.buttonText}>Return to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonResend}
        onPress={handleResendVerification}
      >
        {loading ? (
          <ActivityIndicator size="small" color={'#3498db'} />
        ) : (
          <Text style={{ ...styles.buttonText, color: '#3498db' }}>
            Resend Verification Email
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginBottom: 30,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 400,
    lineHeight: 24,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  buttonResend: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
