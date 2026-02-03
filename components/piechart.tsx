import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface QuestionResponses {
  [key: string]: string;
}

const DailyQuestionsPieChart = ({
  questionResponses,
}: {
  questionResponses: QuestionResponses;
}) => {
  const ratings = ['Poor', 'Fair', 'Neutral', 'Very Good', 'Excellent'];
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  const data = ratings
    .map((rating, index) => ({
      name: rating,
      population: Object.values(questionResponses).filter((r) => r === rating)
        .length,
      color: colors[index],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }))
    .filter((item) => item.population > 0);

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
        Weekly Questions Pie Chart
      </Text>
      {data.length > 0 ? (
        <PieChart
          data={data}
          width={350}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          hasLegend={true}
        />
      ) : (
        <Text style={{ marginTop: 20, color: 'gray' }}>No data available</Text>
      )}
    </View>
  );
};

export default DailyQuestionsPieChart;
