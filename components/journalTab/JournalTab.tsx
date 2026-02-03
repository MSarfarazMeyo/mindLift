


// JournalTab.tsx
import { useStore } from "@/lib/store";
import { showInfo } from "@/lib/toastMessage";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

interface JournalTabProps {
    journalEntry: string;
    setJournalEntry: (text: string) => void;
    mood: string;
    setMood: (text: string) => void;
    sleep: string;
    setSleep: (text: string) => void;
    activities: string;
    setActivities: (text: string) => void;
    loading: boolean;
    handleSaveJournal: () => void;
}

const JournalTab: React.FC<JournalTabProps> = ({
    journalEntry,
    setJournalEntry,
    mood,
    setMood,
    sleep,
    setSleep,
    activities,
    setActivities,
    loading,
    handleSaveJournal,
}) => {


    const {
        canDoJournalAction,
    } = useStore();





    if (!canDoJournalAction('journal')) {
        return (
            <View style={styles.questionsLockedContainer}>
                <Ionicons name="lock-closed" size={48} color="#95a5a6" />
                <Text style={styles.questionsLockedTitle}>
                    Today's journal entry completed!
                </Text>
                <Text style={styles.questionsLockedText}>
                    Come back tomorrow for a
                    new set of challenges!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>




            <Text style={styles.label}>How are you feeling today?</Text>
            <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                value={journalEntry}
                onChangeText={setJournalEntry}
                placeholder="Write your thoughts here..."
            />

            <Text style={styles.label}>Mood</Text>
            <TextInput
                style={styles.input}
                value={mood}
                onChangeText={setMood}
                placeholder="Describe your mood"
            />

            <Text style={styles.label}>Sleep Quality</Text>
            <TextInput
                style={styles.input}
                value={sleep}
                onChangeText={setSleep}
                placeholder="How did you sleep?"
            />

            <Text style={styles.label}>Activities</Text>
            <TextInput
                style={styles.input}
                value={activities}
                onChangeText={setActivities}
                placeholder="What activities did you do today?"
            />

            <TouchableOpacity disabled={loading} style={styles.saveButton} onPress={handleSaveJournal}>
                <Text style={styles.saveButtonText}>
                    {loading ? "Saving Entry..." : "Save Entry"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({

    tabContent: {
        padding: 20,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecf9f1',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        marginVertical: 48, marginHorizontal: 24
    },
    statusText: {
        marginLeft: 8,
        color: '#27ae60',
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 16,
    },
    textArea: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        textAlignVertical: 'top',
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 16,
    },
    saveButton: {
        backgroundColor: '#3498db',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
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
})

export default JournalTab;
