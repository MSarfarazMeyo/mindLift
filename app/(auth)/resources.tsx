import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const resources = [
  {
    title: "Crisis Hotlines",
    items: [
      {
        name: "National Suicide Prevention Lifeline",
        description: "24/7 support for people in distress",
        contact: "1-800-273-8255",
        icon: "call",
      },
      {
        name: "Crisis Text Line",
        description: "Text HOME to connect with a Crisis Counselor",
        contact: "741741",
        icon: "chatbubble-ellipses",
      },
    ],
  },
  {
    title: "Mental Health Resources",
    items: [
      {
        name: "NAMI HelpLine",
        description: "Information, resource referrals and support",
        contact: "1-800-950-6264",
        icon: "information-circle",
      },
      {
        name: "SAMHSA's National Helpline",
        description: "Treatment referral and information service",
        contact: "1-800-662-4357",
        icon: "medkit",
      },
    ],
  },
  {
    title: "Addiction Support",
    items: [
      {
        name: "Alcoholics Anonymous",
        description: "Find local AA meetings and support",
        website: "https://www.aa.org",
        icon: "people",
      },
      {
        name: "Narcotics Anonymous",
        description: "Support for drug addiction recovery",
        website: "https://www.na.org",
        icon: "heart",
      },
    ],
  },
];

const articles = [
  {
    title: "Understanding Anxiety",
    description: "Learn about the symptoms and management of anxiety disorders",
    url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
  },
  {
    title: "Depression: More Than Just Feeling Sad",
    description: "Comprehensive guide to depression and treatment options",
    url: "https://www.nimh.nih.gov/health/topics/depression",
  },
  {
    title: "Building Healthy Habits",
    description: "Tips for developing positive mental health habits",
    url: "https://www.mentalhealth.gov/basics/what-is-mental-health",
  },
];

export default function ResourcesScreen() {

  const navigation = useNavigation();


  const handleContact = (contact: string) => {
    Linking.openURL(`tel:${contact}`);
  };

  const handleWebsite = (url: string) => {
    Linking.openURL(url);
  };

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

          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Help is always available</Text>
        </View>


      </View>

      <View style={styles.content}>
        {resources.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item: any, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.resourceCard}
                onPress={() => item.contact ? handleContact(item.contact) : handleWebsite(item.website!)}
              >
                <View style={styles.resourceIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#3498db" />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{item.name}</Text>
                  <Text style={styles.resourceDescription}>{item.description}</Text>
                  <Text style={styles.resourceContact}>
                    {item.contact || item.website}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Helpful Articles</Text>
          {articles.map((article, index) => (
            <TouchableOpacity
              key={index}
              style={styles.articleCard}
              onPress={() => handleWebsite(article.url)}
            >
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDescription}>{article.description}</Text>
              <Text style={styles.readMore}>Read More →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({


  containerMain: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 30,
    padding: 20,
  },

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 48

  },

  backButton: {
    zIndex: 1,
    color: 'white'
  },

  header: {
    paddingVertical: 20,
    backgroundColor: '#3498db',
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  resourceContact: {
    fontSize: 14,
    color: '#3498db',
  },
  articleCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  readMore: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
});