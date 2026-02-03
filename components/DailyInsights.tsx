import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

type DailyInsightsProps = {
  currentMood?: string;
  currentSleep?: string;
  currentActivities?: string[];
};

// DailyInsights component with typed props
const DailyInsights: React.FC<DailyInsightsProps> = ({
  currentMood,
  currentSleep,
  currentActivities = [],
}) => {
  return (
    <View style={dailyInsightsStyles.container}>
      <Text style={dailyInsightsStyles.dailyInsightsTitle}>Weekly Insights</Text>
      <View style={dailyInsightsStyles.wellnessContainer}>
        {/* Mood */}
        <View style={dailyInsightsStyles.insightItem}>
          <Ionicons
            name="happy-outline"
            size={20}
            color="red"
            style={dailyInsightsStyles.icon}
          />
          <View>
            <Text style={dailyInsightsStyles.insightLabel}>Mood</Text>
            <Text style={dailyInsightsStyles.insightValue}>
              {currentMood || 'Not logged'}
            </Text>
          </View>
        </View>

        {/* Sleep Quality */}
        <View style={dailyInsightsStyles.insightItem}>
          <MaterialCommunityIcons
            name="power-sleep"
            size={20}
            color="purple"
            style={dailyInsightsStyles.icon}
          />
          <View>
            <Text style={dailyInsightsStyles.insightLabel}>Sleep Quality</Text>
            <Text
              style={[
                dailyInsightsStyles.insightValue,
                currentSleep?.toLowerCase().includes('great') &&
                dailyInsightsStyles.positiveInsight,
                currentSleep?.toLowerCase().includes('poor') &&
                dailyInsightsStyles.negativeInsight,
              ]}
            >
              {currentSleep || 'Not logged'}
            </Text>
          </View>
        </View>

        {/* Activities */}
        <View style={dailyInsightsStyles.insightItem}>
          <FontAwesome
            name="heartbeat"
            size={20}
            color="green"
            style={dailyInsightsStyles.icon}
          />
          <View>
            <Text style={dailyInsightsStyles.insightLabel}>Activities</Text>
            <Text style={dailyInsightsStyles.insightValue}>
              {currentActivities && currentActivities.length > 0
                ? currentActivities.join(', ')
                : 'No activities logged'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DailyInsights;

// Styles for DailyInsights component
const dailyInsightsStyles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  dailyInsightsTitle: {
    fontSize: 20,
    color: '#2c3e50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  wellnessContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
    width: 20,
  },
  insightLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginRight: 10,
    flex: 1,
  },
  insightValue: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  positiveInsight: {
    color: '#27ae60',
  },
  negativeInsight: {
    color: '#e74c3c',
  },
});
