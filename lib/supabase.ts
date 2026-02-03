import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY, EXPO_PUBLIC_SUPABASE_URL } from '@/constants/ApiUrl';

// Get the environment variables
const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a custom storage implementation for React Native
const ExpoSecureStorage = {
  getItem: async (key: any) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: any, value: any) => {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  },
  removeItem: async (key: any) => {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  }
);

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey // DANGEROUS for frontend!
);

// Handle app state changes for token refresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Export a helper function to check if a session exists
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

