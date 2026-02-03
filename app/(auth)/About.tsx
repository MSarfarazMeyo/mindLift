import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Link, useNavigation } from '@react-navigation/native';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Brain,
  CalendarCheck,
  Heart,
  MessageSquare,
  ScrollText,
  Shield,
  Trophy,
  LucideIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { navigate } from 'expo-router/build/global-state/routing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom AnimatedTransition Component
const AnimatedTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
  animationType?: string;
}> = ({ children, delay = 0, animationType = 'fade' }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay * 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>
  );
};

// Custom OnboardingLayout Component
const OnboardingLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.onboardingLayout, { padding: 24, paddingTop: insets.top }]}
    >
      {children}
    </View>
  );
};

// Custom GlassCard Component
const GlassCard: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => {
  return <View style={[styles.glassCard, style]}>{children}</View>;
};

// FeatureItem Component
interface FeatureItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <AnimatedTransition delay={0.1} animationType="slide-up">
      <View style={styles.featureItemContainer}>
        <View style={styles.iconContainer}>
          <Icon size={24} color="#6D28D9" />
        </View>
        <View>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
      </View>
    </AnimatedTransition>
  );
};

const About = () => {
  const navigation = useNavigation();

  return (
    <OnboardingLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedTransition>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={16} color="#6D28D9" />
              <Text style={styles.backButtonText}>Back to home</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Brain size={32} color="#6D28D9" />
              <Text style={styles.title}>About MindLift</Text>
            </View>

            <View style={styles.card}>
              <AnimatedTransition delay={0.2}>
                <Text style={styles.cardText}>
                  Take charge of your mental well-being with MindLift, a unique
                  mental health app that blends support, self-care, and fun to
                  help you feel your best. Designed to guide you through your
                  mental health journey, MindLift offers a variety of engaging
                  tools to promote emotional wellness, mindfulness, and personal
                  growth.
                </Text>
              </AnimatedTransition>
            </View>
          </View>
        </AnimatedTransition>

        <AnimatedTransition delay={0.3}>
          <View style={styles.featuresContainer}>
            <View style={styles.featuresHeader}>
              <Heart size={24} color="#6D28D9" />
              <Text style={styles.featuresTitle}>Key Features</Text>
            </View>

            <View style={styles.featuresGrid}>
              <FeatureItem
                icon={MessageSquare}
                title="Supportive Messages"
                description="Receive daily positive affirmations and motivational messages to keep you grounded and inspired, helping you stay positive and motivated each day."
              />

              <FeatureItem
                icon={CalendarCheck}
                title="Mood Tracking"
                description="Track your mood and emotions over time to gain insight into your mental health patterns and better understand how different factors affect your well-being."
              />

              <FeatureItem
                icon={Brain}
                title="Interactive Mental Health Games"
                description="Enjoy fun, interactive games designed to reduce stress, enhance emotional resilience, and boost mental wellness. These games are a creative and enjoyable way to practice coping strategies and mindfulness."
              />

              <FeatureItem
                icon={ScrollText}
                title="Journal Writing"
                description="Reflect on your thoughts and feelings through journaling, creating a safe space for self-expression and emotional growth. Writing regularly can help clear your mind, reduce anxiety, and improve self-awareness."
              />

              <FeatureItem
                icon={Shield}
                title="Mental Health Resources"
                description="The app offers users a list of resources to help support their mental health."
              />

              <FeatureItem
                icon={Trophy}
                title="Earn Points and Climb the Leaderboard"
                description="Stay motivated by earning points as you complete daily tasks such as journaling, answering reflection questions, and participating in games. Track your progress and compete with other users to climb the leaderboard, turning self-care into a rewarding experience."
              />
            </View>
          </View>
        </AnimatedTransition>

        <AnimatedTransition delay={0.4}>
          <GlassCard style={styles.glassCard}>
            <Text style={styles.glassCardText}>
              <Text style={styles.boldText}>
                MindLift is your all-in-one mental health companion
              </Text>
              , empowering you to improve your emotional well-being, develop
              healthy habits, and track your progress in a fun and rewarding
              way.
            </Text>
            <Text style={styles.glassCardText}>
              Whether you're seeking daily encouragement or looking to engage in
              therapeutic activities, this app is here to support you every step
              of the way.
            </Text>
          </GlassCard>
        </AnimatedTransition>

        <AnimatedTransition delay={0.5}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.replace('/feature')}>
              <View style={styles.getStartedButton}>
                <Button>
                  <Text style={styles.buttonText}>Get Started</Text>
                </Button>
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedTransition>
      </ScrollView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  onboardingLayout: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6D28D9',
    marginLeft: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresContainer: {
    color: 'red',
    marginBottom: 24,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featuresGrid: {
    display: 'flex',
    width: 600,
    gap: 16,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '48%',
  },
  iconContainer: {
    backgroundColor: 'rgba(109, 40, 217, 0.3)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#666',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  glassCardText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '600',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  getStartedButton: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default About;
