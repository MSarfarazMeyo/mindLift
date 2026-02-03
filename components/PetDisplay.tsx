import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pet } from '@/types/pet';
import Colors from '@/constants/colors';

interface PetDisplayProps {
  pet: Pet;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ pet }) => {
  const getPetEmoji = () => {
    switch (pet.type) {
      case 'cat':
        return '🐱';
      case 'fox':
        return '🦊';
      case 'dragon':
        return '🐉';
      case 'robot':
        return '🤖';
      default:
        return '🐱';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.petContainer}>
        <Text style={styles.petEmoji}>{getPetEmoji()}</Text>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petLevel}>Level {pet.level}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBar}>
          <Text style={styles.statLabel}>XP</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(pet.xp / 100) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.statValue}>{pet.xp}/100</Text>
        </View>

        <View style={styles.statBar}>
          <Text style={styles.statLabel}>❤️</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                styles.healthFill,
                { width: `${pet.health}%` },
              ]}
            />
          </View>
          <Text style={styles.statValue}>{pet.health}%</Text>
        </View>

        <View style={styles.statBar}>
          <Text style={styles.statLabel}>😊</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                styles.happinessFill,
                { width: `${pet.happiness}%` },
              ]}
            />
          </View>
          <Text style={styles.statValue}>{pet.happiness}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  petEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  petLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.purple,
  },
  statsContainer: {
    width: '100%',
    gap: 12,
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 16,
    width: 24,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.purple,
    borderRadius: 4,
  },
  healthFill: {
    backgroundColor: Colors.light.green,
  },
  happinessFill: {
    backgroundColor: Colors.light.orange,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    width: 50,
    textAlign: 'right',
  },
});

export default PetDisplay;
