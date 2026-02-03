import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

const { width } = Dimensions.get('window');

const PLANT_STAGES = [
  {
    name: 'Seed',
    image:
      'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&auto=format&fit=crop&q=80',
    entriesNeeded: 0,
  },
  {
    name: 'Sprout',
    image:
      'https://images.unsplash.com/photo-1574347635993-020cf4c52b7a?w=800&auto=format&fit=crop&q=80',
    entriesNeeded: 3,
  },
  {
    name: 'Growing Plant',
    image:
      'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=800&auto=format&fit=crop&q=80',
    entriesNeeded: 7,
  },
  {
    name: 'Flowering Plant',
    image:
      'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=800&auto=format&fit=crop&q=80',
    entriesNeeded: 12,
  },
  {
    name: 'Mature Garden',
    image:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80',
    entriesNeeded: 20,
  },
];

interface GratitudeEntry {
  id: string;
  text: string;
  date: string;
  category: string;
}

export default function GratitudeGardenScreen() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showHistory, setShowHistory] = useState(false);
  const [plantScale] = useState(new Animated.Value(1));
  const addPoints = useStore((state) => state.addPoints);

  useEffect(() => {
    // Load entries from storage or initialize with empty array
    const loadedEntries: GratitudeEntry[] = [];
    setEntries(loadedEntries);
  }, []);

  const handleAddEntry = () => {
    if (!newEntry.trim()) {
      Alert.alert('Error', 'Please enter something you are grateful for');
      return;
    }

    const entry: GratitudeEntry = {
      id: Date.now().toString(),
      text: newEntry.trim(),
      date: new Date().toISOString(),
      category: selectedCategory,
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    setNewEntry('');

    // Animate plant growing
    Animated.sequence([
      Animated.timing(plantScale, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(plantScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Award points
    const pointsEarned = 75;
    addPoints(pointsEarned);

    // Check for milestone achievements
    const currentStage = getCurrentStage(updatedEntries.length);
    const previousStage = getCurrentStage(updatedEntries.length - 1);

    if (currentStage > previousStage) {
      const stageName = PLANT_STAGES[currentStage].name;
      const bonusPoints = currentStage * 25;
      addPoints(bonusPoints);

      Alert.alert(
        'Garden Milestone! 🌱',
        `Your gratitude garden has grown to the "${stageName}" stage!\n\nYou earned ${pointsEarned + bonusPoints} points!`,
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Entry Added! 🌱',
        `Your gratitude has been planted in your garden.\n\nYou earned ${pointsEarned} points!`,
        [{ text: 'OK' }],
      );
    }
  };

  const getCurrentStage = (entryCount: number) => {
    for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
      if (entryCount >= PLANT_STAGES[i].entriesNeeded) {
        return i;
      }
    }
    return 0;
  };

  const currentStage = getCurrentStage(entries.length);
  const nextStage =
    currentStage < PLANT_STAGES.length - 1 ? currentStage + 1 : currentStage;
  const entriesForNextStage =
    currentStage < PLANT_STAGES.length - 1
      ? PLANT_STAGES[nextStage].entriesNeeded - entries.length
      : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderGardenView = () => (
    <View style={styles.gardenContainer}>
      <View style={styles.stageInfo}>
        <Text style={styles.stageName}>{PLANT_STAGES[currentStage].name}</Text>
        {entriesForNextStage > 0 && (
          <Text style={styles.stageProgress}>
            {entriesForNextStage} more entries until{' '}
            {PLANT_STAGES[nextStage].name}
          </Text>
        )}
      </View>

      <Animated.View style={{ transform: [{ scale: plantScale }] }}>
        <Image
          source={{ uri: PLANT_STAGES[currentStage].image }}
          style={styles.plantImage}
        />
      </Animated.View>

      <View style={styles.entryForm}>
        <Text style={styles.formLabel}>What are you grateful for today?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="I am grateful for..."
          value={newEntry}
          onChangeText={setNewEntry}
          multiline
          numberOfLines={4}
        />

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Category:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {['general', 'people', 'health', 'experiences', 'things'].map(
              (category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
          <Text style={styles.addButtonText}>Add to Garden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryView = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Gratitude Journal</Text>

      {entries.length === 0 ? (
        <Text style={styles.emptyText}>
          You haven't added any gratitude entries yet. Start growing your
          garden!
        </Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
              <View style={styles.entryCategoryChip}>
                <Text style={styles.entryCategoryText}>
                  {entry.category.charAt(0).toUpperCase() +
                    entry.category.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.entryText}>{entry.text}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <SafeAreaView style={styles.headerSafeArea}> */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Gratitude Garden</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showHistory && styles.activeTab]}
          onPress={() => setShowHistory(false)}
        >
          <Ionicons
            name="leaf"
            size={20}
            color={!showHistory ? '#e67e22' : '#7f8c8d'}
          />
          <Text style={[styles.tabText, !showHistory && styles.activeTabText]}>
            Garden
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, showHistory && styles.activeTab]}
          onPress={() => setShowHistory(true)}
        >
          <Ionicons
            name="book"
            size={20}
            color={showHistory ? '#e67e22' : '#7f8c8d'}
          />
          <Text style={[styles.tabText, showHistory && styles.activeTabText]}>
            Journal
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showHistory ? renderHistoryView() : renderGardenView()}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Benefits of Gratitude Practice</Text>
          <View style={styles.infoBenefit}>
            <Ionicons name="happy" size={20} color="#e67e22" />
            <Text style={styles.infoBenefitText}>
              Increases happiness and positive emotions
            </Text>
          </View>
          <View style={styles.infoBenefit}>
            <Ionicons name="heart" size={20} color="#e67e22" />
            <Text style={styles.infoBenefitText}>
              Improves physical health and sleep quality
            </Text>
          </View>
          <View style={styles.infoBenefit}>
            <Ionicons name="people" size={20} color="#e67e22" />
            <Text style={styles.infoBenefitText}>
              Enhances empathy and reduces aggression
            </Text>
          </View>
          <View style={styles.infoBenefit}>
            <Ionicons name="shield" size={20} color="#e67e22" />
            <Text style={styles.infoBenefitText}>
              Builds resilience and reduces stress
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* </SafeAreaView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e67e22',
  },
  // headerSafeArea: {
  //   backgroundColor: '#e67e22',
  // },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#e67e22',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#e67e22',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  gardenContainer: {
    padding: 20,
    alignItems: 'center',
  },
  stageInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  stageProgress: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  plantImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    marginBottom: 20,
  },
  entryForm: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#e67e22',
    borderColor: '#e67e22',
  },
  categoryText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#e67e22',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 40,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  entryCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  entryCategoryText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  entryText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBenefitText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 12,
    flex: 1,
  },
});
