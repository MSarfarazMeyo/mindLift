import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

const TermsOfUseScreen = () => {

    const navigation = useNavigation();


    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Terms of Use</Text>
                    <Text style={styles.subtitle}>Please read carefully</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.effectiveDate}>Effective Date: 26 July, 2025</Text>

                <Text style={styles.introText}>
                    Welcome to <Text style={styles.bold}>MindLift</Text> — your personal companion for mental wellness and self-care. These Terms of Use ("Terms") govern your use of the MindLift mobile application ("App") and associated services provided by MindLift ("we," "us," or "our").
                </Text>

                <Text style={styles.introText}>
                    By using MindLift, you agree to these Terms. If you do not agree, please do not use the App.
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Eligibility</Text>
                    <Text style={styles.sectionText}>
                        You must be at least 13 years old (or the minimum age required in your country) to use MindLift. If you are under 18, you must have permission from a parent or legal guardian.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Not Medical Advice</Text>
                    <Text style={styles.sectionText}>
                        MindLift provides general mental wellness information, exercises, and mood tracking tools for educational and self-care purposes only. <Text style={styles.bold}>It does NOT provide professional medical or mental health advice, diagnosis, or treatment.</Text> Always consult with a qualified healthcare provider before making decisions about your mental health.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. User Accounts</Text>
                    <Text style={styles.bulletPoint}>• You are responsible for maintaining the confidentiality of your account credentials.</Text>
                    <Text style={styles.bulletPoint}>• You agree to provide accurate, current, and complete information.</Text>
                    <Text style={styles.bulletPoint}>• You must not share your account or impersonate another individual.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
                    <Text style={styles.sectionText}>You agree not to:</Text>
                    <Text style={styles.bulletPoint}>• Use the App for any unlawful or harmful purpose.</Text>
                    <Text style={styles.bulletPoint}>• Post or transmit any abusive, defamatory, or offensive content.</Text>
                    <Text style={styles.bulletPoint}>• Interfere with the operation or security of the App.</Text>
                    <Text style={styles.bulletPoint}>• Attempt to reverse-engineer or gain unauthorized access to our systems.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Content Ownership</Text>
                    <Text style={styles.sectionText}>
                        All content in the App, including graphics, logos, audio, video, and code, is owned by [Your Company Name] or licensed to us. You may use the App for personal, non-commercial purposes only.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. User-Generated Content</Text>
                    <Text style={styles.sectionText}>If you submit journal entries, mood data, or other content ("User Content"):</Text>
                    <Text style={styles.bulletPoint}>• You retain ownership of your content.</Text>
                    <Text style={styles.bulletPoint}>• You grant us a limited, non-exclusive license to use it solely to provide and improve the service.</Text>
                    <Text style={styles.bulletPoint}>• You are responsible for ensuring that your content does not violate any laws or rights of others.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Privacy</Text>
                    <Text style={styles.sectionText}>
                        Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your data.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
                    <Text style={styles.sectionText}>
                        The App may contain links or integrations with third-party services. We do not control and are not responsible for those services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Termination</Text>
                    <Text style={styles.sectionText}>
                        We reserve the right to suspend or terminate your account at our sole discretion, without notice, for violation of these Terms or harmful behavior.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>10. Disclaimers</Text>
                    <Text style={styles.bulletPoint}>• The App is provided <Text style={styles.bold}>"as is"</Text> without warranties of any kind.</Text>
                    <Text style={styles.bulletPoint}>• We do not guarantee that the App will be error-free or continuously available.</Text>
                    <Text style={styles.bulletPoint}>• We are not liable for any decisions you make based on content in the App.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
                    <Text style={styles.sectionText}>
                        To the fullest extent permitted by law, [Your Company Name] shall not be liable for any indirect, incidental, special, or consequential damages, or loss of data or profits, arising from your use of the App.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
                    <Text style={styles.sectionText}>
                        We may update these Terms from time to time. Continued use of the App after changes are posted constitutes your acceptance.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>13. Governing Law</Text>
                    <Text style={styles.sectionText}>
                        These Terms are governed by the laws of [Your Country/Province], without regard to conflict of laws principles.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>14. Contact Us</Text>
                    <Text style={styles.sectionText}>For questions or concerns about these Terms, please contact us at:</Text>
                    <Text style={styles.contactInfo}>
                        <Text style={styles.bold}>Email:</Text> MindLift6@gmail.com
                    </Text>
                    <Text style={styles.contactInfo}>
                        <Text style={styles.bold}>Phone:</Text> 902-789-0338
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 48,
    },
    backButton: {
        zIndex: 1,
        color: 'white',
    },
    header: {
        paddingVertical: 20,
        backgroundColor: '#3498db',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 16,
        color: '#ffffff',
        opacity: 0.8,
    },
    content: {
        padding: 20,
        marginBottom: 100
    },
    effectiveDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    introText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 8,
    },
    bulletPoint: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 4,
        paddingLeft: 8,
    },
    bold: {
        fontWeight: 'bold',
    },
    contactInfo: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 4,
        paddingLeft: 8,
    },
});

export default TermsOfUseScreen;