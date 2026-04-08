import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';

const Index = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#E6E6FA', '#FFFFFF']} style={styles.gradient}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <View style={styles.mindwellTag}>
            <Icon name="heart" size={14} color="#9370DB" />
            <Text style={styles.mindwellText}>MindLift</Text>
          </View>
        </View>

        <View style={styles.animationContainer}>
          <Icon name="activity" size={40} color="#9370DB" />
          <Icon
            name="star"
            size={24}
            color="#ADD8E6"
            style={styles.sparkleIcon}
          />
        </View>

        <Text style={styles.heading}>
          Your daily companion for {'\n'}
          <Text style={styles.highlight}>mental wellbeing</Text>
        </Text>

        <Text style={styles.subHeading}>
          Enhance your mental health journey with daily supportive messages,
          journaling, mood tracking, and interactive activities designed to
          bring you peace.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              router.push('/feature');
            }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Icon name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/About')}
          >
            <Text style={styles.secondaryButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Icon name="heart" size={24} color="#9370DB" />
            </View>
            <Text style={styles.cardTitle}>Daily Support</Text>
            <Text style={styles.cardText}>
              Receive uplifting messages tailored to your needs
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Icon name="activity" size={24} color="#ADD8E6" />
            </View>
            <Text style={styles.cardTitle}>Self Reflection</Text>
            <Text style={styles.cardText}>
              Journal your thoughts and track your emotional patterns
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Icon name="star" size={24} color="#FFDAB9" />
            </View>
            <Text style={styles.cardTitle}>Interactive Tools</Text>
            <Text style={styles.cardText}>
              Engage with therapeutic activities to calm your mind
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 14,
    color: '#9370DB',
    marginRight: 10,
  },
  mindwellTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mindwellText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9370DB',
  },
  animationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sparkleIcon: {
    marginLeft: 10,
    marginTop: -20,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  highlight: {
    color: '#9370DB',
  },
  subHeading: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9370DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#9370DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: '#9370DB',
    fontSize: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  card: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default Index;
