import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.2;

const FOCUS_EXERCISES = [
    {
        id: 'mindful-circle',
        name: 'Mindful Circle',
        description:
            'Follow the circle with your eyes and tap when it changes color',
        duration: 60,
        points: 75,
    },
    {
        id: 'breath-count',
        name: 'Breath Counter',
        description: 'Count your breaths and tap on the specified number',
        duration: 90,
        points: 100,
    },
    {
        id: 'pattern-match',
        name: 'Pattern Matcher',
        description: 'Remember and repeat the pattern of colors shown',
        duration: 120,
        points: 150,
    },
];

export default function FocusFlowScreen() {
    const [selectedExercise, setSelectedExercise] = useState(FOCUS_EXERCISES[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(selectedExercise.duration);
    const [gameState, setGameState] = useState<any>({});
    const addPoints = useStore((state) => state.addPoints);

    // Animation values
    const circlePosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const circleColor = useRef(new Animated.Value(0)).current;
    const circleScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isPlaying) return;

        let timer: NodeJS.Timeout;
        let gameLoop: NodeJS.Timeout;

        // Start the timer
        timer = setInterval(() => {
            setTimeLeft((time) => {
                if (time <= 1) {
                    clearInterval(timer);
                    clearInterval(gameLoop);
                    handleGameEnd();
                    return 0;
                }
                return time - 1;
            });
        }, 1000);

        // Initialize game state based on selected exercise
        if (selectedExercise.id === 'mindful-circle') {
            setGameState({
                shouldTap: false,
                lastTapCorrect: null,
                correctTaps: 0,
                totalTaps: 0,
            });

            // Start circle movement
            moveCircleRandomly();

            // Change color randomly
            gameLoop = setInterval(() => {
                const shouldTap = Math.random() > 0.7;
                setGameState((prev: any) => ({
                    ...prev,
                    shouldTap,
                }));

                // Animate color change
                Animated.timing(circleColor, {
                    toValue: shouldTap ? 1 : 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }, 2000);
        } else if (selectedExercise.id === 'breath-count') {
            const targetCount = Math.floor(Math.random() * 8) + 3; // Random number between 3-10
            setGameState({
                currentCount: 0,
                targetCount,
                correctTaps: 0,
                totalRounds: 0,
            });

            // Breathing animation
            const breatheAnimation = () => {
                Animated.sequence([
                    Animated.timing(circleScale, {
                        toValue: 1.5,
                        duration: 4000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(circleScale, {
                        toValue: 1,
                        duration: 4000,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    if (isPlaying) {
                        setGameState(
                            (prev: { currentCount: number; targetCount: number }) => ({
                                ...prev,
                                currentCount: (prev.currentCount + 1) % (prev.targetCount + 1),
                            })
                        );
                        breatheAnimation();
                    }
                });
            };

            breatheAnimation();

            // Change target count periodically
            gameLoop = setInterval(() => {
                const newTargetCount = Math.floor(Math.random() * 8) + 3;
                setGameState((prev: { totalRounds: number }) => ({
                    ...prev,
                    targetCount: newTargetCount,
                    currentCount: 0,
                    totalRounds: prev.totalRounds + 1,
                }));
            }, 20000);
        } else if (selectedExercise.id === 'pattern-match') {
            // Initialize pattern game
            const generatePattern = () => {
                const length = Math.floor(Math.random() * 3) + 3; // 3-5 steps
                const pattern = Array.from({ length }, () =>
                    Math.floor(Math.random() * 4)
                );
                return pattern;
            };

            setGameState({
                pattern: generatePattern(),
                userPattern: [],
                showingPattern: true,
                currentStep: 0,
                round: 1,
                correctPatterns: 0,
            });

            // Show pattern animation
            showPattern(generatePattern());
        }

        return () => {
            clearInterval(timer);
            clearInterval(gameLoop);
        };
    }, [isPlaying, selectedExercise]);

    const moveCircleRandomly = () => {
        if (!isPlaying) return;

        const randomX = Math.random() * (width - CIRCLE_SIZE - 40) + 20;
        const randomY = Math.random() * (height - CIRCLE_SIZE - 200) + 100;

        Animated.timing(circlePosition, {
            toValue: { x: randomX, y: randomY },
            duration: 1500,
            useNativeDriver: true,
        }).start(() => {
            if (isPlaying) {
                moveCircleRandomly();
            }
        });
    };

    const showPattern = (pattern: number[]) => {
        setGameState((prev: any) => ({
            ...prev,
            showingPattern: true,
            currentStep: 0,
            userPattern: [],
        }));

        const showStep = (step: number) => {
            if (step >= pattern?.length) {
                setGameState((prev: any) => ({
                    ...prev,
                    showingPattern: false,
                }));
                return;
            }

            // Show color
            circleColor.setValue(pattern[step]);

            // Wait and then show next step
            setTimeout(() => {
                circleColor.setValue(-1); // Reset color
                setTimeout(() => {
                    showStep(step + 1);
                }, 300);
            }, 1000);
        };

        showStep(0);
    };

    const handleCircleTap = () => {
        if (!isPlaying) return;

        if (selectedExercise.id === 'mindful-circle') {
            const correct = gameState.shouldTap;

            setGameState(
                (prev: { correctTaps: string | number; totalTaps: number }) => ({
                    ...prev,
                    lastTapCorrect: correct,
                    correctTaps: Number(prev.correctTaps) + (correct ? 1 : 0),
                    totalTaps: prev.totalTaps + 1,
                })
            );

            // Visual feedback
            Animated.sequence([
                Animated.timing(circleScale, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(circleScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Update score
            if (correct) {
                setScore((s) => s + 10);
            } else {
                setScore((s) => Math.max(0, s - 5));
            }
        } else if (selectedExercise.id === 'breath-count') {
            const correct = gameState.currentCount === gameState.targetCount;

            setGameState((prev: { correctTaps: string | number }) => ({
                ...prev,
                correctTaps: Number(prev.correctTaps) + (correct ? 1 : 0),
            }));

            // Visual feedback
            Animated.sequence([
                Animated.timing(circleScale, {
                    toValue: correct ? 1.2 : 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(circleScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // Update score
            if (correct) {
                setScore((s) => s + 15);
            } else {
                setScore((s) => Math.max(0, s - 5));
            }
        } else if (selectedExercise.id === 'pattern-match') {
            if (gameState.showingPattern) return;

            const colorIndex = Math.floor(Math.random() * 4); // Simulate tapping a color
            const updatedUserPattern = [...gameState.userPattern, colorIndex];

            setGameState((prev: any) => ({
                ...prev,
                userPattern: updatedUserPattern,
            }));

            // Check if pattern is complete
            if (updatedUserPattern?.length === gameState?.pattern?.length) {
                const correct = updatedUserPattern.every(
                    (color, index) => color === gameState.pattern[index]
                );

                if (correct) {
                    setScore((s) => s + 20 * gameState?.pattern?.length);

                    // Next round with longer pattern
                    setTimeout(() => {
                        const newPattern = [
                            ...gameState.pattern,
                            Math.floor(Math.random() * 4),
                        ];
                        setGameState(
                            (prev: { round: number; correctPatterns: number }) => ({
                                ...prev,
                                pattern: newPattern,
                                round: prev.round + 1,
                                correctPatterns: prev.correctPatterns + 1,
                            })
                        );
                        showPattern(newPattern);
                    }, 1000);
                } else {
                    // Wrong pattern, try again
                    setTimeout(() => {
                        showPattern(gameState.pattern);
                    }, 1000);
                }
            }
        }
    };

    const handleGameEnd = () => {
        setIsPlaying(false);

        let finalScore = score;
        let message = '';

        if (selectedExercise.id === 'mindful-circle') {
            const accuracy =
                gameState.totalTaps > 0
                    ? Math.round((gameState.correctTaps / gameState.totalTaps) * 100)
                    : 0;

            finalScore += accuracy >= 80 ? 50 : 0; // Bonus for high accuracy

            message =
                `You correctly tapped ${gameState.correctTaps} out of ${gameState.totalTaps} times.\n` +
                `Accuracy: ${accuracy}%\n` +
                `${accuracy >= 80
                    ? 'Excellent focus! +50 bonus points'
                    : 'Keep practicing to improve your focus'
                }`;
        } else if (selectedExercise.id === 'breath-count') {
            const accuracy =
                gameState.totalRounds > 0
                    ? Math.round((gameState.correctTaps / gameState.totalRounds) * 100)
                    : 0;

            finalScore += accuracy >= 70 ? 75 : 0; // Bonus for high accuracy

            message =
                `You correctly identified ${gameState.correctTaps} breath cycles.\n` +
                `Accuracy: ${accuracy}%\n` +
                `${accuracy >= 70
                    ? 'Great mindfulness! +75 bonus points'
                    : 'Keep practicing your breath awareness'
                }`;
        } else if (selectedExercise.id === 'pattern-match') {
            const bonus = gameState.round > 3 ? (gameState.round - 3) * 25 : 0;
            finalScore += bonus;

            message =
                `You completed ${gameState.correctPatterns} pattern matches.\n` +
                `Reached round ${gameState.round}\n` +
                `${bonus > 0
                    ? `Advanced rounds bonus: +${bonus} points`
                    : 'Try to reach higher rounds for bonus points'
                }`;
        }

        // Add points to user's total
        addPoints(finalScore);

        Alert.alert(
            'Exercise Complete! 🎉',
            `Your score: ${finalScore} points\n\n${message}`,
            [
                {
                    text: 'Try Again',
                    onPress: () => {
                        setScore(0);
                        setTimeLeft(selectedExercise.duration);
                    },
                },
                {
                    text: 'Back to Games',
                    onPress: () => router.back(),
                },
            ]
        );
    };

    const handleStart = () => {
        setIsPlaying(true);
        setScore(0);
        setTimeLeft(selectedExercise.duration);
    };

    const interpolateColor = circleColor.interpolate({
        inputRange: [-1, 0, 1, 2, 3, 4],
        outputRange: [
            '#bdc3c7',
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f1c40f',
            '#9b59b6',
        ],
    });

    const renderExerciseSelector = () => (
        <View style={styles.selectorContainer}>
            <Text style={styles.sectionTitle}>Select Focus Exercise</Text>
            {FOCUS_EXERCISES.map((exercise) => (
                <TouchableOpacity
                    key={exercise.id}
                    style={[
                        styles.exerciseCard,
                        selectedExercise.id === exercise.id && styles.selectedExercise,
                    ]}
                    onPress={() => {
                        if (!isPlaying) {
                            setSelectedExercise(exercise);
                            setTimeLeft(exercise.duration);
                        }
                    }}
                    disabled={isPlaying}
                >
                    <View style={styles.exerciseHeader}>
                        <Text
                            style={[
                                styles.exerciseName,
                                selectedExercise.id === exercise.id &&
                                styles.selectedExerciseText,
                            ]}
                        >
                            {exercise.name}
                        </Text>
                        <View style={styles.exerciseDetails}>
                            <Ionicons name="time" size={14} color="#7f8c8d" />
                            <Text style={styles.exerciseTime}>{exercise.duration}s</Text>
                        </View>
                    </View>
                    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                    <Text style={styles.exercisePoints}>+{exercise.points} points</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMindfulCircle = () => (
        <View style={styles.gameContainer}>
            <Animated.View
                style={[
                    styles.circle,
                    {
                        transform: [
                            { translateX: circlePosition.x },
                            { translateY: circlePosition.y },
                            { scale: circleScale },
                        ],
                        backgroundColor: interpolateColor,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.circleButton}
                    onPress={handleCircleTap}
                    activeOpacity={0.7}
                />
            </Animated.View>

            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    {gameState.shouldTap
                        ? 'Tap now! The circle is red!'
                        : 'Watch the circle and wait for it to turn red'}
                </Text>
                {gameState.lastTapCorrect !== null && (
                    <Text
                        style={[
                            styles.feedbackText,
                            gameState.lastTapCorrect
                                ? styles.correctFeedback
                                : styles.incorrectFeedback,
                        ]}
                    >
                        {gameState.lastTapCorrect ? 'Good!' : 'Wait for red!'}
                    </Text>
                )}
            </View>
        </View>
    );

    const renderBreathCounter = () => (
        <View style={styles.gameContainer}>
            <Text style={styles.breathInstructions}>
                Follow your breath and tap when you reach {gameState.targetCount}{' '}
                breaths
            </Text>

            <Animated.View
                style={[
                    styles.breathCircle,
                    {
                        transform: [{ scale: circleScale }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.circleButton}
                    onPress={handleCircleTap}
                    activeOpacity={0.7}
                >
                    <Text style={styles.breathCountText}>{gameState.currentCount}</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.breathTarget}>
                <Text style={styles.breathTargetText}>
                    Target: {gameState.targetCount}
                </Text>
            </View>
        </View>
    );

    const renderPatternMatch = () => (
        <View style={styles.gameContainer}>
            <Text style={styles.patternInstructions}>
                {gameState.showingPattern
                    ? 'Watch the pattern...'
                    : 'Repeat the pattern by tapping the circle'}
            </Text>

            <Animated.View
                style={[
                    styles.patternCircle,
                    {
                        backgroundColor: interpolateColor,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.circleButton}
                    onPress={handleCircleTap}
                    disabled={gameState.showingPattern}
                    activeOpacity={0.7}
                />
            </Animated.View>

            <View style={styles.patternProgress}>
                <Text style={styles.patternProgressText}>
                    {gameState.showingPattern
                        ? 'Memorizing...'
                        : `${gameState?.userPattern?.length}/${gameState?.pattern?.length}`}
                </Text>
                <Text style={styles.patternRoundText}>Round {gameState.round}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Focus Flow</Text>
                {isPlaying && (
                    <View style={styles.gameStats}>
                        <Text style={styles.timeText}>{timeLeft}s</Text>
                        <Text style={styles.scoreText}>{score} pts</Text>
                    </View>
                )}
            </View>

            {!isPlaying ? (
                <ScrollView>
                    {renderExerciseSelector()}

                    <View style={styles.infoContainer}>
                        <Text style={styles.infoTitle}>Benefits of Focus Training</Text>
                        <View style={styles.infoBenefit}>
                            <Ionicons className="brain" size={20} color="#e74c3c" />
                            <Text style={styles.infoBenefitText}>
                                Improves attention span and concentration
                            </Text>
                        </View>
                        <View style={styles.infoBenefit}>
                            <Ionicons name="fitness" size={20} color="#e74c3c" />
                            <Text style={styles.infoBenefitText}>
                                Reduces stress and anxiety
                            </Text>
                        </View>
                        <View style={styles.infoBenefit}>
                            <Ionicons name="flash" size={20} color="#e74c3c" />
                            <Text style={styles.infoBenefitText}>
                                Enhances cognitive performance
                            </Text>
                        </View>
                        <View style={styles.infoBenefit}>
                            <Ionicons name="happy" size={20} color="#e74c3c" />
                            <Text style={styles.infoBenefitText}>
                                Promotes emotional regulation
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Text style={styles.startButtonText}>Start Exercise</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <>
                    {selectedExercise.id === 'mindful-circle' && renderMindfulCircle()}
                    {selectedExercise.id === 'breath-count' && renderBreathCounter()}
                    {selectedExercise.id === 'pattern-match' && renderPatternMatch()}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#e74c3c',
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
    gameStats: {
        alignItems: 'flex-end',
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    scoreText: {
        fontSize: 14,
        color: '#ffffff',
    },
    selectorContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    exerciseCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedExercise: {
        borderColor: '#e74c3c',
        backgroundColor: '#fef5f4',
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    selectedExerciseText: {
        color: '#e74c3c',
    },
    exerciseDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exerciseTime: {
        fontSize: 14,
        color: '#7f8c8d',
        marginLeft: 4,
    },
    exerciseDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 8,
        lineHeight: 20,
    },
    exercisePoints: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    infoContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        margin: 20,
        marginTop: 0,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },
    infoBenefit: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoBenefitText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginLeft: 8,
        flex: 1,
    },
    startButton: {
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        padding: 16,
        margin: 20,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    gameContainer: {
        flex: 1,
        position: 'relative',
    },
    circle: {
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
    },
    circleButton: {
        width: '100%',
        height: '100%',
        borderRadius: CIRCLE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    feedbackText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    correctFeedback: {
        color: '#2ecc71',
    },
    incorrectFeedback: {
        color: '#e74c3c',
    },
    breathInstructions: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 16,
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    breathCircle: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -CIRCLE_SIZE,
        marginTop: -CIRCLE_SIZE,
        width: CIRCLE_SIZE * 2,
        height: CIRCLE_SIZE * 2,
        borderRadius: CIRCLE_SIZE,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
    },
    breathCountText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    breathTarget: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    breathTargetText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    patternInstructions: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 16,
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    patternCircle: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -CIRCLE_SIZE,
        marginTop: -CIRCLE_SIZE,
        width: CIRCLE_SIZE * 2,
        height: CIRCLE_SIZE * 2,
        borderRadius: CIRCLE_SIZE,
    },
    patternProgress: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    patternProgressText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    patternRoundText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
});
