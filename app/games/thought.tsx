import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

interface ThoughtEntry {
  id: string;
  negativeThought: string;
  distortion: string;
  challenge: string;
  alternativeThought: string;
  date: string;
}

const DISTORTIONS = [
  {
    id: 'all-or-nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black and white categories',
    example: "If I don't do it perfectly, I've failed completely.",
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Viewing a single negative event as a never-ending pattern',
    example: "I always mess things up. I'll never get it right.",
  },
  {
    id: 'mental-filter',
    name: 'Mental Filter',
    description: 'Focusing exclusively on negative elements',
    example: 'My presentation had one mistake, so it was terrible.',
  },
  {
    id: 'discounting-positives',
    name: 'Discounting the Positive',
    description: 'Rejecting positive experiences',
    example: "That compliment doesn't count, they're just being nice.",
  },
  {
    id: 'jumping-conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without facts',
    example: "They didn't text back, they must be mad at me.",
  },
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting disaster; magnifying problems',
    example: 'If I fail this test, my whole future is ruined.',
  },
];

export default function ThoughtChallengerScreen() {
  const [step, setStep] = useState(1);
  const [negativeThought, setNegativeThought] = useState('');
  const [selectedDistortion, setSelectedDistortion] = useState<string | null>(
    null,
  );
  const [challenge, setChallenge] = useState('');
  const [alternativeThought, setAlternativeThought] = useState('');
  const [entries, setEntries] = useState<ThoughtEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const addPoints = useStore((state) => state.addPoints);

  const handleNext = () => {
    if (step === 1) {
      if (!negativeThought.trim()) {
        Alert.alert('Error', 'Please enter your negative thought');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedDistortion) {
        Alert.alert('Error', 'Please select a cognitive distortion');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!challenge.trim()) {
        Alert.alert('Error', 'Please enter your challenge to the thought');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (!alternativeThought.trim()) {
      Alert.alert('Error', 'Please enter an alternative thought');
      return;
    }

    const entry: ThoughtEntry = {
      id: Date.now().toString(),
      negativeThought,
      distortion: selectedDistortion || '',
      challenge,
      alternativeThought,
      date: new Date().toISOString(),
    };

    setEntries([...entries, entry]);

    // Award points
    const pointsEarned = 100;
    addPoints(pointsEarned);

    Alert.alert(
      'Great Job! 🎉',
      `You've successfully challenged a negative thought!\n\nYou earned ${pointsEarned} points!`,
      [
        {
          text: 'Challenge Another Thought',
          onPress: resetForm,
        },
        {
          text: 'View History',
          onPress: () => {
            resetForm();
            setShowHistory(true);
          },
        },
        {
          text: 'Back to Games',
          onPress: () => router.back(),
        },
      ],
    );
  };

  const resetForm = () => {
    setStep(1);
    setNegativeThought('');
    setSelectedDistortion(null);
    setChallenge('');
    setAlternativeThought('');
    setShowHistory(false);
  };

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

  const getDistortionById = (id: string) => {
    return DISTORTIONS.find((d) => d.id === id);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        Step 1: Identify the Negative Thought
      </Text>
      <Text style={styles.stepDescription}>
        Write down the negative thought that's bothering you. Be specific about
        what you're thinking and feeling.
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter your negative thought here..."
        value={negativeThought}
        onChangeText={setNegativeThought}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.exampleText}>
        Example: "I'll never be good enough at my job. Everyone else is more
        qualified than me."
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        Step 2: Identify the Cognitive Distortion
      </Text>
      <Text style={styles.stepDescription}>
        Select the type of cognitive distortion that best describes your
        negative thought pattern.
      </Text>
      <ScrollView style={styles.distortionList}>
        {DISTORTIONS.map((distortion) => (
          <TouchableOpacity
            key={distortion.id}
            style={[
              styles.distortionCard,
              selectedDistortion === distortion.id && styles.selectedDistortion,
            ]}
            onPress={() => setSelectedDistortion(distortion.id)}
          >
            <View style={styles.distortionHeader}>
              <Text
                style={[
                  styles.distortionName,
                  selectedDistortion === distortion.id &&
                    styles.selectedDistortionText,
                ]}
              >
                {distortion.name}
              </Text>
              {selectedDistortion === distortion.id && (
                <Ionicons name="checkmark-circle" size={24} color="#9b59b6" />
              )}
            </View>
            <Text style={styles.distortionDescription}>
              {distortion.description}
            </Text>
            <Text style={styles.distortionExample}>
              Example: "{distortion.example}"
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Challenge the Thought</Text>
      <Text style={styles.stepDescription}>
        Question the evidence for your negative thought. Is it based on facts or
        feelings?
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="How can you challenge this thought?"
        value={challenge}
        onChangeText={setChallenge}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.promptsTitle}>Helpful prompts:</Text>
      <View style={styles.promptsList}>
        <Text style={styles.promptItem}>
          • What evidence contradicts this thought?
        </Text>
        <Text style={styles.promptItem}>
          • Am I confusing a thought with a fact?
        </Text>
        <Text style={styles.promptItem}>
          • Am I focusing on just the negative aspects?
        </Text>
        <Text style={styles.promptItem}>
          • Would I say this to a friend who felt this way?
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        Step 4: Create an Alternative Thought
      </Text>
      <Text style={styles.stepDescription}>
        Replace your negative thought with a more balanced and realistic
        alternative.
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Write a more balanced thought..."
        value={alternativeThought}
        onChangeText={setAlternativeThought}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.exampleText}>
        Example: "I'm still learning and growing in my role. Everyone has
        different strengths, and I bring unique value to the team."
      </Text>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Your Thought Journal</Text>

      {entries.length === 0 ? (
        <Text style={styles.emptyText}>
          You haven't challenged any thoughts yet. Start the process to build
          your thought journal!
        </Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
            <View style={styles.entrySection}>
              <Text style={styles.entrySectionTitle}>Negative Thought:</Text>
              <Text style={styles.entryText}>{entry.negativeThought}</Text>
            </View>
            <View style={styles.entrySection}>
              <Text style={styles.entrySectionTitle}>
                Cognitive Distortion:
              </Text>
              <Text style={styles.entryText}>
                {getDistortionById(entry.distortion)?.name || entry.distortion}
              </Text>
            </View>
            <View style={styles.entrySection}>
              <Text style={styles.entrySectionTitle}>Challenge:</Text>
              <Text style={styles.entryText}>{entry.challenge}</Text>
            </View>
            <View style={styles.entrySection}>
              <Text style={styles.entrySectionTitle}>Alternative Thought:</Text>
              <Text style={styles.entryText}>{entry.alternativeThought}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Thought Challenger</Text>
      </View>

      <ScrollView style={styles.content}>
        {showHistory ? (
          renderHistory()
        ) : (
          <>
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressDot,
                    s <= step && styles.activeProgressDot,
                  ]}
                />
              ))}
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </>
        )}
      </ScrollView>

      {!showHistory && (
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={20} color="#9b59b6" />
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showHistory && (
        <TouchableOpacity style={styles.newChallengeButton} onPress={resetForm}>
          <Text style={styles.newChallengeButtonText}>
            New Thought Challenge
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
    backgroundColor: '#9b59b6',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  activeProgressDot: {
    backgroundColor: '#9b59b6',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7f8c8d',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  distortionList: {
    maxHeight: 400,
  },
  distortionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDistortion: {
    borderColor: '#9b59b6',
    backgroundColor: '#f8f4fa',
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distortionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  selectedDistortionText: {
    color: '#9b59b6',
  },
  distortionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  distortionExample: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#95a5a6',
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  promptsList: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  promptItem: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backStepButtonText: {
    color: '#9b59b6',
    fontSize: 16,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  completeButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  completeButtonText: {
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
  entryDate: {
    fontSize: 14,
    color: '#9b59b6',
    marginBottom: 12,
  },
  entrySection: {
    marginBottom: 12,
  },
  entrySectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  entryText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  newChallengeButton: {
    backgroundColor: '#9b59b6',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  newChallengeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
