import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {

    const navigation = useNavigation();

    const [selectedPlan, setSelectedPlan] = useState('weekly');

    const plans = [
        {
            id: 'weekly',
            title: 'Weekly Plan',
            subtitle: 'MindLift 7 Days Access',
            price: '$6.99',
        },
        {
            id: 'monthly',
            title: 'Monthly Plan',
            subtitle: 'MindLift 30 Days Access',
            price: '$19.99',
        },
        {
            id: 'yearly',
            title: 'Yearly Plan',
            subtitle: 'MindLift 365 Days Access',
            price: '$99.99',
        }
    ];

    const handleContinue = () => {
        Alert.alert(
            'Coming Soon',
            'Subscription will be available once approved in Apple Developer account!',
            [{ text: 'OK' }]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Choose your plan</Text>
                    <Text style={styles.subtitle}>Start your journey to better mental health</Text>
                </View>
            </View>

            {/* Subscription Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={require('../../assets/images/subscriptionImage.jpeg')}
                    style={styles.subscriptionImage}
                    resizeMode="cover"
                />
            </View>

            {/* Plan Options */}
            <View style={styles.plansContainer}>
                {plans.map((plan) => (
                    <TouchableOpacity
                        key={plan.id}
                        style={[
                            styles.planCard,
                            selectedPlan === plan.id && styles.selectedPlanCard
                        ]}
                        onPress={() => setSelectedPlan(plan.id)}
                    >
                        <View style={styles.planContent}>
                            <View style={styles.radioContainer}>
                                <View style={[
                                    styles.radioButton,
                                    selectedPlan === plan.id && styles.selectedRadioButton
                                ]}>
                                    {selectedPlan === plan.id && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                            </View>

                            <View style={styles.planDetails}>
                                <Text style={styles.planTitle}>{plan.title}</Text>
                                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                            </View>

                            <Text style={styles.planPrice}>{plan.price}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 48,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        paddingRight: 44, // Compensate for back button width
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 24,
    },
    subscriptionImage: {
        width: width - 40,
        height: 240,
        borderRadius: 12,
        maxWidth: 350,
    },
    plansContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    planCard: {
        borderWidth: 2,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    selectedPlanCard: {
        borderColor: '#3498db',
        backgroundColor: '#f0f8ff',
    },
    planContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioContainer: {
        marginRight: 16,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedRadioButton: {
        borderColor: '#3498db',
        backgroundColor: '#3498db',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    planDetails: {
        flex: 1,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    planSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    planPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default SubscriptionScreen;