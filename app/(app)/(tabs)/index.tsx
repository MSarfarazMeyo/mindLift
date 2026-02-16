import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../../lib/store';
import { getDailyQuote } from '../../../lib/quotes';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import Purchases from 'react-native-purchases';
import { useRC } from '@/lib/revenuecat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS: {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: '/mood' | '/journal' | '/games/breathe' | '/games/gratitude';
}[] = [
  {
    id: 'mood',
    title: 'Track Mood',
    icon: 'heart',
    color: '#e74c3c',
    route: '/mood',
  },
  {
    id: 'journal',
    title: 'Write Journal',
    icon: 'book',
    color: '#3498db',
    route: '/journal',
  },
  {
    id: 'breathe',
    title: 'Breathe',
    icon: 'water',
    color: '#2ecc71',
    route: '/games/breathe',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    icon: 'leaf',
    color: '#f1c40f',
    route: '/games/gratitude',
  },
];

const WELLNESS_TIPS = [
  {
    title: 'Morning Routine',
    description: 'Start your day with intention and mindfulness',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Mindful Movement',
    description: 'Stay active to boost your mood and energy',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Healthy Sleep',
    description: 'Improve your sleep quality for better mental health',
    image:
      'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const store = useStore();
  const ctx = useRC();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const stats = useStore((state) => state.getMoodStats());
  const userProfile = useStore((state) => state.userProfile);
  const currentRank = useStore((state) => state.getRank());
  const [selectedTip, setSelectedTip] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        store.loadUserData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    setQuote(getDailyQuote());
  }, []);

  useEffect(() => {
    if (!ctx.customerInfo) {
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    if (!ctx.isSubscriber && ctx.customerInfo) {
      router.push('/Paywall');
    }
  }, [ctx.isSubscriber, ctx.customerInfo]);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (user?.id) {
          try {
            await Purchases.logIn(user.id);
            const customerInfo = await Purchases.getCustomerInfo();
            ctx.setCustomerInfo(customerInfo);
          } catch (error) {
            console.error(error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getGreeting = () => {
    const timeOfDay = getTimeOfDay();
    return `Good ${timeOfDay}`;
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#3498db', '#2980b9']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {userProfile ? userProfile?.username : ''}
          </Text>
        </View>
        <View style={styles.rankBadge}>
          <Ionicons name="trophy" size={16} color="#fff" />
          <Text style={styles.rankText}>{currentRank}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderQuoteCard = () => (
    <View style={styles.quoteContainer}>
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        }}
        style={styles.quoteBackground}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.quoteOverlay}
      >
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>- {quote.author}</Text>
      </LinearGradient>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => router.push(action.route)}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: action.color }]}
            >
              <Ionicons name={action.icon as any} size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMoodInsights = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <View style={styles.insightsGrid}>
        <View style={styles.insightCard}>
          <Ionicons name="trending-up" size={24} color="#2ecc71" />
          <Text style={styles.insightValue}>
            {stats.positivePercentage.toFixed(0)}%
          </Text>
          <Text style={styles.insightLabel}>Positive Days</Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="flame" size={24} color="#e74c3c" />
          <Text style={styles.insightValue}>{stats.streak}</Text>
          <Text style={styles.insightLabel}>Day Streak</Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="star" size={24} color="#f1c40f" />
          <Text style={styles.insightValue}>{stats.avgMood.toFixed(1)}</Text>
          <Text style={styles.insightLabel}>Avg Mood</Text>
        </View>
      </View>
    </View>
  );

  const renderWellnessTips = () => (
    <View style={styles.tipsContainer}>
      <Text style={styles.sectionTitle}>Wellness Tips</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tipsScroll}
      >
        {WELLNESS_TIPS.map((tip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tipCard}
            onPress={() => {
              setSelectedTip(tip);
              setModalVisible(true);
            }}
          >
            <Image source={{ uri: tip.image }} style={styles.tipImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.tipOverlay}
            >
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView
      style={{ ...styles.container, paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}
      {renderQuoteCard()}
      {renderQuickActions()}
      {renderMoodInsights()}
      {renderWellnessTips()}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {selectedTip && (
              <>
                <Image
                  source={{ uri: selectedTip.image }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>{selectedTip.title}</Text>
                <Text style={styles.modalDescription}>
                  {selectedTip.description}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rankText: {
    color: '#ffffff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  quoteContainer: {
    margin: 20,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteBackground: {
    width: '100%',
    height: '100%',
  },
  quoteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 20,
  },
  quoteText: {
    color: '#ffffff',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 10,
  },
  quoteAuthor: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8,
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  insightsContainer: {
    padding: 20,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  tipsContainer: {
    padding: 20,
    paddingBottom: 70,
  },
  tipsScroll: {
    paddingRight: 20,
  },
  tipCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipImage: {
    width: '100%',
    height: '100%',
  },
  tipOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  tipTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipDescription: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
