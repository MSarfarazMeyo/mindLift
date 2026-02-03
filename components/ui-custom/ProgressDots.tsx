import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

type ProgressDotsProps = {
  totalSteps: number;
  currentStep: number;
  style?: any;
};

export const ProgressDots = ({
  totalSteps,
  currentStep,
  style = {},
}: ProgressDotsProps) => {
  const animatedValues = Array.from({ length: totalSteps }).map(
    () => new Animated.Value(0),
  );

  React.useEffect(() => {
    animatedValues.forEach((value, index) => {
      Animated.timing(value, {
        toValue: index < currentStep ? 1 : index === currentStep ? 1.1 : 0.75,
        duration: 300,
        delay: 100 + index * 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  }, [currentStep]);

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              transform: [{ scale: animatedValues[index] }],
              backgroundColor:
                index < currentStep
                  ? '#6C63FF' // mindwell-lavender
                  : index === currentStep
                    ? '#6C63FF' // mindwell-lavender
                    : '#D3D3D3', // mindwell-lavenderLight/30
              shadowColor: '#6C63FF', // mindwell-lavender
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: index === currentStep ? 0.2 : 0,
              shadowRadius: 2,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
