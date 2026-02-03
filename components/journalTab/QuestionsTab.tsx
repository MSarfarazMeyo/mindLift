// QuestionsTab.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@/lib/store";

interface QuestionsTabProps {
    questions: string[];
    ratings: any;
    questionResponses: any;
    handleQuestionRating: any;
    handleSubmitResponses: () => void;
    loading: boolean
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({
    questions,
    ratings,
    questionResponses,
    handleQuestionRating,
    handleSubmitResponses,
    loading
}) => {

    const {
        canDoJournalAction,
    } = useStore();



    if (!canDoJournalAction('questions')) {
        return (
            <View style={styles.questionsLockedContainer}>
                <Ionicons name="lock-closed" size={48} color="#95a5a6" />
                <Text style={styles.questionsLockedTitle}>
                    Questions Already Answered
                </Text>
                <Text style={styles.questionsLockedText}>
                    You've already completed today's questions. Come back tomorrow for a
                    new set of questions!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>
            <Text style={styles.questionTitle}>Daily Check-in</Text>

            {questions.map((question, index) => (
                <View key={index} style={styles.questionContainer}>
                    <Text style={styles.question}>{question}</Text>

                    <View style={styles.ratingContainer}>
                        {ratings.map((rating: any) => (
                            <TouchableOpacity
                                key={rating}
                                style={[
                                    styles.ratingButton,
                                    questionResponses[index] === rating && styles.selectedRating,
                                ]}
                                onPress={() => handleQuestionRating(index, rating)}
                            >
                                <Text
                                    style={[
                                        styles.ratingText,
                                        questionResponses[index] === rating &&
                                        styles.selectedRatingText,
                                    ]}
                                >
                                    {rating}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}

            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitResponses}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>{loading ? 'Submiting Responses...' : 'Submit Responses'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        padding: 20,
    },

    questionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    questionContainer: {
        marginBottom: 24,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    question: {
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    ratingButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedRating: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    ratingText: {
        fontSize: 14,
        color: '#2c3e50',
    },
    selectedRatingText: {
        color: '#ffffff',
    },
    submitButton: {
        backgroundColor: '#3498db',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionsLockedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    questionsLockedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 10,
    },
    questionsLockedText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 24,
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
})


export default QuestionsTab;
