import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

// Define the props for AnimatedTransition component
interface AnimatedTransitionProps {
  children: React.ReactNode;
  animationType: 'slide-up' | 'slide-down';
  delay?: number;
}

// Custom AnimatedTransition Component
const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  animationType,
  delay = 0,
}) => {
  const animatedValue = new Animated.Value(0);
  const navigation = useNavigation();

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: delay * 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  let transform: { translateY: Animated.AnimatedInterpolation<number> }[] = [];
  if (animationType === 'slide-up') {
    transform = [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ];
  } else if (animationType === 'slide-down') {
    transform = [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 0],
        }),
      },
    ];
  }

  return (
    <Animated.View style={{ opacity: animatedValue, transform }}>
      {children}
    </Animated.View>
  );
};

// Define the props for OnboardingLayout component
interface OnboardingLayoutProps {
  children: React.ReactNode;
}

// Custom OnboardingLayout Component
const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return <View style={styles.onboardingLayout}>{children}</View>;
};

// Define the props for ProgressDots component
interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

// Custom ProgressDots Component
const ProgressDots: React.FC<ProgressDotsProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <View style={styles.progressDotsContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep - 1 && styles.activeProgressDot,
          ]}
        />
      ))}
    </View>
  );
};

// Define the props for FeatureCard component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

// Custom FeatureCard Component
const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay,
}) => {
  return (
    <AnimatedTransition animationType="slide-up" delay={delay}>
      <View style={styles.featureCard}>
        <View style={styles.featureIcon}>{icon}</View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </AnimatedTransition>
  );
};

// Main Features Component
const Features: React.FC = () => {
  const navigation = useNavigation();

  return (
    <OnboardingLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <AnimatedTransition animationType="slide-down">
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="gray" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.backButtonText}></Text>

          </View>
        </AnimatedTransition>

        <View style={styles.content}>
          <AnimatedTransition animationType="slide-up">
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>Step 1 of 4</Text>
            </View>
          </AnimatedTransition>

          <AnimatedTransition animationType="slide-up" delay={0.1}>
            <Text style={styles.title}>Discover MindLift's Features</Text>
          </AnimatedTransition>

          <AnimatedTransition animationType="slide-up" delay={0.2}>
            <Text style={styles.description}>
              MindLift AI offers a suite of tools designed to support your mental
              health journey. Here's how we can help you.
            </Text>
          </AnimatedTransition>
        </View>

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon={<Feather name="message-square" size={24} color="black" />}
            title="Daily Supportive Messages"
            description="Receive personalized messages that provide encouragement, inspiration, and practical mental health tips tailored to your needs."
            delay={0.2}
          />

          <FeatureCard
            icon={<Feather name="edit" size={24} color="black" />}
            title="Guided Journaling"
            description="Express your thoughts with prompts designed by mental health professionals to promote reflection and emotional processing."
            delay={0.3}
          />

          <FeatureCard
            icon={<FontAwesome name="bar-chart" size={24} color="black" />}
            title="Mood Tracking"
            description="Monitor your emotional patterns over time with our intuitive mood tracking tool, helping you identify triggers and improvements."
            delay={0.4}
          />

          <FeatureCard
            icon={<Ionicons name="sparkles" size={24} color="black" />}
            title="Interactive Activities"
            description="Engage with therapeutic games and exercises that promote mindfulness, reduce anxiety, and foster emotional resilience."
            delay={0.5}
          />
        </View>

        <AnimatedTransition animationType="slide-up" delay={0.6}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/Personalize')}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </AnimatedTransition>
      </ScrollView>
    </OnboardingLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  onboardingLayout: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 48
  },
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    color: 'gray',
  },
  progressDotsContainer: {
    flexDirection: 'row',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'lightgray',
    marginHorizontal: 4,
  },
  activeProgressDot: {
    backgroundColor: 'darkblue',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepIndicator: {
    backgroundColor: 'rgba(200, 200, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  stepText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: 'gray',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  featuresGrid: {
    width: '100%',
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    color: 'gray',
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default Features;
