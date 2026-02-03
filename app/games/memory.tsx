import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

const EMOJIS = ['😊', '😢', '😡', '😴', '🤔', '😎', '🥳', '😌'];
const CARDS = [...EMOJIS, ...EMOJIS]; // Duplicate for pairs

// Point system constants
const MEMORY_GAME_POINTS = {
  BASE_POINTS: 100,
  PERFECT_MOVES_BONUS: 50,
  TIME_BONUS_MAX: 100,
  MOVE_PENALTY: -5,
  MATCH_POINTS: 10,
};

export default function MemoryGameScreen() {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const addPoints = useStore((state) => state.addPoints);

  const shuffleCards = () => {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped(new Array(CARDS.length).fill(false));
    setMatched(new Array(CARDS.length).fill(false));
    setMoves(0);
    setCurrentScore(0);
    setGameStarted(true);
    setStartTime(new Date());
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  const handleCardPress = (index: number) => {
    if (!gameStarted || flipped[index] || matched[index]) return;

    const newFlipped = [...flipped];
    newFlipped[index] = true;
    setFlipped(newFlipped);

    const flippedCards = newFlipped.reduce(
      (acc, curr, idx) => (curr && !matched[idx] ? [...acc, idx] : acc),
      [] as number[],
    );

    if (flippedCards.length === 2) {
      setMoves((m) => m + 1);

      if (cards[flippedCards[0]] === cards[flippedCards[1]]) {
        const newMatched = [...matched];
        newMatched[flippedCards[0]] = true;
        newMatched[flippedCards[1]] = true;
        setMatched(newMatched);

        // Award points for match
        setCurrentScore((score) => score + MEMORY_GAME_POINTS.MATCH_POINTS);

        if (newMatched.every((m) => m)) {
          const endTime = new Date();
          const timeTaken = startTime
            ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
            : 0;

          // Calculate final score
          const perfectMoves = CARDS.length / 2; // Minimum possible moves
          const moveBonus =
            moves <= perfectMoves ? MEMORY_GAME_POINTS.PERFECT_MOVES_BONUS : 0;
          const timeBonus = Math.max(
            0,
            Math.floor(
              MEMORY_GAME_POINTS.TIME_BONUS_MAX * (1 - timeTaken / 120),
            ),
          );
          const movePenalty =
            Math.max(0, moves - perfectMoves) * MEMORY_GAME_POINTS.MOVE_PENALTY;
          const totalPoints =
            MEMORY_GAME_POINTS.BASE_POINTS +
            currentScore +
            moveBonus +
            timeBonus +
            movePenalty;

          addPoints(totalPoints);
          Alert.alert(
            'Congratulations! 🎉',
            `Game completed!\n\nPoints Breakdown:\n` +
              `Base Points: ${MEMORY_GAME_POINTS.BASE_POINTS}\n` +
              `Match Points: ${currentScore}\n` +
              `Perfect Moves Bonus: ${moveBonus}\n` +
              `Time Bonus: ${timeBonus}\n` +
              `Move Penalty: ${movePenalty}\n\n` +
              `Total Points: ${totalPoints}\n\n` +
              `Completed in ${moves} moves and ${timeTaken} seconds!`,
            [
              {
                text: 'Play Again',
                onPress: shuffleCards,
              },
              {
                text: 'Back to Games',
                onPress: () => router.back(),
              },
            ],
          );
          setGameStarted(false);
        }
      } else {
        setTimeout(() => {
          const resetFlipped = [...newFlipped];
          resetFlipped[flippedCards[0]] = false;
          resetFlipped[flippedCards[1]] = false;
          setFlipped(resetFlipped);
        }, 1000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Mindful Memory</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>Score: {currentScore}</Text>
          <Text style={styles.moves}>Moves: {moves}</Text>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Match pairs of emotion emojis to train your memory and emotional
          recognition.
        </Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              (flipped[index] || matched[index]) && styles.cardFlipped,
              matched[index] && styles.cardMatched,
            ]}
            onPress={() => handleCardPress(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardText}>
              {flipped[index] || matched[index] ? card : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.newGameButton} onPress={shuffleCards}>
        <Text style={styles.newGameButtonText}>New Game</Text>
      </TouchableOpacity>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <View style={styles.benefitRow}>
          <Ionicons className="brain" size={20} color="#3498db" />
          <Text style={styles.benefitText}>
            Improves memory and concentration
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="happy" size={20} color="#3498db" />
          <Text style={styles.benefitText}>Enhances emotional recognition</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="fitness" size={20} color="#3498db" />
          <Text style={styles.benefitText}>
            Reduces stress through mindful focus
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#3498db',
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
  scoreContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  score: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moves: {
    color: '#ffffff',
    fontSize: 14,
  },
  instructionsContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'center',
  },
  card: {
    width: (Dimensions.get('window').width - 60) / 4,
    height: (Dimensions.get('window').width - 60) / 4,
    margin: 5,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: '#3498db',
  },
  cardMatched: {
    backgroundColor: '#2ecc71',
  },
  cardText: {
    fontSize: 24,
  },
  newGameButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  benefitsContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10,
  },
});
