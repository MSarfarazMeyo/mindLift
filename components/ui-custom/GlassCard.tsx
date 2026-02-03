import React, { ReactNode, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

type GlassCardProps = {
  children: ReactNode;
  style?: object;
};

export const GlassCard = ({ children, style }: GlassCardProps) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.glass, isPressed && styles.shadow, style]}
    >
      <View>{children}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  shadow: {
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
