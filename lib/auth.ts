import { supabase } from './supabase';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom storage for Supabase session
const customStorage = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

// Initialize auth with custom storage
supabase.auth.setSession({
  access_token: '',
  refresh_token: '',
});

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await SecureStore.deleteItemAsync('supabase.auth.token');
    await AsyncStorage.removeItem('on_boarded');
    router.replace('/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
}