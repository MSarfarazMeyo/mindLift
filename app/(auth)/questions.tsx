import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const Questions = () => {
  const [error, setError] = useState('');
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleResponse = (questionId: number, response: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: response }));
  };

  const handleNext = () => {
    if (!responses[questions[currentQuestionIndex].id]) {
      setError('Please answer the question before proceeding.');
      setShowErrors(true);
      return;
    }
    setError('');
    setShowErrors(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      router.push('/(auth)/verify-email');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const questions = [
    {
      id: 1,
      text: 'How would you rate your overall mental well-being currently?',
      options: ['Excellent', 'Very good', 'Neutral', 'Fair', 'Poor'],
    },
    {
      id: 2,
      text: 'Have you been diagnosed with any mental health disorders?',
      options: ['Yes', 'No'],
    },
    {
      id: 3,
      text: 'Are you currently receiving treatment or therapy?',
      options: ['Yes', 'No', 'I don’t have a mental health condition'],
    },
    {
      id: 4,
      text: 'What types of mental health treatments do you prefer?',
      options: [
        'CBT',
        'Medication',
        'EMDR',
        'Psychotherapy',
        'Alternative therapies',
        'Self-help',
        'Support groups',
        'I don’t know',
      ],
    },
    {
      id: 5,
      text: 'How well do you feel you manage your emotions?',
      options: ['Excellent', 'Very good', 'Neutral', 'Fair', 'Poor'],
    },
    {
      id: 6,
      text: 'How often do you feel anxious or stressed?',
      options: ['1', '2', '3', '4', '5'],
    },
    {
      id: 7,
      text: 'How much time a day can you dedicate to your mental health?',
      options: ['No time', '5 mins', '10 mins', '30 min', '1 hour'],
    },
  ];

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <View style={styles.questionContainer}>
        <Text
          style={[
            styles.questionText,
            showErrors &&
              !responses[questions[currentQuestionIndex].id] &&
              styles.unansweredText,
          ]}
        >
          {questions[currentQuestionIndex].text}
        </Text>
        <CustomRadioButton
          options={questions[currentQuestionIndex].options}
          selected={responses[questions[currentQuestionIndex].id]}
          onSelect={(option: any) =>
            handleResponse(questions[currentQuestionIndex].id, option)
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity
            style={styles.button}
            onPress={handlePrevious}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CustomRadioButton = ({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}) => {
  return (
    <View>
      {options.map((option: any) => (
        <TouchableOpacity
          key={option}
          style={styles.radioButton}
          onPress={() => onSelect(option)}
        >
          <View style={styles.radioCircle}>
            {selected === option && <View style={styles.selectedRb} />}
          </View>
          <Text style={styles.radioText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  progressBarContainer: {
    height: 10,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'skyblue',
    borderRadius: 5,
  },
  questionContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
    fontWeight: '500',
  },
  unansweredText: {
    color: 'red',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'skyblue',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'skyblue',
  },
  radioText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: 'skyblue', // Green color for buttons
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Questions;
