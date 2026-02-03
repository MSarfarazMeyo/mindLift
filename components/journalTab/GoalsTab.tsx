

// GoalsTab.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VictoryPie } from "victory-native";
import { useStore } from "@/lib/store";

export const DAILY_GOALS: any[] = [
    {
        id: 'meditation',
        title: 'Practice Meditation',
        description: 'Take 10 minutes to meditate',
        icon: 'leaf',
        points: 30,
    },
    {
        id: 'exercise',
        title: 'Physical Exercise',
        description: '30 minutes of any physical activity',
        icon: 'fitness',
        points: 30,
    },
    {
        id: 'gratitude',
        title: 'Express Gratitude',
        description: 'Write down 3 things you are grateful for',
        icon: 'heart',
        points: 30,
    },
    {
        id: 'water',
        title: 'Stay Hydrated',
        description: 'Drink 8 glasses of water',
        icon: 'water',
        points: 30,
    },
    {
        id: 'reading',
        title: 'Mindful Reading',
        description: 'Read for 20 minutes',
        icon: 'book',
        points: 30,
    }
];
interface GoalsTabProps {
    completedGoals: (string | number)[];
    handleGoalComplete: any;
    loading: boolean
}

const GoalsTab: React.FC<GoalsTabProps> = ({
    completedGoals,
    handleGoalComplete,
    loading
}) => {


    const {
        canDoJournalAction,
    } = useStore();

    const completionPercentage =
        (completedGoals.length / DAILY_GOALS.length) * 100;




    if (!canDoJournalAction('goals')) {
        return (
            <View style={styles.questionsLockedContainer}>
                <Ionicons name="lock-closed" size={48} color="#95a5a6" />
                <Text style={styles.questionsLockedTitle}>
                    Today's goals completed!
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

            {
                loading && <ActivityIndicator
                    size="large"
                    color={'#3498db'}
                />
            }

            {/* Progress Chart */}
            <View style={styles.progressContainer}>
                <View style={styles.chartContainer}>
                    <VictoryPie
                        data={[
                            { x: "Completed", y: completedGoals.length },
                            {
                                x: "Remaining",
                                y: DAILY_GOALS.length - completedGoals.length,
                            },
                        ]}
                        width={200}
                        height={200}
                        colorScale={["#2ecc71", "#ecf0f1"]}
                        innerRadius={70}
                        labels={() => null}
                    />
                    <View style={styles.progressLabel}>
                        <Text style={styles.progressPercentage}>
                            {Math.round(completionPercentage)}%
                        </Text>
                        <Text style={styles.progressText}>Complete</Text>
                    </View>
                </View>
            </View>

            {/* Goals List */}
            <View style={styles.goalsList}>
                {DAILY_GOALS.map((goal) => (
                    <View key={goal.id} style={styles.goalCard}>
                        <View style={styles.goalContent}>
                            <View
                                style={[
                                    styles.goalIcon,
                                    completedGoals.includes(goal.id) &&
                                    styles.completedGoalIcon,
                                ]}
                            >
                                <Ionicons
                                    name={goal.icon as any}
                                    size={24}
                                    color={
                                        completedGoals.includes(goal.id)
                                            ? "#ffffff"
                                            : "#3498db"
                                    }
                                />
                            </View>
                            <View style={styles.goalInfo}>
                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                <Text style={styles.goalDescription}>
                                    {goal.description}
                                </Text>
                                <Text style={styles.goalPoints}>
                                    +{goal.points} points
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.completeButton,
                                completedGoals.includes(goal.id) &&
                                styles.completedButton,
                            ]}
                            onPress={() => handleGoalComplete(goal.id)}
                            disabled={completedGoals.includes(goal.id)}
                        >
                            {completedGoals.includes(goal.id) ? (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#ffffff"
                                />
                            ) : (
                                <Text style={styles.completeButtonText}>Complete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Completion Message */}
            {completedGoals.length === DAILY_GOALS.length && (
                <View style={styles.allCompletedContainer}>
                    <Ionicons name="trophy" size={48} color="#f1c40f" />
                    <Text style={styles.allCompletedText}>
                        Congratulations! You've completed all daily goals! 🎉
                    </Text>
                </View>
            )}
        </View>
    );
};


const styles = StyleSheet.create({

    tabContent: {
        padding: 20,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    chartContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressLabel: {
        position: 'absolute',
        alignItems: 'center',
    },
    progressPercentage: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    progressText: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    goalsList: {
        marginTop: 20,
    },
    goalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    goalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    completedGoalIcon: {
        backgroundColor: '#2ecc71',
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    goalDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    goalPoints: {
        fontSize: 12,
        color: '#3498db',
        fontWeight: 'bold',
    },
    completeButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 12,
    },
    completedButton: {
        backgroundColor: '#2ecc71',
    },
    completeButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    allCompletedContainer: {
        alignItems: 'center',
        marginTop: 30,
        backgroundColor: '#fff8e1',
        padding: 20,
        borderRadius: 15,
    },
    allCompletedText: {
        fontSize: 16,
        color: '#2c3e50',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: 'bold',
    },

    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecf9f1',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    statusText: {
        marginLeft: 8,
        color: '#27ae60',
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
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

export default GoalsTab;
