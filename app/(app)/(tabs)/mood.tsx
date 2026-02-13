import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
  VictoryLabel,
} from 'victory-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useStore } from '../../../lib/store';
import { format, subDays } from 'date-fns';
import { VictoryPie } from 'victory-native';
import Svg, { Line, Text as SvgText, Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

interface MoodData {
  emoji: string;
  label: string;
  color: string;
}

type MoodEmojis = {
  [key: number]: MoodData;
};

const moodEmojis: MoodEmojis = {
  5: { emoji: '😊', label: 'Great', color: '#2ecc71' },
  4: { emoji: '🙂', label: 'Good', color: '#3498db' },
  3: { emoji: '😐', label: 'Okay', color: '#f1c40f' },
  2: { emoji: '😕', label: 'Down', color: '#e67e22' },
  1: { emoji: '😢', label: 'Sad', color: '#e74c3c' },
};

interface Section {
  x: string;
  y: number;
  color: string;
}

const sections: Section[] = Object.entries(moodEmojis).map(([value, mood]) => ({
  x: mood.label,
  y: parseInt(value),
  color: mood.color,
}));

interface MoodMeterChartProps {
  averageMood: number;
  renderMoodLegend: () => JSX.Element;
  moodEmojis: MoodEmojis;
}

const MoodMeterChart = ({
  averageMood,
  renderMoodLegend,
  moodEmojis,
}: MoodMeterChartProps) => {
  // Only show the meter if we have data
  if (averageMood === 0) {
    return (
      <View
        style={[styles.chartContainer, { alignItems: 'center', padding: 20 }]}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Weekly Mood Meter
        </Text>
        <Text>No mood data available for this week</Text>
      </View>
    );
  }
  const getNeedleAngle = (averageMood: number) => {
    // Map mood values to specific angles
    const moodAngles: Record<number, number> = {
      1: 360, // Sad
      2: 340, // Down
      3: 310, // Okay
      4: 260, // Good
      5: 200, // Great
    };

    // If exactly on a whole number, use that angle
    if (Number.isInteger(averageMood) && moodAngles[averageMood]) {
      return moodAngles[averageMood];
    }

    // For intermediate values, interpolate between the nearest moods
    const lowerMood = Math.floor(averageMood);
    const upperMood = Math.ceil(averageMood);

    if (moodAngles[lowerMood] && moodAngles[upperMood]) {
      const progress = averageMood - lowerMood;
      return (
        moodAngles[lowerMood] +
        progress * (moodAngles[upperMood] - moodAngles[lowerMood])
      );
    }

    return 270;
  };

  const radius = 100;
  const innerRadius = 50;
  const centerX = (screenWidth - 40) / 2;
  const centerY = 100;
  const angle = getNeedleAngle(averageMood);
  const needleLength = 50;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  const closestMood = Math.round(averageMood);
  const displayEmoji = moodEmojis[closestMood]?.emoji || '❔';

  return (
    <View
      style={[styles.chartContainer, { alignItems: 'center', padding: 20 }]}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Weekly Mood Meter
      </Text>
      <View style={{ position: 'relative' }}>
        <Svg width={screenWidth - 40} height={150}>
          <VictoryPie
            standalone={false}
            width={screenWidth - 40}
            height={200}
            data={sections}
            innerRadius={innerRadius}
            radius={radius}
            labels={() => ''}
            colorScale={sections.map((s) => s.color)}
            startAngle={90}
            endAngle={-90}
          />
          <Line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="black"
            strokeWidth={3}
          />
          <Circle cx={centerX} cy={centerY} r={5} fill="black" />
        </Svg>
        <Text
          style={{
            position: 'absolute',
            left: needleX - 10,
            top: needleY - 10,
            fontSize: 20,
            color: 'black',
          }}
        >
          {displayEmoji}
        </Text>
      </View>
      {renderMoodLegend()}
    </View>
  );
};

interface MoodEntry {
  date: string;
  mood: number;
  note: string;
}

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodEntry | null>(null);
  const [bounceValue] = useState(new Animated.Value(1));
  const moodEntries = useStore((state) => state.moodEntries);
  const addMoodEntry = useStore((state) => state.addMoodEntry);
  const stats = useStore((state) => state.getMoodStats());

  console.warn('stats', stats);

  const generateWeeklyData = () => {
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const emojis: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = moodEntries.find((e) => e.date === dateStr);

      labels.push(format(date, 'EEE'));
      const moodValue = entry?.mood || 0;
      data.push(moodValue);

      if (moodValue > 0) {
        const mood = moodEmojis[moodValue];
        colors.push(mood.color);
        emojis.push(mood.emoji);
      } else {
        colors.push('#bdc3c7');
        emojis.push('❔');
      }
    }

    return { labels, data, colors, emojis };
  };

  const weeklyData = generateWeeklyData();

  const moodValues = weeklyData.data.filter((value) => value > 0);
  const averageMood =
    moodValues.length > 0
      ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length
      : 0;

  const generateMarkedDates = () => {
    const marked: any = {};
    moodEntries.forEach((entry) => {
      const mood = moodEmojis[entry.mood];
      marked[entry.date] = {
        customStyles: {
          container: {
            backgroundColor: mood.color,
            borderRadius: 20,
          },
          text: {
            color: 'white',
            fontWeight: 'bold',
          },
        },
        marked: true,
        selected: entry.date === selectedDate,
      };
    });
    return marked;
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const entry = moodEntries.find((e) => e.date === day.dateString);
    setSelectedMood(entry || null);

    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceValue, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMoodSelection = async (mood: number, label: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingEntry = moodEntries.find((entry) => entry.date === today);

    if (existingEntry) {
      Alert.alert(
        'Already Logged',
        'You have already logged your mood for today.',
      );
      return;
    }

    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceValue, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    addMoodEntry({
      date: today,
      mood,
      note: label,
    });

    Alert.alert('Success', 'Your mood has been recorded for today!');
  };

  const renderMoodSummary = () => {
    if (!selectedMood) return null;
    const mood = moodEmojis[selectedMood.mood];

    return (
      <Animated.View
        style={[styles.moodSummary, { transform: [{ scale: bounceValue }] }]}
      >
        <Text style={styles.moodDate}>
          {format(new Date(selectedMood.date), 'MMMM d, yyyy')}
        </Text>
        <Text style={[styles.moodEmoji, { color: mood.color }]}>
          {mood.emoji}
        </Text>
        <Text style={styles.moodLabel}>{mood.label}</Text>
      </Animated.View>
    );
  };

  const renderMoodLegend = () => (
    <View style={styles.moodLegend}>
      {Object.entries(moodEmojis)
        .reverse()
        .map(([value, mood]) => (
          <View key={value} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{mood.emoji}</Text>
            <Text style={styles.legendText}>{mood.label}</Text>
          </View>
        ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mood Tracker</Text>
        <Text style={styles.subtitle}>Monitor your emotional well-being</Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weekly Mood Trends</Text>
        <View style={styles.chartWrapper}>
          <VictoryChart
            width={screenWidth - 40}
            height={220}
            theme={VictoryTheme.material}
            domainPadding={{ x: 10 }}
          >
            <VictoryAxis
              tickFormat={(t) => weeklyData.labels[t]}
              style={{
                tickLabels: { fontSize: 12, padding: 5 },
              }}
            />
            <VictoryAxis
              dependentAxis
              domain={[0, 5]}
              tickValues={[1, 2, 3, 4, 5]}
              style={{
                tickLabels: { fontSize: 12, padding: 5 },
              }}
            />
            <VictoryLine
              style={{
                data: { stroke: '#3498db' },
              }}
              data={weeklyData.data.map((y, i) => ({ x: i, y }))}
            />
            <VictoryScatter
              style={{
                data: { fill: '#3498db' },
              }}
              size={6}
              data={weeklyData.data.map((y, i) => ({ x: i, y }))}
              labels={({ datum }) => weeklyData.emojis[datum.x]}
              labelComponent={<VictoryLabel dy={-20} />}
            />
          </VictoryChart>
        </View>
        {renderMoodLegend()}
      </View>
      <View>
        <MoodMeterChart
          averageMood={averageMood}
          renderMoodLegend={renderMoodLegend}
          moodEmojis={moodEmojis}
        />
      </View>
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Mood Calendar</Text>
        <Calendar
          markedDates={generateMarkedDates()}
          onDayPress={handleDayPress}
          theme={{
            todayTextColor: '#3498db',
            selectedDayBackgroundColor: '#3498db',
            arrowColor: '#3498db',
            monthTextColor: '#2c3e50',
            textDayFontWeight: '600',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
          enableSwipeMonths
          markingType="custom"
        />
        {renderMoodSummary()}
      </View>

      <View style={styles.moodSelector}>
        <Text style={styles.sectionTitle}>How are you feeling today?</Text>
        <View style={styles.moodButtons}>
          {Object.entries(moodEmojis)
            .reverse()
            .map(([value, mood]) => (
              <TouchableOpacity
                key={value}
                style={[styles.moodButton, { borderColor: mood.color }]}
                onPress={() => handleMoodSelection(parseInt(value), mood.label)}
              >
                <Text style={styles.moodButtonEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodButtonText, { color: mood.color }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.positivePercentage.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Positive Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgMood.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#3498db',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartWrapper: {
    marginHorizontal: -20,
  },
  moodLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  calendarContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodSummary: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  moodDate: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  moodSelector: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  moodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
  },
  moodButtonEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  moodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
});
