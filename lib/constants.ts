import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the base URL for the current environment
export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return window.location.origin;
  }
  
  // For native platforms, use the app scheme
  const scheme = Constants.expoConfig?.scheme;
  return `${scheme}://`;
};