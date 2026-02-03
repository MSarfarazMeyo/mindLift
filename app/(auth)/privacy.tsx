import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

const Privacy = () => {
  const navigation = useNavigation();
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        Welcome to MindLift! Your privacy is important to us. This Privacy
        Policy explains how we collect, use, disclose, and protect your personal
        information when you use our app, which includes features like games,
        journals, and daily routines.
      </Text>

      <Text style={styles.subtitle}>1. Information We Collect</Text>
      <Text style={styles.text}>
        <Text style={{ fontSize: 18, fontFamily: 'bold' }}>
          Personal Information:
        </Text>{' '}
        Name, email, and other details you provide when creating an account.
        {'\n'}-
        <Text style={{ fontSize: 18, fontFamily: 'bold' }}>Usage Data: </Text>
        Interactions with games, journals, and daily routines.{'\n'}-
        <Text style={{ fontSize: 18, fontFamily: 'bold' }}>
          Device Information:
        </Text>{' '}
        Information about your device, operating system, and app version.
      </Text>

      <Text style={styles.subtitle}>2. How We Use Your Information</Text>
      <Text style={styles.text}>
        We use the collected data to improve app functionality, personalize your
        experience, send notifications (if enabled), and enhance security.
      </Text>

      <Text style={styles.subtitle}>3. Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions, feel free to contact us at: [mindlift6@gmail.com]
      </Text>
    </ScrollView>
  );
};

export default Privacy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    marginTop: 100,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
});
